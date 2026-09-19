"use client";

import { useEffect, useRef, useState } from "react";
import { GameTable } from "@/components/game-table";
import { TitleScreen } from "@/components/title-screen";
import { aiDelayMs, BOTS } from "@/lib/bots";
import {
  advanceAfterResolve,
  beginRound,
  createMatch,
  playBot,
  playHuman,
  resolveRound,
  selectCard,
  timeoutHuman,
  toggleAccuse,
  spendHint,
  youPlayer,
} from "@/lib/engine";
import {
  localCatalog,
  readLocalScores,
  storeLabelFor,
  writeLocalScore,
} from "@/lib/store";
import { useTableVoice } from "@/components/use-table-voice";
import type { GameState, ScoreRow } from "@/lib/types";

export function GameApp() {
  const snapshot = localCatalog();
  const [state, setState] = useState<GameState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const saved = useRef(false);
  const storeLabel = storeLabelFor(snapshot);
  useTableVoice(state);

  useEffect(() => {
    const id = window.setTimeout(() => setScores(readLocalScores()), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      setState((current) => {
        if (!current) return current;
        if (
          current.phase === "prompting" &&
          current.deadlineAt > 0 &&
          time >= current.deadlineAt
        ) {
          return timeoutHuman(current);
        }
        if (
          current.phase === "accusing" &&
          current.accuseDeadlineAt > 0 &&
          time >= current.accuseDeadlineAt
        ) {
          return resolveRound(current);
        }
        return current;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (state?.phase !== "dealing") return;
    const id = window.setTimeout(() => {
      setState((current) =>
        current && current.phase === "dealing" ? beginRound(current) : current,
      );
    }, 700);
    return () => window.clearTimeout(id);
  }, [state?.phase, state?.round]);

  useEffect(() => {
    if (state?.phase !== "prompting") return;
    const timers: number[] = [];
    for (const bot of BOTS) {
      const player = state.players.find((item) => item.id === bot.id);
      if (!player || player.eliminated || player.played) continue;
      const delay = aiDelayMs(bot, state.round);
      timers.push(
        window.setTimeout(() => {
          setState((current) => (current ? playBot(current, bot.id) : current));
        }, delay),
      );
    }
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
    // Players are snapshotted at the start of the prompting phase so later
    // plays do not reset the remaining bots' clocks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase, state?.round]);

  useEffect(() => {
    if (state?.phase !== "resolving") return;
    const ms = state.lastAnswerCorrect ? 5600 : 10000;
    const id = window.setTimeout(() => {
      setState((current) =>
        current && current.phase === "resolving"
          ? advanceAfterResolve(current)
          : current,
      );
    }, ms);
    return () => window.clearTimeout(id);
  }, [state?.phase, state?.round, state?.lastAnswerCorrect]);

  useEffect(() => {
    if (state?.phase !== "gameover" || saved.current) return;
    saved.current = true;
    const you = youPlayer(state);
    const row: ScoreRow = {
      id: crypto.randomUUID(),
      name: state.playerName,
      won: state.winnerId === "you",
      rounds: state.round,
      health: you.health,
      score: state.score,
      correctCalls: state.correctCalls,
      falseCalls: state.falseCalls,
      at: new Date().toISOString(),
    };
    const id = window.setTimeout(() => {
      setScores(writeLocalScore(row));
    }, 0);
    void fetch("/api/scores", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(row),
    });
    return () => window.clearTimeout(id);
  }, [state]);

  if (!state) {
    return (
      <TitleScreen
        storeLabel={storeLabel}
        scores={scores}
        onStart={(name) => {
          saved.current = false;
          setState(createMatch(name, storeLabel));
        }}
      />
    );
  }

  return (
    <GameTable
      state={state}
      now={now}
      onSelect={(cardId) =>
        setState((current) => {
          if (!current) return current;
          if (current.selectedCardId === cardId) return playHuman(current, cardId);
          return selectCard(current, cardId);
        })
      }
      onPlay={() =>
        setState((current) =>
          current && current.selectedCardId
            ? playHuman(current, current.selectedCardId)
            : current,
        )
      }
      onAccuse={(botId) =>
        setState((current) => (current ? toggleAccuse(current, botId) : current))
      }
      onResolveNow={() =>
        setState((current) =>
          current && current.phase === "accusing" ? resolveRound(current) : current,
        )
      }
      onNext={() =>
        setState((current) =>
          current ? advanceAfterResolve(current) : current,
        )
      }
      onQuit={() => setState(null)}
      onHint={() =>
        setState((current) => (current ? spendHint(current) : current))
      }
    />
  );
}

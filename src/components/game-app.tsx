"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameTable } from "@/components/game-table";
import { TitleScreen } from "@/components/title-screen";
import { aiDelayMs, BOTS } from "@/lib/bots";
import {
  advanceAfterResolve,
  beginRound,
  closeHint,
  createMatch,
  playBot,
  playHuman,
  resolveRound,
  selectCard,
  shiftOpenClocks,
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
  clearLocalScores,
} from "@/lib/store";
import { useTableVoice } from "@/components/use-table-voice";
import type { GameState, ScoreRow } from "@/lib/types";

export function GameApp() {
  const snapshot = localCatalog();
  const [state, setState] = useState<GameState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [clockFreeze, setClockFreeze] = useState<number | null>(null);
  const saved = useRef(false);
  const helpOpenRef = useRef(false);
  const hintOpenRef = useRef(false);
  const clockFreezeRef = useRef<number | null>(null);
  const storeLabel = storeLabelFor(snapshot);
  const stopVoice = useTableVoice(state);

  helpOpenRef.current = helpOpen;
  hintOpenRef.current = Boolean(state?.hintOpen);
  if ((helpOpen || state?.hintOpen) && clockFreeze != null) {
    clockFreezeRef.current = clockFreeze;
  }

  const helpBlocksTable = () => helpOpenRef.current;

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
  }, []);

  const openHelp = useCallback(() => {
    if (helpOpenRef.current) return;
    setHelpOpen(true);
  }, []);

  const leaveTable = useCallback(() => {
    stopVoice();
    clockFreezeRef.current = null;
    helpOpenRef.current = false;
    hintOpenRef.current = false;
    setClockFreeze(null);
    setHelpOpen(false);
    setState(null);
  }, [stopVoice]);

  useEffect(() => {
    const overlay = helpOpen || Boolean(state?.hintOpen);
    if (overlay) {
      if (clockFreezeRef.current == null) {
        const frozen = Date.now();
        clockFreezeRef.current = frozen;
        setClockFreeze(frozen);
        setNow(frozen);
      }
      return;
    }
    const frozen = clockFreezeRef.current;
    if (frozen == null) return;
    clockFreezeRef.current = null;
    setClockFreeze(null);
    const deltaMs = Math.max(0, Date.now() - frozen);
    if (deltaMs > 0) {
      setState((current) =>
        current ? shiftOpenClocks(current, deltaMs) : current,
      );
    }
    setNow(Date.now());
  }, [helpOpen, state?.hintOpen]);

  useEffect(() => {
    const id = window.setTimeout(() => setScores(readLocalScores()), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (helpOpenRef.current || hintOpenRef.current || clockFreezeRef.current != null) return;
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
    let left = 700;
    let last = Date.now();
    const id = window.setInterval(() => {
      const t = Date.now();
      const dt = t - last;
      last = t;
      if (helpOpenRef.current || hintOpenRef.current || clockFreezeRef.current != null) return;
      left -= dt;
      if (left <= 0) {
        window.clearInterval(id);
        setState((current) =>
          current && current.phase === "dealing" ? beginRound(current) : current,
        );
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [state?.phase, state?.round]);

  useEffect(() => {
    if (state?.phase !== "prompting") return;
    const remaining = new Map<string, number>();
    for (const bot of BOTS) {
      const player = state.players.find((item) => item.id === bot.id);
      if (!player || player.eliminated || player.played) continue;
      remaining.set(bot.id, aiDelayMs(bot, state.round));
    }
    let last = Date.now();
    const id = window.setInterval(() => {
      const t = Date.now();
      const wall = t - last;
      last = t;
      if (helpOpenRef.current || hintOpenRef.current || clockFreezeRef.current != null) return;
      for (const [botId, left] of [...remaining]) {
        const next = left - wall;
        if (next <= 0) {
          remaining.delete(botId);
          setState((current) => (current ? playBot(current, botId) : current));
        } else {
          remaining.set(botId, next);
        }
      }
    }, 80);
    return () => window.clearInterval(id);
    // Players are snapshotted at the start of the prompting phase so later
    // plays do not reset the remaining bots' clocks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase, state?.round]);

  useEffect(() => {
    if (state?.phase !== "resolving") return;
    let left = state.lastAnswerCorrect ? 5600 : 10000;
    let last = Date.now();
    const id = window.setInterval(() => {
      const t = Date.now();
      const dt = t - last;
      last = t;
      if (helpOpenRef.current || hintOpenRef.current || clockFreezeRef.current != null) return;
      left -= dt;
      if (left <= 0) {
        window.clearInterval(id);
        setState((current) =>
          current && current.phase === "resolving"
            ? advanceAfterResolve(current)
            : current,
        );
      }
    }, 80);
    return () => window.clearInterval(id);
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
        onResetScores={() => {
          setScores(clearLocalScores());
          void fetch("/api/scores", { method: "DELETE" });
        }}
        onStart={(name) => {
          saved.current = false;
          helpOpenRef.current = false;
          hintOpenRef.current = false;
          clockFreezeRef.current = null;
          setClockFreeze(null);
          setHelpOpen(false);
          setState(createMatch(name, storeLabel));
        }}
      />
    );
  }

  return (
    <GameTable
      state={state}
      now={clockFreeze ?? now}
      helpOpen={helpOpen}
      onSelect={(cardId) => {
        if (helpBlocksTable()) return;
        setState((current) => {
          if (!current) return current;
          if (current.selectedCardId === cardId) return playHuman(current, cardId);
          return selectCard(current, cardId);
        });
      }}
      onPlay={() => {
        if (helpBlocksTable()) return;
        setState((current) =>
          current && current.selectedCardId
            ? playHuman(current, current.selectedCardId)
            : current,
        );
      }}
      onAccuse={(botId) => {
        if (helpBlocksTable()) return;
        setState((current) => (current ? toggleAccuse(current, botId) : current));
      }}
      onResolveNow={() => {
        if (helpBlocksTable()) return;
        setState((current) =>
          current && current.phase === "accusing" ? resolveRound(current) : current,
        );
      }}
      onNext={() => {
        if (helpBlocksTable()) return;
        setState((current) =>
          current ? advanceAfterResolve(current) : current,
        );
      }}
      onQuit={leaveTable}
      onHint={() => {
        if (helpBlocksTable()) return;
        setState((current) => (current ? spendHint(current) : current));
      }}
      onCloseHint={() =>
        setState((current) => (current ? closeHint(current) : current))
      }
      onOpenHelp={openHelp}
      onCloseHelp={closeHelp}
    />
  );
}

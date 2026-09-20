"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  eliminationAnnouncements,
  heartLossCount,
  loseLine,
  questionLine,
  winLine,
} from "@/lib/announce";
import { displayedHint } from "@/lib/engine";
import { playHeartBreak } from "@/lib/sfx";
import type { GameState } from "@/lib/types";

type Job = { kind: "speak"; text: string } | { kind: "heart" };

function speakBrowser(text: string, session: { current: number }, mine: number) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    if (session.current !== mine) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    const done = () => resolve();
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  });
}

export function useTableVoice(state: GameState | null) {
  const prev = useRef<GameState | null>(null);
  const queue = useRef<Job[]>([]);
  const pumping = useRef(false);
  const session = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioDoneRef = useRef<(() => void) | null>(null);

  const stopVoice = useCallback(() => {
    session.current += 1;
    queue.current = [];
    pumping.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    }
    audioDoneRef.current?.();
    audioDoneRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const speakGrokOrBrowser = useCallback(
    async (text: string, mine: number) => {
      if (session.current !== mine) return;
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await fetch("/api/voice", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });
        if (session.current !== mine) return;
        if (response.status === 204 || !response.ok) {
          await speakBrowser(text, session, mine);
          return;
        }
        const blob = await response.blob();
        if (session.current !== mine) return;
        if (!blob.size) {
          await speakBrowser(text, session, mine);
          return;
        }
        const url = URL.createObjectURL(blob);
        await new Promise<void>((resolve) => {
          if (session.current !== mine) {
            URL.revokeObjectURL(url);
            resolve();
            return;
          }
          const audio = new Audio(url);
          audioRef.current = audio;
          const done = () => {
            if (audioDoneRef.current === done) audioDoneRef.current = null;
            if (audioRef.current === audio) audioRef.current = null;
            URL.revokeObjectURL(url);
            resolve();
          };
          audioDoneRef.current = done;
          audio.onended = done;
          audio.onerror = done;
          void audio.play().catch(done);
        });
      } catch (error) {
        if (controller.signal.aborted || session.current !== mine) return;
        const aborted =
          error instanceof DOMException && error.name === "AbortError";
        if (aborted) return;
        await speakBrowser(text, session, mine);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  useEffect(() => {
    const pump = async () => {
      if (pumping.current) return;
      pumping.current = true;
      const mine = session.current;
      while (session.current === mine && queue.current.length > 0) {
        const job = queue.current.shift();
        if (!job) break;
        if (job.kind === "heart") {
          playHeartBreak();
          await new Promise((resolve) => window.setTimeout(resolve, 220));
          continue;
        }
        await speakGrokOrBrowser(job.text, mine);
      }
      if (session.current === mine) pumping.current = false;
    };

    const enqueue = (job: Job) => {
      queue.current.push(job);
      void pump();
    };

    if (!state) {
      prev.current = null;
      stopVoice();
      return;
    }

    const before = prev.current;
    prev.current = state;

    if (
      state.phase === "prompting" &&
      state.prompt &&
      before?.prompt?.id !== state.prompt.id
    ) {
      enqueue({ kind: "speak", text: questionLine(state.prompt.text) });
    }

    if (
      state.hintOpen &&
      state.prompt &&
      (!before?.hintOpen || before.hintLevel !== state.hintLevel)
    ) {
      const text = displayedHint(state).trim();
      if (text) {
        abortRef.current?.abort();
        abortRef.current = null;
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
          audioRef.current = null;
        }
        audioDoneRef.current?.();
        audioDoneRef.current = null;
        if (typeof window !== "undefined") window.speechSynthesis?.cancel();
        queue.current = queue.current.filter((job) => job.kind !== "speak");
        enqueue({ kind: "speak", text });
      }
    }

    if (before) {
      const cracks = heartLossCount(before.players, state.players);
      for (let i = 0; i < cracks; i += 1) {
        enqueue({ kind: "heart" });
      }
      for (const line of eliminationAnnouncements(before.players, state.players)) {
        enqueue({ kind: "speak", text: line });
      }
    }

    if (state.phase === "gameover" && before?.phase !== "gameover") {
      enqueue({
        kind: "speak",
        text: state.winnerId === "you" ? winLine() : loseLine(),
      });
    }
  }, [state, speakGrokOrBrowser, stopVoice]);

  return stopVoice;
}

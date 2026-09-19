"use client";

import { useEffect, useRef } from "react";
import {
  eliminationAnnouncements,
  heartLossCount,
  loseLine,
  questionLine,
  winLine,
} from "@/lib/announce";
import { playHeartBreak } from "@/lib/sfx";
import type { GameState } from "@/lib/types";

type Job =
  | { kind: "speak"; text: string }
  | { kind: "heart" };

function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

async function speakGrokOrBrowser(text: string): Promise<void> {
  try {
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (response.status === 204 || !response.ok) {
      await speakBrowser(text);
      return;
    }
    const blob = await response.blob();
    if (!blob.size) {
      await speakBrowser(text);
      return;
    }
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      const done = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      void audio.play().catch(done);
    });
  } catch {
    await speakBrowser(text);
  }
}

export function useTableVoice(state: GameState | null) {
  const prev = useRef<GameState | null>(null);
  const queue = useRef<Job[]>([]);
  const pumping = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      queue.current = [];
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const pump = async () => {
      if (pumping.current) return;
      pumping.current = true;
      while (alive.current && queue.current.length > 0) {
        const job = queue.current.shift();
        if (!job) break;
        if (job.kind === "heart") {
          playHeartBreak();
          await new Promise((resolve) => window.setTimeout(resolve, 220));
          continue;
        }
        await speakGrokOrBrowser(job.text);
      }
      pumping.current = false;
    };

    const enqueue = (job: Job) => {
      queue.current.push(job);
      void pump();
    };

    if (!state) {
      prev.current = null;
      queue.current = [];
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
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
  }, [state]);
}

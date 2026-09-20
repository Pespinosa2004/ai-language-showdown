import type { BotDef } from "@/lib/types";

export const BOTS: BotDef[] = [
  {
    id: "clippy",
    name: "Clippy",
    title: "Helpful Hallucinator",
    blurb: "I see you are trying to encode. Have you considered 42? I am very sure.",
    specialty: "ascii",
    accuracy: 0.34,
    notice: 0.52,
    panic: 0.15,
    speed: 0.78,
    offByOne: 0.12,
    accent: "#f5c16c",
  },
  {
    id: "hexa",
    name: "Hexa",
    title: "Base-16 Oracle",
    blurb: "Everything looks cleaner after you stop counting on your fingers.",
    specialty: "hex",
    accuracy: 0.74,
    notice: 0.64,
    panic: 0.22,
    speed: 0.5,
    offByOne: 0.08,
    accent: "#7dd3c0",
  },
  {
    id: "bitwise",
    name: "Bitwise",
    title: "Shift-Left Savant",
    blurb: "Shift it left until it works. If it doesn't, you were off by one.",
    specialty: "binary",
    accuracy: 0.7,
    notice: 0.72,
    panic: 0.18,
    speed: 0.88,
    offByOne: 0.32,
    accent: "#9bb8ff",
  },
  {
    id: "ascii8",
    name: "ASCII-8",
    title: "Character Witness",
    blurb: "Letters are numbers. Numbers are letters. I refuse to pick a side.",
    specialty: "ascii",
    accuracy: 0.62,
    notice: 0.48,
    panic: 0.3,
    speed: 0.46,
    offByOne: 0.1,
    accent: "#e8a0c8",
  },
  {
    id: "nullptr",
    name: "NullPtr",
    title: "Cautious Compiler",
    blurb: "If I am wrong I segfault. I would prefer not to be wrong.",
    specialty: "binary",
    accuracy: 0.9,
    notice: 0.84,
    panic: 0.72,
    speed: 0.28,
    offByOne: 0.04,
    accent: "#d4d4d8",
  },
];

export const MAX_HEALTH = 3;
export const HAND_SIZE = 7;
export const HINTS_PER_ROUND = 2;
/** @deprecated use HINTS_PER_ROUND — two lamps each round */
export const HINTS_PER_SESSION = HINTS_PER_ROUND;
export const TIMER_BY_DIFFICULTY = {
  easy: 60_000,
  medium: 90_000,
  hard: 135_000,
} as const;
export const BASE_TIMER_MS = TIMER_BY_DIFFICULTY.medium;
export const MIN_TIMER_MS = TIMER_BY_DIFFICULTY.easy;
export const TIMER_STEP_MS = 0;
export const BASE_ACCUSE_MS = 8_000;
export const MIN_ACCUSE_MS = 4_000;

export function roundTimerMs(
  round: number,
  difficulty: "easy" | "medium" | "hard" = "medium",
): number {
  void round;
  return TIMER_BY_DIFFICULTY[difficulty] ?? TIMER_BY_DIFFICULTY.medium;
}

export function roundAccuseMs(round: number): number {
  return Math.max(MIN_ACCUSE_MS, BASE_ACCUSE_MS - (round - 1) * 700);
}

export function aiDelayMs(bot: BotDef, round: number): number {
  const haste = Math.pow(0.82, round - 1);
  const spread = 400 + (1 - bot.speed) * 4200;
  const jitter = Math.random() * 700;
  return Math.max(420, (900 + spread + jitter) * haste);
}

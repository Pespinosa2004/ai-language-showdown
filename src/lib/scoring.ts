import type { Difficulty, ScoreRow } from "@/lib/types";

export const BASE_POINTS: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

export function speedMultiplier(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  if (seconds <= 15) return 2;
  if (seconds <= 30) return 1.5;
  if (seconds <= 60) return 1.25;
  return 1;
}

export function basePoints(difficulty: Difficulty): number {
  return BASE_POINTS[difficulty] ?? BASE_POINTS.medium;
}

export function roundScore(
  difficulty: Difficulty,
  elapsedMs: number,
  correct: boolean,
): number {
  if (!correct) return 0;
  return Math.round(basePoints(difficulty) * speedMultiplier(elapsedMs));
}

export function multiplierLabel(elapsedMs: number): string {
  const mult = speedMultiplier(elapsedMs);
  if (mult === 2) return "×2.0";
  if (mult === 1.5) return "×1.5";
  if (mult === 1.25) return "×1.25";
  return "×1.0";
}

/** Wins rank above falls, then higher points, lives, rounds, and calls. */
export function rankScoreRows(rows: ScoreRow[]): ScoreRow[] {
  return [...rows].sort((left, right) => {
    if (left.won !== right.won) return left.won ? -1 : 1;
    const score = (right.score ?? 0) - (left.score ?? 0);
    if (score !== 0) return score;
    const health = (right.health ?? 0) - (left.health ?? 0);
    if (health !== 0) return health;
    const rounds = (right.rounds ?? 0) - (left.rounds ?? 0);
    if (rounds !== 0) return rounds;
    const calls = (right.correctCalls ?? 0) - (left.correctCalls ?? 0);
    if (calls !== 0) return calls;
    return String(right.at ?? "").localeCompare(String(left.at ?? ""));
  });
}

import { CARDS, catalogStats, PROMPTS } from "@/lib/catalog";
import { rankScoreRows } from "@/lib/scoring";
import type { CardDef, PromptDef, ScoreRow } from "@/lib/types";

const SCORE_KEY = "last-bit-standing-scores";

export type CatalogSnapshot = {
  cards: CardDef[];
  prompts: PromptDef[];
  stats: ReturnType<typeof catalogStats>;
  source: "spacetimedb" | "local-seed";
  host: string | null;
};

export function spacetimeConfig() {
  const host =
    process.env.NEXT_PUBLIC_SPACETIMEDB_HOST ??
    process.env.SPACETIMEDB_HOST ??
    "";
  const dbName =
    process.env.NEXT_PUBLIC_SPACETIMEDB_DB_NAME ??
    process.env.SPACETIMEDB_DB_NAME ??
    "last-bit-standing";
  return {
    host: host.replace(/\/$/, ""),
    dbName,
    enabled: host.length > 0,
  };
}

export function localCatalog(): CatalogSnapshot {
  const cfg = spacetimeConfig();
  return {
    cards: CARDS,
    prompts: PROMPTS,
    stats: catalogStats(),
    source: cfg.enabled ? "spacetimedb" : "local-seed",
    host: cfg.enabled ? cfg.host : null,
  };
}

export function readLocalScores(): ScoreRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SCORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreRow[];
    return rankScoreRows(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

export function writeLocalScore(row: ScoreRow): ScoreRow[] {
  const next = rankScoreRows([row, ...readLocalScores()]).slice(0, 50);
  window.localStorage.setItem(SCORE_KEY, JSON.stringify(next));
  return next;
}

export function clearLocalScores(): ScoreRow[] {
  if (typeof window === "undefined") return [];
  window.localStorage.removeItem(SCORE_KEY);
  return [];
}

export function storeLabelFor(snapshot: CatalogSnapshot): string {
  if (snapshot.source === "spacetimedb" && snapshot.host) {
    return `SpacetimeDB · ${snapshot.host}`;
  }
  return "Local Spacetime seed";
}

import { rankScoreRows } from "@/lib/scoring";
import type { ScoreRow } from "@/lib/types";

const scores: ScoreRow[] = [];

function board() {
  return rankScoreRows(scores).slice(0, 50);
}

export async function GET() {
  return Response.json({
    scores: board(),
    persisted: "ephemeral-instance",
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as ScoreRow;
  if (!body?.name || typeof body.won !== "boolean") {
    return Response.json({ error: "Invalid score" }, { status: 400 });
  }
  const row: ScoreRow = {
    id: body.id || crypto.randomUUID(),
    name: String(body.name).slice(0, 32),
    won: Boolean(body.won),
    rounds: Number(body.rounds) || 1,
    health: Number(body.health) || 0,
    score: Number(body.score) || 0,
    correctCalls: Number(body.correctCalls) || 0,
    falseCalls: Number(body.falseCalls) || 0,
    at: body.at || new Date().toISOString(),
  };
  scores.push(row);
  if (scores.length > 80) {
    scores.splice(0, scores.length, ...board().slice(0, 50));
  }
  return Response.json({ ok: true, scores: board() });
}

export async function DELETE() {
  scores.length = 0;
  return Response.json({ ok: true, scores: [] });
}

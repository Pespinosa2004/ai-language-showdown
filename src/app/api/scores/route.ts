import type { ScoreRow } from "@/lib/types";

const scores: ScoreRow[] = [];

export async function GET() {
  return Response.json({
    scores: scores.slice(0, 20),
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
    correctCalls: Number(body.correctCalls) || 0,
    falseCalls: Number(body.falseCalls) || 0,
    at: body.at || new Date().toISOString(),
  };
  scores.unshift(row);
  if (scores.length > 50) scores.pop();
  return Response.json({ ok: true, scores: scores.slice(0, 20) });
}

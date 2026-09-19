import { NextResponse } from "next/server";

const MAX_CHARS = 1500;

export async function POST(request: Request) {
  let body: { text?: unknown };
  try {
    body = (await request.json()) as { text?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const key = process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
  if (!key) {
    return new NextResponse(null, { status: 204 });
  }

  const voiceId = process.env.XAI_VOICE_ID || "eve";
  const response = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text.slice(0, MAX_CHARS),
      voice_id: voiceId,
      language: "en",
      text_normalization: true,
      replace: {
        "ASCII 8": "ASCII eight",
        ASCII: "ASCII",
        Hexa: "Hexa",
        Bitwise: "Bitwise",
        Clippy: "Clippy",
        "Null pointer": "null pointer",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json(
      { error: "grok tts failed", detail: detail.slice(0, 240) },
      { status: 502 },
    );
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}

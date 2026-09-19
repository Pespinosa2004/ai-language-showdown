"use client";

import { useMemo, useState } from "react";
import { Binary, BookOpen, ShieldAlert, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EncodingCard } from "@/components/encoding-card";
import { CARDS } from "@/lib/catalog";
import { BOTS } from "@/lib/bots";
import type { ScoreRow } from "@/lib/types";

export function TitleScreen({
  storeLabel,
  scores,
  onStart,
}: {
  storeLabel: string;
  scores: ScoreRow[];
  onStart: (name: string) => void;
}) {
  const [name, setName] = useState("Operator");
  const samples = useMemo(() => {
    const wanted = ["binary-50", "hex-8", "ascii-65", "binary-255"];
    return wanted
      .map((id) => CARDS.find((card) => card.id === id))
      .filter(Boolean);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:py-14">
      <header className="space-y-4 text-center sm:text-left">
        <p className="font-mono text-xs tracking-[0.28em] text-amber-200/80">
          HUMAN VS FIVE LANGUAGE MODELS
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
          Last Bit Standing
        </h1>
        <p className="max-w-2xl text-pretty text-base leading-7 text-zinc-300 sm:text-lg">
          Six players. Seven encoding cards. Each round a prompt hits the table
          and you answer with binary, hex, or ASCII. The bots get faster. Call
          their hallucinations, or they will call yours. Last player with
          health wins.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
        {samples.map((card) =>
          card ? (
            <EncodingCard key={card.id} card={card} />
          ) : null,
        )}
      </div>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-2">
          <span className="text-sm text-zinc-400">Operator name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            placeholder="Operator"
            className="h-10 bg-black/30"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => onStart(name)}>
            Sit at the table
          </Button>
          <HowToPlay />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {BOTS.map((bot) => (
          <article
            key={bot.id}
            className="rounded-xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: bot.accent }}
              />
              <h2 className="font-medium text-zinc-100">{bot.name}</h2>
              <span className="text-xs text-zinc-500">{bot.title}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{bot.blurb}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
          <Trophy className="size-4 text-amber-300" />
          Recent tables
        </div>
        {scores.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No scores yet. Survive a table and your result lands here.
          </p>
        ) : (
          <ul className="grid gap-2">
            {scores.slice(0, 6).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-zinc-400"
              >
                <span className="text-zinc-200">{row.name}</span>
                <span>{row.won ? "won" : "fell"}</span>
                <span>round {row.rounds}</span>
                <span>{row.correctCalls} calls</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-mono text-[11px] text-zinc-600">
          Card store: {storeLabel}
        </p>
      </section>
    </div>
  );
}

function HowToPlay() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">
          How to play
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rules of the table</DialogTitle>
          <DialogDescription>
            Decode the prompt. Play a card. Accuse the models that are making it
            up.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-3 text-sm text-zinc-300">
          <li className="flex gap-2">
            <Binary className="mt-0.5 size-4 shrink-0 text-amber-300" />
            Each living player is dealt 7 cards. The glyph on top is binary,
            hex, or ASCII. The flavor text hints at the value without spelling
            it out.
          </li>
          <li className="flex gap-2">
            <BookOpen className="mt-0.5 size-4 shrink-0 text-amber-300" />
            Play the card whose hidden value answers the prompt. Some cards are
            closer than others — a nibble is not a byte.
          </li>
          <li className="flex gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
            After the plays, tap any AI card you think is a hallucination. A
            correct call costs them a heart. A false call costs you one. If you
            are wrong and an AI notices, you lose a heart.
          </li>
          <li>
            Everyone starts with 3 health. Each round the bots answer faster and
            your timer shrinks. Last player standing wins.
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}

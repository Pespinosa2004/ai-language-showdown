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
import { EncodingPrimer } from "@/components/encoding-primer";
import { CARDS } from "@/lib/catalog";
import { BOTS } from "@/lib/bots";
import type { ScoreRow } from "@/lib/types";

export function TitleScreen({
  storeLabel,
  scores,
  onStart,
  onResetScores,
}: {
  storeLabel: string;
  scores: ScoreRow[];
  onStart: (name: string) => void;
  onResetScores: () => void;
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
          and you answer with binary, hex, or ASCII. The clock is a score
          multiplier, not a life drain. Call a wrong bot to take a life. Two
          correct calls in a row restore one of yours. Play the wrong card, or
          call a right bot, and you lose one. You win with at least one life
          after every bot is out.
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
          <Button size="lg" variant="outline" asChild>
            <a href="#encoding-bench">Encoding bench</a>
          </Button>
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Trophy className="size-4 text-amber-300" />
            Leaderboard
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={scores.length === 0}
            onClick={() => {
              if (scores.length === 0) return;
              if (!window.confirm("Clear every row on this leaderboard?")) return;
              onResetScores();
            }}
          >
            Reset board
          </Button>
        </div>
        {scores.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No scores yet. A win ranks above every fall, then higher points take
            the top.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-fixed border-collapse font-mono text-xs">
              <colgroup>
                <col className="w-10" />
                <col className="w-36" />
                <col className="w-14" />
                <col className="w-14" />
                <col className="w-16" />
                <col className="w-14" />
              </colgroup>
              <thead>
                <tr className="text-[10px] tracking-wide text-zinc-600">
                  <th className="py-1 pr-2 text-left font-medium">#</th>
                  <th className="py-1 pr-3 text-left font-medium">Name</th>
                  <th className="py-1 pr-3 text-left font-medium">Result</th>
                  <th className="py-1 pr-3 text-right font-medium">Pts</th>
                  <th className="py-1 pr-3 text-right font-medium">Round</th>
                  <th className="py-1 text-right font-medium">Calls</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {scores.slice(0, 10).map((row, index) => (
                  <tr key={row.id}>
                    <td className="py-1 pr-2 tabular-nums text-zinc-500">
                      {index + 1}
                    </td>
                    <td
                      className="truncate py-1 pr-3 text-zinc-200"
                      title={row.name}
                    >
                      {row.name}
                    </td>
                    <td
                      className={`py-1 pr-3 ${
                        row.won ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {row.won ? "won" : "fell"}
                    </td>
                    <td className="py-1 pr-3 text-right tabular-nums">
                      {row.score ?? 0}
                    </td>
                    <td className="py-1 pr-3 text-right tabular-nums">
                      {row.rounds}
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {row.correctCalls}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 font-mono text-[11px] text-zinc-600">
          Wins sit above falls. Then points, remaining lives, and rounds.
          Card store: {storeLabel}
        </p>
      </section>

      <EncodingPrimer />
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
            Each living player is dealt 7 cards. Yours always include the bank
            answer plus six distractors, then shuffled. The glyph on top is
            binary, hex, or ASCII. Easy rounds print a direct translation on
            the card foot. Medium keeps the flavor line. Hard hides it.
          </li>
          <li className="flex gap-2">
            <BookOpen className="mt-0.5 size-4 shrink-0 text-amber-300" />
            Play the card that answers the prompt. Easy = 5, medium = 10, hard =
            15. The timer is still on the felt: ≤15s ×2, ≤30s ×1.5, ≤60s ×1.25,
            slower ×1. Hard prompts get a longer clock. A wrong card shows the
            matching card from your hand on the right, with a one-line why
            underneath. Three lamps for the whole table — they do not refill.
            Extra lamps on the same question get more direct; the third is the
            answer. You still pick any card. The clock pauses while a hint is
            open.
          </li>
          <li className="flex gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
            After the plays, tap any bot whose answer is wrong. That bot loses 1
            of 3 lives. Two correct calls in a row restore 1 of your lives, up
            to 3. Tap a bot who was right, or play the wrong card yourself, and
            you lose a life. Lives carry into the next round. A bot at 0 stays
            on the felt, darkened, with their last play showing.
          </li>
          <li>
            Everyone starts with 3 lives. You win if you still have at least 1
            life and every bot has lost all 3. The clock no longer costs a life
            — it only changes how many points a correct card is worth.
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}

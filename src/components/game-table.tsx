"use client";

import { Lightbulb } from "lucide-react";
import { BOTS, HINTS_PER_SESSION, roundAccuseMs, roundTimerMs } from "@/lib/bots";
import { EncodingCard } from "@/components/encoding-card";
import { HealthPips, PlayerSeat } from "@/components/player-seat";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { matchQuality, youPlayer } from "@/lib/engine";
import { explainFromCard } from "@/lib/questions";
import { basePoints, multiplierLabel, speedMultiplier } from "@/lib/scoring";
import type { GameState } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GameTable({
  state,
  now,
  onSelect,
  onPlay,
  onAccuse,
  onResolveNow,
  onNext,
  onQuit,
  onHint,
}: {
  state: GameState;
  now: number;
  onSelect: (cardId: string) => void;
  onPlay: () => void;
  onAccuse: (botId: string) => void;
  onResolveNow: () => void;
  onNext: () => void;
  onQuit: () => void;
  onHint: () => void;
}) {
  const you = youPlayer(state);
  const byId = Object.fromEntries(state.players.map((player) => [player.id, player]));
  const difficulty = state.prompt?.difficulty ?? "medium";
  const total =
    state.phase === "accusing"
      ? roundAccuseMs(state.round)
      : roundTimerMs(state.round, difficulty);
  const remain =
    state.phase === "accusing"
      ? Math.max(0, state.accuseDeadlineAt - now)
      : Math.max(0, state.deadlineAt - now);
  const ratio = total > 0 ? Math.min(1, remain / total) : 0;
  const prompt = state.prompt;
  const canPlay = state.phase === "prompting" && !you.played && Boolean(state.selectedCardId);
  const canAccuse = state.phase === "accusing";
  const elapsed =
    you.played && state.answeredAt
      ? Math.max(0, state.answeredAt - state.promptStartedAt)
      : Math.max(0, now - (state.promptStartedAt || now));
  const liveMultiplier = multiplierLabel(elapsed);
  const liveSpeed = speedMultiplier(elapsed);
  const revealing = state.phase === "resolving" || state.phase === "gameover";
  const hintsLeft = state.hintsRemaining ?? 0;
  const canHint =
    (state.phase === "prompting" || state.phase === "accusing") &&
    (hintsLeft > 0 || state.hintOpen);

  return (
    <div className="relative flex min-h-screen flex-col">
      {state.phase === "gameover" ? (
        <ArcadeBanner win={state.winnerId === "you"} />
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.24em] text-amber-200/70">
            LAST BIT STANDING
          </p>
          <p className="text-sm text-zinc-300">
            Round {state.round}
            {state.phase === "accusing" ? " · call lives" : ""}
            {state.phase === "resolving" ? " · reveal" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 font-mono text-amber-200",
                  !canHint && "opacity-40",
                )}
                disabled={!canHint}
                onClick={onHint}
                aria-label={`Hint, ${hintsLeft} left this session`}
              >
                <Lightbulb
                  className={cn(
                    "size-4",
                    state.hintOpen
                      ? "fill-amber-300 text-amber-300"
                      : "text-amber-200",
                  )}
                />
                <span className="text-[11px] tracking-[0.16em]">
                  {hintsLeft}/{HINTS_PER_SESSION}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hintsLeft > 0 || state.hintOpen
                ? "Spend a hint. Three lamps per table."
                : "No lamps left this table."}
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-sm text-amber-200">
            Score {state.score}
            {state.lastRoundPoints > 0 && state.phase !== "prompting"
              ? ` · +${state.lastRoundPoints}`
              : ""}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Your lives</span>
            <HealthPips health={you.health} />
          </div>
          <Button variant="ghost" size="sm" onClick={onQuit}>
            Leave table
          </Button>
        </div>
      </header>

      {state.hintOpen && prompt ? (
        <div className="border-b border-amber-200/20 bg-amber-950/40 px-4 py-2 text-sm text-amber-100">
          <span className="mr-2 font-mono text-[10px] tracking-[0.2em] text-amber-200/80">
            HINT
          </span>
          {prompt.hint}
        </div>
      ) : null}

      <div className="h-1 w-full bg-black/40">
        <div
          className={cn(
            "h-full transition-[width] duration-100",
            ratio < 0.2 ? "bg-rose-400" : liveSpeed >= 2 ? "bg-amber-300" : "bg-amber-400/80",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className="grid gap-4 px-3 py-4 lg:grid-cols-[1fr_220px] lg:px-6">
        <div className="rounded-[2rem] border border-emerald-900/50 bg-[radial-gradient(ellipse_at_center,_#1c4a38_0%,_#10261d_55%,_#0b1511_100%)] p-3 shadow-inner sm:p-6">
          <div className="grid grid-cols-3 justify-items-center gap-2 overflow-x-auto sm:gap-3">
            <PlayerSeat
              player={byId.hexa}
              bot={BOTS.find((bot) => bot.id === "hexa")}
              accused={state.accusedIds.includes("hexa")}
              stamp={stampFor(state, "hexa")}
              canAccuse={canAccuse && !byId.hexa?.eliminated}
              difficulty={prompt?.difficulty}
              onAccuse={() => onAccuse("hexa")}
            />
            <PlayerSeat
              player={byId.clippy}
              bot={BOTS.find((bot) => bot.id === "clippy")}
              accused={state.accusedIds.includes("clippy")}
              stamp={stampFor(state, "clippy")}
              canAccuse={canAccuse && !byId.clippy?.eliminated}
              difficulty={prompt?.difficulty}
              onAccuse={() => onAccuse("clippy")}
            />
            <PlayerSeat
              player={byId.bitwise}
              bot={BOTS.find((bot) => bot.id === "bitwise")}
              accused={state.accusedIds.includes("bitwise")}
              stamp={stampFor(state, "bitwise")}
              canAccuse={canAccuse && !byId.bitwise?.eliminated}
              difficulty={prompt?.difficulty}
              onAccuse={() => onAccuse("bitwise")}
            />
          </div>

          <div className="mx-auto my-4 max-w-xl rounded-2xl border border-amber-200/20 bg-black/35 p-4 text-center backdrop-blur-sm">
            <p className="font-mono text-[10px] tracking-[0.22em] text-amber-200/70">
              {state.phase === "dealing"
                ? "SHUFFLING"
                : prompt
                  ? `${(prompt.difficulty ?? "medium").toUpperCase()} · ${basePoints(prompt.difficulty ?? "medium")} PTS`
                  : "PROMPT"}
            </p>
            <p className="mt-2 text-pretty text-lg font-medium text-zinc-50 sm:text-2xl">
              {prompt?.text ?? "The dealer is cutting the deck…"}
            </p>
            {state.phase === "prompting" || state.phase === "accusing" ? (
              <p className="mt-2 font-mono text-sm text-amber-100">
                {Math.ceil(remain / 1000)}s
                {state.phase === "prompting" ? ` · ${liveMultiplier}` : ""}
              </p>
            ) : null}
            {you.played ? (
              <PlayReveal
                state={state}
                revealing={revealing}
                onContinue={
                  state.phase === "resolving" && !state.lastAnswerCorrect
                    ? onNext
                    : undefined
                }
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 justify-items-center gap-2 overflow-x-auto sm:grid-cols-3 sm:gap-3">
            <PlayerSeat
              player={byId.ascii8}
              bot={BOTS.find((bot) => bot.id === "ascii8")}
              accused={state.accusedIds.includes("ascii8")}
              stamp={stampFor(state, "ascii8")}
              canAccuse={canAccuse && !byId.ascii8?.eliminated}
              difficulty={prompt?.difficulty}
              onAccuse={() => onAccuse("ascii8")}
            />
            <div className="hidden sm:block" />
            <PlayerSeat
              player={byId.nullptr}
              bot={BOTS.find((bot) => bot.id === "nullptr")}
              accused={state.accusedIds.includes("nullptr")}
              stamp={stampFor(state, "nullptr")}
              canAccuse={canAccuse && !byId.nullptr?.eliminated}
              difficulty={prompt?.difficulty}
              onAccuse={() => onAccuse("nullptr")}
            />
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs tracking-wide text-zinc-400">Table log</p>
            <ul className="mt-2 grid max-h-56 gap-2 overflow-auto pr-1 text-sm">
              {state.logs.slice(-8).map((entry) => (
                <li
                  key={entry.id}
                  className={cn(
                    "leading-5",
                    entry.tone === "good" && "text-emerald-300",
                    entry.tone === "bad" && "text-rose-300",
                    entry.tone === "warn" && "text-amber-200",
                    entry.tone === "neutral" && "text-zinc-400",
                  )}
                >
                  {entry.text}
                </li>
              ))}
            </ul>
          </div>
          {state.phase === "accusing" ? (
            <Button onClick={onResolveNow}>Lock accusations</Button>
          ) : null}
          {state.phase === "resolving" ? (
            <Button onClick={onNext}>Next round</Button>
          ) : null}
          {state.phase === "gameover" ? (
            <div className="rounded-xl border border-amber-200/30 bg-black/50 p-4">
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber-200">
                TABLE CLOSED
              </p>
              <p className="mt-2 text-lg text-zinc-50">
                {state.winnerId === "you"
                  ? "You still have a life. Every bot is out."
                  : "You lost your last life. The models still hold the table."}
              </p>
              <p className="mt-1 font-mono text-amber-200">Score {state.score}</p>
              <Button className="mt-3" onClick={onQuit}>
                {state.winnerId === "you" ? "Take the win" : "Try another table"}
              </Button>
            </div>
          ) : null}
        </aside>
      </div>

      <section className="mt-auto border-t border-white/10 bg-black/30 px-3 py-4 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-zinc-300">
            Your hand · {you.hand.length} cards
          </p>
          <Button size="lg" disabled={!canPlay} onClick={onPlay}>
            Play selected card
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {you.hand.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {you.played
                ? "Card is on the table. Call a wrong bot to take a life."
                : "No cards left in hand."}
            </p>
          ) : (
            you.hand.map((card) => (
              <EncodingCard
                key={card.id}
                card={card}
                selected={state.selectedCardId === card.id}
                disabled={state.phase !== "prompting" || Boolean(you.played)}
                difficulty={prompt?.difficulty}
                onClick={
                  state.phase === "prompting" && !you.played
                    ? () => onSelect(card.id)
                    : undefined
                }
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ArcadeBanner({ win }: { win: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-40 flex justify-center px-4">
      <p
        className={cn(
          "lbs-arcade rounded-sm border-2 bg-black/80 px-6 py-2 font-mono text-3xl font-black tracking-[0.28em] sm:text-5xl",
          win
            ? "border-amber-300 text-amber-300 shadow-[0_0_28px_rgba(252,211,77,0.35)]"
            : "border-rose-400 text-rose-400 shadow-[0_0_28px_rgba(251,113,133,0.35)]",
        )}
      >
        {win ? "YOU WIN" : "YOU LOSE"}
      </p>
    </div>
  );
}

function PlayReveal({
  state,
  revealing,
  onContinue,
}: {
  state: GameState;
  revealing: boolean;
  onContinue?: () => void;
}) {
  const you = youPlayer(state);
  const played = you.played;
  if (!played) return null;
  const prompt = state.prompt;
  const correctCard = state.correctCard;
  const showAnswerCard =
    revealing && !state.lastAnswerCorrect && correctCard && correctCard.id !== played.id;
  const explanation =
    revealing && !state.lastAnswerCorrect && prompt && correctCard
      ? explainFromCard(prompt, correctCard)
      : null;

  return (
    <div
      className={cn(
        "mt-4",
        revealing && state.lastAnswerCorrect && "lbs-glow rounded-2xl p-2",
        revealing && !state.lastAnswerCorrect && "lbs-shake",
      )}
    >
      <div className="flex flex-wrap items-end justify-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-400">
            YOUR PLAY
          </p>
          <EncodingCard
            card={played}
            compact
            selected
            difficulty={prompt?.difficulty}
            stamped={revealing ? stampFor(state, "you") : null}
          />
        </div>
        {showAnswerCard ? (
          <div className="flex flex-col items-center gap-1">
            <p className="font-mono text-[10px] tracking-[0.18em] text-emerald-300/80">
              FROM YOUR HAND
            </p>
            <EncodingCard
              card={correctCard}
              compact
              stamped="exact"
              difficulty={prompt?.difficulty}
            />
          </div>
        ) : null}
      </div>
      {explanation ? (
        <p className="mt-3 text-pretty text-sm leading-5 text-zinc-300">
          {explanation}
        </p>
      ) : null}
      {onContinue ? (
        <Button className="mt-3" size="sm" onClick={onContinue}>
          Continue
        </Button>
      ) : null}
    </div>
  );
}

function stampFor(state: GameState, id: string) {
  const player = state.players.find((item) => item.id === id);
  if (!player || player.eliminated) return null;
  if (state.phase !== "resolving" && state.phase !== "gameover") return null;
  if (!player.played || !state.prompt) return null;
  if (!state.prompt.matchGlyphs && !state.prompt.matchValues) return null;
  return matchQuality(player.played, state.prompt);
}

"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_HEALTH } from "@/lib/bots";
import { EncodingCard } from "@/components/encoding-card";
import type { BotDef, MatchQuality, PlayerState } from "@/lib/types";

export function HealthPips({ health, className }: { health: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${health} of ${MAX_HEALTH} lives`}>
      {Array.from({ length: MAX_HEALTH }).map((_, index) => (
        <Heart
          key={index}
          className={cn(
            "size-3.5",
            index < health ? "fill-rose-400 text-rose-400" : "text-zinc-600",
          )}
        />
      ))}
    </div>
  );
}

export function PlayerSeat({
  player,
  bot,
  stamp,
  accused,
  onAccuse,
  canAccuse,
}: {
  player: PlayerState;
  bot?: BotDef;
  stamp?: MatchQuality | "accused" | null;
  accused?: boolean;
  onAccuse?: () => void;
  canAccuse?: boolean;
}) {
  const shown = player.eliminated
    ? player.lastPlayed ?? player.played
    : player.played;
  const allowAccuse = Boolean(canAccuse && !player.eliminated && player.played);

  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div
        className={cn(
          "flex max-w-[220px] items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm",
          player.eliminated
            ? "border-white/5 bg-zinc-950/80"
            : "border-white/10 bg-black/35",
        )}
        style={
          player.eliminated
            ? undefined
            : { boxShadow: `0 0 0 1px ${bot?.accent ?? "#e7e5e4"}22` }
        }
      >
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            player.eliminated && "grayscale",
          )}
          style={{ background: bot?.accent ?? "#e7e5e4" }}
        />
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-medium leading-none",
              player.eliminated ? "text-zinc-500" : "text-zinc-100",
            )}
          >
            {player.name}
          </p>
          <p className="truncate text-[10px] text-zinc-500">
            {player.eliminated ? "Blocked" : (bot?.title ?? "Human operator")}
          </p>
        </div>
        <HealthPips health={player.health} />
      </div>
      {shown ? (
        <div className="relative">
          <div className={cn(player.eliminated && "brightness-[0.42] saturate-50")}>
            <EncodingCard
              card={shown}
              compact
              stamped={player.eliminated ? null : accused ? "accused" : stamp}
              disabled={!allowAccuse}
              onClick={allowAccuse ? onAccuse : undefined}
            />
          </div>
          {player.eliminated ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between rounded-xl bg-zinc-950/55 ring-1 ring-white/10">
              <span className="mt-2 rounded border border-zinc-500/50 bg-black/40 px-2 py-0.5 font-mono text-[10px] tracking-[0.22em] text-zinc-300">
                OUT
              </span>
              <span className="mb-2 font-mono text-[9px] tracking-[0.16em] text-zinc-400">
                LAST PLAY
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-[168px] w-[118px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
          WAITING
        </div>
      )}
    </div>
  );
}

"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_HEALTH } from "@/lib/bots";
import { EncodingCard } from "@/components/encoding-card";
import type { MatchQuality, PlayerState } from "@/lib/types";
import type { BotDef } from "@/lib/types";

export function HealthPips({ health, className }: { health: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
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
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center gap-2",
        player.eliminated && "opacity-40 grayscale",
      )}
    >
      <div
        className="flex max-w-[220px] items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-sm"
        style={{ boxShadow: `0 0 0 1px ${bot?.accent ?? "#e7e5e4"}22` }}
      >
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: bot?.accent ?? "#e7e5e4" }}
        />
        <div className="min-w-0">
          <p className="truncate font-medium leading-none text-zinc-100">
            {player.name}
          </p>
          <p className="truncate text-[10px] text-zinc-400">
            {bot?.title ?? "Human operator"}
          </p>
        </div>
        <HealthPips health={player.health} />
      </div>
      {player.played ? (
        <EncodingCard
          card={player.played}
          compact
          stamped={accused ? "accused" : stamp}
          onClick={canAccuse ? onAccuse : undefined}
        />
      ) : (
        <div className="flex h-[168px] w-[118px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
          {player.eliminated ? "OUT" : "WAITING"}
        </div>
      )}
    </div>
  );
}

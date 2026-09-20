"use client";

import { cn } from "@/lib/utils";
import type { CardDef, Difficulty, MatchQuality } from "@/lib/types";
import { cardCaption } from "@/lib/card-text";

const encodingLabel = {
  binary: "BINARY",
  hex: "HEX",
  ascii: "ASCII",
} as const;

const rarityPips = {
  common: "•",
  uncommon: "••",
  rare: "★★",
};

export function EncodingCard({
  card,
  selected = false,
  disabled = false,
  stamped,
  compact = false,
  difficulty,
  onClick,
}: {
  card: CardDef;
  selected?: boolean;
  disabled?: boolean;
  stamped?: MatchQuality | "accused" | null;
  compact?: boolean;
  difficulty?: Difficulty | null;
  onClick?: () => void;
}) {
  const caption = cardCaption(card, difficulty);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden rounded-xl border text-left shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)] transition-all",
        compact
          ? "h-[132px] w-[90px] p-2 sm:h-[148px] sm:w-[102px] lg:h-[160px] lg:w-[110px]"
          : "h-[236px] w-[164px] p-3",
        (card.encoding ?? "binary") === "binary" &&
          "border-sky-400/30 bg-linear-to-b from-slate-800 to-slate-950",
        card.encoding === "hex" &&
          "border-teal-400/30 bg-linear-to-b from-teal-950 to-slate-950",
        card.encoding === "ascii" &&
          "border-fuchsia-400/30 bg-linear-to-b from-fuchsia-950 to-slate-950",
        selected &&
          !compact &&
          "z-10 border-amber-300 ring-2 ring-inset ring-amber-300",
        selected &&
          compact &&
          "border-amber-300 ring-2 ring-inset ring-amber-300",
        disabled && !selected && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.18em] text-amber-200/80">
        <span>{encodingLabel[card.encoding] ?? "CARD"}</span>
        <span className="text-amber-100/70">{rarityPips[card.rarity]}</span>
      </div>
      <div
        className={cn(
          "mt-2 font-mono leading-none text-amber-50",
          compact ? "text-lg" : "text-2xl",
          card.encoding === "ascii" && !compact && "text-5xl",
          card.encoding === "ascii" && compact && "text-3xl",
        )}
      >
        {card.glyph}
      </div>
      <div className="mt-auto">
        <p
          className={cn(
            "font-medium tracking-wide text-amber-100",
            compact ? "text-[11px]" : "text-sm",
          )}
        >
          {card.name}
        </p>
        {caption ? (
          <p
            className={cn(
              "mt-1 text-pretty text-amber-100/70",
              compact ? "line-clamp-3 text-[9px] leading-3" : "text-xs leading-4",
            )}
          >
            {caption}
          </p>
        ) : null}
      </div>
      {stamped ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 rotate-[-12deg] rounded border-2 py-1 text-center font-mono text-[11px] font-bold tracking-[0.2em]",
            stamped === "exact" && "border-emerald-300 text-emerald-200",
            stamped === "close" && "border-amber-300 text-amber-200",
            stamped === "miss" && "border-red-400 text-red-300",
            stamped === "accused" && "border-red-500 text-red-300",
          )}
        >
          {stamped === "exact"
            ? "MATCH"
            : stamped === "close"
              ? "CLOSE"
              : stamped === "accused"
                ? "CALLED"
                : "WRONG"}
        </div>
      ) : null}
    </button>
  );
}

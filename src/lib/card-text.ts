import type { CardDef, Difficulty } from "@/lib/types";

export function directTranslation(card: CardDef): string {
  const glyph = card.glyph.trim();
  if (card.encoding === "ascii") {
    if (glyph.length === 1) {
      return `${glyph} = ${card.value} / 0x${card.value.toString(16).toUpperCase()}`;
    }
    return `${glyph} = ${card.value}`;
  }
  if (card.encoding === "hex") {
    return `${glyph} = ${card.value}`;
  }
  return `${glyph} = ${card.value}`;
}

export function cardCaption(
  card: CardDef,
  difficulty?: Difficulty | null,
): string {
  if (difficulty === "hard") return "";
  if (difficulty === "easy") return directTranslation(card);
  return card.flavor;
}

import type { CardDef, Encoding, Rarity } from "./types";
import { PROMPTS } from "./questions";

type Lore = {
  name: string;
  flavor: string;
  rarity: Rarity;
};

const VALUE_LORE: Record<number, Lore> = {
  0: {
    name: "Empty Register",
    flavor: "The number 0.",
    rarity: "uncommon",
  },
  1: {
    name: "Single Lamp",
    flavor: "The number 1.",
    rarity: "common",
  },
  2: {
    name: "A Pair",
    flavor: "The number 2.",
    rarity: "common",
  },
  3: {
    name: "Primary Crowd",
    flavor: "The number 3.",
    rarity: "common",
  },
  4: {
    name: "Nibble Width",
    flavor: "The number 4.",
    rarity: "common",
  },
  7: {
    name: "Short Week",
    flavor: "The number 7. Days in a week.",
    rarity: "common",
  },
  8: {
    name: "Beige Letter",
    flavor: "The number 8.",
    rarity: "common",
  },
  10: {
    name: "Human Radix",
    flavor: "The number 10. Fingers on two hands.",
    rarity: "common",
  },
  12: {
    name: "Year Split",
    flavor: "The number 12. Months in a year.",
    rarity: "common",
  },
  13: {
    name: "Carriage Home",
    flavor: "The number 13.",
    rarity: "uncommon",
  },
  16: {
    name: "Hex Alphabet",
    flavor: "The number 16.",
    rarity: "common",
  },
  24: {
    name: "Full Clock",
    flavor: "The number 24. Hours in a day.",
    rarity: "common",
  },
  26: {
    name: "Latin Line",
    flavor: "The number 26. Letters from A to Z.",
    rarity: "common",
  },
  32: {
    name: "Soft Gap",
    flavor: "The number 32. Also a space between words.",
    rarity: "uncommon",
  },
  42: {
    name: "Deep Thought",
    flavor: "The number 42.",
    rarity: "rare",
  },
  48: {
    name: "Glyph None",
    flavor: "The number 48. Also the written character 0.",
    rarity: "uncommon",
  },
  50: {
    name: "Union Count",
    flavor: "The number 50. States in the United States.",
    rarity: "uncommon",
  },
  60: {
    name: "Minute Spine",
    flavor: "The number 60. Seconds in a minute.",
    rarity: "common",
  },
  64: {
    name: "Chessboard",
    flavor: "The number 64. Squares on a chessboard.",
    rarity: "uncommon",
  },
  65: {
    name: "First Capital",
    flavor: "The number 65. Capital letter A.",
    rarity: "uncommon",
  },
  90: {
    name: "Last Capital",
    flavor: "The number 90. Capital letter Z.",
    rarity: "uncommon",
  },
  97: {
    name: "Indoor Voice",
    flavor: "The number 97. Lowercase letter a.",
    rarity: "uncommon",
  },
  100: {
    name: "Tidy Century",
    flavor: "The number 100.",
    rarity: "common",
  },
  127: {
    name: "Last Signed",
    flavor: "The number 127.",
    rarity: "rare",
  },
  128: {
    name: "High Bit",
    flavor: "The number 128.",
    rarity: "uncommon",
  },
  200: {
    name: "Polite Knock",
    flavor: "The number 200. A web page loaded fine.",
    rarity: "uncommon",
  },
  255: {
    name: "All Lamps",
    flavor: "The number 255.",
    rarity: "rare",
  },
  256: {
    name: "Full Street",
    flavor: "The number 256.",
    rarity: "rare",
  },
  365: {
    name: "Earth Lap",
    flavor: "The number 365. Days in a year.",
    rarity: "uncommon",
  },
  404: {
    name: "Missing Hall",
    flavor: "The number 404. Page not found.",
    rarity: "rare",
  },
  1024: {
    name: "Real K",
    flavor: "The number 1024.",
    rarity: "rare",
  },
};

const ASCII_LORE: Record<number, Lore> = {
  0: {
    name: "NUL",
    flavor: "A hidden stop. You cannot see it.",
    rarity: "uncommon",
  },
  7: {
    name: "BEL",
    flavor: "An old bell sound. Not the number 7.",
    rarity: "uncommon",
  },
  9: {
    name: "TAB",
    flavor: "Tab. Jumps text to the next indent.",
    rarity: "common",
  },
  10: {
    name: "Line Feed",
    flavor: "Starts a new line.",
    rarity: "uncommon",
  },
  13: {
    name: "Carriage Return",
    flavor: "Goes back to the start of the same line.",
    rarity: "uncommon",
  },
  27: {
    name: "Escape",
    flavor: "The Escape key. Not a letter.",
    rarity: "rare",
  },
  32: {
    name: "Space",
    flavor: "A space. The blank gap between words.",
    rarity: "common",
  },
  33: {
    name: "Bang",
    flavor: "An exclamation mark: !",
    rarity: "common",
  },
  48: {
    name: "Digit None",
    flavor: "The character 0, not the number 0.",
    rarity: "common",
  },
  49: {
    name: "Digit Unity",
    flavor: "The character 1, not the number 1.",
    rarity: "common",
  },
  50: {
    name: "Digit Pair",
    flavor: "The character 2, not the number 2.",
    rarity: "uncommon",
  },
  52: {
    name: "Digit Nibble",
    flavor: "The character 4, not the number 4.",
    rarity: "uncommon",
  },
  55: {
    name: "Digit Week",
    flavor: "The character 7, not the number 7.",
    rarity: "uncommon",
  },
  56: {
    name: "Digit Byte",
    flavor: "The character 8, not the number 8.",
    rarity: "uncommon",
  },
  65: {
    name: "Capital Open",
    flavor: "The capital letter A.",
    rarity: "uncommon",
  },
  66: {
    name: "Capital Next",
    flavor: "The capital letter B.",
    rarity: "common",
  },
  90: {
    name: "Capital Close",
    flavor: "The capital letter Z.",
    rarity: "uncommon",
  },
  97: {
    name: "Quiet Open",
    flavor: "The lowercase letter a.",
    rarity: "uncommon",
  },
};

function bitsFor(value: number): number {
  if (value > 65535) return 32;
  if (value > 255) return 16;
  return 8;
}

export function toBinaryGlyph(value: number): string {
  const bits = bitsFor(value);
  const raw = value.toString(2).padStart(bits, "0");
  return raw.replace(/(.{4})/g, "$1 ").trim();
}

export function toHexGlyph(value: number): string {
  const width = value > 255 ? 4 : 2;
  return "0x" + value.toString(16).toUpperCase().padStart(width, "0");
}

export function toAsciiGlyph(value: number): string {
  if (value >= 32 && value <= 126) return String.fromCharCode(value);
  const names: Record<number, string> = {
    0: "NUL",
    7: "BEL",
    9: "TAB",
    10: "LF",
    13: "CR",
    27: "ESC",
  };
  return names[value] ?? `\\x${value.toString(16).toUpperCase()}`;
}

function card(
  encoding: Encoding,
  value: number,
  lore: Lore,
  suffix = "",
): CardDef {
  const glyph =
    encoding === "binary"
      ? toBinaryGlyph(value)
      : encoding === "hex"
        ? toHexGlyph(value)
        : toAsciiGlyph(value);
  return {
    id: `${encoding}-${value}${suffix}`,
    encoding,
    glyph,
    value,
    name: lore.name,
    flavor: lore.flavor,
    rarity: lore.rarity,
  };
}

function buildCards(): CardDef[] {
  const cards: CardDef[] = [];
  const seen = new Set<string>();
  const push = (c: CardDef) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    cards.push(c);
  };

  for (const [raw, lore] of Object.entries(VALUE_LORE)) {
    const value = Number(raw);
    push(card("binary", value, lore));
    push(card("hex", value, lore));
  }

  for (const [raw, lore] of Object.entries(ASCII_LORE)) {
    push(card("ascii", Number(raw), lore));
  }

  return cards;
}

function loreFor(value: number): Lore {
  return (
    VALUE_LORE[value] ?? {
      name: `Register ${value}`,
      flavor: `The number ${value}.`,
      rarity: value > 255 ? "rare" : "common",
    }
  );
}

function extraCardsFromPrompts(existing: CardDef[]): CardDef[] {
  const seen = new Set(existing.map((item) => item.id));
  const extras: CardDef[] = [];
  const push = (next: CardDef) => {
    if (seen.has(next.id)) return;
    seen.add(next.id);
    extras.push(next);
  };
  for (const prompt of PROMPTS) {
    for (const value of prompt.matchValues ?? []) {
      push(card("binary", value, loreFor(value)));
      push(card("hex", value, loreFor(value)));
    }
    for (const glyph of prompt.matchGlyphs ?? []) {
      if (glyph.length !== 1) continue;
      const upper = glyph.toUpperCase();
      if (/[A-Z]/.test(upper)) {
        push(
          card("ascii", upper.charCodeAt(0), {
            name: `Capital ${upper}`,
            flavor: `The capital letter ${upper}.`,
            rarity: "common",
          }),
        );
      }
      if (/[0-9]/.test(glyph)) {
        push(
          card("ascii", glyph.charCodeAt(0), {
            name: `Digit ${glyph}`,
            flavor: `The character ${glyph}, not the number ${glyph}.`,
            rarity: "common",
          }),
        );
      }
    }
  }
  return extras;
}

const BASE_CARDS = buildCards();
export const CARDS: CardDef[] = [...BASE_CARDS, ...extraCardsFromPrompts(BASE_CARDS)];
export { PROMPTS };

export function cardsByValue(value: number): CardDef[] {
  return CARDS.filter((item) => item.value === value);
}

export function catalogStats() {
  return {
    cards: CARDS.length,
    prompts: PROMPTS.length,
    encodings: {
      binary: CARDS.filter((item) => item.encoding === "binary").length,
      hex: CARDS.filter((item) => item.encoding === "hex").length,
      ascii: CARDS.filter((item) => item.encoding === "ascii").length,
    },
  };
}

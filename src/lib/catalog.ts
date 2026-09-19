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
    flavor:
      "The absence a pointer dreams about when every lamp on the board is dark.",
    rarity: "uncommon",
  },
  1: {
    name: "Single Lamp",
    flavor: "One switch thrown. The smallest truth a bit is willing to admit.",
    rarity: "common",
  },
  2: {
    name: "A Pair",
    flavor: "The smallest crowd binary still bothers to call company.",
    rarity: "common",
  },
  3: {
    name: "Primary Crowd",
    flavor:
      "How many primary colors a painter packs, or states a trit would envy.",
    rarity: "common",
  },
  4: {
    name: "Nibble Width",
    flavor:
      "Half a byte — the exact width of one hex digit's worth of secrets.",
    rarity: "common",
  },
  7: {
    name: "Short Week",
    flavor:
      "Mornings a calendar sells you, or a byte that arrived one switch shy.",
    rarity: "common",
  },
  8: {
    name: "Beige Letter",
    flavor:
      "Count the little switches it takes to store one letter on a beige-era machine.",
    rarity: "common",
  },
  10: {
    name: "Human Radix",
    flavor:
      "Fingers on two hands, and the base your teacher never thought to question.",
    rarity: "common",
  },
  12: {
    name: "Year Split",
    flavor: "Slices a calendar carves from a trip around the lamp.",
    rarity: "common",
  },
  13: {
    name: "Carriage Home",
    flavor: "The old type head coming home at the end of a spoken line.",
    rarity: "uncommon",
  },
  16: {
    name: "Hex Alphabet",
    flavor:
      "How many runes a hex priest needs before the glyphs start over.",
    rarity: "common",
  },
  24: {
    name: "Full Clock",
    flavor:
      "Hours a clock will sell you before it pretends yesterday never happened.",
    rarity: "common",
  },
  26: {
    name: "Latin Line",
    flavor: "Letters an English keyboard is willing to admit exist.",
    rarity: "common",
  },
  32: {
    name: "Soft Gap",
    flavor:
      "The invisible width a teletype leaves between two spoken words.",
    rarity: "uncommon",
  },
  42: {
    name: "Deep Thought",
    flavor:
      "The figure a tired machine once offered as the meaning of everything.",
    rarity: "rare",
  },
  48: {
    name: "Glyph None",
    flavor:
      "Not emptiness: the keypad character a clerk prints when they mean nothing.",
    rarity: "uncommon",
  },
  50: {
    name: "Union Count",
    flavor:
      "You will use this number to describe the amount of states in the United States.",
    rarity: "uncommon",
  },
  60: {
    name: "Minute Spine",
    flavor: "Ticks a clock packs into a minute, or minutes into an hour.",
    rarity: "common",
  },
  64: {
    name: "Chessboard",
    flavor:
      "Squares on a king's battlefield, or six powers of two stacked neatly.",
    rarity: "uncommon",
  },
  65: {
    name: "First Capital",
    flavor:
      "The first letter a schoolchild learns to shout down a serial cable.",
    rarity: "uncommon",
  },
  90: {
    name: "Last Capital",
    flavor: "The final shout in the Latin parade before the row goes quiet.",
    rarity: "uncommon",
  },
  97: {
    name: "Indoor Voice",
    flavor: "The same first letter, but this time it kept its manners.",
    rarity: "uncommon",
  },
  100: {
    name: "Tidy Century",
    flavor:
      "A round hundred, or the HTTP nod that says keep going, nothing to see.",
    rarity: "common",
  },
  127: {
    name: "Last Signed",
    flavor:
      "The final guest in a signed eight-bit house before the sign bit flips.",
    rarity: "rare",
  },
  128: {
    name: "High Bit",
    flavor: "The first citizen of the upper half of a byte.",
    rarity: "uncommon",
  },
  200: {
    name: "Polite Knock",
    flavor:
      "The knock a web server uses when a page agrees to come out.",
    rarity: "uncommon",
  },
  255: {
    name: "All Lamps",
    flavor:
      "Every switch thrown. The last unsigned name an eight-bit town can give.",
    rarity: "rare",
  },
  256: {
    name: "Full Street",
    flavor:
      "How many neighbors, counting zero, an eight-bit street can house.",
    rarity: "rare",
  },
  365: {
    name: "Earth Lap",
    flavor:
      "Trips the planet takes around the lamp before the calendar coughs.",
    rarity: "uncommon",
  },
  404: {
    name: "Missing Hall",
    flavor:
      "The hallway where a page goes when it would rather not be found.",
    rarity: "rare",
  },
  1024: {
    name: "Real K",
    flavor:
      "Two to the tenth — what a nineties disk label meant by a single K.",
    rarity: "rare",
  },
};

const ASCII_LORE: Record<number, Lore> = {
  0: {
    name: "NUL",
    flavor: "The quiet terminator. A string's way of saying 'enough'.",
    rarity: "uncommon",
  },
  7: {
    name: "BEL",
    flavor: "The teletype's tiny shout — a bell, not a weekday.",
    rarity: "uncommon",
  },
  9: {
    name: "TAB",
    flavor: "A hop across the page, indenting a thought without a word.",
    rarity: "common",
  },
  10: {
    name: "Line Feed",
    flavor: "Paper advancing one row, whether the carriage came home or not.",
    rarity: "uncommon",
  },
  13: {
    name: "Carriage Return",
    flavor: "The hammer sliding back to the left margin, still on the same line.",
    rarity: "uncommon",
  },
  27: {
    name: "Escape",
    flavor: "The prefix that tells a terminal: what follows is a command.",
    rarity: "rare",
  },
  32: {
    name: "Space",
    flavor: "The gap you cannot see, without which words would collide.",
    rarity: "common",
  },
  33: {
    name: "Bang",
    flavor: "A pointed shout at the end of a sentence, or a factorial in math class.",
    rarity: "common",
  },
  48: {
    name: "Digit None",
    flavor: "The printed face of nothing — a circle, not an empty register.",
    rarity: "common",
  },
  49: {
    name: "Digit Unity",
    flavor: "A single stroke a keypad uses when it means one, as a character.",
    rarity: "common",
  },
  50: {
    name: "Digit Pair",
    flavor:
      "The glyph for a pair — not the pair itself. A trap for the careless.",
    rarity: "uncommon",
  },
  52: {
    name: "Digit Nibble",
    flavor: "The printed four. Easy to confuse with the nibble it merely names.",
    rarity: "uncommon",
  },
  55: {
    name: "Digit Week",
    flavor: "The character a clock face uses for a week, not the week itself.",
    rarity: "uncommon",
  },
  56: {
    name: "Digit Byte",
    flavor:
      "Looks like a byte's width if you squint. It is only the drawing of it.",
    rarity: "uncommon",
  },
  65: {
    name: "Capital Open",
    flavor: "The first shout in the Latin row — a peak and a crossbar.",
    rarity: "uncommon",
  },
  66: {
    name: "Capital Next",
    flavor: "The second shout. Two bowls stacked like a humble fortress.",
    rarity: "common",
  },
  90: {
    name: "Capital Close",
    flavor: "The last capital before the row goes quiet and the lowercase begins.",
    rarity: "uncommon",
  },
  97: {
    name: "Quiet Open",
    flavor: "The first lowercase. Same letter as the shout, indoor voice.",
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
      flavor: "A quantity waiting to be read off the felt.",
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
    for (const value of prompt.matchValues) {
      push(card("binary", value, loreFor(value)));
      push(card("hex", value, loreFor(value)));
    }
    for (const glyph of prompt.matchGlyphs) {
      if (glyph.length !== 1) continue;
      const upper = glyph.toUpperCase();
      if (/[A-Z]/.test(upper)) {
        push(
          card("ascii", upper.charCodeAt(0), {
            name: `Capital ${upper}`,
            flavor:
              "A single letter waiting to be decoded from the lamps above it.",
            rarity: "common",
          }),
        );
      }
      if (/[0-9]/.test(glyph)) {
        push(
          card("ascii", glyph.charCodeAt(0), {
            name: `Digit ${glyph}`,
            flavor: "A keypad face, not always the number it names.",
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

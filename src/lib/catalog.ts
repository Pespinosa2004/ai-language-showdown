import type { CardDef, Encoding, PromptDef, Rarity } from "./types";

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

export const CARDS: CardDef[] = buildCards();

export const PROMPTS: PromptDef[] = [
  {
    id: "bits-in-byte",
    text: "How many bits live inside a single byte?",
    answer: 8,
    category: "binary",
    hint: "Think of the classic width of one stored letter.",
  },
  {
    id: "nibble",
    text: "How many bits wide is a nibble?",
    answer: 4,
    category: "binary",
    hint: "Half a byte. Also the width of one hex digit.",
  },
  {
    id: "hex-digits",
    text: "How many distinct glyphs does hexadecimal use before it loops?",
    answer: 16,
    category: "hex",
    hint: "Count 0 through F.",
  },
  {
    id: "ascii-a",
    text: "What is the ASCII code for uppercase A?",
    answer: 65,
    category: "ascii",
    hint: "The first capital on the wire.",
  },
  {
    id: "ascii-a-lower",
    text: "What is the ASCII code for lowercase a?",
    answer: 97,
    category: "ascii",
    hint: "Same letter, indoor voice. Thirty-two above its capital.",
  },
  {
    id: "ascii-space",
    text: "What is the ASCII code for a space?",
    answer: 32,
    category: "ascii",
    hint: "The gap between words, as a number.",
  },
  {
    id: "ascii-zero",
    text: "What is the ASCII code for the character 0, not the value zero?",
    answer: 48,
    category: "ascii",
    hint: "The printed face of none.",
  },
  {
    id: "max-byte",
    text: "What is the largest unsigned value an 8-bit byte can hold?",
    answer: 255,
    category: "binary",
    hint: "Every lamp on. No room left.",
  },
  {
    id: "byte-values",
    text: "How many distinct values can one 8-bit byte represent, counting zero?",
    answer: 256,
    category: "binary",
    hint: "One more than the largest unsigned citizen.",
  },
  {
    id: "signed-max",
    text: "What is the largest value a signed 8-bit integer can hold?",
    answer: 127,
    category: "binary",
    hint: "The last guest before the sign bit turns.",
  },
  {
    id: "high-bit",
    text: "What decimal value is the high bit of a byte worth?",
    answer: 128,
    category: "binary",
    hint: "The first citizen of the upper half.",
  },
  {
    id: "usa-states",
    text: "How many states are in the United States?",
    answer: 50,
    category: "mixed",
    hint: "A union count, not a protocol.",
  },
  {
    id: "days-week",
    text: "How many days are in a week?",
    answer: 7,
    category: "mixed",
    hint: "A short cycle. One less than a classic byte.",
  },
  {
    id: "hours-day",
    text: "How many hours are in a day?",
    answer: 24,
    category: "mixed",
    hint: "A full clock face, twice twelve.",
  },
  {
    id: "months",
    text: "How many months are in a year?",
    answer: 12,
    category: "mixed",
    hint: "Slices of an earth lap.",
  },
  {
    id: "http-ok",
    text: "What HTTP status means the request succeeded?",
    answer: 200,
    category: "mixed",
    hint: "A polite knock. The page agreed to come out.",
  },
  {
    id: "http-missing",
    text: "What HTTP status means the page was not found?",
    answer: 404,
    category: "mixed",
    hint: "A hallway with no door.",
  },
  {
    id: "kib",
    text: "How many bytes are in a kibibyte (the real 'K' on old disk labels)?",
    answer: 1024,
    category: "binary",
    hint: "Two raised to the tenth.",
  },
  {
    id: "chess",
    text: "How many squares are on a chessboard?",
    answer: 64,
    category: "mixed",
    hint: "Eight by eight. Two to the sixth.",
  },
  {
    id: "meaning",
    text: "What number did a famous computer claim was the meaning of everything?",
    answer: 42,
    category: "mixed",
    hint: "Deep Thought's punchline.",
  },
  {
    id: "decimal-base",
    text: "How many digits does the decimal system use?",
    answer: 10,
    category: "mixed",
    hint: "A pair of hands.",
  },
  {
    id: "binary-base",
    text: "How many digits does the binary system use?",
    answer: 2,
    category: "binary",
    hint: "On, or off. Company of two.",
  },
  {
    id: "ascii-z",
    text: "What is the ASCII code for uppercase Z?",
    answer: 90,
    category: "ascii",
    hint: "The last shout in the capital row.",
  },
  {
    id: "cr",
    text: "What is the ASCII code for carriage return?",
    answer: 13,
    category: "ascii",
    hint: "The hammer coming home.",
  },
  {
    id: "lf",
    text: "What is the ASCII code for line feed?",
    answer: 10,
    category: "ascii",
    hint: "Paper advancing one row. Also a human radix if you are not careful.",
  },
  {
    id: "nul",
    text: "What is the ASCII code for the NUL terminator?",
    answer: 0,
    category: "ascii",
    hint: "The quiet end of a C string.",
  },
  {
    id: "continue",
    text: "What HTTP status means 'continue' — keep going, nothing to see?",
    answer: 100,
    category: "mixed",
    hint: "A tidy century.",
  },
  {
    id: "minutes",
    text: "How many seconds are in a minute?",
    answer: 60,
    category: "mixed",
    hint: "The spine of a clock.",
  },
  {
    id: "latin-letters",
    text: "How many letters are in the English alphabet?",
    answer: 26,
    category: "mixed",
    hint: "A latin line from start shout to last shout.",
  },
  {
    id: "power-of-two-byte",
    text: "Two to the eighth is the number of values in a byte. What is that power's result?",
    answer: 256,
    category: "binary",
    hint: "A full eight-bit street, counting zero.",
  },
];

export function cardsByValue(value: number): CardDef[] {
  return CARDS.filter((card) => card.value === value);
}

export function catalogStats() {
  return {
    cards: CARDS.length,
    prompts: PROMPTS.length,
    encodings: {
      binary: CARDS.filter((c) => c.encoding === "binary").length,
      hex: CARDS.filter((c) => c.encoding === "hex").length,
      ascii: CARDS.filter((c) => c.encoding === "ascii").length,
    },
  };
}

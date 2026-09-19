import assert from "node:assert/strict";
import { HAND_SIZE, HINTS_PER_SESSION } from "./bots";
import {
  assertHandContainsCorrect,
  beginRound,
  cardShowsAnswer,
  createMatch,
  dealPlayerOptions,
  playBot,
  resolveRound,
  spendHint,
  timeoutHuman,
} from "./engine";
import {
  deriveExplanation,
  deriveHint,
  explainFromCard,
  withSpacedEquals,
} from "./questions";
import { cardCaption, directTranslation } from "./card-text";
import { CARDS, PROMPTS } from "./catalog";

const decimalTen = PROMPTS.find((prompt) => prompt.id === "hex-002");
assert.ok(decimalTen, "hex-002 should exist");
assert.equal(decimalTen.answer, "10");

const hexTenHand = dealPlayerOptions(decimalTen);
assert.equal(hexTenHand.length, HAND_SIZE);
assert.ok(
  hexTenHand.some((card) => cardShowsAnswer(card, decimalTen)),
  "decimal 10 must appear as a glyph in the 7 cards",
);
assert.ok(
  hexTenHand.some((card) => card.glyph.replace(/\s+/g, "") === "10"),
  `expected a card showing "10", got ${hexTenHand.map((card) => card.glyph).join(", ")}`,
);
assert.doesNotThrow(() => assertHandContainsCorrect(hexTenHand, decimalTen));

const binaryTwoHundred = PROMPTS.find((prompt) => prompt.id === "bin-008");
assert.ok(binaryTwoHundred);
assert.equal(
  binaryTwoHundred.explanation,
  "200 in decimal = 11001000 in 8-bit binary",
);
assert.equal(
  deriveExplanation({
    prompt: "What is the 8-bit binary representation of decimal 200?",
    answer: "11001000",
    category: "binary",
  }),
  "200 in decimal = 11001000 in 8-bit binary",
);

for (const prompt of PROMPTS) {
  for (let i = 0; i < 3; i += 1) {
    const hand = dealPlayerOptions(prompt);
    assert.equal(hand.length, HAND_SIZE, `${prompt.id} hand size`);
    assert.ok(
      hand.some((card) => cardShowsAnswer(card, prompt)),
      `${prompt.id} missing bank answer "${prompt.answer}" in ${hand.map((card) => card.glyph).join(" | ")}`,
    );
    assert.doesNotThrow(() => assertHandContainsCorrect(hand, prompt));
    assert.ok(prompt.explanation.length > 0, `${prompt.id} needs an explanation`);
  }
}

const dealt = beginRound(createMatch("Tester", "local"));
const you = dealt.players.find((player) => player.isHuman);
assert.ok(dealt.prompt);
assert.ok(you);
assert.equal(you.hand.length, HAND_SIZE);
assert.ok(you.hand.some((card) => cardShowsAnswer(card, dealt.prompt!)));

const missing = {
  ...decimalTen,
  answer: "NOPE",
  acceptedAnswers: ["NOPE"],
  matchGlyphs: ["nope"],
  matchValues: [],
};
assert.throws(
  () => assertHandContainsCorrect(hexTenHand, missing),
  /missing from the 7 cards/,
);

const hexFourK = PROMPTS.find((prompt) => prompt.id === "hex-015");
assert.ok(hexFourK);
assert.equal(hexFourK.matchValues.length, 1);
assert.equal(hexFourK.matchValues[0], 4096);
assert.equal(hexFourK.explanation, "4096 in decimal = 0x1000");
assert.doesNotMatch(hexFourK.explanation, /4-bit binary/);
const hexFourKHand = dealPlayerOptions(hexFourK);
assert.ok(
  hexFourKHand.some(
    (card) =>
      card.encoding === "hex" &&
      card.glyph.replace(/\s+/g, "").toUpperCase().replace(/^0X/, "0x") &&
      /1000/i.test(card.glyph.replace(/\s+/g, "")),
  ),
  `hex-015 hand should show 1000/0x1000, got ${hexFourKHand.map((c) => c.glyph).join(", ")}`,
);

for (let i = 0; i < 20; i += 1) {
  assert.doesNotThrow(() => beginRound(createMatch(`T${i}`, "local")));
}

const table = beginRound(createMatch("Crash", "local"));
assert.equal(table.hintsRemaining, HINTS_PER_SESSION);
assert.ok(table.correctCard);
const once = spendHint(table);
assert.equal(once.hintsRemaining, HINTS_PER_SESSION - 1);
assert.equal(once.hintOpen, true);
const closed = spendHint(once);
assert.equal(closed.hintOpen, false);
assert.equal(closed.hintsRemaining, HINTS_PER_SESSION - 1);
let drained = closed;
while (drained.hintsRemaining > 0) {
  if (drained.hintOpen) drained = spendHint(drained);
  drained = spendHint(drained);
}
assert.equal(drained.hintsRemaining, 0);
assert.equal(spendHint({ ...drained, hintOpen: false }).hintsRemaining, 0);
assert.doesNotThrow(() => playBot(table, "clippy"));
assert.doesNotThrow(() =>
  playBot(
    {
      ...table,
      players: table.players.map((player) =>
        player.id === "clippy" ? { ...player, hand: [] } : player,
      ),
    },
    "clippy",
  ),
);
assert.equal(resolveRound(table).phase, "prompting");
assert.doesNotThrow(() => timeoutHuman(table));
assert.ok(hexFourK);
assert.match(
  explainFromCard(hexFourK, {
    glyph: "0x1000",
    value: 4096,
    encoding: "hex",
  }),
  /0x1000 from your hand is the hex form of decimal 4096/,
);

const letterHint = deriveHint({
  text: "What letter does the binary sequence 00001 represent?",
  category: "binary",
  difficulty: "easy",
});
assert.match(letterHint, /A = 00001/);
assert.doesNotMatch(letterHint, /A=00001/);
assert.equal(withSpacedEquals("A=00001"), "A = 00001");
assert.equal(withSpacedEquals("A = 00001, B=00010"), "A = 00001, B = 00010");

for (const prompt of PROMPTS) {
  assert.doesNotMatch(
    prompt.hint,
    /[^\s=]=[^=\s]/,
    `${prompt.id} hint must space equals: ${prompt.hint}`,
  );
  assert.doesNotMatch(
    prompt.explanation,
    /[^\s=]=[^=\s]/,
    `${prompt.id} explanation must space equals: ${prompt.explanation}`,
  );
}

const asciiA = CARDS.find((card) => card.id === "ascii-65");
assert.ok(asciiA);
assert.equal(directTranslation(asciiA), "A = 65 / 0x41");
assert.equal(cardCaption(asciiA, "easy"), "A = 65 / 0x41");
assert.equal(cardCaption(asciiA, "medium"), asciiA.flavor);
assert.equal(cardCaption(asciiA, "hard"), "");

const hexTen = CARDS.find((card) => card.id === "hex-10");
assert.ok(hexTen);
assert.equal(directTranslation(hexTen), `${hexTen.glyph} = ${hexTen.value}`);
assert.equal(cardCaption(hexTen, "easy"), `${hexTen.glyph} = ${hexTen.value}`);
assert.equal(cardCaption(hexTen, "hard"), "");

const anyBinary = CARDS.find((card) => card.encoding === "binary");
assert.ok(anyBinary);
assert.match(directTranslation(anyBinary), / = /);
assert.equal(cardCaption(anyBinary, "hard"), "");

console.log(
  `deal.test ok · ${PROMPTS.length} prompts × 3 deals, ${HAND_SIZE} cards each`,
);

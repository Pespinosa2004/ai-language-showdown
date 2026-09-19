import assert from "node:assert/strict";
import { HAND_SIZE } from "./bots";
import {
  assertHandContainsCorrect,
  beginRound,
  cardShowsAnswer,
  createMatch,
  dealPlayerOptions,
} from "./engine";
import { deriveExplanation } from "./questions";
import { PROMPTS } from "./catalog";

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

console.log(
  `deal.test ok · ${PROMPTS.length} prompts × 3 deals, ${HAND_SIZE} cards each`,
);

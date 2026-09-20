import assert from "node:assert/strict";
import { HAND_SIZE, HINTS_PER_ROUND } from "./bots";
import {
  assertHandContainsCorrect,
  beginRound,
  cardShowsAnswer,
  closeHint,
  createMatch,
  dealPlayerOptions,
  displayedHint,
  isExactCard,
  playBot,
  playHuman,
  resolveRound,
  selectCard,
  spendHint,
  timeoutHuman,
} from "./engine";
import { deriveExplanation, explainFromCard, withSpacedEquals } from "./questions";
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
assert.equal(table.hintsRemaining, HINTS_PER_ROUND);
assert.equal(table.hintLevel, 0);
assert.equal(table.hintLocked, false);
assert.ok(table.correctCard);
assert.ok(table.prompt);
const rapid = spendHint(spendHint(table));
assert.equal(rapid.hintLevel, 2);
assert.equal(rapid.hintsRemaining, 0);
assert.equal(rapid.hintLocked, true);
assert.equal(displayedHint(rapid), rapid.prompt?.reveal);
const once = spendHint(table);
assert.equal(once.hintLevel, 1);
assert.equal(once.hintsRemaining, HINTS_PER_ROUND - 1);
assert.equal(once.hintOpen, true);
assert.equal(once.hintLocked, false);
assert.equal(displayedHint(once), once.prompt?.hint);
const closed = closeHint(once);
assert.equal(closed.hintOpen, false);
assert.equal(closed.hintLevel, 1);
assert.equal(closed.hintsRemaining, HINTS_PER_ROUND - 1);
const twice = spendHint(closed);
assert.equal(twice.hintLevel, 2);
assert.equal(twice.hintsRemaining, 0);
assert.equal(twice.hintOpen, true);
assert.equal(twice.hintLocked, true);
assert.equal(displayedHint(twice), twice.prompt?.reveal);
assert.ok(twice.selectedCardId);
assert.ok(
  twice.players
    .find((player) => player.isHuman)
    ?.hand.some((card) => card.id === twice.selectedCardId),
);
const otherCard = twice.players
  .find((player) => player.isHuman)
  ?.hand.find((card) => card.id !== twice.selectedCardId);
assert.ok(otherCard);
assert.equal(selectCard(twice, otherCard.id).selectedCardId, twice.selectedCardId);
assert.equal(playHuman(twice, otherCard.id).selectedCardId, twice.selectedCardId);
assert.equal(playHuman(twice, otherCard.id).hintLocked, true);
const third = spendHint({ ...twice, hintOpen: false });
assert.equal(third.hintLevel, 2);
assert.equal(third.hintsRemaining, 0);
assert.equal(third.hintOpen, true);
assert.equal(third.hintLocked, true);
const nextRound = beginRound(twice);
assert.equal(nextRound.hintLevel, 0);
assert.equal(nextRound.hintLocked, false);
assert.equal(nextRound.hintOpen, false);
assert.equal(nextRound.hintsRemaining, HINTS_PER_ROUND);
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

const bin001 = PROMPTS.find((prompt) => prompt.id === "bin-001");
assert.ok(bin001);
assert.equal(
  bin001.hint,
  "Slots (left to right) are worth 8, 4, 2, 1. Match each digit of 1010 to a slot and add the slots that hold a 1.",
);
assert.match(bin001.reveal, /10/);

const letterPrompt = PROMPTS.find((prompt) => prompt.id === "bin-letter-001");
assert.ok(letterPrompt);
assert.equal(
  letterPrompt.hint,
  "Five slots (left to right) are worth 16, 8, 4, 2, 1. Match each digit of 00001 to a slot and add the slots that hold a 1. A is letter 1, B is 2, C is 3, and so on.",
);
assert.match(letterPrompt.reveal, /which is A/);
assert.doesNotMatch(letterPrompt.hint, /Play the A card/);
assert.equal(withSpacedEquals("A=00001"), "A = 00001");
assert.equal(withSpacedEquals("A = 00001, B=00010"), "A = 00001, B = 00010");

for (const prompt of PROMPTS) {
  assert.ok(prompt.hint.trim().length > 20, `${prompt.id} needs a stored hint`);
  assert.ok(prompt.reveal.trim().length > 8, `${prompt.id} needs a stored reveal`);
  assert.notEqual(
    prompt.hint,
    prompt.reveal,
    `${prompt.id} hint must not be the reveal`,
  );
  const tokens = [
    ...(prompt.text.match(/\b[01]{4,}\b/g) ?? []),
    ...(prompt.text.match(/\b0x[0-9A-Fa-f]+\b/g) ?? []),
  ];
  for (const token of tokens) {
    assert.ok(
      prompt.hint.includes(token) ||
        prompt.hint.toLowerCase().includes(token.toLowerCase()),
      `${prompt.id} hint should mention ${token}: ${prompt.hint}`,
    );
  }
  assert.doesNotMatch(
    prompt.hint,
    /[^\s=]=[^=\s]/,
    `${prompt.id} hint must space equals: ${prompt.hint}`,
  );
  assert.doesNotMatch(
    prompt.reveal,
    /[^\s=]=[^=\s]/,
    `${prompt.id} reveal must space equals: ${prompt.reveal}`,
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

const asciiOne = CARDS.find((card) => card.id === "ascii-49");
assert.ok(asciiOne);
for (const prompt of PROMPTS.filter((item) => item.id.startsWith("bin-letter-"))) {
  const letter = prompt.answer.trim().toUpperCase();
  for (let i = 0; i < 5; i += 1) {
    const hand = dealPlayerOptions(prompt);
    assert.ok(
      hand.some(
        (card) =>
          card.encoding === "ascii" && card.glyph.trim().toUpperCase() === letter,
      ),
      `${prompt.id} missing letter ${letter} in ${hand.map((card) => card.glyph).join(" | ")}`,
    );
    assert.ok(
      hand.some((card) => isExactCard(card, prompt)),
      `${prompt.id} has no scoring card`,
    );
    assert.equal(isExactCard(asciiOne, prompt), false);
  }
}

for (const prompt of PROMPTS) {
  for (let i = 0; i < 3; i += 1) {
    const hand = dealPlayerOptions(prompt);
    const shown = hand.filter((card) => cardShowsAnswer(card, prompt));
    assert.ok(shown.length > 0, `${prompt.id} missing shown answer`);
    assert.ok(
      shown.some((card) => isExactCard(card, prompt)),
      `${prompt.id} shown cards are not exact: ${shown.map((card) => card.glyph).join(" | ")}`,
    );
  }
}

console.log(
  `deal.test ok · ${PROMPTS.length} prompts × 3 deals, ${HAND_SIZE} cards each`,
);

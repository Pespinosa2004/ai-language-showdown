import assert from "node:assert/strict";
import { MAX_HEALTH } from "./bots";
import { CARDS, PROMPTS } from "./catalog";
import {
  beginRound,
  cardShowsAnswer,
  createMatch,
  dealPlayerOptions,
  isExactCard,
  resolveRound,
  toggleAccuse,
} from "./engine";
import { roundScore } from "./scoring";
import type { CardDef, GameState, PromptDef } from "./types";

function hp(state: GameState, id: string): number {
  const player = state.players.find((item) => item.id === id);
  assert.ok(player, `missing seat ${id}`);
  return player.health;
}

function missCard(prompt: PromptDef): CardDef {
  const found = CARDS.find(
    (card) => !isExactCard(card, prompt) && !cardShowsAnswer(card, prompt),
  );
  assert.ok(found, `no miss card for ${prompt.id}`);
  return found;
}

function exactCard(prompt: PromptDef): CardDef {
  const hand = dealPlayerOptions(prompt);
  const found = hand.find((card) => isExactCard(card, prompt));
  assert.ok(found, `no exact card for ${prompt.id}`);
  return found;
}

function accusing(opts: {
  prompt?: PromptDef;
  youHealth?: number;
  youExact?: boolean;
  accusedIds: string[];
  botExact?: string[];
  elapsedMs?: number;
  streak?: number;
}): GameState {
  const prompt = opts.prompt ?? PROMPTS.find((item) => item.id === "bin-001")!;
  const youCard =
    opts.youExact === false ? missCard(prompt) : exactCard(prompt);
  const botExact = new Set(opts.botExact ?? []);
  const base = beginRound(createMatch("Tester", "local"));
  const players = base.players.map((player) => {
    if (player.isHuman) {
      return {
        ...player,
        health: opts.youHealth ?? MAX_HEALTH,
        played: youCard,
        lastPlayed: youCard,
        hand: [],
      };
    }
    const card = botExact.has(player.id)
      ? exactCard(prompt)
      : missCard(prompt);
    return {
      ...player,
      health: MAX_HEALTH,
      played: card,
      lastPlayed: card,
      hand: [],
      eliminated: false,
    };
  });
  return {
    ...base,
    phase: "accusing",
    prompt,
    players,
    accusedIds: opts.accusedIds,
    promptStartedAt: 1_000_000,
    answeredAt: 1_000_000 + (opts.elapsedMs ?? 5_000),
    correctCallStreak: opts.streak ?? 0,
    score: 0,
  };
}

assert.equal(roundScore("easy", 0, true), 10);
assert.equal(roundScore("easy", 15_000, true), 10);
assert.equal(roundScore("easy", 15_001, true), 8);
assert.equal(roundScore("medium", 0, true), 20);
assert.equal(roundScore("medium", 29_000, true), 15);
assert.equal(roundScore("hard", 0, true), 30);
assert.equal(roundScore("hard", 61_000, true), 15);
assert.equal(roundScore("hard", 0, false), 0);

const prompt = PROMPTS.find((item) => item.id === "bin-001")!;
const scored = resolveRound(
  accusing({
    prompt,
    youExact: true,
    accusedIds: [],
    elapsedMs: 4_000,
  }),
);
assert.equal(scored.lastAnswerCorrect, true);
assert.equal(scored.lastRoundPoints, 10);
assert.equal(scored.score, 10);
assert.equal(hp(scored, "you"), MAX_HEALTH);

const missed = resolveRound(
  accusing({
    prompt,
    youHealth: 3,
    youExact: false,
    accusedIds: [],
  }),
);
assert.equal(missed.lastAnswerCorrect, false);
assert.equal(missed.lastRoundPoints, 0);
assert.equal(hp(missed, "you"), 2);

const twoCalls = resolveRound(
  accusing({
    prompt,
    youHealth: 2,
    accusedIds: ["clippy", "hexa"],
  }),
);
assert.equal(hp(twoCalls, "clippy"), 2);
assert.equal(hp(twoCalls, "hexa"), 2);
assert.equal(hp(twoCalls, "you"), 3);
assert.equal(twoCalls.correctCalls, 2);
assert.equal(twoCalls.correctCallStreak, 0);
assert.ok(
  twoCalls.logs.some((item) => item.text.includes("You recover 1 life")),
);

const alreadyFull = resolveRound(
  accusing({
    prompt,
    youHealth: 3,
    accusedIds: ["clippy", "hexa"],
  }),
);
assert.equal(hp(alreadyFull, "you"), 3);
assert.ok(
  alreadyFull.logs.some((item) => item.text.includes("already hold 3 lives")),
);

const firstCall = resolveRound(
  accusing({
    prompt,
    youHealth: 2,
    accusedIds: ["clippy"],
  }),
);
assert.equal(hp(firstCall, "you"), 2);
assert.equal(firstCall.correctCallStreak, 1);
assert.equal(hp(firstCall, "clippy"), 2);

const secondRound = resolveRound(
  accusing({
    prompt,
    youHealth: 2,
    accusedIds: ["hexa"],
    streak: firstCall.correctCallStreak,
  }),
);
assert.equal(hp(secondRound, "you"), 3);
assert.equal(secondRound.correctCallStreak, 0);

const falseThenCorrect = resolveRound(
  accusing({
    prompt,
    youHealth: 3,
    accusedIds: ["nullptr", "clippy"],
    botExact: ["nullptr"],
  }),
);
assert.equal(hp(falseThenCorrect, "you"), 2);
assert.equal(falseThenCorrect.falseCalls, 1);
assert.equal(falseThenCorrect.correctCalls, 1);
assert.equal(falseThenCorrect.correctCallStreak, 1);

const falseResets = resolveRound(
  accusing({
    prompt,
    youHealth: 2,
    accusedIds: ["nullptr"],
    botExact: ["nullptr"],
    streak: 1,
  }),
);
assert.equal(falseResets.correctCallStreak, 0);
assert.equal(hp(falseResets, "you"), 1);

const skippedWrong = resolveRound(
  accusing({
    prompt,
    accusedIds: [],
  }),
);
assert.equal(hp(skippedWrong, "clippy"), MAX_HEALTH);
assert.ok(
  skippedWrong.logs.some((item) =>
    item.text.includes("You did not call them"),
  ),
);

const clutch = resolveRound(
  accusing({
    prompt,
    youHealth: 1,
    youExact: false,
    accusedIds: ["clippy", "hexa"],
  }),
);
assert.equal(hp(clutch, "you"), 1);
assert.notEqual(clutch.phase, "gameover");

const dead = resolveRound(
  accusing({
    prompt,
    youHealth: 1,
    youExact: false,
    accusedIds: [],
  }),
);
assert.equal(hp(dead, "you"), 0);
assert.equal(dead.phase, "gameover");

const letter = PROMPTS.find((item) => item.id === "bin-letter-001")!;
const letterPlay = resolveRound(
  accusing({
    prompt: letter,
    youExact: true,
    accusedIds: [],
    elapsedMs: 10_000,
  }),
);
assert.equal(letterPlay.lastAnswerCorrect, true);
assert.equal(letterPlay.lastRoundPoints, 10);

const asciiDigit = CARDS.find(
  (card) => card.encoding === "ascii" && card.glyph === "1",
);
assert.ok(asciiDigit);
assert.equal(cardShowsAnswer(asciiDigit, letter), false);
assert.equal(isExactCard(asciiDigit, letter), false);

const lettered = beginRound(createMatch("Letters", "local"));
assert.equal(lettered.correctCallStreak, 0);

const accusingToggle = accusing({
  prompt,
  accusedIds: [],
});
const once = toggleAccuse(accusingToggle, "clippy");
assert.deepEqual(once.accusedIds, ["clippy"]);
const twice = toggleAccuse(once, "clippy");
assert.deepEqual(twice.accusedIds, []);
const ignored = toggleAccuse(
  { ...accusingToggle, phase: "prompting" },
  "clippy",
);
assert.deepEqual(ignored.accusedIds, []);

const fourCalls = resolveRound(
  accusing({
    prompt,
    youHealth: 1,
    accusedIds: ["clippy", "hexa", "bitwise", "ascii8"],
  }),
);
assert.equal(hp(fourCalls, "you"), 3);
assert.equal(fourCalls.correctCallStreak, 0);
assert.equal(fourCalls.correctCalls, 4);

console.log("game.test ok · lives, scores, accusations, letter answers");

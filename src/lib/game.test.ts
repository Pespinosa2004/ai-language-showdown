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
  shiftOpenClocks,
  toggleAccuse,
} from "./engine";
import { rankScoreRows, roundScore } from "./scoring";
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

const clock = beginRound(createMatch("Pause", "local"), 1_000_000);
assert.equal(clock.promptStartedAt, 1_000_000);
const held = shiftOpenClocks(clock, 8_000);
assert.equal(held.deadlineAt, clock.deadlineAt + 8_000);
assert.equal(held.promptStartedAt, 1_008_000);
assert.equal(held.accuseDeadlineAt, 0);
assert.equal(shiftOpenClocks(clock, 0), clock);

const alreadyPlayed = {
  ...clock,
  players: clock.players.map((player) =>
    player.isHuman ? { ...player, played: player.hand[0] ?? null } : player,
  ),
  answeredAt: 1_003_000,
  accuseDeadlineAt: 2_000_000,
};
const afterPlay = shiftOpenClocks(alreadyPlayed, 5_000);
assert.equal(afterPlay.promptStartedAt, clock.promptStartedAt);
assert.equal(afterPlay.deadlineAt, clock.deadlineAt + 5_000);
assert.equal(afterPlay.accuseDeadlineAt, 2_005_000);

const ranked = rankScoreRows([
  {
    id: "late-fall",
    name: "HighFall",
    won: false,
    rounds: 12,
    health: 0,
    score: 900,
    correctCalls: 8,
    falseCalls: 0,
    at: "2026-09-20T04:00:00.000Z",
  },
  {
    id: "low-win",
    name: "LowWin",
    won: true,
    rounds: 4,
    health: 1,
    score: 40,
    correctCalls: 2,
    falseCalls: 0,
    at: "2026-09-20T04:01:00.000Z",
  },
  {
    id: "high-win",
    name: "HighWin",
    won: true,
    rounds: 8,
    health: 2,
    score: 120,
    correctCalls: 4,
    falseCalls: 0,
    at: "2026-09-20T03:00:00.000Z",
  },
]);
assert.deepEqual(
  ranked.map((row) => row.id),
  ["high-win", "low-win", "late-fall"],
);

console.log("game.test ok · lives, scores, accusations, letter answers");

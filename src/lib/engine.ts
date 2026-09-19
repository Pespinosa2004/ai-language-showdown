import { CARDS, PROMPTS } from "@/lib/catalog";
import {
  BOTS,
  HAND_SIZE,
  HINTS_PER_SESSION,
  MAX_HEALTH,
  roundAccuseMs,
  roundTimerMs,
} from "@/lib/bots";
import { explainFromCard, formatAnswerGlyph, normalizeAnswer } from "@/lib/questions";
import { basePoints, roundScore, speedMultiplier } from "@/lib/scoring";
import type {
  BotDef,
  CardDef,
  GameState,
  LogLine,
  MatchQuality,
  PlayerState,
  PromptDef,
} from "@/lib/types";

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pick<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

function line(tone: LogLine["tone"], text: string): LogLine {
  return { id: crypto.randomUUID(), tone, text };
}

function glyphsOf(prompt: PromptDef): string[] {
  return prompt.matchGlyphs ?? [];
}

function valuesOf(prompt: PromptDef): number[] {
  return prompt.matchValues ?? [];
}

export function isExactCard(card: CardDef, prompt: PromptDef): boolean {
  const glyphs = glyphsOf(prompt);
  const values = valuesOf(prompt);
  const glyph = normalizeAnswer(card.glyph);
  const hexless = glyph.replace(/^0x/, "");
  if (glyphs.includes(glyph)) {
    return true;
  }
  if (card.encoding === "hex") {
    for (const candidate of glyphs) {
      const hex = candidate.replace(/^0x/, "");
      if (!/^[0-9a-f]+$/.test(hex)) continue;
      const namedAsHex = candidate.startsWith("0x") || /[a-f]/.test(hex);
      if (!namedAsHex) continue;
      if (hexless === hex) return true;
      if (
        /^[0-9a-f]+$/.test(hexless) &&
        Number.parseInt(hexless, 16) === Number.parseInt(hex, 16)
      ) {
        return true;
      }
    }
  }
  if (card.encoding === "ascii") {
    const letter = card.glyph.trim().toLowerCase();
    if (letter.length === 1 && glyphs.includes(letter)) return true;
  }
  if (!values.includes(card.value)) return false;
  if (prompt.category === "ascii") {
    return card.encoding === "ascii" || card.value > 31;
  }
  if (card.encoding === "ascii") {
    return glyphs.includes(card.glyph.trim().toLowerCase());
  }
  return true;
}

export function matchQuality(card: CardDef, prompt: PromptDef): MatchQuality {
  if (isExactCard(card, prompt)) return "exact";
  const close = valuesOf(prompt).some(
    (value) =>
      card.value === value + 1 ||
      card.value === value - 1 ||
      card.value === value * 2 ||
      card.value === Math.floor(value / 2),
  );
  return close ? "close" : "miss";
}

function takeUnique(
  used: Set<string>,
  predicate: (card: CardDef) => boolean,
): CardDef | undefined {
  const found = shuffle(
    CARDS.filter((card) => predicate(card) && !used.has(card.id)),
  )[0];
  if (!found) return undefined;
  used.add(found.id);
  return found;
}

function fillHand(used: Set<string>, start: CardDef[]): CardDef[] {
  const hand = [...start];
  for (const card of shuffle(CARDS)) {
    if (hand.length >= HAND_SIZE) break;
    if (used.has(card.id)) continue;
    used.add(card.id);
    hand.push(card);
  }
  return shuffle(hand).slice(0, HAND_SIZE);
}

function encodingForAnswer(prompt: PromptDef): PromptDef["category"] {
  const raw = prompt.answer.trim();
  if (
    /hexadecimal|in hexadecimal|in hex\b/i.test(prompt.text) &&
    !/in decimal/i.test(prompt.text)
  ) {
    return "hex";
  }
  if (/^[01]{4,}$/.test(raw) || /^0b[01]+$/i.test(raw)) return "binary";
  if (/^0x[0-9A-Fa-f]+$/i.test(raw)) return "hex";
  if (prompt.category === "hex" && /[A-F]/i.test(raw) && /^[0-9A-F]+$/i.test(raw)) {
    return "hex";
  }
  if (raw.length === 1 && /[A-Za-z$]/.test(raw)) return "ascii";
  return prompt.category === "mixed" ? "binary" : prompt.category;
}

export function cardShowsAnswer(card: CardDef, prompt: PromptDef): boolean {
  const glyph = normalizeAnswer(card.glyph);
  const hexless = glyph.replace(/^0x/, "");
  const answers = [prompt.answer, ...(prompt.acceptedAnswers ?? [])];
  for (const raw of answers) {
    const normalized = normalizeAnswer(raw);
    if (!normalized) continue;
    if (glyph === normalized) return true;
    const formatted = normalizeAnswer(formatAnswerGlyph(raw, prompt.category));
    if (glyph === formatted) return true;
    const bits = normalized.replace(/^0b/, "");
    if (
      /^[01]{4,}$/.test(bits) &&
      /^[01]+$/.test(glyph) &&
      Number.parseInt(bits, 2) === Number.parseInt(glyph, 2)
    ) {
      return true;
    }
    const namedAsHex =
      /^0x/i.test(raw.trim()) ||
      (answers.some((item) => /^0x/i.test(item.trim())) &&
        /^[0-9a-f]+$/.test(normalized) &&
        /hexadecimal|in hexadecimal|in hex\b/i.test(prompt.text));
    if (namedAsHex) {
      const answerHex = normalized.replace(/^0x/, "");
      if (
        /^[0-9a-f]+$/.test(hexless) &&
        /^[0-9a-f]+$/.test(answerHex) &&
        Number.parseInt(hexless, 16) === Number.parseInt(answerHex, 16)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function answerCardFor(prompt: PromptDef): CardDef {
  const encoding = encodingForAnswer(prompt);
  const value = valuesOf(prompt)[0] ?? 0;
  return {
    id: `answer-${prompt.id}`,
    encoding: encoding === "mixed" ? "binary" : encoding,
    glyph: formatAnswerGlyph(prompt.answer, encoding, prompt.text),
    value,
    name: "Bank answer",
    flavor: prompt.explanation,
    rarity: "rare",
  };
}

export function assertHandContainsCorrect(
  hand: CardDef[],
  prompt: PromptDef,
): void {
  const present = hand.some((card) => cardShowsAnswer(card, prompt));
  if (present) return;
  const message = `Correct answer "${prompt.answer}" missing from the 7 cards for ${prompt.id}`;
  if (process.env.NODE_ENV !== "production") {
    throw new Error(message);
  }
  console.error(message);
}

function pickCorrectCard(prompt: PromptDef, used: Set<string>): CardDef {
  const showing = CARDS.filter(
    (card) => !used.has(card.id) && cardShowsAnswer(card, prompt),
  );
  const preferred = encodingForAnswer(prompt);
  const ranked = [
    ...showing.filter((card) => card.encoding === preferred),
    ...showing,
  ];
  const found = ranked[0];
  if (found) {
    used.add(found.id);
    return found;
  }
  const made = answerCardFor(prompt);
  used.add(made.id);
  return made;
}

function isDistractor(card: CardDef, prompt: PromptDef): boolean {
  return !isExactCard(card, prompt) && !cardShowsAnswer(card, prompt);
}

export function dealPlayerOptions(
  prompt: PromptDef,
  used: Set<string> = new Set(),
): CardDef[] {
  const correct = pickCorrectCard(prompt, used);
  const distractors: CardDef[] = [];
  while (distractors.length < HAND_SIZE - 1) {
    const close = takeUnique(
      used,
      (card) =>
        isDistractor(card, prompt) && matchQuality(card, prompt) === "close",
    );
    if (!close) break;
    distractors.push(close);
  }
  for (const card of shuffle(CARDS)) {
    if (distractors.length >= HAND_SIZE - 1) break;
    if (used.has(card.id) || !isDistractor(card, prompt)) continue;
    used.add(card.id);
    distractors.push(card);
  }
  let offset = 1;
  while (distractors.length < HAND_SIZE - 1 && offset < 64) {
    const value = (valuesOf(prompt)[0] ?? 1) + offset;
    offset += 1;
    const encoding = encodingForAnswer(prompt);
    const id = `distract-${prompt.id}-${value}`;
    if (used.has(id)) continue;
    used.add(id);
    distractors.push({
      id,
      encoding: encoding === "mixed" ? "binary" : encoding,
      glyph:
        encoding === "hex"
          ? `0x${value.toString(16).toUpperCase()}`
          : encoding === "ascii" && value >= 32 && value <= 126
            ? String.fromCharCode(value)
            : value
                .toString(2)
                .padStart(8, "0")
                .replace(/(.{4})/g, "$1 ")
                .trim(),
      value,
      name: `Near miss ${value}`,
      flavor: "A neighboring quantity that is not the bank answer.",
      rarity: "common",
    });
  }
  const hand = shuffle([correct, ...distractors.slice(0, HAND_SIZE - 1)]);
  assertHandContainsCorrect(hand, prompt);
  if (hand.length !== HAND_SIZE && process.env.NODE_ENV !== "production") {
    throw new Error(
      `Expected ${HAND_SIZE} answer cards for ${prompt.id}, got ${hand.length}`,
    );
  }
  return hand;
}

function dealHumanHand(prompt: PromptDef, used: Set<string>): CardDef[] {
  try {
    return dealPlayerOptions(prompt, used);
  } catch (error) {
    console.error(error);
    const correct = answerCardFor(prompt);
    used.add(correct.id);
    return fillHand(used, [correct]);
  }
}

function dealHand(
  prompt: PromptDef,
  wantExact: boolean,
  used: Set<string>,
): CardDef[] {
  const start: CardDef[] = [];
  if (wantExact) {
    const exact = takeUnique(used, (card) => isExactCard(card, prompt));
    if (exact) start.push(exact);
  }
  const close = takeUnique(
    used,
    (card) => matchQuality(card, prompt) === "close",
  );
  if (close) start.push(close);
  if (Math.random() < 0.5) {
    const extra = takeUnique(
      used,
      (card) => matchQuality(card, prompt) === "close",
    );
    if (extra) start.push(extra);
  }
  return fillHand(used, start);
}

function seating(playerName: string): PlayerState[] {
  const you: PlayerState = {
    id: "you",
    name: playerName,
    isHuman: true,
    health: MAX_HEALTH,
    hand: [],
    played: null,
    lastPlayed: null,
    accused: false,
    eliminated: false,
  };
  const bots = BOTS.map((bot) => ({
    id: bot.id,
    name: bot.name,
    isHuman: false,
    health: MAX_HEALTH,
    hand: [] as CardDef[],
    played: null,
    lastPlayed: null,
    accused: false,
    eliminated: false,
  }));
  return [you, ...bots];
}

export function createMatch(playerName: string, storeLabel: string): GameState {
  const name = playerName.trim() || "Operator";
  return {
    phase: "dealing",
    playerName: name,
    round: 1,
    prompt: null,
    players: seating(name),
    selectedCardId: null,
    accusedIds: [],
    deadlineAt: 0,
    accuseDeadlineAt: 0,
    startedAt: Date.now(),
    logs: [
      line(
        "neutral",
        "Six seats. Seven cards. Call the hallucinations or lose the table.",
      ),
    ],
    winnerId: null,
    correctCalls: 0,
    falseCalls: 0,
    score: 0,
    lastRoundPoints: 0,
    lastAnswerCorrect: true,
    correctCard: null,
    hintsRemaining: HINTS_PER_SESSION,
    hintRound: 0,
    hintOpen: false,
    promptStartedAt: 0,
    answeredAt: null,
    storeLabel,
    usedPromptIds: [],
  };
}

export function beginRound(state: GameState, now = Date.now()): GameState {
  const unused = PROMPTS.filter(
    (prompt) => !state.usedPromptIds.includes(prompt.id),
  );
  const prompt = pick(unused.length > 0 ? unused : PROMPTS)!;
  const usedCards = new Set<string>();
  const livingCount = state.players.filter((player) => !player.eliminated).length;
  const players = state.players.map((player) => {
    if (player.eliminated) {
      return {
        ...player,
        health: 0,
        hand: [],
        played: null,
        accused: false,
      };
    }
    const bot = BOTS.find((item) => item.id === player.id);
    const hand = player.isHuman
      ? dealHumanHand(prompt, usedCards)
      : dealHand(
          prompt,
          Math.random() < (bot?.accuracy ?? 0.5) + 0.08,
          usedCards,
        );
    return {
      ...player,
      hand,
      played: null,
      accused: false,
    };
  });

  const youHand =
    players.find((player) => player.isHuman)?.hand ?? [];
  const correctCard =
    youHand.find((card) => cardShowsAnswer(card, prompt)) ??
    youHand.find((card) => isExactCard(card, prompt)) ??
    answerCardFor(prompt);

  return {
    ...state,
    phase: "prompting",
    prompt,
    players,
    selectedCardId: null,
    accusedIds: [],
    deadlineAt: now + roundTimerMs(state.round, prompt.difficulty),
    accuseDeadlineAt: 0,
    promptStartedAt: now,
    answeredAt: null,
    lastRoundPoints: 0,
    lastAnswerCorrect: true,
    correctCard,
    hintOpen: false,
    hintsRemaining: state.hintsRemaining ?? HINTS_PER_SESSION,
    hintRound: state.hintRound ?? 0,
    usedPromptIds:
      unused.length > 0 ? [...state.usedPromptIds, prompt.id] : [prompt.id],
    logs: [
      line(
        "neutral",
        `Round ${state.round}. ${livingCount} still standing. ${(prompt.difficulty ?? "medium").toUpperCase()} · ${basePoints(prompt.difficulty ?? "medium")} pts. Answer faster for a higher multiplier.`,
      ),
    ],
  };
}

export function chooseBotCard(
  bot: BotDef,
  hand: CardDef[],
  prompt: PromptDef,
  timerRatio: number,
): CardDef {
  if (!hand.length) {
    return answerCardFor(prompt);
  }
  let accuracy = bot.accuracy;
  if (prompt.category === bot.specialty) accuracy += 0.12;
  if (timerRatio < 0.38) accuracy *= 1 - bot.panic * 0.75;
  const exact = hand.filter((card) => isExactCard(card, prompt));
  const close = hand.filter((card) => matchQuality(card, prompt) === "close");
  if (exact.length > 0 && Math.random() < accuracy) {
    if (close.length > 0 && Math.random() < bot.offByOne) return close[0]!;
    return exact[0]!;
  }
  if (close.length > 0 && Math.random() < 0.62) return close[0]!;
  return pick(hand) ?? hand[0]!;
}

function living(state: GameState): PlayerState[] {
  return state.players.filter((player) => !player.eliminated);
}

function enterAccuseIfReady(state: GameState, now = Date.now()): GameState {
  if (state.phase !== "prompting") return state;
  const ready = living(state).every((player) => player.played !== null);
  if (!ready) return state;
  return {
    ...state,
    phase: "accusing",
    accuseDeadlineAt: now + roundAccuseMs(state.round),
    logs: [
      ...state.logs,
      line(
        "warn",
        "Call a wrong bot to take a life. A correct bot — or your own wrong card — costs you a life.",
      ),
    ],
  };
}

export function selectCard(state: GameState, cardId: string): GameState {
  if (state.phase !== "prompting") return state;
  const you = state.players.find((player) => player.isHuman);
  if (!you || you.played) return state;
  if (!you.hand.some((card) => card.id === cardId)) return state;
  return { ...state, selectedCardId: cardId };
}

export function playHuman(state: GameState, cardId: string): GameState {
  if (state.phase !== "prompting") return state;
  const you = state.players.find((player) => player.isHuman);
  if (!you || you.played) return state;
  const card = you.hand.find((item) => item.id === cardId);
  if (!card) return state;
  const players = state.players.map((player) =>
    player.id === "you"
      ? {
          ...player,
          played: card,
          lastPlayed: card,
          hand: player.hand.filter((item) => item.id !== cardId),
        }
      : player,
  );
  return enterAccuseIfReady({
    ...state,
    players,
    selectedCardId: null,
    answeredAt: state.answeredAt ?? Date.now(),
    logs: [
      ...state.logs,
      line("neutral", `You slide ${card.glyph} onto the felt.`),
    ],
  });
}

export function playBot(
  state: GameState,
  botId: string,
  now = Date.now(),
): GameState {
  if (state.phase !== "prompting" || !state.prompt) return state;
  const player = state.players.find((item) => item.id === botId);
  const bot = BOTS.find((item) => item.id === botId);
  if (!player || player.eliminated || player.played || !bot) return state;
  if (player.hand.length === 0) return state;
  const remain = Math.max(0, state.deadlineAt - now);
  const total = roundTimerMs(state.round, state.prompt.difficulty);
  const card = chooseBotCard(bot, player.hand, state.prompt, remain / total);
  if (!card) return state;
  const players = state.players.map((item) =>
    item.id === botId
      ? {
          ...item,
          played: card,
          lastPlayed: card,
          hand: item.hand.filter((handCard) => handCard.id !== card.id),
        }
      : item,
  );
  return enterAccuseIfReady({
    ...state,
    players,
    logs: [...state.logs, line("neutral", `${bot.name} plays ${card.glyph}.`)],
  });
}

export function timeoutHuman(state: GameState): GameState {
  if (state.phase !== "prompting") return state;
  const you = state.players.find((player) => player.isHuman);
  if (!you || you.played) return enterAccuseIfReady(state);
  const fallback = state.selectedCardId ?? you.hand[0]?.id;
  if (!fallback) return enterAccuseIfReady(state);
  const next = playHuman(state, fallback);
  return {
    ...next,
    logs: [
      ...next.logs,
      line("bad", "Time snapped shut. Your last glance became the play."),
    ],
  };
}

export function toggleAccuse(state: GameState, botId: string): GameState {
  if (state.phase !== "accusing") return state;
  const target = state.players.find((player) => player.id === botId);
  if (!target || target.isHuman || target.eliminated || !target.played) {
    return state;
  }
  const accusedIds = state.accusedIds.includes(botId)
    ? state.accusedIds.filter((id) => id !== botId)
    : [...state.accusedIds, botId];
  return { ...state, accusedIds };
}

function loseLife(player: PlayerState) {
  player.health = Math.max(0, player.health - 1);
}

export function resolveRound(state: GameState): GameState {
  if (state.phase !== "accusing" || !state.prompt) return state;
  const prompt = state.prompt;
  const logs: LogLine[] = [
    line("neutral", `The table turns the cards. Answer was ${prompt.answer}.`),
  ];
  let correctCalls = state.correctCalls;
  let falseCalls = state.falseCalls;

  const players = state.players.map((player) => ({ ...player }));
  const you = players.find((player) => player.isHuman);
  if (!you) return state;
  const youQuality = you.played ? matchQuality(you.played, prompt) : "miss";
  const elapsed = Math.max(
    0,
    (state.answeredAt ?? Date.now()) - (state.promptStartedAt || Date.now()),
  );
  const points = roundScore(prompt.difficulty, elapsed, youQuality === "exact");
  const multiplier = speedMultiplier(elapsed);

  if (youQuality === "exact") {
    logs.push(
      line(
        "good",
        `Your ${you.played?.glyph} matches ${prompt.answer}. +${points} pts (${prompt.difficulty} ${basePoints(prompt.difficulty)} × ${multiplier} in ${(elapsed / 1000).toFixed(1)}s).`,
      ),
    );
  } else {
    if (you.played) {
      logs.push(
        line(
          "bad",
          `Your ${you.played.glyph} is ${you.played.value}. The prompt wanted ${prompt.answer}.`,
        ),
      );
    } else {
      logs.push(line("bad", "You never played a card."));
    }
    logs.push(
      line(
        "warn",
        state.correctCard
          ? explainFromCard(prompt, state.correctCard)
          : prompt.explanation,
      ),
    );
    if (!you.eliminated) {
      loseLife(you);
      logs.push(line("bad", "Wrong answer. You lose 1 life. No points this round."));
    }
  }

  for (const player of players) {
    if (player.isHuman || player.eliminated || !player.played) continue;
    const quality = matchQuality(player.played, prompt);
    const accused = state.accusedIds.includes(player.id);
    if (!accused) {
      if (quality !== "exact") {
        logs.push(
          line(
            "warn",
            `${player.name}'s ${player.played.glyph} was wrong. You did not call them, so they keep that life.`,
          ),
        );
      }
      continue;
    }
    if (quality === "exact") {
      loseLife(you);
      falseCalls += 1;
      logs.push(
        line(
          "bad",
          `${player.name} was right (${player.played.glyph} = ${player.played.value}). False call. You lose 1 life.`,
        ),
      );
    } else {
      loseLife(player);
      correctCalls += 1;
      logs.push(
        line(
          "good",
          `Called. ${player.name} played ${player.played.glyph} (${player.played.value}). They lose 1 life.`,
        ),
      );
    }
  }

  for (const player of players) {
    if (player.health <= 0 && !player.eliminated) {
      player.health = 0;
      player.eliminated = true;
      if (player.played) player.lastPlayed = player.played;
      logs.push(
        line(
          player.isHuman ? "bad" : "good",
          `${player.name} lost their last life and is blocked.`,
        ),
      );
    }
  }

  const livingBots = players.filter(
    (player) => !player.isHuman && player.health > 0 && !player.eliminated,
  );
  const youNow = players.find((player) => player.isHuman);
  if (!youNow) return state;
  let phase: GameState["phase"] = "resolving";
  let winnerId: string | null = null;
  if (youNow.health <= 0 || youNow.eliminated) {
    phase = "gameover";
    winnerId = livingBots[0]?.id ?? "table";
    logs.push(line("bad", `You are out of lives. Final score ${state.score + points}.`));
  } else if (livingBots.length === 0) {
    phase = "gameover";
    winnerId = "you";
    logs.push(
      line(
        "good",
        `You still have a life. Every bot is out. Final score ${state.score + points}.`,
      ),
    );
  }

  return {
    ...state,
    phase,
    players,
    logs,
    winnerId,
    correctCalls,
    falseCalls,
    score: state.score + points,
    lastRoundPoints: points,
    lastAnswerCorrect: youQuality === "exact",
  };
}

export function advanceAfterResolve(state: GameState): GameState {
  if (state.phase !== "resolving") return state;
  return {
    ...state,
    phase: "dealing",
    round: state.round + 1,
    selectedCardId: null,
    accusedIds: [],
    prompt: null,
    correctCard: null,
    hintOpen: false,
    logs: [line("neutral", "The dealer gathers the cards.")],
  };
}

export function youPlayer(state: GameState): PlayerState {
  return (
    state.players.find((player) => player.isHuman) ?? {
      id: "you",
      name: state.playerName || "Operator",
      isHuman: true,
      health: 0,
      hand: [],
      played: null,
      lastPlayed: null,
      accused: false,
      eliminated: true,
    }
  );
}

export function spendHint(state: GameState): GameState {
  if (!state.prompt) return state;
  if (state.phase !== "prompting" && state.phase !== "accusing") return state;
  if (state.hintOpen) {
    return { ...state, hintOpen: false };
  }
  if ((state.hintsRemaining ?? 0) <= 0) return state;
  return {
    ...state,
    hintsRemaining: state.hintsRemaining - 1,
    hintRound: state.round,
    hintOpen: true,
    logs: [
      ...state.logs,
      line(
        "warn",
        `Hint (${state.hintsRemaining - 1} left): ${state.prompt.hint}`,
      ),
    ],
  };
}

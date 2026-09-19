import { CARDS, PROMPTS } from "@/lib/catalog";
import {
  BOTS,
  HAND_SIZE,
  MAX_HEALTH,
  roundAccuseMs,
  roundTimerMs,
} from "@/lib/bots";
import { normalizeAnswer } from "@/lib/questions";
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

export function isExactCard(card: CardDef, prompt: PromptDef): boolean {
  const glyph = normalizeAnswer(card.glyph);
  const hexless = glyph.replace(/^0x/, "");
  if (prompt.matchGlyphs.includes(glyph) || prompt.matchGlyphs.includes(hexless)) {
    return true;
  }
  if (card.encoding === "ascii") {
    const letter = card.glyph.trim().toLowerCase();
    if (letter.length === 1 && prompt.matchGlyphs.includes(letter)) return true;
  }
  if (!prompt.matchValues.includes(card.value)) return false;
  if (prompt.category === "ascii") {
    return card.encoding === "ascii" || card.value > 31;
  }
  if (card.encoding === "ascii") {
    return prompt.matchGlyphs.includes(card.glyph.trim().toLowerCase());
  }
  return true;
}

export function matchQuality(card: CardDef, prompt: PromptDef): MatchQuality {
  if (isExactCard(card, prompt)) return "exact";
  const close = prompt.matchValues.some(
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
    const wantExact = player.isHuman
      ? Math.random() < 0.8
      : Math.random() < (bot?.accuracy ?? 0.5) + 0.08;
    return {
      ...player,
      hand: dealHand(prompt, wantExact, usedCards),
      played: null,
      accused: false,
    };
  });

  return {
    ...state,
    phase: "prompting",
    prompt,
    players,
    selectedCardId: null,
    accusedIds: [],
    deadlineAt: now + roundTimerMs(state.round),
    accuseDeadlineAt: 0,
    promptStartedAt: now,
    answeredAt: null,
    lastRoundPoints: 0,
    usedPromptIds:
      unused.length > 0 ? [...state.usedPromptIds, prompt.id] : [prompt.id],
    logs: [
      line(
        "neutral",
        `Round ${state.round}. ${livingCount} still standing. ${prompt.difficulty.toUpperCase()} · ${basePoints(prompt.difficulty)} pts. Answer faster for a higher multiplier.`,
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
  const remain = Math.max(0, state.deadlineAt - now);
  const total = roundTimerMs(state.round);
  const card = chooseBotCard(bot, player.hand, state.prompt, remain / total);
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
  const you = players.find((player) => player.isHuman)!;
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
  const youNow = players.find((player) => player.isHuman)!;
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
    logs: [line("neutral", "The dealer gathers the cards.")],
  };
}

export function youPlayer(state: GameState): PlayerState {
  return state.players.find((player) => player.isHuman)!;
}

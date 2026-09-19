export type Encoding = "binary" | "hex" | "ascii";
export type Difficulty = "easy" | "medium" | "hard";
export type Rarity = "common" | "uncommon" | "rare";
export type MatchQuality = "exact" | "close" | "miss";
export type Phase =
  | "title"
  | "dealing"
  | "prompting"
  | "accusing"
  | "resolving"
  | "gameover";

export type CardDef = {
  id: string;
  encoding: Encoding;
  glyph: string;
  value: number;
  name: string;
  flavor: string;
  rarity: Rarity;
};

export type PromptDef = {
  id: string;
  text: string;
  answer: string;
  acceptedAnswers: string[];
  category: Encoding | "mixed";
  difficulty: Difficulty;
  matchValues: number[];
  matchGlyphs: string[];
  hint: string;
  explanation: string;
};

export type BotDef = {
  id: string;
  name: string;
  title: string;
  blurb: string;
  specialty: Encoding;
  accuracy: number;
  notice: number;
  panic: number;
  speed: number;
  offByOne: number;
  accent: string;
};

export type SeatId = "you" | string;

export type PlayerState = {
  id: SeatId;
  name: string;
  isHuman: boolean;
  health: number;
  hand: CardDef[];
  played: CardDef | null;
  lastPlayed: CardDef | null;
  accused: boolean;
  eliminated: boolean;
};

export type LogLine = {
  id: string;
  tone: "neutral" | "good" | "bad" | "warn";
  text: string;
};

export type ScoreRow = {
  id: string;
  name: string;
  won: boolean;
  rounds: number;
  health: number;
  score: number;
  correctCalls: number;
  falseCalls: number;
  at: string;
};

export type GameState = {
  phase: Phase;
  playerName: string;
  round: number;
  prompt: PromptDef | null;
  players: PlayerState[];
  selectedCardId: string | null;
  accusedIds: string[];
  deadlineAt: number;
  accuseDeadlineAt: number;
  startedAt: number;
  logs: LogLine[];
  winnerId: SeatId | null;
  correctCalls: number;
  falseCalls: number;
  score: number;
  lastRoundPoints: number;
  lastAnswerCorrect: boolean;
  correctCard: CardDef | null;
  hintsRemaining: number;
  hintRound: number;
  hintOpen: boolean;
  promptStartedAt: number;
  answeredAt: number | null;
  storeLabel: string;
  usedPromptIds: string[];
  correctCallStreak: number;
};

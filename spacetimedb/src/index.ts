import { schema, t, table } from "spacetimedb/server";
import { CARDS, PROMPTS } from "../../src/lib/catalog";

const card = table(
  { name: "card", public: true },
  {
    id: t.string().primaryKey(),
    encoding: t.string(),
    glyph: t.string(),
    value: t.u32(),
    name: t.string(),
    flavor: t.string(),
    rarity: t.string(),
  },
);

const prompt = table(
  { name: "prompt", public: true },
  {
    id: t.string().primaryKey(),
    text: t.string(),
    answer: t.u32(),
    category: t.string(),
    hint: t.string(),
  },
);

const score = table(
  { name: "score", public: true },
  {
    id: t.string().primaryKey(),
    name: t.string(),
    won: t.bool(),
    rounds: t.u32(),
    health: t.u32(),
    correctCalls: t.u32(),
    falseCalls: t.u32(),
    at: t.string(),
  },
);

const spacetimedb = schema({ card, prompt, score });

export default spacetimedb;

spacetimedb.init((ctx) => {
  for (const row of CARDS) {
    ctx.db.card.insert({
      id: row.id,
      encoding: row.encoding,
      glyph: row.glyph,
      value: row.value,
      name: row.name,
      flavor: row.flavor,
      rarity: row.rarity,
    });
  }
  for (const row of PROMPTS) {
    ctx.db.prompt.insert({
      id: row.id,
      text: row.text,
      answer: row.answer,
      category: row.category,
      hint: row.hint,
    });
  }
});

export const record_score = spacetimedb.reducer(
  {
    id: t.string(),
    name: t.string(),
    won: t.bool(),
    rounds: t.u32(),
    health: t.u32(),
    correctCalls: t.u32(),
    falseCalls: t.u32(),
    at: t.string(),
  },
  (ctx, args) => {
    ctx.db.score.insert(args);
  },
);

# Last Bit Standing

A last-player-standing card game about **binary, hex, and ASCII**. You sit at a table with five bot agents. Each round a prompt hits the felt. Everyone answers with one of seven encoding cards. The bots get faster. You win if you still have at least 1 of 3 lives and every bot has lost all 3.

## How a round works

1. Six seats. You plus Clippy, Hexa, Bitwise, ASCII-8, and NullPtr. Everyone has **3 lives** and is dealt **7 cards**. Lives carry from round to round.
2. A prompt appears (bits in a byte, ASCII for `A`, HTTP 404, states in the union, …).
3. Each card shows an encoding on top and Magic-style flavor text underneath. The flavor hints at the value without spelling out the answer. Example: binary `0011 0010` with *“You will use this number to describe the amount of states in the United States.”*
4. Some cards in the shuffle are better matches than others. Exact encodings score. Near-misses (off-by-one, doubled values, an ASCII digit that only *looks* like the answer) are traps.
5. After the plays, tap any bot whose answer is wrong. That bot loses 1 life. Tap a bot who was right, or play the wrong card yourself, and **you** lose 1 life. Wrong bots you skip keep their lives.
6. A player at 0 lives stays on the felt, darkened, with their last play showing. You win with at least 1 life left after every bot is out. Each round the timer shrinks and the bots answer faster.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Cards and scores (SpacetimeDB)

The live game reads a **Spacetime-shaped catalog** of cards, prompts, and scores.

- Out of the box it uses the bundled seed (`src/lib/catalog.ts`) plus browser scores, so the table is playable on Vercel with no extra service.
- Optional: publish the module in `spacetimedb/` and point the app at your database:

```bash
# Install the SpacetimeDB CLI, then from this repo:
spacetime publish last-bit-standing --project-path spacetimedb
```

```bash
NEXT_PUBLIC_SPACETIMEDB_HOST=wss://maincloud.spacetimedb.com
NEXT_PUBLIC_SPACETIMEDB_DB_NAME=last-bit-standing
```

After generate/bindings, the same `card`, `prompt`, and `score` tables are the source of truth.

## Deploy on Vercel

```bash
npx vercel login
npx vercel --yes --prod --name last-bit-standing
```

No required environment variables. Add the SpacetimeDB host/name above only if you published the module.

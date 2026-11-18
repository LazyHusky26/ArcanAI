# ArcanAI

An AI tarot reader.

You ask a question, pick a spread (1, 3 or 5 cards) and how long you want the reading to be. The code draws the cards. It then looks up what each card means in a database and gives those notes to Gemini, which writes the reading and streams it to the page.

## How it works

1. **Draw.** Plain Python picks the cards and decides which are reversed. The AI never chooses cards.
2. **Retrieve.** For each card, the app searches a Postgres database (pgvector) for the most relevant notes, using a local embedding model (Qwen3-Embedding-0.6B).
3. **Write.** One call to Gemini with the question, the cards and the notes. The reply streams to the browser.

## Stack

- Backend: Python, FastAPI, psycopg 3, sentence-transformers (managed with `uv`)
- Database: Postgres + pgvector, in Docker
- LLM: Google Gemini
- Frontend: React, Vite, TypeScript, framer-motion

## Setup

You need Docker, [uv](https://docs.astral.sh/uv/), Node 20+, and a free Gemini API key from https://aistudio.google.com/apikey. A GPU helps for embedding but isn't required.

**1. Install**

From the repo root:

```
npm run setup
```

This installs the root, frontend and backend packages.

**2. Database**

```
docker run -d --name tarot-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tarot -p 5433:5432 -v tarot-data:/var/lib/postgresql pgvector/pgvector:pg18
```

**3. Config (optional)**

A `.env` file isn't needed. The defaults work with the Docker command above. Copy `.env.example` to `.env` only if you want to change the database address or the embedding model.

Your Gemini key isn't set here, it's set in the app (see Settings below).

**4. Data**

The card text isn't in this repo, so you need to add your own to `data/`. I used these sources:

- [Tarotoo](https://tarotoo.com): modern meanings, keywords, love, career
- [StarTarot](https://startarot.com): Waite's divinatory meanings and Golden Dawn correspondences
- *The Pictorial Key to the Tarot* by A. E. Waite (1911, public domain), from [sacred-texts.com](https://sacred-texts.com)

Expected layout:

- `tartoo.jsonl`: one JSON object per line, one per card
- `startarot.jsonl`: one JSON object per line, one per card
- `waite/`: `major_arcana.txt`, `wands.txt`, `cups.txt`, `swords.txt`, `pentacles.txt`. One card per block, blocks separated by a blank line.

You don't have to use the same sources. `backend/src/arcanai/loaders.py` shows the exact fields each file needs, so you can write a loader for your own.

**5. Build the knowledge base** (from `backend/`)

```
uv run python -m arcanai.migrate
uv run python -m arcanai.seed_cards
uv run python -m arcanai.ingest
```

The first ingest downloads the embedding model (about 1.2 GB) into `models/`. Ingest wipes and rebuilds the chunks, so you can re-run it any time.

**6. Run**

From the repo root:

```
npm run dev
```

This starts the backend (port 8000) and the frontend (port 5173) together. Open http://localhost:5173. To run them separately, use `uv run uvicorn arcanai.api:app --reload` in `backend/` and `npm run dev` in `frontend/`.

## Settings

Click the gear icon (top right):

- **API key:** paste your Gemini key and press Check. If Gemini accepts it, it's saved.
- **Model:** pick from the Gemini text models your key can use.
- **Smoke cursor:** turn the cursor effect on or off.

Everything is saved in `data/settings.json` on the machine running the backend, which is gitignored. The key is never sent back to the browser. You need to add a key here before your first reading.

## Handy commands

From `backend/`:

```
uv run python -m arcanai.read "your question" --spread three_card --depth quick   # full reading in the terminal (needs the key from Settings)
uv run python -m arcanai.prompt "your question" --system                          # print the prompt, no LLM call
uv run python -m arcanai.retrieval "The Tower" reversed "my job"                  # try retrieval on its own
```

To work on the UI without the backend, create `frontend/.env` with `VITE_USE_MOCK=true`. It uses fake cards and a fake reading.

## Card art

The cards are Persona-style (cuz why not). 

Card images go in `frontend/public/cards/` as `.webp`: `back.webp` plus `major/`, `wands/`, `cups/`, `swords/`, `pentacles/`, named like `the-fool.webp` or `ace-of-wands.webp`. A card with no image shows its name instead.

## Notes

- Tarot here is for reflection, not prediction. The prompt tells the model to be honest about hard cards and not to give medical, legal or financial advice.
- Reversed cards are the same image rotated 180 degrees.

## License

MIT

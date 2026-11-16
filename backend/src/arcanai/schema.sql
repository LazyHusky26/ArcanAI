-- Turns on pgvector (adds the "vector" column type); safe to run twice
CREATE EXTENSION IF NOT EXISTS vector;

-- One row per tarot card (78 rows): facts only, no long text
CREATE TABLE IF NOT EXISTS cards (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,        -- "The Fool", "Ace of Wands"
    arcana        TEXT NOT NULL CHECK (arcana IN ('major', 'minor')),
    suit          TEXT,                        -- NULL for major arcana
    rank          TEXT,                        -- Ace, Two... King; NULL for major
    number        INT,                         -- 0-21 for major, 1-14 for minor
    element       TEXT,
    planet        TEXT,
    zodiac        TEXT,
    hebrew_letter TEXT,
    gd_title      TEXT                         -- Golden Dawn title
);

-- One row per piece of knowledge text, plus its vector
CREATE TABLE IF NOT EXISTS chunks (
    id          BIGSERIAL PRIMARY KEY,
    card_id     INT REFERENCES cards(id) ON DELETE CASCADE,  -- NULL = not about one card
    source      TEXT NOT NULL,                 -- tarotoo / startarot / waite
    orientation TEXT CHECK (orientation IN ('upright', 'reversed')),  -- NULL = both
    category    TEXT NOT NULL,                 -- general, love, career, ...
    content     TEXT NOT NULL,                 -- the text the LLM will read
    embedding   vector({dim}) NOT NULL         -- the meaning of that text as numbers
);

-- Fast filter: "this card, this orientation, this category"
CREATE INDEX IF NOT EXISTS chunks_filter_idx ON chunks (card_id, orientation, category);

-- Fast similarity search; cosine because our vectors are normalized
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);

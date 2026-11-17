import time

import numpy as np
import psycopg
from pgvector.psycopg import register_vector

from arcanai import config
from arcanai.chunker import build_chunks
from arcanai.embedder import embed_documents

INSERT = """
INSERT INTO chunks (card_id, source, orientation, category, content, embedding)
VALUES (%s, %s, %s, %s, %s, %s)
"""


def main() -> None:
    chunks = build_chunks()
    print(f"{len(chunks)} chunks built; embedding (first run loads the model)...")
    t = time.time()
    vectors = embed_documents([c["content"] for c in chunks])  # same order as chunks
    print(f"Embedded in {time.time() - t:.1f}s")

    with psycopg.connect(config.DATABASE_URL) as conn:
        register_vector(conn)  # lets psycopg send/receive the vector type
        ids = {name: i for i, name in conn.execute("SELECT id, name FROM cards").fetchall()}
        rows = [
            (ids[c["card"]], c["source"], c["orientation"], c["category"], c["content"], np.array(v))
            for c, v in zip(chunks, vectors)
        ]
        # Wipe first so re-running never creates duplicates; one transaction, so all-or-nothing
        conn.execute("TRUNCATE chunks RESTART IDENTITY")
        conn.cursor().executemany(INSERT, rows)
    print(f"Inserted {len(rows)} chunks")


if __name__ == "__main__":
    main()

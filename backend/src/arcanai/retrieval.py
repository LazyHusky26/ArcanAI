import argparse

import numpy as np
import psycopg
from pgvector.psycopg import register_vector

from arcanai import config
from arcanai.embedder import embed_query

SQL = """
SELECT c.source, c.orientation, c.category, c.content, 1 - (c.embedding <=> %(q)s) AS score
FROM chunks c JOIN cards d ON d.id = c.card_id
WHERE d.name = %(card)s
  AND (c.orientation = %(orientation)s OR c.orientation IS NULL)
  AND (%(category)s::text IS NULL OR c.category = %(category)s)
  AND c.source = %(source)s
ORDER BY c.embedding <=> %(q)s
LIMIT %(k)s
"""

# Best N per source, so the reading always gets modern + Waite + Golden Dawn views
PER_SOURCE = {"tarotoo": 3, "waite": 2, "startarot": 2}


def retrieve(card: str, orientation: str, question: str, category: str | None = None) -> list[dict]:
    # Templated query: card + orientation + the user's question, embedded with the "query" prompt
    q = np.array(embed_query(f"{card} ({orientation}): {question}"))
    out = []
    with psycopg.connect(config.DATABASE_URL) as conn:
        register_vector(conn)
        for source, k in PER_SOURCE.items():
            cur = conn.execute(SQL, {"q": q, "card": card, "orientation": orientation,
                                     "category": category, "source": source, "k": k})
            cols = [d.name for d in cur.description]
            out += [dict(zip(cols, row)) for row in cur.fetchall()]
    return out


if __name__ == "__main__":
    # Try it: python -m arcanai.retrieval "The Tower" reversed "will my relationship last?"
    p = argparse.ArgumentParser()
    p.add_argument("card")
    p.add_argument("orientation", choices=["upright", "reversed"])
    p.add_argument("question")
    p.add_argument("--category")
    a = p.parse_args()
    for r in retrieve(a.card, a.orientation, a.question, a.category):
        print(f"{r['score']:.3f}  [{r['source']}/{r['orientation'] or 'both'}/{r['category']}]  {r['content'][:130]}")

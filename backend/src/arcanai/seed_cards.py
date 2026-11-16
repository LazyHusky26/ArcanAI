import psycopg

from arcanai import config
from arcanai.loaders import load_startarot, load_tartoo

# Upsert: insert a new card, or update it if the name already exists (safe to re-run)
SQL = """
INSERT INTO cards (name, arcana, suit, rank, number, element, planet, zodiac, hebrew_letter, gd_title)
VALUES (%(name)s, %(arcana)s, %(suit)s, %(rank)s, %(number)s, %(element)s, %(planet)s, %(zodiac)s,
        %(hebrew_letter)s, %(gd_title)s)
ON CONFLICT (name) DO UPDATE SET
    arcana = EXCLUDED.arcana, suit = EXCLUDED.suit, rank = EXCLUDED.rank, number = EXCLUDED.number,
    element = EXCLUDED.element, planet = EXCLUDED.planet, zodiac = EXCLUDED.zodiac,
    hebrew_letter = EXCLUDED.hebrew_letter, gd_title = EXCLUDED.gd_title
"""


def build_rows() -> list[dict]:
    # Join the two sources by card name: Tarotoo gives element/planet/zodiac, StarTarot the rest
    modern = {r["name"]: r for r in load_tartoo()}
    rows = []
    for s in load_startarot():
        m = modern[s["name"]]
        c = s["correspondence"]
        rows.append({
            "name": s["name"],
            "arcana": s["arcana"],
            "suit": s["suit"],
            # StarTarot leaves rank empty for numbered cards; take it from the name ("Five of Cups")
            "rank": s["rank"] or (s["name"].split(" of ")[0] if s["arcana"] == "minor" else None),
            "number": s["number"],
            "element": m["element"],
            "planet": m["planet"],
            "zodiac": m["zodiac"],
            "hebrew_letter": c["hebrew_letter"],
            "gd_title": c["title"],
        })
    return rows


def main() -> None:
    rows = build_rows()
    with psycopg.connect(config.DATABASE_URL) as conn:
        conn.cursor().executemany(SQL, rows)
    print(f"Seeded {len(rows)} cards")


if __name__ == "__main__":
    main()

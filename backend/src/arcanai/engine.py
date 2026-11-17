import json
import random
from pathlib import Path

import psycopg

from arcanai import config

SPREADS = json.loads((Path(__file__).parent / "spreads.json").read_text(encoding="utf-8"))


def _deck() -> list[str]:
    # All 78 card names from the cards table
    with psycopg.connect(config.DATABASE_URL) as conn:
        return [r[0] for r in conn.execute("SELECT name FROM cards ORDER BY id")]


def draw(spread_id: str, reversal_chance: float = config.REVERSAL_CHANCE) -> list[dict]:
    # Plain code does the drawing; the LLM never chooses or changes cards
    spread = SPREADS[spread_id]
    cards = random.sample(_deck(), len(spread["positions"]))  # shuffled, no repeats
    return [
        {
            "position": pos["name"],
            "position_meaning": pos["meaning"],
            "card": card,
            "orientation": "reversed" if random.random() < reversal_chance else "upright",
        }
        for pos, card in zip(spread["positions"], cards)
    ]


if __name__ == "__main__":
    # Quick check: draw each spread once
    for sid in SPREADS:
        print(f"\n{SPREADS[sid]['name']}")
        for d in draw(sid):
            print(f"  {d['position']:18} {d['card']} ({d['orientation']})")

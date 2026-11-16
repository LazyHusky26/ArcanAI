import json
import re
from pathlib import Path

from arcanai import config

DATA = config.ROOT / "data"


def _jsonl(path: Path) -> list[dict]:
    # One JSON object per line
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def load_tartoo() -> list[dict]:
    return _jsonl(DATA / "tartoo.jsonl")


def load_startarot() -> list[dict]:
    return _jsonl(DATA / "startarot.jsonl")


ROMAN = {"0": 0, "I": 1, "V": 5, "X": 10, "L": 50}


def _roman(s: str) -> int:
    # "XIV" -> 14: subtract a letter if a bigger one follows it
    vals = [ROMAN[c] for c in s]
    return sum(-v if i + 1 < len(vals) and v < vals[i + 1] else v for i, v in enumerate(vals))


def _split_meanings(body: str) -> dict:
    # Source text misspells it "Divanatory" once, so accept both
    parts = re.split(r"Div[ia]natory Meanings:", body, maxsplit=1)
    description = parts[0].strip()
    if len(parts) == 1:
        return {"description": description, "upright": None, "reversed": None}
    up, _, rev = parts[1].partition("Reversed:")
    return {"description": description, "upright": up.strip(), "reversed": rev.strip() or None}


def load_waite() -> list[dict]:
    # Returns one record per card: name, description, upright, reversed
    # Majors are matched to deck names by number; suit cards by rank + filename
    deck = {r["numeric_id"]: r["name"] for r in load_startarot() if r["arcana"] == "major"}
    out = []
    for path in sorted((DATA / "waite").glob("*.txt")):
        blocks = [b.split("\n") for b in re.split(r"\n\s*\n", path.read_text(encoding="utf-8").strip()) if b.strip()]
        for b in blocks:
            if path.stem == "major_arcana":
                name = deck[_roman(b[0].strip())]  # b = [numeral, title, text]
            else:
                name = f"{b[0].strip()} of {path.stem.capitalize()}"  # b = [rank, text]
            out.append({"name": name, **_split_meanings(b[-1])})
    return out


if __name__ == "__main__":
    # Quick check: counts and one sample of each
    for label, rows in [("tartoo", load_tartoo()), ("startarot", load_startarot()), ("waite", load_waite())]:
        print(f"{label}: {len(rows)} cards, e.g. {rows[0]['name']}")
    w = {r["name"]: r for r in load_waite()}
    for n in ("The Fool", "Strength", "Judgement", "Five of Cups", "King of Wands"):
        r = w[n]
        print(f"\n{n}: desc={r['description'][:60]!r} up={str(r['upright'])[:40]!r} rev={str(r['reversed'])[:40]!r}")

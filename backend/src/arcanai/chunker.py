from collections import Counter

from arcanai.loaders import load_startarot, load_tartoo, load_waite


def _chunk(card, source, orientation, category, text):
    # Label the text with card/orientation/category so even a short phrase has context
    label = f"{card} ({orientation or 'upright or reversed'}), {category}"
    return {"card": card, "source": source, "orientation": orientation, "category": category,
            "content": f"{label}: {text.strip()}"}


def _correspondence(c: dict) -> str:
    # Turn the Golden Dawn fields into one readable sentence, skipping empty ones
    parts = [f"Golden Dawn title: {c['title']}", f"attribution: {c['value']}"]
    for key, label in [("hebrew_letter", "Hebrew letter"), ("planet", "planet"), ("zodiac", "zodiac")]:
        if c.get(key):
            parts.append(f"{label}: {c[key]}")
    if c.get("degree_start") is not None:
        parts.append(f"degrees: {c['degree_start']} to {c['degree_end']}")
    return "; ".join(parts) + "."


def build_chunks() -> list[dict]:
    chunks = []
    both = [("upright", ""), ("reversed", "_reversed")]

    # Tarotoo: modern meanings; reversed fields end in "_reversed" (upright/reversed meaning is named differently)
    for t in load_tartoo():
        n = t["name"]
        for orient, suffix in both:
            fields = [
                ("general", t[f"meaning_{orient}"]),
                ("love", t[f"love{suffix}"]),
                ("career", t[f"career{suffix}"]),
                ("mood", t[f"mood{suffix}"]),
                ("spirituality", t[f"spiritual{suffix}"]),
                ("yesno", f"If asked a yes/no question, the answer is {t['yes_no' + suffix]}."),
            ]
            for category, text in fields:
                if text:
                    chunks.append(_chunk(n, "tarotoo", orient, category, text))

    # StarTarot: Waite's short meanings + Golden Dawn correspondences
    for s in load_startarot():
        n, d = s["name"], s["divinatory_meanings"]
        for orient in ("upright", "reversed"):
            if d[orient]:
                chunks.append(_chunk(n, "startarot", orient, "general", d[orient]))
            if d[f"additional_{orient}"]:
                chunks.append(_chunk(n, "startarot", orient, "general", "Another account says: " + d[f"additional_{orient}"]))
        chunks.append(_chunk(n, "startarot", None, "correspondence", _correspondence(s["correspondence"])))

    # Waite: long description (both orientations) + his meanings for suit cards
    for w in load_waite():
        n = w["name"]
        chunks.append(_chunk(n, "waite", None, "symbolism", w["description"]))
        for orient in ("upright", "reversed"):
            if w[orient]:
                chunks.append(_chunk(n, "waite", orient, "general", w[orient]))
    return chunks


if __name__ == "__main__":
    # Quick check: totals, a count per source/category, and a few samples
    cs = build_chunks()
    print(f"{len(cs)} chunks, longest {max(len(c['content']) for c in cs)} chars")
    for k, v in sorted(Counter((c["source"], c["category"]) for c in cs).items()):
        print(f"  {k[0]:10} {k[1]:15} {v}")
    for card, src, cat, o in [("The Tower", "tarotoo", "love", "reversed"), ("Ace of Wands", "startarot", "correspondence", None),
                              ("Five of Cups", "startarot", "general", "reversed"), ("The Fool", "waite", "symbolism", None)]:
        c = next(x for x in cs if (x["card"], x["source"], x["category"], x["orientation"]) == (card, src, cat, o))
        print("\n" + c["content"][:230])

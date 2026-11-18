import argparse

from arcanai.engine import SPREADS, draw
from arcanai.retrieval import retrieve

SYSTEM = """You are an honest tarot reader writing a reading for someone who asked a question.

Rules:
- The cards, positions and orientations were drawn by a program. Never change, add, remove or reorder them.
- Base each card's meaning on the REFERENCE NOTES provided. Do not invent meanings that are not in the notes.
- Honour each card's orientation and its position in the spread, and tie it to the person's actual question and situation.
- Be honest, not flattering. If a card is difficult (loss, conflict, endings, blocked or reversed cards), say so plainly, with care and never cruelty. Do not turn a warning into false comfort.
- Tarot is for reflection, not prediction. Never claim certainty about the future, and never give medical, legal or financial instructions.

LANGUAGE (very important):
- Write in plain, everyday words, as if explaining to a friend. Short sentences. Speak to the person as "you".
- No jargon and no abstract or mystical phrasing (avoid things like "emotional mastery", "archetype", "cosmic energy", "the querent"). If a tarot word is unavoidable, explain it in a few simple words.
- Say what the card means for this person's situation, in concrete terms. Prefer "you may be avoiding a hard talk" over "a confrontation with the shadow self".
- Never mention your sources or notes (no "Waite", "Golden Dawn", "traditional accounts", "reference notes"). Just say what the card means.
- When you link cards together, say it is your own read of the cards, in plain words.
- Do not repeat the question back, and do not describe the spread layout.

FORMAT: Write Markdown using exactly the headings below, spelled exactly like this. Do not bold or number the headings, and do not add other headings, horizontal lines, emoji, or tables."""

# How long each depth should be
DEPTH = {
    "quick": "Short: about 120-180 words in total.",
    "detailed": "Medium: about 350-500 words in total.",
    "deep": "Long: about 700-1000 words in total.",
}

CARD_HEADING = "### <Position name>: <Card name> (<upright or reversed>)"


def format_rules(depth: str, n_cards: int) -> str:
    # The exact outline to follow; it changes with the depth and the number of cards
    multi = n_cards > 1
    connect = "## How the Cards Connect\n(a short paragraph on how the cards relate)\n\n" if multi else ""
    if depth == "quick":
        return (
            "\n\nUse exactly this outline (no overview):\n\n"
            f"## The Cards\n{CARD_HEADING}\n(2-3 short sentences. Repeat for every card, in order.)\n\n"
            + ("## How the Cards Connect\n(1-2 sentences)\n\n" if multi else "")
            + "## Advice\n(1-2 sentences of practical advice)"
        )
    if depth == "detailed":
        return (
            "\n\nUse exactly this outline:\n\n"
            "## Overview\n(2-3 sentences setting the scene)\n\n"
            f"## The Cards\n{CARD_HEADING}\n(1-2 short paragraphs. Repeat for every card, in order.)\n\n"
            + connect
            + "## Advice\n(one paragraph of practical advice)"
        )
    return (
        "\n\nUse exactly this outline:\n\n"
        "## Overview\n(one short paragraph setting the scene)\n\n"
        f"## The Cards\n{CARD_HEADING}\n(2-3 paragraphs: what the card means, how it shows up in the person's situation, and "
        "what to watch for. Repeat for every card, in order.)\n\n"
        + (
            "## How the Cards Connect\n(two paragraphs: themes, tensions, and what the cards say together)\n\n" if multi else ""
        )
        + "## Advice\n(a short paragraph, then 3-4 concrete steps as a bulleted list)"
    )


SOURCE_NAMES = {"tarotoo": "modern", "waite": "Waite (1911)", "startarot": "Golden Dawn / Waite"}


def _notes(card: str, orientation: str, question: str) -> str:
    # Retrieve notes, drop duplicates (same text from two sources), group by source
    seen, by_source = set(), {}
    for r in retrieve(card, orientation, question):
        text = r["content"].split(": ", 1)[1]  # strip the "Card (orientation), category:" label
        if text in seen:
            continue
        seen.add(text)
        by_source.setdefault(r["source"], []).append(f"[{r['category']}] {text}")
    return "\n".join(
        f"  {SOURCE_NAMES[s]}:\n" + "\n".join(f"    - {n}" for n in notes) for s, notes in by_source.items()
    )


MAX_QUESTION = 500


def clean_question(question: str) -> str:
    # Trim spaces; reject empty or very long questions
    question = " ".join(question.split())
    if not question:
        raise ValueError("Please enter a question.")
    if len(question) > MAX_QUESTION:
        raise ValueError(f"Question is too long ({len(question)} characters; the limit is {MAX_QUESTION}).")
    return question


def build_prompt(question: str, spread_id: str, drawn: list[dict], depth: str = "detailed") -> dict:
    # Returns the system rules and the user message separately (Gemini takes both)
    question = clean_question(question)
    blocks = []
    for i, d in enumerate(drawn, 1):
        blocks.append(
            f"Position {i}: {d['position']} ({d['position_meaning']})\n"
            f"Card: {d['card']}, {d['orientation']}\n"
            f"Reference notes:\n{_notes(d['card'], d['orientation'], question)}"
        )
    user = (
        f"Question: {question}\n"
        f"Spread: {SPREADS[spread_id]['name']}\n"
        f"Length: {DEPTH[depth]}\n\n" + "\n\n".join(blocks)
    )
    return {"system": SYSTEM + format_rules(depth, len(drawn)), "user": user}


if __name__ == "__main__":
    # Draw cards and print the finished prompt, without calling any LLM
    p = argparse.ArgumentParser()
    p.add_argument("question")
    p.add_argument("--spread", default="three_card", choices=list(SPREADS))
    p.add_argument("--depth", default="detailed", choices=list(DEPTH))
    p.add_argument("--system", action="store_true", help="print the system rules too")
    a = p.parse_args()
    out = build_prompt(a.question, a.spread, draw(a.spread), a.depth)
    if a.system:
        print(out["system"] + "\n\n--- USER MESSAGE ---\n")
    print(out["user"])

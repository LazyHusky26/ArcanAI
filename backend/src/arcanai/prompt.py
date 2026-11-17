import argparse

from arcanai.engine import SPREADS, draw
from arcanai.retrieval import retrieve

SYSTEM = """You are an honest, insightful tarot reader writing a reading for someone who asked a question.

Rules:
- The cards, positions and orientations were drawn by a program. Never change, add, remove or reorder them.
- Base each card's meaning on the REFERENCE NOTES provided. Do not invent traditional meanings that are not in the notes.
- You may notice connections between cards (shared themes, tensions, Major vs Minor emphasis). When you do, make clear this is your own synthesis, not a documented tradition.
- Honour each card's orientation and its position in the spread, and relate it to the person's question.
- Notes come from different sources: "modern" is gentle and practical; "Waite" and "Golden Dawn" are historical and often harsher. Use the historical wording as context, not as a literal prediction.
- Be honest, not flattering. Do not force positivity: if the cards are difficult (loss, conflict, endings, blocked or reversed cards), say so plainly. Deliver hard messages with care and respect, never cruelty, and never turn a warning into false comfort.
- Tarot is for reflection, not prediction. Never claim certainty about the future, and never give medical, legal or financial instructions.
- Write in plain, vivid language. Speak to the person as "you".

Structure the reading with these headings:
1. Overview
2. The Cards (one section per position, in order)
3. How the Cards Connect
4. Advice
"""

DEPTH = {
    "quick": "Keep it short: 2-3 sentences per card, then a brief connection and advice.",
    "detailed": "Write 1-2 paragraphs per card, then a full paragraph each for the connections and the advice.",
    "deep": "Go deep: several paragraphs per card covering symbolism and context, a thorough look at how the cards relate, and detailed, practical advice.",
}

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
    return {"system": SYSTEM, "user": user}


if __name__ == "__main__":
    # Draw cards and print the finished prompt, without calling any LLM
    p = argparse.ArgumentParser()
    p.add_argument("question")
    p.add_argument("--spread", default="three_card", choices=list(SPREADS))
    p.add_argument("--depth", default="detailed", choices=list(DEPTH))
    a = p.parse_args()
    out = build_prompt(a.question, a.spread, draw(a.spread), a.depth)
    print(out["user"])

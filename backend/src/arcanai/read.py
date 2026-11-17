import argparse

from arcanai.engine import SPREADS, draw
from arcanai.llm import LLMError, stream_reading
from arcanai.prompt import DEPTH, build_prompt, clean_question


def main() -> None:
    p = argparse.ArgumentParser(description="Get a tarot reading")
    p.add_argument("question")
    p.add_argument("--spread", default="three_card", choices=list(SPREADS))
    p.add_argument("--depth", default="detailed", choices=list(DEPTH))
    a = p.parse_args()

    try:
        question = clean_question(a.question)  # check the question before drawing anything
        drawn = draw(a.spread)  # 1. code draws the cards
        print(f"\n{SPREADS[a.spread]['name']}: {question}\n")
        for d in drawn:
            print(f"  {d['position']:18} {d['card']} ({d['orientation']})")
        print()

        prompt = build_prompt(question, a.spread, drawn, a.depth)  # 2. retrieve notes + build prompt
        for piece in stream_reading(prompt["system"], prompt["user"]):  # 3. Gemini writes the reading
            print(piece, end="", flush=True)
        print()
    except (ValueError, LLMError) as e:
        raise SystemExit(f"\nError: {e}")


if __name__ == "__main__":
    main()

from collections.abc import Iterator

from google import genai
from google.genai import types

from arcanai import config


def stream_reading(system: str, user: str) -> Iterator[str]:
    # Sends the prompt to Gemini and yields the reading in pieces as it is written
    if not config.LLM_API_KEY or not config.LLM_MODEL:
        raise SystemExit("Set LLM_MODEL and LLM_API_KEY in .env (copy .env.example) first.")
    client = genai.Client(api_key=config.LLM_API_KEY)
    stream = client.models.generate_content_stream(
        model=config.LLM_MODEL,
        contents=user,
        config=types.GenerateContentConfig(system_instruction=system),
    )
    for chunk in stream:
        if chunk.text:
            yield chunk.text

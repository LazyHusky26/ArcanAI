from collections.abc import Iterator

from google import genai
from google.genai import errors, types

from arcanai import config

TIMEOUT_MS = 60_000  # give up if Gemini doesn't answer within 60s


class LLMError(Exception):
    """A problem talking to Gemini, with a message safe to show the user."""


def _explain(e: Exception) -> str:
    # Turn raw API errors into one plain sentence
    if isinstance(e, errors.APIError):
        return {
            400: "Gemini rejected the request (check LLM_MODEL and LLM_API_KEY in .env).",
            403: "Gemini rejected your API key (check LLM_API_KEY in .env).",
            404: f"Model '{config.LLM_MODEL}' was not found (check LLM_MODEL in .env).",
            429: "Gemini quota or rate limit reached. Wait a bit or try another model.",
            503: f"Model '{config.LLM_MODEL}' is overloaded right now. Try again or pick another in .env.",
        }.get(e.code, f"Gemini returned an error ({e.code}).")
    return f"Could not get an answer from Gemini within {TIMEOUT_MS // 1000}s. The model may be busy; try again or pick another in .env."


def stream_reading(system: str, user: str) -> Iterator[str]:
    # Sends the prompt to Gemini and yields the reading in pieces as it is written
    if not config.LLM_API_KEY or not config.LLM_MODEL:
        raise LLMError("Set LLM_MODEL and LLM_API_KEY in .env (copy .env.example) first.")
    # v1beta is needed for system_instruction (older models' stable v1 API rejects it)
    client = genai.Client(
        api_key=config.LLM_API_KEY,
        http_options=types.HttpOptions(api_version="v1beta", timeout=TIMEOUT_MS),
    )
    try:
        stream = client.models.generate_content_stream(
            model=config.LLM_MODEL,
            contents=user,
            config=types.GenerateContentConfig(system_instruction=system),
        )
        for chunk in stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        raise LLMError(_explain(e)) from e

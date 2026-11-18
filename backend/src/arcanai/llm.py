import json
import logging
import urllib.error
import urllib.request
from collections.abc import Iterator

from google import genai
from google.genai import errors, types

from arcanai import settings

TIMEOUT_MS = 60_000  # give up if Gemini doesn't answer within 60s
LIST_TIMEOUT_S = 20  # listing models should be quick
log = logging.getLogger("uvicorn.error")  # shows up in the backend terminal
MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000"

# Models that can write text replies, not these kinds
NOT_TEXT = ("embedding", "image", "tts", "audio", "live", "robotics", "computer-use", "imagen", "veo", "aqa")


class LLMError(Exception):
    """A problem talking to Gemini, with a message safe to show the user."""


def _explain(e: Exception) -> str:
    # Turn raw API errors into one plain sentence
    if isinstance(e, errors.APIError):
        return {
            400: "Gemini rejected the request. Check your API key and model in Settings (top right).",
            403: "Gemini rejected your API key. Check it in Settings (top right).",
            404: f"Model '{settings.model()}' was not found. Pick another in Settings (top right).",
            429: "Gemini quota or rate limit reached. Wait a bit or pick another model in Settings.",
            503: f"Model '{settings.model()}' is overloaded right now. Try again or pick another in Settings.",
        }.get(e.code, f"Gemini returned an error ({e.code}).")
    if isinstance(e, TimeoutError) or "timeout" in type(e).__name__.lower():
        return f"Gemini didn't answer within {TIMEOUT_MS // 1000}s. The model may be busy; try again or pick another in Settings."
    return f"Could not reach Gemini ({type(e).__name__}). Check your internet connection."


def _client(api_key: str) -> genai.Client:
    # v1beta is needed for system_instruction (older models' stable v1 API rejects it)
    return genai.Client(api_key=api_key, http_options=types.HttpOptions(api_version="v1beta", timeout=TIMEOUT_MS))


def list_models(api_key: str) -> list[dict]:
    # Doubles as the key check: Gemini only lists models for a valid key
    # (plain HTTP instead of the SDK, so errors are clear; the key goes in a header, not the URL)
    req = urllib.request.Request(MODELS_URL, headers={"x-goog-api-key": api_key})
    try:
        with urllib.request.urlopen(req, timeout=LIST_TIMEOUT_S) as res:
            data = json.load(res)
    except urllib.error.HTTPError as e:
        if e.code in (400, 401, 403):
            raise LLMError("Gemini didn't accept that API key.") from e
        log.warning("Listing models returned %s", e.code)
        raise LLMError(f"Gemini returned an error ({e.code}) when listing models.") from e
    except (TimeoutError, urllib.error.URLError) as e:
        log.warning("Listing models failed: %r", e)
        if isinstance(e, TimeoutError) or isinstance(getattr(e, "reason", None), TimeoutError):
            raise LLMError(f"Gemini didn't answer within {LIST_TIMEOUT_S}s. Check your internet connection and try again.") from e
        raise LLMError(f"Could not reach Gemini ({type(e).__name__}). Check your internet connection.") from e
    out = []
    for m in data.get("models", []):
        mid = m.get("name", "").removeprefix("models/")
        if "generateContent" not in m.get("supportedGenerationMethods", []):
            continue
        if not mid.startswith("gemini") or any(w in mid for w in NOT_TEXT):
            continue
        out.append({"id": mid, "name": m.get("displayName") or mid})
    return sorted(out, key=lambda m: m["name"])


def stream_reading(system: str, user: str) -> Iterator[str]:
    # Sends the prompt to Gemini and yields the reading in pieces as it is written
    key, model = settings.api_key(), settings.model()
    if not key:
        raise LLMError("Add your Gemini API key in Settings (top right) first.")
    if not model:
        raise LLMError("Pick a model in Settings (top right) first.")
    try:
        stream = _client(key).models.generate_content_stream(
            model=model,
            contents=user,
            config=types.GenerateContentConfig(system_instruction=system),
        )
        for chunk in stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        log.warning("Gemini call failed: %r", e)
        raise LLMError(_explain(e)) from e

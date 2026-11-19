import json
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from arcanai import embedder, settings
from arcanai.engine import SPREADS, draw
from arcanai.llm import LLMError, list_models, stream_reading
from arcanai.prompt import DEPTH, build_prompt, clean_question


@asynccontextmanager
async def lifespan(app: FastAPI):
    embedder._model()  # load Qwen once at startup so the first reading isn't slow
    yield


app = FastAPI(title="ArcanAI", lifespan=lifespan)

# Only answer requests addressed to localhost. This blocks DNS rebinding, where a website
# points its own domain at 127.0.0.1 to talk to this API from the user's browser.
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])

# Let the React dev server (Vite, port 5173) call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReadingRequest(BaseModel):
    question: str
    spread: Literal[tuple(SPREADS)]  # only spreads that exist in spreads.json
    depth: Literal[tuple(DEPTH)] = "detailed"


class SettingsUpdate(BaseModel):
    model: str | None = Field(default=None, max_length=100)
    cursor: bool | None = None


class KeyRequest(BaseModel):
    api_key: str = Field(max_length=300)


def _sse(event: str, data) -> str:
    # One Server-Sent Event: a named event plus JSON data, ended by a blank line
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.get("/spreads")
def spreads():
    # Everything the UI needs to show the spread picker
    return [{"id": sid, **s} for sid, s in SPREADS.items()]


@app.post("/reading")
def reading(req: ReadingRequest):
    try:
        question = clean_question(req.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    # No key or model saved (or the key was removed): stop before drawing anything
    if not settings.api_key():
        raise HTTPException(status_code=400, detail="Add your Gemini API key in Settings (top right) first.")
    if not settings.model():
        raise HTTPException(status_code=400, detail="Pick a model in Settings (top right) first.")
    drawn = draw(req.spread)  # code draws the cards
    prompt = build_prompt(question, req.spread, drawn, req.depth)  # retrieve notes + build prompt

    def events():
        yield _sse("cards", drawn)  # UI can flip the cards while the text is still being written
        try:
            for piece in stream_reading(prompt["system"], prompt["user"]):
                yield _sse("text", piece)
            yield _sse("done", {})
        except LLMError as e:
            yield _sse("error", str(e))

    return StreamingResponse(events(), media_type="text/event-stream")


# ---------- Settings (the popup in the UI) ----------
# The API key is only ever written here; it is never sent back to the browser (just the last 4 characters).


@app.get("/settings")
def get_settings():
    saved = settings.load()
    key = settings.api_key()
    return {
        "has_key": bool(key),
        "key_hint": key[-4:] if key else "",
        "model": settings.model(),
        "cursor": saved.get("cursor"),  # null = never chosen
    }


@app.post("/settings/key")
def set_key(req: KeyRequest):
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="Paste your API key first.")
    try:
        models = list_models(key)  # also proves the key works
    except LLMError as e:
        raise HTTPException(status_code=400, detail=str(e))
    settings.save(api_key=key)
    return {"models": models}


@app.delete("/settings/key")
def delete_key():
    settings.save(api_key=None)
    return get_settings()


@app.get("/settings/models")
def get_models():
    key = settings.api_key()
    if not key:
        raise HTTPException(status_code=400, detail="Add your API key first.")
    try:
        return {"models": list_models(key)}
    except LLMError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/settings")
def update_settings(req: SettingsUpdate):
    changes = {k: v for k, v in req.model_dump().items() if v is not None}  # skip what wasn't sent
    settings.save(**changes)
    return get_settings()

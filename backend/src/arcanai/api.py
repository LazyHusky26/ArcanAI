import json
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from arcanai import embedder
from arcanai.engine import SPREADS, draw
from arcanai.llm import LLMError, stream_reading
from arcanai.prompt import DEPTH, build_prompt, clean_question


@asynccontextmanager
async def lifespan(app: FastAPI):
    embedder._model()  # load Qwen once at startup so the first reading isn't slow
    yield


app = FastAPI(title="ArcanAI", lifespan=lifespan)

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

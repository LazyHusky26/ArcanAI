from functools import lru_cache

import torch
from sentence_transformers import SentenceTransformer

from arcanai import config


@lru_cache(maxsize=1)
def _model() -> SentenceTransformer:
    # Loaded once, then reused; fp16 on GPU halves memory use
    device = "cuda" if torch.cuda.is_available() else "cpu"
    kwargs = {"torch_dtype": torch.float16} if device == "cuda" else {}
    return SentenceTransformer(
        config.EMBED_MODEL, device=device, model_kwargs=kwargs, cache_folder=config.MODEL_DIR
    )


def embed_documents(texts: list[str]) -> list[list[float]]:
    # Stored text: no prompt
    vecs = _model().encode(texts, normalize_embeddings=True, batch_size=32)
    return vecs.tolist()


def embed_query(text: str) -> list[float]:
    # Questions get Qwen's built-in "query" instruction; documents must not
    vec = _model().encode(text, prompt_name="query", normalize_embeddings=True)
    return vec.tolist()

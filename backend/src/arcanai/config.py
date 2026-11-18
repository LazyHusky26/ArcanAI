import os
from pathlib import Path

from dotenv import load_dotenv

# .env sits at the repo root, two folders above backend/src/arcanai
ROOT = Path(__file__).resolve().parents[3]
load_dotenv(ROOT / ".env")

# Models download here (inside the repo, gitignored) so deleting the project deletes them
MODEL_DIR = os.getenv("MODEL_DIR", str(ROOT / "models"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/tarot")
EMBED_MODEL = os.getenv("EMBED_MODEL", "Qwen/Qwen3-Embedding-0.6B")
EMBED_DIM = int(os.getenv("EMBED_DIM", "1024"))
# Chance that a drawn card is reversed (0.5 = half the time)
REVERSAL_CHANCE = float(os.getenv("REVERSAL_CHANCE", "0.5"))

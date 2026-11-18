import json

from arcanai import config

# Saved from the Settings popup. data/ is gitignored, so the key never gets committed.
PATH = config.ROOT / "data" / "settings.json"


def load() -> dict:
    try:
        return json.loads(PATH.read_text("utf-8"))
    except (FileNotFoundError, ValueError):
        return {}


def save(**changes) -> None:
    # Pass None to remove a setting
    data = {k: v for k, v in {**load(), **changes}.items() if v is not None}
    PATH.parent.mkdir(exist_ok=True)
    PATH.write_text(json.dumps(data, indent=2), "utf-8")


def api_key() -> str:
    return load().get("api_key", "")


def model() -> str:
    return load().get("model", "")

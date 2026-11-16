from pathlib import Path

import psycopg

from arcanai import config


def main() -> None:
    # Fill the vector size from config so schema and embedder always agree
    sql = (Path(__file__).parent / "schema.sql").read_text().replace("{dim}", str(config.EMBED_DIM))
    with psycopg.connect(config.DATABASE_URL) as conn:
        conn.execute(sql)
    print(f"Schema ready (vector size {config.EMBED_DIM})")


if __name__ == "__main__":
    main()

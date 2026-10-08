"""Build data/words.js from data/words.txt. Run from the repository root."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "words.txt"
TARGET = ROOT / "data" / "words.js"


def main() -> None:
    words = sorted({line.strip().upper() for line in SOURCE.read_text(encoding="utf-8").splitlines() if line.strip()})
    if "SCOUT" not in words:
        raise SystemExit("SCOUT fehlt in data/words.txt")
    bad = [word for word in words if len(word) != 5 or not word.isalpha()]
    if bad:
        raise SystemExit(f"Ungueltige Eintraege: {bad[:5]}")
    body = ",\n".join(f'  "{word}"' for word in words)
    TARGET.write_text(
        "\n".join(
            [
                "/**",
                " * Begrenzte lokale Liste englischer Fuenf-Buchstaben-Woerter.",
                " * Quelle: Donald Knuth, Stanford GraphBase (sgb-words), 5757 Woerter.",
                " * Kein vollstaendiges Woerterbuch. Austauschdatei: data/words.txt",
                " * Neu erzeugen: python scripts/build-words.py",
                " */",
                'export const WORD_LIST_KIND = "limited-sgb";',
                "export const WORDS = new Set([",
                body,
                "]);",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(f"{len(words)} Woerter nach {TARGET.name}")


if __name__ == "__main__":
    main()

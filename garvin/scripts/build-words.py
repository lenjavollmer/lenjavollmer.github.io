"""Build data/words.js from data/words.txt. Run from the repository root."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "words.txt"
TARGET = ROOT / "data" / "words.js"


def upper_de(word: str) -> str:
    return "".join("ß" if char in {"ß", "ẞ"} else char.upper() for char in word)


def main() -> None:
    words = sorted({upper_de(line.strip()) for line in SOURCE.read_text(encoding="utf-8").splitlines() if line.strip()})
    if "KAFFE" not in words:
        raise SystemExit("KAFFE fehlt in data/words.txt")
    allowed = set("ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß")
    bad = [word for word in words if len(word) != 5 or any(letter not in allowed for letter in word)]
    if bad:
        raise SystemExit(f"Ungueltige Eintraege: {bad[:5]}")
    body = ",\n".join(f'  "{word}"' for word in words)
    TARGET.write_text(
        "\n".join(
            [
                "/**",
                " * Begrenzte lokale Liste deutscher Woerter mit fuenf Buchstaben.",
                " * Quellen: wordle-helper/words (Apache-2.0), caco3/wordle-de (MIT;",
                " * Wikipedia-Wortliste und OpenThesaurus). KAFFE ist ergaenzt.",
                " * Kein vollstaendiges Woerterbuch. Austauschdatei: data/words.txt",
                " * Neu erzeugen: python scripts/build-words.py",
                " */",
                'export const WORD_LIST_KIND = "limited-de";',
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

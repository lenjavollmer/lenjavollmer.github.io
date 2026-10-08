# Drei Rätsel zum 28.

Kleine statische Rätsel-Seite für den Geburtstagsmorgen: Wordle, Framed und 3 times 4. Ein Neuladen zeigt wieder die Spielauswahl. Spielstände bleiben nur im Arbeitsspeicher des offenen Tabs und werden nicht gespeichert. Die Seite setzt keine Cookies, kein localStorage und kein Tracking ein.

Die Ausgabe für Maschas 28. Geburtstag liegt im Projektstamm und erscheint unter <https://lenjavollmer.github.io/>. Die Ausgabe für Nis’ 30. Geburtstag liegt unverändert im Ordner `nis/` und bleibt unter <https://lenjavollmer.github.io/nis/> erreichbar. Zum Zurückwechseln die Dateien aus `nis/` (ohne den Ordner `yuna/`) wieder in den Projektstamm kopieren. `nis/` selbst nicht mehr bearbeiten.

GitHub Pages protokolliert beim Aufruf selbst technische Zugriffsdaten, zum Beispiel IP-Adressen, aus Sicherheitsgründen. Die Rätsel-Inhalte liegen im Repository und sind im Seitenquelltext einsehbar.

## Lokal starten

Im Projektordner einen lokalen Server starten und `http://127.0.0.1:8765/` öffnen:

```bash
python -m http.server 8765
```

Module funktionieren nicht zuverlässig, wenn `index.html` direkt als Datei geöffnet wird.

Tests:

```bash
node --test tests/logic.test.mjs
```

## GitHub Pages

Das Repository `lenjavollmer.github.io` veröffentlicht den Branch `main` bereits unter <https://lenjavollmer.github.io/>. Nach dem Push der neuen Dateien erscheint die Rätsel-Auswahl an dieser Adresse. Eine weitere Pages-Einstellung ist nicht nötig.

Die bisherige Yuna-Seite liegt unverändert im Ordner `yuna/` und bleibt unter <https://lenjavollmer.github.io/yuna/> erreichbar. Wer die App früher auf dem Handy gespeichert hat, bekommt beim nächsten Besuch einmal den alten Cache geleert. Zurück zur Yuna-Startseite geht es über den Git-Stand `Yuna Marie-Monat Fix` auf `main`.

Pfade sind relativ, damit die Seite auch unter einem Projektpfad wie `username.github.io/repositoryname/` funktioniert.

## Framed-Bilder

Die Reihenfolge steht in `data/framed.js`. Erwartete Dateien:

1. `framed/01-band.webp`
2. `framed/02-marktplatz.webp`
3. `framed/03-haus.webp`
4. `framed/04-anzug.webp`
5. `framed/05-bett.jpg`

Es werden nur die dort genannten Dateien geladen. Fehlt eine Datei, erscheint eine Fehlermeldung statt eines kaputten Bildsymbols. Akzeptierte Schreibweisen des Serientitels stehen ebenfalls in `data/framed.js`. Die Bilder für Nis’ Ausgabe liegen in `nis/framed/`.

## Wortliste

`data/words.txt` und `data/words.js` enthalten 5757 englische Wörter mit fünf Buchstaben aus Donald Knuths Stanford GraphBase (`sgb-words`). Das ist eine begrenzte Liste, kein vollständiges englisches Wörterbuch. Manche gültigen englischen Wörter werden abgelehnt. `KAFFE` steht nicht in der Liste und wird als Lösung trotzdem angenommen.

Nach einer Änderung an `data/words.txt`:

```bash
python scripts/build-words.py
```

## Four by Three

Brett, Hub-Wort und Kategorien stehen in `data/four.js`.

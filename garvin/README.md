# Papa Garvins Geburtstadles

Kleine statische Rätsel-Seite: Wordle auf Deutsch mit der Lösung CELLO, Framed mit Forrest Gump und 3 times 4 mit Garvin als Kernwort. Ein Neuladen zeigt wieder die Spielauswahl. Spielstände bleiben nur im Arbeitsspeicher des offenen Tabs und werden nicht gespeichert. Die Seite setzt keine Cookies, kein localStorage und kein Tracking ein.

Diese Ausgabe liegt in diesem Ordner und erscheint unter <https://lenjavollmer.github.io/garvin/>. Die Startseite ist die Übersicht. Mascha liegt unter `/mascha/`, Nis unter `/nis/`.

## Lokal starten

Im Projektordner einen lokalen Server starten und `http://127.0.0.1:8765/garvin/` öffnen:

```bash
python -m http.server 8765
```

Tests:

```bash
node --test garvin/tests/logic.test.mjs
```

## Framed-Bilder

Die Reihenfolge steht in `data/framed.js`, vom unauffälligeren Bild zum deutlicheren:

1. `framed/01-schwarzweiss.jpg`
2. `framed/03-schokolade.jpg`
3. `framed/02-feder.jpg`
4. `framed/04-rede.jpg`
5. `framed/05-laufen.jpg`

Akzeptierte Schreibweisen: Forrest Gump, Forest Gump, ForrestGump.

## Four by Three

Brett, Kernwort und Kategorien stehen in `data/four.js`. Erratene Begriffe bleiben im Raster und werden blasser. Ab der zweiten gefundenen Gruppe hebt sich das Kernwort farblich ab.

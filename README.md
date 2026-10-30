# Übersicht

Die Startseite unter <https://lenjavollmer.github.io/> ist ein Menü. Die einzelnen Seiten liegen in eigenen Ordnern:

- [Papa Garvin](https://lenjavollmer.github.io/garvin/) im Ordner `garvin/`
- [Mascha](https://lenjavollmer.github.io/mascha/) im Ordner `mascha/`
- [Nis](https://lenjavollmer.github.io/nis/) im Ordner `nis/`
- [Yuna](https://lenjavollmer.github.io/yuna/) im Ordner `yuna/`

Ein Neuladen einer Rätselseite zeigt wieder die Spielauswahl dieser Seite. Spielstände bleiben nur im Arbeitsspeicher des offenen Tabs und werden nicht gespeichert. Die Seiten setzen keine Cookies, kein localStorage und kein Tracking ein.

GitHub Pages protokolliert beim Aufruf selbst technische Zugriffsdaten, zum Beispiel IP-Adressen, aus Sicherheitsgründen. Die Rätsel-Inhalte liegen im Repository und sind im Seitenquelltext einsehbar.

## Lokal starten

Im Projektordner einen lokalen Server starten und `http://127.0.0.1:8765/` öffnen:

```bash
python -m http.server 8765
```

Module funktionieren nicht zuverlässig, wenn `index.html` direkt als Datei geöffnet wird.

Tests:

```bash
node --test mascha/tests/logic.test.mjs
node --test garvin/tests/logic.test.mjs
node --test nis/tests/logic.test.mjs
```

## GitHub Pages

Das Repository `lenjavollmer.github.io` veröffentlicht den Branch `main` unter <https://lenjavollmer.github.io/>. Eine weitere Pages-Einstellung ist nicht nötig.

`sw.js` im Projektstamm räumt nur noch einen früher installierten Yuna-Cache ab und meldet sich danach ab. Die Übersicht registriert keinen Service Worker.

Pfade sind relativ, damit die Seiten auch unter einem Projektpfad funktionieren.

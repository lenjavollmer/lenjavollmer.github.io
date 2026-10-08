import {
  WORDLE_LENGTH,
  WORDLE_ROWS,
  TARGET,
  createWordleState,
  typeLetter,
  deleteLetter,
  commitGuess,
  keyboardFromRows,
  shareWordle,
} from "./logic.mjs?v=7";
import { el, prefersReducedMotion, markGlyph, markLabel, copyText, topbar, shareBox } from "./ui.js";

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function mountWordle(root, { onHome, words }) {
  let state = createWordleState();
  let busy = false;
  const timers = [];

  const live = el("p", { class: "live", attrs: { "aria-live": "polite" } });
  const grid = el("div", {
    class: "grid",
    attrs: { role: "grid", "aria-label": "Worträtsel mit sechs Versuchen", lang: "de" },
  });
  const rows = [];
  for (let r = 0; r < WORDLE_ROWS; r += 1) {
    const row = el("div", { class: "grid-row", attrs: { role: "row" } });
    const cells = [];
    for (let c = 0; c < WORDLE_LENGTH; c += 1) {
      const cell = el("div", {
        class: "cell",
        attrs: { role: "gridcell", "aria-label": "leer" },
      });
      cell.append(el("span", { class: "cell-letter" }), el("span", { class: "cell-mark", attrs: { "aria-hidden": "true" } }));
      cells.push(cell);
      row.append(cell);
    }
    rows.push({ row, cells });
    grid.append(row);
  }

  const legend = el("ul", { class: "legend" }, [
    el("li", {}, [el("span", { class: "swatch is-correct", text: "✓", attrs: { "aria-hidden": "true" } }), document.createTextNode(" richtige Stelle")]),
    el("li", {}, [el("span", { class: "swatch is-present", text: "~", attrs: { "aria-hidden": "true" } }), document.createTextNode(" anderer Platz")]),
    el("li", {}, [el("span", { class: "swatch is-absent", text: "·", attrs: { "aria-hidden": "true" } }), document.createTextNode(" nicht enthalten")]),
  ]);

  const keyboard = el("div", { class: "keyboard", attrs: { role: "group", "aria-label": "Bildschirmtastatur" } });
  const share = shareBox("Ergebnis teilen");
  const result = el("section", { class: "result", attrs: { hidden: "hidden" } }, [
    el("h2", { class: "result-title", text: "Runde beendet" }),
    el("p", { class: "result-copy" }),
    share.box,
  ]);

  root.append(
    topbar("Wordle", onHome),
    el("section", { class: "panel" }, [
      el("h1", { text: "Wordle" }),
      el("p", { class: "lede", text: "Fünf Buchstaben, sechs Versuche." }),
      grid,
      legend,
      result,
      keyboard,
      live,
    ]),
  );

  function say(message) {
    live.textContent = message;
  }

  function paintCurrent() {
    if (state.status !== "playing") return;
    const cells = rows[state.guesses.length].cells;
    cells.forEach((cell, index) => {
      const letter = state.current[index] || "";
      cell.querySelector(".cell-letter").textContent = letter;
      cell.querySelector(".cell-mark").textContent = "";
      cell.className = letter ? "cell is-filled" : "cell";
      cell.setAttribute("aria-label", letter || "leer");
    });
  }

  function paintKeyboard() {
    keyboard.replaceChildren();
    const known = keyboardFromRows(state.guesses);
    KEY_ROWS.forEach((letters, rowIndex) => {
      const row = el("div", { class: "key-row" });
      if (rowIndex === 2) row.append(keyButton("Enter", "enter", "Eingabe"));
      for (const letter of letters) {
        row.append(keyButton(letter, known[letter] || "", letter));
      }
      if (rowIndex === 2) row.append(keyButton("Löschen", "delete", "Löschen"));
      keyboard.append(row);
    });
  }

  function keyButton(label, status, aria) {
    const button = el("button", {
      class: status ? `key is-${status}` : "key",
      text: status && status !== "enter" && status !== "delete" ? `${label} ${markGlyph(status)}` : label,
      attrs: { type: "button", "aria-label": status && markLabel(status) ? `${aria}, ${markLabel(status)}` : aria },
    });
    if (label === "Enter" || label === "Löschen") button.classList.add("key-wide");
    button.addEventListener("click", () => {
      if (label === "Enter") submit();
      else if (label === "Löschen") erase();
      else press(label);
    });
    return button;
  }

  function paintResult() {
    if (state.status === "playing") {
      result.hidden = true;
      return;
    }
    result.hidden = false;
    const title = result.querySelector(".result-title");
    const copy = result.querySelector(".result-copy");
    if (state.status === "won") {
      title.textContent = "Geschafft";
      copy.textContent = `Gelöst in ${state.guesses.length} von ${WORDLE_ROWS} Versuchen.`;
    } else {
      title.textContent = "Aufgelöst";
      copy.textContent = `Nicht gelöst. Die Lösung ist ${TARGET}.`;
    }
  }

  function reveal(rowIndex, guess, marks) {
    const cells = rows[rowIndex].cells;
    const finish = () => {
      busy = false;
      paintKeyboard();
      paintResult();
      if (state.status === "won") say(`Geschafft in ${state.guesses.length} von ${WORDLE_ROWS} Versuchen.`);
      else if (state.status === "lost") say(`Nicht gelöst. Die Lösung ist ${TARGET}.`);
      else say(marks.map((mark, i) => `${guess[i]} ${markLabel(mark)}`).join(", "));
    };
    if (prefersReducedMotion()) {
      cells.forEach((cell, i) => applyMark(cell, guess[i], marks[i]));
      finish();
      return;
    }
    const step = 140;
    const duration = 420;
    cells.forEach((cell, i) => {
      timers.push(window.setTimeout(() => cell.classList.add("is-flipping"), i * step));
      timers.push(window.setTimeout(() => applyMark(cell, guess[i], marks[i]), i * step + duration / 2));
    });
    timers.push(window.setTimeout(finish, (cells.length - 1) * step + duration));
  }

  function applyMark(cell, letter, mark) {
    cell.classList.remove("is-filled", "is-correct", "is-present", "is-absent");
    cell.classList.add(`is-${mark}`);
    cell.querySelector(".cell-letter").textContent = letter;
    cell.querySelector(".cell-mark").textContent = markGlyph(mark);
    cell.setAttribute("aria-label", `${letter}, ${markLabel(mark)}`);
  }

  function press(letter) {
    if (busy) return;
    state = typeLetter(state, letter);
    paintCurrent();
  }

  function erase() {
    if (busy) return;
    state = deleteLetter(state);
    paintCurrent();
  }

  function submit() {
    if (busy || state.status !== "playing") return;
    const outcome = commitGuess(state, words);
    if (outcome.error === "short") {
      rows[state.guesses.length].row.classList.remove("is-shaking");
      void rows[state.guesses.length].row.offsetWidth;
      rows[state.guesses.length].row.classList.add("is-shaking");
      say("Ein Versuch braucht fünf Buchstaben.");
      return;
    }
    if (outcome.error === "unknown") {
      rows[state.guesses.length].row.classList.remove("is-shaking");
      void rows[state.guesses.length].row.offsetWidth;
      rows[state.guesses.length].row.classList.add("is-shaking");
      say("Das Wort steht nicht in der lokalen Wortliste.");
      return;
    }
    const rowIndex = state.guesses.length;
    const committed = outcome.state.guesses[rowIndex];
    state = outcome.state;
    busy = true;
    reveal(rowIndex, committed.guess, committed.marks);
  }

  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      erase();
    } else if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      press(event.key);
    }
  }

  share.button.addEventListener("click", async () => {
    const mode = await copyText(shareWordle(state), share.fallback);
    say(mode === "copied" ? "Ergebnis kopiert." : "Kopieren ist hier nicht möglich. Der Text ist markiert.");
  });

  window.addEventListener("keydown", onKey);
  paintCurrent();
  paintKeyboard();

  return () => {
    window.removeEventListener("keydown", onKey);
    timers.forEach((id) => window.clearTimeout(id));
  };
}

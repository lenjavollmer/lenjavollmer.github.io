import {
  createFourState,
  applyFourSelection,
  findGroup,
  shuffleAll,
  shareFour,
} from "./logic.mjs";
import { HUB, BOARD_WORDS, CATEGORIES, HUB_SUMMARY } from "../data/four.js?v=5";
import { el, prefersReducedMotion, topbar, copyText, shareBox } from "./ui.js";

export function mountFour(root, { onHome }) {
  let state = createFourState(BOARD_WORDS, HUB);
  let selected = [];
  let timer = 0;
  let locking = false;
  const live = el("p", { class: "live", attrs: { "aria-live": "polite" } });
  const solvedHost = el("div", { class: "solved-list" });
  const board = el("div", { class: "board", attrs: { role: "group", "aria-label": "Ungelöste Kacheln" } });
  const mix = el("button", { class: "secondary", text: "Mischen", attrs: { type: "button" } });
  const clear = el("button", { class: "secondary", text: "Auswahl aufheben", attrs: { type: "button" } });
  const send = el("button", { class: "primary", text: "Absenden", attrs: { type: "button" } });
  const share = shareBox("Ergebnis teilen");
  const finale = el("section", { class: "result finale" });
  finale.hidden = true;

  root.append(
    topbar("3 times 4", onHome),
    el("section", { class: "panel" }, [
      el("h1", { text: "3 times 4" }),
      el("p", {
        class: "lede",
        text: "Wähle genau drei Kacheln und schick sie ab.",
      }),
      solvedHost,
      board,
      el("div", { class: "form-actions" }, [mix, clear, send]),
      finale,
      live,
    ]),
  );

  function say(message) {
    live.textContent = message;
  }

  function categoryById(id) {
    return CATEGORIES.find((category) => category.id === id);
  }

  function paintSolved() {
    solvedHost.replaceChildren();
    state.solved.forEach((id, index) => {
      const category = categoryById(id);
      const card = el("article", { class: `solved-card solved-${category.id}` }, [
        el("h2", { text: category.name }),
        el("p", { class: "solved-words", text: [HUB, ...category.words].join(" · ") }),
      ]);
      if (category.explanation) card.append(el("p", { text: category.explanation }));
      card.style.order = String(index);
      solvedHost.append(card);
    });
  }

  function paintBoard() {
    board.replaceChildren();
    state.tiles.forEach((word) => {
      const pressed = selected.includes(word);
      const button = el("button", {
        class: pressed ? "word-tile is-selected" : "word-tile",
        attrs: { type: "button", "aria-pressed": pressed ? "true" : "false" },
      });
      button.append(el("span", { class: "word-label", text: word }));
      if (pressed) button.append(el("span", { class: "picked-tag", text: "gewählt" }));
      button.addEventListener("click", () => toggle(word));
      board.append(button);
    });
    send.disabled = selected.length !== 3 || state.status !== "playing";
    clear.disabled = selected.length === 0 || state.status !== "playing";
    mix.disabled = state.status !== "playing";
  }

  function paintFinale() {
    if (state.status !== "won") {
      finale.hidden = true;
      return;
    }
    finale.hidden = false;
    finale.replaceChildren(
      el("h2", { class: "result-title", text: "Geschafft 🎂" }),
      el("p", {
        class: "result-copy",
        text:
          state.mistakes === 0
            ? "Alle vier Gruppen sind gefunden, ohne Fehlversuch."
            : `Alle vier Gruppen sind gefunden, mit ${state.mistakes} ${state.mistakes === 1 ? "Fehlversuch" : "Fehlversuchen"}.`,
      }),
      el("h3", { text: "Warum NIS das Hub-Wort ist" }),
    );
    HUB_SUMMARY.forEach((line) => finale.append(el("p", { text: line })));
    finale.append(share.box);
  }

  function toggle(word) {
    if (locking || state.status !== "playing") return;
    if (selected.includes(word)) selected = selected.filter((item) => item !== word);
    else if (selected.length >= 3) {
      say("Es sind schon drei Kacheln ausgewählt.");
      return;
    } else selected = [...selected, word];
    paintBoard();
  }

  function submit() {
    if (locking || selected.length !== 3 || state.status !== "playing") return;
    const chosen = selected.slice();
    if (!findGroup(chosen, CATEGORIES, HUB)) {
      locking = true;
      state = applyFourSelection(state, chosen, CATEGORIES, HUB, BOARD_WORDS);
      board.classList.remove("is-shaking");
      void board.offsetWidth;
      board.classList.add("is-shaking");
      send.disabled = true;
      clear.disabled = true;
      mix.disabled = true;
      say("Diese drei gehören nicht zusammen.");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        selected = [];
        locking = false;
        paintBoard();
      }, prefersReducedMotion() ? 250 : 900);
      return;
    }
    state = applyFourSelection(state, chosen, CATEGORIES, HUB, BOARD_WORDS);
    selected = [];
    const category = categoryById(state.matchedId);
    say(`Gruppe gefunden: ${category.name}`);
    paintSolved();
    paintBoard();
    paintFinale();
  }

  function shuffleAgain() {
    state = { ...state, tiles: shuffleAll(state.tiles) };
    paintBoard();
    say("Die Kacheln sind neu gemischt.");
  }

  mix.addEventListener("click", () => {
    if (state.status !== "playing") return;
    shuffleAgain();
  });
  clear.addEventListener("click", () => {
    selected = [];
    paintBoard();
    say("Auswahl aufgehoben.");
  });
  send.addEventListener("click", submit);
  share.button.addEventListener("click", async () => {
    const mode = await copyText(shareFour(state.mistakes), share.fallback);
    say(mode === "copied" ? "Ergebnis kopiert." : "Kopieren ist hier nicht möglich. Der Text ist markiert.");
  });

  paintSolved();
  paintBoard();
  return () => window.clearTimeout(timer);
}

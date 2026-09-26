import { WORDS } from "../data/words.js";
import { framedRound } from "../data/framed.js";
import { mountWordle } from "./wordle.js";
import { mountFramed } from "./framed.js";
import { mountFour } from "./four.js";
import { el } from "./ui.js";

const app = document.querySelector("#app");
let dispose = () => {};

const titles = {
  home: "Drei Rätsel zum 30.",
  wordle: "Wordle · Drei Rätsel zum 30.",
  framed: "Framed · Drei Rätsel zum 30.",
  four: "Four by Three · Drei Rätsel zum 30.",
};

function show(screen) {
  dispose();
  dispose = () => {};
  app.replaceChildren();
  document.title = titles[screen] || titles.home;
  if (screen === "wordle") dispose = mountWordle(app, { onHome: () => show("home"), words: WORDS });
  else if (screen === "framed") dispose = mountFramed(app, { onHome: () => show("home"), round: framedRound });
  else if (screen === "four") dispose = mountFour(app, { onHome: () => show("home") });
  else renderHome();
  window.scrollTo(0, 0);
}

function choice(kicker, title, text, screen) {
  const button = el("button", { class: "choice", attrs: { type: "button" } }, [
    el("span", { class: "choice-kicker", text: kicker }),
    el("span", { class: "choice-title", text: title }),
    el("span", { class: "choice-text", text }),
  ]);
  button.addEventListener("click", () => show(screen));
  return button;
}

function renderHome() {
  app.append(
    el("main", { class: "home" }, [
      el("p", { class: "eyebrow", text: "Geburtstag" }),
      el("h1", { text: "Drei Rätsel zum 30." }),
      el("p", {
        class: "lede",
        text: "Drei kleine Spiele für den Geburtstagsmorgen. Such dir eins aus und leg direkt los.",
      }),
      el("div", { class: "choices" }, [
        choice("Spiel 1", "Wordle", "Sechs Versuche, fünf Buchstaben.", "wordle"),
        choice("Spiel 2", "Framed", "Ein Film, Bild für Bild.", "framed"),
        choice("Spiel 3", "Four by Three", "Vier Gruppen, eine Kachel in der Mitte.", "four"),
      ]),
      el("p", {
        class: "footnote",
        text: "Alle drei Rätsel können jederzeit neu gestartet werden. Es wird kein Spielstand gespeichert. Ein Neuladen beginnt wieder bei dieser Auswahl.",
      }),
    ]),
  );
}

show("home");

import { WORDS } from "../data/words.js";
import { framedRound } from "../data/framed.js";
import { mountWordle } from "./wordle.js";
import { mountFramed } from "./framed.js";
import { mountFour } from "./four.js";
import { el } from "./ui.js";

const app = document.querySelector("#app");
const festive = document.querySelector("#festive");
let dispose = () => {};

for (let i = 0; i < 42; i += 1) {
  const thirty = el("span", { class: "thirty", text: "30" });
  thirty.style.left = `${(i * 17) % 100}%`;
  thirty.style.top = `${(i * 23) % 100}%`;
  thirty.style.fontSize = `${0.75 + (i % 5) * 0.18}rem`;
  thirty.style.transform = `rotate(${(i % 9) * 8 - 28}deg)`;
  festive.append(thirty);
}
for (let i = 0; i < 18; i += 1) {
  const bit = el("span", { class: `confetti tone-${i % 4}` });
  bit.style.left = `${(i * 19 + 4) % 100}%`;
  bit.style.top = `${(i * 13) % 92}%`;
  bit.style.animationDelay = `${(i % 8) * 0.45}s`;
  bit.style.animationDuration = `${7 + (i % 5)}s`;
  festive.append(bit);
}

const titles = {
  home: "Geburtstadles",
  wordle: "Wordle · Geburtstadles",
  framed: "Framed · Geburtstadles",
  four: "3 times 4 · Geburtstadles",
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
      el("h1", { text: "Geburtstadles" }),
      el("p", {
        class: "lede",
        text: "Drei kleine Geburtstagsrätsel zu Nis 30. Geburtstag",
      }),
      el("div", { class: "choices" }, [
        choice("Spiel 1", "Wordle", "Auf Englisch. Sechs Versuche, fünf Buchstaben.", "wordle"),
        choice("Spiel 2", "Framed", "Ein Film, Bild für Bild.", "framed"),
        choice("Spiel 3", "3 times 4", "Neun Wörter, vier Gruppen.", "four"),
      ]),
      el("p", {
        class: "footnote",
        text: "Alle drei Rätsel können jederzeit neu gestartet werden. Es wird kein Spielstand gespeichert. Ein Neuladen beginnt wieder bei dieser Auswahl.",
      }),
    ]),
  );
}

show("home");

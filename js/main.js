import { WORDS } from "../data/words.js?v=8";
import { framedRound } from "../data/framed.js?v=7";
import { mountWordle } from "./wordle.js?v=8";
import { mountFramed } from "./framed.js?v=8";
import { mountFour } from "./four.js?v=8";
import { el } from "./ui.js";

const app = document.querySelector("#app");
const festive = document.querySelector("#festive");
let dispose = () => {};

const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function piece(x, y, kind) {
  const bit = el("span", { class: `confetti ${kind} tone-${Math.floor(Math.random() * 4)}` });
  const angle = Math.random() * Math.PI * 2;
  const dist = 24 + Math.random() * 150;
  bit.style.left = `${x}%`;
  bit.style.top = `${y}%`;
  bit.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
  bit.style.setProperty("--dy", `${Math.sin(angle) * dist - 36}px`);
  bit.style.setProperty("--spin", `${Math.random() * 520 - 260}deg`);
  bit.style.setProperty("--life", `${1.5 + Math.random() * 1.6}s`);
  festive.append(bit);
  window.setTimeout(() => bit.remove(), 3400);
}

function burst() {
  const count = 6 + Math.floor(Math.random() * 42);
  const x = 6 + Math.random() * 88;
  const y = 8 + Math.random() * 62;
  for (let i = 0; i < count; i += 1) piece(x, y, Math.random() < 0.25 ? "round" : "strip");
}

function drizzle() {
  const count = Math.random() < 0.35 ? 0 : 1 + Math.floor(Math.random() * 7);
  for (let i = 0; i < count; i += 1) {
    const bit = el("span", { class: `confetti drift tone-${Math.floor(Math.random() * 4)}` });
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.top = "-4%";
    bit.style.setProperty("--dx", `${Math.random() * 80 - 40}px`);
    bit.style.setProperty("--spin", `${Math.random() * 360}deg`);
    bit.style.setProperty("--life", `${5 + Math.random() * 4}s`);
    festive.append(bit);
    window.setTimeout(() => bit.remove(), 9500);
  }
}

function scheduleBursts() {
  const wait = 350 + Math.random() * 2400;
  window.setTimeout(() => {
    const waves = Math.random() < 0.4 ? 2 + Math.floor(Math.random() * 2) : 1;
    for (let wave = 0; wave < waves; wave += 1) window.setTimeout(burst, wave * (90 + Math.random() * 160));
    scheduleBursts();
  }, wait);
}

if (motionOk && festive) {
  drizzle();
  burst();
  scheduleBursts();
  window.setInterval(drizzle, 700);
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
        text: "Drei kleine Geburtstagsrätsel zu Maschas 28. Geburtstag",
      }),
      el("div", { class: "choices" }, [
        choice("Spiel 1", "Wordle", "Auf Deutsch. Sechs Versuche, fünf Buchstaben.", "wordle"),
        choice("Spiel 2", "Framed", "Eine Serie, Bild für Bild.", "framed"),
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

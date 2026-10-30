import { createFramedState, submitFramed, shareFramed } from "./logic.mjs?v=8";
import { el, copyText, topbar, shareBox } from "./ui.js";

export function mountFramed(root, { onHome, round }) {
  let state = createFramedState(round.images.length);
  const live = el("p", { class: "live", attrs: { "aria-live": "polite" } });
  const counter = el("p", { class: "counter" });
  const steps = el("ol", { class: "steps", attrs: { "aria-label": "Bildfortschritt" } });
  const shot = el("img", {
    class: "shot",
    attrs: { alt: "", decoding: "async" },
  });
  const missing = el("p", { class: "missing", attrs: { role: "status" } });
  missing.hidden = true;
  const input = el("input", {
    class: "title-input",
    attrs: {
      type: "text",
      inputmode: "text",
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: "false",
      "aria-label": "Serientitel",
      placeholder: "Serientitel eingeben",
    },
  });
  const guess = el("button", { class: "primary", text: "Raten", attrs: { type: "submit" } });
  const skip = el("button", { class: "secondary", text: "Überspringen", attrs: { type: "button" } });
  const form = el("form", { class: "guess-form" }, [input, el("div", { class: "form-actions" }, [guess, skip])]);
  const share = shareBox("Ergebnis teilen");
  const result = el("section", { class: "result" }, [
    el("h2", { class: "result-title" }),
    el("p", { class: "result-copy" }),
    share.box,
  ]);
  result.hidden = true;

  root.append(
    topbar("Framed", onHome),
    el("section", { class: "panel" }, [
      el("h1", { text: "Framed" }),
      el("p", { class: "lede", text: "Ein Serientitel. Mit jedem Fehlversuch oder Überspringen kommt ein weiteres Bild." }),
      counter,
      steps,
      el("div", { class: "shot-wrap" }, [shot, missing]),
      form,
      result,
      live,
    ]),
  );

  shot.addEventListener("error", () => {
    const src = shot.getAttribute("src") || "unbekannt";
    shot.hidden = true;
    missing.hidden = false;
    missing.textContent = `Das Hinweisbild „${src}“ konnte nicht geladen werden. Raten und Überspringen gehen weiter, die anderen Spiele auch.`;
  });

  function say(message) {
    live.textContent = message;
  }

  function paint() {
    const total = state.total;
    counter.textContent = state.status === "playing" ? `Versuch ${state.imageIndex + 1} von ${total}` : `${state.attemptsUsed} von ${total} Versuchen`;
    steps.replaceChildren();
    for (let i = 0; i < total; i += 1) {
      const item = el("li", { text: String(i + 1) });
      if (i < state.imageIndex) item.className = "is-done";
      if (state.status === "playing" && i === state.imageIndex) {
        item.className = "is-current";
        item.setAttribute("aria-current", "step");
      }
      if (state.status !== "playing" && i === state.imageIndex) item.className = "is-done";
      steps.append(item);
    }
    const image = round.images[state.imageIndex];
    shot.hidden = false;
    missing.hidden = true;
    shot.alt = `Hinweisbild ${state.imageIndex + 1} von ${total}`;
    if (shot.getAttribute("src") !== image.src) shot.src = image.src;
    const locked = state.status !== "playing";
    input.disabled = locked;
    guess.disabled = locked;
    skip.disabled = locked;
    if (state.status === "won") {
      result.hidden = false;
      result.querySelector(".result-title").textContent = "Erkannt";
      result.querySelector(".result-copy").textContent = `Erkannt auf Bild ${state.solvedOn} von ${total}.`;
    } else if (state.status === "lost") {
      result.hidden = false;
      result.querySelector(".result-title").textContent = "Aufgelöst";
      result.querySelector(".result-copy").textContent = `Die Serie ist ${round.aliases[0]}.`;
    }
  }

  function take(raw) {
    if (state.status !== "playing") return;
    const outcome = submitFramed(state, raw, round.aliases);
    state = outcome.state;
    input.value = "";
    paint();
    if (outcome.kind === "win") say(`Erkannt auf Bild ${state.solvedOn} von ${state.total}.`);
    else if (outcome.kind === "loss") say(`Nicht erkannt. Die Serie ist ${round.aliases[0]}.`);
    else if (outcome.kind === "skip") say(`Übersprungen. Bild ${state.imageIndex + 1} von ${state.total}.`);
    else say(`Nicht erkannt. Bild ${state.imageIndex + 1} von ${state.total}.`);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    take(input.value);
  });
  skip.addEventListener("click", () => take(""));
  share.button.addEventListener("click", async () => {
    const mode = await copyText(shareFramed(state), share.fallback);
    say(mode === "copied" ? "Ergebnis kopiert." : "Kopieren ist hier nicht möglich. Der Text ist markiert.");
  });

  paint();
  return () => {};
}

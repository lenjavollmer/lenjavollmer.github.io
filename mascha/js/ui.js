const MARK = { correct: "✓", present: "~", absent: "·" };
const MARK_LABEL = {
  correct: "richtige Stelle",
  present: "anderer Platz",
  absent: "nicht enthalten",
};

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text != null) node.textContent = props.text;
  if (props.attrs) {
    for (const [name, value] of Object.entries(props.attrs)) {
      if (value != null) node.setAttribute(name, String(value));
    }
  }
  for (const child of children) {
    if (child != null) node.append(child);
  }
  return node;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function markGlyph(mark) {
  return MARK[mark] || "";
}

export function markLabel(mark) {
  return MARK_LABEL[mark] || "";
}

export async function copyText(text, fallback) {
  const area = fallback.querySelector("textarea");
  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error("clipboard unavailable");
    }
    await navigator.clipboard.writeText(text);
    fallback.hidden = true;
    return "copied";
  } catch {
    fallback.hidden = false;
    area.value = text;
    area.focus();
    area.select();
    return "fallback";
  }
}

export function topbar(title, onHome) {
  const back = el("button", {
    class: "back",
    text: "Zur Spielauswahl",
    attrs: { type: "button" },
  });
  back.addEventListener("click", onHome);
  return el("header", { class: "topbar" }, [
    back,
    el("p", { class: "topbar-title", text: title }),
  ]);
}

export function shareBox(buttonLabel) {
  const button = el("button", {
    class: "primary",
    text: buttonLabel,
    attrs: { type: "button" },
  });
  const area = el("textarea", {
    class: "copy-fallback",
    attrs: { readonly: "readonly", rows: "3", "aria-label": "Text zum manuellen Kopieren" },
  });
  const fallback = el("div", { class: "fallback" }, [
    el("p", {
      text: "Automatisches Kopieren ist hier nicht möglich. Der Text ist markiert und kann manuell kopiert werden.",
    }),
    area,
  ]);
  fallback.hidden = true;
  return { button, fallback, box: el("div", { class: "share-box" }, [button, fallback]) };
}

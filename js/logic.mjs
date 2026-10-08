export const WORDLE_LENGTH = 5;
export const WORDLE_ROWS = 6;
export const TARGET = "KAFFE";

const RANK = { absent: 1, present: 2, correct: 3 };

export function upperGerman(value) {
  return Array.from(String(value), (letter) => (letter === "ß" || letter === "ẞ" ? "ß" : letter.toLocaleUpperCase("de"))).join("");
}

export function scoreGuess(guess, target = TARGET) {
  const g = upperGerman(guess);
  const t = upperGerman(target);
  if (g.length !== t.length) {
    throw new Error("Wortlaenge stimmt nicht.");
  }
  const marks = Array(g.length).fill("absent");
  const counts = {};
  for (const letter of t) counts[letter] = (counts[letter] || 0) + 1;
  for (let i = 0; i < g.length; i += 1) {
    if (g[i] === t[i]) {
      marks[i] = "correct";
      counts[g[i]] -= 1;
    }
  }
  for (let i = 0; i < g.length; i += 1) {
    if (marks[i] === "correct") continue;
    if ((counts[g[i]] || 0) > 0) {
      marks[i] = "present";
      counts[g[i]] -= 1;
    }
  }
  return marks;
}

export function mergeKeyStatus(previous, next) {
  if (!previous) return next;
  return RANK[next] > RANK[previous] ? next : previous;
}

export function keyboardFromRows(rows) {
  const keys = {};
  for (const row of rows) {
    for (let i = 0; i < row.guess.length; i += 1) {
      keys[row.guess[i]] = mergeKeyStatus(keys[row.guess[i]], row.marks[i]);
    }
  }
  return keys;
}

export function createWordleState() {
  return { guesses: [], current: "", status: "playing" };
}

export function typeLetter(state, letter) {
  if (state.status !== "playing") return state;
  if (state.current.length >= WORDLE_LENGTH) return state;
  const next = upperGerman(letter);
  if (!/^[A-ZÄÖÜß]$/.test(next)) return state;
  return { ...state, current: state.current + next };
}

export function deleteLetter(state) {
  if (state.status !== "playing") return state;
  return { ...state, current: state.current.slice(0, -1) };
}

export function commitGuess(state, words, target = TARGET) {
  if (state.status !== "playing") return { state, error: "locked" };
  if (state.current.length !== WORDLE_LENGTH) return { state, error: "short" };
  const solution = upperGerman(target);
  if (!words.has(state.current) && state.current !== solution) return { state, error: "unknown" };
  const guess = state.current;
  const guesses = [...state.guesses, { guess, marks: scoreGuess(guess, solution) }];
  const won = guess === solution;
  const status = won ? "won" : guesses.length >= WORDLE_ROWS ? "lost" : "playing";
  return { error: null, state: { guesses, current: "", status } };
}

export function normalizeAnswer(value) {
  return String(value)
    .toLocaleLowerCase("en")
    .replace(/[\u2010-\u2015]/g, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function answerMatches(input, aliases) {
  const normalized = normalizeAnswer(input);
  if (!normalized) return false;
  return aliases.some((alias) => normalizeAnswer(alias) === normalized);
}

export function createFramedState(imageCount) {
  return {
    imageIndex: 0,
    attemptsUsed: 0,
    status: "playing",
    solvedOn: null,
    total: imageCount,
  };
}

export function submitFramed(state, rawInput, aliases) {
  if (state.status !== "playing") return { state, kind: "locked" };
  const attempt = state.imageIndex + 1;
  if (answerMatches(rawInput, aliases)) {
    return {
      kind: "win",
      state: { ...state, status: "won", solvedOn: attempt, attemptsUsed: attempt },
    };
  }
  const kind = String(rawInput).trim() === "" ? "skip" : "miss";
  if (attempt >= state.total) {
    return {
      kind: "loss",
      state: {
        ...state,
        status: "lost",
        attemptsUsed: state.total,
        imageIndex: state.total - 1,
      },
    };
  }
  return {
    kind,
    state: { ...state, imageIndex: state.imageIndex + 1, attemptsUsed: attempt },
  };
}

export function findGroup(selected, categories, hub) {
  if (selected.length !== 3) return null;
  const chosen = new Set(selected);
  if (chosen.size !== 3 || !chosen.has(hub)) return null;
  return categories.find((category) => category.words.every((word) => chosen.has(word))) || null;
}

export function wordsAfterSolves(boardWords, solvedIds, categories, hub) {
  const removed = new Set();
  for (const category of categories) {
    if (solvedIds.includes(category.id)) {
      category.words.forEach((word) => removed.add(word));
    }
  }
  return boardWords.filter((word) => word === hub || !removed.has(word));
}

export function shuffleAll(words, random = Math.random) {
  const copy = words.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createFourState(words) {
  return {
    tiles: shuffleAll(words),
    solved: [],
    mistakes: 0,
    status: "playing",
  };
}

export function applyFourSelection(state, selected, categories, hub, boardWords) {
  const match = findGroup(selected, categories, hub);
  if (!match) {
    return { ...state, mistakes: state.mistakes + 1, last: "wrong" };
  }
  const solved = [...state.solved, match.id];
  const remaining = wordsAfterSolves(boardWords, solved, categories, hub);
  const done = solved.length === categories.length;
  return {
    tiles: shuffleAll(remaining),
    solved,
    mistakes: state.mistakes,
    status: done ? "won" : "playing",
    last: "right",
    matchedId: match.id,
  };
}

export function shareWordle(state) {
  if (state.status === "won") return `Wordle: gelöst in ${state.guesses.length} von ${WORDLE_ROWS}`;
  return "Wordle: nicht gelöst";
}

export function shareFramed(state) {
  if (state.status === "won") return `Framed: erkannt auf Bild ${state.solvedOn} von ${state.total}`;
  return "Framed: nicht erkannt";
}

export function shareFour(mistakes) {
  if (mistakes === 0) return "3 times 4: gelöst ohne Fehlversuch";
  const label = mistakes === 1 ? "Fehlversuch" : "Fehlversuchen";
  return `3 times 4: gelöst mit ${mistakes} ${label}`;
}

export function createSession() {
  let screen = "home";
  return {
    get screen() {
      return screen;
    },
    open(name) {
      if (name === "wordle" || name === "framed" || name === "four" || name === "home") {
        screen = name;
      }
    },
  };
}

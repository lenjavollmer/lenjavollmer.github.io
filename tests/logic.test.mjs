import assert from "node:assert/strict";
import test from "node:test";
import { WORDS } from "../data/words.js";
import { CATEGORIES, HUB, BOARD_WORDS } from "../data/four.js";
import { framedRound } from "../data/framed.js";
import {
  scoreGuess,
  keyboardFromRows,
  createWordleState,
  typeLetter,
  commitGuess,
  answerMatches,
  createFramedState,
  submitFramed,
  findGroup,
  wordsAfterSolves,
  shuffleAll,
  applyFourSelection,
  createFourState,
  shareWordle,
  shareFramed,
  shareFour,
  createSession,
} from "../js/logic.mjs";

test("Wordle bewertet doppelte Buchstaben erst gruen, dann gelb", () => {
  assert.deepEqual(scoreGuess("KAFFE"), ["correct", "correct", "correct", "correct", "correct"]);
  assert.deepEqual(scoreGuess("BABES", "ABBEY"), ["present", "present", "correct", "correct", "absent"]);
  assert.deepEqual(scoreGuess("LEVEL", "LEVER"), ["correct", "correct", "correct", "correct", "absent"]);
  assert.deepEqual(scoreGuess("CCCSS", "SCOUT"), ["absent", "correct", "absent", "present", "absent"]);
  assert.deepEqual(scoreGuess("OTTER", "SCOUT"), ["present", "present", "absent", "absent", "absent"]);
  assert.deepEqual(scoreGuess("ABOUT", "SCOUT"), ["absent", "absent", "correct", "correct", "correct"]);
});

test("Tastatur merkt sich den besten Status", () => {
  const keys = keyboardFromRows([
    { guess: "ABOUT", marks: scoreGuess("ABOUT", "SCOUT") },
    { guess: "SCOUT", marks: scoreGuess("SCOUT", "SCOUT") },
  ]);
  assert.equal(keys.O, "correct");
  assert.equal(keys.T, "correct");
  assert.equal(keys.A, "absent");
});

test("Wordle: Sieg, Niederlage und unvollstaendige Eingabe", () => {
  assert.equal(WORDS.has("SCOUT"), true);
  assert.equal(WORDS.has("KAFFE"), false);
  let state = createWordleState();
  for (const letter of "KAFF") state = typeLetter(state, letter);
  assert.equal(commitGuess(state, WORDS).error, "short");
  assert.equal(state.guesses.length, 0);
  assert.equal(commitGuess({ ...createWordleState(), current: "QQQQQ" }, WORDS).error, "unknown");
  state = typeLetter(state, "E");
  const won = commitGuess(state, WORDS);
  assert.equal(won.state.status, "won");
  assert.equal(shareWordle(won.state), "Wordle: gelöst in 1 von 6");
  assert.equal(shareWordle(won.state).includes("KAFFE"), false);

  const wrongs = ["WHICH", "THERE", "THEIR", "ABOUT", "WOULD", "THESE"];
  state = createWordleState();
  for (const word of wrongs) {
    let typed = state;
    for (const letter of word) typed = typeLetter(typed, letter);
    const outcome = commitGuess(typed, WORDS);
    assert.equal(outcome.error, null);
    state = outcome.state;
  }
  assert.equal(state.status, "lost");
  assert.equal(shareWordle(state), "Wordle: nicht gelöst");
  assert.equal(commitGuess({ ...state, current: "SCOUT" }, WORDS).error, "locked");
});

test("Framed wechselt Bilder, ueberspringt und akzeptiert Schreibweisen", () => {
  const aliases = framedRound.aliases;
  assert.equal(framedRound.images.length, 5);
  assert.equal(answerMatches("  gilmore   girls ", aliases), true);
  assert.equal(answerMatches("Die Gilmore Girls", aliases), true);
  assert.equal(answerMatches("Gilmore", aliases), false);

  let state = createFramedState(framedRound.images.length);
  let step = submitFramed(state, "Nope", aliases);
  assert.equal(step.kind, "miss");
  assert.equal(step.state.imageIndex, 1);
  step = submitFramed(step.state, "   ", aliases);
  assert.equal(step.kind, "skip");
  assert.equal(step.state.imageIndex, 2);
  assert.equal(submitFramed(createFramedState(5), "Gilmore Girls", aliases).kind, "win");

  step = submitFramed(step.state, "Gilmore Girls", aliases);
  assert.equal(step.state.status, "won");
  assert.equal(step.state.solvedOn, 3);
  assert.equal(shareFramed(step.state), "Framed: erkannt auf Bild 3 von 5");
  assert.equal(/godzilla/i.test(shareFramed(step.state)), false);

  state = createFramedState(2);
  state = submitFramed(state, "", aliases).state;
  state = submitFramed(state, "falsch", aliases).state;
  assert.equal(state.status, "lost");
  assert.equal(shareFramed(state), "Framed: nicht erkannt");
});

test("Four by Three erkennt die vier Gruppen und laesst Fehler im Brett", () => {
  assert.ok(findGroup(["My Heart Will Go On", "Mascha", "Sex and the City"], CATEGORIES, HUB));
  assert.ok(findGroup(["Jupp", "Mascha", "Chucho"], CATEGORIES, HUB));
  assert.ok(findGroup(["radeln", "Textil", "Mascha"], CATEGORIES, HUB));
  assert.ok(findGroup(["Marek", "Jano", "Mascha"], CATEGORIES, HUB));
  assert.equal(findGroup(["Sex and the City", "My Heart Will Go On", "Jupp"], CATEGORIES, HUB), null);
  assert.equal(findGroup(["Mascha", "Sex and the City", "Jupp"], CATEGORIES, HUB), null);

  const wrong = applyFourSelection(
    { tiles: BOARD_WORDS.slice(), solved: [], mistakes: 0, status: "playing" },
    ["Sex and the City", "My Heart Will Go On", "Jupp"],
    CATEGORIES,
    HUB,
    BOARD_WORDS,
  );
  assert.deepEqual(wrong.solved, []);
  assert.equal(wrong.mistakes, 1);
  assert.equal(wrong.status, "playing");

  const afterYear = wordsAfterSolves(BOARD_WORDS, ["year"], CATEGORIES, HUB);
  assert.equal(afterYear.includes("Mascha"), true);
  assert.equal(afterYear.includes("Sex and the City"), false);
  assert.equal(afterYear.includes("My Heart Will Go On"), false);
  assert.equal(afterYear.includes("Jupp"), true);

  const mixed = shuffleAll(BOARD_WORDS, () => 0);
  assert.equal(mixed.length, 9);
  assert.equal(mixed.filter((word) => word === HUB).length, 1);
  assert.notEqual(mixed.indexOf(HUB), 4);

  let state = createFourState(BOARD_WORDS);
  for (const category of CATEGORIES) {
    state = applyFourSelection(state, [HUB, ...category.words], CATEGORIES, HUB, BOARD_WORDS);
  }
  assert.equal(state.status, "won");
  assert.equal(state.solved.length, 4);
  assert.equal(shareFour(2).includes("Mascha"), false);
  assert.equal(state.tiles.filter((word) => word === HUB).length, 1);
  assert.equal(shareFour(0), "3 times 4: gelöst ohne Fehlversuch");
});

test("Rueckkehr zur Spielauswahl setzt die Ansicht zurueck", () => {
  const session = createSession();
  session.open("wordle");
  assert.equal(session.screen, "wordle");
  session.open("home");
  assert.equal(session.screen, "home");
  assert.equal(createWordleState().guesses.length, 0);
  assert.equal(createFramedState(5).imageIndex, 0);
});

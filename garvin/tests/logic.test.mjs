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
  spentWords,
  hubKnown,
  shuffleAll,
  applyFourSelection,
  createFourState,
  shareWordle,
  shareFramed,
  shareFour,
  createSession,
} from "../js/logic.mjs";

test("Wordle bewertet doppelte Buchstaben erst gruen, dann gelb", () => {
  assert.deepEqual(scoreGuess("CELLO"), ["correct", "correct", "correct", "correct", "correct"]);
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
  assert.equal(typeLetter(createWordleState(), "ä").current, "Ä");
  assert.equal(WORDS.has("CELLO"), true);
  assert.equal(WORDS.has("KAFFE"), true);
  assert.equal(WORDS.has("STUHL"), true);
  assert.equal(WORDS.has("WHICH"), false);
  assert.equal(commitGuess({ ...createWordleState(), current: "WHICH" }, WORDS).error, "unknown");
  let state = createWordleState();
  for (const letter of "CELL") state = typeLetter(state, letter);
  assert.equal(commitGuess(state, WORDS).error, "short");
  assert.equal(state.guesses.length, 0);
  assert.equal(commitGuess({ ...createWordleState(), current: "QQQQQ" }, WORDS).error, "unknown");
  state = typeLetter(state, "O");
  const won = commitGuess(state, WORDS);
  assert.equal(won.state.status, "won");
  assert.equal(shareWordle(won.state), "Wordle: gelöst in 1 von 6");
  assert.equal(shareWordle(won.state).includes("CELLO"), false);

  const wrongs = ["NACHT", "BLUME", "APFEL", "LICHT", "WOLKE", "HUNDE"];
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
  assert.equal(answerMatches("  forrest   gump ", aliases), true);
  assert.equal(answerMatches("Forest Gump", aliases), true);
  assert.equal(answerMatches("Forrest", aliases), false);

  let state = createFramedState(framedRound.images.length);
  let step = submitFramed(state, "Nope", aliases);
  assert.equal(step.kind, "miss");
  assert.equal(step.state.imageIndex, 1);
  step = submitFramed(step.state, "   ", aliases);
  assert.equal(step.kind, "skip");
  assert.equal(step.state.imageIndex, 2);
  assert.equal(submitFramed(createFramedState(5), "Forrest Gump", aliases).kind, "win");

  step = submitFramed(step.state, "Forrest Gump", aliases);
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

test("Four by Three erkennt die vier Gruppen und laesst das Raster voll", () => {
  assert.ok(findGroup(["Grease", "Garvin", "Dirk Nowitzki"], CATEGORIES, HUB));
  assert.ok(findGroup(["Halloween", "Garvin", "Tag der deutschen Einheit"], CATEGORIES, HUB));
  assert.ok(findGroup(["Marisa", "Raimar", "Garvin"], CATEGORIES, HUB));
  assert.ok(findGroup(["Zorita", "Coria", "Garvin"], CATEGORIES, HUB));
  assert.equal(findGroup(["Grease", "Dirk Nowitzki", "Halloween"], CATEGORIES, HUB), null);
  assert.equal(findGroup(["Garvin", "Grease", "Halloween"], CATEGORIES, HUB), null);

  const layout = BOARD_WORDS.slice();
  const wrong = applyFourSelection(
    { tiles: layout, solved: [], mistakes: 0, status: "playing" },
    ["Grease", "Dirk Nowitzki", "Halloween"],
    CATEGORIES,
    HUB,
    BOARD_WORDS,
  );
  assert.deepEqual(wrong.solved, []);
  assert.equal(wrong.mistakes, 1);
  assert.equal(wrong.status, "playing");
  assert.deepEqual(wrong.tiles, layout);

  const afterYear = wordsAfterSolves(BOARD_WORDS, ["year"], CATEGORIES, HUB);
  assert.equal(afterYear.includes("Garvin"), true);
  assert.equal(afterYear.includes("Grease"), false);
  assert.equal(spentWords(["year"], CATEGORIES).has("Grease"), true);
  assert.equal(spentWords(["year"], CATEGORIES).has("Garvin"), false);
  assert.equal(hubKnown(1), false);
  assert.equal(hubKnown(2), true);

  const mixed = shuffleAll(BOARD_WORDS, () => 0);
  assert.equal(mixed.length, 9);
  assert.equal(mixed.filter((word) => word === HUB).length, 1);
  assert.notEqual(mixed.indexOf(HUB), 4);

  let state = createFourState(BOARD_WORDS);
  const placed = state.tiles.slice();
  for (const category of CATEGORIES) {
    state = applyFourSelection(state, [HUB, ...category.words], CATEGORIES, HUB, BOARD_WORDS);
    assert.deepEqual(state.tiles, placed);
  }
  assert.equal(state.status, "won");
  assert.equal(state.solved.length, 4);
  assert.equal(spentWords(state.solved, CATEGORIES).size, 8);
  assert.equal(spentWords(state.solved, CATEGORIES).has(HUB), false);
  assert.equal(shareFour(2).includes("Garvin"), false);
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

/**
 * Player-facing progression is separate from the prototype experiment library.
 * The original thirteen experiments remain in engine.mjs for mathematical QA
 * and later worlds. PR15 will author and validate the remaining World 1 puzzles.
 */
import { LEVELS } from "./engine.mjs";

export const WORLD1_OPERATIONS = Object.freeze(["remove", "add", "divide", "multiply"]);
export const WORLD1_CHAPTERS = Object.freeze([
  { title: "Clearing the Room", description: "Remove equal weights from both chambers." },
  { title: "Equal Groups", description: "Split each room into complete, equal baskets." },
  { title: "Two-Step Experiments", description: "Combine different actions in a sensible order." },
  { title: "Across the Hall", description: "Find a way past sprites in both rooms." },
  { title: "Master of the Balance", description: "Choose your own route to the answer." }
]);

const firstExperiments = [
  { ...LEVELS[0], number: 1, title: "One little resident",
    chapter: "01 · Clearing the Room" },
  { id: "clearing-02", title: "Three weights in the way",
    chapter: "01 · Clearing the Room",
    prompt: "One dark sprite is sharing a room with three weights. Can you leave it alone?",
    left: { posX: 1, posOne: 3 }, right: { posOne: 7 }, solution: 4,
    startingOperation: "remove", startingKind: "posOne", startingAmount: 3,
    suggested: "Remove the same three weights from both rooms." },
  { id: "clearing-03", title: "A heavier mystery",
    chapter: "01 · Clearing the Room",
    prompt: "Keep the rooms balanced while clearing the weights beside the sprite.",
    left: { posX: 1, posOne: 5 }, right: { posOne: 9 }, solution: 4,
    startingOperation: "remove", startingKind: "posOne", startingAmount: 5,
    suggested: "Try taking five weights from each chamber." },
  { id: "clearing-04", title: "Clear the crowded chamber",
    chapter: "01 · Clearing the Room",
    prompt: "There are more weights this time. Which equal move will isolate the sprite?",
    left: { posX: 1, posOne: 7 }, right: { posOne: 12 }, solution: 5,
    startingOperation: "remove", startingKind: "posOne", startingAmount: 7,
    suggested: "Remove seven weights from both rooms." },
  { ...LEVELS[1], number: 5, chapter: "02 · Equal Groups" }
].map(level => Object.freeze({
  ...level, quantityMode: "positive", lockPositive: true,
  allowedOperations: WORLD1_OPERATIONS
}));

export const WORLD1_LEVELS = Object.freeze(Array.from({ length: 20 }, (_, i) => {
  const number = i + 1;
  const level = firstExperiments[i] || null;
  return Object.freeze({
    number, id: level?.id || "world1-" + String(number).padStart(2, "0"),
    title: level?.title || "Experiment " + String(number).padStart(2, "0"),
    chapterIndex: Math.floor(i / 4), available: !!level, level,
    legacyIndex: number === 5 ? 1 : 0
  });
}));

export const WORLDS = Object.freeze([
  { id: "workshop", number: 1, title: "The Balance Workshop",
    subtitle: "Positive whole numbers", theme: "warm",
    description: "Meet the black sprites and discover how to keep both rooms balanced.",
    available: true },
  { id: "opposites", number: 2, title: "The Opposite Chambers",
    subtitle: "Negative numbers", theme: "pale",
    description: "White sprites and balloons make remarkable zero pairs.",
    available: false },
  { id: "fractions", number: 3, title: "The Fraction Workshop",
    subtitle: "Fractions", theme: "glass",
    description: "A tiny piece can finally have its own mathematical value.",
    available: false },
  { id: "squares", number: 4, title: "The Square Laboratory",
    subtitle: "Squares and square roots", theme: "square",
    description: "Build squares inside the chamber, then work backwards.",
    available: false }
]);

export function findWorld1Level(number) {
  return WORLD1_LEVELS.find(item => item.number === Number(number)) || null;
}
export function isWorld1Unlocked(number, completed = [], teacher = false) {
  const slot = findWorld1Level(number);
  if (!slot?.available) return false; // Teacher access does not invent unfinished content.
  if (teacher || slot.number === 1) return true;
  return completed.includes(slot.number - 1);
}
export function nextWorld1Level(number, completed = [], teacher = false) {
  const slot = findWorld1Level(Number(number) + 1);
  return slot && isWorld1Unlocked(slot.number, completed, teacher) ? slot : null;
}

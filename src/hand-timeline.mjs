/**
 * Pure timing contract for the laboratory hand.
 * Each beat is part of one *physical* action. The balance engine still commits
 * the matching room change atomically and only during the "contact" beat.
 */
export const HAND_BEATS = Object.freeze({
  hover: 510,
  descend: 480,
  aim: 190,
  close: 290,
  contact: 450,
  lift: 430,
  withdraw: 680,
  arrange: 1600
});
export const HAND_BEATS_REDUCED = Object.freeze({
  hover: 90,
  descend: 110,
  aim: 80,
  close: 90,
  contact: 380,
  lift: 115,
  withdraw: 150,
  arrange: 140
});

/**
 * The same sequence handles all four operations without a fake result.
 * A removal collects its cargo at contact; an addition releases it there.
 */
export function handMotionPlan(action, reducedMotion = false) {
  if (!["add", "remove", "multiply", "divide", "square", "sqrt"].includes(action?.op))
    throw new TypeError("Unknown laboratory hand action");
  const placing = action.op === "add" || action.op === "multiply" || action.op === "square";
  const geometric = action.op === "square" || action.op === "sqrt";
  const timing = reducedMotion ? HAND_BEATS_REDUCED : HAND_BEATS;
  return {
    placing,
    cargoOnApproach: placing,
    phases: [
      { name: "approach", delay: timing.hover },
      { name: "reach", delay: timing.descend },
      { name: "aim", delay: timing.aim },
      // Allow the hand to build a matching column and fill a square (or
      // arrange an existing area into a square) before the mathematical step.
      ...(geometric ? [{ name: "arrange", delay: timing.arrange }] : []),
      { name: "grip", delay: timing.close },
      // Exactly one mathematical mutation at contact, never earlier or later.
      { name: "contact", delay: timing.contact, applyChange: true },
      { name: "lift", delay: timing.lift },
      { name: "exit", delay: timing.withdraw }
    ]
  };
}

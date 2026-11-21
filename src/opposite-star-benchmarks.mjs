/**
 * PR50/PR57 — independently certified shortest-legal-route star targets
 * for the 52 shipped Opposite Chambers levels (24 Guided + 16 + 12).
 *
 * These are RESULTS, not aliases of level.referenceRoute.length. The latter
 * remains a pedagogical example and may be longer than the fastest possible
 * legal route after later curriculum edits. The engine-backed audit test
 * certifies every value and fails if a shortcut or missing route appears.
 *
 * One committed two-sided operation is one move (including the two visits in
 * Independent mode or one accepted-and-replayed signed notebook operation).
 * All four signed object types, integer counts 1–12, multiply/divide 2–5,
 * whole-crate unpacking and optional free zero-pair attachments are in scope,
 * with the 48-object *post-cancellation* capacity rule.
 *
 * This source contains no routes or answers. Never use these numbers to
 * preselect an operation or object in the student interface.
 */
export const OPPOSITE_OPTIMAL_MOVES=Object.freeze({
  guided:Object.freeze([
    1,1,1,1, 2,3,3,3, 3,3,3,3, 3,3,3,3, 3,3,3,3,
    3,3,3,3
  ]),
  independent:Object.freeze([
    1,1,1,1, 2,2,3,3, 2,2,3,3, 3,3,3,3
  ]),
  notebook:Object.freeze([
    1,1,2,2, 2,3,3,3, 3,3,3,3
  ])
});
export const OPPOSITE_TOTAL_AVAILABLE_STARS=Object.values(OPPOSITE_OPTIMAL_MOVES)
  .reduce((total,stage)=>total+3*stage.length,0);

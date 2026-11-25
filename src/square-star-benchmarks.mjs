/** Certified whole-object shortest move targets for the public Guided and Independent
 * Square Laboratory. The independent finite-state search in
 * scripts/square-shortest-routes.mjs is checked against the engine in CI.
 * PR76 will certify the remaining Apprentice targets.
 */
export const SQUARE_GUIDED_OPTIMAL_MOVES=Object.freeze([
  1,1,1,1,1,1,1,2,2,2,3,3,2,2,3,3,3,3,3,4,3,4,4,6
]);

export const SQUARE_INDEPENDENT_OPTIMAL_MOVES=Object.freeze([
  1,1,1,1,1,2,2,3,2,2,3,3,3,3,3,3,3,4,4,6
]);
export const SQUARE_OPTIMAL_MOVES=Object.freeze({guided:SQUARE_GUIDED_OPTIMAL_MOVES,independent:SQUARE_INDEPENDENT_OPTIMAL_MOVES});

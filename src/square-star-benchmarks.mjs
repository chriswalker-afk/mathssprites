/** Certified whole-object shortest move targets for the public Guided
 * Square Laboratory. The independent finite-state search in
 * scripts/square-shortest-routes.mjs is checked against the engine in CI.
 * PR75/76 will certify and expose their respective stage targets.
 */
export const SQUARE_GUIDED_OPTIMAL_MOVES=Object.freeze([
  1,1,1,1,1,1,1,2,2,2,3,3,2,2,3,3,3,3,3,4,3,4,4,6
]);

/**
 * PR13 — pure plan for an attempted (and always reversible) fraction cut.
 *
 * A room with count = factor * whole + remainder is NOT successfully divided.
 * The whole groups would be fine, but each of the remaining 'remainder'
 * *actual whole objects* would have to be sliced into 'factor' equal fragments.
 *
 * Reconstructing the pieces from the plan yields precisely the original
 * remainder objects. We do not invent an extra sprite, a partial solution,
 * a fraction token, or an algebra transaction.
 */
export const CUTTABLE_KINDS=Object.freeze(["posX","negX","posX2","posOne","negOne"]);

export function fractionCutPlan(issue) {
  if(!issue||issue.code!=="fraction"||
    !CUTTABLE_KINDS.includes(issue.kind)||
    !Number.isInteger(issue.count)||issue.count<1||
    !Number.isInteger(issue.factor)||issue.factor<2||issue.factor>5||
    !Number.isInteger(issue.remainder)||
    issue.remainder<1||issue.remainder>=issue.factor||
    !Number.isInteger(issue.whole)||issue.whole<0||
    issue.count!==issue.factor*issue.whole+issue.remainder)
    throw new TypeError("Fraction cutting requires an exact unsplittable integer share");

  const sources=Array.from({length:issue.remainder},(_,sourceIndex)=>({
    sourceIndex,
    originalKind:issue.kind,
    pieces:Array.from({length:issue.factor},(_,sliceIndex)=>({
      sourceIndex,sliceIndex,piecesPerObject:issue.factor,
      // A continuous partition of one real sprite/weight with no overlaps.
      start:sliceIndex/issue.factor,
      end:(sliceIndex+1)/issue.factor,
      basket:sliceIndex,
      shareOfWhole:1/issue.factor
    }))
  }));
  const fragments=sources.flatMap(s=>s.pieces);
  if(fragments.length!==issue.remainder*issue.factor||
      sources.length*issue.factor!==fragments.length)
    throw new Error("The cutting plan must conserve objects");

  return {
    kind:issue.kind,whole:issue.whole,sourceCount:issue.count,
    factor:issue.factor,remainder:issue.remainder,sources,fragments,
    // Each imagined basket gets 'whole' intact objects and a fraction
    // of each remainder object. This remains an INVALID trial operation.
    eachBasket:{whole:issue.whole,numerator:issue.remainder,
      denominator:issue.factor}
  };
}

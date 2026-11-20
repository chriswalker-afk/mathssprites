/**
 * PR52 — presentation-only physical piles of five brass weights.
 *
 * Each original weight remains ONE direct '.token.weight' child of the floor
 * track: the hand, signed zero-pairs, fraction cut, basket transfer and
 * equation engine all continue to find real individual objects.
 *
 * A pile of five has three lower weights and two resting on their shoulders.
 * A last partial pile uses its first 1–3 lower positions, then its 4th and
 * 5th upper positions. No virtual weights or collapsed inventory.
 */
export const WEIGHT_PILE_SIZE=5;
export const WEIGHT_COUNT_LABEL_THRESHOLD=10;

export function weightPilePosition(index,total){
  if(!Number.isInteger(index)||!Number.isInteger(total)||total<1||index<0||index>=total)
    throw new RangeError("A pile position requires an existing whole weight");
  const pile=Math.floor(index/WEIGHT_PILE_SIZE);
  const slot=index%WEIGHT_PILE_SIZE+1;
  const pileSize=Math.min(WEIGHT_PILE_SIZE,total-pile*WEIGHT_PILE_SIZE);
  return Object.freeze({
    pile,slot,pileSize,row:slot<=3?"lower":"upper",
    last:slot===pileSize?pileSize:0
  });
}
export function weightCountPlaque(count){
  if(!Number.isInteger(count)||count<0)
    throw new RangeError("Only whole weights can have a count plaque");
  if(count<=WEIGHT_COUNT_LABEL_THRESHOLD)return "";
  // The scene's existing room aria-label gives the complete inventory.
  // This decorative sign uses the same metalwork and connector as crates.
  return '<span class="crate-stack-count weight-stack-count" aria-hidden="true">'+
    count+' weights<span class="crate-count-connector"></span></span>';
}

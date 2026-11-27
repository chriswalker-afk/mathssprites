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
  return '<span class="weight-stack-count" aria-hidden="true">'+
    count+' weights<span class="weight-count-connector"></span></span>';
}

/** PR110 — an opt-in free-play layout. The campaign's five-weight
 * planner and its existing slot metadata are deliberately untouched. */
export const WORKSHOP_WEIGHT_PILE_SIZE=10;
const WORKSHOP_PATTERNS=Object.freeze([
  [],[1],[2],[3],[4],[3,2],[3,2,1],[4,3],[4,3,1],[4,3,2],[4,3,2,1]
].map(Object.freeze));
export function workshopWeightPilePosition(index,total){
  if(!Number.isInteger(index)||!Number.isInteger(total)||total<1||index<0||index>=total)
    throw new RangeError("A pile position requires an existing whole weight");
  const pile=Math.floor(index/WORKSHOP_WEIGHT_PILE_SIZE);
  const slot=index%WORKSHOP_WEIGHT_PILE_SIZE+1;
  const pileSize=Math.min(WORKSHOP_WEIGHT_PILE_SIZE,total-pile*WORKSHOP_WEIGHT_PILE_SIZE);
  const rows=WORKSHOP_PATTERNS[pileSize],base=rows[0];
  let row=0,offset=slot-1;
  while(offset>=rows[row]){offset-=rows[row];row++;}
  // Stagger each upper row over the shoulders of its supporting row.
  const x=row/2+offset;
  const previous=row===0?x-1:offset>0?x-1:(row-1)/2+rows[row-1]-1;
  return Object.freeze({pile,slot,pileSize,row,x,base,rows:rows.length,
    delta:slot===1?0:x-previous,
    last:slot===pileSize?pileSize:0,
    tail:slot===pileSize?base-1-x:0,
    nextPile:slot===pileSize&&index<total-1});
}

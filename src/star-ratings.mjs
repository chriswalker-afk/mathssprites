/**
 * PR26 — move-efficient stars for the 48 IMPLEMENTED World 1 campaign levels.
 *
 * One move is one committed two-room equation operation. In Independent
 * Balance, two visits make ONE move. In Algebra Apprentice, one accepted and
 * successfully replayed notebook line is ONE move.
 *
 * The benchmarks below are exact shortest legal solution paths under the
 * current World 1 engine: whole positive objects, add/remove 1–12 of one kind,
 * multiply/divide by 2–5, and the 48-object room capacity. The unit test
 * independently checks that no level can be solved in fewer steps.
 *
 * The store is separate from the three existing completion stores: previous
 * completions remain complete, but their historical move counts are unknown,
 * so they are deliberately UNRATED until the level is replayed.
 */
export const STAR_RATINGS_KEY="mathssprites.stars.v1";
export const OPTIMAL_MOVES=Object.freeze({
  guided:Object.freeze([1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3,2,3,4]),
  independent:Object.freeze([1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3]),
  notebook:Object.freeze([1,1,2,2,2,2,2,2,2,3,3,4])
});
export const TOTAL_AVAILABLE_STARS=Object.values(OPTIMAL_MOVES)
  .reduce((sum,benchmarks)=>sum+3*benchmarks.length,0);

export function optimalMoves(stage,number){
  if(!Number.isInteger(number)||number<1)return null;
  return OPTIMAL_MOVES[stage]?.[number-1]??null;
}
export function starsForMoves(moves,optimal){
  if(!Number.isInteger(moves)||!Number.isInteger(optimal)||
    optimal<1||moves<optimal)return 0;
  return moves===optimal?3:moves===optimal+1?2:1;
}
export function blankRatings(){
  return {guided:{},independent:{},notebook:{}};
}
export function normalizeRatings(value){
  const result=blankRatings();
  for(const stage of Object.keys(OPTIMAL_MOVES)){
    const source=value?.[stage];
    if(!source||typeof source!=="object"||Array.isArray(source))continue;
    for(let number=1;number<=OPTIMAL_MOVES[stage].length;number++){
      const best=source[number];
      if(Number.isInteger(best)&&best>=optimalMoves(stage,number)&&best<=100000)
        result[stage][number]=best;
    }
  }
  return result;
}
export function loadRatings(storage){
  try{
    return normalizeRatings(JSON.parse(
      (storage??globalThis.localStorage)?.getItem(STAR_RATINGS_KEY)||"null"
    ));
  }catch{return blankRatings();}
}
export function saveRatings(value,storage){
  const clean=normalizeRatings(value);
  try{
    (storage??globalThis.localStorage)?.setItem(STAR_RATINGS_KEY,JSON.stringify(clean));
  }catch{}
  return clean;
}
export function bestMoves(value,stage,number){
  return normalizeRatings(value)[stage]?.[number]??null;
}
export function ratingForLevel(value,stage,number){
  const benchmark=optimalMoves(stage,number);
  if(benchmark===null)return 0;
  return starsForMoves(bestMoves(value,stage,number),benchmark);
}
export function recordBestMoves(value,stage,number,moves){
  const clean=normalizeRatings(value);
  const benchmark=optimalMoves(stage,number);
  if(benchmark===null||!Number.isInteger(moves)||moves<benchmark||moves>100000)
    return clean;
  const previous=clean[stage][number];
  clean[stage][number]=previous===undefined?moves:Math.min(previous,moves);
  return clean;
}
export function totalEarnedStars(value,stage=null){
  const clean=normalizeRatings(value);
  const stages=stage===null?Object.keys(OPTIMAL_MOVES):
    Object.hasOwn(OPTIMAL_MOVES,stage)?[stage]:[];
  return stages.reduce((sum,name)=>sum+
    OPTIMAL_MOVES[name].reduce((s,_,index)=>s+
      starsForMoves(clean[name][index+1],OPTIMAL_MOVES[name][index]),0),0);
}
export function starGlyphs(value){
  const n=Number.isInteger(value)?Math.max(0,Math.min(3,value)):0;
  return "★".repeat(n)+"☆".repeat(3-n);
}

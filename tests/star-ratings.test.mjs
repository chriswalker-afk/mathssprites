import test from "node:test";
import assert from "node:assert/strict";
import {initialState,perform,isSolved} from "../src/engine.mjs";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {INDEPENDENT_LEVELS} from "../src/independent-levels.mjs";
import {APPRENTICE_LEVELS} from "../src/apprentice-levels.mjs";
import {
  STAR_RATINGS_KEY,OPTIMAL_MOVES,TOTAL_AVAILABLE_STARS,optimalMoves,
  starsForMoves,starGlyphs,normalizeRatings,loadRatings,saveRatings,
  recordBestMoves,bestMoves,ratingForLevel,totalEarnedStars
} from "../src/star-ratings.mjs";

test("one completed mathematical move is 3 stars at par, 2 for +1, 1 for +2 or more",()=>{
  assert.equal(starsForMoves(2,2),3);
  assert.equal(starsForMoves(3,2),2);
  assert.equal(starsForMoves(4,2),1);
  assert.equal(starsForMoves(19,2),1);
  assert.equal(starsForMoves(1,2),0);
  assert.equal(starsForMoves(0,1),0);
  assert.equal(starsForMoves("3",2),0);
  assert.equal(starGlyphs(3),"★★★");
  assert.equal(starGlyphs(2),"★★☆");
  assert.equal(starGlyphs(1),"★☆☆");
  assert.equal(starGlyphs(0),"☆☆☆");
  assert.equal(optimalMoves("notebook",12),4);
  assert.equal(optimalMoves("guided",20),4);
  assert.equal(optimalMoves("guided",21),null);
  assert.equal(optimalMoves("other",1),null);
  assert.equal(TOTAL_AVAILABLE_STARS,168);
});

test("independent star storage retains only valid best move counts and never downgrades",()=>{
  const store=new Map();
  const storage={getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v)};
  assert.deepEqual(loadRatings(storage),{guided:{},independent:{},notebook:{}});
  let ratings=recordBestMoves(loadRatings(storage),"guided",9,4);
  assert.equal(ratingForLevel(ratings,"guided",9),1);
  ratings=recordBestMoves(ratings,"guided",9,3);
  assert.equal(ratingForLevel(ratings,"guided",9),2);
  ratings=recordBestMoves(ratings,"guided",9,2);
  assert.equal(ratingForLevel(ratings,"guided",9),3);
  ratings=recordBestMoves(ratings,"guided",9,6);
  assert.equal(bestMoves(ratings,"guided",9),2);
  ratings=recordBestMoves(ratings,"independent",1,1);
  ratings=recordBestMoves(ratings,"notebook",12,4);
  assert.equal(totalEarnedStars(ratings),9);
  assert.equal(totalEarnedStars(ratings,"guided"),3);
  ratings=saveRatings(ratings,storage);
  assert.deepEqual(loadRatings(storage),ratings);
  assert.equal(store.has(STAR_RATINGS_KEY),true);
  ratings=recordBestMoves(ratings,"notebook",12,3); // impossible par
  assert.equal(bestMoves(ratings,"notebook",12),4);
  ratings=recordBestMoves(ratings,"bogus",1,1);
  assert.equal(totalEarnedStars(ratings),9);
  assert.equal(totalEarnedStars(ratings,"bogus"),0);
});

test("legacy completions remain untouched and unrated; corrupted ratings are ignored",()=>{
  const old=JSON.stringify({completed:[1,2,3],lastPlayed:4});
  const stage2=JSON.stringify({completed:[1,2],lastPlayed:3});
  const store=new Map([
    ["mathssprites.progress.v1",old],
    ["mathssprites.independent-progress.v1",stage2]
  ]);
  const storage={getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v)};
  assert.equal(totalEarnedStars(loadRatings(storage)),0);
  assert.deepEqual(loadRatings(storage),{guided:{},independent:{},notebook:{}});
  saveRatings(recordBestMoves(loadRatings(storage),"guided",1,1),storage);
  assert.equal(store.get("mathssprites.progress.v1"),old);
  assert.equal(store.get("mathssprites.independent-progress.v1"),stage2);
  const dirty={guided:{"1":0,"2":1,"3":100001,"4":2,"21":1},
    independent:{"5":0,"7":"1"},notebook:{"12":4,"19":1}};
  assert.deepEqual(normalizeRatings(dirty),{
    guided:{"2":1,"4":2},independent:{},notebook:{"12":4}
  });
  assert.deepEqual(loadRatings({getItem(){throw Error("blocked")}}),
    {guided:{},independent:{},notebook:{}});
  assert.deepEqual(saveRatings({}, {setItem(){throw Error("blocked")}}),
    {guided:{},independent:{},notebook:{}});
});

/* Use the REAL engine in a bounded breadth-first search, independent of the
 * published benchmarks. This proves both the existence of a legal solution
 * at the stated par and the absence of any shorter permitted route. */
const allActions=[];
for(const kind of ["posX","posOne"]){
  for(const op of ["remove","add"]){
    for(let count=1;count<=12;count++)
      allActions.push({op,kind,count});
  }
}
for(const op of ["divide","multiply"])
  for(let factor=2;factor<=5;factor++)allActions.push({op,factor});

function keyOf(state){
  const a=state.left,b=state.right;
  // The state of a sealed crate is NOT equivalent to loose tokens, even
  // though their algebraic expressions have the same value.
  return [a.posX,a.posOne,a.crates?.count||0,
    b.posX,b.posOne,b.crates?.count||0].join(",");
}
function shortestLegalRoute(level,maximum){
  let frontier=[initialState(level)];
  let seen=new Set(frontier.map(keyOf));
  for(let depth=1;depth<=maximum;depth++){
    const next=[];
    for(const state of frontier)for(const action of [
      ...allActions,
      ...(level.groupedPrototype?[{op:"unpack",side:"left"},{op:"unpack",side:"right"}]:[])
    ]){
      const candidate=perform(state,action);
      if(!candidate.ok)continue;
      if(isSolved(candidate.state))return depth;
      const key=keyOf(candidate.state);
      if(seen.has(key))continue;
      seen.add(key);
      next.push(candidate.state);
    }
    frontier=next;
  }
  return null;
}
test("all 56 per-level star benchmarks are truly optimal under the legal World 1 engine",()=>{
  const stages={
    guided:WORLD1_LEVELS,independent:INDEPENDENT_LEVELS,notebook:APPRENTICE_LEVELS
  };
  for(const [stage,levels] of Object.entries(stages)){
    assert.equal(OPTIMAL_MOVES[stage].length,levels.length);
    for(const slot of levels){
      const par=optimalMoves(stage,slot.number);
      const actual=shortestLegalRoute(slot.level,par);
      assert.equal(actual,par,stage+" Level "+slot.number+" ("+slot.id+"): benchmark is not the shortest legal route");
    }
  }
});

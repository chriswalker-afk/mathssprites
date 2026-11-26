/**
 * PR35 — pure, world-independent student navigation decisions.
 *
 * These helpers use stable campaign IDs and rendered geometry. Nothing here
 * writes progress or changes mathematical puzzles.
 */
export function boardContinueLevel(stage,record,{resumed=false}={}){
  const playable=(stage?.levels||[]).filter(level=>level.available!==false);
  if(!playable.length)return null;
  const completed=new Set(Array.isArray(record?.completed)?record.completed:[]);
  const last=playable.find(level=>level.id===record?.lastPlayed);
  // Resume an unfinished attempt; otherwise suggest the next unfinished
  // experiment. A mastered stage offers a replay instead of a dead end.
  const target=(last&&!completed.has(last.id)?last:null)||
    playable.find(level=>!completed.has(level.id))||last||playable[0];
  return {
    id:target.id,number:target.number,
    action:completed.has(target.id)?"Replay":
      last?.id===target.id&&
        (resumed||completed.size>0||target.id!==playable[0].id)
        ?"Continue":"Play"
  };
}
const DIRECTIONS={
  ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]
};
/**
 * Choose the closest tile in the requested VISUAL direction. This works
 * with 5-column desktop chapter sheets as well as mobile 2-column grids;
 * it does not assume fixed chapter sizes or a hard-coded world.
 */
export function spatialTileIndex(rectangles,index,key){
  if(!Array.isArray(rectangles)||index<0||index>=rectangles.length)
    return index;
  if(key==="Home")return 0;
  if(key==="End")return rectangles.length-1;
  const dir=DIRECTIONS[key];
  if(!dir)return index;
  const center=r=>({x:r.left+r.width/2,y:r.top+r.height/2});
  const source=center(rectangles[index]);
  let best=index,bestScore=Infinity;
  rectangles.forEach((rect,i)=>{
    if(i===index||!rect||rect.width<=0||rect.height<=0)return;
    const dest=center(rect),dx=dest.x-source.x,dy=dest.y-source.y;
    const along=dx*dir[0]+dy*dir[1];
    if(along<=3)return;
    const across=Math.abs(dx*dir[1]-dy*dir[0]);
    const score=along+across*5;
    if(score<bestScore){best=i;bestScore=score;}
  });
  return best;
}

/** Guard incomplete menu selections; browsing never changes progress. */
export function campaignMenuScreen(requested,world,stage){
  if(requested==="levels"){
    if(!world?.available)return "worlds";
    if(!stage?.available||!world.stages.some(s=>s.id===stage.id&&s.available))return "stages";
  }
  if(requested==="stages"&&!world?.available)return "worlds";
  return requested;
}
export function campaignHomeLabel(world,stage,number,completed=false){
  const mode=stage.method==="auto"?"Guided":stage.method==="manual"?"Independent":
    stage.method==="notebook"?"Algebra Apprentice":stage.title;
  const worldName=({workshop:"Balance",opposites:"Opposites",fractions:"Fractions",squares:"Squares"})[world.id]||world.title;
  return (completed?"Replay: ":"Continue: ")+worldName+" · "+mode+" · Level "+number+" →";
}

/** Preserve the explicitly chosen learning method when changing worlds.
 * A future world without that method returns to its choice screen. */
export function quickBoardDestination(world,previous){
  if(!world?.available||!previous)return null;
  const available=world.stages.filter(s=>s.available);
  return available.find(s=>s.id===previous.id&&s.method===previous.method)||
    available.find(s=>s.method===previous.method)||null;
}

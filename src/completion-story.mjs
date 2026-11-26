/** The standard comic consumes committed engine snapshots for all worlds. */
import {fractionParts} from "./fraction-engine.mjs";
import {rtext} from "./rational.mjs";
import {areaArrangement} from "./engine.mjs";
import {inRoomBoxPlan,areaMathLabel} from "./area-layout.mjs";
import {miniSpriteMarkup} from "./square-sprites.mjs";

export function storyEntries(state){
  return [{after:state.history[0]?.before||{left:state.left,right:state.right}},
    ...state.history.map(entry=>({...entry}))];
}
const whole=(kind)=>kind==="posX"?miniSpriteMarkup("posX"):'<span class="mini-token posOne" aria-hidden="true"></span>';
function fractionalAmount(value,kind){
  const {whole:count,pieces,denominator}=fractionParts(value);
  const title=kind==="posX"?"sprites":"weights";
  const partial=pieces?'<span class="comic-fraction-piece '+(kind==="posX"?"sprite-piece":"weight-piece")+'" style="--fraction-fill:'+(pieces/denominator*100)+'%;--fraction-step:'+(100/denominator)+'%" data-numerator="'+pieces+'" data-denominator="'+denominator+'"><i aria-hidden="true"></i><small>'+pieces+'/'+denominator+'</small></span>':"";
  return count||pieces?'<span class="comic-fraction-inventory" role="img" aria-label="'+rtext(value)+' '+title+'">'+
    Array.from({length:count},()=>whole(kind)).join("")+partial+'</span>':"";
}
export function fractionStoryItems(room){
  return fractionalAmount(room.posX,"posX")+fractionalAmount(room.posOne,"posOne")||'<span class="mini-empty">empty</span>';
}
const types={"square-sprite":"posX2","round-sprite":"posX","weight":"posOne"};
function areaRoom(room,op,name){
  const area=areaArrangement(room,op);
  if(!area||!area.cells)return "";
  const plan=inRoomBoxPlan(area);
  const tracks=plan.tracks.map(n=>n+"fr").join(" ");
  const dimensions='style="grid-template-columns:'+tracks+';grid-template-rows:'+tracks+'"';
  const grid='<div class="comic-area-grid" '+dimensions+' aria-hidden="true">'+plan.cells.map(c=>
    '<i class="comic-area-cell '+types[c.type]+'" data-kind="'+types[c.type]+'"></i>').join("")+'</div>';
  const side='<span class="comic-area-side" aria-hidden="true">'+plan.horizontal.map(c=>
    '<i class="comic-area-cell '+(c.type==="sprite"?"posX":"posOne")+'"></i>').join("")+'</span>';
  return '<div class="comic-area-room" role="img" aria-label="'+name+': '+areaMathLabel(area)+'"><span>'+name+'</span><div class="comic-area-route">'+
    (op==="square"?side+'<b aria-hidden="true">→</b>'+grid:grid+'<b aria-hidden="true">→</b>'+side)+'</div></div>';
}
export function squareStoryMarkup(entry){
  const op=entry.action?.op;
  if(!["square","sqrt"].includes(op)||!entry.before)return "";
  return '<div class="comic-square-story" data-square-operation="'+op+'">'+
    areaRoom(entry.before.left,op,"West")+areaRoom(entry.before.right,op,"East")+'</div>';
}

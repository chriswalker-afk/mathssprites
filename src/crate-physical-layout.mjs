/**
 * Physical landing plan for original sealed crates and signed group contents.
 * The numeric signature is retained for all existing World 1 calls.
 *
 * Signed use: crateFloorLandingPlan(width, floorY,
 *   {posX:2,negX:1,posOne:3,negOne:2}, {rightInset:...}).
 * The return includes per-kind slots as well as legacy sprites/weights arrays.
 */
export function crateFloorLandingPlan(width,floorY,spriteCount,weightCount,options={}){
  const signed=typeof spriteCount==="object"&&spriteCount!==null;
  const values=signed?spriteCount:
    {posX:spriteCount,negX:0,posOne:weightCount,negOne:0};
  const insets=signed?(weightCount||{}):options;
  const {leftInset=0,rightInset=0}=insets;
  const kinds=["posX","negX","posOne","negOne"];
  if(!Number.isFinite(width)||width<100||!Number.isFinite(floorY)||
      kinds.some(kind=>!Number.isInteger(values[kind]??0)||(values[kind]??0)<0)||
      !kinds.some(kind=>(values[kind]??0)>0))
    throw new RangeError("Valid chamber geometry and whole object counts are required.");
  if(!Number.isFinite(leftInset)||!Number.isFinite(rightInset)||
     leftInset<0||rightInset<0||leftInset+rightInset>=width)
    throw new RangeError("Landing space must be inside the original room.");
  const counts=Object.fromEntries(kinds.map(kind=>[kind,values[kind]??0]));
  const available=width-leftInset-rightInset;
  const total=kinds.reduce((n,kind)=>n+counts[kind],0);
  const dimensions={posX:[46,47],negX:[46,47],posOne:[29,32],negOne:[34,61]};
  const space=4;
  const natural=kinds.reduce((n,kind)=>n+counts[kind]*dimensions[kind][0],0)+
    (total-1)*space;
  const scale=Math.min(1,Math.max(2,available-12)/natural);
  const gap=space*scale;
  const occupied=natural*scale;
  let x=leftInset+(available-occupied)/2;
  const slots=[],byKind={posX:[],negX:[],posOne:[],negOne:[]};
  for(const tokenKind of kinds){
    for(let i=0;i<counts[tokenKind];i++){
      const [w,h]=dimensions[tokenKind];
      const kind={posX:"sprite",negX:"white-sprite",
        posOne:"weight",negOne:"balloon"}[tokenKind];
      const landing=Object.freeze({
        kind,tokenKind,index:i,left:x,top:floorY-h*scale,
        width:w*scale,height:h*scale,scale
      });
      slots.push(landing);
      byKind[tokenKind].push(landing);
      x+=w*scale+gap;
    }
  }
  for(const kind of kinds)byKind[kind]=Object.freeze(byKind[kind]);
  const parts=Object.freeze(byKind);
  return Object.freeze({
    scale,slots:Object.freeze(slots),byKind:parts,
    sprites:Object.freeze([...parts.posX,...parts.negX]),
    weights:Object.freeze([...parts.posOne,...parts.negOne]),
    whiteSprites:parts.negX,balloons:parts.negOne,
    occupied
  });
}

/** Distinct origins for each crate, yet identical launch times for sprites.
 * Small offsets prevent a rigid synchronized arc without teaching one-at-a-time
 * multiplication. Every bounce returns to exactly the floor landing point. */
export function spriteEscapeKeyframes(dx,dy,index=0,reduced=false){
  if(reduced)return [
    {transform:"translate("+dx+"px,"+dy+"px) scale(.84)",opacity:.9},
    {transform:"translate(0px,0px) scale(1)",opacity:1}
  ];
  const swing=(index%2===0?-1:1)*5;
  return [
    {offset:0,transform:"translate("+dx+"px,"+dy+"px) scale(.76,.86)",opacity:1},
    {offset:.27,transform:"translate("+(dx*.72+swing)+"px,"+(dy*.46-35)+"px) scale(.96,1.1)",opacity:1},
    {offset:.53,transform:"translate("+(dx*.35)+"px,"+(dy*.2-57)+"px) scale(1.05,.94)",opacity:1},
    {offset:.72,transform:"translate(0px,0px) scale(1.13,.78)",opacity:1},
    {offset:.84,transform:"translate(0px,-19px) scale(.96,1.07)",opacity:1},
    {offset:1,transform:"translate(0px,0px) scale(1)",opacity:1}
  ];
}
export function weightEscapeKeyframes(dx,dy,index=0,reduced=false){
  if(reduced)return [
    {transform:"translate("+dx+"px,"+dy+"px) scale(.85)",opacity:.9},
    {transform:"translate(0px,0px) scale(1)",opacity:1}
  ];
  const wobble=(index%2===0?-1:1)*14;
  return [
    {offset:0,transform:"translate("+dx+"px,"+dy+"px) rotate(0deg) scale(.8)",opacity:1},
    {offset:.38,transform:"translate("+(dx*.55)+"px,"+(dy*.52-24)+"px) rotate("+wobble+"deg)",opacity:1},
    {offset:.70,transform:"translate(0px,0px) rotate("+(-wobble)+"deg) scale(1.08,.87)",opacity:1},
    {offset:.83,transform:"translate(0px,-7px) rotate("+Math.round(wobble/3)+"deg)",opacity:1},
    {offset:1,transform:"translate(0px,0px) rotate(0deg) scale(1)",opacity:1}
  ];
}

/** A light lift from the opened crate, not a falling brass-weight arc.
 * Balloon strings and bodies stay attached during the entire release. */
export function balloonEscapeKeyframes(dx,dy,index=0,reduced=false){
  if(reduced)return [
    {transform:"translate("+dx+"px,"+dy+"px) scale(.84)",opacity:.9},
    {transform:"translate(0px,0px) scale(1)",opacity:1}
  ];
  const drift=index%2===0?-12:12;
  return [
    {offset:0,transform:"translate("+dx+"px,"+dy+"px) scale(.88)",opacity:1},
    {offset:.34,transform:"translate("+(dx*.65+drift*.3)+"px,"+(dy*.55-19)+"px) scale(.97)",opacity:1},
    {offset:.67,transform:"translate("+(dx*.22+drift)+"px,"+(dy*.2-42)+"px) scale(1.04)",opacity:1},
    {offset:.88,transform:"translate("+Math.round(drift/3)+"px,-11px) scale(.99)",opacity:1},
    {offset:1,transform:"translate(0px,0px) scale(1)",opacity:1}
  ];
}

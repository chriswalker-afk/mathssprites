/**
 * Physical floor choreography for opaque sealed crates.
 *
 * All coordinates are inside the existing chamber, not inside an abstract
 * demonstration tray. Returns bounded landing slots for REAL token artwork.
 * The calculation adapts to compact phones, tall desktops and 1/2/N crates.
 */
export function crateFloorLandingPlan(width,floorY,spriteCount,weightCount){
  if(!Number.isFinite(width)||width<100||!Number.isFinite(floorY)||
      !Number.isInteger(spriteCount)||!Number.isInteger(weightCount)||
      spriteCount<0||weightCount<0||spriteCount+weightCount<1)
    throw new RangeError("Valid chamber geometry and whole object counts are required.");
  const total=spriteCount+weightCount;
  const spriteWidth=46,weightWidth=29,space=4;
  const natural=spriteCount*spriteWidth+weightCount*weightWidth+(total-1)*space;
  const scale=Math.min(1,Math.max(.3,(width-18)/natural));
  const gap=space*scale;
  const occupied=natural*scale;
  let x=(width-occupied)/2;
  const slots=[];
  for(let i=0;i<total;i++){
    const sprite=i<spriteCount;
    const w=(sprite?spriteWidth:weightWidth)*scale;
    const h=(sprite?47:32)*scale;
    slots.push(Object.freeze({
      kind:sprite?"sprite":"weight",
      index:sprite?i:i-spriteCount,
      left:x,
      top:floorY-h,
      width:w,height:h,scale
    }));
    x+=w+gap;
  }
  return Object.freeze({
    scale,slots:Object.freeze(slots),
    sprites:Object.freeze(slots.slice(0,spriteCount)),
    weights:Object.freeze(slots.slice(spriteCount)),
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

/** PR24: lively, physically consistent home-screen balancing story. */
export const HERO_SPRITE_MASS=3;
export const HERO_STEP_MS=460;
export const HERO_LANDING_MS=570;
export const HERO_HOLD_MS=1350;
export const HERO_CHANGE_MS=650;

/**
 * Irregular, authored spacing deliberately makes the drops look playful.
 * Short gaps allow objects to be airborne at the same time; longer gaps let
 * the beam visibly tip before another sprite or weight arrives.
 * The finished balance always uses the SAME unknown mass.
 */
const beat=(side,kind,gapMs=HERO_STEP_MS,drift=0)=>Object.freeze({
  side,kind,gapMs,drift
});
const scene=(id,caption,steps,continuePrevious=false)=>Object.freeze({
  id,caption,continuePrevious,steps:Object.freeze(steps)
});

export const HERO_SCENES=Object.freeze([
  scene("mystery","Which side will sink first?",[
    beat("right","weight",340,9),
    beat("left","sprite",720,-16),
    beat("right","weight",530,-10),
    beat("right","weight",500,13)
  ]),
  scene("add-equally","Adding to both sides brings new surprises.",[
    beat("right","weight",250,-13),
    beat("right","weight",480,12),
    beat("left","weight",600,-12),
    beat("left","weight",640,14)
  ],true),
  scene("two-sprites","The weights tumble in. The sprites bounce back!",[
    beat("right","weight",230,-15),
    beat("left","sprite",630,13),
    beat("right","weight",310,9),
    beat("right","weight",700,-9),
    beat("left","sprite",330,-13),
    beat("right","weight",250,8),
    beat("right","weight",640,-11),
    beat("right","weight",570,12)
  ]),
  scene("both-sides","Even with sprites everywhere, the scale can settle.",[
    beat("right","weight",240,8),
    beat("right","weight",300,-10),
    beat("right","weight",630,13),
    beat("left","sprite",200,-12),
    beat("right","sprite",680,9),
    beat("left","sprite",350,15),
    beat("right","weight",600,-12),
    beat("left","weight",620,10)
  ])
]);
export function emptyHeroCounts(){
  return {left:{sprite:0,weight:0},right:{sprite:0,weight:0}};
}
export function heroMass(contents){
  return contents.sprite*HERO_SPRITE_MASS+contents.weight;
}
export function heroAngle(leftMass,rightMass){
  // CSS positive rotation lowers the right-hand end of the beam.
  return Math.max(-9,Math.min(9,(rightMass-leftMass)*2.5));
}
export function heroAfterScene(index){
  if(!Number.isInteger(index)||index<0||index>=HERO_SCENES.length)
    throw new RangeError("Unknown home hero scene.");
  const counts=emptyHeroCounts();
  for(let i=0;i<=index;i++){
    const current=HERO_SCENES[i];
    if(!current.continuePrevious){
      for(const side of ["left","right"])counts[side]={sprite:0,weight:0};
    }
    for(const step of current.steps)counts[step.side][step.kind]++;
  }
  return counts;
}

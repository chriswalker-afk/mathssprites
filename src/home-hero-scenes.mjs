/** PR23: decorative home-screen balancing story, not a second game engine. */
export const HERO_SPRITE_MASS=3;
export const HERO_STEP_MS=470;
export const HERO_LANDING_MS=310;
export const HERO_HOLD_MS=1250;
export const HERO_CHANGE_MS=650;

const beat=(side,kind)=>Object.freeze({side,kind});
const scene=(id,caption,steps,continuePrevious=false)=>Object.freeze({
  id,caption,continuePrevious,steps:Object.freeze(steps)
});

/**
 * All final arrangements encode the SAME unknown: one sprite balances
 * three weights. The second scene continues directly from the first.
 */
export const HERO_SCENES=Object.freeze([
  scene("mystery","One little mystery. Three little weights.",[
    beat("left","sprite"),beat("right","weight"),beat("right","weight"),
    beat("right","weight")
  ]),
  scene("add-equally","What happens if both sides get two more weights?",[
    beat("left","weight"),beat("right","weight"),beat("left","weight"),
    beat("right","weight")
  ],true),
  scene("two-sprites","Two sprites. Can the weights keep up?",[
    beat("right","weight"),beat("left","sprite"),beat("right","weight"),
    beat("left","sprite"),beat("right","weight"),beat("right","weight"),
    beat("right","weight"),beat("right","weight")
  ]),
  scene("both-sides","Sprites on both sides — still perfectly balanced.",[
    beat("right","sprite"),beat("left","sprite"),beat("left","sprite"),
    beat("left","weight"),beat("right","weight"),beat("right","weight"),
    beat("right","weight"),beat("right","weight")
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

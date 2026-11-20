/** World 2 first-lesson cues; never share World 1's tutorial save keys. */
const key=stage=>"mathssprites.opposites-guide-"+stage+".v1";
export function readOppositesGuideSeen(stage,storage){
  try{return (storage??globalThis.localStorage)?.getItem(key(stage))==="true"}catch{return false}
}
export function writeOppositesGuideSeen(stage,seen,storage){
  try{(storage??globalThis.localStorage)?.setItem(key(stage),String(!!seen))}catch{}
  return !!seen;
}
/** Three skippable steps before a student's first signed move. */
export function oppositeIntroductionCue(step,{manual=false}={}){
  const cues=manual?[
    {title:"Two rooms, signed objects",text:"The balloon represents a negative unit. Look at the balance before moving the hand.",
      action:"Show the controls",target:"scene"},
    {title:"Choose a matching change",text:"Choose a mathematical change, then select the objects and amount yourself. You will visit the rooms separately.",
      action:"Show the rooms",target:"amount"},
    {title:"Visit one chamber",text:"Use the hand in either room. The scale will tip until you repeat exactly that move in the other.",
      action:"Ready to balance",target:"left-action"},
    {title:"You are in control",text:"Match every signed move. A weight and a balloon can make zero in only one room, and equality still holds after both visits.",
      action:null,target:"right-action"}
  ]:[
    {title:"Welcome to the opposite chambers",text:"Balloons lift up: each represents negative one. A brass weight represents positive one.",
      action:"Find a zero pair",target:"scene"},
    {title:"Watch opposites meet",text:"When a weight meets a balloon they float away together. That is zero — no value has been lost.",
      action:"Choose the weights",target:"amount"},
    {title:"Keep both rooms balanced",text:"Look at the balloons and weights, then choose a matching change. The hand will perform it in both rooms.",
      action:"Find the hand",target:"do-both"},
    {title:"Your first signed experiment",text:"Try the move. Later, pale sprites will cancel dark sprites in the same way. The notebook will show the maths.",
      action:null,target:"do-both"}
  ];
  const index=Math.max(0,Math.min(cues.length-1,Number(step)||0));
  return {...cues[index],progress:(index+1)+" of "+cues.length};
}

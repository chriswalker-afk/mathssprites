/**
 * World 2 campaign: 24 Guided, 20 Independent and 16 Algebra Apprentice.
 *
 * White sprites represent −x; balloons represent −1. The mystery value x
 * remains a POSITIVE whole number, so the sign has a stable physical meaning.
 * Reference routes are engine-valid authored paths used for QA and star targets;
 * they are never revealed during physical gameplay.
 */
import {OPPOSITE_GUIDED_RAW} from "./opposite-guided.mjs";
import {OPPOSITE_INDEPENDENT_RAW} from "./opposite-independent.mjs";
import {OPPOSITE_APPRENTICE_RAW} from "./opposite-apprentice.mjs";

export const OPPOSITE_OPERATIONS=Object.freeze(["remove","add","divide","multiply"]);
export const OPPOSITE_CRATE_OPERATIONS=Object.freeze([...OPPOSITE_OPERATIONS,"unpack"]);
export const OPPOSITE_KINDS=Object.freeze(["posX","negX","posOne","negOne"]);

/**
 * PR49 changes the actual mathematical/physical demand of these existing IDs.
 * IDs and positions stay stable; old completions are archived separately
 * rather than silently granting completion or stars for a revised puzzle.
 * A revision is never a source of hints or a starting control selection.
 */
export const OPPOSITE_CONTENT_REVISIONS=Object.freeze({
 guided:Object.freeze([5,6,9,10,18]),
 independent:Object.freeze([5,6,15]),
 notebook:Object.freeze([5,6,8])
});
export const OPPOSITE_CHAPTERS=Object.freeze({
 guided:[
  {id:"balloon-basics",title:"Balloons Make Zero",description:"Balloons lift their opposite weights away."},
  {id:"white-visitors",title:"The White Visitors",description:"White sprites cancel dark sprites."},
  {id:"two-opposites",title:"Two Kinds of Zero",description:"Combine two forms of opposite pair."},
  {id:"opposite-directions",title:"Across the Mirror",description:"Reversed equations and negative variable terms."},
  {id:"signed-strategy",title:"Master of Opposites",description:"Choose efficient routes through signed equations."},
  {id:"sealed-opposites",title:"The Sealed Opposites",description:"Open physical groups and discover opposites inside."}
 ],
 independent:[
  {id:"two-chambers",title:"Two Hands, Two Signs",description:"Repeat signed operations in both rooms."},
  {id:"matching-opposites",title:"The Matching Experiment",description:"Match every hand move, even if cancellations differ."},
  {id:"signed-baskets",title:"Signed Groups",description:"Prepare whole groups by cancelling opposites."},
  {id:"moonlit-mastery",title:"The Moonlit Challenge",description:"Make independent choices with mixed signed objects."},
  {id:"independent-crates",title:"The Two-Handed Crates",description:"Open signed groups locally, then match both hands for every algebraic move."}
 ],
 notebook:[
  {id:"signed-writing",title:"Writing the Opposites",description:"Write each signed operation before sprites move."},
  {id:"choose-the-sign",title:"Choose the Sign",description:"Represent negative terms precisely with the editor."},
  {id:"signed-apprentice",title:"Apprentice of Opposites",description:"Combine multiple signed algebra operations independently."},
  {id:"signed-brackets",title:"Brackets of Opposites",description:"Expand signed brackets in the maths editor and replay the physical crates."}
 ]
});
export function decodeOppositeRoute(route){
  return route.split("|").map(step=>{
    const [op,kind,count]=step.split(":");
    if(op==="unpack"){
      if(!["left","right"].includes(kind)||count!==undefined)
        throw new RangeError("An unpack route must name its chamber.");
      return Object.freeze({op,side:kind});
    }
    return op==="divide"||op==="multiply"
      ?Object.freeze({op,factor:Number(kind)})
      :Object.freeze({op,kind,count:Number(count)});
  });
}
const physical=counts=>({
  posX:counts[0],negX:counts[1],posOne:counts[2],negOne:counts[3]
});
const INTRO={
 guided:[
  "A balloon is an opposite weight. Try making a visible zero pair.",
  "White sprites are opposite to black sprites. Explore their meeting.",
  "Both sorts of opposites can simplify a balance without changing it.",
  "The rooms may face either way. A white sprite still means negative x.",
  "Find a short route by making signed zero pairs and whole baskets.",
  "Some crates contain objects that pull upwards. Choose whether to open or share the sealed groups."
 ],
 independent:[
  "Move the hand in one room, then match that signed action in the other.",
  "Different zero pairs can form locally, but each hand action must match.",
  "Clear opposite objects, then make equal groups of WHOLE pieces.",
  "Look for a short, justified route through both signed rooms.",
  "A crate can be opened in one room without tipping the balance. Other changes still need matching hand visits."
 ],
 notebook:[
  "Use the operation editor: the new equation is calculated for you.",
  "Choose how negative terms are added or removed from BOTH sides.",
  "Write your operations independently, then replay them with sprites.",
  "Treat each sealed crate as a bracketed group. Choose and check each step before the sprites replay it."
 ]
};
function stageLevels(id,rows){
  const chapters=OPPOSITE_CHAPTERS[id];
  if(rows.length!==chapters.length*4)
    throw new Error("World 2 chapter sizes must mirror World 1.");
  return Object.freeze(rows.map((raw,i)=>{
    const [title,west,east,solution,route,suggested,options]=raw;
    const number=i+1,chapterIndex=Math.floor(i/4);
    const key={guided:"g",independent:"i",notebook:"a"}[id];
    const levelId="op-"+key+"-"+String(number).padStart(2,"0");
    const referenceRoute=Object.freeze(decodeOppositeRoute(route));
    const first=referenceRoute[0];
    const scaffold=id!=="notebook"?undefined:{
      kind:["model","first","last","none"][i%4],
      heading:["Look at another example","Choose a first operation",
               "Think about the last step","Work independently"][i%4],
      text:(i>=12?[
        "The distributive law gives a(b + c) = ab + ac. Expanding brackets changes the form, not the value.",
        "Consider dividing by a common factor or expanding brackets. Both preserve equivalence when applied correctly.",
        "Aim for a coefficient of 1 on the variable side, with only a constant on the other side.",
        "Each written line must follow from one supported operation on both sides or an equivalent expansion."
      ]:[
        "For example, x − 2 = 7 becomes x = 9 by adding 2 to both sides. The additive inverse satisfies −2 + 2 = 0.",
        "Use additive inverses to simplify like terms: a + (−a) = 0. Choose an operation that preserves equality.",
        "Finish with x on one side and a constant on the other. Which inverse operation makes the coefficient equal to 1?",
        "Choose your own route. Each operation must preserve equivalence."
      ])[i%4]
    };
    // PR57: new grouped levels add one sealed package to an ordinary
    // four-kind loose inventory. Old array rows are not rewritten.
    const sourceCrate=options?.crates||options?.rightCrates||null;
    if(options?.crates&&options?.rightCrates)
      throw new RangeError("Each level currently shows one separately opened crate stack.");
    const sealed=sourceCrate
      ?Object.freeze({count:sourceCrate.count,
        contents:Object.freeze({...sourceCrate.contents})}):null;
    const crateSide=options?.rightCrates?"right":"left";
    const level=Object.freeze({
      id:levelId,title,number,solution,
      contentRevision:OPPOSITE_CONTENT_REVISIONS[id].includes(number)?2:1,
      left:Object.freeze({...physical(west),...(sealed&&crateSide==="left"?{crates:sealed}:{})}),
      right:Object.freeze({...physical(east),...(sealed&&crateSide==="right"?{crates:sealed}:{})}),
      ...(sealed?{groupedPrototype:true}:{}),
      chapter:String(chapterIndex+1).padStart(2,"0")+" · "+chapters[chapterIndex].title,
      prompt:INTRO[id][chapterIndex],
      signedIntroduction:number===1&&id!=="notebook",
      suggested,quantityMode:"signed",lockPositive:false,
      allowedKinds:OPPOSITE_KINDS,
      allowedOperations:sealed?OPPOSITE_CRATE_OPERATIONS:OPPOSITE_OPERATIONS,
      startingOperation:first.op,
      ...(first.kind?{startingKind:first.kind,startingAmount:first.count}
        :first.factor?{startingFactor:first.factor}:{}),
      referenceRoute,...(scaffold?{scaffold}:{})
    });
    return Object.freeze({id:levelId,number,title,chapterIndex,level,available:true});
  }));
}
export const OPPOSITE_LEVELS=Object.freeze({
 guided:stageLevels("guided",OPPOSITE_GUIDED_RAW),
 independent:stageLevels("independent",OPPOSITE_INDEPENDENT_RAW),
 notebook:stageLevels("notebook",OPPOSITE_APPRENTICE_RAW)
});
export const OPPOSITE_STAGE_ORDER=Object.freeze(["guided","independent","notebook"]);
export const OPPOSITE_LEVEL_COUNT=OPPOSITE_STAGE_ORDER.reduce(
 (count,id)=>count+OPPOSITE_LEVELS[id].length,0);
if(OPPOSITE_LEVEL_COUNT!==60)
  throw new Error("The Opposite Chambers require 24+20+16 levels.");

/** World 3 campaign definitions. Only Guided is published by PR64.
 * Reference routes stay in fraction-level-plan.mjs, never in the controls. */
import {FRACTION_LEVEL_PLAN} from "./fraction-level-plan.mjs";
import {FRACTION_KINDS,FRACTION_OPERATIONS} from "./fraction-engine.mjs";
import {rational,rsub,rcompare} from "./rational.mjs";
const chapters={
  "guided": [
    [
      "Sharing the Leftovers",
      "Equal sharing creates fractional answers."
    ],
    [
      "Little Pieces",
      "Remove fractional weights from both rooms."
    ],
    [
      "Changing Pieces",
      "Find equivalent pieces and borrow from wholes."
    ],
    [
      "Pieces of Sprites",
      "Rebuild a whole sprite from its fragments."
    ],
    [
      "Fractional Mysteries",
      "Combine sharing and removal."
    ],
    [
      "Master of Fractions",
      "Work with fractional objects in both rooms."
    ]
  ],
  "independent": [
    [
      "Equal Shares",
      "Match equal sharing in both rooms."
    ],
    [
      "Fractional Weights",
      "Match changes to fractional weights."
    ],
    [
      "Fractional Sprites",
      "Rebuild sprites independently."
    ],
    [
      "Multiple Operations",
      "Choose and match a sequence of moves."
    ],
    [
      "Across the Balance",
      "Handle fractional objects in both rooms."
    ]
  ],
  "notebook": [
    [
      "Fractional Answers",
      "Record exact fractional answers."
    ],
    [
      "Fractional Terms",
      "Work with fractional terms."
    ],
    [
      "Multi-step Equations",
      "Record a sequence of exact operations."
    ],
    [
      "Strategic Equations",
      "Choose efficient operations."
    ]
  ]
};
const names=["Share the spare weight","Three equal shares","Four equal shares","Five equal shares","A half weight","Two thirds to remove","Borrow a whole","Fifths on the other side","Halves and quarters","Halves and thirds","Eighths and quarters","Fifths and halves","Half a sprite","One third of a sprite","Three quarters of a sprite","Two fifths of a sprite","A half and a whole weight","Thirds and weights","Three quarters and a half","The other chamber","Sprites on both sides","Quarter sprite exchange","A sixth remains","The twelfths challenge"];
const stageData={
  guided:{title:"Guided Fractions",tagline:"Discover the value of every piece.",intro:"Choose a move. The hand mirrors it in both chambers.",finale:"All 24 Guided fraction experiments complete!",icon:"½",method:"auto",emblems:["÷","½","⅙","⅔","✦","⇄"]},
  independent:{title:"Independent Fractions",tagline:"Match each fractional move.",intro:"Change one chamber, then match the move in the other.",icon:"⇄",method:"manual",emblems:["÷","½","⅔","✦","⇄"]},
  notebook:{title:"Fractional Algebra Apprentice",tagline:"Write exact fractional operations.",intro:"Record operations using exact fractions.",icon:"✎",method:"notebook",emblems:["✎","½","≡","✦"]}
};
/** Lower bound for any legal route. A successful route scales |a-c| to
 * one; addition/removal cannot change this difference. Factors 2,3,4,5
 * change one prime exponent at a time (at most two for prime 2).
 * If a kind is initially positive in both rooms it also requires at least
 * one add/remove move: scaling cannot make a positive quantity zero.
 * The reference route must achieve this independently derived bound. */
export function fractionScalingLowerBound(value){
  const q=rational(value);
  if(q.n===0)throw new RangeError("Zero coefficient difference");
  const exponents=n=>{
    const result=[];n=Math.abs(n);
    for(const p of [2,3,5]){let k=0;while(n%p===0){k++;n/=p;}result.push(k);}
    if(n!==1)throw new RangeError("Coefficient needs an unavailable factor");
    return result;
  };
  const n=exponents(q.n),d=exponents(q.d);
  return Math.ceil(Math.abs(n[0]-d[0])/2)+Math.abs(n[1]-d[1])+Math.abs(n[2]-d[2]);
}
export function fractionMoveLowerBound(level){
  const shared=FRACTION_KINDS.filter(k=>rcompare(level.left[k],0)>0&&rcompare(level.right[k],0)>0).length;
  return shared+fractionScalingLowerBound(rsub(level.left.posX,level.right.posX));
}
function stageDefinition(id,index){
  const available=id==="guided";
  const definitions=chapters[id].map(([title,description],i)=>Object.freeze({id:id+"-chapter-"+String(i+1).padStart(2,"0"),title,description}));
  const levels=FRACTION_LEVEL_PLAN.filter(l=>l.stage===id).map(fixture=>{
    const {reference,stage,...raw}=fixture;
    const title=id==="guided"?names[raw.number-1]:definitions[raw.chapterIndex].title+" "+((raw.number-1)%4+1);
    const level=Object.freeze({...raw,title,contentRevision:1,allowedKinds:FRACTION_KINDS,
      allowedOperations:FRACTION_OPERATIONS,prompt:"Leave one whole sprite facing only weights."});
    return Object.freeze({id:raw.id,number:raw.number,title,chapterIndex:raw.chapterIndex,available,level});
  });
  const optimalMoves=available?Object.fromEntries(levels.map(slot=>[slot.id,fractionMoveLowerBound(slot.level)])):{};
  return Object.freeze({...stageData[id],id,number:index+1,available,
    chapters:Object.freeze(definitions),levels:Object.freeze(levels),optimalMoves:Object.freeze(optimalMoves),
    capabilities:Object.freeze({quantityMode:"fractions",allowedKinds:FRACTION_KINDS,allowedOperations:FRACTION_OPERATIONS,handMode:stageData[id].method})});
}
export const FRACTION_CAMPAIGN_STAGES=Object.freeze(["guided","independent","notebook"].map(stageDefinition));

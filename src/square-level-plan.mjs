/** PR69: unpublished World 4 curriculum.
 * Tuple order: x² sprites, x sprites, weights; the positive integer solution;
 * and a teacher-only legal reference route. The references are witnesses,
 * NOT certified shortest routes or student hints. PR74+ will publish stages.
 */
import {SQUARE_KINDS,SQUARE_OPERATIONS,squareBuildTarget,validSquareLaboratoryLevel} from "./square-rules.mjs";
const rows={
  guided:[
    [[0,1,0],[0,0,3],3,"S","area"],
    [[0,2,0],[0,0,4],2,"S","area"],
    [[0,1,2],[0,0,5],3,"S","area"],
    [[0,2,3],[0,0,5],1,"S","area"],
    [[1,0,0],[0,0,4],2,"R"],
    [[1,0,0],[0,0,25],5,"R"],
    [[0,0,16],[1,0,0],4,"R"],
    [[4,0,0],[0,0,36],3,"R D2"],
    [[1,0,3],[0,0,19],4,"C-3 R"],
    [[2,0,0],[0,0,32],4,"D2 R"],
    [[3,0,3],[0,0,30],3,"C-3 D3 R"],
    [[2,0,8],[1,0,33],5,"A-1 C-8 R"],
    [[1,2,1],[0,0,16],3,"R C-1"],
    [[1,4,4],[0,0,25],3,"R C-2"],
    [[0,0,25],[4,4,1],2,"R C-1 D2"],
    [[4,8,4],[0,0,36],2,"R C-2 D2"],
    [[1,2,0],[0,0,15],3,"C+1 R C-1"],
    [[1,4,0],[0,0,21],3,"C+4 R C-2"],
    [[1,6,0],[0,0,16],2,"C+9 R C-3"],
    [[1,8,0],[0,0,20],2,"C+12 C+4 R C-4"],
    [[2,4,2],[0,0,32],3,"D2 R C-1"],
    [[4,8,3],[0,0,35],2,"C+1 R C-2 D2"],
    [[1,6,2],[0,2,23],3,"B-2 C+2 R C-2"],
    [[3,12,3],[1,4,27],2,"A-1 B-4 C+5 D2 R C-2"]
  ],
  independent:[
    [[0,1,0],[0,0,4],4,"S","area"],
    [[0,1,1],[0,0,5],4,"S","area"],
    [[0,3,0],[0,0,6],2,"S","area"],
    [[1,0,0],[0,0,36],6,"R"],
    [[0,0,9],[1,0,0],3,"R"],
    [[1,0,4],[0,0,20],4,"C-4 R"],
    [[3,0,0],[0,0,27],3,"D3 R"],
    [[4,0,4],[0,0,40],3,"C-4 R D2"],
    [[1,2,1],[0,0,25],4,"R C-1"],
    [[0,0,16],[1,6,9],1,"R C-3"],
    [[4,4,1],[0,0,9],1,"R C-1 D2"],
    [[9,6,1],[0,0,16],1,"R C-1 D3"],
    [[1,2,0],[0,0,8],2,"C+1 R C-1"],
    [[1,4,1],[0,0,13],2,"C+3 R C-2"],
    [[1,6,0],[0,0,27],3,"C+9 R C-3"],
    [[1,8,5],[0,0,25],2,"C+11 R C-4"],
    [[2,4,2],[0,0,18],2,"D2 R C-1"],
    [[4,8,2],[0,0,34],2,"C+2 R C-2 D2"],
    [[1,5,3],[0,1,15],2,"B-1 C+1 R C-2"],
    [[4,12,5],[1,6,29],2,"A-1 B-6 C-2 D3 R C-1"]
  ],
  notebook:[
    [[0,1,1],[0,0,4],3,"S","area"],
    [[0,2,1],[0,0,5],2,"S","area"],
    [[1,0,0],[0,0,9],3,"R"],
    [[4,0,0],[0,0,16],2,"R D2"],
    [[1,0,5],[0,0,21],4,"C-5 R"],
    [[2,0,2],[0,0,34],4,"C-2 D2 R"],
    [[1,2,1],[0,0,36],5,"R C-1"],
    [[1,6,9],[0,0,36],3,"R C-3"],
    [[1,2,0],[0,0,24],4,"C+1 R C-1"],
    [[1,4,0],[0,0,32],4,"C+4 R C-2"],
    [[1,6,4],[0,0,20],2,"C+5 R C-3"],
    [[1,8,7],[0,0,16],1,"C+9 R C-4"],
    [[2,8,8],[0,0,32],2,"D2 R C-2"],
    [[4,4,2],[0,0,26],2,"C-1 R C-1 D2"],
    [[2,5,1],[1,1,22],3,"A-1 B-1 C+3 R C-2"],
    [[3,12,4],[1,4,28],2,"A-1 B-4 C+4 D2 R C-2"]
  ]
};
const chapterTitles={
  guided:["The Square Press","Opening Squares","Clear the Area","The Four Regions","Missing Corners","Master of Squares"],
  independent:["The Two-Handed Press","Restore the Balance","Rebuilding the Square","Complete the Picture","Independent Mastery"],
  notebook:["Writing Squares and Roots","Recognising Square Expressions","Completing the Square","Strategic Quadratics"]
};
const objectives={
  guided:["Build the area from each entire side length.","Recover a side from a complete square.","Clear or share before taking the root.","Rebuild all four regions of a mixed square.","Add the missing weights to complete a square.","Choose a sequence of matching operations to isolate a round sprite."],
  independent:["Match construction and root operations independently.","Clear and share square sprites in both rooms.","Reconstruct the mixed regions before keeping a side.","Identify and complete the missing corner in both rooms.","Solve multi-step quadratics with independently matched operations."],
  notebook:["Record the square or principal-root operation on both sides.","Recognise a complete square and choose exact transformations.","Complete the square with the same addition on both sides.","Choose and write a legal strategy for a quadratic balance."]
};
const titles={
  guided:["A new shape","The four square sprites","One mixed corner","The four regions","Keep one side","Five along each edge","The square on the east","Root and share","Loose weights","Two square sprites","Clear then share","Squares across the balance","One missing length","Four round sprites","The eastern square","A double side","Fill one corner","Fill four corners","Fill nine corners","The large missing corner","Share the area","One weight missing","Round sprites across the balance","The master square"],
  independent:["The first press","A mixed press","Three sprites along the edge","Six along each edge","Root in reverse","Clear the square","Three equal groups","Share after the root","Four regions to rebuild","The eastern mixed square","Two sprites along a side","Three sprites along a side","The small missing corner","Three weights missing","Nine weights missing","The larger corner","Share then root","Complete and share","Clear matching round sprites","The final reconstruction"],
  notebook:["Build a mixed square","Square two sprites and a weight","Write the principal root","Root then share","Clear before rooting","Two square sprites and weights","Recognise the first square","Recognise the larger square","Complete the small corner","Complete four weights","Complete nine weights","Complete the large corner","Share a complete square","Clear the spare weight","Quadratics across the balance","The final square notebook"]
};
const asRoom=tuple=>Object.freeze(Object.fromEntries(SQUARE_KINDS.map((k,i)=>[k,tuple[i]])));
function decodeRoute(route){
  return Object.freeze(route.split(" ").map(code=>{
    if(code==="S")return Object.freeze({op:"square"});
    if(code==="R")return Object.freeze({op:"sqrt"});
    if(/^[DM][2-5]$/.test(code))return Object.freeze({op:code[0]==="D"?"divide":"multiply",factor:Number(code[1])});
    const m=/^([ABC])([+-])(\d+)$/.exec(code);
    if(!m||Number(m[3])<1||Number(m[3])>12)throw new Error("Invalid reference move: "+code);
    return Object.freeze({op:m[2]==="+"?"add":"remove",kind:SQUARE_KINDS["ABC".indexOf(m[1])],count:Number(m[3])});
  }));
}
const stageMeta={
  guided:{title:"Guided Squares",method:"auto",icon:"□",emblems:["□","√","÷","▦","◩","✦"]},
  independent:{title:"Independent Squares",method:"manual",icon:"⇄",emblems:["□","√","▦","◩","✦"]},
  notebook:{title:"Square Algebra Apprentice",method:"notebook",icon:"✎",emblems:["□","√","◩","✦"]}
};
const suffix={guided:"g",independent:"i",notebook:"a"};
export const SQUARE_LEVEL_PLAN=Object.freeze(Object.entries(rows).flatMap(([stage,entries])=>
  entries.map(([l,r,solution,route,goal="isolate"],index)=>{
    const left=asRoom(l),right=asRoom(r),number=index+1,chapterIndex=Math.floor(index/4);
    const id="square-"+suffix[stage]+"-"+String(number).padStart(2,"0");
    const level={id,title:titles[stage][index],stage,number,chapterIndex,contentRevision:1,
      chapter:String(chapterIndex+1).padStart(2,"0")+" · "+chapterTitles[stage][chapterIndex],
      squareLaboratory:true,quantityMode:"positive",lockPositive:true,
      allowedKinds:SQUARE_KINDS,allowedOperations:SQUARE_OPERATIONS,
      goal,solution,left,right,
      prompt:goal==="area"?"Build a complete square from each chamber.":"Leave one round sprite facing only weights.",
      ...(goal==="area"?{target:Object.freeze({left:Object.freeze(squareBuildTarget(left)),right:Object.freeze(squareBuildTarget(right))})}:{}),
      reference:decodeRoute(route)};
    if(!validSquareLaboratoryLevel(level))throw new Error("Invalid Square Laboratory fixture: "+id);
    return Object.freeze(level);
  })));
/** Keep the author route out of any later student-level launch object. */
export function squareLevelForPlay(fixture){
  if(!fixture)return null;
  const {reference,stage,...level}=fixture;
  return Object.freeze(level);
}
/** Authoring data only. It is deliberately NOT connected to the campaign
 * registry, save store, or launch events. PR74 will expose Guided after
 * the art and construction mechanics are ready. No star targets yet.
 */
export const SQUARE_CAMPAIGN_STAGES=Object.freeze(Object.entries(stageMeta).map(([id,meta],i)=>Object.freeze({
  ...meta,emblems:Object.freeze(meta.emblems),id,number:i+1,available:false,
  chapters:Object.freeze(chapterTitles[id].map((title,j)=>Object.freeze({id:id+"-chapter-"+String(j+1).padStart(2,"0"),title,description:objectives[id][j]}))),
  levels:Object.freeze(SQUARE_LEVEL_PLAN.filter(l=>l.stage===id).map(l=>Object.freeze({id:l.id,title:l.title,number:l.number,chapterIndex:l.chapterIndex,available:false,level:squareLevelForPlay(l)}))),
  optimalMoves:Object.freeze({}),
  capabilities:Object.freeze({quantityMode:"positive",squareLaboratory:true,allowedKinds:SQUARE_KINDS,allowedOperations:SQUARE_OPERATIONS,handMode:meta.method})
})));

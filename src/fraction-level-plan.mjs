/** Teacher-only fixtures from the agreed World 3 plan. Not registered or playable yet.
 * Each row is [west sprite coefficient, west weight, east coefficient, east weight, solution].
 * Routes are legal constructive references, NOT optimal star benchmarks.
 */
import {rational,rsub,rcompare} from "./rational.mjs";
import {FRACTION_MODE} from "./fraction-engine.mjs";
const rows={
  guided:[
    ["2","0","0","5","5/2"],
    ["3","0","0","7","7/3"],
    ["4","0","0","11","11/4"],
    ["5","0","0","8","8/5"],
    ["1","1/2","0","3","5/2"],
    ["1","2/3","0","14/3","4"],
    ["1","3/4","0","21/4","9/2"],
    ["0","16/5","1","2/5","14/5"],
    ["1","1/4","0","7/2","13/4"],
    ["1","1/2","0","7/3","11/6"],
    ["1","3/8","0","9/4","15/8"],
    ["1","3/5","0","5/2","19/10"],
    ["1/2","0","0","3","6"],
    ["1/3","0","0","5/3","5"],
    ["3/4","0","0","3","4"],
    ["2/5","0","0","3","15/2"],
    ["1/2","1","0","4","6"],
    ["2/3","1/3","0","3","4"],
    ["3/4","1/2","0","2","2"],
    ["0","11/4","2/3","1/4","15/4"],
    ["1","1/3","1/2","7/3","4"],
    ["3/4","1/4","1/4","2","7/2"],
    ["1/2","3/4","1/3","3/2","9/2"],
    ["2/3","3/4","1/4","2","3"]
  ],
  independent:[
    ["2","0","0","7","7/2"],
    ["3","0","0","8","8/3"],
    ["4","0","0","9","9/4"],
    ["0","12","5","0","12/5"],
    ["1","3/4","0","4","13/4"],
    ["1","2/5","0","18/5","16/5"],
    ["1","2/3","0","7/2","17/6"],
    ["0","8/3","1","1/4","29/12"],
    ["1/2","0","0","5/2","5"],
    ["2/3","0","0","6","9"],
    ["3/4","0","0","5/2","10/3"],
    ["0","6/5","3/5","0","2"],
    ["2","1/2","0","15/2","7/2"],
    ["1/2","3/4","0","3","9/2"],
    ["2/3","2/5","0","12/5","3"],
    ["3/4","1/3","0","7/3","8/3"],
    ["1","1/2","1/2","3","5"],
    ["3/4","2/3","1/4","13/6","3"],
    ["1/3","5/2","2/3","1/4","27/4"],
    ["3/4","1/3","1/3","2","4"]
  ],
  notebook:[
    ["2","0","0","9","9/2"],
    ["0","5","3","0","5/3"],
    ["1","3/5","0","2","7/5"],
    ["1","1/2","0","11/4","9/4"],
    ["1","2/3","0","13/4","31/12"],
    ["1/2","0","0","7/4","7/2"],
    ["2/3","0","0","5","15/2"],
    ["3/5","0","0","9/5","3"],
    ["3","1/2","0","8","5/2"],
    ["1/3","3/4","0","9/4","9/2"],
    ["3/4","1/2","0","7/2","4"],
    ["0","9/4","2/5","3/4","15/4"],
    ["1","2/3","1/3","10/3","4"],
    ["1/2","1/3","1/4","7/3","8"],
    ["1/3","3","3/4","1/2","6"],
    ["2/3","3/5","1/2","7/5","24/5"]
  ]
};
const parse=s=>{const [n,d=1]=s.split("/").map(Number);return rational(n,d);};
const min=(a,b)=>rcompare(a,b)<0?a:b;
function factors(n){
  const result=[];
  for(const factor of [5,4,3,2])while(n%factor===0){result.push(factor);n/=factor;}
  if(n!==1)throw new Error("Unsupported reference factor");
  return result;
}
function reference(left,right){
  const moves=[];
  for(const kind of ["posX","posOne"]){
    const count=min(left[kind],right[kind]);
    if(count.n)moves.push(Object.freeze({op:"remove",kind,count}));
  }
  const a=rsub(left.posX,right.posX);
  for(const factor of factors(a.d))moves.push(Object.freeze({op:"multiply",factor}));
  for(const factor of factors(Math.abs(a.n)))moves.push(Object.freeze({op:"divide",factor}));
  return Object.freeze(moves);
}
export const FRACTION_LEVEL_PLAN=Object.freeze(Object.entries(rows).flatMap(([stage,items])=>
  items.map(([a,b,c,d,s],i)=>{
    const left=Object.freeze({posX:parse(a),posOne:parse(b)});
    const right=Object.freeze({posX:parse(c),posOne:parse(d)});
    const number=i+1,id="frac-"+({guided:"g",independent:"i",notebook:"a"}[stage])+"-"+String(number).padStart(2,"0");
    return Object.freeze({id,stage,number,chapterIndex:Math.floor(i/4),
      quantityMode:FRACTION_MODE,left,right,solution:parse(s),reference:reference(left,right)});
  })));

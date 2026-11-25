/** Free-play Fraction Workshop. Parse a deliberately small positive-linear
 * grammar, then certify a physical route through the exact engine.
 * Never expose a reference route or an answer in student-facing hints. */
import {rational,radd,rsub,rdiv,rcompare,req} from "./rational.mjs";
import {initialState,validInitialLevel,isSolved,perform,equation} from "./engine.mjs";
import {FRACTION_DENOMINATORS,FRACTION_KINDS,FRACTION_OPERATIONS,FRACTION_FACTORS,FRACTION_CAPACITY,fractionRoom,fractionRoomCount,fractionParts} from "./fraction-engine.mjs";
import {NOTEBOOK_MAX_STEPS} from "./notebook-engine.mjs";

export const FRACTION_WORKSHOP_EXAMPLES=Object.freeze(["2x = 5","x + 1/2 = 3","(2/3)x = 4","3/4x + 1/3 = 1/3x + 2"]);
export const FRACTION_ROUTE_BUDGET=6000;
const allowed=q=>FRACTION_DENOMINATORS.includes(q.d);
const fail=(code,message)=>({ok:false,code,message});
const syntax="Use positive linear terms such as x, 2x, 1/2, (2/3)x, or x/3, joined with +.";
const zero=rational(0);
function parseTerm(input){
  let term=input.trim().replace(/X/g,"x");
  const mixed=/^(\d{1,5})\s+(\d{1,5})\s*\/\s*(\d{1,5})\s*(x)?$/.exec(term)
    ||/^\(\s*(\d{1,5})\s+(\d{1,5})\s*\/\s*(\d{1,5})\s*\)\s*(x)?$/.exec(term);
  if(mixed){
    const [,w,n,d,x]=mixed,whole=Number(w),num=Number(n),den=Number(d);
    if(!den)return fail("denominator","A denominator cannot be zero.");
    if(whole<1||num<1||num>=den)return fail("syntax","Write a mixed number with a whole part and a proper fraction.");
    return {ok:true,kind:x?"posX":"posOne",value:rational(whole*den+num,den)};
  }
  if(/\d\s+\d/.test(term))return fail("syntax",syntax);
  term=term.replace(/\s+/g,"");
  if(term.startsWith("(")&&term.endsWith(")"))term=term.slice(1,-1);
  const bracketed=/^\((\d{1,6}\/\d{1,6})\)x$/.exec(term);
  if(bracketed)term=bracketed[1]+"x";
  const coefficient=/^(\d{0,6})x\/(\d{1,6})$/.exec(term);
  if(coefficient)term=(coefficient[1]||"1")+"/"+coefficient[2]+"x";
  const variable=term.endsWith("x");
  if(variable)term=term.slice(0,-1)||"1";
  const match=/^(\d{1,6})(?:\/(\d{1,6}))?$/.exec(term);
  if(!match)return fail("syntax",syntax);
  const n=Number(match[1]),d=match[2]===undefined?1:Number(match[2]);
  if(!d)return fail("denominator","A denominator cannot be zero.");
  return {ok:true,kind:variable?"posX":"posOne",value:rational(n,d)};
}
export function parseFractionWorkshopSide(input){
  if(typeof input!=="string"||!input.trim())return fail("syntax","Write an expression on each side.");
  if(/[−–—-]/.test(input))return fail("negative","Negative terms and signed fractional objects are not yet available in the Fraction Workshop.");
  if(/[.^²]/.test(input))return fail("syntax","Use exact fractions and linear terms, not decimals or powers.");
  const sums={posX:zero,posOne:zero};
  try{
    for(const part of input.split("+")){
      const term=parseTerm(part);
      if(!term.ok)return term;
      if(!allowed(term.value))return fail("unsupported-denominator","Use fractions whose reduced denominators are 1, 2, 3, 4, 5, 6, 8, 10 or 12.");
      sums[term.kind]=radd(sums[term.kind],term.value);
      if(rcompare(sums[term.kind],FRACTION_CAPACITY)>0)return fail("capacity","The chamber would exceed its 48-object limit.");
    }
    if(FRACTION_KINDS.some(k=>!allowed(sums[k])))return fail("unsupported-denominator","The combined quantity needs pieces outside the supported fraction set.");
    const room=fractionRoom(sums);
    if(fractionRoomCount(room)>FRACTION_CAPACITY)return fail("capacity","The chamber would exceed its 48-object limit, counting each fractional piece.");
    return {ok:true,room};
  }catch{return fail("syntax","Those quantities are too large or cannot be represented exactly.");}
}
export function parseFractionWorkshopEquation(input){
  if(typeof input!=="string"||input.length>80)return fail("length","Keep your equation within 80 characters.");
  const sides=input.split("=");
  if(sides.length!==2)return fail("equation","Write exactly one equals sign.");
  const left=parseFractionWorkshopSide(sides[0]);if(!left.ok)return left;
  const right=parseFractionWorkshopSide(sides[1]);if(!right.ok)return right;
  return {ok:true,left:left.room,right:right.room};
}
const key=s=>FRACTION_KINDS.flatMap(k=>[s.left[k].n,s.left[k].d,s.right[k].n,s.right[k].d]).join("/");
const min=(a,b)=>rcompare(a,b)<=0?a:b;
function smooth(n){
  n=Math.abs(n);if(!n)return false;
  for(const p of [2,3,5])while(n%p===0)n/=p;
  return n===1;
}
function removals(state,kind){
  const shared=min(state.left[kind],state.right[kind]);
  if(!shared.n)return [];
  const capped=min(shared,rational(12)),counts=new Map();
  const put=q=>{if(q.n>0&&allowed(q)&&rcompare(q,capped)<=0)counts.set(q.n+"/"+q.d,q);};
  put(capped);
  // Try the largest possible shared amount on each grid. A smaller
  // cancellation can be useful before scaling clears a denominator.
  for(const d of FRACTION_DENOMINATORS){
    put(rational(Math.floor(capped.n*d/capped.d),d));
    put(rational(1,d));
  }
  return [...counts.values()].sort((a,b)=>rcompare(b,a)).map(count=>({op:"remove",kind,count}));
}
function candidates(state){
  const removes=FRACTION_KINDS.flatMap(k=>removals(state,k));
  const scales=[4,5,3,2].flatMap(factor=>[{op:"divide",factor},{op:"multiply",factor}]);
  return [...removes,...scales];
}
function lowerBound(state){
  const a=rsub(state.left.posX,state.right.posX);
  if(!smooth(a.n)||!smooth(a.d))return Infinity;
  const powers=n=>[2,3,5].map(p=>{let count=0;while(n%p===0){count++;n/=p;}return count;});
  const n=powers(Math.abs(a.n)),d=powers(a.d);
  return Math.ceil(Math.abs(n[0]-d[0])/2)+Math.abs(n[1]-d[1])+Math.abs(n[2]-d[2])
    +FRACTION_KINDS.filter(k=>state.left[k].n&&state.right[k].n).length;
}
/** Bounded best-first search, with an independently valid lower bound.
 * Search only cancellations and integer scaling, not arbitrary additions.
 * Every returned certificate is checked by the SAME engine as gameplay.
 * Not finding a route is a limitation of this bounded search, not a
 * proof that the mathematical equation is impossible. */
export function proveFractionWorkshopRoute(level,{budget=FRACTION_ROUTE_BUDGET}={}){
  if(!validInitialLevel(level))return null;
  const initial=initialState(level);
  if(isSolved(initial))return [];
  if(!Number.isFinite(lowerBound(initial)))return null;
  const bins=Array.from({length:NOTEBOOK_MAX_STEPS+1},()=>[]),seen=new Map([[key(initial),0]]);
  bins[lowerBound(initial)]?.push({state:initial,actions:[]});
  let expanded=0;
  for(let score=0;score<bins.length;score++){
    const bin=bins[score];
    // LIFO on each score keeps the largest removals and reducing scales first.
    while(bin.length){
      if(expanded++>=Math.max(1,Math.min(FRACTION_ROUTE_BUDGET,budget)))return null;
      const {state,actions}=bin.pop(),depth=actions.length;
      if(seen.get(key(state))!==depth)continue;
      if(isSolved(state))return actions;
      if(depth>=NOTEBOOK_MAX_STEPS)continue;
      for(const action of candidates(state).reverse()){
        const next=perform(state,action,"auto");
        if(!next.ok)continue;
        const k=key(next.state),g=depth+1,h=lowerBound(next.state),f=g+h;
        if(f>NOTEBOOK_MAX_STEPS||seen.has(k)&&seen.get(k)<=g)continue;
        seen.set(k,g);bins[Math.max(score,f)].push({state:next.state,actions:[...actions,action]});
      }
    }
  }
  return null;
}
export function createFractionWorkshopEquation(input){
  const parsed=parseFractionWorkshopEquation(input);if(!parsed.ok)return parsed;
  const {left,right}=parsed,coefficient=rsub(left.posX,right.posX),constant=rsub(right.posOne,left.posOne);
  if(!coefficient.n)return constant.n
    ?fail("no-solution","Both sides have the same sprite quantity but different weights. No value balances them.")
    :fail("infinitely-many","Both sides are identical. There is no single mystery value.");
  const solution=rdiv(constant,coefficient);
  if(solution.n<0)return fail("negative-solution","This equation needs a negative sprite value; signed fractions are not yet supported.");
  if(!solution.n)return fail("zero-solution","Choose a positive mystery value, not zero.");
  if(!allowed(solution))return fail("fraction-solution","The solution needs a denominator outside the supported fraction set.");
  const p=fractionParts(solution);
  if(p.whole+p.pieces>FRACTION_CAPACITY)return fail("solution-overflow","The solution needs more than 48 whole weights and fractional pieces.");
  const level={id:"fraction-workshop-custom",title:"Your own fraction balance",quantityMode:"fractions",left,right,solution,
    goal:"isolate",allowedKinds:FRACTION_KINDS,allowedOperations:FRACTION_OPERATIONS,prompt:"Leave one whole sprite facing only weights."};
  if(!validInitialLevel(level))return fail("invalid-scene","Those quantities cannot start in a valid fraction balance.");
  if(isSolved(initialState(level)))return fail("already-solved","That equation already isolates one sprite. Add a balancing challenge.");
  if(!proveFractionWorkshopRoute(level))return fail("unrepresentable","This is a valid equation, but no route was found within 16 moves using the available pieces, groups and room limits. Try a different equation.");
  return {ok:true,level,normalizedEquation:equation(initialState(level))};
}

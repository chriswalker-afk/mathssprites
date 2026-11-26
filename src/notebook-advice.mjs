/** Mathematical language for paper-first activities. The engine remains
 * the authority for accepted operations; its physical explanations belong
 * to Guided, Independent and the replay, not the algebra notebook. */
import {canonical,areaArrangement,isSolved} from "./engine.mjs";
import {rational,rtext,rcompare} from "./rational.mjs";
import {FRACTION_DENOMINATORS} from "./fraction-engine.mjs";

const sideName=side=>side==="left"?"left-hand side":side==="right"?"right-hand side":null;
const subject=side=>side?"The "+sideName(side):"This expression";
const kindName=kind=>kind==="posX2"?"coefficient of x²":["posX","negX"].includes(kind)?"coefficient of x":"constant term";
const amountText=value=>value===undefined?"":rtext(rational(value));
const negativeKind=kind=>["negOne","negX"].includes(kind);
export function notebookOperationJustification(action){
  if(!action)return "";
  const op=action.op;
  if(op==="unpack")return "The distributive law a(b + c) = ab + ac rewrites the "+sideName(action.side)+" without changing its value. The other side stays unchanged.";
  if(op==="square")return "Equal expressions have equal squares. Since both sides are nonnegative here, squaring is reversible. Expand using (a + b)² = a² + 2ab + b².";
  if(op==="sqrt")return "Both sides are perfect squares. Taking the principal square root preserves equality; √(u²) = u for u ≥ 0. In this activity x ≥ 0.";
  if(op==="divide")return "Dividing both sides by "+action.factor+", a nonzero number, preserves the solution. Divide every term on each side.";
  if(op==="multiply")return "Multiplying both sides by "+action.factor+", a nonzero number, preserves the solution. Multiply every term on each side.";
  if(op==="add"||op==="remove"){
    const variable=["posX","negX","posX2"].includes(action.kind);
    const term=(variable&&rcompare(action.count,1)===0?"":amountText(action.count))+(action.kind==="posX2"?"x²":variable?"x":"");
    const signed=negativeKind(action.kind)?"−"+term:term;
    const signRule=op==="remove"&&negativeKind(action.kind)?"Subtracting "+signed+" is equivalent to adding "+term+". ":
      op==="remove"?"Subtracting "+term+" is equivalent to adding its additive inverse. ":
      negativeKind(action.kind)?"Adding "+signed+" is equivalent to subtracting "+term+". ":"";
    return signRule+"Adding or subtracting the same "+(variable?"term":"number")+" on both sides preserves equality. Simplify like terms.";
  }
  return "Keep the two equations equivalent.";
}
export function notebookFailureMessage(result,state,action={}){
  const side=sideName(result.side),s=subject(result.side),prefix=side?"On the "+side+", ":"";
  switch(result.code){
    case "missing":
      if(state?.quantityMode==="signed")return "Rewrite the expression using additive inverses, or expand brackets first.";
      return s+" would have a negative "+kindName(result.kind||action.kind)+". This activity restricts coefficients and constants to nonnegative "+(state?.quantityMode==="fractions"?"rational numbers":"integers")+". The subtraction itself is valid algebra; choose an equivalent route within this number system.";
    case "locked-crate":
      return s+" contains a bracketed expression. Use the distributive law to expand it first, or simplify using a common factor.";
    case "crate-split":
      return "The factor outside the brackets is not divisible by "+action.factor+" in the integers. Expand the brackets or use a different common factor.";
    case "no-crates":
      return "There is no bracketed expression to expand on that side.";
    case "unpack-mode":
      return "Complete or undo the current operation before expanding brackets.";
    case "unsupported-area":
      if(action.op==="sqrt")return s+" is not a complete square in the form (ax + b)² = a²x² + 2abx + b², with nonnegative integer a and b. Rearrange or complete the square before taking an exact principal root.";
      return s+" cannot be squared within this activity's degree-two model. Squaring a quadratic expression introduces higher powers.";
    case "fraction":{
      const count=result.count, factor=result.factor??action.factor;
      const example=Number.isSafeInteger(count)&&factor?prefix+"the "+kindName(result.kind)+" gives "+count+" ÷ "+factor+" = "+rtext(rational(count,factor))+". ":"";
      return example+"Every coefficient and constant must remain an integer in this activity. Division by a nonzero number is valid algebra, but fractional results require World 3.";
    }
    case "unsupported-denominator":
      return (result.denominator?"The calculation requires denominator "+result.denominator+". ":"")+"This activity supports denominators "+FRACTION_DENOMINATORS.join(", ")+". Use an equivalent route within that set; other denominators are valid mathematics.";
    case "overflow":
      return "This step exceeds the activity's representation limit"+(result.capacity?" ("+result.capacity+")":"")+". This is a software limit, not an algebraic rule. Choose a smaller equivalent operation.";
    case "locked-negative":case "locked-world":
      return "Negative coefficients and constants are outside this activity's number system. World 2 supports signed terms.";
    case "locked-kind":
      return "This type of term is not included in the current activity. Quadratic terms are available in World 4.";
    case "locked-operation":
      return "That operation is not available in this activity. Use the permitted algebraic transformations.";
    case "quantity-mode":
      return "Choose a supported number system for this equation.";
    case "invalid":
      return "Choose a supported operation and amount. Use a nonzero numerical factor for multiplication or division.";
    default:
      // Do not expose an engine's physical-world error as a mathematical rule.
      return "This operation is not supported by the current algebra activity. Check the operation and its number-system restrictions.";
  }
}
export function notebookWritingPrompt(level){
  if(level?.goal==="area")return "Square the entire expression on each side, then simplify.";
  if(level?.groupedPrototype)return "Keep each equation equivalent. Expand brackets using the distributive law or apply an operation to both sides.";
  return "Choose operations that isolate x on either side of the equals sign. Keep each equation equivalent.";
}
/** A thinking prompt uses the CURRENT written equation, never the stored
 * solution, teacher route, or future operations. Give a principle, not
 * the next numerical answer. */
export function notebookThinkingPrompt(session){
  if(!session?.state)return "What operation preserves the equality?";
  const {state,level}=session;
  if(isSolved(state))return "Your working is complete. Check that every line is equivalent to the preceding line.";
  if(state.left.crates?.count||state.right.crates?.count)
    return "Consider the distributive law or a common factor outside the brackets. Expanding an expression does not change its value.";
  if(level?.goal==="area")return "Square each entire expression. Remember (a + b)² = a² + 2ab + b², not just a² + b².";
  const l=canonical(state.left),r=canonical(state.right);
  const zero=v=>rcompare(v,0)===0;
  if(!zero(l.x2)||!zero(r.x2)){
    if(areaArrangement(state.left,"sqrt")&&areaArrangement(state.right,"sqrt"))
      return "Both expressions are perfect squares. Use the principal square root because x ≥ 0 and both square-root expressions are nonnegative.";
    if(!zero(l.x2)&&!zero(r.x2))return "Collect the quadratic terms on one side by adding or subtracting the same multiple of x² on both sides.";
    const q=!zero(l.x2)?l:r;
    if(zero(q.x))return "Try isolating the quadratic term. If a common numerical factor remains, divide every term by that factor before taking an exact square root.";
    return "Compare the quadratic expression with (ax + b)² = a²x² + 2abx + b². Collect like terms and consider a common factor or completing the square.";
  }
  if(!zero(l.x)&&!zero(r.x))return "Both sides contain x-terms. Add or subtract the same multiple of x to collect the variable terms on one side.";
  const variableSide=!zero(l.x)?l:r;
  if(!zero(variableSide.constant))return "Use the additive inverse of the constant term on the side containing x. Apply the same operation to the other side.";
  if(rational(variableSide.x).d!==1)return "Clear the fractional coefficient by multiplying both sides by its denominator, then consider the remaining coefficient of x.";
  if(rcompare(variableSide.x,0)<0)return "The coefficient of x is negative. Consider an equivalent equation with a positive coefficient, keeping each operation the same on both sides.";
  return "To isolate x, divide both sides by a common nonzero factor of the coefficient of x. In this activity, keep the result within the allowed number system.";
}

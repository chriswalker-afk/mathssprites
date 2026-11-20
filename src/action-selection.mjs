/**
 * PR45 - deliberately empty selection at the start of every experiment.
 * Authored reference routes belong to teacher data, never student controls.
 */
export function neutralToolSelection() {
  return {operation:null,kind:null,amount:null,factor:null};
}
export function actionFromToolSelection({operation=null,kind=null,amount=null,factor=null}={}) {
  if(operation==="add"||operation==="remove") {
    if(!["posX","negX","posX2","posOne","negOne"].includes(kind) ||
       !Number.isInteger(amount)||amount<1||amount>12)return null;
    return {op:operation,kind,count:amount};
  }
  if(operation==="multiply"||operation==="divide") {
    if(!Number.isInteger(factor)||factor<2||factor>5)return null;
    return {op:operation,factor};
  }
  if(operation==="square"||operation==="sqrt")return {op:operation};
  return null;
}
/** No quantity is silently assigned when a tool is selected.
 * The first + press explicitly selects one item or two whole groups.
 */
export function stepToolQuantity(operation, current, direction) {
  if(!["add","remove","divide","multiply"].includes(operation) ||
     ![-1,1].includes(direction))return null;
  const groups=operation==="divide"||operation==="multiply";
  const minimum=groups?2:1, maximum=groups?5:12;
  if(current===null)return direction===1?minimum:null;
  if(!Number.isInteger(current))return null;
  return Math.max(minimum,Math.min(maximum,current+direction));
}

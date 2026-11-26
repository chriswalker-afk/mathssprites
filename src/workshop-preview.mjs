/** Read-only, bounded visual preview: use the same parsers as free play,
 * but never run a route search or expose a solution while the learner types.
 * Launch validation remains exclusively in the original create* functions. */
import {parseNotebookEquation} from "./notebook-engine.mjs";
import {parseSignedWorkshopEquation} from "./signed-workshop.mjs";
import {parseFractionWorkshopEquation} from "./fraction-workshop.mjs";
import {parseSquareWorkshopEquation} from "./square-workshop.mjs";
import {fractionParts} from "./fraction-engine.mjs";
import {rtext} from "./rational.mjs";
const examples={positive:"3x + 5 = 20",signed:"2x - 3 = x + 4",fractions:"2x = 5",squares:"x² + 4x = 21"};
const names={posX:["sprite","sprites"],negX:["white sprite","white sprites"],posX2:["square sprite","square sprites"],posOne:["weight","weights"],negOne:["balloon","balloons"]};
function inventory(room,mode){
  return ["posX2","posX","negX","posOne","negOne"].flatMap(kind=>{
    const value=mode==="positive"?(kind==="posX"?room.x:kind==="posOne"?room.constant:0):room[kind];
    if(mode==="fractions"){
      if(!value?.n)return [];
      const {whole,pieces,denominator}=fractionParts(value);
      return [{kind,whole,pieces,denominator,label:rtext(value)+" "+names[kind][value.n===value.d?0:1]}];
    }
    if(!Number.isSafeInteger(value)||value<=0)return [];
    return [{kind,whole:value,pieces:0,denominator:1,label:value+" "+names[kind][value===1?0:1]}];
  });
}
export function workshopPreview(input,mode="positive",goal="isolate"){
  const quantity=Object.hasOwn(examples,mode)?mode:"positive";
  const example=!String(input??"").trim();
  const source=example?(quantity==="squares"&&goal==="area"?"x + 1 = 4":examples[quantity]):input;
  const parse={positive:parseNotebookEquation,signed:parseSignedWorkshopEquation,fractions:parseFractionWorkshopEquation,squares:parseSquareWorkshopEquation}[quantity];
  const result=parse(source);
  if(!result.ok)return {status:"incomplete",left:[],right:[]};
  return {status:example?"example":"draft",left:inventory(result.left,quantity),right:inventory(result.right,quantity)};
}
export function workshopInventoryMarkup(items){
  return items.map(item=>{
    const visible=Math.min(5,item.whole);
    const tokens=Array.from({length:item.whole>visible?1:visible},()=>'<i class="mini-token '+item.kind+'" aria-hidden="true"></i>').join("");
    const count=item.whole>visible?'<b class="workshop-token-count">×'+item.whole+'</b>':"";
    const partial=item.pieces?'<span class="comic-fraction-piece '+(item.kind==="posX"?"sprite-piece":"weight-piece")+'" style="--fraction-fill:'+(item.pieces/item.denominator*100)+'%;--fraction-step:'+(100/item.denominator)+'%" data-numerator="'+item.pieces+'" data-denominator="'+item.denominator+'"><i></i><small>'+item.pieces+'/'+item.denominator+'</small></span>':"";
    // For large groups, a single labelled object denotes the exact count.
    return '<span class="workshop-object-group" data-kind="'+item.kind+'" data-whole="'+item.whole+'">'+tokens+count+partial+'</span>';
  }).join("");
}

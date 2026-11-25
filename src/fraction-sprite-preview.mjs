import {rational as q,rtext} from "./rational.mjs";
import {FRACTION_DENOMINATORS,fractionTransform} from "./fraction-engine.mjs";
import {spriteAssemblyMarkup,spriteInventoryMarkup,spriteGridMarkup,spriteChangeStages} from "./fraction-sprites.mjs";
const $=id=>document.getElementById(id);
const denominators=FRACTION_DENOMINATORS.filter(d=>d>1);
const indices=n=>Array.from({length:n},(_,i)=>i);
$("denominator").innerHTML=denominators.map(d=>'<option value="'+d+'">'+d+'</option>').join("");
function resetButton(button){$(button).setAttribute("aria-pressed","false");$(button).textContent="Separate";}
function bindToggle(button,stage){
  $(button).addEventListener("click",()=>{
    const split=$(stage).firstElementChild.classList.toggle("is-separated");
    $(button).setAttribute("aria-pressed",String(split));$(button).textContent=split?"Rejoin":"Separate";
  });
}
function resetPartial(){
  const d=Number($("denominator").value),n=Number($("numerator").value);
  $("partial-stage").innerHTML=spriteAssemblyMarkup(d,indices(n));
  resetButton("partial-split");
}
function resetSplit(){
  const d=Number($("denominator").value);
  $("split-stage").innerHTML=spriteAssemblyMarkup(d,indices(d),{label:false});
  resetButton("split");
  $("numerator").innerHTML=indices(d-1).map(i=>'<option value="'+(i+1)+'">'+(i+1)+' of '+d+'</option>').join("");
  resetPartial();
}
$("denominator").addEventListener("change",resetSplit);
$("numerator").addEventListener("change",resetPartial);
bindToggle("split","split-stage");bindToggle("partial-split","partial-stage");resetSplit();
$("gallery").innerHTML=denominators.map(d=>'<div class="fw-sample"><strong>1/'+d+' of a sprite</strong>'+
  spriteAssemblyMarkup(d,[0],{label:false})+'</div>').join("");
const examples={
  thirds:{before:q(2,3),operation:"multiply",factor:3},
  quarters:{before:q(3,4),operation:"multiply",factor:4},
  sixths:{before:q(1,2),operation:"add",amount:q(1,3)},
  borrow:{before:q(1),operation:"remove",amount:q(1,4)}
};
let step=0;
function renderExample(){
  const {before,operation,factor,amount}=examples[$("example").value];
  const action=operation==="multiply"?{op:operation,factor}:{op:operation,kind:"posX",count:amount};
  const result=fractionTransform({posX:before},action);
  if(!result.ok)throw Error(result.reason);
  const plan=result.fractionPlans.find(p=>p.kind==="posX"),stages=spriteChangeStages(plan,operation);
  const card=(title,markup)=>'<div class="fw-step-card"><h3>'+title+'</h3>'+markup+'</div>';
  const note=title=>'<div class="fs-empty">'+title+'</div>';
  const frames=operation==="multiply"?[
    [card("Starting sprite pieces",spriteInventoryMarkup(before)),card("Make "+factor+" copies",note("Copy every piece"))],
    [card(factor+" identical copies",'<div class="fs-grid-inventory">'+Array.from({length:factor},()=>spriteInventoryMarkup(before)).join("")+'</div>'),
      card("Gather the "+stages.raw.units+" pieces",spriteGridMarkup(stages.raw))],
    [card("Before rejoining",spriteGridMarkup(stages.raw)),card("Reassembled · "+rtext(plan.after),spriteInventoryMarkup(plan.after))]
  ]:[
    [card("Starting sprites",spriteInventoryMarkup(before)),card((operation==="remove"?"Remove ":"Add ")+rtext(amount),spriteInventoryMarkup(amount))],
    [card(stages.prepared.borrowed?"Separate one whole into "+stages.grid+" pieces":"Change to "+stages.grid+" equal parts",spriteGridMarkup(stages.prepared)),
      card("Matching parts",spriteGridMarkup(stages.amount))],
    [card(operation==="remove"?"Pieces remaining":"Pieces collected",spriteGridMarkup(stages.raw)),card("Reassembled · "+rtext(plan.after),spriteInventoryMarkup(plan.after))]
  ];
  $("example-stage").innerHTML=frames[step].join("");
  $("step-count").textContent="Step "+(step+1)+" of 3";
  $("previous").disabled=step===0;$("next").disabled=step===2;
}
$("example").addEventListener("change",()=>{step=0;renderExample()});
$("previous").addEventListener("click",()=>{step=Math.max(0,step-1);renderExample()});
$("next").addEventListener("click",()=>{step=Math.min(2,step+1);renderExample()});renderExample();
$("mixed").innerHTML=[[q(3,2),"1 ½"],[q(8,3),"2 ⅔"],[q(15,4),"3 ¾"],[q(23,5),"4 ⅗"]].map(([value,label])=>
  '<div class="fw-mixed-card"><strong>'+label+'</strong>'+spriteInventoryMarkup(value)+'</div>').join("");

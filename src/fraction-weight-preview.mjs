import {rational as q,rtext} from "./rational.mjs";
import {FRACTION_DENOMINATORS,fractionTransform} from "./fraction-engine.mjs";
import {weightAssemblyMarkup,weightInventoryMarkup,weightGridMarkup,weightChangeStages} from "./fraction-weights.mjs";
const $=id=>document.getElementById(id);
const denominators=FRACTION_DENOMINATORS.filter(d=>d>1);
const indices=d=>Array.from({length:d},(_,i)=>i);
$("denominator").innerHTML=denominators.map(d=>'<option value="'+d+'">'+d+'</option>').join("");
function resetSplit(){
  const d=Number($("denominator").value);
  $("split-stage").innerHTML=weightAssemblyMarkup(d,indices(d),{label:false});
  $("split").setAttribute("aria-pressed","false");$("split").textContent="Separate";
}
$("denominator").addEventListener("change",resetSplit);
$("split").addEventListener("click",()=>{
  const assembly=$("split-stage").firstElementChild;
  const split=assembly.classList.toggle("is-separated");
  $("split").setAttribute("aria-pressed",String(split));
  $("split").textContent=split?"Rejoin":"Separate";
});
resetSplit();
$("gallery").innerHTML=denominators.map(d=>'<div class="fw-sample"><strong>1/'+d+' of a weight</strong>'+
  weightAssemblyMarkup(d,[0],{label:false})+
  '</div>').join("");
const examples={
  half:{before:q(1,2),amount:q(1,4),operation:"remove"},
  whole:{before:q(1),amount:q(1,4),operation:"remove"},
  sixths:{before:q(1,2),amount:q(1,3),operation:"add"},
  tenths:{before:q(3,5),amount:q(1,2),operation:"add"}
};
let step=0;
function renderExample(){
  const {before,amount,operation}=examples[$("example").value];
  const result=fractionTransform({posOne:before},{op:operation,kind:"posOne",count:amount});
  if(!result.ok)throw Error(result.reason);
  const plan=result.fractionPlans.find(p=>p.kind==="posOne"),stages=weightChangeStages(plan,operation);
  const card=(title,markup)=>'<div class="fw-step-card"><h3>'+title+'</h3>'+markup+'</div>';
  const label=operation==="remove"?"Remove ":"Add ";
  const frames=[
    [card("Starting weights",weightInventoryMarkup(before)),card(label+rtext(amount),weightInventoryMarkup(amount))],
    [card(stages.prepared.borrowed?"Borrow one whole into "+stages.grid+" equal pieces":"Change to "+stages.grid+" equal parts",weightGridMarkup(stages.prepared)),
      card("Matching parts",weightGridMarkup(stages.amount))],
    [card(operation==="remove"?"Pieces remaining":"Pieces collected",weightGridMarkup(stages.raw)),card("Recombine · "+rtext(plan.after),weightInventoryMarkup(plan.after))]
  ];
  $("example-stage").innerHTML=frames[step].join("");
  $("step-count").textContent="Step "+(step+1)+" of 3";
  $("previous").disabled=step===0;$("next").disabled=step===2;
}
$("example").addEventListener("change",()=>{step=0;renderExample()});
$("previous").addEventListener("click",()=>{step=Math.max(0,step-1);renderExample()});
$("next").addEventListener("click",()=>{step=Math.min(2,step+1);renderExample()});
renderExample();
$("mixed").innerHTML=[[q(11,4),"2 ¾"],[q(17,3),"5 ⅔"],[q(39,4),"9 ¾"],[q(51,4),"12 ¾"]].map(([value,label])=>
  '<div class="fw-mixed-card"><strong>'+label+'</strong>'+weightInventoryMarkup(value)+'</div>').join("");

import {FRACTION_LEVEL_PLAN} from "./fraction-level-plan.mjs";
import {mountFractionBalance} from "./fraction-balance.mjs";
const root=document.getElementById("fraction-lab"),select=document.getElementById("fb-level"),mode=document.getElementById("fb-mode"),motion=document.getElementById("fb-reduced");
// Representative real curriculum fixtures: one of every Guided chapter.
// All sixty are already tested as mathematical reference levels. The full
// student-facing selection and campaign progress belong to PR64 onward.
const examples=[1,5,9,10,13,15,18,24].map(n=>FRACTION_LEVEL_PLAN.find(l=>l.stage==="guided"&&l.number===n));
const labels=["Sharing leftovers","Little pieces","Borrowing","Equivalent parts","Half a sprite","Three quarters","Fractional mystery","Master of fractions"];
select.innerHTML=examples.map((l,i)=>'<option value="'+l.id+'">'+labels[i]+'</option>').join("");
motion.checked=matchMedia("(prefers-reduced-motion: reduce)").matches;
const controller=mountFractionBalance(root,{level:examples[0],reduced:motion.checked});
select.addEventListener("change",()=>controller.load(examples.find(l=>l.id===select.value),mode.value));
mode.addEventListener("change",()=>controller.setMode(mode.value));
motion.addEventListener("change",()=>controller.setReduced(motion.checked));

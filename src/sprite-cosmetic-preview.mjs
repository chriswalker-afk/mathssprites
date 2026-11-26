import {spriteCreatureMarkup} from "./square-sprites.mjs";
import {spriteAssemblyMarkup} from "./fraction-sprites.mjs?v=85";
import {applySpriteAppearance} from "./sprite-cosmetics.mjs?v=85";
const variants=[
  {id:"original",name:"Original",label:"Default",equipped:{}},
  {id:"curious",name:"Curious eyes",label:"3 stars",equipped:{eyes:"curious-eyes"}},
  {id:"fluffy",name:"Extra fluffy",label:"9 stars",equipped:{fur:"extra-fluffy"}},
  {id:"sleepy",name:"Sleepy eyes",label:"30 stars",equipped:{eyes:"sleepy-eyes"}},
  {id:"spiky",name:"Spiky fur",label:"90 stars",equipped:{fur:"spiky-fur"}},
  {id:"combined",name:"Fluffy and curious",label:"Combined example",equipped:{fur:"extra-fluffy",eyes:"curious-eyes"}}
];
const grid=document.getElementById("study-grid");
for(const v of variants){
  const card=document.createElement("section");
  card.className="study-card";card.dataset.study=v.id;
  applySpriteAppearance(card,v.equipped);
  card.innerHTML='<h2>'+v.name+'</h2><small>'+v.label+'</small><div class="study-row">'+
    [["posX","Dark · x"],["negX","White · −x"],["posX2","Square · x²"]].map(([kind,label],i)=>
      '<div class="study-cell"><div class="study-stage">'+spriteCreatureMarkup("cosmetic-study",v.id,kind,i)+'</div><span class="study-caption">'+label+'</span></div>'
    ).join("")+'</div><div class="study-fragment">'+spriteAssemblyMarkup(3,[0,1])+'<span>Two thirds of one sprite</span></div>';
  grid.append(card);
}
const motion=document.getElementById("study-motion");
let reduced=true;
function update(){
  document.body.classList.toggle("reduce-motion",reduced);
  motion.setAttribute("aria-pressed",String(reduced));
  motion.textContent=reduced?"Motion: reduced":"Motion: on";
}
motion.addEventListener("click",()=>{reduced=!reduced;update();});
update();

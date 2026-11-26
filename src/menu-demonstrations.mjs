/**
 * PR100 — miniature, decorative mathematical stories for the two selection menus.
 * All artwork is local, schematic SVG. It does not use the game engine or touch
 * campaign records. The three methods deliberately share one simple example
 * (x + 1 = 4, x = 3) so the difference is the learner's action, not the maths.
 */
export const WORLD_DEMOS=Object.freeze({
  workshop:"A sprite and one weight balance four weights. Remove one from each side and the sprite balances three.",
  opposites:"Two weights and one negative balloon. A weight joins the balloon and the zero pair leaves, so one weight remains.",
  fractions:"One whole weight separates into two equal half weights.",
  squares:"Three rows of three make a square of nine units. Opening the square recovers its side of three."
});
export const METHOD_DEMOS=Object.freeze({
  guided:"Choose subtract one once. The hand automatically removes a weight from each room.",
  independent:"Remove one weight from the left room. The balance tips until you independently match the move on the right.",
  notebook:"Write subtract one on both sides, calculate x equals three, and watch the hand replay both removals."
});
const weight=(x,y,cls="")=>'<g transform="translate('+x+' '+y+')"><g class="'+cls+'"><path class="md-weight" d="M5 5h12l3 16H2z"/><path class="md-handle" d="M8 5V3a3 3 0 0 1 6 0v2"/><path class="md-weight-shine" d="M6 8h5"/></g></g>';
const sprite=(x,y)=>'<g transform="translate('+x+' '+y+')"><ellipse class="md-shadow" cx="15" cy="28" rx="16" ry="3"/><path class="md-sprite" d="M2 22C-1 8 7 0 15 0S31 8 28 22l-3 5h-6l-4-3-4 3H5z"/><ellipse class="md-eye" cx="11" cy="12" rx="2.6" ry="3.7"/><ellipse class="md-eye" cx="20" cy="12" rx="2.6" ry="3.7"/></g>';
const tray=(x,y)=>'<path class="md-tray" d="M'+x+' '+y+'h100l-8 12H'+(x+8)+'z"/>';
const hand=(x,y,cls)=>'<g transform="translate('+x+' '+y+')"><g class="md-hand '+cls+'"><path d="M5 1h7v13l5-4 5 3 4 7-3 9H9l-6-8 1-6 4 2V6z"/><path d="M8 14v7" class="md-hand-detail"/></g></g>';
const label=(x,y,text,cls="")=>'<text x="'+x+'" y="'+y+'" class="md-label '+cls+'" text-anchor="middle">'+text+'</text>';
const pad=(x,y,w,txt,cls="")=>'<g class="md-pad '+cls+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="25" rx="5"/>'+label(x+w/2,y+17,txt)+'</g>';
const panel=(name,description,body)=>'<svg xmlns="http://www.w3.org/2000/svg" class="menu-demo" data-menu-demo="'+name+'" viewBox="0 0 280 156" role="img" aria-label="'+description+'" focusable="false"><rect class="md-board" x="3" y="3" width="274" height="150" rx="12"/>'+body+'</svg>';

function balanceScene(method){
  const isManual=method==="independent",isPaper=method==="notebook",isWorld=method==="workshop";
  const controls=isPaper
    ?'<g class="md-paper"><rect x="65" y="9" width="150" height="48" rx="5"/>'+label(140,24,"x + 1 = 4")+
      label(140,38,"−1        −1","md-paper-operation")+label(140,51,"x = 3","md-paper-result")+'</g>'
    :isManual?pad(25,13,103,"Left −1","md-command-left")+pad(152,13,103,"Right −1","md-command-right")
    :pad(86,13,108,isWorld?"−1 both":"−1 both","md-command-both");
  return '<g class="md-balance '+(isManual?'md-manual':isPaper?'md-notebook':'md-mirror')+'">'+controls+
    '<path class="md-post" d="M140 116v27M111 145h58"/>'+
    '<g class="md-beam"><path d="M69 123h142"/><circle cx="140" cy="123" r="6"/></g>'+
    '<g class="md-left-pan">'+tray(19,109)+sprite(39,80)+weight(83,87,"md-remove-left")+hand(80,53,"md-hand-left")+'</g>'+
    '<g class="md-right-pan">'+tray(161,109)+weight(166,87)+weight(189,87)+weight(212,87)+weight(235,87,"md-remove-right")+hand(232,53,"md-hand-right")+'</g>'+
    '<circle class="md-pivot" cx="140" cy="123" r="6"/>'+
    '</g>';
}
function oppositeScene(){
  return '<g class="md-opposite"><path class="md-shelf" d="M28 122h224"/>'+
    weight(47,99)+
    '<g class="md-zero-pair"><g class="md-float">'+
      '<path class="md-balloon-string" d="M191 58q-9 15 0 27v13"/><ellipse class="md-balloon" cx="191" cy="38" rx="17" ry="22"/><path class="md-balloon" d="M187 59l4-4 4 4z"/>'+label(191,43,"−1","md-balloon-label")+
      '</g><g class="md-pair-weight">'+weight(180,99)+'</g></g>'+
    '<g class="md-pair-caption">'+label(58,95,"+1")+label(191,93,"0","md-zero-label")+'</g>'+
    '</g>';
}
function fractionScene(){
  const half=(x,side)=>'<g transform="translate('+x+' 0)"><g class="md-half md-half-'+side+'"><rect class="md-fraction" x="0" y="64" width="56" height="47" rx="3"/><path class="md-weight-shine" d="M7 71h42"/>'+label(28,93,"½","md-half-label")+'</g></g>';
  return '<g class="md-fractions"><path class="md-shelf" d="M38 120h204"/>'+
    half(84,"left")+half(140,"right")+
    '<g class="md-whole"><rect class="md-fraction" x="84" y="64" width="112" height="47" rx="4"/>'+label(140,93,"1")+'</g>'+
    '<path class="md-cut" d="M140 56v62" stroke-dasharray="4 4"/>'+
    '<path class="md-divider-arrow" d="M116 135h-26m0 0 7-5m-7 5 7 5M164 135h26m0 0-7-5m7 5-7 5"/>'+
    '</g>';
}
function squareScene(){
  const row=(y,cls)=>'<g transform="translate(0 '+y+')"><g class="md-square-row '+cls+'">'+[0,1,2].map((i)=>'<rect class="md-square-unit" x="'+(95+30*i)+'" y="0" width="27" height="27" rx="2"/>').join("")+'</g></g>';
  return '<g class="md-square"><rect class="md-square-outline" x="91" y="29" width="98" height="98" rx="4"/>'+
    row(33,"md-row-one")+row(63,"md-row-two")+row(93,"md-row-three")+
    '<path class="md-dimension" d="M95 23v-6h87v6M85 33h-6v87h6"/>'+label(138,14,"3")+label(68,81,"3")+
    '<g class="md-square-result">'+label(140,145,"3 × 3 = 9")+'</g></g>';
}
export function worldDemoMarkup(id){
  const scene={workshop:()=>balanceScene("workshop"),opposites:oppositeScene,fractions:fractionScene,squares:squareScene}[id];
  return Object.hasOwn(WORLD_DEMOS,id)?panel(id,WORLD_DEMOS[id],scene()):"";
}
export function methodDemoMarkup(id){
  return Object.hasOwn(METHOD_DEMOS,id)?panel(id,METHOD_DEMOS[id],balanceScene(id)):"";
}

/** Pausing is menu-local and ephemeral. The persisted global motion setting
 * and OS preference are respected without writing any additional storage. */
export function createMenuDemoPlayback(){
  const screens=["worlds","stages"].map(name=>document.getElementById("site-"+name));
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  let choice=null;
  try{choice=localStorage.getItem("mathssprites.motion-preference.v1");}catch{}
  let active=null,paused=false,manual=false;
  const isReduced=()=>choice==="reduced"||(choice!=="on"&&media.matches);
  function sync(){
    const reduced=isReduced()&&!manual;
    for(const screen of screens){
      const visible=screen.id==="site-"+active&&!screen.hidden&&!document.hidden;
      screen.dataset.demoMotion=reduced?"reduced":!visible?"inactive":paused?"paused":"playing";
      const button=screen.querySelector("[data-menu-demo-toggle]");
      button.textContent=reduced||paused?"Play previews":"Pause previews";
      button.setAttribute("aria-label",button.textContent+" on this menu");
    }
  }
  for(const screen of screens)screen.querySelector("[data-menu-demo-toggle]").addEventListener("click",()=>{
    if(isReduced()&&!manual){manual=true;paused=false;}else paused=!paused;
    sync();
  });
  media.addEventListener?.("change",()=>{manual=false;paused=false;sync();});
  document.addEventListener("visibilitychange",sync);
  sync();
  return {
    setScreen(name){active=name;sync();},
    setMotionOverride(reduced){choice=reduced?"reduced":"on";manual=false;paused=false;sync();}
  };
}

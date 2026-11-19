import { LEVELS } from "./engine.mjs";
import {createWorkshopEquation} from "./equation-workshop.mjs";
import {createHomeHero} from "./home-hero.mjs";
import {loadResume,saveResume,resumeDestination,resumeLabel,RESUME_STAGE_NUMBERS} from "./resume.mjs";
import {
  WORLDS, WORLD1_CHAPTERS, WORLD1_LEVELS, findWorld1Level,
  isWorld1Unlocked, nextWorld1Level
} from "./worlds.mjs";
import {
 INDEPENDENT_LEVELS,INDEPENDENT_CHAPTERS,findIndependentLevel,
 isIndependentUnlocked,nextIndependentLevel
} from "./independent-levels.mjs";
import {
 APPRENTICE_LEVELS,APPRENTICE_CHAPTERS,findApprenticeLevel,
 isApprenticeUnlocked,nextApprenticeLevel
} from "./apprentice-levels.mjs";
import {
 WORLD1_STAGES,EQUATION_WORKSHOP,stageOneComplete,stageTwoComplete,stageThreeComplete,canOpenWorld1Stage
} from "./stages.mjs";
import {
  loadProgress, saveProgress, markWorld1Complete,
  loadStage2Progress,saveStage2Progress,markStage2Complete,
  loadStage3Progress,saveStage3Progress,markStage3Complete,
  loadTeacherSetting, saveTeacherSetting
} from "./progress.mjs";
import {
  loadRatings,saveRatings,recordBestMoves,bestMoves,optimalMoves,
  starsForMoves,ratingForLevel,starGlyphs,totalEarnedStars,TOTAL_AVAILABLE_STARS
} from "./star-ratings.mjs";
import {
  readGuideEnabled, writeGuideEnabled, writeGuideSeen,writeIndependentGuideSeen
} from "./onboarding.mjs";

const $ = id => document.getElementById(id);
const homeHero=createHomeHero();
window.addEventListener("mathssprites:motion-change",event=>{
  homeHero.setMotionOverride(event.detail?.reduced===true);
});
let progress = loadProgress();
let stage2Progress = loadStage2Progress();
let stage3Progress = loadStage3Progress();
let ratings = loadRatings();
let recent = loadResume();
let teacher = loadTeacherSetting();
let guideEnabled = readGuideEnabled();
let currentScreen = "home";
let playingNumber = null;
let playingStage = null;
let selectedStage = "guided";
function stageCanOpen(id) {
  return canOpenWorld1Stage(id,{
    teacher,
    stage1Completed:stageOneComplete(progress.completed),
    stage2Completed:stageTwoComplete(stage2Progress.completed)
  });
}
function independentUnlocked(number) {
  return stageCanOpen("independent") &&
    isIndependentUnlocked(number,stage2Progress.completed,teacher);
}
function apprenticeUnlocked(number) {
  return stageCanOpen("notebook") &&
    isApprenticeUnlocked(number,stage3Progress.completed,teacher);
}
const screenNames = ["home","worlds","stages","levels","workshop","help","settings"];

function clean(text) {
  return String(text).replace(/[&<>"']/g, ch =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
}
function unlocked(number) {
  return isWorld1Unlocked(number, progress.completed, teacher);
}
function homeDestination() {
  return resumeDestination(recent,progress,stage2Progress,stage3Progress);
}
function homeAction() {
  const destination=homeDestination();
  const current=destination.stage==="independent"?stage2Progress:
    destination.stage==="notebook"?stage3Progress:progress;
  const played=!!recent || progress.completed.length>0 ||
    stage2Progress.completed.length>0 || stage3Progress.completed.length>0 ||
    progress.lastPlayed>1 || stage2Progress.lastPlayed>1 || stage3Progress.lastPlayed>1;
  $("home-play").textContent=resumeLabel(destination,{
    played,completed:current.completed
  });
  const totalCompleted=progress.completed.length+stage2Progress.completed.length+
    stage3Progress.completed.length;
  $("home-progress").textContent="Continue from Stage "+
    RESUME_STAGE_NUMBERS[destination.stage]+" · Level "+destination.number+
    " · "+totalCompleted+" / 48 levels complete · "+
    totalEarnedStars(ratings)+" / "+TOTAL_AVAILABLE_STARS+
    " stars · saved on this browser";
}

function renderWorlds() {
  $("world-cards").innerHTML = WORLDS.map(world => {
    const progressLine = world.available
      ? (stageOneComplete(progress.completed) && stageTwoComplete(stage2Progress.completed)
        ? "STAGES 1–2 MASTERED · STAGE 3 " + stage3Progress.completed.length + "/12 complete"
        : stageOneComplete(progress.completed)
        ? "STAGE 1 MASTERED · STAGE 2 " + stage2Progress.completed.length + "/16 complete"
        : "STAGE 1 · " + progress.completed.length + "/20 complete · all stages open")
      : "COMING SOON";
    return '<article class="world-card world-' + world.theme +
      (world.available ? ' world-ready' : ' world-planned') + '">' +
      '<div class="world-card-scene" aria-hidden="true">' +
        '<span class="world-symbol">' +
        (world.number === 1 ? "⚖" : world.number === 2 ? "±" : world.number === 3 ? "½" : "□") +
        '</span><span class="world-card-orbit"></span></div>' +
      '<div class="world-card-body"><div class="eyebrow">WORLD ' +
        String(world.number).padStart(2,"0") + '</div>' +
      '<h3>' + clean(world.title) + '</h3><p class="world-subtitle">' +
        clean(world.subtitle) + '</p><p>' + clean(world.description) + '</p>' +
      '<div class="world-card-footer"><span>' + progressLine + '</span>' +
        (world.available
          ? '<button type="button" class="primary-btn" data-screen="stages">Explore stages →</button>'
          : '<span class="soon-lock" aria-label="This world is not available yet">◇ Locked</span>') +
      '</div></div></article>';
  }).join("");
}
/** The three distinct representations appear before the existing chapter list.
 * All three implemented learning stages are available to students. */
function renderStages() {
  const statuses={
    guided:{progress,complete:stageOneComplete(progress.completed)},
    independent:{progress:stage2Progress,complete:stageTwoComplete(stage2Progress.completed)},
    notebook:{progress:stage3Progress,complete:stageThreeComplete(stage3Progress.completed)}
  };
  $("world1-stage-cards").innerHTML=WORLD1_STAGES.map(stage=>{
    const playable=stageCanOpen(stage.id),meta=statuses[stage.id];
    const finished=meta.complete;
    const countText=(playable
      ? meta.progress.completed.length+" of "+stage.count+" experiments complete"
      : stage.available
        ? stage.count+" experiments · available to students"
        : stage.count+" new experiments planned")+
        (playable?" · "+totalEarnedStars(ratings,stage.id)+" / "+(stage.count*3)+" stars":"");
    return '<article class="stage-card '+(playable?"stage-ready":"stage-planned")+
      '" data-stage="'+stage.id+'" aria-label="Stage '+stage.number+
      ': '+clean(stage.title)+(playable?", available":", locked")+'">'+
      '<div class="stage-top"><span class="stage-no">STAGE '+String(stage.number).padStart(2,"0")+
      '</span><span class="stage-tag">'+(finished?"Stage mastered":
        playable?"Ready to play":stage.available?"Complete Stage "+(stage.number-1):"Coming soon")+
      '</span></div><div class="stage-ornament" aria-hidden="true">'+stage.icon+'</div>'+
      '<h2>'+clean(stage.title)+'</h2>'+
      '<p class="stage-tagline">'+clean(stage.tagline)+'</p>'+
      '<p>'+clean(stage.description)+'</p>'+
      '<div class="stage-card-bottom"><span class="stage-count">'+countText+'</span>'+
      (playable
        ? '<button type="button" class="primary-btn" data-stage-open="'+stage.id+'"'+
          (stage.id==="guided"?' data-screen="levels"':'')+
          '>Choose Stage '+stage.number+' levels →</button>'
        : '<span class="stage-coming" aria-label="This stage is unavailable">'+
            (stage.available?"◇ Complete Stage "+(stage.number-1)+" to unlock":"◇ New levels in development")+
          '</span>')+'</div></article>';
  }).join("");
  $("world1-workshop").innerHTML=
    '<div class="workshop-glyph" aria-hidden="true">'+EQUATION_WORKSHOP.icon+'</div>'+
    '<div class="workshop-content"><div class="portal-kicker">FREE PLAY · AVAILABLE TO EVERYONE</div>'+
    '<h2>'+clean(EQUATION_WORKSHOP.title)+'</h2>'+
    '<p>'+clean(EQUATION_WORKSHOP.description)+'</p>'+
    '<button type="button" class="primary-btn" data-screen="workshop">Create your own equation →</button></div>';
  $("stage-teacher-note").hidden=!teacher;
  $("stage-teacher-note").textContent=
    "All 48 implemented levels are open to students. Teacher tools retain extra previews. "+
    "Other mathematical worlds are under construction.";
}
function renderLevels() {
  const configs={
    guided:{title:"Guided Balance",number:1,levels:WORLD1_LEVELS,chapters:WORLD1_CHAPTERS,
      progress,open:unlocked,emblems:["−","÷","→","⇄","✦"],
      intro:"Choose the operation. The hand automatically makes the same change to both rooms.",
      finale:"You've finished 20 guided puzzles. Independent Balance now lets you control each chamber yourself."},
    independent:{title:"Independent Balance",number:2,levels:INDEPENDENT_LEVELS,
      chapters:INDEPENDENT_CHAPTERS,progress:stage2Progress,open:independentUnlocked,
      emblems:["↔","÷","→","✦"],
      intro:"Make each mathematical move separately in the west and east rooms. The scale tells you when one move is still waiting to be matched.",
      finale:"You've balanced both chambers yourself in all 16 puzzles. Your next challenge is writing the algebra first."},
    notebook:{title:"Algebra Apprentice",number:3,levels:APPRENTICE_LEVELS,
      chapters:APPRENTICE_CHAPTERS,progress:stage3Progress,open:apprenticeUnlocked,
      emblems:["✎","≡","✦"],
      intro:"Choose one operation at a time using the maths editor. Each new equation is calculated automatically, then the sprites reenact YOUR method.",
      finale:"You've solved all twelve equations on paper before seeing the sprites. Bring your own equation to the free-play Equation Workshop whenever you like."}
  };
  const cfg=configs[selectedStage];
  if(!cfg)return;
  const {levels,chapters,progress:current}=cfg;
  const total=levels.length,completed=current.completed.length;
  const nextNumber=levels.find(slot=>slot.available &&
    !current.completed.includes(slot.number) && cfg.open(slot.number))?.number;
  $("levels-stage-kicker").textContent="WORLD 01 · STAGE "+cfg.number+" · POSITIVE WHOLE NUMBERS";
  $("levels-stage-title").textContent=cfg.title;
  $("levels-stage-intro").textContent=cfg.intro;
  $("level-progress").textContent=completed+" / "+total+" experiments complete · "+
    totalEarnedStars(ratings,selectedStage)+" / "+(total*3)+" stars earned";
  $("world1-progress-description").textContent="Stage "+cfg.number+" · "+cfg.title;
  $("world1-progress-bar").max=total;
  $("world1-progress-bar").value=completed;
  $("world1-progress-number").textContent=completed+" of "+total+" complete";
  $("world1-finale").hidden=completed!==total;
  $("world1-finale").setAttribute("aria-label","Stage "+cfg.number+" completed");
  $("stage-finale-kicker").textContent="STAGE "+cfg.number+" COMPLETE";
  $("stage-finale-title").textContent=cfg.title+" mastered!";
  $("stage-finale-message").textContent=cfg.finale;
  $("level-sections").innerHTML=chapters.map((chapter,index)=>{
    const slots=levels.slice(index*4,index*4+4);
    const finished=slots.filter(slot=>current.completed.includes(slot.number)).length;
    const cards=slots.map(slot=>{
      const done=current.completed.includes(slot.number);
      const open=cfg.open(slot.number);
      const next=slot.number===nextNumber;
      const tag=done?"Completed":open?"Ready to play":"Locked";
      const status=done?"complete":open?"ready":"locked";
      const rating=ratingForLevel(ratings,selectedStage,slot.number);
      const best=bestMoves(ratings,selectedStage,slot.number);
      const ratingLabel=rating
        ?rating+" of 3 stars, best "+best+" "+(best===1?"move":"moves")
        :done?"Previously completed, replay to earn stars":"Not rated yet";
      return '<button type="button" class="level-tile status-'+status+
        (next?' level-next':'')+'" data-level="'+slot.number+'"'+(open?"":" disabled")+
        (next?' aria-current="step"':'')+
        ' aria-label="Stage '+cfg.number+' Level '+slot.number+': '+clean(slot.title)+'. '+tag+'. '+ratingLabel+'">'+
        '<span class="tile-number">'+String(slot.number).padStart(2,"0")+'</span>'+
        '<span class="tile-name">'+clean(slot.title)+'</span>'+
        '<span class="tile-stars" data-stars="'+rating+'" aria-hidden="true">'+starGlyphs(rating)+'</span>'+
        '<span class="tile-status">'+(done?"✓ ":open?"✦ ":"◇ ")+
          (done&&!rating?"Completed · replay for stars":tag)+'</span></button>';
    }).join("");
    return '<section class="chapter-group chapter-theme-'+(index+1)+
      (finished===4?' chapter-complete':'')+
      '" aria-label="Stage '+cfg.number+' Chapter '+(index+1)+': '+clean(chapter.title)+'">'+
      '<div class="chapter-group-heading">'+
      '<div class="chapter-intro"><span class="chapter-badge">'+
      String(index+1).padStart(2,"0")+'</span><div><h3>'+clean(chapter.title)+
      '</h3><p>'+clean(chapter.description)+'</p>'+
      '<p class="chapter-stat">'+(finished===4?"CHAPTER MASTERED":finished+" of 4 experiments complete")+
      '</p></div></div><div class="chapter-illustration" aria-hidden="true">'+
      cfg.emblems[index]+'</div></div><div class="level-grid">'+cards+'</div></section>';
  }).join("");
  $("teacher-note").hidden=!teacher;
  $("teacher-note").textContent="All "+total+" puzzles in Stage "+cfg.number+
    " are available to students. Teacher tools provide additional previews.";
}
function renderSettings() {
  $("teacher-unlock").checked = teacher;
  $("site-guided-help").checked = guideEnabled;
  $("site-replay-independent").hidden=!stageCanOpen("independent");
  $("site-notebook-option").hidden=!teacher;
  const motion = $("motion-toggle").textContent;
  $("site-motion").textContent = motion === "Motion: reduced"
    ? "Turn animations on" : "Use reduced motion";
}
function showScreen(name,{focusHeading=true}={}) {
  if (!screenNames.includes(name)) return;
  if(currentScreen==="notebook-preview" || playingStage==="notebook")
    window.dispatchEvent(new Event("mathssprites:notebook-close"));
  if(currentScreen==="workshop-game")
    window.dispatchEvent(new Event("mathssprites:workshop-close"));
  currentScreen = name;
  playingNumber = null;
  playingStage = null;
  $("site-shell").hidden = false;
  $("game-shell").hidden = true;
  document.body.classList.remove("preview-mode");
  delete document.body.dataset.workshopChapter;
  for (const screen of screenNames) $("site-" + screen).hidden = screen !== name;
  if (name === "home") homeAction();
  if (name === "worlds") renderWorlds();
  if (name === "stages") renderStages();
  if (name === "levels") renderLevels();
  if (name === "settings") renderSettings();
  if (name === "workshop") $("workshop-equation").focus({preventScroll:true});
  homeHero.setActive(name==="home");
  const heading = $("site-" + name).querySelector("h1, h2");
  // The initial home page must not show a focus ring around its headline.
  // Focus headings for actual navigation transitions where they orient users.
  if (heading && focusHeading) heading.focus({preventScroll:true});
  window.scrollTo?.(0,0);
}
function launch(number,stage=selectedStage) {
  if(!stageCanOpen(stage)||!["guided","independent","notebook"].includes(stage))return false;
  const slot=stage==="independent"?findIndependentLevel(number):
    stage==="notebook"?findApprenticeLevel(number):findWorld1Level(number);
  const allowed=stage==="independent"?independentUnlocked(number):
    stage==="notebook"?apprenticeUnlocked(number):unlocked(number);
  if(!slot?.level||!allowed)return false;
  homeHero.setActive(false);
  selectedStage=stage;
  playingStage=stage;
  playingNumber=slot.number;
  recent=saveResume({stage,number:slot.number});
  currentScreen="game";
  if(stage==="independent")
    stage2Progress=saveStage2Progress({...stage2Progress,lastPlayed:slot.number});
  else if(stage==="notebook")
    stage3Progress=saveStage3Progress({...stage3Progress,lastPlayed:slot.number});
  else progress=saveProgress({...progress,lastPlayed:slot.number});
  $("site-shell").hidden=true;
  $("game-shell").hidden=false;
  document.body.classList.remove("preview-mode");
  if(stage==="notebook")
    window.dispatchEvent(new CustomEvent("mathssprites:notebook-campaign",
      {detail:{stage,number:slot.number,level:slot.level}}));
  else
    window.dispatchEvent(new CustomEvent("mathssprites:launch",
      {detail:{stage,number:slot.number,legacyIndex:slot.legacyIndex,level:slot.level}}));
  $("level-title").setAttribute("tabindex","-1");
  $("level-title").focus({preventScroll:true});
  window.scrollTo?.(0,0);
  return true;
}

/** Free-play generator: NEVER modifies any Stage 1/2/3 progress store. */
function workshopStatus(message,status="info"){
  $("workshop-feedback").textContent=message;
  $("workshop-feedback").dataset.status=status;
  $("workshop-equation").setAttribute("aria-invalid",String(status==="error"));
}
function launchWorkshopScene(level,handMode){
  if(!level?.lockPositive||level.quantityMode!=="positive")return false;
  homeHero.setActive(false);
  playingNumber=null;
  playingStage=null;
  currentScreen="workshop-game";
  $("site-shell").hidden=true;
  $("game-shell").hidden=false;
  document.body.classList.remove("preview-mode");
  window.dispatchEvent(new CustomEvent("mathssprites:workshop-launch",{
    detail:{level,handMode:handMode==="manual"?"manual":"auto"}
  }));
  $("level-title").focus({preventScroll:true});
  window.scrollTo?.(0,0);
  return true;
}
$("workshop-form").addEventListener("submit",event=>{
  event.preventDefault();
  const input=$("workshop-equation").value;
  const result=createWorkshopEquation(input);
  if(!result.ok){
    workshopStatus(result.message,"error");
    $("workshop-equation").focus();
    return;
  }
  workshopStatus("Valid balance! Your equation is ready to explore. No campaign progress has been changed.","success");
  launchWorkshopScene(result.level,$("workshop-hand-mode").value);
});
$("workshop-form").addEventListener("click",event=>{
  const example=event.target.closest("[data-workshop-example]");
  if(!example)return;
  $("workshop-equation").value=example.dataset.workshopExample;
  workshopStatus("Example loaded. Choose your hand mode and build the balance.");
  $("workshop-equation").focus();
});
$("workshop-equation").addEventListener("input",()=>{
  $("workshop-equation").setAttribute("aria-invalid","false");
});
window.addEventListener("mathssprites:workshop-another",()=>showScreen("workshop"));

$("site-shell").addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.stageOpen) {
    if(!stageCanOpen(target.dataset.stageOpen))return;
    selectedStage=target.dataset.stageOpen;
    return showScreen("levels");
  }
  if (target.dataset.screen) return showScreen(target.dataset.screen);
  if (target.dataset.level) return launch(Number(target.dataset.level));
});
$("home-play").addEventListener("click", () => {
  const destination=homeDestination(); // exact same destination used by the label
  launch(destination.number,destination.stage);
});
$("teacher-unlock").addEventListener("change", event => {
  teacher = saveTeacherSetting(event.target.checked);
  renderSettings();
  renderStages();
  renderLevels();
  homeAction();
});
$("site-guided-help").addEventListener("change", event => {
  guideEnabled = writeGuideEnabled(event.target.checked);
  window.dispatchEvent(new CustomEvent("mathssprites:guide-setting",
    {detail:{enabled:guideEnabled}}));
  renderSettings();
});
function restartFirstExperimentGuide() {
  guideEnabled = writeGuideEnabled(true);
  writeGuideSeen(false);
  window.dispatchEvent(new CustomEvent("mathssprites:guide-setting",
    {detail:{enabled:true, reset:true}}));
  launch(1,"guided");
}
$("site-replay-intro").addEventListener("click", restartFirstExperimentGuide);
function restartIndependentIntroduction() {
  if(!stageCanOpen("independent"))return;
  guideEnabled=writeGuideEnabled(true);
  writeIndependentGuideSeen(false);
  window.dispatchEvent(new CustomEvent("mathssprites:guide-setting",
    {detail:{enabled:true,stage:"independent",reset:true}}));
  launch(1,"independent");
}
$("site-replay-independent").addEventListener("click",restartIndependentIntroduction);
/** Teacher-facing preview only: PR21 will add real Stage 3 levels and progress. */
function launchNotebookPreview(level=WORLD1_LEVELS[8].level){
  homeHero.setActive(false);
  playingStage=null;
  playingNumber=null;
  currentScreen="notebook-preview";
  $("site-shell").hidden=true;
  $("game-shell").hidden=false;
  document.body.classList.remove("preview-mode");
  window.dispatchEvent(new CustomEvent("mathssprites:notebook-preview",{detail:{level}}));
  $("notebook-operation").focus({preventScroll:true});
  window.scrollTo?.(0,0);
}
$("site-notebook-preview").addEventListener("click",()=>{
  if(teacher)launchNotebookPreview();
});
window.addEventListener("mathssprites:restart-guide", event=>{
  if(event.detail?.stage==="independent")restartIndependentIntroduction();
  else restartFirstExperimentGuide();
});
$("site-motion").addEventListener("click", () => {
  $("motion-toggle").click();
  renderSettings();
});
$("site-back").addEventListener("click", () => showScreen("stages"));
$("stages-back").addEventListener("click", () => showScreen("worlds"));
window.addEventListener("mathssprites:solved",event=>{
  if(playingNumber===null || event.detail?.number!==playingNumber ||
     event.detail?.stage!==playingStage)return;
  const slot=playingStage==="independent"?findIndependentLevel(playingNumber):
    playingStage==="notebook"?findApprenticeLevel(playingNumber):findWorld1Level(playingNumber);
  if(!slot||event.detail?.levelId!==slot.id)return;

  // Preserve the original independent completion stores and their keys.
  if(playingStage==="independent")
    stage2Progress=saveStage2Progress(markStage2Complete(stage2Progress,playingNumber));
  else if(playingStage==="notebook")
    stage3Progress=saveStage3Progress(markStage3Complete(stage3Progress,playingNumber));
  else
    progress=saveProgress(markWorld1Complete(progress,playingNumber));

  // The home CTA must use the NEXT adjacent level (when there is one),
  // even if a student solved the current level out of order.
  const updated=playingStage==="independent"?stage2Progress:
    playingStage==="notebook"?stage3Progress:progress;
  recent=saveResume({stage:playingStage,number:updated.lastPlayed});
  // Both hand visits make ONE algebra move. The score counts the final route,
  // not failed trials, incomplete hand visits or undone transactions.
  const moves=event.detail.moves;
  const optimal=optimalMoves(playingStage,playingNumber);
  const earned=starsForMoves(moves,optimal);
  if(earned){
    ratings=saveRatings(recordBestMoves(ratings,playingStage,playingNumber,moves));
    const best=bestMoves(ratings,playingStage,playingNumber);
    const bestRating=ratingForLevel(ratings,playingStage,playingNumber);
    const message=starGlyphs(earned)+" "+earned+" star"+(earned===1?"":"s")+
      " · "+moves+" "+(moves===1?"move":"moves")+" (optimal: "+optimal+
      ") · Best: "+starGlyphs(bestRating)+" in "+best+" "+(best===1?"move":"moves");
    $("level-clear-rating").textContent=message;
    $("level-clear-rating").hidden=false;
    $("replay-star-summary").textContent=message;
    $("replay-star-summary").hidden=false;
    if(playingStage==="notebook")
      $("notebook-playback-message").textContent+=" · "+message;
  }
  renderWorlds();
  renderStages();
  renderLevels();
  homeAction();
});
window.addEventListener("mathssprites:leave",event=>{
  // A non-campaign notebook preview returns to Settings, not a fake Stage 3 map.
  if(currentScreen==="notebook-preview")
    return showScreen(event.detail?.screen==="home"?"home":"settings");
  if(currentScreen==="workshop-game")
    return showScreen(event.detail?.screen==="home"?"home":"workshop");
  showScreen(event.detail?.screen==="home"?"home":"levels");
});
window.addEventListener("mathssprites:advance",()=>{
  if(playingNumber===null)return showScreen("levels");
  const next=playingStage==="independent"
    ? nextIndependentLevel(playingNumber,stage2Progress.completed,teacher)
    : playingStage==="notebook"
      ? nextApprenticeLevel(playingNumber,stage3Progress.completed,teacher)
      : nextWorld1Level(playingNumber,progress.completed,teacher);
  if(next)launch(next.number,playingStage);
  else showScreen("stages");
});

const params = new URLSearchParams(window.location.search);
const preview = params.get("preview");
const notebookPreview=params.get("notebook");
const workshopDraft=params.get("workshop");
if(workshopDraft!==null){
  $("workshop-equation").value=workshopDraft.slice(0,80);
  showScreen("workshop");
} else if(notebookPreview!==null){
  // Deliberately ONLY existing positive integer sample puzzles until PR21.
  // Direct QA URLs never count towards any campaign's saved progress.
  const sample=WORLD1_LEVELS.find(slot=>slot.id===notebookPreview) || WORLD1_LEVELS[8];
  launchNotebookPreview(sample.level);
} else if (preview !== null) {
  // Direct preview route keeps the 13 prototype experiments testable while
  // the public student route shows only the available World 1 campaign.
  homeHero.setActive(false);
  document.body.classList.add("preview-mode");
  $("site-shell").hidden = true;
  $("game-shell").hidden = false;
  const index = Math.max(0, LEVELS.findIndex(level => level.id === preview));
  window.dispatchEvent(new CustomEvent("mathssprites:preview", { detail:{ index } }));
} else {
  showScreen("home",{focusHeading:false});
}

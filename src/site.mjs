import { LEVELS } from "./engine.mjs";
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
  readGuideEnabled, writeGuideEnabled, writeGuideSeen,writeIndependentGuideSeen
} from "./onboarding.mjs";

const $ = id => document.getElementById(id);
let progress = loadProgress();
let stage2Progress = loadStage2Progress();
let stage3Progress = loadStage3Progress();
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
const screenNames = ["home","worlds","stages","levels","help","settings"];

function clean(text) {
  return String(text).replace(/[&<>"']/g, ch =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
}
function unlocked(number) {
  return isWorld1Unlocked(number, progress.completed, teacher);
}
function homeAction() {
  const stage1Ready=stageOneComplete(progress.completed);
  const stage2Ready=stageTwoComplete(stage2Progress.completed);
  if(stage1Ready&&stage2Ready&&stageCanOpen("notebook")){
    const mastered=stageThreeComplete(stage3Progress.completed);
    const n=apprenticeUnlocked(stage3Progress.lastPlayed)?stage3Progress.lastPlayed:1;
    $("home-play").textContent=mastered?"Explore your mastered stages →":
      stage3Progress.completed.length
        ?"Continue Stage 3 · Level "+n+" →":"Begin Stage 3 · Algebra Apprentice →";
    $("home-progress").textContent="Stages 1 and 2 mastered · Stage 3 "+
      stage3Progress.completed.length+"/12 complete · progress saved on this device";
    return;
  }
  if(stage1Ready&&stageCanOpen("independent")){
    const n=independentUnlocked(stage2Progress.lastPlayed)?stage2Progress.lastPlayed:1;
    $("home-play").textContent=stage2Progress.completed.length
      ?"Continue Stage 2 · Level "+n+" →":"Begin Stage 2 · Independent Balance →";
    $("home-progress").textContent="Stage 1 mastered · Stage 2 "+
      stage2Progress.completed.length+"/16 complete · progress saved on this device";
    return;
  }
  const n=unlocked(progress.lastPlayed)?progress.lastPlayed:1;
  const played=progress.completed.length>0;
  $("home-play").textContent=played
    ? (progress.completed.includes(n)?"Replay Stage 1 · Level ":"Continue Stage 1 · Level ")+n+" →"
    : "Begin Stage 1 · Guided Balance →";
  $("home-progress").textContent=played
    ? progress.completed.length+" of 20 Guided Balance experiments complete · saved on this device"
    : "Stage 1: 20 playable experiments · Stage 2 opens after Stage 1";
}
function renderWorlds() {
  $("world-cards").innerHTML = WORLDS.map(world => {
    const progressLine = world.available
      ? (stageOneComplete(progress.completed) && stageTwoComplete(stage2Progress.completed)
        ? "STAGES 1–2 MASTERED · STAGE 3 " + stage3Progress.completed.length + "/12 complete"
        : stageOneComplete(progress.completed)
        ? "STAGE 1 MASTERED · STAGE 2 " + stage2Progress.completed.length + "/16 complete"
        : "STAGE 1 · " + progress.completed.length + "/20 complete · Stage 2 next")
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
 * Locked stages have no playable link, even when the teacher flag is on. */
function renderStages() {
  const complete=stageOneComplete(progress.completed);
  $("world1-stage-cards").innerHTML=WORLD1_STAGES.map(stage=>{
    const playable=stageCanOpen(stage.id);
    const countText=stage.id==="guided"
      ? progress.completed.length+" of "+stage.count+" experiments complete"
      : stage.id==="independent"
        ? (playable?stage2Progress.completed.length+" of "+stage.count+" experiments complete"
          : stage.count+" experiments · complete Stage 1 to unlock")
        : stage.count+" new experiments planned";
    const finished=stage.id==="guided"?complete:
      stage.id==="independent"&&stageTwoComplete(stage2Progress.completed);
    return '<article class="stage-card '+(playable?"stage-ready":"stage-planned")+
      '" data-stage="'+stage.id+'" aria-label="Stage '+stage.number+
      ': '+clean(stage.title)+(playable?", available":", locked")+'">'+
      '<div class="stage-top"><span class="stage-no">STAGE '+String(stage.number).padStart(2,"0")+
      '</span><span class="stage-tag">'+(finished?"Stage mastered":
        playable?"Ready to play":stage.available?"Complete Stage 1":"Coming soon")+
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
            (stage.available?"◇ Complete Stage 1 to unlock":"◇ New levels in development")+
          '</span>')+'</div></article>';
  }).join("");
  $("world1-workshop").innerHTML=
    '<div class="workshop-glyph" aria-hidden="true">'+EQUATION_WORKSHOP.icon+'</div>'+
    '<div class="workshop-content"><div class="portal-kicker">FREE PLAY · PLANNED</div>'+
    '<h2>'+clean(EQUATION_WORKSHOP.title)+'</h2><p>'+
    clean(EQUATION_WORKSHOP.description)+'</p></div>'+
    '<span class="workshop-planned" aria-label="Equation Workshop is coming soon">◇ Coming soon</span>';
  $("stage-teacher-note").hidden=!teacher;
  $("stage-teacher-note").textContent=
    "Teacher access opens all implemented Stage 1 and Stage 2 puzzles. "+
    "Stage 3, future mathematical worlds and the Equation Workshop are not built yet.";
}
function renderLevels() {
  const independent=selectedStage==="independent";
  const stage=independent?"Independent Balance":"Guided Balance";
  const stageNumber=independent?2:1;
  const source=independent?INDEPENDENT_LEVELS:WORLD1_LEVELS;
  const chapters=independent?INDEPENDENT_CHAPTERS:WORLD1_CHAPTERS;
  const current=independent?stage2Progress:progress;
  const total=source.length,completed=current.completed.length;
  const allowed=number=>independent?independentUnlocked(number):unlocked(number);
  const nextNumber=source.find(slot=>
    slot.available&&!current.completed.includes(slot.number)&&allowed(slot.number))?.number;
  $("levels-stage-kicker").textContent="WORLD 01 · STAGE "+stageNumber+" · POSITIVE WHOLE NUMBERS";
  $("levels-stage-title").textContent=stage;
  $("levels-stage-intro").textContent=independent
    ? "Make each mathematical move separately in the west and east rooms. The scale tells you when one move is still waiting to be matched."
    : "Choose the operation. The hand automatically makes the same change to both rooms.";
  $("level-progress").textContent=completed+" / "+total+" experiments complete";
  $("world1-progress-description").textContent="Stage "+stageNumber+" · "+stage;
  $("world1-progress-bar").max=total;
  $("world1-progress-bar").value=completed;
  $("world1-progress-number").textContent=completed+" of "+total+" complete";
  $("world1-finale").hidden=completed!==total;
  $("world1-finale").setAttribute("aria-label","Stage "+stageNumber+" completed");
  $("stage-finale-kicker").textContent="STAGE "+stageNumber+" COMPLETE";
  $("stage-finale-title").textContent=stage+" mastered!";
  $("stage-finale-message").textContent=independent
    ? "You've balanced both chambers yourself in all 16 puzzles. Your next challenge will be writing the algebra first."
    : "You've finished 20 guided puzzles. Independent Balance now lets you control each chamber yourself.";
  const emblems=independent?["↔","÷","→","✦"]:["−","÷","→","⇄","✦"];
  $("level-sections").innerHTML=chapters.map((chapter,index)=>{
    const slots=source.slice(index*4,index*4+4);
    const finished=slots.filter(slot=>current.completed.includes(slot.number)).length;
    const cards=slots.map(slot=>{
      const done=current.completed.includes(slot.number);
      const open=allowed(slot.number);
      const next=slot.number===nextNumber;
      const tag=done?"Completed":open?"Ready to play":"Locked";
      const status=done?"complete":open?"ready":"locked";
      return '<button type="button" class="level-tile status-'+status+
        (next?' level-next':'')+'" data-level="'+slot.number+'"'+(open?"":" disabled")+
        (next?' aria-current="step"':'')+
        ' aria-label="Stage '+stageNumber+' Level '+slot.number+': '+clean(slot.title)+'. '+tag+'">'+
        '<span class="tile-number">'+String(slot.number).padStart(2,"0")+'</span>'+
        '<span class="tile-name">'+clean(slot.title)+'</span>'+
        '<span class="tile-status">'+(done?"✓ ":open?"✦ ":"◇ ")+tag+'</span></button>';
    }).join("");
    return '<section class="chapter-group chapter-theme-'+(index+1)+
      (finished===4?' chapter-complete':'')+
      '" aria-label="Stage '+stageNumber+' Chapter '+(index+1)+': '+clean(chapter.title)+'">'+
      '<div class="chapter-group-heading">'+
      '<div class="chapter-intro"><span class="chapter-badge">'+
      String(index+1).padStart(2,"0")+'</span><div><h3>'+clean(chapter.title)+
      '</h3><p>'+clean(chapter.description)+'</p>'+
      '<p class="chapter-stat">'+(finished===4?"CHAPTER MASTERED":finished+" of 4 experiments complete")+
      '</p></div></div><div class="chapter-illustration" aria-hidden="true">'+
      emblems[index]+'</div></div><div class="level-grid">'+cards+'</div></section>';
  }).join("");
  $("teacher-note").hidden=!teacher;
  $("teacher-note").textContent="Teacher access: all "+total+" puzzles in Stage "+stageNumber+
    " are unlocked, without changing their mathematical restrictions.";
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
function showScreen(name) {
  if (!screenNames.includes(name)) return;
  if(currentScreen==="notebook-preview")
    window.dispatchEvent(new Event("mathssprites:notebook-close"));
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
  const heading = $("site-" + name).querySelector("h1, h2");
  if (heading) heading.focus({preventScroll:true});
  window.scrollTo?.(0,0);
}
function launch(number,stage=selectedStage) {
  if(!stageCanOpen(stage) || !["guided","independent"].includes(stage))return false;
  const independent=stage==="independent";
  const slot=independent?findIndependentLevel(number):findWorld1Level(number);
  const allowed=independent?independentUnlocked(number):unlocked(number);
  if(!slot?.level||!allowed)return false;
  selectedStage=stage;
  playingStage=stage;
  playingNumber=slot.number;
  currentScreen="game";
  if(independent) stage2Progress=saveStage2Progress({...stage2Progress,lastPlayed:slot.number});
  else progress=saveProgress({...progress,lastPlayed:slot.number});
  $("site-shell").hidden=true;
  $("game-shell").hidden=false;
  document.body.classList.remove("preview-mode");
  window.dispatchEvent(new CustomEvent("mathssprites:launch",{
    detail:{stage,number:slot.number,legacyIndex:slot.legacyIndex,level:slot.level}
  }));
  $("level-title").setAttribute("tabindex","-1");
  $("level-title").focus({preventScroll:true});
  window.scrollTo?.(0,0);
  return true;
}

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
  if(stageOneComplete(progress.completed) && stageTwoComplete(stage2Progress.completed))
    return showScreen("stages");
  if(stageOneComplete(progress.completed) && stageCanOpen("independent"))
    return launch(independentUnlocked(stage2Progress.lastPlayed)?stage2Progress.lastPlayed:1,"independent");
  return launch(unlocked(progress.lastPlayed)?progress.lastPlayed:1,"guided");
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
  playingStage=null;
  playingNumber=null;
  currentScreen="notebook-preview";
  $("site-shell").hidden=true;
  $("game-shell").hidden=false;
  document.body.classList.remove("preview-mode");
  window.dispatchEvent(new CustomEvent("mathssprites:notebook-preview",{detail:{level}}));
  $("notebook-equation").focus({preventScroll:true});
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
  if(playingStage==="independent")
    stage2Progress=saveStage2Progress(markStage2Complete(stage2Progress,playingNumber));
  else
    progress=saveProgress(markWorld1Complete(progress,playingNumber));
  renderWorlds();
  renderStages();
  renderLevels();
  homeAction();
});
window.addEventListener("mathssprites:leave",event=>{
  // A non-campaign notebook preview returns to Settings, not a fake Stage 3 map.
  if(currentScreen==="notebook-preview")
    return showScreen(event.detail?.screen==="home"?"home":"settings");
  showScreen(event.detail?.screen==="home"?"home":"levels");
});
window.addEventListener("mathssprites:advance",()=>{
  if(playingNumber===null)return showScreen("levels");
  const next=playingStage==="independent"
    ? nextIndependentLevel(playingNumber,stage2Progress.completed,teacher)
    : nextWorld1Level(playingNumber,progress.completed,teacher);
  if(next)launch(next.number,playingStage);
  else showScreen("stages");
});

const params = new URLSearchParams(window.location.search);
const preview = params.get("preview");
const notebookPreview=params.get("notebook");
if(notebookPreview!==null){
  // Deliberately ONLY existing positive integer sample puzzles until PR21.
  // Direct QA URLs never count towards any campaign's saved progress.
  const sample=WORLD1_LEVELS.find(slot=>slot.id===notebookPreview) || WORLD1_LEVELS[8];
  launchNotebookPreview(sample.level);
} else if (preview !== null) {
  // Direct preview route keeps the 13 prototype experiments testable while
  // the public student route shows only the available World 1 campaign.
  document.body.classList.add("preview-mode");
  $("site-shell").hidden = true;
  $("game-shell").hidden = false;
  const index = Math.max(0, LEVELS.findIndex(level => level.id === preview));
  window.dispatchEvent(new CustomEvent("mathssprites:preview", { detail:{ index } }));
} else {
  showScreen("home");
}

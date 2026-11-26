import { LEVELS } from "./engine.mjs";
import {createFractionCampaignView} from "./fraction-campaign.mjs?v=97";
import {
  CAMPAIGN_REGISTRY,findCampaignWorld,findCampaignStage,findCampaignLevel,
  nextCampaignLevel,isCampaignPlayable,firstCampaignLevel
} from "./campaign-registry.mjs";
import {
  loadCampaignRecords,saveCampaignRecords,loadCampaignResume,saveCampaignResume,
  withCampaignLastPlayed,withCampaignCompleted,campaignStageRecord,
  campaignStars,campaignStarTotals,campaignOptimalMoves,stageResumeLevel
} from "./campaign-records.mjs?v=84";
import {createCosmeticRewards,COSMETIC_SAVE_KEY} from "./cosmetic-rewards.mjs?v=97";
import {applyLaboratoryAppearance} from "./laboratory-cosmetics.mjs?v=96";
import {mountSpriteAtelier} from "./sprite-atelier.mjs?v=96";
import {mountRewardCelebration} from "./reward-celebration.mjs?v=91";
import {createWorkshopEquation,WORKSHOP_EXAMPLES} from "./equation-workshop.mjs?v=82";
import {createSignedWorkshopEquation,SIGNED_WORKSHOP_EXAMPLES} from "./signed-workshop.mjs?v=82";
import {createFractionWorkshopEquation,FRACTION_WORKSHOP_EXAMPLES} from "./fraction-workshop.mjs";
import {createSquareWorkshopEquation,SQUARE_WORKSHOP_EXAMPLES,SQUARE_BUILD_EXAMPLES} from "./square-workshop.mjs";
import {createHomeHero} from "./home-hero.mjs?v=88";
import {WORLD_DEMOS,METHOD_DEMOS,worldDemoMarkup,methodDemoMarkup,createMenuDemoPlayback} from "./menu-demonstrations.mjs?v=100";
import {compactWorldProgress,compactStageProgress,briefStageIntro,worldChoiceIntro,methodChoiceIntro} from "./menu-copy.mjs?v=101";
import {boardContinueLevel,spatialTileIndex,campaignMenuScreen,campaignHomeLabel} from "./navigation-journey.mjs?v=98";
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
const menuDemos=createMenuDemoPlayback();
window.addEventListener("mathssprites:motion-change",event=>{
  homeHero.setMotionOverride(event.detail?.reduced===true);
  menuDemos.setMotionOverride(event.detail?.reduced===true);
});
let progress = loadProgress();
let stage2Progress = loadStage2Progress();
let stage3Progress = loadStage3Progress();
let ratings = loadRatings();
let recent = loadResume();
let campaign = loadCampaignRecords();
// One authoritative reward session shared by the renderer and Atelier.
export const cosmeticRewards=createCosmeticRewards(campaign);
applyLaboratoryAppearance(document.body,cosmeticRewards.getSnapshot().equipped);
cosmeticRewards.subscribe(change=>{
  applyLaboratoryAppearance(document.body,change.snapshot.equipped);
  fractionCampaign?.setAppearance(change.snapshot.equipped);
  window.dispatchEvent(new CustomEvent("mathssprites:cosmetics-change",{detail:change}));
});
const atelier=mountSpriteAtelier({root:$("site-atelier"),homeSummary:$("home-atelier-stars"),store:cosmeticRewards});
const rewardCelebration=mountRewardCelebration();
window.addEventListener("mathssprites:reward-review-ready",()=>{
  const replay=$("replay-backdrop");
  rewardCelebration.reveal({anchor:replay.hidden?document.body:replay.querySelector(".replay-card")});
});
window.addEventListener("mathssprites:reward-review-closed",()=>rewardCelebration.leaveReview());
let campaignResume = loadCampaignResume();
let teacher = loadTeacherSetting();
let guideEnabled = readGuideEnabled();
let currentScreen = "home";
let playingNumber = null;
let playingStage = null;
let playingWorld = null;
let fractionCampaign=null;
// Synchronize cosmetics across tabs without repainting an active physical
// experiment. Safe menu/level boundaries read the latest saved appearance.
// Campaign progress retains its existing independent save lifecycle.
window.addEventListener("storage",event=>{
  if(event.key!==COSMETIC_SAVE_KEY)return;
  try{if(event.storageArea!==localStorage)return;}catch{return;}
  if(screenNames.includes(currentScreen))cosmeticRewards.refreshAppearance();
});
function closeFractionCampaign(){fractionCampaign?.destroy();fractionCampaign=null;}
// Browsing is independent of the stored resume. No automatic method choice.
let selectedWorld = null;
let selectedStage = null;
let selectedLevelId = null;
let workshopReturnScreen = "home";
let atelierReturnScreen = "home";
// Preserve each stage's chapter scroll position when returning from a game.
const boardScrollPositions=new Map();
let supportReturnScreen = "home";
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
const screenNames = ["home","worlds","stages","levels","workshop","atelier","help","settings"];

function clean(text) {
  return String(text).replace(/[&<>"']/g, ch =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
}
const PORTAL_DOOR_ART=Object.freeze({
  workshop:"balance",opposites:"opposites",fractions:"fractions",squares:"squares"
});
const PORTAL_STAGE_ART=new Set(["guided","independent","notebook"]);
function portalStageArt(id,icon="✦") {
  return PORTAL_STAGE_ART.has(id)
    ? '<img class="portal-stage-medallion" src="./assets/portal/stage-'+id+
      '.svg" alt="" loading="lazy" width="160" height="160" />'
    : '<span class="portal-stage-fallback">'+clean(icon)+'</span>';
}
function unlocked(number) {
  return isWorld1Unlocked(number, progress.completed, teacher);
}
function homeDestination() {
  const fallback=resumeDestination(recent,progress,stage2Progress,stage3Progress);
  const old=findCampaignLevel("workshop",fallback.stage,fallback.number);
  const target=campaignResume||{worldId:"workshop",stageId:fallback.stage,levelId:old?.id};
  const slot=(isCampaignPlayable(target.worldId,target.stageId,target.levelId)?
    findCampaignLevel(target.worldId,target.stageId,target.levelId):null)||
    firstCampaignLevel("workshop","guided");
  return {worldId:slot.worldId,stageId:slot.stageId,levelId:slot.id,
    stage:slot.stageId,number:slot.number};
}
function hasCampaignHistory(){
  return !!recent||!!campaignResume||campaignStarTotals(campaign).completed>0||
    progress.lastPlayed>1||stage2Progress.lastPlayed>1||stage3Progress.lastPlayed>1;
}
function homeAction() {
  const played=hasCampaignHistory();
  $("home-play").hidden=!played;
  $("home-choose-level").classList.toggle("primary-btn",!played);
  $("home-choose-level").classList.toggle("secondary-btn",played);
  const destination=homeDestination();
  const world=findCampaignWorld(destination.worldId);
  const stage=findCampaignStage(destination.worldId,destination.stageId);
  const record=campaignStageRecord(campaign,destination.worldId,destination.stageId);
  $("home-play").textContent=campaignHomeLabel(world,stage,destination.number,record.completed.includes(destination.levelId));
  const totals=campaignStarTotals(campaign,{worldId:destination.worldId});
  $("home-progress").textContent=played?
    world.title+" · "+totals.completed+"/"+totals.count+" levels · "+totals.earned+"/"+totals.available+" ★":
    "Four worlds · Choose how you learn";
}

function renderWorlds() {
  $("world-cards").innerHTML = CAMPAIGN_REGISTRY.map(world => {
    const totals=campaignStarTotals(campaign,{worldId:world.id});
    const progressLine=compactWorldProgress(world,totals);
    const artwork=PORTAL_DOOR_ART[world.id];
    return '<article class="world-card world-' + world.theme +
      (world.available ? ' world-ready' : ' world-planned') +
      '" data-world-art="'+clean(world.id)+'">' +
      '<div class="world-card-scene" aria-hidden="true">' +
        (artwork
          ? '<img class="hall-door-art" src="./assets/portal/door-'+artwork+
            '.svg" width="320" height="360" alt="" loading="lazy" decoding="async" />'
          : '<span class="world-symbol">'+clean(world.icon||"✦")+'</span>')+
        '<span class="hall-door-mist"></span>'+worldDemoMarkup(world.id)+'</div>' +
      '<div class="world-card-body"><div class="eyebrow">WORLD ' +
        String(world.number).padStart(2,"0") + '</div>' +
      '<h3>' + clean(world.title) + '</h3><p class="world-subtitle">' +
        clean(world.subtitle) + '</p><p class="world-context">'+clean(worldChoiceIntro(world))+'</p><p class="visually-hidden">'+clean(WORLD_DEMOS[world.id]||"")+'</p>' +
      '<div class="world-card-footer"><span class="world-progress">' + progressLine + ' · '+totals.earned+' / '+totals.available+' ★</span>' +
        (world.available
          ? '<button type="button" class="primary-btn" data-world-stages="'+clean(world.id)+'" aria-label="Choose '+clean(world.title)+' — '+clean(world.subtitle)+'">'+
            "Choose world →"+'</button>'
          : '<span class="soon-lock" aria-label="This world is not available yet">◇ Locked</span>') +
      '</div></div></article>';
  }).join("");
}
/** The three distinct representations appear before the existing chapter list.
 * All three implemented learning stages are available to students. */
function renderStages() {
  const world=findCampaignWorld(selectedWorld);
  if(!world?.available)return;
  $("site-stages").dataset.activeWorld=world.id;
  $("stages-world-kicker").textContent="WORLD "+String(world.number).padStart(2,"0")+" · "+
    world.title.toUpperCase()+" · 2 OF 3";
  $("world1-stage-cards").setAttribute("aria-label",world.title+" learning stages");
  $("world1-stage-cards").innerHTML=world.stages.map(stage=>{
    const record=campaignStageRecord(campaign,world.id,stage.id);
    const score=campaignStarTotals(campaign,{worldId:world.id,stageId:stage.id});
    const playable=stage.available,finished=score.count>0&&score.completed===score.count;
    const countText=compactStageProgress(score.completed,stage.count,score.earned,score.available);
    const recommended=stage.method==="auto"&&score.completed===0;
    const methodTitle=stage.method==="auto"?"Guided":stage.method==="manual"?"Independent":stage.method==="notebook"?"Algebra Apprentice":stage.title;
    return '<article class="stage-card '+(playable?"stage-ready":"stage-planned")+
      '" data-stage="'+clean(stage.id)+'" aria-label="Stage '+stage.number+
      ': '+clean(stage.title)+(playable?", available":", unavailable")+'">'+
      '<div class="stage-top"><span class="stage-no">STAGE '+String(stage.number).padStart(2,"0")+
      '</span><span class="stage-tag">'+(finished?"Method mastered":!playable?"Coming soon":recommended?"Recommended start":"Available")+
      '</span></div><div class="stage-ornament" aria-hidden="true">'+
        portalStageArt(stage.id,stage.icon)+methodDemoMarkup(stage.id)+'</div>'+
      '<h2>'+clean(methodTitle)+'</h2>'+
      '<p class="stage-tagline">'+clean(methodChoiceIntro(stage))+'</p><p class="visually-hidden">'+clean(METHOD_DEMOS[stage.id]||"")+'</p>'+
      '<div class="stage-card-bottom"><span class="stage-count">'+countText+'</span>'+
      (playable
        ? '<button type="button" class="primary-btn" data-stage-open="'+clean(stage.id)+'">Choose '+clean(methodTitle)+' →</button>'
        : '<span class="stage-coming">◇ In development</span>')+
      '</div></article>';
  }).join("");
  // Free play is a separate Home entry (and optional utility link on levels).
  $("stage-teacher-note").hidden=!teacher||world.id!=="workshop";
  $("stage-teacher-note").textContent=
    "All "+world.stages.reduce((n,stage)=>n+stage.levels.filter(slot=>slot.available).length,0)+" implemented levels are open; teacher tools add previews.";
}
function renderLevels() {
  const world=findCampaignWorld(selectedWorld);
  const stage=findCampaignStage(selectedWorld,selectedStage);
  if(!world?.available||!stage?.available)return;
  const levels=stage.levels,chapters=stage.chapters;
  const current=campaignStageRecord(campaign,world.id,stage.id);
  const total=levels.filter(x=>x.available).length,completed=current.completed.length;
  const resumed=campaignResume?.worldId===world.id &&
    campaignResume?.stageId===stage.id &&
    campaignResume?.levelId===current.lastPlayed;
  const suggested=boardContinueLevel(stage,current,{resumed});
  const stageStars=campaignStarTotals(campaign,{worldId:world.id,stageId:stage.id});
  $("site-levels").dataset.activeWorld=world.id;
  $("site-levels").dataset.activeStage=stage.id;
  $("levels-stage-kicker").textContent="WORLD "+String(world.number).padStart(2,"0")+
    " · "+world.subtitle;
  $("levels-stage-title").textContent=stage.title;
  $("levels-stage-intro").textContent=briefStageIntro(stage);
  $("level-progress").textContent=stageStars.earned+" / "+
    stageStars.available+" stars earned";
  $("world1-progress-description").textContent=stage.title+" progress";
  $("world1-progress-bar").max=total||1;
  $("world1-progress-bar").value=completed;
  $("world1-progress-number").textContent=completed+" of "+total+" complete";
  $("world1-finale").hidden=completed!==total||total===0;
  $("world1-finale").setAttribute("aria-label",stage.title+" completed");
  $("stage-finale-kicker").textContent="STAGE "+stage.number+" COMPLETE";
  $("stage-finale-title").textContent=stage.title+" mastered!";
  $("stage-finale-message").textContent=stage.finale||"You completed all experiments in this stage.";
  const sections=$("level-sections");
  $("suggested-level-number").textContent=suggested?"Suggested: level "+suggested.number:"";
  $("suggested-level-number").hidden=!suggested;
  // PR51: the sixth Guided chapter makes TWO rows. A whole chapter must
  // never be squeezed to half its readable height by the fixed-height board.
  // Its card grid scrolls internally; the header/navigation remain in place.
  const boardKey=world.id+"/"+stage.id;
  const priorScroll=boardScrollPositions.get(boardKey)??0;
  sections.dataset.boardKey=boardKey;
  sections.dataset.chapterLayout=chapters.length>5?"multi-row":"single-row";
  sections.setAttribute("role","region");
  sections.setAttribute("aria-label",stage.title+" chapters"+
    (chapters.length>5?". Scroll to see later chapters.":"."));
  sections.tabIndex=chapters.length>5?0:-1;
  sections.style.setProperty("--map-cols",String(chapters.length===6?3:Math.min(chapters.length,5)));
  sections.innerHTML=chapters.map((chapter,index)=>{
    const slots=levels.filter(slot=>slot.chapterIndex===index);
    const finished=slots.filter(slot=>current.completed.includes(slot.id)).length;
    const cards=slots.map(slot=>{
      const done=current.completed.includes(slot.id);
      const historical=!done&&!!current.historical?.[slot.id];
      const open=isCampaignPlayable(world.id,stage.id,slot.id);
      const highlighted=slot.id===suggested?.id;
      const tag=done?"Completed":historical?"Previously completed; revised puzzle":
        open?"Ready to play":"Locked";
      const status=done?"complete":historical?"revised":open?"ready":"locked";
      const rating=campaignStars(campaign,world.id,stage.id,slot.id);
      const best=current.bestMoves[slot.id];
      const ratingLabel=rating?rating+" of 3 stars, best "+best+" "+
        (best===1?"move":"moves"):historical?
          "Your earlier result is preserved; try the revised challenge to earn new stars":
        done?"Previously completed, replay to earn stars":"Not rated yet";
      return '<button type="button" class="level-tile status-'+status+
        (highlighted?' level-next':'')+'" data-level="'+slot.number+
        '" data-level-id="'+clean(slot.id)+'"'+(open?"":" disabled")+
        (highlighted?' aria-current="step"':'')+
        ' tabindex="-1" aria-pressed="false" aria-controls="selected-level-details"'+
        ' aria-label="'+clean(world.title)+', '+clean(stage.title)+
        ', Level '+slot.number+': '+clean(slot.title)+'. '+tag+'. '+ratingLabel+'">'+
        '<span class="tile-number">'+String(slot.number).padStart(2,"0")+'</span>'+
        '<span class="tile-stars" data-stars="'+rating+'" aria-hidden="true">'+starGlyphs(rating)+'</span>'+
        '<span class="tile-status visually-hidden">'+(done?"✓ ":historical?"↻ ":open?"✦ ":"◇ ")+
          (done&&!rating?"Completed · replay for stars":done?"Completed":
            historical?"Revised · replay":open?"Play":"Locked")+'</span></button>';
    }).join("");
    return '<section class="chapter-group chapter-theme-'+(index+1)+
      (slots.length>0&&finished===slots.length?' chapter-complete':'')+
      '" style="--map-rows:'+Math.max(1,slots.length)+'"'+
      ' aria-label="'+clean(world.title)+', '+clean(stage.title)+
      ', chapter '+(index+1)+': '+clean(chapter.title)+'">'+
      '<div class="chapter-group-heading">'+
      '<div class="chapter-intro"><span class="chapter-badge">'+
      String(index+1).padStart(2,"0")+'</span><div><h3>'+clean(chapter.title)+
      '</h3><p>'+clean(chapter.description||"")+'</p>'+
      '<p class="chapter-stat">'+(slots.length>0&&finished===slots.length?
        "Mastered":finished+" / "+slots.length+" complete")+
      '</p></div></div><div class="chapter-illustration" aria-hidden="true">'+
      clean(stage.emblems?.[index]||"✦")+'</div></div><div class="level-grid">'+cards+
      '</div></section>';
  }).join("");
  sections.scrollTop=priorScroll;
  renderSelectedLevel();
  const focusTile=[...sections.querySelectorAll(".level-tile:not(:disabled)")].find(tile=>tile.dataset.levelId===selectedLevelId)||sections.querySelector(".level-next:not(:disabled)")||sections.querySelector(".level-tile:not(:disabled)");
  setLevelTabStop(focusTile);
  $("teacher-note").hidden=!teacher;
  $("teacher-note").textContent="All "+total+" puzzles in "+stage.title+
    " are available. Teacher previews are separate from student progress.";
}
// One tab stop for the grid; spatial arrow navigation still visits every level.
function setLevelTabStop(tile){
  if(!tile||tile.disabled)return;
  $("level-sections").querySelectorAll(".level-tile").forEach(item=>item.tabIndex=item===tile?0:-1);
}
// Selecting a level is deliberately a transient UI action, never a save.
function renderSelectedLevel(){
  const world=findCampaignWorld(selectedWorld);
  const stage=findCampaignStage(selectedWorld,selectedStage);
  const slot=selectedLevelId&&isCampaignPlayable(selectedWorld,selectedStage,selectedLevelId)
    ?findCampaignLevel(selectedWorld,selectedStage,selectedLevelId):null;
  const play=$("board-continue"),details=$("selected-level-details");
  $("level-sections").querySelectorAll(".level-tile").forEach(tile=>{
    tile.setAttribute("aria-pressed",String(!!slot&&tile.dataset.levelId===slot.id));
  });
  $("selected-level-content").hidden=!slot;
  $("selected-level-placeholder").hidden=!!slot;
  play.disabled=!slot;
  if(!slot){
    delete play.dataset.levelId;
    play.textContent="Play level";
    details.removeAttribute("data-chapter");
    return;
  }
  const current=campaignStageRecord(campaign,world.id,stage.id);
  const chapter=stage.chapters[slot.chapterIndex];
  const rating=campaignStars(campaign,world.id,stage.id,slot.id);
  const best=current.bestMoves[slot.id];
  const done=current.completed.includes(slot.id);
  const revised=!done&&!!current.historical?.[slot.id];
  details.dataset.chapter=String(slot.chapterIndex+1);
  $("selected-level-kicker").textContent="LEVEL "+slot.number+" · "+chapter.title;
  $("selected-level-title").textContent=slot.title;
  $("selected-level-description").textContent=slot.level.prompt||chapter.description||"Find the sprite's value.";
  $("selected-level-rating").textContent=starGlyphs(rating)+" · "+(rating?rating+" of 3 stars":"Not rated yet")+
    (Number.isInteger(best)?" · Best: "+best+" "+(best===1?"move":"moves"):"");
  $("selected-level-status").textContent=done?"Completed":revised?"Revised challenge · replay for new stars":"Ready to play";
  play.dataset.levelId=slot.id;
  play.textContent=(done?"Replay":"Play")+" Level "+slot.number+" →";
  $("board-selection-status").textContent="Selected Level "+slot.number+": "+slot.title+". "+$("selected-level-status").textContent+".";
}
function renderSettings() {
  $("teacher-unlock").checked = teacher;
  $("site-guided-help").checked = guideEnabled;
  $("site-replay-independent").hidden=!stageCanOpen("independent");
  $("site-notebook-option").hidden=!teacher;
  const motion = $("motion-toggle").textContent;
  $("site-motion").textContent = motion === "Motion: reduced"
    ? "Turn animations on" : "Use reduced motion";
  $("site-motion").setAttribute("aria-pressed",String(motion === "Motion: reduced"));
}
function showScreen(name,{focusHeading=true}={}) {
  const previousScreen=currentScreen;
  name=campaignMenuScreen(name,findCampaignWorld(selectedWorld),findCampaignStage(selectedWorld,selectedStage));
  if (!screenNames.includes(name)) return;
  if(name==="workshop" && currentScreen!=="workshop" && currentScreen!=="workshop-game"){
    workshopReturnScreen=currentScreen==="levels"?"levels":"home";
    if(currentScreen==="levels")setWorkshopQuantity(selectedWorld==="opposites"?"signed":["fractions","squares"].includes(selectedWorld)?selectedWorld:"positive");
  }
  if(name==="atelier"&&currentScreen!=="atelier"){
    if(["home","worlds","stages","levels","workshop"].includes(currentScreen))atelierReturnScreen=currentScreen;
    else if(["help","settings"].includes(currentScreen)&&supportReturnScreen!=="atelier")
      atelierReturnScreen=["home","worlds","stages","levels","workshop"].includes(supportReturnScreen)?supportReturnScreen:"home";
  }
  if((name==="help"||name==="settings") &&
      !["help","settings"].includes(currentScreen) &&
      screenNames.includes(currentScreen))
    supportReturnScreen=currentScreen;
  if(currentScreen==="notebook-preview" || playingStage==="notebook")
    window.dispatchEvent(new Event("mathssprites:notebook-close"));
  if(currentScreen==="workshop-game")
    window.dispatchEvent(new Event("mathssprites:workshop-close"));
  closeFractionCampaign();
  rewardCelebration.leaveReview();
  currentScreen = name;
  cosmeticRewards.refreshAppearance();
  playingNumber = null;
  playingStage = null;
  playingWorld = null;
  $("site-shell").hidden = false;
  $("game-shell").hidden = true;
  document.body.classList.remove("preview-mode");
  delete document.body.dataset.workshopChapter;
  for (const screen of screenNames) $("site-" + screen).hidden = screen !== name;
  atelier.setActive(name==="atelier");
  if(name==="atelier")$("atelier-back").textContent="← Back to "+atelierReturnScreen;
  if (name === "home") homeAction();
  if (name === "worlds") renderWorlds();
  if (name === "stages") renderStages();
  if (name === "levels"){
    renderLevels();
    $("site-back").textContent="← Change learning method";
    announceBoardSelection();
  }
  if(name==="workshop"){
    $("workshop-back").textContent="← Back to "+(workshopReturnScreen==="levels"?"levels":"home");
  }
  if (name === "settings") renderSettings();
  if(name==="help"||name==="settings"){
    const label=({home:"home",worlds:"worlds",stages:"stages",
      levels:"levels",workshop:"workshop",atelier:"Atelier"})[supportReturnScreen]||"home";
    $(name+"-return").textContent="← Back to "+label;
  }
  const activeTopLevel=(name==="levels"||name==="stages"||name==="worlds")
    ?"worlds":name;
  document.querySelectorAll(".site-nav-links button[data-screen]").forEach(button=>{
    if(button.dataset.screen===activeTopLevel)
      button.setAttribute("aria-current","page");
    else button.removeAttribute("aria-current");
  });
  homeHero.setActive(name==="home");
  menuDemos.setScreen(name);
  const heading = $("site-" + name).querySelector("h1, h2");
  // Focus the usable input at the desk, and the heading elsewhere.
  // The initial home question receives no reload focus ring.
  window.scrollTo?.(0,0);
  if(name==="workshop")$("workshop-equation").focus({preventScroll:true});
  else if(focusHeading){
    let returnTarget=null;
    if(name==="worlds"&&["stages","levels"].includes(previousScreen))
      returnTarget=[...$("world-cards").querySelectorAll("[data-world-stages]")].find(button=>button.dataset.worldStages===selectedWorld);
    else if(name==="stages"&&previousScreen==="levels")
      returnTarget=[...$("world1-stage-cards").querySelectorAll("[data-stage-open]")].find(button=>button.dataset.stageOpen===selectedStage);
    else if(name==="levels"&&selectedLevelId)
      returnTarget=[...$("level-sections").querySelectorAll(".level-tile")].find(tile=>tile.dataset.levelId===selectedLevelId);
    if(returnTarget&&!returnTarget.disabled) returnTarget.focus({preventScroll:name==="levels"&&window.matchMedia("(min-width: 900px) and (min-height: 500px)").matches});
    else heading?.focus({preventScroll:true});
  }
}
function launch(levelIdOrNumber,stageId=selectedStage,worldId=selectedWorld) {
  if(!isCampaignPlayable(worldId,stageId,levelIdOrNumber))return false;
  const slot=findCampaignLevel(worldId,stageId,levelIdOrNumber);
  const stage=findCampaignStage(worldId,stageId);
  if(!slot?.level||!stage)return false;
  closeFractionCampaign();
  rewardCelebration.leaveReview();
  cosmeticRewards.refreshAppearance();
  homeHero.setActive(false);
  menuDemos.setScreen(null);
  selectedWorld=worldId;
  selectedStage=stageId;
  selectedLevelId=slot.id;
  playingWorld=worldId;
  playingStage=stageId;
  playingNumber=slot.number;
  const destination={worldId,stageId,levelId:slot.id};
  campaignResume=saveCampaignResume(destination);
  campaign=saveCampaignRecords(withCampaignLastPlayed(campaign,worldId,stageId,slot.id));
  // Dual-write the unchanged World 1 legacy format until every old browser
  // client has migrated. New worlds write ONLY their own v2 campaign record.
  if(worldId==="workshop"){
    recent=saveResume({stage:stageId,number:slot.number});
    if(stageId==="independent")
      stage2Progress=saveStage2Progress({...stage2Progress,lastPlayed:slot.number});
    else if(stageId==="notebook")
      stage3Progress=saveStage3Progress({...stage3Progress,lastPlayed:slot.number});
    else progress=saveProgress({...progress,lastPlayed:slot.number});
  }
  currentScreen="game";
  $("site-shell").hidden=true;
  $("game-shell").hidden=false;
  document.body.classList.remove("preview-mode");
  const world=findCampaignWorld(worldId);
  const context={worldId,stage:stageId,number:slot.number,method:stage.method,
    stageNumber:stage.number,stageLength:stage.levels.length,
    worldNumber:world.number,chapterIndex:slot.chapterIndex,
    chapterTitle:stage.chapters[slot.chapterIndex]?.title||"Experiments",
    chapterDescription:stage.chapters[slot.chapterIndex]?.description||"",
    chapterLevels:stage.levels.filter(s=>s.chapterIndex===slot.chapterIndex)
      .map(s=>({id:s.id,title:s.title,number:s.number}))};
  if(worldId==="fractions"){
    $("game-shell").hidden=true;
    fractionCampaign=createFractionCampaignView({slot,context,
      appearance:cosmeticRewards.getSnapshot().equipped,
      onLeave:screen=>showScreen(screen),
      onAdvance:()=>window.dispatchEvent(new Event("mathssprites:advance")),
      onReviewReady:()=>rewardCelebration.reveal(),
      onComplete:state=>window.dispatchEvent(new CustomEvent("mathssprites:solved",
        {detail:{worldId,stage:stageId,number:slot.number,levelId:slot.id,moves:state.history.length}}))
    });
    window.scrollTo?.(0,0);
    return true;
  }
  if(stage.method==="notebook")
    window.dispatchEvent(new CustomEvent("mathssprites:notebook-campaign",
      {detail:{...context,level:slot.level}}));
  else
    window.dispatchEvent(new CustomEvent("mathssprites:launch",
      {detail:{...context,legacyIndex:slot.legacyIndex||0,level:slot.level}}));
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
function setWorkshopQuantity(quantity){
  const fractions=quantity==="fractions",squares=quantity==="squares",signed=quantity==="signed"||quantity==="opposites";
  $("workshop-quantity-mode").value=squares?"squares":fractions?"fractions":signed?"signed":"positive";
  const notebook=$("workshop-hand-mode").querySelector('option[value="notebook"]');
  notebook.disabled=!fractions&&!squares&&!signed;notebook.hidden=notebook.disabled;
  if(notebook.disabled&&$("workshop-hand-mode").value==="notebook")$("workshop-hand-mode").value="auto";
  $("workshop-goal-field").hidden=!squares;
  const build=squares&&$("workshop-square-goal").value==="area";
  $("workshop-lesson-copy").textContent=signed?"Black sprite = x, white sprite = −x, weight = +1, balloon = −1. Opposite objects cancel.":squares?"Round sprites represent x and square sprites represent x².":fractions?"Sprites and weights can be divided into exact fractional pieces.":"x means a sprite; each number counts brass weights. The hand acts on both rooms.";
  $("workshop-equation").placeholder=squares?(build?"e.g. x + 1 = 4":"e.g. x² + 4x = 21"):fractions?"e.g. (2/3)x = 4":signed?"e.g. 2x − 3 = x + 4":"e.g. 3x + 5 = 20";
  $("workshop-west-example").textContent=squares?(build?"1 round sprite + 1 weight":"1 square sprite + 4 round sprites"):fractions?"2 sprites":signed?"2 black sprites + 3 balloons":"3 sprites + 5 weights";
  $("workshop-east-example").textContent=squares?(build?"4 weights":"21 weights"):fractions?"5 weights":signed?"1 black sprite + 4 weights":"20 weights";
  $("workshop-rule-copy").textContent=squares
    ?(build?"Enter a positive whole-object linear balance with at most six markers on each side. Square the whole expression in each chamber. The mystery weight must be a unique positive integer from 1 to 48."
      :"Use whole nonnegative terms such as x², 2x and 3. The equation must have a unique positive integer weight from 1 to 48 on x ≥ 0. Each room holds at most 48 objects; square roots must recover complete whole sides. A route of at most 16 legal moves must be verified.")
    :fractions
    ?"Use positive linear terms, e.g. (2/3)x, x/2, 1/4 or 1 1/2. Reduced denominators: 1, 2, 3, 4, 5, 6, 8, 10 and 12. Up to 48 objects and pieces per room. Copy or share by 2–5. A legal route of at most 16 moves must be found."
    :signed?"Use signed whole-number linear terms, e.g. −2x, x − 3, or x − (−3). Up to 48 objects per room, including opposite pairs. As in World 2, x must have a unique positive whole-number value. A legal route of at most 16 moves must exist. Expand grouped brackets first."
    :"Use positive whole-number solutions, up to 48 objects per room and whole-object moves. Equal groups must divide into 2–5 complete groups. Select Negative numbers for signed terms, or Fractions for exact fractional objects and solutions.";
  const examples=squares?(build?SQUARE_BUILD_EXAMPLES:SQUARE_WORKSHOP_EXAMPLES):fractions?FRACTION_WORKSHOP_EXAMPLES:signed?SIGNED_WORKSHOP_EXAMPLES:WORKSHOP_EXAMPLES.slice(0,4);
  const label=document.createElement("span");label.textContent="Try an example:";
  $("workshop-examples").replaceChildren(label,...examples.map(value=>{
    const button=document.createElement("button");button.type="button";button.className="workshop-example";
    button.dataset.workshopExample=value;button.textContent=value;return button;
  }));
  workshopStatus("Enter an equation to check it.");
}
$("workshop-quantity-mode").addEventListener("change",()=>setWorkshopQuantity($("workshop-quantity-mode").value));
$("workshop-square-goal").addEventListener("change",()=>setWorkshopQuantity("squares"));
function launchWorkshopScene(level,handMode){
  const fractions=level?.quantityMode==="fractions";
  const signed=level?.quantityMode==="signed"&&!level.lockPositive;
  if(!fractions&&!signed&&(!level?.lockPositive||level.quantityMode!=="positive"))return false;
  closeFractionCampaign();
  cosmeticRewards.refreshAppearance();
  homeHero.setActive(false);
  menuDemos.setScreen(null);
  playingNumber=null;
  playingStage=null;
  playingWorld=null;
  currentScreen="workshop-game";
  $("site-shell").hidden=true;
  $("game-shell").hidden=false;
  document.body.classList.remove("preview-mode");
  if(fractions){
    $("game-shell").hidden=true;
    const method=["auto","manual","notebook"].includes(handMode)?handMode:"auto";
    fractionCampaign=createFractionCampaignView({slot:{id:level.id,title:level.title,level},
      appearance:cosmeticRewards.getSnapshot().equipped,
      context:{freePlay:true,method,chapterLevels:[],chapterTitle:"Your own experiment"},
      onLeave:screen=>showScreen(screen==="home"?"home":"workshop"),
      onAdvance:()=>showScreen("workshop"),
      onComplete:state=>fractionCampaign?.setRating(state.history.length+" checked move"+(state.history.length===1?"":"s")+" · Free play, no stars awarded.")
    });
    window.scrollTo?.(0,0);
    return true;
  }
  window.dispatchEvent(new CustomEvent("mathssprites:workshop-launch",{
    detail:{level,handMode:(level.squareLaboratory||signed)&&handMode==="notebook"?"notebook":handMode==="manual"?"manual":"auto"}
  }));
  $("level-title").focus({preventScroll:true});
  window.scrollTo?.(0,0);
  return true;
}
$("workshop-form").addEventListener("submit",event=>{
  event.preventDefault();
  const input=$("workshop-equation").value;
  const quantity=$("workshop-quantity-mode").value;
  const result=quantity==="squares"?createSquareWorkshopEquation(input,{goal:$("workshop-square-goal").value}):
    quantity==="fractions"?createFractionWorkshopEquation(input):quantity==="signed"?createSignedWorkshopEquation(input):createWorkshopEquation(input);
  if(!result.ok){
    workshopStatus(result.message,"error");
    $("workshop-equation").focus();
    return;
  }
  workshopStatus("Equation ready.","success");
  launchWorkshopScene(result.level,$("workshop-hand-mode").value);
});
$("workshop-form").addEventListener("click",event=>{
  const example=event.target.closest("[data-workshop-example]");
  if(!example)return;
  $("workshop-equation").value=example.dataset.workshopExample;
  workshopStatus("Example ready. Choose how the hand moves.");
  $("workshop-equation").focus();
});
$("workshop-equation").addEventListener("input",()=>{
  $("workshop-equation").setAttribute("aria-invalid","false");
});
window.addEventListener("mathssprites:workshop-another",()=>showScreen("workshop"));

function announceBoardSelection(){
  const world=findCampaignWorld(selectedWorld);
  const stage=findCampaignStage(selectedWorld,selectedStage);
  if(!world||!stage)return;
  const totals=campaignStarTotals(campaign,{worldId:world.id,stageId:stage.id});
  const selected=selectedLevelId&&findCampaignLevel(world.id,stage.id,selectedLevelId);
  $("board-selection-status").textContent=world.title+", "+stage.title+
    ". "+totals.completed+" of "+totals.count+" levels complete."+(selected?" Selected level "+selected.number+": "+selected.title+".":"");
}
$("site-shell").addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target || target.disabled) return;
  if(target.id==="atelier-back")return showScreen(atelierReturnScreen);
  if(target.hasAttribute("data-support-return"))
    return showScreen(supportReturnScreen);
  if(target.id==="board-continue"){
    if(currentScreen!=="levels")return;
    const levelId=target.dataset.levelId;
    if(levelId&&levelId===selectedLevelId)return launch(levelId,selectedStage,selectedWorld);
    return;
  }
  if(target.id==="home-choose-level")return showScreen("worlds");
  if(target.dataset.worldStages){
    if(currentScreen!=="worlds")return;
    const world=findCampaignWorld(target.dataset.worldStages);
    if(!world?.available)return;
    selectedWorld=world.id;
    selectedStage=null;
    selectedLevelId=null;
    return showScreen("stages");
  }
  if (target.dataset.stageOpen) {
    if(currentScreen!=="stages")return;
    const stage=findCampaignStage(selectedWorld,target.dataset.stageOpen);
    if(!findCampaignWorld(selectedWorld)?.available||!stage?.available)return;
    selectedStage=stage.id;
    selectedLevelId=null;
    return showScreen("levels");
  }
  if (target.dataset.screen){
    if(target.id==="workshop-back")return showScreen(workshopReturnScreen);
    return showScreen(target.dataset.screen);
  }
  if (target.dataset.level){
    if(currentScreen!=="levels")return;
    const board=$("level-sections");
    if(board.dataset.boardKey)
      boardScrollPositions.set(board.dataset.boardKey,board.scrollTop);
    const slot=findCampaignLevel(selectedWorld,selectedStage,target.dataset.levelId||Number(target.dataset.level));
    if(!slot||!isCampaignPlayable(selectedWorld,selectedStage,slot.id))return;
    selectedLevelId=slot.id;
    setLevelTabStop(target);
    renderSelectedLevel();
    // On phones, the selected challenge is below the compact grid.
    if(window.matchMedia("(max-width: 899px)").matches&&event.detail>0)
      $("selected-level-details").scrollIntoView({block:"nearest",behavior:"instant"});
    return;
  }
});
// A level board's own scroll is not document scrolling: save it per stage.
$("level-sections").addEventListener("scroll",event=>{
  const board=event.currentTarget;
  if(currentScreen==="levels"&&!$("site-levels").hidden&&board.dataset.boardKey)
    boardScrollPositions.set(board.dataset.boardKey,board.scrollTop);
});
// Arrows move focus, Enter/Space explicitly selects the world or method.
for(const [pageId,selector] of [["site-worlds","[data-world-stages]"],["site-stages","[data-stage-open]"]]){
  $(pageId).addEventListener("keydown",event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key))return;
    const button=event.target;
    if(!(button instanceof HTMLButtonElement)||!button.matches(selector)||button.disabled)return;
    const items=[...$(pageId).querySelectorAll(selector+":not(:disabled)")];
    const index=items.indexOf(button);
    if(index<0)return;
    const next=spatialTileIndex(items.map(item=>item.getBoundingClientRect()),index,event.key);
    event.preventDefault();items[next]?.focus();
  });
}
// Keep the native Tab order, with spatial arrow keys as a shortcut.
$("site-levels").addEventListener("keydown",event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
  const button=event.target,key=event.key;
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(key))return;
  if(!button.matches(".level-tile"))return;
  const tiles=[...$("level-sections").querySelectorAll(".level-tile:not(:disabled)")];
  const index=tiles.indexOf(button);
  if(index<0)return;
  const next=spatialTileIndex(tiles.map(tile=>tile.getBoundingClientRect()),index,key);
  event.preventDefault();
  setLevelTabStop(tiles[next]);
  tiles[next]?.focus();
});
// Escape goes back one portal space, but never abandons a live experiment
// or intercepts the student's equation editor.
document.addEventListener("keydown",event=>{
  if(event.key!=="Escape"||event.defaultPrevented||event.altKey||
     event.ctrlKey||event.metaKey)return;
  const active=event.target;
  const editing=active instanceof HTMLElement &&
    (active.matches("textarea,select,[contenteditable]") ||
      (active instanceof HTMLInputElement &&
        !["checkbox","radio","button"].includes(active.type)));
  if(editing)return;
  const previous={
    worlds:"home",stages:"worlds",workshop:workshopReturnScreen,
    levels:"stages",atelier:atelierReturnScreen,help:supportReturnScreen,settings:supportReturnScreen
  }[currentScreen];
  if(!previous)return;
  const page=$("site-"+currentScreen);
  const opened=[...page.querySelectorAll("details[open]")];
  if(opened.length){
    event.preventDefault();
    const focused=active instanceof HTMLElement?active.closest("details[open]"):null;
    const detail=focused||opened[opened.length-1];
    detail.open=false;
    detail.querySelector("summary")?.focus({preventScroll:true});
    return;
  }
  event.preventDefault();
  showScreen(previous);
});
$("home-play").addEventListener("click", () => {
  if(!hasCampaignHistory())return showScreen("worlds");
  const destination=homeDestination();
  launch(destination.levelId,destination.stageId,destination.worldId);
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
  launch(1,"guided","workshop");
}
$("site-replay-intro").addEventListener("click", restartFirstExperimentGuide);
function restartIndependentIntroduction() {
  if(!stageCanOpen("independent"))return;
  guideEnabled=writeGuideEnabled(true);
  writeIndependentGuideSeen(false);
  window.dispatchEvent(new CustomEvent("mathssprites:guide-setting",
    {detail:{enabled:true,stage:"independent",reset:true}}));
  launch(1,"independent","workshop");
}
$("site-replay-independent").addEventListener("click",restartIndependentIntroduction);
/** Teacher-facing preview only: PR21 will add real Stage 3 levels and progress. */
function launchNotebookPreview(level=WORLD1_LEVELS[8].level){
  cosmeticRewards.refreshAppearance();
  homeHero.setActive(false);
  menuDemos.setScreen(null);
  playingStage=null;
  playingNumber=null;
  playingWorld=null;
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
  if(event.detail?.worldId==="opposites"){
    const stage=["guided","independent"].includes(event.detail.stage)
      ?event.detail.stage:"guided";
    guideEnabled=writeGuideEnabled(true);
    window.dispatchEvent(new CustomEvent("mathssprites:guide-setting",
      {detail:{enabled:true,reset:true,worldId:"opposites",stage}}));
    launch(1,stage,"opposites");
    return;
  }
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
  if(playingNumber===null||!playingWorld||
     event.detail?.number!==playingNumber||event.detail?.stage!==playingStage||
     (event.detail?.worldId&&event.detail.worldId!==playingWorld))return;
  const slot=findCampaignLevel(playingWorld,playingStage,playingNumber);
  if(!slot||event.detail?.levelId!==slot.id)return;
  const worldId=playingWorld,stageId=playingStage;
  const moves=event.detail.moves;
  campaign=saveCampaignRecords(withCampaignCompleted(
    campaign,worldId,stageId,slot.id,moves));
  // Only the existing, validated campaign completion path can update rewards.
  // Repeat completions, workshop scenes and preview routes cannot farm stars.
  const cosmeticChange=cosmeticRewards.syncCampaign(campaign);
  rewardCelebration.enqueue(cosmeticChange.newlyUnlocked);
  const record=campaignStageRecord(campaign,worldId,stageId);
  campaignResume=saveCampaignResume({worldId,stageId,levelId:record.lastPlayed});

  // Unchanged World 1 keys and all historical star ratings are mirrored for
  // old clients. New-world completions NEVER enter those World 1 keys.
  if(worldId==="workshop"){
    if(stageId==="independent")
      stage2Progress=saveStage2Progress(markStage2Complete(stage2Progress,playingNumber));
    else if(stageId==="notebook")
      stage3Progress=saveStage3Progress(markStage3Complete(stage3Progress,playingNumber));
    else progress=saveProgress(markWorld1Complete(progress,playingNumber));
    const previous=stageId==="independent"?stage2Progress:
      stageId==="notebook"?stage3Progress:progress;
    recent=saveResume({stage:stageId,number:previous.lastPlayed});
    const oldOptimal=optimalMoves(stageId,playingNumber);
    if(starsForMoves(moves,oldOptimal))
      ratings=saveRatings(recordBestMoves(ratings,stageId,playingNumber,moves));
  }

  const optimal=campaignOptimalMoves(worldId,stageId,slot.id);
  const earned=starsForMoves(moves,optimal);
  if(earned){
    const best=record.bestMoves[slot.id],bestRating=campaignStars(
      campaign,worldId,stageId,slot.id);
    const message=starGlyphs(earned)+" "+earned+" star"+(earned===1?"":"s")+
      " · "+moves+" "+(moves===1?"move":"moves")+" (optimal: "+optimal+
      ") · Best: "+starGlyphs(bestRating)+" in "+best+" "+(best===1?"move":"moves");
    if(fractionCampaign)fractionCampaign.setRating(message);
    $("level-clear-rating").textContent=message;
    $("level-clear-rating").hidden=false;
    $("replay-star-summary").textContent=message;
    $("replay-star-summary").hidden=false;
    if(playingStage==="notebook"&&!fractionCampaign)
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
  if(playingNumber===null||!playingWorld)return showScreen("levels");
  const next=nextCampaignLevel(playingWorld,playingStage,playingNumber);
  if(next)launch(next.id,playingStage,playingWorld);
  else showScreen("levels");
});

const params = new URLSearchParams(window.location.search);
const preview = params.get("preview");
const squarePreview=params.get("squarePreview");
const notebookPreview=params.get("notebook");
const workshopDraft=params.get("workshop");
if(workshopDraft!==null){
  const world=params.get("workshopWorld");
  $("workshop-square-goal").value=params.get("workshopGoal")==="area"?"area":"isolate";
  setWorkshopQuantity(["fractions","squares","signed","opposites"].includes(world)?world:"positive");
  const draftMode=params.get("workshopMode");
  if(["auto","manual","notebook"].includes(draftMode)&&!(draftMode==="notebook"&&$("workshop-quantity-mode").value==="positive"))$("workshop-hand-mode").value=draftMode;
  $("workshop-equation").value=workshopDraft.slice(0,80);
  showScreen("workshop");
} else if(squarePreview!==null){
  // Direct review links only: never register or unlock a World 4 stage,
  // save a resume destination, or award campaign credit.
  const {SQUARE_LEVEL_PLAN,squareLevelForPlay}=await import("./square-level-plan.mjs");
  const fixture=SQUARE_LEVEL_PLAN.find(l=>l.id===squarePreview&&["guided","independent"].includes(l.stage));
  if(fixture){
    homeHero.setActive(false);
  menuDemos.setScreen(null);
    document.body.classList.add("preview-mode");
    $("site-shell").hidden=true;
    $("game-shell").hidden=false;
    window.dispatchEvent(new CustomEvent("mathssprites:square-preview",{detail:{
      level:squareLevelForPlay(fixture),handMode:fixture.stage==="independent"?"manual":"auto"}}));
  }else showScreen("home",{focusHeading:false});
} else if(notebookPreview!==null){
  // Deliberately ONLY existing positive integer sample puzzles until PR21.
  // Direct QA URLs never count towards any campaign's saved progress.
  const sample=WORLD1_LEVELS.find(slot=>slot.id===notebookPreview) || WORLD1_LEVELS[8];
  launchNotebookPreview(sample.level);
} else if (preview !== null) {
  // Direct preview route keeps the 13 prototype experiments testable while
  // the public student route shows only the available World 1 campaign.
  homeHero.setActive(false);
  menuDemos.setScreen(null);
  document.body.classList.add("preview-mode");
  $("site-shell").hidden = true;
  $("game-shell").hidden = false;
  const index = Math.max(0, LEVELS.findIndex(level => level.id === preview));
  window.dispatchEvent(new CustomEvent("mathssprites:preview", { detail:{ index } }));
} else {
  showScreen("home",{focusHeading:false});
}

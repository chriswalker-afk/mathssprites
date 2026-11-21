import { LEVELS } from "./engine.mjs";
import {
  CAMPAIGN_REGISTRY,findCampaignWorld,findCampaignStage,findCampaignLevel,
  nextCampaignLevel,isCampaignPlayable,firstCampaignLevel
} from "./campaign-registry.mjs";
import {
  loadCampaignRecords,saveCampaignRecords,loadCampaignResume,saveCampaignResume,
  withCampaignLastPlayed,withCampaignCompleted,campaignStageRecord,
  campaignStars,campaignStarTotals,campaignOptimalMoves,stageResumeLevel
} from "./campaign-records.mjs";
import {createWorkshopEquation} from "./equation-workshop.mjs";
import {createHomeHero} from "./home-hero.mjs";
import {compactWorldProgress,compactStageProgress,briefStageIntro} from "./menu-copy.mjs";
import {boardContinueLevel,spatialTileIndex} from "./navigation-journey.mjs";
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
let campaign = loadCampaignRecords();
let campaignResume = loadCampaignResume();
let teacher = loadTeacherSetting();
let guideEnabled = readGuideEnabled();
let currentScreen = "home";
let playingNumber = null;
let playingStage = null;
let playingWorld = null;
let selectedWorld = campaignResume?.worldId||"workshop";
let selectedStage = campaignResume?.stageId||"guided";
let boardReturnScreen = "home";
let workshopReturnScreen = "home";
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
const screenNames = ["home","worlds","stages","levels","workshop","help","settings"];

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
  const selected=findCampaignWorld(selectedWorld);
  const fresh=selected?.available&&selected.id!=="workshop"
    ?firstCampaignLevel(selected.id,selected.stages[0]?.id):null;
  const target=campaignResume||
    (fresh?{worldId:selected.id,stageId:fresh.stageId,levelId:fresh.id}:
      {worldId:"workshop",stageId:fallback.stage,levelId:old?.id});
  const slot=findCampaignLevel(target.worldId,target.stageId,target.levelId)||
    firstCampaignLevel("workshop","guided");
  return {worldId:slot.worldId,stageId:slot.stageId,levelId:slot.id,
    stage:slot.stageId,number:slot.number};
}
function renderHomeQuickStages(){
  const world=findCampaignWorld(selectedWorld)?.available
    ?findCampaignWorld(selectedWorld):findCampaignWorld("workshop");
  const stages=world.stages.filter(stage=>stage.available&&world.available);
  $("home-stage-shortcuts").innerHTML=stages.map(stage=>{
    const slot=stageResumeLevel(campaign,world.id,stage.id);
    const meta=campaignStarTotals(campaign,{worldId:world.id,stageId:stage.id});
    return '<article class="portal-feature home-quick-feature">'+
      '<button type="button" class="home-stage-quick" data-home-stage="'+
        clean(stage.id)+'" data-home-world="'+clean(world.id)+'"'+
        (!slot?' disabled':'')+
        ' aria-label="Play '+clean(stage.title)+' from level '+(slot?.number||1)+'">'+
        '<span class="feature-icon" aria-hidden="true">'+
          portalStageArt(stage.id,stage.icon||"⚖")+'</span>'+
        '<span class="home-stage-details"><strong>'+clean(stage.title)+'</strong>'+
        '<small>Level '+(slot?.number||1)+' · '+meta.completed+'/'+meta.count+' complete</small>'+
        '</span><span class="quick-arrow" aria-hidden="true">›</span></button></article>';
  }).join("");
  $("home-stage-shortcuts").dataset.activeWorld=world.id;
  $("home-stage-shortcuts").hidden=stages.length===0;
}
function homeAction() {
  const destination=homeDestination();
  const world=findCampaignWorld(destination.worldId);
  const stage=findCampaignStage(destination.worldId,destination.stageId);
  const current=destination.worldId==="workshop"
    ?destination.stage==="independent"?stage2Progress:
      destination.stage==="notebook"?stage3Progress:progress
    :null;
  const record=campaignStageRecord(campaign,destination.worldId,destination.stageId);
  const played=!!recent || !!campaignResume ||
    campaignStarTotals(campaign).completed>0 ||
    progress.lastPlayed>1||stage2Progress.lastPlayed>1||stage3Progress.lastPlayed>1;
  $("home-play").textContent=destination.worldId==="workshop"
    ?resumeLabel(destination,{played,completed:current.completed})
    :(record?.completed.includes(destination.levelId)?"Replay ":
      campaignResume?.worldId===destination.worldId?"Continue ":"Start ")+
      stage.title+" · Level "+destination.number+" →";
  // The heading names one world; its completion and stars must use that world.
  const totals=campaignStarTotals(campaign,{worldId:destination.worldId});
  $("home-progress").textContent=
    (world?.title||"Balance Workshop")+" · "+
    totals.completed+"/"+totals.count+" levels · "+totals.earned+"/"+totals.available+
    " ★ · saved here";
  renderHomeQuickStages();
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
        '<span class="hall-door-mist"></span></div>' +
      '<div class="world-card-body"><div class="eyebrow">WORLD ' +
        String(world.number).padStart(2,"0") + '</div>' +
      '<h3>' + clean(world.title) + '</h3><p class="world-subtitle">' +
        clean(world.subtitle) + '</p>' +
      '<div class="world-card-footer"><span class="world-progress">' + progressLine + '</span>' +
        (world.available
          ? '<button type="button" class="primary-btn" data-world-stages="'+clean(world.id)+'">'+
            (world.id==="workshop"?"Explore stages →":"Explore Opposites →")+'</button>'
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
    world.title.toUpperCase();
  $("world1-stage-cards").setAttribute("aria-label",world.title+" learning stages");
  $("world1-stage-cards").innerHTML=world.stages.map(stage=>{
    const record=campaignStageRecord(campaign,world.id,stage.id);
    const score=campaignStarTotals(campaign,{worldId:world.id,stageId:stage.id});
    const playable=stage.available,finished=score.count>0&&score.completed===score.count;
    const countText=compactStageProgress(score.completed,stage.count,score.earned,score.available);
    return '<article class="stage-card '+(playable?"stage-ready":"stage-planned")+
      '" data-stage="'+clean(stage.id)+'" aria-label="Stage '+stage.number+
      ': '+clean(stage.title)+(playable?", available":", unavailable")+'">'+
      '<div class="stage-top"><span class="stage-no">STAGE '+String(stage.number).padStart(2,"0")+
      '</span><span class="stage-tag">'+(finished?"Stage mastered":playable?"Ready to play":"Coming soon")+
      '</span></div><div class="stage-ornament" aria-hidden="true">'+
        portalStageArt(stage.id,stage.icon)+'</div>'+
      '<h2>'+clean(stage.title)+'</h2>'+
      '<p class="stage-tagline">'+clean(stage.tagline||"Explore this learning approach.")+'</p>'+
      '<div class="stage-card-bottom"><span class="stage-count">'+countText+'</span>'+
      (playable
        ? '<button type="button" class="primary-btn" data-stage-open="'+clean(stage.id)+'">Choose Stage '+
          stage.number+' levels →</button>'
        : '<span class="stage-coming">◇ In development</span>')+
      '</div></article>';
  }).join("");
  $("world1-workshop").hidden=world.id!=="workshop";
  if(world.id==="workshop"){
    $("world1-workshop").innerHTML=
      '<div class="workshop-glyph" aria-hidden="true">'+EQUATION_WORKSHOP.icon+'</div>'+
      '<div class="workshop-content"><div class="portal-kicker">FREE PLAY · AVAILABLE TO EVERYONE</div>'+
      '<h2>'+clean(EQUATION_WORKSHOP.title)+'</h2>'+
      '<p>Create your own balance without changing campaign progress.</p>'+
      '<button type="button" class="primary-btn" data-screen="workshop">Create your own equation →</button></div>';
  }
  $("stage-teacher-note").hidden=!teacher||world.id!=="workshop";
  $("stage-teacher-note").textContent=
    "All 48 implemented World 1 levels are open to students; teacher tools add previews.";
}
/** One Experiment Board, regardless of world or the number of stages.
 * World and stage switches update the SAME map rather than opening menus. */
function renderExperimentBoardControls(){
  $("map-world-tabs").innerHTML=CAMPAIGN_REGISTRY.map(world=>{
    const active=world.id===selectedWorld;
    return '<button type="button" class="map-world-button'+(active?' is-active':'')+
      '" data-map-world="'+clean(world.id)+'" aria-pressed="'+active+'"'+
      (world.available?'':' disabled title="In development"')+
      ' aria-label="'+clean(world.title)+(world.available?'':', in development')+'">'+
      '<span aria-hidden="true">'+clean(world.icon||"✦")+'</span>'+
      '<span class="map-world-label">'+clean(world.id==="workshop"?"Balance":
        world.id==="opposites"?"Opposites":world.id==="fractions"?"Fractions":
        world.id==="squares"?"Squares":world.title)+'</span></button>';
  }).join("");
  const world=findCampaignWorld(selectedWorld);
  $("map-stage-tabs").innerHTML=world.stages.map(stage=>{
    const active=stage.id===selectedStage;
    const count=campaignStageRecord(campaign,world.id,stage.id)?.completed.length||0;
    const short=stage.id==="guided"?"Guided":stage.id==="independent"?"Independent":
      stage.id==="notebook"?"Apprentice":stage.title;
    return '<button type="button" class="map-stage-button'+(active?' is-active':'')+
      '" data-map-stage="'+clean(stage.id)+'" aria-pressed="'+active+'"'+
      (stage.available?'':' disabled')+' aria-label="'+clean(stage.title)+
      ' · '+count+' of '+stage.levels.length+' complete">'+
      '<span class="map-stage-icon" aria-hidden="true">'+clean(stage.icon||"✦")+
      '</span><span>'+clean(short)+'</span></button>';
  }).join("");
  $("map-world-tabs").setAttribute("aria-label","Choose a mathematical world");
  $("map-stage-tabs").setAttribute("aria-label","Choose how to learn");
}
function renderLevels() {
  let world=findCampaignWorld(selectedWorld);
  if(!world?.available)world=CAMPAIGN_REGISTRY.find(w=>w.available);
  if(!world)return;
  selectedWorld=world.id;
  let stage=findCampaignStage(world.id,selectedStage);
  if(!stage?.available)stage=world.stages.find(s=>s.available);
  if(!stage)return;
  selectedStage=stage.id;
  renderExperimentBoardControls();
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
  const continueButton=$("board-continue");
  continueButton.hidden=!suggested;
  if(suggested){
    continueButton.dataset.levelId=suggested.id;
    continueButton.textContent=suggested.action+" Level "+suggested.number+" →";
    continueButton.setAttribute("aria-label",suggested.action+" "+stage.title+
      ", Level "+suggested.number);
  }else delete continueButton.dataset.levelId;
  $("world1-finale").hidden=completed!==total||total===0;
  $("world1-finale").setAttribute("aria-label",stage.title+" completed");
  $("stage-finale-kicker").textContent="STAGE "+stage.number+" COMPLETE";
  $("stage-finale-title").textContent=stage.title+" mastered!";
  $("stage-finale-message").textContent=stage.finale||"You completed all experiments in this stage.";
  const sections=$("level-sections");
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
        ' aria-label="'+clean(world.title)+', '+clean(stage.title)+
        ', Level '+slot.number+': '+clean(slot.title)+'. '+tag+'. '+ratingLabel+'">'+
        '<span class="tile-number">'+String(slot.number).padStart(2,"0")+'</span>'+
        '<span class="tile-name">'+clean(slot.title)+'</span>'+
        '<span class="tile-stars" data-stars="'+rating+'" aria-hidden="true">'+starGlyphs(rating)+'</span>'+
        '<span class="tile-status">'+(done?"✓ ":historical?"↻ ":open?"✦ ":"◇ ")+
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
  $("teacher-note").hidden=!teacher;
  $("teacher-note").textContent="All "+total+" puzzles in "+stage.title+
    " are available. Teacher previews are separate from student progress.";
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
  // PR53: legacy world/stage routes now lead to the single Experiment Board.
  if(name==="worlds"||name==="stages")name="levels";
  if (!screenNames.includes(name)) return;
  if(name==="workshop" && currentScreen!=="workshop" && currentScreen!=="workshop-game"){
    workshopReturnScreen=currentScreen==="levels"?"levels":"home";
  }
  if((name==="help"||name==="settings") &&
      !["help","settings"].includes(currentScreen) &&
      screenNames.includes(currentScreen))
    supportReturnScreen=currentScreen;
  if(currentScreen==="notebook-preview" || playingStage==="notebook")
    window.dispatchEvent(new Event("mathssprites:notebook-close"));
  if(currentScreen==="workshop-game")
    window.dispatchEvent(new Event("mathssprites:workshop-close"));
  currentScreen = name;
  playingNumber = null;
  playingStage = null;
  playingWorld = null;
  $("site-shell").hidden = false;
  $("game-shell").hidden = true;
  document.body.classList.remove("preview-mode");
  delete document.body.dataset.workshopChapter;
  for (const screen of screenNames) $("site-" + screen).hidden = screen !== name;
  if (name === "home") homeAction();
  if (name === "worlds") renderWorlds();
  if (name === "stages") renderStages();
  if (name === "levels"){
    renderLevels();
    $("site-back").textContent="← Back to "+
      ({stages:"stages",worlds:"worlds",home:"home"}[boardReturnScreen]||"home");
  }
  if(name==="workshop"){
    $("workshop-back").textContent="← Back to "+(workshopReturnScreen==="levels"?"levels":"home");
  }
  if (name === "settings") renderSettings();
  if(name==="help"||name==="settings"){
    const label=({home:"home",worlds:"worlds",stages:"stages",
      levels:"levels",workshop:"workshop"})[supportReturnScreen]||"home";
    $(name+"-return").textContent="← Back to "+label;
  }
  const activeTopLevel=(name==="levels"||name==="stages")
    ?"levels":name;
  document.querySelectorAll(".site-nav-links button[data-screen]").forEach(button=>{
    if(button.dataset.screen===activeTopLevel)
      button.setAttribute("aria-current","page");
    else button.removeAttribute("aria-current");
  });
  homeHero.setActive(name==="home");
  const heading = $("site-" + name).querySelector("h1, h2");
  // Focus the usable input at the desk, and the heading elsewhere.
  // The initial home question receives no reload focus ring.
  if(name==="workshop")$("workshop-equation").focus({preventScroll:true});
  else if(heading&&focusHeading)heading.focus({preventScroll:true});
  window.scrollTo?.(0,0);
}
function launch(levelIdOrNumber,stageId=selectedStage,worldId=selectedWorld) {
  if(!isCampaignPlayable(worldId,stageId,levelIdOrNumber))return false;
  const slot=findCampaignLevel(worldId,stageId,levelIdOrNumber);
  const stage=findCampaignStage(worldId,stageId);
  if(!slot?.level||!stage)return false;
  homeHero.setActive(false);
  selectedWorld=worldId;
  selectedStage=stageId;
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
    chapterLevels:stage.levels.filter(s=>s.chapterIndex===slot.chapterIndex)
      .map(s=>({id:s.id,title:s.title,number:s.number}))};
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
function launchWorkshopScene(level,handMode){
  if(!level?.lockPositive||level.quantityMode!=="positive")return false;
  homeHero.setActive(false);
  playingNumber=null;
  playingStage=null;
  playingWorld=null;
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
  $("board-selection-status").textContent=world.title+", "+stage.title+
    ". "+totals.completed+" of "+totals.count+" levels complete.";
}
function focusBoardSelection(groupId){
  $(groupId).querySelector('button[aria-pressed="true"]')?.focus({preventScroll:true});
  announceBoardSelection();
}
$("site-shell").addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target || target.disabled) return;
  if(target.hasAttribute("data-support-return"))
    return showScreen(supportReturnScreen);
  if(target.id==="board-continue"){
    const levelId=target.dataset.levelId;
    if(levelId)return launch(levelId,selectedStage,selectedWorld);
    return;
  }
  if(target.id==="home-choose-level"){
    boardReturnScreen="home";
    return showScreen("levels");
  }
  if(target.dataset.worldStages){
    const world=findCampaignWorld(target.dataset.worldStages);
    if(!world?.available)return;
    selectedWorld=world.id;
    return showScreen("stages");
  }
  if(target.dataset.homeStage){
    const worldId=target.dataset.homeWorld;
    const slot=stageResumeLevel(campaign,worldId,target.dataset.homeStage);
    if(slot)launch(slot.id,target.dataset.homeStage,worldId);
    return;
  }
  if(target.dataset.mapWorld){
    const world=findCampaignWorld(target.dataset.mapWorld);
    if(!world?.available)return;
    selectedWorld=world.id;
    if(!findCampaignStage(world.id,selectedStage)?.available)
      selectedStage=world.stages.find(stage=>stage.available)?.id||"guided";
    if(currentScreen==="levels"){
      renderLevels();
      focusBoardSelection("map-world-tabs");
      return;
    }
    boardReturnScreen=currentScreen==="worlds"?"worlds":"home";
    return showScreen("levels");
  }
  if(target.dataset.mapStage){
    if(!findCampaignStage(selectedWorld,target.dataset.mapStage)?.available)return;
    if(selectedStage===target.dataset.mapStage)return;
    selectedStage=target.dataset.mapStage;
    renderLevels();
    focusBoardSelection("map-stage-tabs");
    return;
  }
  if (target.dataset.stageOpen) {
    const stage=findCampaignStage(selectedWorld,target.dataset.stageOpen);
    if(!findCampaignWorld(selectedWorld)?.available||!stage?.available)return;
    selectedStage=stage.id;
    boardReturnScreen="stages";
    return showScreen("levels");
  }
  if (target.dataset.screen){
    if(target.dataset.screen==="levels")boardReturnScreen="home";
    if(target.id==="workshop-back")return showScreen(workshopReturnScreen);
    return showScreen(target.dataset.screen);
  }
  if (target.dataset.level){
    const board=$("level-sections");
    if(board.dataset.boardKey)
      boardScrollPositions.set(board.dataset.boardKey,board.scrollTop);
    return launch(target.dataset.levelId||
      Number(target.dataset.level),selectedStage,selectedWorld);
  }
});
// A level board's own scroll is not document scrolling: save it per stage.
$("level-sections").addEventListener("scroll",event=>{
  const board=event.currentTarget;
  if(currentScreen==="levels"&&!$("site-levels").hidden&&board.dataset.boardKey)
    boardScrollPositions.set(board.dataset.boardKey,board.scrollTop);
});
// Keep the native Tab order, with spatial arrow keys as a shortcut.
$("site-levels").addEventListener("keydown",event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
  const button=event.target,key=event.key;
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(key))return;
  const group=button.closest("#map-world-tabs,#map-stage-tabs");
  if(group){
    const enabled=[...group.querySelectorAll("button:not(:disabled)")];
    const index=enabled.indexOf(button);
    if(index<0)return;
    const next=key==="Home"?0:key==="End"?enabled.length-1:
      Math.max(0,Math.min(enabled.length-1,index+
        (key==="ArrowRight"||key==="ArrowDown"?1:-1)));
    event.preventDefault();
    if(next!==index)enabled[next].click();
    return;
  }
  if(!button.matches(".level-tile"))return;
  const tiles=[...$("level-sections").querySelectorAll(".level-tile:not(:disabled)")];
  const index=tiles.indexOf(button);
  if(index<0)return;
  const next=spatialTileIndex(tiles.map(tile=>tile.getBoundingClientRect()),index,key);
  event.preventDefault();
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
    worlds:"home",stages:"levels",workshop:workshopReturnScreen,
    levels:boardReturnScreen,help:supportReturnScreen,settings:supportReturnScreen
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
  homeHero.setActive(false);
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
$("site-back").addEventListener("click", () => showScreen("home"));
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
  if(playingNumber===null||!playingWorld)return showScreen("levels");
  const next=nextCampaignLevel(playingWorld,playingStage,playingNumber);
  if(next)launch(next.id,playingStage,playingWorld);
  else showScreen("levels");
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

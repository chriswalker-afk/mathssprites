import {
  LEVELS, TOKEN_KINDS, initialState, visibleRooms, evaluate, levelQuantityMode, normalize, room,
  perform, previewRoomAction, undo, isSolved, equation, operationDescription, algebraOperation, areaArrangement
} from "./engine.mjs";
import { buildWritingTimeline, symbolsOf, WRITING_PACE } from "./replay-timeline.mjs";
import { handMotionPlan } from "./hand-timeline.mjs";
import { divisionBasketMarkup, playDivisionBaskets } from "./division-baskets.mjs";
import {
  multiplicationBasketMarkup,multiplicationHandProp,playMultiplicationBaskets
} from "./multiplication-baskets.mjs";
import { spriteMotionProfile, spriteMotionStyle } from "./sprite-motion.mjs";
import { pickSpriteHandReaction, dodgeOffsetPx } from "./sprite-reactions.mjs";
import { floorScaleToFit, inRoomBoxPlan, areaMathLabel } from "./area-layout.mjs";
import { itemWord, attemptMessage, mismatchedMoveMessage } from "./attempt-feedback.mjs";
import { fractionCutPlan } from "./fraction-theatre.mjs";
import {neutralPairSequence, neutralPairSummary} from "./neutral-pairs.mjs";
import { WORLD1_LEVELS } from "./worlds.mjs";
import {INDEPENDENT_LEVELS} from "./independent-levels.mjs";
import {
  startNotebook,undoNotebookLine,notebookReplayScript
} from "./notebook-engine.mjs";
import {
  parseNotebookOperation,previewNotebookOperation,tryNotebookOperation,
  notebookEquationMathML,notebookOperationMathML
} from "./notebook-maths-editor.mjs";
import {
  CHAPTER_BRIEFINGS, INDEPENDENT_BRIEFINGS,
  introductionCue,independentIntroductionCue,readGuideEnabled,readGuideSeen,
  writeGuideEnabled,writeGuideSeen,readIndependentGuideSeen,writeIndependentGuideSeen
} from "./onboarding.mjs";

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const MOTION_SETTING = "mathssprites.motion-preference.v1";
function savedMotionPreference() {
  try {
    const value = window.localStorage.getItem(MOTION_SETTING);
    if (value === "on") return false;
    if (value === "reduced") return true;
  } catch {
    // Storage can be blocked in private or locked-down school browsers.
  }
  return null;
}
function chooseMotion(reduced) {
  reducedMotion = reduced;
  try {
    window.localStorage.setItem(MOTION_SETTING, reduced ? "reduced" : "on");
  } catch {}
  render();
  window.dispatchEvent(new CustomEvent("mathssprites:motion-change",
    {detail:{reduced}}));
}

let levelIndex = 0;
let mode = "auto";
let operation = "remove";
let kind = "posOne";
let amount = 2;
let factor = 3;
let state = initialState(LEVELS[0]);
let activeLevel = LEVELS[0];
let campaignLevelNumber = null;
let campaignStage = null; // null = separate advanced prototype preview
let notebookSession=null; // only teacher prototype in PR20; never campaign progress
let notebookPhase="idle"; // idle | writing | replaying | complete
let notebookReplaySuccessful=false;
let workshopActive=false; // free play only, never an indexed campaign level
let guideEnabled = readGuideEnabled();
let guideSeen = readGuideSeen();
let independentGuideSeen=readIndependentGuideSeen();
let guideStep = 0;
let guideDismissed = false;
let guideWasActive = false;
function currentLevel() { return activeLevel; }
let busy = false;
let override = null;
let groups = { left: 0, right: 0 };
let failureTilt = 0; // transient presentation only; no effect on the math engine
// Start with the creatures moving, regardless of the device motion preference.
// The explicit in-game Motion toggle can still reduce animations, and that
// choice persists on subsequent visits. Do not overwrite a saved choice.
let reducedMotion = savedMotionPreference() ?? false;
let speechTimer = null;
let replayFrame = null;
let replayPaused = true;
let replayIndex = 0;
let replayEntries = [];
let replayTimeline = null;
let replayElapsed = 0;
let replayLastFrame = null;
let replayNextEvent = 0;
let replaySpeed = 1;
let replayPanelFinished = false;

function currentAction() {
  if (operation === "square" || operation === "sqrt") return { op: operation };
  if (operation === "multiply" || operation === "divide") return { op: operation, factor };
  return { op: operation, kind, count: amount };
}
function possessiveCount(number, singular, plural) {
  return number + " " + (number === 1 ? singular : plural);
}
function roomSummary(r) {
  const parts = [
    r.posX && possessiveCount(r.posX, "dark sprite", "dark sprites"),
    r.negX && possessiveCount(r.negX, "pale sprite", "pale sprites"),
    r.posX2 && possessiveCount(r.posX2, "square sprite", "square sprites"),
    r.posOne && possessiveCount(r.posOne, "weight", "weights"),
    r.negOne && possessiveCount(r.negOne, "balloon", "balloons")
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "no objects";
}
function token(kind, i, mini = false, side = "left") {
  if (mini) {
    return '<span class="mini-token ' + kind + '" aria-hidden="true"></span>';
  }
  if (kind === "posX" || kind === "negX" || kind === "posX2") {
    const profile = spriteMotionProfile(currentLevel().id, side, kind, i);
    const square = kind === "posX2";
    const appearance = square ? "sprite-square" : kind === "posX" ? "sprite-black" : "sprite-white";
    return '<span class="token sprite ' + appearance +
      '" style="' + spriteMotionStyle(profile) + '" title="' +
      (square ? "A square x² sprite" : kind === "posX" ? "A little dark sprite" : "A little pale sprite") + '">' +
      '<span class="sprite-ground-shadow"></span>' +
      '<span class="sprite-reaction-shell"><span class="sprite-motion">' +
      '<span class="sprite-feet"></span><span class="sprite-body">' +
      '<span class="sprite-eyes"><i></i><i></i></span>' +
      (square ? '<span class="square-symbol">✦</span>' : "") + '</span>' +
      '</span></span></span>';
  }
  if (kind === "posOne")
    return '<span class="token weight" title="A brass weight"><i class="weight-handle"></i><i class="weight-shine"></i></span>';
  return '<span class="token balloon" title="A little floating balloon"><i class="balloon-body"></i><i class="balloon-knot"></i><i class="balloon-string"></i></span>';
}
function allTokens(r, mini = false, side = "left") {
  let html = "";
  for (const kind of TOKEN_KINDS) {
    for (let i = 0; i < r[kind]; i++) html += token(kind, i, mini, side);
  }
  return html;
}
function renderRoom(side, r, groupCount) {
  const node = $(side + "-items");
  // Only rebuild a room when its actual contents change. Otherwise the idle
  // sprites are repeatedly destroyed and their bouncing animations restart.
  const signature = currentLevel().id + "|" + side + "|" +
    TOKEN_KINDS.map(key => r[key]).join(":") + "|groups:" + groupCount;
  // Positive groups are division baskets; negative groups are multiplication.
  // The mathematical room values never change merely because a stage exists.
  const multiplying=groupCount<0;
  const basketCount=Math.abs(groupCount);
  if (node.dataset.signature === signature) { resizeFloor(side); return; }
  node.dataset.signature = signature;
  node.setAttribute("aria-label", (side === "left" ? "West chamber: " : "East chamber: ") + roomSummary(r));
  const total = TOKEN_KINDS.reduce((a, field) => a + r[field], 0);
  node.classList.toggle("crowded", total > 16);
  if (basketCount) {
    // Both inverse operations use the SAME solid wicker stage. Multiplication
    // keeps originals on the floor until the first basket lands and receives
    // them, then the hand physically delivers the extra complete groups.
    node.innerHTML = '<div class="division-stage'+
      (multiplying?' multiplication-stage':'')+'" data-operation="'+
      (multiplying?'multiply':'divide')+'" data-phase="waiting" '+
      'style="--division-factor:'+basketCount+'">' +
      '<div class="division-source floor-shell"><div class="items-grid floor-track" data-layout="floor">' +
      allTokens(r,false,side)+'</div></div>'+
      '<div class="basket-row" aria-label="'+basketCount+' equal groups">'+
      (multiplying?multiplicationBasketMarkup(basketCount):divisionBasketMarkup(basketCount))+
      '</div></div>';
    resizeFloor(side);
    return;
  }
  if (!total) {
    node.innerHTML = '<div class="room-empty" aria-hidden="true">a quiet moment...</div>';
    return;
  }
  node.innerHTML = '<div class="floor-shell"><div class="items-grid floor-track" data-layout="floor">' +
    allTokens(r, false, side) + '</div></div>' +
    (total > 14 ? '<span class="floor-count" aria-hidden="true">' + total + ' objects in a row</span>' : "");
  resizeFloor(side);
}
// Scale the entire horizontal row, never wrap it into multiple rows.
function resizeFloor(side) {
  const room = $(side + "-items");
  const track = room.querySelector(".floor-track");
  if (!track) return;
  const width = track.scrollWidth || track.getBoundingClientRect().width;
  const fit = floorScaleToFit(room.clientWidth, width);
  track.style.setProperty("--floor-scale", fit.toFixed(4));
}
window.addEventListener("resize", () => {
  for (const side of ["left", "right"]) resizeFloor(side);
});
function visible() { return override || visibleRooms(state); }
function currentDifference(shown) {
  return evaluate(shown.left, state.solution) - evaluate(shown.right, state.solution);
}
function setSpeech(message, ms = 4000) {
  clearTimeout(speechTimer);
  const box = $("speech");
  box.hidden = false;
  box.classList.remove("trial-speech");
  box.textContent = "“" + message + "”";
  speechTimer = setTimeout(() => { box.hidden = true; }, ms);
}
function showTrialSpeech(message, ms) {
  setSpeech(message, ms);
  $("speech").classList.add("trial-speech");
  // Manual action buttons can scroll the page low enough to clip a bubble at
  // the top of the laboratory. Bring the scene back into view for the lesson.
  $("scene").scrollIntoView({block:"center", behavior:"auto"});
}
function notify(message) {
  $("feedback").textContent = message;
  setSpeech(message);
}
function clearSpeech() {
  clearTimeout(speechTimer);
  $("speech").hidden = true;
}
function activeFirstGuide() {
  return campaignStage==="guided" && campaignLevelNumber===1 &&
    guideEnabled && !guideSeen && !guideDismissed;
}
function activeIndependentGuide() {
  return campaignStage==="independent" && campaignLevelNumber===1 &&
    guideEnabled && !independentGuideSeen && !guideDismissed;
}
function activeCampaignGuide() {
  return activeFirstGuide() || activeIndependentGuide();
}
function currentGuideCue() {
  return activeIndependentGuide()
    ? independentIntroductionCue(guideStep,{pending:state.pending?.first||null,busy})
    : introductionCue(guideStep,{mode,pending:state.pending?.first||null,busy});
}
function guideTarget(name) {
  if (name === "scene") return $("scene");
  if (name === "remove") return document.querySelector('[data-operation="remove"]');
  if (name === "amount") return $("amount-control");
  if (name === "do-both") return $("do-both");
  if (name === "left-action") return $("left-action");
  if (name === "right-action") return $("right-action");
  return null;
}
function renderFirstGuide() {
  for (const item of document.querySelectorAll(".coach-focus"))
    item.classList.remove("coach-focus");
  $("game-guide-restart").hidden = campaignLevelNumber !== 1 || campaignStage===null;
  $("game-guide-restart").disabled = busy;
  $("game-guide-restart").setAttribute("aria-label",
    campaignStage==="independent"?"Replay Independent Balance introduction":
    "Replay Guided Balance introduction");
  const visible = activeCampaignGuide() && !isSolved(state);
  $("apprentice-guide").hidden = !visible;
  if (!visible) return;
  $("apprentice-guide").setAttribute("aria-label",
    campaignStage==="independent"?"Independent hand-control introduction":
    "Guided Mirror introduction");
  const cue = currentGuideCue();
  $("guide-progress").textContent = cue.progress;
  $("guide-title").textContent = cue.title;
  $("guide-message").textContent = cue.text;
  $("guide-next").hidden = !cue.action;
  if (cue.action) $("guide-next").textContent = cue.action + " →";
  const target = guideTarget(cue.target);
  if (target && !target.hidden) target.classList.add("coach-focus");
}
/** Notebook is always on paper FIRST. The existing scene appears only after
 * validated working is complete and the student explicitly requests replay. */
function renderNotebookVisibility() {
  const active=!!notebookSession;
  const campaign=active&&campaignStage==="notebook"&&campaignLevelNumber!==null;
  document.body.classList.toggle("notebook-mode",active);
  $("notebook-workspace").hidden=!active||notebookPhase!=="writing";
  $("notebook-playback").hidden=!active||
    (notebookPhase!=="replaying"&&notebookPhase!=="complete");
  $("scene").hidden=active&&notebookPhase==="writing";
  document.querySelector(".experiment-controls").hidden=active;
  $("level-clear-subtitle").textContent=active
    ? "The sprites followed your checked steps, exactly as written."
    : "Let's discover the algebra behind those moves.";
  if(!active)return;
  $("chapter").textContent=campaign
    ?"STAGE 3 · "+currentLevel().chapter:"STAGE 3 · ALGEBRA APPRENTICE PROTOTYPE";
  $("chapter-status").hidden=false;
  $("chapter-status").textContent=campaign
    ?"WORLD 1 · STAGE 3 · LEVEL "+String(campaignLevelNumber).padStart(2,"0")+" / 12"
    :"PAPER FIRST · SPRITE REPLAY SECOND · NO PROGRESS";
  $("notebook-stage-kicker").textContent=campaign
    ?"WORLD 1 · STAGE 3 · LEVEL "+String(campaignLevelNumber).padStart(2,"0")+" / 12"
    :"STAGE 3 · ALGEBRA APPRENTICE · TEACHER PROTOTYPE";
  $("notebook-stage-note").textContent=campaign
    ?"Campaign experiment · Progress saved after a successful sprite replay"
    :"Practice preview · No levels or progress earned";
  $("notebook-level-prompt").textContent=campaign
    ? currentLevel().prompt
    : "You already have the equation. Choose an operation for both sides. The maths editor calculates the new equation automatically; the sprites will replay your route.";
  const support=campaign?currentLevel().scaffold:null;
  const showSupport=!!support&&support.kind!=="none"&&notebookPhase==="writing";
  $("notebook-scaffold").hidden=!showSupport;
  if(showSupport){
    $("notebook-scaffold-heading").textContent=support.heading;
    $("notebook-scaffold-text").textContent=support.text;
  }
  $("apprentice-guide").hidden=true;
  $("game-guide-restart").hidden=true;
  $("campaign-hand-mode").hidden=true;
  $("mode-wrapper").hidden=true;
  $("notebook-back-paper").hidden=notebookPhase!=="complete";
  $("notebook-watch-again").hidden=notebookPhase!=="complete";
  $("notebook-next").hidden=!campaign||notebookPhase!=="complete"||
    !notebookReplaySuccessful;
  $("notebook-next").textContent=campaignLevelNumber===12
    ?"Back to stages →":"Next notebook level →";
}
/** Shared game renderer, but with zero campaign-credit navigation. */
function renderWorkshopVisibility(){
  document.body.classList.toggle("workshop-mode",workshopActive);
  $("game-levels").textContent=workshopActive?"← Equation Workshop":"▦ Levels";
  if(!workshopActive)return;
  $("chapter").textContent="FREE PLAY · EQUATION WORKSHOP";
  $("chapter-status").hidden=false;
  $("chapter-status").textContent="CUSTOM EQUATION · NO CAMPAIGN PROGRESS";
  $("game-guide-restart").hidden=true;
  $("campaign-hand-mode").hidden=true;
  $("mode-wrapper").hidden=false;
}
function notebookMessage(message,status="info"){
  $("notebook-feedback").textContent=message;
  $("notebook-feedback").dataset.status=status;
  $("notebook-operation").setAttribute("aria-invalid",String(status==="error"));
}
/** Live typeset maths: students select WHAT to do, not the resulting answer.
 * The preview uses the exact unchanged two-room engine, without committing. */
function renderNotebookMathEditor(){
  if(!notebookSession)return;
  const input=$("notebook-operation");
  const text=input.value;
  const parsed=parseNotebookOperation(text);
  const preview=previewNotebookOperation(notebookSession,text);
  const current=$("notebook-current-math");
  current.innerHTML=notebookEquationMathML(notebookSession.state);
  current.setAttribute("aria-label",equation(notebookSession.state));
  const operation=$("notebook-operation-typeset");
  if(parsed.ok){
    operation.innerHTML=notebookOperationMathML(parsed.action);
  }else{
    operation.textContent=text.trim().slice(0,24)||"□";
  }
  const result=$("notebook-result-math");
  const arrow=$("notebook-apply-label");
  if(preview.ok){
    result.innerHTML=notebookEquationMathML(preview.state);
    result.setAttribute("aria-label",preview.line);
    result.dataset.state="valid";
    arrow.textContent=preview.explanation;
  }else{
    result.textContent=preview.code==="incomplete"
      ?"Enter the operation and amount":preview.message;
    result.removeAttribute("aria-label");
    result.dataset.state=preview.code==="incomplete"?"incomplete":"error";
    arrow.textContent="Operation on both sides";
  }
  $("notebook-apply").disabled=!preview.ok||notebookPhase!=="writing"||busy;
  const sign=parsed.ok ? parsed.display[0]:text.trim().slice(0,1);
  for(const button of document.querySelectorAll("[data-notebook-symbol]"))
    button.setAttribute("aria-pressed",String(button.dataset.notebookSymbol===sign));
}
function renderNotebookPaper() {
  if(!notebookSession)return;
  const lines=$("notebook-lines");
  lines.replaceChildren();
  const addLine=(text,explanation,original=false,mathState=null)=>{
    const item=document.createElement("li");
    if(original)item.className="notebook-original";
    const value=document.createElement("span");
    value.className="notebook-line-equation";
    value.setAttribute("aria-label",text);
    // MathML comes only from validated engine counts, never user HTML.
    value.innerHTML=notebookEquationMathML(mathState);
    const accessible=document.createElement("span");
    accessible.className="sr-only";
    accessible.textContent=text;
    value.appendChild(accessible);
    item.appendChild(value);
    if(explanation){
      const note=document.createElement("small");
      note.textContent=explanation;
      item.appendChild(note);
    }
    lines.appendChild(item);
  };
  const initial=initialState(notebookSession.level);
  addLine(equation({left:initial.left,right:initial.right}),
    "Starting equation · the mystery you must solve",true,initial);
  for(let i=0;i<notebookSession.steps.length;i++){
    const step=notebookSession.steps[i];
    addLine(step.line,step.explanation,false,notebookSession.state.history[i].after);
  }
  const finished=isSolved(notebookSession.state);
  $("notebook-form").hidden=finished;
  $("notebook-replay").disabled=!finished||notebookPhase==="replaying";
  $("notebook-undo").disabled=!notebookSession.steps.length||notebookPhase==="replaying";
  $("notebook-reset").disabled=notebookPhase==="replaying";
  renderNotebookMathEditor();
}
function render() {
  const lvl = currentLevel();
  if (campaignLevelNumber !== null)
    document.body.dataset.workshopChapter = String(Math.ceil(campaignLevelNumber / 4));
  else delete document.body.dataset.workshopChapter;
  if(campaignStage)document.body.dataset.workshopStage=campaignStage;
  else delete document.body.dataset.workshopStage;
  const shown = visible();
  renderRoom("left", shown.left, groups.left);
  renderRoom("right", shown.right, groups.right);
  $("chapter").textContent = lvl.chapter;
  $("level-title").textContent = lvl.title;
  $("level-prompt").textContent = lvl.prompt;
  $("chapter-status").hidden = campaignLevelNumber === null;
  const briefings=campaignStage==="independent"?INDEPENDENT_BRIEFINGS:CHAPTER_BRIEFINGS;
  $("chapter-briefing").hidden =
    campaignLevelNumber===null || !briefings[campaignLevelNumber];
  if (campaignLevelNumber !== null) {
    const stageNumber=campaignStage==="independent"?2:1;
    $("chapter-status").textContent = "WORLD 1 · STAGE " + stageNumber +
      " · LEVEL " + String(campaignLevelNumber).padStart(2,"0") +
      " / " + (stageNumber===2?16:20);
    if(briefings[campaignLevelNumber])
      $("chapter-briefing").textContent=briefings[campaignLevelNumber];
  }
  const chapterStart = campaignLevelNumber===null?0:Math.floor((campaignLevelNumber-1)/4)*4;
  const dotLevels = campaignLevelNumber===null?LEVELS:
    (campaignStage==="independent"?INDEPENDENT_LEVELS:WORLD1_LEVELS).slice(chapterStart,chapterStart+4);
  const dotIndex = campaignLevelNumber === null ? levelIndex : campaignLevelNumber - 1 - chapterStart;
  $("step-dots").innerHTML = dotLevels.map((item, i) =>
    '<span class="progress-dot ' + (i <= dotIndex ? "lit" : "") +
    (i === dotIndex ? " current" : "") + '" title="' + item.title + '"></span>').join("");

  const balance = currentDifference(shown);
  const degrees = failureTilt || (balance === 0 ? 0 : (balance < 0 ? 3.5 : -3.5));
  $("rooms-row").style.transform = "rotate(" + degrees + "deg)";
  $("scale-beam").style.transform = "rotate(" + degrees + "deg)";
  $("dial-needle").style.transform = "translateX(-50%) rotate(" + (degrees * -7) + "deg)";
  const awaiting = !!state.pending;
  // Keep balance feedback accessible but remove decorative narration from
  // the actual scene. The artwork should speak for itself when level.
  $("balance-caption").textContent = (awaiting || override)
    ? "The balance is waiting for its matching move"
    : balance !== 0 ? "The scale is unbalanced." : "";
  for (const button of document.querySelectorAll("[data-operation]")) {
    const available = !lvl.allowedOperations || lvl.allowedOperations.includes(button.dataset.operation);
    button.hidden = !available;
    button.classList.toggle("selected", button.dataset.operation === operation);
    button.disabled = !available || busy || isSolved(state);
    button.setAttribute("aria-pressed", String(button.dataset.operation === operation));
  }
  for (const button of document.querySelectorAll("[data-kind]")) {
    button.classList.toggle("selected", button.dataset.kind === kind);
    const signedObject=button.dataset.kind==="negX"||button.dataset.kind==="negOne";
    const unavailable = (signedObject && state.quantityMode!=="signed") ||
      (lvl.lockPositive && button.dataset.kind === "posX2");
    button.hidden=unavailable;
    button.disabled = busy || isSolved(state) || unavailable;
    button.setAttribute("aria-pressed", String(button.dataset.kind === kind));
  }
  const grouped = operation === "divide" || operation === "multiply";
  const geometric = operation === "square" || operation === "sqrt";
  $("object-picker").hidden = grouped || geometric;
  $("amount-control").hidden = geometric;
  $("amount-label").textContent = grouped ? "3 · How many groups?" : "3 · How many?";
  $("amount-value").textContent = grouped ? factor : amount;
  $("amount-down").disabled = busy || isSolved(state) || (grouped ? factor <= 2 : amount <= 1);
  $("amount-up").disabled = busy || isSolved(state) || (grouped ? factor >= 5 : amount >= 12);
  const inCampaign=campaignLevelNumber!==null;
  $("mode-wrapper").hidden=inCampaign;
  $("campaign-hand-mode").hidden=!inCampaign;
  $("campaign-hand-label").textContent=campaignStage==="independent"
    ?"STAGE 2 · HAND CONTROL":"STAGE 1 · HAND CONTROL";
  $("campaign-hand-title").textContent=campaignStage==="independent"
    ?"Your Turn":"Guided Mirror";
  $("campaign-hand-help").textContent=campaignStage==="independent"
    ?"You make both hand visits.":"The hand acts on both rooms.";
  $("mode-select").value=inCampaign
    ? (campaignStage==="independent"?"manual":"auto") : mode;
  $("mode-select").disabled=inCampaign||busy||awaiting;
  $("quantity-mode").value=state.quantityMode;
  $("quantity-mode").disabled=busy||awaiting||!!lvl.lockPositive;
  $("quantity-mode").querySelector('option[value="positive"]').disabled=
    levelQuantityMode(lvl)==="signed";
  document.body.classList.toggle("quantity-mode-positive",state.quantityMode==="positive");
  $("journal-legend").textContent=state.quantityMode==="signed"
    ? "● black = +x   ·   ◯ white = −x   ·   ◆ weight = +1   ·   ♧ balloon = −1"
    : "● black sprite = +x   ·   ◆ weight = +1";
  $("level-select").value = String(levelIndex);
  $("level-select").disabled = busy || awaiting || campaignLevelNumber !== null;
  $("game-home").disabled = busy;
  $("game-brand-home").disabled = busy;
  $("game-levels").disabled = busy;
  $("motion-toggle").textContent = reducedMotion ? "Motion: reduced" : "Motion: on";
  $("motion-toggle").setAttribute("aria-pressed", String(reducedMotion));
  document.body.classList.toggle("reduce-motion", reducedMotion);
  $("motion-notice").hidden = !reducedMotion;

  $("do-both").hidden = mode !== "auto";
  $("do-both").disabled = busy || awaiting || isSolved(state);
  $("manual-explanation").hidden = mode !== "manual";
  $("manual-explanation").textContent=campaignStage==="independent"
    ? (awaiting
      ? "The scale is tilted. Finish the matching move in the other chamber to restore the balance; different moves will be shown and undone."
      : "Choose an action, visit ONE room, then repeat the same action in the OTHER room. Watch the scale tip and settle.")
    : awaiting
      ? "The first room has changed. You can choose a different tool or amount for the other room — if it changes the balance, the hand will show why and undo the experiment."
      : "Choose a room, then make an equivalent move in the other room. You can also experiment with a different move and see what happens.";
  for (const side of ["left", "right"]) {
    const button = $(side + "-action");
    button.hidden = mode !== "manual";
    button.disabled = busy || isSolved(state) || (awaiting && state.pending.first === side);
    const selected = currentAction();
    const expected = awaiting ? state.pending.action : null;
    const same = awaiting && selected.op === expected.op &&
      ((selected.op === "add" || selected.op === "remove")
        ? selected.kind === expected.kind && selected.count === expected.count
        : (selected.op === "multiply" || selected.op === "divide")
          ? selected.factor === expected.factor : true);
    button.textContent = awaiting
      ? (state.pending.first === side ? "First move made" :
        same ? "Match the move here" : "Try different move here")
      : "Use hand here";
    $(side + "-chamber").classList.toggle("needs-match", awaiting && state.pending.first !== side);
    $(side + "-chamber").classList.toggle("already-moved", awaiting && state.pending.first === side);
  }
  $("undo").disabled = busy || (!awaiting && !state.history.length);
  $("reset").disabled = busy;
  $("hint").disabled = busy;
  if (isSolved(state)) {
    $("feedback").innerHTML = '<span class="success-mark">✦</span> Mystery solved. ' +
      '<button id="watch-again" class="inline-link" type="button">Watch the comic again</button>';
  }
  renderFirstGuide();
  renderNotebookVisibility();
  renderWorkshopVisibility();
}
/**
 * A two-stage hand movement, not an instant model update followed by an effect.
 * The hand descends, interacts, and *while still touching the room* applies the
 * corresponding visual transformation. Only then does it leave the screen.
 */
function handProp(action, side) {
  if (action.op === "square") {
    const area = areaArrangement(visible()[side], "square");
    if (area?.symbolic)
      return '<span class="held-square-press" title="A brass press that shapes a round sprite into a square"></span>';
    const extras = (area?.cells || 0) - (area?.side || 0);
    return extras > 0
      ? '<span class="held-weight"></span><span class="held-count">×' + extras + '</span>'
      : "";
  }
  if (action.op === "sqrt") return "";
  if (action.op === "divide") {
    return action.fractionAttempt
      ? '<span class="held-fraction-cutter" title="The hand tries to divide an object into pieces"><i></i></span>'
      : '<span class="held-basket" title="A complete basket of objects"></span>';
  }
  if (action.op === "multiply") {
    // Only used in rejected-attempt theatre. Valid multiplication hands carry
    // the actual matching wicker basket DOM props in the scale scene.
    return multiplicationHandProp();
  }
  const picture = action.kind === "posX" || action.kind === "negX" || action.kind === "posX2"
    ? '<span class="held-sprite' + (action.kind === "negX" ? " held-sprite-pale" :
      action.kind === "posX2" ? " held-sprite-square" : "") +
      '"><i></i><i></i></span>'
    : action.kind==="negOne" ? '<span class="held-balloon"></span>' :
      '<span class="held-weight"></span>';
  return picture + (action.count > 1 ? '<span class="held-count">×' + action.count + '</span>' : "");
}
function roomOperationText(action, side) {
  const roomName=side==="left"?"west":"east";
  if (action.op==="square"||action.op==="sqrt") {
    const area=areaArrangement(visible()[side],action.op);
    if (!area||area.kind==="zero") return "The hand checks the empty box...";
    const layout=inRoomBoxPlan(area);
    const {spriteSide:a,weightSide:b,counts}=layout;
    if (action.op==="square") {
      if (a&&b) return "The hand builds a square IN the "+roomName+" room: "+
        counts.posX2+" square sprites, "+counts.posX+
        " round sprites across two mixed regions, and "+counts.posOne+" weights.";
      return a
        ? "The hand builds a complete square in the "+roomName+
          " room and presses round sprites into square ones."
        : "The hand fills a "+area.side+" by "+area.side+
          " box with weights in the "+roomName+" room.";
    }
    return "The hand arranges the complete square in the "+roomName+
      " room, lifts away the interior, and keeps one side: "+
      (a?a+" sprites"+(b?" and ":""):"")+(b?b+" weights":"")+".";
  }
  if(action.op==="divide") return action.fractionAttempt
    ? "The hand tries to share the "+roomName+" room into "+action.factor+" equal groups..."
    : "The hand sorts the "+roomName+" room into "+action.factor+" equal baskets...";
  if(action.op==="multiply") return "The hand makes "+action.factor+
    " complete copies in the "+roomName+" room...";
  const nouns=action.kind==="posX2"?
    (action.count===1?"square sprite":"square sprites"):
    action.kind==="posX"?
      (action.count===1?"black sprite":"black sprites"):
    action.kind==="negX"?
      (action.count===1?"white sprite":"white sprites"):
    action.kind==="negOne"?
      (action.count===1?"balloon":"balloons"):
      (action.count===1?"weight":"weights");
  return "The hand "+(action.op==="remove"?"lifts away ":"places ")+
    action.count+" "+nouns+" in the "+roomName+" room...";
}
function areaBoxActor(kind) {
  if(kind==="posOne")return '<span class="box-actor box-actor-weight"></span>';
  return '<span class="box-actor '+(kind==="posX2"?"box-actor-x2":"box-actor-x")+
    '"></span>';
}
const BOX_NOTES={
  square:{
    frame:"The hand sets a box onto the floor.",
    edge:"Place the original row along one side.",
    column:"Build a matching side at right angles.",
    quadratic:"Round sprites meet: square sprites appear.",
    mixed:"Fill both crossing regions with round sprites.",
    units:"Fill the last corner with weights."
  },
  sqrt:{
    frame:"Arrange all the objects in the square box.",
    units:"Lift the weights out of the bottom corner.",
    mixed:"Remove both matching mixed regions.",
    quadratic:"Squish the square sprites back to a side.",
    column:"Remove the duplicate vertical side.",
    edge:"Keep only the remaining side."
  }
};
/**
 * No detached overlay: a real frame is erected at floor level inside the
 * SAME room as the sprites. Ghost markers show the two physical dimensions;
 * they are guides, not counted as extra algebraic objects. Only the 4 interior
 * regions are the new algebraic objects. This scene never changes state:
 * the hand contact later commits the engine's already-validated result.
 */
function showAreaPreview(side, action) {
  const node=$(side+"-area-box");
  const area=areaArrangement(visible()[side],action.op);
  if(!area||area.kind==="zero")return;
  const plan=inRoomBoxPlan(area);
  const tracks=plan.tracks.map(x=>x+"fr").join(" ");
  const ruler=items=>items.map(({type,index})=>
    '<span class="box-edge-token edge-'+type+'" data-segment="'+index+
      '" aria-hidden="true"></span>').join("");
  const tiles=plan.cells.map(cell=>{
    const kind=cell.type==="square-sprite"?"posX2":
      cell.type==="round-sprite"?"posX":"posOne";
    return '<span class="box-cell region-'+cell.region+' stage-'+cell.stage+
      '" data-kind="'+kind+'" data-row="'+cell.row+'" data-col="'+cell.col+
      '" data-cell-index="'+cell.index+'" aria-hidden="true">'+
      areaBoxActor(kind)+'</span>';
  }).join("");
  node.innerHTML='<div class="box-workshop">'+
    '<div class="box-edge box-edge-top" style="grid-template-columns:'+tracks+
      '">'+ruler(plan.horizontal)+'</div>'+
    '<div class="box-edge box-edge-left" style="grid-template-rows:'+tracks+
      '">'+ruler(plan.vertical)+'</div>'+
    '<div class="box-grid" style="grid-template-columns:'+tracks+
      ';grid-template-rows:'+tracks+'">'+tiles+'</div>'+
    '<span class="box-footnote"></span></div>';
  node.dataset.operation=action.op;
  node.dataset.step="frame";
  node.dataset.layout="in-room";
  node.dataset.spriteSide=plan.spriteSide;
  node.dataset.weightSide=plan.weightSide;
  node.dataset.cells=plan.cells.length;
  node.setAttribute("aria-label",areaMathLabel(area)+
    "; built inside the "+(side==="left"?"west":"east")+" room");
  node.hidden=false;
  $(side+"-chamber").classList.add("area-active");
  if(action.op==="sqrt"){
    node.querySelector(".box-edge-top").classList.add("built");
    node.querySelector(".box-edge-left").classList.add("built");
    for(const cell of node.querySelectorAll(".box-cell"))cell.classList.add("placed");
  }
  node.querySelector(".box-footnote").textContent=BOX_NOTES[action.op].frame;
}
function advanceAreaPreview(side, action, step) {
  if(step==="frame"){showAreaPreview(side,action);return;}
  const node=$(side+"-area-box");
  if(node.hidden)return;
  node.dataset.step=step;
  const root=action.op==="sqrt";
  const selector=step==="quadratic"||step==="mixed"||step==="units"
    ? ".box-cell.stage-"+step : null;
  if(selector)for(const cell of node.querySelectorAll(selector)){
    cell.classList.add(root?"removed":"placed");
  }
  if(step==="edge")node.querySelector(".box-edge-top").classList.add(root?"kept":"built");
  if(step==="column")node.querySelector(".box-edge-left").classList.add(root?"retired":"built");
  node.querySelector(".box-footnote").textContent=BOX_NOTES[action.op][step]||"";
}
function finishAreaPreview(side,action) {
  const node=$(side+"-area-box");
  if(node.hidden)return;
  node.dataset.step="result";
  $(side+"-chamber").classList.add(action.op==="square"?
    "area-after-square":"area-after-sqrt");
}
function clearAreaPreview(side) {
  const node=$(side+"-area-box");
  node.hidden=true;node.innerHTML="";
  delete node.dataset.step;delete node.dataset.layout;
  const chamber=$(side+"-chamber");
  chamber.classList.remove("area-active","area-after-square","area-after-sqrt");
}

function clearNeutralEffect(side) {
  const effect=$(side+"-neutral-effect");
  effect.hidden=true;
  effect.innerHTML="";
  delete effect.dataset.pairType;
}
/**
 * Animate zero-valued subevents after adding the tokens (or before dividing).
 * The paint callback changes only the temporary display, never the algebra.
 * Children see each original pair before its collision or balloon lift.
 */
async function animateNeutralEvents(side,events,paint) {
  if(!events?.length)return;
  const effect=$(side+"-neutral-effect");
  const hand=$("hand"),activeHand=hand.classList.contains("acting");
  if(activeHand)hand.classList.add("observing-neutral");
  try {
  for(const event of events) {
    paint(event.before);
    await sleep(reducedMotion?200:450);
    const node=$(side+"-items");
    const posSelector=event.type==="sprites"?".sprite-black":".weight";
    const negSelector=event.type==="sprites"?".sprite-white":".balloon";
    const positive=[...node.querySelectorAll(posSelector)].at(-1);
    const negative=[...node.querySelectorAll(negSelector)].at(-1);
    if(!positive||!negative)
      throw new Error("Neutral-pair objects were missing from the scene: "+event.id);
    const p=positive.getBoundingClientRect(),n=negative.getBoundingClientRect();
    const pX=p.left+p.width/2,nX=n.left+n.width/2;
    const midX=(pX+nX)/2;
    const midY=(p.top+p.height/2+n.top+n.height/2)/2;
    const roomBox=effect.parentElement.getBoundingClientRect();
    positive.style.setProperty("--pair-dx",Math.round(midX-pX)+"px");
    negative.style.setProperty("--pair-dx",Math.round(midX-nX)+"px");
    positive.classList.add("zero-pair-actor",event.type==="sprites"
      ?"zero-sprite-positive":"zero-weight-positive");
    negative.classList.add("zero-pair-actor",event.type==="sprites"
      ?"zero-sprite-negative":"zero-balloon-negative");
    effect.dataset.pairType=event.type;
    effect.hidden=false;
    effect.style.left=Math.max(40,Math.min(roomBox.width-40,midX-roomBox.left))+"px";
    effect.style.top=Math.max(55,Math.min(roomBox.height-55,midY-roomBox.top-12))+"px";
    effect.innerHTML=event.type==="sprites"
      ? '<span class="puff-core"></span>'+Array.from({length:5},()=>
          '<span class="soot"></span>').join("")+
        '<span class="neutral-caption">Opposite sprites vanish!</span>'
      : '<span class="balloon-trail"></span>'+
        '<span class="neutral-caption">Balloon lifts its weight!</span>';
    const line=event.type==="sprites"
      ? "The black and white sprites hop together — their values cancel to zero!"
      : "Watch the balloon lift its matching weight! They make zero.";
    $("action-caption").textContent=line;
    $("action-caption").hidden=false;
    showTrialSpeech(line,reducedMotion?1800:3000);
    await sleep(reducedMotion?720:1280);
    paint(event.after);
    clearNeutralEffect(side);
    await sleep(reducedMotion?80:180);
  }
  } finally {
    if(activeHand)hand.classList.remove("observing-neutral");
    clearNeutralEffect(side);
  }
  $("feedback").textContent="Opposites made zero. The two rooms still obey the same equation.";
}
async function neutraliseBeforeDivision(action,previews) {
  if(action.op!=="divide")return;
  const showing=visible();
  override={left:room(showing.left),right:room(showing.right)};
  for(const side of ["left","right"]) {
    const events=previews[side].cancellationEvents||[];
    if(events.length)await animateNeutralEvents(side,events,r=>{
      override={...override,[side]:room(r)};render();
    });
  }
  override={
    left:room(previews.left.beforeGroups||showing.left),
    right:room(previews.right.beforeGroups||showing.right)
  };
  render();
}

function animateClassFrame() {
  return new Promise(resolve => {
    // Requesting a frame ensures the hand starts ABOVE the room before
    // transitioning down, even immediately after the first scene render.
    requestAnimationFrame(() => resolve());
  });
}
async function handAct(side, action, applyAtContact) {
  // PR25: division has its own series of real basket pickups and ONE algebraic
  // contact. Failed fractional cuts still use the original precision cutter.
  if (action.op === "divide" && !action.fractionAttempt)
    return playDivisionBaskets({side,factor:action.factor,reduced:reducedMotion,
      applyAtContact,sleep});
  if(action.op==="multiply"&&$(side+"-items").querySelector(".multiplication-stage"))
    return playMultiplicationBaskets({side,factor:action.factor,reduced:reducedMotion,
      applyAtContact,sleep,resizeFloor:()=>resizeFloor(side)});
  const hand = $("hand");
  const cargo = $("hand-cargo");
  const target = $(side + "-chamber");
  const scene = $("scene").getBoundingClientRect();
  const items = $(side + "-items").getBoundingClientRect();
  const areaEffect = action.op === "square" || action.op === "sqrt"
    ? areaArrangement(visible()[side], action.op) : null;
  const motion = handMotionPlan(action, reducedMotion, areaEffect);
  // The in-room square is a real piece of scenery. Use a more precise,
  // smaller hand while arranging it so students can SEE the four regions.
  // Setting this before geometry measurements keeps the fingertip on target.
  if (areaEffect?.side > 0) hand.dataset.boxOperation = action.op;

  // Find the actual geometry of this room at any viewport width. The updated
  // art's fingertips reach ~95% of its box (not 78% as in the original outline).
  // Keep the area diagram beside the hand, not hidden beneath its palm.
  // The hand still reaches the floor and traces the nearby square in view.
  const fractionTarget=action.fractionAttempt
    ? [...$(side+"-items").querySelectorAll(
        ".floor-track > "+fractionTokenSelector(action.fractionAttempt.kind))].at(-1)
    : null;
  const fractionBox=fractionTarget?.getBoundingClientRect();
  const centreX = (fractionBox
    ? fractionBox.left+fractionBox.width/2
    : items.left + items.width *
      (action.op === "square" || action.op === "sqrt" ? .68 : .5)) - scene.left;
  hand.style.left = centreX + "px";
  if (action.fractionAttempt) hand.dataset.fractionAttempt="true";
  const restingTip = hand.offsetTop + hand.offsetHeight * 0.95;
  const targetTip = items.bottom - scene.top - Math.min(32, items.height * 0.20);
  const reach = Math.max(160, targetTip - restingTip);
  hand.style.setProperty("--hand-reach", reach + "px");

  // Pick one sprite which is actually being removed. The room renderer removes
  // the last matching token first, so the actor that reacts is precisely the
  // one that disappears when the hand makes contact. We roll only for real,
  // whole-sprite pickups, never for weights, division, addition or fractions.
  const tokens = !reducedMotion && action.op === "remove" &&
    (action.kind === "posX" || action.kind === "negX")
    ? [...$(side + "-items").querySelectorAll(
        action.kind === "posX" ? ".sprite-black" : ".sprite-white"
      )] : [];
  const actor = tokens.length >= action.count ? tokens.at(-1) : null;
  const reaction = actor ? pickSpriteHandReaction(action, Math.random()) : null;
  if (reaction === "dodge") {
    const actorBox = actor.getBoundingClientRect();
    const roomBox = $(side + "-items").getBoundingClientRect();
    const shift = dodgeOffsetPx(actorBox.left + actorBox.width / 2, roomBox.left + roomBox.width / 2);
    actor.style.setProperty("--dodge-shift", shift + "px");
    hand.style.setProperty("--hand-chase", Math.round(shift * .6) + "px");
  }

  const caption = $("action-caption");
  caption.textContent = roomOperationText(action, side);
  caption.hidden = false;
  cargo.innerHTML = handProp(action, side);
  cargo.classList.remove("sprite-captured");
  cargo.hidden = !motion.cargoOnApproach && !action.fractionAttempt;
  hand.classList.remove("approaching", "reaching", "grasping", "lifting");
  hand.classList.add("acting");
  hand.dataset.phase = motion.placing ? "carry" : "open";
  let applied = false;

  try {
    await animateClassFrame();
    for (const beat of motion.phases) {
      switch (beat.name) {
        case "approach":
          target.classList.add("hand-target");
          hand.classList.add("approaching");
          break;
        case "reach":
          hand.classList.remove("approaching");
          hand.classList.add("reaching");
          hand.dataset.phase = motion.placing ? "carry" : "reach";
          if (reaction) {
            actor.dataset.reaction = reaction;
            actor.dataset.reactPhase = "start";
            actor.classList.add("sprite-reacting");
          }
          break;
        case "aim":
          // A short settle before making contact. The target light guides the
          // eye without suggesting the unbalanced half-move is a finished step.
          hand.dataset.phase = motion.placing ? "carry" : "aim";
          if (reaction === "dodge") hand.classList.add("tracking-sprite");
          break;
        case "frame":
        case "edge":
        case "column":
        case "quadratic":
        case "mixed":
        case "units":
          advanceAreaPreview(side, action, beat.name);
          hand.classList.add("arranging");
          hand.dataset.boxStep = beat.name;
          hand.dataset.phase = action.op === "square" ? "aim" : "reach";
          break;
        case "grip":
          hand.classList.remove("tracking-sprite", "arranging");
          delete hand.dataset.boxStep;
          hand.classList.add("grasping");
          hand.dataset.phase = "grip";
          if (reaction) actor.dataset.reactPhase = "caught";
          break;
        case "contact":
          // The only place physical objects change. The hand is still *down*,
          // covering the objects, and the other room has not been touched yet.
          const contactPromise=applyAtContact();
          if(contactPromise&&typeof contactPromise.then==="function")
            await contactPromise;
          applied = true;
          if (action.op === "square" || action.op === "sqrt") finishAreaPreview(side, action);
          target.classList.add("hand-contact");
          cargo.hidden = !!action.fractionAttempt || motion.placing || action.op === "sqrt";
          if (reaction) cargo.classList.add("sprite-captured");
          hand.dataset.phase = action.op === "square" ? (areaEffect?.symbolic ? "pound" : "release") :
            action.op === "sqrt" ? (areaEffect?.symbolic ? "squish" : "carry") :
              motion.placing ? "release" : "carry";
          break;
        case "lift":
          hand.classList.add("lifting");
          hand.dataset.phase = motion.placing ? "release" : "lift";
          target.classList.remove("hand-contact");
          break;
        case "exit":
          hand.classList.remove("grasping", "reaching");
          hand.classList.remove("approaching", "lifting");
          hand.dataset.phase = "exit";
          target.classList.remove("hand-target");
          break;
      }
      await sleep(beat.delay);
    }
  } finally {
    // No animation state should leak into the next room or next level.
    hand.classList.remove("approaching", "lifting", "grasping", "reaching", "acting", "tracking-sprite", "arranging", "fraction-observing");
    hand.dataset.phase = "rest";
    target.classList.remove("hand-target", "hand-contact");
    if (actor) {
      actor.classList.remove("sprite-reacting");
      delete actor.dataset.reaction;
      delete actor.dataset.reactPhase;
      actor.style.removeProperty("--dodge-shift");
    }
    hand.style.removeProperty("--hand-chase");
    delete hand.dataset.boxStep;
    delete hand.dataset.boxOperation;
    delete hand.dataset.fractionAttempt;
    clearAreaPreview(side);
    clearNeutralEffect(side);
    cargo.classList.remove("sprite-captured");
    cargo.hidden = true;
    caption.hidden = true;
  }
  // The client must never treat an aborted first-room animation as solved.
  if (!applied) throw new Error("The hand did not complete its contact move.");
}
// The hand cuts the ACTUAL leftover floor objects. The intact ones stay
// put; there is no separate basket diagram or pile of invented tokens.
function fractionTokenSelector(kind){
  return {posX:".sprite-black",negX:".sprite-white",
    posX2:".sprite-square",posOne:".weight",negOne:".balloon"}[kind]||"";
}
async function showFractionCut(side,issue){
  const plan=fractionCutPlan(issue);
  const stage=$(side+"-attempt-stage");
  const roomItems=$(side+"-items");
  const selector=".floor-track > "+fractionTokenSelector(plan.kind);
  const targets=[...roomItems.querySelectorAll(selector)].slice(-plan.remainder);
  if(targets.length!==plan.remainder)
    throw new Error("The hand cannot cut a missing physical object");
  stage.hidden=false;
  stage.innerHTML="";
  stage.classList.remove("rewinding");
  stage.classList.add("fraction-floor-stage");
  stage.dataset.issue="fraction";
  stage.dataset.cutPhase="intact";
  stage.dataset.cutFactor=String(plan.factor);
  stage.dataset.cutSources=String(plan.sources.length);
  stage.setAttribute("aria-label",plan.remainder+" "+itemWord(plan.kind,plan.remainder)+
    " will each be cut into "+plan.factor+
    " equal, visibly separated pieces before the hand restores them");
  $(side+"-chamber").classList.add("attempt-fraction");
  const frame=stage.getBoundingClientRect();

  targets.forEach((original,index)=>{
    const bounds=original.getBoundingClientRect();
    // The floor is compressed when crowded. The selected object can be
    // picked up and enlarged slightly, but still appears in the same room
    // immediately over its original floor position.
    const width=Math.max(bounds.width,Math.min(48,stage.clientWidth*.12));
    const height=width*Math.max(.5,bounds.height/Math.max(1,bounds.width));
    const nativeWidth=Math.max(1,original.offsetWidth);
    const nativeHeight=Math.max(1,original.offsetHeight);
    const x=Math.min(stage.clientWidth-width-3,
      Math.max(3,bounds.left-frame.left+(bounds.width-width)/2));
    const y=Math.min(stage.clientHeight-height-15,
      Math.max(25,bounds.top-frame.top+(bounds.height-height)/2));
    const actor=document.createElement("div");
    actor.className="fraction-cut-source";
    actor.dataset.kind=plan.kind;
    actor.dataset.sourceIndex=String(index);
    actor.style.left=x+"px";
    actor.style.top=y+"px";
    actor.style.width=width+"px";
    actor.style.height=height+"px";
    const mat=document.createElement("span");
    mat.className="fraction-cut-mat";
    actor.appendChild(mat);
    for(const slice of plan.sources[index].pieces){
      const j=slice.sliceIndex;
      const piece=document.createElement("span");
      piece.className="fraction-cut-piece";
      piece.dataset.part=String(j);
      piece.dataset.basket=String(slice.basket);
      piece.style.left=(100*slice.start)+"%";
      piece.style.width=(100/plan.factor)+"%";
      piece.style.setProperty("--split-x",
        Math.round((j-(plan.factor-1)/2)*Math.min(19,10+width*.17))+"px");
      piece.style.setProperty("--split-y",(j%2 ? 8 : -7)+"px");
      piece.style.setProperty("--split-rotation",
        Math.round((j-(plan.factor-1)/2)*9)+"deg");
      const jitter=document.createElement("span");
      jitter.className="fraction-fragment-wiggle";
      const art=original.cloneNode(true);
      art.removeAttribute("title");
      art.setAttribute("aria-hidden","true");
      art.classList.add("fraction-cut-art");
      art.style.width=nativeWidth+"px";
      art.style.height=nativeHeight+"px";
      art.style.left=-(j/plan.factor)*nativeWidth+"px";
      art.style.top="0";
      art.style.transformOrigin="top left";
      art.style.transform="scale("+(width/nativeWidth)+","+(height/nativeHeight)+")";
      jitter.appendChild(art);
      piece.appendChild(jitter);
      actor.appendChild(piece);
    }
    // One cut mark per boundary, not one invented whole object per basket.
    for(let j=1;j<plan.factor;j++){
      const seam=document.createElement("span");
      seam.className="fraction-cut-seam";
      seam.style.left=(j/plan.factor*100)+"%";
      seam.style.setProperty("--seam-delay",((j-1)*170)+"ms");
      actor.appendChild(seam);
    }
    const blade=document.createElement("span");
    blade.className="fraction-cut-swoosh";
    actor.appendChild(blade);
    stage.appendChild(actor);
    original.classList.add("fraction-original-hidden");
  });
  await animateClassFrame();
  stage.dataset.cutPhase="cutting";
  $("hand").dataset.phase="chop";
  await sleep(reducedMotion?210:820);
  stage.dataset.cutPhase="chopped";
  // The cutting tool has finished: LIFT it off the fragments so students
  // can actually see the two half-sprites, even on a small phone screen.
  $("hand-cargo").hidden=true;
  $("hand").classList.add("fraction-observing");
  // Leave the tiny pieces twitching where the object used to stand.
  await sleep(reducedMotion?180:610);
}

// A failed attempt is allowed to become a dramatic *visual experiment*, but
// never a transaction. Only valid, matching moves can enter state.history.
function failureStage(side, issue, action) {
  const stage = $(side + "-attempt-stage");
  const chamber = $(side + "-chamber");
  stage.dataset.issue = issue.code || "invalid";
  let html = "";
  if (issue.code === "fraction") return showFractionCut(side,issue);
  if (issue.code === "overflow") {
    const type = issue.kind === "posX" || issue.kind === "negX" ? "sprite-spill" :
      issue.kind === "posX2" ? "square-spill sprite-spill" :
      issue.kind === "negOne" ? "balloon-spill" : "weight-spill";
    const props = Array.from({length:12}, (_,i) =>
      '<span class="overflow-piece ' + type +
      '" style="--start-x:' + (12 + i * 6) +
      '%;--spill-x:' + (i%2 ? 110 + i * 10 : -95 - i*10) +
      'px;--spill-delay:' + (i * 66) + 'ms"></span>').join("");
    html = '<div class="attempt-caption">' + issue.total + ' objects — only ' +
      issue.capacity + ' fit!</div><div class="overflow-trail">' + props +
      '</div><span class="attempt-hint">They are bouncing and tumbling out!</span>';
  } else {
    const klass = issue.kind === "posOne" ? "weight-ghost" : "";
    html = '<div class="attempt-caption">The hand tries, but the pieces do not fit...</div>' +
      '<div class="ghost-object ' + klass + '"></div>' +
      '<span class="attempt-hint">' + (issue.code === "missing" ?
        "There aren't enough objects to pick up." :
        "That shape cannot be made from these whole objects.") + '</span>';
  }
  stage.innerHTML = html;
  stage.setAttribute("aria-label", issue.reason || "An impossible arrangement of objects");
  stage.hidden = false;
  stage.classList.remove("rewinding");
  chamber.classList.add("attempt-" + (issue.code || "invalid"));
}
function clearFailureStage(side) {
  const stage = $(side + "-attempt-stage");
  stage.hidden = true;
  stage.innerHTML = "";
  stage.classList.remove("rewinding","fraction-floor-stage");
  delete stage.dataset.issue;
  delete stage.dataset.cutPhase;
  delete stage.dataset.cutFactor;
  delete stage.dataset.cutSources;
  for(const token of $(side+"-items").querySelectorAll(".fraction-original-hidden"))
    token.classList.remove("fraction-original-hidden");
  $(side + "-chamber").classList.remove("attempt-fraction", "attempt-overflow",
    "attempt-missing", "attempt-unsupported-area", "attempt-invalid");
}
function restoreExperiment({rollbackPending = false} = {}) {
  // Clear *every* temporary representation before returning to the last
  // committed state. No failed step ever changes the mathematical history.
  if (rollbackPending && state.pending) state = undo(state);
  override = null;
  groups = {left:0,right:0};
  failureTilt = 0;
  for (const side of ["left","right"]){
    clearFailureStage(side);
    clearNeutralEffect(side);
  }
  $("scene").classList.remove("scene-failed-balance");
  render();
}
async function animateRejectedAction(action, failure, preferredSide, rollbackPending = false) {
  if (busy) return;
  const current = preferredSide || failure.side || "left";
  const preview = previewRoomAction(state[current], action, state.quantityMode,current);
  const side = preview.ok ? (failure.side || current) : current;
  const issue = preview.ok ? failure : preview;
  busy = true;
  clearSpeech();
  $("feedback").textContent = "The hand is trying that experiment...";
  render();
  try {
    if(issue.code==="fraction"){
      // Cancel existing signed zero pairs before cutting the true remainder.
      const existing=visible();
      const events=neutralPairSequence(existing[side],side);
      if(events.length){
        override={left:room(existing.left),right:room(existing.right)};
        await animateNeutralEvents(side,events,r=>{
          override={...override,[side]:room(r)};render();
        });
        clearSpeech();
      }
    }
    const sceneAction=issue.code==="fraction"
      ? {...action,fractionAttempt:issue} : action;
    await handAct(side, sceneAction, () => failureStage(side, issue, action));
    // A visual pause comes BEFORE the speech bubble; learners can notice the
    // cut pieces or spilling tokens for themselves.
    await sleep(reducedMotion ? 220 : 850);
    const message = attemptMessage(issue, action, side);
    $("feedback").textContent = message;
    showTrialSpeech(message, reducedMotion ? 4500 : 7600);
    await sleep(reducedMotion ? 650 : 2450);
    // FIRST stitch each physical fragment back into the ORIGINAL object;
    // only then rewind the experiment. Students can watch the undo.
    if(issue.code==="fraction"){
      $(side+"-attempt-stage").dataset.cutPhase="rejoining";
      await sleep(reducedMotion?230:790);
    }
    $(side + "-attempt-stage").classList.add("rewinding");
    $("scene").classList.add("scene-rewinding");
    await sleep(reducedMotion ? 120 : 500);
  } finally {
    restoreExperiment({rollbackPending});
    busy = false;
    render();
    await sleep(reducedMotion ? 1 : 180);
    $("scene").classList.remove("scene-rewinding");
  }
}
async function animateMismatchedManualAction(side, firstAction, action) {
  if (busy || !state.pending) return;
  const attempted = previewRoomAction(state[side], action, state.quantityMode,side);
  if (!attempted.ok) {
    // A second move that cannot physically happen still gets a demonstration,
    // and BOTH provisional sides return to the last committed equation.
    return animateRejectedAction(action, attempted, side, true);
  }
  const firstSide = state.pending.first;
  busy = true;
  clearSpeech();
  $("feedback").textContent = "Let's see what happens when the rooms receive different moves...";
  render();
  try {
    const before=visibleRooms(state);
    if(action.op==="divide"){
      if(attempted.cancellationEvents.length){
        override={left:room(before.left),right:room(before.right)};
        await animateNeutralEvents(side,attempted.cancellationEvents,r=>{
          override={...override,[side]:room(r)};render();
        });
      }
      override={...before,[side]:room(attempted.beforeGroups)};
      groups[side]=action.factor;render();
    }else if(action.op==="multiply"){
      groups[side]=-action.factor;render();
    }
    await handAct(side, action, async() => {
      if(action.op!=="divide"&&attempted.cancellationEvents.length){
        override={...before,[side]:room(attempted.raw)};render();
        await animateNeutralEvents(side,attempted.cancellationEvents,r=>{
          override={...override,[side]:room(r)};render();
        });
      }
      override={left:before.left,right:before.right,[side]:attempted.after};
      groups[side] = 0;
      const difference = currentDifference(override);
      // Equally valued but differently described operations do not magically
      // unbalance a scale. Do not teach a false physical consequence.
      failureTilt = difference === 0 ? 0 : difference > 0 ? -13 : 13;
      $("scene").classList.add("scene-failed-balance");
      $("scene").dataset.balanceOutcome = difference === 0 ? "equivalent" : "tipped";
      render();
    });
    await sleep(reducedMotion ? 200 : 1100); // Observe the new balance pose.
    const difference = currentDifference(override);
    const message = mismatchedMoveMessage(firstAction, action, firstSide, difference);
    $("feedback").textContent = message;
    showTrialSpeech(message, reducedMotion ? 5000 : 8000);
    await sleep(reducedMotion ? 750 : 2300); // Explain before restoring.
    $("scene").classList.add("scene-rewinding");
    await sleep(reducedMotion ? 100 : 500);
  } finally {
    restoreExperiment({rollbackPending:true});
    delete $("scene").dataset.balanceOutcome;
    busy = false;
    render();
    await sleep(reducedMotion ? 1 : 370);
    $("scene").classList.remove("scene-rewinding");
  }
}

async function finishTurn() {
  if (isSolved(state)) {
    if (activeFirstGuide()) {
      guideSeen=writeGuideSeen(true);
      guideDismissed=true;
    }
    if (activeIndependentGuide()) {
      independentGuideSeen=writeIndependentGuideSeen(true);
      guideDismissed=true;
    }
    if(campaignLevelNumber!==null)
      window.dispatchEvent(new CustomEvent("mathssprites:solved",
        {detail:{stage:campaignStage,number:campaignLevelNumber,
          levelId:currentLevel().id,moves:state.history.length}}));
    busy = true; render();
    // The student must be able to SEE the final physical balance before
    // the comic-book retrospective covers the laboratory.
    $("scene").classList.add("solved-scene");
    // A level can now be played out of order; its number alone is NOT
    // evidence that a whole chapter or stage has been mastered.
    $("level-clear-title").textContent =
      workshopActive?"Your own equation, balanced!":"Balance restored!";
    $("level-clear").hidden = false;
    $("feedback").textContent = state.goal === "square" || state.goal==="area"
      ? "A complete in-room square! Its physical regions match the squared side."
      : "One sprite, and its matching weights. The rooms are balanced!";
    await sleep(reducedMotion ? 1100 : 1800);
    $("scene").classList.remove("solved-scene");
    $("level-clear").hidden = true;
    busy = false; render();
    showReplay();
  } else {
    $("feedback").textContent = "Still balanced. What should the hand try next?";
  }
}
async function guidedMove() {
  // Stage 2 is manual-only, even if the hidden Guided Mirror control is called.
  if (notebookSession || campaignStage==="independent" ||
      (workshopActive&&mode!=="auto") || busy || isSolved(state)) return;
  const action=currentAction();
  const outcome=perform(state,action,"auto");
  if(!outcome.ok) {
    if(["locked-negative","locked-operation","locked-world","locked-kind"].includes(outcome.code))
      return notify(outcome.reason);
    return animateRejectedAction(action,outcome);
  }
  const previous=state,next=outcome.state;
  const previews={
    left:previewRoomAction(previous.left,action,state.quantityMode,"left"),
    right:previewRoomAction(previous.right,action,state.quantityMode,"right")
  };
  busy=true;clearSpeech();
  $("feedback").textContent=operationDescription(action)+"...";
  try {
    if(action.op==="divide"){
      await neutraliseBeforeDivision(action,previews);
      groups={left:action.factor,right:action.factor};
      render();
    }else if(action.op==="multiply"){
      groups={left:-action.factor,right:-action.factor};
      render();
    }else render();
    const beforeRight=action.op==="divide"
      ? room(previews.right.beforeGroups) : previous.right;
    await handAct("left",action,async()=>{
      const trial=previews.left;
      if(action.op!=="divide"&&trial.cancellationEvents.length){
        override={left:room(trial.raw),right:beforeRight};render();
        await animateNeutralEvents("left",trial.cancellationEvents,r=>{
          override={left:room(r),right:beforeRight};render();
        });
      }
      override={left:next.left,right:beforeRight};
      groups.left=0;render();
    });
    await handAct("right",action,async()=>{
      // Commit exactly once, while the hand touches the second room.
      state=next;
      const trial=previews.right;
      if(action.op!=="divide"&&trial.cancellationEvents.length){
        override={left:next.left,right:room(trial.raw)};render();
        await animateNeutralEvents("right",trial.cancellationEvents,r=>{
          override={left:next.left,right:room(r)};render();
        });
      }
      override=null;groups.right=0;render();
    });
  }finally{
    override=null;groups={left:0,right:0};busy=false;render();
    clearNeutralEffect("left");clearNeutralEffect("right");
  }
  await finishTurn();
}
/** Replay a CHECKED algebra notebook as consecutive real hand movements.
 * The pure engine's committed history, never user text, provides the actions.
 * This deliberately does NOT call finishTurn/showReplay: paper already came
 * first, so showing the standard paper-after-sprites comic would reverse PR20. */
async function replayNotebookWithSprites() {
  if(!notebookSession || !isSolved(notebookSession.state) || busy)return;
  const script=notebookReplayScript(notebookSession);
  notebookPhase="replaying";
  notebookReplaySuccessful=false;
  mode="auto";
  busy=true;
  state=initialState(notebookSession.level);
  override=null;
  groups={left:0,right:0};
  $("scene").hidden=false; // let geometry exist BEFORE hand measurements
  $("notebook-workspace").hidden=true;
  $("notebook-playback").hidden=false;
  $("notebook-playback-message").textContent="The hand is getting ready to follow your checked steps...";
  render();
  try {
    await sleep(60);
    for(const [i,step] of script.entries()){
      const action=step.action;
      const previous=state;
      const result=perform(previous,action,"auto");
      if(!result.ok)throw new Error("Checked notebook action became invalid");
      const next=result.state;
      const exact=["left","right"].every(side=>
        TOKEN_KINDS.every(kind=>next[side][kind]===step.after[side][kind]));
      if(!exact)throw new Error("Notebook script disagrees with engine history");
      const previews={
        left:previewRoomAction(previous.left,action,state.quantityMode,"left"),
        right:previewRoomAction(previous.right,action,state.quantityMode,"right")
      };
      if(!previews.left.ok||!previews.right.ok)
        throw new Error("A notebook room preview was invalid");
      $("notebook-playback-message").textContent=
        "Step "+(i+1)+" of "+script.length+": "+step.explanation;
      if(action.op==="divide"){
        await neutraliseBeforeDivision(action,previews);
        groups={left:action.factor,right:action.factor};
        render();
      }else if(action.op==="multiply"){
        groups={left:-action.factor,right:-action.factor};
        render();
      }else render();
      const beforeRight=action.op==="divide"
        ? room(previews.right.beforeGroups) : previous.right;
      await handAct("left",action,async()=>{
        const trial=previews.left;
        if(action.op!=="divide"&&trial.cancellationEvents.length){
          override={left:room(trial.raw),right:beforeRight};render();
          await animateNeutralEvents("left",trial.cancellationEvents,r=>{
            override={left:room(r),right:beforeRight};render();
          });
        }
        override={left:next.left,right:beforeRight};
        groups.left=0;
        render();
      });
      await handAct("right",action,async()=>{
        state=next;
        const trial=previews.right;
        if(action.op!=="divide"&&trial.cancellationEvents.length){
          override={left:next.left,right:room(trial.raw)};render();
          await animateNeutralEvents("right",trial.cancellationEvents,r=>{
            override={left:next.left,right:room(r)};render();
          });
        }
        override=null;groups.right=0;render();
      });
      override=null;groups={left:0,right:0};render();
      clearNeutralEffect("left");clearNeutralEffect("right");
      if(i<script.length-1)await sleep(reducedMotion?120:450);
    }
    if(!isSolved(state))throw new Error("Replay did not reach the validated solution");
    $("scene").classList.add("solved-scene");
    $("level-clear-title").textContent="Your algebra came to life!";
    $("level-clear").hidden=false;
    $("notebook-playback-message").textContent=
      "Your "+script.length+" checked algebra step"+(script.length===1?"":"s")+
      " just happened in the rooms. Every move stayed balanced.";
    await sleep(reducedMotion?650:1250);
    notebookReplaySuccessful=true;
    // Only a fully completed, physically verified Stage 3 replay earns credit.
    // The teacher sandbox keeps its own zero-credit behaviour.
    if(campaignStage==="notebook"&&campaignLevelNumber!==null)
      window.dispatchEvent(new CustomEvent("mathssprites:solved",
        {detail:{stage:"notebook",number:campaignLevelNumber,
          levelId:currentLevel().id,moves:state.history.length}}));
  } catch {
    state=initialState(notebookSession.level);
    notebookMessage("The sprite replay was interrupted. Your checked paper working is safe; try the replay again.","error");
  } finally {
    override=null;groups={left:0,right:0};
    $("scene").classList.remove("solved-scene");
    $("level-clear").hidden=true;
    clearNeutralEffect("left");clearNeutralEffect("right");
    busy=false;
    notebookPhase=notebookReplaySuccessful?"complete":"writing";
    render();
    (notebookReplaySuccessful?$("notebook-back-paper"):$("notebook-replay"))
      .focus({preventScroll:true});
  }
}
async function manualMove(side) {
  // A student-facing Stage 1 cannot perform one-sided actions, even if an
  // invisible prototype button is activated programmatically.
  if(notebookSession || campaignStage==="guided" ||
     (workshopActive&&mode!=="manual") || busy || isSolved(state))return;
  const wasPending=!!state.pending,action=currentAction();
  const outcome=perform(state,action,"manual",side);
  if(!outcome.ok){
    if(["locked-negative","locked-operation","locked-world","locked-kind"].includes(outcome.code))
      return notify(outcome.reason);
    if(wasPending&&outcome.code==="mismatch")
      return animateMismatchedManualAction(side,state.pending.action,action);
    return animateRejectedAction(action,outcome,side,wasPending);
  }
  const before=visible();
  const preview=previewRoomAction(before[side],action,state.quantityMode,side);
  busy=true;clearSpeech();
  try{
    if(action.op==="divide"){
      if(preview.cancellationEvents.length){
        override={left:before.left,right:before.right};
        await animateNeutralEvents(side,preview.cancellationEvents,r=>{
          override={...override,[side]:room(r)};render();
        });
      }
      override={...before,[side]:room(preview.beforeGroups)};
      groups[side]=action.factor;render();
    }else if(action.op==="multiply"){
      groups[side]=-action.factor;render();
    }
    await handAct(side,action,async()=>{
      state=outcome.state;
      if(action.op!=="divide"&&preview.cancellationEvents.length){
        override={...visibleRooms(state),[side]:room(preview.raw)};render();
        await animateNeutralEvents(side,preview.cancellationEvents,r=>{
          override={...override,[side]:room(r)};render();
        });
      }
      override=null;groups[side]=0;render();
    });
  }finally{
    override=null;groups[side]=0;busy=false;render();clearNeutralEffect(side);
  }
  if(state.pending) {
    $("feedback").textContent="One room done. The scale is tilted! Now make the matching move in the other room.";
    renderFirstGuide();
  } else {
    if(activeIndependentGuide()) {
      independentGuideSeen=writeIndependentGuideSeen(true);
      guideDismissed=true;
      renderFirstGuide();
    }
    await finishTurn();
  }
}
function startLevel(index, quantityMode, levelOverride=null, campaignNumber=null, stage="guided") {
  stopReplay();
  replayEntries = [];
  notebookSession=null;
  notebookPhase="idle";
  notebookReplaySuccessful=false;
  workshopActive=false;
  document.body.classList.remove("notebook-mode","workshop-mode");
  levelIndex = (index + LEVELS.length) % LEVELS.length;
  const level = levelOverride || LEVELS[levelIndex];
  activeLevel = level;
  campaignLevelNumber=campaignNumber;
  campaignStage=campaignNumber===null?null:stage;
  if(campaignStage==="guided")mode="auto";
  if(campaignStage==="independent")mode="manual";
  guideStep=0;
  guideDismissed=false;
  guideWasActive=activeCampaignGuide();
  state=initialState(level,quantityMode||levelQuantityMode(level));
  operation = level.startingOperation ||
    ((levelIndex === 1 || levelIndex === 4) ? "divide" : "remove");
  kind=level.startingKind||"posOne";
  amount=level.startingAmount||
    (levelIndex===0?2:levelIndex===2?4:levelIndex===4?2:1);
  factor = level.startingFactor || (levelIndex === 1 ? 3 : levelIndex === 4 ? 5 : 2);
  override = null; groups = { left: 0, right: 0 };
  failureTilt = 0;
  $("scene").classList.remove("scene-failed-balance", "scene-rewinding");
  delete $("scene").dataset.balanceOutcome;
  busy = false;
  // Clear any half-finished visual state when changing levels.
  $("hand").classList.remove("approaching", "reaching", "grasping", "lifting", "acting", "tracking-sprite", "arranging");
  $("hand").style.removeProperty("--hand-chase");
  $("hand-cargo").classList.remove("sprite-captured");
  $("hand").dataset.phase = "rest";
  for (const side of ["left", "right"]) {
    $(side + "-chamber").classList.remove("hand-target", "hand-contact");
    clearAreaPreview(side);
    clearFailureStage(side);
    clearNeutralEffect(side);
  }
  $("hand-cargo").hidden = true;
  $("action-caption").hidden = true;
  $("scene").classList.remove("solved-scene");
  $("level-clear").hidden = true;
  $("level-clear-rating").hidden=true;
  $("level-clear-rating").textContent="";
  $("replay-star-summary").hidden=true;
  $("replay-star-summary").textContent="";
  clearSpeech();
  $("replay-backdrop").hidden = true;
  $("feedback").textContent = campaignStage==="independent"
    ? "Your turn: choose an operation and move the hand in one room. Match it in the other to level the scale."
    : level.lockPositive
      ? "Positive whole numbers only. Choose an action and keep the rooms balanced."
    : state.quantityMode==="signed"
      ? "Signed objects are active: white sprites and balloons are opposites. Make a zero pair!"
      : "Positive objects only. Signed objects can be enabled with Maths mode.";
  render();
}
function miniItems(r) {
  let out = "";
  for (const type of TOKEN_KINDS) for (let i = 0; i < r[type]; i++) out += token(type, i, true);
  return out || '<span class="mini-empty">empty</span>';
}
function miniRooms(pair) {
  return '<div class="mini-rooms">' +
    '<div class="mini-room"><span class="mini-caption">WEST</span><div class="mini-floor">' + miniItems(pair.left) + '</div></div>' +
    '<span class="mini-equals">⚖</span>' +
    '<div class="mini-room"><span class="mini-caption">EAST</span><div class="mini-floor">' + miniItems(pair.right) + '</div></div>' +
    '</div>';
}
function recordedZeroEvents(entry) {
  return [...(entry.cancellationEvents?.left||[]),
    ...(entry.cancellationEvents?.right||[])];
}
function replayZeroPairNotes(entry) {
  return recordedZeroEvents(entry).map(event=>({
    type:"zero-pair",
    text:(event.side==="right"?"East":"West")+" room: "+
      (event.type==="sprites"?"(+x) + (−x) = 0":"(+1) + (−1) = 0")
  }));
}
function panelHTML(entry, index, active) {
  const zeroPairs=recordedZeroEvents(entry);
  const title = index === 0 ? "Before the hand began" : "Move " + index;
  const subtitle = index === 0 ? "Every object has a hidden value..." : operationDescription(entry.action);
  return '<article class="comic-panel ' + (active ? "current-panel" : "old-panel") + '" data-panel="' + index + '">' +
    '<header><strong>' + title + '</strong><small>' + subtitle + '</small></header>' +
    '<div class="mini-stage" id="mini-stage-' + index + '">' +
    miniRooms(index === 0 ? entry.after : entry.after) +
    '</div><div class="panel-footnote">' + (index === 0 ? "The two little rooms start in balance." :
      zeroPairs.length ? "The same operation on both sides; "+neutralPairSummary(zeroPairs)+
        " cancelled inside their rooms (each pair has value zero)." :
      "The same mathematical change happened on both sides.") + '</div></article>';
}
/**
 * Comic replay is deliberately paced by the pencil, not by a slideshow timer.
 * Every visual glyph is initially invisible and revealed only after the
 * animated pencil has moved to its actual position in the notebook.
 */
function escapeInk(value) {
  return String(value).replace(/[&<>"']/g, symbol => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[symbol]));
}
function notebookLines(entry, index) {
  if (index === 0) return [{ type: "equation", text: equation(entry.after) }];
  return [
    { type: "operation", text: algebraOperation(entry.action) },
    ...replayZeroPairNotes(entry),
    { type: "equation", text: equation(entry.after) }
  ];
}
function inkCharacters(value, lineIndex) {
  return symbolsOf(value).map((symbol, symbolIndex) =>
    '<span class="ink-glyph" data-ink-line="' + lineIndex +
    '" data-ink-symbol="' + symbolIndex + '">' + (symbol === " " ? "&nbsp;" : escapeInk(symbol)) +
    "</span>"
  ).join("");
}
function renderPaper(index, animateWriting) {
  let html = "";
  for (let i = 0; i <= index; i++) {
    const written = notebookLines(replayEntries[i], i);
    const livePanel = i === index && animateWriting;
    html += '<div class="paper-line ' + (livePanel ? "new-ink" : "older-ink") + '">';
    written.forEach((line, lineIndex) => {
      const isAnswer = i === replayEntries.length - 1 && line.type === "equation";
      const className = line.type + "-line" + (isAnswer ? " answer-line" : "") +
        (isAnswer && !livePanel ? " complete" : "");
      html += '<span class="' + className + '">' +
        (livePanel ? inkCharacters(line.text, lineIndex) : escapeInk(line.text)) +
        "</span>";
    });
    html += "</div>";
  }
  $("pencil-lines").innerHTML = html;
  $("pencil").hidden = true;
  $("pencil").classList.remove("writing");
  return notebookLines(replayEntries[index], index).map(line => line.text);
}
function stopReplay() {
  if (replayFrame !== null) cancelAnimationFrame(replayFrame);
  replayFrame = null;
  replayLastFrame = null;
}
function setReplayPaused(value) {
  replayPaused = value;
  $("replay-play").textContent = value ? "Play ▶" : "Pause Ⅱ";
  $("replay-play").setAttribute("aria-label", value ? "Play replay" : "Pause replay");
  $("replay-backdrop").classList.toggle("replay-paused", value);
  if (value) stopReplay();
  else {
    replayLastFrame = null;
    if (!$("replay-backdrop").hidden) scheduleReplayFrame();
  }
}
function scheduleReplayFrame() {
  if (replayFrame === null && !replayPaused && !$("replay-backdrop").hidden)
    replayFrame = requestAnimationFrame(tickReplay);
}
function visibleInkGlyph(line, symbol) {
  return $("pencil-lines").querySelector('[data-ink-line="' + line +
    '"][data-ink-symbol="' + symbol + '"]');
}
function positionPencil(glyph) {
  if (!glyph) return;
  const pen = $("pencil");
  const page = document.querySelector(".paper-page");
  const glyphBox = glyph.getBoundingClientRect();
  const pageBox = page.getBoundingClientRect();
  // The SVG tip is at the bottom centre. Its rotation therefore leaves
  // the nib on the baseline as the pencil travels between individual glyphs.
  const x = glyphBox.left - pageBox.left + glyphBox.width / 2 - pen.offsetWidth / 2;
  const y = glyphBox.bottom - pageBox.top - pen.offsetHeight;
  pen.style.left = x + "px";
  pen.style.top = y + "px";
  pen.hidden = false;
  pen.classList.add("writing");
}
function keepWritingInView(glyph) {
  if (!glyph) return;
  const pageScroll = document.querySelector(".paper-side");
  const target = glyph.getBoundingClientRect();
  const view = pageScroll.getBoundingClientRect();
  if (target.bottom > view.bottom - 70 || target.top < view.top + 85) {
    pageScroll.scrollTop += target.top - view.top - view.height * 0.34;
  }
}
function finishMiniAction() {
  const miniStage = $("mini-stage-" + replayIndex);
  if (!miniStage || replayIndex === 0) return;
  miniStage.innerHTML = miniRooms(replayEntries[replayIndex].after);
  miniStage.classList.remove("reenacting");
  miniStage.classList.add("action-complete");
}
function processReplayEvent(event) {
  switch (event.type) {
    case "action-complete":
      finishMiniAction();
      $("writing-status").textContent = "Now watch the pencil explain that move...";
      break;
    case "move-pen": {
      const glyph = visibleInkGlyph(event.lineIndex, event.symbolIndex);
      positionPencil(glyph);
      if (event.symbolIndex === 0) keepWritingInView(glyph);
      $("writing-status").textContent = event.lineIndex === 0 && replayIndex > 0
        ? "Writing the matching operation, one symbol at a time..."
        : "Writing the equation, one symbol at a time...";
      break;
    }
    case "reveal-symbol": {
      const glyph = visibleInkGlyph(event.lineIndex, event.symbolIndex);
      glyph?.classList.add("written");
      break;
    }
    case "line-complete": {
      $("replay-announcement").textContent = event.text;
      const paper = $("pencil-lines").lastElementChild;
      const line = paper?.children[event.lineIndex];
      if (line?.classList.contains("answer-line")) line.classList.add("complete");
      break;
    }
    case "writing-complete":
      $("pencil").hidden = true;
      $("pencil").classList.remove("writing");
      $("writing-status").textContent = "Finished writing. Take a moment to read...";
      $("replay-progress").textContent = "Panel " + (replayIndex + 1) +
        " of " + replayEntries.length + " · Written";
      if (replayIndex === replayEntries.length - 1) $("next-level").disabled = false;
      updateReplayEndNote();
      break;
  }
}
function tickReplay(timestamp) {
  replayFrame = null;
  if (replayPaused || $("replay-backdrop").hidden || !replayTimeline) return;
  if (document.hidden) {
    replayLastFrame = null;
    scheduleReplayFrame();
    return;
  }
  if (replayLastFrame === null) replayLastFrame = timestamp;
  // Background tabs and breakpoint pauses should never skip whole equations.
  const delta = Math.min(Math.max(timestamp - replayLastFrame, 0), 80);
  replayLastFrame = timestamp;
  replayElapsed += delta * replaySpeed;

  while (replayNextEvent < replayTimeline.events.length &&
         replayTimeline.events[replayNextEvent].at <= replayElapsed) {
    processReplayEvent(replayTimeline.events[replayNextEvent]);
    replayNextEvent++;
  }
  if (replayElapsed >= replayTimeline.durationMs) {
    if (replayIndex < replayEntries.length - 1) {
      drawReplay(replayIndex + 1, { animate: !reducedMotion });
    } else {
      replayPanelFinished = true;
      $("replay-progress").textContent = "All " + replayEntries.length + " panels complete";
      $("next-level").disabled = false;
      updateReplayEndNote();
      setReplayPaused(true);
    }
    return;
  }
  scheduleReplayFrame();
}
function updateReplayEndNote() {
  const ready = replayIndex === replayEntries.length - 1 &&
    (replayPanelFinished || reducedMotion);
  const note = $("replay-end-note");
  note.hidden = !ready || campaignLevelNumber === null;
  if (ready && campaignLevelNumber !== null)
    note.textContent=campaignStage==="independent" && campaignLevelNumber===16
      ? "Stage 2 complete. Algebra Apprentice is coming next!"
      : campaignStage==="guided" && campaignLevelNumber===20
        ? "Guided Balance complete. Independent Balance is unlocked!"
        : "Level "+campaignLevelNumber+" solved · keep exploring!";
}
function drawReplay(index, { animate = !reducedMotion, complete = false } = {}) {
  stopReplay();
  replayIndex = Math.max(0, Math.min(replayEntries.length - 1, index));
  replayElapsed = 0;
  replayNextEvent = 0;
  replayPanelFinished = complete;
  const written = renderPaper(replayIndex, animate && !complete && !reducedMotion);
  const mini = replayEntries[replayIndex];
  $("comic-panels").innerHTML = replayEntries.slice(0, replayIndex + 1)
    .map((entry, i) => panelHTML(entry, i, i === replayIndex)).join("");
  const activeStage = $("mini-stage-" + replayIndex);
  if (replayIndex > 0 && animate && !complete && !reducedMotion) {
    activeStage.innerHTML = miniRooms(mini.before) +
      '<svg class="mini-hand-cue" viewBox="0 0 38 55" aria-hidden="true" focusable="false">' +
      '<path fill="#cfa384" stroke="#6e5140" stroke-width="1.8" d="M13 3 Q16 0 18 5 L21 27 L20 7 Q22 3 25 8 L28 28 L28 13 Q29 10 32 13 L34 30 Q38 37 30 48 L23 53 L11 47 L5 35 Q1 28 5 26 Q9 24 13 32 Z"/></svg>';
    for(const [cueIndex,event] of recordedZeroEvents(mini).entries()){
      activeStage.innerHTML+='<div class="mini-neutral-pair" data-pair-type="'+event.type+
        '" style="--neutral-delay:'+(cueIndex*950)+'ms" data-side="'+event.side+'">'+
        '<span class="mini-token '+event.positive+'"></span>'+
        '<span class="mini-token '+event.negative+'"></span>'+
        '<span>→ 0 in '+(event.side==="left"?"west":"east")+'</span></div>';
    }
    activeStage.classList.add("reenacting");
  }

  const lines = notebookLines(mini, replayIndex).map(line => line.text);
  // The action needs time to replay EVERY physical neutralisation first.
  // Otherwise the pencil starts writing while pairs are still disappearing.
  const zeroCount=recordedZeroEvents(mini).length;
  const pace=zeroCount ? {...WRITING_PACE,
    actionCompleteMs:WRITING_PACE.actionCompleteMs+zeroCount*950,
    operationDelayMs:WRITING_PACE.operationDelayMs+zeroCount*950} : WRITING_PACE;
  replayTimeline = animate && !complete && !reducedMotion
    ? buildWritingTimeline(lines, { opening: replayIndex === 0,pace })
    : { events: [], durationMs: complete ? 0 : 3900 };
  $("pencil").hidden = true;
  $("writing-status").textContent = complete ? "This panel's algebra is fully written."
    : reducedMotion ? "Complete algebra shown, without animation."
    : replayIndex === 0 ? "The pencil is about to reveal the hidden equation..."
    : "First the hand replays the move, then the pencil writes...";
  $("replay-progress").textContent = "Panel " + (replayIndex + 1) + " of " + replayEntries.length;
  $("replay-back").disabled = replayIndex === 0;
  $("replay-next").disabled = replayIndex >= replayEntries.length - 1;
  $("next-level").textContent = workshopActive?"Build another equation →":
    campaignLevelNumber !== null
    ? (campaignStage==="guided" && campaignLevelNumber===20 ||
       campaignStage==="independent" && campaignLevelNumber===16
        ?"Back to stages →":"Next level →")
    : levelIndex === LEVELS.length - 1
      ? "Play from the beginning →" : "Next experiment →";
  $("next-level").disabled = replayIndex !== replayEntries.length - 1 ||
    (!complete && !reducedMotion);
  updateReplayEndNote();
  if (complete || reducedMotion) {
    $("replay-announcement").textContent = lines.join(". ");
  }
  const box = $("comic-panels");
  if (box) box.scrollTop = box.scrollHeight;
  if (!replayPaused && !complete) scheduleReplayFrame();
}
function showReplay() {
  if (!isSolved(state)) return;
  stopReplay();
  replayEntries = [{ after: state.history[0]?.before || { left: state.left, right: state.right } },
    ...state.history.map(entry => ({ ...entry }))];
  $("replay-level-stamp").textContent = workshopActive?"YOUR EQUATION · FREE PLAY":
    campaignLevelNumber===null
    ? "THE EXPERIMENT REVEALED"
    : "STAGE "+(campaignStage==="independent"?2:1)+" · LEVEL "+
      String(campaignLevelNumber).padStart(2,"0")+" / "+
      (campaignStage==="independent"?16:20)+" · "+
      (guideWasActive && campaignLevelNumber===1
        ? (campaignStage==="independent"?"FIRST INDEPENDENT DISCOVERY":"FIRST DISCOVERY")
        : "BALANCE RESTORED");
  $("replay-backdrop").hidden = false;
  setReplayPaused(true);
  drawReplay(0);
  setReplayPaused(false);
  $("replay-close").focus();
}
function hideReplay() {
  stopReplay();
  $("replay-backdrop").hidden = true;
  $("pencil").hidden = true;
  setReplayPaused(true);
  $("watch-again")?.focus();
}
function replaySeek(offset) {
  setReplayPaused(true);
  // Manual next/previous shows a *complete* panel so students can study it.
  drawReplay(replayIndex + offset, { animate: false, complete: true });
}
$("level-select").innerHTML = LEVELS.map((lvl, i) =>
  '<option value="' + i + '">' + (i + 1) + " · " + lvl.title + "</option>").join("");
for (const button of document.querySelectorAll("[data-operation]")) {
  button.addEventListener("click", () => {
    if (busy) return;
    operation = button.dataset.operation;
    if (operation === "divide" && levelIndex === 1) factor = 3;
    if (operation === "divide" && levelIndex === 4) factor = 5;
    render();
  });
}
for (const button of document.querySelectorAll("[data-kind]")) {
  button.addEventListener("click", () => { if (!busy) { kind = button.dataset.kind; render(); } });
}
$("amount-down").addEventListener("click", () => {
  if (busy) return;
  if (operation === "multiply" || operation === "divide") factor = Math.max(2, factor - 1);
  else amount = Math.max(1, amount - 1);
  render();
});
$("amount-up").addEventListener("click", () => {
  if (busy) return;
  if (operation === "multiply" || operation === "divide") factor = Math.min(5, factor + 1);
  else amount = Math.min(12, amount + 1);
  render();
});
$("do-both").addEventListener("click", guidedMove);
$("left-action").addEventListener("click", () => manualMove("left"));
$("right-action").addEventListener("click", () => manualMove("right"));
$("mode-select").addEventListener("change", event => {
  // The campaign sets the hand-control method. Only authoring previews may
  // choose manual actions independently in PR18.
  if(campaignStage!==null) {
    mode=campaignStage==="independent"?"manual":"auto";
    return render();
  }
  if (busy || state.pending) return render();
  mode = event.target.value === "manual" ? "manual" : "auto";
  render();
});
$("guide-next").addEventListener("click", () => {
  if(!activeCampaignGuide() || guideStep>=3)return;
  guideStep++;
  renderFirstGuide();
  const target=guideTarget(currentGuideCue().target);
  target?.scrollIntoView?.({block:"nearest",behavior:reducedMotion?"instant":"smooth"});
});
$("guide-skip").addEventListener("click",()=>{
  if(campaignStage==="independent")
    independentGuideSeen=writeIndependentGuideSeen(true);
  else guideSeen=writeGuideSeen(true);
  guideDismissed=true;
  guideWasActive=false;
  renderFirstGuide();
});
window.addEventListener("mathssprites:guide-setting",event=>{
  guideEnabled=!!event.detail.enabled;
  if(event.detail.reset){
    if(event.detail.stage==="independent")
      independentGuideSeen=writeIndependentGuideSeen(false);
    else guideSeen=writeGuideSeen(false);
    guideStep=0;
    guideDismissed=false;
  }
  render();
});
$("game-guide-restart").addEventListener("click",()=>{
  if(busy || campaignLevelNumber!==1 || campaignStage===null)return;
  window.dispatchEvent(new CustomEvent("mathssprites:restart-guide",
    {detail:{stage:campaignStage}}));
});
$("quantity-mode").addEventListener("change", event => {
  if(busy||state.pending)return render();
  const requested=event.target.value;
  if (currentLevel().lockPositive) return render();
  if(levelQuantityMode(currentLevel())==="signed"&&requested!=="signed")
    return render();
  startLevel(levelIndex,requested);
  setSpeech(requested==="signed"
    ? "Signed objects are on. White sprites and balloons are opposites to dark sprites and weights. Watch what happens when they meet!"
    : "Only positive sprites and weights are available in this lesson.",5300);
});
$("level-select").addEventListener("change", event => {
  if (notebookSession || workshopActive || campaignLevelNumber !== null) return render();
  startLevel(Number(event.target.value));
});
$("motion-toggle").addEventListener("click", () => chooseMotion(!reducedMotion));
$("motion-enable").addEventListener("click", () => chooseMotion(false));
$("undo").addEventListener("click", () => {
  if (notebookSession || busy) return;
  state = undo(state); clearSpeech();
  $("feedback").textContent = "The hand has put everything back.";
  render();
});
$("reset").addEventListener("click", () => {
  if(notebookSession)return;
  if(workshopActive){
    const level=currentLevel(),selected=mode;
    startLevel(0,"positive",level,null);
    workshopActive=true;
    mode=selected;
    render();
    return;
  }
  startLevel(levelIndex,state.quantityMode,campaignLevelNumber===null?null:currentLevel(),
    campaignLevelNumber,campaignStage);
});
$("hint").addEventListener("click", () => setSpeech(currentLevel().suggested, 6200));
$("feedback").addEventListener("click", event => {
  if (event.target?.id === "watch-again") showReplay();
});
$("replay-close").addEventListener("click", hideReplay);
$("replay-play").addEventListener("click", () => {
  if (!replayPaused) {
    setReplayPaused(true); // Keep both the pencil and its current symbol frozen.
    return;
  }
  if (replayPanelFinished) {
    drawReplay(replayIndex === replayEntries.length - 1 ? 0 : replayIndex + 1,
      { animate: !reducedMotion });
  }
  setReplayPaused(false); // Resume in the middle of an unfinished equation.
});
$("replay-back").addEventListener("click", () => replaySeek(-1));
$("replay-next").addEventListener("click", () => replaySeek(1));
$("replay-restart").addEventListener("click", () => {
  setReplayPaused(true);
  drawReplay(0);
  setReplayPaused(false);
});
$("replay-skip").addEventListener("click", () => {
  setReplayPaused(true);
  drawReplay(replayEntries.length - 1, { animate: false, complete: true });
});
$("replay-speed").addEventListener("change", event => {
  replaySpeed = Number(event.target.value) || 1;
  // Playback clock uses the chosen speed on every new frame; switching pace
  // never jumps the pencil to a different symbol.
});
document.addEventListener("visibilitychange", () => { replayLastFrame = null; });
$("next-level").addEventListener("click", () => {
  if(workshopActive){
    hideReplay();
    window.dispatchEvent(new Event("mathssprites:workshop-another"));
    return;
  }
  if (campaignLevelNumber !== null) {
    hideReplay();
    window.dispatchEvent(new CustomEvent("mathssprites:advance"));
  } else startLevel(levelIndex + 1);
});
/** PR20 notebook sandbox: Stage 3 puzzle content and saved progress arrive
 * in PR21. No notebook preview ever dispatches mathssprites:solved. */
function openNotebookLevel(level,number=null){
  if(busy)return;
  startLevel(0,"positive",level,number,number===null?"guided":"notebook");
  notebookSession=startNotebook(level);
  notebookPhase="writing";
  notebookReplaySuccessful=false;
  mode="auto";
  $("notebook-hint-message").hidden=true;
  $("notebook-hint-message").textContent="";
  $("notebook-operation").value="";
  notebookMessage("Choose an operation for BOTH sides, such as −3, −x or ÷2. The editor calculates the next equation.");
  renderNotebookPaper();
  render();
  $("notebook-operation").focus({preventScroll:true});
}
window.addEventListener("mathssprites:notebook-preview",event=>{
  openNotebookLevel(event.detail?.level);
});
window.addEventListener("mathssprites:notebook-campaign",event=>{
  if(event.detail?.stage!=="notebook"||!Number.isInteger(event.detail?.number))return;
  openNotebookLevel(event.detail.level,event.detail.number);
});
window.addEventListener("mathssprites:notebook-close",()=>{
  if(busy)return;
  notebookSession=null;
  notebookPhase="idle";
  notebookReplaySuccessful=false;
  document.body.classList.remove("notebook-mode");
  renderNotebookVisibility();
});
$("notebook-hint").addEventListener("click",()=>{
  if(!notebookSession)return;
  $("notebook-hint-message").textContent=currentLevel().suggested||
    "Think about one equal change you can make to both sides.";
  $("notebook-hint-message").hidden=false;
});
/** Operation editor: clicking a maths sign or keypad key edits only the
 * proposed operation; the original equation and engine history stay intact. */
$("notebook-operation").addEventListener("input",()=>{
  if(notebookSession&&notebookPhase==="writing"){
    $("notebook-operation").setAttribute("aria-invalid","false");
    renderNotebookMathEditor();
  }
});
for(const button of document.querySelectorAll("[data-notebook-symbol]")){
  button.addEventListener("click",()=>{
    if(!notebookSession||notebookPhase!=="writing"||busy)return;
    const input=$("notebook-operation");
    const sign=button.dataset.notebookSymbol;
    const current=input.value.trim();
    const previous=/^[+\\-−×÷*/]/.test(current)?current.slice(1):current;
    // × and ÷ apply only to a number. Do not silently turn -x into ×x.
    const operand=(sign==="×"||sign==="÷")&&previous.endsWith("x")?"":previous;
    input.value=sign+operand;
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.focus({preventScroll:true});
    input.setSelectionRange(input.value.length,input.value.length);
  });
}
for(const button of document.querySelectorAll("[data-notebook-key]")){
  button.addEventListener("click",()=>{
    if(!notebookSession||notebookPhase!=="writing"||busy)return;
    const input=$("notebook-operation");
    const start=input.selectionStart??input.value.length;
    const end=input.selectionEnd??start;
    const key=button.dataset.notebookKey;
    if(key==="backspace"){
      const cut=start===end?Math.max(0,start-1):start;
      input.value=input.value.slice(0,cut)+input.value.slice(end);
      input.focus({preventScroll:true});
      input.setSelectionRange(cut,cut);
    }else{
      input.value=input.value.slice(0,start)+key+input.value.slice(end);
      input.focus({preventScroll:true});
      input.setSelectionRange(start+key.length,start+key.length);
    }
    input.dispatchEvent(new Event("input",{bubbles:true}));
  });
}
$("notebook-form").addEventListener("submit",event=>{
  event.preventDefault();
  if(!notebookSession||notebookPhase!=="writing"||busy)return;
  const input=$("notebook-operation");
  const result=tryNotebookOperation(notebookSession,input.value);
  if(!result.ok){
    notebookMessage(result.message,"error");
    renderNotebookMathEditor();
    input.focus({preventScroll:true});
    return;
  }
  notebookSession=result.session;
  input.value="";
  renderNotebookPaper();
  notebookMessage(result.solved
    ? "Solution checked! Replay with sprites to see each operation you chose."
    : "Applied "+result.explanation+". The new equation was calculated for you. Choose another operation.",
    "success");
  if(!result.solved)input.focus({preventScroll:true});
  else $("notebook-replay").focus({preventScroll:true});
});
$("notebook-undo").addEventListener("click",()=>{
  if(!notebookSession||notebookPhase!=="writing"||busy)return;
  notebookSession=undoNotebookLine(notebookSession);
  $("notebook-operation").value="";
  renderNotebookPaper();
  notebookMessage("The last operation has been undone. Choose your next balanced move.");
  $("notebook-operation").focus({preventScroll:true});
});
$("notebook-reset").addEventListener("click",()=>{
  if(!notebookSession||notebookPhase!=="writing"||busy)return;
  notebookSession=startNotebook(notebookSession.level);
  state=initialState(notebookSession.level);
  $("notebook-operation").value="";
  renderNotebookPaper();
  notebookMessage("Fresh page. The original equation is ready for your operations.");
  $("notebook-operation").focus({preventScroll:true});
});
$("notebook-replay").addEventListener("click",replayNotebookWithSprites);
$("notebook-back-paper").addEventListener("click",()=>{
  if(!notebookSession || notebookPhase!=="complete" || busy)return;
  notebookPhase="writing";
  renderNotebookPaper();
  render();
  notebookMessage("These are your checked algebra steps. You can replay them again or undo a line.","success");
  $("notebook-replay").focus({preventScroll:true});
});
$("notebook-watch-again").addEventListener("click",replayNotebookWithSprites);
$("notebook-next").addEventListener("click",()=>{
  if(busy||!notebookReplaySuccessful||notebookPhase!=="complete"||
     campaignStage!=="notebook"||campaignLevelNumber===null)return;
  window.dispatchEvent(new CustomEvent("mathssprites:advance"));
});
/** Build a custom balance using the same 48-object, whole-number engine.
 * No campaign number or stage is ever assigned, so completion earns no credit. */
window.addEventListener("mathssprites:workshop-launch",event=>{
  if(busy)return;
  const {level,handMode}=event.detail||{};
  if(!level?.lockPositive||level.quantityMode!=="positive"||
     level.id!=="workshop-custom")return;
  startLevel(0,"positive",level,null);
  workshopActive=true;
  mode=handMode==="manual"?"manual":"auto";
  render();
});
window.addEventListener("mathssprites:workshop-close",()=>{
  if(busy)return;
  workshopActive=false;
  document.body.classList.remove("workshop-mode");
  render();
});
window.addEventListener("mathssprites:launch",event=>{
  const {number,legacyIndex,level,stage}=event.detail;
  startLevel(legacyIndex,"positive",level,number,stage);
});
window.addEventListener("mathssprites:preview", event => startLevel(event.detail.index));
function leaveGame(screen) {
  if (busy) return;
  if (!$("replay-backdrop").hidden) hideReplay();
  window.dispatchEvent(new CustomEvent("mathssprites:leave", {detail:{screen}}));
}
$("game-home").addEventListener("click", () => leaveGame("home"));
$("game-brand-home").addEventListener("click", () => leaveGame("home"));
$("game-levels").addEventListener("click", () => leaveGame("levels"));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("replay-backdrop").hidden) { hideReplay(); return; }
  if (event.altKey && event.key.toLowerCase() === "z" && !notebookSession && !busy && $("replay-backdrop").hidden) {
    state = undo(state); render();
  }
});

startLevel(0);

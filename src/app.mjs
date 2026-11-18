import {
  LEVELS, TOKEN_KINDS, initialState, visibleRooms, evaluate,
  perform, previewRoomAction, undo, isSolved, equation, operationDescription, algebraOperation, areaArrangement
} from "./engine.mjs";
import { buildWritingTimeline, symbolsOf } from "./replay-timeline.mjs";
import { handMotionPlan } from "./hand-timeline.mjs";
import { spriteMotionProfile, spriteMotionStyle } from "./sprite-motion.mjs";
import { pickSpriteHandReaction, dodgeOffsetPx } from "./sprite-reactions.mjs";
import { floorScaleToFit, previewCells, areaMathLabel } from "./area-layout.mjs";
import { fractionDisplay, itemWord, attemptMessage, mismatchedMoveMessage } from "./attempt-feedback.mjs";

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
}

let levelIndex = 0;
let mode = "auto";
let operation = "remove";
let kind = "posOne";
let amount = 2;
let factor = 3;
let state = initialState(LEVELS[0]);
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
    const profile = spriteMotionProfile(LEVELS[levelIndex].id, side, kind, i);
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
  const signature = LEVELS[levelIndex].id + "|" + side + "|" +
    TOKEN_KINDS.map(key => r[key]).join(":") + "|groups:" + groupCount;
  if (node.dataset.signature === signature) { resizeFloor(side); return; }
  node.dataset.signature = signature;
  node.setAttribute("aria-label", (side === "left" ? "West chamber: " : "East chamber: ") + roomSummary(r));
  const total = TOKEN_KINDS.reduce((a, field) => a + r[field], 0);
  node.classList.toggle("crowded", total > 16);
  if (!total) {
    node.innerHTML = '<div class="room-empty" aria-hidden="true">a quiet moment...</div>';
    return;
  }
  if (groupCount) {
    const each = {};
    for (const field of TOKEN_KINDS) each[field] = r[field] / groupCount;
    // Group view is only opened after the engine has validated whole-item partitioning.
    let baskets = "";
    for (let i = 0; i < groupCount; i++) {
      baskets += '<div class="group-basket"><div class="basket-contents">' +
          allTokens(each, false, side + "-basket-" + i) +
        '</div><span class="basket-lip"></span></div>';
    }
    node.innerHTML = '<div class="basket-row" aria-label="' + groupCount +
      ' identical groups">' + baskets + '</div>';
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
  box.textContent = "“" + message + "”";
  speechTimer = setTimeout(() => { box.hidden = true; }, ms);
}
function notify(message) {
  $("feedback").textContent = message;
  setSpeech(message);
}
function clearSpeech() {
  clearTimeout(speechTimer);
  $("speech").hidden = true;
}
function render() {
  const lvl = LEVELS[levelIndex];
  const shown = visible();
  renderRoom("left", shown.left, groups.left);
  renderRoom("right", shown.right, groups.right);
  $("chapter").textContent = lvl.chapter;
  $("level-title").textContent = lvl.title;
  $("level-prompt").textContent = lvl.prompt;
  $("step-dots").innerHTML = LEVELS.map((item, i) =>
    '<span class="progress-dot ' + (i <= levelIndex ? "lit" : "") +
    (i === levelIndex ? " current" : "") + '" title="' + item.title + '"></span>').join("");

  const balance = currentDifference(shown);
  const degrees = failureTilt || (balance === 0 ? 0 : (balance < 0 ? 3.5 : -3.5));
  $("rooms-row").style.transform = "rotate(" + degrees + "deg)";
  $("scale-beam").style.transform = "rotate(" + degrees + "deg)";
  $("dial-needle").style.transform = "translateX(-50%) rotate(" + (degrees * -7) + "deg)";
  const awaiting = !!state.pending;
  $("balance-caption").textContent = (awaiting || override)
    ? "The balance is waiting for its matching move"
    : "Two rooms. One perfectly balanced mystery.";
  $("balance-caption").classList.toggle("unbalanced", balance !== 0);
  for (const button of document.querySelectorAll("[data-operation]")) {
    button.classList.toggle("selected", button.dataset.operation === operation);
    button.disabled = busy || isSolved(state);
    button.setAttribute("aria-pressed", String(button.dataset.operation === operation));
  }
  for (const button of document.querySelectorAll("[data-kind]")) {
    button.classList.toggle("selected", button.dataset.kind === kind);
    button.disabled = busy || isSolved(state);
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
  $("mode-select").value = mode;
  $("mode-select").disabled = busy || awaiting;
  $("level-select").value = String(levelIndex);
  $("level-select").disabled = busy || awaiting;
  $("motion-toggle").textContent = reducedMotion ? "Motion: reduced" : "Motion: on";
  $("motion-toggle").setAttribute("aria-pressed", String(reducedMotion));
  document.body.classList.toggle("reduce-motion", reducedMotion);
  $("motion-notice").hidden = !reducedMotion;

  $("do-both").hidden = mode !== "auto";
  $("do-both").disabled = busy || awaiting || isSolved(state);
  $("manual-explanation").hidden = mode !== "manual";
  $("manual-explanation").textContent = awaiting
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
    return '<span class="held-basket" title="A complete basket of objects"></span>';
  }
  if (action.op === "multiply") {
    return '<span class="held-basket held-basket-double" title="A complete group of objects"></span>';
  }
  const picture = action.kind === "posX" || action.kind === "negX" || action.kind === "posX2"
    ? '<span class="held-sprite' + (action.kind === "negX" ? " held-sprite-pale" :
      action.kind === "posX2" ? " held-sprite-square" : "") +
      '"><i></i><i></i></span>'
    : '<span class="held-weight"></span>';
  return picture + (action.count > 1 ? '<span class="held-count">×' + action.count + '</span>' : "");
}
function roomOperationText(action, side) {
  const roomName = side === "left" ? "west" : "east";
  if (action.op === "square" || action.op === "sqrt") {
    const area = areaArrangement(visible()[side], action.op);
    if (action.op === "square") {
      return area?.symbolic
        ? "The hand builds a matching column in the " + roomName +
          " room, fills the area and presses round sprites into square ones!"
        : "The hand matches the " + area.side + "-weight row with a column and fills a " +
          area.side + " × " + area.side + " square of weights in the " + roomName + " room!";
    }
    return area?.symbolic
      ? "The hand keeps one side of the square in the " + roomName +
        " room and squishes square sprites back into round ones!"
      : "The hand makes a " + area.side + " × " + area.side + " square from " + area.cells +
        " weights, then keeps one side (" + area.side + " weights) in the " + roomName + " room!";
  }
  if (action.op === "divide") return "The hand sorts the " + roomName + " room into " + action.factor + " equal baskets...";
  if (action.op === "multiply") return "The hand makes " + action.factor + " complete copies in the " + roomName + " room...";
  const nouns = action.kind === "posX2" ? (action.count === 1 ? "square sprite" : "square sprites") :
    action.kind === "posX" ? (action.count === 1 ? "sprite" : "sprites") :
    (action.count === 1 ? "weight" : "weights");
  return "The hand " + (action.op === "remove" ? "lifts away " : "places ") +
    action.count + " " + nouns + " in the " + roomName + " room...";
}
/**
 * A visual multiplication array, not a change in the algebra. The hand builds
 * the horizontal row, matching vertical column, then fills the interior.
 * Taking roots reverses this: the completed square loses every cell except
 * the first side. Only the later hand contact commits the actual math.
 */
function showAreaPreview(side, action) {
  const preview = $(side + "-area-preview");
  const arrangement = areaArrangement(visible()[side], action.op);
  if (!arrangement || arrangement.side < 1) return;
  const cells = previewCells(arrangement).map(cell => {
    const symbol = arrangement.symbolic ? "✦" : "●";
    return '<span class="area-cell role-' + cell.role +
      (arrangement.symbolic ? " area-symbolic" : "") +
      '" data-cell-index="' + cell.index + '" data-cell-row="' + cell.row +
      '" data-cell-col="' + cell.col + '" style="--cell-delay:' + cell.delay +
      'ms">' + symbol + '</span>';
  }).join("");
  const demonstration = arrangement.symbolic
    ? (action.op === "square" ? "ROUND → SQUARE" : "SQUARE → ROUND")
    : (action.op === "square"
      ? arrangement.side + " × " + arrangement.side + " → " + arrangement.cells
      : arrangement.cells + " → KEEP " + arrangement.side);
  preview.dataset.operation = action.op;
  preview.dataset.phase = "arranging";
  preview.style.setProperty("--area-side", arrangement.side);
  preview.setAttribute("aria-label", areaMathLabel(arrangement) + ", a " +
    arrangement.side + " by " + arrangement.side + " square");
  preview.innerHTML = '<span class="area-math">' + demonstration + '</span>' +
    '<div class="area-guide"><strong>' + (action.op === "square" ? "ROW → COLUMN → FILL" :
      "FULL SQUARE → KEEP ONE SIDE") + '</strong></div>' +
    '<div class="area-grid" style="--area-side:' + arrangement.side + '">' + cells + '</div>' +
    '<span class="area-extract-label">' + (action.op === "square" ? "SQUARE COMPLETED" :
      "ONE SIDE REMAINS") + '</span>';
  preview.hidden = false;
  $(side + "-chamber").classList.add("area-active");
}
function finishAreaPreview(side, action) {
  const preview = $(side + "-area-preview");
  if (preview.hidden) return;
  preview.dataset.phase = "result";
  $(side + "-chamber").classList.add(action.op === "square" ?
    "area-after-square" : "area-after-sqrt");
}
function clearAreaPreview(side) {
  const preview = $(side + "-area-preview");
  preview.hidden = true;
  preview.innerHTML = "";
  preview.removeAttribute("data-phase");
  const chamber = $(side + "-chamber");
  chamber.classList.remove("area-active", "area-after-square", "area-after-sqrt");
}
function animateClassFrame() {
  return new Promise(resolve => {
    // Requesting a frame ensures the hand starts ABOVE the room before
    // transitioning down, even immediately after the first scene render.
    requestAnimationFrame(() => resolve());
  });
}
async function handAct(side, action, applyAtContact) {
  const hand = $("hand");
  const cargo = $("hand-cargo");
  const target = $(side + "-chamber");
  const scene = $("scene").getBoundingClientRect();
  const items = $(side + "-items").getBoundingClientRect();
  const motion = handMotionPlan(action, reducedMotion);
  const areaEffect = action.op === "square" || action.op === "sqrt"
    ? areaArrangement(visible()[side], action.op) : null;

  // Find the actual geometry of this room at any viewport width. The updated
  // art's fingertips reach ~95% of its box (not 78% as in the original outline).
  // Keep the area diagram beside the hand, not hidden beneath its palm.
  // The hand still reaches the floor and traces the nearby square in view.
  const centreX = items.left + items.width *
    (action.op === "square" || action.op === "sqrt" ? .68 : .5) - scene.left;
  hand.style.left = centreX + "px";
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
  cargo.hidden = !motion.cargoOnApproach;
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
        case "arrange":
          showAreaPreview(side, action);
          hand.classList.add("arranging");
          hand.dataset.phase = action.op === "square" ? "aim" : "reach";
          break;
        case "grip":
          hand.classList.remove("tracking-sprite", "arranging");
          hand.classList.add("grasping");
          hand.dataset.phase = "grip";
          if (reaction) actor.dataset.reactPhase = "caught";
          break;
        case "contact":
          // The only place physical objects change. The hand is still *down*,
          // covering the objects, and the other room has not been touched yet.
          applyAtContact();
          applied = true;
          if (action.op === "square" || action.op === "sqrt") finishAreaPreview(side, action);
          target.classList.add("hand-contact");
          cargo.hidden = motion.placing || action.op === "sqrt";
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
    hand.classList.remove("approaching", "lifting", "grasping", "reaching", "acting", "tracking-sprite", "arranging");
    hand.dataset.phase = "rest";
    target.classList.remove("hand-target", "hand-contact");
    if (actor) {
      actor.classList.remove("sprite-reacting");
      delete actor.dataset.reaction;
      delete actor.dataset.reactPhase;
      actor.style.removeProperty("--dodge-shift");
    }
    hand.style.removeProperty("--hand-chase");
    clearAreaPreview(side);
    cargo.classList.remove("sprite-captured");
    cargo.hidden = true;
    caption.hidden = true;
  }
  // The client must never treat an aborted first-room animation as solved.
  if (!applied) throw new Error("The hand did not complete its contact move.");
}
async function finishTurn() {
  if (isSolved(state)) {
    // The student must be able to SEE the final physical balance before
    // the comic-book retrospective covers the laboratory.
    $("scene").classList.add("solved-scene");
    $("feedback").textContent = state.goal === "square"
      ? "A complete area! The x² sprite matches the squared number of weights."
      : "One sprite, and its matching weights. The rooms are balanced!";
    await sleep(reducedMotion ? 1100 : 1800);
    $("scene").classList.remove("solved-scene");
    showReplay();
  } else {
    $("feedback").textContent = "Still balanced. What should the hand try next?";
  }
}
async function guidedMove() {
  if (busy || isSolved(state)) return;
  const action = currentAction();
  const outcome = perform(state, action, "auto");
  if (!outcome.ok) return notify(outcome.reason);
  const previous = state;
  const next = outcome.state;
  busy = true;
  clearSpeech();
  $("feedback").textContent = operationDescription(action) + "...";
  if (action.op === "divide") {
    groups = { left: action.factor, right: action.factor };
    render();
    await sleep(reducedMotion ? 550 : 1350);
  }
  render();
  await handAct("left", action, () => {
    override = { left: next.left, right: previous.right };
    groups.left = 0;
    render();
  });
  await handAct("right", action, () => {
    // Commit *at contact*, before hand exits and before the success replay.
    state = next;
    override = null;
    groups.right = 0;
    render();
  });
  busy = false;
  render();
  await finishTurn();
}
async function manualMove(side) {
  if (busy || isSolved(state)) return;
  const wasPending = !!state.pending;
  const action = wasPending ? state.pending.action : currentAction();
  const outcome = perform(state, action, "manual", side);
  if (!outcome.ok) return notify(outcome.reason);
  busy = true;
  clearSpeech();
  if (action.op === "divide") {
    groups[side] = action.factor;
    render();
    await sleep(reducedMotion ? 500 : 1100);
  }
  await handAct(side, action, () => {
    state = outcome.state;
    groups[side] = 0;
    render();
  });
  busy = false;
  render();
  if (state.pending) {
    $("feedback").textContent = "One room done. Now perform the matching move in the other room.";
  } else {
    await finishTurn();
  }
}
function startLevel(index) {
  stopReplay();
  replayEntries = [];
  levelIndex = (index + LEVELS.length) % LEVELS.length;
  state = initialState(LEVELS[levelIndex]);
  operation = LEVELS[levelIndex].startingOperation ||
    ((levelIndex === 1 || levelIndex === 4) ? "divide" : "remove");
  kind = "posOne";
  amount = levelIndex === 0 ? 2 : levelIndex === 2 ? 4 : levelIndex === 4 ? 2 : 1;
  factor = levelIndex === 1 ? 3 : levelIndex === 4 ? 5 : 2;
  override = null; groups = { left: 0, right: 0 };
  busy = false;
  // Clear any half-finished visual state when changing levels.
  $("hand").classList.remove("approaching", "reaching", "grasping", "lifting", "acting", "tracking-sprite", "arranging");
  $("hand").style.removeProperty("--hand-chase");
  $("hand-cargo").classList.remove("sprite-captured");
  $("hand").dataset.phase = "rest";
  for (const side of ["left", "right"]) {
    $(side + "-chamber").classList.remove("hand-target", "hand-contact");
    clearAreaPreview(side);
  }
  $("hand-cargo").hidden = true;
  $("action-caption").hidden = true;
  $("scene").classList.remove("solved-scene");
  clearSpeech();
  $("replay-backdrop").hidden = true;
  $("feedback").textContent = "Choose a hand action, then try it on the rooms.";
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
function panelHTML(entry, index, active) {
  const title = index === 0 ? "Before the hand began" : "Move " + index;
  const subtitle = index === 0 ? "Every object has a hidden value..." : operationDescription(entry.action);
  return '<article class="comic-panel ' + (active ? "current-panel" : "old-panel") + '" data-panel="' + index + '">' +
    '<header><strong>' + title + '</strong><small>' + subtitle + '</small></header>' +
    '<div class="mini-stage" id="mini-stage-' + index + '">' +
    miniRooms(index === 0 ? entry.after : entry.after) +
    '</div><div class="panel-footnote">' + (index === 0 ? "The two little rooms start in balance." :
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
      setReplayPaused(true);
    }
    return;
  }
  scheduleReplayFrame();
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
    activeStage.classList.add("reenacting");
  }

  const lines = notebookLines(mini, replayIndex).map(line => line.text);
  replayTimeline = animate && !complete && !reducedMotion
    ? buildWritingTimeline(lines, { opening: replayIndex === 0 })
    : { events: [], durationMs: complete ? 0 : 3900 };
  $("pencil").hidden = true;
  $("writing-status").textContent = complete ? "This panel's algebra is fully written."
    : reducedMotion ? "Complete algebra shown, without animation."
    : replayIndex === 0 ? "The pencil is about to reveal the hidden equation..."
    : "First the hand replays the move, then the pencil writes...";
  $("replay-progress").textContent = "Panel " + (replayIndex + 1) + " of " + replayEntries.length;
  $("replay-back").disabled = replayIndex === 0;
  $("replay-next").disabled = replayIndex >= replayEntries.length - 1;
  $("next-level").textContent = levelIndex === LEVELS.length - 1
    ? "Play from the beginning →" : "Next experiment →";
  $("next-level").disabled = replayIndex !== replayEntries.length - 1 ||
    (!complete && !reducedMotion);
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
$("mode-select").addEventListener("change", event => { mode = event.target.value; render(); });
$("level-select").addEventListener("change", event => startLevel(Number(event.target.value)));
$("motion-toggle").addEventListener("click", () => chooseMotion(!reducedMotion));
$("motion-enable").addEventListener("click", () => chooseMotion(false));
$("undo").addEventListener("click", () => {
  if (busy) return;
  state = undo(state); clearSpeech();
  $("feedback").textContent = "The hand has put everything back.";
  render();
});
$("reset").addEventListener("click", () => startLevel(levelIndex));
$("hint").addEventListener("click", () => setSpeech(LEVELS[levelIndex].suggested, 6200));
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
$("next-level").addEventListener("click", () => startLevel(levelIndex + 1));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("replay-backdrop").hidden) { hideReplay(); return; }
  if (event.altKey && event.key.toLowerCase() === "z" && !busy && $("replay-backdrop").hidden) {
    state = undo(state); render();
  }
});

startLevel(0);

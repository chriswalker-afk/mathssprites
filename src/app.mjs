import {
  LEVELS, TOKEN_KINDS, initialState, visibleRooms, evaluate,
  perform, undo, isSolved, equation, operationDescription, algebraOperation
} from "./engine.mjs";

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const readMedia = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
let reducedMotion = !!readMedia();
let speechTimer = null;
let replayTimer = null;
let replaySerial = 0;
let replayPaused = false;
let replayIndex = 0;
let replayEntries = [];

function currentAction() {
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
    r.posOne && possessiveCount(r.posOne, "weight", "weights"),
    r.negOne && possessiveCount(r.negOne, "balloon", "balloons")
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "no objects";
}
function token(kind, i, mini = false) {
  if (mini) {
    return '<span class="mini-token ' + kind + '" aria-hidden="true"></span>';
  }
  if (kind === "posX" || kind === "negX") {
    return '<span class="token sprite ' + (kind === "posX" ? "sprite-black" : "sprite-white") +
      '" style="--delay:' + (-(i % 11) * .31) + 's" title="' +
      (kind === "posX" ? "A little dark sprite" : "A little pale sprite") + '">' +
      '<span class="sprite-feet"></span><span class="sprite-body">' +
      '<span class="sprite-eyes"><i></i><i></i></span></span></span>';
  }
  if (kind === "posOne")
    return '<span class="token weight" title="A brass weight"><i class="weight-handle"></i><i class="weight-shine"></i></span>';
  return '<span class="token balloon" title="A little floating balloon"><i class="balloon-body"></i><i class="balloon-knot"></i><i class="balloon-string"></i></span>';
}
function allTokens(r, mini = false) {
  let html = "";
  for (const kind of TOKEN_KINDS) {
    for (let i = 0; i < r[kind]; i++) html += token(kind, i, mini);
  }
  return html;
}
function renderRoom(side, r, groupCount) {
  const node = $(side + "-items");
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
      baskets += '<div class="group-basket"><div class="basket-contents">' + allTokens(each) +
        '</div><span class="basket-lip"></span></div>';
    }
    node.innerHTML = '<div class="basket-row" aria-label="' + groupCount +
      ' identical groups">' + baskets + '</div>';
    return;
  }
  node.innerHTML = '<div class="items-grid">' + allTokens(r) + '</div>';
}
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
  const degrees = balance === 0 ? 0 : (balance < 0 ? 3.5 : -3.5);
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
    button.disabled = busy || awaiting || isSolved(state);
    button.setAttribute("aria-pressed", String(button.dataset.operation === operation));
  }
  for (const button of document.querySelectorAll("[data-kind]")) {
    button.classList.toggle("selected", button.dataset.kind === kind);
    button.disabled = busy || awaiting || isSolved(state);
    button.setAttribute("aria-pressed", String(button.dataset.kind === kind));
  }
  const grouped = operation === "divide" || operation === "multiply";
  $("object-picker").hidden = grouped;
  $("amount-label").textContent = grouped ? "3 · How many groups?" : "3 · How many?";
  $("amount-value").textContent = grouped ? factor : amount;
  $("amount-down").disabled = busy || awaiting || isSolved(state) || (grouped ? factor <= 2 : amount <= 1);
  $("amount-up").disabled = busy || awaiting || isSolved(state) || (grouped ? factor >= 5 : amount >= 12);
  $("mode-select").value = mode;
  $("mode-select").disabled = busy || awaiting;
  $("level-select").value = String(levelIndex);
  $("level-select").disabled = busy || awaiting;
  $("motion-toggle").textContent = reducedMotion ? "Motion: reduced" : "Motion: on";
  $("motion-toggle").setAttribute("aria-pressed", String(reducedMotion));
  document.body.classList.toggle("reduce-motion", reducedMotion);

  $("do-both").hidden = mode !== "auto";
  $("do-both").disabled = busy || awaiting || isSolved(state);
  $("manual-explanation").hidden = mode !== "manual";
  $("manual-explanation").textContent = awaiting
    ? "The first room has changed. Select the other room to finish the same action."
    : "Select a room above. Then repeat the same move in the other room.";
  for (const side of ["left", "right"]) {
    const button = $(side + "-action");
    button.hidden = mode !== "manual";
    button.disabled = busy || isSolved(state) || (awaiting && state.pending.first === side);
    button.textContent = awaiting
      ? (state.pending.first === side ? "First move made" : "Match the move here")
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
async function handVisit(side) {
  const hand = $("hand");
  hand.style.left = side === "left" ? "27%" : "73%";
  hand.classList.remove("reaching");
  void hand.offsetWidth;
  hand.classList.add("reaching");
  await sleep(reducedMotion ? 80 : 850);
  hand.classList.remove("reaching");
}
async function finishTurn() {
  if (isSolved(state)) {
    $("feedback").textContent = "The rooms have found their answer. The notebook is opening...";
    await sleep(reducedMotion ? 120 : 600);
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
  busy = true; clearSpeech();
  $("feedback").textContent = operationDescription(action) + "...";
  if (action.op === "divide") {
    groups = { left: action.factor, right: action.factor };
    render();
    await sleep(reducedMotion ? 100 : 900);
  }
  render();
  await handVisit("left");
  override = { left: next.left, right: previous.right };
  groups.left = 0;
  render();
  await sleep(reducedMotion ? 40 : 200);
  await handVisit("right");
  state = next;
  override = null;
  groups = { left: 0, right: 0 };
  busy = false; render();
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
  if (action.op === "divide" && !wasPending) {
    groups[side] = action.factor;
    render();
    await sleep(reducedMotion ? 70 : 800);
  }
  await handVisit(side);
  state = outcome.state;
  groups[side] = 0;
  busy = false;
  render();
  if (state.pending) {
    $("feedback").textContent = "One room done. Make that same move in the other room.";
  } else {
    await finishTurn();
  }
}
function startLevel(index) {
  clearTimeout(replayTimer);
  replaySerial++;
  levelIndex = (index + LEVELS.length) % LEVELS.length;
  state = initialState(LEVELS[levelIndex]);
  operation = (levelIndex === 1 || levelIndex === 4) ? "divide" : "remove";
  kind = "posOne";
  amount = levelIndex === 0 ? 2 : levelIndex === 2 ? 4 : levelIndex === 4 ? 2 : 1;
  factor = levelIndex === 1 ? 3 : levelIndex === 4 ? 5 : 2;
  override = null; groups = { left: 0, right: 0 };
  busy = false;
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
function renderPaper(index) {
  const lines = [];
  for (let i = 0; i <= index; i++) {
    const entry = replayEntries[i];
    if (i === 0) {
      lines.push('<div class="paper-line"><span class="equation-line"> ' + equation(entry.after) + "</span></div>");
    } else {
      lines.push('<div class="paper-line ' + (i === index ? "new-ink" : "") + '">' +
        '<span class="operation-line">' + algebraOperation(entry.action) + '</span>' +
        '<span class="equation-line' + (i === replayEntries.length - 1 ? " answer-line" : "") +
        '">' + equation(entry.after) + "</span></div>");
    }
  }
  $("pencil-lines").innerHTML = lines.join("");
  const pencil = $("pencil");
  pencil.style.top = Math.min(160 + index * 86, 465) + "px";
  pencil.classList.remove("writing");
  void pencil.offsetWidth;
  if (!reducedMotion) pencil.classList.add("writing");
}
function clearReplayTimer() {
  clearTimeout(replayTimer);
  replayTimer = null;
  replaySerial++;
}
function setReplayPaused(value) {
  replayPaused = value;
  $("replay-play").textContent = value ? "Play ▶" : "Pause Ⅱ";
  $("replay-play").setAttribute("aria-label", value ? "Play replay" : "Pause replay");
}
function drawReplay(index, animate = true) {
  clearReplayTimer();
  replayIndex = Math.max(0, Math.min(replayEntries.length - 1, index));
  const serial = replaySerial;
  $("comic-panels").innerHTML = replayEntries.slice(0, replayIndex + 1)
    .map((entry, i) => panelHTML(entry, i, i === replayIndex)).join("");
  const active = $("mini-stage-" + replayIndex);
  if (animate && replayIndex > 0 && !reducedMotion) {
    const entry = replayEntries[replayIndex];
    active.innerHTML = miniRooms(entry.before) + '<svg class="mini-hand-cue" viewBox="0 0 38 55" aria-hidden="true" focusable="false"><path fill="#cfa384" stroke="#6e5140" stroke-width="1.8" d="M13 3 Q16 0 18 5 L21 27 L20 7 Q22 3 25 8 L28 28 L28 13 Q29 10 32 13 L34 30 Q38 37 30 48 L23 53 L11 47 L5 35 Q1 28 5 26 Q9 24 13 32 Z"/></svg>';
    active.classList.add("reenacting");
    setTimeout(() => {
      if (serial !== replaySerial || $("replay-backdrop").hidden) return;
      active.innerHTML = miniRooms(entry.after);
      active.classList.remove("reenacting");
      active.classList.add("action-complete");
    }, 750);
  }
  renderPaper(replayIndex);
  $("replay-progress").textContent = "Panel " + (replayIndex + 1) + " of " + replayEntries.length;
  $("replay-back").disabled = replayIndex === 0;
  $("replay-next").disabled = replayIndex >= replayEntries.length - 1;
  $("next-level").textContent = levelIndex === LEVELS.length - 1 ? "Play from the beginning →" : "Next experiment →";
  const last = replayIndex >= replayEntries.length - 1;
  if (last) {
    setReplayPaused(true);
  } else if (!replayPaused) {
    replayTimer = setTimeout(() => {
      if (serial !== replaySerial || replayPaused || $("replay-backdrop").hidden) return;
      drawReplay(replayIndex + 1, true);
    }, reducedMotion ? 850 : 2800);
  }
  // Keep the newest panel visible on shorter screens.
  const box = $("comic-panels");
  if (box) box.scrollTop = box.scrollHeight;
}
function showReplay() {
  if (!isSolved(state)) return;
  clearReplayTimer();
  replayEntries = [{ after: state.history[0]?.before || { left: state.left, right: state.right } },
    ...state.history.map(h => ({ ...h }))];
  $("replay-backdrop").hidden = false;
  setReplayPaused(false);
  drawReplay(0);
  $("replay-close").focus();
}
function hideReplay() {
  clearReplayTimer();
  $("replay-backdrop").hidden = true;
  $("watch-again")?.focus();
}
function replaySeek(offset) {
  setReplayPaused(true);
  drawReplay(replayIndex + offset, true);
}

$("level-select").innerHTML = LEVELS.map((lvl, i) =>
  '<option value="' + i + '">' + (i + 1) + " · " + lvl.title + "</option>").join("");
for (const button of document.querySelectorAll("[data-operation]")) {
  button.addEventListener("click", () => {
    if (state.pending || busy) return;
    operation = button.dataset.operation;
    if (operation === "divide" && levelIndex === 1) factor = 3;
    if (operation === "divide" && levelIndex === 4) factor = 5;
    render();
  });
}
for (const button of document.querySelectorAll("[data-kind]")) {
  button.addEventListener("click", () => { if (!state.pending && !busy) { kind = button.dataset.kind; render(); } });
}
$("amount-down").addEventListener("click", () => {
  if (state.pending || busy) return;
  if (operation === "multiply" || operation === "divide") factor = Math.max(2, factor - 1);
  else amount = Math.max(1, amount - 1);
  render();
});
$("amount-up").addEventListener("click", () => {
  if (state.pending || busy) return;
  if (operation === "multiply" || operation === "divide") factor = Math.min(5, factor + 1);
  else amount = Math.min(12, amount + 1);
  render();
});
$("do-both").addEventListener("click", guidedMove);
$("left-action").addEventListener("click", () => manualMove("left"));
$("right-action").addEventListener("click", () => manualMove("right"));
$("mode-select").addEventListener("change", event => { mode = event.target.value; render(); });
$("level-select").addEventListener("change", event => startLevel(Number(event.target.value)));
$("motion-toggle").addEventListener("click", () => { reducedMotion = !reducedMotion; render(); });
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
  setReplayPaused(!replayPaused);
  if (!replayPaused) {
    if (replayIndex >= replayEntries.length - 1) drawReplay(0);
    else drawReplay(replayIndex);
  } else clearReplayTimer();
});
$("replay-back").addEventListener("click", () => replaySeek(-1));
$("replay-next").addEventListener("click", () => replaySeek(1));
$("replay-restart").addEventListener("click", () => {
  setReplayPaused(false);
  drawReplay(0);
});
$("replay-skip").addEventListener("click", () => {
  setReplayPaused(true);
  drawReplay(replayEntries.length - 1, false);
});
$("next-level").addEventListener("click", () => startLevel(levelIndex + 1));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("replay-backdrop").hidden) { hideReplay(); return; }
  if (event.altKey && event.key.toLowerCase() === "z" && !busy && $("replay-backdrop").hidden) {
    state = undo(state); render();
  }
});

startLevel(0);

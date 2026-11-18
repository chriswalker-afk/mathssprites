import { LEVELS } from "./engine.mjs";
import {
  WORLDS, WORLD1_CHAPTERS, WORLD1_LEVELS, findWorld1Level,
  isWorld1Unlocked, nextWorld1Level
} from "./worlds.mjs";
import {
  loadProgress, saveProgress, markWorld1Complete,
  loadTeacherSetting, saveTeacherSetting
} from "./progress.mjs";

const $ = id => document.getElementById(id);
let progress = loadProgress();
let teacher = loadTeacherSetting();
let currentScreen = "home";
let playingNumber = null;
const screenNames = ["home","worlds","levels","help","settings"];

function clean(text) {
  return String(text).replace(/[&<>"']/g, ch =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
}
function unlocked(number) {
  return isWorld1Unlocked(number, progress.completed, teacher);
}
function homeAction() {
  const number = unlocked(progress.lastPlayed) ? progress.lastPlayed : 1;
  const played = progress.completed.length > 0;
  $("home-play").textContent = played
    ? (progress.completed.includes(number) ? "Replay level " : "Continue at level ") + number + " →"
    : "Begin your first experiment →";
  $("home-progress").textContent = played
    ? progress.completed.length + " of 20 experiments complete · progress saved on this device"
    : "20 puzzles planned · 5 available now · no sign-in required";
}
function renderWorlds() {
  $("world-cards").innerHTML = WORLDS.map(world => {
    const progressLine = world.available
      ? progress.completed.length + " / 20 levels complete · 5 ready to play"
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
          ? '<button type="button" class="primary-btn" data-screen="levels">Explore levels →</button>'
          : '<span class="soon-lock" aria-label="This world is not available yet">◇ Locked</span>') +
      '</div></div></article>';
  }).join("");
}
function renderLevels() {
  const totalReady = WORLD1_LEVELS.filter(slot => slot.available).length;
  $("level-progress").textContent = progress.completed.length +
    " / 20 completed · " + totalReady + " playable so far";
  $("level-sections").innerHTML = WORLD1_CHAPTERS.map((chapter, index) => {
    const slots = WORLD1_LEVELS.slice(index*4, index*4+4);
    const cards = slots.map(slot => {
      const complete = progress.completed.includes(slot.number);
      const open = unlocked(slot.number);
      const tag = !slot.available ? "Coming soon" : complete ? "Completed" :
        open ? "Ready to play" : "Locked";
      const status = !slot.available ? "upcoming" : complete ? "complete" :
        open ? "ready" : "locked";
      return '<button type="button" class="level-tile status-' + status +
        '" data-level="' + slot.number + '"' + (open ? "" : " disabled") +
        ' aria-label="Level ' + slot.number + ': ' + clean(slot.title) + '. ' + tag + '">' +
        '<span class="tile-number">' + String(slot.number).padStart(2,"0") + '</span>' +
        '<span class="tile-name">' + clean(slot.title) + '</span>' +
        '<span class="tile-status">' +
          (complete ? "✓ " : open ? "✦ " : "◇ ") + tag + '</span>' +
        '</button>';
    }).join("");
    return '<section class="chapter-group" aria-label="Chapter ' + (index+1) + ': ' + clean(chapter.title) + '">' +
      '<div class="chapter-group-heading"><span class="chapter-badge">' +
      String(index+1).padStart(2,"0") + '</span><div><h3>' +
      clean(chapter.title) + '</h3><p>' + clean(chapter.description) +
      '</p></div></div><div class="level-grid">' + cards + '</div></section>';
  }).join("");
  $("teacher-note").hidden = !teacher;
}
function renderSettings() {
  $("teacher-unlock").checked = teacher;
  const motion = $("motion-toggle").textContent;
  $("site-motion").textContent = motion === "Motion: reduced"
    ? "Turn animations on" : "Use reduced motion";
}
function showScreen(name) {
  if (!screenNames.includes(name)) return;
  currentScreen = name;
  playingNumber = null;
  $("site-shell").hidden = false;
  $("game-shell").hidden = true;
  document.body.classList.remove("preview-mode");
  for (const screen of screenNames) $("site-" + screen).hidden = screen !== name;
  if (name === "home") homeAction();
  if (name === "worlds") renderWorlds();
  if (name === "levels") renderLevels();
  if (name === "settings") renderSettings();
  const heading = $("site-" + name).querySelector("h1, h2");
  if (heading) heading.focus({preventScroll:true});
  window.scrollTo?.(0,0);
}
function launch(number) {
  const slot = findWorld1Level(number);
  if (!slot?.level || !unlocked(slot.number)) return false;
  playingNumber = slot.number;
  currentScreen = "game";
  progress = saveProgress({ ...progress, lastPlayed:slot.number });
  $("site-shell").hidden = true;
  $("game-shell").hidden = false;
  document.body.classList.remove("preview-mode");
  window.dispatchEvent(new CustomEvent("mathssprites:launch", {
    detail: { number:slot.number, legacyIndex:slot.legacyIndex, level:slot.level }
  }));
  $("level-title").setAttribute("tabindex", "-1");
  $("level-title").focus({preventScroll:true});
  window.scrollTo?.(0,0);
  return true;
}

$("site-shell").addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.screen) return showScreen(target.dataset.screen);
  if (target.dataset.level) return launch(Number(target.dataset.level));
});
$("home-play").addEventListener("click", () => {
  launch(unlocked(progress.lastPlayed) ? progress.lastPlayed : 1);
});
$("teacher-unlock").addEventListener("change", event => {
  teacher = saveTeacherSetting(event.target.checked);
  renderSettings();
  renderLevels();
});
$("site-motion").addEventListener("click", () => {
  $("motion-toggle").click();
  renderSettings();
});
$("site-back").addEventListener("click", () => showScreen("worlds"));
window.addEventListener("mathssprites:solved", event => {
  if (playingNumber === null || event.detail.number !== playingNumber) return;
  progress = saveProgress(markWorld1Complete(progress, playingNumber));
  renderWorlds();
  renderLevels();
  homeAction();
});
window.addEventListener("mathssprites:leave", event => {
  showScreen(event.detail?.screen === "home" ? "home" : "levels");
});
window.addEventListener("mathssprites:advance", () => {
  if (playingNumber === null) return showScreen("levels");
  const next = nextWorld1Level(playingNumber, progress.completed, teacher);
  if (next) launch(next.number);
  else showScreen("levels");
});

const params = new URLSearchParams(window.location.search);
const preview = params.get("preview");
if (preview !== null) {
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

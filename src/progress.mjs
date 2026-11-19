/** Small, resilient, account-free player-progress store. */
import { WORLD1_LEVELS, isWorld1Unlocked } from "./worlds.mjs";
import {INDEPENDENT_LEVELS,isIndependentUnlocked} from "./independent-levels.mjs";
import {APPRENTICE_LEVELS,isApprenticeUnlocked} from "./apprentice-levels.mjs";

export const PROGRESS_KEY = "mathssprites.progress.v1";
export const TEACHER_KEY = "mathssprites.teacher-unlock.v1";
export const STAGE2_PROGRESS_KEY = "mathssprites.independent-progress.v1";
export const STAGE3_PROGRESS_KEY = "mathssprites.apprentice-progress.v1";

/** Stage 3 uses a NEW key. Its records never rewrite Stages 1 or 2. */
export function normalizeStage3Progress(value){
  const allowed=new Set(APPRENTICE_LEVELS.map(slot=>slot.number));
  const raw=Array.isArray(value?.completed)?value.completed:[];
  const completed=[...new Set(raw.filter(n=>Number.isInteger(n)&&allowed.has(n)))].sort((a,b)=>a-b);
  return {completed,lastPlayed:allowed.has(value?.lastPlayed)?value.lastPlayed:1};
}
export function loadStage3Progress(storage){
  try{return normalizeStage3Progress(JSON.parse((storage??globalThis.localStorage)?.getItem(STAGE3_PROGRESS_KEY)||"null"));}
  catch{return normalizeStage3Progress(null);}
}
export function saveStage3Progress(value,storage){
  const clean=normalizeStage3Progress(value);
  try{(storage??globalThis.localStorage)?.setItem(STAGE3_PROGRESS_KEY,JSON.stringify(clean));}catch{}
  return clean;
}
export function markStage3Complete(value,number){
  const clean=normalizeStage3Progress(value);
  if(!isApprenticeUnlocked(number,clean.completed,true))return clean;
  const completed=[...new Set([...clean.completed,Number(number)])].sort((a,b)=>a-b);
  // Students may finish levels out of order; continue to the adjacent one.
  const next=APPRENTICE_LEVELS.find(slot=>slot.number===Number(number)+1)?.number;
  return normalizeStage3Progress({completed,lastPlayed:next||Number(number)});
}

/** Stage 2 is stored separately: existing Stage 1 progress is never migrated. */
export function normalizeStage2Progress(value) {
  const allowed = new Set(INDEPENDENT_LEVELS.map(x=>x.number));
  const raw = Array.isArray(value?.completed) ? value.completed : [];
  const completed = [...new Set(raw.filter(n=>Number.isInteger(n) && allowed.has(n)))].sort((a,b)=>a-b);
  const lastPlayed = allowed.has(value?.lastPlayed) ? value.lastPlayed : 1;
  return {completed,lastPlayed};
}
export function loadStage2Progress(storage) {
  try {return normalizeStage2Progress(JSON.parse((storage??globalThis.localStorage)?.getItem(STAGE2_PROGRESS_KEY)||"null"));}
  catch {return normalizeStage2Progress(null);}
}
export function saveStage2Progress(value,storage) {
  const clean=normalizeStage2Progress(value);
  try {(storage??globalThis.localStorage)?.setItem(STAGE2_PROGRESS_KEY,JSON.stringify(clean));}catch{}
  return clean;
}
export function markStage2Complete(value,number) {
  const clean=normalizeStage2Progress(value);
  if (!isIndependentUnlocked(number,clean.completed,true)) return clean;
  const completed = [...new Set([...clean.completed,Number(number)])].sort((a,b)=>a-b);
  const next = INDEPENDENT_LEVELS.find(slot=>slot.number===Number(number)+1)?.number;
  return normalizeStage2Progress({completed,lastPlayed:next||Number(number)});
}

export function normalizeProgress(value) {
  const allowed = new Set(WORLD1_LEVELS.filter(x => x.available).map(x => x.number));
  const raw = Array.isArray(value?.completed) ? value.completed : [];
  const completed = [...new Set(raw.filter(n => Number.isInteger(n) && allowed.has(n)))].sort((a,b) => a-b);
  const lastPlayed = allowed.has(value?.lastPlayed) ? value.lastPlayed : 1;
  return { completed, lastPlayed };
}

export function loadProgress(storage) {
  try { return normalizeProgress(JSON.parse((storage ?? globalThis.localStorage)?.getItem(PROGRESS_KEY) || "null")); }
  catch { return normalizeProgress(null); }
}
export function saveProgress(progress, storage) {
  const clean = normalizeProgress(progress);
  try { (storage ?? globalThis.localStorage)?.setItem(PROGRESS_KEY, JSON.stringify(clean)); } catch {}
  return clean;
}
export function markWorld1Complete(progress, number) {
  const clean = normalizeProgress(progress);
  if (!isWorld1Unlocked(number, clean.completed, true)) return clean;
  const completed = [...new Set([...clean.completed, Number(number)])].sort((a,b) => a-b);
  const next = WORLD1_LEVELS.find(slot=>
    slot.available&&slot.number===Number(number)+1)?.number;
  return normalizeProgress({ completed, lastPlayed: next || Number(number) });
}
export function loadTeacherSetting(storage) {
  try { return (storage ?? globalThis.localStorage)?.getItem(TEACHER_KEY) === "on"; } catch { return false; }
}
export function saveTeacherSetting(enabled, storage) {
  try { (storage ?? globalThis.localStorage)?.setItem(TEACHER_KEY, enabled ? "on" : "off"); } catch {}
  return !!enabled;
}

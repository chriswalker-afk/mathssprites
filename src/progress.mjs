/** Small, resilient, account-free player-progress store. */
import { WORLD1_LEVELS, isWorld1Unlocked } from "./worlds.mjs";

export const PROGRESS_KEY = "mathssprites.progress.v1";
export const TEACHER_KEY = "mathssprites.teacher-unlock.v1";

export function normalizeProgress(value) {
  const allowed = new Set(WORLD1_LEVELS.filter(x => x.available).map(x => x.number));
  const raw = Array.isArray(value?.completed) ? value.completed : [];
  const completed = [...new Set(raw.filter(n => Number.isInteger(n) && allowed.has(n)))].sort((a,b) => a-b);
  const lastPlayed = allowed.has(value?.lastPlayed) ? value.lastPlayed : 1;
  return { completed, lastPlayed };
}

export function loadProgress(storage = globalThis.localStorage) {
  try { return normalizeProgress(JSON.parse(storage?.getItem(PROGRESS_KEY) || "null")); }
  catch { return normalizeProgress(null); }
}
export function saveProgress(progress, storage = globalThis.localStorage) {
  const clean = normalizeProgress(progress);
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(clean)); } catch {}
  return clean;
}
export function markWorld1Complete(progress, number) {
  const clean = normalizeProgress(progress);
  if (!isWorld1Unlocked(number, clean.completed, true)) return clean;
  const completed = [...new Set([...clean.completed, Number(number)])].sort((a,b) => a-b);
  const next = WORLD1_LEVELS.find(slot =>
    slot.available && !completed.includes(slot.number) &&
    isWorld1Unlocked(slot.number, completed))?.number;
  return normalizeProgress({ completed, lastPlayed: next || Number(number) });
}
export function loadTeacherSetting(storage = globalThis.localStorage) {
  try { return storage?.getItem(TEACHER_KEY) === "on"; } catch { return false; }
}
export function saveTeacherSetting(enabled, storage = globalThis.localStorage) {
  try { storage?.setItem(TEACHER_KEY, enabled ? "on" : "off"); } catch {}
  return !!enabled;
}

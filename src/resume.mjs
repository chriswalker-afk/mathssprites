/**
 * PR27: one truthful home CTA and the exact stage/level it will open.
 * Stored separately from completion and stars, so selecting a level does not
 * invent progress, downgrade a rating or unlock an unbuilt world.
 */
export const RESUME_KEY="mathssprites.resume.v1";
export const RESUME_STAGE_LIMITS=Object.freeze({guided:20,independent:16,notebook:12});
export const RESUME_STAGE_NUMBERS=Object.freeze({guided:1,independent:2,notebook:3});
export function normalizeResume(value){
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const {stage,number}=value;
  return Object.hasOwn(RESUME_STAGE_LIMITS,stage)&&Number.isInteger(number)&&
    number>=1&&number<=RESUME_STAGE_LIMITS[stage]?{stage,number}:null;
}
export function loadResume(storage){
  try{return normalizeResume(JSON.parse(
    (storage??globalThis.localStorage)?.getItem(RESUME_KEY)||"null"
  ));}catch{return null;}
}
export function saveResume(value,storage){
  const target=normalizeResume(value);
  if(!target)return null;
  try{(storage??globalThis.localStorage)?.setItem(RESUME_KEY,JSON.stringify(target));}
  catch{}
  return target;
}
function validNumber(value,max){
  return Number.isInteger(value)&&value>=1&&value<=max?value:1;
}
function allCompleted(progress,limit){
  const completed=new Set(progress?.completed||[]);
  return completed.size>=limit&&Array.from({length:limit},(_,i)=>i+1)
    .every(number=>completed.has(number));
}
/** Old browsers without a new resume record still retain sensible progress. */
export function resumeDestination(recent,stage1={},stage2={},stage3={}){
  const saved=normalizeResume(recent);
  if(saved)return saved;
  const started3=(stage3?.completed?.length||0)>0||stage3?.lastPlayed>1;
  const started2=(stage2?.completed?.length||0)>0||stage2?.lastPlayed>1;
  if(started3||allCompleted(stage2,16)&&allCompleted(stage1,20))
    return {stage:"notebook",number:validNumber(stage3?.lastPlayed,12)};
  if(started2||allCompleted(stage1,20))
    return {stage:"independent",number:validNumber(stage2?.lastPlayed,16)};
  return {stage:"guided",number:validNumber(stage1?.lastPlayed,20)};
}
export function resumeLabel(target,{played=false,completed=[]}={}){
  const normalized=normalizeResume(target);
  if(!normalized)return "Start playing →";
  if(!played)return "Start Stage 1 · Level 1 →";
  const verb=Array.isArray(completed)&&completed.includes(normalized.number)
    ?"Replay":"Continue";
  return verb+" Stage "+RESUME_STAGE_NUMBERS[normalized.stage]+
    " · Level "+normalized.number+" →";
}

/**
 * PR34 - short, world-independent menu labels. This module has no DOM or
 * storage dependencies, so new worlds can use the same UI without copy forks.
 * Longer mathematical explanations stay in the stage and help content.
 */
export function compactWorldProgress(world,totals={}){
  if(!world?.available)return "COMING SOON";
  const completed=Math.max(0,Number.isInteger(totals.completed)?totals.completed:0);
  const count=Math.max(completed,Number.isInteger(totals.count)?totals.count:0);
  return completed+" / "+count+" complete";
}
export function compactStageProgress(completed,count,stars,maxStars){
  const done=Math.max(0,Number.isInteger(completed)?completed:0);
  const total=Math.max(done,Number.isInteger(count)?count:0);
  const earned=Math.max(0,Number.isInteger(stars)?stars:0);
  const available=Math.max(earned,Number.isInteger(maxStars)?maxStars:0);
  return done+" of "+total+" complete · "+earned+" / "+available+" ★";
}
export function briefStageIntro(stage={}){
  const custom=typeof stage.menuIntro==="string"?stage.menuIntro.trim():"";
  if(custom)return custom;
  const intro=typeof stage.intro==="string"?stage.intro.trim():"";
  if(intro)return intro;
  const methodHints={
    auto:"Choose a move. The hand mirrors it.",
    manual:"Match each move in both rooms.",
    notebook:"Write each operation. Sprites replay your working."
  };
  return methodHints[stage.method]||stage.tagline||"Choose an experiment.";
}

// Short concept-led choice copy, independent of the world-specific level prompts.
export function worldChoiceIntro(world={}){
  return ({workshop:"Use whole sprites and weights to balance both rooms.",opposites:"Cancel opposite objects to make zero pairs.",fractions:"Share and combine exact parts of sprites and weights.",squares:"Build square areas and recover their sides."})[world.id]||world.description||"";
}
export function methodChoiceIntro(stage={}){
  return ({auto:"Choose one move. The hand mirrors it.",manual:"Choose each side yourself to restore balance.",notebook:"Use the maths editor, then watch your moves replay."})[stage.method]||briefStageIntro(stage);
}

/**
 * World 1, Stage 3 — Algebra Apprentice.
 * Twelve notebook-first, strictly whole-number, physically representable
 * linear equations. Each accepted notebook line must map to ONE engine move.
 */
import {WORLD1_OPERATIONS} from "./worlds.mjs";

export const APPRENTICE_CHAPTERS=Object.freeze([
 {title:"Written with You",description:"Learn to show the balancing operation on paper, then gradually work without prompts."},
 {title:"Choose the Route",description:"Decide which written transformation to make, even when more than one method works."},
 {title:"Apprentice Challenges",description:"Work independently with sprites on both sides and reversed equations."}
]);

const raw=[
 // Chapter 1: backwards fading — analogous model -> first-move cue -> last-move cue -> independent.
 {id:"apprentice-01",title:"A written beginning",
  prompt:"This time the equation comes first. Use the notebook to isolate the mystery sprite.",
  left:{posX:1,posOne:3},right:{posOne:8},solution:5,
  scaffold:{kind:"model",heading:"Watch a different example",
    text:"Here is a different example: x + 2 = 6 becomes x = 4 after removing two weights from BOTH sides. The hand could act that out. Now solve your own equation."},
  suggested:"What can you remove equally from both sides so the sprite stands alone?"},
 {id:"apprentice-02",title:"One equal group",
  prompt:"The written equation contains identical sprites. What could happen to both sides?",
  left:{posX:2},right:{posOne:12},solution:6,
  scaffold:{kind:"first",heading:"Your first move",
    text:"Start by thinking about equal groups. What operation would turn the pair of sprites into one sprite? Write the new equation."},
  suggested:"How many equal baskets would give you one sprite in the left chamber?"},
 {id:"apprentice-03",title:"Think about the finish",
  prompt:"Two kinds of move are needed. Plan how your final equation will show a single sprite.",
  left:{posX:2,posOne:4},right:{posOne:12},solution:4,
  scaffold:{kind:"last",heading:"Plan the final step",
    text:"At the end, once the loose weights have been cleared, you can share complete groups. Decide for yourself what to remove first."},
  suggested:"Before grouping, do the loose weights match the groups of sprites?"},
 {id:"apprentice-04",title:"Your first solo page",
  prompt:"There are no written clues this time. Choose a balanced strategy and record each line.",
  left:{posX:3,posOne:6},right:{posOne:21},solution:5,
  scaffold:{kind:"none"},
  suggested:"You can clear loose weights first, or group the complete contents if they share a common factor."},

 // Chapter 2: multiple routes, capacity and equations presented in reverse.
 {id:"apprentice-05",title:"Two ways through",
  prompt:"Can you find a route through this equation? There is more than one valid method.",
  left:{posX:3,posOne:6},right:{posOne:18},solution:4,
  scaffold:{kind:"none"},
  suggested:"Consider dividing both rooms first, or clearing the extra weights first."},
 {id:"apprentice-06",title:"The careful remainder",
  prompt:"Choose a sensible order of operations; not every grouping works with whole objects.",
  left:{posX:4,posOne:5},right:{posOne:25},solution:5,
  scaffold:{kind:"none"},
  suggested:"Which complete set of weights must go before the rooms can be shared into four equal baskets?"},
 {id:"apprentice-07",title:"Reading from the east",
  prompt:"The equation faces the other way round. Keep the sides in their original places.",
  left:{posOne:19},right:{posX:2,posOne:9},solution:5,
  scaffold:{kind:"none"},
  suggested:"The unknown can stay on the right side. Clear shared weights before grouping."},
 {id:"apprentice-08",title:"Fraction-free strategy",
  prompt:"This equation looks crowded. Choose operations that never cut a sprite or weight into fractions.",
  left:{posX:3,posOne:8},right:{posOne:23},solution:5,
  scaffold:{kind:"none"},
  suggested:"A fraction-free route exists by removing the right amount of loose weight before making three groups."},

 // Chapter 3: two-sided x, reversed destination, multi-operation and a final challenge.
 {id:"apprentice-09",title:"A mystery next door",
  prompt:"Sprites are on BOTH sides. Find a series of balanced written equations.",
  left:{posX:2,posOne:3},right:{posX:1,posOne:8},solution:5,
  scaffold:{kind:"none"},
  suggested:"How can you clear equal mystery sprites without changing the balance?"},
 {id:"apprentice-10",title:"The east keeps the sprite",
  prompt:"The final sprite should stay on the right. Find a route that never moves a term through the equals sign.",
  left:{posX:1,posOne:13},right:{posX:3,posOne:3},solution:5,
  scaffold:{kind:"none"},
  suggested:"Remove identical sprites from both sides, then remove equal weights. Share into whole baskets."},
 {id:"apprentice-11",title:"Many moves, one balance",
  prompt:"Your notebook must show every step. Look for a sequence that leaves one sprite.",
  left:{posX:4,posOne:7},right:{posX:2,posOne:17},solution:5,
  scaffold:{kind:"none"},
  suggested:"Clear the shared sprites before the weights, then compare the remaining groups."},
 {id:"apprentice-12",title:"The final apprentice test",
  prompt:"A challenging equation, several possible routes and no prompts. Let the sprites follow YOUR working.",
  left:{posX:5,posOne:17},right:{posX:2,posOne:29},solution:4,
  scaffold:{kind:"none"},
  suggested:"You can remove shared sprites first. Some valid routes may add weights to make new groups possible."}
];

if(raw.length!==12||new Set(raw.map(level=>level.id)).size!==12)
 throw new Error("Stage 3 must contain exactly twelve distinct puzzles");

export const APPRENTICE_LEVELS=Object.freeze(raw.map((item,i)=>{
 const chapterIndex=Math.floor(i/4),number=i+1;
 const level=Object.freeze({...item,number,chapter:String(chapterIndex+1).padStart(2,"0")+
  " · "+APPRENTICE_CHAPTERS[chapterIndex].title,
  quantityMode:"positive",lockPositive:true,allowedOperations:WORLD1_OPERATIONS});
 return Object.freeze({number,id:level.id,title:level.title,chapterIndex,
  level,available:true,legacyIndex:0});
}));
export function findApprenticeLevel(number){
 return APPRENTICE_LEVELS.find(slot=>slot.number===Number(number))||null;
}
export function isApprenticeUnlocked(number,completed=[],teacher=false){
 const slot=findApprenticeLevel(number);
 return !!slot?.available; // All implemented notebook levels are open to students.
}
export function nextApprenticeLevel(number,completed=[],teacher=false){
 const next=findApprenticeLevel(Number(number)+1);
 return next&&isApprenticeUnlocked(next.number,completed,teacher)?next:null;
}

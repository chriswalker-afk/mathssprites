/**
 * World 1 · Stage 2: twenty Independent Balance experiments.
 * Students perform the SAME operation separately in each physical chamber.
 * The existing engine's pending transaction prevents one-sided commits.
 *
 * Scope matches Stage 1 exactly: positive whole objects and solutions,
 * add/remove/multiply/divide, no signed tokens, fractions or square tools.
 */
import {WORLD1_OPERATIONS} from "./worlds.mjs";

export const INDEPENDENT_CHAPTERS = Object.freeze([
  {title:"Your First Moves",description:"Make one change, watch the balance tip, and restore it in the opposite chamber."},
  {title:"Sharing Fairly",description:"Divide the contents of each room into the same number of complete baskets."},
  {title:"A Sequence of Moves",description:"Choose a sequence and match every step in both rooms."},
  {title:"The Independent Experimenter",description:"Handle sprites on both sides and find routes that avoid unnecessary moves."},
  {title:"Inside the Crates",description:"Choose when to divide sealed groups, open them and use loose objects."}
]);

const rawLevels = [
  // Chapter 1 — isolate a single sprite by removing equal weights.
  {id:"independent-01",title:"Two hands, two rooms",
    prompt:"The hand is yours. Remove the same two weights from each room, one room at a time.",
    left:{posX:1,posOne:2},right:{posOne:7},solution:5,
    startingOperation:"remove",startingKind:"posOne",startingAmount:2,
    suggested:"Choose Remove, Weight, 2. Visit the west room, then the east room."},
  {id:"independent-02",title:"A matching handful",
    prompt:"The sprite has four extra weights. Which two hand visits will clear them?",
    left:{posX:1,posOne:4},right:{posOne:10},solution:6,
    startingOperation:"remove",startingKind:"posOne",startingAmount:4,
    suggested:"Removing four weights in one room tips the balance. Match that move in the other room."},
  {id:"independent-03",title:"Start in the east",
    prompt:"The unknown is in the east chamber this time. You can start with either room.",
    left:{posOne:9},right:{posX:1,posOne:3},solution:6,
    startingOperation:"remove",startingKind:"posOne",startingAmount:3,
    suggested:"Try removing three weights from the east first, then make the same change in the west."},
  {id:"independent-04",title:"The careful carrier",
    prompt:"Seven weights are keeping the sprite company. Make both visits without forgetting a room.",
    left:{posX:1,posOne:7},right:{posOne:12},solution:5,
    startingOperation:"remove",startingKind:"posOne",startingAmount:7,
    suggested:"Make one removal of seven weights in each chamber, separately."},

  // Chapter 2 — identical basket counts in BOTH rooms, never fractional.
  {id:"independent-05",title:"Two baskets, twice",
    prompt:"Two sprites face eight weights. Choose the same two baskets in each room.",
    left:{posX:2},right:{posOne:8},solution:4,
    startingOperation:"divide",startingFactor:2,
    suggested:"Split the west contents into two whole baskets, then do the same in the east."},
  {id:"independent-06",title:"Three matching groups",
    prompt:"Three identical groups belong in each room. Count before you share.",
    left:{posX:3},right:{posOne:12},solution:4,
    startingOperation:"divide",startingFactor:3,
    suggested:"Choose three groups. Each chamber must keep one of its own equal groups."},
  {id:"independent-07",title:"Four-room rhythm",
    prompt:"Four sprites face twenty weights. Give each room four matching baskets.",
    left:{posX:4},right:{posOne:20},solution:5,
    startingOperation:"divide",startingFactor:4,
    suggested:"Four complete groups can be made in each room without cutting any objects."},
  {id:"independent-08",title:"Five careful baskets",
    prompt:"The sprites are crowded. Keep one of five identical baskets from each room.",
    left:{posX:5},right:{posOne:20},solution:4,
    startingOperation:"divide",startingFactor:5,
    suggested:"Split five sprites into five baskets and twenty weights into five baskets."},

  // Chapter 3 — independent steps may be reordered where mathematically valid.
  {id:"independent-09",title:"Clear and share",
    prompt:"You will need two different operations. Remember to match each move before starting the next.",
    left:{posX:2,posOne:3},right:{posOne:11},solution:4,
    startingOperation:"remove",startingKind:"posOne",startingAmount:3,
    suggested:"Remove three weights from EACH room. Then divide EACH room into two groups."},
  {id:"independent-10",title:"Share, then tidy",
    prompt:"Everything can be shared into three baskets first. What remains to clear?",
    left:{posX:3,posOne:6},right:{posOne:18},solution:4,
    startingOperation:"divide",startingFactor:3,
    suggested:"Make three complete groups in each chamber, then remove the two extra weights in each."},
  {id:"independent-11",title:"The fourth basket",
    prompt:"Four sprites are accompanied by five weights. Think about your order of moves.",
    left:{posX:4,posOne:5},right:{posOne:21},solution:4,
    startingOperation:"remove",startingKind:"posOne",startingAmount:5,
    suggested:"Clear the five loose weights from BOTH rooms before sharing the remaining four sprites."},
  {id:"independent-12",title:"No pieces, please",
    prompt:"Some basket choices would cut weights into pieces. Make the rooms divisible first.",
    left:{posX:3,posOne:7},right:{posOne:22},solution:5,
    startingOperation:"divide",startingFactor:3,
    suggested:"Dividing now would make fractions. Remove seven weights from each room, then share in three."},

  // Chapter 4 — sprites live in both chambers; clever order can avoid limits.
  {id:"independent-13",title:"A sprite next door",
    prompt:"The mysterious residents are on BOTH sides. Subtract matching sprites before the weights.",
    left:{posX:2,posOne:2},right:{posX:1,posOne:6},solution:4,
    startingOperation:"remove",startingKind:"posX",startingAmount:1,
    suggested:"Remove one sprite from each room, then two weights from each."},
  {id:"independent-14",title:"East keeps the mystery",
    prompt:"There are more sprites in the east. Can you finish with one there instead of one in the west?",
    left:{posX:1,posOne:11},right:{posX:3,posOne:1},solution:5,
    startingOperation:"remove",startingKind:"posX",startingAmount:1,
    suggested:"Remove a shared sprite; then remove one weight from each room and divide both rooms into two."},
  {id:"independent-15",title:"Two travelling sprites",
    prompt:"Two sprites appear in both rooms. Find a careful sequence to isolate just one.",
    left:{posX:4,posOne:3},right:{posX:2,posOne:13},solution:5,
    startingOperation:"remove",startingKind:"posX",startingAmount:2,
    suggested:"Remove two sprites from each chamber, remove three weights from each, then share in two."},
  {id:"independent-16",title:"The balancing specialist",
    prompt:"The difference in weights is too big for one handful. Which change makes a simpler experiment first?",
    left:{posX:4,posOne:14},right:{posX:2,posOne:24},solution:5,
    startingOperation:"divide",startingFactor:2,
    suggested:"All four counts can be split into two baskets. Share first, then remove shared sprites and loose weights."},
  // Chapter 5 — sealed groups become a general choice, not a one-off puzzle.
  {id:"independent-17",title:"Two sealed families",
    prompt:"Two identical sealed groups are waiting. Choose whether to open or share them.",
    left:{crates:{count:2,contents:{posX:1,posOne:1}}},right:{posOne:8},solution:3,
    groupedPrototype:true,
    suggested:"Both arrangements must keep the same value. You can work with whole groups or open them."},
  {id:"independent-18",title:"Three sealed families",
    prompt:"There are three identical groups. Can you find the weight of one sprite?",
    left:{crates:{count:3,contents:{posX:1,posOne:2}}},right:{posOne:21},solution:5,
    groupedPrototype:true,
    suggested:"Look for complete equal groups or let the sprites out first."},
  {id:"independent-19",title:"The extra pair",
    prompt:"Two groups have some weights standing outside. Decide what should stay together.",
    left:{crates:{count:2,contents:{posX:1,posOne:3}},posOne:2},right:{posOne:16},solution:4,
    groupedPrototype:true,
    suggested:"Loose weights and sealed crates are different things. Keep every change balanced."},
  {id:"independent-20",title:"A sprite outside",
    prompt:"One sprite is not in either crate, and there are sprites in the opposite room.",
    left:{crates:{count:2,contents:{posX:1,posOne:3}},posX:1},right:{posX:2,posOne:10},solution:4,
    groupedPrototype:true,
    suggested:"Some sprites are loose. The sealed groups may need opening before they can meet the others."}
];

if (rawLevels.length !== 20 || new Set(rawLevels.map(x=>x.id)).size !== 16)
  throw new Error("Stage 2 requires exactly twenty distinct puzzles.");

export const INDEPENDENT_LEVELS = Object.freeze(rawLevels.map((raw, i)=>{
  const number=i+1,chapterIndex=Math.floor(i/4);
  const level=Object.freeze({...raw,number,
    chapter:String(chapterIndex+1).padStart(2,"0")+" · "+INDEPENDENT_CHAPTERS[chapterIndex].title,
    quantityMode:"positive",lockPositive:true,allowedOperations:raw.groupedPrototype?[...WORLD1_OPERATIONS,"unpack"]:WORLD1_OPERATIONS});
  return Object.freeze({number,id:level.id,title:level.title,
    chapterIndex,available:true,level,legacyIndex:0});
}));
export function findIndependentLevel(number){
  return INDEPENDENT_LEVELS.find(slot=>slot.number===Number(number))||null;
}
export function isIndependentUnlocked(number,completed=[],teacher=false){
  const slot=findIndependentLevel(number);
  if (!slot?.available) return false;
  return true; // All implemented Stage 2 levels open by default.
}
export function nextIndependentLevel(number,completed=[],teacher=false){
  const next=findIndependentLevel(Number(number)+1);
  return next && isIndependentUnlocked(next.number,completed,teacher)?next:null;
}

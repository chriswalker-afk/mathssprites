/**
 * Public curriculum: 20 fully playable positive whole-number balances.
 *
 * The original 13 advanced experiments live separately in engine.mjs. Keep
 * them intact for authoring previews, regression tests and later worlds.
 * Every World 1 action is performed on genuine whole objects; square/root and
 * signed objects never become legal by selecting a level.
 */
import { LEVELS } from "./engine.mjs";

export const WORLD1_OPERATIONS = Object.freeze(["remove", "add", "divide", "multiply"]);
export const WORLD1_CHAPTERS = Object.freeze([
  { title:"Clearing the Room",
    description:"Remove equal weights from both chambers." },
  { title:"Equal Groups",
    description:"Share both rooms into complete, equal baskets." },
  { title:"Two-Step Experiments",
    description:"Decide when to clear objects and when to share." },
  { title:"Across the Hall",
    description:"Resolve sprites living in both rooms." },
  { title:"Master of the Balance",
    description:"Find efficient paths, reverse the rooms and try clever additions." }
]);

// The five shipped PR14 levels stay unchanged, including their saved IDs and
// mathematical contents. Levels 6-20 add genuine new combinations and choices.
const firstFive = [
  { ...LEVELS[0], title:"One little resident" },
  { id:"clearing-02",title:"Three weights in the way",
    prompt:"One dark sprite is sharing a room with three weights. Can you leave it alone?",
    left:{posX:1,posOne:3},right:{posOne:7},solution:4,
    startingOperation:"remove",startingKind:"posOne",startingAmount:3,
    suggested:"Remove the same three weights from both rooms." },
  { id:"clearing-03",title:"A heavier mystery",
    prompt:"Keep the rooms balanced while clearing the weights beside the sprite.",
    left:{posX:1,posOne:5},right:{posOne:9},solution:4,
    startingOperation:"remove",startingKind:"posOne",startingAmount:5,
    suggested:"Try taking five weights from each chamber." },
  { id:"clearing-04",title:"Clear the crowded chamber",
    prompt:"There are more weights this time. Which equal move will isolate the sprite?",
    left:{posX:1,posOne:7},right:{posOne:12},solution:5,
    startingOperation:"remove",startingKind:"posOne",startingAmount:7,
    suggested:"Remove seven weights from both rooms." },
  { ...LEVELS[1] }
];

const newLevels = [
  // Chapter 2: gradually remove the preselected group count.
  { id:"baskets-02",title:"Two tidy baskets",
    prompt:"Every dark sprite needs the same number of weights. Can two equal baskets help?",
    left:{posX:2},right:{posOne:10},solution:5,
    startingOperation:"divide",startingFactor:2,
    suggested:"Look for the same number of whole groups in both chambers." },
  { id:"baskets-04",title:"Four faithful groups",
    prompt:"The sprites have collected in a larger crowd. How many equal groups could work?",
    left:{posX:4},right:{posOne:16},solution:4,
    startingOperation:"divide",startingFactor:2,
    suggested:"Count the sprites first. Every basket must contain exactly the same things." },
  { id:"baskets-05",title:"Five crowded baskets",
    prompt:"There are lots of weights, but all the pieces must stay whole. Choose the baskets yourself.",
    left:{posX:5},right:{posOne:25},solution:5,
    startingOperation:"divide",startingFactor:2,
    suggested:"The two rooms must split into the same number of complete baskets." },
  // Chapter 3: a two-action chain; later puzzles permit competing orders.
  { id:"two-step-09",title:"Clear, then share",
    prompt:"Several sprites are hiding among the weights. Work out which kind of move must come first.",
    left:{posX:2,posOne:3},right:{posOne:11},solution:4,
    startingOperation:"remove",startingAmount:3,
    suggested:"Clear the three loose weights, then look for equal groups." },
  { id:"two-step-10",title:"Share before clearing?",
    prompt:"Both rooms are made of groups. Can you find more than one order of operations?",
    left:{posX:3,posOne:6},right:{posOne:18},solution:4,
    startingOperation:"divide",startingFactor:3,
    suggested:"Every count is a multiple of three. You could share first or remove weights first." },
  { id:"two-step-11",title:"The crowded shelves",
    prompt:"Some things can be put into equal groups immediately; others can be cleared first. Choose a route.",
    left:{posX:4,posOne:8},right:{posOne:24},solution:4,
    startingOperation:"remove",startingAmount:1,
    suggested:"Either clear the extra weights or find a common number of complete baskets." },
  { id:"two-step-12",title:"An uneven start",
    prompt:"Some attempted baskets would cut the weights into pieces. What should happen first?",
    left:{posX:3,posOne:7},right:{posOne:22},solution:5,
    startingOperation:"divide",startingFactor:2,
    suggested:"First remove the weights that prevent an equal division, then share the sprites." },
  // Chapter 4: sprites appear on BOTH sides; left/right orientation also flips.
  { id:"across-13",title:"A visitor next door",
    prompt:"A dark sprite wandered across the hall. Can the hand clear a matching resident from each room?",
    left:{posX:2,posOne:3},right:{posX:1,posOne:7},solution:4,
    startingOperation:"remove",startingKind:"posX",startingAmount:1,
    suggested:"Start by removing one dark sprite from each room." },
  { id:"across-14",title:"The sprite on the right",
    prompt:"There are more sprites in the east room. The final sprite does not need to end up on the left.",
    left:{posX:1,posOne:9},right:{posX:3,posOne:1},solution:4,
    startingOperation:"remove",startingKind:"posX",startingAmount:1,
    suggested:"Clear a sprite from both rooms, then isolate the sprites in the east." },
  { id:"across-15",title:"Two visitors too many",
    prompt:"Two sprites in each chamber could be taken away together. What else must happen?",
    left:{posX:4,posOne:3},right:{posX:2,posOne:13},solution:5,
    startingOperation:"remove",startingKind:"posX",startingAmount:1,
    suggested:"Remove matching sprites in both rooms until only one has sprites, then compare weights." },
  { id:"across-16",title:"The busy corridor",
    prompt:"Dark sprites live in both rooms, and there is more than one sort of work to do.",
    left:{posX:5,posOne:4},right:{posX:2,posOne:16},solution:4,
    startingOperation:"remove",startingKind:"posOne",startingAmount:1,
    suggested:"Remove equal sprites from both rooms. Then try clearing weights before sharing." },
  // Chapter 5: multi-route puzzles, reversals, carrying limit and strategic add.
  { id:"master-17",title:"A shortcut through baskets",
    prompt:"Can you reach the lone sprite by two DIFFERENT routes? Think before you move anything.",
    left:{posX:4,posOne:6},right:{posX:2,posOne:14},solution:4,
    startingOperation:"divide",startingFactor:2,
    suggested:"Every initial count can split into two complete baskets. Compare that with removing sprites first." },
  { id:"master-18",title:"The other way round",
    prompt:"The east has more sprites than the west. Choose which room should keep the final sprite.",
    left:{posX:2,posOne:7},right:{posX:3,posOne:2},solution:5,
    startingOperation:"remove",startingKind:"posX",startingAmount:1,
    suggested:"It is fine for the final sprite to be in the east chamber. Look for shared sprites to remove." },
  { id:"master-19",title:"The sealed brackets",
    prompt:"Two transparent crates each hold a sprite and three weights. Can you solve without unpacking both at once? Try unpacking first OR dividing the whole rooms first.",
    left:{crates:{count:2,contents:{posX:1,posOne:3}}},
    right:{posOne:14},solution:4,
    groupedPrototype:true,startingOperation:"divide",startingFactor:2,
    allowedOperations:[...WORLD1_OPERATIONS,"unpack"],
    suggested:"Unpack the crates to see 2x + 6 = 14, OR divide the two complete crates and fourteen weights into two baskets first." },
  { id:"master-20",title:"The master experiment",
    prompt:"The heaviest puzzle yet. You can remove at most twelve weights in a move. Sometimes adding something helps!",
    left:{posX:5,posOne:17},right:{posX:2,posOne:29},solution:4,
    startingOperation:"remove",startingKind:"posOne",startingAmount:1,
    suggested:"Clear the two shared sprites. Could adding ONE weight to both rooms let you make three complete baskets?" }
];

const campaign = [...firstFive, ...newLevels];
if (campaign.length !== 20 || new Set(campaign.map(level => level.id)).size !== 20)
  throw new Error("World 1 must define exactly 20 unique levels.");
export const WORLD1_LEVELS = Object.freeze(campaign.map((raw, i) => {
  const number = i + 1;
  const chapterIndex = Math.floor(i / 4);
  const level = Object.freeze({
    ...raw, number, chapter: String(chapterIndex + 1).padStart(2,"0") +
      " · " + WORLD1_CHAPTERS[chapterIndex].title,
    quantityMode:"positive", lockPositive:true,
    allowedOperations:raw.allowedOperations||WORLD1_OPERATIONS
  });
  return Object.freeze({
    number,id:level.id,title:level.title,chapterIndex,available:true,
    level,legacyIndex:number === 5 ? 1 : 0
  });
}));

export const WORLDS = Object.freeze([
  { id:"workshop",number:1,title:"The Balance Workshop",
    subtitle:"Positive whole numbers",theme:"warm",
    description:"Meet the black sprites and discover how to keep both rooms balanced.",
    available:true },
  { id:"opposites",number:2,title:"The Opposite Chambers",
    subtitle:"Negative numbers",theme:"pale",
    description:"White sprites and balloons make remarkable zero pairs.",available:true },
  { id:"fractions",number:3,title:"The Fraction Workshop",
    subtitle:"Fractions",theme:"glass",
    description:"A tiny piece can finally have its own mathematical value.",available:false },
  { id:"squares",number:4,title:"The Square Laboratory",
    subtitle:"Squares and square roots",theme:"square",
    description:"Build squares inside the chamber, then work backwards.",available:false }
]);

export function findWorld1Level(number) {
  return WORLD1_LEVELS.find(item => item.number === Number(number)) || null;
}
export function isWorld1Unlocked(number, completed = [], teacher = false) {
  const slot = findWorld1Level(number);
  if (!slot?.available) return false;
  // All implemented World 1 levels are selectable by every student.
  // Progress and teacher access do not gate the campaign.
  return true;
}
export function nextWorld1Level(number, completed = [], teacher = false) {
  const slot = findWorld1Level(Number(number) + 1);
  return slot && isWorld1Unlocked(slot.number, completed, teacher) ? slot : null;
}

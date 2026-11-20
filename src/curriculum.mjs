/**
 * Curriculum planning catalogue for the 108 SHIPPED campaign levels.
 *
 * This module is for curriculum authors, reviewers and diagnostics. It is NOT
 * imported by the student game or menus: a difficulty or reference route must
 * never become a preselected control or a hint that gives away the answer.
 *
 * Difficulty is an authored 1–5 demand BAND, not a star rating or an estimate
 * of a student's attainment. A chapter can introduce a new skill at a lower
 * level than the previous chapter's final challenge.
 */
import {WORLD1_LEVELS} from "./worlds.mjs";
import {INDEPENDENT_LEVELS} from "./independent-levels.mjs";
import {APPRENTICE_LEVELS} from "./apprentice-levels.mjs";
import {OPPOSITE_LEVELS} from "./opposite-levels.mjs";
import {OPTIMAL_MOVES} from "./star-ratings.mjs";

const skill=(label,strand,canDo,prerequisites=[])=>Object.freeze({
  label,strand,canDo,prerequisites:Object.freeze([...prerequisites])
});

export const CURRICULUM_SKILLS=Object.freeze({
  "balance-invariance":skill("Maintaining equality","equivalence",
    "Explain why making the same change in both rooms preserves the balance"),
  "remove-units":skill("Subtracting equal constants","linear",
    "Isolate a sprite by removing equal numbers of weights",["balance-invariance"]),
  "equal-groups":skill("Whole equal groups","linear",
    "Divide both sides into the same number of complete groups",["balance-invariance"]),
  "two-step":skill("Combining transformations","linear",
    "Choose and perform a chain of valid equal changes",["remove-units","equal-groups"]),
  "fraction-avoidance":skill("Whole-number division judgement","strategy",
    "Recognise when grouping would cut an object into pieces and choose another order",["equal-groups"]),
  "variables-both-sides":skill("Sprites on both sides","linear",
    "Remove equal unknowns from both sides without moving terms across the equals sign",["balance-invariance"]),
  "reverse-orientation":skill("Either side may hold the mystery","linear",
    "Solve an equivalent equation with the remaining sprite on the right",["balance-invariance"]),
  "strategy-choice":skill("Choosing an efficient route","strategy",
    "Compare valid transformation sequences before using the hand",["two-step"]),
  "sealed-groups":skill("Keeping or opening a sealed group","representation",
    "Treat a crate as a single intact group or open it without changing its value",["equal-groups"]),
  "matched-hands":skill("Two independent hand visits","equivalence",
    "Complete the same operation in each chamber before calling the equation balanced",["balance-invariance"]),
  "written-operations":skill("Writing equivalent equations","communication",
    "Record the operation on both sides and interpret the calculated next equation",["balance-invariance"]),
  "opposite-units":skill("Negative-unit objects","signed",
    "Interpret balloons as negative one and weights as positive one",["balance-invariance"]),
  "unit-zero-pairs":skill("Zero pairs of constants","signed",
    "Create and recognise cancelling positive and negative units",["opposite-units"]),
  "opposite-sprites":skill("Negative-variable objects","signed",
    "Interpret white sprites as negative x and dark sprites as positive x",["balance-invariance"]),
  "sprite-zero-pairs":skill("Zero pairs of unknowns","signed",
    "Cancel matching dark and white sprites while preserving equality",["opposite-sprites"]),
  "signed-sequences":skill("Combining signed cancellations","signed",
    "Use more than one kind of zero pair across a valid sequence",["unit-zero-pairs","sprite-zero-pairs"]),
  "signed-groups":skill("Grouping after signed cancellation","signed",
    "Create whole equal groups after simplifying signed objects",["signed-sequences","equal-groups"]),
  "subtract-negatives":skill("Subtracting a negative","signed",
    "Distinguish subtracting a balloon from subtracting a positive weight",["opposite-units"]),
  "signed-notation":skill("Accurate written signed operations","communication",
    "Write operations such as adding negative x or subtracting negative four",["written-operations","opposite-units"])
});

export const DIFFICULTY_BANDS=Object.freeze({
  1:"Foundation",
  2:"Developing",
  3:"Connecting",
  4:"Strategic",
  5:"Mastery"
});

const chapter=(title,objective,skills)=>Object.freeze({
  title,objective,skills:Object.freeze([...skills])
});

/**
 * Exactly four levels per chapter. Outcomes describe learning, not a specific
 * first move, so these definitions can survive later rebalance of the numbers.
 */
export const CURRICULUM_CHAPTERS=Object.freeze({
  workshop:Object.freeze({
    guided:Object.freeze([
      chapter("Clearing the Room","Use equal subtraction to isolate one unknown",
        ["balance-invariance","remove-units"]),
      chapter("Equal Groups","Find and create the same number of whole groups in each room",
        ["equal-groups"]),
      chapter("Two-Step Experiments","Choose the order of subtraction and division",
        ["two-step","fraction-avoidance"]),
      chapter("Across the Hall","Simplify equations with unknowns on both sides",
        ["variables-both-sides","reverse-orientation","two-step"]),
      chapter("Master of the Balance","Compare routes, manage physical constraints and intact groups",
        ["strategy-choice","fraction-avoidance","sealed-groups"]),
      chapter("The Crate Workshop","Choose when identical sealed groups should stay together and when opening them reveals a useful balance route",
        ["sealed-groups","two-step","strategy-choice"])
    ]),
    independent:Object.freeze([
      chapter("Your First Moves","Repeat one identical mathematical action in two separate hand visits",
        ["matched-hands","remove-units"]),
      chapter("Sharing Fairly","Repeat equal-group division in both chambers",
        ["matched-hands","equal-groups"]),
      chapter("A Sequence of Moves","Sequence and match changes while avoiding incomplete groups",
        ["matched-hands","two-step","fraction-avoidance"]),
      chapter("The Independent Experimenter","Solve reversed and two-sided balances independently",
        ["matched-hands","variables-both-sides","reverse-orientation","strategy-choice"]),
      chapter("Inside the Crates","Decide whether to keep sealed groups intact or open them while matching both hand visits",
        ["sealed-groups","matched-hands","strategy-choice","fraction-avoidance"])
    ]),
    notebook:Object.freeze([
      chapter("Written with You","Use an editor to record equivalent algebraic operations",
        ["written-operations","remove-units","equal-groups"]),
      chapter("Choose the Route","Write a purposeful multi-step, whole-number route",
        ["written-operations","two-step","fraction-avoidance","strategy-choice"]),
      chapter("Apprentice Challenges","Write efficient transformations of reversed and two-sided equations",
        ["written-operations","variables-both-sides","reverse-orientation","strategy-choice"]),
      chapter("Writing with Groups","Show equivalent bracket expansions as one-room rewrites, then choose balanced operations",
        ["written-operations","sealed-groups","strategy-choice","two-step"])
    ])
  }),
  opposites:Object.freeze({
    guided:Object.freeze([
      chapter("Balloons Make Zero","Model and cancel pairs of positive and negative units",
        ["opposite-units","unit-zero-pairs"]),
      chapter("The White Visitors","Model and cancel positive and negative variable terms",
        ["opposite-sprites","sprite-zero-pairs"]),
      chapter("Two Kinds of Zero","Combine constant and variable cancellations before grouping",
        ["unit-zero-pairs","sprite-zero-pairs","signed-sequences"]),
      chapter("Across the Mirror","Read signed equations regardless of which side holds the unknown",
        ["opposite-sprites","reverse-orientation","signed-groups"]),
      chapter("Master of Opposites","Choose efficient signed strategies, including subtracting negatives",
        ["signed-sequences","signed-groups","subtract-negatives","strategy-choice"])
    ]),
    independent:Object.freeze([
      chapter("Two Hands, Two Signs","Repeat signed operations using separate hand visits",
        ["matched-hands","opposite-units","unit-zero-pairs"]),
      chapter("The Matching Experiment","Match an action even when different cancellations occur in each room",
        ["matched-hands","sprite-zero-pairs","unit-zero-pairs"]),
      chapter("Signed Groups","Use zero pairs to prepare whole divisions in both rooms",
        ["matched-hands","signed-sequences","signed-groups"]),
      chapter("The Moonlit Challenge","Choose and match independent multistep signed strategies",
        ["matched-hands","signed-sequences","subtract-negatives","strategy-choice"])
    ]),
    notebook:Object.freeze([
      chapter("Writing the Opposites","Write signed operations on both sides of an equation",
        ["written-operations","signed-notation","unit-zero-pairs"]),
      chapter("Choose the Sign","Use accurate signs for both constants and variable terms",
        ["signed-notation","sprite-zero-pairs","subtract-negatives"]),
      chapter("Apprentice of Opposites","Compose and check independent signed-equation solutions",
        ["signed-notation","signed-sequences","signed-groups","strategy-choice"])
    ])
  })
});

/**
 * Teacher-authored relative demand, grouped in chapters of four.
 * Bands are about reasoning and representation, not the magnitude of numbers.
 * Local dips (for example an unfamiliar one-step inverse) are deliberate.
 */
export const DIFFICULTY_TIERS=Object.freeze({
  workshop:Object.freeze({
    guided:Object.freeze([1,1,1,2,2,2,2,3,3,3,3,4,3,4,4,4,4,4,5,5,3,3,4,5]),
    independent:Object.freeze([2,2,2,2,2,2,3,3,3,3,3,4,4,4,5,5,3,4,4,5]),
    notebook:Object.freeze([2,2,3,3,3,3,4,4,4,4,5,5,3,4,4,5])
  }),
  opposites:Object.freeze({
    guided:Object.freeze([2,2,2,3,3,3,4,4,3,4,4,4,4,4,5,5,5,4,5,5]),
    independent:Object.freeze([2,2,3,3,3,3,4,4,3,4,4,4,5,5,4,5]),
    notebook:Object.freeze([2,2,3,3,4,4,4,4,5,5,5,5])
  })
});

const SOURCES=Object.freeze({
  workshop:Object.freeze({
    guided:WORLD1_LEVELS,independent:INDEPENDENT_LEVELS,notebook:APPRENTICE_LEVELS
  }),
  opposites:OPPOSITE_LEVELS
});
const FRACTION_TRAPS=new Set([
  "two-step-12","independent-12","apprentice-06","apprentice-08",
  "crates-23","crates-24"
]);
const ALTERNATIVE_ROUTES=new Set([
  "two-step-10","two-step-11","master-17","master-20",
  "apprentice-04","apprentice-05","apprentice-12",
  "crates-21","crates-22","crates-24"
]);
const sum=(r,key)=>Number(r?.[key]||0);
const variableCount=r=>sum(r,"posX")-sum(r,"negX")+
  sum(r?.crates?.contents,"posX")*sum(r?.crates,"count");
const freezeList=values=>Object.freeze([...values]);

function flagsFor(level){
  const left=level.left,right=level.right;
  const hasVariable=r=>sum(r,"posX")+sum(r,"negX")+
    sum(r?.crates,"count")*(sum(r?.crates?.contents,"posX")+
      sum(r?.crates?.contents,"negX"))>0;
  const leftHasVariable=hasVariable(left);
  const rightHasVariable=hasVariable(right);
  const hasNegativeUnits=sum(left,"negOne")+sum(right,"negOne")>0;
  const hasNegativeSprites=sum(left,"negX")+sum(right,"negX")>0;
  return Object.freeze({
    variablesOnBothSides:leftHasVariable&&rightHasVariable,
    reversed:variableCount(right)>variableCount(left),
    negativeUnits:hasNegativeUnits,
    negativeSprites:hasNegativeSprites,
    sealedCrates:!!level.groupedPrototype,
    fractionTrap:FRACTION_TRAPS.has(level.id),
    alternativeRoutes:ALTERNATIVE_ROUTES.has(level.id),
    independentlyMatchedHands:false
  });
}

function makeEntry(worldId,stage,slot){
  const level=slot.level;
  const number=slot.number,chapterIndex=slot.chapterIndex;
  const definition=CURRICULUM_CHAPTERS[worldId][stage][chapterIndex];
  const tier=DIFFICULTY_TIERS[worldId][stage][number-1];
  if(!definition||!Number.isInteger(tier)||!DIFFICULTY_BANDS[tier])
    throw new Error("Missing curriculum definition or difficulty for "+worldId+"/"+stage+"/"+number);
  const rawFlags=flagsFor(level);
  const flags=Object.freeze({...rawFlags,independentlyMatchedHands:stage==="independent",
    notebookFirst:stage==="notebook"});
  const skills=new Set(definition.skills);
  if(flags.variablesOnBothSides)skills.add("variables-both-sides");
  if(flags.reversed)skills.add("reverse-orientation");
  if(flags.negativeUnits)skills.add("opposite-units");
  if(flags.negativeSprites)skills.add("opposite-sprites");
  if(flags.sealedCrates)skills.add("sealed-groups");
  if(flags.fractionTrap)skills.add("fraction-avoidance");
  if(flags.alternativeRoutes)skills.add("strategy-choice");
  if(stage==="independent")skills.add("matched-hands");
  if(stage==="notebook")skills.add("written-operations");
  const skillIds=freezeList(skills);
  const prerequisiteSkillIds=freezeList(new Set(skillIds.flatMap(id=>
    CURRICULUM_SKILLS[id]?.prerequisites||[])));
  const benchmarkMoves=worldId==="workshop"
    ?OPTIMAL_MOVES[stage][number-1]:level.referenceRoute.length;
  const benchmarkType=worldId==="workshop"?"proven-minimum":"authored-valid-route";
  const referenceOperations=worldId==="opposites"
    ?freezeList(new Set(level.referenceRoute.map(step=>step.op))):freezeList([]);
  const complexitySignals=Object.freeze({
    benchmarkMoves,
    benchmarkType,
    referenceOperations,
    variableSides:flags.variablesOnBothSides?2:1,
    changesOrientation:flags.reversed,
    signedObjectTypes:Number(flags.negativeUnits)+Number(flags.negativeSprites),
    studentControlledHandVisits:stage==="independent"?2:stage==="notebook"?0:1,
    scaffoldKind:level.scaffold?.kind||"none",
    fractionTrap:flags.fractionTrap,
    multipleSolutionRoutes:flags.alternativeRoutes,
    sealedGroupReasoning:flags.sealedCrates
  });
  const difficulty=Object.freeze({
    tier,label:DIFFICULTY_BANDS[tier],withinChapter:Number(number-1)%4+1,
    complexitySignals
  });
  return Object.freeze({
    id:level.id,worldId,stage,number,title:level.title,chapterIndex,
    chapterTitle:definition.title,learningObjective:definition.objective,
    strand:"Algebra: solving equations",skillIds,prerequisiteSkillIds,
    difficulty,flags
  });
}

const allEntries=[],byId=new Map();
export const CURRICULUM_LEVELS=Object.freeze(Object.fromEntries(
  Object.entries(SOURCES).map(([worldId,stages])=>[worldId,Object.freeze(
    Object.fromEntries(Object.entries(stages).map(([stage,slots])=>{
      const entries=Object.freeze(slots.map(slot=>{
        const entry=makeEntry(worldId,stage,slot);
        if(byId.has(entry.id))throw new Error("Duplicate curriculum level ID "+entry.id);
        byId.set(entry.id,entry);
        allEntries.push(entry);
        return entry;
      }));
      if(entries.length!==CURRICULUM_CHAPTERS[worldId][stage].length*4)
        throw new Error("Wrong chapter coverage for "+worldId+"/"+stage);
      return [stage,entries];
    }))
  )])
));
export const ALL_CURRICULUM_LEVELS=Object.freeze(allEntries);

export function curriculumForLevel(worldId,stage,number){
  return Number.isInteger(number)&&number>0
    ?(CURRICULUM_LEVELS[worldId]?.[stage]?.[number-1]||null):null;
}
export function curriculumForId(id){
  return byId.get(id)||null;
}
export function curriculumForChapter(worldId,stage,chapterIndex){
  const definition=CURRICULUM_CHAPTERS[worldId]?.[stage]?.[chapterIndex];
  if(!definition)return null;
  return Object.freeze({...definition,
    worldId,stage,chapterIndex,
    levels:freezeList((CURRICULUM_LEVELS[worldId]?.[stage]||[])
      .filter(row=>row.chapterIndex===chapterIndex))});
}

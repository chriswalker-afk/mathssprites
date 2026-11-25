/**
 * Curriculum planning catalogue for the 240 SHIPPED campaign levels.
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
import {OPPOSITE_OPTIMAL_MOVES} from "./opposite-star-benchmarks.mjs";
import {FRACTION_CAMPAIGN_STAGES} from "./fraction-campaign-levels.mjs";
import {FRACTION_LEVEL_PLAN} from "./fraction-level-plan.mjs";
import {SQUARE_LEVEL_PLAN} from "./square-level-plan.mjs";
import {SQUARE_CAMPAIGN_STAGES} from "./square-campaign-levels.mjs";
const SQUARE_SOURCES=Object.freeze(Object.fromEntries(SQUARE_CAMPAIGN_STAGES.filter(s=>s.available).map(s=>[s.id,s.levels])));
const SQUARE_BENCHMARKS=Object.fromEntries(SQUARE_CAMPAIGN_STAGES.map(s=>[s.id,s.optimalMoves]));
const SQUARE_REFERENCES=new Map(SQUARE_LEVEL_PLAN.map(l=>[l.id,l.reference]));
import {fractionRoomCount} from "./fraction-engine.mjs";
import {rcompare} from "./rational.mjs";
const FRACTION_SOURCES=Object.freeze(Object.fromEntries(FRACTION_CAMPAIGN_STAGES.map(stage=>[stage.id,stage.levels])));
const FRACTION_BENCHMARKS=Object.fromEntries(FRACTION_CAMPAIGN_STAGES.map(stage=>[stage.id,stage.optimalMoves]));
const FRACTION_REFERENCES=new Map(FRACTION_LEVEL_PLAN.map(level=>[level.id,level.reference]));

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
    "Write operations such as adding negative x or subtracting negative four",["written-operations","opposite-units"]),
  "fraction-sharing":skill("Sharing a whole into equal parts","fractions","Share whole objects fairly and interpret leftover equal fragments",["equal-groups"]),
  "fraction-solutions":skill("Exact fractional solutions","fractions","Interpret a fractional or mixed-number weight as the value of one sprite",["fraction-sharing"]),
  "fraction-weights":skill("Fractional constants","fractions","Add or remove an equal rational quantity of weights on both sides",["remove-units","fraction-sharing"]),
  "fraction-equivalence":skill("Equivalent physical fractions","fractions","Choose a supported common denominator and recognise equal rational quantities",["fraction-sharing"]),
  "fraction-borrowing":skill("Borrowing and recombining","representation","Split a whole into equal pieces before subtraction and regroup remaining parts",["fraction-equivalence"]),
  "fraction-sprites":skill("Fractional coefficients","fractions","Interpret a fragment of a sprite as the corresponding fraction of x",["fraction-sharing"]),
  "fraction-scaling":skill("Scaling fractional equations","linear","Use whole-number copies and equal sharing to recover one whole sprite",["fraction-sprites","equal-groups"]),
  "square-area":skill("Squaring whole expressions","representation","Build the four regions of a complete square from its entire side",["balance-invariance"]),
  "principal-root":skill("Principal square roots","representation","Recover one nonnegative side of a complete square",["square-area"]),
  "square-isolation":skill("Isolating quadratic terms","strategy","Clear equal objects or share whole groups before taking a root",["principal-root","equal-groups"]),
  "complete-square":skill("Completing a square","representation","Identify and fill a missing constant corner using equal changes",["square-area","principal-root"]),
  "quadratic-strategy":skill("Strategic quadratic transformations","strategy","Choose a legal sequence of equal changes to isolate a round sprite",["square-isolation","complete-square"]),
  "fraction-notation":skill("Exact fractional notation","communication","Write an exact fraction operation, confirm the next equation and replay the accepted steps",["written-operations","fraction-equivalence"])
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
        ["signed-sequences","signed-groups","subtract-negatives","strategy-choice"]),
      chapter("The Sealed Opposites","Choose when to attach existing opposites, keep groups sealed, or open signed crates",
        ["sealed-groups","unit-zero-pairs","sprite-zero-pairs","signed-sequences","signed-groups","strategy-choice"])
    ]),
    independent:Object.freeze([
      chapter("Two Hands, Two Signs","Repeat signed operations using separate hand visits",
        ["matched-hands","opposite-units","unit-zero-pairs"]),
      chapter("The Matching Experiment","Match an action even when different cancellations occur in each room",
        ["matched-hands","sprite-zero-pairs","unit-zero-pairs"]),
      chapter("Signed Groups","Use zero pairs to prepare whole divisions in both rooms",
        ["matched-hands","signed-sequences","signed-groups"]),
      chapter("The Moonlit Challenge","Choose and match independent multistep signed strategies",
        ["matched-hands","signed-sequences","subtract-negatives","strategy-choice"]),
      chapter("The Two-Handed Crates","Distinguish one-room expansion from matching two-room algebraic operations",
        ["sealed-groups","matched-hands","signed-groups","unit-zero-pairs","sprite-zero-pairs","strategy-choice"])
    ]),
    notebook:Object.freeze([
      chapter("Writing the Opposites","Write signed operations on both sides of an equation",
        ["written-operations","signed-notation","unit-zero-pairs"]),
      chapter("Choose the Sign","Use accurate signs for both constants and variable terms",
        ["signed-notation","sprite-zero-pairs","subtract-negatives"]),
      chapter("Apprentice of Opposites","Compose and check independent signed-equation solutions",
        ["signed-notation","signed-sequences","signed-groups","strategy-choice"]),
      chapter("Brackets of Opposites","Write and expand signed bracket expressions, then replay physical sealed groups",
        ["written-operations","sealed-groups","signed-notation","signed-sequences","strategy-choice"])
    ])
  }),
  fractions:Object.freeze({
    guided:Object.freeze([
      chapter("Sharing the Leftovers","Share whole objects and interpret exact fractional answers",["fraction-sharing","fraction-solutions"]),
      chapter("Little Pieces","Subtract equal fractional weights, including borrowing from a whole",["fraction-weights","fraction-borrowing"]),
      chapter("Changing Pieces","Use equivalent parts and common denominators to remove fractional weights",["fraction-equivalence","fraction-borrowing"]),
      chapter("Pieces of Sprites","Reassemble fractional unknowns by integer scaling and equal sharing",["fraction-sprites","fraction-scaling"]),
      chapter("Fractional Mysteries","Sequence fractional subtraction, reassembly and division",["fraction-weights","fraction-sprites","fraction-scaling","two-step"]),
      chapter("Master of Fractions","Remove fractional unknowns from both sides and select legal scaling routes",["variables-both-sides","fraction-equivalence","fraction-scaling","strategy-choice"])
    ]),
    independent:Object.freeze([
      chapter("Equal Shares","Choose and match equal shares with fractional remainders",["matched-hands","fraction-sharing","fraction-solutions"]),
      chapter("Fractional Weights","Match equivalent fractional removals and borrow from wholes",["matched-hands","fraction-weights","fraction-equivalence","fraction-borrowing"]),
      chapter("Fractional Sprites","Match integer copies and sharing to isolate one whole sprite",["matched-hands","fraction-sprites","fraction-scaling"]),
      chapter("Multiple Operations","Match multistep changes involving fractional coefficients and weights",["matched-hands","fraction-scaling","fraction-equivalence","two-step"]),
      chapter("Across the Balance","Independently match strategic operations on both-sided fractional equations",["matched-hands","variables-both-sides","fraction-scaling","strategy-choice"])
    ]),
    notebook:Object.freeze([
      chapter("Fractional Answers","Record and confirm exact operations producing fractional answers",["fraction-notation","fraction-solutions","written-operations"]),
      chapter("Fractional Terms","Write operations with equivalent fractions and fractional coefficients",["fraction-notation","fraction-equivalence","fraction-sprites","fraction-scaling"]),
      chapter("Multi-step Equations","Select and record a legal sequence of fractional transformations",["fraction-notation","fraction-scaling","two-step","fraction-borrowing"]),
      chapter("Strategic Equations","Write and replay efficient solutions to two-sided fraction equations",["fraction-notation","variables-both-sides","fraction-equivalence","strategy-choice","fraction-scaling"])
    ])
  }),
  squares:Object.freeze({
    guided:Object.freeze([
      chapter("The Square Press","Construct the square area of the entire contents of both chambers",["square-area"]),
      chapter("Opening Squares","Recover a nonnegative side length from each complete square area",["principal-root"]),
      chapter("Clear the Area","Clear or share whole objects before taking the principal root",["square-isolation","two-step"]),
      chapter("The Four Regions","Recognise and reconstruct mixed square regions to recover a side",["square-area","principal-root"]),
      chapter("Missing Corners","Choose equal additions that fill the missing constant corner",["complete-square","principal-root"]),
      chapter("Master of Squares","Choose a multi-step strategy for a whole-object quadratic balance",["quadratic-strategy","strategy-choice"])
    ]),
    independent:Object.freeze([
      chapter("The Two-Handed Press","Independently choose and match square constructions and principal roots",["matched-hands","square-area","principal-root"]),
      chapter("Restore the Balance","Clear equal objects and share whole groups before recovering a side",["matched-hands","square-isolation","principal-root"]),
      chapter("Rebuilding the Square","Recognise mixed complete squares and match transformations in both rooms",["matched-hands","square-area","principal-root"]),
      chapter("Complete the Picture","Choose a candidate side and complete the square with equal additions",["matched-hands","complete-square","principal-root"]),
      chapter("Independent Mastery","Choose and match a multi-step strategy for a quadratic balance",["matched-hands","quadratic-strategy","strategy-choice"])
    ]),
    notebook:Object.freeze([
      chapter("Writing Squares and Roots","Write whole-expression squares and principal-root operations on both sides",["written-operations","square-area","principal-root"]),
      chapter("Recognising Square Expressions","Record exact legal changes before recovering a square side",["written-operations","square-isolation","principal-root"]),
      chapter("Completing the Square","Record equal additions and a principal root without a visual inspection scaffold",["written-operations","complete-square","principal-root"]),
      chapter("Strategic Quadratics","Write and verify a multi-step quadratic strategy before physical replay",["written-operations","quadratic-strategy","strategy-choice"])
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
    guided:Object.freeze([2,2,2,3,3,4,4,4,3,4,4,4,4,4,5,5,5,5,5,5,3,3,4,5]),
    independent:Object.freeze([2,2,3,3,3,3,4,4,3,4,4,4,5,5,5,5,3,4,4,5]),
    notebook:Object.freeze([2,2,3,3,4,4,4,4,5,5,5,5,3,4,4,5])
  }),
  fractions:Object.freeze({
    guided:Object.freeze([1,1,1,2,2,2,2,3,2,3,3,3,2,2,3,4,3,4,4,4,4,4,5,5]),
    independent:Object.freeze([2,2,2,3,2,2,3,3,2,3,3,4,3,3,4,4,4,4,4,5]),
    notebook:Object.freeze([2,2,2,3,3,3,3,4,3,3,4,4,4,4,5,5])
  }),
  squares:Object.freeze({
    guided:Object.freeze([1,1,2,2,1,2,2,3,2,3,3,4,2,3,3,4,3,3,4,4,4,4,5,5]),
    independent:Object.freeze([2,2,2,2,2,3,3,4,3,3,4,4,3,4,4,4,4,4,5,5]),
    notebook:Object.freeze([2,2,2,3,3,4,3,3,3,4,4,4,4,4,5,5])
  })
});

const SOURCES=Object.freeze({
  workshop:Object.freeze({
    guided:WORLD1_LEVELS,independent:INDEPENDENT_LEVELS,notebook:APPRENTICE_LEVELS
  }),
  opposites:OPPOSITE_LEVELS,
  fractions:FRACTION_SOURCES,
  squares:SQUARE_SOURCES
});
const FRACTION_TRAPS=new Set([
  "two-step-12","independent-12","apprentice-06","apprentice-08",
  "crates-23","crates-24","op-g-06","op-g-09","op-g-23","op-g-24","op-i-06","op-i-20","op-a-08","op-a-16"
]);
const ALTERNATIVE_ROUTES=new Set([
  "two-step-10","two-step-11","master-17","master-20",
  "apprentice-04","apprentice-05","apprentice-12",
  "crates-21","crates-22","crates-24",
  "op-g-18","op-g-21","op-g-22","op-g-23","op-g-24","op-i-06","op-i-19","op-i-20","op-a-08","op-a-15","op-a-16"
]);
const sum=(r,key)=>Number(r?.[key]||0);
const variableCount=r=>sum(r,"posX")-sum(r,"negX")+
  (sum(r?.crates?.contents,"posX")-sum(r?.crates?.contents,"negX"))*
    sum(r?.crates,"count");
const freezeList=values=>Object.freeze([...values]);

function flagsFor(level){
  const left=level.left,right=level.right;
  if(level.squareLaboratory){
    const variables=r=>sum(r,"posX2")+sum(r,"posX");
    return Object.freeze({variablesOnBothSides:variables(left)>0&&variables(right)>0,
      reversed:variables(right)>variables(left),negativeUnits:false,negativeSprites:false,
      sealedCrates:false,fractionTrap:false,alternativeRoutes:false,independentlyMatchedHands:false,
      squareBuild:level.goal==="area",quadraticTerms:sum(left,"posX2")+sum(right,"posX2")>0,
      mixedSquare:level.goal!=="area"&&[left,right].some(r=>sum(r,"posX2")>0&&sum(r,"posX")>0),
      inspectionFrame:!!level.squareInspection});
  }
  if(level.quantityMode==="fractions"){
    const values=[left.posX,left.posOne,right.posX,right.posOne];
    return Object.freeze({variablesOnBothSides:left.posX.n>0&&right.posX.n>0,
      reversed:rcompare(right.posX,left.posX)>0,negativeUnits:false,negativeSprites:false,
      sealedCrates:false,fractionTrap:false,alternativeRoutes:false,independentlyMatchedHands:false,
      fractionalWeights:left.posOne.d>1||right.posOne.d>1,
      fractionalSprites:left.posX.d>1||right.posX.d>1,
      fractionalSolution:level.solution.d>1,
      mixedDenominators:new Set(values.filter(q=>q.d>1).map(q=>q.d)).size>1});
  }
  const hasVariable=r=>sum(r,"posX")+sum(r,"negX")+
    sum(r?.crates,"count")*(sum(r?.crates?.contents,"posX")+
      sum(r?.crates?.contents,"negX"))>0;
  const leftHasVariable=hasVariable(left);
  const rightHasVariable=hasVariable(right);
  // Signed contents remain mathematically present even when sealed.
  const totalSigned=(r,kind)=>sum(r,kind)+
    sum(r?.crates,"count")*sum(r?.crates?.contents,kind);
  const hasNegativeUnits=totalSigned(left,"negOne")+totalSigned(right,"negOne")>0;
  const hasNegativeSprites=totalSigned(left,"negX")+totalSigned(right,"negX")>0;
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
  if(flags.fractionalWeights)skills.add("fraction-weights");
  if(flags.fractionalSprites)skills.add("fraction-sprites");
  if(flags.fractionalSolution)skills.add("fraction-solutions");
  if(flags.mixedDenominators)skills.add("fraction-equivalence");
  if(worldId==="fractions"&&stage==="notebook")skills.add("fraction-notation");
  if(stage==="independent")skills.add("matched-hands");
  if(stage==="notebook")skills.add("written-operations");
  const skillIds=freezeList(skills);
  const prerequisiteSkillIds=freezeList(new Set(skillIds.flatMap(id=>
    CURRICULUM_SKILLS[id]?.prerequisites||[])));
  // World 3 uses a rigorous algebraic lower bound with a legal engine
  // witness; the other worlds retain their separately certified targets.
  const benchmarkMoves=worldId==="squares"?SQUARE_BENCHMARKS[stage][level.id]:
    worldId==="fractions"?FRACTION_BENCHMARKS[stage][level.id]:
    (worldId==="workshop"?OPTIMAL_MOVES:OPPOSITE_OPTIMAL_MOVES)[stage][number-1];
  const benchmarkType="proven-minimum";
  const reference=worldId==="squares"?SQUARE_REFERENCES.get(level.id):
    worldId==="fractions"?FRACTION_REFERENCES.get(level.id):
    worldId==="opposites"?level.referenceRoute:null;
  const authoredRouteMoves=reference?reference.length:null;
  const referenceOperations=freezeList(new Set((reference||[]).map(step=>step.op)));
  const initialZeroPairs=worldId==="fractions"?0:["left","right"].reduce((total,side)=>{
    const r=level[side]||{};
    return total+Math.min(sum(r,"posX"),sum(r,"negX"))+
      Math.min(sum(r,"posOne"),sum(r,"negOne"));
  },0);
  const complexitySignals=Object.freeze({
    benchmarkMoves,
    benchmarkType,
    authoredRouteMoves,
    referenceOperations,
    variableSides:flags.variablesOnBothSides?2:1,
    changesOrientation:flags.reversed,
    signedObjectTypes:Number(flags.negativeUnits)+Number(flags.negativeSprites),
    studentControlledHandVisits:stage==="independent"?2:stage==="notebook"?0:1,
    scaffoldKind:level.scaffold?.kind||"none",
    fractionTrap:flags.fractionTrap,
    multipleSolutionRoutes:flags.alternativeRoutes,
    sealedGroupReasoning:flags.sealedCrates,
    initialZeroPairs,
    ...(worldId==="squares"?{goal:level.goal,initialPeakObjects:Math.max(...[level.left,level.right].map(r=>sum(r,"posX2")+sum(r,"posX")+sum(r,"posOne"))),inspectionMode:level.squareInspection||"none"}:{}),
    ...(worldId==="fractions"?{initialDenominators:freezeList([...new Set([level.left.posX.d,level.left.posOne.d,level.right.posX.d,level.right.posOne.d])].sort((a,b)=>a-b)),
      solutionDenominator:level.solution.d,initialPeakPieces:Math.max(fractionRoomCount(level.left),fractionRoomCount(level.right))}:{})
  });
  const difficulty=Object.freeze({
    tier,label:DIFFICULTY_BANDS[tier],withinChapter:Number(number-1)%4+1,
    complexitySignals
  });
  return Object.freeze({
    id:level.id,worldId,stage,number,title:level.title,chapterIndex,
    contentRevision:level.contentRevision||1,
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

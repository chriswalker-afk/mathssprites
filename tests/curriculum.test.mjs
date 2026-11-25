import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {INDEPENDENT_LEVELS} from "../src/independent-levels.mjs";
import {APPRENTICE_LEVELS} from "../src/apprentice-levels.mjs";
import {OPPOSITE_LEVELS} from "../src/opposite-levels.mjs";
import {OPPOSITE_OPTIMAL_MOVES} from "../src/opposite-star-benchmarks.mjs";
import {OPTIMAL_MOVES} from "../src/star-ratings.mjs";
import {FRACTION_CAMPAIGN_STAGES} from "../src/fraction-campaign-levels.mjs";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {SQUARE_LEVEL_PLAN} from "../src/square-level-plan.mjs";
import {SQUARE_CAMPAIGN_STAGES} from "../src/square-campaign-levels.mjs";
import {
  CURRICULUM_SKILLS,CURRICULUM_CHAPTERS,CURRICULUM_LEVELS,
  ALL_CURRICULUM_LEVELS,DIFFICULTY_BANDS,DIFFICULTY_TIERS,
  curriculumForLevel,curriculumForId,curriculumForChapter
} from "../src/curriculum.mjs";

const sources={
  workshop:{guided:WORLD1_LEVELS,independent:INDEPENDENT_LEVELS,notebook:APPRENTICE_LEVELS},
  opposites:OPPOSITE_LEVELS,
  fractions:Object.fromEntries(FRACTION_CAMPAIGN_STAGES.map(stage=>[stage.id,stage.levels])),
  squares:Object.fromEntries(SQUARE_CAMPAIGN_STAGES.filter(stage=>stage.available).map(stage=>[stage.id,stage.levels]))
};

test("every shipped level has exactly one addressable, immutable curriculum record",()=>{
  assert.equal(ALL_CURRICULUM_LEVELS.length,204);
  assert.equal(new Set(ALL_CURRICULUM_LEVELS.map(row=>row.id)).size,204);
  assert.deepEqual(Object.keys(CURRICULUM_LEVELS),["workshop","opposites","fractions","squares"]);
  for(const [worldId,stages] of Object.entries(sources)){
    for(const [stage,slots] of Object.entries(stages)){
      const rows=CURRICULUM_LEVELS[worldId][stage];
      assert.equal(rows.length,slots.length);
      assert.deepEqual(rows.map(row=>row.id),slots.map(slot=>slot.id));
      assert.ok(Object.isFrozen(rows));
      for(const [index,row] of rows.entries()){
        assert.equal(row.number,index+1);
        assert.equal(row.worldId,worldId);
        assert.equal(row.stage,stage);
        assert.equal(row.chapterIndex,Math.floor(index/4));
        assert.equal(row.learningObjective,
          CURRICULUM_CHAPTERS[worldId][stage][row.chapterIndex].objective);
        assert.equal(curriculumForLevel(worldId,stage,index+1),row);
        assert.equal(curriculumForId(row.id),row);
        assert.ok(Object.isFrozen(row));
        assert.ok(Object.isFrozen(row.difficulty));
        assert.ok(Object.isFrozen(row.flags));
      }
    }
  }
  assert.equal(curriculumForLevel("workshop","guided",0),null);
  assert.equal(curriculumForLevel("workshop","guided",25),null);
  assert.equal(curriculumForLevel("workshop","guided","1"),null);
  assert.equal(curriculumForLevel("fractions","guided",25),null);
  assert.equal(curriculumForId("not-yet-authored"),null);
});

test("skill definitions have meaningful outcomes and declared prerequisites",()=>{
  for(const [id,skill] of Object.entries(CURRICULUM_SKILLS)){
    assert.ok(skill.label.length>5,id);
    assert.ok(skill.canDo.length>20,id);
    assert.ok(["equivalence","linear","strategy","representation","communication","signed","fractions"]
      .includes(skill.strand),id);
    for(const required of skill.prerequisites)
      assert.ok(CURRICULUM_SKILLS[required],id+" has unknown prerequisite "+required);
  }
  for(const entry of ALL_CURRICULUM_LEVELS){
    assert.ok(entry.skillIds.length>=1,entry.id);
    for(const skillId of entry.skillIds)
      assert.ok(CURRICULUM_SKILLS[skillId],entry.id+" refers to "+skillId);
    for(const prerequisite of entry.prerequisiteSkillIds)
      assert.ok(CURRICULUM_SKILLS[prerequisite],entry.id+" has missing prerequisite");
    assert.ok(entry.learningObjective.length>=25,entry.id);
    // Teacher metadata never contains a copy of an authored solution route.
    for(const key of ["solution","startingOperation","startingKind","startingAmount",
      "startingFactor","suggested","referenceRoute","prompt"])
      assert.equal(Object.hasOwn(entry,key),false,entry.id+" has leaked "+key);
  }
});

test("difficulty has five deliberate planning bands, a benchmark and physical evidence",()=>{
  assert.deepEqual(Object.keys(DIFFICULTY_BANDS),["1","2","3","4","5"]);
  for(const [worldId,stages] of Object.entries(sources)){
    for(const [stage,slots] of Object.entries(stages)){
      const tiers=DIFFICULTY_TIERS[worldId][stage];
      assert.equal(tiers.length,slots.length);
      for(const [index,slot] of slots.entries()){
        const entry=curriculumForLevel(worldId,stage,index+1);
        assert.equal(entry.difficulty.tier,tiers[index]);
        assert.equal(entry.difficulty.label,DIFFICULTY_BANDS[tiers[index]]);
        assert.equal(entry.difficulty.withinChapter,index%4+1);
        const signals=entry.difficulty.complexitySignals;
        if(worldId==="workshop"){
          assert.equal(signals.benchmarkMoves,OPTIMAL_MOVES[stage][index]);
          assert.equal(signals.benchmarkType,"proven-minimum");
        }else if(worldId==="squares"){
          const target=SQUARE_CAMPAIGN_STAGES.find(s=>s.id===stage).optimalMoves[slot.id];
          const reference=SQUARE_LEVEL_PLAN.find(l=>l.id===slot.id).reference;
          assert.equal(signals.benchmarkMoves,target);
          assert.equal(signals.benchmarkType,"proven-minimum");
          assert.equal(signals.authoredRouteMoves,reference.length);
          assert.deepEqual(signals.referenceOperations,[...new Set(reference.map(step=>step.op))]);
          assert.ok(signals.initialPeakObjects<=48);
        }else if(worldId==="fractions"){
          const target=FRACTION_CAMPAIGN_STAGES.find(s=>s.id===stage).optimalMoves[slot.id];
          const reference=FRACTION_LEVEL_PLAN.find(l=>l.id===slot.id).reference;
          assert.equal(signals.benchmarkMoves,target);
          assert.equal(signals.benchmarkType,"proven-minimum");
          assert.equal(signals.authoredRouteMoves,reference.length);
          assert.deepEqual(signals.referenceOperations,[...new Set(reference.map(step=>step.op))]);
          assert.ok(signals.initialPeakPieces<=48);
        }else{
          assert.equal(signals.benchmarkMoves,OPPOSITE_OPTIMAL_MOVES[stage][index]);
          assert.equal(signals.benchmarkType,"proven-minimum");
          assert.equal(signals.authoredRouteMoves,slot.level.referenceRoute.length);
          assert.ok(signals.authoredRouteMoves>=signals.benchmarkMoves);
          assert.deepEqual(signals.referenceOperations,
            [...new Set(slot.level.referenceRoute.map(step=>step.op))]);
        }
        assert.equal(signals.studentControlledHandVisits,
          stage==="independent"?2:stage==="notebook"?0:1);
        assert.ok(signals.benchmarkMoves>=1);
      }
      // The final challenge of a chapter is not gentler than its introduction.
      // New chapters may reset as they introduce a different skill.
      for(let i=0;i<tiers.length;i+=4)
        assert.ok(tiers[i+3]>=tiers[i],worldId+"/"+stage+"/"+(i/4+1));
    }
  }
});

test("chapter definitions and level slices align with the playable four-level chapters",()=>{
  for(const [worldId,stages] of Object.entries(sources))
    for(const [stage,slots] of Object.entries(stages)){
      const defs=CURRICULUM_CHAPTERS[worldId][stage];
      assert.equal(defs.length*4,slots.length);
      for(let i=0;i<defs.length;i++){
        const record=curriculumForChapter(worldId,stage,i);
        assert.equal(record.title,defs[i].title);
        assert.equal(record.levels.length,4);
        assert.deepEqual(record.levels.map(x=>x.number),[i*4+1,i*4+2,i*4+3,i*4+4]);
      }
    }
  assert.equal(curriculumForChapter("workshop","guided",99),null);
  assert.equal(curriculumForChapter("fractions","guided",6),null);
});

test("physical difficulty markers reflect actual levels, not guesses based on numbers",()=>{
  assert.equal(curriculumForId("master-19").flags.sealedCrates,true);
  assert.ok(curriculumForId("master-19").skillIds.includes("sealed-groups"));
  assert.equal(curriculumForId("master-18").flags.reversed,true);
  assert.equal(curriculumForId("master-20").flags.variablesOnBothSides,true);
  assert.equal(curriculumForId("two-step-12").flags.fractionTrap,true);
  assert.equal(curriculumForId("independent-01").flags.independentlyMatchedHands,true);
  assert.equal(curriculumForId("op-g-01").flags.negativeUnits,true);
  assert.equal(curriculumForId("op-g-01").flags.negativeSprites,false);
  assert.equal(curriculumForId("op-g-05").flags.variablesOnBothSides,true);
  assert.equal(curriculumForId("op-a-08").skillIds.includes("subtract-negatives"),true);
  assert.equal(curriculumForId("apprentice-01").difficulty.complexitySignals.scaffoldKind,"model");
  assert.equal(curriculumForId("apprentice-04").difficulty.complexitySignals.scaffoldKind,"none");
});

test("new teacher-side curriculum data is not imported by the student game",()=>{
  for(const path of ["src/app.mjs","src/site.mjs","src/stages.mjs"]){
    const content=readFileSync(new URL("../"+path,import.meta.url),"utf8");
    assert.doesNotMatch(content, /(?:import|from)\s*(?:[^;]*?)curriculum\.mjs/);
  }
});

test("teacher report actually renders every canonical equation and supports filtered JSON",()=>{
  const script=fileURLToPath(new URL("../scripts/curriculum-report.mjs",import.meta.url));
  const output=execFileSync(process.execPath,[script,"--json"],{encoding:"utf8"});
  const report=JSON.parse(output);
  assert.equal(report.count,204);
  assert.equal(report.levels.find(x=>x.id==="master-19").equation,"2x + 6 = 14");
  assert.equal(report.levels.find(x=>x.id==="op-g-01").equation,"x − 1 = 3");
  const filtered=JSON.parse(execFileSync(process.execPath,
    [script,"--world","opposites","--stage","guided","--json"],{encoding:"utf8"}));
  assert.equal(filtered.count,24);
  assert.ok(filtered.levels.every(x=>x.worldId==="opposites"&&x.stage==="guided"));
  const markdown=execFileSync(process.execPath,[script,"--world","workshop","--stage","guided"],
    {encoding:"utf8"});
  assert.match(markdown,/24 playable campaign levels/);
  assert.match(markdown,/Master of the Balance/);
});

test("World 3 curriculum records preserve exact fractional flags and teacher reports",()=>{
  const first=curriculumForId("frac-g-01");
  assert.equal(first.flags.fractionalSolution,true);assert.equal(first.flags.fractionalWeights,false);
  assert.equal(curriculumForId("frac-g-08").flags.reversed,true);
  assert.equal(curriculumForId("frac-g-12").flags.mixedDenominators,true);
  assert.equal(curriculumForId("frac-g-24").flags.variablesOnBothSides,true);
  assert.equal(curriculumForId("frac-g-24").flags.fractionalSprites,true);
  assert.ok(curriculumForId("frac-a-16").skillIds.includes("fraction-notation"));
  const script=fileURLToPath(new URL("../scripts/curriculum-report.mjs",import.meta.url));
  const report=JSON.parse(execFileSync(process.execPath,[script,"--world","fractions","--json"],{encoding:"utf8"}));
  assert.equal(report.count,60);assert.equal(report.levels[0].equation,"2x = 5");
  assert.equal(report.levels.find(x=>x.id==="frac-g-24").equation,"(2/3)x + 3/4 = (1/4)x + 2");
  assert.equal(report.levels.find(x=>x.id==="frac-a-15").difficulty.complexitySignals.benchmarkMoves,5);
});

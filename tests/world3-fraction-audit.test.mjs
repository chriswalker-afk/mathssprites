import test from "node:test";
import assert from "node:assert/strict";
import {rational as q} from "../src/rational.mjs";
import {minimumScalingMoves,independentFractionLowerBound,auditFractionWorld} from "../scripts/world3-fraction-audit.mjs";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
test("independent coefficient-only BFS allows every integer scale in either direction",()=>{
  assert.equal(minimumScalingMoves(q(1)),0);
  assert.equal(minimumScalingMoves(q(5,12)),3);
  assert.equal(minimumScalingMoves(q(1,8)),2);
  assert.equal(minimumScalingMoves(q(7),5),null);
  assert.equal(independentFractionLowerBound(FRACTION_LEVEL_PLAN.find(x=>x.id==="frac-g-24")),5);
});
test("all sixty fraction levels pass the independent minimum, physical grid, manual/paper and custom equation audit",()=>{
  const {summary,levels}=auditFractionWorld();
  assert.equal(summary.levels,60);assert.equal(summary.fractionalSolutions,39);
  assert.deepEqual(summary.minima,{1:29,2:12,3:13,4:3,5:3});
  assert.equal(summary.referencePeakSettled,30);
  assert.ok(summary.foundPeakSettled<=48);
  assert.deepEqual(Object.values(summary.byStage).map(s=>s.levels),[24,20,16]);
  assert.equal(new Set(levels.map(r=>r.id)).size,60);
  assert.ok(levels.every(r=>r.minimum===r.witness.length&&r.minimum===r.authored.length));
  for(const stage of ["guided","independent","notebook"]){
    const rows=levels.filter(r=>r.stage===stage);
    for(let i=0;i<rows.length;i+=4)assert.ok(rows[i+3].tier>=rows[i].tier);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import {SQUARE_KINDS,SQUARE_OPERATIONS,SQUARE_CAPACITY,validSquareRoom,squareBuildTarget,uniqueNonnegativeSquareSolution,validSquareLaboratoryLevel} from "../src/square-rules.mjs";
import {SQUARE_LEVEL_PLAN,SQUARE_CAMPAIGN_STAGES,squareLevelForPlay} from "../src/square-level-plan.mjs";
import {LEVELS,initialState,validInitialLevel,prepare,perform,previewRoomAction,visibleRooms,undo,isSolved,room,evaluate,balanceDifference,equation,algebraOperation,areaArrangement} from "../src/engine.mjs";
import {inRoomBoxPlan} from "../src/area-layout.mjs";
import {CAMPAIGN_REGISTRY,findCampaignWorld,isCampaignPlayable,firstCampaignLevel} from "../src/campaign-registry.mjs";
import {blankCampaignRecords,campaignStarTotals,withCampaignCompleted,normalizeCampaignResume} from "../src/campaign-records.mjs";

const get=(stage,n)=>SQUARE_LEVEL_PLAN.find(l=>l.stage===stage&&l.number===n);
const square={op:"square"},sqrt={op:"sqrt"};
const capacity=r=>SQUARE_KINDS.reduce((n,k)=>n+r[k],0);
const equal=(a,b)=>SQUARE_KINDS.every(k=>(a[k]||0)===(b[k]||0));
const checkScene=(state,id)=>{
  assert.equal(balanceDifference(state),0,id);
  for(const side of ["left","right"]){
    assert.ok(validSquareRoom(state[side]),id+" invalid physical room");
    assert.ok(capacity(state[side])<=SQUARE_CAPACITY,id+" over capacity");
  }
};
test("World 4 defines exactly 60 stable author fixtures, nine area targets and public Guided and Independent",()=>{
  assert.deepEqual(SQUARE_CAMPAIGN_STAGES.map(s=>s.id),["guided","independent","notebook"]);
  assert.deepEqual(SQUARE_CAMPAIGN_STAGES.map(s=>s.levels.length),[24,20,16]);
  assert.deepEqual(SQUARE_CAMPAIGN_STAGES.map(s=>s.chapters.length),[6,5,4]);
  assert.equal(new Set(SQUARE_LEVEL_PLAN.map(l=>l.id)).size,60);
  assert.equal(SQUARE_LEVEL_PLAN.filter(l=>l.goal==="area").length,9);
  for(const stage of SQUARE_CAMPAIGN_STAGES){
    assert.equal(stage.available,false);
    assert.deepEqual(stage.optimalMoves,{});
    for(const [i,chapter] of stage.chapters.entries()){
      assert.ok(chapter.title&&chapter.description);
      assert.equal(stage.levels.filter(l=>l.chapterIndex===i).length,4);
    }
    for(const slot of stage.levels){
      assert.equal(slot.available,false);
      assert.equal(Object.hasOwn(slot.level,"reference"),false);
      assert.equal(validInitialLevel(slot.level),true,slot.id);
      assert.ok(Object.isFrozen(slot.level.left));
      assert.ok(Object.isFrozen(slot.level.right));
      assert.ok(Object.isFrozen(slot.level.allowedKinds));
      assert.deepEqual(slot.level.allowedKinds,SQUARE_KINDS);
      assert.deepEqual(slot.level.allowedOperations,SQUARE_OPERATIONS);
      assert.equal(isCampaignPlayable("squares",stage.id,slot.id),stage.id!=="notebook");
      assert.deepEqual(normalizeCampaignResume({worldId:"squares",stageId:stage.id,levelId:slot.id}),stage.id!=="notebook"?{worldId:"squares",stageId:stage.id,levelId:slot.id}:null);
      assert.equal(isSolved(initialState(slot.level)),false,slot.id+" is prematurely solved");
    }
  }
  assert.equal(findCampaignWorld("squares").available,true);
  assert.equal(firstCampaignLevel("squares","guided").id,"square-g-01");
  const records=blankCampaignRecords();
  assert.deepEqual(withCampaignCompleted(records,"squares","notebook","square-a-01",1),records);
  assert.equal(campaignStarTotals(records).count,224);
  assert.equal(campaignStarTotals(records).available,672);
});
test("all sixty authored witnesses solve the actual engine, preserve balance, fit the chamber and undo exactly",()=>{
  let peak=0,maximum=0;
  for(const fixture of SQUARE_LEVEL_PLAN){
    const level=squareLevelForPlay(fixture),initial=initialState(level),id=level.id;
    assert.equal(validSquareLaboratoryLevel(level),true,id);
    assert.equal(initial.squareLaboratory,true,id);
    let state=initial;
    checkScene(state,id);
    for(const action of fixture.reference){
      assert.equal(isSolved(state),false,id+" reference continues after success");
      const before=state;
      const prepared=prepare(before,action);
      assert.equal(prepared.ok,true,id+" "+prepared.reason);
      for(const side of ["left","right"]){
        const start=before[side],after=prepared.pair[side].after;
        assert.ok(validSquareRoom(after),id);
        if(action.op==="square"||action.op==="sqrt"){
          const area=areaArrangement(start,action.op);
          assert.ok(area,id);
          if(area.kind!=="zero"){
            const box=inRoomBoxPlan(area);
            assert.equal(box.cells.length,area.cells,id);
            assert.ok(box.cells.length<=48,id);
            const actual=action.op==="square"?after:start;
            assert.ok(equal(box.counts,actual),id+" area cell counts differ");
          }
          // Check the transformation as an identity for other x values too,
          // not just the hidden solution of this particular level.
          for(const x of [0,1,2,3,6]){
            if(action.op==="square")assert.equal(evaluate(after,x),evaluate(start,x)**2,id);
            else assert.equal(evaluate(after,x)**2,evaluate(start,x),id);
          }
        }
      }
      const result=perform(before,action,"auto");
      assert.equal(result.ok,true,id+" "+result.reason);
      assert.equal(result.committed,true,id);
      state=result.state;
      checkScene(state,id);
      for(const side of ["left","right"])peak=Math.max(peak,capacity(state[side]),capacity(before[side]));
    }
    assert.equal(isSolved(state),true,id+" did not meet its goal");
    assert.equal(state.history.length,fixture.reference.length,id);
    if(level.goal==="area"){
      assert.ok(equal(state.left,level.target.left)&&equal(state.right,level.target.right),id);
      assert.equal(state.history.length,1,id);
    }else{
      const one=room({posX:1}),weights=room({posOne:level.solution});
      assert.ok(equal(state.left,one)&&equal(state.right,weights)||equal(state.right,one)&&equal(state.left,weights),id);
    }
    maximum=Math.max(maximum,fixture.reference.length);
    while(state.history.length)state=undo(state);
    assert.deepEqual(state,initial,id+" Undo differs");
  }
  assert.equal(peak,40);
  assert.equal(maximum,6);
});
test("every reference move is atomic in both independent visit orders",()=>{
  // All three fixture groups can use the same exact physical replay;
  // notebook UI/editor integration is deliberately left for PR76.
  for(const fixture of SQUARE_LEVEL_PLAN){
    const initial=initialState(squareLevelForPlay(fixture));
    let state=initial;
    for(const action of fixture.reference){
      const auto=perform(state,action,"auto");
      assert.equal(auto.ok,true,fixture.id);
      for(const first of ["left","right"]){
        const second=first==="left"?"right":"left";
        const visit=perform(state,action,"manual",first);
        assert.equal(visit.ok,true,fixture.id);
        assert.equal(visit.committed,false,fixture.id);
        assert.equal(visit.state.history.length,state.history.length,fixture.id);
        assert.equal(isSolved(visit.state),false,fixture.id);
        assert.deepEqual(visibleRooms(visit.state)[second],state[second]);
        assert.deepEqual(undo(visit.state),state);
        const match=perform(visit.state,action,"manual",second);
        assert.equal(match.ok,true,fixture.id);
        assert.equal(match.committed,true,fixture.id);
        assert.equal(match.state.pending,null);
        assert.deepEqual(match.state.left,auto.state.left,fixture.id);
        assert.deepEqual(match.state.right,auto.state.right,fixture.id);
        assert.equal(match.state.history.length,state.history.length+1);
        checkScene(match.state,fixture.id);
      }
      state=auto.state;
    }
    assert.equal(isSolved(state),true,fixture.id);
  }
});
test("world-specific permissions admit square sprites but not signed, fractional or crate objects",()=>{
  const level=squareLevelForPlay(get("guided",12)),state=initialState(level);
  assert.equal(prepare(state,{op:"remove",kind:"posX2",count:1}).ok,true);
  assert.equal(prepare(state,{op:"add",kind:"posX2",count:1}).ok,true);
  for(const action of [
    {op:"add",kind:"negX",count:1},{op:"add",kind:"negOne",count:1},
    {op:"add",kind:"posX",count:0.5},{op:"add",kind:"posOne",count:{n:1,d:2}},
    {op:"add",kind:"posX2",count:13},{op:"divide",factor:6},
    {op:"unpack",side:"left"},{op:"add",kind:"posX4",count:1}
  ]){
    assert.equal(prepare(state,action).ok,false,JSON.stringify(action));
    assert.equal(perform(state,action,"manual","left").ok,false,JSON.stringify(action));
  }
  assert.throws(()=>initialState(level,"signed"));
  assert.throws(()=>initialState(level,"fractions"));
  const restricted={...level,allowedOperations:["sqrt"]};
  assert.equal(prepare(initialState(restricted),{op:"remove",kind:"posX2",count:1}).code,"locked-operation");
  for(const invalid of [
    {...level,quantityMode:"signed"},{...level,quantityMode:"fractions"},
    {...level,lockPositive:false},{...level,solution:0},
    {...level,allowedKinds:[...SQUARE_KINDS,"negX"]},
    {...level,allowedOperations:[...SQUARE_OPERATIONS,"unpack"]},
    {...level,left:{posX2:1.5}},{...level,left:{posX2:"2"}},{...level,left:{posX2:2,posOne:null}},
    {...level,left:{posX2:49}},{...level,left:{posX2:1,negOne:1}},
    {...level,left:{posX2:1,crates:{count:1,contents:{posOne:1}}}}
  ]){
    assert.equal(validInitialLevel(invalid),false);
    assert.throws(()=>initialState(invalid));
  }
});
test("the nonnegative solution contract is exact, including ambiguous and repeated roots",()=>{
  assert.equal(uniqueNonnegativeSquareSolution({posX2:1},{posOne:9},3),true);
  assert.equal(uniqueNonnegativeSquareSolution({posX2:1,posOne:6},{posX:5},2),false);
  assert.equal(uniqueNonnegativeSquareSolution({posX2:1},{posX:2},2),false);
  assert.equal(uniqueNonnegativeSquareSolution({posX2:1,posOne:4},{posX:4},2),true);
  assert.equal(uniqueNonnegativeSquareSolution({posX:1},{posOne:3},3),true);
  assert.equal(uniqueNonnegativeSquareSolution({posOne:3},{posX:1},3),true);
  assert.equal(uniqueNonnegativeSquareSolution({posX:1},{posX:1},1),false);
  assert.equal(uniqueNonnegativeSquareSolution({posX:1},{posOne:0},0),false);
  assert.equal(uniqueNonnegativeSquareSolution({posX2:1},{posOne:2},Math.sqrt(2)),false);
  assert.equal(uniqueNonnegativeSquareSolution({posX2:1},{posOne:9},2),false);
});
test("build targets are exact and distinct from an already-isolated sprite",()=>{
  const level=squareLevelForPlay(get("guided",1)),start=initialState(level);
  assert.equal(equation(start),"x = 3");
  assert.equal(isSolved(start),false);
  const result=perform(start,square);
  assert.equal(result.ok,true);
  assert.equal(isSolved(result.state),true);
  assert.equal(equation(result.state),"x² = 9");
  assert.deepEqual(undo(result.state),start);
  assert.equal(validInitialLevel({...level,target:{left:{posX2:1},right:{posOne:8}}}),false);
  assert.equal(validInitialLevel({...level,goal:"isolate"}),false);
  assert.equal(squareBuildTarget({posX:4,posOne:3}),null);
  assert.equal(squareBuildTarget({posX2:1}),null);
  assert.deepEqual(squareBuildTarget({posX:2,posOne:3}),{posX2:4,posX:12,posOne:9});
});
test("unsupported area attempts are reversible; matching failure cannot commit an unequal operation",()=>{
  const level=squareLevelForPlay(get("guided",17)),state=initialState(level);
  assert.equal(prepare(state,sqrt).code,"unsupported-area");
  assert.equal(prepare(state,square).code,"unsupported-area");
  assert.equal(previewRoomAction({posOne:7},square,"positive").code,"overflow");
  assert.equal(previewRoomAction({posOne:12},sqrt,"positive").code,"unsupported-area");
  assert.equal(previewRoomAction({posX2:1,posX:3,posOne:4},sqrt,"positive").code,"unsupported-area");
  assert.equal(previewRoomAction({posX:1,crates:{count:1,contents:{posOne:1}}},square,"positive").code,"unsupported-area");
  const complete=perform(state,{op:"add",kind:"posOne",count:1});
  assert.equal(complete.ok,true);
  const visit=perform(complete.state,sqrt,"manual","left");
  assert.equal(visit.ok,true);
  const mismatch=perform(visit.state,{op:"divide",factor:2},"manual","right");
  assert.equal(mismatch.code,"mismatch");
  assert.deepEqual(undo(visit.state),complete.state);
  // Nine weights can be removed from the east chamber but not the west.
  // The engine permits the illustrative first visit, never a unilateral commit.
  const trial=initialState(squareLevelForPlay(get("guided",12)));
  const oneSide=perform(trial,{op:"remove",kind:"posOne",count:9},"manual","right");
  assert.equal(oneSide.ok,true);
  assert.equal(perform(oneSide.state,{op:"remove",kind:"posOne",count:9},"manual","left").ok,false);
  assert.deepEqual(undo(oneSide.state),trial);
});
test("earlier public worlds retain their operation locks and legacy prototypes still work",()=>{
  for(const world of CAMPAIGN_REGISTRY.filter(w=>w.available&&w.id!=="squares")){
    for(const stage of world.stages.filter(s=>s.available)){
      for(const slot of stage.levels.filter(l=>l.available)){
        const state=initialState(slot.level);
        assert.equal(state.squareLaboratory,undefined,slot.id);
        for(const a of [square,sqrt,{op:"add",kind:"posX2",count:1}]){
          assert.equal(prepare(state,a).ok,false,world.id+"/"+slot.id);
        }
      }
    }
  }
  const before=initialState(LEVELS[5]),after=perform(before,square);
  assert.equal(after.ok,true);assert.equal(isSolved(after.state),true);
  assert.match(algebraOperation({op:"remove",kind:"posX2",count:1}),/− x² on both sides/);
  assert.match(algebraOperation({op:"add",kind:"posX2",count:3}),/\+ 3x² on both sides/);
  assert.match(algebraOperation(sqrt),/principal root/);
});

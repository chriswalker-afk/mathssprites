import test from "node:test";
import assert from "node:assert/strict";
import {rational as q,req} from "../src/rational.mjs";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {fractionMoveLowerBound} from "../src/fraction-campaign-levels.mjs";
import {findCampaignStage,findCampaignLevel,isCampaignPlayable,nextCampaignLevel} from "../src/campaign-registry.mjs";
import {blankCampaignRecords,withCampaignCompleted,campaignStageRecord,campaignStars,campaignStarTotals,normalizeCampaignResume} from "../src/campaign-records.mjs";
import {initialState,perform,isSolved,balanceDifference,validInitialLevel} from "../src/engine.mjs";
import {parseFractionNotebookOperation,startFractionNotebook,previewFractionNotebookOperation,tryFractionNotebookOperation,undoFractionNotebook,fractionNotebookReplayScript,fractionNotebookOperationText} from "../src/fraction-notebook-engine.mjs";
import {fractionWrittenOperationMarkup} from "../src/fraction-notebook.mjs";
import {fractionOperationMarkup,fractionEquationMarkup} from "../src/fraction-campaign.mjs";

const get=n=>findCampaignLevel("fractions","notebook",n).level;
const pairs=(a,b)=>["left","right"].every(side=>["posX","posOne"].every(k=>req(a[side][k],b[side][k])));
test("fraction operation parser accepts exact fractions, equivalent notation, mixed numbers and integer scaling",()=>{
  for(const input of ["−1/2x","-(1/2)x","-x/2","-(x/2)","-2x/4","-3/6x","-  1 / 2 X"]){
    const result=parseFractionNotebookOperation(input);
    assert.equal(result.ok,true,input);
    assert.deepEqual(result.action,{op:"remove",kind:"posX",count:q(1,2)},input);
  }
  assert.deepEqual(parseFractionNotebookOperation("+x").action,{op:"add",kind:"posX",count:q(1)});
  assert.deepEqual(parseFractionNotebookOperation("+3").action,{op:"add",kind:"posOne",count:q(3)});
  assert.deepEqual(parseFractionNotebookOperation("−1 1/2").action,{op:"remove",kind:"posOne",count:q(3,2)});
  assert.deepEqual(parseFractionNotebookOperation("+(1 1/2)x").action,{op:"add",kind:"posX",count:q(3,2)});
  assert.deepEqual(parseFractionNotebookOperation("*4").action,{op:"multiply",factor:4});
  assert.deepEqual(parseFractionNotebookOperation("/3").action,{op:"divide",factor:3});
  assert.deepEqual(parseFractionNotebookOperation("÷2").action,{op:"divide",factor:2});
  assert.deepEqual(parseFractionNotebookOperation("+2/14").code,"unsupported-denominator");
  assert.equal(parseFractionNotebookOperation("−14/28").ok,true);
});
test("operation parser refuses ambiguous or unsupported input, without evaluating expressions",()=>{
  for(const input of ["", "-", "1/2", "-1/0", "-0", "-1.5", "-1 2", "+(-1/2)", "+x^2", "+1/2+1/2", "×1", "÷0", "×6", "÷1/2", "×x", "-13", "-1/7", "-1 3/2", "2x=4", "alert(1)", "−1/2/3"]){
    assert.equal(parseFractionNotebookOperation(input).ok,false,input);
  }
  assert.equal(parseFractionNotebookOperation("-1/0").code,"denominator");
  assert.equal(parseFractionNotebookOperation("-1/7").code,"unsupported-denominator");
  assert.equal(parseFractionNotebookOperation("×1/2").code,"factor");
});
test("paper preview is non-mutating, confirms one exact action, and Undo restores the original line",()=>{
  const session=startFractionNotebook(get(9));
  const snapshot=JSON.stringify(session);
  const invalid=previewFractionNotebookOperation(session,"−1/3");
  assert.equal(invalid.ok,true); // sixths are supported; alternate route is valid
  assert.equal(previewFractionNotebookOperation(session,"−3").ok,false);
  assert.equal(JSON.stringify(session),snapshot);
  assert.throws(()=>fractionNotebookReplayScript(session));
  const preview=previewFractionNotebookOperation(session,"−2/4");
  assert.equal(preview.ok,true);
  assert.equal(preview.solved,false);
  assert.equal(preview.state.history.length,1);
  assert.equal(session.steps.length,0);
  assert.match(fractionWrittenOperationMarkup(preview,fractionOperationMarkup),/<mfrac><mn>2<\/mn><mn>4<\/mn><\/mfrac>/);
  const confirmed=tryFractionNotebookOperation(session,"−2/4");
  assert.equal(confirmed.session.steps.length,1);
  assert.deepEqual(confirmed.session.steps[0].written,{n:2,d:4,variable:false});
  assert.deepEqual(undoFractionNotebook(confirmed.session),session);
  const solved=tryFractionNotebookOperation(confirmed.session,"÷3");
  assert.equal(solved.solved,true);
  assert.equal(solved.session.steps.length,2);
  assert.match(fractionEquationMarkup(solved.state),/<mfrac><mn>5<\/mn><mn>2<\/mn><\/mfrac>/);
  assert.equal(tryFractionNotebookOperation(solved.session,"+1").code,"complete");
  assert.equal(fractionNotebookReplayScript(solved.session).length,2);
});
test("all sixteen Apprentice levels reach the certified minimum through typed operations and exact physical replay",()=>{
  const stage=findCampaignStage("fractions","notebook");
  assert.equal(stage.available,true);assert.equal(stage.method,"notebook");
  assert.equal(stage.chapters.length,4);assert.equal(stage.levels.length,16);
  for(const chapter of stage.chapters)assert.equal(stage.levels.filter(s=>s.chapterIndex===chapter.index).length,4);
  for(const slot of stage.levels){
    assert.equal(isCampaignPlayable("fractions","notebook",slot.id),true);
    assert.equal(validInitialLevel(slot.level),true);
    assert.equal(Object.hasOwn(slot.level,"reference"),false);
    assert.equal(stage.optimalMoves[slot.id],fractionMoveLowerBound(slot.level));
    const ref=FRACTION_LEVEL_PLAN.find(l=>l.id===slot.id).reference;
    let session=startFractionNotebook(slot.level);
    for(const action of ref){
      const result=tryFractionNotebookOperation(session,fractionNotebookOperationText(action));
      assert.equal(result.ok,true,slot.id+" "+result.message);session=result.session;
    }
    assert.equal(isSolved(session.state),true,slot.id);
    assert.equal(session.steps.length,stage.optimalMoves[slot.id],slot.id);
    const script=fractionNotebookReplayScript(session);
    let scene=initialState(slot.level);
    for(const tx of script){
      assert.equal(pairs(scene,tx.before),true,slot.id);
      const result=perform(scene,tx.action,"auto");
      assert.equal(result.ok,true,slot.id);scene=result.state;
      assert.equal(pairs(scene,tx.after),true,slot.id);
      assert.equal(req(balanceDifference(scene),0),true,slot.id);
    }
    assert.equal(isSolved(scene),true,slot.id);
    assert.equal(pairs(scene,session.state),true,slot.id);
    while(session.steps.length)session=undoFractionNotebook(session);
    assert.deepEqual(session,startFractionNotebook(slot.level));
  }
  assert.equal(nextCampaignLevel("fractions","notebook",16),null);
  assert.equal(isCampaignPlayable("squares","notebook",1),false);
});
test("fraction notebook saves remain isolated and totals are 60 levels and 180 stars in World 3",()=>{
  let state=blankCampaignRecords();
  state=withCampaignCompleted(state,"fractions","notebook","frac-a-01",1);
  assert.deepEqual(campaignStageRecord(state,"fractions","notebook").completed,["frac-a-01"]);
  assert.equal(campaignStageRecord(state,"fractions","notebook").lastPlayed,"frac-a-02");
  assert.equal(campaignStars(state,"fractions","notebook","frac-a-01"),3);
  for(const stage of ["guided","independent"])assert.deepEqual(campaignStageRecord(state,"fractions",stage).completed,[]);
  for(const world of ["workshop","opposites"])assert.deepEqual(campaignStageRecord(state,world,"notebook").completed,[]);
  assert.deepEqual(campaignStarTotals(state,{worldId:"fractions",stageId:"notebook"}),{earned:3,available:48,completed:1,count:16});
  assert.deepEqual(campaignStarTotals(state,{worldId:"fractions"}),{earned:3,available:180,completed:1,count:60});
  assert.equal(campaignStarTotals(state).count,180);
  assert.equal(campaignStarTotals(state).available,540);
  assert.equal(normalizeCampaignResume({worldId:"fractions",stageId:"notebook",levelId:"frac-a-02"}).levelId,"frac-a-02");
  assert.equal(normalizeCampaignResume({worldId:"squares",stageId:"notebook",levelId:"square-a-01"}),null);
});

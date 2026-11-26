import test from "node:test";
import assert from "node:assert/strict";
import { WRITING_PACE, WRITING_SPEEDS, DEFAULT_WRITING_SPEED, advanceWritingClock, symbolsOf, buildWritingTimeline } from "../src/replay-timeline.mjs";

test("every symbol is individually revealed only after the nib moves to it", () => {
  const line = "2x + 3 = x + 7";
  const plan = buildWritingTimeline([line], { opening: true });
  const moves = plan.events.filter(e => e.type === "move-pen");
  const reveals = plan.events.filter(e => e.type === "reveal-symbol");
  assert.equal(moves.length, symbolsOf(line).length);
  assert.equal(reveals.length, symbolsOf(line).length);
  for (let i = 0; i < moves.length; i++) {
    assert.equal(moves[i].symbolIndex, i);
    assert.equal(reveals[i].symbolIndex, i);
    assert.equal(reveals[i].symbol, symbolsOf(line)[i]);
    assert.equal(reveals[i].at - moves[i].at, WRITING_PACE.penLeadMs);
    if (i > 0) {
      assert.ok(reveals[i].at > reveals[i - 1].at,
        "No two symbols should be revealed simultaneously");
    }
  }
});
test("the hand finishes its comic action before writing the operation", () => {
  const plan = buildWritingTimeline(["− x on both sides", "x + 3 = 7"]);
  const action = plan.events.find(e => e.type === "action-complete");
  const firstPen = plan.events.find(e => e.type === "move-pen");
  assert.ok(action.at < firstPen.at);
  assert.equal(action.at, WRITING_PACE.actionCompleteMs);
});
test("the next line starts only after the prior line is complete", () => {
  const lines = ["− x on both sides", "x + 3 = 7"];
  const plan = buildWritingTimeline(lines);
  const completedLine = plan.events.find(e => e.type === "line-complete" && e.lineIndex === 0);
  const nextLine = plan.events.find(e => e.type === "move-pen" && e.lineIndex === 1);
  assert.ok(nextLine.at - completedLine.at >= WRITING_PACE.betweenLinesMs);
  assert.ok(plan.durationMs > plan.writingCompleteAt);
});
test("opening panel and operation panel both have substantial read time", () => {
  const intro = buildWritingTimeline(["x + 2 = 5"], { opening: true });
  const move = buildWritingTimeline(["− 2 on both sides", "x = 3"]);
  assert.equal(intro.actionCompleteAt, null);
  assert.ok(intro.durationMs >= 4000);
  assert.ok(move.durationMs > intro.durationMs);
  assert.ok(move.durationMs - move.writingCompleteAt >= WRITING_PACE.afterPanelMs);
});
test("mathematical minus and division are each one unicode symbol", () => {
  assert.deepEqual(symbolsOf("−x ÷ 5"), ["−", "x", " ", "÷", " ", "5"]);
  assert.equal(buildWritingTimeline(["−x ÷ 5"]).symbolCount, 6);
});
test("invalid blank panel is rejected", () => {
  assert.throws(() => buildWritingTimeline([]), TypeError);
});

test("Normal inherits the old Quick pace, and Fast is faster while Careful is unchanged",()=>{
  assert.equal(DEFAULT_WRITING_SPEED,1.6);
  assert.equal(WRITING_SPEEDS.normal,1.6);
  assert.equal(WRITING_SPEEDS.fast,2.5);
  assert.equal(WRITING_SPEEDS.careful,.7);
  const plan=buildWritingTimeline(["x + 2 = 5"],{opening:true});
  const start=plan.writingStartAt;
  assert.equal(advanceWritingClock(plan,start,100),start+160);
  assert.equal(advanceWritingClock(plan,start,100,WRITING_SPEEDS.fast),start+250);
  assert.equal(advanceWritingClock(plan,start,100,WRITING_SPEEDS.careful),start+70);
});

test("writing speed never accelerates the physical move or the finished-equation read time",()=>{
  const pace={...WRITING_PACE,actionCompleteMs:WRITING_PACE.actionCompleteMs+2850,
    operationDelayMs:WRITING_PACE.operationDelayMs+2850};
  const plan=buildWritingTimeline(["− 2 on both sides","x = 3"],{pace});
  for(const speed of Object.values(WRITING_SPEEDS)){
    assert.equal(advanceWritingClock(plan,0,plan.writingStartAt,speed),plan.writingStartAt);
    assert.equal(advanceWritingClock(plan,plan.actionCompleteAt-20,40,speed),plan.actionCompleteAt+20);
    assert.equal(advanceWritingClock(plan,plan.writingCompleteAt,pace.afterPanelMs,speed),plan.durationMs);
    assert.ok(Math.abs(advanceWritingClock(plan,plan.writingStartAt-10,20,speed)-(plan.writingStartAt+10*speed))<1e-9);
    assert.ok(Math.abs(advanceWritingClock(plan,plan.writingCompleteAt-10*speed,30,speed)-(plan.writingCompleteAt+20))<1e-9);
  }
});

test("mid-line pace changes continue the same timeline and reduced-motion timelines use real time",()=>{
  const plan=buildWritingTimeline(["2x + 3 = 9"],{opening:true});
  const before=plan.writingStartAt;
  const normal=advanceWritingClock(plan,before,100,WRITING_SPEEDS.normal);
  assert.equal(advanceWritingClock(plan,normal,100,WRITING_SPEEDS.fast),normal+250);
  assert.equal(advanceWritingClock({events:[],durationMs:3900},500,80,2.5),580);
});

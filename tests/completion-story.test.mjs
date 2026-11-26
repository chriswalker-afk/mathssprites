import test from "node:test";
import assert from "node:assert/strict";
import {fractionStoryItems,squareStoryMarkup,storyEntries} from "../src/completion-story.mjs";
import {initialState,perform,equation,isSolved} from "../src/engine.mjs";
import {findCampaignLevel} from "../src/campaign-registry.mjs";
import {fractionRoom} from "../src/fraction-engine.mjs";
test("fraction miniatures preserve exact whole and partial objects without decimals",()=>{
  const room=fractionRoom({posX:{n:2,d:3},posOne:{n:7,d:2}});
  const markup=fractionStoryItems(room);
  assert.match(markup,/aria-label="2\/3 sprites"/);
  assert.match(markup,/aria-label="7\/2 weights"/);
  assert.match(markup,/data-numerator="2" data-denominator="3"/);
  assert.match(markup,/data-numerator="1" data-denominator="2"/);
  assert.equal((markup.match(/mini-token posOne/g)||[]).length,3);
  assert.match(fractionStoryItems(fractionRoom({})),/mini-empty/);
});
test("shared story contains the starting balance and every exact committed fractional transaction",()=>{
  const level=findCampaignLevel("fractions","guided",1).level;
  const start=initialState(level);
  const result=perform(start,{op:"divide",factor:2},"auto");
  assert.ok(result.ok&&isSolved(result.state));
  const entries=storyEntries(result.state);
  assert.equal(entries.length,2);
  assert.equal(equation(entries[0].after),equation(start));
  assert.equal(equation(entries[1].after),"x = 5/2");
  assert.equal(entries[1].action.factor,2);
});
test("square story diagrams retain each of the mathematically correct mixed-area cells",()=>{
  const before={left:{posX:1,posOne:1},right:{posOne:4}};
  const markup=squareStoryMarkup({before,action:{op:"square"}});
  assert.match(markup,/data-square-operation="square"/);
  assert.equal((markup.match(/data-kind="posX2"/g)||[]).length,1);
  assert.equal((markup.match(/data-kind="posX"/g)||[]).length,2);
  assert.equal((markup.match(/data-kind="posOne"/g)||[]).length,17);
  assert.match(markup,/\(x \+ 1\)² = x² \+ 2x \+ 1/);
  assert.equal(squareStoryMarkup({before,action:{op:"remove"}}),"");
  assert.match(squareStoryMarkup({before:{left:{posX2:1,posX:2,posOne:1},right:{posOne:16}},action:{op:"sqrt"}}),/data-square-operation="sqrt"/);
});

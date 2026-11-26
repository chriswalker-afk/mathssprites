import test from "node:test";
import assert from "node:assert/strict";
import {createRewardCelebrationQueue} from "../src/reward-celebration.mjs";
test("new unlocks wait in a queue until review and are announced in milestone order only once",()=>{
  const queue=createRewardCelebrationQueue();
  assert.equal(queue.size,0);
  assert.equal(queue.enqueue(["extra-fluffy","curious-eyes","unknown"]),2);
  assert.equal(queue.enqueue(["curious-eyes"]),2);
  assert.deepEqual(queue.take().map(r=>r.id),["curious-eyes","extra-fluffy"]);
  assert.equal(queue.size,0);
  assert.deepEqual(queue.take(),[]);
  assert.equal(queue.enqueue(["curious-eyes","little-bow-tie"]),1);
  assert.deepEqual(queue.take().map(r=>r.id),["little-bow-tie"]);
  assert.deepEqual(queue.take(),[]);
});
test("startup, no new entitlements and repeat completion have no queued announcement",()=>{
  const queue=createRewardCelebrationQueue();
  queue.enqueue([]);queue.enqueue(undefined);
  assert.deepEqual(queue.take(),[]);
  queue.enqueue(["springy-bounce"]);
  assert.equal(queue.take()[0].stars,60);
  queue.enqueue(["springy-bounce"]);
  assert.deepEqual(queue.take(),[]);
});

test("new weight and chamber milestones use the same ordered one-time celebration queue",()=>{
  const queue=createRewardCelebrationQueue();
  assert.equal(queue.enqueue(["clockmakers-workshop","polished-steel","dumbbell"]),3);
  assert.deepEqual(queue.take().map(r=>r.id),["polished-steel","dumbbell","clockmakers-workshop"]);
  assert.equal(queue.enqueue(["dumbbell"]),0);
});

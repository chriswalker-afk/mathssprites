import test from "node:test";
import assert from "node:assert/strict";
import {GROUP_SPECS,selectBrowserGroups,featureMatrix} from "../scripts/browser-qa-plan.mjs";

test("docs-only changes do not launch expensive browser groups",()=>{
  assert.deepEqual(selectBrowserGroups(["README.md","docs/PR41_PHYSICAL_CRATES.md"]),[]);
});
test("crate artwork and animation changes run actual crate interaction tests",()=>{
  assert.deepEqual(selectBrowserGroups(["src/crate-physical.css"]),["crates"]);
  assert.deepEqual(selectBrowserGroups(["src/crate-expansion-view.mjs"]),["crates"]);
  assert.deepEqual(selectBrowserGroups(["tests/crate-physical.test.mjs"]),["crates"]);
});
test("feature edits select only their relevant browser group",()=>{
  assert.deepEqual(selectBrowserGroups(["src/opposite-guided.mjs"]),["signed"]);
  assert.deepEqual(selectBrowserGroups(["src/notebook-engine.mjs"]),["notebook"]);
  assert.deepEqual(selectBrowserGroups(["src/site.mjs"]),["navigation"]);
  assert.deepEqual(selectBrowserGroups(["src/viewport-adaptive.css"]),["layout"]);
});
test("shared maths and entrypoint changes trigger multiple independent safety checks",()=>{
  assert.deepEqual(selectBrowserGroups(["src/engine.mjs"]),["crates","notebook","signed","physics"]);
  assert.equal(selectBrowserGroups(["src/app.mjs"]).length,Object.keys(GROUP_SPECS).length);
  assert.deepEqual(selectBrowserGroups(["index.html"]),["crates","navigation","notebook","signed","layout"]);
});
test("unknown new runtime or browser test files fail safe to all focused suites",()=>{
  assert.deepEqual(selectBrowserGroups(["src/new-balancing-system.mjs"]),
    Object.keys(GROUP_SPECS));
  assert.deepEqual(selectBrowserGroups(["e2e/new-system.spec.mjs"]),
    Object.keys(GROUP_SPECS));
});
test("deduplicated matrix emits only static, approved Playwright file paths",()=>{
  const matrix=featureMatrix(["src/crate-expansion-view.mjs",
    "src/group-crates.mjs","docs/PR41_PHYSICAL_CRATES.md"]);
  assert.equal(matrix.include.length,1);
  assert.equal(matrix.include[0].group,"crates");
  assert.ok(matrix.include[0].specs.includes("e2e/crate-expansion.spec.mjs"));
  assert.ok(matrix.include[0].specs.includes("e2e/crate-division.spec.mjs"));
  for(const specs of Object.values(GROUP_SPECS))
    for(const spec of specs)assert.match(spec,/^e2e\/[a-z-]+\.spec\.mjs$/);
  assert.deepEqual(featureMatrix([]),{include:[]});
});


test("focused suites include site navigation, workshop, and motion regression",()=>{
  assert.ok(GROUP_SPECS.navigation.includes("e2e/site-navigation.spec.mjs"));
  assert.ok(GROUP_SPECS.navigation.includes("e2e/onboarding-polish.spec.mjs"));
  assert.ok(GROUP_SPECS.notebook.includes("e2e/equation-workshop.spec.mjs"));
  assert.ok(GROUP_SPECS.layout.includes("e2e/motion-notice.spec.mjs"));
  assert.deepEqual(selectBrowserGroups(["e2e/onboarding-polish.spec.mjs"]),["navigation"]);
  assert.deepEqual(selectBrowserGroups(["e2e/equation-workshop.spec.mjs"]),["notebook"]);
  assert.deepEqual(selectBrowserGroups(["e2e/motion-notice.spec.mjs"]),["layout"]);
});

test("teacher-only curriculum metadata uses unit tests, not six browser suites",()=>{
  assert.deepEqual(selectBrowserGroups([
    "src/curriculum.mjs","tests/curriculum.test.mjs",
    "scripts/curriculum-report.mjs","docs/CURRICULUM_AND_DIFFICULTY.md"
  ]),[]);
  assert.deepEqual(featureMatrix(["src/curriculum.mjs"]),{include:[]});
});

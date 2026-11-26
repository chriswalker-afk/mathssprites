import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {GROUP_SPECS,selectBrowserGroups,featureMatrix} from "../scripts/browser-qa-plan.mjs";

test("docs-only changes do not launch expensive browser groups",()=>{
  assert.deepEqual(selectBrowserGroups(["README.md","docs/PR41_PHYSICAL_CRATES.md"]),[]);
});
test("crate artwork and animation changes run actual crate interaction tests",()=>{
  assert.deepEqual(selectBrowserGroups(["src/crate-physical.css"]),["crates"]);
  assert.deepEqual(selectBrowserGroups(["src/crate-expansion-view.mjs"]),["crates"]);
  assert.deepEqual(selectBrowserGroups(["tests/crate-physical.test.mjs"]),["crates"]);
  assert.deepEqual(selectBrowserGroups(["e2e/signed-crate-physics.spec.mjs"]),["crates"]);
  assert.ok(GROUP_SPECS.crates.includes("e2e/signed-crate-physics.spec.mjs"));
  assert.deepEqual(selectBrowserGroups(["e2e/signed-crate-chapter.spec.mjs"]),["crates"]);
  assert.ok(GROUP_SPECS.crates.includes("e2e/signed-crate-chapter.spec.mjs"));
  assert.deepEqual(selectBrowserGroups(["e2e/world2-other-mode-crates.spec.mjs"]),["crates"]);
  assert.ok(GROUP_SPECS.crates.includes("e2e/world2-other-mode-crates.spec.mjs"));
});
test("feature edits select only their relevant browser group",()=>{
  assert.deepEqual(selectBrowserGroups(["src/opposite-guided.mjs"]),["signed"]);
  for(const path of ["src/notebook-engine.mjs","src/notebook-maths-editor.mjs"])
    assert.deepEqual(selectBrowserGroups([path]),["notebook","signed","area"],path);
  assert.deepEqual(selectBrowserGroups(["src/site.mjs"]),["navigation"]);
  assert.deepEqual(selectBrowserGroups(["src/viewport-adaptive.css"]),["layout"]);
});
test("World 2 rebalance and save migration run the correct focused browser groups",()=>{
  assert.deepEqual(selectBrowserGroups(["src/opposite-guided.mjs"]),["signed"]);
  assert.deepEqual(selectBrowserGroups(["e2e/world2-difficulty-pass.spec.mjs"]),["signed"]);
  assert.ok(GROUP_SPECS.signed.includes("e2e/world2-difficulty-pass.spec.mjs"));
  assert.deepEqual(selectBrowserGroups(["src/campaign-records.mjs"]),
    ["navigation","signed","physics"]);
  assert.deepEqual(selectBrowserGroups(["src/polish.css"]),["navigation","layout"]);
});
test("certified World 2 par data and registry changes cannot skip star/navigation QA",()=>{
  assert.deepEqual(selectBrowserGroups(["src/opposite-star-benchmarks.mjs"]),
    ["navigation","signed","physics"]);
  assert.deepEqual(selectBrowserGroups(["src/campaign-registry.mjs"]),
    ["navigation","notebook","signed","physics"]);
  assert.deepEqual(selectBrowserGroups([
    "scripts/world2-shortest-routes.mjs","scripts/audit-world2-routes.mjs",
    "tests/world2-optimal-routes.test.mjs"
  ]),[],"teacher audit and test-only changes do not launch animations");
});
test("six-chapter board CSS changes route to navigation and layout without game physics",()=>{
  assert.deepEqual(selectBrowserGroups(["src/experiment-board.css"]),
    ["navigation","layout"]);
  assert.deepEqual(selectBrowserGroups(["e2e/six-chapter-layout.spec.mjs"]),
    ["layout"]);
});
test("weight pile changes exercise crate, signed, physics and layout QA",()=>{
  for(const path of ["src/weight-piles.css","src/weight-piles.mjs",
    "e2e/weight-piles.spec.mjs"]){
    assert.deepEqual(selectBrowserGroups([path]),
      ["crates","signed","layout","physics"],path);
  }
});
test("shared maths and entrypoint changes trigger multiple independent safety checks",()=>{
  assert.deepEqual(selectBrowserGroups(["src/engine.mjs"]),["crates","notebook","signed","physics","controls","motion","attempts","area"]);
  assert.equal(selectBrowserGroups(["src/app.mjs"]).length,Object.keys(GROUP_SPECS).length);
  assert.deepEqual(selectBrowserGroups(["index.html"]),["crates","navigation","notebook","signed","layout","controls"]);
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
    for(const spec of specs)assert.match(spec,/^e2e\/[a-z0-9-]+\.spec\.mjs$/);
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

test("retired menu visual, Apprentice and Independent specs are included in focused QA",()=>{
  for(const name of ["menu-polish-visual","portal-art","home-hero"]){
    const file="e2e/"+name+".spec.mjs";
    assert.ok(GROUP_SPECS.visual.includes(file),file);
    assert.deepEqual(selectBrowserGroups([file]),["visual"],file);
  }
  assert.ok(GROUP_SPECS.notebook.includes("e2e/apprentice-campaign.spec.mjs"));
  assert.deepEqual(selectBrowserGroups(["e2e/apprentice-campaign.spec.mjs"]),["notebook"]);
  assert.ok(GROUP_SPECS.physics.includes("e2e/independent-balance.spec.mjs"));
  assert.deepEqual(selectBrowserGroups(["e2e/independent-balance.spec.mjs"]),["physics"]);
  for(const files of Object.values(GROUP_SPECS))
    for(const file of files)
      assert.match(file,/^e2e\/[a-z0-9-]+\.spec\.mjs$/);
});

test("each browser spec is covered exactly once by the primary feature matrix",()=>{
  const expected=readdirSync(new URL("../e2e/",import.meta.url))
    .filter(name=>name.endsWith(".spec.mjs")).map(name=>"e2e/"+name).sort();
  const assigned=Object.values(GROUP_SPECS).flat().sort();
  assert.deepEqual(assigned,expected,"no missing or duplicate primary browser specs");
  for(const [group,specs] of Object.entries(GROUP_SPECS))
    for(const spec of specs)
      assert.ok(selectBrowserGroups([spec]).includes(group),spec);
  assert.deepEqual(selectBrowserGroups(["e2e/failed-attempts.spec.mjs"]),["attempts"]);
  assert.deepEqual(selectBrowserGroups(["e2e/squares.spec.mjs"]),["area"]);
  assert.deepEqual(selectBrowserGroups(["e2e/sprite-idle.spec.mjs"]),["motion"]);
  assert.deepEqual(selectBrowserGroups(["e2e/signed-objects.spec.mjs"]),["signed"]);
  assert.deepEqual(selectBrowserGroups(["e2e/neutral-starting-controls.spec.mjs"]),["controls"]);
});

test("full browser QA uses six test-level shards instead of duplicating the focused matrix",()=>{
  const workflow=readFileSync(new URL("../.github/workflows/browser-animations.yml",import.meta.url),"utf8");
  const changes=workflow.slice(workflow.indexOf("\n  changes:"),workflow.indexOf("\n  focused:"));
  const focused=workflow.slice(workflow.indexOf("\n  focused:"),workflow.indexOf("\n  full-browser:"));
  for(const job of [changes,focused])
    assert.match(job,/!\s*contains\(github\.event\.pull_request\.labels\.\*\.name, 'full-browser-qa'\)/);
  assert.match(workflow,/shard:\s*\[1, 2, 3, 4, 5, 6\]/);
  assert.match(workflow,/--fully-parallel --shard=.*\/6 --workers=1/);
  assert.match(workflow,/--grep @quick --workers=2/);
});

/** npm run audit:world4 -- --stage guided --json */
import {auditSquareWorld} from "./world4-square-audit.mjs";
const args=process.argv.slice(2),i=args.indexOf("--stage");
if(i>=0&&!args[i+1])throw new RangeError("Specify guided, independent or notebook");
const {summary,levels}=auditSquareWorld({stage:i<0?null:args[i+1]});
if(args.includes("--json"))console.log(JSON.stringify({summary,levels},null,2));
else{
  console.log("# World 4 — exact square route and physical representation audit\n");
  console.log("Certified "+summary.levels+" minimum routes; "+summary.buildGoals+" build goals and "+summary.solveGoals+" solve goals.");
  console.log("Move distribution: "+JSON.stringify(summary.minima));
  console.log("Authored peak: "+summary.peakAuthored+" objects; computed peak: "+summary.peakFound+" objects. Largest side: "+summary.maxSide+" markers.");
  console.log("All three controllers, both visit orders, checked paper, physical frames and undo verified. Teacher-only solutions below.");
  for(const [stage,s] of Object.entries(summary.byStage)){
    console.log("\n## "+stage+" — "+s.levels+" levels / "+s.stars+" stars\n");
    console.log("| # | ID | Equation | Goal | Tier | Minimum | Peak objects | Side | Inspection | Legal witness |");
    console.log("|---:|---|---|---|---:|---:|---:|---:|---|---|");
    for(const r of levels.filter(l=>l.stage===stage))
      console.log("| "+[r.number,r.id,r.equation,r.goal,r.tier,r.minimum,r.authoredPeak,r.maxSide,r.inspection,r.witness.join(" → ")].join(" | ")+" |");
  }
}

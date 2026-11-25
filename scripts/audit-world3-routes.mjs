/** npm run audit:world3 -- --stage guided --json */
import {auditFractionWorld} from "./world3-fraction-audit.mjs";
const args=process.argv.slice(2),index=args.indexOf("--stage");
if(index>=0&&!args[index+1])throw new RangeError("Specify guided, independent or notebook");
const report=auditFractionWorld({stage:index>=0?args[index+1]:null});
if(args.includes("--json"))console.log(JSON.stringify(report,null,2));
else{
  const {summary,levels}=report;
  console.log("# World 3 — exact fraction route audit\n");
  console.log("Certified "+summary.levels+" legal minimum routes. "+summary.fractionalSolutions+" fractional solutions. Peak reference settled pieces: "+summary.referencePeakSettled+".");
  console.log("Minimum-move distribution: "+JSON.stringify(summary.minima)+"\n");
  console.log("Independent coefficient-only BFS + mandatory cancellations proves a lower bound; the real engine attains it. Temporary frame quantities are checked separately from settled capacity. Teacher-only solutions below.\n");
  for(const stage of Object.keys(summary.byStage)){
    console.log("## "+stage+"\n\n| # | ID | Equation | Tier | Minimum | Peak settled | Peak temporary | Legal witness |\n|---:|---|---|---:|---:|---:|---:|---|");
    for(const r of levels.filter(x=>x.stage===stage))
      console.log("| "+[r.number,r.id,r.equation,r.tier,r.minimum,r.referencePeakSettled,r.referencePeakTemporary,r.witness.join(" → ")].join(" | ")+" |");
    console.log("");
  }
}

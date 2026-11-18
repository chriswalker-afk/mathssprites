// GitHub Actions public deployment probe - run on pull requests as a separate
// job to diagnose the *live GitHub Pages* address, not just a local webserver.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const base = "https://chriswalker-afk.github.io/mathssprites/";
const assets = ["", "src/styles.css", "src/app.mjs", "src/sprite-motion.mjs",
  "src/sprite-reactions.mjs", "src/engine.mjs", "src/hand-timeline.mjs"];
const run = process.env.GITHUB_RUN_ID || "local";
const status = { at: new Date().toISOString(), run, base, files: {}, pagesApi: null };
function sha(text) { return createHash("sha256").update(text).digest("hex").slice(0, 16); }
async function download(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(18000),
      headers: { "User-Agent": "mathssprites-public-pages-diagnostic" } });
    return { status: r.status, url: r.url, type: r.headers.get("content-type"),
      cache: r.headers.get("cache-control"), text: await r.text() };
  } catch (e) {
    return { status: "NETWORK_ERROR", error: String(e), text: "" };
  }
}
for (const path of assets) {
  // Vary the query to rule out stale browser/proxy cached assets.
  const fetched = await download(base + path + "?check=" + run);
  const localPath = path || "index.html";
  let local = "";
  try { local = readFileSync(localPath, "utf8"); } catch {}
  const body = fetched.text || "";
  const details = {
    status: fetched.status,
    finalUrl: fetched.url,
    contentType: fetched.type,
    bytes: body.length,
    sameAsMain: !!local && sha(local) === sha(body),
    servedHash: sha(body),
    repoHash: local ? sha(local) : null,
    hasAppModule: path === "" ? body.includes('src="./src/app.mjs"') : undefined,
    containsMotionButton: path === "" ? body.includes('id="motion-toggle"') : undefined,
    containsBounce: path === "src/styles.css" ? body.includes("@keyframes sprite-hop") : undefined,
    containsReactions: path === "src/app.mjs" ? body.includes("pickSpriteHandReaction") : undefined,
    firstBytes: body.slice(0, 140).replaceAll("\n", " ")
  };
  status.files[localPath] = details;
  console.log("PUBLIC ASSET", JSON.stringify({ path: localPath, ...details }));
}
const api = await download("https://api.github.com/repos/chriswalker-afk/mathssprites/pages");
status.pagesApi = {
  httpStatus: api.status,
  details: api.status === 200 ? (()=>{try{ const p=JSON.parse(api.text);
    return { html_url:p.html_url, status:p.status, build_type:p.build_type,
      source:p.source, custom_domain:p.cname || null };
  }catch{return { parseError:true }}})()
    : { firstBytes: api.text?.slice(0, 180) }
};
console.log("PAGES CONFIG", JSON.stringify(status.pagesApi));
mkdirSync("artifacts", { recursive:true });
writeFileSync("artifacts/pages-deployment-diagnostic.json", JSON.stringify(status,null,2));
const good = Object.values(status.files).every(x=>x.status===200);
console.log("PUBLIC SITE RESULT",good?"All files resolve":"Some files missing; check Pages settings");
if (!good) process.exitCode = 1;

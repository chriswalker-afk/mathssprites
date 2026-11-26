import {expect} from "@playwright/test";

/** Inspect the visible physical scene, including the fraction shadow tree.
 * All measurements are CSS pixels; do not use screenshot-dependent pixels. */
export async function assertGrounded(scene,{settled=true}={}){
  await expect(scene).toBeVisible();
  const m=await scene.evaluate(el=>{
    const get=s=>el.querySelector(s);
    const rect=node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width};};
    const row=get(".rooms-row"),beam=get(".scale-beam");
    const pivot=node=>{const [x,y]=getComputedStyle(node).transformOrigin.split(" ").map(parseFloat);return {x:node.offsetLeft+x,y:node.offsetTop+y};};
    return {scene:rect(el),base:rect(get(".scale-base")),bench:rect(get(".workbench")),beam:rect(beam),
      pans:[...el.querySelectorAll(".scale-pan")].map(rect),rooms:[...el.querySelectorAll(".room-interior")].map(rect),
      rowPivot:pivot(row),beamPivot:pivot(beam),angle:row.style.transform,beamAngle:beam.style.transform};
  });
  const detail=JSON.stringify(m);
  expect(Math.abs(m.base.bottom-m.bench.top),"Pedestal must meet floor: "+detail).toBeLessThanOrEqual(3);
  expect(Math.abs(m.scene.bottom-m.bench.bottom),"Floor is pinned to scene bottom: "+detail).toBeLessThanOrEqual(3);
  expect(Math.abs(m.rowPivot.x-m.beamPivot.x),"Shared horizontal pivot: "+detail).toBeLessThanOrEqual(2);
  expect(Math.abs(m.rowPivot.y-m.beamPivot.y),"Shared vertical pivot: "+detail).toBeLessThanOrEqual(2);
  expect(m.angle).toBe(m.beamAngle);
  for(const room of m.rooms){
    expect(room.height,"Chamber retains usable height: "+detail).toBeGreaterThan(110);
    expect(room.top,"Chamber must remain in scene: "+detail).toBeGreaterThanOrEqual(m.scene.top-3);
    expect(room.bottom,"Chamber must remain above bench: "+detail).toBeLessThanOrEqual(m.bench.top+3);
    if(settled){
      expect(room.left).toBeGreaterThanOrEqual(m.scene.left-3);
      expect(room.right).toBeLessThanOrEqual(m.scene.right+3);
    }
  }
  if(settled){
    expect(Math.abs(m.base.top-m.beam.bottom),"Beam connected to support: "+detail).toBeLessThanOrEqual(3);
    for(const pan of m.pans)expect(Math.abs(pan.bottom-m.beam.top),"Pans connected to beam: "+detail).toBeLessThanOrEqual(3);
  }
  return m;
}

import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";

mkdirSync("artifacts",{recursive:true});

// Regression: PR48's sixth Guided chapter made 3 columns × 2 rows, but the
// PR27/PR37 fit-to-viewport grid continued to split ALL remaining height in
// half. The 24 level buttons became about 30px tall and clipped their name,
// stars and status on normal desktop windows (reported at ~1652×834).
const desktopViews=[
  {width:1652,height:834,label:"reported-desktop"},
  {width:1366,height:768,label:"laptop"},
  {width:1092,height:540,label:"scaled-laptop"},
  {width:1920,height:1080,label:"wide-screen"}
];

async function measureBoard(page){
  return page.locator("#level-sections").evaluate(board=>{
    const style=getComputedStyle(board);
    const tiles=[...board.querySelectorAll(".level-tile")].map(tile=>{
      const outer=tile.getBoundingClientRect();
      const parts=[...tile.querySelectorAll(".tile-number,.tile-name,.tile-stars,.tile-status")];
      return {
        id:tile.dataset.level,
        height:Math.round(outer.height*10)/10,
        content:parts.map(el=>{
          const b=el.getBoundingClientRect();
          return {
            className:el.className,top:b.top,bottom:b.bottom,
            visibleWithinTile:b.top>=outer.top-1&&b.bottom<=outer.bottom+1,
            hasHeight:b.height>5
          };
        })
      };
    });
    return {
      chapterLayout:board.dataset.chapterLayout,
      display:style.display,overflowY:style.overflowY,
      boardHeight:board.clientHeight,scrollHeight:board.scrollHeight,
      scrollWidth:board.scrollWidth,clientWidth:board.clientWidth,
      documentHeight:document.documentElement.scrollHeight,
      documentWidth:document.documentElement.scrollWidth,
      viewportHeight:innerHeight,viewportWidth:innerWidth,
      chapters:board.querySelectorAll(".chapter-group").length,tiles
    };
  });
}

test("six Guided chapters never clip any level label, stars or status at desktop sizes @quick @smoke",async({page})=>{
  test.setTimeout(95000);
  await page.emulateMedia({reducedMotion:"reduce"});
  for(const size of desktopViews){
    await page.setViewportSize(size);
    await page.goto("/");
    await page.locator("#home-choose-level").click();
    await expect(page.locator("#site-levels")).toBeVisible();
    const m=await measureBoard(page);
    expect(m.chapterLayout).toBe("multi-row");
    expect(m.display).toBe("grid");
    expect(m.overflowY).toBe("auto");
    expect(m.chapters).toBe(6);
    expect(m.tiles).toHaveLength(24);
    expect(m.scrollWidth,JSON.stringify(size)).toBeLessThanOrEqual(m.clientWidth+3);
    expect(m.documentWidth,JSON.stringify(size)).toBeLessThanOrEqual(m.viewportWidth+3);
    expect(m.documentHeight,JSON.stringify(size)).toBeLessThanOrEqual(m.viewportHeight+3);
    const clipped=m.tiles.flatMap(tile=>tile.content
      .filter(part=>!part.visibleWithinTile||!part.hasHeight)
      .map(part=>tile.id+" "+part.className+" clipped in "+tile.height+"px button"));
    expect(clipped,"Every one of the 24 tiles must show ALL its content at "+
      size.width+"×"+size.height).toEqual([]);
    // Previously 2 rows of chapters were each squeezed to ~half the
    // board, with 30px tall buttons. Avoid losing readability again.
    expect(Math.min(...m.tiles.map(x=>x.height))).toBeGreaterThan(38);
    const final=page.locator("#level-sections [data-level='24']");
    await final.scrollIntoViewIfNeeded();
    await expect(final).toBeInViewport();
    await expect(final.locator(".tile-name")).toHaveText("The hall of crates");
    await expect(final.locator(".tile-stars")).toBeVisible();
    await expect(final.locator(".tile-status")).toBeVisible();
    const back=page.locator("#level-sections [data-level='1']");
    await back.scrollIntoViewIfNeeded();
    await expect(back).toBeInViewport();
    await page.screenshot({path:"artifacts/pr51-"+size.label+"-six-chapters.png"});
  }
});

test("board scrolling is keyboard accessible, stage-specific and preserves position after a level @quick @smoke",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:1652,height:834});
  await page.goto("/");
  await page.locator("#home-choose-level").click();
  const board=page.locator("#level-sections");
  await expect(board).toHaveAttribute("role","region");
  await expect(board).toHaveAttribute("tabindex","0");
  await expect(board).toHaveAttribute("aria-label",/Scroll to see later chapters/);
  const lower=page.locator("#level-sections [data-level='24']");
  await lower.scrollIntoViewIfNeeded();
  const before=await board.evaluate(el=>el.scrollTop);
  expect(before).toBeGreaterThan(0);
  await lower.click();
  await expect(page.locator("#level-title")).toHaveText("The hall of crates");
  await page.locator("#game-levels").click();
  await expect(board).toHaveAttribute("data-chapter-layout","multi-row");
  const after=await board.evaluate(el=>el.scrollTop);
  expect(after).toBeGreaterThanOrEqual(before-2);
  await page.locator('[data-map-stage="independent"]').click();
  await expect(board).toHaveAttribute("data-chapter-layout","single-row");
  await expect(page.locator(".chapter-group")).toHaveCount(5);
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await page.locator('[data-map-stage="guided"]').click();
  await expect(board).toHaveAttribute("data-chapter-layout","multi-row");
  expect(await board.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  // Returning to the same learning stage keeps the place you last visited.
});

test("phone layout continues natural document scrolling instead of nested truncated chapters @smoke",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await page.locator("#home-choose-level").click();
  const m=await measureBoard(page);
  expect(m.chapters).toBe(6);
  expect(m.tiles).toHaveLength(24);
  expect(m.display).toBe("block");
  expect(m.overflowY).not.toBe("hidden");
  expect(m.documentHeight).toBeGreaterThan(m.viewportHeight);
  expect(m.documentWidth).toBeLessThanOrEqual(m.viewportWidth+3);
  expect(m.tiles.flatMap(tile=>tile.content
    .filter(part=>!part.visibleWithinTile||!part.hasHeight))).toEqual([]);
  await page.locator("#level-sections [data-level='24']").scrollIntoViewIfNeeded();
  await expect(page.locator("#level-sections [data-level='24']")).toBeInViewport();
});

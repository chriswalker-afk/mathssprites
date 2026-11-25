/**
 * Pure geometry for the in-room carpenter's square.
 *
 * The hand uses an existing horizontal floor row as the first SIDE of the box,
 * duplicates it vertically, and fills four meaningful regions:
 *
 *        ax           b
 *    +---------+---------+
 * ax | a² x²   | ab x    |
 *    +---------+---------+
 * b  | ab x    | b² ones |
 *    +---------+---------+
 *
 * The edge markers are dimensional guides, not additional algebra objects.
 * Only interior cells count as output tokens. The exact same layout is
 * traversed backwards for the principal square root.
 */
export function floorScaleToFit(availableWidth, naturalWidth) {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(naturalWidth) ||
      availableWidth <= 0 || naturalWidth <= 0) return 1;
  return Math.max(0.035, Math.min(1, (availableWidth - 8) / naturalWidth));
}

/** Keep legacy simple-area geometry for backwards-compatible QA. */
export function previewCells(area) {
  if (!area || !Number.isInteger(area.side) || area.side < 0 ||
      !Number.isInteger(area.cells) || area.cells !== area.side ** 2)
    throw new TypeError("The arrangement must be a complete n by n square");
  return Array.from({length:area.cells}, (_, index) => {
    const row = Math.floor(index / area.side);
    const col = index % area.side;
    const role = row === 0 ? "row" : col === 0 ? "column" : "fill";
    const delay = area.op === "square"
      ? role === "row" ? 60 * col
        : role === "column" ? 260 + row * 55
          : 440 + index * 14
      : 30 + index * 13;
    return {index, row, col, role, delay};
  });
}

export const BOX_STAGES_SQUARE = Object.freeze([
  "frame", "edge", "column", "quadratic", "mixed-top", "mixed-bottom", "units"
]);
export const BOX_STAGES_ROOT = Object.freeze([
  "frame", "units", "mixed", "quadratic", "column", "edge"
]);

/**
 * Returns geometrically square, consistently ordered CELLS plus two
 * representative EDGE RULERS. The ruler sprites/weights are faint,
 * explicitly non-counting guides; the cells are the physical output.
 */
export function inRoomBoxPlan(area) {
  if (!area || area.side < 0 || !Number.isInteger(area.side) ||
      area.cells !== area.side**2 || area.cells > 48)
    throw new TypeError("An in-room square needs a complete, bounded area");

  const a = area.kind === "mixed" ? area.spriteSide :
    area.symbolic ? area.side : 0;
  const b = area.kind === "mixed" ? area.weightSide :
    area.symbolic ? 0 : area.side;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 ||
      a + b !== area.side)
    throw new TypeError("Invalid mixed-area side lengths");

  const segments = [
    ...Array.from({length:a}, () => "sprite"),
    ...Array.from({length:b}, () => "weight")
  ];
  const cells = [];
  for (let row = 0; row < area.side; row++) {
    for (let col = 0; col < area.side; col++) {
      const vertical = segments[row];
      const horizontal = segments[col];
      const type = vertical === "sprite" && horizontal === "sprite"
        ? "square-sprite" : vertical === "weight" && horizontal === "weight"
          ? "weight" : "round-sprite";
      const region = row < a
        ? col < a ? "quadratic" : "mixed-top"
        : col < a ? "mixed-bottom" : "units";
      const stage = type === "square-sprite" ? "quadratic" :
        type === "round-sprite" ? "mixed" : "units";
      cells.push({index:cells.length, row, col, type, region, stage});
    }
  }
  const counts = {
    posX2: cells.filter(c=>c.type==="square-sprite").length,
    posX: cells.filter(c=>c.type==="round-sprite").length,
    posOne: cells.filter(c=>c.type==="weight").length
  };
  if (counts.posX2 !== a*a || counts.posX !== 2*a*b ||
      counts.posOne !== b*b || cells.length !== area.cells)
    throw new Error("Area cells must exactly represent (ax+b)^2");
  return {
    op:area.op, side:area.side, cells, counts,
    spriteSide:a, weightSide:b, regions:{
      quadratic:a*a, mixedTop:a*b, mixedBottom:a*b, units:b*b
    },
    horizontal:segments.map((type,index)=>({type,index})),
    vertical:segments.map((type,index)=>({type,index})),
    // A variable-length tile is 1.5 illustrated units, a number is 1.
    // Both dimensions use the same tracks so the box is a TRUE square.
    tracks:segments.map(x=>x==="sprite" ? 1.5 : 1),
    stages:area.op==="square" ? BOX_STAGES_SQUARE : BOX_STAGES_ROOT
  };
}

/** Labels are ARIA/notebook information, never stuck to the drawn creatures. */
export function areaMathLabel(area) {
  if (!area) return "";
  if (area.kind === "zero") return "0";
  const n=area.side, square=n*n;
  if (area.kind==="mixed") {
    const a=area.spriteSide,b=area.weightSide;
    const side=(a===1?"x":a+"x")+" + "+b;
    const full=(a*a===1?"x²":a*a+"x²")+" + "+2*a*b+"x + "+b*b;
    return area.op==="square" ? "("+side+")² = "+full :
      "√("+full+") = "+side+" (nonnegative side)";
  }
  if (area.op==="square") {
    const term=area.symbolic ? (n===1?"x":n+"x") : String(n);
    const squared=area.symbolic ? (square===1?"x²":square+"x²") : String(square);
    return term+" × "+term+" = "+squared;
  }
  const input=area.symbolic ? (square===1?"x²":square+"x²") : String(square);
  const output=area.symbolic ? (n===1?"x":n+"x") : String(n);
  return "√("+input+") = "+output;
}

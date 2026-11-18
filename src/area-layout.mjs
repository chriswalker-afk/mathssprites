/**
 * Geometry shared by the floor renderer and the hand's square-area visuals.
 * Pure numbers only: resizing and diagram animation never change the engine.
 */
export function floorScaleToFit(availableWidth, naturalWidth) {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(naturalWidth) ||
      availableWidth <= 0 || naturalWidth <= 0) return 1;
  return Math.max(0.035, Math.min(1, (availableWidth - 8) / naturalWidth));
}

export function previewCells(area) {
  if (!area || !Number.isInteger(area.side) || area.side < 0 ||
      !Number.isInteger(area.cells) || area.cells !== area.side ** 2)
    throw new TypeError("The arrangement must be a complete n by n square");
  return Array.from({length:area.cells}, (_, index) => {
    const row = Math.floor(index / area.side);
    const col = index % area.side;
    // First lay the existing horizontal row, then match its column, then
    // complete the interior one cell at a time. Even 6x6 stays in order.
    const role = row === 0 ? "row" : col === 0 ? "column" : "fill";
    const delay = area.op === "square"
      ? role === "row" ? 60 * col
        : role === "column" ? 260 + row * 55
          : 440 + index * 14
      : 30 + index * 13;
    return { index, row, col, role, delay };
  });
}

export function areaMathLabel(area) {
  if (!area) return "";
  if (area.kind === "zero") return "0";
  const n = area.side;
  const square = n * n;
  if (area.op === "square") {
    const term = area.symbolic ? (n === 1 ? "x" : n + "x") : String(n);
    const squared = area.symbolic ? (square === 1 ? "x²" : square + "x²") : String(square);
    return term + " × " + term + " = " + squared;
  }
  const input = area.symbolic ? (square === 1 ? "x²" : square + "x²") : String(square);
  const output = area.symbolic ? (n === 1 ? "x" : n + "x") : String(n);
  return "√(" + input + ") = " + output;
}

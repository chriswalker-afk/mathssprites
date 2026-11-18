/**
 * Deterministic, UI-independent schedule for the animated algebra notebook.
 * A pen movement always precedes the revelation of its corresponding symbol.
 *
 * The display clock may pause, resume or run faster without losing its place.
 * Values are "virtual milliseconds" so playback speed can change mid-line.
 */
export const WRITING_PACE = Object.freeze({
  openingDelayMs: 700,
  operationDelayMs: 1670,
  actionCompleteMs: 1000,
  characterMs: 235,
  spaceMs: 185,
  penLeadMs: 145,
  betweenLinesMs: 650,
  lineSettledMs: 240,
  afterPanelMs: 1900
});

export function symbolsOf(value) {
  // Array.from preserves Unicode code points such as the true minus sign.
  return Array.from(String(value));
}

export function buildWritingTimeline(lines, { opening = false, pace = WRITING_PACE } = {}) {
  if (!Array.isArray(lines) || lines.length === 0)
    throw new TypeError("A notebook panel must have at least one written line");

  const events = [];
  let cursor = opening ? pace.openingDelayMs : pace.operationDelayMs;

  if (!opening) events.push({ type: "action-complete", at: pace.actionCompleteMs });

  lines.forEach((line, lineIndex) => {
    const characters = symbolsOf(line);
    characters.forEach((symbol, symbolIndex) => {
      events.push({ type: "move-pen", at: cursor, lineIndex, symbolIndex });
      events.push({
        type: "reveal-symbol", at: cursor + pace.penLeadMs,
        lineIndex, symbolIndex, symbol
      });
      cursor += symbol.trim() ? pace.characterMs : pace.spaceMs;
    });

    // Allow the last character to finish before announcing the whole line.
    const finishedAt = cursor + pace.penLeadMs + pace.lineSettledMs;
    events.push({ type: "line-complete", at: finishedAt, lineIndex, text: String(line) });
    cursor = finishedAt + (lineIndex === lines.length - 1 ? 0 : pace.betweenLinesMs);
  });

  events.push({ type: "writing-complete", at: cursor + 150 });
  return {
    events,
    actionCompleteAt: opening ? null : pace.actionCompleteMs,
    writingCompleteAt: cursor + 150,
    durationMs: cursor + 150 + pace.afterPanelMs,
    symbolCount: lines.reduce((sum, line) => sum + symbolsOf(line).length, 0)
  };
}

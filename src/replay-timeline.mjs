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

// Normal inherits the old Quick (1.6x) handwriting pace. Fast is a
// further step up; Careful remains available without slowing it further.
export const WRITING_SPEEDS = Object.freeze({ careful: 0.7, normal: 1.6, fast: 2.5 });
export const DEFAULT_WRITING_SPEED = WRITING_SPEEDS.normal;

// Advance the virtual clock at the chosen pace only while writing.
// Physical replay uses real milliseconds (including zero-pair choreography),
// and the reading hold after a panel is never shortened. Splitting a frame
// at each boundary preserves timing even when a frame crosses phases.
export function advanceWritingClock(timeline, elapsed, delta, speed = DEFAULT_WRITING_SPEED) {
  const start = timeline.writingStartAt, end = timeline.writingCompleteAt;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return elapsed + delta;
  let remaining = delta, cursor = elapsed;
  if (cursor < start) {
    const before = Math.min(remaining, start - cursor);
    cursor += before;
    remaining -= before;
  }
  if (cursor < end && remaining > 0) {
    const writing = Math.min(remaining, (end - cursor) / speed);
    cursor = Math.min(end, cursor + writing * speed);
    remaining -= writing;
  }
  return cursor + remaining;
}

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
    writingStartAt: opening ? pace.openingDelayMs : pace.operationDelayMs,
    writingCompleteAt: cursor + 150,
    durationMs: cursor + 150 + pace.afterPanelMs,
    symbolCount: lines.reduce((sum, line) => sum + symbolsOf(line).length, 0)
  };
}

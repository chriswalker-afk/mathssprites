/**
 * Maths Sprites - deterministic, per-creature idle motion.
 *
 * No timers or Math.random() are used: a creature's identity (experiment,
 * room, colour and index) determines its timings. Rendering, Undo, and
 * incidental UI updates cannot resynchronise a whole room of sprites.
 */
function fnv1a(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}
function vary(seed, salt, limit) {
  let value = (seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return (value >>> 0) % limit;
}

export function spriteMotionProfile(levelId, side, kind, index) {
  if (typeof levelId !== "string" || !levelId ||
    typeof side !== "string" || !side ||
    !["posX", "negX"].includes(kind) ||
    !Number.isInteger(index) || index < 0)
    throw new TypeError("Sprite animation requires a valid, stable identity");

  const seed = fnv1a(levelId + "|" + side + "|" + kind + "|" + index);
  const hopMs = 1380 + vary(seed, 1, 440);
  const wiggleMs = 820 + vary(seed, 2, 520);
  const blinkMs = 4600 + vary(seed, 3, 3400);
  const lookMs = 3200 + vary(seed, 4, 2300);
  const hopPx = 32 + vary(seed, 5, 13);
  const wink = 4 + vary(seed, 6, 4);

  return {
    hopMs,
    hopDelayMs: -((index * 373 + vary(seed, 7, 530)) % hopMs),
    hopPx,
    halfwayPx: -Math.round(hopPx * .55),
    wiggleMs,
    wiggleDelayMs: -((index * 219 + vary(seed, 8, 370)) % wiggleMs),
    leftWiggleDeg: -(wink - 1),
    rightWiggleDeg: wink,
    blinkMs,
    blinkDelayMs: -vary(seed, 9, blinkMs),
    lookMs,
    lookDelayMs: -vary(seed, 10, lookMs)
  };
}

export function spriteMotionStyle(profile) {
  const p = profile;
  return [
    "--hop-period:" + p.hopMs + "ms",
    "--hop-delay:" + p.hopDelayMs + "ms",
    "--hop-height:-" + p.hopPx + "px",
    "--hop-half:" + p.halfwayPx + "px",
    "--wiggle-period:" + p.wiggleMs + "ms",
    "--wiggle-delay:" + p.wiggleDelayMs + "ms",
    "--wiggle-left:" + p.leftWiggleDeg + "deg",
    "--wiggle-right:" + p.rightWiggleDeg + "deg",
    "--blink-period:" + p.blinkMs + "ms",
    "--blink-delay:" + p.blinkDelayMs + "ms",
    "--look-period:" + p.lookMs + "ms",
    "--look-delay:" + p.lookDelayMs + "ms"
  ].join(";");
}

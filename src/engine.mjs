/**
 * Maths Sprites: pure, dependency-free balance engine.
 * Objects are physical counts; algebraic values are projections of those counts.
 * Both play modes commit exactly one two-sided transaction per mathematical step.
 */
export const TOKEN_KINDS = ["posX", "negX", "posX2", "posOne", "negOne"];
export const LEVELS = [
  {
    id: "resident", title: "One little resident", chapter: "01 · Clearing the room",
    prompt: "Leave one dark sprite alone, facing only weights. What can the hand take away?",
    left: { posX: 1, posOne: 2 }, right: { posOne: 5 }, solution: 3,
    suggested: "Try removing the same number of weights from both rooms."
  },
  {
    id: "baskets", title: "A roomful of sprites", chapter: "02 · Equal groups",
    prompt: "The residents seem to come in equal groups. Could baskets help?",
    left: { posX: 3 }, right: { posOne: 9 }, solution: 3,
    suggested: "Try dividing the contents of each room into three equal baskets."
  },
  {
    id: "two-moves", title: "Clear, then group", chapter: "03 · Two moves",
    prompt: "The weights are in the way. Make a simpler room before splitting it up.",
    left: { posX: 2, posOne: 4 }, right: { posOne: 12 }, solution: 4,
    suggested: "Remove four weights from both rooms, then try two equal baskets."
  },
  {
    id: "across", title: "Across the hall", chapter: "04 · Both sides",
    prompt: "A sprite has wandered into the other room. Can you isolate one resident?",
    left: { posX: 2, posOne: 3 }, right: { posX: 1, posOne: 7 }, solution: 4,
    suggested: "A matching sprite can be removed from each side, and then the weights."
  },
  {
    id: "five-baskets", title: "Five little baskets", chapter: "05 · A bigger division",
    prompt: "These rooms are crowded. Can you pack everything into five equal baskets?",
    left: { posX: 5, posOne: 10 }, right: { posOne: 20 }, solution: 2,
    suggested: "Try five equal baskets in each room, then remove two weights from both."
  },
  {
    id: "make-square", title: "Build the square", chapter: "06 · Length becomes area",
    prompt: "Both sides show a length. Square each whole side: turn the row into a matching column, then fill the area. Assume x ≥ 0.",
    left: { posX: 1 }, right: { posOne: 3 }, solution: 3, goal: "square",
    startingOperation: "square",
    suggested: "Square both sides. A round x becomes a square x²; three weights become a 3 × 3 square of nine."
  },
  {
    id: "take-root", title: "Keep one side", chapter: "07 · Area becomes length",
    prompt: "These are square areas. Arrange each as a square, then keep one side. Assume x ≥ 0.",
    left: { posX2: 1 }, right: { posOne: 9 }, solution: 3, startingOperation: "sqrt",
    suggested: "Take the principal square root of each side: a square x² becomes a round x, and √9 is 3."
  },
  {
    id: "root-then-share", title: "Root and share", chapter: "08 · Two steps back",
    prompt: "Four square sprites face 36 weights. Make squares, keep one side, then share equally. Assume x ≥ 0.",
    left: { posX2: 4 }, right: { posOne: 36 }, solution: 3, startingOperation: "sqrt",
    suggested: "√(4x²) = 2x and √36 = 6. Then divide both rooms by two."
  }
];

export function room(values = {}) {
  return Object.fromEntries(TOKEN_KINDS.map(key => [key, Number(values[key] || 0)]));
}
export function copyRoom(value) { return room(value); }
export function canonical(value) {
  return { x2: value.posX2 || 0, x: value.posX - value.negX, constant: value.posOne - value.negOne };
}
export function evaluate(value, x) {
  const terms = canonical(value);
  return terms.x2 * x * x + terms.x * x + terms.constant;
}
export function initialState(level = LEVELS[0]) {
  return { levelId: level.id, goal: level.goal || "isolate", solution: level.solution,
    left: room(level.left), right: room(level.right), history: [], pending: null };
}
export function visibleRooms(state) {
  if (!state.pending) return { left: state.left, right: state.right };
  return { left: state.pending.first === "left" ? state.pending.pair.left.after : state.left,
    right: state.pending.first === "right" ? state.pending.pair.right.after : state.right };
}
export function balanceDifference(state) {
  const { left, right } = visibleRooms(state);
  return evaluate(left, state.solution) - evaluate(right, state.solution);
}
export function isSolved(state) {
  if (state.pending) return false;
  const isOneSprite = r => r.posX === 1 && r.negX === 0 && r.posX2 === 0 &&
    r.posOne === 0 && r.negOne === 0;
  const isOneSquare = r => r.posX2 === 1 && r.posX === 0 && r.negX === 0 &&
    r.posOne === 0 && r.negOne === 0;
  const isWeights = (r, n) => r.posX2 === 0 && r.posX === 0 && r.negX === 0 &&
    r.negOne === 0 && r.posOne === n;
  if (state.goal === "square") {
    const n = state.solution ** 2;
    return (isOneSquare(state.left) && isWeights(state.right, n)) ||
      (isOneSquare(state.right) && isWeights(state.left, n));
  }
  return (isOneSprite(state.left) && isWeights(state.right, state.solution)) ||
    (isOneSprite(state.right) && isWeights(state.left, state.solution));
}
export function normalize(value) {
  const next = room(value);
  const sprites = Math.min(next.posX, next.negX);
  const constants = Math.min(next.posOne, next.negOne);
  next.posX -= sprites;
  next.negX -= sprites;
  next.posOne -= constants;
  next.negOne -= constants;
  return { after: next, cancellations: { sprites, constants } };
}
function countTokens(value) {
  return TOKEN_KINDS.reduce((sum, kind) => sum + value[kind], 0);
}
function check(action) {
  if (!["add", "remove", "multiply", "divide", "square", "sqrt"].includes(action?.op))
    return "Choose an operation first.";
  if (action.op === "add" || action.op === "remove") {
    if (!TOKEN_KINDS.includes(action.kind)) return "Choose a kind of object.";
    if (!Number.isInteger(action.count) || action.count < 1 || action.count > 12)
      return "Choose between one and twelve objects.";
  } else if ((action.op === "multiply" || action.op === "divide") &&
    (!Number.isInteger(action.factor) || action.factor < 2 || action.factor > 5)) {
    return "Choose between two and five groups.";
  }
  return null;
}
function perfectSquareRoot(n) {
  if (!Number.isInteger(n) || n < 0) return null;
  const root = Math.sqrt(n);
  return Number.isInteger(root) ? root : null;
}
function pureNonnegativeKind(r) {
  const used = TOKEN_KINDS.filter(kind => r[kind] > 0);
  return used.length === 1 ? used[0] : used.length === 0 ? "zero" : null;
}
/**
 * Squaring is (nx)² = n²x² or n², NEVER independently squaring the terms of
 * a sum. Mixed expressions are rejected: (x+2)² = x²+4x+4.
 * Principal roots in this chapter explicitly assume x >= 0.
 */
export function areaArrangement(r, op) {
  if (op !== "square" && op !== "sqrt") return null;
  const source = room(r);
  const kind = pureNonnegativeKind(source);
  if (op === "square" && (kind === "posX" || kind === "posOne")) {
    const n = source[kind];
    if (n * n > 48) return null;
    return { op, kind, side: n, cells: n * n, symbolic: kind === "posX" };
  }
  if (op === "sqrt" && (kind === "posX2" || kind === "posOne")) {
    const side = perfectSquareRoot(source[kind]);
    if (side === null || side > 7) return null;
    return { op, kind, side, cells: source[kind], symbolic: kind === "posX2" };
  }
  return kind === "zero" ? { op, kind: "zero", side: 0, cells: 0, symbolic: false } : null;
}
function transform(source, action) {
  const next = room(source);
  let priorCancellations = { sprites: 0, constants: 0 };
  if (action.op === "add") next[action.kind] += action.count;
  if (action.op === "remove") {
    if (next[action.kind] < action.count)
      return { ok: false, code: "missing", kind: action.kind, needed: action.count,
        available: next[action.kind],
        reason: "I can't take away something that isn't in that room." };
    next[action.kind] -= action.count;
  }
  if (action.op === "square" || action.op === "sqrt") {
    const area = areaArrangement(next, action.op);
    if (!area) return { ok: false, code: "unsupported-area", reason: action.op === "square"
      ? "First make one row of only round sprites or only weights. Squaring (x + 2) also needs 4x, so mixed rooms cannot use this tool."
      : "The principal square root needs one perfect-square group (square sprites or weights), with no mixed terms." };
    if (area.kind !== "zero") {
      const { kind, side } = area;
      next[kind] = 0;
      if (action.op === "square") {
        next[kind === "posX" ? "posX2" : "posOne"] = side * side;
      } else {
        next[kind === "posX2" ? "posX" : "posOne"] = side;
      }
    }
  }
  if (action.op === "multiply") {
    TOKEN_KINDS.forEach(kind => { next[kind] *= action.factor; });
  }
  if (action.op === "divide") {
    const normalized = normalize(next);
    const compact = normalized.after;
    priorCancellations = normalized.cancellations;
    const splitKind = TOKEN_KINDS.find(kind => compact[kind] % action.factor !== 0);
    if (splitKind) {
      const splitCount = compact[splitKind];
      return { ok: false, code: "fraction", kind: splitKind, count: splitCount,
        factor: action.factor, whole: Math.floor(splitCount / action.factor),
        remainder: splitCount % action.factor,
        reason: "That would leave part of a sprite or weight. I'm saving fractions for another experiment." };
    }
    TOKEN_KINDS.forEach(kind => { next[kind] = compact[kind] / action.factor; });
  }
  const reduced = normalize(next);
  if (countTokens(reduced.after) > 48)
    return { ok: false, code: "overflow", total: countTokens(reduced.after),
      capacity: 48, excess: countTokens(reduced.after) - 48,
      kind: action.kind || TOKEN_KINDS.find(kind => reduced.after[kind] >= 3) || "posOne",
      reason: "There would be too many things in the rooms. Let's try a smaller change." };
  return { ok: true, after: reduced.after, cancellations: {
    sprites: priorCancellations.sprites + reduced.cancellations.sprites,
    constants: priorCancellations.constants + reduced.cancellations.constants
  } };
}
/** Preview exactly one room. This never commits a step or changes the opposite
 * chamber. Used for teaching failed attempts and mismatched manual moves. */
export function previewRoomAction(source, action) {
  const error = check(action);
  if (error) return { ok: false, code: "invalid", reason: error };
  return transform(source, action);
}
export function prepare(state, action) {
  if (state.pending) return { ok: false, reason: "Finish the matching move, or undo the first one." };
  const error = check(action);
  if (error) return { ok: false, reason: error };
  const left = transform(state.left, action);
  if (!left.ok) return { ...left, side: "left" };
  const right = transform(state.right, action);
  if (!right.ok) return { ...right, side: "right" };
  return { ok: true, pair: { left, right } };
}
function commit(state, action, pair, mode) {
  const before = { left: copyRoom(state.left), right: copyRoom(state.right) };
  const after = { left: copyRoom(pair.left.after), right: copyRoom(pair.right.after) };
  const transaction = { action: { ...action }, mode, before, after,
    cancellations: { left: pair.left.cancellations, right: pair.right.cancellations } };
  return { ...state, left: after.left, right: after.right, pending: null,
    history: [...state.history, transaction] };
}
/**
 * In manual mode a first-side action is provisional until the other room is selected.
 * A fully committed action cannot be one-sided.
 */
export function perform(state, action, mode = "auto", side) {
  if (state.pending) {
    if (side !== (state.pending.first === "left" ? "right" : "left"))
      return { ok: false, code: "wrong-side", reason: "Now make the matching move in the other room." };
    const expected = state.pending.action;
    if (!action || action.op !== expected.op ||
        ((expected.op === "add" || expected.op === "remove") &&
         (action.kind !== expected.kind || action.count !== expected.count)) ||
        ((expected.op === "divide" || expected.op === "multiply") &&
         action.factor !== expected.factor))
      return { ok: false, code: "mismatch", reason: "The other room needs the same action, kind and amount." };
    const second = state.pending.pair[side];
    if (!second.ok) return { ...second, side };
    return { ok: true, committed: true,
      state: commit(state, state.pending.action, state.pending.pair, "manual") };
  }
  if (mode === "manual") {
    if (side !== "left" && side !== "right")
      return { ok: false, reason: "Choose the room to act in first." };
    const opposite = side === "left" ? "right" : "left";
    // In Your Turn the first hand visit need only be possible in the chosen
    // room. Students can try a different second action and learn why it
    // unbalances the scale. An invalid matching second action is still
    // rejected and visually undone; no unilateral step can be committed.
    const first = previewRoomAction(state[side], action);
    if (!first.ok) return { ...first, side };
    const second = previewRoomAction(state[opposite], action);
    const pair = side === "left" ? {left:first,right:second} :
      {left:second,right:first};
    return { ok: true, committed: false,
      state: { ...state, pending: { first:side, action:{...action}, pair } } };
  }
  const prepared = prepare(state, action);
  if (!prepared.ok) return prepared;
  return { ok: true, committed: true, state: commit(state, action, prepared.pair, "auto") };
}
export function undo(state) {
  if (state.pending) return { ...state, pending: null };
  if (!state.history.length) return state;
  const last = state.history.at(-1);
  return { ...state, left: copyRoom(last.before.left), right: copyRoom(last.before.right),
    history: state.history.slice(0, -1), pending: null };
}
export function expression(value) {
  const { x, constant } = canonical(value);
  const { x2 } = canonical(value);
  const sqTerm = x2 === 0 ? "" : (x2 === 1 ? "" : String(x2)) + "x²";
  const xTerm = x === 0 ? "" : x === 1 ? "x" : x === -1 ? "−x" : String(x).replace("-", "−") + "x";
  let out = sqTerm;
  if (xTerm) out += out && x < 0 ? " − " + xTerm.slice(1) :
    out ? " + " + xTerm : xTerm;
  if (constant !== 0) {
    const n = String(Math.abs(constant));
    out += out ? (constant < 0 ? " − " : " + ") + n :
      (constant < 0 ? "−" : "") + n;
  }
  return out || "0";
}
export function equation(pair) { return expression(pair.left) + " = " + expression(pair.right); }
const TOKEN_NAME = { posX: "dark sprite", negX: "pale sprite", posX2: "square x² sprite", posOne: "weight", negOne: "balloon" };
export function operationDescription(action) {
  if (action.op === "square") return "Square both entire sides (x ≥ 0)";
  if (action.op === "sqrt") return "Take the principal square root of both sides (x ≥ 0)";
  if (action.op === "multiply") return "Make " + action.factor + " complete copies in each room";
  if (action.op === "divide") return "Make " + action.factor + " equal groups in each room; keep one";
  const unit = action.count === 1 ? TOKEN_NAME[action.kind] : TOKEN_NAME[action.kind] + "s";
  return (action.op === "add" ? "Add " : "Remove ") + action.count + " " + unit + " in each room";
}
export function algebraOperation(action) {
  if (action.op === "square") return "Square both sides (x ≥ 0)";
  if (action.op === "sqrt") return "Take √ of both sides (principal root, x ≥ 0)";
  if (action.op === "divide") return "÷ " + action.factor + " on both sides";
  if (action.op === "multiply") return "× " + action.factor + " on both sides";
  const signOfToken = action.kind === "negX" || action.kind === "negOne" ? -1 : 1;
  const signOfAction = action.op === "remove" ? -1 : 1;
  const symbol = action.kind === "posX" || action.kind === "negX" ? "x" : "";
  const term = (action.count === 1 && symbol ? "" : String(action.count)) + symbol;
  const signed = signOfAction * signOfToken;
  // Preserve the signed physical object in brackets for an exact description.
  if (signOfToken < 0) return (action.op === "remove" ? "− (" : "+ (") + "−" + term + ") on both sides";
  return (signed < 0 ? "− " : "+ ") + term + " on both sides";
}
export function validInitialLevel(level) {
  const a = canonical(room(level.left)), b = canonical(room(level.right));
  if (level.solution < 0 || !Number.isInteger(level.solution)) return false;
  if (evaluate(room(level.left), level.solution) !== evaluate(room(level.right), level.solution))
    return false;
  const A = a.x2 - b.x2, B = a.x - b.x, C = a.constant - b.constant;
  if (A === 0) return B !== 0 && B * level.solution === -C;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return false;
  const roots = [(-B + Math.sqrt(disc)) / (2 * A),
    (-B - Math.sqrt(disc)) / (2 * A)].filter(Number.isFinite)
    .filter(x => x >= 0);
  return roots.length === 1 && Math.abs(roots[0] - level.solution) < 1e-8;
}

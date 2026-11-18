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
  if (!["add", "remove", "multiply", "divide"].includes(action?.op))
    return "Choose an operation first.";
  if (action.op === "add" || action.op === "remove") {
    if (!TOKEN_KINDS.includes(action.kind)) return "Choose a kind of object.";
    if (!Number.isInteger(action.count) || action.count < 1 || action.count > 12)
      return "Choose between one and twelve objects.";
  } else if (!Number.isInteger(action.factor) || action.factor < 2 || action.factor > 5) {
    return "Choose between two and five groups.";
  }
  return null;
}
function transform(source, action) {
  const next = room(source);
  let priorCancellations = { sprites: 0, constants: 0 };
  if (action.op === "add") next[action.kind] += action.count;
  if (action.op === "remove") {
    if (next[action.kind] < action.count)
      return { ok: false, reason: "I can't take away something that isn't in that room." };
    next[action.kind] -= action.count;
  }
  if (action.op === "multiply") {
    TOKEN_KINDS.forEach(kind => { next[kind] *= action.factor; });
  }
  if (action.op === "divide") {
    const normalized = normalize(next);
    const compact = normalized.after;
    priorCancellations = normalized.cancellations;
    if (TOKEN_KINDS.some(kind => compact[kind] % action.factor !== 0)) {
      return { ok: false, reason: "That would leave part of a sprite or weight. I'm saving fractions for another experiment." };
    }
    TOKEN_KINDS.forEach(kind => { next[kind] = compact[kind] / action.factor; });
  }
  const reduced = normalize(next);
  if (countTokens(reduced.after) > 48)
    return { ok: false, reason: "There would be too many things in the rooms. Let's try a smaller change." };
  return { ok: true, after: reduced.after, cancellations: {
    sprites: priorCancellations.sprites + reduced.cancellations.sprites,
    constants: priorCancellations.constants + reduced.cancellations.constants
  } };
}
export function prepare(state, action) {
  if (state.pending) return { ok: false, reason: "Finish the matching move, or undo the first one." };
  const error = check(action);
  if (error) return { ok: false, reason: error };
  const left = transform(state.left, action);
  if (!left.ok) return left;
  const right = transform(state.right, action);
  if (!right.ok) return right;
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
      return { ok: false, reason: "Now make the matching move in the other room." };
    const expected = state.pending.action;
    if (!action || action.op !== expected.op ||
        ((expected.op === "add" || expected.op === "remove") &&
         (action.kind !== expected.kind || action.count !== expected.count)) ||
        ((expected.op === "divide" || expected.op === "multiply") &&
         action.factor !== expected.factor))
      return { ok: false, reason: "The other room needs the same action, kind and amount." };
    return { ok: true, committed: true,
      state: commit(state, state.pending.action, state.pending.pair, "manual") };
  }
  const prepared = prepare(state, action);
  if (!prepared.ok) return prepared;
  if (mode === "manual") {
    if (side !== "left" && side !== "right")
      return { ok: false, reason: "Choose the room to act in first." };
    return { ok: true, committed: false,
      state: { ...state, pending: { first: side, action: { ...action }, pair: prepared.pair } } };
  }
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
  const xTerm = x === 0 ? "" : x === 1 ? "x" : x === -1 ? "−x" : String(x).replace("-", "−") + "x";
  if (constant === 0) return xTerm || "0";
  const n = String(Math.abs(constant));
  if (!xTerm) return (constant < 0 ? "−" : "") + n;
  return xTerm + (constant < 0 ? " − " : " + ") + n;
}
export function equation(pair) { return expression(pair.left) + " = " + expression(pair.right); }
const TOKEN_NAME = { posX: "dark sprite", negX: "pale sprite", posOne: "weight", negOne: "balloon" };
export function operationDescription(action) {
  if (action.op === "multiply") return "Make " + action.factor + " complete copies in each room";
  if (action.op === "divide") return "Make " + action.factor + " equal groups in each room; keep one";
  const unit = action.count === 1 ? TOKEN_NAME[action.kind] : TOKEN_NAME[action.kind] + "s";
  return (action.op === "add" ? "Add " : "Remove ") + action.count + " " + unit + " in each room";
}
export function algebraOperation(action) {
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
  return a.x !== b.x && (a.x - b.x) * level.solution === b.constant - a.constant;
}

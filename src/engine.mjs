/**
 * Maths Sprites: pure, dependency-free balance engine.
 * Objects are physical counts; algebraic values are projections of those counts.
 * Both play modes commit exactly one two-sided transaction per mathematical step.
 */
import { neutralPairSequence } from "./neutral-pairs.mjs";
import {cloneCrate,crateCount,crateAlgebra,crateContentsTotal,looseAfterUnpack,crateLabel} from "./group-crates.mjs";
export const TOKEN_KINDS = ["posX", "negX", "posX2", "posOne", "negOne"];
export const QUANTITY_MODES = Object.freeze(["positive","signed"]);
export function levelQuantityMode(level) {
  if (level.quantityMode) return level.quantityMode;
  // Legacy custom test levels with signed INITIAL contents are signed.
  // All curated introductory chapters explicitly default to positive only.
  return [level.left,level.right].some(r => r?.negX || r?.negOne)
    ? "signed" : "positive";
}
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
  },
  {
    id: "mixed-area", title: "The four regions", chapter: "09 · Build every part",
    prompt: "Arrange two round sprites and three weights along each edge of a square. Fill all four regions inside the room. Assume x ≥ 0.",
    left: {posX:2,posOne:3}, right: {posOne:5}, solution:1,
    goal:"area", target:{left:{posX2:4,posX:12,posOne:9},right:{posOne:25}},
    startingOperation:"square",
    suggested: "Build a 5-by-5 box: 4 square sprites, 12 round sprites in two mixed regions, and 9 weights."
  },
  {
    id: "mixed-root", title: "Unbuild the square", chapter: "10 · Recover its side",
    prompt: "These four regions form a perfect square. Arrange them inside the room, keep one side, then solve for x. Assume x ≥ 0.",
    left:{posX2:4,posX:12,posOne:9}, right:{posOne:25}, solution:1,
    startingOperation:"sqrt",
    suggested: "Unbuild the 5-by-5 area to see 2x + 3 = 5; then remove three weights and share in two equal baskets."
  },
  {
    id:"balloon-rescue",title:"The balloon rescue",chapter:"11 · Opposite units",
    prompt:"Two balloons are tugging against a dark sprite. Can new weights help the balloons lift away the things opposing them?",
    left:{posX:1,negOne:2},right:{posOne:2},solution:4,
    quantityMode:"signed",startingOperation:"add",startingKind:"posOne",startingAmount:2,
    suggested:"Try adding two weights to BOTH rooms. Notice what the balloons do to their opposing weights."
  },
  {
    id:"opposite-sprites",title:"A white sprite arrives",chapter:"12 · Opposite sprites",
    prompt:"White sprites are the opposites of dark sprites. Let one white sprite meet the dark sprites in each room, then clear the remaining weights.",
    left:{posX:2,posOne:3},right:{posX:1,posOne:7},solution:4,
    quantityMode:"signed",startingOperation:"add",startingKind:"negX",startingAmount:1,
    suggested:"Try adding a white sprite to BOTH rooms, then see which weights can be taken away evenly."
  },
  {
    id:"two-zero-pairs",title:"Two ways to make zero",chapter:"13 · Balloon and sprite",
    prompt:"Two dark sprites and two balloons face one dark sprite and some weights. Try BOTH sorts of opposite pair to restore the quiet laboratory.",
    left:{posX:2,negOne:2},right:{posX:1,posOne:2},solution:4,
    quantityMode:"signed",startingOperation:"add",startingKind:"posOne",startingAmount:2,
    suggested:"Try adding weights first, then white sprites. Notice that pairs of opposites disappear without upsetting the balance."
  }
];

export function room(values = {}) {
  const result=Object.fromEntries(TOKEN_KINDS.map(key => [key, Number(values[key] || 0)]));
  if(values?.crates?.count)result.crates=cloneCrate(values.crates);
  return result;
}
export function copyRoom(value) { return room(value); }
export function canonical(value) {
  const grouped=crateAlgebra(value);
  return {x2:(value.posX2||0)+grouped.x2,
    x:(value.posX||0)-(value.negX||0)+grouped.x,
    constant:(value.posOne||0)-(value.negOne||0)+grouped.constant};
}
export function evaluate(value, x) {
  const terms = canonical(value);
  return terms.x2 * x * x + terms.x * x + terms.constant;
}
export function initialState(level = LEVELS[0], quantityMode = levelQuantityMode(level)) {
  if (!QUANTITY_MODES.includes(quantityMode))
    throw new TypeError("Unknown quantity mode");
  if (level.lockPositive && quantityMode !== "positive")
    throw new RangeError("This World 1 level is restricted to positive whole numbers.");
  if (quantityMode === "positive" &&
      [level.left,level.right].some(r=>r?.negX || r?.negOne))
    throw new RangeError("A signed experiment cannot start in positive-only mode");
  return { levelId: level.id, quantityMode,
    allowedKinds: level.allowedKinds ? [...level.allowedKinds] : null,
    allowedOperations: level.allowedOperations ? [...level.allowedOperations] : null,
    lockPositive: !!level.lockPositive,
    goal: level.goal || "isolate", solution: level.solution,
    areaTarget: level.target ? {left:room(level.target.left),right:room(level.target.right)} : null,
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
  const isOneSprite = r => !crateCount(r) && r.posX === 1 && r.negX === 0 && r.posX2 === 0 &&
    r.posOne === 0 && r.negOne === 0;
  const isOneSquare = r => !crateCount(r) && r.posX2 === 1 && r.posX === 0 && r.negX === 0 &&
    r.posOne === 0 && r.negOne === 0;
  const isWeights = (r, n) => !crateCount(r) && r.posX2 === 0 && r.posX === 0 && r.negX === 0 &&
    r.negOne === 0 && r.posOne === n;
  if (state.goal === "area") {
    return !!state.areaTarget && ["left","right"].every(side =>
      TOKEN_KINDS.every(kind => state[side][kind] === state.areaTarget[side][kind]));
  }
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
  return crateCount(value)+TOKEN_KINDS.reduce((sum, kind) => sum + value[kind], 0);
}
function check(action) {
  if (!["add", "remove", "multiply", "divide", "square", "sqrt", "unpack"].includes(action?.op))
    return "Choose an operation first.";
  if(action.op==="unpack" && !["left","right"].includes(action.side))
    return "Choose which sealed crate to unpack.";
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
export function quantityPermission(quantityMode, action) {
  if (!QUANTITY_MODES.includes(quantityMode))
    return {ok:false,code:"quantity-mode",reason:"Choose a valid mathematics mode."};
  if (quantityMode === "positive" &&
      (action?.kind === "negX" || action?.kind === "negOne") &&
      (action?.op === "add" || action?.op === "remove"))
    return {ok:false,code:"locked-negative",kind:action.kind,
      reason:"This experiment uses positive objects only. Change Maths mode to Signed objects to work with white sprites and balloons."};
  return {ok:true};
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
 * A whole room is a side length (a*x + b), with a,b nonnegative integers.
 * Squaring the SIDE fills four physically distinct regions:
 * a² x², ab x (top-right), ab x (bottom-left), and b² unit weights.
 *
 * Taking the principal root is the inverse only when all these regions
 * can be reconstructed exactly from nonnegative perfect-square corner counts.
 * Thus x²+3x+4, x²+4 or 4x²+10x+9 cannot be falsely "unbuilt".
 * For every supported level x≥0, so sqrt((ax+b)²)=ax+b.
 *
 * The original simple-area descriptors are preserved for compatibility.
 */
export function areaArrangement(r, op) {
  if (op !== "square" && op !== "sqrt") return null;
  const source = room(r);
  if (source.negX || source.negOne) return null;
  const kind = pureNonnegativeKind(source);
  if (kind === "zero") return {op,kind:"zero",side:0,cells:0,symbolic:false};
  if (op === "square") {
    if (source.posX2) return null; // squaring a quadratic would require x⁴
    const a = source.posX, b = source.posOne, n = a + b;
    if (!n || n*n > 48) return null;
    if (a && b) {
      return {op,kind:"mixed",side:n,cells:n*n,symbolic:true,
        spriteSide:a,weightSide:b,x2:a*a,x:2*a*b,constant:b*b};
    }
    const k = a ? "posX" : "posOne";
    return {op,kind:k,side:n,cells:n*n,symbolic:!!a};
  }
  // Root of a pure number, of a*x², or of the complete area (ax+b)².
  if (source.posX && !source.posX2) return null; // not a square area
  const a = perfectSquareRoot(source.posX2);
  const b = perfectSquareRoot(source.posOne);
  if (a === null || b === null || source.posX !== 2*a*b) return null;
  const n = a+b;
  if (n*n > 48) return null;
  if (a && b) {
    return {op,kind:"mixed",side:n,cells:n*n,symbolic:true,
      spriteSide:a,weightSide:b,x2:a*a,x:2*a*b,constant:b*b};
  }
  const k = a ? "posX2" : "posOne";
  return {op,kind:k,side:n,cells:n*n,symbolic:!!a};
}
function transform(source, action, side = "room") {
  const next = room(source);
  let priorCancellations = { sprites: 0, constants: 0 };
  let preDivisionEvents = [];
  if(action.op==="unpack"){
    if(side===action.side){
      if(!crateCount(next))return {ok:false,code:"no-crates",
        reason:"There are no sealed crates left in that room."};
      const unpacked=looseAfterUnpack(next);
      Object.assign(next,unpacked);
      delete next.crates;
    }
  }
  if (action.op === "add") next[action.kind] += action.count;
  if (action.op === "remove") {
    if (next[action.kind] < action.count){
      const locked=crateContentsTotal(next,action.kind);
      if(locked>0)return {ok:false,code:"locked-crate",kind:action.kind,
        available:next[action.kind],sealed:locked,
        reason:"Those objects are still sealed in a crate! Unpack the group, or work with whole crates first."};
      return { ok: false, code: "missing", kind: action.kind, needed: action.count,
        available: next[action.kind],
        reason: "I can't take away something that isn't in that room." };
    }
    next[action.kind] -= action.count;
  }
  if (action.op === "square" || action.op === "sqrt") {
    const attemptedSide = action.op === "square" &&
      next.posX2 === 0 && next.negX === 0 && next.negOne === 0
      ? next.posX + next.posOne : 0;
    if (attemptedSide*attemptedSide > 48) {
      return {ok:false,code:"overflow",total:attemptedSide*attemptedSide,
        capacity:48,excess:attemptedSide*attemptedSide-48,
        kind:next.posX ? "posX2" : "posOne",
        reason:"That square would overflow the chamber. Try a smaller side length."};
    }
    const area = areaArrangement(next, action.op);
    if (!area) return {ok:false,code:"unsupported-area",reason:action.op === "square"
      ? "That side cannot form a square of round sprites and positive weights. Square-shaped sprites would require higher powers."
      : "I can't arrange these objects into a complete square: the two mixed regions must match, and each corner must be square."};
    if (area.kind !== "zero") {
      const a = area.kind === "mixed" ? area.spriteSide :
        area.symbolic ? area.side : 0;
      const b = area.kind === "mixed" ? area.weightSide :
        area.symbolic ? 0 : area.side;
      if (action.op === "square") {
        next.posX = 2*a*b;
        next.posX2 = a*a;
        next.posOne = b*b;
      } else {
        next.posX2 = 0;
        next.posX = a;
        next.posOne = b;
      }
    }
  }
  if (action.op === "multiply") {
    TOKEN_KINDS.forEach(kind => { next[kind] *= action.factor; });
    if(crateCount(next))next.crates.count*=action.factor;
  }
  if (action.op === "divide") {
    const normalized = normalize(next);
    const compact = normalized.after;
    preDivisionEvents = neutralPairSequence(next,side);
    priorCancellations = normalized.cancellations;
    if(crateCount(compact)%action.factor!==0)
      return {ok:false,code:"crate-split",kind:"crate",
        count:crateCount(compact),factor:action.factor,
        reason:"A sealed crate must stay whole. Divide into complete groups of crates, or unpack them first."};
    const splitKind = TOKEN_KINDS.find(kind => compact[kind] % action.factor !== 0);
    if (splitKind) {
      const splitCount = compact[splitKind];
      return { ok: false, code: "fraction", kind: splitKind, count: splitCount,
        factor: action.factor, whole: Math.floor(splitCount / action.factor),
        remainder: splitCount % action.factor,
        reason: "That would leave part of a sprite or weight. I'm saving fractions for another experiment." };
    }
    TOKEN_KINDS.forEach(kind => { next[kind] = compact[kind] / action.factor; });
    if(crateCount(compact))next.crates={...cloneCrate(compact.crates),
      count:crateCount(compact)/action.factor};
    else delete next.crates;
  }
  // A crate is indivisible and the renderer supports at most twelve.
  // Do not let repeated multiplication create an invalid room() object.
  if(crateCount(next)>12)return {ok:false,code:"overflow",
    total:crateCount(next),capacity:12,excess:crateCount(next)-12,
    kind:"crate",reason:"There would be too many sealed crates in this chamber."};
  const raw = room(next);
  const reduced = normalize(next);
  const cancellationEvents = action.op === "divide" ?
    preDivisionEvents : neutralPairSequence(raw,side);
  if (countTokens(reduced.after) > 48)
    return { ok: false, code: "overflow", total: countTokens(reduced.after),
      capacity: 48, excess: countTokens(reduced.after) - 48,
      kind: action.kind || TOKEN_KINDS.find(kind => reduced.after[kind] >= 3) || "posOne",
      reason: "There would be too many things in the rooms. Let's try a smaller change." };
  return { ok: true, after: reduced.after, raw,
    beforeGroups: action.op === "divide" ? normalize(source).after : null,
    cancellationEvents,
    cancellations: {
      sprites: priorCancellations.sprites + reduced.cancellations.sprites,
      constants: priorCancellations.constants + reduced.cancellations.constants
    } };
}
/** Preview exactly one room. This never commits a step or changes the opposite
 * chamber. Used for teaching failed attempts and mismatched manual moves. */
export function previewRoomAction(source, action, quantityMode = "signed", side = "room") {
  const error = check(action);
  if (error) return { ok: false, code: "invalid", reason: error };
  const permission=quantityPermission(quantityMode,action);
  if (!permission.ok) return permission;
  return transform(source, action, side);
}
/** World-specific permissions live in the pure engine; a hidden DOM button
 * must never be the only barrier between introductory and advanced maths. */
export function levelActionPermission(state, action) {
  if((action?.op==="add"||action?.op==="remove") && state.allowedKinds &&
    !state.allowedKinds.includes(action.kind))
    return {ok:false,code:"locked-kind",
      reason:"That object belongs to a different mathematical world."};
  if (state.lockPositive && state.quantityMode !== "positive")
    return {ok:false,code:"locked-world",reason:"This workshop uses positive objects only."};
  if (state.lockPositive && (action?.op === "add" || action?.op === "remove") &&
      action.kind === "posX2")
    return {ok:false,code:"locked-kind",
      reason:"Square-shaped sprites belong to the Square Laboratory, not this workshop."};
  if (state.allowedOperations && !state.allowedOperations.includes(action?.op))
    return {ok:false,code:"locked-operation",
      reason:"That tool belongs to a later laboratory. Use the whole-number tools here."};
  if(action?.op==="unpack"&&!crateCount(state?.[action.side]))
    return {ok:false,code:"no-crates",
      reason:"There are no sealed crates left to open."};
  return {ok:true};
}
export function prepare(state, action) {
  if (state.pending) return { ok: false, reason: "Finish the matching move, or undo the first one." };
  const worldPermission = levelActionPermission(state, action);
  if (!worldPermission.ok) return worldPermission;
  const error = check(action);
  if (error) return { ok: false, reason: error };
  const permission=quantityPermission(state.quantityMode||"positive",action);
  if(!permission.ok)return permission;
  // Unpacking preserves value inside ONE room: an identity rewrite, not
  // a one-sided algebraic transformation. No other action uses this branch.
  if(action.op==="unpack"){
    const left=transform(state.left,action,"left");
    if(!left.ok)return {...left,side:"left"};
    const right=transform(state.right,action,"right");
    if(!right.ok)return {...right,side:"right"};
    return {ok:true,pair:{left,right}};
  }
  const left = transform(state.left, action,"left");
  if (!left.ok) return { ...left, side: "left" };
  const right = transform(state.right, action,"right");
  if (!right.ok) return { ...right, side: "right" };
  return { ok: true, pair: { left, right } };
}
function commit(state, action, pair, mode) {
  const before = { left: copyRoom(state.left), right: copyRoom(state.right) };
  const after = { left: copyRoom(pair.left.after), right: copyRoom(pair.right.after) };
  const transaction = { action: { ...action }, mode, before, after,
    cancellations: { left: pair.left.cancellations, right: pair.right.cancellations },
    cancellationEvents: {
      left: pair.left.cancellationEvents||[],
      right:pair.right.cancellationEvents||[]
    } };
  return { ...state, left: after.left, right: after.right, pending: null,
    history: [...state.history, transaction] };
}
/**
 * In manual mode a first-side action is provisional until the other room is selected.
 * A fully committed action cannot be one-sided.
 */
export function perform(state, action, mode = "auto", side) {
  const error=check(action);
  if(error)return {ok:false,code:"invalid",reason:error};
  const worldPermission=levelActionPermission(state,action);
  if(!worldPermission.ok)return worldPermission;
  const permission=quantityPermission(state.quantityMode||"positive",action);
  if(!permission.ok)return permission;
  if(action.op==="unpack"){
    if(state.pending||mode!=="auto")return {ok:false,code:"unpack-mode",
      reason:"Unpacking changes how we see one room; finish the current experiment first."};
    const prepared=prepare(state,action);
    if(!prepared.ok)return prepared;
    return {ok:true,committed:true,
      state:commit(state,action,prepared.pair,"rewrite")};
  }
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
    const first = previewRoomAction(state[side], action, state.quantityMode,side);
    if (!first.ok) return { ...first, side };
    const second = previewRoomAction(state[opposite], action, state.quantityMode,opposite);
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
  if(crateCount(value)){
    const count=crateCount(value);
    const grouped=(count===1?"":String(count))+
      "("+crateLabel(value.crates.contents)+")";
    const loose=expression(room({...value,crates:null}));
    return loose==="0"?grouped:
      grouped+(loose.startsWith("−")?" − "+loose.slice(1):" + "+loose);
  }
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
  if(action.op==="unpack")return "Unpack the sealed crates in the "+
    (action.side==="left"?"west":"east")+" room (same value)";
  if (action.op === "square") return "Square both entire sides (x ≥ 0)";
  if (action.op === "sqrt") return "Take the principal square root of both sides (x ≥ 0)";
  if (action.op === "multiply") return "Make " + action.factor + " complete copies in each room";
  if (action.op === "divide") return "Make " + action.factor + " equal groups in each room; keep one";
  const unit = action.count === 1 ? TOKEN_NAME[action.kind] : TOKEN_NAME[action.kind] + "s";
  return (action.op === "add" ? "Add " : "Remove ") + action.count + " " + unit + " in each room";
}
export function algebraOperation(action) {
  if(action.op==="unpack")return "Expand the brackets in the "+
    (action.side==="left"?"left":"right")+" expression — no change in value";
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
  if (level.quantityMode && !QUANTITY_MODES.includes(level.quantityMode))
    return false;
  if (levelQuantityMode(level)==="positive" &&
      [level.left,level.right].some(r=>r?.negX || r?.negOne))
    return false;
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

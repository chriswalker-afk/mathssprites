/**
 * Teaching text and visual instructions for unsuccessful *trial* operations.
 * No mutation, timers, or DOM: a rejected action never enters algebra history.
 */
export const KIND_SINGULAR = Object.freeze({
  posX: "sprite", negX: "pale sprite", posX2: "square sprite",
  posOne: "weight", negOne: "balloon"
});
export function itemWord(kind, count = 1) {
  const noun = KIND_SINGULAR[kind] || "object";
  return count === 1 ? noun : noun + "s";
}
export function shortMove(action) {
  if (!action || typeof action.op !== "string") return "made an unknown change";
  switch (action.op) {
    case "add": return "added " + action.count + " " + itemWord(action.kind, action.count);
    case "remove": return "removed " + action.count + " " + itemWord(action.kind, action.count);
    case "divide": return "divided the room into " + action.factor + " groups";
    case "multiply": return "made " + action.factor + " copies";
    case "square": return "squared the entire room";
    case "sqrt": return "took the square root";
    default: return "made an unknown change";
  }
}
export function fractionDisplay(failure) {
  if (failure?.code !== "fraction" ||
      !Number.isInteger(failure.factor) || failure.factor < 2 ||
      !Number.isInteger(failure.remainder) ||
      failure.remainder < 1 || failure.remainder >= failure.factor) return null;
  return {
    baskets: failure.factor,
    whole: failure.whole,
    numerator: failure.remainder,
    denominator: failure.factor,
    portion: Math.round(failure.remainder / failure.factor * 100),
    kind: failure.kind,
    parts: Array.from({ length: failure.factor }, (_, i) => i)
  };
}
export function attemptMessage(failure, action, side = "left") {
  const room = side === "right" ? "east" : "west";
  const rewind = " I'll undo the attempt and put everything back.";
  switch (failure?.code) {
    case "fraction": {
      const p = fractionDisplay(failure);
      return "Oh! " + failure.count + " " + itemWord(failure.kind, failure.count) +
        " won't split into " + p.baskets + " whole baskets. Each needs " +
        (p.whole ? p.whole + " and " : "") + p.numerator + "/" + p.denominator +
        " of a " + itemWord(failure.kind) +
        ". These pieces are too small. I don't want to deal with them!" + rewind;
    }
    case "overflow":
      return "Whoops! That's " + failure.total + " objects in the " + room +
        " room, but only " + failure.capacity +
        " fit! Look at them tumbling out. Too crowded!" + rewind;
    case "missing":
      return "I reached into the " + room + " room, but there are only " +
        failure.available + " " + itemWord(failure.kind, failure.available) +
        " here. I can't pick up " + failure.needed + "!" + rewind;
    case "unsupported-area":
      return action?.op === "square"
        ? "I can square a row of round sprites and weights, including mixed ones. But a square sprite would need higher powers, or these signed pieces will not fit." + rewind
        : "I tried filling the box, but the corner pieces or two mixed regions do not match a complete square. I can't keep one proper side!" + rewind;
    default:
      return (failure?.reason || "Something doesn't fit in this experiment.") + rewind;
  }
}
/**
 * Only mismatched operations with unequal algebraic effects tip the balance.
 * Equivalent-looking differences must never falsely appear unbalanced.
 */
export function mismatchedMoveMessage(firstAction, secondAction, firstSide, actualDifference) {
  const firstRoom = firstSide === "right" ? "east" : "west";
  const secondRoom = firstSide === "right" ? "west" : "east";
  const actions = "I " + shortMove(firstAction) + " in the " + firstRoom +
    " room, but " + shortMove(secondAction) + " in the " + secondRoom + ".";
  const explanation = actualDifference === 0
    ? "Different moves, but the same value — so the balance stays level. Let's practise matching actions."
    : "Look how the scale tips! Different amounts changed on each side. I must keep the sides balanced.";
  return actions + " " + explanation + " I'll undo both moves and put everything back.";
}

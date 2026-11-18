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
  const rewind = " I'll undo this attempt and put everything back.";
  switch (failure?.code) {
    case "fraction": {
      const p = fractionDisplay(failure);
      return "Oh! The " + failure.count + " " + itemWord(failure.kind, failure.count) +
        " in the " + room + " room cannot be shared into " + p.baskets +
        " whole groups. Each basket would need " +
        (p.whole ? p.whole + " whole and " : "") + p.numerator + "/" + p.denominator +
        " of a " + itemWord(failure.kind) +
        ". These pieces are too small. I don't want to deal with them if I don't have to." + rewind;
    }
    case "overflow":
      return "Whoops! That's " + failure.total + " objects in the " + room +
        " room, but I only have space for " + failure.capacity +
        "! Look at those things tumbling out. I don't think this will work." + rewind;
    case "missing":
      return "I reached into the " + room + " room, but there are only " +
        failure.available + " " + itemWord(failure.kind, failure.available) +
        " here. I can't pick up " + failure.needed + "!" + rewind;
    case "unsupported-area":
      return action?.op === "square"
        ? "This room contains different kinds of objects. A proper square would need extra cross pieces. I can't simply square each part separately." + rewind
        : "That area doesn't make a complete square of identical pieces. I would need awkward little parts." + rewind;
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
    " room, but I " + shortMove(secondAction) + " in the " + secondRoom + " room.";
  const explanation = actualDifference === 0
    ? "Those moves look different, but they happened to change the same value, so the balance stayed level. For this challenge, let's practice the same action on both sides."
    : "Look how the balance tips! We changed the two sides by different amounts. The same change must happen to both sides to keep the scale balanced.";
  return actions + " " + explanation + " I'll undo both moves and restore the rooms.";
}

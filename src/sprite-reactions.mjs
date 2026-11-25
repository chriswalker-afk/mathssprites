/**
 * Occasional reactions when the laboratory hand picks up a living sprite.
 * Animation-only: this never changes the algebra, object counts or operation.
 *
 * About 45% of ordinary sprite pickups are uneventful. The other 55% are
 * split into a startled duck and a playful dodge. Each pickup rolls once;
 * no randomness is evaluated during a frame or while the balance is pending.
 */
export const SPRITE_HAND_REACTION_CHANCES = Object.freeze({
  duck: 0.28,
  dodge: 0.55
});

export function pickSpriteHandReaction(action, roll) {
  if (action?.op !== "remove" ||
      !["posX", "negX", "posX2"].includes(action.kind) ||
      !Number.isInteger(action.count) || action.count < 1) return null;
  if (typeof roll !== "number" || !Number.isFinite(roll) || roll < 0 || roll >= 1)
    throw new RangeError("Reaction roll must be between zero (inclusive) and one (exclusive)");

  if (roll < SPRITE_HAND_REACTION_CHANCES.duck) return "duck";
  if (roll < SPRITE_HAND_REACTION_CHANCES.dodge) return "dodge";
  return null;
}

/**
 * Dodge only towards the room centre, keeping the actor on its original side
 * and away from the wall. This has no effect on its fixed mathematical slot.
 */
export function dodgeOffsetPx(spriteCentre, roomCentre) {
  if (!Number.isFinite(spriteCentre) || !Number.isFinite(roomCentre))
    throw new TypeError("Dodge centres must be finite coordinates");
  return spriteCentre >= roomCentre ? -20 : 20;
}

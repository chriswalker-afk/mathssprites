/**
 * PR85 — presentation only. One loadout can style any scope (the site,
 * a fraction shadow root, or an isolated Atelier preview) without
 * rebuilding tokens, changing their sign, or touching the engine.
 * The reward store validates ownership before a real loadout reaches us.
 * A preview may use a known locked item without equipping it.
 */
export const SPRITE_VISUAL_VARIANTS=Object.freeze({
  fur:Object.freeze(["extra-fluffy","spiky-fur"]),
  eyes:Object.freeze(["curious-eyes","sleepy-eyes"])
});
export const IMPLEMENTED_SPRITE_COSMETICS=Object.freeze(Object.values(SPRITE_VISUAL_VARIANTS).flat());
export function resolveSpriteAppearance(equipped){
  return Object.freeze(Object.fromEntries(Object.entries(SPRITE_VISUAL_VARIANTS).map(([slot,ids])=>[
    slot,ids.includes(equipped?.[slot])?equipped[slot]:"original"
  ])));
}
export function applySpriteAppearance(scope,equipped){
  const appearance=resolveSpriteAppearance(equipped);
  for(const [slot,value] of Object.entries(appearance)){
    const attr="data-sprite-"+slot;
    if(scope.getAttribute(attr)!==value)scope.setAttribute(attr,value);
  }
  return appearance;
}

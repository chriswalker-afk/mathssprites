/**
 * PR85 — presentation only. One loadout can style any scope (the site,
 * a fraction shadow root, or an isolated Atelier preview) without
 * rebuilding tokens, changing their sign, or touching the engine.
 * The reward store validates ownership before a real loadout reaches us.
 * A preview may use a known locked item without equipping it.
 */
export const SPRITE_VISUAL_VARIANTS=Object.freeze({
  fur:Object.freeze(["extra-fluffy","spiky-fur"]),
  eyes:Object.freeze(["curious-eyes","sleepy-eyes"]),
  headwear:Object.freeze(["knitted-beanie","explorer-hat","victorian-top-hat","graduation-cap","alchemist-hat","velvet-wizard-hat","crown-of-equilibrium"]),
  eyewear:Object.freeze(["brass-spectacles","inventor-goggles","professor-monocle","clockwork-goggles"]),
  neckwear:Object.freeze(["little-bow-tie","striped-scarf","order-of-balance-medal"]),
  movement:Object.freeze(["springy-bounce","magical-levitation"]),
  effect:Object.freeze(["stardust-footsteps","golden-landing-sparkles","celestial-particle-trail","constellation-aura"])
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

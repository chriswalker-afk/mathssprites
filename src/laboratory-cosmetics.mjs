/** Presentation-only weight/chamber scope. Future art PRs populate the
 * allow-lists only after all corresponding renderers support the art. */
import {applySpriteAppearance} from "./sprite-cosmetics.mjs?v=89";
import {ALTERNATIVE_WEIGHT_SHAPES} from "./weight-shapes.mjs?v=93";
export const LABORATORY_VISUAL_VARIANTS=Object.freeze({
  "weight-shape":ALTERNATIVE_WEIGHT_SHAPES,"weight-material":Object.freeze(["polished-steel","copper","blue-enamel","gold","jade-enamel","cast-iron","violet-enamel"]),
  "weight-effect":Object.freeze(["soft-glow","frost-shimmer","ember-glow","pearlescent-shimmer","golden-halo"]),"chamber-theme":Object.freeze([])
});
export const IMPLEMENTED_LABORATORY_COSMETICS=Object.freeze(Object.values(LABORATORY_VISUAL_VARIANTS).flat());
export function resolveLaboratoryAppearance(equipped){
  return Object.freeze(Object.fromEntries(Object.entries(LABORATORY_VISUAL_VARIANTS).map(([slot,ids])=>[slot,ids.includes(equipped?.[slot])?equipped[slot]:"original"])));
}
export function applyLaboratoryAppearance(scope,equipped){
  const sprites=applySpriteAppearance(scope,equipped),laboratory=resolveLaboratoryAppearance(equipped);
  for(const [slot,value] of Object.entries(laboratory)){
    const attr="data-"+slot;
    if(scope.getAttribute(attr)!==value)scope.setAttribute(attr,value);
  }
  return Object.freeze({...sprites,...laboratory});
}

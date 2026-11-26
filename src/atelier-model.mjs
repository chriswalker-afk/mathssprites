/** PR86 — a catalogue view, not a second reward system. Ownership and
 * selections always come from the PR84 store; trying on art is local. */
import {COSMETIC_REWARDS,COSMETIC_SLOTS,COSMETIC_COLLECTIONS,cosmeticCollection,findCosmeticReward,originalAppearance} from "./cosmetic-catalog.mjs?v=91";
import {IMPLEMENTED_SPRITE_COSMETICS} from "./sprite-cosmetics.mjs?v=89";
import {IMPLEMENTED_LABORATORY_COSMETICS} from "./laboratory-cosmetics.mjs?v=96";
export const IMPLEMENTED_COSMETICS=Object.freeze([...IMPLEMENTED_SPRITE_COSMETICS,...IMPLEMENTED_LABORATORY_COSMETICS]);

export const ATELIER_FILTERS=Object.freeze([
  ["all","All rewards"],["fur","Fur"],["eyes","Eyes"],["headwear","Headwear"],
  ["eyewear","Eyewear"],["neckwear","Neckwear"],["movement","Movement"],
  ["effect","Effects"],["set","Sets"],["weight-shape","Shape"],["weight-material","Material"],["weight-effect","Effects"],["chamber-theme","Themes"]
].map(([id,label])=>Object.freeze({id,label})));
export const ATELIER_SLOT_LABELS=Object.freeze({
  fur:"Fur",eyes:"Eyes",headwear:"Headwear",eyewear:"Eyewear",
  neckwear:"Neckwear",movement:"Movement",effect:"Effects",set:"Set","weight-shape":"Shape","weight-material":"Material","weight-effect":"Effect","chamber-theme":"Theme"
});
export function atelierFilters(collection){
  const slots=COSMETIC_COLLECTIONS[collection]||[];
  return ATELIER_FILTERS.filter(f=>f.id==="all"||slots.includes(f.id)||(collection==="sprites"&&f.id==="set"));
}
const descriptions=Object.freeze({
  "frostbound-vault":"Ice-carved Gothic arches, frosted steel vault doors and blue crystal ribs.",
  "ember-forge":"Dark basalt arches, copper vents and a distant bank of glowing embers.",
  "royal-treasury":"Carved gilt pilasters, burgundy damask panels and an ornate royal vault door.",
  "arcane-laboratory":"Violet stone, luminous glass alchemical vessels, and an engraved geometric seal.",
  "astral-sanctuary":"A silver celestial dome, a suspended orrery and deep indigo constellations.",
  "clockmakers-workshop":"Warm walnut panels, brass clock faces and a clockmaker's cabinet.",
  "scholars-library":"Tall bookcases, carved walnut pilasters and a quiet reading alcove.",
  "midnight-observatory":"A star-filled arched window, a brass telescope and midnight-blue stonework.",
  "botanical-laboratory":"Greenhouse glazing, trailing leaves and terracotta planters on high shelves.",
  "clockwork-foundry":"Riveted steel plates, exposed pipework and a warm furnace inset above the work area.",
  "soft-glow":"A gentle warm light across the metal, softly brightening and dimming.",
  "frost-shimmer":"Cool icy highlights with a pale blue sheen along the surface.",
  "ember-glow":"A restrained amber glow concentrated near the base, like cooling embers.",
  "pearlescent-shimmer":"An iridescent lavender, mint and pale-gold sheen over the selected metal.",
  "golden-halo":"A luminous golden band and bright edge highlights, bounded by the weight's own outline.",
  "dumbbell":"Two solid ends joined by a short grip. Still one unit of weight.",
  "hexagonal-weight":"A bevelled six-sided metal weight.",
  "kettlebell":"A rounded weight with an open handle; the opening is excluded from fractional area.",
  "cube-weight":"A compact cube with bevelled faces.",
  "metal-ingot":"A low, solid cast-metal bar.",
  "cylindrical-weight":"A smooth round-ended cylinder with a rolled rim.",
  "polished-steel":"Polished silver-grey steel with a cool metallic highlight.",
  "copper":"Warm burnished copper, with a reddish metallic sheen.",
  "blue-enamel":"Deep blue enamel with a glossy pale-blue highlight.",
  "gold":"Bright polished gold with warm yellow highlights.",
  "jade-enamel":"Glossy jade-green enamel and a softly lit edge.",
  "cast-iron":"Satin charcoal-grey iron with bright bevels, distinct from dark sprites.",
  "violet-enamel":"Glossy violet enamel with a lilac highlight.",
  "curious-eyes":"Big, inquisitive eyes for an eager explorer.",
  "extra-fluffy":"Soft, rounded tufts of fur.",
  "sleepy-eyes":"A relaxed, half-open expression.",
  "spiky-fur":"Sharper tufts for a wonderfully unruly sprite.",
  "little-bow-tie":"A neat copper-red bow tie.",
  "knitted-beanie":"A snug russet cap with stitched ribs.",
  "brass-spectacles":"Round brass frames with clear lenses.",
  "explorer-hat":"A broad-brimmed expedition hat.",
  "inventor-goggles":"Leather-strapped goggles with brass rims.",
  "striped-scarf":"A green scarf with fine golden stripes.",
  "victorian-top-hat":"A dark formal hat with a brass band.",
  "professor-monocle":"One brass lens and a delicate chain.",
  "graduation-cap":"A mortarboard with a golden tassel.",
  "alchemist-hat":"A green laboratory cap with a diamond emblem.",
  "clockwork-goggles":"Toothed clockwork rims around clear lenses.",
  "velvet-wizard-hat":"A violet pointed hat with a golden star.",
  "order-of-balance-medal":"A brass medal engraved with a balance.",
  "crown-of-equilibrium":"A golden crown with a red jewel.",
  "springy-bounce":"A lively double bounce within the normal sprite height.",
  "magical-levitation":"A gentle floating idle motion; the balance weighs exactly the same.",
  "stardust-footsteps":"Small pale stars gather at the feet.",
  "golden-landing-sparkles":"A brief golden shimmer as the sprite settles.",
  "celestial-particle-trail":"Tiny blue and violet motes follow the sprite.",
  "constellation-aura":"A delicate ring of stars around the silhouette.",
  "mischievous-eyes":"A cheeky sideways glance with jaunty brows.",
  "curled-fur":"A tightly curled monochrome fleece.",
  "distinguished-eyebrows":"Expressive, scholarly brows above clear eyes.",
  "silky-fur":"Smooth, combed fur with a soft sheen.",
  "grand-alchemist":"The complete seven-piece brass and midnight-green outfit, with exclusive fur, eyes, headwear, eyewear, neckwear, movement and aura. Equip the whole set, then mix it with other rewards."
});
export function rewardArtReady(reward,implemented=IMPLEMENTED_COSMETICS){
  if(!reward)return false;
  const ids=reward.slot?[reward.id]:Object.values(reward.loadout||{});
  return ids.length>0&&ids.every(id=>implemented.includes(id));
}
export function atelierRewardState(snapshot,reward,implemented=IMPLEMENTED_COSMETICS){
  const ready=rewardArtReady(reward,implemented);
  const owned=snapshot.unlockedRewards.includes(reward.id);
  const equipped=reward.slot?snapshot.equipped[reward.slot]===reward.id:
    Object.entries(reward.loadout||{}).every(([slot,id])=>snapshot.equipped[slot]===id);
  const starsNeeded=owned?0:Math.max(0,reward.stars-snapshot.earnedStars);
  const status=equipped&&owned&&ready?"equipped":owned&&ready?"available":
    owned?"owned-coming":ready?"locked":"locked-coming";
  return Object.freeze({ready,owned,equipped:equipped&&owned,starsNeeded,status,
    canEquip:owned&&ready&&!equipped,canRemove:owned&&equipped&&!!reward.slot});
}
export function atelierCollection(snapshot,{collection=null,filter="all",ownedOnly=false}={}){
  return COSMETIC_REWARDS.filter(r=>
    (!collection||cosmeticCollection(r)===collection)&&(filter==="all"||(r.slot??"set")===filter)&&(!ownedOnly||snapshot.unlockedRewards.includes(r.id)));
}
export function atelierPreview(snapshot,id,implemented=IMPLEMENTED_COSMETICS){
  const current={...originalAppearance(),...Object.fromEntries(COSMETIC_SLOTS.map(slot=>[slot,snapshot.equipped[slot]??null]))};
  const reward=findCosmeticReward(id);
  if(!rewardArtReady(reward,implemented))return current;
  return reward.slot?{...current,[reward.slot]:reward.id}:{...current,...reward.loadout};
}
export function atelierDescription(reward){
  return descriptions[reward.id]||(
    reward.category==="set"?"A coordinated appearance earned by mastering the entire laboratory.":
    "A collectible "+ATELIER_SLOT_LABELS[reward.slot].toLowerCase()+" reward."
  );
}
export function equipAtelierReward(store,id){
  const reward=findCosmeticReward(id);
  if(!reward)return {ok:false,code:"unknown-reward"};
  const state=atelierRewardState(store.getSnapshot(),reward);
  if(!state.owned)return {ok:false,code:"locked"};
  if(!state.ready)return {ok:false,code:"art-unavailable"};
  if(!state.canEquip)return {ok:false,code:"already-equipped"};
  return reward.slot?store.equip(reward.slot,reward.id):store.equipSet(reward.id);
}

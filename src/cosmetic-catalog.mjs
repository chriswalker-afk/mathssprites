/**
 * The Sprite Atelier reward catalogue. Stable IDs are a save-file contract;
 * names and artwork may evolve. Stars are milestones, NEVER a spendable
 * currency. Cosmetic choices have no mathematical or collision properties.
 */
export const SPRITE_COSMETIC_SLOTS=Object.freeze(["fur","eyes","headwear","eyewear","neckwear","movement","effect"]);
export const WEIGHT_COSMETIC_SLOTS=Object.freeze(["weight-shape","weight-material","weight-effect"]);
export const CHAMBER_COSMETIC_SLOTS=Object.freeze(["chamber-theme"]);
export const COSMETIC_COLLECTIONS=Object.freeze({sprites:SPRITE_COSMETIC_SLOTS,weights:WEIGHT_COSMETIC_SLOTS,chambers:CHAMBER_COSMETIC_SLOTS});
export const COSMETIC_SLOTS=Object.freeze(Object.values(COSMETIC_COLLECTIONS).flat());
export function cosmeticCollection(reward){
  if(!reward)return null;
  if(reward.category==="set")return "sprites";
  return Object.keys(COSMETIC_COLLECTIONS).find(key=>COSMETIC_COLLECTIONS[key].includes(reward.slot))??null;
}
const categoryFor=slot=>["eyewear","neckwear"].includes(slot)?"accessory":slot;
const reward=(id,name,stars,slot)=>Object.freeze({
  id,name,stars,slot,category:categoryFor(slot)
});
const grandLoadout=Object.freeze(Object.fromEntries(SPRITE_COSMETIC_SLOTS.map(slot=>[
  slot,"grand-alchemist-"+slot
])));
export const COSMETIC_REWARDS=Object.freeze([
  reward("curious-eyes","Curious eyes",3,"eyes"),
  reward("extra-fluffy","Extra fluffy",9,"fur"),
  reward("little-bow-tie","Little bow tie",18,"neckwear"),
  reward("sleepy-eyes","Sleepy eyes",30,"eyes"),
  reward("knitted-beanie","Knitted beanie",45,"headwear"),
  reward("springy-bounce","Springy bounce",60,"movement"),
  reward("brass-spectacles","Brass spectacles",72,"eyewear"),
  reward("spiky-fur","Spiky fur",90,"fur"),
  reward("explorer-hat","Explorer's hat",120,"headwear"),
  reward("mischievous-eyes","Mischievous eyes",150,"eyes"),
  reward("inventor-goggles","Brass inventor's goggles",180,"eyewear"),
  reward("striped-scarf","Striped scarf",210,"neckwear"),
  reward("stardust-footsteps","Stardust footsteps",240,"effect"),
  reward("curled-fur","Curled fur",270,"fur"),
  reward("victorian-top-hat","Victorian top hat",300,"headwear"),
  reward("professor-monocle","Professor's monocle",330,"eyewear"),
  reward("graduation-cap","Graduation cap",360,"headwear"),
  reward("distinguished-eyebrows","Distinguished eyebrows",390,"eyes"),
  reward("silky-fur","Silky fur",420,"fur"),
  reward("alchemist-hat","Alchemist's hat",450,"headwear"),
  reward("golden-landing-sparkles","Golden landing sparkles",480,"effect"),
  reward("clockwork-goggles","Clockwork goggles",510,"eyewear"),
  reward("magical-levitation","Magical levitation",540,"movement"),
  reward("velvet-wizard-hat","Velvet wizard's hat",570,"headwear"),
  reward("order-of-balance-medal","Order of the Balance medal",600,"neckwear"),
  reward("celestial-particle-trail","Celestial particle trail",630,"effect"),
  reward("crown-of-equilibrium","Crown of equilibrium",660,"headwear"),
  reward("constellation-aura","Constellation aura",690,"effect"),
  reward("polished-steel","Polished steel",6,"weight-material"),
  reward("dumbbell","Dumbbell",12,"weight-shape"),
  reward("clockmakers-workshop","Clockmaker's Workshop",24,"chamber-theme"),
  reward("copper","Copper",36,"weight-material"),
  reward("hexagonal-weight","Hexagonal weight",54,"weight-shape"),
  reward("scholars-library","Scholar's Library",66,"chamber-theme"),
  reward("soft-glow","Soft glow",81,"weight-effect"),
  reward("midnight-observatory","Midnight Observatory",105,"chamber-theme"),
  reward("blue-enamel","Blue enamel",135,"weight-material"),
  reward("kettlebell","Kettlebell",165,"weight-shape"),
  reward("botanical-laboratory","Botanical Laboratory",195,"chamber-theme"),
  reward("gold","Gold",225,"weight-material"),
  reward("jade-enamel","Jade enamel",255,"weight-material"),
  reward("clockwork-foundry","Clockwork Foundry",285,"chamber-theme"),
  reward("cube-weight","Cube weight",315,"weight-shape"),
  reward("frost-shimmer","Frost shimmer",345,"weight-effect"),
  reward("frostbound-vault","Frostbound Vault",375,"chamber-theme"),
  reward("cast-iron","Cast iron",405,"weight-material"),
  reward("metal-ingot","Metal ingot",435,"weight-shape"),
  reward("ember-forge","Ember Forge",465,"chamber-theme"),
  reward("ember-glow","Ember glow",495,"weight-effect"),
  reward("royal-treasury","Royal Treasury",525,"chamber-theme"),
  reward("violet-enamel","Violet enamel",555,"weight-material"),
  reward("arcane-laboratory","Arcane Laboratory",585,"chamber-theme"),
  reward("cylindrical-weight","Cylindrical weight",615,"weight-shape"),
  reward("pearlescent-shimmer","Pearlescent shimmer",645,"weight-effect"),
  reward("astral-sanctuary","Astral Sanctuary",675,"chamber-theme"),
  reward("golden-halo","Golden halo",705,"weight-effect"),
  Object.freeze({id:"grand-alchemist",name:"The Grand Alchemist",stars:720,
    category:"set",slot:null,loadout:grandLoadout})
].sort((a,b)=>a.stars-b.stars));
// The final set grants seven coordinated components as ONE reward. Their
// individual IDs are stable save contracts; no extra star milestones.
export const COSMETIC_ITEMS=Object.freeze([
  ...COSMETIC_REWARDS.filter(r=>r.slot).map(r=>Object.freeze({
    id:r.id,name:r.name,slot:r.slot,unlockId:r.id
  })),
  ...SPRITE_COSMETIC_SLOTS.map(slot=>Object.freeze({
    id:grandLoadout[slot],name:"Grand Alchemist "+slot,slot,
    unlockId:"grand-alchemist"
  }))
]);
const rewardsById=new Map(COSMETIC_REWARDS.map(r=>[r.id,r]));
const itemsById=new Map(COSMETIC_ITEMS.map(i=>[i.id,i]));
export const findCosmeticReward=id=>rewardsById.get(id)||null;
export const findCosmeticItem=id=>itemsById.get(id)||null;
export const originalAppearance=()=>Object.fromEntries(COSMETIC_SLOTS.map(slot=>[slot,null]));

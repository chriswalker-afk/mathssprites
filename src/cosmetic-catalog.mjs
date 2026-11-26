/**
 * The Sprite Atelier reward catalogue. Stable IDs are a save-file contract;
 * names and artwork may evolve. Stars are milestones, NEVER a spendable
 * currency. Cosmetic choices have no mathematical or collision properties.
 */
export const COSMETIC_SLOTS=Object.freeze([
  "fur","eyes","headwear","eyewear","neckwear","movement","effect"
]);
const categoryFor=slot=>["eyewear","neckwear"].includes(slot)?"accessory":slot;
const reward=(id,name,stars,slot)=>Object.freeze({
  id,name,stars,slot,category:categoryFor(slot)
});
const grandLoadout=Object.freeze(Object.fromEntries(COSMETIC_SLOTS.map(slot=>[
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
  Object.freeze({id:"grand-alchemist",name:"The Grand Alchemist",stars:720,
    category:"set",slot:null,loadout:grandLoadout})
]);
// The final set grants seven coordinated components as ONE reward. Art and
// exact styling of these components belong to the later renderer PRs.
export const COSMETIC_ITEMS=Object.freeze([
  ...COSMETIC_REWARDS.filter(r=>r.slot).map(r=>Object.freeze({
    id:r.id,name:r.name,slot:r.slot,unlockId:r.id
  })),
  ...COSMETIC_SLOTS.map(slot=>Object.freeze({
    id:grandLoadout[slot],name:"Grand Alchemist "+slot,slot,
    unlockId:"grand-alchemist"
  }))
]);
const rewardsById=new Map(COSMETIC_REWARDS.map(r=>[r.id,r]));
const itemsById=new Map(COSMETIC_ITEMS.map(i=>[i.id,i]));
export const findCosmeticReward=id=>rewardsById.get(id)||null;
export const findCosmeticItem=id=>itemsById.get(id)||null;
export const originalAppearance=()=>Object.fromEntries(COSMETIC_SLOTS.map(slot=>[slot,null]));

/** Complete presentation-only theme catalogue. No level, geometry or save rules. */
export const CHAMBER_THEMES=Object.freeze([
  {
    "id": "clockmakers-workshop",
    "stars": 24,
    "name": "Clockmaker's Workshop",
    "description": "Warm walnut panels, brass clock faces and a clockmaker's cabinet."
  },
  {
    "id": "scholars-library",
    "stars": 66,
    "name": "Scholar's Library",
    "description": "Tall bookcases, carved walnut pilasters and a quiet reading alcove."
  },
  {
    "id": "midnight-observatory",
    "stars": 105,
    "name": "Midnight Observatory",
    "description": "A star-filled arched window, a brass telescope and midnight-blue stonework."
  },
  {
    "id": "botanical-laboratory",
    "stars": 195,
    "name": "Botanical Laboratory",
    "description": "Greenhouse glazing, trailing leaves and terracotta planters on high shelves."
  },
  {
    "id": "clockwork-foundry",
    "stars": 285,
    "name": "Clockwork Foundry",
    "description": "Riveted steel plates, exposed pipework and a warm furnace inset above the work area."
  },
  {
    "id": "frostbound-vault",
    "stars": 375,
    "name": "Frostbound Vault",
    "description": "Ice-carved Gothic arches, frosted steel vault doors and blue crystal ribs."
  },
  {
    "id": "ember-forge",
    "stars": 465,
    "name": "Ember Forge",
    "description": "Dark basalt arches, copper vents and a distant bank of glowing embers."
  },
  {
    "id": "royal-treasury",
    "stars": 525,
    "name": "Royal Treasury",
    "description": "Carved gilt pilasters, burgundy damask panels and an ornate royal vault door."
  },
  {
    "id": "arcane-laboratory",
    "stars": 585,
    "name": "Arcane Laboratory",
    "description": "Violet stone, luminous glass alchemical vessels, and an engraved geometric seal."
  },
  {
    "id": "astral-sanctuary",
    "stars": 675,
    "name": "Astral Sanctuary",
    "description": "A silver celestial dome, a suspended orrery and deep indigo constellations."
  }
].map(Object.freeze));
export const IMPLEMENTED_CHAMBER_THEMES=Object.freeze(CHAMBER_THEMES.map(t=>t.id));

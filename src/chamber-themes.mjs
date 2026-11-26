/** PR95: presentation-only theme catalogue. No level, geometry or save rules. */
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
  }
].map(Object.freeze));
export const IMPLEMENTED_CHAMBER_THEMES=Object.freeze(CHAMBER_THEMES.map(t=>t.id));

/** Shared shape silhouettes for CSS actors and exact SVG pieces.
 *  All coordinates are in the same 100 x 100 box. Holes remove physical
 *  area; shine/rim strokes never add mass or affect cuts. */
const definitions={
  "original": {
    "outer": [
      [
        29,
        17
      ],
      [
        72,
        17
      ],
      [
        90,
        88
      ],
      [
        84,
        97
      ],
      [
        13,
        97
      ],
      [
        8,
        88
      ]
    ],
    "holes": [],
    "rise": 33,
    "fractionRise": 34,
    "rim": "M12 89H88 M13 94H86",
    "shine": "M36 31L31 72"
  },
  "dumbbell": {
    "outer": [
      [
        4,
        25
      ],
      [
        12,
        15
      ],
      [
        30,
        15
      ],
      [
        37,
        24
      ],
      [
        37,
        43
      ],
      [
        63,
        43
      ],
      [
        63,
        24
      ],
      [
        70,
        15
      ],
      [
        88,
        15
      ],
      [
        96,
        25
      ],
      [
        96,
        87
      ],
      [
        88,
        97
      ],
      [
        70,
        97
      ],
      [
        63,
        88
      ],
      [
        63,
        62
      ],
      [
        37,
        62
      ],
      [
        37,
        88
      ],
      [
        30,
        97
      ],
      [
        12,
        97
      ],
      [
        4,
        87
      ]
    ],
    "holes": [],
    "rise": 31,
    "fractionRise": 32,
    "rim": "M13 18V94 M30 18V94 M70 18V94 M87 18V94 M38 48H62",
    "shine": "M19 26V73 M76 26V73"
  },
  "hexagonal-weight": {
    "outer": [
      [
        25,
        17
      ],
      [
        75,
        17
      ],
      [
        97,
        55
      ],
      [
        75,
        97
      ],
      [
        25,
        97
      ],
      [
        3,
        55
      ]
    ],
    "holes": [],
    "rise": 28,
    "fractionRise": 29,
    "rim": "M29 26H71L87 55L71 88H29L13 55Z",
    "shine": "M30 30L17 53L31 77"
  },
  "kettlebell": {
    "outer": [
      [
        39,
        9
      ],
      [
        61,
        9
      ],
      [
        72,
        15
      ],
      [
        78,
        29
      ],
      [
        78,
        41
      ],
      [
        89,
        52
      ],
      [
        96,
        68
      ],
      [
        94,
        82
      ],
      [
        85,
        94
      ],
      [
        72,
        97
      ],
      [
        28,
        97
      ],
      [
        15,
        94
      ],
      [
        6,
        82
      ],
      [
        4,
        68
      ],
      [
        11,
        52
      ],
      [
        22,
        41
      ],
      [
        22,
        29
      ],
      [
        28,
        15
      ]
    ],
    "holes": [
      [
        [
          40,
          22
        ],
        [
          60,
          22
        ],
        [
          65,
          26
        ],
        [
          66,
          35
        ],
        [
          63,
          40
        ],
        [
          37,
          40
        ],
        [
          34,
          35
        ],
        [
          35,
          26
        ]
      ]
    ],
    "rise": 25,
    "fractionRise": 26,
    "rim": "M24 43Q50 50 76 43 M16 85Q50 96 84 85",
    "shine": "M29 54Q16 64 20 78"
  },
  "cube-weight": {
    "outer": [
      [
        8,
        32
      ],
      [
        29,
        13
      ],
      [
        92,
        13
      ],
      [
        96,
        18
      ],
      [
        96,
        77
      ],
      [
        76,
        97
      ],
      [
        8,
        97
      ]
    ],
    "holes": [],
    "rise": 30,
    "fractionRise": 31,
    "rim": "M8 32H76L96 13 M76 32V97",
    "shine": "M17 42V84"
  },
  "metal-ingot": {
    "outer": [
      [
        23,
        35
      ],
      [
        37,
        24
      ],
      [
        83,
        24
      ],
      [
        95,
        37
      ],
      [
        99,
        86
      ],
      [
        86,
        97
      ],
      [
        4,
        97
      ],
      [
        1,
        88
      ]
    ],
    "holes": [],
    "rise": 27,
    "fractionRise": 28,
    "rim": "M23 35L86 35L95 37 M86 35L76 87L4 97 M76 87L99 86",
    "shine": "M31 30H76 M23 48L13 78"
  },
  "cylindrical-weight": {
    "outer": [
      [
        4,
        31
      ],
      [
        8,
        24
      ],
      [
        20,
        19
      ],
      [
        34,
        16
      ],
      [
        66,
        16
      ],
      [
        80,
        19
      ],
      [
        92,
        24
      ],
      [
        96,
        31
      ],
      [
        96,
        82
      ],
      [
        92,
        89
      ],
      [
        80,
        94
      ],
      [
        66,
        97
      ],
      [
        34,
        97
      ],
      [
        20,
        94
      ],
      [
        8,
        89
      ],
      [
        4,
        82
      ]
    ],
    "holes": [],
    "rise": 31,
    "fractionRise": 32,
    "rim": "M4 31C4 52 96 52 96 31 M4 82Q50 106 96 82",
    "shine": "M20 48V79"
  }
};
const freezeRing=ring=>Object.freeze(ring.map(p=>Object.freeze(p)));
export const WEIGHT_SHAPES=Object.freeze(Object.fromEntries(Object.entries(definitions).map(([id,s])=>[id,Object.freeze({...s,outer:freezeRing(s.outer),holes:Object.freeze(s.holes.map(freezeRing))})])));
export const ALTERNATIVE_WEIGHT_SHAPES=Object.freeze(Object.keys(WEIGHT_SHAPES).filter(id=>id!=="original"));
export function resolveWeightShape(id){return typeof id==="string"&&Object.hasOwn(WEIGHT_SHAPES,id)?id:"original";}
export function weightShape(id){return WEIGHT_SHAPES[resolveWeightShape(id)];}
/** A bridge traversed twice has zero area. The even-odd fill rule cuts
 * out the handle hole in both CSS and SVG without extra visible tokens. */
export function weightShapeClip(id){
  const s=weightShape(id),points=[...s.outer];
  if(s.holes.length){
    points.push(s.outer[0]);
    for(const hole of s.holes)points.push(...hole,hole[0],s.outer[0]);
  }
  return "polygon(evenodd, "+points.map(([x,y])=>x+"% "+y+"%").join(", ")+")";
}

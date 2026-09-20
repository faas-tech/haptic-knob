export type DiscId = "long-shot" | "standard" | "target";

export type DiscGolfDisc = {
  id: DiscId;
  name: string;
  shortName: string;
  carryYards: number;
  turnRating: number;
  fadeRating: number;
  windSensitivity: number;
  glide: number;
  loftDegrees: number;
};

export const DISC_BAG: DiscGolfDisc[] = [
  {
    id: "long-shot",
    name: "Long-shot",
    shortName: "LS",
    carryYards: 108,
    turnRating: -3.4,
    fadeRating: 3.1,
    windSensitivity: 1,
    glide: 5.2,
    loftDegrees: 12,
  },
  {
    id: "standard",
    name: "Standard",
    shortName: "ST",
    carryYards: 70,
    turnRating: -1,
    fadeRating: 1.8,
    windSensitivity: 0.5,
    glide: 4,
    loftDegrees: 10,
  },
  {
    id: "target",
    name: "Target",
    shortName: "TG",
    carryYards: 40,
    turnRating: 0,
    fadeRating: 0.7,
    windSensitivity: 0.22,
    glide: 3,
    loftDegrees: 8,
  },
];

export const DISC_COUNT = DISC_BAG.length;

export function discById(discId: DiscId): DiscGolfDisc {
  return DISC_BAG.find((disc) => disc.id === discId) ?? DISC_BAG[1];
}

export function discAtBagIndex(bagIndex: number): DiscGolfDisc {
  const wrappedIndex = ((bagIndex % DISC_COUNT) + DISC_COUNT) % DISC_COUNT;
  return DISC_BAG[wrappedIndex];
}

export function bagIndexForDiscId(discId: DiscId): number {
  return DISC_BAG.findIndex((disc) => disc.id === discId);
}

export function nextDiscId(discId: DiscId): DiscId {
  return discAtBagIndex(bagIndexForDiscId(discId) + 1).id;
}

export function previousDiscId(discId: DiscId): DiscId {
  return discAtBagIndex(bagIndexForDiscId(discId) - 1).id;
}

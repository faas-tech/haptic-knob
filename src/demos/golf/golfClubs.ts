export type SwingClubId =
  | "pitching-wedge"
  | "eight-iron"
  | "five-iron"
  | "hybrid"
  | "driver";

export type ClubId = SwingClubId | "putter";

export type GolfClub = {
  id: ClubId;
  name: string;
  shortName: string;
  carryYards: number;
  loftDegrees: number;
  rollFactor: number;
  puttYards: number;
};

export const SWING_CLUBS: GolfClub[] = [
  {
    id: "pitching-wedge",
    name: "Pitching wedge",
    shortName: "PW",
    carryYards: 100,
    loftDegrees: 46,
    rollFactor: 0.12,
    puttYards: 0,
  },
  {
    id: "eight-iron",
    name: "8 iron",
    shortName: "8i",
    carryYards: 140,
    loftDegrees: 38,
    rollFactor: 0.18,
    puttYards: 0,
  },
  {
    id: "five-iron",
    name: "5 iron",
    shortName: "5i",
    carryYards: 170,
    loftDegrees: 27,
    rollFactor: 0.28,
    puttYards: 0,
  },
  {
    id: "hybrid",
    name: "Hybrid",
    shortName: "Hy",
    carryYards: 200,
    loftDegrees: 18,
    rollFactor: 0.38,
    puttYards: 0,
  },
  {
    id: "driver",
    name: "Driver",
    shortName: "Dr",
    carryYards: 240,
    loftDegrees: 10,
    rollFactor: 0.48,
    puttYards: 0,
  },
];

export const PUTTER: GolfClub = {
  id: "putter",
  name: "Putter",
  shortName: "Pt",
  carryYards: 0,
  loftDegrees: 3,
  rollFactor: 1,
  puttYards: 28,
};

export const SWING_CLUB_COUNT = SWING_CLUBS.length;

export function swingClubAtDetentIndex(detentIndex: number): GolfClub {
  const wrappedIndex =
    ((detentIndex % SWING_CLUB_COUNT) + SWING_CLUB_COUNT) % SWING_CLUB_COUNT;
  return SWING_CLUBS[wrappedIndex];
}

export function detentIndexForSwingClubId(clubId: SwingClubId): number {
  return SWING_CLUBS.findIndex((club) => club.id === clubId);
}

export function nextSwingClubId(clubId: SwingClubId): SwingClubId {
  const detentIndex = detentIndexForSwingClubId(clubId);
  return swingClubAtDetentIndex(detentIndex + 1).id as SwingClubId;
}

export function previousSwingClubId(clubId: SwingClubId): SwingClubId {
  const detentIndex = detentIndexForSwingClubId(clubId);
  return swingClubAtDetentIndex(detentIndex - 1).id as SwingClubId;
}

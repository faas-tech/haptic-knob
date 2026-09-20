import rulerTileImageSrc from "../assets/ruler-tile.png?inline";

export type LabAppAccent = "detent" | "spring" | "damper" | "none";
export type LabAppStatus = "ready" | "draft";

export type LabApp = {
  id: string;
  title: string;
  tagline: string;
  status: LabAppStatus;
  route: string | null;
  tileImageSrc: string | null;
  accent: LabAppAccent;
  isCustom: boolean;
};

export const BUILT_IN_LAB_APPS: LabApp[] = [
  {
    id: "ruler",
    title: "12-inch ruler",
    tagline: "Different click strength at quarter, half, and full inch.",
    status: "ready",
    route: "/ruler",
    tileImageSrc: rulerTileImageSrc,
    accent: "detent",
    isCustom: false,
  },
  {
    id: "golf",
    title: "Golf",
    tagline: "Nine holes, par 36.",
    status: "ready",
    route: "/golf",
    tileImageSrc: null,
    accent: "spring",
    isCustom: false,
  },
  {
    id: "disc-golf",
    title: "Disc Golf",
    tagline: "Nine holes, par 32.",
    status: "ready",
    route: "/disc-golf",
    tileImageSrc: null,
    accent: "damper",
    isCustom: false,
  },
];

export const CUSTOM_LAB_APPS_STORAGE_KEY = "haptic-knob.custom-lab-apps";

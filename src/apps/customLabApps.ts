import {
  CUSTOM_LAB_APPS_STORAGE_KEY,
  type LabApp,
} from "./labApps";

export function readCustomLabApps(): LabApp[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LAB_APPS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isLabApp);
  } catch {
    return [];
  }
}

export function writeCustomLabApps(customLabApps: LabApp[]) {
  localStorage.setItem(
    CUSTOM_LAB_APPS_STORAGE_KEY,
    JSON.stringify(customLabApps),
  );
}

export function createDraftLabApp(title: string, tagline: string): LabApp {
  return {
    id: crypto.randomUUID(),
    title,
    tagline,
    status: "draft",
    route: null,
    tileImageSrc: null,
    accent: "none",
    isCustom: true,
  };
}

function isLabApp(value: unknown): value is LabApp {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.tagline === "string" &&
    (record.status === "ready" || record.status === "draft")
  );
}

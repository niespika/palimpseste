export type ParcoursLevel = "A" | "B";

export type Parcours = {
  id: string;
  title: string;
  description?: string;
  level: ParcoursLevel;
  chaptersCount: number;
};

const STORAGE_KEY = "palimpseste-parcours";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createParcours(data: {
  title: string;
  description?: string;
  level: ParcoursLevel;
  chaptersCount: number;
}): Parcours {
  return {
    id: createId(),
    title: data.title,
    description: data.description?.trim() || undefined,
    level: data.level,
    chaptersCount: data.chaptersCount,
  };
}

export function readParcours(): Parcours[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Parcours[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry) =>
        entry &&
        typeof entry.title === "string" &&
        typeof entry.level === "string" &&
        typeof entry.chaptersCount === "number"
    );
  } catch {
    return [];
  }
}

export function persistParcours(parcours: Parcours[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parcours));
}

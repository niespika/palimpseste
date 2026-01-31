export type ParcoursLevel = "A" | "B";
export type ChapterStatus = "draft" | "validated";

export type Chapter = {
  id: string;
  index: number;
  title: string;
  objectives: string;
  status: ChapterStatus;
};

export type Parcours = {
  id: string;
  title: string;
  description?: string;
  level: ParcoursLevel;
  chaptersCount: number;
  chapters: Chapter[];
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
    chapters: createChapters(data.chaptersCount),
  };
}

function createChapters(count: number): Chapter[] {
  return Array.from({ length: count }, (_, index) =>
    createChapter(index + 1)
  );
}

function createChapter(index: number): Chapter {
  return {
    id: createId(),
    index,
    title: `Chapitre ${index}`,
    objectives: "",
    status: "draft",
  };
}

function normalizeChapters(
  chapters: unknown,
  chaptersCount: number
): Chapter[] {
  if (!Array.isArray(chapters)) {
    return createChapters(chaptersCount);
  }
  const sanitized = chapters
    .map((entry, position) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Partial<Chapter>;
      const index =
        typeof record.index === "number" && record.index > 0
          ? record.index
          : position + 1;
      const title =
        typeof record.title === "string" && record.title.trim()
          ? record.title
          : `Chapitre ${index}`;
      const objectives =
        typeof record.objectives === "string" ? record.objectives : "";
      const status = record.status === "validated" ? "validated" : "draft";
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        index,
        title,
        objectives,
        status,
      } as Chapter;
    })
    .filter((entry): entry is Chapter => Boolean(entry));

  const allIndexed = sanitized.every((chapter) => Number.isFinite(chapter.index));
  const ordered = allIndexed
    ? [...sanitized].sort((a, b) => a.index - b.index)
    : sanitized;
  const trimmed = ordered.slice(0, chaptersCount);
  while (trimmed.length < chaptersCount) {
    trimmed.push(createChapter(trimmed.length + 1));
  }
  return trimmed.map((chapter, index) => ({
    ...chapter,
    index: index + 1,
    title: chapter.title.trim() || `Chapitre ${index + 1}`,
  }));
}

function normalizeParcours(entry: unknown): Parcours | null {
  if (
    !entry ||
    typeof entry !== "object" ||
    typeof entry.title !== "string" ||
    typeof entry.level !== "string" ||
    typeof entry.chaptersCount !== "number"
  ) {
    return null;
  }
  const record = entry as Parcours;
  return {
    ...record,
    description: record.description?.trim() || undefined,
    chapters: normalizeChapters(record.chapters, record.chaptersCount),
  };
}

export function readParcours(): Parcours[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Parcours[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeParcours(entry))
      .filter((entry): entry is Parcours => Boolean(entry));
  } catch {
    return [];
  }
}

export function persistParcours(parcours: Parcours[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parcours));
}

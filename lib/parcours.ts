import type { Passage } from "./passages";
import { hashText } from "./passages";

export type ParcoursLevel = "A" | "B";
export type ChapterStatus = "draft" | "validated";
export type DocumentStatus = "pending" | "processed" | "failed";

export type Chapter = {
  id: string;
  index: number;
  title: string;
  objectives: string;
  status: ChapterStatus;
};

export type CourseDocument = {
  fileName: string;
  uploadedAt: string;
  status: DocumentStatus;
  content: string;
  error?: string;
};

export type Parcours = {
  id: string;
  title: string;
  description?: string;
  level: ParcoursLevel;
  chaptersCount: number;
  chapters: Chapter[];
  document?: CourseDocument;
  passages?: Passage[];
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
    document: normalizeDocument(record.document),
    passages: normalizePassages(record.passages, record.id),
  };
}

function normalizeDocument(entry: unknown): CourseDocument | undefined {
  if (!entry || typeof entry !== "object") return undefined;
  const record = entry as Partial<CourseDocument>;
  if (typeof record.fileName !== "string" || !record.fileName.trim()) {
    return undefined;
  }
  const status =
    record.status === "processed" || record.status === "failed"
      ? record.status
      : "pending";
  const uploadedAt =
    typeof record.uploadedAt === "string" && record.uploadedAt.trim()
      ? record.uploadedAt
      : new Date().toISOString();
  return {
    fileName: record.fileName,
    uploadedAt,
    status,
    content: typeof record.content === "string" ? record.content : "",
    error:
      typeof record.error === "string" && record.error.trim()
        ? record.error
        : undefined,
  };
}

function normalizePassages(
  entry: unknown,
  trackId: string
): Passage[] | undefined {
  if (!Array.isArray(entry)) return undefined;
  const sanitized = entry
    .map((item, position) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Partial<Passage>;
      const text = typeof record.text === "string" ? record.text.trim() : "";
      if (!text) return null;
      const index =
        typeof record.index === "number" && record.index > 0
          ? record.index
          : position + 1;
      const charStart =
        typeof record.charStart === "number" ? record.charStart : 0;
      const charEnd =
        typeof record.charEnd === "number"
          ? record.charEnd
          : charStart + text.length;
      const hash =
        typeof record.hash === "string" && record.hash.trim()
          ? record.hash
          : hashText(text);
      const createdAt =
        typeof record.createdAt === "string" && record.createdAt.trim()
          ? record.createdAt
          : new Date().toISOString();
      return {
        id:
          typeof record.id === "string" && record.id.trim()
            ? record.id
            : `passage-${trackId}-${index}`,
        trackId,
        index,
        text,
        charStart,
        charEnd,
        hash,
        createdAt,
      };
    })
    .filter((item): item is Passage => Boolean(item));

  return sanitized
    .sort((a, b) => a.index - b.index)
    .map((passage, index) => ({
      ...passage,
      index: index + 1,
    }));
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

export type ResourceType = "text" | "image";

export type Resource = {
  id: string;
  title: string;
  type: ResourceType;
  content?: string;
  imageDataUrl?: string;
  imageFileName?: string;
  source?: string;
  tags: string[];
  createdAt: string;
};

const STORAGE_KEY = "palimpseste-resources";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const normalized = tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => Boolean(tag));
  return Array.from(new Set(normalized));
}

export function createTextResource(data: {
  title: string;
  content: string;
  source?: string;
  tags: string[];
}): Resource {
  return {
    id: createId(),
    title: data.title.trim(),
    type: "text",
    content: data.content,
    source: data.source?.trim() || undefined,
    tags: normalizeTags(data.tags),
    createdAt: new Date().toISOString(),
  };
}

export function createImageResource(data: {
  title: string;
  imageDataUrl: string;
  imageFileName?: string;
  source?: string;
  tags: string[];
}): Resource {
  return {
    id: createId(),
    title: data.title.trim(),
    type: "image",
    imageDataUrl: data.imageDataUrl,
    imageFileName: data.imageFileName?.trim() || undefined,
    source: data.source?.trim() || undefined,
    tags: normalizeTags(data.tags),
    createdAt: new Date().toISOString(),
  };
}

function normalizeResource(entry: unknown): Resource | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Partial<Resource>;
  if (typeof record.title !== "string" || !record.title.trim()) return null;
  const type = record.type === "image" ? "image" : "text";
  const createdAt =
    typeof record.createdAt === "string" && record.createdAt.trim()
      ? record.createdAt
      : new Date().toISOString();
  const base: Resource = {
    id: typeof record.id === "string" ? record.id : createId(),
    title: record.title.trim(),
    type,
    tags: normalizeTags(record.tags),
    createdAt,
  };

  if (type === "image") {
    if (typeof record.imageDataUrl !== "string") return null;
    return {
      ...base,
      imageDataUrl: record.imageDataUrl,
      imageFileName:
        typeof record.imageFileName === "string" && record.imageFileName.trim()
          ? record.imageFileName
          : undefined,
      source:
        typeof record.source === "string" && record.source.trim()
          ? record.source
          : undefined,
    };
  }

  return {
    ...base,
    content: typeof record.content === "string" ? record.content : "",
    source:
      typeof record.source === "string" && record.source.trim()
        ? record.source
        : undefined,
  };
}

export function readResources(): Resource[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Resource[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeResource(entry))
      .filter((entry): entry is Resource => Boolean(entry));
  } catch {
    return [];
  }
}

export function persistResources(resources: Resource[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
}

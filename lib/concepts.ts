import type { Passage } from "./passages";

export type ConceptStatus = "proposed" | "validated" | "rejected";

export type Concept = {
  id: string;
  trackId: string;
  name: string;
  definition: string;
  status: ConceptStatus;
  createdAt: string;
  passageIds: string[];
};

export type ConceptPassage = {
  conceptId: string;
  passageId: string;
};

type ConceptCandidate = {
  name: string;
  definition: string;
};

const STOP_NAMES = new Set([
  "il",
  "elle",
  "ils",
  "elles",
  "ce",
  "cela",
  "ceci",
  "on",
  "nous",
  "vous",
  "je",
  "tu",
]);

function createId(trackId: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `concept-${trackId}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function normalizeName(value: string) {
  return value
    .replace(/[“”"«»]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*[:–-]\s*$/, "")
    .trim();
}

function isValidName(name: string) {
  if (!name || name.length < 3 || name.length > 80) return false;
  if (STOP_NAMES.has(name.trim().toLowerCase())) return false;
  const words = name.split(/\s+/);
  if (words.length > 8) return false;
  return true;
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractFromSentence(sentence: string): ConceptCandidate | null {
  const trimmed = sentence.trim();
  if (!trimmed) return null;

  const patterns: Array<RegExp> = [
    /^([^:]{3,80})\s*[:–-]\s+(.{10,})$/i,
    /^(.{3,80})\s+(est|sont|désigne|désignent|correspond|correspondent|renvoie|renvoient|signifie|signifient|se définit|se definit|se définissent|se definissent|se définit comme|se definissent comme)\b/i,
    /^On appelle\s+([^,]{3,80})\s+/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (!match) continue;
    const rawName = match[1] ?? "";
    const name = normalizeName(rawName);
    if (!isValidName(name)) continue;
    return {
      name,
      definition: trimmed,
    };
  }
  return null;
}

export function extractConceptsFromPassages(
  passages: Passage[],
  trackId: string
): Concept[] {
  const concepts = new Map<string, Concept>();
  const now = new Date().toISOString();

  passages.forEach((passage) => {
    const sentences = splitSentences(passage.text);
    sentences.forEach((sentence) => {
      const candidate = extractFromSentence(sentence);
      if (!candidate) return;
      const key = candidate.name.toLowerCase();
      const existing = concepts.get(key);
      if (existing) {
        if (!existing.passageIds.includes(passage.id)) {
          existing.passageIds.push(passage.id);
        }
        return;
      }
      concepts.set(key, {
        id: createId(trackId),
        trackId,
        name: candidate.name,
        definition: candidate.definition,
        status: "proposed",
        createdAt: now,
        passageIds: [passage.id],
      });
    });
  });

  return Array.from(concepts.values());
}

export function ensureConceptPassageIds(
  passageIds: string[],
  availableIds: Set<string>
): string[] {
  const unique = new Set<string>();
  passageIds.forEach((id) => {
    if (availableIds.has(id)) {
      unique.add(id);
    }
  });
  return Array.from(unique);
}

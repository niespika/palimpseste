export type Passage = {
  id: string;
  trackId: string;
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
  hash: string;
  createdAt: string;
};

const MIN_PASSAGE_LENGTH = 300;
const MAX_PASSAGE_LENGTH = 1200;

type TextRange = {
  start: number;
  end: number;
};

export function generatePassagesFromText(
  text: string,
  trackId: string
): Passage[] {
  const normalized = text.trim();
  if (!normalized) return [];
  const ranges = buildPassageRanges(text);
  const createdAt = new Date().toISOString();
  return ranges.map((range, index) => {
    const passageText = text.slice(range.start, range.end);
    const hash = hashText(passageText);
    return {
      id: `passage-${trackId}-${index + 1}-${hash.slice(0, 8)}`,
      trackId,
      index: index + 1,
      text: passageText,
      charStart: range.start,
      charEnd: range.end,
      hash,
      createdAt,
    };
  });
}

export function hashText(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildPassageRanges(text: string): TextRange[] {
  const paragraphs = splitParagraphs(text);
  const roughChunks = buildChunksFromParagraphs(text, paragraphs);
  const merged = mergeShortChunks(text, roughChunks);
  return merged
    .map((range) => trimRange(text, range.start, range.end))
    .filter((range) => range.end > range.start);
}

function splitParagraphs(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  const separator = /\n\s*\n+/g;
  let lastIndex = 0;
  for (const match of text.matchAll(separator)) {
    const end = match.index ?? 0;
    if (end > lastIndex) {
      const trimmed = trimRange(text, lastIndex, end);
      if (trimmed.end > trimmed.start) {
        ranges.push(trimmed);
      }
    }
    lastIndex = end + match[0].length;
  }
  if (lastIndex < text.length) {
    const trimmed = trimRange(text, lastIndex, text.length);
    if (trimmed.end > trimmed.start) {
      ranges.push(trimmed);
    }
  }
  return ranges;
}

function buildChunksFromParagraphs(
  text: string,
  paragraphs: TextRange[]
): TextRange[] {
  const chunks: TextRange[] = [];
  let current: TextRange | null = null;

  const flushCurrent = () => {
    if (!current) return;
    const trimmed = trimRange(text, current.start, current.end);
    if (trimmed.end > trimmed.start) {
      chunks.push(trimmed);
    }
    current = null;
  };

  for (const paragraph of paragraphs) {
    const length = paragraph.end - paragraph.start;
    if (length > MAX_PASSAGE_LENGTH) {
      flushCurrent();
      chunks.push(...splitLongRange(text, paragraph));
      continue;
    }

    if (!current) {
      current = { ...paragraph };
      continue;
    }

    const extendedEnd = paragraph.end;
    if (extendedEnd - current.start <= MAX_PASSAGE_LENGTH) {
      current.end = extendedEnd;
    } else {
      flushCurrent();
      current = { ...paragraph };
    }
  }

  flushCurrent();
  return chunks;
}

function splitLongRange(text: string, range: TextRange): TextRange[] {
  const ranges: TextRange[] = [];
  let offset = range.start;
  while (offset < range.end) {
    const remainingLength = range.end - offset;
    if (remainingLength <= MAX_PASSAGE_LENGTH) {
      ranges.push(trimRange(text, offset, range.end));
      break;
    }
    const slice = text.slice(offset, offset + MAX_PASSAGE_LENGTH + 1);
    const breakIndex = findBreakIndex(slice);
    const nextEnd = offset + breakIndex;
    ranges.push(trimRange(text, offset, nextEnd));
    offset = nextEnd;
  }
  return ranges.filter((entry) => entry.end > entry.start);
}

function findBreakIndex(slice: string): number {
  const maxIndex = Math.min(slice.length, MAX_PASSAGE_LENGTH);
  if (slice.length <= MAX_PASSAGE_LENGTH) return slice.length;
  const boundaryRegex = /[.!?…]\s+|\n+/g;
  let match: RegExpExecArray | null = null;
  let lastValid = -1;
  while ((match = boundaryRegex.exec(slice)) !== null) {
    const endIndex = match.index + match[0].length;
    if (endIndex >= MIN_PASSAGE_LENGTH && endIndex <= maxIndex) {
      lastValid = endIndex;
    }
  }
  if (lastValid !== -1) return lastValid;
  return maxIndex;
}

function mergeShortChunks(text: string, chunks: TextRange[]): TextRange[] {
  const merged: TextRange[] = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const current = chunks[i];
    const currentLength = current.end - current.start;
    if (
      currentLength >= MIN_PASSAGE_LENGTH ||
      i === chunks.length - 1
    ) {
      merged.push(current);
      continue;
    }

    const next = chunks[i + 1];
    if (next) {
      const combinedLength = next.end - current.start;
      if (combinedLength <= MAX_PASSAGE_LENGTH) {
        chunks[i + 1] = { start: current.start, end: next.end };
        continue;
      }
    }

    const previous = merged[merged.length - 1];
    if (previous) {
      const combinedLength = current.end - previous.start;
      if (combinedLength <= MAX_PASSAGE_LENGTH) {
        merged[merged.length - 1] = {
          start: previous.start,
          end: current.end,
        };
        continue;
      }
    }

    merged.push(current);
  }

  return merged
    .map((range) => trimRange(text, range.start, range.end))
    .filter((range) => range.end > range.start);
}

function trimRange(text: string, start: number, end: number): TextRange {
  let trimmedStart = start;
  let trimmedEnd = end;
  while (trimmedStart < trimmedEnd && /\s/.test(text[trimmedStart])) {
    trimmedStart += 1;
  }
  while (trimmedEnd > trimmedStart && /\s/.test(text[trimmedEnd - 1])) {
    trimmedEnd -= 1;
  }
  return { start: trimmedStart, end: trimmedEnd };
}

export type Student = {
  id: string;
  pseudo: string;
  firstName?: string;
  lastName?: string;
};

export type Classroom = {
  id: string;
  name: string;
  students: Student[];
};

const STORAGE_KEY = "palimpseste-classrooms";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createClassroom(name: string): Classroom {
  return {
    id: createId(),
    name,
    students: [],
  };
}

export function createStudent(data: {
  pseudo: string;
  firstName?: string;
  lastName?: string;
}): Student {
  return {
    id: createId(),
    pseudo: data.pseudo,
    firstName: data.firstName?.trim() || undefined,
    lastName: data.lastName?.trim() || undefined,
  };
}

export function readClassrooms(): Classroom[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Classroom[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.name === "string");
  } catch {
    return [];
  }
}

export function persistClassrooms(classrooms: Classroom[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(classrooms));
}

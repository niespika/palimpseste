export type Role = "teacher" | "student";

type UserRecord = {
  email: string;
  password: string;
  role: Role;
};

const USERS: UserRecord[] = [
  {
    email: "teacher@palimpseste.fr",
    password: "teacher123",
    role: "teacher"
  },
  {
    email: "student@palimpseste.fr",
    password: "student123",
    role: "student"
  }
];

const STORAGE_KEY = "palimpseste-role";

export function authenticate(email: string, password: string): Role | null {
  const user = USERS.find(
    (entry) => entry.email === email.trim() && entry.password === password
  );

  return user ? user.role : null;
}

export function persistRole(role: Role) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, role);
}

export function readRole(): Role | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "teacher" || stored === "student") {
    return stored;
  }
  return null;
}

export function clearRole() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

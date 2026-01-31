"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/app/components/RoleGuard";
import { clearRole } from "@/lib/auth";
import type { Classroom } from "@/lib/classrooms";
import {
  createClassroom,
  createStudent,
  persistClassrooms,
  readClassrooms,
} from "@/lib/classrooms";

export default function TeacherDashboard() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [studentPseudo, setStudentPseudo] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readClassrooms();
    setClassrooms(stored);
    if (stored.length > 0) {
      setSelectedClassId(stored[0].id);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    persistClassrooms(classrooms);
  }, [classrooms, isReady]);

  const selectedClassroom = useMemo(
    () => classrooms.find((entry) => entry.id === selectedClassId) || null,
    [classrooms, selectedClassId]
  );

  const handleLogout = () => {
    clearRole();
    router.replace("/login");
  };

  const handleCreateClass = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    const classroom = createClassroom(trimmed);
    setClassrooms((prev) => [...prev, classroom]);
    setSelectedClassId(classroom.id);
    setNewClassName("");
  };

  const handleAddStudent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPseudo = studentPseudo.trim();
    if (!trimmedPseudo || !selectedClassroom) return;
    const student = createStudent({
      pseudo: trimmedPseudo,
      firstName: studentFirstName,
      lastName: studentLastName,
    });
    setClassrooms((prev) =>
      prev.map((entry) =>
        entry.id === selectedClassroom.id
          ? { ...entry, students: [...entry.students, student] }
          : entry
      )
    );
    setStudentPseudo("");
    setStudentFirstName("");
    setStudentLastName("");
  };

  return (
    <RoleGuard role="teacher">
      <div className="card">
        <div>
          <h1>Tableau de bord Professeur</h1>
          <p>Bienvenue ! Vous êtes connecté en tant que professeur.</p>
        </div>
        <div className="actions">
          <button className="secondary" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </div>

      <section className="card" style={{ marginTop: "2rem" }}>
        <h2>Classes</h2>
        <p>Créez une classe puis ajoutez vos élèves.</p>
        <form className="actions" onSubmit={handleCreateClass}>
          <input
            type="text"
            placeholder="Nom de la classe"
            value={newClassName}
            onChange={(event) => setNewClassName(event.target.value)}
          />
          <button type="submit">Créer la classe</button>
        </form>

        {classrooms.length === 0 ? (
          <p>Aucune classe créée pour le moment.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <h3>Liste des classes</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {classrooms.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={
                      entry.id === selectedClassId ? "primary" : "secondary"
                    }
                    onClick={() => setSelectedClassId(entry.id)}
                  >
                    {entry.name} ({entry.students.length})
                  </button>
                ))}
              </div>
            </div>

            {selectedClassroom ? (
              <div>
                <h3>Élèves de {selectedClassroom.name}</h3>
                <form className="actions" onSubmit={handleAddStudent}>
                  <input
                    type="text"
                    placeholder="Pseudo de l'élève"
                    value={studentPseudo}
                    onChange={(event) => setStudentPseudo(event.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Prénom (optionnel)"
                    value={studentFirstName}
                    onChange={(event) => setStudentFirstName(event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nom (optionnel)"
                    value={studentLastName}
                    onChange={(event) => setStudentLastName(event.target.value)}
                  />
                  <button type="submit">Ajouter l'élève</button>
                </form>

                {selectedClassroom.students.length === 0 ? (
                  <p>Aucun élève ajouté pour le moment.</p>
                ) : (
                  <ul style={{ marginTop: "1rem", paddingLeft: "1.5rem" }}>
                    {selectedClassroom.students.map((student) => (
                      <li key={student.id}>
                        <strong>{student.pseudo}</strong>
                        {student.firstName || student.lastName
                          ? ` — ${[student.firstName, student.lastName]
                              .filter(Boolean)
                              .join(" ")}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </RoleGuard>
  );
}

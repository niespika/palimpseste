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
import type { Parcours } from "@/lib/parcours";
import {
  createParcours,
  persistParcours,
  readParcours,
} from "@/lib/parcours";

export default function TeacherDashboard() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [studentPseudo, setStudentPseudo] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [selectedParcoursId, setSelectedParcoursId] = useState<string | null>(
    null
  );
  const [parcoursTitle, setParcoursTitle] = useState("");
  const [parcoursDescription, setParcoursDescription] = useState("");
  const [parcoursLevel, setParcoursLevel] = useState<"A" | "B">("A");
  const [parcoursChaptersCount, setParcoursChaptersCount] = useState("1");
  const [isParcoursReady, setIsParcoursReady] = useState(false);

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

  useEffect(() => {
    const stored = readParcours();
    setParcoursList(stored);
    if (stored.length > 0) {
      setSelectedParcoursId(stored[0].id);
    }
    setIsParcoursReady(true);
  }, []);

  useEffect(() => {
    if (!isParcoursReady) return;
    persistParcours(parcoursList);
  }, [isParcoursReady, parcoursList]);

  const selectedClassroom = useMemo(
    () => classrooms.find((entry) => entry.id === selectedClassId) || null,
    [classrooms, selectedClassId]
  );

  const selectedParcours = useMemo(
    () => parcoursList.find((entry) => entry.id === selectedParcoursId) || null,
    [parcoursList, selectedParcoursId]
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

  const handleCreateParcours = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = parcoursTitle.trim();
    const parsedCount = Number.parseInt(parcoursChaptersCount, 10);
    if (!trimmedTitle || Number.isNaN(parsedCount) || parsedCount <= 0) return;
    const parcours = createParcours({
      title: trimmedTitle,
      description: parcoursDescription,
      level: parcoursLevel,
      chaptersCount: parsedCount,
    });
    setParcoursList((prev) => [...prev, parcours]);
    setSelectedParcoursId(parcours.id);
    setParcoursTitle("");
    setParcoursDescription("");
    setParcoursLevel("A");
    setParcoursChaptersCount("1");
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

      <section className="card" style={{ marginTop: "2rem" }}>
        <h2>Parcours</h2>
        <p>Créez et consultez vos parcours pédagogiques.</p>
        <form className="actions" onSubmit={handleCreateParcours}>
          <input
            type="text"
            placeholder="Titre du parcours"
            value={parcoursTitle}
            onChange={(event) => setParcoursTitle(event.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description courte (optionnelle)"
            value={parcoursDescription}
            onChange={(event) => setParcoursDescription(event.target.value)}
          />
          <select
            value={parcoursLevel}
            onChange={(event) =>
              setParcoursLevel(event.target.value === "B" ? "B" : "A")
            }
          >
            <option value="A">Niveau A</option>
            <option value="B">Niveau B</option>
          </select>
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Nombre de chapitres"
            value={parcoursChaptersCount}
            onChange={(event) => setParcoursChaptersCount(event.target.value)}
            required
          />
          <button type="submit">Créer le parcours</button>
        </form>

        {parcoursList.length === 0 ? (
          <p>Aucun parcours créé pour le moment.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <h3>Liste des parcours</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {parcoursList.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={
                      entry.id === selectedParcoursId ? "primary" : "secondary"
                    }
                    onClick={() => setSelectedParcoursId(entry.id)}
                  >
                    {entry.title}
                  </button>
                ))}
              </div>
            </div>

            {selectedParcours ? (
              <div>
                <h3>Détails du parcours</h3>
                <p>
                  <strong>Titre :</strong> {selectedParcours.title}
                </p>
                <p>
                  <strong>Description :</strong>{" "}
                  {selectedParcours.description ||
                    "Aucune description renseignée."}
                </p>
                <p>
                  <strong>Niveau :</strong> {selectedParcours.level}
                </p>
                <p>
                  <strong>Chapitres :</strong>{" "}
                  {selectedParcours.chaptersCount}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </RoleGuard>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import type { ChapterStatus, Parcours } from "@/lib/parcours";
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
  const [isDocumentUploading, setIsDocumentUploading] = useState(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

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

  const updateParcours = (
    parcoursId: string,
    updater: (parcours: Parcours) => Parcours
  ) => {
    setParcoursList((prev) =>
      prev.map((entry) =>
        entry.id === parcoursId ? updater(entry) : entry
      )
    );
  };

  const handleUpdateChapter = (
    parcoursId: string,
    chapterId: string,
    updates: Partial<{ title: string; objectives: string; status: ChapterStatus }>
  ) => {
    updateParcours(parcoursId, (parcours) => ({
      ...parcours,
      chapters: parcours.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, ...updates } : chapter
      ),
    }));
  };

  const handleMoveChapter = (
    parcoursId: string,
    chapterId: string,
    direction: "up" | "down"
  ) => {
    updateParcours(parcoursId, (parcours) => {
      const ordered = [...parcours.chapters].sort(
        (a, b) => a.index - b.index
      );
      const currentIndex = ordered.findIndex(
        (chapter) => chapter.id === chapterId
      );
      if (currentIndex === -1) return parcours;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) return parcours;
      const swapped = [...ordered];
      [swapped[currentIndex], swapped[targetIndex]] = [
        swapped[targetIndex],
        swapped[currentIndex],
      ];
      const reindexed = swapped.map((chapter, index) => ({
        ...chapter,
        index: index + 1,
      }));
      return {
        ...parcours,
        chapters: reindexed,
      };
    });
  };

  const extractPdfText = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const raw = new TextDecoder("latin1").decode(new Uint8Array(buffer));
    const matches = raw.matchAll(/\(([^()]*)\)/g);
    const extracted: string[] = [];
    for (const match of matches) {
      const chunk = match[1];
      if (!chunk) continue;
      extracted.push(
        chunk
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\b/g, "\b")
          .replace(/\\f/g, "\f")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\")
      );
    }
    return extracted.join(" ").replace(/\s+/g, " ").trim();
  };

  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    const currentParcours = selectedParcours;
    if (!file || !currentParcours) {
      event.target.value = "";
      return;
    }

    if (
      currentParcours.document &&
      !window.confirm(
        "Un document est déjà associé à ce parcours. Voulez-vous le remplacer ?"
      )
    ) {
      event.target.value = "";
      return;
    }

    const fileName = file.name;
    const fileExtension = fileName.toLowerCase();
    const isPdf =
      file.type === "application/pdf" || fileExtension.endsWith(".pdf");
    const isText =
      file.type.startsWith("text/") ||
      fileExtension.endsWith(".txt") ||
      fileExtension.endsWith(".md");

    if (!isPdf && !isText) {
      updateParcours(currentParcours.id, (parcours) => ({
        ...parcours,
        document: {
          fileName,
          uploadedAt: new Date().toISOString(),
          status: "failed",
          content: "",
          error: "Format non pris en charge. Utilisez un PDF ou un fichier texte.",
        },
      }));
      event.target.value = "";
      return;
    }

    setIsDocumentUploading(true);
    const uploadedAt = new Date().toISOString();
    updateParcours(currentParcours.id, (parcours) => ({
      ...parcours,
      document: {
        fileName,
        uploadedAt,
        status: "pending",
        content: "",
      },
    }));

    try {
      let content = "";
      if (isPdf) {
        content = await extractPdfText(file);
      } else {
        content = await file.text();
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        throw new Error(
          "Le document ne contient pas de texte exploitable après extraction."
        );
      }

      updateParcours(currentParcours.id, (parcours) => ({
        ...parcours,
        document: {
          fileName,
          uploadedAt,
          status: "processed",
          content: trimmedContent,
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue lors de l'extraction.";
      updateParcours(currentParcours.id, (parcours) => ({
        ...parcours,
        document: {
          fileName,
          uploadedAt,
          status: "failed",
          content: "",
          error: message,
        },
      }));
    } finally {
      setIsDocumentUploading(false);
      event.target.value = "";
    }
  };

  const formatUploadDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("fr-FR");
  };

  const documentStatusLabel = (status: "pending" | "processed" | "failed") => {
    switch (status) {
      case "processed":
        return "Traitement terminé";
      case "failed":
        return "Erreur d'ingestion";
      default:
        return "En attente de traitement";
    }
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
                <div
                  style={{
                    border: "1px solid #e3e3e3",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    display: "grid",
                    gap: "0.75rem",
                    marginTop: "1rem",
                  }}
                >
                  <h4>Document de cours</h4>
                  {selectedParcours.document ? (
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      <p>
                        <strong>Nom :</strong> {selectedParcours.document.fileName}
                      </p>
                      <p>
                        <strong>Date d'upload :</strong>{" "}
                        {formatUploadDate(selectedParcours.document.uploadedAt)}
                      </p>
                      <p>
                        <strong>Statut :</strong>{" "}
                        {documentStatusLabel(selectedParcours.document.status)}
                      </p>
                      {selectedParcours.document.status === "failed" &&
                      selectedParcours.document.error ? (
                        <p style={{ color: "#c0392b" }}>
                          <strong>Erreur :</strong>{" "}
                          {selectedParcours.document.error}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p>Aucun document importé pour ce parcours.</p>
                  )}
                  <div className="actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={isDocumentUploading}
                    >
                      {selectedParcours.document ? "Remplacer le document" : "Uploader un document"}
                    </button>
                    {isDocumentUploading ? (
                      <span>Import en cours…</span>
                    ) : null}
                  </div>
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,text/plain,application/pdf"
                    onChange={handleDocumentUpload}
                    style={{ display: "none" }}
                  />
                </div>
                <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
                  <h4>Chapitres</h4>
                  {selectedParcours.chapters
                    .slice()
                    .sort((a, b) => a.index - b.index)
                    .map((chapter, chapterIndex, chapters) => (
                      <div
                        key={chapter.id}
                        style={{
                          border: "1px solid #e3e3e3",
                          borderRadius: "0.75rem",
                          padding: "1rem",
                          display: "grid",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "1rem",
                          }}
                        >
                          <strong>Chapitre {chapter.index}</strong>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                            }}
                          >
                            <button
                              type="button"
                              className="secondary"
                              onClick={() =>
                                handleMoveChapter(
                                  selectedParcours.id,
                                  chapter.id,
                                  "up"
                                )
                              }
                              disabled={chapterIndex === 0}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() =>
                                handleMoveChapter(
                                  selectedParcours.id,
                                  chapter.id,
                                  "down"
                                )
                              }
                              disabled={chapterIndex === chapters.length - 1}
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                        <label style={{ display: "grid", gap: "0.5rem" }}>
                          <span>Titre</span>
                          <input
                            type="text"
                            value={chapter.title}
                            onChange={(event) =>
                              handleUpdateChapter(
                                selectedParcours.id,
                                chapter.id,
                                { title: event.target.value }
                              )
                            }
                          />
                        </label>
                        <label style={{ display: "grid", gap: "0.5rem" }}>
                          <span>Objectifs</span>
                          <textarea
                            rows={3}
                            value={chapter.objectives}
                            onChange={(event) =>
                              handleUpdateChapter(
                                selectedParcours.id,
                                chapter.id,
                                { objectives: event.target.value }
                              )
                            }
                          />
                        </label>
                        <label style={{ display: "grid", gap: "0.5rem" }}>
                          <span>Statut</span>
                          <select
                            value={chapter.status}
                            onChange={(event) =>
                              handleUpdateChapter(
                                selectedParcours.id,
                                chapter.id,
                                {
                                  status:
                                    event.target.value === "validated"
                                      ? "validated"
                                      : "draft",
                                }
                              )
                            }
                          >
                            <option value="draft">Brouillon</option>
                            <option value="validated">Validé</option>
                          </select>
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </RoleGuard>
  );
}

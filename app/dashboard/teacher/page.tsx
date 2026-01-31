"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { createParcours, persistParcours, readParcours } from "@/lib/parcours";
import type { Resource } from "@/lib/resources";
import {
  createImageResource,
  createTextResource,
  persistResources,
  readResources,
} from "@/lib/resources";

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
  const [parcoursTitle, setParcoursTitle] = useState("");
  const [parcoursDescription, setParcoursDescription] = useState("");
  const [parcoursLevel, setParcoursLevel] = useState<"A" | "B">("A");
  const [parcoursChaptersCount, setParcoursChaptersCount] = useState("1");
  const [isParcoursReady, setIsParcoursReady] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isResourcesReady, setIsResourcesReady] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textSource, setTextSource] = useState("");
  const [textTags, setTextTags] = useState("");
  const [imageTitle, setImageTitle] = useState("");
  const [imageSource, setImageSource] = useState("");
  const [imageTags, setImageTags] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<
    "all" | "text" | "image"
  >("all");
  const [resourceTagFilter, setResourceTagFilter] = useState("all");
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null
  );

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
    setIsParcoursReady(true);
  }, []);

  useEffect(() => {
    if (!isParcoursReady) return;
    persistParcours(parcoursList);
  }, [isParcoursReady, parcoursList]);

  useEffect(() => {
    const stored = readResources();
    setResources(stored);
    setIsResourcesReady(true);
  }, []);

  useEffect(() => {
    if (!isResourcesReady) return;
    persistResources(resources);
  }, [isResourcesReady, resources]);

  const selectedClassroom = useMemo(
    () => classrooms.find((entry) => entry.id === selectedClassId) || null,
    [classrooms, selectedClassId]
  );

  const selectedResource = useMemo(
    () => resources.find((entry) => entry.id === selectedResourceId) || null,
    [resources, selectedResourceId]
  );

  const availableTags = useMemo(() => {
    const unique = new Set<string>();
    resources.forEach((resource) => {
      resource.tags.forEach((tag) => unique.add(tag));
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [resources]);

  const filteredResources = useMemo(() => {
    let list = resources;
    if (resourceTypeFilter !== "all") {
      list = list.filter((resource) => resource.type === resourceTypeFilter);
    }
    if (resourceTagFilter !== "all") {
      list = list.filter((resource) =>
        resource.tags.includes(resourceTagFilter)
      );
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [resourceTagFilter, resourceTypeFilter, resources]);

  useEffect(() => {
    if (
      resourceTagFilter !== "all" &&
      !availableTags.includes(resourceTagFilter)
    ) {
      setResourceTagFilter("all");
    }
  }, [availableTags, resourceTagFilter]);

  useEffect(() => {
    if (
      selectedResourceId &&
      !resources.some((entry) => entry.id === selectedResourceId)
    ) {
      setSelectedResourceId(null);
    }
  }, [resources, selectedResourceId]);

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

  const parseTags = (value: string) =>
    Array.from(
      new Set(
        value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    );

  const handleCreateTextResource = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const trimmedTitle = textTitle.trim();
    if (!trimmedTitle) return;
    const resource = createTextResource({
      title: trimmedTitle,
      content: textContent,
      source: textSource,
      tags: parseTags(textTags),
    });
    setResources((prev) => [resource, ...prev]);
    setTextTitle("");
    setTextContent("");
    setTextSource("");
    setTextTags("");
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageDataUrl("");
      setImageFileName("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    setImageFileName(file.name);
  };

  const handleCreateImageResource = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const trimmedTitle = imageTitle.trim();
    if (!trimmedTitle || !imageDataUrl) return;
    const resource = createImageResource({
      title: trimmedTitle,
      imageDataUrl,
      imageFileName,
      source: imageSource,
      tags: parseTags(imageTags),
    });
    setResources((prev) => [resource, ...prev]);
    setImageTitle("");
    setImageSource("");
    setImageTags("");
    setImageDataUrl("");
    setImageFileName("");
    setImageInputKey((prev) => prev + 1);
  };

  const handleDeleteResource = (resource: Resource) => {
    const confirmed = window.confirm(
      `Supprimer la ressource “${resource.title}” ?`
    );
    if (!confirmed) return;
    setResources((prev) => prev.filter((entry) => entry.id !== resource.id));
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const renderSource = (source?: string) => {
    if (!source) return null;
    const isUrl = /^https?:\/\//i.test(source.trim());
    if (isUrl) {
      return (
        <a href={source} target="_blank" rel="noreferrer">
          {source}
        </a>
      );
    }
    return <span>{source}</span>;
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
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {parcoursList.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: "1px solid #e3e3e3",
                      borderRadius: "0.75rem",
                      padding: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <strong>{entry.title}</strong>
                      <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
                        Niveau {entry.level} · {entry.chaptersCount} chapitres
                      </p>
                    </div>
                    <Link
                      className="secondary"
                      href={`/dashboard/teacher/tracks/${entry.id}`}
                    >
                      Ouvrir
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: "2rem" }}>
        <h2>Ressources</h2>
        <p>Ajoutez des ressources documentaires indépendantes des parcours.</p>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          <div>
            <h3>Créer une ressource texte</h3>
            <form className="actions" onSubmit={handleCreateTextResource}>
              <input
                type="text"
                placeholder="Titre (obligatoire)"
                value={textTitle}
                onChange={(event) => setTextTitle(event.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Source (optionnelle)"
                value={textSource}
                onChange={(event) => setTextSource(event.target.value)}
              />
              <input
                type="text"
                placeholder="Tags (séparés par des virgules)"
                value={textTags}
                onChange={(event) => setTextTags(event.target.value)}
              />
              <textarea
                placeholder="Contenu"
                value={textContent}
                onChange={(event) => setTextContent(event.target.value)}
                rows={4}
              />
              <button type="submit">Créer la ressource texte</button>
            </form>
          </div>

          <div>
            <h3>Créer une ressource image</h3>
            <form className="actions" onSubmit={handleCreateImageResource}>
              <input
                type="text"
                placeholder="Titre (obligatoire)"
                value={imageTitle}
                onChange={(event) => setImageTitle(event.target.value)}
                required
              />
              <input
                key={imageInputKey}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                required
              />
              <input
                type="text"
                placeholder="Source (optionnelle)"
                value={imageSource}
                onChange={(event) => setImageSource(event.target.value)}
              />
              <input
                type="text"
                placeholder="Tags (séparés par des virgules)"
                value={imageTags}
                onChange={(event) => setImageTags(event.target.value)}
              />
              {imageDataUrl ? (
                <div>
                  <p style={{ margin: 0 }}>Aperçu :</p>
                  <img
                    src={imageDataUrl}
                    alt="Aperçu"
                    style={{ maxWidth: "220px", marginTop: "0.5rem" }}
                  />
                </div>
              ) : null}
              <button type="submit" disabled={!imageDataUrl}>
                Créer la ressource image
              </button>
            </form>
          </div>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h3>Liste des ressources</h3>
          <div className="actions" style={{ flexWrap: "wrap" }}>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span>Type</span>
              <select
                value={resourceTypeFilter}
                onChange={(event) =>
                  setResourceTypeFilter(
                    event.target.value === "text" ||
                      event.target.value === "image"
                      ? event.target.value
                      : "all"
                  )
                }
              >
                <option value="all">Tous</option>
                <option value="text">Texte</option>
                <option value="image">Image</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span>Tag</span>
              <select
                value={resourceTagFilter}
                onChange={(event) => setResourceTagFilter(event.target.value)}
              >
                <option value="all">Tous</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredResources.length === 0 ? (
            <p>Aucune ressource trouvée.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  style={{
                    border: "1px solid #e3e3e3",
                    borderRadius: "0.75rem",
                    padding: "0.75rem",
                    display: "grid",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <strong>{resource.title}</strong>
                      <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
                        {resource.type === "text" ? "Texte" : "Image"} ·{" "}
                        {formatDate(resource.createdAt)}
                      </p>
                    </div>
                    <div className="actions" style={{ gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          setSelectedResourceId((prev) =>
                            prev === resource.id ? null : resource.id
                          )
                        }
                      >
                        {selectedResourceId === resource.id
                          ? "Masquer"
                          : "Voir détail"}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleDeleteResource(resource)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {resource.tags.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {resource.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: "#f2f2f2",
                            borderRadius: "999px",
                            padding: "0.15rem 0.6rem",
                            fontSize: "0.85rem",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {selectedResource ? (
            <div
              style={{
                marginTop: "1.5rem",
                borderTop: "1px solid #e3e3e3",
                paddingTop: "1rem",
                display: "grid",
                gap: "0.75rem",
              }}
            >
              <h4>Détail de la ressource</h4>
              <div>
                <strong>{selectedResource.title}</strong>
                <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
                  {selectedResource.type === "text" ? "Texte" : "Image"} ·{" "}
                  {formatDate(selectedResource.createdAt)}
                </p>
              </div>
              {selectedResource.source ? (
                <p>
                  <strong>Source :</strong> {renderSource(selectedResource.source)}
                </p>
              ) : null}
              {selectedResource.type === "text" ? (
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {selectedResource.content || "Aucun contenu."}
                </p>
              ) : (
                <div>
                  <img
                    src={selectedResource.imageDataUrl}
                    alt={selectedResource.title}
                    style={{ maxWidth: "100%", borderRadius: "0.5rem" }}
                  />
                  {selectedResource.imageFileName ? (
                    <p style={{ marginTop: "0.5rem", color: "#666" }}>
                      Fichier : {selectedResource.imageFileName}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </RoleGuard>
  );
}

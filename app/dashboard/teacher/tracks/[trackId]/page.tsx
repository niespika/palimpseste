"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RoleGuard from "@/app/components/RoleGuard";
import type { ChapterStatus, Parcours } from "@/lib/parcours";
import { persistParcours, readParcours } from "@/lib/parcours";

export default function TeacherTrackDetailPage() {
  const params = useParams<{ trackId: string }>();
  const trackId = params?.trackId;
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isDocumentUploading, setIsDocumentUploading] = useState(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = readParcours();
    setParcoursList(stored);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    persistParcours(parcoursList);
  }, [isReady, parcoursList]);

  const selectedParcours = useMemo(
    () => parcoursList.find((entry) => entry.id === trackId) || null,
    [parcoursList, trackId]
  );

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
    if (!file || !selectedParcours) {
      event.target.value = "";
      return;
    }

    if (
      selectedParcours.document &&
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
      updateParcours(selectedParcours.id, (parcours) => ({
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
    updateParcours(selectedParcours.id, (parcours) => ({
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

      updateParcours(selectedParcours.id, (parcours) => ({
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
      updateParcours(selectedParcours.id, (parcours) => ({
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
          <h1>Détail du parcours</h1>
          <p>Consultez et enrichissez votre parcours pédagogique.</p>
        </div>
        <div className="actions">
          <Link className="secondary" href="/dashboard/teacher">
            Retour au tableau de bord
          </Link>
        </div>
      </div>

      {!selectedParcours ? (
        <section className="card" style={{ marginTop: "2rem" }}>
          <h2>Parcours introuvable</h2>
          <p>
            Ce parcours n'existe pas ou a été supprimé. Retournez au tableau de
            bord pour sélectionner un autre parcours.
          </p>
        </section>
      ) : (
        <section className="card" style={{ marginTop: "2rem" }}>
          <h2>{selectedParcours.title}</h2>
          <p>
            <strong>Niveau :</strong> {selectedParcours.level}
          </p>
          <p>
            <strong>Chapitres :</strong> {selectedParcours.chaptersCount}
          </p>

          <div
            style={{
              border: "1px solid #e3e3e3",
              borderRadius: "0.75rem",
              padding: "1rem",
              display: "grid",
              gap: "0.75rem",
              marginTop: "1.5rem",
            }}
          >
            <h3>Document de cours</h3>
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
                    <strong>Erreur :</strong> {selectedParcours.document.error}
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
                {selectedParcours.document
                  ? "Remplacer le document"
                  : "Uploader un document"}
              </button>
              {isDocumentUploading ? <span>Import en cours…</span> : null}
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
            <h3>Chapitres</h3>
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
                    <div style={{ display: "flex", gap: "0.5rem" }}>
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
                        handleUpdateChapter(selectedParcours.id, chapter.id, {
                          title: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.5rem" }}>
                    <span>Objectifs</span>
                    <textarea
                      rows={3}
                      value={chapter.objectives}
                      onChange={(event) =>
                        handleUpdateChapter(selectedParcours.id, chapter.id, {
                          objectives: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.5rem" }}>
                    <span>Statut</span>
                    <select
                      value={chapter.status}
                      onChange={(event) =>
                        handleUpdateChapter(selectedParcours.id, chapter.id, {
                          status:
                            event.target.value === "validated"
                              ? "validated"
                              : "draft",
                        })
                      }
                    >
                      <option value="draft">Brouillon</option>
                      <option value="validated">Validé</option>
                    </select>
                  </label>
                </div>
              ))}
          </div>
        </section>
      )}
    </RoleGuard>
  );
}

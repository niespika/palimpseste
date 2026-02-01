"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RoleGuard from "@/app/components/RoleGuard";
import type { ChapterStatus, Parcours } from "@/lib/parcours";
import { persistParcours, readParcours } from "@/lib/parcours";
import type { Passage } from "@/lib/passages";
import { generatePassagesFromText, hashText } from "@/lib/passages";

export default function TeacherTrackDetailPage() {
  const params = useParams<{ trackId: string }>();
  const trackId = params?.trackId;
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isDocumentUploading, setIsDocumentUploading] = useState(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const [passagePage, setPassagePage] = useState(1);
  const passagesPerPage = 20;

  useEffect(() => {
    const stored = readParcours();
    setParcoursList(stored);
    setIsReady(true);
  }, []);

  const selectedParcours = useMemo(
    () => parcoursList.find((entry) => entry.id === trackId) || null,
    [parcoursList, trackId]
  );

  useEffect(() => {
    setPassagePage(1);
  }, [selectedParcours?.id]);

  useEffect(() => {
    if (!isReady) return;
    persistParcours(parcoursList);
  }, [isReady, parcoursList]);

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
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/document/extract", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Extraction PDF échouée");
    }
    const data = (await response.json()) as { text?: string };
    if (!data?.text || typeof data.text !== "string") {
      throw new Error("Extraction PDF échouée");
    }
    return data.text;
  };

  const hasTooManyNonPrintableChars = (text: string) => {
    if (!text) return true;
    let nonPrintable = 0;
    let total = 0;
    for (const char of text) {
      total += 1;
      if (char === "\n" || char === "\r" || char === "\t") continue;
      const code = char.charCodeAt(0);
      if (code < 32 || code === 127) {
        nonPrintable += 1;
      }
    }
    if (total === 0) return true;
    return nonPrintable / total > 0.2;
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
          rawText: "",
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
        rawText: "",
      },
    }));

    try {
      let content = "";
      if (isPdf) {
        content = await extractPdfText(file);
        if (hasTooManyNonPrintableChars(content)) {
          throw new Error("Extraction PDF échouée");
        }
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
          rawText: trimmedContent,
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
          rawText: "",
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

  const passages = useMemo(
    () =>
      selectedParcours?.passages
        ? [...selectedParcours.passages].sort((a, b) => a.index - b.index)
        : [],
    [selectedParcours?.passages]
  );

  const passageTotalPages = Math.max(
    1,
    Math.ceil(passages.length / passagesPerPage)
  );
  const passageStartIndex = (passagePage - 1) * passagesPerPage;
  const passagePageItems = passages.slice(
    passageStartIndex,
    passageStartIndex + passagesPerPage
  );

  useEffect(() => {
    setPassagePage((prev) =>
      Math.min(Math.max(1, prev), passageTotalPages)
    );
  }, [passageTotalPages]);

  const handleGeneratePassages = () => {
    if (!selectedParcours?.document?.rawText) return;
    if (passages.length > 0) {
      const hasManual = passages.some((passage) => passage.isManual);
      const message = hasManual
        ? "Des passages ont été modifiés manuellement. Regénérer les passages écrasera ces modifications. Voulez-vous continuer ?"
        : "Des passages existent déjà. Voulez-vous les regénérer ?";
      if (!window.confirm(message)) {
        return;
      }
    }
    const generated = generatePassagesFromText(
      selectedParcours.document.rawText,
      selectedParcours.id
    );
    updateParcours(selectedParcours.id, (parcours) => ({
      ...parcours,
      passages: generated,
    }));
    setPassagePage(1);
  };

  const formatPassageSnippet = (text: string) => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (cleaned.length <= 120) return cleaned;
    return `${cleaned.slice(0, 120)}…`;
  };

  const reindexPassages = (items: Passage[], updatedAt: string) =>
    items.map((passage, index) => {
      const nextIndex = index + 1;
      if (passage.index === nextIndex) {
        return passage;
      }
      return {
        ...passage,
        index: nextIndex,
        updatedAt,
      };
    });

  const handleMergePassage = (passageId: string) => {
    if (!selectedParcours) return;
    updateParcours(selectedParcours.id, (parcours) => {
      const ordered = (parcours.passages ?? [])
        .slice()
        .sort((a, b) => a.index - b.index);
      const currentIndex = ordered.findIndex(
        (passage) => passage.id === passageId
      );
      if (currentIndex === -1 || currentIndex === ordered.length - 1) {
        return parcours;
      }
      const current = ordered[currentIndex];
      const next = ordered[currentIndex + 1];
      const mergedText = `${current.text}\n\n${next.text}`.trim();
      const updatedAt = new Date().toISOString();
      const merged: Passage = {
        ...current,
        text: mergedText,
        hash: hashText(mergedText),
        isManual: true,
        charStart: null,
        charEnd: null,
        updatedAt,
      };
      const updated = [
        ...ordered.slice(0, currentIndex),
        merged,
        ...ordered.slice(currentIndex + 2),
      ];
      return {
        ...parcours,
        passages: reindexPassages(updated, updatedAt),
      };
    });
  };

  const handleMovePassage = (passageId: string, direction: "up" | "down") => {
    if (!selectedParcours) return;
    updateParcours(selectedParcours.id, (parcours) => {
      const ordered = (parcours.passages ?? [])
        .slice()
        .sort((a, b) => a.index - b.index);
      const currentIndex = ordered.findIndex(
        (passage) => passage.id === passageId
      );
      if (currentIndex === -1) return parcours;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) return parcours;
      const swapped = [...ordered];
      [swapped[currentIndex], swapped[targetIndex]] = [
        swapped[targetIndex],
        swapped[currentIndex],
      ];
      const updatedAt = new Date().toISOString();
      return {
        ...parcours,
        passages: reindexPassages(swapped, updatedAt).map((passage) =>
          passage.id === passageId ||
          passage.id === ordered[targetIndex]?.id
            ? { ...passage, updatedAt }
            : passage
        ),
      };
    });
  };

  const handleDeletePassage = (passageId: string) => {
    if (!selectedParcours) return;
    if (!window.confirm("Supprimer ce passage ?")) return;
    updateParcours(selectedParcours.id, (parcours) => {
      const ordered = (parcours.passages ?? [])
        .slice()
        .sort((a, b) => a.index - b.index);
      const updated = ordered.filter((passage) => passage.id !== passageId);
      const updatedAt = new Date().toISOString();
      return {
        ...parcours,
        passages: reindexPassages(updated, updatedAt),
      };
    });
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
              accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
              onChange={handleDocumentUpload}
              style={{ display: "none" }}
            />
          </div>

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
            <h3>Passages</h3>
            {selectedParcours.document?.status === "processed" ? (
              <p>
                {passages.length > 0
                  ? `${passages.length} passages générés.`
                  : "Aucun passage généré pour le moment."}
              </p>
            ) : (
              <p>
                {selectedParcours.document
                  ? "Le document doit être traité avant de générer les passages."
                  : "Aucun document disponible pour générer des passages."}
              </p>
            )}
            <div className="actions">
              <button
                type="button"
                className="secondary"
                onClick={handleGeneratePassages}
                disabled={selectedParcours.document?.status !== "processed"}
              >
                {passages.length > 0
                  ? "Regénérer les passages"
                  : "Générer les passages"}
              </button>
            </div>

            {passages.length > 0 ? (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    Page {passagePage} / {passageTotalPages}
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setPassagePage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={passagePage === 1}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setPassagePage((prev) =>
                          Math.min(passageTotalPages, prev + 1)
                        )
                      }
                      disabled={passagePage === passageTotalPages}
                    >
                      →
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {passagePageItems.map((passage, pageIndex) => {
                    const absoluteIndex = passageStartIndex + pageIndex;
                    const hasPrevious = absoluteIndex > 0;
                    const hasNext = absoluteIndex < passages.length - 1;
                    return (
                      <div
                        key={passage.id}
                        style={{
                          border: "1px solid #e3e3e3",
                          borderRadius: "0.75rem",
                          padding: "0.75rem",
                          display: "grid",
                          gap: "0.5rem",
                        }}
                      >
                        <strong>Passage {passage.index}</strong>
                        <p style={{ margin: 0 }}>
                          {formatPassageSnippet(passage.text)}
                        </p>
                        <div
                          className="actions"
                          style={{ flexWrap: "wrap" }}
                        >
                          <Link
                            className="secondary"
                            href={`/dashboard/teacher/tracks/${selectedParcours.id}/passages/${passage.id}`}
                          >
                            Voir / Éditer
                          </Link>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleMergePassage(passage.id)}
                            disabled={!hasNext}
                          >
                            Fusionner avec le suivant
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              handleMovePassage(passage.id, "up")
                            }
                            disabled={!hasPrevious}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              handleMovePassage(passage.id, "down")
                            }
                            disabled={!hasNext}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleDeletePassage(passage.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RoleGuard from "@/app/components/RoleGuard";
import type { Parcours } from "@/lib/parcours";
import { persistParcours, readParcours } from "@/lib/parcours";
import type { Passage } from "@/lib/passages";
import { createPassageId, hashText } from "@/lib/passages";

export default function TeacherPassageDetailPage() {
  const params = useParams<{ trackId: string; passageId: string }>();
  const trackId = params?.trackId;
  const passageId = params?.passageId;
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [editText, setEditText] = useState("");
  const [splitIndex, setSplitIndex] = useState("");
  const [splitError, setSplitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setParcoursList(readParcours());
  }, []);

  useEffect(() => {
    if (!parcoursList.length) return;
    persistParcours(parcoursList);
  }, [parcoursList]);

  const selectedParcours = useMemo(
    () => parcoursList.find((entry) => entry.id === trackId) || null,
    [parcoursList, trackId]
  );

  const selectedPassage = useMemo(() => {
    if (!selectedParcours?.passages) return null;
    return (
      selectedParcours.passages.find((passage) => passage.id === passageId) ||
      null
    );
  }, [selectedParcours, passageId]);

  useEffect(() => {
    if (!selectedPassage) return;
    setEditText(selectedPassage.text);
  }, [selectedPassage?.id, selectedPassage?.text]);

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

  const updatePassages = (updater: (passages: Passage[]) => Passage[]) => {
    if (!trackId) return;
    setParcoursList((prev) =>
      prev.map((parcours) => {
        if (parcours.id !== trackId) return parcours;
        const passages = parcours.passages ?? [];
        return {
          ...parcours,
          passages: updater(passages),
        };
      })
    );
  };

  const handleSave = () => {
    if (!selectedPassage || !trackId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    const updatedAt = new Date().toISOString();
    updatePassages((passages) =>
      passages.map((passage) =>
        passage.id === selectedPassage.id
          ? {
              ...passage,
              text: trimmed,
              hash: hashText(trimmed),
              isManual: true,
              charStart: null,
              charEnd: null,
              updatedAt,
            }
          : passage
      )
    );
    setEditText(trimmed);
  };

  const resolveSplitIndex = () => {
    if (splitIndex.trim()) {
      return Number(splitIndex);
    }
    return textareaRef.current?.selectionStart ?? null;
  };

  const handleSplit = () => {
    if (!selectedPassage || !trackId) return;
    const resolved = resolveSplitIndex();
    if (!Number.isFinite(resolved)) {
      setSplitError("Indiquez une position de coupe valide.");
      return;
    }
    const cutIndex = Number(resolved);
    if (cutIndex <= 0 || cutIndex >= editText.length) {
      setSplitError(
        "La position de coupe doit être comprise entre le début et la fin du passage."
      );
      return;
    }
    const firstText = editText.slice(0, cutIndex).trim();
    const secondText = editText.slice(cutIndex).trim();
    if (!firstText || !secondText) {
      setSplitError("La coupe ne peut pas créer de passage vide.");
      return;
    }
    const updatedAt = new Date().toISOString();
    const makePassage = (text: string): Passage => {
      const hash = hashText(text);
      return {
        id: createPassageId(trackId),
        trackId,
        index: 0,
        text,
        charStart: null,
        charEnd: null,
        hash,
        createdAt: updatedAt,
        updatedAt,
        isManual: true,
      };
    };
    updatePassages((passages) => {
      const ordered = passages.slice().sort((a, b) => a.index - b.index);
      const currentIndex = ordered.findIndex(
        (passage) => passage.id === selectedPassage.id
      );
      if (currentIndex === -1) return passages;
      const current = ordered[currentIndex];
      const updatedCurrent: Passage = {
        ...current,
        text: firstText,
        hash: hashText(firstText),
        isManual: true,
        charStart: null,
        charEnd: null,
        updatedAt,
      };
      const updated = [
        ...ordered.slice(0, currentIndex),
        updatedCurrent,
        makePassage(secondText),
        ...ordered.slice(currentIndex + 1),
      ];
      return reindexPassages(updated, updatedAt);
    });
    setEditText(firstText);
    setSplitIndex("");
    setSplitError(null);
  };

  const handleUseCursor = () => {
    const cursor = textareaRef.current?.selectionStart;
    if (typeof cursor === "number") {
      setSplitIndex(cursor.toString());
    }
  };

  return (
    <RoleGuard role="teacher">
      <div className="card">
        <div>
          <h1>Passage</h1>
          <p>Lecture détaillée du passage sélectionné.</p>
        </div>
        <div className="actions">
          <Link className="secondary" href="/dashboard/teacher">
            Retour au tableau de bord
          </Link>
          {trackId ? (
            <Link
              className="secondary"
              href={`/dashboard/teacher/tracks/${trackId}`}
            >
              Retour au parcours
            </Link>
          ) : null}
        </div>
      </div>

      {!selectedParcours ? (
        <section className="card" style={{ marginTop: "2rem" }}>
          <h2>Parcours introuvable</h2>
          <p>
            Ce parcours n'existe pas ou a été supprimé. Revenez au tableau de
            bord pour sélectionner un autre parcours.
          </p>
        </section>
      ) : !selectedPassage ? (
        <section className="card" style={{ marginTop: "2rem" }}>
          <h2>Passage introuvable</h2>
          <p>
            Ce passage n'existe pas ou a été supprimé. Revenez au parcours pour
            consulter la liste des passages.
          </p>
        </section>
      ) : (
        <section className="card" style={{ marginTop: "2rem" }}>
          <h2>
            Passage {selectedPassage.index}
            {selectedParcours.title ? ` — ${selectedParcours.title}` : ""}
          </h2>
          <p>
            <strong>Position :</strong>{" "}
            {selectedPassage.charStart === null ||
            selectedPassage.charEnd === null
              ? "Manuelle"
              : `${selectedPassage.charStart}–${selectedPassage.charEnd}`}
          </p>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div
              style={{
                background: "#f8f8f8",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid #e2e2e2",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedPassage.text}
            </div>
            <label style={{ display: "grid", gap: "0.5rem" }}>
              <span>Mode édition</span>
              <textarea
                ref={textareaRef}
                rows={8}
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
              />
            </label>
            <div className="actions">
              <button type="button" className="secondary" onClick={handleSave}>
                Enregistrer
              </button>
            </div>
            <div
              style={{
                border: "1px solid #e3e3e3",
                borderRadius: "0.75rem",
                padding: "1rem",
                display: "grid",
                gap: "0.75rem",
              }}
            >
              <h3>Scission</h3>
              <label style={{ display: "grid", gap: "0.5rem" }}>
                <span>Position de coupe (index caractère)</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, editText.length - 1)}
                  value={splitIndex}
                  onChange={(event) => setSplitIndex(event.target.value)}
                />
              </label>
              <div className="actions" style={{ flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleUseCursor}
                >
                  Utiliser la position du curseur
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleSplit}
                >
                  Scinder
                </button>
              </div>
              {splitError ? (
                <p style={{ color: "#c0392b", margin: 0 }}>{splitError}</p>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </RoleGuard>
  );
}

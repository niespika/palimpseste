"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RoleGuard from "@/app/components/RoleGuard";
import type { Parcours } from "@/lib/parcours";
import { readParcours } from "@/lib/parcours";

export default function TeacherPassageDetailPage() {
  const params = useParams<{ trackId: string; passageId: string }>();
  const trackId = params?.trackId;
  const passageId = params?.passageId;
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);

  useEffect(() => {
    setParcoursList(readParcours());
  }, []);

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
            <strong>Position :</strong> {selectedPassage.charStart}–
            {selectedPassage.charEnd}
          </p>
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
        </section>
      )}
    </RoleGuard>
  );
}

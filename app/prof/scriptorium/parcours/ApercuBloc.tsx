'use client'

import type { ApercuFrise } from './frise-serveur'

// Aperçu des échéances d'une assignation : la liste semaine → date réelle, plus les
// avis qui expliquent une date ramenée, un débordement ou une config de semestres
// incohérente. Extrait d'AssignationClasses au déménagement de la date : le PARCOURS
// DE LA CLASSE le rend désormais aussi, et un seul rendu évite qu'ils divergent.

export function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 2026-09-21 → 21/09
}

export default function ApercuBloc({ apercu }: { apercu: ApercuFrise }) {
  return (
    <div className="mt-2 space-y-1.5">
      {apercu.avisBloquant && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">
          ⚠ Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.
        </p>
      )}
      {apercu.snap && (
        <p className="text-xs text-muet">
          Date ramenée à la semaine d’enseignement du {fmtJour(apercu.snap.dateRamenee)} (la date saisie tombait en vacances / hors semestre).
        </p>
      )}
      {apercu.avis && !apercu.avisBloquant && (
        <p className="text-xs text-muet">{apercu.avis}</p>
      )}
      {apercu.nbNonPlanifiable > 0 && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">
          {apercu.nbNonPlanifiable} semaine(s) non planifiable(s) — au-delà de l’année scolaire. Raccourcis le parcours, retire un décalage, ou définis le semestre suivant.
        </p>
      )}
      {apercu.nbADefinir > 0 && (
        <p className="text-xs bg-attention-teinte text-attention px-2 py-1 rounded">
          {apercu.nbADefinir} semaine(s) « à définir » — semestre de l’année scolaire pas encore créé.
        </p>
      )}
      <div className="max-h-40 overflow-y-auto border border-bordure rounded divide-y divide-bordure">
        {apercu.semaines.map(s => (
          <div key={s.semaine} className="flex items-center justify-between px-2.5 py-1.5 font-corps text-[13px]">
            <span className="text-muet">Sem. {s.semaine}</span>
            {s.statut === 'definie' && s.dateReelle ? (
              <span className="text-encre">
                {fmtJour(s.dateReelle)} <span className="text-muet">· {s.semestreNom} · sem. {s.pedaDansSemestre}</span>
              </span>
            ) : s.statut === 'a_definir' ? (
              <span className="text-attention">à définir</span>
            ) : (
              <span className="text-retard">non planifiable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

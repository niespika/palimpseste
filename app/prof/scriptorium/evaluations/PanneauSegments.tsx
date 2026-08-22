'use client'
// ============================================================================
// C4 · L2 — LE PANNEAU DES CINQ SEGMENTS, au plan d'évaluation.
// ----------------------------------------------------------------------------
// « Les cinq segments SE CALCULENT À LA CONCEPTION D'UN PLAN D'ÉVALUATION, ET
//   ILS S'Y AFFICHENT : c'est là que le professeur voit CE QUE SON CALENDRIER
//   PRODUIT » (`01-` §4, couche 1).
//
// LE CALCUL — et il est écrit, il ne s'invente pas ici : C = `semaines de cours
// − 2` ; les segments 1 et 2 en prennent QUATRE ; R = C − 4 se partage en ⌈R/3⌉,
// ⌊R/3⌋ et LE SOLDE. *Pour C = 32 : 10, 9 et 9.*
//
// ⚠️ « En dessous de C = 5, les segments 3, 4 et 5 n'ont AUCUNE SEMAINE : le
//    routeur N'INVENTE AUCUNE BORNE et émet un SIGNAL NON BLOQUANT. » Rien ici
//    ne bloque : le panneau montre les segments vides et dit pourquoi.
//
// ⚠️ AUCUNE DATE EN DUR : ce composant ne connaît que les semaines que le plan
//    lui donne — celles du Calendrier, vacances déjà sautées.
//
// Le calcul lui-même vit dans `utils/routeur/segments.ts`, que `npm test`
// éprouve : ce fichier n'est qu'un affichage.
// ============================================================================

import { decouperEnSegments } from '@/utils/routeur/segments'

/** Ce que le plan et le modèle ont tous deux : une semaine d'enseignement. */
export interface SemaineDuPlan { lundi: string; pedaNum: number | null }

const LIBELLE: Record<number, { nom: string; regime: string }> = {
  1: { nom: 'Diagnostic', regime: 'les deux passations diagnostiques en classe' },
  2: { nom: 'Calibration', regime: 'le routeur éprouve le diagnostic — aucune lettre affichée' },
  3: { nom: 'Amorce', regime: 'production guidée ; étayage fort puis décroissant' },
  4: { nom: 'Stabilisation', regime: 'assemblage ; étayage faible' },
  5: { nom: 'Clôture', regime: 'part macro renforcée ; conditions d’examen' },
}

const TEINTE: Record<number, string> = {
  1: 'bg-encre-douce', 2: 'bg-muet', 3: 'bg-ok', 4: 'bg-attention', 5: 'bg-pigment',
}

export default function PanneauSegments({ semaines }: { semaines: SemaineDuPlan[] }) {
  const d = decouperEnSegments(
    semaines.map((s) => ({ dateDebutLundi: s.lundi, dateFinDimanche: s.lundi })))
  const total = d.C || 1

  return (
    <section className="border border-bordure rounded-lg bg-parchemin p-4 mb-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">
          Les cinq segments
        </span>
        <span className="font-corps italic text-[13px] text-muet-clair">
          {d.semainesDeCours} semaine{d.semainesDeCours > 1 ? 's' : ''} de cours → C = {d.C}
        </span>
      </div>

      <p className="font-corps text-[13px] text-encre-douce mb-3">
        Ce que votre calendrier produit. <strong>C = semaines de cours − 2</strong> — la première
        est celle du diagnostic, la dernière est perdue. Les segments 1 et 2 en prennent quatre ;
        le reste ({d.R}) se partage en ⌈{d.R}/3⌉, ⌊{d.R}/3⌋ et le solde.
      </p>

      {/* La barre : une bande par segment, à la largeur de ce qu'il prend. */}
      {d.C > 0 && (
        <div className="flex h-2 w-full overflow-hidden rounded mb-3" role="img"
          aria-label={`Répartition : ${d.segments.map((s) =>
            `segment ${s.segment} ${s.semaines.length} semaines`).join(', ')}`}>
          {d.segments.map((s) => (
            s.semaines.length > 0 && (
              <span key={s.segment} className={TEINTE[s.segment]}
                style={{ width: `${(s.semaines.length / total) * 100}%` }} />
            )
          ))}
        </div>
      )}

      <ol className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {d.segments.map((s) => (
          <li key={s.segment}
            className={`rounded border px-3 py-2 ${s.semaines.length === 0
              ? 'border-dashed border-bordure bg-transparent' : 'border-bordure bg-white'}`}>
            <div className="flex items-baseline gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${TEINTE[s.segment]} ${
                s.semaines.length === 0 ? 'opacity-30' : ''}`} />
              <span className="font-ui text-[12px] text-encre">
                {s.segment}. {LIBELLE[s.segment].nom}
              </span>
              <span className="ml-auto font-ui text-[11px] text-muet">
                {s.semaines.length === 0 ? 'aucune semaine' : `${s.semaines.length} sem.`}
              </span>
            </div>
            <p className="font-corps text-[12px] text-muet mt-0.5">
              {s.premierLundi
                ? <>du {s.premierLundi}{s.semaines.length > 1
                  ? ` au ${s.semaines[s.semaines.length - 1].dateDebutLundi}` : ''}</>
                : <span className="italic">aucune borne — le routeur n’en invente pas</span>}
            </p>
            <p className="font-corps text-[11px] text-muet-clair mt-0.5">
              {LIBELLE[s.segment].regime}
            </p>
          </li>
        ))}
      </ol>

      {/* Le signal non bloquant — comme pour la cadence d'ancre manquée (§10). */}
      {d.signaux.map((s) => (
        <p key={s} className="mt-3 rounded border border-attention/40 bg-attention-teinte/40 px-3
                              py-2 font-corps text-[12px] text-encre-douce">
          <strong className="font-ui text-attention">Signal</strong> — {s}
        </p>
      ))}
    </section>
  )
}

// ============================================================================
// FRAGMENTS (élève) — LE RETOUR D'ESSAI, hiérarchisé.
// ----------------------------------------------------------------------------
// Handoff `design_handoff_fragments_eleve` (F) : quatre lettres en grille ;
// UNE dimension ouverte, les autres repliées ; mise en perspective et bilan
// repliés ; la note /20 sur fond olive si elle est visible.
//
// ⭐ La dimension ouverte est LA PLUS FAIBLE (la lettre la plus basse) : c'est
//    celle qui appelle un geste. À égalité, la première de l'ordre.
//
// Deux consommateurs, comme le retour écrit :
//   · `tuilesAnalyseEssai` — validation de lecture (gate) : tout ouvert ;
//   · `EssaiPublie` — retour déjà lu : la hiérarchie ci-dessus.
// ============================================================================

import { lettreVersNote } from '@/utils/notation'
import type { EssaiDepotAnalyse } from '@/types/fragments'
import type { TuileRetour } from '@/components/retours/ValidationLecture'
import Pli from './Pli'

// Handoff : A/B vert, C/D ambre, E minium.
const COULEUR_LETTRE: Record<string, string> = {
  A: 'bg-ok-teinte text-ok border-ok',
  B: 'bg-ok-teinte text-ok border-ok',
  C: 'bg-attention-teinte text-attention border-attention',
  D: 'bg-attention-teinte text-attention border-attention',
  E: 'bg-retard-teinte text-retard border-retard',
}
const FOND_LETTRE: Record<string, string> = {
  A: 'bg-ok-teinte', B: 'bg-ok-teinte', C: 'bg-attention-teinte', D: 'bg-attention-teinte', E: 'bg-retard-teinte',
}

interface Props {
  analyse: EssaiDepotAnalyse
}

function BadgeLettre({ lettre, taille = 'md' }: { lettre: string | null; taille?: 'sm' | 'md' }) {
  if (!lettre) return null
  const dim = taille === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
  return (
    <span className={`inline-flex items-center justify-center rounded-full border font-titre font-bold ${dim} ${COULEUR_LETTRE[lettre] ?? 'bg-parchemin-fonce text-encre-douce border-bordure'}`}>
      {lettre}
    </span>
  )
}

const DIMENSIONS = [
  { key: 'structure', label: 'Structure' },
  { key: 'expression', label: 'Expression' },
  { key: 'argumentation', label: 'Argumentation' },
  { key: 'connaissances', label: 'Connaissances' },
] as const
type CleDimension = (typeof DIMENSIONS)[number]['key']

const lettreDe = (a: EssaiDepotAnalyse, k: CleDimension) => a[`lettre_${k}`] as string | null
const retourDe = (a: EssaiDepotAnalyse, k: CleDimension) => a[`retour_${k}`] as string | null

/** La dimension la plus faible qui a un retour — celle qu'on ouvre. */
export function dimensionLaPlusFaible(a: EssaiDepotAnalyse): CleDimension | null {
  let pire: { key: CleDimension; note: number } | null = null
  for (const { key } of DIMENSIONS) {
    if (!retourDe(a, key)) continue
    const note = lettreVersNote(lettreDe(a, key)) ?? 99
    if (!pire || note < pire.note) pire = { key, note }
  }
  return pire?.key ?? null
}

// ── Sous-rendus (sans en-tête de carte) ──────────────────────────────────────

function LettresContenu({ analyse }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {DIMENSIONS.map(({ key, label }) => {
        const lettre = lettreDe(analyse, key)
        return (
          <div key={key} className={`rounded-xl p-3 text-center ${lettre ? FOND_LETTRE[lettre] ?? 'bg-parchemin-fonce' : 'bg-parchemin-fonce'}`}>
            <p className="font-ui text-[11px] text-encre-douce mb-1.5 truncate">{label}</p>
            <BadgeLettre lettre={lettre} />
          </div>
        )
      })}
    </div>
  )
}

function Dimension({ analyse, cle }: { analyse: EssaiDepotAnalyse; cle: CleDimension }) {
  const label = DIMENSIONS.find(d => d.key === cle)!.label
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BadgeLettre lettre={lettreDe(analyse, cle)} taille="sm" />
        <h4 className="font-ui text-sm font-semibold text-encre">{label}</h4>
      </div>
      <p className="font-corps text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{retourDe(analyse, cle)}</p>
    </div>
  )
}

/** Les quatre retours, tous ouverts (validation de lecture). */
function RetoursDimensionContenu({ analyse }: Props) {
  return (
    <div className="space-y-5">
      {DIMENSIONS.filter(({ key }) => retourDe(analyse, key)).map(({ key }) => (
        <Dimension key={key} analyse={analyse} cle={key} />
      ))}
    </div>
  )
}

function NoteContenu({ analyse }: Props) {
  return (
    <div className="bg-pigment text-surface rounded-xl px-5 py-4 text-center">
      <p className="font-ui text-xs text-surface/70 mb-1">Note</p>
      <p className="font-titre text-4xl font-semibold leading-none">{analyse.note20_validee}<span className="text-lg text-surface/70">/20</span></p>
    </div>
  )
}

const Paragraphe = ({ texte }: { texte: string }) => (
  <p className="font-corps text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{texte}</p>
)

/** Découpage du retour d'essai en tuiles (validation de lecture). Tuiles vides filtrées. */
export function tuilesAnalyseEssai(analyse: EssaiDepotAnalyse): TuileRetour[] {
  const tuiles: TuileRetour[] = []

  if (DIMENSIONS.some(({ key }) => lettreDe(analyse, key))) {
    tuiles.push({ id: 'lettres', titre: 'Tes lettres', node: <LettresContenu analyse={analyse} /> })
  }
  if (DIMENSIONS.some(({ key }) => retourDe(analyse, key))) {
    tuiles.push({ id: 'dimensions', titre: 'Retours par dimension', node: <RetoursDimensionContenu analyse={analyse} /> })
  }
  if (analyse.retour_parcours) {
    tuiles.push({ id: 'parcours', titre: 'Mise en perspective', node: <Paragraphe texte={analyse.retour_parcours} /> })
  }
  if (analyse.synthese) {
    tuiles.push({ id: 'bilan', titre: 'Bilan général', node: <Paragraphe texte={analyse.synthese} /> })
  }
  if (analyse.note_visible_eleve && analyse.note20_validee !== null) {
    tuiles.push({ id: 'note', titre: 'Note', node: <NoteContenu analyse={analyse} /> })
  }
  return tuiles
}

/** Un retour d'essai déjà lu : lettres, la dimension la plus faible ouverte, le reste replié, la note. */
export default function EssaiPublie({ analyse }: Props) {
  const ouverte = dimensionLaPlusFaible(analyse)
  const autres = DIMENSIONS.filter(({ key }) => key !== ouverte && retourDe(analyse, key))
  const aPerspective = !!analyse.retour_parcours || !!analyse.synthese

  return (
    <div className="space-y-4">
      <LettresContenu analyse={analyse} />

      {ouverte && (
        <div className="rounded-xl border border-bordure bg-surface px-4 py-3">
          <Dimension analyse={analyse} cle={ouverte} />
        </div>
      )}

      {autres.length > 0 && (
        <Pli titre={autres.map(d => d.label).join(' · ')}>
          <div className="space-y-5">
            {autres.map(({ key }) => <Dimension key={key} analyse={analyse} cle={key} />)}
          </div>
        </Pli>
      )}

      {aPerspective && (
        <Pli titre={[analyse.retour_parcours && 'Mise en perspective', analyse.synthese && 'bilan'].filter(Boolean).join(' · ')}>
          <div className="space-y-4">
            {analyse.retour_parcours && (
              <div>
                <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet mb-1">Mise en perspective</p>
                <Paragraphe texte={analyse.retour_parcours} />
              </div>
            )}
            {analyse.synthese && (
              <div>
                <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet mb-1">Bilan général</p>
                <Paragraphe texte={analyse.synthese} />
              </div>
            )}
          </div>
        </Pli>
      )}

      {analyse.note_visible_eleve && analyse.note20_validee !== null && <NoteContenu analyse={analyse} />}
    </div>
  )
}

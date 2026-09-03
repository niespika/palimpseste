// ============================================================================
// FRAGMENTS (élève) — LE RETOUR SOCRATIQUE, hiérarchisé.
// ----------------------------------------------------------------------------
// Handoff `design_handoff_fragments_eleve` (C) : les trois notes en grille,
// puis « EN UN MOT », puis les pistes (actionnables), puis le DÉTAIL replié
// (progrès, langue, style, contenu, transcription — un pli chacun).
//
// ⚠️ MESURÉ AVANT D'ÉCRIRE (03/09, `scripts/recette/mesure-fragments-eleve.mjs`) :
//    `commentaire_general` est « 3 à 5 phrases » par prompt — 640 et 868 car.
//    sur les deux analyses du bac à sable, jamais « un mot ». L'encart le
//    montre ENTIER : c'est la synthèse écrite pour l'élève, et la couper à la
//    première phrase ferait juger sur un extrait. Les pistes font 350-410 car.
//
// Deux consommateurs :
//   · `tuilesAnalyseEcrite` — la validation de lecture (gate) : tout est
//     OUVERT, l'élève doit lire avant de cocher ;
//   · `AnalysePubliee` — un retour DÉJÀ LU (dernier retour replié, archive) :
//     le détail est replié.
// Module SERVEUR (les tuiles sont construites par la page).
// ============================================================================

import { noteVersLettre } from '@/utils/notation'
import type { FragmentAnalyse, FragmentPiste } from '@/types/fragments'
import type { TuileRetour } from '@/components/retours/ValidationLecture'
import Pli from './Pli'

const LABELS_NOTE: Record<number, string> = {
  0: 'Travail non fait',
  1: 'Le minimum',
  2: 'Travail fait',
  3: 'Un bon travail',
  4: 'Excellent',
}

// Teinte de la carte selon la note (E → A).
const TEINTE_NOTE = [
  'bg-retard-teinte text-retard',
  'bg-attention-teinte text-attention',
  'bg-parchemin-fonce text-encre-douce',
  'bg-ok-teinte text-ok',
  'bg-ok-teinte text-ok',
]

export const SECTIONS_ECRIT = [
  { cle: 'note_decouvertes', label: 'Découvertes' },
  { cle: 'note_sources', label: 'Sources' },
  { cle: 'note_reflexions', label: 'Réflexions' },
] as const

function CarteNote({ label, note }: { label: string; note: number | null }) {
  const teinte = note === null ? 'bg-parchemin-fonce text-muet' : (TEINTE_NOTE[note] ?? 'bg-parchemin-fonce text-muet')
  return (
    <div className={`rounded-xl px-3 py-2.5 min-w-0 ${teinte}`}>
      <p className="font-ui text-[11px] font-medium opacity-80 truncate">{label}</p>
      <p className="flex items-baseline gap-2 min-w-0">
        <span className="font-titre text-2xl font-semibold leading-none">{noteVersLettre(note) ?? '—'}</span>
        {/* Le libellé se tait sur téléphone : trois colonnes de 95 px ne le portent pas (mesuré : 70 px voulus pour 41). */}
        {note !== null && <span className="hidden sm:inline font-corps text-xs truncate">{LABELS_NOTE[note]}</span>}
      </p>
    </div>
  )
}

/** Les trois notes — trois colonnes à toutes les tailles (handoff §Responsive). */
export function NotesContenu({ analyse }: { analyse: FragmentAnalyse }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SECTIONS_ECRIT.map(({ cle, label }) => (
        <CarteNote key={cle} label={label} note={analyse[cle]} />
      ))}
    </div>
  )
}

/** « EN UN MOT » : le commentaire général, entier, et le mot du professeur s'il y en a un. */
function EnUnMot({ analyse }: { analyse: FragmentAnalyse }) {
  if (!analyse.commentaire_general && !analyse.notes_prof) return null
  return (
    <div className="space-y-3">
      {analyse.commentaire_general && (
        <div className="rounded-r-xl border-l-4 border-liseret bg-surface px-4 py-3">
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-pigment mb-1.5">★ En un mot</p>
          <p className="font-corps text-[15px] text-encre leading-relaxed whitespace-pre-wrap">{analyse.commentaire_general}</p>
        </div>
      )}
      {analyse.notes_prof && (
        <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3">
          <p className="font-ui text-xs text-attention font-medium mb-1">Ton professeur ajoute :</p>
          <p className="font-corps text-sm text-attention italic whitespace-pre-wrap">&laquo;&nbsp;{analyse.notes_prof}&nbsp;&raquo;</p>
        </div>
      )}
    </div>
  )
}

function PistesContenu({ pistes }: { pistes: FragmentPiste[] }) {
  return (
    <div className="space-y-2">
      {pistes.map(piste => (
        <div key={piste.id} className="bg-parchemin-fonce rounded-xl px-4 py-3 flex items-start gap-2.5">
          <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden>{piste.est_rappel ? '🔁' : '💡'}</span>
          <div className="min-w-0">
            {piste.est_rappel && <p className="font-ui text-xs text-pigment font-medium mb-0.5">On en avait parlé</p>}
            <p className="font-corps text-sm text-encre-douce leading-relaxed">{piste.contenu}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

const DETAIL = [
  { cle: 'retour_progres', titre: 'Progrès' },
  { cle: 'retour_langue', titre: 'Langue' },
  { cle: 'retour_style', titre: 'Style' },
  { cle: 'retour_contenu', titre: 'Contenu' },
] as const

/**
 * Le détail : un pli par section. `replie` = fermés (retour déjà lu) ; sinon
 * ouverts (l'élève doit lire pour valider). La transcription reste toujours
 * repliée : elle n'est pas un retour, c'est la copie relue par la machine.
 */
function DetailContenu({ analyse, replie }: { analyse: FragmentAnalyse; replie: boolean }) {
  return (
    <div className="space-y-2">
      {DETAIL.map(({ cle, titre }) => {
        const contenu = analyse[cle]
        if (!contenu) return null
        return (
          <Pli key={cle} titre={titre} ouvert={!replie}>
            <p className="font-corps text-sm text-encre-douce whitespace-pre-wrap leading-relaxed">{contenu}</p>
          </Pli>
        )
      })}
      {analyse.transcription && (
        <Pli titre="Transcription de mon manuscrit">
          <p className="text-sm text-encre-douce whitespace-pre-wrap font-mono leading-relaxed">{analyse.transcription}</p>
        </Pli>
      )}
    </div>
  )
}

function aDuDetail(analyse: FragmentAnalyse): boolean {
  return DETAIL.some(({ cle }) => !!analyse[cle]) || !!analyse.transcription
}

/**
 * Découpage du retour écrit en tuiles pour la VALIDATION DE LECTURE (gate) :
 * notes + « en un mot » · pistes · le détail, tout ouvert. Les tuiles vides
 * sont filtrées → si une seule subsiste, ValidationLecture n'affiche pas de case.
 */
export function tuilesAnalyseEcrite(analyse: FragmentAnalyse, pistes: FragmentPiste[]): TuileRetour[] {
  const tuiles: TuileRetour[] = []

  const aNotes = SECTIONS_ECRIT.some(({ cle }) => analyse[cle] !== null) || !!analyse.notes_prof || !!analyse.commentaire_general
  if (aNotes) {
    tuiles.push({
      id: 'notes',
      titre: 'Tes notes, et l’essentiel',
      node: (
        <div className="space-y-4">
          <NotesContenu analyse={analyse} />
          <EnUnMot analyse={analyse} />
        </div>
      ),
    })
  }

  if (pistes.length > 0) {
    tuiles.push({ id: 'pistes', titre: 'Pistes pour la suite', node: <PistesContenu pistes={pistes} /> })
  }

  if (aDuDetail(analyse)) {
    tuiles.push({ id: 'detail', titre: 'Le retour détaillé', node: <DetailContenu analyse={analyse} replie={false} /> })
  }

  return tuiles
}

interface Props {
  analyse: FragmentAnalyse
  pistes: FragmentPiste[]
}

/** Un retour déjà lu : notes, « en un mot », pistes — et le détail replié. */
export default function AnalysePubliee({ analyse, pistes }: Props) {
  return (
    <div className="space-y-5">
      <NotesContenu analyse={analyse} />
      <EnUnMot analyse={analyse} />

      {pistes.length > 0 && (
        <div>
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet mb-2">Pistes pour la suite</p>
          <PistesContenu pistes={pistes} />
        </div>
      )}

      {aDuDetail(analyse) && (
        <div>
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet mb-2">Le détail — déplier ce qui t’intéresse</p>
          <DetailContenu analyse={analyse} replie />
        </div>
      )}
    </div>
  )
}

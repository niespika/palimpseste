import { noteVersLettre } from '@/utils/notation'
import type { FragmentAnalyse, FragmentPiste } from '@/types/fragments'
import type { TuileRetour } from '@/components/retours/ValidationLecture'
import TranscriptionRepliable from './TranscriptionRepliable'

interface Props {
  analyse: FragmentAnalyse
  pistes: FragmentPiste[]
}

const LABELS_NOTE: Record<number, string> = {
  0: 'Travail non fait',
  1: 'Le minimum',
  2: 'Travail fait',
  3: 'Un bon travail',
  4: 'Excellent',
}

function BadgeNote({ label, note }: { label: string; note: number | null }) {
  if (note === null) return null
  const couleurs = ['bg-retard-teinte text-retard', 'bg-attention-teinte text-attention', 'bg-parchemin-fonce text-muet', 'bg-ok-teinte text-ok', 'bg-ok-teinte text-ok']
  return (
    <div className={`rounded-xl px-4 py-3 ${couleurs[note] ?? 'bg-parchemin-fonce text-muet'}`}>
      <p className="text-xs font-medium mb-0.5">{label}</p>
      <p className="text-lg font-serif">{noteVersLettre(note)} <span className="text-sm font-normal">— {LABELS_NOTE[note]}</span></p>
    </div>
  )
}

function Section({ titre, contenu }: { titre: string; contenu: string | null }) {
  if (!contenu) return null
  return (
    <div>
      <p className="text-xs font-medium text-muet uppercase tracking-wide mb-1.5">{titre}</p>
      <p className="text-sm text-encre-douce whitespace-pre-wrap leading-relaxed">{contenu}</p>
    </div>
  )
}

// Sous-rendus (sans en-tête de carte) réutilisés par le composant complet ET par
// le découpage en tuiles pour la validation de lecture.
function NotesContenu({ analyse }: { analyse: FragmentAnalyse }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <BadgeNote label="Découvertes" note={analyse.note_decouvertes} />
        <BadgeNote label="Sources" note={analyse.note_sources} />
        <BadgeNote label="Réflexions" note={analyse.note_reflexions} />
      </div>
      {analyse.notes_prof && (
        <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3">
          <p className="text-xs text-attention font-medium mb-1">Ton professeur ajoute :</p>
          <p className="text-sm text-attention italic">&laquo;&nbsp;{analyse.notes_prof}&nbsp;&raquo;</p>
        </div>
      )}
    </div>
  )
}

function RetourDetailleContenu({ analyse }: { analyse: FragmentAnalyse }) {
  return (
    <div className="space-y-5">
      <Section titre="Commentaire général" contenu={analyse.commentaire_general} />
      {analyse.retour_progres && <Section titre="Progrès" contenu={analyse.retour_progres} />}
      <Section titre="Langue" contenu={analyse.retour_langue} />
      <Section titre="Style" contenu={analyse.retour_style} />
      <Section titre="Contenu" contenu={analyse.retour_contenu} />
      {analyse.transcription && <TranscriptionRepliable texte={analyse.transcription} />}
    </div>
  )
}

function PistesContenu({ pistes }: { pistes: FragmentPiste[] }) {
  return (
    <div className="space-y-2">
      {pistes.map(piste => (
        <div key={piste.id} className="bg-parchemin-fonce rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-sm flex-shrink-0 mt-0.5">{piste.est_rappel ? '🔁' : '💡'}</span>
          <div>
            {piste.est_rappel && <p className="text-xs text-pigment font-medium mb-0.5">On en avait parlé</p>}
            <p className="text-sm text-encre-douce">{piste.contenu}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Découpage du retour écrit en 3 tuiles logiques (validation de lecture). Les tuiles
// vides sont filtrées → si une seule subsiste, ValidationLecture n'affiche pas de case.
export function tuilesAnalyseEcrite(analyse: FragmentAnalyse, pistes: FragmentPiste[]): TuileRetour[] {
  const tuiles: TuileRetour[] = []

  const aNotes = analyse.note_decouvertes !== null || analyse.note_sources !== null || analyse.note_reflexions !== null || !!analyse.notes_prof
  if (aNotes) {
    tuiles.push({ id: 'notes', titre: 'Tes notes', node: <NotesContenu analyse={analyse} /> })
  }

  const aDetail = !!(analyse.commentaire_general || analyse.retour_progres || analyse.retour_langue || analyse.retour_style || analyse.retour_contenu || analyse.transcription)
  if (aDetail) {
    tuiles.push({ id: 'detail', titre: 'Le retour détaillé', node: <RetourDetailleContenu analyse={analyse} /> })
  }

  if (pistes.length > 0) {
    tuiles.push({ id: 'pistes', titre: 'Pistes pour la suite', node: <PistesContenu pistes={pistes} /> })
  }

  return tuiles
}

export default function AnalysePubliee({ analyse, pistes }: Props) {
  return (
    <div className="space-y-5">
      <NotesContenu analyse={analyse} />

      <div className="bg-surface border border-bordure rounded-xl px-4 py-4">
        <RetourDetailleContenu analyse={analyse} />
      </div>

      {pistes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muet uppercase tracking-wide mb-2">Pistes pour la suite</p>
          <PistesContenu pistes={pistes} />
        </div>
      )}
    </div>
  )
}

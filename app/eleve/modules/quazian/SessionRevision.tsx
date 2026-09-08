'use client'

import { useRef, useState, type ReactNode } from 'react'
import { soumettreNote, type CarteRevision } from './actions'

// Marqueur cloze utilisé à la génération et à la saisie manuelle : {{réponse}}
const CLOZE_RE = /\{\{(.+?)\}\}/g

// Rend le recto d'une carte. Pour une carte cloze, chaque {{réponse}} est
// masqué tant que la carte n'est pas révélée, puis affiché en surbrillance.
// Les cartes recto_verso sont rendues telles quelles (aucune parenthèse masquée).
function rendreRecto(texte: string, format: string, revele: boolean): ReactNode {
  if (format !== 'cloze') return texte

  const segments: ReactNode[] = []
  let curseur = 0
  let i = 0
  for (const m of texte.matchAll(CLOZE_RE)) {
    const idx = m.index ?? 0
    if (idx > curseur) segments.push(texte.slice(curseur, idx))
    segments.push(
      revele ? (
        <mark key={i} className="bg-pigment-teinte text-encre font-semibold rounded px-1">
          {m[1]}
        </mark>
      ) : (
        <span
          key={i}
          aria-label="à deviner"
          className="inline-block align-middle bg-parchemin-fonce text-bordure rounded px-3 mx-0.5 select-none"
        >
          ·····
        </span>
      )
    )
    curseur = idx + m[0].length
    i++
  }
  if (curseur < texte.length) segments.push(texte.slice(curseur))

  // Carte cloze sans marqueur {{…}} : on retombe sur le texte brut.
  return segments.length > 0 ? segments : texte
}

const LABELS_RATING: Record<number, { label: string; desc: string; couleur: string }> = {
  1: { label: 'Raté', desc: 'Je ne savais pas', couleur: 'bg-retard-teinte text-retard hover:opacity-90 border-retard' },
  2: { label: 'Difficile', desc: 'Je me souviens à peine', couleur: 'bg-attention-teinte text-attention hover:opacity-90 border-attention' },
  3: { label: 'Bien', desc: 'Après hésitation', couleur: 'bg-info-teinte text-info hover:opacity-90 border-info' },
  4: { label: 'Facile', desc: 'Immédiatement', couleur: 'bg-ok-teinte text-ok hover:opacity-90 border-ok' },
}

const TYPE_COULEURS: Record<string, string> = {
  philosophe: 'bg-info-teinte text-info',
  concept: 'bg-pigment-teinte text-pigment',
  mouvement: 'bg-pigment-teinte text-pigment',
  these: 'bg-attention-teinte text-attention',
}

interface Props {
  cartes: CarteRevision[]
  onTermine: (nbRevues: number) => void
}

// Une carte RATÉE revient en fin de file pour être RELUE — c'est de l'étude, pas
// une seconde évaluation. Le FSRS a déjà reçu la seule note honnête (« je ne
// savais pas ») et a posé l'échéance à demain ; la repasse ne lui envoie RIEN.
// Mesuré le 05/09 : renoter « Bien » cinq minutes après un « Raté » repoussait
// la carte de 1 à 3 jours, « Facile » à 4 — le souvenir tout frais passait pour
// acquis. Avant, la repasse n'existait que pour les cartes neuves ou en
// apprentissage, et sa seconde note écrasait la première.
type CarteEnFile = CarteRevision & { repasse?: boolean }

export function SessionRevision({ cartes: cartesInitiales, onTermine }: Props) {
  const [cartes, setCartes] = useState<CarteEnFile[]>(cartesInitiales)
  const [index, setIndex] = useState(0)
  const [retournee, setRetournee] = useState(false)
  const [pending, setPending] = useState(false)
  const [nbRevues, setNbRevues] = useState(0)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissement, setAvertissement] = useState<string | null>(null)
  const envoiEnCours = useRef(false)

  const carte = cartes[index]

  if (!carte) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-lg font-serif text-encre mb-2">Session terminée !</h3>
        <p className="text-sm text-encre-douce mb-6">{nbRevues} carte{nbRevues > 1 ? 's' : ''} révisée{nbRevues > 1 ? 's' : ''}</p>
        {avertissement && <p role="status" className="text-sm text-attention mb-4">{avertissement}</p>}
        <button
          onClick={() => onTermine(nbRevues)}
          className="px-6 py-2 bg-bouton text-surface text-sm rounded-lg hover:opacity-90"
        >
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  // Retire la carte courante de la file ; `enFin` la remet en queue pour relecture.
  function avancer(enFin: CarteEnFile | null) {
    setCartes((prev) => {
      const reste = prev.filter((_, i) => i !== index)
      return enFin ? [...reste, enFin] : reste
    })
    if (!enFin) {
      setIndex((i) => Math.min(i, cartes.length - 2))
      setNbRevues((n) => n + 1)
    }
    setRetournee(false)
  }

  async function handleNote(rating: 1 | 2 | 3 | 4) {
    if (envoiEnCours.current) return
    envoiEnCours.current = true
    setPending(true)
    setErreur(null)
    try {
      const res = await soumettreNote(carte.flashcard_id, carte.card_state_id, rating)
      if ('error' in res) { setErreur(res.error); return }
      if (res.avertissement) setAvertissement(res.avertissement)

      // Une carte ratée est relue sans seconde note, après sauvegarde confirmée.
      if (rating === 1) {
        avancer({ ...carte, card_state_id: res.cardStateId, repasse: true })
      } else {
        avancer(null)
      }
    } catch {
      setErreur('La sauvegarde n’a pas pu être confirmée. Vérifie ta connexion et réessaie.')
    } finally {
      envoiEnCours.current = false
      setPending(false)
    }
  }

  // Repasse : aucune note n'est envoyée — soit la carte est comprise et sort de la
  // file, soit elle revient encore en fin de file pour une nouvelle lecture.
  function handleRepasse(comprise: boolean) {
    avancer(comprise ? null : carte)
  }

  // Total fixe pour toute la session ; la barre et le compteur suivent les cartes acquises.
  const total = cartesInitiales.length
  const progress = total > 0 ? Math.round((nbRevues / total) * 100) : 0

  return (
    <div className="max-w-xl mx-auto">
      {erreur && <p role="alert" className="text-sm text-attention mb-4">{erreur}</p>}
      {avertissement && <p role="status" className="text-sm text-attention mb-4">{avertissement}</p>}
      {/* Barre de progression */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 bg-parchemin-fonce rounded-full overflow-hidden">
          <div
            className="h-full bg-pigment transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muet shrink-0">{nbRevues} / {total}</span>
      </div>

      {/* Carte */}
      <div
        className="bg-surface border border-bordure rounded-2xl p-8 min-h-64 flex flex-col cursor-pointer select-none shadow-sm"
        onClick={() => !retournee && setRetournee(true)}
      >
        {/* En-tête */}
        <div className="flex items-center gap-2 mb-6">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COULEURS[carte.type] ?? 'bg-parchemin-fonce text-muet'}`}>
            {carte.type}
          </span>
          {carte.concept_tag && (
            <span className="text-xs text-muet">{carte.concept_tag}</span>
          )}
          {carte.repasse && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-attention-teinte text-attention">relecture</span>
          )}
          <span className="ml-auto text-xs text-muet">{carte.label_unite}</span>
        </div>

        {/* Recto (le cloze se remplit ici à la révélation) */}
        <p className="text-lg text-encre font-medium flex-1 leading-relaxed">
          {rendreRecto(carte.recto, carte.format, retournee)}
        </p>

        {/* Verso : pour un cloze, la réponse apparaît déjà en surbrillance dans le recto */}
        {!retournee ? (
          <p className="mt-6 text-sm text-muet text-center">
            Appuie pour révéler la réponse
          </p>
        ) : carte.format !== 'cloze' ? (
          <div className="mt-6 pt-6 border-t border-bordure">
            <p className="text-encre-douce leading-relaxed">{carte.verso}</p>
          </div>
        ) : null}
      </div>

      {/* Boutons : notation FSRS au premier passage, simple relecture en repasse */}
      {retournee && carte.repasse ? (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => handleRepasse(false)}
            className={`flex flex-col items-center px-2 py-3 rounded-xl border text-xs font-medium transition-colors ${LABELS_RATING[1].couleur}`}
          >
            <span className="font-bold text-sm mb-0.5">Encore raté</span>
            <span className="text-xs opacity-70 leading-tight text-center">Je la relirai en fin de séance</span>
          </button>
          <button
            onClick={() => handleRepasse(true)}
            className={`flex flex-col items-center px-2 py-3 rounded-xl border text-xs font-medium transition-colors ${LABELS_RATING[3].couleur}`}
          >
            <span className="font-bold text-sm mb-0.5">Compris</span>
            <span className="text-xs opacity-70 leading-tight text-center">Le raté reste compté</span>
          </button>
        </div>
      ) : retournee ? (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {([1, 2, 3, 4] as const).map((r) => {
            const info = LABELS_RATING[r]
            return (
              <button
                key={r}
                onClick={() => handleNote(r)}
                disabled={pending}
                className={`flex flex-col items-center px-2 py-3 rounded-xl border text-xs font-medium transition-colors disabled:opacity-50 ${info.couleur}`}
              >
                <span className="font-bold text-sm mb-0.5">{info.label}</span>
                <span className="text-xs opacity-70 leading-tight text-center">{info.desc}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setRetournee(true)}
            className="px-6 py-2.5 bg-bouton text-surface text-sm rounded-xl hover:opacity-90 transition-colors"
          >
            Révéler la réponse
          </button>
        </div>
      )}
    </div>
  )
}

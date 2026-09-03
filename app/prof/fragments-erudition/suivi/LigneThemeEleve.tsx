'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderTheme, validerTheme, commenterTheme } from '../actions'
import { toggleEssaiActif } from '../essai-actions'
import { statutDuTheme } from '@/utils/fragments-theme'

export interface ThemeEleve {
  theme: string | null
  description: string | null
  essai_actif: boolean | null
  /** C8 (02/09) — la proposition de l'élève, et la validation du professeur. */
  propose_at?: string | null
  valide_at?: string | null
  /** C8 (02/09, le soir) — le commentaire du professeur, « ni valider, ni modifier ». */
  commentaire_prof?: string | null
  commente_at?: string | null
}

interface Props {
  inscriptionId: string
  semestreId: string
  theme: ThemeEleve | null
}

// Ligne de thème « déroulante » : le prof voit le thème de l'élève (champ
// unique — le thème EST sa question d'essai) et l'édite à la demande. Le badge
// « essai » active/désactive l'essai final pour cet élève sur ce semestre.
// Trois gestes sur un thème proposé : valider tel quel, modifier (sa main vaut
// validation), ou COMMENTER — le texte reste, l'élève reçoit le commentaire
// dans son « à faire » et re-propose.
export default function LigneThemeEleve({ inscriptionId, semestreId, theme }: Props) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [essaiActif, setEssaiActif] = useState<boolean>(!!theme?.essai_actif)
  const [chargementEssai, setChargementEssai] = useState(false)
  const [commentaireEdition, setCommentaireEdition] = useState(false)
  const [chargementCommentaire, setChargementCommentaire] = useState(false)
  const [chargementValidation, setChargementValidation] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('inscriptionId', inscriptionId)
    formData.append('semestreId', semestreId)
    const resultat = await sauvegarderTheme(formData)
    setChargement(false)
    if (resultat.success) {
      setEdition(false)
      setMessage('Enregistré.')
      setTimeout(() => setMessage(null), 2000)
      router.refresh()
    }
  }

  const statut = statutDuTheme(theme ? {
    theme: theme.theme, propose_at: theme.propose_at ?? null, valide_at: theme.valide_at ?? null,
    commentaire_prof: theme.commentaire_prof ?? null, commente_at: theme.commente_at ?? null,
  } : null)

  async function handleValider() {
    setChargementValidation(true)
    const r = await validerTheme(inscriptionId, semestreId)
    setChargementValidation(false)
    if ('error' in r && r.error) { setMessage(r.error); return }
    setMessage('Thème validé.')
    setTimeout(() => setMessage(null), 2000)
    router.refresh()
  }

  async function handleCommenter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargementCommentaire(true)
    const texte = String(new FormData(e.currentTarget).get('commentaire') ?? '')
    const r = await commenterTheme(inscriptionId, semestreId, texte)
    setChargementCommentaire(false)
    if ('error' in r && r.error) { setMessage(r.error); return }
    setCommentaireEdition(false)
    setMessage('Commentaire envoyé à l’élève.')
    setTimeout(() => setMessage(null), 2500)
    router.refresh()
  }

  async function handleToggleEssai() {
    setChargementEssai(true)
    const nouvel = !essaiActif
    await toggleEssaiActif(inscriptionId, semestreId, nouvel)
    setEssaiActif(nouvel)
    setChargementEssai(false)
    router.refresh()
  }

  if (edition) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2 mt-1">
        <input
          name="theme"
          required
          defaultValue={theme?.theme ?? ''}
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          placeholder="Thème / question travaillée — ex. : La piraterie dans l'océan Indien"
        />
        <textarea
          name="description"
          defaultValue={theme?.description ?? ''}
          rows={2}
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-none text-encre"
          placeholder="Cadrage du thème (optionnel)"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={chargement}
            className="bg-bouton text-surface px-3 py-1 rounded text-sm hover:opacity-90 disabled:opacity-50"
          >
            {chargement ? '…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => setEdition(false)}
            className="px-3 py-1 rounded text-sm text-encre-douce hover:bg-parchemin-fonce"
          >
            Annuler
          </button>
        </div>
      </form>
    )
  }

  // Un commentaire ANTÉRIEUR à la nouvelle proposition (l'élève a répondu) :
  // rappelé en sourdine, pour que le professeur se souvienne de ce qu'il a demandé.
  const commentairePrecedent = statut === 'a_valider' && theme?.commentaire_prof ? theme.commentaire_prof : null

  return (
    <div className="space-y-2">
      {/* ⛔ `flex-wrap` ne replie rien sans largeur minimale (cf. la ligne de
          synthèse) : sans le `min-w-[14rem]`, quatre boutons `flex-shrink-0`
          écrasaient le thème à un mot par ligne sur téléphone. Ici le texte garde
          14 rem et les boutons passent DESSOUS quand la ligne est trop étroite. */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="flex-1 min-w-[14rem]">
          {theme?.theme ? (
            <>
              <p className="text-sm text-encre">
                {statut === 'a_valider' && (
                  <span className="mr-2 text-xs px-1.5 py-0.5 rounded bg-attention-teinte text-attention font-medium align-middle">À valider</span>
                )}
                {statut === 'valide' && (
                  <span className="mr-2 text-xs px-1.5 py-0.5 rounded bg-ok-teinte text-ok font-medium align-middle">Validé</span>
                )}
                {statut === 'commente' && (
                  <span className="mr-2 text-xs px-1.5 py-0.5 rounded bg-info-teinte text-info font-medium align-middle">Commenté</span>
                )}
                {theme.theme}
              </p>
              {theme.description && <p className="text-xs text-muet mt-0.5">{theme.description}</p>}
              {statut === 'a_valider' && (
                <p className="text-xs text-muet mt-0.5">Proposé par l’élève — relis-le, puis valide-le tel quel, modifie-le, ou commente-le.</p>
              )}
              {statut === 'commente' && theme.commentaire_prof && (
                <p className="text-xs text-info mt-0.5 whitespace-pre-line">
                  <span className="font-medium">Ton commentaire, en attente de la réponse de l’élève :</span> {theme.commentaire_prof}
                </p>
              )}
              {commentairePrecedent && (
                <p className="text-xs text-muet mt-0.5 whitespace-pre-line">
                  <span className="font-medium">Ton commentaire précédent :</span> {commentairePrecedent}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muet italic">Thème non défini — l’élève peut le proposer depuis sa page.</p>
          )}
          {message && <p className="text-xs text-ok mt-0.5">{message}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
        {(statut === 'a_valider' || statut === 'commente') && (
          <button
            onClick={handleValider}
            disabled={chargementValidation}
            title="Valider le thème proposé par l’élève"
            className="text-xs px-2 py-1 rounded-full font-medium bg-bouton text-surface hover:opacity-90 disabled:opacity-50 flex-shrink-0"
          >
            {chargementValidation ? '…' : 'Valider'}
          </button>
        )}
        {theme?.theme && !commentaireEdition && (
          <button
            onClick={() => setCommentaireEdition(true)}
            title="Laisser un commentaire à l’élève sur son thème, sans le valider ni le modifier"
            className="text-xs px-2 py-1 rounded-full font-medium bg-info-teinte text-info hover:opacity-90 flex-shrink-0"
          >
            {statut === 'commente' ? 'Recommenter' : 'Commenter'}
          </button>
        )}
        <button
          onClick={handleToggleEssai}
          disabled={chargementEssai}
          title="Activer l'essai final pour cet élève"
          className={`text-xs px-2 py-1 rounded-full font-medium transition-colors flex-shrink-0 ${
            essaiActif
              ? 'bg-ok-teinte text-ok hover:opacity-90'
              : 'bg-parchemin-fonce text-muet hover:opacity-90'
          }`}
        >
          {chargementEssai ? '…' : essaiActif ? 'Essai actif' : 'Essai'}
        </button>
        <button
          onClick={() => setEdition(true)}
          className="text-xs text-muet hover:text-encre px-2 py-1 rounded hover:bg-parchemin-fonce flex-shrink-0"
        >
          {theme?.theme ? 'Modifier' : 'Définir'}
        </button>
        </div>
      </div>
      {commentaireEdition && (
        <form onSubmit={handleCommenter} className="space-y-2">
          <textarea
            name="commentaire"
            required
            autoFocus
            rows={2}
            maxLength={1000}
            defaultValue={theme?.commentaire_prof ?? ''}
            className="w-full px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-none text-encre"
            placeholder="Ce qui ne va pas encore, et ce que tu attends — l’élève le lira dans son « à faire » et re-proposera son thème."
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={chargementCommentaire}
              className="bg-bouton text-surface px-3 py-1 rounded text-sm hover:opacity-90 disabled:opacity-50"
            >
              {chargementCommentaire ? '…' : 'Envoyer le commentaire'}
            </button>
            <button
              type="button"
              onClick={() => setCommentaireEdition(false)}
              className="px-3 py-1 rounded text-sm text-encre-douce hover:bg-parchemin-fonce"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

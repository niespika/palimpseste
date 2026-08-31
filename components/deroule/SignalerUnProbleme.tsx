'use client'
// ============================================================================
// « SIGNALER QUE L'EXERCICE A UN PROBLÈME » — la case, et le mot de l'élève.
// (demande de Louis, 31/08/2026)
// ----------------------------------------------------------------------------
// ⛔⛔ CE N'EST PAS DE LA MÉTACOGNITION, ET LA DISTINCTION EST LA RAISON D'ÊTRE
//    DE CE FICHIER. `EcranDeroule` s'interdit, en toutes lettres, de « demander
//    à l'élève de signaler ce qu'il n'a pas compris » (`02-` §5) : la lucidité
//    est SPONTANÉE, et c'est la CALIBRATION que le retour nomme. Ici, ce qui est
//    mis en cause est **l'exercice** — sa consigne, son matériau, sa cohérence —
//    et jamais celui qui le passe. D'où :
//      · aucun mot sur ce que l'élève a compris ou non ;
//      · aucune formulation qui suggère une excuse (« je n'ai pas réussi ») ;
//      · rien de ce texte ne part au modèle, et il ne compte comme aucune aide.
//
// ⭐ IL VIT HORS DU FIL DES SIX TEMPS. « Il peut le faire avant le passage, ou
//    après le passage » : le bloc est en pied d'écran, visible quel que soit le
//    temps courant, et **replié par défaut** — une case toujours ouverte serait
//    une invitation, et ce n'en est pas une.
//
// ⚠️ LA CASE NE DISPENSE DE RIEN, ET L'ÉCRAN LE DIT. Arbitrage de Louis (31/08) :
//    « rien ne bouge tant que je n'ai pas tranché ». Laisser croire qu'un
//    signalement exonère de l'exercice serait une promesse que le dispositif ne
//    tient pas — et l'élève ne le découvrirait qu'à son compte d'assiduité.
//
// ⚠️ LE TEXTE NE TRAVERSE AUCUN `FormData`. Il part en argument d'action, comme
//    `actionRemettre` : c'est le chemin qui n'a jamais eu le défaut de CRLF des
//    `<textarea>` (les `\r\n` du navigateur n'entrent que par un FormData
//    construit DEPUIS le formulaire).
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actionSignalerUnProbleme, actionRetirerLeSignalement } from '@/app/deroule/actions'

const MAX = 1500

export interface MonSignalement {
  texte: string
  signaleAt: string
  majAt: string | null
  arbitrage: 'confirme' | 'ecarte' | null
}

export function SignalerUnProbleme(
  { depotId, mien }: { depotId: string; mien: MonSignalement | null },
) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(mien !== null)
  const [texte, setTexte] = useState(mien?.texte ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ton: 'ok' | 'ko'; texte: string } | null>(null)

  const tranche = mien?.arbitrage != null

  async function envoyer() {
    setBusy(true); setMessage(null)
    try {
      const r = await actionSignalerUnProbleme(depotId, texte)
      setMessage({ ton: r.ok ? 'ok' : 'ko', texte: r.message })
      if (r.ok) router.refresh()
    } catch (e) {
      // Une action serveur qui lève (réseau, session expirée) ne doit pas se
      // taire : c'est le défaut que `BoutonRetirerDuPlan` a payé.
      setMessage({ ton: 'ko', texte: e instanceof Error ? e.message : 'L’envoi a échoué.' })
    } finally { setBusy(false) }
  }

  async function retirer() {
    setBusy(true); setMessage(null)
    try {
      const r = await actionRetirerLeSignalement(depotId)
      setMessage({ ton: r.ok ? 'ok' : 'ko', texte: r.message })
      if (r.ok) { setTexte(''); setOuvert(false); router.refresh() }
    } catch (e) {
      setMessage({ ton: 'ko', texte: e instanceof Error ? e.message : 'Le retrait a échoué.' })
    } finally { setBusy(false) }
  }

  return (
    <section className="border-t border-bordure px-4 py-4 sm:px-6">
      <label className="flex items-start gap-2.5 font-ui text-sm text-encre-douce">
        {/* ⚠️ 20 px de cible tactile minimum, et la case commande l'ouverture du
            bloc — jamais l'envoi : cocher n'envoie rien tant qu'il n'y a pas un
            mot (`poserLeSignalement` refuse le vide). */}
        <input
          type="checkbox"
          checked={ouvert}
          disabled={tranche}
          onChange={(e) => { setOuvert(e.target.checked); setMessage(null) }}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-bouton)]"
        />
        <span>
          Signaler que l’exercice a un problème
          <span className="mt-0.5 block text-xs text-muet">
            La consigne est incompréhensible, le texte manque, l’exercice se contredit… Ton
            professeur le lira. <strong className="text-encre-douce">Cela ne te dispense pas de
            l’exercice</strong> : c’est lui qui décide.
          </span>
        </span>
      </label>

      {ouvert && (
        <div className="mt-3 space-y-2 sm:ml-7">
          {tranche ? (
            <VerdictDuProfesseur arbitrage={mien!.arbitrage!} texte={mien!.texte} />
          ) : (
            <>
              <label className="block">
                <span className="sr-only">Explique le problème dans tes mots</span>
                <textarea
                  value={texte}
                  onChange={(e) => setTexte(e.target.value.slice(0, MAX))}
                  rows={4}
                  placeholder="Explique le problème dans tes mots."
                  className="w-full rounded-lg border border-bordure-bouton bg-parchemin px-3 py-2
                             font-corps text-[15px] leading-[1.5] text-encre
                             placeholder:text-muet-clair"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button" onClick={envoyer}
                  disabled={busy || texte.trim() === ''}
                  className="min-h-11 rounded-[10px] bg-bouton px-5 py-2.5 font-ui text-sm
                             font-semibold text-bouton-texte disabled:opacity-50"
                >
                  {busy ? 'Envoi…' : mien ? 'Mettre à jour' : 'Envoyer'}
                </button>
                {mien && (
                  <button
                    type="button" onClick={retirer} disabled={busy}
                    className="font-ui text-sm text-muet underline disabled:opacity-50"
                  >
                    Retirer mon signalement
                  </button>
                )}
                <span className="font-ui text-xs text-muet-clair">
                  {texte.length} / {MAX}
                </span>
              </div>
              {mien && (
                <p className="font-ui text-xs text-muet">
                  Signalé le {jour(mien.signaleAt)}
                  {mien.majAt && ` · modifié le ${jour(mien.majAt)}`} · en attente de ton professeur.
                </p>
              )}
            </>
          )}

          {message && (
            <p className={`font-ui text-xs ${message.ton === 'ok' ? 'text-ok' : 'text-retard'}`}>
              {message.texte}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * ⭐ CE QUE L'ÉLÈVE APPREND, ET RIEN DE PLUS. Le verdict se dit, parce qu'un
 *    signalement resté sans réponse visible est un signalement qu'on ne refait
 *    pas. ⛔ Mais il ne parle jamais d'assiduité : ce compte est celui du
 *    professeur (`06-` §5 — les agrégats ne s'affichent pas à l'élève).
 *
 * ⚠️ « Confirmé » ne s'affiche presque jamais ici : le dépôt passe alors à
 *    `retire`, et `lireDepotMaison` l'écarte — l'écran entier devient
 *    introuvable. Le cas subsiste sur un dépôt qu'on aurait remis au comptage,
 *    et se traite plutôt que d'être supposé impossible.
 */
function VerdictDuProfesseur(
  { arbitrage, texte }: { arbitrage: 'confirme' | 'ecarte'; texte: string },
) {
  return (
    <div className={`rounded-xl border p-3 ${arbitrage === 'confirme'
      ? 'border-ok/25 bg-ok-teinte' : 'border-bordure bg-surface'}`}>
      <p className="font-ui text-sm text-encre">
        {arbitrage === 'confirme'
          ? 'Ton professeur a confirmé : cet exercice a bien un problème.'
          : 'Ton professeur a regardé : l’exercice est en ordre, il reste à faire.'}
      </p>
      <p className="mt-1.5 font-corps text-sm text-encre-douce whitespace-pre-wrap">{texte}</p>
    </div>
  )
}

/** Une date courte — l'heure n'apporte rien à « quand ai-je signalé ? ». */
function jour(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso.slice(0, 10)
    : d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })
}

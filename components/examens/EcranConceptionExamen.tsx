'use client'

// ============================================================================
// C4 · L9 — L'ÉCRAN DE CONCEPTION D'UN EXAMEN DIAGNOSTIQUE.
// ----------------------------------------------------------------------------
// UN SEUL COMPOSANT, DEUX ENTRÉES : « c'est le seul écart entre les deux
// écrans — le reste est commun, et il doit l'être ». Dans CODEX le professeur
// choisit un ÉNONCÉ DE SUJET, dans ALETHEIA un TEXTE ; tout le reste est
// identique, à commencer par ce qu'il ne fait pas.
//
// ⚠️ CET ÉCRAN NE DEMANDE AUCUNE DATE, ni ne la propose, ni ne la corrige. La
//    ligne de plan la porte déjà — elle est AFFICHÉE, jamais saisie. « La
//    cadence d'ancre est un objectif du plan d'évaluation, qui appartient au
//    professeur » (`01-` §9) : si une date manque, c'est au plan qu'on la pose.
//
// ⚠️ IL NE DÉRIVE RIEN DE LA DOCTRINE : ni objet, ni mode, ni cran. Un examen
//    diagnostique « n'est pas un objet à un cran, c'est une COPIE ENTIÈRE »
//    (`01-` §10). `app/prof/conception/nouvelle/Pipeline.tsx` est le patron du
//    formatif — ce n'est pas le nôtre.
// ============================================================================

import { useActionState, useMemo, useState } from 'react'
import Link from 'next/link'
import { concevoirExamen, type RetourExamen } from '@/app/prof/examens-diagnostiques/actions'
import type { EcranConception } from '@/utils/examens/conception'

const CHAMP = 'rounded-md border border-bordure-bouton bg-parchemin px-2 py-1 font-ui text-sm text-encre'

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

export default function EcranConceptionExamen({ vue, actif }: { vue: EcranConception; actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourExamen | null, FormData>(
    concevoirExamen, null)

  const servables = useMemo(() => vue.choix.filter((c) => c.refus === null), [vue.choix])
  const refusés = useMemo(() => vue.choix.filter((c) => c.refus !== null), [vue.choix])
  const [choisi, setChoisi] = useState(servables[0]?.id ?? '')
  // La consigne suit le matériau tant que le professeur ne l'a pas touchée :
  // c'est un POINT DE DÉPART, et c'est lui qui l'arrête (`02-` §6 B.1, point 7).
  const [touchée, setTouchée] = useState(false)
  const [consigne, setConsigne] = useState(servables[0]?.consigne ?? '')

  function changerDeMatiere(id: string) {
    setChoisi(id)
    if (touchée) return
    setConsigne(vue.choix.find((c) => c.id === id)?.consigne ?? '')
  }

  const motDeLaMatiere = vue.matiere === 'sujet' ? 'énoncé de sujet' : 'texte'
  const conçu = retour?.ok === true

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
          {vue.module === 'codex' ? 'Codex · l’écriture diagnostique' : 'Aletheia · la lecture diagnostique'}
        </p>
        <h1 className="font-titre text-2xl text-encre">{vue.intitule}</h1>
        <p className="font-ui text-sm text-encre-douce">
          {vue.classeNom && <><strong>{vue.classeNom}</strong> · </>}
          {/* ⚠️ LA DATE EST LUE, JAMAIS DEMANDÉE. */}
          épreuve du <strong>{fmtJour(vue.echeance)}</strong>
          {vue.enRetard && <span className="text-retard"> · en retard</span>}
          {vue.fenetre && <span className="text-muet"> · fenêtre {vue.fenetre}</span>}
        </p>
        <p className="font-ui text-xs text-muet">
          La date vient de la ligne de plan et ne se saisit pas ici : elle appartient au plan
          d’évaluation, qui appartient au professeur.
        </p>
      </header>

      {!actif && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          <code>fabrique_actif</code>{' '}est à OFF.
        </p>
      )}

      {/* ⚠️ « Un élève dont aucune inscription active ne porte de parcours ne reçoit rien, et le
          professeur en est averti » (§1.3) — condition de recette de C4-L2. On ne la construit
          pas ici, mais on ne la CONTREDIT PAS non plus : le professeur voit que la classe de
          cette ligne de plan n'a pas de parcours déclaré, avant d'avoir conçu. */}
      {vue.parcoursClasse === null && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          <strong>Cette classe ne déclare aucun parcours</strong>{' '}(<code>type_pedagogique</code>).
          L’examen se conçoit quand même — mais l’éligibilité de parcours se lit sur cette valeur,
          et un élève sans parcours n’est servi par rien. Elle se pose à la fiche de la classe.
        </p>
      )}

      {vue.incidents.map((i) => (
        <p key={i} className="rounded-lg border border-retard bg-retard-teinte px-3 py-2 font-ui text-sm text-encre">
          {i}
        </p>
      ))}

      {vue.empechement && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          {vue.empechement}
          {vue.exerciceId && (
            <> {' '}<Link href={`/prof/conception/${vue.exerciceId}`} className="underline">
              voir l’instance
            </Link>.</>
          )}
        </p>
      )}

      {conçu ? (
        <section className="rounded-xl border border-ok bg-ok-teinte p-4 space-y-2">
          <h2 className="font-titre text-lg text-encre">L’examen est conçu</h2>
          <p className="font-ui text-sm text-encre">{retour?.message}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={`/prof/conception/${retour?.exerciceId}`}
              className="rounded-md bg-bouton px-3 py-1.5 font-ui text-sm text-surface">
              Assigner à la classe →
            </Link>
            <Link href={`/prof/${vue.module}/passation/${retour?.exerciceId}`}
              className="rounded-md border border-bordure-bouton px-3 py-1.5 font-ui text-sm text-encre">
              L’écran de passation →
            </Link>
            <Link href={`/prof/${vue.module}`}
              className="font-ui text-sm text-encre-douce underline self-center">
              retour à {vue.module === 'codex' ? 'Codex' : 'Aletheia'}
            </Link>
          </div>
          <p className="font-ui text-xs text-encre-douce">
            Les dépôts naissent <strong>à l’assignation</strong>, pas au dépôt ; le jour de
            l’épreuve, c’est <strong>l’ouverture manuelle</strong> qui lance l’élève — et c’est
            elle qu’il voit dans son module.
          </p>
        </section>
      ) : (
        <form action={action} className="rounded-xl border border-bordure bg-surface p-4 space-y-4">
          <input type="hidden" name="planifie_id" value={vue.planifieId} />
          <input type="hidden" name="module" value={vue.module} />

          <div className="space-y-1">
            <h2 className="font-titre text-lg text-encre">
              {vue.matiere === 'sujet' ? 'L’énoncé de sujet' : 'Le texte'}
            </h2>
            <p className="font-ui text-xs text-encre-douce">
              {vue.matiere === 'sujet'
                ? 'La banque des sujets déposés, bornée par les genres que ce type admet. Le dépôt d’un sujet se fait au corpus ; ici, on choisit dedans.'
                : 'Les textes déposés au corpus. Un texte dont la référence décomposée n’est pas validée est refusé, et le motif la nomme.'}
            </p>
          </div>

          {servables.length === 0 ? (
            <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
              Aucun {motDeLaMatiere} n’est servable. {vue.matiere === 'texte'
                ? 'Une référence décomposée validée est nécessaire — validez-en une, puis revenez.'
                : 'Déposez un sujet au corpus, puis revenez.'}
            </p>
          ) : (
            <label className="block space-y-0.5">
              <span className="block font-ui text-xs text-muet">
                {vue.matiere === 'sujet' ? 'le sujet servi' : 'le texte servi'}
              </span>
              <select name="matiere_id" value={choisi} required disabled={enCours}
                onChange={(e) => changerDeMatiere(e.target.value)}
                className={`${CHAMP} w-full`}>
                {servables.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}{c.detail ? ` — ${c.detail}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* ⭐ LE REFUS EST MONTRÉ, PAS CACHÉ : « le motif nomme la référence ». */}
          {refusés.length > 0 && (
            <details className="rounded-md border border-bordure p-3">
              <summary className="cursor-pointer font-ui text-sm text-encre">
                {refusés.length} {motDeLaMatiere}{refusés.length > 1 ? 's' : ''} ne {refusés.length > 1 ? 'sont' : 'est'} pas servable{refusés.length > 1 ? 's' : ''}
              </summary>
              <ul className="mt-2 space-y-1 font-ui text-xs text-encre-douce">
                {refusés.map((c) => (
                  <li key={c.id}><strong>{c.libelle}</strong> — {c.refus}</li>
                ))}
              </ul>
            </details>
          )}

          <label className="block space-y-0.5">
            <span className="block font-ui text-xs text-muet">
              ce que l’élève lit — <strong>c’est le texte que vous arrêtez ici</strong>
            </span>
            <textarea name="consigne" rows={12} value={consigne} disabled={enCours}
              onChange={(e) => { setTouchée(true); setConsigne(e.target.value) }}
              className={`${CHAMP} w-full font-mono text-[13px]`} required />
          </label>

          {/* ⭐ LES DEUX DRAPEAUX D'OPT-IN DE CLASSE — sans eux, une passation en
              classe ne produit AUCUN signal de Monitoring, et « une année de
              collecte manquée ne se rattrape pas » (`02-` §5 ; §1.1). */}
          <fieldset className="space-y-1.5 rounded-md border border-bordure p-3">
            <legend className="px-1 font-ui text-xs uppercase tracking-wide text-muet-clair">
              les deux gestes de la classe
            </legend>
            <p className="font-ui text-xs text-encre-douce">
              À la maison ils sont de droit ; <strong>en classe ils s’ouvrent, et faux par
              défaut</strong>. Ils restent levables jusqu’à l’ouverture du dépôt, pas après.
            </p>
            <label className="flex items-center gap-1.5 font-ui text-sm text-encre">
              <input type="checkbox" name="optin_se_juger" value="oui" defaultChecked />
              « se juger » — deux questions, jamais trois
            </label>
            <label className="flex items-center gap-1.5 font-ui text-sm text-encre">
              <input type="checkbox" name="optin_confiance_remise" value="oui" defaultChecked />
              la confiance de remise — une valeur par compétence évaluée
            </label>
          </fieldset>

          {retour && !retour.ok && (
            <div className="rounded-lg border border-retard bg-retard-teinte px-3 py-2 space-y-1">
              <p className="font-ui text-sm text-encre">{retour.message}</p>
              {retour.empechements?.map((e) => (
                <p key={e} className="font-ui text-xs text-encre-douce">· {e}</p>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="submit"
              disabled={enCours || servables.length === 0 || vue.empechement !== null}
              className="rounded-md bg-bouton px-4 py-2 font-ui text-sm text-surface disabled:opacity-50">
              {enCours ? 'Conception…' : 'Concevoir l’examen'}
            </button>
            <span className="font-ui text-xs text-muet">
              L’instance naîtra avec <code>lieu = classe</code>, et la ligne de plan passera
              « conçue ».
            </span>
          </div>
        </form>
      )}
    </div>
  )
}

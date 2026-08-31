'use client'
// ============================================================================
// LE PANNEAU D'UN EXERCICE SIGNALÉ — d'un côté les mots des élèves, de l'autre
// l'exercice et les deux gestes qui le concernent.
// ----------------------------------------------------------------------------
// ⭐⭐ UN EXERCICE, TOUS LES COMMENTAIRES. Mesuré en production le 31/08 :
//    **4 instances portaient 86 dépôts — jusqu'à 24 élèves sur la même**. Ce
//    panneau est donc dimensionné pour vingt-quatre messages, pas pour un.
//
// ⛔ IL NE CORRIGE PAS L'INSTANCE, IL Y MÈNE. « Corriger une instance se fait à
//    l'écran — c'est aussi LE SEUL CHEMIN » (`07-` §1.1), et cet écran existe
//    depuis C4-L8 : `/prof/conception/[id]`, avec son formulaire ET son aperçu
//    côté élève. Recopier ici un second formulaire d'édition ferait deux écrans
//    à tenir d'accord, dont un sans aperçu.
//
// ⚠️ LA COCHE « DANS LE POOL » N'EST PAS UN BOUTON COMME UN AUTRE : elle peut
//    retirer jusqu'à 24 copies du comptage d'assiduité d'un seul clic. **Elle
//    dit combien AVANT**, jamais après.
// ============================================================================

import { useActionState } from 'react'
import Link from 'next/link'
import { actionArbitrer, actionBasculerLePool, type RetourSignalement } from './actions'
import type { LigneDeLaFile } from '@/utils/signalements/serveur'

export default function PanneauExercice({ ligne }: { ligne: LigneDeLaFile }) {
  const { bilanDuRetrait: bilan } = ligne

  return (
    <div className="space-y-4">
      <CarteDeLExercice ligne={ligne} />

      <section className="space-y-3">
        <h2 className="font-titre text-lg text-encre">
          Ce que les élèves disent
          <span className="ml-2 font-ui text-sm font-normal text-muet">
            {ligne.signalements.length}
            {ligne.enAttente > 0 && ` · ${ligne.enAttente} à trancher`}
          </span>
        </h2>
        {ligne.signalements.map((s) => (
          <Commentaire
            key={s.id} s={s} nom={ligne.noms[s.eleveId] ?? '—'}
            fenetreDepassee={ligne.fenetres[s.id]?.depassee ?? false}
            heuresRestantes={ligne.fenetres[s.id]?.heuresRestantes ?? null}
          />
        ))}
      </section>

      {/* ⚠️ Le rappel est en PIED, une fois, et non sur chaque bouton : répété
          vingt-quatre fois il cesserait d'être lu. */}
      <p className="font-ui text-xs text-muet">
        Un arbitrage ne change l’assiduité que d’un élève à la fois — celui du commentaire.
        La coche « dans le pool », elle, porte sur l’exercice et sur {bilan.emportes} copie(s)
        en cours.
      </p>
    </div>
  )
}

// ── L'exercice, et les deux gestes qui le concernent ────────────────────────

function CarteDeLExercice({ ligne }: { ligne: LigneDeLaFile }) {
  const { identite: id, bilanDuRetrait: bilan } = ligne
  const [retour, action, enCours] = useActionState<RetourSignalement | null, FormData>(
    actionBasculerLePool, null)
  const dansLePool = !id.bloque

  return (
    <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-ui text-xs text-muet">
        {id.cran !== null && <span>cran {id.cran}</span>}
        {id.typeLibelle && <span>· {id.typeLibelle}</span>}
        <span>· {id.lieu}</span>
        <span>· statut {id.statut}</span>
        {id.bloque && <span className="text-attention">· hors du pool</span>}
      </div>

      {/* ⭐⭐ CE N'EST PAS UN TITRE, ET ON NE LE TRAITE PAS COMME TEL. Mesuré le
          31/08 sur 452 instances : première ligne de consigne à **129 caractères
          en médiane**, p90 179, max 298. Elle s'affiche donc en PARAGRAPHE, à
          taille de corps, jamais sur une ligne de tableau. */}
      <p className="font-corps text-[15px] leading-[1.5] text-encre whitespace-pre-wrap">
        {id.premiereLigne}
      </p>

      {id.blocages.length > 0 && (
        <ul className="space-y-1">
          {id.blocages.map((b, i) => (
            <li key={i} className="rounded-lg border border-attention/35 bg-attention-teinte
                                   px-3 py-1.5 font-ui text-xs text-encre">{b}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/prof/conception/${id.exerciceId}`}
          className="min-h-11 rounded-[10px] bg-bouton px-4 py-2.5 font-ui text-sm font-semibold
                     text-bouton-texte inline-flex items-center"
        >
          Corriger cet exercice
        </Link>
        <span className="font-ui text-xs text-muet">
          formulaire d’édition et aperçu côté élève
        </span>
      </div>

      <form action={action} className="border-t border-bordure pt-3 space-y-2">
        <input type="hidden" name="exercice_id" value={id.exerciceId} />
        {/* ⚠️ La case dit l'état VOULU. On la soumet, on ne la bascule pas au
            `onChange` : un clic qui retire 24 copies sans confirmation visible
            serait un geste qu'on ne peut pas relire avant de le faire. */}
        <label className="flex items-start gap-2.5 font-ui text-sm text-encre">
          <input
            type="checkbox" name="dans_le_pool" value="oui" defaultChecked={dansLePool}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-bouton)]"
          />
          <span>
            Dans le pool
            <span className="mt-0.5 block text-xs text-muet">
              {dansLePool
                ? `Décocher retire l’exercice du tirage ET ${bilan.emportes} copie(s) en cours du `
                  + `comptage d’assiduité. ${bilan.rendusIntouches} copie(s) déjà rendue(s) ne `
                  + 'bougent pas.'
                : id.peutRevenirAuPool
                  ? 'Recocher le remet au tirage. Les copies déjà retirées ne reviennent pas '
                    + 'd’elles-mêmes : chaque élève se remet au comptage par son arbitrage.'
                  : 'Cet exercice est bloqué pour une autre raison que le signalement : '
                    + 'cette coche ne le remettra pas au pool.'}
            </span>
          </span>
        </label>
        <button
          type="submit" disabled={enCours}
          className="min-h-11 rounded-[10px] border border-bordure-bouton px-4 py-2 font-ui
                     text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50"
        >
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {retour && (
          <div className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>
            <p>{retour.message}</p>
            {retour.details?.map((d, i) => (
              <p key={i} className="text-encre-douce">{d}</p>
            ))}
          </div>
        )}
      </form>
    </section>
  )
}

// ── Un commentaire, et son arbitrage ────────────────────────────────────────

function Commentaire({ s, nom, fenetreDepassee, heuresRestantes }: {
  s: LigneDeLaFile['signalements'][number]
  nom: string
  fenetreDepassee: boolean
  heuresRestantes: number | null
}) {
  const [retour, action, enCours] = useActionState<RetourSignalement | null, FormData>(
    actionArbitrer, null)
  const tranche = s.arbitrage !== null

  return (
    <article className={`rounded-xl border p-3.5 space-y-2.5 ${tranche
      ? 'border-bordure bg-parchemin' : 'border-liseret bg-surface'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-ui text-sm font-semibold text-encre">{nom}</p>
        <p className="font-ui text-xs text-muet">
          {s.signaleAt.slice(0, 10)}
          {s.majAt && ` · modifié le ${s.majAt.slice(0, 10)}`}
          {' · dépôt '}{s.statutDepot}
        </p>
      </div>

      <p className="font-corps text-[15px] leading-[1.55] text-encre whitespace-pre-wrap">
        {s.texte}
      </p>

      {tranche
        ? <Verdict arbitrage={s.arbitrage!} statutDepot={s.statutDepot} />
        : s.statutDepot === 'retire'
          ? <p className="font-ui text-xs text-encre-douce">
              Ce dépôt est <strong>déjà hors du comptage</strong> — l’exercice a été retiré du
              pool. Trancher reste utile : cela dit à cet élève ce que vous avez décidé.
            </p>
          : <FenetreDAssiduite depassee={fenetreDepassee} heures={heuresRestantes} />}

      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="signalement_id" value={s.id} />
        <button
          type="submit" name="arbitrage" value="confirme" disabled={enCours || s.arbitrage === 'confirme'}
          className="min-h-11 rounded-[10px] bg-bouton px-4 py-2 font-ui text-sm font-semibold
                     text-bouton-texte disabled:opacity-40"
        >
          L’exercice a un problème
        </button>
        <button
          type="submit" name="arbitrage" value="ecarte" disabled={enCours || s.arbitrage === 'ecarte'}
          className="min-h-11 rounded-[10px] border border-bordure-bouton px-4 py-2 font-ui
                     text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-40"
        >
          Pas de problème
        </button>
        {retour && (
          <span className={`w-full font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>
            {retour.message}
          </span>
        )}
      </form>
    </article>
  )
}

/**
 * ⛔⛔ LE VERDICT SE LIT SUR LE DÉPÔT, JAMAIS SUR L'ARBITRAGE SEUL — et c'est un
 *    défaut TROUVÉ EN LE FAISANT TOURNER, pas en le relisant.
 *
 *    Les deux gestes de cet écran n'ont pas la même portée : l'arbitrage vise
 *    UN élève, la coche « dans le pool » vise TOUS les dépôts non rendus. Un
 *    signalement « écarté » dont la copie est ensuite emportée par un retrait
 *    du pool affichait « l'exercice reste à son comptage » — et c'était FAUX :
 *    `statut = 'retire'` l'en avait sorti. *Une ligne qui restate une intention
 *    au lieu de lire l'état ment dès que deux gestes se croisent.*
 *
 * ⭐ `entreAuDenominateur(statut)` est la règle, et on ne la recopie pas : c'est
 *    `statut !== 'retire'`, et rien d'autre.
 */
function Verdict(
  { arbitrage, statutDepot }: { arbitrage: 'confirme' | 'ecarte'; statutDepot: string },
) {
  const horsComptage = statutDepot === 'retire'
  const accorde = (arbitrage === 'confirme') === horsComptage
  return (
    <p className={`font-ui text-xs ${accorde ? 'text-encre-douce' : 'text-attention'}`}>
      {arbitrage === 'confirme'
        ? horsComptage
          ? '✓ Confirmé — cet exercice est sorti du comptage de cet élève.'
          : `✓ Confirmé — mais ce dépôt est revenu au comptage (statut « ${statutDepot} »).`
        : horsComptage
          ? '✓ Écarté — mais ce dépôt est hors comptage : l’exercice a été retiré du pool, '
            + 'et le retrait du pool emporte toutes les copies non rendues.'
          : '✓ Écarté — l’exercice reste à son comptage.'}
      {' '}Vous pouvez encore changer d’avis ci-dessous.
    </p>
  )
}

/**
 * ⭐⭐ CE QUI SE PÉRIME, DIT AVANT LE GESTE ET NON APRÈS.
 *
 * « Un exercice retiré par le professeur sort du dénominateur, MAIS POUR
 *   L'AVENIR SEULEMENT : une semaine dont le compte est déjà arrêté ne se
 *   recalcule pas » (`06-` §5). Le compte d'une semaine est arrêté par le cron
 *   du lundi 18:00 UTC. Arbitrage de Louis (31/08) : **on garde la règle**, et
 *   l'écran affiche le délai — plutôt qu'un bouton dont l'effet aurait disparu
 *   sans qu'on le dise.
 */
function FenetreDAssiduite({ depassee, heures }: { depassee: boolean; heures: number | null }) {
  if (heures === null) return null
  if (depassee) {
    return (
      <p className="rounded-lg border border-bordure bg-parchemin px-2.5 py-1.5 font-ui text-xs
                    text-encre-douce">
        La semaine de cet exercice est <strong>déjà comptée</strong> : trancher reste utile pour
        l’exercice et pour l’élève, mais son assiduité de cette semaine-là ne bougera plus.
      </p>
    )
  }
  return (
    <p className="rounded-lg border border-attention/35 bg-attention-teinte px-2.5 py-1.5
                  font-ui text-xs text-encre">
      À trancher sous <strong>{heures} h</strong> pour que l’assiduité de cette semaine en tienne
      compte — le comptage tombe le lundi à 18:00 UTC.
    </p>
  )
}

// ============================================================================
// L'INVENTAIRE DES EXAMENS PASSÉS, CÔTÉ ÉLÈVE — et la porte de son retour.
// ----------------------------------------------------------------------------
// « Un écran sans porte n'existe pas. »                       — `07-` §2, C4-L6
//
// ⭐ CE QUE CE COMPOSANT RÉPARE, ET IL A ÉTÉ MESURÉ EN PROD LE 27/08 : quatorze
//    retours d'examen diagnostique PUBLIÉS, `lu_at` NULL sur les quatorze.
//    L'écran qui les rend — `app/eleve/modules/{codex,aletheia}/passation/[depotId]`
//    — existait, complet, avec son bouton « J'ai lu mon retour ». **Rien n'y
//    menait une fois la copie remise.**
//
// ⚠️ CE N'EST PAS `SignalDeLancement`, ET LES DEUX NE SE RECOUVRENT JAMAIS :
//    celui-là est un signal de MOMENT (`statut = 'ouvert'`, il s'éteint à la
//    remise), celui-ci est l'INVENTAIRE de ce qui est passé
//    (`STATUTS_APRES_REMISE`, qui exclut `ouvert`). Deux événements, deux
//    affichages — on n'en fabrique pas un seul pour les deux (C4-L9).
//
// ⛔ AUCUNE LETTRE, AUCUNE NOTE, AUCUN POURCENTAGE (`06-` §5 ; `01-` §9) : « un
//    onglet qui range des exercices n'est pas un endroit où l'on découvre son
//    niveau ». On ne dit que l'ÉTAT DU GESTE, par `etatDeLExercice`.
// ============================================================================

import Link from 'next/link'
import type { ExamenDeClasse } from '@/utils/codex-onglets/liste'
import type { TonEtat } from '@/utils/codex-onglets/regles'

/** Les jetons de `globals.css`, jamais de hex en dur (règle projet). */
const TON: Record<TonEtat, string> = {
  a_lire:   'bg-attention-teinte text-attention',
  a_faire:  'bg-attention-teinte text-attention',
  en_cours: 'bg-info-teinte text-info',
  attente:  'bg-parchemin-fonce text-muet',
  clos:     'bg-parchemin-fonce text-muet',
}

export default function MesExamensPasses({ examens }: { examens: ExamenDeClasse[] }) {
  if (examens.length === 0) return null
  const aLire = examens.filter((e) => e.etat.ton === 'a_lire').length

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muet">Mes examens passés</h3>

      {/* ⭐ L'OBLIGATION DE LECTURE EST UNE RÈGLE, PAS UNE DÉCORATION
          (`02-` §6.D, étape 17) : quand il y a quelque chose à lire, on le dit
          en tête, avant la liste — le même geste que « À faire : retours à
          lire » qui existait déjà pour la synthèse en classe. */}
      {aLire > 0 && (
        <div className="bg-attention-teinte border border-attention rounded-xl p-4">
          <p className="font-medium text-attention text-sm">
            À faire : {aLire} retour{aLire > 1 ? 's' : ''} à lire
          </p>
          <p className="text-xs text-attention">
            Ouvre-le, lis-le, puis appuie sur « J&apos;ai lu mon retour ».
          </p>
        </div>
      )}

      <div className="space-y-2">
        {examens.map((e) => (
          <Link
            key={e.depotId}
            href={e.href}
            className="flex items-center justify-between gap-3 bg-surface border border-bordure rounded-xl px-4 py-3 hover:border-pigment transition-colors"
          >
            <p className="text-sm font-medium text-encre truncate">{e.titre}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${TON[e.etat.ton]}`}>
              {e.etat.libelle}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

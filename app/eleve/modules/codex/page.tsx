// ============================================================================
// C4 · L6 — L'ONGLET EXERCICES DE L'ÉLÈVE : ce qui se fait À LA MAISON.
// ----------------------------------------------------------------------------
// « Côté élève : EXERCICES, où il passe ce qui lui est donné, et Examens […].
//   Le partage de la face élève est celui du `06-Palimpseste.md` §1 — ce qui se
//   fait à la maison, et ce qui se rédige en classe. »        — `07-` §2, C4-L6
//
// ⭐ LA PORTE LA PLUS IMPORTANTE DU LOT EST ICI. `app/eleve/modules/codex/exercice/[depotId]`
//    — le déroulé à six temps de C4-L3 — n'était lié DEPUIS NULLE PART : aucun
//    `href` du dépôt ne le désignait, et l'écran ne s'atteignait qu'en tapant
//    l'identifiant d'un dépôt. *Un écran sans porte n'existe pas.*
//
// ⛔ CE N'EST PAS UN TABLEAU DE BORD, ET SURTOUT PAS « L'ÉCRAN DE LA SEMAINE ».
//    « Le tableau de bord est le point d'entrée du cycle » (`01-` §2) et l'écran
//    de la semaine — sa frise, sa barre de progrès — est **C6-L2**. Cet onglet
//    est UNE LISTE ET UNE PORTE, pas un second point d'entrée qui recomposerait
//    la semaine. ⚠️ Il ne change pas non plus la page du cycle : « le cycle se
//    fait sur une page unique […] seul l'en-tête change » — c'est
//    `components/deroule/EcranDeroule`, et il reste tel quel.
//
// ⛔ AUCUNE LETTRE, AUCUNE NOTE, AUCUN POURCENTAGE DE COMPLÉTION (`06-` §5 ;
//    `01-` §9) : « un onglet qui range des exercices n'est pas un endroit où
//    l'on découvre son niveau », et les agrégats sont ceux du professeur (C4-L2).
// ============================================================================

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { seuilModule } from '@/app/eleve/seuil-module'
import { lireLaPorte } from '@/utils/deroule/acces'
import { exercicesMaisonDeLEleve } from '@/utils/codex-onglets/liste'
import type { TonEtat } from '@/utils/codex-onglets/regles'

/** Les jetons de `globals.css`, jamais de hex en dur (`AGENTS.md`). */
const PASTILLE: Record<TonEtat, string> = {
  a_lire:   'bg-attention-teinte text-attention',
  a_faire:  'bg-info-teinte text-info',
  en_cours: 'bg-info-teinte text-info',
  attente:  'bg-parchemin-fonce text-muet',
  clos:     'bg-parchemin-fonce text-muet',
}

export default async function CodexElevePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: module } = await supabase
    .from('modules')
    .select('id, actif')
    .eq('slug', 'codex')
    .single()

  // ⚠️ LES DEUX GARDES PRÉCÈDENT LE CONTENU DE L'ONGLET (`modules.actif`, puis
  //    le seuil : classe en contexte, et cette classe a-t-elle Codex ?). Elles
  //    sont les mêmes sous Examens — un onglet qu'on clique doit dire POURQUOI
  //    il refuse, jamais rendre une page vide.
  if (!module?.actif) {
    return (
      <div className="text-center py-16 text-muet text-sm">Ce module n&apos;est pas encore activé.</div>
    )
  }

  const seuil = await seuilModule(supabase, user.id, module.id, 'Codex')
  if (seuil.type === 'ecran') return seuil.noeud

  // ⚠️ LA CLASSE EN CONTEXTE BORNE LA LISTE : « dans les modules on reste par
  //    classe » (`01-` §2). Le seuil vient de la résoudre — on ne la relit pas.
  const admin = createAdminClient()
  const [porte, exercices] = await Promise.all([
    // `exercices_actif` — l'interrupteur du `07-` §5 qui répond à « les élèves
    // peuvent-ils faire des exercices ? ». Ce lot n'en allume aucun, n'en crée
    // aucun, et n'en détourne aucun autre : il le LIT, pour expliquer un vide.
    lireLaPorte(admin),
    exercicesMaisonDeLEleve(admin, user.id, seuil.inscription.classe_id),
  ])

  return (
    <div>
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce mb-6 inline-flex items-center gap-1">
        ← Retour
      </Link>

      {/* Identité du module portée par la Barre 2 ; on garde la consigne. */}
      <p className="text-sm text-muet mb-6 mt-2">
        Ce que tu écris <strong>à la maison</strong>, à l&apos;écran.
      </p>

      {exercices.length > 0 ? (
        <section>
          <h3 className="text-sm font-medium text-muet mb-3">Mes exercices</h3>
          <div className="space-y-2">
            {exercices.map((e) => (
              <Link
                key={e.depotId}
                href={e.href}
                className="flex items-center justify-between gap-3 bg-surface border border-bordure rounded-xl px-4 py-3 hover:border-pigment transition-colors"
              >
                <p className="text-sm font-medium text-encre truncate min-w-0">{e.titre}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PASTILLE[e.etat.ton]}`}>
                  {e.etat.libelle}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        // ⭐ UN VIDE EXPLIQUÉ, JAMAIS UN ONGLET QUI CLIGNOTE (piège 41). Les
        //    deux causes ne se disent pas de la même façon : la porte fermée
        //    n'est pas « rien à faire », et l'élève n'a pas à connaître le nom
        //    d'un interrupteur pour comprendre pourquoi son écran est vide.
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-muet text-sm">
            {porte.exercicesActifs
              ? 'Aucun exercice pour le moment. Ceux que ton professeur te donne apparaîtront ici.'
              : 'Les exercices ne sont pas encore ouverts. Ton professeur t’indiquera quand ils commencent.'}
          </p>
        </div>
      )}
    </div>
  )
}

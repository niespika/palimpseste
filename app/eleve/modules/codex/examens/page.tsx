// ============================================================================
// C4 · L6 — L'ONGLET EXAMENS DE L'ÉLÈVE : ce qui se rédige EN CLASSE.
// ----------------------------------------------------------------------------
// « Côté élève : Exercices, où il passe ce qui lui est donné, et EXAMENS, où
//   vivent la SYNTHÈSE EN CLASSE et les EXAMENS DIAGNOSTIQUES. »
//                                                            — `07-` §2, C4-L6
//
// ⭐ LE PARTAGE N'EST PAS ARBITRAIRE : c'est la table du `06-` §1. *« Écriture
//    diagnostique, EN CLASSE → Codex, manuscrit → photos → transcription »* →
//    ici. Et *« la synthèse en classe est EN CLASSE »* (`01-` §10) : elle vient
//    ici avec les examens diagnostiques, pas sous Exercices.
//
// ⚠️ CE LOT NE CONSTRUIT RIEN DE CE QUI SUIT — il le RANGE. Le signal de
//    lancement est de C4-L9, la synthèse et son historique existaient déjà sur
//    la racine du module : ils DÉMÉNAGENT, ils ne se réécrivent pas.
//
// ⚠️ LE SIGNAL DE LANCEMENT NE VA PAS SOUS EXERCICES : « celui-là naît de
//    l'ASSIGNATION, celui-ci du LANCEMENT — deux événements, deux signaux ».
// ============================================================================

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { seuilModule } from '@/app/eleve/seuil-module'
import { contexteClasseEleve } from '@/app/eleve/contexte-classe'
import { chargerSyntheseActive, chargerHistorique } from '../actions'
import { createAdminClient } from '@/utils/supabase/admin'
import { signauxDeLancement } from '@/utils/examens/signal'
import SignalDeLancement from '@/components/examens/SignalDeLancement'
import { examensEnClasseDeLEleve } from '@/utils/codex-onglets/liste'
import MesExamensPasses from '@/components/examens/MesExamensPasses'
import { epreuvesDeLEleve, signatureDesEpreuves } from '@/utils/examens/epreuve-serveur'
import VeilleDesEpreuves from '@/components/examens/VeilleDesEpreuves'
import { chargerVueEleve } from '@/utils/passation/vues'
import { EcranEleve } from '@/components/passation/EcranEleve'
import { CONFIRMATION_AVANT_VALIDATION } from '@/utils/examens/epreuve'

export default async function ExamensCodexElevePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: module } = await supabase
    .from('modules')
    .select('id, actif')
    .eq('slug', 'codex')
    .single()

  // ⚠️ LES DEUX GARDES PRÉCÈDENT LE CONTENU DE L'ONGLET, et elles sont les mêmes
  //    que sous Exercices : un onglet qu'on clique doit dire POURQUOI il refuse,
  //    jamais rendre une page vide.
  if (!module?.actif) {
    return (
      <div className="text-center py-16 text-muet text-sm">Ce module n&apos;est pas encore activé.</div>
    )
  }

  // ⭐ 24/09 — L'ÉPREUVE ACTIVE PASSE AVANT LE SEUIL DE CLASSE (revue du 24/09) :
  //    elle appartient à l'élève, pas à la classe choisie dans l'en-tête. Un élève
  //    de deux classes resté sur « Toutes » (ou sur l'autre) la voit quand même,
  //    au-dessus de l'écran-seuil. Seules comptent les classes où il est INSCRIT.
  const admin = createAdminClient()
  const { inscriptions } = await contexteClasseEleve(supabase, user.id)
  const epreuves = await epreuvesDeLEleve(admin, user.id, inscriptions.map((i) => i.classe_id))
  const vues = (await Promise.all(epreuves.enCours.map((e) =>
    chargerVueEleve(admin, e.depotId, user.id, { avecPhotos: true }))))
    .filter((v) => v !== null)
  const ecransDEpreuve = (
    <>
      {vues.map((vue) => (
        <div key={vue.depotId} className="mb-10">
          <EcranEleve vue={vue} refonte confirmation={CONFIRMATION_AVANT_VALIDATION} />
        </div>
      ))}
      {/* La veille : porte ouverte, l'onglet sonde les épreuves actives et ne se
          recharge qu'à un changement — une épreuve lancée apparaît sans que l'élève
          recharge, même si ses durées ont été fixées au dernier moment (3ᵉ revue). */}
      <VeilleDesEpreuves actif={epreuves.porteOuverte} signature={signatureDesEpreuves(epreuves)} />
    </>
  )

  const seuil = await seuilModule(supabase, user.id, module.id, 'Codex')
  if (seuil.type === 'ecran') {
    return <div>{ecransDEpreuve}{seuil.noeud}</div>
  }

  // C4-L9 — le signal du LANCEMENT (jamais celui de l'assignation, qui est
  // C6-L2). Lecture par le SERVEUR, filtrée sur `eleve_id` : le moteur ne
  // porte AUCUNE policy élève, et ce lot n'en ouvre pas.
  // ⭐ LE TROU DU 27/08 : `examensEnClasseDeLEleve` est la SEULE porte vers le
  //    retour d'un examen une fois la copie remise. Le signal ci-dessus s'éteint
  //    à la remise (« il ouvre l'entrée, il ne suit pas le déroulé », C4-L9), et
  //    l'onglet Exercices filtre `lieu = 'maison'` : quatorze retours publiés
  //    étaient lisibles PAR PERSONNE, faute de lien. La liste naît derrière ses
  //    DEUX portes, lues dans `liste.ts` et non ici.
  // ⭐ 24/09 — L'ÉPREUVE MINUTÉE (porte `epreuve_minutee_actif`) : lue plus haut,
  //    AVANT le signal, parce que sa lecture OUVRE le dépôt si la moitié du temps
  //    est passée — le signal dit alors l'état vrai. Porte fermée : rien.
  // ⭐ 24/09 — commentaires de Louis sur la planche : l'onglet DEVIENT l'écran de
  //    l'épreuve active (« si le dépôt est ouvert, il ne faut pas que l'élève ait à
  //    appuyer, on doit directement voir le bouton pour faire le dépôt »). Le même
  //    écran que la page du dépôt, chargé par la même fonction, qui refuse un
  //    dépôt qui n'est pas le sien.
  const [synthese, historique, signaux, examens] = await Promise.all([
    chargerSyntheseActive(), chargerHistorique(),
    signauxDeLancement(admin, user.id, 'codex'),
    examensEnClasseDeLEleve(admin, user.id, seuil.inscription.classe_id, 'codex'),
  ])
  const live = synthese && (synthese.statut === 'phase_1' || synthese.statut === 'phase_2') ? synthese : null

  // À faire : les retours validés mais NON LUS. L'obligation de lecture est une
  // RÈGLE, pas une décoration (`02-` §6.D, étape 17) — elle reste visible sous
  // l'onglet où vit la chose à lire.
  const aLire = historique.filter((s) => s.validee && !s.lu)

  return (
    <div>
      {/* Une épreuve active occupe le haut de l'onglet : rien ne passe avant elle. */}
      {vues.length === 0 && (
        <p className="text-sm text-muet mb-6">
          Ce qui se rédige <strong>en classe</strong> : la synthèse en classe et les examens diagnostiques.
        </p>
      )}

      {ecransDEpreuve}
      {/* L'épreuve active est déjà à l'écran : son signal se tait — mais seulement
          si son écran s'est RÉELLEMENT rendu (3ᵉ revue : une lecture ratée ne laisse
          plus l'élève sans l'écran ET sans le lien). */}
      <SignalDeLancement signaux={signaux.filter((s) => !vues.some((v) => v.depotId === s.depotId))} />

      {live && (
        <Link
          href={`/eleve/modules/codex/synthese/${live.id}`}
          className="block bg-ok-teinte border border-ok rounded-xl p-5 hover:opacity-90 transition-colors mb-6"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-ok animate-pulse shrink-0" />
            <div>
              <p className="font-medium text-ok text-sm">Synthèse en classe — {live.unite_label}</p>
              <p className="text-xs text-ok">
                {live.statut === 'phase_1'
                  ? 'Phase 1 : écris ta V1, livre fermé → appuie pour commencer'
                  : 'Phase 2 : réécris ta V-finale avec les suggestions → appuie pour continuer'}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* À faire : retour(s) à lire */}
      {aLire.length > 0 && (
        <Link
          href={`/eleve/modules/codex/synthese/${aLire[0].id}`}
          className="block bg-attention-teinte border border-attention rounded-xl p-4 hover:opacity-90 transition-colors mb-6"
        >
          <p className="font-medium text-attention text-sm">
            À faire : {aLire.length} retour{aLire.length > 1 ? 's' : ''} à lire
          </p>
          <p className="text-xs text-attention">
            {aLire.length === 1 ? aLire[0].unite_label : `dont ${aLire[0].unite_label}`} → appuie pour le consulter
          </p>
        </Link>
      )}

      {/* Les examens diagnostiques passés, et la porte de leur retour. ⚠️ AVANT
          les synthèses : c'est là que vit l'obligation de lecture du `02-` §6.D. */}
      <div className="mb-6">
        {/* L'épreuve encore à l'écran n'est pas « passée » : pas de double (revue du 24/09). */}
        <MesExamensPasses examens={examens.filter((e) => !vues.some((v) => v.depotId === e.depotId))} />
      </div>

      {historique.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-muet mb-3">Mes synthèses en classe</h3>
          <div className="space-y-2">
            {historique.map((s) => (
              <Link
                key={s.id}
                href={`/eleve/modules/codex/synthese/${s.id}`}
                className="flex items-center justify-between gap-3 bg-surface border border-bordure rounded-xl px-4 py-3 hover:border-pigment transition-colors"
              >
                <p className="text-sm font-medium text-encre truncate">{s.unite_label}</p>
                {s.validee && !s.lu ? (
                  <span className="text-xs px-2 py-0.5 bg-attention-teinte text-attention rounded-full shrink-0">à lire</span>
                ) : s.validee && s.lu ? (
                  <span className="text-xs px-2 py-0.5 bg-parchemin-fonce text-muet rounded-full shrink-0">lu</span>
                ) : (
                  <span className="text-xs text-muet shrink-0">en attente</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!live && signaux.length === 0 && vues.length === 0 && historique.length === 0
        && examens.length === 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-muet text-sm">
            Rien en classe pour le moment. Ton professeur t&apos;indiquera quand une synthèse
            ou un examen commence.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// C5 · L4 — L'ONGLET EXAMENS DE L'ÉLÈVE : ce qui se passe EN CLASSE.
// ----------------------------------------------------------------------------
// « Côté élève : Livres […], Exercices […], et EXAMENS, où vit la passation en
//   classe. »                                                 — `07-` §2, C5-L4
//
// ⭐ LE PARTAGE EST CELUI DU `06-` §1 : « lecture diagnostique, EN CLASSE » ici ;
//    « lecture formative, à la maison » sous Exercices.
//
// ⚠️ LE SIGNAL DE LANCEMENT VA ICI, ET PAS SOUS EXERCICES : « celui-là naît de
//    l'ASSIGNATION, celui-ci du LANCEMENT — deux événements, deux signaux »
//    (C4-L9). Il vivait sur la RACINE élève, faute d'onglet : il déménage, son
//    code ne bouge pas d'une ligne.
//
// ⭐ C'EST LA SEULE PORTE VERS `app/eleve/modules/aletheia/passation/[depotId]`,
//    et elle l'était déjà — l'écran ne s'atteignait qu'en connaissant
//    l'identifiant du dépôt tant que le signal était noyé sous les livres.
//
// ⛔ CET ONGLET NE PORTE QUE LES EXAMENS DIAGNOSTIQUES DE LECTURE — l'explication
//    de texte de la semaine 1 (`01-` §10). ⛔ AUCUNE « SYNTHÈSE EN CLASSE » : elle
//    est une ÉCRITURE (`06-` §1), elle vit dans Codex, et « son nom est "la
//    synthèse en classe", et pas un autre » (`01-` §10).
//
// ⚠️ LES DEUX PORTES DU SIGNAL SE LISENT DANS `signauxDeLancement`, jamais ici :
//    `exercices_actif` ET `passation_classe_actif`, LE PLUS FERMÉ GAGNANT
//    (`passationOuverteAEleve`) — c'est exactement ce que `garderEleve` applique
//    à la page de passation elle-même. « Une garde qu'on peut oublier en
//    écrivant un second écran n'est pas une garde. »
// ============================================================================

import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { signauxDeLancement } from '@/utils/examens/signal'
import SignalDeLancement from '@/components/examens/SignalDeLancement'
import { seuilAletheia } from '../gardes'

export default async function ExamensAletheiaElevePage() {
  // ⛔ LES QUATRE GARDES D'ABORD — les mêmes que sous Livres et sous Exercices.
  const seuil = await seuilAletheia()
  if (seuil.type === 'ecran') return seuil.noeud

  // C4-L9 — le signal du LANCEMENT (jamais celui de l'assignation, qui est
  // C6-L2). Lecture par le SERVEUR, filtrée sur `eleve_id` dans le code : le
  // moteur ne porte AUCUNE policy élève, et ce lot n'en ouvre pas.
  const signaux = await signauxDeLancement(createAdminClient(), seuil.userId, 'aletheia')

  return (
    <div className="space-y-6 pb-8">
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>

      <div>
        <h2 className="font-titre text-xl text-encre">Mes examens de lecture</h2>
        <p className="font-corps text-sm text-muet mt-1">
          Ce qui se passe <strong>en classe</strong>, sur papier : ton professeur ouvre le
          dépôt, tu photographies ta copie.
        </p>
      </div>

      <SignalDeLancement signaux={signaux} />

      {signaux.length === 0 && (
        // ⭐ UN VIDE EXPLIQUÉ, JAMAIS UN ÉCRAN QUI SE TAIT (`07-` §5). ⚠️ Ici il
        //    n'y a QU'UN vide à dire, et c'est voulu : `SignalDeLancement` est
        //    un signal de MOMENT — il s'allume à l'ouverture du dépôt et s'éteint
        //    à la remise. « Rien en ce moment » couvre donc à la fois la porte
        //    fermée et l'absence d'examen, sans apprendre à l'élève le nom d'un
        //    interrupteur qu'il ne peut pas actionner.
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-muet text-sm">
            Rien en classe pour le moment. Ton professeur t&apos;indiquera quand un examen
            de lecture commence.
          </p>
        </div>
      )}
    </div>
  )
}

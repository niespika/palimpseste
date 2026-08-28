'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { jourDansFuseau } from '@/utils/fuseau'
import { lundiOnOrBefore, toISODate } from '@/utils/calendrier-grille'
import { servirUnExerciceDePlus } from '@/utils/moteur/bonus-serveur'
import { phraseDuRefus } from '@/utils/routeur/bonus'

// ============================================================================
// C6 · L3 — LE PULL, CÔTÉ ÉCRAN. La SEULE écriture de ce lot.
// ----------------------------------------------------------------------------
// ⛔⛔ AUCUN `export type` ICI. « `export type` dans un module `'use server'` TUE
//    TOUT LE MODULE À L'EXÉCUTION » — et `tsc`, `npm test` et les recettes
//    passent tous les trois sans rien dire. Les types du pull vivent à
//    `utils/moteur/bonus-serveur.ts`.
//
// ⛔⛔ L'IDENTITÉ VIENT DE LA SESSION, JAMAIS D'UN PARAMÈTRE. C'est la première
//    écriture de dépôt déclenchée par un élève dans tout le dépôt : un
//    identifiant reçu du client laisserait un élève **assigner un exercice à un
//    autre**. ⚠️ Et le RÔLE se vérifie, comme `garderEleveDeroule` le fait pour
//    le déroulé — « le client admin qui suit CONTOURNE LA RLS : sans ce contrôle,
//    la seule chose qui distinguerait un élève d'un professeur serait l'URL ».
//
// ⚠️ AUCUN CRLF ICI — cette action n'a aucun argument, donc aucun `<textarea>`.
//    (La règle reste : un formulaire rend du CRLF, la base stocke du LF, et
//    `new FormData()` ne le montre pas — server actions React comprises.)
//
// ⛔ ET AUCUN BOOLÉEN D'ÉCRAN NE GARDE LE DOUBLE CLIC. La garde est mécanique et
//    elle est en base (`uk_depots_eleve_exercice`) : « l'insertion EST le claim ;
//    la seconde perd AVANT d'avoir rien écrit » (`07-` §1.1). Un `disabled` de
//    bouton ne survit ni à un second onglet ni à un double clic rapide.
// ============================================================================

/**
 * ⭐ « L'élève demande UN exercice de plus et il le REÇOIT » — et ce qu'il reçoit
 *    est un dépôt réel, qui ouvre le déroulé à six temps comme n'importe lequel.
 *
 * Rend un objet plat — jamais un booléen : « le silence est un mensonge », et
 * chacun des refus a sa phrase (`utils/routeur/bonus.ts`).
 */
export async function demanderUnExerciceDePlus(): Promise<{
  servi: boolean
  href: string | null
  phrase: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { servi: false, href: null, phrase: phraseDuRefus('incident') }

  const { data: moi } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if ((moi as { role?: string } | null)?.role !== 'eleve') {
    return { servi: false, href: null, phrase: phraseDuRefus('incident') }
  }

  const admin = createAdminClient()
  const fuseau = await lireFuseau()
  // ⚠️ UN CYCLE EST UNE SEMAINE DE LUNDI À DIMANCHE DANS LE FUSEAU DE L'ÉCOLE.
  //    On ne recalcule pas un lundi à la main, et surtout pas pour une écriture
  //    dont `assigne_at` dépend.
  const aujourdHui = jourDansFuseau(new Date(), fuseau)
  const cycleLundi = toISODate(lundiOnOrBefore(aujourdHui))

  // ⛔ LA DEMANDE PORTE TOUJOURS SUR LE CYCLE EN COURS, jamais sur celui que
  //    l'écran regarde : « les minutes non utilisées sont PERDUES, sans report »
  //    — un quota de semaine passée ne se rattrape pas, et l'ouvrir en donnerait
  //    la possibilité en silence.
  const r = await servirUnExerciceDePlus(admin, user.id, cycleLundi, fuseau, aujourdHui)

  if (r.incidents.length > 0) {
    console.error(`[bonus] incidents — élève=${user.id} cycle=${cycleLundi}`, r.incidents)
  }
  revalidatePath('/eleve/semaine')
  revalidatePath('/eleve')

  return {
    servi: !!r.servi,
    // ⭐ On ne fabrique pas l'adresse du déroulé ici : la liste de la semaine la
    //   porte déjà (`hrefDuDeroule`), et l'écran se recharge sur elle. Rendre un
    //   lien construit à la main serait un second domicile de la même route.
    href: null,
    phrase: r.phrase,
  }
}

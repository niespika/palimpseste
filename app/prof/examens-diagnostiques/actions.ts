'use server'

// ============================================================================
// C4 · L9 — LE GESTE DE CONCEPTION, POUR LES DEUX MODULES.
// ----------------------------------------------------------------------------
// « Il valide, l'instance naît avec `lieu = classe`, et la ligne de plan passe
//   *conçue*. »                                               — `07-` §2, C4-L9
//
// Un seul geste, deux entrées : ce dossier ne porte AUCUNE page — il n'ouvre
// donc aucune route. Les deux écrans vivent dans leur module
// (`/prof/codex/examen-diagnostique/[planifieId]` et son jumeau Aletheia),
// parce que « les sommatifs se conçoivent CHACUN DANS SON MODULE » (`02-` §6 B).
//
// ⚠️ CE FICHIER NE RÉORGANISE PAS LA NAVIGATION : il ne s'ajoute pas aux
//    sous-onglets de `components/nav/configModules.ts` — « un module = 2-3
//    onglets » (`AGENTS.md`), et les onglets sont C4-L6 et C5-L4.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/fabrique/acces'
import { concevoirExamenDiagnostique } from '@/utils/examens/conception'
import { MODULES_EXAMEN, type ModuleExamen } from '@/utils/examens/types'
import { CHAMPS_IDENTITE, ecartsDIdentite, tracesPresentes } from '@/utils/examens/deplacement'
import { depotPorteDuContenu, type DepotPourRetrait } from '@/utils/examens/retrait'

export interface RetourExamen {
  ok: boolean
  message: string
  empechements?: string[]
  exerciceId?: string
  classeId?: string
}

export async function concevoirExamen(
  _prec: RetourExamen | null, form: FormData,
): Promise<RetourExamen> {
  const { admin } = await garderProf(false)

  const planifieId = String(form.get('planifie_id') ?? '')
  const matiereId = String(form.get('matiere_id') ?? '')
  const consigne = String(form.get('consigne') ?? '')
  // `mod` et non `module` : Next.js interdit d'assigner cet identifiant.
  const mod = String(form.get('module') ?? '') as ModuleExamen
  if (!MODULES_EXAMEN.includes(mod)) {
    return { ok: false, message: 'Module inconnu : un examen diagnostique vit dans Codex ou dans Aletheia.' }
  }

  const issue = await concevoirExamenDiagnostique(admin, planifieId, matiereId, consigne, {
    // ⭐ LES DEUX DRAPEAUX D'OPT-IN DE CLASSE (`02-` §5 ; §1.1). L'écran DOIT
    //    les offrir : sans eux, « une passation en classe ne produit AUCUN
    //    signal de Monitoring », et « une année de collecte manquée ne se
    //    rattrape pas ». Ils restent levables jusqu'à l'ouverture du dépôt
    //    (C4-L4, `leverLesDrapeaux`) — ici, c'est la première occasion.
    seJuger: form.get('optin_se_juger') === 'oui',
    confianceRemise: form.get('optin_confiance_remise') === 'oui',
  })
  if (!issue.ok) {
    return { ok: false, message: issue.message, ...(issue.empechements ? { empechements: issue.empechements } : {}) }
  }

  revalidatePath(`/prof/${mod}`)
  revalidatePath(`/prof/${mod}/examen-diagnostique/${planifieId}`)
  revalidatePath('/prof/conception')
  return {
    ok: true,
    exerciceId: issue.data.exerciceId,
    classeId: issue.data.classeId,
    message: 'Examen diagnostique conçu — l’instance porte `lieu = classe`, et la ligne de plan '
      + 'est passée « conçue ». Assignez-la à sa classe pour que les dépôts naissent, '
      + 'puis ouvrez-les le jour de l’épreuve.',
  }
}

// ============================================================================
// RÉUNIR DEUX CONCEPTIONS DU MÊME EXAMEN — le déplacement d'un dépôt.
// ----------------------------------------------------------------------------
// Il arrive qu'un même examen soit conçu DEUX FOIS pour une classe et que les
// copies se répartissent entre les deux instances (constaté sur 1HLP le 25/08 :
// seize d'un côté, une de l'autre). Les réunir suppose de faire changer un
// dépôt d'exercice.
//
// ⛔ CE N'EST PAS UN COPIER-COLLER DE CELLULE. Le texte a été écrit CONTRE un
//    sujet, et la chaîne juge la copie contre la référence de SON exercice.
//    Rattacher une copie à un exercice d'un autre énoncé ne planterait rien :
//    la chaîne mesurerait une dissertation contre la mauvaise référence, et
//    l'élève recevrait un retour qui parle d'autre chose. La faute ne se verrait
//    qu'à la lecture du retour, des semaines plus tard. D'où trois refus.
// ============================================================================

export interface RetourDeplacement { ok: boolean; message: string; details?: string[] }

export async function deplacerDepotVersExercice(
  _prec: RetourDeplacement | null, form: FormData,
): Promise<RetourDeplacement> {
  const { admin } = await garderProf(false)
  const depotId = String(form.get('depot_id') ?? '')
  const cibleId = String(form.get('exercice_cible_id') ?? '')
  if (!depotId || !cibleId) return { ok: false, message: 'Dépôt ou exercice cible manquant.' }

  const { data: depot, error: eDepot } = await admin
    .from('exercices_depots').select('id, eleve_id, exercice_id, statut').eq('id', depotId).maybeSingle()
  if (eDepot) return { ok: false, message: `Dépôt illisible : ${eDepot.message}` }
  if (!depot) return { ok: false, message: 'Ce dépôt n’existe pas.' }
  const d = depot as unknown as { id: string; eleve_id: string; exercice_id: string; statut: string }
  if (d.exercice_id === cibleId) return { ok: false, message: 'Ce dépôt est déjà sur cet exercice.' }

  // ── Refus 1 — les deux exercices ne sont pas le même pour la MESURE ────────
  const champs = ['id', ...CHAMPS_IDENTITE].join(', ')
  const { data: exos, error: eExos } = await admin
    .from('exercices').select(champs).in('id', [d.exercice_id, cibleId])
  if (eExos) return { ok: false, message: `Exercices illisibles : ${eExos.message}` }
  const paire = (exos ?? []) as unknown as Array<Record<string, unknown>>
  const source = paire.find((e) => e.id === d.exercice_id)
  const cible = paire.find((e) => e.id === cibleId)
  if (!source || !cible) return { ok: false, message: 'Exercice source ou cible introuvable.' }

  const ecarts = ecartsDIdentite(source, cible)
  if (ecarts.length > 0) {
    return {
      ok: false,
      message: 'Ces deux exercices ne sont pas le même pour la mesure — déplacer la copie la ferait '
        + 'juger contre une autre référence que celle qu’elle visait.',
      details: ecarts.map((c) => `diffère : ${c}`),
    }
  }

  // ── Refus 2 — la chaîne a déjà tourné sur ce dépôt ─────────────────────────
  // Un squelette, une mesure ou un retour sont RATTACHÉS AU DÉPÔT : les laisser
  // suivre un dépôt qui change d'exercice les rendrait incohérents avec lui.
  const compter = async (table: string): Promise<number | { erreur: string }> => {
    const { count, error } = await admin
      .from(table).select('id', { count: 'exact', head: true }).eq('depot_id', depotId)
    if (error) return { erreur: `${table} illisible : ${error.message}` }
    return count ?? 0
  }
  const [sq, me, mo, re, jo] = await Promise.all([
    compter('exercices_squelettes'), compter('competences_mesures'), compter('monitoring_mesures'),
    compter('exercices_retours'), compter('exercices_jobs'),
  ])
  for (const r of [sq, me, mo, re, jo]) {
    if (typeof r !== 'number') return { ok: false, message: r.erreur }
  }
  const traces = tracesPresentes({
    squelettes: sq as number, mesures: me as number, monitoring: mo as number,
    retours: re as number, jobs: jo as number,
  })
  if (traces.length > 0) {
    return {
      ok: false,
      message: 'La chaîne a déjà tourné sur ce dépôt : il ne peut plus changer d’exercice.',
      details: traces.map((t) => `il porte ${t}`),
    }
  }

  // ── Refus 3 — l'élève a déjà un dépôt sur l'exercice cible ─────────────────
  // `uk_depots_eleve_exercice` (UNIQUE eleve_id, exercice_id) l'interdit ; on le
  // traite en clair plutôt que de remonter une violation de contrainte.
  //
  // ⚠️ ET C'EST LE CAS ORDINAIRE, PAS L'EXCEPTION. Un examen conçu deux fois est
  //    ASSIGNÉ deux fois : chaque élève a un dépôt de part et d'autre, presque
  //    toujours nu d'un côté. Refuser sec rendrait la réunion impossible dans
  //    exactement la situation qu'elle vise (constaté sur 1HLP : 25 dépôts ici,
  //    25 là, une seule copie remise en tout).
  //
  // ⭐ Donc : si le dépôt de la cible est VIERGE, il cède la place — il ne porte
  //    rien, et la même règle que le retrait le dit (`depotPorteDuTravail`).
  //    S'il porte du travail, on refuse : deux vraies copies d'un même élève ne
  //    fusionnent pas toutes seules, et choisir laquelle survit n'est pas à une
  //    machine de le faire.
  const { data: surLaCible, error: eDeja } = await admin
    .from('exercices_depots')
    .select('id, statut, texte_v1, texte_vf, transcription_v1, transcription_vf, photos_v1, photos_vf')
    .eq('exercice_id', cibleId).eq('eleve_id', d.eleve_id).maybeSingle()
  if (eDeja) return { ok: false, message: `Vérification impossible : ${eDeja.message}` }
  if (surLaCible) {
    const occupant = surLaCible as unknown as DepotPourRetrait & { id: string }
    // ⭐ L'occupant se juge SUR SON CONTENU, pas sur son statut (décision de Louis,
    //    25/08). Un dépôt seulement OUVERT — l'élève a regardé le doublon sans rien
    //    y écrire — cède la place. Bloquer là-dessus rendait la réunion
    //    structurellement inutile : dans une classe, presque tous auront ouvert le
    //    doublon. Un BROUILLON, lui, bloque toujours : il porte du contenu.
    if (depotPorteDuContenu(occupant)) {
      return { ok: false, message: 'Cet élève a DÉJÀ écrit quelque chose sur l’exercice cible. '
        + 'Les deux ne peuvent pas fusionner toutes seules — c’est à toi de choisir laquelle garder.' }
    }
    // Sans contenu : la place est libérée. Rien d'écrit ne disparaît (mêmes
    // cascades qu'au retrait, et les mesures sont en NO ACTION : la base
    // refuserait si une mesure pendait à ce dépôt).
    const { error: eLib } = await admin.from('exercices_depots').delete().eq('id', occupant.id)
    if (eLib) return { ok: false, message: `Place non libérable sur la cible : ${eLib.message}` }
  }

  // ── Le geste ───────────────────────────────────────────────────────────────
  const { error } = await admin
    .from('exercices_depots').update({ exercice_id: cibleId }).eq('id', depotId)
  if (error) return { ok: false, message: `Déplacement refusé : ${error.message}` }

  revalidatePath('/prof/codex')
  revalidatePath(`/prof/codex/passation/${d.exercice_id}`)
  revalidatePath(`/prof/codex/passation/${cibleId}`)
  return { ok: true, message: 'Dépôt déplacé. L’exercice d’origine peut maintenant être retiré du plan s’il est vide.' }
}

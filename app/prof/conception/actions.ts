'use server'

// ============================================================================
// C4 · L8 — LA CONCEPTION EN LIGNE, l'ÉDITION, l'APERÇU, et les EXERCICES
// COMMUNS.
// ----------------------------------------------------------------------------
// « La conception d'un exercice, en ligne — le choix du type et de la matière,
//   l'instance ASSEMBLÉE DEPUIS SES CHOIX — la consigne de la banque, le
//   matériau et l'appui saisis —, la validation de la référence décomposée, et
//   la création d'EXERCICES COMMUNS à toute une classe. »   — `07-` §2, C4-L8
//
// « L'édition avant validation, et l'aperçu côté élève — RIEN NE PART sans que
//   le professeur ait pu CORRIGER l'instance et LA VOIR telle que l'élève la
//   verra. »
//
// ⚠️ CONTRAINTE DURE, ET C'EST LA RAISON D'ÊTRE DU LOT : « ce que le professeur
//    fabrique et ce que le routeur assigne écrivent DANS LES MÊMES TABLES. Le
//    jour où l'une des deux voies se construit son propre chemin, il y a deux
//    systèmes d'exercices, et le second est invisible au premier » (`07-` §2).
//    D'où : `exercices` pour l'instance, `exercices_depots` pour l'assignation,
//    et RIEN QUI LEUR SOIT PROPRE.
//
// ⚠️ AUCUN APPEL DE MODÈLE. « Ce qui s'engendre s'engendre au générateur, hors
//    plateforme, et arrive par l'import » (`07-` §2 ; le prompt du lot :
//    « aucune clé d'API, aucune ligne à `api_couts` ne sort de ce lot »).
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/fabrique/acces'
import { chargerDoctrineDepuisBase } from '@/utils/fabrique/doctrine'
import {
  ciblePrimaireDeLInstance, ciblePrimaireRetenue, empechementsDeConception,
} from '@/utils/fabrique/conception'
import { controleReference } from '@/utils/fabrique/verifie-reference'
import { referenceValidee } from '@/utils/reference-validee'

/** Une ligne rendue par Supabase — lue par accesseurs, jamais à l'aveugle. */
type Ligne = Record<string, unknown>
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}

export interface RetourConception {
  ok: boolean
  message: string
  empechements?: string[]
  /** L'instance créée, quand il y en a une. */
  exerciceId?: string
}

interface Cas {
  consigne: string
  defaut: string | null
  distracteurs: string[] | null
  reponseAttendue: string | null
  /** ⭐ C4-L14 — « pourquoi ce candidat-là est le bon » (`08-` §5.2, format 1.2).
   *  Aux crans 1 et 3 seulement ; ailleurs la `reponse_attendue` EST le pourquoi. */
  pourquoiJuste: string | null
  materiauId: string | null
}

/** Une jointure Supabase rend tantôt un objet, tantôt un tableau d'un élément. */
function jointureNature(x: unknown): string | null {
  const v = Array.isArray(x) ? x[0] : x
  const n = (v as { nature?: unknown } | null)?.nature
  return typeof n === 'string' ? n : null
}

function lireCas(form: FormData, n: number): Cas[] {
  const out: Cas[] = []
  for (let i = 1; i <= n; i++) {
    const brut = String(form.get(`cas_${i}_distracteurs`) ?? '').trim()
    out.push({
      consigne: String(form.get(`cas_${i}_consigne`) ?? ''),
      defaut: (String(form.get(`cas_${i}_defaut`) ?? '').trim() || null),
      // La BANQUE de distracteurs, une par ligne — « 10 à 15 à la conception,
      // et l'instance y tire les trois candidats » (`02-` §5 et §6).
      distracteurs: brut ? brut.split('\n').map((x) => x.trim()).filter(Boolean) : null,
      reponseAttendue: (String(form.get(`cas_${i}_reponse`) ?? '').trim() || null),
      // ⭐ C4-L14 — LE MÊME PATRON À PLAT, PAR CAS, que les quatre autres champs
      //    de l'appui : une entrée `cas_<i>_pourquoi_juste` par cas.
      pourquoiJuste: (String(form.get(`cas_${i}_pourquoi_juste`) ?? '').trim() || null),
      materiauId: (String(form.get(`cas_${i}_materiau`) ?? '').trim() || null),
    })
  }
  return out
}

/**
 * Concevoir une instance. L'écran a déjà borné la saisie ; ceci la RE-VÉRIFIE
 * avant d'écrire — un écran n'est pas une garde.
 *
 * « L'exercice est GÉNÉRIQUE, et le professeur ne désigne aucune compétence » :
 * il compose un exercice, et « c'est le routeur qui élit la cible » (`02-` §6 B).
 * Les compétences déclarées ici sont celles que l'instance PEUT mesurer, avec
 * leur mode — jamais une cible.
 */
export async function concevoirInstance(
  _prec: RetourConception | null, form: FormData,
): Promise<RetourConception> {
  const { admin } = await garderProf(false)
  const d = await chargerDoctrineDepuisBase(admin as never)

  const objet = String(form.get('objet') ?? '')
  const mode = String(form.get('mode') ?? '')
  const cran = Number(form.get('cran') ?? 0)
  const genre = (String(form.get('genre') ?? '').trim() || null)
  const lieu = String(form.get('lieu') ?? 'maison')
  const c = d.crans[cran]
  if (!c) return { ok: false, message: 'Cran inconnu.' }

  const competences: Record<string, string> = {}
  for (const comp of form.getAll('competence').map(String)) competences[comp] = mode

  const provenanceSource = (String(form.get('provenance_source') ?? '').trim() || null)
  const provenanceCible = (String(form.get('provenance_cible') ?? '').trim() || null)
  const lireIntervalle = (nom: string): [number, number] | null => {
    const a = form.get(`${nom}_debut`); const b = form.get(`${nom}_fin`)
    if (a === null || b === null || a === '' || b === '') return null
    return [Number(a), Number(b)]
  }
  const saisie = {
    objet, mode, cran, genre, competences,
    provenanceSource, supportSource: (String(form.get('support_source') ?? '').trim() || null),
    provenanceCible, supportCible: (String(form.get('support_cible') ?? '').trim() || null),
    englobant: lireIntervalle('englobant'),
    observableCode: (String(form.get('observable_code') ?? '').trim() || null),
    observableCompetence: (String(form.get('observable_competence') ?? '').trim() || null),
    guide: (String(form.get('guide') ?? '').trim() || null),
    cas: lireCas(form, c.geste === 'diagnostiquer' ? 2 : 1),
  }

  const empechements = empechementsDeConception(d, saisie)
  if (empechements.length > 0) {
    return { ok: false, message: 'La saisie ne passe pas les règles de conception.', empechements }
  }

  // ── LA `cible_primaire` — « l'exercice porte la cible » (`01-` §1) ─────────
  // ⭐ RE-DÉRIVÉE ICI, jamais reçue sur parole : « un écran n'est pas une
  //    garde ». Quand une seule cible est possible, l'écran la pose sans la
  //    demander (`07-` §1.1) et le champ n'est même pas envoyé.
  // ⚠️ Elle reste NULLABLE, et un refus serait un contresens : « sur la voie du
  //    routeur elle reste NULL ». Un `produire` à deux compétences dont le
  //    professeur n'a rien dit sort donc à NULL, et la chaîne le SIGNALE en
  //    alerte au lieu de le taire.
  const regleCible = ciblePrimaireDeLInstance({
    geste: c.geste,
    observableCompetence: saisie.observableCompetence,
    competences: Object.keys(competences),
  })
  const ciblePrimaire = ciblePrimaireRetenue(
    regleCible, String(form.get('cible_primaire') ?? '').trim() || null)

  // ⚠️ « Une référence NON VALIDÉE n'entre JAMAIS en Phase 2 » (`02-` §6 A) : un
  // texte déposé sans décomposition validée ne sert AUCUNE instance qui le
  // vise — en source COMME EN CIBLE (piège 25).
  // ⭐ C4-L11 — LA GARDE N'EST PLUS ICI : elle vit à `utils/reference-validee.ts`,
  //    seule, et la conception d'examen (C4-L9) lit la même. Deux copies d'un
  //    même prédicat sur une même colonne finissent par diverger. Le RÔLE
  //    — source ou cible — reste dit ici : lui seul est propre à cet écran.
  const texteSourceId = (String(form.get('texte_source') ?? '').trim() || null)
  const texteCibleId = (String(form.get('texte_cible') ?? '').trim() || null)
  // ⭐⭐ C5-L2 — ET C'EST ICI QUE `exercices.reference_id` REÇOIT ENFIN UN
  //    ÉCRIVAIN DE PRODUCTION. Elle est déclarée au `07-` §1.1 — « la référence
  //    quand il y en a une » — et PERSONNE ne l'écrivait : l'import y met
  //    littéralement `null`, cet écran ne l'écrivait pas, et seuls l'examen
  //    diagnostique de C4-L9 et les décors de recette la posaient. Trois
  //    conséquences, toutes silencieuses :
  //      (a) `utils/chaine/contexte.ts` ne lit QUE cette colonne : sans elle,
  //          `reference` ET `materiau` restent nuls, et **le modèle à qui l'on
  //          demande de citer l'auteur n'a jamais l'auteur sous la main** — il
  //          ne peut alors citer que ce qu'il trouve, LA COPIE DE L'ÉLÈVE
  //          (`01-` §12, RR3) ;
  //      (b) le trigger `garde_reference_validee` fait `select e.reference_id …`
  //          puis `if v_ref is null then return new` : **il sortait avant de
  //          contrôler quoi que ce soit**. L'écran, lui, mordait déjà — il lit
  //          l'AUTRE colonne, celle du texte. Deux lecteurs, deux colonnes ;
  //      (c) et le canal du texte support ne partait de nulle part.
  //
  // ⛔ AUCUN SECOND DOMICILE. La référence appartient au TEXTE
  //    (`exercices_textes.reference_id`) ; cette colonne en est LA COPIE QUE LA
  //    GARDE EN BASE EXIGE, recopiée au moment exact où le verdict la vérifie,
  //    par la fonction qui la vérifie (`referenceValidee`). Pas une lecture de
  //    plus, pas une règle de plus.
  //
  // ⚠️ C'EST LA SOURCE QUI LA PORTE, JAMAIS LA CIBLE. Le `07-` §1.1 dit « la
  //    référence » au singulier, et la chaîne en descend le TEXTE SOURCE de la
  //    référence (`materiau`) : deux références sur une instance n'auraient pas
  //    de départage. La cible reste contrôlée — le refus vaut pour les deux —,
  //    elle ne se recopie simplement pas.
  let referenceDeLaSource: string | null = null
  for (const [id, role] of [[texteSourceId, 'source'], [texteCibleId, 'cible']] as Array<[string | null, string]>) {
    if (!id) continue
    const verdict = await referenceValidee(admin, id)
    if (!verdict.ok) {
      return { ok: false,
        message: `Le matériau ${role} vise une référence NON VALIDÉE — aucune instance ne tourne dessus.`,
        empechements: [verdict.motif ?? 'valider la référence avant de concevoir (02- §6 A ; 05- §4.4)'] }
    }
    if (role === 'source') referenceDeLaSource = verdict.referenceId
  }

  const { data: type } = await admin.from('exercices_types')
    .select('id').eq('code', objet).single()
  const paire = saisie.cas.length === 2

  const { data, error } = await admin.from('exercices').insert({
    type_id: type?.id,
    lieu,
    // La `consigne_instanciee` : « c'est le TEXTE QU'IL ARRÊTE que l'élève lit ».
    consigne_instanciee: paire ? saisie.cas.map((x) => x.consigne) : saisie.cas[0].consigne,
    paire_diagnostic: paire,
    cran: String(cran),
    cible_primaire: ciblePrimaire,
    genre,
    // ⚠️ « En base, les modes sont UNE LISTE, jamais une valeur » (§1.2) :
    // l'écran enveloppe, comme l'import (piège 19).
    modes_par_competence: Object.fromEntries(
      Object.entries(competences).map(([k, v]) => [k, [v]])),
    materiau_source_provenance: provenanceSource,
    materiau_source_support: saisie.supportSource,
    materiau_cible_provenance: provenanceCible,
    materiau_cible_support: saisie.supportCible,
    materiau_source_texte_id: texteSourceId,
    // ⭐ La copie que la garde en base exige (voir le bloc ci-dessus). NULL dès
    //    que la source n'est pas un texte d'auteur : un exercice d'écriture n'a
    //    pas de référence, et un `reference_id` inventé ferait tirer le trigger
    //    sur une instance qui n'a rien à contrôler.
    reference_id: referenceDeLaSource,
    materiau_source_sujet_id: (String(form.get('sujet_source') ?? '').trim() || null),
    materiau_source_localisation: lireIntervalle('localisation'),
    materiau_source_englobant: saisie.englobant,
    materiau_cible_texte_id: texteCibleId,
    // ⚠️ Un sujet choisi comme CIBLE se range en cible. Il partait en source, et
    //    `materiau_cible_provenance` restait `sujet` sans identifiant.
    materiau_cible_sujet_id: (String(form.get('sujet_cible') ?? '').trim() || null),
    materiau_cible_localisation: lireIntervalle('localisation_cible'),
    materiau_cible_englobant: lireIntervalle('englobant_cible'),
    observable_isole_code: saisie.observableCode,
    observable_isole_competence: saisie.observableCompetence,
    guide: saisie.guide,
    // « Elle NAÎT `a_concevoir` et PASSE `concu` quand le professeur l'a
    // conçue » (§1.1 ; §5) — la conception en ligne la pose donc `concu`.
    statut: 'concu',
    // LES DEUX DRAPEAUX D'OPT-IN — faux par défaut, lus sur le `lieu` seul,
    // SANS EFFET quand `lieu` vaut `maison` (`02-` §5 ; piège 32).
    optin_se_juger: form.get('optin_se_juger') === 'oui',
    optin_confiance_remise: form.get('optin_confiance_remise') === 'oui',
    // ⚠️ NI CLASSE, NI FENÊTRE ICI : elles se posent à l'assignation.
  }).select('id').single()
  if (error) return { ok: false, message: error.message }

  const { data: casEcrits, error: eCas } = await admin.from('exercices_cas')
    .insert(saisie.cas.map((cs, i) => ({
      exercice_id: data.id, ordre: i + 1,
      materiau_id: cs.materiauId, defaut: cs.defaut,
      distracteurs: cs.distracteurs, reponse_attendue: cs.reponseAttendue,
      // ⭐ C4-L14 — SANS CE CHAMP ICI, une instance conçue EN LIGNE naîtrait
      //    MUETTE là où une instance IMPORTÉE parle : même écran pour l'élève,
      //    deux comportements selon la voie par où l'instance est entrée.
      pourquoi_juste: cs.pourquoiJuste,
    }))).select('ordre')
  // ⚠️ UNE INSTANCE SANS SON APPUI EST INUTILISABLE, et pire : son écran
  // d'édition n'affiche alors aucun cas, et la première correction écraserait
  // la consigne que l'élève lit. On ne la laisse pas derrière nous.
  if (eCas || (casEcrits ?? []).length !== saisie.cas.length) {
    await admin.from('exercices').delete().eq('id', data.id)
    return {
      ok: false,
      message: `L'appui n'a pas pu être écrit : ${eCas?.message ?? 'écriture partielle'}. `
        + 'L\'instance a été retirée — rien d\'incomplet ne reste.',
    }
  }

  revalidatePath('/prof/conception')
  return {
    ok: true, exerciceId: data.id as string,
    message: 'Instance conçue. Corrigez-la et voyez-la côté élève avant de l’assigner — '
      + 'rien ne part avant.',
  }
}

/** L'ÉDITION avant validation. « Corriger une instance se fait à l'écran — c'est
 *  aussi le seul chemin pour une entrée importée » (§1.1 ; piège 34). */
export async function editerInstance(
  _prec: RetourConception | null, form: FormData,
): Promise<RetourConception> {
  const { admin } = await garderProf(false)
  const id = String(form.get('id') ?? '')
  const { data: ex, error: eLecture } = await admin.from('exercices')
    .select('statut, paire_diagnostic, cran, exercices_types(nature), exercices_cas(ordre)')
    .eq('id', id).maybeSingle()
  if (eLecture) return { ok: false, message: `Lecture impossible : ${eLecture.message}` }
  if (!ex) return { ok: false, message: 'Instance inconnue.' }
  if (ex.statut === 'assigne' || ex.statut === 'clos') {
    return { ok: false, message: 'Cette instance est déjà assignée : l’édition avant validation est passée.' }
  }

  // ⚠️ CE QUE LE FORMULAIRE PORTE ET CE QUE LA BASE DÉCLARE DOIVENT S'ACCORDER.
  //   Le nombre de consignes à écrire vient de `paire_diagnostic` ; le nombre de
  //   champs affichés vient des lignes `exercices_cas`. Quand les deux divergent
  //   — une instance dont l'écriture des cas a échoué —, `form.get('cas_2_…')`
  //   rend `null`, la consigne devient vide, et LE TEXTE QUE L'ÉLÈVE LIT EST
  //   EFFACÉ sous un message vert. On refuse plutôt que d'écrire à l'aveugle.
  // ⭐ C4-L11 — UN EXAMEN DIAGNOSTIQUE N'A PAS DE CAS, et il n'en aura jamais.
  //    Un type de nature `complet` n'a PAS DE CRAN (`07-` §1.1), donc aucun
  //    appui à déclarer et aucune ligne `exercices_cas` : la garde ci-dessous,
  //    écrite pour les treize objets, lisait « déclare 1 cas, n'en porte 0 » et
  //    REFUSAIT TOUTE ÉDITION. Le bloc d'assignation, lui, fonctionnait — c'est
  //    ce qui rendait le défaut cosmétique. L'examen édite sa consigne, son
  //    lieu et ses deux opt-ins ; le reste ne le concerne pas.
  const nature = jointureNature(ex.exercices_types)
  const examen = nature === 'complet'
  const n = examen ? 0 : (ex.paire_diagnostic ? 2 : 1)
  const casEnBase = (ex.exercices_cas as Array<{ ordre: number }> | null) ?? []
  if (casEnBase.length !== n) {
    return {
      ok: false,
      message: `Cette instance déclare ${n} cas et n'en porte que ${casEnBase.length} : `
        + 'son appui est incomplet. Elle ne peut pas être corrigée en l’état — retirez-la et '
        + 'redéposez-la sous un `id` neuf.',
    }
  }
  const cas = lireCas(form, n)
  // Sans cas, la consigne se saisit à part : c'est le seul texte que l'examen
  // porte, et il reste « le texte que l'élève lit ».
  const consigneExamen = String(form.get('consigne') ?? '')
  if (examen ? !consigneExamen.trim() : cas.some((c) => !c.consigne.trim())) {
    return { ok: false, message: 'Une consigne est vide : c’est le texte que l’élève lit, '
      + 'il ne s’efface pas par mégarde.' }
  }

  const { data: maj, error } = await admin.from('exercices').update({
    consigne_instanciee: examen
      ? consigneExamen
      : (ex.paire_diagnostic ? cas.map((x) => x.consigne) : cas[0].consigne),
    guide: (String(form.get('guide') ?? '').trim() || null),
    lieu: String(form.get('lieu') ?? 'maison'),
    optin_se_juger: form.get('optin_se_juger') === 'oui',
    optin_confiance_remise: form.get('optin_confiance_remise') === 'oui',
    updated_at: new Date().toISOString(),
  }).eq('id', id).select('id')
  if (error) return { ok: false, message: error.message }
  if ((maj ?? []).length === 0) return { ok: false, message: 'Aucune ligne corrigée.' }

  const rates: string[] = []
  for (let i = 0; i < cas.length; i++) {
    const { data: casMaj, error: eCas } = await admin.from('exercices_cas').update({
      defaut: cas[i].defaut, distracteurs: cas[i].distracteurs,
      reponse_attendue: cas[i].reponseAttendue,
      // ⚠️⚠️ C4-L14 — LE TROISIÈME SITE D'ÉCRITURE, ET C'EST CELUI QU'ON OUBLIE.
      //    L'oublier ne casse rien : ça fait PERDRE le `pourquoi_juste` **en
      //    silence, à la première correction du professeur** — et une perte
      //    silencieuse ne se voit qu'à l'écran de l'élève, des semaines plus
      //    tard, quand la correction s'est tue sans que personne l'ait décidé.
      pourquoi_juste: cas[i].pourquoiJuste,
    }).eq('exercice_id', id).eq('ordre', i + 1).select('ordre')
    if (eCas) rates.push(`cas ${i + 1} : ${eCas.message}`)
    else if ((casMaj ?? []).length === 0) rates.push(`cas ${i + 1} : aucune ligne touchée`)
  }
  revalidatePath(`/prof/conception/${id}`)
  if (rates.length > 0) {
    return { ok: false, message: 'La consigne est corrigée, mais pas tout l’appui.', empechements: rates }
  }
  return { ok: true, message: 'Instance corrigée.' }
}

/**
 * LES EXERCICES COMMUNS À TOUTE UNE CLASSE — la contrainte dure.
 *
 * « Une instance `exercices` avec sa classe, sa fenêtre, son statut ; ET UNE
 * LIGNE D'`exercices_depots` PAR ÉLÈVE, CRÉÉE DÈS L'ASSIGNATION — pas au dépôt —,
 * `origine` `prof`, avec sa date d'assignation et son échéance » (§1.1).
 * « C'est ce qui fait qu'un exercice ENTRE AU CALENDRIER DE L'ÉLÈVE » (§5), et
 * que la voie mixte le trouve.
 */
export async function assignerALaClasse(
  _prec: RetourConception | null, form: FormData,
): Promise<RetourConception> {
  const { admin } = await garderProf(false)
  const id = String(form.get('id') ?? '')
  const classeId = String(form.get('classe_id') ?? '')
  const debut = String(form.get('fenetre_debut') ?? '') || null
  const fin = String(form.get('fenetre_fin') ?? '') || null
  if (!classeId) return { ok: false, message: 'Aucune classe choisie.' }

  const { data: ex, error: eLecture } = await admin.from('exercices')
    .select('statut, bloque, classe_id').eq('id', id).maybeSingle()
  if (eLecture) return { ok: false, message: `Lecture impossible : ${eLecture.message}` }
  if (!ex) return { ok: false, message: 'Instance inconnue.' }
  // « Une entrée bloquée ne se valide pas tant qu'elle l'est » — a fortiori elle
  // ne s'assigne pas.
  if (ex.bloque) return { ok: false, message: 'Cette instance est bloquée : elle ne s’assigne pas.' }
  if (ex.statut === 'a_concevoir') {
    return { ok: false, message: 'Cette instance n’est pas encore conçue.' }
  }
  // ⚠️ CHANGER DE CLASSE LAISSERAIT LES DÉPÔTS DE L'ANCIENNE ORPHELINS —
  //   assignés, comptés à l'assiduité, et rattachés à un exercice qui ne
  //   s'adresse plus à eux. On refuse plutôt que de le faire en silence.
  if (ex.classe_id && ex.classe_id !== classeId) {
    return {
      ok: false,
      message: 'Cette instance est déjà assignée à une autre classe. Changer de classe laisserait '
        + 'les dépôts de la première orphelins : concevez une seconde instance pour l’autre classe.',
    }
  }

  // ⚠️ ON LIT LES INSCRITS AVANT D'ÉCRIRE QUOI QUE CE SOIT. Poser `assigne` puis
  //   découvrir qu'il n'y a personne murait l'instance : l'édition la refusait
  //   ensuite (« déjà assignée ») et aucun dépôt n'existait.
  const { data: inscrits, error: eInscrits } = await admin.from('inscriptions')
    .select('eleve_id').eq('classe_id', classeId).eq('statut', 'active')
  if (eInscrits) return { ok: false, message: `Les inscriptions n'ont pas pu être lues : ${eInscrits.message}` }
  const eleves = [...new Set(((inscrits ?? []) as unknown as Ligne[]).map((i) => String(i.eleve_id)))]
  if (eleves.length === 0) {
    return { ok: false, message: 'Aucun élève inscrit dans cette classe : rien n’entrerait au '
      + 'calendrier, et l’instance n’a pas été assignée.' }
  }

  const echeance = fin ? new Date(fin).toISOString() : null

  // ⚠️ NE JAMAIS RÉÉCRIRE L'ÉTAT D'UN ÉLÈVE QUI A COMMENCÉ. Un `upsert` qui
  //   repose `statut` et `assigne_at` ferait repasser à `assigne` un élève déjà
  //   à `v1_remis` : son travail resterait, son état non — et l'assiduité le
  //   recompterait. On n'insère que les lignes manquantes, et on ne touche que
  //   l'échéance des autres.
  const { data: dejaLa, error: eDeja } = await admin.from('exercices_depots')
    .select('eleve_id').eq('exercice_id', id)
  if (eDeja) return { ok: false, message: `Les dépôts n'ont pas pu être lus : ${eDeja.message}` }
  const connus = new Set(((dejaLa ?? []) as unknown as Ligne[]).map((d) => String(d.eleve_id)))
  const neufs = eleves.filter((e) => !connus.has(e))

  let crees = 0
  if (neufs.length > 0) {
    const { data: poses, error: eDep } = await admin.from('exercices_depots').insert(
      neufs.map((eleveId) => ({
        eleve_id: eleveId, exercice_id: id,
        // « `origine` `prof` » — ce qui distingue la voie du professeur de celle
        // du routeur, DANS LES MÊMES TABLES (§1.1 ; §5).
        origine: 'prof',
        assigne_at: new Date().toISOString(),
        echeance,
        statut: 'assigne',
      }))).select('eleve_id')
    if (eDep) return { ok: false, message: `Les dépôts n'ont pas été écrits : ${eDep.message}` }
    crees = (poses ?? []).length
  }
  // L'échéance, elle, se repousse — mais seulement sur ce qui n'est pas clos.
  let repousses = 0
  if (connus.size > 0) {
    const { data: maj, error: eMaj } = await admin.from('exercices_depots')
      .update({ echeance }).eq('exercice_id', id).neq('statut', 'clos').select('eleve_id')
    if (eMaj) return { ok: false, message: `L'échéance n'a pas pu être repoussée : ${eMaj.message}` }
    repousses = (maj ?? []).length
  }

  // L'instance ne bascule qu'une fois les dépôts en place.
  const { data: majEx, error: eEx } = await admin.from('exercices').update({
    classe_id: classeId,
    fenetre_debut: debut ? new Date(debut).toISOString() : null,
    fenetre_fin: fin ? new Date(fin).toISOString() : null,
    statut: 'assigne',
    updated_at: new Date().toISOString(),
  }).eq('id', id).select('id')
  if (eEx) return { ok: false, message: eEx.message }
  if ((majEx ?? []).length === 0) return { ok: false, message: 'L’instance n’a pas été assignée.' }

  revalidatePath(`/prof/conception/${id}`)
  revalidatePath('/prof/conception')
  return {
    ok: true,
    message: `Exercice commun assigné — ${crees} dépôt(s) créé(s), \`origine\` \`prof\``
      + (repousses ? `, ${repousses} échéance(s) repoussée(s) sans toucher à l’état des élèves` : '')
      + '. Il entre au calendrier de chaque élève.',
  }
}

/**
 * LA VALIDATION DE LA RÉFÉRENCE — « UN SEUL GESTE, pour toute la référence.
 * PAS DE VALIDATION CHAMP PAR CHAMP : ce serait recomposer la référence au lieu
 * de la lire » (`05-` §4.5 ; piège 34).
 *
 * « Toute correction repasse le contrôle du §4.1 AVANT que la validation
 * redevienne possible. »
 */
export async function validerReference(
  _prec: RetourConception | null, form: FormData,
): Promise<RetourConception> {
  const { admin, userId } = await garderProf(false)
  const id = String(form.get('reference_id') ?? '')
  const { data: ref } = await admin.from('exercices_references')
    .select('id, contenu, validee_at, source_contenu_id, scriptorium_contenus(texte_extrait)')
    .eq('id', id).maybeSingle()
  if (!ref) return { ok: false, message: 'Référence inconnue.' }
  if (ref.validee_at) {
    return { ok: false,
      message: 'Cette référence est déjà validée — et « une référence validée ne se modifie '
        + 'plus en silence » : corriger passe par une dévalidation explicite.' }
  }
  const texte = String(jointure(ref, 'scriptorium_contenus').texte_extrait ?? '')
  const v = controleReference(ref.contenu, texte)
  if (v.refus.length > 0) {
    return { ok: false, message: 'Le contrôle refuse cette référence : elle ne vous est pas soumise.',
      empechements: v.refus }
  }
  if (v.blocages.length > 0) {
    return { ok: false,
      message: 'Des blocages restent : le professeur tranche, rien ne se devine.',
      empechements: v.blocages }
  }
  const { error } = await admin.from('exercices_references')
    .update({ validee_par: userId, validee_at: new Date().toISOString() }).eq('id', id)
  if (error) return { ok: false, message: error.message }
  // Le texte cesse d'être bloqué du même coup : son blocage n° 2 est levé.
  const { error: eTexte } = await admin.from('exercices_textes')
    .update({ bloque: false, blocages: [], updated_at: new Date().toISOString() })
    .eq('reference_id', id)
  revalidatePath('/prof/conception')
  revalidatePath('/prof/corpus')
  if (eTexte) {
    return {
      ok: false,
      message: 'La référence est validée, mais le texte reste BLOQUÉ en file : '
        + `${eTexte.message}. Levez le blocage depuis l'écran du corpus.`,
    }
  }
  return { ok: true, message: 'Référence validée — un seul geste, pour toute la référence.' }
}

/**
 * ⭐ C5-L1 — LA CORRECTION D'UNE RÉFÉRENCE NON VALIDÉE.
 *
 * « Le professeur CORRIGE CE QUI EST FAUX, puis valide l'ensemble. […] TOUTE
 *   CORRECTION REPASSE LE CONTRÔLE DU §4.1 AVANT QUE LA VALIDATION REDEVIENNE
 *   POSSIBLE — déplacer une frontière de moment peut ouvrir un trou de
 *   couverture, et un trou ne passe jamais en silence. »        — `05-` §4.5
 *
 * ⚠️ SANS CE GESTE, LES DEUX BLOCAGES N'AVAIENT PAS D'ISSUE. Le §4.2 dit « le
 *    professeur tranche » — un moment relationnel sans cible, une phrase porteuse
 *    que l'auteur n'affirme pas —, et l'écran n'offrait que « valider », désactivé
 *    tant qu'un blocage restait. Le lot ferme ce bout : c'est la clause 3 du
 *    « fait quand », « blocages tranchés ».
 *
 * ⚠️ ELLE NE TOUCHE JAMAIS UNE RÉFÉRENCE VALIDÉE. Le trigger
 *    `garde_reference_immuable` refuse la modification du `contenu` dès que
 *    `validee_at` est posé ; on refuse AVANT lui, en le disant : corriger après
 *    validation passe par une DÉVALIDATION EXPLICITE, jamais par un `update`
 *    silencieux.
 *
 * ⚠️ ET LE CONTRÔLE EST REJOUÉ ICI, PAS SEULEMENT À L'AFFICHAGE : un écran n'est
 *    pas une garde. Le refus n'écrit rien ; le blocage, lui, s'écrit — le
 *    professeur peut corriger en plusieurs fois.
 */
export async function corrigerReference(
  _prec: RetourConception | null, form: FormData,
): Promise<RetourConception> {
  const { admin } = await garderProf(false)
  const id = String(form.get('reference_id') ?? '')
  const { data: ref, error: eLecture } = await admin.from('exercices_references')
    .select('id, validee_at, scriptorium_contenus(texte_extrait)')
    .eq('id', id).maybeSingle()
  if (eLecture) return { ok: false, message: `Lecture impossible : ${eLecture.message}` }
  if (!ref) return { ok: false, message: 'Référence inconnue.' }
  if (ref.validee_at) {
    return { ok: false,
      message: 'Cette référence est VALIDÉE : elle ne se modifie plus en silence. '
        + 'Dévalidez-la explicitement d’abord.' }
  }

  // ⚠️⚠️ UN `<textarea>` SOUMET EN CRLF, ET LE STOCKÉ EST EN LF. Ça a mordu deux
  //    fois (C4-L4, puis la garde de découpe de C4-L16), et `new FormData()` ne
  //    le montre pas : seule une soumission réelle le fait. Ici, un `\r` par
  //    ligne rendrait le JSON stocké différent de celui que le professeur a lu.
  const brut = String(form.get('contenu') ?? '').replace(/\r\n/g, '\n')
  let contenu: unknown
  try {
    contenu = JSON.parse(brut)
  } catch (e) {
    return { ok: false,
      message: 'Ce n’est pas du JSON lisible — rien n’a été écrit.',
      empechements: [(e as Error).message] }
  }

  const texte = String(jointure(ref, 'scriptorium_contenus').texte_extrait ?? '')
  const v = controleReference(contenu, texte)
  if (v.refus.length > 0) {
    return { ok: false,
      message: 'La correction est REFUSÉE par le contrôle : elle n’a pas été écrite. '
        + '« Un trou ne passe jamais en silence. »',
      empechements: v.refus }
  }

  const { data: maj, error } = await admin.from('exercices_references')
    .update({ contenu, updated_at: new Date().toISOString() }).eq('id', id).select('id')
  if (error) return { ok: false, message: error.message }
  if ((maj ?? []).length === 0) return { ok: false, message: 'Aucune référence corrigée.' }
  revalidatePath(`/prof/conception/reference/${id}`)
  revalidatePath('/prof/conception')
  return {
    ok: v.blocages.length === 0,
    message: v.blocages.length === 0
      ? 'Correction écrite, et le contrôle repasse : la validation est possible.'
      : `Correction écrite, mais ${v.blocages.length} blocage(s) restent : `
        + 'la validation attend que vous les tranchiez.',
    empechements: v.blocages,
  }
}

/** La DÉVALIDATION explicite. « Une fois `validee_at` renseigné, ni le
 *  `contenu`, ni l'`empreinte`, ni la source ne changent : corriger après
 *  validation passe donc par une dévalidation EXPLICITE, jamais par un `update`
 *  silencieux » (piège 34 ; garde serveur de C4-L1). */
export async function devaliderReference(
  _prec: RetourConception | null, form: FormData,
): Promise<RetourConception> {
  const { admin } = await garderProf(false)
  const id = String(form.get('reference_id') ?? '')
  // ⚠️ COMPTER CE DONT ON PARLE. Le compte portait sur TOUTE instance bâtie sur
  //   un texte quelconque : il n'avait aucun lien avec la référence dévalidée.
  const { data: textes } = await admin.from('exercices_textes').select('id').eq('reference_id', id)
  const idsTextes = ((textes ?? []) as unknown as Ligne[]).map((x) => String(x.id))
  let concernees = 0
  if (idsTextes.length > 0) {
    const { count } = await admin.from('exercices')
      .select('id', { count: 'exact', head: true })
      .or(`materiau_source_texte_id.in.(${idsTextes.join(',')}),`
        + `materiau_cible_texte_id.in.(${idsTextes.join(',')})`)
    concernees = count ?? 0
  }
  const { data: maj, error } = await admin.from('exercices_references')
    .update({ validee_par: null, validee_at: null }).eq('id', id).select('id')
  if (error) return { ok: false, message: error.message }
  if ((maj ?? []).length === 0) return { ok: false, message: 'Aucune référence dévalidée.' }
  revalidatePath('/prof/conception')
  revalidatePath('/prof/corpus')
  // ⚠️ DIRE CE QUE ÇA FAIT, ET RIEN DE PLUS. La dévalidation ferme la CONCEPTION
  //   à venir — « une référence non validée n'entre jamais en Phase 2 » — elle
  //   ne défait pas les instances déjà assignées.
  return {
    ok: true,
    message: 'Référence dévalidée : aucune instance NEUVE ne peut plus se concevoir dessus. '
      + (concernees > 0
        ? `${concernees} instance(s) déjà bâtie(s) sur ce texte ne sont pas défaites — `
          + 'retirez-les une à une si c’est ce que vous voulez.'
        : 'Aucune instance n’était bâtie dessus.'),
  }
}

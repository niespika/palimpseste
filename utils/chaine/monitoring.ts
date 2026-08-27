import 'server-only'
// ============================================================================
// C4 · L5 — L'ÉTAGE DU MONITORING, EN ENTIER.
// ----------------------------------------------------------------------------
// « Pas de banc avant l'année : l'année en tient lieu d'épreuve — c'est
//   précisément pourquoi la collecte TOURNE DÈS LE PREMIER EXERCICE et pourquoi
//   une année manquée ne se rattrape pas. Sa fiche est au statut plafond :
//   CONSTRUIS SON ÉTAGE ENTIER — la clause granulaire ne l'ampute pas. »
//                                                          — PROMPT, piège 45
//
// Quatre flux, et ils ne démarrent ni au même moment ni sous le même garde-fou
// (`competences/monitoring.md` §6). Ce lot en sert DEUX, et les deux autres
// dépendent d'écrans qui ne sont pas les siens :
//   · flux 1 « se juger »        — l'écran est C4-L3 ; ce lot LIT ce qu'il écrit ;
//   · flux 2 confiance de remise — le geste est C4-L3/C4-L4 ; ce lot le CROISE ;
//   · flux 3 lucidité            — L'APPEL D'EXTRACTION EST ICI, sur son site ;
//   · flux 4 porte 2             — la saisie de crédence est un écran ; ce lot
//                                  calcule l'accord dès qu'elle est là.
//
// ⚠️ « Le Monitoring n'entre JAMAIS dans `competences_mesures` » (piège 23).
// ⚠️ « Il tourne EN DERNIER, jamais en parallèle » : ce module n'est appelé
//    qu'après les Code2 des autres axes (`chaine.ts`).
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { appeler } from './appel'
import { messageAvecMateriau } from './anti-injection'
import { MONITORING } from './instruments'
import {
  accordCredenceReussite, calibrationDe, competencesQuiComptent, dansLeCatalogue,
  tauxDeLucidite, type AccordPorte2, type Aveu, type Confiance, type Credence, type Supposition,
} from './monitoring-calcul'
import type { ContexteDepot } from './contexte'
import type { Competence, Palier, SousDimension, Version } from './types'

type Admin = ReturnType<typeof createAdminClient>

const MODULE_COUT = 'exercices-chaine-monitoring'

export interface BilanMonitoring {
  mesures: number
  appels: number
  /** Ce qui a été écarté, et pourquoi. Il se journalise, il ne se tait jamais. */
  motifs: string[]
}

export async function traiterLeMonitoring(
  admin: Admin,
  a: {
    ctx: ContexteDepot; version: Version; modele: string; production: string
    /** Le niveau que chaque instrument de compétence a rendu — l'un des deux côtés. */
    niveauxObtenus: Record<string, string | null>
  },
): Promise<BilanMonitoring> {
  const { ctx, version, modele, production } = a
  const motifs: string[] = []
  let mesures = 0
  let appels = 0

  // ── Flux 3 — LA LUCIDITÉ, sur son site unique, et sans condition de statut ──
  if (ctx.estSyntheseEnClasse && version === 'v1') {
    const r = await extraireLaLucidite(admin, ctx, modele, production)
    appels += r.appels
    if (r.erreur) motifs.push(`lucidité : ${r.erreur}`)
    else {
      const ecrit = await ecrireMesureMonitoring(admin, ctx, 'lucidite_incompris', 'spontanee', {
        aveu_incomprehension: r.aveu,
        marquage_supposition: r.supposition,
        confiance_declaree: r.confiance,
      }, [])
      if (ecrit.ecrite) {
        mesures += 1
        await rafraichirNiveauLucidite(admin, ctx.eleveId)
      } else if (ecrit.dejaLa) {
        motifs.push('lucidité : une mesure existait déjà pour ce dépôt — la reprise n\'en écrit pas une seconde')
      } else if (ecrit.erreur) {
        motifs.push(`lucidité NON écrite : ${ecrit.erreur}`)
      }
    }
    motifs.push(...r.alertes)
  } else if (!ctx.estSyntheseEnClasse) {
    // Ce n'est pas un manque : « son site est LA SYNTHÈSE EN CLASSE. Ailleurs, la
    // marque est trop rare pour discriminer » (fiche §4).
    motifs.push('lucidité : hors site — l\'extraction commune ne tourne que sur la synthèse en classe')
  }

  // ── LA CALIBRATION — UNE SEULE LIGNE PAR DÉPÔT, ses trois sources dedans ───
  //
  // « La calibration — DÉRIVÉE, DE TROIS SOURCES » (fiche §4) : le local (« se
  // juger »), le global (la confiance de remise), et la porte 2. C'est UNE
  // sous-dimension, et la colonne `source` ne distingue pas ces trois-là — elles
  // sont toutes `sollicitee`. Trois lignes n'auraient donc rien dit de plus, et
  // auraient triplé `n` : « une ligne par mesure » (§1.4), la mesure étant le
  // dépôt. Un index unique partiel `(depot_id, sous_dimension)` le tient.
  //
  // ⚠️ ET SEULEMENT EN v1 : ce sont des gestes DE LA REMISE DE LA v1 (`02-`
  //    §2.3.1 c : « deux saisies, toutes deux au dépôt de la v1 »), et la
  //    crédence se déclare PENDANT l'exercice. Les rejouer en version finale
  //    versait deux fois la même donnée — `ctx.confianceDeclaree` et la crédence
  //    sont par DÉPÔT, pas par version.
  if (version === 'v1') {
    const observables: Record<string, unknown> = {}
    const couvertes: Competence[] = []

    const entrees = Object.entries(ctx.confianceDeclaree).map(([competence, confiance]) => ({
      competence: competence as Competence,
      confiance: (confiance as Confiance | null) ?? null,
      niveau: (a.niveauxObtenus[competence] as Palier | null) ?? null,
    }))
    if (entrees.length) {
      // ⭐ C5-L3 — `a.niveauxObtenus` porte UNE CLÉ PAR COMPÉTENCE MESURÉE, et
      //    aucune pour les écartées : c'est le seul discriminant fiable entre
      //    « mesurée sans lettre » et « jamais mesurée ».
      const { retenues, ecartees } = competencesQuiComptent(
        entrees, ctx.statutsRecette, a.niveauxObtenus)
      motifs.push(...ecartees.map((e) => `calibration : ${e.competence} écartée — ${e.motif}`))
      if (retenues.length) {
        const verdicts = retenues.map((e) => ({ competence: e.competence, ...calibrationDe(e) }))
        observables.confiance_de_remise = {
          par_competence: verdicts,
          // Les deux côtés se CONSERVENT : la table de conversion arrivera après,
          // et « les niveaux se calculent rétroactivement » (fiche §7 et §9).
          confiances: Object.fromEntries(retenues.map((e) => [e.competence, e.confiance])),
          niveaux: Object.fromEntries(retenues.map((e) => [e.competence, e.niveau])),
        }
        couvertes.push(...retenues.map((e) => e.competence))
        motifs.push(...verdicts.filter((v) => v.motif).map((v) => `calibration ${v.competence} : ${v.motif}`))
      }
    }

    const porte2 = await accordDeLaPorte2(admin, ctx)
    if (porte2) observables.porte_2 = porte2.accords

    if (Object.keys(observables).length) {
      const ecrit = await ecrireMesureMonitoring(
        admin, ctx, 'calibration_confiance', 'sollicitee', observables, couvertes)
      if (ecrit.ecrite) {
        mesures += 1
        await rafraichirNiveauCalibration(admin, ctx.eleveId)
      } else if (ecrit.dejaLa) {
        motifs.push('calibration : une mesure existait déjà pour ce dépôt — la reprise n\'en écrit pas une seconde')
      } else if (ecrit.erreur) {
        motifs.push(`calibration NON écrite : ${ecrit.erreur}`)
      }
    }
  }

  return { mesures, appels, motifs }
}

// ── L'extraction unique et commune (fiche §7) ───────────────────────────────

/**
 * « L'extraction est UN APPEL UNIQUE, INDÉPENDANT des instruments de compétence,
 * lancé sur la production de la synthèse en classe. Il ne reçoit QUE la consigne
 * et la production, tourne à TEMPÉRATURE 0, et ne sort que son schéma. »
 *
 * ⚠️ « Aucun prompt de compétence ne les porte » : ce prompt-ci est dérivé de la
 *    fiche du Monitoring, et de nulle part ailleurs.
 */
async function extraireLaLucidite(
  admin: Admin, ctx: ContexteDepot, modele: string, production: string,
): Promise<{ aveu: Aveu | null; supposition: Supposition | null; confiance: Confiance | null; appels: number; erreur: string | null; alertes: string[] }> {
  const catalogue = MONITORING.bloc_machine.squelette.catalogue
  const forme = {
    type: 'objet' as const,
    champs: {
      aveu_incomprehension: { type: 'enum' as const, valeurs: catalogue.aveux },
      confiance_declaree: { type: 'enum' as const, valeurs: catalogue.confiances },
      marquage_supposition: { type: 'enum' as const, valeurs: catalogue.suppositions },
    },
  }
  // Les deux variables que la fiche déclare, et pas d'autres.
  const prompt = MONITORING.prompt_extraction
    .replace(/\{\{\s*CONSIGNE\s*\}\}/g, '(voir le bloc de matériau)')
    .replace(/\{\{\s*REPONSE_ELEVE\s*\}\}/g, '(voir le bloc de matériau)')

  try {
    const r = await appeler<{ aveu_incomprehension: string; confiance_declaree: string; marquage_supposition: string }>({
      phase: 'p1', modele,
      systeme: 'Tu consignes, tu ne juges pas.',
      prefixeCacheable: prompt,
      message: messageAvecMateriau([
        { nom: 'la consigne posée à l\'élève', contenu: ctx.consigne },
        { nom: 'la réponse de l\'élève (brute)', contenu: production },
      ], 'Rends UNIQUEMENT le JSON déclaré ci-dessus.'),
      forme,
      attribution: { module: MODULE_COUT, eleveId: ctx.eleveId, classeId: ctx.classeId,
        depotId: ctx.depotId, competence: null, version: 'v1' },
      relancesMax: 1,
    })
    const alertes: string[] = []
    // « Une valeur hors d'une liste fermée : ALERTE DÉCLARÉE, jamais de valeur
    //   par défaut » (bloc machine, garde-fou `valeur_hors_liste`).
    for (const [champ, liste] of [
      ['aveu_incomprehension', catalogue.aveux],
      ['confiance_declaree', catalogue.confiances],
      ['marquage_supposition', catalogue.suppositions],
    ] as const) {
      if (!dansLeCatalogue(r.valeur[champ], liste)) alertes.push(`valeur hors catalogue pour ${champ}`)
    }
    return {
      aveu: r.valeur.aveu_incomprehension as Aveu,
      supposition: r.valeur.marquage_supposition as Supposition,
      confiance: r.valeur.confiance_declaree as Confiance,
      appels: r.appels, erreur: null, alertes,
    }
  } catch (e) {
    // `relancesMax = 1` peut en avoir dépensé DEUX : l'exception porte le compte.
    const appels = (e as { appels?: number }).appels ?? 1
    return { aveu: null, supposition: null, confiance: null, appels,
      erreur: e instanceof Error ? e.message : String(e), alertes: [] }
  }
}

// ── La porte 2 ──────────────────────────────────────────────────────────────

/**
 * « L'ACCORD entre la crédence et la réussite appartient au Monitoring et va
 * dans `monitoring_mesures`, `source = sollicitee`. LA COMPÉTENCE IGNORE LA
 * CRÉDENCE » (fiche §4).
 *
 * « La saisie de crédence n'est pas ici — elle vit au dépôt » (piège 43) : on la
 * LIT sur `exercices_metacognition`, on ne la demande jamais.
 */
async function accordDeLaPorte2(
  admin: Admin, ctx: ContexteDepot,
): Promise<{ accords: AccordPorte2[] } | null> {
  const { data } = await admin
    .from('exercices_metacognition').select('credence').eq('depot_id', ctx.depotId).maybeSingle()
  const brut = data?.credence
  if (!Array.isArray(brut) || brut.length === 0) return null
  const accords: AccordPorte2[] = []
  for (const c of brut as unknown[]) {
    const credence = lireCredence(c)
    if (!credence) continue
    accords.push(accordCredenceReussite(credence))
  }
  return accords.length ? { accords } : null
}

/** Les deux formes du `02-` §5 : répartition de jetons, ou pourcentage unique. */
function lireCredence(v: unknown): Credence | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (Array.isArray(o.jetons) && o.jetons.length === 4 && typeof o.index_correct === 'number') {
    return { forme: 'repartition', jetons: o.jetons as [number, number, number, number], indexCorrect: o.index_correct }
  }
  if (typeof o.pourcentage === 'number' && typeof o.reussi === 'boolean') {
    return { forme: 'pourcentage', pourcentage: o.pourcentage, reussi: o.reussi }
  }
  return null
}

// ── Les écritures ───────────────────────────────────────────────────────────

async function ecrireMesureMonitoring(
  admin: Admin, ctx: ContexteDepot, sousDimension: SousDimension,
  source: 'spontanee' | 'sollicitee', observables: Record<string, unknown>,
  competencesCouvertes: readonly string[],
): Promise<{ ecrite: boolean; dejaLa: boolean; erreur: string | null }> {
  // « Les DEUX DÉLAIS » sont nommés au §1.4 comme sur `competences_mesures` — ils
  // naissaient morts. Le Monitoring a besoin de l'espacement de SES mesures.
  const delais = await delaisMonitoring(admin, ctx.eleveId, sousDimension)
  const { error } = await admin.from('monitoring_mesures').insert({
    eleve_id: ctx.eleveId,
    sous_dimension: sousDimension,
    source,
    observables,
    lieu: ctx.lieu,
    classe_id: ctx.classeId,
    depot_id: ctx.depotId,
    competences_couvertes: competencesCouvertes,
    instrument_version: MONITORING.version,
    delai_jours: delais.delai_jours,
    delai_mesures: delais.delai_mesures,
    // « L'amplitude et la direction portent `n/a` tant que la table de conversion
    //   n'est pas écrite — `n/a` est une VALEUR DÉCLARÉE » (piège 42).
    //
    // ⚠️ SUR LA CALIBRATION SEULE. « Les deux sous-dimensions n'ont pas la même
    //    forme d'état — c'est écrit jusque dans le schéma, où LEURS COLONNES NE
    //    SE CROISENT PAS » (fiche §3). Une amplitude d'écart sur une ligne de
    //    lucidité dirait qu'un écart de calibration a été mesuré là où rien de
    //    tel ne l'a été. `monitoring_niveaux` porte la garde ; ici, c'est au code.
    amplitude_ecart: sousDimension === 'calibration_confiance' ? 'n/a' : null,
    direction_ecart: sousDimension === 'calibration_confiance' ? 'n/a' : null,
  })
  if (!error) return { ecrite: true, dejaLa: false, erreur: null }
  if (error.code === '23505') return { ecrite: false, dejaLa: true, erreur: null }
  console.error(`[monitoring] mesure non écrite — ${error.code} ${error.message}`)
  return { ecrite: false, dejaLa: false, erreur: `${error.code} ${error.message}` }
}

/** L'espacement des mesures de CETTE sous-dimension, pour cet élève (§1.4). */
async function delaisMonitoring(
  admin: Admin, eleveId: string, sousDimension: SousDimension,
): Promise<{ delai_jours: number | null; delai_mesures: number | null }> {
  const { data } = await admin.from('monitoring_mesures')
    .select('mesure_at').eq('eleve_id', eleveId).eq('sous_dimension', sousDimension)
    .order('mesure_at', { ascending: false }).limit(1)
  const derniere = (data as unknown as Array<{ mesure_at: string }> | null)?.[0]
  if (!derniere) return { delai_jours: null, delai_mesures: null }
  const jours = Math.max(0, Math.floor(
    (Date.now() - new Date(derniere.mesure_at).getTime()) / 86_400_000))
  const { count } = await admin.from('monitoring_mesures')
    .select('id', { count: 'exact', head: true })
    .eq('eleve_id', eleveId).gt('mesure_at', derniere.mesure_at)
  return { delai_jours: jours, delai_mesures: count ?? 0 }
}

/** `monitoring_niveaux` — l'état, une ligne par sous-dimension (§1.4). */
async function rafraichirNiveauCalibration(admin: Admin, eleveId: string): Promise<void> {
  const { count } = await admin
    .from('monitoring_mesures').select('id', { count: 'exact', head: true })
    .eq('eleve_id', eleveId).eq('sous_dimension', 'calibration_confiance')
  const { error } = await admin.from('monitoring_niveaux').upsert({
    eleve_id: eleveId,
    sous_dimension: 'calibration_confiance',
    n: count ?? 0,
    amplitude_courante: 'n/a',
    direction_courante: 'n/a',
    taux: null,
    denominateur_fenetre: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'eleve_id,sous_dimension' })
  if (error) console.error(`[monitoring] niveau calibration non écrit — ${error.code} ${error.message}`)
}

/**
 * Le taux de lucidité, recalculé sur la fenêtre de CINQ EXERCICES.
 *
 * « Un dénominateur à zéro donne un TAUX NULL, jamais zéro » (§1.4) — et la
 * garde de base `monitoring_taux_chk` le tient aussi.
 */
async function rafraichirNiveauLucidite(admin: Admin, eleveId: string): Promise<void> {
  const { data } = await admin
    .from('monitoring_mesures').select('observables, depot_id')
    .eq('eleve_id', eleveId).eq('sous_dimension', 'lucidite_incompris')
    .order('mesure_at', { ascending: false }).limit(5)

  const lignes = (data ?? []) as Array<{ observables: Record<string, unknown>; depot_id: string | null }>
  const fenetre = await Promise.all(lignes.reverse().map(async (l) => ({
    auMoinsUnEchec: l.depot_id ? await auMoinsUnEchec(admin, l.depot_id) : false,
    aveu: (l.observables?.aveu_incomprehension as Aveu | null) ?? null,
    supposition: (l.observables?.marquage_supposition as Supposition | null) ?? null,
  })))
  const { taux, denominateur } = tauxDeLucidite(fenetre)

  const { count } = await admin
    .from('monitoring_mesures').select('id', { count: 'exact', head: true })
    .eq('eleve_id', eleveId).eq('sous_dimension', 'lucidite_incompris')

  const { error } = await admin.from('monitoring_niveaux').upsert({
    eleve_id: eleveId,
    sous_dimension: 'lucidite_incompris',
    n: count ?? 0,
    amplitude_courante: null,
    direction_courante: null,
    taux,
    denominateur_fenetre: denominateur,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'eleve_id,sous_dimension' })
  if (error) console.error(`[monitoring] niveau lucidité non écrit — ${error.code} ${error.message}`)
}

/**
 * « Parmi les exercices de la fenêtre où LE SQUELETTE MONTRE UN ÉCHEC sur au
 * moins un observable » (fiche §3). « Les observables qu'il lit sont ceux de
 * TOUTES LES COMPÉTENCES MESURÉES SUR LE SITE. »
 *
 * Le verdict ne se stocke pas : il se relit ici, valeur contre seuil de fiche —
 * et une compétence dont l'instrument n'est pas ouvert ne peut rien dire.
 */
async function auMoinsUnEchec(admin: Admin, depotId: string): Promise<boolean> {
  const { data } = await admin
    .from('competences_mesures').select('competence, observables').eq('depot_id', depotId)
  const { etatCompetence, valeursDesParametres } = await import('./instruments')
  const { statutDeLaMesure } = await import('./observables')
  for (const m of (data ?? []) as Array<{ competence: string; observables: Record<string, unknown> }>) {
    const etat = etatCompetence(m.competence as Competence)
    if (!etat.instrument) continue
    for (const [code, entree] of Object.entries(etat.instrument.observables_mesure)) {
      // ⚠️ `valeursDesParametres` et jamais `instrument.parametres` : la fiche
      //    écrit un BLOC par paramètre (`defaut`, `bornes`, `statut`), et un
      //    `seuil_parametre` lu sur le bloc rendrait un objet — donc une
      //    comparaison impossible, donc `sans_objet` EN SILENCE (C4-L10).
      const s = statutDeLaMesure(m.observables?.[code] as never, entree,
        valeursDesParametres(etat.instrument))
      if (s === 'ratee') return true
    }
  }
  return false
}

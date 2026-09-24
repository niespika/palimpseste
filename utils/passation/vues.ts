import 'server-only'
// ============================================================================
// C4 · L4 — CE QUE LES ÉCRANS LISENT. Un seul chargeur pour les deux modules.
// ----------------------------------------------------------------------------
// « C'est le même flux dans deux modules, et ce qui commande le comportement
//   est le `lieu`, JAMAIS LE MODULE. »                          — la mission
//
// Les quatre routes (Codex prof, Aletheia prof, Codex élève, Aletheia élève)
// sont minces : elles gardent, elles appellent ici, elles rendent le composant.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireDepot, lireDepotsDeLInstance, attenteDuDepot, attenteDesDepots, lireLeMessageReporte,
  eleveExempte, type DepotDePassation } from './depots'
import { depotClos, MESSAGE_DEPOT_CLOS } from './statuts'
import { depotPorteDuTravail } from '@/utils/examens/retrait'
import { lireLesRetours, lireLesRetoursDeDepots, pointsAAfficher } from './retours'
import { offreSeJuger, offreConfianceRemise, offreCredence, LIBELLES_CONFIANCE }
  from './metacognition'
import { avertissementsDuPrompt } from './transcription'
import { lireConfigPassation } from './config'
import { blocs } from './transcription-calcul'
import { lireLesCollages } from './collage'
import type { VueEleve } from '@/components/passation/EcranEleve'
import type { VueProf, LigneCopie } from '@/components/passation/EcranProf'
import type { PointRetour } from '@/utils/chaine/types'
import type { Doute } from './transcription-calcul'
import { BUCKET, prefixeDepot } from './chemins'
import type { Photo } from './photos'
import { lireEtOuvrirSiVenue, estPreparee, friseDe } from '@/utils/examens/epreuve-serveur'
import { lireFuseau } from '@/utils/fuseau-serveur'

type Admin = SupabaseClient

/**
 * Le rappel de lisibilité — UNE LIGNE, du ton de Calame (`06-` §1, règle 1).
 *
 * ⚠️ IL NE SE LIVRE PAS SANS L'EXEMPTION (piège 34) : « une règle qui demande
 *    une écriture lisible quand l'aménagement n'existe pas encore pénaliserait
 *    exactement les élèves que l'exemption protège. Les quatre règles sont au
 *    même §, livre-les en un seul geste. » Les quatre sont livrées ensemble par
 *    ce lot : la ligne (ici), la confiance de transcription (les doutes à
 *    l'écran), le message reporté (sur le dépôt), et l'exemption
 *    (`profiles.mode_saisie_force`, lue ci-dessous et respectée par l'écran).
 */
export const RAPPEL_LISIBILITE =
  'Écris lisiblement : ce que la machine ne déchiffre pas, tu devras le corriger toi-même.'

/**
 * `avecPhotos` : signer les photos de l'élève pour la relecture refaite (24/09).
 * Posé par la seule page de CODEX, porte `epreuve_minutee_actif` ouverte —
 * Aletheia et l'essai de Fragments gardent l'écran d'hier.
 */
export async function chargerVueEleve(
  admin: Admin, depotId: string, eleveId: string, options: { avecPhotos?: boolean } = {},
): Promise<VueEleve | null> {
  const premier = await lireDepot(admin, depotId)
  if (!premier || premier.eleve_id !== eleveId) return null
  // Le `lieu` commande, jamais le module : un dépôt de maison n'a rien à faire ici.
  if (premier.exercice.lieu !== 'classe') return null

  // ⭐ 24/09 — L'ÉPREUVE MINUTÉE (porte `epreuve_minutee_actif`). Sa lecture OUVRE
  //    le dépôt si la moitié du temps de rédaction est passée — AVANT que la vue
  //    ne se construise, pour qu'elle dise l'état vrai. Porte fermée : null.
  const [{ epreuve, ouverts }, fuseau] = await Promise.all([
    lireEtOuvrirSiVenue(admin, premier.exercice_id), lireFuseau(),
  ])
  const d = ouverts > 0 ? (await lireDepot(admin, depotId)) ?? premier : premier

  const [seJuger, confiance, credence, messageReporte, auClavier, attente] = await Promise.all([
    offreSeJuger(admin, depotId),
    offreConfianceRemise(admin, depotId),
    offreCredence(admin, depotId),
    lireLeMessageReporte(admin, eleveId, depotId),
    eleveExempte(admin, eleveId),
    attenteDuDepot(admin, depotId),
  ])

  // ⭐⭐ C10 · L2 — « CE QUE L'ÉLÈVE NE DOIT PAS VOIR NE PART PAS DU SERVEUR »
  //    (le patron de `C10-L1`). La vue se RÉDUIT ici, là où elle se construit,
  //    pas à l'écran.
  //
  // ⛔ ET `ouvert` NE SUFFISAIT PAS : il vaut `d.ouvert_par_prof_at != null`,
  //    une colonne que la clôture NE TOUCHE PAS. `EcranEleve` ne testait que
  //    `!vue.ouvert` — un élève qui revenait par l'URL directe sur un dépôt clos
  //    voyait donc son formulaire de dépôt ENTIER. La vue ne recopiait même pas
  //    `d.statut` : l'écran n'avait aucun moyen de le savoir.
  const clos = depotClos(d)
  // Les trois offres de Monitoring se taisent : leurs actions serveur refusent
  // désormais un dépôt clos — servir le formulaire proposerait un geste refusé.
  const tu = (motif: string) => ({ servie: false as const, motif })

  return {
    depotId: d.id,
    consigne: enTexte(d.exercice.consigne_instanciee),
    ouvert: d.ouvert_par_prof_at != null,
    clos,
    auClavier,
    photos: d.photos_v1,
    transcription: d.transcription_v1,
    texteClavier: d.texte_v1,
    doutes: (d.transcription_v1_doutes ?? null) as Doute[] | null,
    valide: d.v1_remis_at != null,
    messageReporte,
    rappelLisibilite: RAPPEL_LISIBILITE,
    seJuger: clos ? { ...seJuger, ...tu(MESSAGE_DEPOT_CLOS), questions: [] } : seJuger,
    confiance: clos ? { ...confiance, ...tu(MESSAGE_DEPOT_CLOS), competences: [] } : confiance,
    libellesConfiance: LIBELLES_CONFIANCE,
    credence: clos ? { ...credence, ...tu(MESSAGE_DEPOT_CLOS), cas: [] } : credence,
    pagesMax: lireConfigPassation().pagesMax,
    retourPublie: retourPublie(await lireLesRetours(admin, depotId), d),
    attente: attente.map((a) => ({
      etape: a.etape, statut: a.statut, echec_definitif: a.echec_definitif, message: a.message,
    })),
    epreuve: vueDeLEpreuve(epreuve, fuseau),
    // Les photos ne se montrent qu'à la RELECTURE : avant l'ouverture, il n'y en a pas.
    photosLisibles: options.avecPhotos && d.ouvert_par_prof_at != null && !clos
      ? await photosLisibles(admin, d.photos_v1, prefixeDepot(eleveId, depotId))
      : [],
    gestes: {
      // `juger_fin_at` n'est posé que par l'enregistrement de « se juger » ;
      // `confiance_declaree` que par celui de la confiance de remise.
      jugerFait: d.juger_fin_at != null,
      confianceFaite: d.confiance_declaree != null,
      credenceFaite: credence.servie ? await credenceDonnee(admin, depotId) : false,
    },
  }
}

/**
 * ⭐ 24/09 — la crédence est-elle déjà donnée ? Elle vit sur la ligne de
 *    métacognition (`credence`, une entrée par cas). Lue seulement quand l'offre
 *    est servie — jamais pour l'essai d'examen, qui n'a pas de cran. Une lecture
 *    ratée se lit « pas donnée » : l'écran la redemande, l'action tranche.
 */
async function credenceDonnee(admin: Admin, depotId: string): Promise<boolean> {
  const { data, error } = await admin.from('exercices_metacognition')
    .select('credence').eq('depot_id', depotId).maybeSingle()
  if (error) {
    console.error(`[passation] crédence illisible ${depotId} — ${error.code} ${error.message}`)
    return false
  }
  return Array.isArray(data?.credence) && data.credence.length > 0
}

/**
 * ⭐ 24/09 — ce que la tablette sait de l'épreuve : préparée (durée fixée),
 *    lancée, l'heure d'ouverture du dépôt, les consignes pratiques. Null quand
 *    la porte est fermée ou que l'examen n'est pas minuté : l'écran est alors
 *    celui d'hier.
 */
function vueDeLEpreuve(
  e: Awaited<ReturnType<typeof lireEtOuvrirSiVenue>>['epreuve'], fuseau: string,
): VueEleve['epreuve'] {
  if (!e || !e.estUnEssaiCodex) return null
  // ⭐ Revue du 24/09 : les consignes pratiques se montrent à l'élève MÊME sans
  //    durée fixée — la projection les montre, la tablette aussi.
  if (!estPreparee(e)) {
    return e.consignesPratiques
      ? { preparee: false, lancee: false, ouverture: null, consignesPratiques: e.consignesPratiques, fuseau }
      : null
  }
  const frise = e.debut ? friseDe(e, Date.now()) : null
  return {
    preparee: true,
    lancee: !!e.debut,
    ouverture: frise?.ouvertureMs != null ? new Date(frise.ouvertureMs).toISOString() : null,
    consignesPratiques: e.consignesPratiques,
    fuseau,
  }
}

/**
 * ⭐ 24/09 — LES PHOTOS DE L'ÉLÈVE, LISIBLES À CÔTÉ DE SON TEXTE (handoff, écran
 *    « Relire ») : aucun lecteur du bucket n'existait, l'élève corrigeait la
 *    lecture de la machine sans pouvoir regarder sa page. URL signées, UNE heure
 *    — le temps d'une relecture. Une URL ratée laisse la page sans image, jamais
 *    l'écran sans texte.
 * ⛔ REVUE DU 24/09 — posséder le dépôt ne dit RIEN du chemin des photos :
 *    `photos_v1` porte ce que l'ÉCRAN a envoyé, et une requête forgée pouvait y
 *    écrire le chemin de la copie d'un autre élève, que la clé de service aurait
 *    signé. On ne signe donc QUE sous le préfixe du dépôt, dans le bucket de la
 *    passation — et `enregistrerLesPhotos` refuse désormais le reste à l'écriture.
 */
/**
 * ⚠️ Revue du 24/09 : UNE heure ne suffisait pas — rien ne relit la page pendant la
 *    relecture, et une page photographiée à la moitié d'une rédaction de 90 min
 *    se relisait encore une heure plus tard. Huit heures couvrent l'épreuve la
 *    plus longue que la conception admet (rédaction 300 min + relecture 120 min).
 *    Ce sont les photos de l'élève, signées pour lui seul.
 */
const DUREE_URL_PHOTO = 8 * 3600

async function photosLisibles(
  admin: Admin, photos: Photo[] | null, prefixe: string,
): Promise<VueEleve['photosLisibles']> {
  const pages = [...(photos ?? [])].sort((a, b) => a.ordre - b.ordre)
  if (pages.length === 0) return []
  const parBucket = new Map<string, string[]>()
  for (const p of pages) {
    if (p.page_manquante || !p.chemin) continue
    const b = p.bucket ?? BUCKET
    if (b !== BUCKET || !p.chemin.startsWith(`${prefixe}/`)) continue
    parBucket.set(b, [...(parBucket.get(b) ?? []), p.chemin])
  }
  const url = new Map<string, string>()
  for (const [bucket, chemins] of parBucket) {
    const { data, error } = await admin.storage.from(bucket).createSignedUrls(chemins, DUREE_URL_PHOTO)
    if (error) {
      console.error(`[passation] photos illisibles (${bucket}) — ${error.message}`)
      continue
    }
    for (const s of data ?? []) if (s.path && s.signedUrl) url.set(`${bucket}/${s.path}`, s.signedUrl)
  }
  return pages.map((p) => ({
    ordre: p.ordre,
    rotation: p.rotation,
    manquante: p.page_manquante,
    url: p.chemin ? url.get(`${p.bucket ?? BUCKET}/${p.chemin}`) ?? null : null,
  }))
}

export async function chargerVueProf(
  admin: Admin, exerciceId: string, actif: boolean,
): Promise<VueProf | null> {
  const { data: ex, error } = await admin.from('exercices')
    .select('id, lieu, consigne_instanciee, optin_se_juger, optin_confiance_remise')
    .eq('id', exerciceId).maybeSingle()
  if (error || !ex) return null

  const { depots, tronque } = await lireDepotsDeLInstance(admin, exerciceId)
  // ⭐ 18/09 — LES COPIES SE LISENT ENSEMBLE. Avant : les retours et l'attente de
  //    chaque copie, l'une après l'autre — 70 ms par élève, mesuré en prod
  //    (16 copies → 1,9 s, 23 copies → 2,4 s). Maintenant : les noms, tous les
  //    retours et toutes les attentes de l'instance partent en trois lectures,
  //    et chaque copie retrouve les siens par son identifiant.
  const depotIds = depots.map((d) => d.id)
  const [noms, retoursParDepot, attenteParDepot] = await Promise.all([
    lireLesNoms(admin, depots.map((d) => d.eleve_id)),
    lireLesRetoursDeDepots(admin, depotIds),
    attenteDesDepots(admin, depotIds),
  ])

  const copies: LigneCopie[] = []
  for (const d of depots) {
    const retours = retoursParDepot.get(d.id) ?? []
    const attente = attenteParDepot.get(d.id) ?? []
    // Le retour « chaud » est celui que la correction en classe regarde ; le
    // « final » n'existe pas ici — la séquence de classe s'arrête à
    // `retour_publie` (piège 4).
    const r = retours.find((x) => x.moment === 'chaud') ?? retours[0] ?? null
    const points = r ? pointsAAfficher(r) : []
    const copie = d.transcription_v1 ?? d.texte_v1
    copies.push({
      depotId: d.id,
      eleve: noms.get(d.eleve_id) ?? d.eleve_id.slice(0, 8),
      statut: d.statut,
      aDeposé: (d.photos_v1?.length ?? 0) > 0,
      // ⚠️ LA COPIE, C'EST L'UN OU L'AUTRE — la transcription des photos, ou le
      //    texte tapé par l'élève EXEMPTÉ. L'écran ne lisait que la première
      //    jusqu'au 22/08 : la copie d'un élève exempté n'apparaissait NULLE
      //    PART côté professeur, qui corrigeait à l'aveugle un retour dont la
      //    chaîne, elle, avait bien lu le texte (`utils/chaine/contexte.ts`,
      //    `production()` lit `texte_v1` OU `transcription_v1`).
      copie,
      // ⭐⭐ C10 · L2 — « REMIS » ET « PORTE DU TRAVAIL » SONT DEUX PRÉDICATS
      //    DIFFÉRENTS, et la source n'a retenu que le premier. Mesuré en
      //    production le 07/09 : un dépôt `ouvert`, `v1_remis_at` NULL — donc
      //    « jamais remis » — porte 2 photos, une transcription de 2 266
      //    caractères, 20 doutes et un commentaire du professeur. Le clore sans
      //    le dire serait un mensonge en base. La confirmation les nomme à part.
      //
      // ⛔ Le prédicat n'est pas recopié : c'est celui du retrait, PUR et écrit
      //    pour cette question — « le statut ne dit rien du travail » (décision
      //    de Louis, 25/08). En classe, ses champs `_vf` sont NULL par trigger.
      porteDuTravail: depotPorteDuTravail({
        statut: d.statut, texte_v1: d.texte_v1, texte_vf: null,
        transcription_v1: d.transcription_v1, transcription_vf: null,
        photos_v1: d.photos_v1, photos_vf: null,
      }),
      auClavier: d.transcription_v1 == null && d.texte_v1 != null,
      nbBlocs: copie ? blocs(copie).length : 0,
      doutes: Array.isArray(d.transcription_v1_doutes) ? d.transcription_v1_doutes.length : 0,
      collages: lireLesCollages(d.collages_bloques),
      commentaire: d.commentaire_general,
      remiseLe: d.v1_remis_at,
      valideeLe: d.corrige_at,
      messageReporte: d.message_lisibilite_reporte,
      retour: r ? {
        id: r.id,
        points: points as PointRetour[],
        edite: r.texte_edite_par_prof != null,
        feedForward: r.feed_forward,
        actionRevision: r.action_revision,
        publieLe: r.published_at,
        luLe: r.lu_at,
      } : null,
      attente: attente.map((a) => ({
        etape: a.etape, statut: a.statut, echec_definitif: a.echec_definitif, message: a.message,
      })),
    })
  }

  return {
    exerciceId: ex.id as string,
    titre: enTexte(ex.consigne_instanciee),
    lieu: String(ex.lieu),
    ouvertLe: premiereOuverture(depots),
    drapeaux: {
      seJuger: !!ex.optin_se_juger,
      confianceRemise: !!ex.optin_confiance_remise,
    },
    copies,
    avertissements: avertissementsDuPrompt(),
    tronque,
    actif,
  }
}

/**
 * Le retour que l'élève voit, ET SEULEMENT S'IL EST PUBLIÉ.
 *
 * « Le retour devient visible QUAND IL COCHE LA CASE DE PUBLICATION »
 * (`02-` §6.D, étape 17). Un retour non publié n'existe pas pour l'élève : ce
 * n'est pas un affichage masqué, c'est une absence.
 *
 * ⚠️ C'est le texte ÉDITÉ qui part, s'il existe — le professeur a le dernier mot.
 */
function retourPublie(
  retours: Awaited<ReturnType<typeof lireLesRetours>>, d: DepotDePassation,
): VueEleve['retourPublie'] {
  const r = retours.find((x) => x.published_at != null)
  if (!r) return null
  return {
    id: r.id,
    points: pointsAAfficher(r).map((p) => ({
      id: p.id, texte: p.texte, competence: p.competence, nature: p.nature,
      ancrage: p.ancrage ? { source: p.ancrage.source, citation: p.ancrage.citation } : undefined,
    })),
    feedForward: r.feed_forward,
    commentaireGeneral: d.commentaire_general,
    luLe: r.lu_at,
  }
}

function premiereOuverture(depots: readonly DepotDePassation[]): string | null {
  const dates = depots.map((d) => d.ouvert_par_prof_at).filter((x): x is string => x != null)
  return dates.length ? dates.slice().sort()[0] : null
}

async function lireLesNoms(admin: Admin, eleveIds: readonly string[]): Promise<Map<string, string>> {
  const uniques = [...new Set(eleveIds)]
  if (uniques.length === 0) return new Map()
  const { data, error } = await admin
    .from('profiles').select('id, display_name').in('id', uniques)
  if (error) {
    console.error(`[passation] noms illisibles — ${error.code} ${error.message}`)
    return new Map()
  }
  return new Map((data ?? []).map((p) => [String(p.id), String(p.display_name ?? '')]))
}

/** La consigne, quelle que soit sa forme physique — le §1.1 la laisse libre. */
export function enTexte(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) {
    // Une paire de diagnostic en déclare DEUX, dans l'ordre (`02-` §2.3.1 a).
    return v.map((c, i) => `${i + 1}. ${enTexte(c)}`).join('\n\n')
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.texte === 'string') return o.texte
    if (typeof o.consigne === 'string') return o.consigne
  }
  return ''
}

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
import { lireDepot, lireDepotsDeLInstance, attenteDuDepot, lireLeMessageReporte,
  eleveExempte, type DepotDePassation } from './depots'
import { lireLesRetours, pointsAAfficher } from './retours'
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

export async function chargerVueEleve(
  admin: Admin, depotId: string, eleveId: string,
): Promise<VueEleve | null> {
  const d = await lireDepot(admin, depotId)
  if (!d || d.eleve_id !== eleveId) return null
  // Le `lieu` commande, jamais le module : un dépôt de maison n'a rien à faire ici.
  if (d.exercice.lieu !== 'classe') return null

  const [seJuger, confiance, credence, messageReporte, auClavier, attente] = await Promise.all([
    offreSeJuger(admin, depotId),
    offreConfianceRemise(admin, depotId),
    offreCredence(admin, depotId),
    lireLeMessageReporte(admin, eleveId, depotId),
    eleveExempte(admin, eleveId),
    attenteDuDepot(admin, depotId),
  ])

  return {
    depotId: d.id,
    consigne: enTexte(d.exercice.consigne_instanciee),
    ouvert: d.ouvert_par_prof_at != null,
    auClavier,
    photos: d.photos_v1,
    transcription: d.transcription_v1,
    texteClavier: d.texte_v1,
    doutes: (d.transcription_v1_doutes ?? null) as Doute[] | null,
    valide: d.v1_remis_at != null,
    messageReporte,
    rappelLisibilite: RAPPEL_LISIBILITE,
    seJuger,
    confiance,
    libellesConfiance: LIBELLES_CONFIANCE,
    credence,
    pagesMax: lireConfigPassation().pagesMax,
    retourPublie: retourPublie(await lireLesRetours(admin, depotId), d),
    attente: attente.map((a) => ({
      etape: a.etape, statut: a.statut, echec_definitif: a.echec_definitif, message: a.message,
    })),
  }
}

export async function chargerVueProf(
  admin: Admin, exerciceId: string, actif: boolean,
): Promise<VueProf | null> {
  const { data: ex, error } = await admin.from('exercices')
    .select('id, lieu, consigne_instanciee, optin_se_juger, optin_confiance_remise')
    .eq('id', exerciceId).maybeSingle()
  if (error || !ex) return null

  const { depots, tronque } = await lireDepotsDeLInstance(admin, exerciceId)
  const noms = await lireLesNoms(admin, depots.map((d) => d.eleve_id))

  const copies: LigneCopie[] = []
  for (const d of depots) {
    const [retours, attente] = await Promise.all([
      lireLesRetours(admin, d.id),
      attenteDuDepot(admin, d.id),
    ])
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

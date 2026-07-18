'use server'
// Server actions du MODÈLE de plan d'évaluation (class-agnostique, Lot C). Écrivent
// UNIQUEMENT dans scriptorium_modeles_plan(_exercices) : AUCUNE classe, AUCUN hook de
// synthèse (concept d'instance), AUCUN flux vivant. GATÉES (verifierProfGate) — inertes
// gate OFF. Réutilisent les MÊMES générateurs purs que creerPlan (genererCadence +
// placerDiagnostics). Voir SPEC §5.1.
import { revalidatePath } from 'next/cache'
import { verifierProfGate, estLundi, TYPE_MANUEL } from './gate'
import { anneeScolaireDe } from '@/utils/frise-enseignement'
import { genererCadence, placerDiagnostics, asPlanConfig, type Gabarit, type ExerciceGenere, type PlanConfig } from '@/utils/plan-cadence'
import { semainesCouvertes } from './plan-serveur'

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GABARITS: Gabarit[] = ['tc', 'hlp', 'vierge']

// ExerciceGenere → ligne modèle : PAS de plan_id / jour_prevu / statut (un exercice de
// modèle n'est ni conçu ni daté au jour — juste un créneau typé, ancré frise globale).
function construireRowsModele(generes: ExerciceGenere[], modeleId: string): Record<string, unknown>[] {
  return generes.map((g) => ({
    modele_id: modeleId,
    type_exercice: g.type_exercice,
    diagnostique: g.diagnostique,
    nature: g.nature,
    lieu: g.lieu,
    module: g.module,
    ancrage: 'semaine',
    semaine_lundi: g.semaine_lundi,
    origine: g.origine,
    fenetre_diagnostique: g.fenetre_diagnostique ?? null,
  }))
}

// Cadence + diagnostics d'un modèle depuis sa date_debut (frise globale résolue en
// interne). Un modèle n'a pas de « passé » : on génère toute l'AY depuis l'ancre.
// vierge / frise vide → aucune ligne.
async function rowsModele(
  modeleId: string, dateDebut: string, gabarit: Gabarit, config: PlanConfig = {},
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  if (gabarit === 'vierge') return { rows: [] }
  const { couvertes, frise, ay, ancreLundi, avisBloquant } = await semainesCouvertes(dateDebut)
  if (avisBloquant || !ancreLundi) return { rows: [] }
  let generes: ExerciceGenere[]
  try {
    generes = [...genererCadence(couvertes, gabarit, config), ...placerDiagnostics(frise, ay, ancreLundi)]
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : 'Génération impossible.' }
  }
  return { rows: construireRowsModele(generes, modeleId) }
}

/**
 * Créer un modèle (SANS classe). Reprend la logique de creerPlan : frise résolue AVANT
 * l'INSERT (refus si aucune semaine couverte / semestres incohérents — pas de brouillon
 * vide), génération cadence + diagnostics, rollback si la génération échoue. Ne pose NI
 * classe NI hook de synthèse.
 */
export async function creerModele(formData: FormData): Promise<{ id?: string; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase, userId } = gardé
  const titre = ((formData.get('titre') as string) ?? '').trim()
  const gabarit = (formData.get('gabarit') as string) ?? ''
  const dateDebut = (formData.get('date_debut') as string) || ''
  if (!titre) return { error: 'Donne un titre au modèle.' }
  if (!GABARITS.includes(gabarit as Gabarit)) return { error: 'Choisis un gabarit (TC, HLP ou vierge).' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDebut)) return { error: 'Choisis une date de début.' }

  const ay = anneeScolaireDe(dateDebut)
  const { ancreLundi, avisBloquant } = await semainesCouvertes(dateDebut)
  if (avisBloquant) return { error: 'Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier avant de créer le modèle.' }
  if (!ancreLundi) return { error: 'Aucune semaine d’enseignement à venir pour cette date — définis d’abord les semestres dans le Calendrier.' }

  const { data: modele, error } = await supabase
    .from('scriptorium_modeles_plan')
    .insert({ titre, annee_scolaire: ay, gabarit, date_debut: dateDebut, statut: 'brouillon', created_by: userId })
    .select('id')
    .single()
  if (error || !modele) return { error: error?.message ?? 'Création impossible.' }
  const modeleId = modele.id as string

  if (gabarit !== 'vierge') {
    const { rows, error: eGen } = await rowsModele(modeleId, dateDebut, gabarit as Gabarit)
    if (eGen) { await supabase.from('scriptorium_modeles_plan').delete().eq('id', modeleId); return { error: eGen } }
    if (rows.length) {
      const { error: eIns } = await supabase.from('scriptorium_modeles_plan_exercices').insert(rows)
      if (eIns) { await supabase.from('scriptorium_modeles_plan').delete().eq('id', modeleId); return { error: `Génération impossible (${eIns.message}). Réessaie.` } }
    }
  }
  revalidatePath('/prof/scriptorium')
  return { id: modeleId }
}

/** Ajouter un exercice manuel au modèle (`type_exercice` = ID DE PALETTE, TYPE_MANUEL). */
export async function ajouterExerciceModele(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const modeleId = (formData.get('modele_id') as string) ?? ''
  const semaineLundi = (formData.get('semaine_lundi') as string) ?? ''
  const paletteId = (formData.get('type_exercice') as string) ?? ''
  if (!RE_UUID.test(modeleId)) return { error: 'Modèle invalide.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semaineLundi) || !estLundi(semaineLundi)) return { error: 'Semaine invalide.' }
  const spec = TYPE_MANUEL[paletteId]
  if (!spec) return { error: 'Type d’exercice non ajoutable à la main.' }

  const { error } = await supabase.from('scriptorium_modeles_plan_exercices').insert({
    modele_id: modeleId,
    type_exercice: spec.type_exercice,
    diagnostique: spec.diagnostique,
    nature: spec.nature,
    lieu: spec.lieu,
    module: spec.module,
    ancrage: 'semaine',
    semaine_lundi: semaineLundi,
    origine: 'manuel',
    fenetre_diagnostique: null,
  })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** Retirer un exercice du modèle : DELETE DUR (aucun consommateur, pas de tombstone). */
export async function retirerExerciceModele(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }
  const { error } = await gardé.supabase.from('scriptorium_modeles_plan_exercices').delete().eq('id', exerciceId)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** Déplacer un exercice de modèle vers une autre semaine. Une ligne 'cadence' bascule
 *  'manuel' (libère la clé uk_modele_exos_cadence). */
export async function deplacerExerciceModele(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  const semaineLundi = (formData.get('semaine_lundi') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semaineLundi) || !estLundi(semaineLundi)) return { error: 'La semaine cible doit être un lundi.' }

  const { data: exo } = await supabase
    .from('scriptorium_modeles_plan_exercices').select('origine').eq('id', exerciceId).maybeSingle()
  if (!exo) return { error: 'Exercice introuvable.' }
  const origine = exo.origine === 'cadence' ? 'manuel' : (exo.origine as string)

  const { error } = await supabase
    .from('scriptorium_modeles_plan_exercices')
    .update({ semaine_lundi: semaineLundi, origine, updated_at: new Date().toISOString() })
    .eq('id', exerciceId)
  if (error) {
    if (error.code === '23505') return { error: 'Un exercice de cadence du même type occupe déjà cette semaine.' }
    return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/**
 * Régénérer le modèle (« changer de gabarit »). Périmètre = TOUTES les lignes
 * cadence/diagnostic (un modèle n'a ni « passé » ni conçu à préserver — c'est un
 * gabarit ; les lignes MANUELLES restent). Diff obligatoire (confirmer=false → aperçu).
 * Application : delete dur du périmètre puis insertion ; compensation best-effort si
 * l'insert échoue (pas d'atomicité sans RPC ; modèle = gate OFF, aucun consommateur).
 */
export async function regenererModele(
  modeleId: string, nouveauGabarit: string, confirmer: boolean,
): Promise<{ needsConfirm?: boolean; nbSupprimes?: number; nbGeneres?: number; success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  if (!RE_UUID.test(modeleId)) return { error: 'Modèle invalide.' }
  if (!GABARITS.includes(nouveauGabarit as Gabarit)) return { error: 'Gabarit invalide.' }

  const { data: modele } = await supabase
    .from('scriptorium_modeles_plan').select('date_debut, config').eq('id', modeleId).is('supprime_at', null).maybeSingle()
  if (!modele) return { error: 'Modèle introuvable.' }
  const dateDebut = modele.date_debut as string
  const config = asPlanConfig(modele.config)

  // Fail-closed comme creerModele : régénérer vers TC/HLP sur une frise cassée (semestres
  // incohérents, ou date_debut sans semaine à venir après une modif du Calendrier) NE doit
  // PAS vider le modèle en silence. On refuse AVANT toute écriture. Le 'vierge' vide
  // légitimement (aucune génération attendue) → pas de garde pour lui.
  if (nouveauGabarit !== 'vierge') {
    const { ancreLundi, avisBloquant } = await semainesCouvertes(dateDebut)
    if (avisBloquant) return { error: 'Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier avant de régénérer.' }
    if (!ancreLundi) return { error: 'Aucune semaine d’enseignement à venir pour ce modèle — définis les semestres dans le Calendrier.' }
  }

  const { data: perim } = await supabase
    .from('scriptorium_modeles_plan_exercices')
    .select('type_exercice, diagnostique, nature, lieu, module, ancrage, semaine_lundi, origine, fenetre_diagnostique')
    .eq('modele_id', modeleId)
    .in('origine', ['cadence', 'diagnostic'])
  const perimRows = (perim ?? []) as Record<string, unknown>[]

  const { rows, error: eGen } = await rowsModele(modeleId, dateDebut, nouveauGabarit as Gabarit, config)
  if (eGen) return { error: eGen }

  if (!confirmer) return { needsConfirm: true, nbSupprimes: perimRows.length, nbGeneres: rows.length }

  if (perimRows.length) {
    const { error: eDel } = await supabase
      .from('scriptorium_modeles_plan_exercices').delete().eq('modele_id', modeleId).in('origine', ['cadence', 'diagnostic'])
    if (eDel) return { error: eDel.message }
  }
  if (rows.length) {
    const { error: eIns } = await supabase.from('scriptorium_modeles_plan_exercices').insert(rows)
    if (eIns) {
      // Compensation : réinsère le périmètre supprimé (données capturées, nouveaux ids).
      // Si la restauration ÉCHOUE aussi, on le signale (sinon perte silencieuse — les
      // lignes de génération sont déterministes : une régénération réussie les recrée).
      let restauration = ''
      if (perimRows.length) {
        const { error: eRestore } = await supabase.from('scriptorium_modeles_plan_exercices').insert(
          perimRows.map((r) => ({ ...r, modele_id: modeleId })),
        )
        if (eRestore) restauration = ` — ÉCHEC de la restauration : ${perimRows.length} exercice(s) de génération perdus, relance une régénération`
      }
      return { error: `Régénération annulée (${eIns.message})${restauration}.` }
    }
  }
  const { error: eMaj } = await supabase
    .from('scriptorium_modeles_plan').update({ gabarit: nouveauGabarit, updated_at: new Date().toISOString() }).eq('id', modeleId)
  if (eMaj) return { error: eMaj.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** Basculer le statut du modèle : brouillon ↔ pret (assignable, Lot D). */
export async function marquerModelePret(modeleId: string, pret: boolean): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  if (!RE_UUID.test(modeleId)) return { error: 'Modèle invalide.' }
  const { error } = await gardé.supabase
    .from('scriptorium_modeles_plan')
    .update({ statut: pret ? 'pret' : 'brouillon', updated_at: new Date().toISOString() })
    .eq('id', modeleId).is('supprime_at', null)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** Supprimer un modèle (soft-delete). Les instances déjà matérialisées (modele_id)
 *  SURVIVENT — la FK est `set null` et n'agit qu'au delete DUR ; un soft-delete les laisse
 *  pointer un modèle masqué (leur provenance reste résoluble). Aucune cascade. */
export async function supprimerModele(modeleId: string): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  if (!RE_UUID.test(modeleId)) return { error: 'Modèle invalide.' }
  const { error } = await gardé.supabase
    .from('scriptorium_modeles_plan')
    .update({ supprime_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', modeleId).is('supprime_at', null)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

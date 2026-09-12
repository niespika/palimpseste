import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Doctrine } from '@/utils/fabrique/doctrine'
import { lirePagine } from '@/utils/routeur/donnees'
import type { InstanceDuVivier } from '@/utils/moteur/vivier'
import type { LigneDeDecision } from '@/utils/moteur/decision'
import { portePilote, sujetsAdmissibles } from './serveur'
import { parcoursDeClasse } from './admissibilite'
import { identifiantOffre, instanceArgument, contratDeDecision } from './distribution'
import type { ContratServi } from './contrat'

export async function porteBanqueArgument(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin.from('scriptorium_params').select('pilote_argument_banque_actif').eq('id', 1).maybeSingle()
  if (error && !['42703', 'PGRST204'].includes(error.code)) throw new Error(`Porte banque argument illisible : ${error.message}`)
  return !error && data?.pilote_argument_banque_actif === true && await portePilote(admin)
}

/** Cache borné à UN passage, jamais partagé entre requêtes ni environnements. */
export function chargeurBanqueArgument(admin: SupabaseClient, doctrine: Doctrine) {
  const offres = new Map<string, ReturnType<typeof sujetsAdmissibles>>()
  return async (eleve: string, classes: string[]): Promise<InstanceDuVivier[]> => {
    const { data, error } = await admin.from('classes').select('id,niveau,type_pedagogique,statut').in('id', classes)
    if (error) throw error
    const historique = await instancesArgumentAttribuees(admin, eleve, doctrine)
    const deja = new Set(historique.flatMap(i => i.argumentAttribue ? [identifiantOffre(eleve, i.argumentAttribue)] : []))
    const instances: InstanceDuVivier[] = []
    for (const classe of data ?? []) {
      if (classe.statut !== 'active' || !parcoursDeClasse(classe)) continue
      if (!offres.has(classe.id)) offres.set(classe.id, sujetsAdmissibles(admin, classe.id))
      const offre = await offres.get(classe.id)!
      for (const choix of offre.sujets) for (const cran of [6, 8] as const) {
        const o = { parcours: offre.parcours, classe_id: classe.id, cran,
          sujet: { id: choix.sujet.id, enonce: choix.sujet.enonce, notions: choix.sujet.notions }, admissibilite: choix.admissibilite }
        const id = identifiantOffre(eleve, o)
        if (!deja.has(id)) instances.push(instanceArgument(id, o, doctrine))
      }
    }
    return instances
  }
}

/** Pour reconstruire la semaine du bonus, même si la porte a été refermée. */
export async function instancesArgumentAttribuees(admin: SupabaseClient, eleve: string, doctrine: Doctrine): Promise<InstanceDuVivier[]> {
  const lignes = await lirePagine<{ id: string; exercice_id: string; exercices: { exercices_pilote_argument: { contrat: ContratServi } | null } }>(
    admin, 'exercices_depots', 'id,exercice_id,exercices!inner(exercices_pilote_argument!inner(contrat))', ['id'], q => q.eq('eleve_id', eleve))
  return lignes.flatMap(l => {
    const contrat = l.exercices.exercices_pilote_argument?.contrat
    if (!contrat) return []
    const instance = instanceArgument(l.exercice_id, contrat, doctrine)
    // Historique uniquement : ni une nouvelle offre, ni des modes inventés.
    delete instance.piloteArgument
    instance.argumentAttribue = contrat
    instance.modesParCompetence = Object.fromEntries([contrat.principale, contrat.secondaire].filter(Boolean).map(c => [c!, ['composer']]))
    return [instance]
  })
}

export interface ServiceArgument {
  deja_servi: boolean
  depots: Array<{ depot_id: string; exercice_id: string; decision_id: string }>
}

export async function persisterAvecArguments(admin: SupabaseClient, lignes: readonly LigneDeDecision[],
  instances: readonly InstanceDuVivier[], contexte: { eleveId: string; cycleLundi: string; echeance: string }, bonusRang = -1): Promise<ServiceArgument> {
  const contrats: Record<string, ContratServi> = {}
  // Revérifier l'offre juste avant la transaction (cours/classe/sujet actuels).
  const verifications = new Map<string, Awaited<ReturnType<typeof sujetsAdmissibles>>>()
  for (const ligne of lignes) {
    const offre = instances.find(i => i.exerciceId === ligne.exercice_id)?.piloteArgument
    if (!offre) continue
    if (!verifications.has(offre.classe_id)) verifications.set(offre.classe_id, await sujetsAdmissibles(admin, offre.classe_id))
    const actuelle = verifications.get(offre.classe_id)!
    const sujet = actuelle.sujets.find(s => s.sujet.id === offre.sujet.id)
    if (!sujet || actuelle.parcours !== offre.parcours || sujet.sujet.enonce !== offre.sujet.enonce) throw new Error('Offre argument devenue indisponible')
    contrats[ligne.exercice_id] = contratDeDecision(ligne, { ...offre, admissibilite: sujet.admissibilite })
  }
  const { data, error } = await admin.rpc('servir_banque_argument', {
    p_eleve: contexte.eleveId, p_cycle: contexte.cycleLundi, p_bonus_rang: bonusRang,
    p_lignes: lignes, p_contrats: contrats, p_echeance: `${contexte.echeance}T23:59:59Z`,
  })
  if (error) throw new Error(`Attribution automatique annulée : ${error.message}`)
  return data as ServiceArgument
}

import 'server-only'
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { lirePagine } from '@/utils/routeur/donnees'
import { lireLesCoursVus } from '@/utils/moteur/vivier-serveur'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { admissibiliteSujet, parcoursDeClasse } from './admissibilite'
import { PREFIXE_PILOTE, validerReponses, type ContratServi, type ReponseRelecture, type TraceRelecture } from './contrat'

export const empreinteTexte = (t: string) => createHash('sha256').update(t).digest('hex')
export async function portePilote(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin.from('scriptorium_params').select('pilote_argument_actif').eq('id', 1).maybeSingle()
  if (error && !['42703', 'PGRST204'].includes(error.code)) throw new Error(`Porte pilote illisible : ${error.message}`)
  return !error && data?.pilote_argument_actif === true
}
export async function lireContratPilote(admin: SupabaseClient, exerciceId: string, idImport: string | null): Promise<ContratServi | null> {
  if (!idImport?.startsWith(PREFIXE_PILOTE)) return null
  if (!await portePilote(admin)) throw new Error('Le pilote argument est fermé.')
  const { data, error } = await admin.from('exercices_pilote_argument').select('contrat').eq('exercice_id', exerciceId).single()
  if (error || !data) throw new Error('Contrat présenté introuvable ; reprise suspendue.')
  const c = data.contrat as ContratServi
  if (!c.empreinte_pedagogique || ![6,8].includes(c.cran) || !c.sujet?.enonce) throw new Error('Contrat présenté illisible')
  return c
}
export interface SujetPilote { id: string; enonce: string; notions: string[]; forme: string; statut: string; bloque: boolean; cours_etat: string }
export async function sujetsAdmissibles(admin: SupabaseClient, classeId: string) {
  const { data: classe, error } = await admin.from('classes').select('niveau,type_pedagogique,statut').eq('id', classeId).single()
  if (error || !classe || classe.statut !== 'active') throw new Error('Classe indisponible')
  const parcours = parcoursDeClasse(classe)
  if (!parcours) throw new Error('Classe hors des trois parcours du pilote')
  const jour = jourDansFuseau(new Date(), await lireFuseau())
  const lus = await lireLesCoursVus(admin, [classeId], jour)
  if (lus.incidents.length) throw new Error('Impossible de vérifier les cours de cette classe')
  const vus = lus.parClasse.get(classeId) ?? new Set<string>()
  const [cours, sujets] = await Promise.all([
    lirePagine<{ id: string; notions: string[] }>(admin, 'scriptorium_contenus', 'id,notions', ['id'], q => q.eq('type','cours').is('supprime_at',null)),
    lirePagine<SujetPilote>(admin, 'exercices_sujets', 'id,enonce,forme,notions,statut,bloque,cours_etat', ['id'], q => q.eq('statut','valide').eq('bloque',false)),
  ])
  const ouverts = cours.filter(c => vus.has(c.id))
  return { parcours, sujets: sujets.flatMap(sujet => {
    const admissibilite = admissibiliteSujet(parcours, sujet, ouverts)
    return admissibilite ? [{ sujet, admissibilite: { ...admissibilite, verifie_le: new Date().toISOString() } }] : []
  }) }
}
export async function lireTrace(admin: SupabaseClient, depotId: string): Promise<TraceRelecture | null> {
  const { data, error } = await admin.from('exercices_metacognition').select('credence').eq('depot_id', depotId).maybeSingle()
  if (error) throw new Error(`Relecture illisible : ${error.message}`)
  return (data?.credence as TraceRelecture[] | null)?.find(e => e.forme === 'auto_test') ?? null
}
export function traceUtilisable(c: ContratServi, texte: string, trace: TraceRelecture | null): TraceRelecture | null {
  if (!trace || c.cran !== 6 || trace.empreinte_texte !== empreinteTexte(texte) || !trace.reponses.length) return null
  if (trace.empreinte_pedagogique !== c.empreinte_pedagogique || trace.version_banque !== c.version
    || JSON.stringify(trace.questions_presentees) !== JSON.stringify(c.questions)
    || JSON.stringify(trace.reponses_admises) !== JSON.stringify(c.reponses_admises)) throw new Error('Trace étrangère au contrat présenté')
  validerReponses(c, texte, trace.reponses)
  return trace
}
export function creerTrace(c: ContratServi, texte: string, reponses: ReponseRelecture[]): TraceRelecture {
  validerReponses(c, texte, reponses)
  return { forme: 'auto_test', version_banque: c.version, empreinte_pedagogique: c.empreinte_pedagogique,
    empreinte_texte: empreinteTexte(texte), questions_presentees: c.questions, reponses_admises: c.reponses_admises,
    reponses, at: new Date().toISOString() }
}

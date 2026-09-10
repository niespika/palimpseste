'use server'
import { garderProf } from '@/utils/fabrique/acces'
import { portePilote, sujetsAdmissibles } from '@/utils/pilote-argument/serveur'
import { creerContrat, type CompetencePilote } from '@/utils/pilote-argument/contrat'
import { lirePagine } from '@/utils/routeur/donnees'
import { revalidatePath } from 'next/cache'

export async function attribuerArgument(saisie: { requeteId: string; classeId: string; sujetId: string; cran: 6 | 8; principale: CompetencePilote; secondaire: CompetencePilote | null }) {
  try {
    const { admin, actif } = await garderProf(false)
    if (!actif || !await portePilote(admin)) return { ok: false, message: 'Le pilote argument est fermé.' }
    if (saisie.principale === saisie.secondaire) return { ok: false, message: 'Choisis deux compétences différentes, ou aucune secondaire.' }
    const offre = await sujetsAdmissibles(admin,saisie.classeId)
    const choix = offre.sujets.find(s => s.sujet.id === saisie.sujetId)
    if (!choix) return { ok: false, message: 'Ce sujet n’est pas admissible pour cette classe aujourd’hui.' }
    const contrat = creerContrat({ cran: saisie.cran, parcours: offre.parcours, principale: saisie.principale,
      secondaire: saisie.secondaire, classe_id: saisie.classeId, contexte_fourni: '',
      sujet: { id: choix.sujet.id, enonce: choix.sujet.enonce, notions: choix.sujet.notions }, admissibilite: choix.admissibilite })
    const inscrits = await lirePagine<{ id: string; eleve_id: string }>(admin,'inscriptions','id,eleve_id',['id'],q => q.eq('classe_id',saisie.classeId).eq('statut','active'))
    if (!inscrits.length) return { ok: false, message: 'Cette classe n’a pas d’inscription active.' }
    const { data, error } = await admin.rpc('attribuer_pilote_argument', {
      p_requete: saisie.requeteId, p_contrat: contrat, p_eleves: inscrits.map(i => i.eleve_id), p_echeance: null,
    })
    if (error) throw new Error(error.message)
    revalidatePath('/prof/conception')
    revalidatePath('/eleve','layout')
    return { ok: true, message: `Argument attribué à ${inscrits.length} élève${inscrits.length > 1 ? 's' : ''}.`, exerciceId: data as string }
  } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Attribution refusée.' } }
}

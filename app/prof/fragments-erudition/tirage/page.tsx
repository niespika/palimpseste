import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { dureeOralSecondes } from '@/utils/fragments-oral'
import SceneTirage, { type CandidatTirage, type TireDuJour } from './SceneTirage'

// ----------------------------------------------------------------------------
// Vestigia · LE TIRAGE AU SORT, PAGE À PROJETER (15/09, demande de Louis).
// Avant : le tirage vivait dans un pli de l'onglet Semaine, au milieu de la
// liste des dépôts. Désormais : une page séparée que le prof ouvre sur le
// projecteur — les noms défilent, le nom tiré s'affiche avec un petit mot, et
// le sujet du fragment dessous. Un tirage à la fois : « Relancer » en tire un
// autre, en excluant ceux déjà tirés cette semaine.
//
// Mesuré en prod le 15/09 : thèmes de 27 à 285 caractères (médiane 86) ; noms
// de 25 caractères au plus ; 25 inscrits en 1HLP, 16 en THLP.
// ----------------------------------------------------------------------------

export default async function PageTirage({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string; classe?: string }>
}) {
  const { semaine: semaineId, classe: classeId } = await searchParams
  if (!semaineId || !classeId) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const [{ data: semaine }, { data: classe }, { data: inscriptions }] = await Promise.all([
    admin.from('fragments_semaines').select('id, numero, titre, semestre_id').eq('id', semaineId).maybeSingle(),
    admin.from('classes').select('id, nom, niveau').eq('id', classeId).maybeSingle(),
    admin.from('inscriptions').select('id, eleve_id').eq('classe_id', classeId).eq('statut', 'active'),
  ])
  if (!semaine || !classe) notFound()

  const inscriptionIds = (inscriptions ?? []).map(i => i.id as string)
  const eleveIds = (inscriptions ?? []).map(i => i.eleve_id as string)
  const inscriptionParEleve = Object.fromEntries((inscriptions ?? []).map(i => [i.eleve_id as string, i.id as string]))

  const [{ data: profils }, { data: depots }, { data: presentations }, { data: presentees }, { data: themes }] = inscriptionIds.length > 0
    ? await Promise.all([
        admin.from('profiles').select('id, display_name').in('id', eleveIds),
        admin.from('fragments_depots').select('eleve_id').eq('semaine_id', semaineId).in('inscription_id', inscriptionIds),
        admin.from('fragments_presentations').select('id, eleve_id, statut, created_at').eq('semaine_id', semaineId).in('inscription_id', inscriptionIds).order('created_at'),
        admin.from('fragments_presentations').select('eleve_id').eq('statut', 'presente').in('inscription_id', inscriptionIds),
        semaine.semestre_id
          ? admin.from('fragments_themes').select('inscription_id, theme').eq('semestre_id', semaine.semestre_id).in('inscription_id', inscriptionIds)
          : Promise.resolve({ data: [] as { inscription_id: string; theme: string | null }[] }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const nomParId = Object.fromEntries((profils ?? []).map(p => [p.id as string, p.display_name as string]))
  const themeParInscription = Object.fromEntries((themes ?? []).map(t => [t.inscription_id as string, (t.theme as string | null) ?? null]))
  const nbPres: Record<string, number> = {}
  for (const p of presentees ?? []) nbPres[p.eleve_id as string] = (nbPres[p.eleve_id as string] ?? 0) + 1

  const candidats: CandidatTirage[] = [...new Set((depots ?? []).map(d => d.eleve_id as string))]
    .filter(id => nomParId[id])
    .map(id => ({
      id,
      nom: nomParId[id],
      theme: themeParInscription[inscriptionParEleve[id]] ?? null,
      nbPresentations: nbPres[id] ?? 0,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  const tires: TireDuJour[] = (presentations ?? []).map(p => ({
    presentationId: p.id as string,
    eleveId: p.eleve_id as string,
    nom: nomParId[p.eleve_id as string] ?? '—',
    theme: themeParInscription[inscriptionParEleve[p.eleve_id as string]] ?? null,
    statut: p.statut as 'tire' | 'presente' | 'reporte',
  }))

  return (
    <SceneTirage
      semaineId={semaineId}
      classeId={classeId}
      classeNom={classe.nom as string}
      semaineLibelle={`Semaine ${semaine.numero ?? '?'}${semaine.titre ? ` — ${semaine.titre}` : ''}`}
      dureeSecondes={dureeOralSecondes(classe.niveau as string | null)}
      candidats={candidats}
      tiresInitiaux={tires}
    />
  )
}

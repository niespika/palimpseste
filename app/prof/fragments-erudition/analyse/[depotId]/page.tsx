import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import EditorAnalyse from './EditorAnalyse'
import type { FragmentAnalyse, FragmentPiste, FragmentPhoto } from '@/types/fragments'

export default async function PageAnalyse({
  params,
  searchParams,
}: {
  params: Promise<{ depotId: string }>
  searchParams: Promise<{ semaine?: string }>
}) {
  const { depotId } = await params
  const { semaine: semaineId } = await searchParams
  const supabase = await createClient()
  const admin = createAdminClient()

  // Garde de rôle propre (defense-in-depth, en plus de la redirection du layout /prof) :
  // cette page lit l'analyse via le client admin (bypass RLS), elle ne doit donc pas
  // dépendre uniquement du layout pour vérifier le rôle.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profilRole } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profilRole?.role !== 'prof') notFound()

  // Dépôt + photos + infos élève
  const { data: depot } = await supabase
    .from('fragments_depots')
    .select(`
      id, eleve_id, semaine_id, statut, commentaire_eleve, photos_suspectes, photo_prise_at, created_at,
      photos:fragments_photos(id, depot_id, storage_path, ordre, created_at),
      eleve:profiles(display_name, classe),
      semaine:fragments_semaines(numero, titre)
    `)
    .eq('id', depotId)
    .single()

  if (!depot) notFound()

  const eleve = depot.eleve as unknown as { display_name: string; classe: string | null } | null
  const semaine = depot.semaine as unknown as { numero: number; titre: string | null } | null
  const photos = (depot.photos as FragmentPhoto[]).sort((a, b) => a.ordre - b.ordre)

  // Anti-triche : délai écoulé entre la prise de vue (EXIF) et le dépôt.
  const photoPriseAt = (depot as { photo_prise_at?: string | null }).photo_prise_at ?? null
  const delaiPhotoMs = photoPriseAt ? new Date(depot.created_at as string).getTime() - new Date(photoPriseAt).getTime() : null
  const fmtDelai = (ms: number) => {
    const h = Math.round(ms / 3_600_000)
    return h < 48 ? `${h} h` : `${Math.round(h / 24)} jours`
  }

  // Analyse
  const { data: analyse } = await admin
    .from('fragments_analyses')
    .select('*')
    .eq('depot_id', depotId)
    .maybeSingle()

  // Pistes
  const { data: pistes } = analyse
    ? await admin
        .from('fragments_pistes')
        .select('*')
        .eq('analyse_id', analyse.id)
        .order('created_at')
    : { data: [] }

  // Navigation prev/next dans la semaine
  let depotIds: string[] = []
  if (semaineId) {
    const { data: tousDepots } = await supabase
      .from('fragments_depots')
      .select('id, eleve:profiles(display_name)')
      .eq('semaine_id', semaineId)
      .order('created_at')
    depotIds = (tousDepots ?? []).map(d => d.id)
  }

  const indexActuel = depotIds.indexOf(depotId)
  const depotPrecedent = indexActuel > 0 ? depotIds[indexActuel - 1] : null
  const depotSuivant = indexActuel < depotIds.length - 1 ? depotIds[indexActuel + 1] : null

  const titreSemaine = semaine
    ? `Semaine ${semaine.numero}${semaine.titre ? ` — ${semaine.titre}` : ''}`
    : 'Analyse'

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          {semaineId ? (
            <Link
              href={`/prof/fragments-erudition/semaine/${semaineId}`}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              ← {titreSemaine}
            </Link>
          ) : (
            <Link href="/prof/fragments-erudition" className="text-sm text-stone-500 hover:text-stone-700">
              ← Vue par semaine
            </Link>
          )}
          <h3 className="text-lg font-medium text-stone-900 mt-0.5">
            {eleve?.display_name ?? 'Élève'}
            {eleve?.classe && <span className="text-sm text-stone-400 ml-2">{eleve.classe}</span>}
          </h3>
        </div>

        {/* Navigation entre élèves */}
        {semaineId && depotIds.length > 1 && (
          <div className="flex gap-2">
            {depotPrecedent ? (
              <Link
                href={`/prof/fragments-erudition/analyse/${depotPrecedent}?semaine=${semaineId}`}
                className="text-sm px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                ← Élève précédent
              </Link>
            ) : (
              <span className="text-sm px-3 py-1.5 text-stone-300">← Élève précédent</span>
            )}
            {depotSuivant ? (
              <Link
                href={`/prof/fragments-erudition/analyse/${depotSuivant}?semaine=${semaineId}`}
                className="text-sm px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                Élève suivant →
              </Link>
            ) : (
              <span className="text-sm px-3 py-1.5 text-stone-300">Élève suivant →</span>
            )}
          </div>
        )}
      </div>

      {(depot as { photos_suspectes?: boolean }).photos_suspectes && (
        <div className="mb-3 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
          ⚠ Signal anti-triche : au moins une photo semble issue de la galerie (EXIF ancien), pas prise sur le moment.
          {delaiPhotoMs != null && delaiPhotoMs > 0 && (
            <> Photo la plus ancienne prise <strong>{fmtDelai(delaiPhotoMs)}</strong> avant le dépôt
              {photoPriseAt && <> (le {new Date(photoPriseAt).toLocaleString('fr-FR')})</>}.</>
          )}
          {' '}À vérifier — signal indicatif, non probant.
        </div>
      )}
      <EditorAnalyse
        depotId={depotId}
        eleveId={depot.eleve_id}
        commentaireEleve={depot.commentaire_eleve}
        photos={photos}
        analyse={analyse as FragmentAnalyse | null}
        pistes={(pistes ?? []) as FragmentPiste[]}
      />
    </div>
  )
}

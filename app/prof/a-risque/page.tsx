import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { calculerSante, SEUILS_SANTE, type SanteInscription } from '@/utils/sante'
import { noteVersLettre } from '@/utils/notation'

// Page dédiée « à risque » (Pilotage / tableau de bord). Remplace la petite
// liste en bas du dashboard : on explique POURQUOI chaque élève est à risque,
// avec filtre par classe et tri par sévérité.
export default async function PageARisque({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { classe: classeSel } = await searchParams

  const [sante, { data: profiles }, { data: classes }] = await Promise.all([
    calculerSante(admin),
    admin.from('profiles').select('id, display_name').eq('role', 'eleve'),
    admin.from('classes').select('id, nom').order('nom'),
  ])

  const nomEleve = new Map((profiles ?? []).map(p => [p.id as string, p.display_name as string]))
  const nomClasse = new Map((classes ?? []).map(c => [c.id as string, c.nom as string]))

  const enDifficulte = [...sante.values()].filter(s => s.enDifficulte)
  // Classes représentées parmi les élèves à risque (pour les filtres).
  const classesARisque = [...new Set(enDifficulte.map(s => s.classeId))]
    .map(id => ({ id, nom: nomClasse.get(id) ?? '—' }))
    .sort((a, b) => a.nom.localeCompare(b.nom))

  const lignes = enDifficulte
    .filter(s => !classeSel || s.classeId === classeSel)
    .sort((a, b) => b.raisons.length - a.raisons.length
      || (nomEleve.get(a.eleveId) ?? '').localeCompare(nomEleve.get(b.eleveId) ?? ''))

  // Motifs structurés (lettres, pas de /4) à partir des seuils.
  function motifs(s: SanteInscription): string[] {
    const m: string[] = []
    if (s.nbManquants >= SEUILS_SANTE.depotsManquants) m.push(`${s.nbManquants} dépôt${s.nbManquants > 1 ? 's' : ''} manquant${s.nbManquants > 1 ? 's' : ''}`)
    if (s.moyenne != null && s.moyenne < SEUILS_SANTE.moyenneSous) m.push(`Moyenne ${noteVersLettre(s.moyenne)}`)
    if (s.backlogRevision > SEUILS_SANTE.revisionEnRetard) m.push(`${s.backlogRevision} cartes en retard`)
    return m
  }

  const chip = (actif: boolean) =>
    `text-sm px-3 py-1.5 rounded-full border transition-colors ${
      actif ? 'bg-bouton text-surface border-bouton' : 'bg-surface text-encre-douce border-bordure hover:border-muet'
    }`

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prof" className="text-sm text-muet hover:text-encre-douce">← Tableau de bord</Link>
        <h2 className="text-xl font-serif text-encre mt-2">Élèves à risque</h2>
        <p className="text-sm text-muet mt-0.5">
          Un élève est signalé « à risque » dès qu&apos;un seuil est franchi : au moins {SEUILS_SANTE.depotsManquants} dépôts
          manquants, une moyenne sous {noteVersLettre(SEUILS_SANTE.moyenneSous)}, ou plus de {SEUILS_SANTE.revisionEnRetard} cartes en retard.
        </p>
      </div>

      {/* Filtre par classe */}
      {classesARisque.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Link href="/prof/a-risque" className={chip(!classeSel)}>Toutes ({enDifficulte.length})</Link>
          {classesARisque.map(c => {
            const n = enDifficulte.filter(s => s.classeId === c.id).length
            return (
              <Link key={c.id} href={`/prof/a-risque?classe=${c.id}`} className={chip(classeSel === c.id)}>
                {c.nom} ({n})
              </Link>
            )
          })}
        </div>
      )}

      {lignes.length === 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-sm text-ok">
          Aucun élève à risque {classeSel ? 'dans cette classe' : ''} 🎉
        </div>
      ) : (
        <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-parchemin-fonce border-b border-bordure">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Élève</th>
                  <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Classe</th>
                  <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Dépôts</th>
                  <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Moyenne</th>
                  <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Pourquoi</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map(s => (
                  <tr key={s.inscriptionId} className="border-t border-bordure hover:bg-parchemin-fonce">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/prof/eleves/${s.eleveId}`} className="text-encre hover:text-retard hover:underline">
                        {nomEleve.get(s.eleveId) ?? '?'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-encre-douce">{nomClasse.get(s.classeId) ?? '—'}</td>
                    <td className="px-4 py-3 text-encre-douce tabular-nums">{s.nbDeposes}/{s.nbSemainesPassees}</td>
                    <td className="px-4 py-3 text-encre-douce">{s.moyenne != null ? noteVersLettre(s.moyenne) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {motifs(s).map((m, i) => (
                          <span key={i} className="text-xs bg-retard-teinte text-retard px-2 py-0.5 rounded-full">{m}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

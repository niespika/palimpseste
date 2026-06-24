import { createAdminClient } from '@/utils/supabase/admin'

// Synthèse des coûts API du mois en cours (T5). Additionne les colonnes
// cout_api existantes (Fragments ×3, Codex) + le journal api_couts
// (Quazian, Aletheia). Aucun double comptage (chaque module = une seule source).
type Admin = ReturnType<typeof createAdminClient>

async function sommeColonne(admin: Admin, table: string, depuis: string): Promise<number> {
  const { data } = await admin.from(table).select('cout_api').gte('created_at', depuis)
  return (data ?? []).reduce((s, r) => s + (Number((r as { cout_api: number | null }).cout_api) || 0), 0)
}

function fmt(n: number): string {
  return '$' + (n < 1 ? n.toFixed(4) : n.toFixed(2))
}

export default async function CoutApi() {
  const admin = createAdminClient()
  const now = new Date()
  const moisDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const moisLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const [fEcrit, fEssai, fSynth, codex, { data: log }] = await Promise.all([
    sommeColonne(admin, 'fragments_analyses', moisDebut),
    sommeColonne(admin, 'fragments_essai_depot_analyses', moisDebut),
    sommeColonne(admin, 'fragments_syntheses', moisDebut),
    sommeColonne(admin, 'codex_travaux', moisDebut),
    admin.from('api_couts').select('module, cout').gte('created_at', moisDebut),
  ])

  const parModule = new Map<string, number>()
  parModule.set('Fragments', fEcrit + fEssai + fSynth)
  parModule.set('Codex', codex)
  for (const r of log ?? []) {
    const nom = (r.module as string) === 'quazian' ? 'Quazian' : (r.module as string) === 'aletheia' ? 'Aletheia' : (r.module as string)
    parModule.set(nom, (parModule.get(nom) ?? 0) + (Number(r.cout) || 0))
  }
  const total = [...parModule.values()].reduce((s, v) => s + v, 0)
  const lignes = [...parModule.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muet uppercase tracking-wide">Coût API</h3>
      <div className="bg-surface border border-bordure rounded-xl p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-2xl font-serif text-encre">{fmt(total)}</p>
          <p className="text-xs text-muet capitalize">{moisLabel}</p>
        </div>
        {lignes.length === 0 ? (
          <p className="text-sm text-muet mt-2">Aucun coût ce mois-ci.</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {lignes.map(([nom, v]) => (
              <span key={nom} className="text-sm text-encre-douce">
                {nom} <span className="text-muet">{fmt(v)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

import { createAdminClient } from '@/utils/supabase/admin'
import { formatInstant, jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'

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

// Rendu en UNE ligne du fil « À préparer » du tableau de bord (pastille bleue,
// montant du mois + détail par module discret) — plus de section isolée.
export default async function CoutApi() {
  const admin = createAdminClient()
  const now = new Date()
  const tz = await lireFuseau()
  // Borne de début de mois ET libellé dérivés du MÊME fuseau (sinon, aux bascules de
  // mois, la fenêtre filtrée et le mois annoncé pouvaient diverger).
  const moisDebut = `${jourDansFuseau(now, tz).slice(0, 7)}-01`
  const moisLabel = formatInstant(now, tz, { month: 'long', year: 'numeric' })

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
    <div className="bg-surface border border-bordure rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-info flex-shrink-0" aria-hidden />
        <span className="font-corps text-base text-encre flex-1">Coût API · <span className="capitalize">{moisLabel}</span></span>
        <span className="font-titre text-lg text-encre">{fmt(total)}</span>
      </div>
      {lignes.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 pl-[22px]">
          {lignes.map(([nom, v]) => (
            <span key={nom} className="font-ui text-xs text-muet">{nom} {fmt(v)}</span>
          ))}
        </div>
      )}
    </div>
  )
}

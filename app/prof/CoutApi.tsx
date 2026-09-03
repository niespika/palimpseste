import { createAdminClient } from '@/utils/supabase/admin'
import { formatInstant, jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'

// Synthèse des coûts API du mois en cours (T5). Additionne les DEUX sources :
// les colonnes `cout_api` existantes (Fragments ×3, Codex) + le journal
// `api_couts` (Quazian, Aletheia, Scriptorium/RAG). Aucun double comptage :
// chaque module écrit dans UNE seule des deux (le RAG stocke bien un `cout` sur
// scriptorium_messages / scriptorium_rag_syntheses, mais c'est un détail d'écran,
// jamais lu ici — sinon Scriptorium compterait double).
//
// ⚠️ C11a — pourquoi tout est explicitement `{ data, error }` : supabase-js ne
// lève pas, il retourne `{ error }`. Les lectures ignoraient cette erreur, donc
// avec `api_couts` absente (cas réel de juin à juillet 2026) la tuile affichait
// Fragments+Codex seuls comme s'ils étaient le total. Un total partiel est
// désormais ANNONCÉ comme tel (et loggé), jamais maquillé en total complet.
// Contrainte : ce composant est rendu en ligne dans app/prof/page.tsx (pas de
// Suspense, pas d'error boundary) → il ne doit JAMAIS lever.
type Admin = ReturnType<typeof createAdminClient>

// Libellés d'affichage du journal (clé = valeur écrite par enregistrerCoutApi).
const LIBELLES: Record<string, string> = {
  aletheia: 'Aletheia',
  quazian: 'Quazian',
  scriptorium: 'Scriptorium',
}

async function sommeColonne(
  admin: Admin, table: string, depuis: string,
): Promise<{ somme: number; ok: boolean }> {
  const { data, error } = await admin.from(table).select('cout_api').gte('created_at', depuis)
  if (error) {
    console.error(`[cout-api] lecture illisible — ${table}`, {
      code: error.code, message: error.message, details: error.details, hint: error.hint,
    })
    return { somme: 0, ok: false }
  }
  const somme = (data ?? []).reduce(
    (s, r) => s + (Number((r as { cout_api: number | null }).cout_api) || 0), 0,
  )
  return { somme, ok: true }
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

  const [fEcrit, fEssai, fSynth, codex, journal] = await Promise.all([
    sommeColonne(admin, 'fragments_analyses', moisDebut),
    sommeColonne(admin, 'fragments_essai_depot_analyses', moisDebut),
    sommeColonne(admin, 'fragments_syntheses', moisDebut),
    sommeColonne(admin, 'codex_travaux', moisDebut),
    admin.from('api_couts').select('module, cout').gte('created_at', moisDebut),
  ])

  // Sources muettes → total partiel, dit à voix haute plutôt qu'avalé.
  const manquantes: string[] = []
  if (!fEcrit.ok || !fEssai.ok || !fSynth.ok) manquantes.push('Vestigia')
  if (!codex.ok) manquantes.push('Codex')
  if (journal.error) {
    console.error('[cout-api] lecture illisible — api_couts (journal Quazian/Aletheia/Scriptorium)', {
      code: journal.error.code, message: journal.error.message,
      details: journal.error.details, hint: journal.error.hint,
    })
    manquantes.push('journal api_couts')
  }

  const parModule = new Map<string, number>()
  parModule.set('Vestigia', fEcrit.somme + fEssai.somme + fSynth.somme)
  parModule.set('Codex', codex.somme)
  for (const r of journal.data ?? []) {
    const slug = r.module as string
    const nom = LIBELLES[slug] ?? slug
    parModule.set(nom, (parModule.get(nom) ?? 0) + (Number(r.cout) || 0))
  }
  const total = [...parModule.values()].reduce((s, v) => s + v, 0)
  const lignes = [...parModule.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const partiel = manquantes.length > 0

  return (
    <div className="bg-surface border border-bordure rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${partiel ? 'bg-retard' : 'bg-info'}`}
          aria-hidden
        />
        <span className="font-corps text-base text-encre flex-1">
          Coût API · <span className="capitalize">{moisLabel}</span>
        </span>
        <span className="font-titre text-lg text-encre">{fmt(total)}</span>
      </div>
      {lignes.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 pl-[22px]">
          {lignes.map(([nom, v]) => (
            <span key={nom} className="font-ui text-xs text-muet">{nom} {fmt(v)}</span>
          ))}
        </div>
      )}
      {partiel && (
        <p className="font-ui text-xs text-retard mt-1.5 pl-[22px]">
          Total partiel — source illisible : {manquantes.join(', ')}. Le vrai coût est plus élevé
          (détail de l’erreur dans les journaux du serveur).
        </p>
      )}
    </div>
  )
}

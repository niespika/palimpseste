import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  LABEL_MODULE, LABEL_TYPE_STRIKE, MESSAGE_STRIKE_DEFAUT, MESSAGE_BLOQUE_DEFAUT,
  type ModuleIntegrite, type TypeStrike,
} from '@/utils/integrite'
import { chargerPreuve } from '@/utils/integrite-preuve'
import { chargerHistoriqueProf, chargerDossierIntegrite } from '@/utils/integrite-historique'
import { formatInstant } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import GestionIntegrite from './GestionIntegrite'
import HistoriqueIntegrite from '@/components/integrite/HistoriqueIntegrite'
import type { SignalementVue, BloqueVue, SelectionVue } from '@/components/integrite/types'

export default async function ProfIntegritePage({
  searchParams,
}: {
  searchParams: Promise<{ sel?: string; vue?: string; eleve?: string }>
}) {
  const { sel, vue: vueParam, eleve } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') redirect('/eleve')

  const admin = createAdminClient()
  const vue = vueParam === 'historique' ? 'historique' : 'atelier'
  const body = vue === 'historique'
    ? await VueHistorique({ admin, eleve })
    : await VueAtelier({ admin, sel })

  return (
    <div className="space-y-4 pb-10">
      {/* Sélecteur de vue : atelier (à traiter) ↔ historique (trace complète). */}
      <div className="inline-flex rounded-lg border border-bordure bg-surface p-0.5 font-ui text-sm">
        <Link
          href="/prof/integrite?vue=atelier"
          aria-current={vue === 'atelier' ? 'true' : undefined}
          className={`px-3.5 py-1.5 rounded-md transition-colors ${vue === 'atelier' ? 'bg-bouton text-surface' : 'text-encre-douce hover:bg-parchemin-fonce'}`}
        >
          Atelier
        </Link>
        <Link
          href="/prof/integrite?vue=historique"
          aria-current={vue === 'historique' ? 'true' : undefined}
          className={`px-3.5 py-1.5 rounded-md transition-colors ${vue === 'historique' ? 'bg-bouton text-surface' : 'text-encre-douce hover:bg-parchemin-fonce'}`}
        >
          Historique
        </Link>
      </div>

      {body}
    </div>
  )
}

// ── Onglet « Historique » : tableau récapitulatif + dossier (master-detail) ────
async function VueHistorique({ admin, eleve }: { admin: ReturnType<typeof createAdminClient>; eleve?: string }) {
  const lignes = await chargerHistoriqueProf(admin)
  const ids = new Set(lignes.map((l) => l.eleveId))
  const selExplicit = !!eleve && ids.has(eleve)
  const eleveSelId = selExplicit ? eleve! : null
  const dossier = eleveSelId ? await chargerDossierIntegrite(admin, eleveSelId) : null
  return <HistoriqueIntegrite lignes={lignes} dossier={dossier} eleveSelId={eleveSelId} selExplicit={selExplicit && !!dossier} />
}

// ── Onglet « Atelier » : file des signalements à traiter + preuve (existant) ───
async function VueAtelier({ admin, sel }: { admin: ReturnType<typeof createAdminClient>; sel?: string }) {
  const [{ data: paramsRow }, { data: signalements }, { data: bloquesRows }] = await Promise.all([
    admin.from('integrite_params').select('actif, seuil_strikes, message_strike, message_bloque').eq('id', 1).maybeSingle(),
    admin.from('integrite_signalements')
      .select('id, eleve_id, module, rendu_ref, type, motif, source, statut, created_at')
      .is('acquitte_at', null)
      .order('created_at', { ascending: false }),
    admin.from('profiles').select('id, display_name, integrite_strikes').eq('integrite_bloque', true).order('display_name'),
  ])

  const seuil = paramsRow?.seuil_strikes ?? 3
  const tz = await lireFuseau()

  // Noms des élèves concernés par les signalements.
  const eleveIds = [...new Set((signalements ?? []).map((s) => s.eleve_id as string))]
  const { data: profils } = eleveIds.length > 0
    ? await admin.from('profiles').select('id, display_name').in('id', eleveIds)
    : { data: [] }
  const nomEleve = new Map((profils ?? []).map((p) => [p.id as string, p.display_name as string]))

  const fmtLong = (iso: string) =>
    formatInstant(iso, tz, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const fmtCourt = (iso: string) =>
    formatInstant(iso, tz, { day: 'numeric', month: 'short' })

  const vueSignalements: SignalementVue[] = (signalements ?? []).map((s) => ({
    id: s.id as string,
    eleveId: s.eleve_id as string,
    eleveNom: nomEleve.get(s.eleve_id as string) ?? '?',
    moduleSlug: s.module as ModuleIntegrite,
    moduleLabel: LABEL_MODULE[s.module as ModuleIntegrite] ?? (s.module as string),
    typeSlug: s.type as string,
    typeLabel: LABEL_TYPE_STRIKE[s.type as TypeStrike] ?? (s.type as string),
    motif: (s.motif as string | null) ?? null,
    source: s.source as 'algo' | 'ia',
    enAttente: s.statut === 'en_attente',
    date: fmtLong(s.created_at as string),
    dateCourt: fmtCourt(s.created_at as string),
  }))

  const vueBloques: BloqueVue[] = (bloquesRows ?? []).map((b) => ({
    eleveId: b.id as string,
    nom: (b.display_name as string) ?? '?',
    strikes: (b.integrite_strikes as number) ?? 0,
  }))

  // Sélection : ?sel=<id> s'il pointe un signalement affiché, sinon le 1ᵉʳ à traiter.
  const idsAffiches = new Set(vueSignalements.map((v) => v.id))
  const selExplicit = !!sel && idsAffiches.has(sel)
  const selId = selExplicit ? sel! : (vueSignalements[0]?.id ?? null)

  let selection: SelectionVue | null = null
  if (selId) {
    const sig = vueSignalements.find((v) => v.id === selId)!
    const raw = (signalements ?? []).find((r) => r.id === selId)!
    const [{ data: prof }, preuve] = await Promise.all([
      admin.from('profiles').select('integrite_strikes, integrite_bloque').eq('id', sig.eleveId).maybeSingle(),
      chargerPreuve(admin, sig.moduleSlug, raw.rendu_ref as string, { motif: sig.motif, type: sig.typeSlug }),
    ])
    selection = {
      signalement: sig,
      preuve,
      strikesEleve: (prof?.integrite_strikes as number | null) ?? 0,
      seuil,
      eleveBloque: !!prof?.integrite_bloque,
      tz,
    }
  }

  return (
    <GestionIntegrite
      bloques={vueBloques}
      signalements={vueSignalements}
      selection={selection}
      selExplicit={selExplicit}
      params={{
        actif: paramsRow?.actif ?? true,
        seuil,
        messageStrike: paramsRow?.message_strike || MESSAGE_STRIKE_DEFAUT,
        messageBloque: paramsRow?.message_bloque || MESSAGE_BLOQUE_DEFAUT,
      }}
    />
  )
}

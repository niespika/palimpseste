import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  LABEL_MODULE, LABEL_TYPE_STRIKE, MESSAGE_STRIKE_DEFAUT, MESSAGE_BLOQUE_DEFAUT,
  type ModuleIntegrite, type TypeStrike,
} from '@/utils/integrite'
import { chargerPreuve } from '@/utils/integrite-preuve'
import GestionIntegrite from './GestionIntegrite'
import type { SignalementVue, BloqueVue, SelectionVue } from '@/components/integrite/types'

export default async function ProfIntegritePage({
  searchParams,
}: {
  searchParams: Promise<{ sel?: string }>
}) {
  const { sel } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') redirect('/eleve')

  const admin = createAdminClient()

  const [{ data: paramsRow }, { data: signalements }, { data: bloquesRows }] = await Promise.all([
    admin.from('integrite_params').select('actif, seuil_strikes, message_strike, message_bloque').eq('id', 1).maybeSingle(),
    admin.from('integrite_signalements')
      .select('id, eleve_id, module, rendu_ref, type, motif, source, statut, created_at')
      .is('acquitte_at', null)
      .order('created_at', { ascending: false }),
    admin.from('profiles').select('id, display_name, integrite_strikes').eq('integrite_bloque', true).order('display_name'),
  ])

  const seuil = paramsRow?.seuil_strikes ?? 3

  // Noms des élèves concernés par les signalements.
  const eleveIds = [...new Set((signalements ?? []).map((s) => s.eleve_id as string))]
  const { data: profils } = eleveIds.length > 0
    ? await admin.from('profiles').select('id, display_name').in('id', eleveIds)
    : { data: [] }
  const nomEleve = new Map((profils ?? []).map((p) => [p.id as string, p.display_name as string]))

  const fmtLong = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const fmtCourt = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

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

  // Sélection : ?sel=<id> s'il pointe un signalement affiché, sinon le 1ᵉʳ à traiter
  // (défaut pour la colonne droite sur ordi). `selExplicit` pilote la bascule mobile
  // (liste ↔ preuve plein écran) : on n'ouvre la preuve sur mobile que si demandé.
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

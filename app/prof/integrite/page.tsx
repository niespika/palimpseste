import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  LABEL_MODULE, LABEL_TYPE_STRIKE, MESSAGE_STRIKE_DEFAUT, MESSAGE_BLOQUE_DEFAUT,
  type ModuleIntegrite, type TypeStrike,
} from '@/utils/integrite'
import GestionIntegrite, { type SignalementVue, type BloqueVue } from './GestionIntegrite'

export default async function ProfIntegritePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') redirect('/eleve')

  const admin = createAdminClient()

  const [{ data: paramsRow }, { data: signalements }, { data: bloquesRows }] = await Promise.all([
    admin.from('integrite_params').select('actif, seuil_strikes, message_strike, message_bloque').eq('id', 1).maybeSingle(),
    admin.from('integrite_signalements')
      .select('id, eleve_id, module, type, motif, source, statut, created_at')
      .is('acquitte_at', null)
      .order('created_at', { ascending: false }),
    admin.from('profiles').select('id, display_name, integrite_strikes').eq('integrite_bloque', true).order('display_name'),
  ])

  // Noms des élèves concernés par les signalements.
  const eleveIds = [...new Set((signalements ?? []).map((s) => s.eleve_id as string))]
  const { data: profils } = eleveIds.length > 0
    ? await admin.from('profiles').select('id, display_name').in('id', eleveIds)
    : { data: [] }
  const nomEleve = new Map((profils ?? []).map((p) => [p.id as string, p.display_name as string]))

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const vueSignalements: SignalementVue[] = (signalements ?? []).map((s) => ({
    id: s.id as string,
    eleveNom: nomEleve.get(s.eleve_id as string) ?? '?',
    module: LABEL_MODULE[s.module as ModuleIntegrite] ?? (s.module as string),
    type: LABEL_TYPE_STRIKE[s.type as TypeStrike] ?? (s.type as string),
    motif: (s.motif as string | null) ?? null,
    source: s.source as 'algo' | 'ia',
    enAttente: s.statut === 'en_attente',
    date: fmtDate(s.created_at as string),
  }))

  const vueBloques: BloqueVue[] = (bloquesRows ?? []).map((b) => ({
    eleveId: b.id as string,
    nom: (b.display_name as string) ?? '?',
    strikes: (b.integrite_strikes as number) ?? 0,
  }))

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-serif text-encre">Intégrité — petits malins</h2>
        <p className="text-sm text-muet mt-1">
          Rendus vides, aveux et copies hors-sujet repérés dans Aletheia, Codex et Fragments.
          À {paramsRow?.seuil_strikes ?? 3} strikes, l’élève ne peut plus rien rendre ni réviser ses flashcards
          (le quizz reste ouvert) jusqu’à ce que tu le débloques.
        </p>
      </div>

      {(paramsRow?.actif ?? true) === false && (
        <div className="bg-attention-teinte border border-attention rounded-xl px-5 py-3 text-sm text-attention">
          Détection désactivée : aucun élève n’est bloqué pour l’instant, même ceux listés ci-dessous.
          Réactive-la dans les paramètres pour que les blocages reprennent effet.
        </div>
      )}

      <GestionIntegrite
        bloques={vueBloques}
        signalements={vueSignalements}
        params={{
          actif: paramsRow?.actif ?? true,
          seuil: paramsRow?.seuil_strikes ?? 3,
          messageStrike: paramsRow?.message_strike || MESSAGE_STRIKE_DEFAUT,
          messageBloque: paramsRow?.message_bloque || MESSAGE_BLOQUE_DEFAUT,
        }}
      />
    </div>
  )
}

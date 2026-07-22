import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { slugsModulesAccessibles } from '@/utils/acces'
import { contexteClasseEleve } from '@/app/eleve/contexte-classe'
import { lireReglagesRag } from '@/utils/scriptorium-rag'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import ChatScriptorium from './ChatScriptorium'

// Face ÉLÈVE de Scriptorium (RAG L5, SPEC §7.1) : espace de dialogue ancré sur
// le parcours de SA classe (contexte cookie existant). GATÉ rag_actif : OFF →
// notFound (aucune surface). L'esthétique fine (plan du cours, suggestions,
// bandeau de transparence) arrive au L6 — ici le cœur : conversations + fil +
// composer streaming + quota.

export const maxDuration = 30

export default async function ScriptoriumElevePage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profil?.role !== 'eleve') notFound()

  const admin = createAdminClient()
  const reglages = await lireReglagesRag(admin)
  if (!reglages.actif) notFound()

  const slugs = await slugsModulesAccessibles(supabase, user.id)
  if (!slugs.has('scriptorium')) notFound()

  const contexte = await contexteClasseEleve(supabase, user.id)
  const classe = contexte.active
  if (!classe) notFound()

  const { conv: convSel } = await searchParams

  // Conversations vivantes de l'élève pour SA classe (RLS eleve_own).
  const { data: convs } = await supabase
    .from('scriptorium_conversations')
    .select('id, titre, updated_at')
    .eq('classe_id', classe.classe_id)
    .is('supprime_at', null)
    .order('updated_at', { ascending: false })
  const conversations = (convs ?? []).map(c => ({
    id: c.id as string,
    titre: (c.titre as string | null) ?? 'Conversation',
    updatedAt: c.updated_at as string,
  }))

  // Fil de la conversation sélectionnée (l'intégralité est affichée — la
  // fenêtre glissante ne concerne que ce qui part au modèle).
  let convActive: { id: string; titre: string; messages: { role: 'eleve' | 'assistant'; contenu: string }[] } | null = null
  if (convSel && conversations.some(c => c.id === convSel)) {
    const { data: msgs } = await supabase
      .from('scriptorium_messages')
      .select('role, contenu')
      .eq('conversation_id', convSel)
      .order('created_at', { ascending: true })
    convActive = {
      id: convSel,
      titre: conversations.find(c => c.id === convSel)?.titre ?? 'Conversation',
      messages: (msgs ?? []).map(m => ({
        role: m.role === 'eleve' ? ('eleve' as const) : ('assistant' as const),
        contenu: m.contenu as string,
      })),
    }
  }

  // Quota restant du jour (fuseau prof, toutes conversations confondues).
  const fuseau = await lireFuseau()
  const aujourdHui = jourDansFuseau(new Date().toISOString(), fuseau)
  const { data: toutesConvs } = await admin
    .from('scriptorium_conversations').select('id').eq('eleve_id', user.id)
  const convIds = (toutesConvs ?? []).map(c => c.id as string)
  let envoyes = 0
  if (convIds.length) {
    // Borne large (J-2 UTC) : couvre toute journée locale, filtrée ensuite au jour exact.
    const depuis = toISODate(addDaysUTC(new Date(aujourdHui + 'T00:00:00Z'), -2))
    const { data: msgs } = await admin
      .from('scriptorium_messages').select('created_at')
      .in('conversation_id', convIds).eq('role', 'eleve').gte('created_at', depuis)
    envoyes = (msgs ?? []).filter(m => jourDansFuseau(m.created_at as string, fuseau) === aujourdHui).length
  }
  const quotaRestant = Math.max(0, reglages.quotaJour - envoyes)

  return (
    <div className="pb-8" data-module="scriptorium">
      <ChatScriptorium
        key={convActive?.id ?? 'nouvelle'}
        classeId={classe.classe_id}
        classeNom={classe.classe_nom}
        conversations={conversations}
        convActive={convActive}
        quotaRestant={quotaRestant}
      />
    </div>
  )
}

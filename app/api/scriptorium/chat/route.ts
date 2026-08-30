// Route de CHAT du Scriptorium élève (RAG L5, SPEC §7.3) — POST streaming.
// Gardes en cascade : auth élève → gate rag_actif → accès module + inscription
// active dans la classe → propriété de la conversation → quota souple du jour
// (fuseau prof, toutes conversations confondues — non contournable en
// multipliant les conversations, §15.11). Corpus par classe (préfixe cacheable),
// suffixe dynamique par élève (progression Aletheia), question balisée
// (sansDelims — le texte élève n'est jamais une consigne). Persistance en
// after() : message élève stocké BRUT + réponse + modèle + coût. Toute erreur
// fournisseur → excuse sobre streamée, rien de facturé de plus, le message
// élève est conservé (re-tentative).

import { after } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { corpusClasse } from '@/utils/scriptorium-corpus'
import {
  lireReglagesRag, progressionLivres, construireSuffixe, baliserQuestion,
  MAX_TOKENS_CHAT, FENETRE_HISTORIQUE,
} from '@/utils/scriptorium-rag'
import { fournisseurPour, type AppelIA, type UsageIA } from '@/utils/ia-fournisseur'
import { coutSelonModele, enregistrerCoutApi, normaliserUsage } from '@/utils/cout-api'
import { sansDelims } from '@/utils/ia-commun'
import { inscriptionEleveClasse, classeAModule } from '@/utils/acces'

export const maxDuration = 60

const EXCUSE = '\n\n*(Le tuteur a rencontré un problème technique — réessaie dans un instant.)*'

export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Non authentifié.' }, { status: 401 })
  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profil?.role !== 'eleve') return Response.json({ error: 'Réservé aux élèves.' }, { status: 403 })

  const body = await req.json().catch(() => null) as
    { conversationId?: string | null; classeId?: string; message?: string } | null
  const classeId = body?.classeId
  const message = (body?.message ?? '').trim()
  if (!classeId || !message) return Response.json({ error: 'Requête incomplète.' }, { status: 400 })
  if (message.length > 4000) return Response.json({ error: 'Message trop long (4000 caractères max).' }, { status: 400 })

  const admin = createAdminClient()
  const reglages = await lireReglagesRag(admin)
  if (!reglages.actif) return Response.json({ error: 'Espace non disponible.' }, { status: 403 })

  // ⛔⛔ LA QUESTION EST « CETTE CLASSE A-T-ELLE LE MODULE », PAS « UNE DE MES
  //    CLASSES L'A-T-ELLE » — C-RLS-7, 29/08. `slugsModulesAccessibles` rend
  //    l'UNION des modules de toutes les classes de l'élève : un élève
  //    bi-classe franchissait donc cette garde avec le `classeId` d'une classe
  //    où le professeur n'a PAS donné Scriptorium.
  // ⛔ Et ce n'est pas qu'une lecture : passé ce point, la route CRÉE une
  //    conversation portant ce `classe_id`, consomme le quota du jour, appelle
  //    le modèle et inscrit un coût attribué à cette classe — le tout par le
  //    client admin, RLS hors jeu.
  // ⭐ `classeAModule` existe depuis le 14/08 pour exactement cette question, et
  //    trois actions professeur l'emploient déjà. **Les deux gardes restent
  //    distinctes** : « cette classe a-t-elle le module » ET « cet élève y
  //    est-il inscrit » — `classeAModule` ne répond qu'à la première.
  const [aLeModule, inscription] = await Promise.all([
    classeAModule(supabase, classeId, 'scriptorium'),
    inscriptionEleveClasse(supabase, user.id, classeId),
  ])
  if (!aLeModule || !inscription) {
    return Response.json({ error: 'Accès refusé pour cette classe.' }, { status: 403 })
  }

  // Propriété de la conversation (si reprise d'un fil existant).
  let conversationId = body?.conversationId ?? null
  if (conversationId) {
    const { data: conv } = await admin
      .from('scriptorium_conversations')
      .select('eleve_id, classe_id, supprime_at')
      .eq('id', conversationId).maybeSingle()
    if (!conv || conv.eleve_id !== user.id || conv.supprime_at != null || conv.classe_id !== classeId) {
      return Response.json({ error: 'Conversation introuvable.' }, { status: 404 })
    }
  }

  // Quota souple du JOUR (fuseau prof), toutes conversations confondues — les
  // instants des dernières 48 h suffisent à couvrir toute journée locale.
  const fuseau = await lireFuseau()
  const aujourdHui = jourDansFuseau(new Date().toISOString(), fuseau)
  const { data: convsEleve } = await admin
    .from('scriptorium_conversations').select('id').eq('eleve_id', user.id)
  const convIds = (convsEleve ?? []).map(c => c.id as string)
  let envoyesAujourdHui = 0
  if (convIds.length) {
    const depuis = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    const { data: msgs } = await admin
      .from('scriptorium_messages').select('created_at')
      .in('conversation_id', convIds).eq('role', 'eleve').gte('created_at', depuis)
    envoyesAujourdHui = (msgs ?? [])
      .filter(m => jourDansFuseau(m.created_at as string, fuseau) === aujourdHui).length
  }
  if (envoyesAujourdHui >= reglages.quotaJour) {
    return Response.json(
      { error: 'Tu as beaucoup travaillé aujourd’hui — on se retrouve demain.' },
      { status: 429 },
    )
  }

  // Corpus de la classe (préfixe stable, anti-spoiler structurel — §6).
  const corpus = await corpusClasse(admin, classeId, aujourdHui)
  if (!corpus) {
    return Response.json(
      { error: 'Ton espace n’est pas encore prêt : aucun parcours daté pour ta classe.' },
      { status: 409 },
    )
  }

  // Fenêtre glissante d'historique (l'intégralité reste stockée et affichée).
  let historique: AppelIA['historique'] = []
  if (conversationId) {
    const { data: msgs } = await admin
      .from('scriptorium_messages').select('role, contenu')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }).limit(FENETRE_HISTORIQUE)
    historique = (msgs ?? []).reverse().map(m => ({
      role: m.role === 'eleve' ? ('eleve' as const) : ('assistant' as const),
      contenu: m.contenu as string,
    }))
  }

  // La conversation est créée AVANT le stream (le client reçoit son id en en-tête).
  if (!conversationId) {
    const { data: conv, error } = await admin
      .from('scriptorium_conversations')
      .insert({ eleve_id: user.id, classe_id: classeId, titre: message.slice(0, 60) })
      .select('id').single()
    if (error || !conv) return Response.json({ error: 'Création de la conversation impossible.' }, { status: 500 })
    conversationId = conv.id as string
  }
  const convId = conversationId

  const progression = await progressionLivres(admin, user.id, corpus.livres)
  const appel: AppelIA = {
    systeme: reglages.prompt,
    prefixe: corpus.prefixe,
    suffixeDynamique: construireSuffixe(aujourdHui, progression),
    historique,
    message: baliserQuestion(sansDelims(message)),
    maxTokensSortie: MAX_TOKENS_CHAT,
  }

  let fournisseur
  try {
    fournisseur = fournisseurPour(reglages.modele)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Modèle inconnu.' }, { status: 500 })
  }

  // Stream relayé au client ; persistance en after() une fois le flux terminé.
  let reponse = ''
  let ok = false
  let usageFn: (() => Promise<UsageIA>) | null = null
  let resoudreFin: () => void = () => {}
  const finDuFlux = new Promise<void>(res => { resoudreFin = res })

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { flux, usage } = fournisseur.repondreEnStream(reglages.modele, appel)
        usageFn = usage
        for await (const t of flux) {
          reponse += t
          controller.enqueue(encoder.encode(t))
        }
        ok = reponse.trim().length > 0
      } catch (e) {
        console.error('[scriptorium-chat] erreur fournisseur', e)
        controller.enqueue(encoder.encode(EXCUSE))
      } finally {
        controller.close()
        resoudreFin()
      }
    },
  })

  after(async () => {
    await finDuFlux
    try {
      // Le message élève est TOUJOURS conservé (re-tentative possible) — stocké BRUT.
      await admin.from('scriptorium_messages').insert({ conversation_id: convId, role: 'eleve', contenu: message })
      if (ok) {
        // Coût du tour : mesuré depuis l'usage du fournisseur. Un usage
        // indisponible ne veut PAS dire « rien facturé » — ça veut dire « pas
        // mesuré » : on garde 0 (best-effort, le tour de chat n'échoue pas) mais
        // on le DIT, sinon le coût RAG se met à sous-compter sans trace (C11a).
        let cout = 0
        // Hissé hors du try : les compteurs de tokens partent au journal des coûts
        // (C11a-bis). Usage indisponible → `usage` reste null → colonnes tokens_*
        // NULL en base, c.-à-d. « non mesuré » et non « 0 token ».
        let usage: UsageIA | null = null
        try {
          usage = usageFn ? await usageFn() : null
          if (usage) cout = coutSelonModele(reglages.modele, usage)
          else console.warn(`[scriptorium-chat] usage indisponible (modele=${reglages.modele}) — coût NON mesuré, compté 0`)
        } catch (e) {
          console.error(`[scriptorium-chat] usage illisible (modele=${reglages.modele}) — coût NON mesuré, compté 0`, e)
        }
        await admin.from('scriptorium_messages').insert({
          conversation_id: convId, role: 'assistant', contenu: reponse, modele: reglages.modele, cout,
        })
        // Seul site à porter élève ET classe : un tour de chat appartient aux deux.
        await enregistrerCoutApi('scriptorium', cout, {
          eleveId: user.id, classeId, modele: reglages.modele, tokens: normaliserUsage(usage),
        })
      }
      await admin.from('scriptorium_conversations')
        .update({ updated_at: new Date().toISOString() }).eq('id', convId)
    } catch (e) {
      console.error('[scriptorium-chat] persistance échouée', e)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Conversation-Id': convId,
    },
  })
}

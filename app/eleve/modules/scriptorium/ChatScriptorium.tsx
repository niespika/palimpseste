'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { renommerConversation, supprimerConversation } from './actions'

// Chat élève du Scriptorium (RAG L5+L6, §7.1) — MVP sobre charte : rail des
// conversations, fil en bulles, composer streaming avec stop et quota, volet
// « Plan du cours » (titres et statuts — la même donnée que le squelette du
// corpus, rendue à l'élève), amorces de la semaine courante, bandeau de
// transparence à la première utilisation. Rendu texte simple (pre-wrap).

interface Message { role: 'eleve' | 'assistant'; contenu: string }
interface ConvResume { id: string; titre: string; updatedAt: string }

// Plan du cours côté élève (L6) — TITRES ET STATUTS SEULS, aucun texte.
export interface PlanEleve {
  parcours: {
    titre: string
    semaineCourante: number
    nbSemaines: number
    semaines: {
      k: number
      lundi: string | null
      courante: boolean
      elements: { libelle: string; statut: 'vu' | 'en_cours' | 'a_venir' }[]
    }[]
  }[]
}

export default function ChatScriptorium({
  classeId, classeNom, conversations, convActive, quotaRestant, plan, suggestions, premierUsage,
}: {
  classeId: string
  classeNom: string
  conversations: ConvResume[]
  convActive: { id: string; titre: string; messages: Message[] } | null
  quotaRestant: number
  plan: PlanEleve
  suggestions: string[]
  premierUsage: boolean
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(convActive?.messages ?? [])
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [restant, setRestant] = useState(quotaRestant)
  const [voletPlan, setVoletPlan] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const convIdRef = useRef<string | null>(convActive?.id ?? null)
  const filRef = useRef<HTMLDivElement>(null)

  const versLeBas = () => {
    requestAnimationFrame(() => {
      filRef.current?.scrollTo({ top: filRef.current.scrollHeight })
    })
  }

  async function envoyer(texteAmorce?: string) {
    const message = (texteAmorce ?? saisie).trim()
    if (!message || enCours || restant <= 0) return
    setErreur(null)
    setSaisie('')
    setMessages(prev => [...prev, { role: 'eleve', contenu: message }, { role: 'assistant', contenu: '' }])
    setEnCours(true)
    versLeBas()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch('/api/scriptorium/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convIdRef.current, classeId, message }),
        signal: controller.signal,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null
        setMessages(prev => prev.slice(0, -1)) // retire la bulle assistant vide
        setErreur(data?.error ?? 'Un problème est survenu — réessaie.')
        return
      }
      const nouvelId = res.headers.get('X-Conversation-Id')
      if (nouvelId) convIdRef.current = nouvelId
      setRestant(r => Math.max(0, r - 1))
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          const t = decoder.decode(value, { stream: true })
          setMessages(prev => {
            const copie = [...prev]
            copie[copie.length - 1] = { role: 'assistant', contenu: copie[copie.length - 1].contenu + t }
            return copie
          })
          versLeBas()
        }
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') {
        setErreur('La connexion a été interrompue — réessaie.')
      }
    } finally {
      setEnCours(false)
      abortRef.current = null
      // Synchronise l'URL (nouvelle conversation) et le rail (titres/tri serveur).
      if (convIdRef.current && convIdRef.current !== convActive?.id) {
        router.replace(`/eleve/modules/scriptorium?conv=${convIdRef.current}`)
      }
      router.refresh()
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  async function renommer(c: ConvResume) {
    const titre = prompt('Nouveau titre de la conversation :', c.titre)
    if (titre == null) return
    const res = await renommerConversation(c.id, titre)
    if (res.error) { alert(res.error); return }
    router.refresh()
  }

  async function supprimer(c: ConvResume) {
    if (!confirm(`Supprimer « ${c.titre} » de ta liste ?`)) return
    const res = await supprimerConversation(c.id)
    if (res.error) { alert(res.error); return }
    if (convIdRef.current === c.id) router.replace('/eleve/modules/scriptorium')
    router.refresh()
  }

  const quotaEpuise = restant <= 0

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* ── Rail des conversations ─────────────────────────────────────────── */}
      <aside className="w-full lg:w-64 flex-shrink-0 space-y-2">
        <Link
          href="/eleve/modules/scriptorium"
          className="block w-full text-center bg-bouton text-surface py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          + Nouvelle conversation
        </Link>
        <p className="font-ui text-[11px] text-muet px-1">Tes questions sur le cours — {classeNom}.</p>
        <ul className="space-y-1">
          {conversations.map(c => (
            <li key={c.id} className={`group rounded-lg border px-2 py-1.5 ${convActive?.id === c.id ? 'border-pigment/50 bg-pigment-teinte/30' : 'border-bordure bg-surface'}`}>
              <Link href={`/eleve/modules/scriptorium?conv=${c.id}`} className="block text-sm text-encre truncate">
                {c.titre}
              </Link>
              <div className="flex gap-2 mt-0.5">
                <button onClick={() => renommer(c)} className="font-ui text-[11px] text-muet hover:text-encre">Renommer</button>
                <button onClick={() => supprimer(c)} className="font-ui text-[11px] text-muet hover:text-retard">Supprimer</button>
              </div>
            </li>
          ))}
          {conversations.length === 0 && (
            <li className="font-ui text-xs text-muet px-1">Aucune conversation — pose ta première question ci-contre.</li>
          )}
        </ul>
      </aside>

      {/* ── Fil + composer ─────────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 w-full flex flex-col rounded-xl border border-bordure bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-bordure px-4 py-2">
          <span className="font-ui text-xs text-muet">Tuteur du cours — il s’appuie sur ce que ton professeur a préparé.</span>
          {plan.parcours.length > 0 && (
            <button
              onClick={() => setVoletPlan(v => !v)}
              className={`font-ui text-xs px-2 py-1 rounded ${voletPlan ? 'bg-pigment text-surface' : 'text-encre-douce hover:bg-pigment-teinte'}`}
            >
              Plan du cours
            </button>
          )}
        </div>

        {voletPlan && (
          <div className="border-b border-bordure px-4 py-3 max-h-[40vh] overflow-y-auto space-y-3 bg-parchemin-fonce/40">
            {plan.parcours.map(p => (
              <div key={p.titre} className="space-y-1">
                <p className="font-ui text-xs font-medium text-encre">
                  {p.titre} <span className="text-muet font-normal">— semaine {p.semaineCourante}/{p.nbSemaines}</span>
                </p>
                {p.semaines.map(s => (
                  <div key={s.k} className={`rounded px-2 py-1 ${s.courante ? 'bg-pigment-teinte/50' : ''}`}>
                    <p className="font-ui text-[11px] text-muet">
                      Semaine {s.k}{s.lundi ? ` — ${s.lundi}` : ''}{s.courante ? ' · cette semaine' : ''}
                    </p>
                    <ul className="mt-0.5 space-y-0.5">
                      {s.elements.map((e, i) => (
                        <li key={i} className="font-corps text-xs flex items-baseline gap-1.5">
                          <span className={`font-ui flex-shrink-0 ${e.statut === 'vu' ? 'text-ok' : e.statut === 'en_cours' ? 'text-attention' : 'text-muet/60'}`}>
                            {e.statut === 'vu' ? '✓' : e.statut === 'en_cours' ? '●' : '○'}
                          </span>
                          <span className={e.statut === 'a_venir' ? 'text-muet' : 'text-encre'}>{e.libelle}</span>
                          {e.statut === 'en_cours' && <span className="font-ui text-[10px] text-attention flex-shrink-0">en cours</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
            <p className="font-ui text-[10px] text-muet">✓ vu en classe · ● en cours · ○ à venir (titres seuls — le tuteur n’en dira pas plus, c’est voulu).</p>
          </div>
        )}

        <div ref={filRef} className="flex-1 min-h-[40vh] max-h-[62vh] overflow-y-auto p-4 space-y-3">
          {premierUsage && messages.length === 0 && (
            <div className="rounded-xl border border-bordure bg-parchemin-fonce/60 px-4 py-3 font-corps text-xs text-encre-douce space-y-1">
              <p className="font-ui font-medium text-encre">Avant de commencer</p>
              <p>Ton professeur ne lit pas tes conversations. Une synthèse anonyme hebdomadaire l’aide à ajuster le cours ; les tentatives de triche lui sont signalées.</p>
              <p>Supprimer une conversation la retire de ta liste, pas du traitement hebdomadaire.</p>
            </div>
          )}
          {messages.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <p className="font-corps text-sm text-muet">
                Pose une question sur ton cours — ou pars d’une amorce :
              </p>
              <div className="flex flex-col items-center gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => void envoyer(s)}
                    disabled={enCours || restant <= 0}
                    className="max-w-full font-corps text-sm text-encre-douce border border-bordure rounded-full px-3 py-1.5 hover:bg-pigment-teinte disabled:opacity-50 truncate"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'eleve' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 font-corps text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'eleve' ? 'bg-pigment-teinte text-encre' : 'bg-parchemin-fonce text-encre'
              }`}>
                {m.contenu || (enCours && i === messages.length - 1 ? '…' : '')}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-bordure p-3 space-y-2">
          {erreur && <p className="font-ui text-xs text-retard">⚠ {erreur}</p>}
          {quotaEpuise ? (
            <p className="font-corps text-sm text-muet text-center py-2">
              Tu as beaucoup travaillé aujourd’hui — on se retrouve demain.
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                value={saisie}
                onChange={e => setSaisie(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void envoyer() }
                }}
                rows={Math.min(6, Math.max(1, saisie.split('\n').length))}
                placeholder="Ta question sur le cours… (Entrée pour envoyer)"
                className="flex-1 px-3 py-2 border border-bordure rounded-lg text-sm text-encre resize-none focus:outline-none focus:ring-2 focus:ring-pigment bg-surface"
              />
              {enCours ? (
                <button onClick={stop} className="px-4 py-2 rounded-lg text-sm border border-bordure text-encre-douce hover:bg-parchemin-fonce">
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => void envoyer()}
                  disabled={!saisie.trim()}
                  className="px-4 py-2 rounded-lg text-sm bg-bouton text-surface hover:opacity-90 disabled:opacity-50"
                >
                  Envoyer
                </button>
              )}
            </div>
          )}
          {!quotaEpuise && restant <= 10 && (
            <p className="font-ui text-[11px] text-muet text-right">{restant} message{restant > 1 ? 's' : ''} restant{restant > 1 ? 's' : ''} aujourd’hui</p>
          )}
        </div>
      </section>
    </div>
  )
}

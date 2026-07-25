'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { renommerConversation, supprimerConversation } from './actions'

// Onglet « Discussion » de la face élève (RAG L5+L6, §7.1 — surface refondue en
// C2.2) : rail des conversations + fil + écritoire. Le PLAN DU COURS est parti
// dans son propre onglet (<PlanCours>, ?vue=plan) — ce composant ne connaît plus
// que la correspondance.
//
// Parti « correspondance continue » : un feuillet unique qui se lit d'un trait.
// Le tuteur occupe la pleine colonne ; les mots de l'élève sont en RETRAIT
// derrière un filet au pigment. Les voix se distinguent par la typographie et la
// mise en page — JAMAIS par un aplat de couleur. Rituels : datation de lettre au
// lieu d'horodatages, un seul fleuron par écran, sceau en tête, écritoire.
//
// Rien de la mécanique ne change : streaming, stop, quota, renommer/supprimer,
// `?conv=`, rendu `pre-wrap` du texte généré (aucun Markdown, aucun
// post-traitement). Aucune animation ajoutée : le seul mouvement est le curseur
// au pigment en fin de ligne pendant que la réponse s'écrit.

interface Message {
  role: 'eleve' | 'assistant'
  contenu: string
  /** Jour (AAAA-MM-JJ, fuseau du prof) — regroupe la correspondance par journée. */
  jour: string
  /** Datation de lettre affichée en tête de journée (« Ce vendredi 24 juillet »). */
  datation: string
}
interface ConvResume { id: string; titre: string; updatedAt: string; recence: string }

// Encres de la maquette absentes des jetons : versions assombries pour tenir le
// contraste AA sur le feuillet (cf. handoff, § garde-fous).
const ENCRE_META = '#6E5A3E' // méta, labels, sous-ligne du sceau
// Filets au pigment (#4A3A28) — dégradés des séparateurs rituels.
const FILET_GAUCHE = { background: 'linear-gradient(90deg,transparent,rgba(74,58,40,.22))' }
const FILET_DROIT = { background: 'linear-gradient(90deg,rgba(74,58,40,.22),transparent)' }
const FLEURON_GAUCHE = { background: 'linear-gradient(90deg,transparent,rgba(74,58,40,.32))' }
const FLEURON_DROIT = { background: 'linear-gradient(90deg,rgba(74,58,40,.32),transparent)' }

// Datation de lettre — une fois par journée de correspondance, pas par message.
function Datation({ texte }: { texte: string }) {
  return (
    <div className="flex items-center justify-center gap-4 my-[26px]">
      <span aria-hidden className="flex-1 h-px" style={FILET_GAUCHE} />
      <span className="font-titre italic text-[19px] whitespace-nowrap text-encre-douce">{texte}</span>
      <span aria-hidden className="flex-1 h-px" style={FILET_DROIT} />
    </div>
  )
}

// Fleuron de fin — UN SEUL par écran, après la dernière réponse achevée.
function Fleuron() {
  return (
    <div className="flex items-center justify-center gap-3 mt-[26px]" aria-hidden>
      <span className="w-[54px] h-px" style={FLEURON_GAUCHE} />
      <span className="w-1.5 h-1.5 rotate-45 bg-pigment opacity-70" />
      <span className="w-[54px] h-px" style={FLEURON_DROIT} />
    </div>
  )
}

// La marque du Scriptorium en tête de conversation : sceau N&B en `multiply`
// (même technique que Pastille.tsx), l'adresse, la ligne de transparence.
function EnTeteLettre() {
  return (
    <div className="flex items-center gap-3 pb-5 border-b border-bordure">
      <span className="relative inline-flex overflow-hidden flex-none w-[38px] h-[38px] rounded-full bg-pigment-teinte border border-bordure-bouton">
        <Image
          src="/sceaux/pastille-scriptorium.png"
          alt=""
          fill
          sizes="38px"
          style={{ objectFit: 'cover', filter: 'brightness(1.06) contrast(1.04)', mixBlendMode: 'multiply' }}
        />
      </span>
      <div>
        <div className="font-corps font-semibold text-[15px] text-encre">Ton Tuteur</div>
        <div className="font-corps text-[13.5px]" style={{ color: ENCRE_META }}>
          Il s’appuie sur ce que ton professeur a préparé.
        </div>
      </div>
    </div>
  )
}

export default function ChatScriptorium({
  classeId, conversations, convActive, quotaRestant, suggestions, premierUsage,
  datationAujourdhui, jourAujourdhui,
}: {
  classeId: string
  conversations: ConvResume[]
  convActive: { id: string; titre: string; messages: Message[] } | null
  quotaRestant: number
  suggestions: string[]
  premierUsage: boolean
  /** Datation du jour, pour les messages écrits pendant la session. */
  datationAujourdhui: string
  jourAujourdhui: string
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(convActive?.messages ?? [])
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [restant, setRestant] = useState(quotaRestant)
  // Rail escamotable sous lg (chantier 4) : sur petit écran la lettre passe en
  // premier ; la liste des conversations se déplie à la demande.
  const [railOuvert, setRailOuvert] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const convIdRef = useRef<string | null>(convActive?.id ?? null)
  const filRef = useRef<HTMLDivElement>(null)

  // Le feuillet ne défile plus dans une boîte : il se lit d'un trait, avec la
  // page. On garde le bas du fil en vue pendant que la réponse s'écrit.
  const versLeBas = () => {
    requestAnimationFrame(() => {
      filRef.current?.scrollIntoView({ block: 'end' })
    })
  }

  async function envoyer(texteAmorce?: string) {
    const message = (texteAmorce ?? saisie).trim()
    if (!message || enCours || restant <= 0) return
    setErreur(null)
    setSaisie('')
    setMessages(prev => [
      ...prev,
      { role: 'eleve', contenu: message, jour: jourAujourdhui, datation: datationAujourdhui },
      { role: 'assistant', contenu: '', jour: jourAujourdhui, datation: datationAujourdhui },
    ])
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
        setMessages(prev => prev.slice(0, -1)) // retire la réponse vide du tuteur
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
            copie[copie.length - 1] = { ...copie[copie.length - 1], role: 'assistant', contenu: copie[copie.length - 1].contenu + t }
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
  const dernier = messages[messages.length - 1]
  // Le fleuron se pose après la DERNIÈRE réponse achevée (jamais pendant l'écriture).
  const montreFleuron = !enCours && dernier?.role === 'assistant' && dernier.contenu.length > 0

  return (
    <div
      className="flex flex-col lg:flex-row items-stretch rounded-[6px]"
      style={{ background: 'var(--fond-module)' }}
    >
      {/* ── Rail des conversations — il s'efface, l'espace central est la lettre ── */}
      <aside className="w-full lg:w-[228px] flex-none px-4 py-5 lg:px-[15px] flex flex-col gap-3.5">
        <Link
          href="/eleve/modules/scriptorium"
          className="block w-full text-center font-ui text-[13px] font-medium rounded-[7px] py-2.5 border border-bouton-parcours/40 text-bouton-parcours hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
        >
          ＋ Nouvelle conversation
        </Link>

        <p className="hidden lg:block font-ui text-[10px] font-bold uppercase tracking-[.14em] text-muet px-0.5">
          Récentes
        </p>
        <button
          type="button"
          onClick={() => setRailOuvert(o => !o)}
          aria-expanded={railOuvert}
          aria-controls="rail-conversations"
          className="lg:hidden self-start font-ui text-[10px] font-bold uppercase tracking-[.14em] text-muet px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm"
        >
          Récentes {railOuvert ? '⌃' : '⌄'}
        </button>

        <div id="rail-conversations" className={railOuvert ? '' : 'hidden lg:block'}>
          <ul className="flex flex-col gap-0.5">
            {conversations.map(c => {
              const actif = convActive?.id === c.id
              return (
                <li
                  key={c.id}
                  className={`group relative rounded-[3px] border px-3 py-2 transition-colors ${
                    actif ? 'border-transparent bg-pigment/5' : 'border-transparent hover:border-bordure hover:bg-surface'
                  }`}
                >
                  {actif && <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.5 bg-pigment" />}
                  <Link
                    href={`/eleve/modules/scriptorium?conv=${c.id}`}
                    aria-current={actif ? 'page' : undefined}
                    className={`block font-corps text-[15px] truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm ${
                      actif ? 'font-medium text-encre' : 'text-encre-douce hover:text-encre'
                    }`}
                  >
                    {c.titre}
                  </Link>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="font-ui text-[11.5px] flex-1 truncate" style={{ color: ENCRE_META }}>{c.recence}</span>
                    {/* Révélés au survol / focus de la ligne — jamais en permanence. */}
                    <button
                      onClick={() => renommer(c)}
                      className="font-ui text-[11.5px] font-medium text-pigment border-b border-pigment/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none transition-opacity"
                    >
                      Renommer
                    </button>
                    <button
                      onClick={() => supprimer(c)}
                      className="font-ui text-[11.5px] font-medium text-retard border-b border-retard/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none transition-opacity"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              )
            })}
            {conversations.length === 0 && (
              <li className="font-corps italic text-[14px] leading-[1.5] px-0.5" style={{ color: ENCRE_META }}>
                Rien encore. Ta première lettre ouvrira la liste.
              </li>
            )}
          </ul>
        </div>
      </aside>

      {/* ── La lettre : colonne unique, jamais élargie ─────────────────────── */}
      <div className="flex-1 min-w-0 px-4 pb-7 pt-0 lg:pt-[26px] lg:px-[30px]">
        <div className="max-w-[720px] mx-auto">

          {/* Billet de transparence (première utilisation) — contenu inchangé. */}
          {premierUsage && messages.length === 0 && (
            <div className="bg-pigment-teinte border border-bordure-bouton rounded-[3px] px-5 sm:px-7 pt-[22px] pb-6 mb-[22px]">
              <p className="font-ui font-semibold text-[15px] tracking-[.02em] text-encre mb-3">Avant de commencer</p>
              <p className="font-corps text-[17px] leading-[1.62] text-encre mb-2.5">
                Ton professeur ne lit pas tes conversations. Une synthèse anonyme hebdomadaire l’aide à ajuster le cours ; les tentatives de triche lui sont signalées.
              </p>
              <p className="font-corps text-[17px] leading-[1.62] text-encre">
                Supprimer une conversation la retire de ta liste, pas du traitement hebdomadaire.
              </p>
            </div>
          )}

          {/* Le feuillet */}
          <div
            ref={filRef}
            className="bg-surface border border-bordure rounded-[3px] px-5 sm:px-[46px] pt-[34px] pb-10 shadow-[0_8px_28px_rgba(74,58,40,0.06)]"
          >
            <EnTeteLettre />

            {messages.length === 0 ? (
              <>
                <p className="font-corps text-[18px] leading-[1.66] text-encre-douce text-center mt-[30px]">
                  Pose une question sur ton cours — ou pars d’une amorce :
                </p>
                <Fleuron />
              </>
            ) : (
              <div className="mt-[26px]">
                {messages.map((m, i) => {
                  const nouvelleJournee = i === 0 || messages[i - 1].jour !== m.jour
                  const dernierMessage = i === messages.length - 1
                  return (
                    <div key={i}>
                      {nouvelleJournee && <Datation texte={m.datation} />}
                      {m.role === 'eleve' ? (
                        <div className={`ml-[12%] pl-5 border-l-2 border-pigment/35 ${dernierMessage ? '' : 'mb-[26px]'}`}>
                          <p className="font-ui text-[11px] font-semibold uppercase tracking-[.14em] mb-1.5" style={{ color: ENCRE_META }}>
                            Toi
                          </p>
                          <p className="font-corps text-[18px] leading-[1.66] text-encre-douce whitespace-pre-wrap">
                            {m.contenu}
                          </p>
                        </div>
                      ) : (
                        <p className={`font-corps text-[18px] leading-[1.66] text-encre whitespace-pre-wrap ${dernierMessage ? '' : 'mb-[26px]'}`}>
                          {m.contenu}
                          {enCours && dernierMessage && (
                            <span aria-hidden className="inline-block w-0.5 h-[19px] bg-pigment opacity-80 ml-[3px] align-[-3px]" />
                          )}
                        </p>
                      )}
                    </div>
                  )
                })}
                {montreFleuron && <Fleuron />}
              </div>
            )}
          </div>

          {erreur && <p className="font-ui text-[13px] text-retard mt-3">⚠ {erreur}</p>}

          {/* L'écritoire — une feuille, pas un champ de messagerie. */}
          {quotaEpuise ? (
            <div className="mt-[22px] bg-parchemin border border-bordure-bouton rounded-[4px] px-6 py-[26px]">
              <p className="font-titre italic text-[19px] leading-[1.55] text-encre text-center">
                Tu as beaucoup travaillé aujourd’hui — on se retrouve demain.
              </p>
            </div>
          ) : (
            <div
              className="mt-[22px] bg-surface border border-bordure-bouton rounded-[4px] px-5 pt-4 pb-3.5 shadow-[0_6px_20px_rgba(74,58,40,0.05)]"
              style={{ borderTopWidth: 2, borderTopColor: 'rgba(74,58,40,.20)' }}
            >
              <textarea
                value={saisie}
                onChange={e => setSaisie(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void envoyer() }
                }}
                rows={Math.min(6, Math.max(1, saisie.split('\n').length))}
                placeholder="Ta question sur le cours… (Entrée pour envoyer)"
                aria-label="Ta question sur le cours"
                // `background: transparent` en style inline : la règle globale
                // `input, textarea { background-color:#fff }` de globals.css n'est
                // pas dans une couche Tailwind et l'emporterait sur une classe.
                style={{ background: 'transparent' }}
                className="w-full resize-none border-0 border-b border-bordure pb-2 font-corps text-[17px] leading-[1.5] text-encre placeholder:italic placeholder:text-[#7E6746] focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 mt-3">
                {enCours ? (
                  <span className="font-titre italic text-[14px] text-encre-douce">le tuteur écrit…</span>
                ) : restant <= 10 ? (
                  <span className="font-ui text-[12.5px]" style={{ color: ENCRE_META }}>
                    {restant} message{restant > 1 ? 's' : ''} restant{restant > 1 ? 's' : ''} aujourd’hui
                  </span>
                ) : (
                  <span />
                )}
                {enCours ? (
                  <button
                    onClick={stop}
                    className="font-ui text-[14px] font-medium px-[22px] py-2.5 rounded-[6px] border border-bordure-bouton bg-parchemin text-encre-douce hover:text-encre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => void envoyer()}
                    disabled={!saisie.trim()}
                    className="font-ui text-[14px] font-semibold px-6 py-2.5 rounded-[6px] bg-bouton-parcours text-bouton-parcours-texte hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
                  >
                    Envoyer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Amorces — invitations discrètes sous l'écritoire, texte tel que généré. */}
          {messages.length === 0 && !quotaEpuise && (
            <div className="mt-5">
              <p className="font-ui text-[11px] font-semibold uppercase tracking-[.14em] mb-3" style={{ color: ENCRE_META }}>
                Pour commencer
              </p>
              <div className="flex flex-col gap-2.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => void envoyer(s)}
                    disabled={enCours || restant <= 0}
                    className="text-left bg-surface border border-bordure rounded-[3px] px-4 py-3 font-corps text-[17px] leading-[1.5] text-encre hover:border-bordure-bouton disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

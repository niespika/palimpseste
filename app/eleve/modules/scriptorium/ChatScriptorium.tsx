'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { renommerConversation, supprimerConversation } from './actions'
import LibelleSuivi from '@/components/nav/LibelleSuivi'
import SceauModule from '@/components/nav/SceauModule'

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
// ⭐ 18/09 — BUREAU (lg+, handoff `scriptorium_discussion_bureau`) : l'en-tête du
// site n'est plus rendu sur cette vue (page.tsx pose `data-sans-en-tete`, lu par
// globals.css). À sa place, un RUBAN vertical de 64 px : retour Palimpseste,
// sceau du Scriptorium, ＋ nouvelle conversation, ≡ conversations, Plan de cours,
// classe en bas. Les conversations vivent dans un TIROIR de 360 px qui POUSSE le
// fil (dans le flux, pas de voile), fermé à l'arrivée. Le fil prend toute la
// hauteur, dans une colonne de lecture bornée à 900 px ; seule la correspondance
// défile, l'écritoire reste collé en bas. Sous lg : rien ne change (liste ↔ fil).
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
// Fond du médaillon Palimpseste — la même valeur que la Marque de l'en-tête.
const FOND_MEDAILLON = '#EDE6D6'
// Filets au pigment (#4A3A28) — dégradés des séparateurs rituels.
const FILET_GAUCHE = { background: 'linear-gradient(90deg,transparent,rgba(74,58,40,.22))' }
const FILET_DROIT = { background: 'linear-gradient(90deg,rgba(74,58,40,.22),transparent)' }
const FLEURON_GAUCHE = { background: 'linear-gradient(90deg,transparent,rgba(74,58,40,.32))' }
const FLEURON_DROIT = { background: 'linear-gradient(90deg,rgba(74,58,40,.32),transparent)' }
const FILET_RUBAN = { background: 'linear-gradient(90deg,transparent,rgba(60,50,40,.25),transparent)' }

const ANNEAU_FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment'

// Datation de lettre — une fois par journée de correspondance, pas par message.
function Datation({ texte }: { texte: string }) {
  return (
    <div className="flex items-center justify-center gap-4 my-[26px]">
      <span aria-hidden className="flex-1 h-px" style={FILET_GAUCHE} />
      <span className="font-titre italic text-[18px] whitespace-nowrap text-encre-douce">{texte}</span>
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
// En bureau, la rangée se complète à droite du TITRE de la conversation et de
// la pastille de quota (handoff, chantier 4) ; elle reste ÉPINGLÉE en haut
// pendant que la correspondance défile (`sticky` dans la boîte défilante —
// sinon le quota disparaissait dès qu'on lisait). ⚠️ Mesuré le 18/09 : les titres
// font 60 caractères en médiane (tronqués à 60 à la création), pas 31 comme sur
// la maquette — le titre se coupe donc avec des points de suspension, le texte
// entier reste dans le `title`.
function EnTeteLettre({ titre, restant }: { titre?: string; restant?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 pb-5 lg:pb-4 border-b border-bordure lg:sticky lg:top-0 lg:z-10 lg:bg-surface-retrait">
      <div className="flex items-center gap-3 flex-none">
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
      <div className="hidden lg:flex items-center justify-end gap-3.5 min-w-0 flex-1">
        {titre && (
          <span className="font-titre italic text-[15px] truncate min-w-0" style={{ color: ENCRE_META }} title={titre}>
            {titre}
          </span>
        )}
        {restant != null && (
          <span className="flex-none font-ui text-[12px] text-muet bg-parchemin border border-bordure rounded-full px-3 py-1 whitespace-nowrap">
            {restant} message{restant > 1 ? 's' : ''} restant{restant > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// Le glyphe ≡ du ruban : trois traits, le troisième court et aligné à gauche.
function GlypheConversations({ ouvert }: { ouvert: boolean }) {
  const trait = ouvert ? 'bg-pigment' : 'bg-bouton-parcours'
  return (
    <span aria-hidden className="flex flex-col items-center justify-center gap-1 w-full">
      <span className={`w-4 h-[1.5px] ${trait}`} />
      <span className={`w-4 h-[1.5px] ${trait}`} />
      <span className={`w-[11px] h-[1.5px] ${trait} self-start ml-3`} />
    </span>
  )
}

// Le glyphe du Plan de cours : trois barrettes, rappel des trois statuts du plan
// (vu · en cours · à venir) — les mêmes jetons que <PlanCours>.
function GlyphePlan() {
  return (
    <span aria-hidden className="flex flex-col items-center justify-center gap-[3px]">
      <span className="w-3.5 h-[5px] rounded-[1px] bg-ok" />
      <span className="w-3.5 h-[5px] rounded-[1px] bg-attention" />
      <span className="w-3.5 h-[5px] rounded-[1px] bg-white border border-puce" />
    </span>
  )
}

export default function ChatScriptorium({
  classeId, classeNom, conversations, convActive, quotaRestant, suggestions, premierUsage,
  datationAujourdhui, jourAujourdhui,
}: {
  classeId: string
  /** Nom de la classe active — pastille du ruban et sous-ligne du tiroir. */
  classeNom: string
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
  // Un seul état pour deux écrans : sous lg, la liste des conversations se
  // déplie sous le bouton « Récentes » ; sur lg+, c'est le TIROIR de 360 px que
  // le ≡ du ruban ouvre et ferme. Fermé à l'arrivée dans les deux cas — et le
  // composant est remonté (`key`) au choix d'une conversation, ce qui referme.
  const [railOuvert, setRailOuvert] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const convIdRef = useRef<string | null>(convActive?.id ?? null)
  const filRef = useRef<HTMLDivElement>(null)

  // On garde le bas du fil en vue pendant que la réponse s'écrit — dans les DEUX
  // régimes (cf. `filDefilant` plus bas) : si le feuillet est une boîte
  // défilante, on défile la boîte ; sinon on défile la page comme avant.
  const versLeBas = () => {
    requestAnimationFrame(() => {
      const fil = filRef.current
      if (!fil) return
      if (fil.scrollHeight > fil.clientHeight) fil.scrollTop = fil.scrollHeight
      else fil.scrollIntoView({ block: 'end' })
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

  // Le ＋ du ruban est, en bureau, le SEUL chemin vers une conversation neuve.
  // Quand on est déjà sur `/eleve/modules/scriptorium` (envoi échoué, ou réponse
  // en cours d'une conversation pas encore adressée), Next ne remonte rien : la
  // `key` reste 'nouvelle'. On remet donc l'état local à zéro nous-mêmes.
  function nouvelleConversation() {
    if (convActive) return // la navigation remonte le composant (`key`)
    abortRef.current?.abort()
    convIdRef.current = null
    setMessages([])
    setSaisie('')
    setErreur(null)
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

  // Régime « le fil défile dans le feuillet » (C2.2-bis / K2), SUR lg+ SEULEMENT :
  // dès qu'une conversation contient des messages, la page ne défile pas, le
  // ruban, le tiroir et l'écritoire restent visibles, seule la correspondance
  // défile. État vide et première utilisation (billet + amorces) : c'est la
  // colonne entière qui défile, l'écritoire n'est pas épinglé. Sous lg : flux de
  // page dans les deux cas (une boîte défilante à 375 px serait pire).
  //
  // ⭐ 18/09 : la hauteur est celle de la FENÊTRE (`100dvh`) — plus aucune
  // coquille au-dessus ni au-dessous (l'en-tête n'est pas rendu, le <main> n'a
  // plus de cadre sur cette vue). Le `calc(100dvh-235px)` d'avant est mort.
  const filDefilant = messages.length > 0

  return (
    <div className="flex flex-col lg:flex-row items-stretch rounded-[6px] bg-fond-module lg:rounded-none lg:h-dvh lg:bg-surface-retrait">

      {/* ── Le ruban (bureau seulement) — 64 px, pleine hauteur ──────────────
          Pas de libellé texte : les `title`/`aria-label` suffisent, le tiroir
          et le fil portent les mots. Cibles 40 × 40 px. */}
      <nav
        aria-label="Scriptorium"
        className="hidden lg:flex flex-none w-16 flex-col items-center gap-3.5 pt-3.5 pb-4 bg-surface border-r border-bordure"
      >
        <Link
          href="/eleve"
          title="Retour à Palimpseste"
          aria-label="Retour à Palimpseste"
          className={`relative inline-flex flex-none w-10 h-10 rounded-full ${ANNEAU_FOCUS}`}
        >
          {/* Le disque recadre l'image ; le chevron est son FRÈRE, hors du clip
              (dans le disque, le cercle le rognait en croissant). */}
          <span className="relative inline-flex w-10 h-10 rounded-full overflow-hidden border border-bordure" style={{ background: FOND_MEDAILLON }}>
            <Image
              src="/sceaux/palimpseste_medaillon.png"
              alt=""
              fill
              sizes="40px"
              style={{ objectFit: 'cover', filter: 'brightness(1.05) contrast(1.05)', mixBlendMode: 'multiply' }}
            />
          </span>
          <span
            aria-hidden
            className="absolute -left-px top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-pigment text-bouton-parcours-texte font-ui font-bold text-[11px] leading-4 text-center"
          >
            ‹
          </span>
        </Link>

        {/* Le sceau du module, anneau ocre = « tu es ici » (repris de la bande seuil). */}
        <span title="Scriptorium" className="inline-flex flex-none">
          <SceauModule cle="scriptorium" size={40} epaisseurAnneau={2} />
          <span className="sr-only">Scriptorium</span>
        </span>

        <span aria-hidden className="w-7 h-px flex-none" style={FILET_RUBAN} />

        <Link
          href="/eleve/modules/scriptorium"
          title="Nouvelle conversation"
          aria-label="Nouvelle conversation"
          onClick={nouvelleConversation}
          className={`inline-flex flex-none items-center justify-center w-10 h-10 rounded-[10px] bg-bouton-parcours text-bouton-parcours-texte font-ui font-medium text-[22px] leading-none hover:opacity-90 ${ANNEAU_FOCUS}`}
        >
          ＋
        </Link>

        <button
          type="button"
          onClick={() => setRailOuvert(o => !o)}
          aria-expanded={railOuvert}
          aria-controls="tiroir-conversations"
          title="Conversations"
          aria-label="Conversations"
          className={`inline-flex flex-none items-center justify-center w-10 h-10 rounded-[10px] border transition-colors ${
            railOuvert ? 'bg-pigment-teinte border-bordure-bouton' : 'bg-white border-bordure hover:bg-surface-retrait'
          } ${ANNEAU_FOCUS}`}
        >
          <GlypheConversations ouvert={railOuvert} />
        </button>

        <Link
          href="/eleve/modules/scriptorium?vue=plan"
          title="Plan de cours"
          aria-label="Plan de cours"
          className={`inline-flex flex-none items-center justify-center w-10 h-10 rounded-[10px] bg-white border border-bordure hover:bg-surface-retrait ${ANNEAU_FOCUS}`}
        >
          <GlyphePlan />
        </Link>

        {/* La classe active — inerte : le changement de classe reste dans
            l'en-tête des autres pages. Mesuré le 18/09 : les classes réelles
            font 2 à 4 caractères (T5, 1HLP, THLP) ; les noms de 11 (« Hors
            classe », « Classe Test ») se coupent, le nom entier est en `title`. */}
        <span
          title={classeNom}
          className="mt-auto max-w-[56px] truncate font-ui font-medium text-[11px] text-encre-douce bg-surface-retrait border border-bordure rounded-[7px] px-1.5 py-[3px]"
        >
          {classeNom}
        </span>
      </nav>

      {/* ── Rail des conversations ────────────────────────────────────────────
          Sous lg : bandeau au-dessus de la lettre, liste dépliable (inchangé).
          Sur lg+ : le TIROIR de 360 px, dans le flux — il pousse le fil, pas de
          voile, pas d'ombre ; absent tant que le ≡ ne l'a pas ouvert. */}
      <aside
        id="tiroir-conversations"
        aria-label="Conversations"
        className={`w-full flex-none px-4 py-5 flex flex-col gap-3.5 ${
          railOuvert ? 'lg:flex' : 'lg:hidden'
        } lg:w-[360px] lg:min-h-0 lg:px-0 lg:py-0 lg:gap-0 lg:bg-surface lg:border-r lg:border-bordure`}
      >
        {/* En-tête du tiroir (bureau). */}
        <div className="hidden lg:flex lg:flex-none items-start justify-between gap-3 px-5 pt-[18px] pb-3.5 border-b border-bordure">
          <div className="min-w-0">
            <div className="font-marque font-semibold text-[16px] tracking-[.04em] text-pigment">Conversations</div>
            <div className="font-corps text-[13px] text-muet mt-0.5">Tes échanges avec le tuteur — {classeNom}.</div>
          </div>
          <button
            type="button"
            onClick={() => setRailOuvert(false)}
            aria-label="Fermer les conversations"
            title="Fermer"
            className={`flex-none w-10 h-10 -mr-2 -mt-2 inline-flex items-center justify-center font-ui text-[20px] leading-none text-muet hover:text-encre rounded-[8px] ${ANNEAU_FOCUS}`}
          >
            ×
          </button>
        </div>

        {/* Sous lg seulement — en bureau, le ＋ est dans le ruban. */}
        <Link
          href="/eleve/modules/scriptorium"
          className={`lg:hidden block w-full text-center font-ui text-[13px] font-medium rounded-[7px] py-2.5 border border-bouton-parcours/40 text-bouton-parcours hover:bg-surface ${ANNEAU_FOCUS}`}
        >
          ＋ Nouvelle conversation
        </Link>

        <p className="hidden lg:block lg:flex-none font-ui text-[11px] font-bold uppercase tracking-[.11em] text-muet-clair px-5 pt-4 pb-2">
          Récentes
        </p>
        <button
          type="button"
          onClick={() => setRailOuvert(o => !o)}
          aria-expanded={railOuvert}
          aria-controls="rail-conversations"
          className={`lg:hidden self-start font-ui text-[10px] font-bold uppercase tracking-[.14em] text-muet px-0.5 rounded-sm ${ANNEAU_FOCUS}`}
        >
          Récentes {railOuvert ? '⌃' : '⌄'}
        </button>

        <div
          id="rail-conversations"
          className={`${railOuvert ? '' : 'hidden lg:block'} lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:px-3.5 lg:pb-4`}
        >
          <ul className="flex flex-col gap-0.5 lg:gap-[7px]">
            {conversations.map(c => {
              const actif = convActive?.id === c.id
              return (
                <li
                  key={c.id}
                  className={`group relative rounded-[3px] lg:rounded-[9px] border px-3 py-2 lg:py-2.5 transition-colors ${
                    actif
                      ? 'border-transparent bg-pigment/5 lg:border-bordure-bouton lg:bg-surface-retrait'
                      : 'border-transparent hover:border-bordure hover:bg-surface lg:bg-white lg:border-bordure lg:hover:border-bordure-bouton'
                  }`}
                >
                  {actif && (
                    <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.5 bg-pigment lg:w-[3px] lg:rounded-l-[9px] lg:bg-bouton-parcours" />
                  )}
                  <Link
                    href={`/eleve/modules/scriptorium?conv=${c.id}`}
                    aria-current={actif ? 'page' : undefined}
                    // Le tiroir se ferme au choix (bureau). Sous lg on ne touche
                    // à rien : la liste restait ouverte jusqu'au remontage.
                    onClick={() => { if (window.matchMedia('(min-width: 64rem)').matches) setRailOuvert(false) }}
                    className={`relative block font-corps text-[15px] truncate rounded-sm ${ANNEAU_FOCUS} ${
                      actif ? 'font-medium text-encre' : 'text-encre-douce hover:text-encre'
                    }`}
                  >
                    <LibelleSuivi enveloppe="block truncate">{c.titre}</LibelleSuivi>
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

      {/* ── La lettre ────────────────────────────────────────────────────────
          Sous lg : colonne unique en pleine largeur (C2.2-ter, Z2 — le cap
          `max-w-[720px]` était retiré, la densité passait avant la cible).
          Sur lg+ (18/09) : le fil prend toute la hauteur, dans une COLONNE DE
          LECTURE de 900 px max, centrée, marges latérales 48 px ; elle ne
          s'élargit jamais au-delà, tiroir ouvert ou fermé. */}
      <div className="flex-1 min-w-0 px-4 pb-7 pt-0 lg:px-0 lg:pb-0 lg:flex lg:flex-col lg:min-h-0 lg:h-dvh">
        <div
          className={`lg:flex lg:flex-col lg:min-h-0 lg:flex-1 lg:w-full lg:max-w-[900px] lg:mx-auto lg:px-12 lg:pt-7 ${
            filDefilant ? '' : 'lg:overflow-y-auto lg:pb-6'
          }`}
        >

          {/* Billet de transparence (première utilisation) — contenu inchangé. */}
          {premierUsage && messages.length === 0 && (
            <div className="bg-pigment-teinte border border-bordure-bouton rounded-[3px] px-5 sm:px-7 pt-[22px] pb-6 mb-[22px] lg:flex-none">
              <p className="font-ui font-semibold text-[15px] tracking-[.02em] text-encre mb-3">Avant de commencer</p>
              <p className="font-corps text-[16px] leading-[1.62] text-encre mb-2.5">
                Ton professeur ne lit pas tes conversations. Une synthèse anonyme hebdomadaire l’aide à ajuster le cours ; les tentatives de triche lui sont signalées.
              </p>
              <p className="font-corps text-[16px] leading-[1.62] text-encre">
                Supprimer une conversation la retire de ta liste, pas du traitement hebdomadaire.
              </p>
            </div>
          )}

          {/* Le feuillet — carte sous lg ; en bureau il se fond dans la page
              (la colonne de lecture EST le feuillet) et devient la seule boîte
              défilante dès qu'il y a des messages. */}
          <div
            ref={filRef}
            className={`bg-surface border border-bordure rounded-[3px] px-5 sm:px-[46px] pt-[26px] pb-7 shadow-[0_8px_28px_rgba(74,58,40,0.06)] lg:bg-transparent lg:border-0 lg:rounded-none lg:shadow-none lg:px-0 lg:pt-0 lg:pb-6 ${
              filDefilant ? 'lg:flex-1 lg:min-h-0 lg:overflow-y-auto' : 'lg:flex-none'
            }`}
          >
            <EnTeteLettre titre={convActive?.titre} restant={restant} />

            {messages.length === 0 ? (
              <>
                <p className="font-corps text-[16.5px] leading-[1.6] text-encre-douce text-center mt-[30px]">
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
                        <div className={`ml-[12%] lg:ml-24 pl-5 border-l-2 border-pigment/35 ${dernierMessage ? '' : 'mb-[26px]'}`}>
                          <p className="font-ui text-[11px] font-semibold uppercase tracking-[.14em] mb-1.5" style={{ color: ENCRE_META }}>
                            Toi
                          </p>
                          <p className="font-corps text-[16.5px] leading-[1.6] text-encre-douce whitespace-pre-wrap lg:text-[17px] lg:italic">
                            {m.contenu}
                          </p>
                        </div>
                      ) : (
                        <p className={`font-corps text-[16.5px] leading-[1.6] text-encre whitespace-pre-wrap lg:text-[17px] lg:leading-[1.65] ${dernierMessage ? '' : 'mb-[26px]'}`}>
                          {m.contenu}
                          {enCours && dernierMessage && (
                            <span aria-hidden className="inline-block w-0.5 h-[18px] bg-pigment opacity-80 ml-[3px] align-[-3px]" />
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

          {erreur && <p className="font-ui text-[13px] text-retard mt-3 lg:flex-none lg:mt-0 lg:mb-2">⚠ {erreur}</p>}

          {/* L'écritoire — une feuille, pas un champ de messagerie. En bureau,
              elle reste collée en bas : champ blanc arrondi et bouton côte à
              côte, sans la carte ni le filet haut du feuillet mobile. */}
          {quotaEpuise ? (
            <div className="mt-[22px] bg-parchemin border border-bordure-bouton rounded-[4px] px-6 py-[26px] lg:flex-none lg:mt-2 lg:mb-6">
              <p className="font-titre italic text-[19px] leading-[1.55] text-encre text-center">
                Tu as beaucoup travaillé aujourd’hui — on se retrouve demain.
              </p>
            </div>
          ) : (
            <div className="mt-3 bg-surface border border-bordure-bouton border-t-2 border-t-pigment/20 rounded-[4px] px-4 py-2.5 shadow-[0_6px_20px_rgba(74,58,40,0.05)] lg:flex-none lg:mt-0 lg:bg-transparent lg:border-0 lg:rounded-none lg:shadow-none lg:px-0 lg:pt-2 lg:pb-6">
              {/* C2.2-ter (Z3) : l'écritoire tient sur UNE ligne — le champ et le
                  bouton côte à côte. `items-end` garde le bouton calé en bas
                  quand le champ s'étire (1 → 6 lignes). */}
              <div className="flex items-end gap-3 lg:gap-2.5">
                <div className="flex-1 min-w-0 lg:bg-white lg:border lg:border-bordure-bouton lg:rounded-[11px] lg:px-4 lg:pt-2.5 lg:pb-[7px]">
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
                    // En bureau, c'est le conteneur qui porte le blanc et le bord.
                    style={{ background: 'transparent' }}
                    className="block w-full resize-none border-0 border-b border-bordure pb-2 font-corps text-[16px] leading-[1.5] text-encre placeholder:italic placeholder:text-[#7E6746] focus:outline-none lg:border-b-0 lg:pb-0"
                  />
                </div>
                {/* Une seule case, de largeur ET de hauteur figées : « Stop » y
                    remplace « Envoyer » pendant le streaming sans rien décaler.
                    Le filet transparent d'« Envoyer » compense celui de « Stop »
                    (sans lui, 41px contre 43px — la ligne sautait de 2px). */}
                {enCours ? (
                  <button
                    onClick={stop}
                    className={`flex-none w-[104px] font-ui text-[14px] font-medium py-2.5 rounded-[6px] lg:rounded-[11px] lg:py-3 lg:text-[15px] border border-bordure-bouton bg-parchemin text-encre-douce hover:text-encre ${ANNEAU_FOCUS}`}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => void envoyer()}
                    disabled={!saisie.trim()}
                    className={`flex-none w-[104px] font-ui text-[14px] font-semibold py-2.5 rounded-[6px] lg:rounded-[11px] lg:py-3 lg:text-[15px] border border-transparent bg-bouton-parcours text-bouton-parcours-texte hover:opacity-90 disabled:opacity-50 ${ANNEAU_FOCUS}`}
                  >
                    Envoyer
                  </button>
                )}
              </div>
              {/* Ligne d'état — mêmes textes et mêmes conditions qu'avant, mais
                  SOUS le champ : elle n'existe (et ne prend de la hauteur) que
                  lorsqu'elle a quelque chose à dire. Aucune rangée permanente.
                  En bureau, le quota vit dans la pastille de l'en-tête de lettre. */}
              {enCours ? (
                <p className="font-titre italic text-[12.5px] text-encre-douce mt-1.5">le tuteur écrit…</p>
              ) : restant <= 10 ? (
                <p className="font-ui text-[12.5px] mt-1.5 lg:hidden" style={{ color: ENCRE_META }}>
                  {restant} message{restant > 1 ? 's' : ''} restant{restant > 1 ? 's' : ''} aujourd’hui
                </p>
              ) : null}
            </div>
          )}

          {/* Amorces — invitations discrètes sous l'écritoire, texte tel que généré. */}
          {messages.length === 0 && !quotaEpuise && (
            <div className="mt-5 lg:mt-0 lg:flex-none">
              <p className="font-ui text-[11px] font-semibold uppercase tracking-[.14em] mb-3" style={{ color: ENCRE_META }}>
                Pour commencer
              </p>
              <div className="flex flex-col gap-2.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => void envoyer(s)}
                    disabled={enCours || restant <= 0}
                    className={`text-left bg-surface border border-bordure rounded-[3px] lg:rounded-[9px] px-4 py-3 font-corps text-[16px] leading-[1.5] text-encre hover:border-bordure-bouton disabled:opacity-50 ${ANNEAU_FOCUS}`}
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

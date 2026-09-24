'use client'

// ============================================================================
// CODEX — LA SCÈNE DE L'ÉPREUVE, CE QUE LA CLASSE VOIT AU TABLEAU. 24/09/2026.
// ----------------------------------------------------------------------------
// L'heure (dans le fuseau du professeur), le temps restant par paliers — dix,
// puis cinq, puis une minute —, ce qu'il y a à faire maintenant, le sujet et
// les consignes pratiques. Les commandes du professeur vivent dans un pli, en
// bas, fermé par défaut — discret même en plein écran.
//
// ⭐ LA FACTURE EST CELLE DU TIRAGE DE VESTIGIA (`tirage/SceneTirage.tsx`),
//    demandée par Louis (24/09 : « un écran élégant quand même, celui de
//    Vestigia est un bon exemple ») : parchemin, composition centrée, petites
//    capitales espacées, grandes valeurs en Cormorant, le sujet dans une carte,
//    un seul bouton franc au milieu de la scène, les réglages dans un pli.
//
// ⭐ LA VÉRITÉ EST EN BASE, JAMAIS DANS CET ONGLET : l'instant du lancement,
//    l'heure d'ouverture (posée au lancement) et les deux durées. Un F5, un
//    second ordinateur, une mise en veille : le minuteur repart du même point.
//    L'heure du SERVEUR corrige celle du poste.
// ⭐ « LE DÉPÔT EST OUVERT » SE LIT DANS LE FAIT (des dépôts ouverts en base),
//    pas dans l'horloge seule : un « Ouvrir maintenant » à la main se voit
//    aussitôt au tableau (revue du 24/09).
// ⭐ JAMAIS DE DÉCOMPTE : le temps restant se RECALCULE à chaque seconde depuis
//    l'instant de fin — un onglet en arrière-plan ne prend aucun retard.
// ⛔ RIEN NE SE FERME À ZÉRO : la fin de la relecture est un affichage, et la
//    clôture reste le geste du professeur.
// ⛔ `confirm()` EST INTERDIT (il rend `false` dans un aperçu embarqué) : les
//    gestes qui ne se défont pas se confirment EN PAGE, en deux temps.
// ============================================================================

import {
  useActionState, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition,
} from 'react'
import Link from 'next/link'
import {
  actionEtatDeLEpreuve, actionReglerLEpreuve, actionLancerLEpreuve, actionAnnulerLeLancement,
  actionAjouterDuTemps, actionOuvrirLeDepotMaintenant,
  type EtatProjete, type ReponseEpreuve,
} from '@/app/passation/actions-epreuve'
import {
  etatDeLEpreuve, palierMinutes, libelleDuree, heureMurale, avecHeure, TEXTES_EPREUVE,
  BORNES_REDACTION, BORNES_RELECTURE, CONSIGNES_PRATIQUES_MAX, type EtatEpreuve,
} from '@/utils/examens/epreuve'

const SONDAGE_MS = 15_000

interface Props {
  exerciceId: string
  classeNom: string
  /** Le sujet et les consignes de travail — `consigne_instanciee`, ce que lit l'élève. */
  sujet: string
  /** Le statut de l'instance : sans assignation, aucun élève n'a de page. */
  statut: string
  fuseau: string
  maintenantServeur: string
  initial: EtatProjete
}

/**
 * La taille de DÉPART du corps du sujet, selon sa longueur et la largeur de
 * l'écran. Mesuré en prod le 24/09 : les sujets du corpus font 25 à 122
 * caractères, les consignes d'examen 88 à 96 — mais un sujet libre avec ses
 * consignes de travail peut en faire plusieurs centaines, et aucune donnée ne
 * dit combien. ⭐ D'où l'AJUSTEMENT MESURÉ (voir `SceneEpreuve`) : on part de
 * cette taille, et on la réduit jusqu'à ce que la scène tienne dans la hauteur
 * de l'écran. Des paliers fixes (le patron du tirage) ont été éprouvés et
 * refusés : 841 px de scène pour 720 de projecteur, avec un sujet de 326
 * caractères et trois lignes de consignes.
 */
const TAILLE_MIN = 22
function tailleDeDepart(n: number, largeur: number): number {
  const base = n <= 140 ? 52 : n <= 300 ? 42 : n <= 550 ? 34 : n <= 900 ? 28 : 24
  const facteur = largeur < 640 ? 0.6 : largeur < 1024 ? 0.8 : 1
  return Math.max(TAILLE_MIN, Math.round(base * facteur))
}

/** La première ligne titre l'examen ; le reste est le sujet. Un texte d'un seul bloc reste entier. */
function decouper(texte: string): { titre: string | null; corps: string } {
  const t = texte.replace(/\r\n?/g, '\n').trim()
  const i = t.indexOf('\n')
  if (i < 0) return { titre: null, corps: t }
  const corps = t.slice(i + 1).trim()
  return corps ? { titre: t.slice(0, i).trim(), corps } : { titre: null, corps: t }
}

/** Le filet coupé d'un losange — l'ornement du seuil (handoff Codex, écran 1a). */
function Ornement() {
  return (
    <div aria-hidden className="mx-auto mt-3 flex w-40 items-center gap-2">
      <span className="h-px flex-1 bg-puce" />
      <span className="h-1.5 w-1.5 rotate-45 bg-puce" />
      <span className="h-px flex-1 bg-puce" />
    </div>
  )
}

/** Une borne de la ligne du temps : une petite capitale, une valeur en Cormorant. */
function Borne({ libelle, valeur, cote }: { libelle: string; valeur: string; cote: 'gauche' | 'droite' }) {
  return (
    <div className={`min-w-0 text-center ${cote === 'gauche' ? 'sm:text-left' : 'sm:text-right'}`}>
      <p className="font-ui text-[11px] uppercase tracking-[0.25em] text-muet sm:text-xs">{libelle}</p>
      <p className="font-serif text-3xl tabular-nums text-encre sm:text-4xl">{valeur}</p>
    </div>
  )
}

export default function SceneEpreuve(p: Props) {
  const [etat, setEtat] = useState<EtatProjete>(p.initial)
  const [maintenant, setMaintenant] = useState<number | null>(null)
  const [echecs, setEchecs] = useState(0)
  const decalage = useRef(0)
  const cadre = useRef<HTMLDivElement>(null)
  const barre = useRef<HTMLDivElement>(null)
  const projetee = useRef<HTMLDivElement>(null)
  const corpsDuSujet = useRef<HTMLParagraphElement>(null)
  const pli = useRef<HTMLDetailsElement>(null)
  const [fenetre, setFenetre] = useState(0)
  const [pleinEcran, setPleinEcran] = useState(false)
  const pleinEcranPossible = useSyncExternalStore(() => () => {}, () => !!document.fullscreenEnabled, () => true)

  // ── L'horloge : l'heure du serveur, recalée à chaque sondage ────────────────
  useEffect(() => {
    decalage.current = Date.parse(p.maintenantServeur) - Date.now()
    const tic = () => setMaintenant(Date.now() + decalage.current)
    tic()
    const id = setInterval(tic, 1000)
    return () => clearInterval(id)
  }, [p.maintenantServeur])

  const sonder = useCallback(async () => {
    const r = await actionEtatDeLEpreuve(p.exerciceId).catch(() => null)
    // ⭐ Revue du 24/09 : un sondage raté ne se tait plus — au deuxième d'affilée,
    //    la barre du professeur le dit (le tableau, lui, garde son dernier état).
    if (!r) { setEchecs((n) => n + 1); return }
    setEchecs(0)
    decalage.current = Date.parse(r.maintenant) - Date.now()
    setEtat(r)
  }, [p.exerciceId])

  useEffect(() => {
    const id = setInterval(() => { void sonder() }, SONDAGE_MS)
    return () => clearInterval(id)
  }, [sonder])

  // ── L'écran du projecteur ne s'endort pas pendant une épreuve de deux heures ─
  useEffect(() => {
    let verrou: WakeLockSentinel | null = null
    const demander = async () => {
      try { verrou = (await navigator.wakeLock?.request('screen')) ?? null } catch { /* refusé : tant pis */ }
    }
    const auRetour = () => { if (document.visibilityState === 'visible') void demander() }
    void demander()
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      document.removeEventListener('visibilitychange', auRetour)
      void verrou?.release().catch(() => {})
    }
  }, [])

  const basculer = useCallback(async () => {
    const el = cadre.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch { /* Safari iPhone : pas de plein écran sur un élément */ }
  }, [])

  useEffect(() => {
    const onChange = () => setPleinEcran(!!document.fullscreenElement)
    const onKey = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null
      if (cible && ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName)) return
      if (e.key === 'f' || e.key === 'F') void basculer()
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('keydown', onKey)
    }
  }, [basculer])

  // Un redimensionnement (ou un autre écran) relance l'ajustement du sujet.
  useEffect(() => {
    const auRedimensionnement = () => setFenetre((x) => x + 1)
    window.addEventListener('resize', auRedimensionnement)
    return () => window.removeEventListener('resize', auRedimensionnement)
  }, [])

  // ── La frise, à cet instant ──────────────────────────────────────────────────
  const preparee = etat.redactionMin != null
  const frise = maintenant != null && preparee
    ? etatDeLEpreuve({ debut: etat.debut, ouverture: etat.ouverture, redactionMin: etat.redactionMin!,
        relectureMin: etat.relectureMin ?? 0 }, maintenant)
    : null
  const lancee = !!etat.debut
  const heure = (ms: number | null) => (ms == null ? '—' : heureMurale(ms, p.fuseau))
  const { titre, corps } = decouper(p.sujet)
  const phase = frise?.phase ?? 'avant'
  // ⭐ Le FAIT d'abord (des dépôts ouverts en base), l'horloge ensuite.
  const depotOuvert = etat.compte.ouverts > 0 || (frise?.ouvertureVenue ?? false)
  const sansRelecture = (etat.relectureMin ?? 0) === 0

  // ⭐ L'AJUSTEMENT MESURÉ : la partie PROJETÉE (sans la barre ni le pli des
  //    commandes) doit tenir dans la hauteur de l'écran — un projecteur ne défile
  //    pas. On part de la taille de départ et on réduit le corps du sujet, deux
  //    pixels à la fois, tant que ça déborde. Écrit directement sur le nœud, avant
  //    la peinture : aucun clignotement, aucun rendu de plus.
  useLayoutEffect(() => {
    const cadreProjete = projetee.current
    const noeud = corpsDuSujet.current
    if (!cadreProjete || !noeud) return
    const pris = (pleinEcran ? 0 : barre.current?.offsetHeight ?? 0)
      + (pli.current?.querySelector('summary')?.getBoundingClientRect().height ?? 0) + 16
    const dispo = window.innerHeight - pris
    let taille = tailleDeDepart(corps.length, window.innerWidth)
    noeud.style.fontSize = `${taille}px`
    while (cadreProjete.offsetHeight > dispo && taille > TAILLE_MIN) {
      taille -= 2
      noeud.style.fontSize = `${taille}px`
    }
  }, [pleinEcran, corps, etat.consignesPratiques, phase, depotOuvert, lancee, fenetre])

  let message: string = TEXTES_EPREUVE.projectionAvant
  if (phase === 'redaction' && frise) {
    message = depotOuvert
      ? TEXTES_EPREUVE.projectionDepotOuvert
      : avecHeure(TEXTES_EPREUVE.projectionAvantOuverture, heure(frise.ouvertureMs))
  } else if (phase === 'relecture') {
    message = TEXTES_EPREUVE.projectionRelecture
  } else if (phase === 'fin') {
    message = sansRelecture ? TEXTES_EPREUVE.projectionFinSansRelecture : TEXTES_EPREUVE.projectionFin
  }
  const aAgir = lancee && (depotOuvert || phase === 'relecture' || phase === 'fin')

  return (
    <div ref={cadre} className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-parchemin text-encre">
      {/* La barre du professeur — hors de la scène, absente en plein écran. */}
      {!pleinEcran && (
        <div ref={barre} className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-bordure bg-surface px-4 py-2 font-ui text-sm text-muet">
          <Link href={`/prof/codex/passation/${p.exerciceId}`} className="min-w-0 truncate hover:text-encre-douce">
            ← Passation{p.classeNom ? ` · ${p.classeNom}` : ''}
          </Link>
          <div className="flex items-center gap-3">
            {echecs >= 2 && (
              <span className="rounded-full bg-retard-teinte px-2 py-0.5 text-xs text-retard">
                la page ne joint plus le serveur
              </span>
            )}
            <span className="hidden sm:inline">
              {etat.compte.remis} copie{etat.compte.remis > 1 ? 's' : ''} validée{etat.compte.remis > 1 ? 's' : ''} sur {etat.compte.total}
            </span>
            {pleinEcranPossible && (
              <button type="button" onClick={basculer} title="Touche F" aria-pressed={pleinEcran}
                className="min-h-10 rounded-lg border border-bordure-bouton px-3 py-1 text-encre-douce hover:bg-parchemin-fonce">
                Plein écran
              </button>
            )}
          </div>
        </div>
      )}

      {/* La scène — la partie PROJETÉE, qui doit tenir dans la hauteur de l'écran. */}
      <div ref={projetee} className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 sm:gap-5 sm:px-10 sm:py-6">
        <header className="text-center">
          <p className="font-ui text-xs uppercase tracking-[0.3em] text-muet sm:text-sm">
            Épreuve{p.classeNom ? ` · ${p.classeNom}` : ''}
          </p>
          {/* L'intitulé attend le lancement, comme le sujet : un professeur peut
              avoir mis la question elle-même en première ligne. */}
          {lancee && titre && (
            <h1 className="mt-1 text-balance font-serif text-2xl text-encre sm:text-3xl lg:text-4xl">{titre}</h1>
          )}
          <Ornement />
        </header>

        {/* Le temps : l'heure, ce qui reste, et quand ça finit. */}
        <section aria-label="Le temps" className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-8">
          <Borne libelle="Il est" valeur={maintenant == null ? '—' : heure(maintenant)} cote="gauche" />
          <div className="text-center">
            {!preparee ? (
              <p className="font-serif text-3xl italic text-muet">Durée à fixer</p>
            ) : !lancee || !frise || phase === 'avant' ? (
              <>
                <p className="font-ui text-[11px] uppercase tracking-[0.25em] text-pigment sm:text-xs">Rédaction</p>
                <p className="font-serif text-6xl leading-none text-encre sm:text-7xl">{libelleDuree(etat.redactionMin!)}</p>
              </>
            ) : phase === 'fin' ? (
              <>
                <p className="font-ui text-[11px] uppercase tracking-[0.25em] text-pigment sm:text-xs">Fin de l’épreuve</p>
                <p className="font-serif text-5xl leading-none text-encre sm:text-6xl lg:text-7xl">Temps écoulé</p>
              </>
            ) : (
              <>
                <p className="font-ui text-[11px] uppercase tracking-[0.25em] text-pigment sm:text-xs">
                  {phase === 'redaction' ? 'Rédaction' : 'Relecture'} · il reste moins de
                </p>
                <p className="font-serif text-6xl leading-none tabular-nums text-encre sm:text-7xl" aria-live="polite">
                  {libelleDuree(palierMinutes(frise.restantMs ?? 0))}
                </p>
              </>
            )}
          </div>
          {!preparee ? <div /> : !lancee || !frise ? (
            <Borne libelle="Puis la relecture" valeur={libelleDuree(etat.relectureMin ?? 0)} cote="droite" />
          ) : phase === 'redaction' ? (
            <Borne libelle="Fin de la rédaction" valeur={heure(frise.finRedactionMs)} cote="droite" />
          ) : (
            <Borne libelle="Fin de la relecture" valeur={heure(frise.finRelectureMs)} cote="droite" />
          )}
        </section>

        {/* Ce qu'il y a à faire maintenant */}
        {preparee && (
          <p className="mx-auto max-w-4xl text-balance text-center font-serif text-xl italic text-encre">
            {aAgir && <span aria-hidden className="mr-2.5 inline-block h-2.5 w-2.5 -translate-y-0.5 rounded-full bg-bouton-plan align-middle" />}
            {message}
          </p>
        )}

        {lancee ? (
          <div className={`grid gap-5 ${etat.consignesPratiques ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6' : ''}`}>
            <article className="min-w-0 rounded-2xl border border-bordure bg-surface px-6 py-5 sm:px-10 sm:py-6">
              <p className="mb-3 font-ui text-xs uppercase tracking-[0.25em] text-muet">Le sujet</p>
              {/* La taille vient de l'ajustement mesuré ; `text-3xl` est le repli s'il
                  n'a pas encore tourné. */}
              <p ref={corpsDuSujet} className="whitespace-pre-wrap text-balance font-serif text-3xl leading-snug text-encre">
                {corps}
              </p>
            </article>
            {etat.consignesPratiques && <Consignes texte={etat.consignesPratiques} />}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            {etat.consignesPratiques && (
              <div className="w-full max-w-3xl"><Consignes texte={etat.consignesPratiques} /></div>
            )}
            <Lancement exerciceId={p.exerciceId} preparee={preparee} relire={sonder} />
            <p className="font-serif text-lg italic text-muet">Le sujet s’affichera au lancement de l’épreuve.</p>
          </div>
        )}
      </div>

      {/* Les commandes — un pli fermé par défaut, discret même en plein écran
          (patron des réglages du tirage de Vestigia). */}
      <details ref={pli}
        className={`group mx-auto mb-4 mt-auto w-full max-w-6xl px-6 sm:px-10 ${pleinEcran ? 'opacity-50 hover:opacity-100 focus-within:opacity-100' : ''}`}>
        <summary className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-bordure bg-surface px-4 py-2.5 font-ui text-sm text-encre-douce hover:text-encre">
          <span aria-hidden className="text-muet-clair transition-transform group-open:rotate-90">›</span>
          Commandes de l’épreuve — durées, consignes, temps, dépôt
        </summary>
        <Commandes {...p} etat={etat} frise={frise} depotOuvert={depotOuvert} relire={sonder} heure={heure} />
      </details>
    </div>
  )
}

function Consignes({ texte }: { texte: string }) {
  return (
    <aside className="min-w-0 rounded-2xl border border-bordure bg-surface-retrait px-5 py-4 sm:px-6">
      <p className="mb-2 font-ui text-xs uppercase tracking-[0.25em] text-muet">Consignes</p>
      <p className="whitespace-pre-wrap font-serif text-lg leading-snug text-encre sm:text-xl">{texte}</p>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LE LANCEMENT — le seul bouton franc de la scène, confirmé en page
// ─────────────────────────────────────────────────────────────────────────────

function Lancement({ exerciceId, preparee, relire }: {
  exerciceId: string; preparee: boolean; relire: () => Promise<void>
}) {
  const [confirmer, setConfirmer] = useState(false)
  const [retour, setRetour] = useState<ReponseEpreuve | null>(null)
  const [enCours, demarrer] = useTransition()

  if (!preparee) {
    return (
      <p className="font-ui text-sm text-muet">
        Fixez la durée de rédaction et celle de relecture dans les commandes, en bas de la page.
      </p>
    )
  }
  return (
    <div className="flex flex-col items-center gap-3">
      {!confirmer ? (
        <button type="button" onClick={() => { setRetour(null); setConfirmer(true) }}
          className="rounded-2xl bg-bouton px-8 py-3 font-ui text-lg text-bouton-texte shadow-sm transition-colors hover:opacity-90 sm:px-12 sm:py-4 sm:text-2xl">
          Lancer l’épreuve
        </button>
      ) : (
        <div role="alertdialog" aria-live="assertive"
          className="flex max-w-2xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-bordure bg-surface px-5 py-4 text-center">
          <p className="w-full font-ui text-base text-encre">
            Lancer maintenant ? Le sujet s’affiche aussitôt sur les tablettes, et le minuteur part.
          </p>
          <button type="button" disabled={enCours}
            onClick={() => demarrer(async () => {
              const r = await actionLancerLEpreuve(exerciceId)
              setRetour(r)
              setConfirmer(false)
              await relire()
            })}
            className="min-h-11 rounded-xl bg-bouton px-6 py-2 font-ui text-base text-bouton-texte hover:opacity-90 disabled:opacity-50">
            {enCours ? '…' : 'Oui, lancer'}
          </button>
          <button type="button" disabled={enCours} onClick={() => setConfirmer(false)}
            className="min-h-11 rounded-xl border border-bordure-bouton bg-surface px-6 py-2 font-ui text-base text-encre-douce hover:bg-parchemin-fonce">
            Non
          </button>
        </div>
      )}
      {retour && !retour.ok && <p className="font-ui text-sm text-retard">{retour.message}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LES COMMANDES DU PROFESSEUR — dans le pli
// ─────────────────────────────────────────────────────────────────────────────

type Geste = 'annuler' | 'ouvrir'

function Commandes(p: Props & {
  etat: EtatProjete
  frise: EtatEpreuve | null
  depotOuvert: boolean
  relire: () => Promise<void>
  heure: (ms: number | null) => string
}) {
  const { etat, frise } = p
  const lancee = !!etat.debut
  const [reglage, actionReglage, enReglage] = useActionState<ReponseEpreuve | null, FormData>(
    async (prec, form) => {
      const r = await actionReglerLEpreuve(prec, form)
      if (r.ok) await p.relire()
      return r
    }, null)
  // Contrôlés : React 19 réinitialise un formulaire après chaque action, refus compris.
  const [redaction, setRedaction] = useState(etat.redactionMin != null ? String(etat.redactionMin) : '')
  const [relecture, setRelecture] = useState(etat.relectureMin != null ? String(etat.relectureMin) : '')
  const [pratiques, setPratiques] = useState(etat.consignesPratiques ?? '')
  const [aConfirmer, setAConfirmer] = useState<Geste | null>(null)
  const [retour, setRetour] = useState<ReponseEpreuve | null>(null)
  const [enCours, demarrer] = useTransition()

  function jouer(geste: Geste | 'temps') {
    setRetour(null)
    demarrer(async () => {
      const r = geste === 'annuler' ? await actionAnnulerLeLancement(p.exerciceId)
        : geste === 'ouvrir' ? await actionOuvrirLeDepotMaintenant(p.exerciceId)
        : await actionAjouterDuTemps(p.exerciceId)
      setRetour(r)
      setAConfirmer(null)
      await p.relire()
    })
  }

  const QUESTION: Record<Geste, string> = {
    annuler: 'Annuler le lancement ? Le sujet disparaît des tablettes et le minuteur s’arrête.',
    ouvrir: 'Ouvrir le dépôt maintenant, avant l’heure prévue ? Il ne se referme pas.',
  }
  const BOUTON = 'min-h-11 rounded-lg px-4 py-2 font-ui text-sm disabled:opacity-50'
  const SECONDAIRE = `${BOUTON} border border-bordure-bouton bg-surface text-encre-douce hover:bg-parchemin-fonce`
  const CHAMP = 'rounded-md border border-bordure-bouton bg-parchemin px-2 py-1 font-ui text-sm text-encre'
  const ouvertLe = etat.compte.ouvertLe ? Date.parse(etat.compte.ouvertLe) : null

  return (
    <div className="mt-2 space-y-4 rounded-xl border border-bordure bg-surface-retrait p-4 sm:p-5">
      {!etat.passationActive && (
        <p className="rounded-lg border border-retard bg-retard-teinte px-3 py-2 font-ui text-sm text-encre">
          La passation en classe est fermée (<code>passation_classe_actif</code>) : les élèves ne voient
          rien de l’épreuve. Elle s’ouvre à <Link href="/prof/allumage" className="underline">l’allumage</Link>.
        </p>
      )}
      {p.statut !== 'assigne' && p.statut !== 'clos' && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          L’examen n’est pas encore assigné : sans assignation, aucun élève n’a de page.{' '}
          <Link href={`/prof/conception/${p.exerciceId}`} className="underline">L’assigner à la classe →</Link>
        </p>
      )}

      {lancee && frise && frise.debutMs != null && (
        <p className="font-ui text-sm text-encre-douce">
          Lancée à <strong className="text-encre">{p.heure(frise.debutMs)}</strong> ·{' '}
          {ouvertLe != null
            ? <>dépôt ouvert à <strong className="text-encre">{p.heure(ouvertLe)}</strong></>
            : <>le dépôt s’ouvrira tout seul à <strong className="text-encre">{p.heure(frise.ouvertureMs)}</strong></>}
          {' '}· rédaction {libelleDuree(etat.redactionMin ?? 0)}, relecture {libelleDuree(etat.relectureMin ?? 0)} ·{' '}
          {etat.compte.ouverts} dépôt{etat.compte.ouverts > 1 ? 's' : ''} ouvert{etat.compte.ouverts > 1 ? 's' : ''},{' '}
          {etat.compte.remis} copie{etat.compte.remis > 1 ? 's' : ''} validée{etat.compte.remis > 1 ? 's' : ''} sur {etat.compte.total}.
        </p>
      )}

      {/* Régler : les durées jusqu'au lancement, les consignes pratiques toujours. */}
      <form action={actionReglage} className="space-y-3">
        <input type="hidden" name="exercice_id" value={p.exerciceId} />
        {!lancee && (
          <div className="flex flex-wrap items-end gap-4">
            <label className="block space-y-0.5">
              <span className="block font-ui text-xs text-muet">rédaction (minutes)</span>
              <input type="number" name="redaction_min" inputMode="numeric" step={1} required
                min={BORNES_REDACTION.min} max={BORNES_REDACTION.max}
                value={redaction} onChange={(e) => setRedaction(e.target.value)} className={`${CHAMP} w-28`} />
            </label>
            <label className="block space-y-0.5">
              <span className="block font-ui text-xs text-muet">relecture (minutes)</span>
              <input type="number" name="relecture_min" inputMode="numeric" step={1} required
                min={BORNES_RELECTURE.min} max={BORNES_RELECTURE.max}
                value={relecture} onChange={(e) => setRelecture(e.target.value)} className={`${CHAMP} w-28`} />
            </label>
            <p className="font-ui text-xs text-muet">Le dépôt s’ouvrira tout seul à la moitié de la rédaction.</p>
          </div>
        )}
        <label className="block space-y-0.5">
          <span className="block font-ui text-xs text-muet">
            consignes pratiques — projetées et montrées à l’élève, jamais envoyées à la correction
          </span>
          <textarea name="consignes_pratiques" rows={3} maxLength={CONSIGNES_PRATIQUES_MAX}
            value={pratiques} onChange={(e) => setPratiques(e.target.value)} className={`${CHAMP} w-full`} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={enReglage} className={SECONDAIRE}>
            {enReglage ? '…' : 'Enregistrer'}
          </button>
          {reglage && (
            <span className={`font-ui text-sm ${reglage.ok ? 'text-ok' : 'text-retard'}`}>{reglage.message}</span>
          )}
        </div>
      </form>

      {/* Les gestes — ceux qui ne se défont pas se confirment en page. */}
      {lancee && (
        <div className="flex flex-wrap items-center gap-3 border-t border-bordure pt-4">
          <button type="button" disabled={enCours} onClick={() => jouer('temps')} className={SECONDAIRE}>
            + 5 min {frise?.phase === 'redaction' ? 'de rédaction' : 'de relecture'}
          </button>
          {etat.compte.ouverts === 0 && (
            <button type="button" disabled={enCours} onClick={() => setAConfirmer('annuler')} className={SECONDAIRE}>
              Annuler le lancement
            </button>
          )}
          {!p.depotOuvert && etat.compte.ouverts < etat.compte.total && (
            <button type="button" disabled={enCours} onClick={() => setAConfirmer('ouvrir')} className={SECONDAIRE}>
              Ouvrir le dépôt maintenant
            </button>
          )}
          {retour && (
            <span className={`font-ui text-sm ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</span>
          )}
        </div>
      )}

      {aConfirmer && (
        <div role="alertdialog" aria-live="assertive"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-attention bg-attention-teinte px-3 py-3">
          <p className="min-w-0 flex-1 font-ui text-sm text-encre">{QUESTION[aConfirmer]}</p>
          <button type="button" disabled={enCours} onClick={() => jouer(aConfirmer)}
            className={`${BOUTON} bg-bouton text-bouton-texte hover:opacity-90`}>
            {enCours ? '…' : 'Oui'}
          </button>
          <button type="button" disabled={enCours} onClick={() => setAConfirmer(null)} className={SECONDAIRE}>
            Non
          </button>
        </div>
      )}
    </div>
  )
}

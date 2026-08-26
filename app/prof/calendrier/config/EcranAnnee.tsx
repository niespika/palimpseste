'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatJour } from '@/utils/fuseau'
import { calerAnnee, type BornesAnnee } from '@/utils/calendrier-grille'
import {
  enregistrerAnnee,
  archiverAnnee,
  archiverSemestre,
  restaurerAnnee,
  supprimerAnnee,
  regenererSemaines,
  poserPremiereSemaineFragments,
} from './actions'
import ChampDate from './ChampDate'

// ── Contrat de données (rempli par config/page.tsx) ──────────────────────────

export interface SemestreAnnee {
  id: string
  name: string
  start_date: string
  end_date: string
  /** Actif ATTENDU à la date du jour (fonction pure) — pas la colonne `is_active`. */
  actif: boolean
  /** Aujourd'hui (fuseau de l'école) tombe dans ses bornes — ≠ « actif ». */
  enCours: boolean
  /** Semaines pédagogiques de la grille CALCULÉE (semestre + vacances). */
  totalSemaines: number
  /** Semaines réellement stockées dans `fragments_semaines` — ce que voit Fragments. */
  semainesGenerees: number
  /** Lignes stockées qui ne s'alignent plus sur aucune semaine de la grille. */
  horsCalendrier: number
  nbVacances: number
  semaineCourante: number
  termine: boolean
  /**
   * C8-L4 — première semaine pédagogique où Fragments réclame un fragment.
   * 1 = aucun décalage. Le S1 saute la présentation ET le choix des sujets ;
   * le S2 la seule semaine du changement de sujet.
   */
  premiereSemaine: number
}

export interface AnneeArchivee {
  ay: number
  libelle: string
  semestres: { id: string; name: string; start_date: string; end_date: string; totalSemaines: number }[]
}

const fmt = (d: string) => formatJour(d, { day: 'numeric', month: 'short', year: 'numeric' })
const fmtLong = (d: string) => formatJour(d, { weekday: 'long', day: 'numeric', month: 'long' })

// ── Carte d'un semestre (LECTURE seule : on change les dates de l'année) ─────
function CarteSemestre({
  s,
  rang,
  busy,
  onGenerer,
  onPremiereSemaine,
  onArchiver,
}: {
  s: SemestreAnnee
  rang: number
  busy: boolean
  onGenerer: () => void
  /** C8-L4 — pose la première semaine comptée par Fragments sur CE semestre. */
  onPremiereSemaine: (n: number) => void
  /** Uniquement dans la branche « trois semestres ou plus » : archiver un surnuméraire. */
  onArchiver?: () => void
}) {
  const pct = s.totalSemaines > 0 ? Math.round((s.semaineCourante / s.totalSemaines) * 100) : 0
  // L'état TEMPOREL prime sur le drapeau : `semestreActifAttendu` désigne aussi bien
  // un semestre pas encore commencé (règle 2) qu'un semestre déjà clos (règle 3), et
  // une pastille « actif » sur l'un des deux contredisait le rail de la même page
  // (« S1 à venir ») tout en affichant une barre de progression à 0 %.
  // « en cours » est calculé côté SERVEUR (page.tsx) : « aujourd'hui » se lit dans le
  // fuseau de l'école, jamais dans celui du navigateur de l'élève ou du prof.
  const enCours = s.enCours
  // Les semaines de Fragments sont des LIGNES en base, pas la grille affichée ici.
  // Tant qu'elles manquent, le module est muet et aucun élève ne peut déposer :
  // l'écart doit se voir, et se réparer d'un clic depuis cette carte.
  const aGenerer = s.semainesGenerees !== s.totalSemaines
  return (
    <div
      className={`bg-surface rounded-xl px-5 py-4 ${
        s.actif ? 'border-[1.5px] border-ok' : s.termine ? 'border border-bordure opacity-80' : 'border border-bordure'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="font-ui text-[11px] font-bold uppercase tracking-wide text-muet-clair">
          S{rang + 1}
        </span>
        <span className={`font-semibold text-encre ${enCours ? 'text-[17px]' : 'text-base'}`}>{s.name}</span>
        {s.termine ? (
          <span className="font-ui text-[11px] font-semibold uppercase tracking-wide text-muet bg-parchemin-fonce rounded-full px-2.5 py-0.5">
            terminé
          </span>
        ) : enCours ? (
          <span className="font-ui text-[11px] font-bold uppercase tracking-wide text-ok bg-ok-teinte rounded-full px-2.5 py-0.5">
            en cours
          </span>
        ) : (
          <span className="font-ui text-[11px] font-semibold uppercase tracking-wide text-encre-douce bg-parchemin-fonce rounded-full px-2.5 py-0.5">
            à venir
          </span>
        )}
        {onArchiver && (
          <button
            onClick={onArchiver}
            disabled={busy}
            className="ml-auto font-ui text-[13px] text-muet hover:text-encre underline disabled:opacity-50"
          >
            Archiver ce semestre
          </button>
        )}
      </div>

      {enCours && s.totalSemaines > 0 && (
        <div className="flex h-1.5 rounded-full overflow-hidden max-w-[440px] mt-2.5 bg-bordure">
          <div className="bg-ok" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="text-[13px] text-muet mt-1.5">
        {enCours && s.semaineCourante > 0 && `semaine ${s.semaineCourante} / ${s.totalSemaines} · `}
        {fmt(s.start_date)} → {fmt(s.end_date)}
        {!(enCours && s.semaineCourante > 0) &&
          ` · ${s.totalSemaines} semaine${s.totalSemaines > 1 ? 's' : ''}`}
        {s.nbVacances > 0 && ` · ${s.nbVacances} période${s.nbVacances > 1 ? 's' : ''} de vacances`}
      </div>

      {/* Le drapeau ne disparaît pas pour autant : c'est lui que lisent les autres
          modules. Il se dit en clair, à sa place, plutôt qu'en pastille trompeuse. */}
      {s.actif && !enCours && (
        <div className="italic text-[12.5px] text-muet-clair mt-1">
          Porte le drapeau actif — c’est ce semestre que lisent Fragments et Quazian.
        </div>
      )}

      {/* C8-L4 — Fragments ne réclame pas dès la première semaine : on présente le
          dispositif, puis chacun choisit son sujet. Les semaines d'avant ce numéro
          sortent du taux de dépôt, des « dépôts manquants » et du budget de charge —
          elles gardent en revanche leurs dépôts, leurs retours et leurs notes. */}
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <label
          htmlFor={`premsem-${s.id}`}
          className="font-ui text-[12.5px] text-muet"
        >
          Fragments compte à partir de la semaine
        </label>
        <select
          id={`premsem-${s.id}`}
          value={s.premiereSemaine}
          disabled={busy}
          onChange={(e) => onPremiereSemaine(Number(e.target.value))}
          className="font-ui text-[13px] text-encre bg-surface border border-bordure-bouton rounded-md px-2 py-1 disabled:opacity-50"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {s.premiereSemaine > 1 && (
          <span className="text-[12.5px] text-muet-clair italic">
            les {s.premiereSemaine - 1} première{s.premiereSemaine > 2 ? 's' : ''} semaine
            {s.premiereSemaine > 2 ? 's' : ''} ne {s.premiereSemaine > 2 ? 'sont' : 'est'} pas
            réclamée{s.premiereSemaine > 2 ? 's' : ''}
          </span>
        )}
      </div>

      {aGenerer && (
        <div className="flex items-center gap-2.5 flex-wrap mt-2">
          <span className="text-[12.5px] text-attention">
            {s.semainesGenerees === 0
              ? 'Aucune semaine générée — Fragments n’affichera rien et aucun élève ne pourra déposer.'
              : `${s.semainesGenerees} semaine${s.semainesGenerees > 1 ? 's' : ''} générée${s.semainesGenerees > 1 ? 's' : ''} sur ${s.totalSemaines} — les semaines de Fragments ne suivent plus le calendrier.`}
          </span>
          <button
            onClick={onGenerer}
            disabled={busy}
            className="font-ui text-[13px] font-semibold text-encre-douce bg-surface border border-puce rounded-lg px-3 py-1 whitespace-nowrap flex-none hover:bg-parchemin disabled:opacity-50"
          >
            Générer les semaines
          </button>
        </div>
      )}

      {/* P3 — les semaines « hors calendrier » étaient comptées, jamais montrées :
          elles ne vivaient que dans le message fugace du bouton de génération.
          Rien n'est supprimé (des dépôts peuvent y être rattachés) — mais le prof
          doit savoir qu'elles existent. Les réparer est hors périmètre. */}
      {s.horsCalendrier > 0 && (
        <div className="text-[12.5px] text-attention mt-2">
          {s.horsCalendrier} semaine{s.horsCalendrier > 1 ? 's' : ''} hors calendrier — stockée
          {s.horsCalendrier > 1 ? 's' : ''} sous ce semestre mais hors de ses dates. Conservée
          {s.horsCalendrier > 1 ? 's' : ''} telle{s.horsCalendrier > 1 ? 's' : ''} quelle
          {s.horsCalendrier > 1 ? 's' : ''} : d’éventuels dépôts y restent rattachés.
        </div>
      )}
    </div>
  )
}

// ── Confirmation EN PAGE — jamais `confirm()` ────────────────────────────────
// Le dialogue natif est muet dans tout environnement qui ne l'affiche pas (aperçu
// embarqué, « empêcher cette page de créer d'autres boîtes de dialogue ») : le
// bouton semble simplement mort. Patron `TableauLive.tsx` (commit 89625fc) : dire
// ce qui va partir, `catch` autour de l'action, erreur affichée en clair.
function Confirmation({
  titre,
  children,
  libelleAction,
  danger,
  pending,
  erreur,
  onConfirmer,
  onAnnuler,
}: {
  titre: string
  children: React.ReactNode
  libelleAction: string
  danger?: boolean
  pending: boolean
  erreur: string | null
  onConfirmer: () => void
  onAnnuler: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => !pending && onAnnuler()}
    >
      <div
        className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-serif text-encre">{titre}</h3>
        <div className="space-y-2 text-sm text-encre-douce">{children}</div>
        {erreur && <p className="text-sm text-retard">{erreur}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onAnnuler}
            disabled={pending}
            className="px-4 py-2 text-sm bg-parchemin-fonce text-encre-douce rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={pending}
            className={`px-4 py-2 text-sm rounded-lg text-surface hover:opacity-90 disabled:opacity-50 ${
              danger ? 'bg-retard' : 'bg-bouton'
            }`}
          >
            {pending ? '…' : libelleAction}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Écran ────────────────────────────────────────────────────────────────────

type Dialogue =
  | { type: 'enregistrer' }
  | { type: 'archiver' }
  | { type: 'supprimer' }
  | { type: 'restaurerArchive'; annee: AnneeArchivee }
  | { type: 'supprimerArchive'; annee: AnneeArchivee }
  | { type: 'archiverAutre'; annee: AnneeArchivee }

export default function EcranAnnee({
  libelleAnnee,
  semestres,
  archives,
  autresVivantes,
  nbDepotsAnnee,
  ay,
}: {
  libelleAnnee: string
  semestres: SemestreAnnee[]
  archives: AnneeArchivee[]
  /** Semestres vivants d'une AUTRE année scolaire — signalés, pas édités ici. */
  autresVivantes: AnneeArchivee[]
  nbDepotsAnnee: number
  ay: number
}) {
  const router = useRouter()
  const [ongletArchives, setOngletArchives] = useState(false)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)

  // ADOPTION (§5) : les trois dates se pré-remplissent depuis les semestres déjà en
  // base. 2 → les trois ; 1 → rentrée et fin du S1 (la fin d'année reste à saisir) ;
  // 0 → formulaire vide. Aucune ligne n'est créée ni supprimée au chargement.
  const [dates, setDates] = useState({
    rentree: semestres[0]?.start_date ?? '',
    finS1: semestres[0]?.end_date ?? '',
    finAnnee: semestres[1]?.end_date ?? '',
  })
  // Remonte les ChampDate après un enregistrement : ce qui est retenu (dates CALÉES)
  // n'est pas toujours ce qui a été saisi, et le champ doit dire la vérité.
  const [versionForm, setVersionForm] = useState(0)

  // Les PROPS font foi. Archiver, restaurer ou supprimer une année passe par
  // `router.refresh()`, qui renvoie de nouvelles bornes SANS remonter ce composant :
  // sans cette resynchronisation, le formulaire gardait les dates d'avant, le bouton
  // repassait à « Créer l'année », et un clic créait deux lignes en DOUBLON exact des
  // archivées — dépôts et semaines restant sur les anciens `id` (constat de revue
  // 20/08). La signature ne bouge que si les lignes de l'année ont bougé : la saisie
  // en cours n'est jamais effacée par un rafraîchissement pour une autre raison
  // (« Générer les semaines », par exemple).
  // Patron « ajuster l'état quand une prop change » (pendant le rendu, pas dans un
  // effet : pas de passe de rendu perdue, et pas de `set-state-in-effect`).
  const signature = semestres.map((s) => `${s.id}|${s.start_date}|${s.end_date}`).join('~')
  const [signaturePrec, setSignaturePrec] = useState(signature)
  if (signature !== signaturePrec) {
    setSignaturePrec(signature)
    setDates({
      rentree: semestres[0]?.start_date ?? '',
      finS1: semestres[0]?.end_date ?? '',
      finAnnee: semestres[1]?.end_date ?? '',
    })
    setVersionForm((v) => v + 1)
  }

  const trop = semestres.length > 2
  const complet = !!dates.rentree && !!dates.finS1 && !!dates.finAnnee
  const ordreOk = complet && dates.finS1 >= dates.rentree && dates.finAnnee >= dates.finS1
  const bornes: BornesAnnee | null = ordreOk
    ? calerAnnee(dates.rentree, dates.finS1, dates.finAnnee)
    : null

  function poser(champ: keyof typeof dates) {
    return (v: string) => {
      setDates((d) => ({ ...d, [champ]: v }))
      setMessage(null)
      setErreur(null)
    }
  }

  // Fail-visible : une action serveur qui LÈVE doit rendre la main et se dire,
  // sinon le bouton reste désactivé et l'écran paraît simplement mort.
  async function agir(fn: () => Promise<{ error?: string }>, succes?: string) {
    setBusy(true)
    setErreur(null)
    setMessage(null)
    try {
      const res = await fn()
      if (res.error) {
        setErreur(res.error)
        return false
      }
      setDialogue(null)
      if (succes) setMessage(succes)
      router.refresh()
      return true
    } catch {
      setErreur('Action impossible — recharge la page et réessaie.')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleEnregistrer() {
    setBusy(true)
    setErreur(null)
    setMessage(null)
    try {
      const res = await enregistrerAnnee(dates)
      if (res.error) {
        setErreur(res.error)
        return
      }
      const d = res.data!
      // Les dates RETENUES peuvent différer des dates saisies (calage sur la semaine).
      setDates({
        rentree: d.bornes.s1.start,
        finS1: d.bornes.s1.end,
        finAnnee: d.bornes.s2.end,
      })
      setVersionForm((v) => v + 1)
      setDialogue(null)
      const parts: string[] = []
      if (d.crees > 0) parts.push(`${d.crees} semestre${d.crees > 1 ? 's' : ''} créé${d.crees > 1 ? 's' : ''}`)
      if (d.misAJour > 0) parts.push(`${d.misAJour} mis à jour`)
      if (d.vacancesRattachees > 0) {
        parts.push(`${d.vacancesRattachees} période${d.vacancesRattachees > 1 ? 's' : ''} de vacances rattachée${d.vacancesRattachees > 1 ? 's' : ''} à l’autre semestre`)
      }
      if (d.vacancesSignalees > 0) {
        parts.push(`${d.vacancesSignalees} période${d.vacancesSignalees > 1 ? 's' : ''} de vacances désormais hors des dates de son semestre — à corriger dans « Vacances » (rien n’a été supprimé)`)
      }
      setMessage(`Année ${libelleAnnee} enregistrée : ${parts.join(', ')}.`)
      router.refresh()
    } catch {
      setErreur('Enregistrement impossible — recharge la page et réessaie.')
    } finally {
      setBusy(false)
    }
  }

  function demanderEnregistrement() {
    setErreur(null)
    setMessage(null)
    if (!ordreOk) {
      setErreur(
        !complet
          ? 'Renseigne les trois dates : rentrée, fin du 1er semestre, fin de l’année.'
          : dates.finS1 < dates.rentree
            ? 'La fin du 1er semestre doit suivre la rentrée.'
            : 'La fin de l’année doit suivre la fin du 1er semestre.'
      )
      return
    }
    // P4 — déplacer les bornes renumérote les semaines : un élève qui avait lu
    // « Semaine 7 » lira « Semaine 6 ». Sans conséquence sur les données (les
    // dépôts suivent par `semaine_id`), mais ça se dit AVANT, pas après.
    if (nbDepotsAnnee > 0) {
      setDialogue({ type: 'enregistrer' })
      return
    }
    handleEnregistrer()
  }

  const dejaCree = semestres.length > 0

  return (
    <div className="space-y-4">
      {/* Segmented control : année en cours / archives */}
      <div className="flex justify-end">
        <div className="inline-flex gap-[3px] border border-bordure-bouton rounded-[9px] p-[3px] bg-parchemin-fonce">
          <button
            type="button"
            onClick={() => setOngletArchives(false)}
            className={`font-ui text-[13px] px-3.5 py-1.5 rounded-md whitespace-nowrap ${
              !ongletArchives ? 'bg-surface border border-bordure-bouton text-encre font-bold' : 'text-muet font-medium'
            }`}
          >
            {libelleAnnee}
          </button>
          <button
            type="button"
            onClick={() => setOngletArchives(true)}
            className={`font-ui text-[13px] px-3.5 py-1.5 rounded-md whitespace-nowrap ${
              ongletArchives ? 'bg-surface border border-bordure-bouton text-encre font-bold' : 'text-muet font-medium'
            }`}
          >
            Archives · {archives.length}
          </button>
        </div>
      </div>

      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      {message && <p className="text-ok text-sm">{message}</p>}

      {ongletArchives ? (
        // ── Onglet Archives : la maille est l'ANNÉE ──
        archives.length === 0 ? (
          <p className="text-sm text-muet">Aucune année archivée.</p>
        ) : (
          <div className="space-y-5">
            {archives.map((a) => (
              <div key={a.ay}>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-muet-clair">
                    {a.libelle}
                  </span>
                  <button
                    onClick={() => { setErreur(null); setDialogue({ type: 'restaurerArchive', annee: a }) }}
                    disabled={busy}
                    className="font-ui text-[13px] text-muet hover:text-encre underline disabled:opacity-50"
                  >
                    Restaurer l’année
                  </button>
                  <button
                    onClick={() => { setErreur(null); setDialogue({ type: 'supprimerArchive', annee: a }) }}
                    disabled={busy}
                    className="font-ui text-[13px] text-retard hover:opacity-80 underline disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
                <div className="space-y-2">
                  {a.semestres.map((s) => (
                    <div key={s.id} className="bg-surface border border-bordure rounded-xl px-5 py-3.5">
                      <div className="font-semibold text-encre">{s.name}</div>
                      <div className="text-[13px] text-muet mt-0.5">
                        {fmt(s.start_date)} → {fmt(s.end_date)} · {s.totalSemaines} semaine
                        {s.totalSemaines > 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : trop ? (
        // ── Cas anormal : plus de deux semestres vivants pour l'année ──
        // On n'écrit RIEN tant qu'il n'est pas résolu : c'est silencieux si on ne
        // le regarde pas, et écrire à l'aveugle déplacerait le mauvais semestre.
        <div className="space-y-3">
          <div className="bg-attention-teinte border border-bordure rounded-xl px-[18px] py-3.5">
            <p className="text-[15px] text-encre-douce m-0">
              {semestres.length} semestres vivants pour l’année {libelleAnnee} — l’écran en attend
              deux au plus. Rien n’est enregistré tant que les surnuméraires ne sont pas archivés.
            </p>
          </div>
          {/* Un bouton PAR SEMESTRE : la spec demande d'archiver les SURNUMÉRAIRES.
              « Archiver toute l'année » emporterait aussi celui qui porte les dépôts —
              il reste offert, mais en second, et il se confirme. */}
          <div className="space-y-2.5">
            {semestres.map((s, i) => (
              <CarteSemestre
                key={s.id}
                s={s}
                rang={i}
                busy={busy}
                onGenerer={() => agir(() => regenererSemaines(s.id), 'Semaines générées.')}
                onPremiereSemaine={(n) =>
                  agir(
                    () => poserPremiereSemaineFragments(s.id, n),
                    n === 1
                      ? `« ${s.name} » : Fragments compte toutes les semaines.`
                      : `« ${s.name} » : Fragments compte à partir de la semaine ${n}.`,
                  )
                }
                onArchiver={() =>
                  agir(() => archiverSemestre(s.id), `« ${s.name} » archivé.`)
                }
              />
            ))}
          </div>
          <button
            onClick={() => { setErreur(null); setDialogue({ type: 'archiver' }) }}
            disabled={busy}
            className="font-ui text-[13px] text-muet hover:text-encre underline disabled:opacity-50"
          >
            Archiver toute l’année {libelleAnnee}
          </button>
        </div>
      ) : (
        // ── Onglet année en cours ──
        <>
          <div className="bg-surface border border-bordure rounded-xl p-4 space-y-3.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h4 className="text-[15px] font-semibold text-encre m-0">Année {libelleAnnee}</h4>
              <span className="italic text-[13px] text-muet-clair">
                trois dates — le 1er semestre va de la rentrée à sa fin, le second du lendemain à la
                fin de l’année
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muet mb-1">Rentrée</label>
                <ChampDate
                  key={`rentree-${versionForm}`}
                  name="rentree"
                  defaultValue={dates.rentree}
                  ariaLabel="Date de rentrée"
                  onChange={poser('rentree')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muet mb-1">Fin du 1er semestre</label>
                <ChampDate
                  key={`finS1-${versionForm}`}
                  name="finS1"
                  defaultValue={dates.finS1}
                  ariaLabel="Date de fin du premier semestre"
                  onChange={poser('finS1')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muet mb-1">Fin de l’année</label>
                <ChampDate
                  key={`finAnnee-${versionForm}`}
                  name="finAnnee"
                  defaultValue={dates.finAnnee}
                  ariaLabel="Date de fin de l’année"
                  onChange={poser('finAnnee')}
                />
              </div>
            </div>

            {/* §3 — l'app CALE les bornes sur la semaine calendaire, et MONTRE ce
                qu'elle a retenu, avant l'enregistrement : le décalage doit se voir. */}
            {bornes ? (
              <div className="bg-parchemin-fonce border border-bordure rounded-lg px-4 py-3">
                <div className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-muet-clair mb-1.5">
                  Ce qui sera retenu
                </div>
                <div className="text-[13.5px] text-encre-douce">
                  Semestre 1 : {fmtLong(bornes.s1.start)} → {fmtLong(bornes.s1.end)}
                </div>
                <div className="text-[13.5px] text-encre-douce">
                  Semestre 2 : {fmtLong(bornes.s2.start)} → {fmtLong(bornes.s2.end)}
                </div>
                <p className="italic text-[12.5px] text-muet-clair mt-1.5 mb-0">
                  Les bornes sont calées sur la semaine (lundi → dimanche) : une semaine à cheval
                  serait comptée dans les deux semestres.
                </p>
              </div>
            ) : (
              <p className="italic text-[13px] text-muet-clair m-0">
                Renseigne les trois dates : l’écran montrera d’abord ce qu’il retiendra.
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={demanderEnregistrement}
                disabled={busy}
                className="font-ui text-[15px] font-medium bg-bouton text-surface px-5 py-2.5 rounded-[10px] hover:opacity-90 disabled:opacity-50"
              >
                {busy ? '…' : dejaCree ? 'Enregistrer l’année' : 'Créer l’année'}
              </button>
              {dejaCree && (
                <>
                  <button
                    type="button"
                    onClick={() => { setErreur(null); setDialogue({ type: 'archiver' }) }}
                    disabled={busy}
                    className="ml-auto font-ui text-[13px] text-muet hover:text-encre underline disabled:opacity-50"
                  >
                    Archiver l’année
                  </button>
                  <button
                    type="button"
                    onClick={() => { setErreur(null); setDialogue({ type: 'supprimer' }) }}
                    disabled={busy}
                    className="font-ui text-[13px] text-retard hover:opacity-80 underline disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </>
              )}
            </div>
          </div>

          {autresVivantes.length > 0 && (
            <div className="bg-parchemin-fonce border border-bordure rounded-xl px-5 py-4 space-y-2.5">
              <div className="text-[14px] font-semibold text-encre">
                Encore vivant hors de {libelleAnnee}
              </div>
              <p className="text-[13px] text-muet m-0">
                Ces semestres appartiennent à une autre année scolaire. Cet écran ne les édite pas,
                mais ils comptent encore : dans le calcul du semestre actif, dans le sélecteur des
                vacances et dans le refus des chevauchements. Archive-les si l’année est finie —
                rien n’est détruit.
              </p>
              {autresVivantes.map((a) => (
                <div key={a.ay} className="flex items-center gap-3 flex-wrap">
                  <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-muet-clair">
                    {a.libelle}
                  </span>
                  <span className="text-[13px] text-encre-douce">
                    {a.semestres.map((s) => `${s.name} (${fmt(s.start_date)} → ${fmt(s.end_date)})`).join(' · ')}
                  </span>
                  <button
                    onClick={() => { setErreur(null); setDialogue({ type: 'archiverAutre', annee: a }) }}
                    disabled={busy}
                    className="ml-auto font-ui text-[13px] text-muet hover:text-encre underline disabled:opacity-50"
                  >
                    Archiver l’année {a.libelle}
                  </button>
                </div>
              ))}
            </div>
          )}

          {semestres.length === 0 ? (
            <p className="text-sm text-muet">
              Aucun semestre pour {libelleAnnee}. Saisis les trois dates ci-dessus.
            </p>
          ) : (
            <div className="space-y-2.5">
              {semestres.map((s, i) => (
                <CarteSemestre
                  key={s.id}
                  s={s}
                  rang={i}
                  busy={busy}
                  onGenerer={() => agir(() => regenererSemaines(s.id), 'Semaines générées.')}
                  onPremiereSemaine={(n) =>
                    agir(
                      () => poserPremiereSemaineFragments(s.id, n),
                      n === 1
                        ? `« ${s.name} » : Fragments compte toutes les semaines.`
                        : `« ${s.name} » : Fragments compte à partir de la semaine ${n}.`,
                    )
                  }
                />
              ))}
              <p className="italic text-[12.5px] text-muet-clair px-1 m-0">
                Les semestres ne s’éditent plus un à un — on change les dates de l’année.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Confirmations en page ── */}
      {dialogue?.type === 'enregistrer' && (
        <Confirmation
          titre="Enregistrer l’année ?"
          libelleAction="Enregistrer"
          pending={busy}
          erreur={erreur}
          onConfirmer={handleEnregistrer}
          onAnnuler={() => setDialogue(null)}
        >
          <p className="text-attention">
            L’année {libelleAnnee} porte déjà <strong>{nbDepotsAnnee} dépôt{nbDepotsAnnee > 1 ? 's' : ''}</strong>.
            Déplacer les bornes renumérote les semaines : un élève qui avait lu « Semaine 7 » pourra
            lire « Semaine 6 ».
          </p>
          <p className="text-muet">
            Aucun dépôt n’est perdu (ils suivent leur semaine), et aucune ligne n’est supprimée.
          </p>
          {bornes && (
            <p className="text-muet">
              Retenu : {fmtLong(bornes.s1.start)} → {fmtLong(bornes.s1.end)}, puis{' '}
              {fmtLong(bornes.s2.start)} → {fmtLong(bornes.s2.end)}.
            </p>
          )}
        </Confirmation>
      )}

      {(dialogue?.type === 'archiver' || dialogue?.type === 'archiverAutre') && (
        <Confirmation
          titre={
            dialogue.type === 'archiver'
              ? `Archiver l’année ${libelleAnnee} ?`
              : `Archiver l’année ${dialogue.annee.libelle} ?`
          }
          libelleAction="Archiver l’année"
          pending={busy}
          erreur={erreur}
          onConfirmer={() =>
            dialogue.type === 'archiver'
              ? agir(() => archiverAnnee(ay), `Année ${libelleAnnee} archivée.`)
              : agir(
                  () => archiverAnnee(dialogue.annee.ay),
                  `Année ${dialogue.annee.libelle} archivée.`
                )
          }
          onAnnuler={() => setDialogue(null)}
        >
          <p>
            {dialogue.type === 'archiver' ? semestres.length : dialogue.annee.semestres.length} semestre
            {(dialogue.type === 'archiver' ? semestres.length : dialogue.annee.semestres.length) > 1 ? 's' : ''} quitte
            {(dialogue.type === 'archiver' ? semestres.length : dialogue.annee.semestres.length) > 1 ? 'nt' : ''} les
            listes de l’app. <strong>Rien n’est détruit</strong> : dépôts, thèmes, synthèses, quizz et
            semaines restent en base, et l’année se restaure depuis l’onglet Archives.
          </p>
        </Confirmation>
      )}

      {(dialogue?.type === 'supprimer' || dialogue?.type === 'supprimerArchive') && (
        <Confirmation
          titre={
            dialogue.type === 'supprimer'
              ? `Supprimer définitivement l’année ${libelleAnnee} ?`
              : `Supprimer définitivement l’année ${dialogue.annee.libelle} ?`
          }
          libelleAction="Supprimer"
          danger
          pending={busy}
          erreur={erreur}
          onConfirmer={() =>
            dialogue.type === 'supprimer'
              ? agir(() => supprimerAnnee(ay, false), `Année ${libelleAnnee} supprimée.`)
              : agir(
                  () => supprimerAnnee(dialogue.annee.ay, true),
                  `Année ${dialogue.annee.libelle} supprimée.`
                )
          }
          onAnnuler={() => setDialogue(null)}
        >
          <p>
            Les deux semestres partent avec l’année, définitivement.{' '}
            <em>« Archiver » les masque sans les détruire — c’est presque toujours ce qu’il faut.</em>
          </p>
          <p className="text-muet">
            La suppression est <strong>refusée</strong> dès qu’un des deux semestres est utilisé par
            Fragments (semaines, thèmes, synthèses, essais) ou par Quazian (quizz, notes de semestre).
          </p>
        </Confirmation>
      )}

      {dialogue?.type === 'restaurerArchive' && (
        <Confirmation
          titre={`Restaurer l’année ${dialogue.annee.libelle} ?`}
          libelleAction="Restaurer"
          pending={busy}
          erreur={erreur}
          onConfirmer={() =>
            agir(
              () => restaurerAnnee(dialogue.annee.ay),
              `Année ${dialogue.annee.libelle} restaurée.`
            )
          }
          onAnnuler={() => setDialogue(null)}
        >
          <p>
            Ses {dialogue.annee.semestres.length} semestre
            {dialogue.annee.semestres.length > 1 ? 's' : ''} reviennent dans les listes de l’app.
            La restauration est refusée si leurs dates chevauchent une année vivante.
          </p>
        </Confirmation>
      )}
    </div>
  )
}

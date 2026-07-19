'use client'

import { useState } from 'react'
import Link from 'next/link'
import FormulaireParcours from './FormulaireParcours'
import ReglageQuiz from '../evaluations/ReglageQuiz'
import type { ParcoursListItem } from './donnees'
import type { ClasseAvecPlan } from '../evaluations/plan-serveur'
import type { ModeleListItem } from '../evaluations/modele-serveur'

// ─────────────────────────────────────────────────────────────────────────────
// Accueil de l'onglet « Parcours » (option 1f/1g). Deux mondes côte à côte —
// Parcours (fil noyer = --pigment) et Plans d'évaluation (fil ocre = --famille-eval).
// Chaque colonne : bouton créer (estompé), recherche, groupes repliables. Le
// chevron ⟨ / ⟩ replie une colonne en rail vertical ; l'autre récupère la largeur
// et étale ses listes sur 2 colonnes. Présentation seule : toutes les cibles
// pointent vers les vues existantes (?vue=parcours&parcours= / ?vue=modeles /
// ?vue=modeles&modele= / ?vue=evaluations&classe=). Aucune Server Action ici.
// ─────────────────────────────────────────────────────────────────────────────

const GABARIT_LABEL: Record<string, string> = { tc: 'TC', hlp: 'HLP', vierge: 'Vierge' }

function normalise(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Puce d'état ronde : pleine (ok) ou contour vide. */
function Puce({ actif }: { actif: boolean }) {
  return (
    <span
      className={`w-[7px] h-[7px] rounded-full flex-none ${actif ? 'bg-ok' : 'border border-puce'}`}
    />
  )
}

/** Ligne compacte d'un item (parcours / classe / modèle). */
function Ligne({
  href, nom, actif, meta, badge,
}: {
  href: string
  nom: string
  actif: boolean
  meta?: string
  badge?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3.5 py-2.5 border-b border-bordure last:border-b-0 hover:bg-parchemin/60 transition-colors"
    >
      <Puce actif={actif} />
      <span className="font-corps text-[15px] text-encre flex-1 min-w-0 truncate">{nom}</span>
      {badge}
      {meta && <span className="font-ui text-[13px] text-muet flex-none">{meta}</span>}
    </Link>
  )
}

/** En-tête de groupe repliable (▾ / ▸ + libellé + compteur). */
function EnteteGroupe({
  ouvert, onToggle, libelle, n, couleur,
}: {
  ouvert: boolean
  onToggle: () => void
  libelle: string
  n: number
  couleur: 'pigment' | 'famille-eval'
}) {
  const teinte = couleur === 'pigment' ? 'text-pigment' : 'text-famille-eval'
  if (ouvert) {
    return (
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 font-ui text-[11px] font-bold uppercase tracking-[0.1em] ${teinte}`}
      >
        <span>▾</span> {libelle} <span className="text-muet-clair font-medium normal-case tracking-normal">· {n}</span>
      </button>
    )
  }
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3.5 py-2.5 bg-parchemin rounded-lg font-ui text-[13px] font-medium text-muet hover:bg-parchemin-fonce transition-colors"
    >
      <span>▸</span> {libelle} <span className="text-muet-clair">· {n}</span>
    </button>
  )
}

/** Conteneur bordé des lignes. Sur colonne élargie → 2 colonnes (option 1g). */
function TableLignes({ enfants, deuxColonnes }: { enfants: React.ReactNode[]; deuxColonnes: boolean }) {
  if (enfants.length === 0) return null
  if (!deuxColonnes) {
    return <div className="border border-bordure rounded-xl overflow-hidden bg-white">{enfants}</div>
  }
  const moitie = Math.ceil(enfants.length / 2)
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="border border-bordure rounded-xl overflow-hidden bg-white">{enfants.slice(0, moitie)}</div>
      <div className="border border-bordure rounded-xl overflow-hidden bg-white">{enfants.slice(moitie)}</div>
    </div>
  )
}

/** Rail vertical d'une colonne repliée : fond = bouton estompé du monde, texte
 *  vertical (lettres droites empilées), contenu centré. Clic pour rouvrir. */
function Rail({
  libelle, n, couleur, onClick,
}: {
  libelle: string
  n: number
  couleur: 'pigment' | 'famille-eval'
  onClick: () => void
}) {
  const estParcours = couleur === 'pigment'
  const fond = estParcours ? 'bg-bouton-parcours text-bouton-parcours-texte' : 'bg-bouton-plan text-bouton-plan-texte'
  const chevron = estParcours ? '⟩' : '⟨'
  return (
    <button
      onClick={onClick}
      title="Déplier la colonne"
      className={`w-14 flex-none self-stretch rounded-xl flex flex-col items-center justify-center gap-4 py-5 hover:opacity-90 transition-opacity ${fond}`}
    >
      <span className="text-[15px]">{chevron}</span>
      <span
        className="font-ui text-[12px] font-bold uppercase tracking-[0.16em]"
        style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
      >
        ◆ {libelle} · {n}
      </span>
    </button>
  )
}

type Replie = 'parcours' | 'plans' | null
type Facette = 'classes' | 'modeles'

export default function AccueilParcoursPlans({
  parcours, classesPlan, modeles, planEvalActif, quizAnnonce,
}: {
  parcours: ParcoursListItem[]
  classesPlan: ClasseAvecPlan[]
  modeles: ModeleListItem[]
  planEvalActif: boolean
  quizAnnonce: boolean
}) {
  const [replie, setReplie] = useState<Replie>(null)
  const [facette, setFacette] = useState<Facette>('classes')
  const [qParcours, setQParcours] = useState('')
  const [qPlans, setQPlans] = useState('')
  // Groupes : Assignés / Validés ouverts par défaut ; le reste replié.
  const [grpAssignes, setGrpAssignes] = useState(true)
  const [grpSansClasse, setGrpSansClasse] = useState(false)
  const [grpValides, setGrpValides] = useState(true)
  const [grpBrouillons, setGrpBrouillons] = useState(false)
  const [grpSansPlan, setGrpSansPlan] = useState(false)
  const [grpModPrets, setGrpModPrets] = useState(true)
  const [grpModBrouillons, setGrpModBrouillons] = useState(false)

  const fp = (s: string) => normalise(s).includes(normalise(qParcours))
  const assignes = parcours.filter(p => p.nbClasses > 0 && fp(p.titre))
  const sansClasse = parcours.filter(p => p.nbClasses === 0 && fp(p.titre))

  const fq = (s: string) => normalise(s).includes(normalise(qPlans))
  const valides = classesPlan.filter(c => c.plan?.statut === 'valide' && fq(c.nom))
  const brouillons = classesPlan.filter(c => c.plan?.statut === 'brouillon' && fq(c.nom))
  const sansPlan = classesPlan.filter(c => !c.plan && fq(c.nom))
  const modPrets = modeles.filter(m => m.statut === 'pret' && fq(m.titre))
  const modBrouillons = modeles.filter(m => m.statut === 'brouillon' && fq(m.titre))

  const large = replie !== null // une colonne est élargie → listes sur 2 colonnes

  // ── Colonne Parcours ──────────────────────────────────────────────────────
  const colonneParcours = (
    <div className="bg-surface border border-bordure border-t-[3px] border-t-pigment rounded-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-bordure">
        <span className="font-titre text-[20px] font-bold text-pigment flex-1">
          ◆ Parcours <span className="font-ui text-[13px] font-medium text-muet-clair">· {parcours.length}</span>
        </span>
        <button
          onClick={() => setReplie(replie === 'parcours' ? null : 'parcours')}
          title="Replier la colonne"
          className="text-[13px] text-muet-clair border-l border-bordure pl-2.5 hover:text-encre"
        >
          ⟨
        </button>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-3">
        <FormulaireParcours triggerClassName="w-full bg-bouton-parcours text-bouton-parcours-texte py-2.5 rounded-xl font-ui text-sm font-semibold text-center hover:opacity-90 transition-opacity" triggerLabel="＋ Nouveau parcours" />
        <input
          value={qParcours}
          onChange={e => setQParcours(e.target.value)}
          placeholder="Rechercher un parcours…"
          className="border border-bordure-bouton rounded-lg px-3.5 py-2 font-corps text-sm text-encre placeholder:text-muet-clair placeholder:italic bg-white focus:outline-none focus:ring-2 focus:ring-pigment"
        />
        <EnteteGroupe ouvert={grpAssignes} onToggle={() => setGrpAssignes(v => !v)} libelle="Assignés" n={assignes.length} couleur="pigment" />
        {grpAssignes && (
          <TableLignes deuxColonnes={large} enfants={assignes.map(p => (
            <Ligne
              key={p.id}
              href={`/prof/scriptorium?vue=parcours&parcours=${p.id}`}
              nom={p.titre}
              actif
              meta={`${p.nbSemaines} sem · ${p.nbClasses} cl.`}
            />
          ))} />
        )}
        {grpAssignes && assignes.length === 0 && (
          <p className="font-corps text-[13px] text-muet-clair italic px-1">Aucun parcours assigné.</p>
        )}
        <EnteteGroupe ouvert={grpSansClasse} onToggle={() => setGrpSansClasse(v => !v)} libelle="Sans classe" n={sansClasse.length} couleur="pigment" />
        {grpSansClasse && (
          <TableLignes deuxColonnes={large} enfants={sansClasse.map(p => (
            <Ligne
              key={p.id}
              href={`/prof/scriptorium?vue=parcours&parcours=${p.id}`}
              nom={p.titre}
              actif={false}
              meta={`${p.nbSemaines} sem`}
            />
          ))} />
        )}
      </div>
    </div>
  )

  // ── Colonne Plans d'évaluation ────────────────────────────────────────────
  const segment = (
    <span className="inline-flex border border-bordure-bouton rounded-lg overflow-hidden font-ui text-[12px] font-medium">
      <button
        onClick={() => setFacette('classes')}
        className={`px-2.5 py-1.5 ${facette === 'classes' ? 'bg-bouton-plan text-bouton-plan-texte font-semibold' : 'text-muet hover:text-encre'}`}
      >
        Par classe
      </button>
      <button
        onClick={() => setFacette('modeles')}
        className={`px-2.5 py-1.5 ${facette === 'modeles' ? 'bg-bouton-plan text-bouton-plan-texte font-semibold' : 'text-muet hover:text-encre'}`}
      >
        Modèles
      </button>
    </span>
  )

  const badgeStatut = (texte: string, ton: 'ok' | 'attention') => (
    <span
      className={`font-ui text-[11px] font-semibold uppercase tracking-[0.04em] rounded-full px-2.5 py-0.5 ${ton === 'ok' ? 'bg-ok-teinte text-ok' : 'bg-attention-teinte text-attention'}`}
    >
      {texte}
    </span>
  )

  const colonnePlans = (
    <div className="bg-surface border border-bordure border-t-[3px] border-t-famille-eval rounded-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-bordure">
        <span className="font-titre text-[20px] font-bold text-famille-eval flex-1">◆ Plans d'évaluation</span>
        {segment}
        <button
          onClick={() => setReplie(replie === 'plans' ? null : 'plans')}
          title="Replier la colonne"
          className="text-[13px] text-muet-clair border-l border-bordure pl-2.5 hover:text-encre"
        >
          ⟩
        </button>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-3">
        <Link
          href="/prof/scriptorium?vue=modeles"
          className="w-full bg-bouton-plan text-bouton-plan-texte py-2.5 rounded-xl font-ui text-sm font-semibold text-center hover:opacity-90 transition-opacity"
        >
          ＋ Nouveau plan d'évaluation
        </Link>
        <input
          value={qPlans}
          onChange={e => setQPlans(e.target.value)}
          placeholder={facette === 'classes' ? 'Rechercher une classe…' : 'Rechercher un modèle…'}
          className="border border-bordure-bouton rounded-lg px-3.5 py-2 font-corps text-sm text-encre placeholder:text-muet-clair placeholder:italic bg-white focus:outline-none focus:ring-2 focus:ring-famille-eval"
        />

        {facette === 'classes' ? (
          <>
            <EnteteGroupe ouvert={grpValides} onToggle={() => setGrpValides(v => !v)} libelle="Validés" n={valides.length} couleur="famille-eval" />
            {grpValides && (
              <TableLignes deuxColonnes={large} enfants={valides.map(c => (
                <Ligne key={c.classeId} href={`/prof/scriptorium?vue=evaluations&classe=${c.classeId}`} nom={c.nom} actif badge={badgeStatut('validé', 'ok')} />
              ))} />
            )}
            <EnteteGroupe ouvert={grpBrouillons} onToggle={() => setGrpBrouillons(v => !v)} libelle="Brouillons" n={brouillons.length} couleur="famille-eval" />
            {grpBrouillons && (
              <TableLignes deuxColonnes={large} enfants={brouillons.map(c => (
                <Ligne key={c.classeId} href={`/prof/scriptorium?vue=evaluations&classe=${c.classeId}`} nom={c.nom} actif={false} badge={badgeStatut('brouillon', 'attention')} />
              ))} />
            )}
            <EnteteGroupe ouvert={grpSansPlan} onToggle={() => setGrpSansPlan(v => !v)} libelle="Sans plan" n={sansPlan.length} couleur="famille-eval" />
            {grpSansPlan && (
              <TableLignes deuxColonnes={large} enfants={sansPlan.map(c => (
                <Ligne key={c.classeId} href={`/prof/scriptorium?vue=evaluations&classe=${c.classeId}`} nom={c.nom} actif={false} meta="aucun plan" />
              ))} />
            )}
          </>
        ) : (
          <>
            <EnteteGroupe ouvert={grpModPrets} onToggle={() => setGrpModPrets(v => !v)} libelle="Prêts" n={modPrets.length} couleur="famille-eval" />
            {grpModPrets && (
              <TableLignes deuxColonnes={large} enfants={modPrets.map(m => (
                <Ligne key={m.id} href={`/prof/scriptorium?vue=modeles&modele=${m.id}`} nom={m.titre} actif meta={`${GABARIT_LABEL[m.gabarit] ?? m.gabarit} · ${m.nbExercices} exo`} />
              ))} />
            )}
            <EnteteGroupe ouvert={grpModBrouillons} onToggle={() => setGrpModBrouillons(v => !v)} libelle="Brouillons" n={modBrouillons.length} couleur="famille-eval" />
            {grpModBrouillons && (
              <TableLignes deuxColonnes={large} enfants={modBrouillons.map(m => (
                <Ligne key={m.id} href={`/prof/scriptorium?vue=modeles&modele=${m.id}`} nom={m.titre} actif={false} meta={`${GABARIT_LABEL[m.gabarit] ?? m.gabarit} · ${m.nbExercices} exo`} />
              ))} />
            )}
          </>
        )}

        {/* Réglage global du monde Plans (quiz annoncés / surprise au calendrier élève). */}
        <div className="border-t border-bordure pt-3 mt-1">
          <ReglageQuiz actif={quizAnnonce} />
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="font-titre text-[32px] font-semibold text-encre tracking-[0.01em]">Parcours &amp; plans d'évaluation</h1>
        <p className="font-corps italic text-[16px] text-muet mt-1.5">
          Orchestrer l'année d'une classe : ce qu'on enseigne — et ce qu'on évalue.
        </p>
      </div>

      {/* Gate ON → deux mondes. Gate OFF → Parcours seul (invariant no-op). */}
      {!planEvalActif ? (
        colonneParcours
      ) : replie === null ? (
        <div className="grid grid-cols-2 gap-[22px] items-start">
          {colonneParcours}
          {colonnePlans}
        </div>
      ) : replie === 'plans' ? (
        <div className="flex gap-3.5 items-start">
          <div className="flex-1 min-w-0">{colonneParcours}</div>
          <Rail libelle="Plans" n={classesPlan.length} couleur="famille-eval" onClick={() => setReplie(null)} />
        </div>
      ) : (
        <div className="flex gap-3.5 items-start">
          <Rail libelle="Parcours" n={parcours.length} couleur="pigment" onClick={() => setReplie(null)} />
          <div className="flex-1 min-w-0">{colonnePlans}</div>
        </div>
      )}
    </div>
  )
}

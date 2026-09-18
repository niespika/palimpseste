import Link from 'next/link'
import type { PlanEleve, ParcoursPlan } from '@/utils/scriptorium-plan-eleve'
import { pistesDuRail, segmentsDe } from '@/utils/scriptorium-plan-eleve'

// VUE ANNÉE du plan de cours élève (handoff plan_cours_eleve, écrans 1a · 1b · 1c) :
// un rail des N semaines d'enseignement (une piste par parcours qui se chevauche) et
// une carte par parcours, en trois colonnes En cours · À venir · Terminés. Le rail est
// purement présentatif (`aria-hidden`) — l'information est dans les cartes.
//
// `compact` : la même vue resserrée dans la colonne de gauche quand le volet d'un
// parcours est ouvert (écran 1b) — rail de 10 px sans libellés, cartes en une colonne,
// la carte ouverte marquée « ouvert › ».
//
// ⚠️ Éprouvé contre la base (18/09) : un parcours peut ALTERNER avec un autre — sa barre
// est une suite de SEGMENTS (utils/scriptorium-plan-eleve.ts). Une semaine porte 3 à
// 25 éléments : la carte « en cours » montre les CRÉNEAUX (1-2 par semaine), pas les
// éléments. Aucun parcours « non dévoilé » n'existe en base (titre NOT NULL) : le
// rendu `titre: null` (barre hachurée, carte « m autres parcours ») est prêt mais
// jamais emprunté aujourd'hui.
//
// Rendu seul : aucune logique d'état, aucune Server Action.

const ENCRE_META = '#6E5A3E' // méta, dates, libellés « à venir »
const OCRE_AA = '#8A6023'    // texte ocre (AA sur parchemin)

export const hrefParcours = (id: string) => `/eleve/modules/scriptorium?vue=plan&parcours=${encodeURIComponent(id)}`

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`
const bornes = (p: ParcoursPlan) => p.semaineDebut > 0 ? `S${p.semaineDebut} → S${p.semaineFin}` : 'dates à définir'

// ── Le rail ──────────────────────────────────────────────────────────────────

function Rail({ plan, compact, ouvertId }: { plan: PlanEleve; compact: boolean; ouvertId: string | null }) {
  const { annee, parcours } = plan
  const nb = annee.nbSemaines
  if (nb === 0) return null
  const pistes = pistesDuRail(parcours)
  const nbPistes = Math.max(1, ...pistes.map(p => p + 1))
  const colonnes = { gridTemplateColumns: `repeat(${nb}, minmax(0, 1fr))` }
  const hauteur = compact ? 10 : 22
  const gauche = annee.semaineCourante > 0 ? `${((annee.semaineCourante - 0.5) / nb) * 100}%` : null

  return (
    <div aria-hidden className="select-none">
      {/* repères S1 · S5 · … (bureau seulement) */}
      {!compact && (
        <div className="grid font-ui text-[10.5px] font-semibold tracking-[.04em] text-muet-clair mb-1" style={colonnes}>
          {annee.reperes.map(k => (
            <span key={k} style={{ gridColumn: `${k} / span 1` }} className="whitespace-nowrap">S{k}</span>
          ))}
        </div>
      )}

      {/* pistes */}
      <div className="relative">
        <div className="grid gap-y-[3px]" style={{ ...colonnes, gridAutoRows: `${hauteur}px` }}>
          {/* fond : une cellule par semaine */}
          {Array.from({ length: nb }, (_, i) => (
            <span
              key={`f${i}`}
              className="bg-parchemin-fonce/60 rounded-[2px]"
              style={{ gridColumn: `${i + 1} / span 1`, gridRow: `1 / span ${nbPistes}` }}
            />
          ))}
          {parcours.map((p, i) => {
            const piste = pistes[i]
            if (piste < 0) return null
            const ouvert = p.id === ouvertId
            const segments = segmentsDe(p.semainesAnnee)
            // Le libellé va sur le segment le plus LONG (un parcours qui alterne commence
            // souvent par une semaine seule, où rien ne tient) ; caché sous sm (écran 1c).
            const jLibelle = segments.reduce((best, seg, j) => (seg[1] - seg[0] > segments[best][1] - segments[best][0] ? j : best), 0)
            // Une semaine seule ne porte aucun titre (« re… » n'apprend rien) : la carte le dit.
            const porteLibelle = segments.length > 0 && segments[jLibelle][1] > segments[jLibelle][0]
            return segments.map(([d, f], j) => {
              let classe = 'rounded-[3px] px-1.5 overflow-hidden flex items-center min-w-0 '
              let style: React.CSSProperties = {}
              if (ouvert) {
                classe += 'bg-attention text-bouton-plan-texte'
              } else if (p.titre == null) {
                classe += 'border border-dashed border-bordure'
                style = { background: 'repeating-linear-gradient(135deg, var(--parchemin-fonce) 0 4px, var(--surface) 4px 8px)' }
              } else if (p.etat === 'termine') {
                classe += 'bg-ok-teinte text-ok'
              } else if (p.etat === 'en_cours') {
                classe += 'bg-attention-teinte'
                style = { color: OCRE_AA }
              } else {
                classe += 'border border-dashed border-puce italic'
                style = { color: ENCRE_META }
              }
              return (
                <span key={`${p.id}-${j}`} className={classe} style={{ ...style, gridColumn: `${d} / ${f + 1}`, gridRow: `${piste + 1} / span 1` }}>
                  {!compact && porteLibelle && j === jLibelle && p.titre != null && (
                    <span className="hidden sm:inline font-ui text-[11.5px] font-semibold truncate leading-none">
                      {p.etat === 'termine' ? '✓ ' : ''}{p.titre}
                    </span>
                  )}
                </span>
              )
            })
          })}
        </div>
        {/* trait « aujourd'hui » au milieu de la semaine courante */}
        {gauche && (
          <span
            className="absolute -top-1 -bottom-1 w-[2px] bg-attention"
            style={{ left: gauche, transform: 'translateX(-50%)' }}
          >
            {!compact && (
              <span className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 font-ui text-[10px] font-semibold whitespace-nowrap" style={{ color: OCRE_AA }}>
                aujourd’hui
              </span>
            )}
          </span>
        )}
      </div>

      {/* mois — EB Garamond italique */}
      <div className={`grid font-corps italic text-muet-clair ${compact ? 'text-[11px] mt-1' : 'text-[12.5px] mt-5'}`} style={colonnes}>
        {annee.mois.map(m => (
          <span key={m.semaine} style={{ gridColumn: `${m.semaine} / span 1` }} className="whitespace-nowrap">
            {compact ? m.court : m.libelle}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Les cartes ───────────────────────────────────────────────────────────────

function TitreColonne({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-ui text-[11px] font-bold uppercase tracking-[.09em] text-muet-clair m-0 mb-2.5">
      {children}
    </h3>
  )
}

function BarreSegments({ p }: { p: ParcoursPlan }) {
  return (
    <div className="flex gap-[3px] mt-2.5" aria-hidden>
      {Array.from({ length: p.nbSemaines }, (_, i) => i + 1).map(k => (
        <span
          key={k}
          className={`h-[5px] flex-1 rounded-[2px] ${k < p.semaineCourante ? 'bg-ok' : k === p.semaineCourante ? 'bg-attention' : 'bg-parchemin-fonce'}`}
        />
      ))}
    </div>
  )
}

function CarteEnCours({ p, compact, ouvert }: { p: ParcoursPlan; compact: boolean; ouvert: boolean }) {
  const semaine = p.semaines.find(s => s.courante)
  const groupes = semaine?.groupes ?? []
  const bord = ouvert ? 'border-attention' : 'border-attention/40'
  return (
    <article className={`rounded-[10px] border ${bord} border-l-[3px] border-l-attention bg-attention-teinte/40 shadow-[0_4px_16px_rgba(154,106,46,0.12)] ${compact ? 'px-3.5 py-3' : 'px-4 pt-3.5 pb-3.5'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className={`font-titre font-semibold text-encre m-0 leading-tight ${compact ? 'text-[17px]' : 'text-[19px]'}`}>
          <Link href={hrefParcours(p.id)} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm">
            {p.titre}
          </Link>
        </h4>
        {ouvert && <span className="font-ui text-[12px] font-semibold whitespace-nowrap" style={{ color: OCRE_AA }}>ouvert ›</span>}
      </div>
      <p className="font-ui text-[13px] mt-1 m-0" style={{ color: ENCRE_META }}>
        {!compact && <>{bornes(p)} · </>}
        semaine <strong className="font-semibold" style={{ color: OCRE_AA }}>{p.semaineCourante}</strong> sur {p.nbSemaines}
        {p.reprise && <> · reprend le {p.reprise}</>}
      </p>
      {!compact && <BarreSegments p={p} />}
      {!compact && groupes.length > 0 && (
        <p className="font-corps text-[15px] text-encre font-medium mt-3 m-0 flex items-baseline gap-2 min-w-0">
          <span aria-hidden className="font-ui text-[15px] flex-none" style={{ color: OCRE_AA }}>●</span>
          <span className="truncate min-w-0" title={groupes.join(' · ')}>{groupes.join(' · ')}</span>
        </p>
      )}
      {!compact && semaine && (
        <p className="font-corps text-[13px] italic mt-1 m-0 pl-[22px]" style={{ color: ENCRE_META }}>
          {pluriel(semaine.elements.length, 'élément')} cette semaine
        </p>
      )}
      {!compact && (
        <p className="mt-3 m-0">
          <Link
            href={hrefParcours(p.id)}
            className="font-ui text-[13px] font-semibold text-bouton-parcours hover:text-encre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm"
          >
            Ouvrir le parcours →
          </Link>
        </p>
      )}
    </article>
  )
}

function CarteAVenir({ p, compact, ouvert }: { p: ParcoursPlan; compact: boolean; ouvert: boolean }) {
  return (
    <article className={`rounded-[10px] border border-dashed ${ouvert ? 'border-attention' : 'border-bordure-bouton'} bg-surface ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className={`font-titre italic font-medium text-encre m-0 leading-tight ${compact ? 'text-[16px]' : 'text-[18px]'}`}>
          <Link href={hrefParcours(p.id)} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm">
            {p.titre}
          </Link>
        </h4>
        {ouvert && <span className="font-ui text-[12px] font-semibold whitespace-nowrap" style={{ color: OCRE_AA }}>ouvert ›</span>}
      </div>
      <p className="font-ui text-[13px] mt-1 m-0" style={{ color: ENCRE_META }}>
        {compact
          ? (p.lundiDebut ? `dès le ${p.lundiDebut}` : bornes(p))
          : <>{bornes(p)}{p.lundiDebut ? ` · commence lundi ${p.lundiDebut}` : ''}</>}
      </p>
    </article>
  )
}

function CarteSansTitre({ n, debut, fin, compact }: { n: number; debut: number; fin: number; compact: boolean }) {
  return (
    <article
      className={`rounded-[10px] border border-dashed border-bordure ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'}`}
      style={{ background: 'repeating-linear-gradient(135deg, var(--parchemin-fonce) 0 4px, var(--surface) 4px 8px)' }}
    >
      <p className="font-corps text-[14px] italic m-0" style={{ color: ENCRE_META }}>
        {compact
          ? `${n} autre${n > 1 ? 's' : ''} parcours jusqu’en fin d’année`
          : `${n} autre${n > 1 ? 's' : ''} parcours, de S${debut} à S${fin} — leurs titres seront dévoilés par ton professeur le moment venu.`}
      </p>
    </article>
  )
}

function CarteTerminee({ p, compact, ouvert }: { p: ParcoursPlan; compact: boolean; ouvert: boolean }) {
  return (
    <article className={`rounded-[10px] border ${ouvert ? 'border-attention' : 'border-bordure'} bg-surface-retrait ${compact ? 'px-3.5 py-2' : 'px-4 py-2.5'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className={`font-titre font-medium text-encre m-0 leading-tight flex items-baseline gap-2 ${compact ? 'text-[16px]' : 'text-[17px]'}`}>
          <span aria-hidden className="font-ui text-[14px] text-ok flex-none">✓</span>
          <Link href={hrefParcours(p.id)} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm">
            {p.titre}
          </Link>
        </h4>
        {ouvert && <span className="font-ui text-[12px] font-semibold whitespace-nowrap" style={{ color: OCRE_AA }}>ouvert ›</span>}
      </div>
      {!compact && (
        <p className="font-ui text-[12.5px] mt-0.5 m-0" style={{ color: ENCRE_META }}>
          {bornes(p)} · {pluriel(p.nbElementsVus, 'élément')} vu{p.nbElementsVus > 1 ? 's' : ''} ·{' '}
          <Link href={hrefParcours(p.id)} className="font-semibold text-bouton-parcours hover:text-encre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm">
            revoir →
          </Link>
        </p>
      )}
    </article>
  )
}

// ── La vue ───────────────────────────────────────────────────────────────────

function LegendeAnnee() {
  return (
    <div className="flex items-center gap-4 font-ui text-[12.5px] font-medium">
      <span className="flex items-center gap-1.5 text-ok"><span className="w-3 h-2 rounded-[2px] bg-ok-teinte border border-ok/30" />terminé</span>
      <span className="flex items-center gap-1.5" style={{ color: OCRE_AA }}><span className="w-3 h-2 rounded-[2px] bg-attention-teinte border border-attention/30" />en cours</span>
      <span className="flex items-center gap-1.5" style={{ color: ENCRE_META }}><span className="w-3 h-2 rounded-[2px] border border-dashed border-puce" />à venir</span>
    </div>
  )
}

export default function VueAnnee({ plan, compact = false, ouvertId = null }: { plan: PlanEleve; compact?: boolean; ouvertId?: string | null }) {
  const { annee, parcours } = plan
  const enCours = parcours.filter(p => p.etat === 'en_cours')
  const aVenir = parcours.filter(p => p.etat === 'a_venir' && p.titre != null)
  const sansTitre = parcours.filter(p => p.etat === 'a_venir' && p.titre == null)
  const termines = parcours.filter(p => p.etat === 'termine')
  const ouverts = enCours.length
  const debutSansTitre = Math.min(...sansTitre.map(p => p.semaineDebut).filter(s => s > 0))
  const finSansTitre = Math.max(...sansTitre.map(p => p.semaineFin))

  return (
    <section className={compact ? 'space-y-4' : 'space-y-6'}>
      {/* en-tête */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h2 className={`font-titre font-semibold text-encre m-0 ${compact ? 'text-[22px]' : 'text-[26px]'}`}>Année {annee.libelle}</h2>
          {compact ? (
            <p className="font-ui text-[13px] mt-0.5 m-0" style={{ color: ENCRE_META }}>
              {annee.semaineCourante > 0 ? `S${annee.semaineCourante} / ${annee.nbSemaines}` : `${annee.nbSemaines} semaines`}
              {annee.lundiCourant ? ` · ${annee.lundiCourant}` : ''}
            </p>
          ) : (
            <p className="font-corps text-[15px] mt-1 m-0" style={{ color: ENCRE_META }}>
              {pluriel(annee.nbSemaines, 'semaine')}
              {annee.semaineCourante > 0 ? (
                <> · nous sommes en <strong className="font-semibold" style={{ color: OCRE_AA }}>semaine {annee.semaineCourante}</strong>{annee.lundiCourant ? `, ${annee.lundiCourant}` : ''}</>
              ) : (
                <> · l’année n’a pas encore commencé</>
              )}
              {' · '}{ouverts} parcours ouvert{ouverts > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {!compact && <LegendeAnnee />}
      </div>

      <Rail plan={plan} compact={compact} ouvertId={ouvertId} />

      {/* cartes : trois colonnes en bureau (1.25fr 1fr 1fr), une colonne sous md et en compact */}
      <div className={compact ? 'space-y-4' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr]'}>
        <div className="min-w-0">
          <TitreColonne>En cours · {enCours.length}</TitreColonne>
          <div className={compact ? 'space-y-2' : 'space-y-3'}>
            {enCours.map(p => <CarteEnCours key={p.id} p={p} compact={compact} ouvert={p.id === ouvertId} />)}
            {enCours.length === 0 && <p className="font-corps text-[14px] italic m-0" style={{ color: ENCRE_META }}>Aucun parcours en cours.</p>}
          </div>
        </div>
        <div className="min-w-0">
          <TitreColonne>À venir · {aVenir.length}{sansTitre.length > 0 ? ` + ${sansTitre.length}` : ''}</TitreColonne>
          <div className={compact ? 'space-y-2' : 'space-y-3'}>
            {aVenir.map(p => <CarteAVenir key={p.id} p={p} compact={compact} ouvert={p.id === ouvertId} />)}
            {sansTitre.length > 0 && <CarteSansTitre n={sansTitre.length} debut={debutSansTitre} fin={finSansTitre} compact={compact} />}
            {aVenir.length + sansTitre.length === 0 && <p className="font-corps text-[14px] italic m-0" style={{ color: ENCRE_META }}>Rien d’annoncé pour l’instant.</p>}
          </div>
        </div>
        <div className="min-w-0">
          <TitreColonne>Terminés · {termines.length}</TitreColonne>
          <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
            {termines.map(p => <CarteTerminee key={p.id} p={p} compact={compact} ouvert={p.id === ouvertId} />)}
            {termines.length === 0 && <p className="font-corps text-[14px] italic m-0" style={{ color: ENCRE_META }}>Aucun parcours terminé.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

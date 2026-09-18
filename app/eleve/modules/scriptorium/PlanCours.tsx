import Link from 'next/link'
import type { PlanEleve, ParcoursPlan, SemainePlan } from '@/utils/scriptorium-plan-eleve'
import VueAnnee from './VueAnnee'
import PasseReplie from './PasseReplie'
import FermetureVolet, { HREF_ANNEE } from './FermetureVolet'

// Onglet « Plan de cours » de la face élève — refait le 18/09/2026 sur le handoff
// `design_handoff_plan_cours_eleve` (écrans 1a → 1d). Deux étages, une seule page :
//   ?vue=plan                → la VUE ANNÉE seule (<VueAnnee>) — l'écran d'entrée ;
//   ?vue=plan&parcours=<id>  → l'Année resserrée à gauche (bureau) + le VOLET du
//                              parcours (sa frise) à droite ; sous lg, le volet est
//                              un écran plein avec la barre « ‹ Année ».
// Le commutateur Année | Parcours d'avant (jamais rendu) a disparu avec ce lot.
//
// Anti-spoiler : ce composant ne reçoit que le DTO `PlanEleve` (utils/
// scriptorium-plan-eleve.ts) — TITRES ET STATUTS SEULS, aucun texte de contenu.
// Ne pas élargir ce DTO, même « pour enrichir » l'écran.
//
// Rendu serveur ; deux îlots client minuscules : le passé qui se déplie
// (<PasseReplie>) et Échap qui referme le volet (<FermetureVolet>).

// Encres de la maquette absentes des jetons : versions ASSOMBRIES pour tenir le
// contraste AA sur parchemin. Les JETONS restent la couleur des pastilles, filets
// et segments : `ok`, `attention` (#9A6A2E), `muet`.
const ENCRE_META = '#6E5A3E'
const OCRE_AA = '#8A6023'

// Nombre de semaines à venir montrées avant le repli.
const A_VENIR_VISIBLES = 2

function Legende() {
  return (
    <div className="flex items-center gap-4 font-ui text-[12.5px] font-medium">
      <span className="flex items-center gap-1.5 text-ok">
        <span className="w-2.5 h-2.5 rounded-full bg-ok" />vu
      </span>
      <span className="flex items-center gap-1.5" style={{ color: OCRE_AA }}>
        <span className="w-2.5 h-2.5 rounded-full bg-attention" />cette semaine
      </span>
      <span className="flex items-center gap-1.5" style={{ color: ENCRE_META }}>
        <span className="w-2.5 h-2.5 rounded-full bg-surface border-[1.5px] border-puce" />à venir
      </span>
    </div>
  )
}

// Puce d'un élément : ✓ vu · ● cette semaine · ○ à venir.
function Puce({ statut }: { statut: 'vu' | 'en_cours' | 'a_venir' }) {
  const signe = statut === 'vu' ? '✓' : statut === 'en_cours' ? '●' : '○'
  return (
    <span
      aria-hidden
      className={`font-ui text-[15px] flex-none w-3.5 ${statut === 'vu' ? 'text-ok' : statut === 'a_venir' ? 'text-puce' : ''}`}
      style={statut === 'en_cours' ? { color: OCRE_AA } : undefined}
    >
      {signe}
    </span>
  )
}

function Element({ libelle, statut, saillant }: { libelle: string; statut: 'vu' | 'en_cours' | 'a_venir'; saillant: boolean }) {
  return (
    <li className="flex items-baseline gap-2.5">
      <Puce statut={statut} />
      {statut === 'a_venir' ? (
        <span className="font-corps text-[15px] italic" style={{ color: ENCRE_META }}>{libelle}</span>
      ) : (
        <span className={`font-corps text-encre ${saillant ? 'text-[15.5px] font-semibold' : 'text-[15px] font-medium'}`}>
          {libelle}
        </span>
      )}
    </li>
  )
}

// Une rangée de la frise : gouttière de date · pastille sur l'axe · carte.
// `derniereSemaine` : la dernière semaine du parcours porte la mention à droite (§3).
function Rangee({ s, etat, dernier, derniereSemaine }: { s: SemainePlan; etat: 'vu' | 'courante' | 'a_venir'; dernier: boolean; derniereSemaine: boolean }) {
  return (
    <div className="flex items-stretch">
      {/* gouttière : ordinal + lundi (resserrée sous sm) */}
      <div className="w-[72px] sm:w-[104px] flex-none text-right pr-3 sm:pr-4 pt-0.5">
        <div
          className="font-ui text-[10px] font-bold uppercase tracking-[.09em]"
          style={{ color: etat === 'courante' ? OCRE_AA : undefined }}
        >
          <span className={etat === 'courante' ? '' : 'text-muet'}>S{s.k}</span>
        </div>
        {s.lundi && (
          <div
            className={`font-ui mt-0.5 ${etat === 'courante' ? 'text-[14px] font-bold' : etat === 'vu' ? 'text-[13px] font-semibold' : 'text-[13px] font-medium'}`}
            style={{ color: etat === 'courante' ? OCRE_AA : ENCRE_META }}
          >
            {s.lundi}
          </div>
        )}
      </div>

      {/* axe */}
      <div className="w-6 flex-none relative flex justify-center">
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 top-0 w-0.5 bg-bordure"
          style={{ bottom: dernier ? 16 : 0 }}
        />
        {etat === 'courante' ? (
          <span
            aria-hidden
            className="relative mt-0.5 w-[22px] h-[22px] rounded-full bg-attention border-[3px] border-attention-teinte"
            style={{ boxShadow: '0 0 0 1px var(--attention)' }}
          />
        ) : etat === 'vu' ? (
          <span aria-hidden className="relative mt-[3px] w-3 h-3 rounded-full bg-ok border-2 border-parchemin" />
        ) : (
          <span aria-hidden className="relative mt-[3px] w-3 h-3 rounded-full bg-surface border-[1.5px] border-puce" />
        )}
      </div>

      {/* carte */}
      <div className="flex-1 min-w-0 pb-3">
        {etat === 'courante' ? (
          <div className="rounded-[10px] border border-attention/40 border-l-[3px] border-l-attention bg-attention-teinte/40 px-4 pt-3.5 pb-3.5 shadow-[0_4px_16px_rgba(154,106,46,0.13)]">
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mb-2.5">
              <span
                className="font-ui text-[10px] font-bold uppercase tracking-[.06em] rounded-full px-2.5 py-[3px] text-bouton-plan-texte"
                style={{ background: OCRE_AA }}
              >
                cette semaine
              </span>
              <span className="font-corps text-[13px] italic" style={{ color: ENCRE_META }}>
                ce que vous étudiez en ce moment
              </span>
              {derniereSemaine && <MentionDerniere />}
            </div>
            <ul className="flex flex-col gap-2">
              {s.elements.map((e, i) => <Element key={i} libelle={e.libelle} statut={e.statut} saillant />)}
            </ul>
            <p className="mt-3">
              <Link
                href="/eleve/modules/scriptorium?vue=discussion"
                className="font-ui text-[13px] font-semibold text-bouton-parcours hover:text-encre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm"
              >
                En parler avec le tuteur →
              </Link>
            </p>
          </div>
        ) : etat === 'vu' ? (
          <div className="rounded-[10px] border border-bordure bg-surface px-4 py-[11px]">
            {derniereSemaine && <div className="flex justify-end mb-1"><MentionDerniere /></div>}
            <ul className="flex flex-col gap-[7px]">
              {s.elements.map((e, i) => <Element key={i} libelle={e.libelle} statut={e.statut} saillant={false} />)}
            </ul>
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-bordure-bouton bg-surface/60 px-4 py-[11px]">
            {derniereSemaine && <div className="flex justify-end mb-1"><MentionDerniere /></div>}
            <ul className="flex flex-col gap-[7px]">
              {s.elements.map((e, i) => <Element key={i} libelle={e.libelle} statut={e.statut} saillant={false} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function MentionDerniere() {
  return <span className="font-ui text-[12px] text-muet-clair ml-auto whitespace-nowrap">dernière semaine</span>
}

// ── La frise d'un parcours (le volet) ────────────────────────────────────────

function FriseParcours({ p }: { p: ParcoursPlan }) {
  // Deux cas où la semaine « courante » de l'instance (la dernière COMMENCÉE, §5.2) n'est
  // pas « cette semaine » : le parcours est TERMINÉ (tout est vu), ou il est en PAUSE
  // d'alternance (`reprise`) — la dernière semaine commencée rejoint alors le passé.
  const sansCourante = p.etat === 'termine' || p.reprise != null
  const etatDe = (s: SemainePlan): 'vu' | 'courante' | 'a_venir' =>
    s.courante ? (sansCourante ? 'vu' : 'courante') : s.k < p.semaineCourante ? 'vu' : s.k > p.semaineCourante ? 'a_venir' : 'vu'

  const vues = p.semaines.filter(s => etatDe(s) === 'vu')
  const aVenir = p.semaines.filter(s => etatDe(s) === 'a_venir')
  const repliees = aVenir.slice(A_VENIR_VISIBLES)
  const derniereRepliee = repliees[repliees.length - 1]
  const visibles = p.semaines.filter(s => !repliees.includes(s) && !vues.includes(s))
  const derniereK = p.semaines[p.semaines.length - 1]?.k
  // Passé replié par défaut — SAUF parcours terminé (tout est passé : tout est déplié).
  const replier = p.etat !== 'termine' && vues.length > 0
  const groupesVus = [...new Set(vues.flatMap(s => s.groupes))]
  const nbElementsVus = vues.reduce((n, s) => n + s.elements.length, 0)
  const dernierVisible = visibles[visibles.length - 1] ?? (replier ? null : vues[vues.length - 1])
  const rangee = (s: SemainePlan) => (
    <Rangee
      key={s.k}
      s={s}
      etat={etatDe(s)}
      dernier={!derniereRepliee && s === dernierVisible}
      derniereSemaine={s.k === derniereK && s.k === p.nbSemaines}
    />
  )

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="font-titre font-semibold text-[26px] text-encre m-0">{p.titre}</h2>
          <p className="font-corps text-[15px] mt-1 m-0" style={{ color: ENCRE_META }}>
            {p.nbSemaines} semaine{p.nbSemaines > 1 ? 's' : ''}
            {p.semaineDebut > 0 ? ` · S${p.semaineDebut} → S${p.semaineFin}` : ''}
            {p.lundiDebut ? ` · ${p.etat === 'a_venir' ? 'commence' : 'commencé'} le ${p.lundiDebut}` : ''}
            {p.etat === 'termine' ? (
              <> · terminé</>
            ) : p.etat === 'a_venir' ? (
              <> · pas encore commencé</>
            ) : (
              <>
                {' · tu es en '}<strong className="font-semibold" style={{ color: OCRE_AA }}>semaine {p.semaineCourante}</strong>
                {p.reprise ? ` · reprend le ${p.reprise}` : ''}
              </>
            )}
          </p>
        </div>
        <Link
          href={HREF_ANNEE}
          aria-label="Refermer le parcours"
          className="hidden lg:flex flex-none w-9 h-9 items-center justify-center rounded-full font-ui text-[18px] text-bouton-parcours hover:text-encre hover:bg-parchemin-fonce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
        >
          ✕
        </Link>
      </div>
      <Legende />

      {/* barre d'avancement : un segment par semaine */}
      <div className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: p.nbSemaines }, (_, i) => i + 1).map(k => (
          <span
            key={k}
            className={`h-[7px] flex-1 rounded-[2px] ${k < p.semaineCourante || (k === p.semaineCourante && sansCourante) ? 'bg-ok' : k === p.semaineCourante ? 'bg-attention' : 'bg-parchemin-fonce'}`}
            style={k === p.semaineCourante && !sansCourante ? { boxShadow: '0 0 0 2px var(--attention-teinte)' } : undefined}
          />
        ))}
      </div>

      {p.semaines.length === 0 ? (
        <p className="font-corps text-[14px] italic" style={{ color: ENCRE_META }}>
          Ce parcours n’a pas encore de contenu inscrit.
        </p>
      ) : (
        <div>
          {replier ? (
            <PasseReplie
              nbSemaines={vues.length}
              nbElements={nbElementsVus}
              premiereK={vues[0].k}
              derniereK={vues[vues.length - 1].k}
              libelles={groupesVus}
              dernier={visibles.length === 0 && !derniereRepliee}
            >
              {vues.map(rangee)}
            </PasseReplie>
          ) : (
            vues.map(rangee)
          )}
          {visibles.map(rangee)}
          {derniereRepliee && (
            <div className="flex items-center">
              <div className="w-[72px] sm:w-[104px] flex-none" />
              <div className="w-6 flex-none flex justify-center text-puce text-[15px]" aria-hidden>⌄</div>
              <div className="flex-1 font-corps text-[13px] italic" style={{ color: ENCRE_META }}>
                … jusqu’à la semaine {derniereRepliee.k}{derniereRepliee.lundi ? ` (${derniereRepliee.lundi})` : ''}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="font-corps text-[13px] italic" style={{ color: ENCRE_META }}>
        {p.etat === 'termine'
          ? `Ce parcours s’est terminé le ${p.lundiFin ?? '—'}.`
          : p.lundiFin ? `Ce parcours se termine la semaine du ${p.lundiFin}. ` : ''}
        {p.etat !== 'termine' && 'Seuls les titres apparaissent — le tuteur ne dévoilera pas la suite, c’est voulu.'}
      </p>
    </section>
  )
}

// ── L'orchestrateur ──────────────────────────────────────────────────────────

export default function PlanCours({ plan, parcoursOuvert }: { plan: PlanEleve; parcoursOuvert: string | null }) {
  if (plan.parcours.length === 0) {
    return (
      <p className="font-corps text-[15px] italic text-center py-10" style={{ color: ENCRE_META }}>
        Aucun parcours n’est encore ouvert pour ta classe.
      </p>
    )
  }

  const ouvert = parcoursOuvert ? plan.parcours.find(p => p.id === parcoursOuvert) ?? null : null

  if (!ouvert) {
    return (
      <div className="space-y-8">
        <VueAnnee plan={plan} />
        {/* Note anti-spoiler — italique atténué, au pied du plan (maquette 1a). */}
        <p className="font-corps text-[13px] italic text-center" style={{ color: ENCRE_META }}>
          Seuls les titres apparaissent ici — le tuteur ne dévoilera pas la suite du cours, c’est voulu.
        </p>
      </div>
    )
  }

  return (
    <div className="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[430px_minmax(0,1fr)] lg:-mx-[28px]">
      <FermetureVolet />
      {/* Sous lg : la barre « ‹ Année · titre » d'un écran plein (1d). */}
      <div className="lg:hidden flex items-center gap-3 mb-5 -mt-1">
        <Link
          href={HREF_ANNEE}
          className="font-ui text-[14px] font-semibold text-bouton-parcours hover:text-encre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm whitespace-nowrap"
        >
          ‹ Année
        </Link>
        <span className="w-px h-[15px] bg-pigment/30" aria-hidden />
        <span className="font-ui text-[13px] truncate" style={{ color: ENCRE_META }}>{ouvert.titre}</span>
      </div>
      {/* Bureau : l'Année resserrée à gauche. */}
      <aside className="hidden lg:block bg-surface border-r border-bordure px-6 py-5 rounded-l-[10px]" aria-label="Année">
        <VueAnnee plan={plan} compact ouvertId={ouvert.id} />
      </aside>
      <div className="lg:px-8 lg:py-5 min-w-0">
        <FriseParcours p={ouvert} />
      </div>
    </div>
  )
}

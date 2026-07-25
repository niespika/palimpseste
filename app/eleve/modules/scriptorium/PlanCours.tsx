import Link from 'next/link'

// Onglet « Plan de cours » de la face élève (C2.2) — extrait du volet dépliable
// de ChatScriptorium, qui se recentre sur la discussion. Écran à part, lisible
// d'un coup d'œil : frise verticale des semaines, statuts distingués par la
// COULEUR (jetons ok / attention / muet) ET par la POLICE (gras = cette semaine,
// italique = à venir).
//
// Anti-spoiler : ce composant ne reçoit que le DTO `PlanEleve` — TITRES ET
// STATUTS SEULS, aucun texte de contenu (le contenu des semaines à venir n'existe
// que côté IA). Ne pas élargir ce DTO, même « pour enrichir » l'écran.
//
// Rendu seul : aucune logique, aucune Server Action, aucun état.

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

// ⚠️ Vue « Année » (une carte par parcours) : spécifiée, PAS construite en v1.
// Tant qu'elle n'existe pas, le commutateur Année | Parcours n'est PAS rendu —
// pas de bouton mort à l'écran (règle v1 du handoff, écran 1b). Passer ce drapeau
// à `true` le fera apparaître le jour où la vue Année sera écrite.
const VUE_ANNEE_DISPONIBLE: boolean = false

// Encres de la maquette absentes des jetons : versions ASSOMBRIES pour tenir le
// contraste AA sur parchemin (même démarche que `ongletInactif` de configModules).
// Les JETONS restent la couleur des pastilles, filets et segments : `ok`,
// `attention` (#9A6A2E), `muet`.
const ENCRE_META = '#6E5A3E' // méta, dates, libellés « à venir »
const OCRE_AA = '#8A6023'    // texte et badge ocre (statut « cette semaine »)

// Nombre de semaines à venir montrées avant le repli (cf. handoff : « au-delà
// de ~2 semaines à venir, replier »).
const A_VENIR_VISIBLES = 2

function Commutateur() {
  // Sobre, charte : deux libellés Alegreya Sans séparés d'un filet au pigment,
  // l'actif souligné d'un filet de 2 px. Local au CONTENU du plan (changement de
  // vue, pas de navigation) — il ne va pas dans l'en-tête et ne crée pas de `?vue=`.
  return (
    <div className="flex items-center gap-3">
      <span className="font-ui text-[13px] font-medium tracking-[.03em] pb-[3px] border-b-2 border-transparent" style={{ color: ENCRE_META }}>
        Année
      </span>
      <span className="w-px h-[15px] bg-pigment/30" />
      <span className="font-ui text-[13px] font-semibold tracking-[.03em] pb-[3px] border-b-2 border-pigment text-pigment">
        Parcours
      </span>
    </div>
  )
}

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

type Semaine = PlanEleve['parcours'][number]['semaines'][number]

// Une rangée de la frise : gouttière de date · pastille sur l'axe · carte.
function Rangee({ s, etat, dernier }: { s: Semaine; etat: 'vu' | 'courante' | 'a_venir'; dernier: boolean }) {
  return (
    <div className="flex items-stretch">
      {/* gouttière : ordinal + lundi (resserrée sous sm — chantier 4) */}
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
            <ul className="flex flex-col gap-[7px]">
              {s.elements.map((e, i) => <Element key={i} libelle={e.libelle} statut={e.statut} saillant={false} />)}
            </ul>
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-bordure-bouton bg-surface/60 px-4 py-[11px]">
            <ul className="flex flex-col gap-[7px]">
              {s.elements.map((e, i) => <Element key={i} libelle={e.libelle} statut={e.statut} saillant={false} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Parcours({ p }: { p: PlanEleve['parcours'][number] }) {
  const premierLundi = p.semaines.find(s => s.lundi)?.lundi ?? null
  const etatDe = (s: Semaine): 'vu' | 'courante' | 'a_venir' =>
    s.courante ? 'courante' : s.k < p.semaineCourante ? 'vu' : s.k > p.semaineCourante ? 'a_venir' : 'vu'

  // Repli : au-delà de A_VENIR_VISIBLES semaines à venir, on ne montre que les
  // premières — le reste est résumé d'une ligne (le plan reste lisible d'un coup
  // d'œil, et l'anti-spoiler n'y perd rien : seuls des titres sont en jeu).
  const aVenir = p.semaines.filter(s => etatDe(s) === 'a_venir')
  const repliees = aVenir.slice(A_VENIR_VISIBLES)
  const derniereRepliee = repliees[repliees.length - 1]
  const visibles = p.semaines.filter(s => !repliees.includes(s))

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h2 className="font-titre font-semibold text-[26px] text-encre m-0">{p.titre}</h2>
          <p className="font-corps text-[15px] mt-1" style={{ color: ENCRE_META }}>
            {p.nbSemaines} semaine{p.nbSemaines > 1 ? 's' : ''}
            {premierLundi ? ` · commencé le ${premierLundi}` : ''}
            {' · tu es en '}
            <strong className="font-semibold" style={{ color: OCRE_AA }}>semaine {p.semaineCourante}</strong>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          {VUE_ANNEE_DISPONIBLE && <Commutateur />}
          <Legende />
        </div>
      </div>

      {/* barre d'avancement : un segment par semaine */}
      <div className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: p.nbSemaines }, (_, i) => i + 1).map(k => (
          <span
            key={k}
            className={`h-[7px] flex-1 rounded-[2px] ${k < p.semaineCourante ? 'bg-ok' : k === p.semaineCourante ? 'bg-attention' : 'bg-parchemin-fonce'}`}
            style={k === p.semaineCourante ? { boxShadow: '0 0 0 2px var(--attention-teinte)' } : undefined}
          />
        ))}
      </div>

      <div>
        {visibles.map((s, i) => (
          <Rangee key={s.k} s={s} etat={etatDe(s)} dernier={!derniereRepliee && i === visibles.length - 1} />
        ))}
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
    </section>
  )
}

export default function PlanCours({ plan }: { plan: PlanEleve }) {
  if (plan.parcours.length === 0) {
    return (
      <p className="font-corps text-[15px] italic text-center py-10" style={{ color: ENCRE_META }}>
        Aucun parcours n’est encore ouvert pour ta classe.
      </p>
    )
  }

  return (
    <div className="space-y-10">
      {plan.parcours.map(p => <Parcours key={p.titre} p={p} />)}
      {/* Note anti-spoiler — italique atténué, au pied du plan (maquette 1a). */}
      <p className="font-corps text-[13px] italic text-center" style={{ color: ENCRE_META }}>
        Seuls les titres apparaissent ici — le tuteur ne dévoilera pas la suite du cours, c’est voulu.
      </p>
    </div>
  )
}

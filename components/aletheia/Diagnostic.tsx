import { noteVersLettre, COULEUR_LETTRE } from '@/utils/notation'
import type { DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'

// Affichage du diagnostic prof (E→A). PROF-ONLY — jamais rendu côté élève.
// La TENDANCE prime sur le point isolé (SPEC §2) ; niveaux par chapitre provisoires.

function Lettre({ n }: { n: number | null | undefined }) {
  const l = noteVersLettre(n ?? null)
  if (!l) return <span className="text-bordure">—</span>
  return <span className={`inline-block px-1 rounded text-[10px] font-semibold ${COULEUR_LETTRE[l]}`}>{l}</span>
}

// Un axe : V1 (→ VF si différent = réponse au feedback). Le flag « mal définie »
// est par phase (un chapitre peut devenir/cesser d'être « sans thèse nette » en VF).
export function NiveauAxe({ v1, vf, malDefV1 = false, malDefVf = false }: {
  v1: number | null; vf: number | null; malDefV1?: boolean | null; malDefVf?: boolean | null
}) {
  const cell = (n: number | null, malDef: boolean) =>
    malDef ? <span className="text-[10px] text-muet italic">n.d.</span> : <Lettre n={n} />
  const aVf = vf != null || malDefVf === true
  if (!aVf) return cell(v1, malDefV1 === true)
  const same = (malDefV1 === true && malDefVf === true) || (malDefV1 !== true && malDefVf !== true && v1 === vf)
  if (same) return cell(v1, malDefV1 === true)
  return (
    <span className="inline-flex items-center gap-0.5">
      {cell(v1, malDefV1 === true)}<span className="text-bordure text-[10px]">→</span>{cell(vf, malDefVf === true)}
    </span>
  )
}

const lettreT = (n: number | null) => noteVersLettre(n) ?? '—'
const axeT = (v1: number | null, vf: number | null, mV1: boolean, mVf: boolean) => {
  const a = mV1 ? 'n.d.' : lettreT(v1)
  if (vf == null && !mVf) return a
  const b = mVf ? 'n.d.' : lettreT(vf)
  return a === b ? a : `${a}→${b}`
}
const titreDiag = (s: number, d: DiagnosticTravail): string => {
  const these = axeT(d.niveau_these_v1, d.niveau_these_vf, d.these_mal_definie_v1 === true, d.these_mal_definie_vf === true)
  const args = axeT(d.niveau_arguments_v1, d.niveau_arguments_vf, false, false)
  return `Semaine ${s} — arguments ${args} · thèse ${these} (V1→VF, E faible → A fort)`
}

const aSignal = (d: DiagnosticTravail | undefined): boolean => !!d && (
  d.niveau_arguments_v1 != null || d.niveau_arguments_vf != null
  || d.niveau_these_v1 != null || d.niveau_these_vf != null
  || d.these_mal_definie_v1 === true || d.these_mal_definie_vf === true)

// Trajectoire compacte par semaine (axe arguments en avant — le plus robuste).
export function TrajectoireDiag({ semaines, diag }: { semaines: number[]; diag: Map<number, DiagnosticTravail> }) {
  const cells = [...new Set(semaines)].sort((a, b) => a - b)
    .map(s => ({ s, d: diag.get(s) }))
    .filter((x): x is { s: number; d: DiagnosticTravail } => aSignal(x.d))
  if (cells.length === 0) return <span className="text-[11px] text-muet">pas encore diagnostiqué</span>
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {cells.map(({ s, d }) => (
        <span key={s} className="inline-flex items-center gap-1 text-[11px]" title={titreDiag(s, d)}>
          <span className="text-muet">S{s}</span>
          <NiveauAxe v1={d.niveau_arguments_v1} vf={d.niveau_arguments_vf} />
        </span>
      ))}
    </div>
  )
}

// Détail d'un chapitre (drill-down) : 2 axes V1 + delta, et la note d'inventaire.
export function DetailDiagChapitre({ d }: { d: DiagnosticTravail | undefined }) {
  const rien = !d || (d.inventaire_v1 == null && d.inventaire_vf == null)
  if (rien && d?.erreur_at) return <p className="text-xs text-retard">Le calcul du diagnostic a échoué — relance le diagnostic.</p>
  if (rien || !d) return <p className="text-xs text-muet">Pas encore diagnostiqué.</p>
  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-encre-douce">Saisie de la thèse : <NiveauAxe v1={d.niveau_these_v1} vf={d.niveau_these_vf} malDefV1={d.these_mal_definie_v1} malDefVf={d.these_mal_definie_vf} /></span>
        <span className="text-encre-douce">Restitution des arguments : <NiveauAxe v1={d.niveau_arguments_v1} vf={d.niveau_arguments_vf} /></span>
        <span className="text-muet">(V1 → VF · E faible → A fort)</span>
      </div>
      {d.inventaire_v1?.note && <p className="text-encre-douce italic">{d.inventaire_v1.note}</p>}
      {d.erreur_at && <p className="text-retard">Le dernier calcul du diagnostic a échoué — relance le diagnostic.</p>}
    </div>
  )
}

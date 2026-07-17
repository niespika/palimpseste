'use client'

// Bandes en LECTURE SEULE de la vue panoptique (§7) : ce qui pèse sur l'élève une semaine
// donnée, à côté des exercices interactifs du plan. Réutilisées par la grille (avec plan,
// intercalées par semaine) ET par la vue « classe sans plan ». Aucune écriture (sauf le
// lien « Préparer » d'une synthèse, qui pointe vers /prof/codex).
import Link from 'next/link'
import { libelleSemainePeda, type Budget } from '@/utils/plan-cadence'
import type { SemainePanoptique, EnseignementLigne, LecturePanoptique, ExercicePanoptique } from './panoptique-serveur'

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}
function trancheLabel(t: { debut: number | null; fin: number | null } | null): string {
  if (!t || (t.debut == null && t.fin == null)) return 'entier'
  return `S${t.debut ?? '?'}→S${t.fin ?? '?'}`
}

// ── Enseignements : contenu enseigné cette semaine (parcours) ──────────────────
export function BandeEnseignements({ items }: { items: EnseignementLigne[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1 text-xs text-encre-douce">
      <span className="text-muet flex-shrink-0" aria-hidden>📖</span>
      {items.map((e, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <span className="text-muet">{e.ref === 'texte' ? 'Texte' : e.ref === 'cours' ? 'Cours' : 'Livre'}</span>
          <span className="text-encre">{e.titre}</span>
          {e.ref === 'livre' && <span className="text-muet">({trancheLabel(e.tranche)})</span>}
          {i < items.length - 1 && <span className="text-muet">·</span>}
        </span>
      ))}
    </div>
  )
}

// ── Synthèse de fin de cours (lecture seule ; préparée dans Codex) ─────────────
export function LigneSynthese({ exo }: { exo: ExercicePanoptique }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs border-t border-bordure first:border-t-0">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-encre">Synthèse</span>
        <span className="text-muet">· classe · pour le {fmtJour(exo.dateEffective)}</span>
        {exo.etat === 'concu' ? <span className="bg-ok-teinte text-ok px-1.5 py-0.5 rounded">préparée</span>
          : exo.etat === 'en_retard' ? <span className="bg-retard-teinte text-retard px-1.5 py-0.5 rounded">en retard</span>
            : <span className="bg-attention-teinte text-attention px-1.5 py-0.5 rounded">à préparer</span>}
      </div>
      {exo.etat !== 'concu' && (
        <Link href="/prof/codex" className="text-pigment hover:underline flex-shrink-0">Préparer →</Link>
      )}
    </div>
  )
}

// ── Lectures de livre (mode b) : échéances de lecture dans la semaine ──────────
export function BandeLectures({ items }: { items: LecturePanoptique[] }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-0.5 px-2 py-1 text-xs">
      {items.map((l, i) => (
        <div key={i} className="flex flex-wrap items-center gap-x-2 text-encre-douce">
          <span className="text-muet flex-shrink-0" aria-hidden>📚</span>
          <span className="text-encre">{l.livreTitre}</span>
          <span className="text-muet">
            {l.seances.length > 1 ? `séances ${l.seances[0]}–${l.seances[l.seances.length - 1]}` : `séance ${l.seances[0]}`}
            {' '}· à lire pour le {fmtJour(l.echeance)}
          </span>
          {l.ambigu && <span className="text-attention" title="Plusieurs parcours datent cette lecture différemment">⚠ dates divergentes</span>}
        </div>
      ))}
    </div>
  )
}

// ── Reflets : essais + fragment attendu (lecture seule, timing hors plan) ──────
export function BandeReflets({ essais, fragmentAttendu }: { essais: { titre: string; date: string }[]; fragmentAttendu: boolean }) {
  if (essais.length === 0 && !fragmentAttendu) return null
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1 text-xs text-muet">
      <span aria-hidden>↳</span>
      {essais.map((e, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <span className="text-encre-douce">Essai : {e.titre}</span>
          <span>({fmtJour(e.date)})</span>
          {(i < essais.length - 1 || fragmentAttendu) && <span>·</span>}
        </span>
      ))}
      {fragmentAttendu && <span className="text-encre-douce">Fragment à rendre <span className="text-muet">(échéancier propre au module)</span></span>}
    </div>
  )
}

// ── Chip budget temps élève (§7.3) : signal, jamais bloquant ───────────────────
function decomposition(s: SemainePanoptique): string {
  const parts: string[] = ['flashcards 15–20']
  const maison = s.exercices.filter((e) => e.lieu === 'maison' && e.etat !== 'a_recaler' && (e.type === 'ecriture' || e.type === 'lecture')).length
  if (maison > 0) parts.push(`${maison} exo maison ${maison * 30}–${maison * 40}`)
  if (s.lectures.length > 0) parts.push(`${s.lectures.length} lecture(s) livre ${s.lectures.length * 30}`)
  if (s.fragmentAttendu) parts.push('fragment 30')
  return parts.join(' + ')
}
export function ChipBudget({ semaine }: { semaine: SemainePanoptique }) {
  const b: Budget = semaine.budget
  const cible = b.cibleMin != null && b.cibleMax != null ? `cible ${b.cibleMin}–${b.cibleMax}` : 'sans cible'
  return (
    <span
      title={`${decomposition(semaine)} = ${b.min}–${b.max} min · ${cible}`}
      className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${b.depasse ? 'bg-attention-teinte text-attention' : 'text-muet'}`}
    >
      ~{b.min}–{b.max} min <span className="opacity-70">/ {cible}</span>
      {b.depasse && <span aria-hidden>⚠</span>}
    </span>
  )
}

// ── Bandeau « hors frise » : semaines de vacances / hors semestre portant du travail ──
export function BandeauHorsFrise({ semaines }: { semaines: SemainePanoptique[] }) {
  if (semaines.length === 0) return null
  return (
    <div className="bg-attention-teinte rounded-lg p-3 space-y-2">
      <p className="text-xs text-attention font-medium">Hors frise d’enseignement — {semaines.length} semaine(s) portant du travail (vacances / hors semestre)</p>
      {semaines.map((s) => (
        <div key={s.lundi} className="text-xs text-encre-douce">
          <span className="text-muet">Semaine du {fmtJour(s.lundi)} :</span>{' '}
          {[
            ...s.exercices.map((e) => e.source === 'synthese_parcours' ? 'synthèse' : e.type),
            ...s.essais.map((e) => `essai « ${e.titre} »`),
            ...(s.fragmentAttendu ? ['fragment'] : []),
          ].join(', ') || '—'}
        </div>
      ))}
    </div>
  )
}

// ── Vue « classe sans plan » : bandes en lecture seule, semaine par semaine ────
export function SemainesReadonly({ semaines }: { semaines: SemainePanoptique[] }) {
  const avecContenu = semaines.filter((s) => s.enseignements.length || s.lectures.length || s.essais.length || s.exercices.length || s.fragmentAttendu)
  if (avecContenu.length === 0) {
    return <p className="text-sm text-muet">Aucun enseignement planifié pour cette classe (pas de parcours assigné, ou semestres à venir non définis).</p>
  }
  return (
    <div className="border border-bordure rounded-lg divide-y divide-bordure">
      {avecContenu.map((s) => (
        <div key={s.lundi} className="p-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-encre-douce">Lundi {fmtJour(s.lundi)}</span>
            <span className="flex items-center gap-2">
              <span className="text-muet">{libelleSemainePeda(s.semestreNom, s.pedaDansSemestre)}</span>
              <ChipBudget semaine={s} />
            </span>
          </div>
          <BandeEnseignements items={s.enseignements} />
          <BandeLectures items={s.lectures} />
          <BandeReflets essais={s.essais} fragmentAttendu={s.fragmentAttendu} />
        </div>
      ))}
    </div>
  )
}

'use client'

// ============================================================================
// La LECTURE ANNOTÉE, et le FORMULAIRE qui ne disparaît jamais (`05-` §4.4).
// « C'est ce qu'un professeur annote sur une photocopie. »
//
// « Tant que le générateur n'a pas de banc, la vue réduite est UN PARI sur sa
//   fiabilité : le professeur doit pouvoir TOUT VOIR QUAND IL LE VEUT, et c'est
//   le banc qui dira un jour ce qu'on peut cesser d'afficher. »
// ============================================================================

import { useActionState, useState } from 'react'
import {
  validerReference, devaliderReference, corrigerReference, type RetourConception,
} from '../../actions'
import type { VerdictReference } from '@/utils/fabrique/verifie-reference'

interface Moment {
  m: string; de: number; a: number; fonction: string
  cible?: string[]; statuts?: string[]; etiquette?: string
}
interface Phrase { n: number; fonctions: string[]; statuts?: string[] }
interface Lecture { n: number; drapeau: string; lectures: string[] }
interface Concept { concept: string; formes: string[] }
interface Armature { question_directrice?: string; these?: string; these_phrases?: number[] }

export default function LectureAnnotee({
  referenceId, dejaValidee, phrases, reference, verdict, intervalles, occurrences,
}: {
  referenceId: string; dejaValidee: boolean
  /** Les phrases DÉJÀ SEGMENTÉES par la segmentation qui fait foi (`05-` §4.7). */
  phrases: string[]
  reference: Record<string, unknown>
  verdict: VerdictReference
  /** ⭐ DÉRIVÉS À LA LECTURE, jamais stockés — voir `utils/generateur/lecture.ts`. */
  intervalles: Array<{ m: string; intervalle: [number, number] | null }>
  occurrences: Array<{ concept: string; intervalles: Array<[number, number]> }>
}) {
  const [vue, setVue] = useState<'annotee' | 'formulaire' | 'correction'>('annotee')
  const [retour, action, enCours] = useActionState<RetourConception | null, FormData>(
    validerReference, null)
  const [retourDev, actionDev] = useActionState<RetourConception | null, FormData>(
    devaliderReference, null)
  const [retourCorr, actionCorr, corrEnCours] = useActionState<RetourConception | null, FormData>(
    corrigerReference, null)
  const bornesDuMoment = new Map(intervalles.map((x) => [x.m, x.intervalle]))

  const moments = (reference.moments ?? []) as Moment[]
  const parPhrase = new Map<number, Phrase>()
  for (const p of (reference.phrases ?? []) as Phrase[]) parPhrase.set(p.n, p)
  const lectures = new Map<number, Lecture>()
  for (const l of (reference.lectures ?? []) as Lecture[]) lectures.set(l.n, l)
  const concepts = (reference.concepts ?? []) as Concept[]
  const arm = (reference.armature ?? {}) as Armature
  const porteuses = new Set(arm.these_phrases ?? [])

  // « Le nombre de VALEURS DÉCLARÉES » — la dernière annonce du contrôle.
  const valeursDeclarees = verdict.annonces
    .find((a) => a.includes('valeurs déclarées'))?.split('~')[1] ?? '?'

  return (
    <div className="space-y-4">
      {/* LE BANDEAU — il PORTE TOUJOURS les quatre chiffres. */}
      <div className={`rounded-xl border px-4 py-3 ${
        verdict.verdict === 'refus' ? 'border-retard bg-retard-teinte'
          : verdict.verdict === 'blocage' ? 'border-attention bg-attention-teinte'
            : 'border-ok bg-ok-teinte'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-titre text-base text-encre">
            Contrôle machine : <strong>{
              verdict.verdict === 'refus' ? 'REFUSÉE — elle ne vous est pas soumise'
                : verdict.verdict === 'blocage' ? 'À TRANCHER'
                  : 'CONFORME'}</strong>
          </p>
          <p className="font-ui text-sm text-encre-douce">
            {verdict.blocages.length} blocage(s) · {verdict.signalements.length} signalement(s) ·
            {' '}~{valeursDeclarees.trim()} valeurs déclarées
          </p>
        </div>
        {verdict.refus.map((x, i) => <p key={i} className="font-ui text-xs text-encre">✗ {x}</p>)}
        {verdict.blocages.map((x, i) => (
          <p key={i} className="font-ui text-xs text-encre">
            ⊘ {x}
          </p>
        ))}
        {verdict.signalements.map((x, i) => (
          <p key={i} className="font-ui text-xs text-encre-douce">· {x}</p>
        ))}
      </div>

      {/* L'ARMATURE EN TÊTE — « c'est ce qu'un professeur lit en premier ». */}
      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">L&apos;armature</p>
        <p className="font-serif text-base text-encre">
          <strong>Question directrice.</strong> {arm.question_directrice || <em>— absente —</em>}
        </p>
        <p className="font-serif text-base text-encre">
          <strong>Thèse.</strong> {arm.these || <em>— absente —</em>}
        </p>
        <p className="font-ui text-xs text-muet">
          portée par {porteuses.size ? `les phrases ${[...porteuses].join(', ')}`
            : <em>aucune phrase — légal, un auteur peut la distribuer</em>}
        </p>
      </section>

      <div className="inline-flex flex-wrap rounded-lg border border-bordure bg-surface p-0.5 font-ui text-sm">
        {(dejaValidee
          ? (['annotee', 'formulaire'] as const)
          : (['annotee', 'formulaire', 'correction'] as const)
        ).map((x) => (
          <button key={x} type="button" onClick={() => setVue(x)}
            aria-current={vue === x ? 'true' : undefined}
            className={`rounded-md px-3.5 py-1.5 ${
              vue === x ? 'bg-bouton text-surface' : 'text-encre-douce hover:bg-parchemin-fonce'}`}>
            {x === 'annotee' ? 'Lecture annotée'
              : x === 'formulaire' ? 'Formulaire — toutes les valeurs'
                : 'Corriger'}
          </button>
        ))}
      </div>

      {vue === 'annotee' ? (
        <section className="rounded-xl border border-bordure bg-surface p-4">
          {/* Le texte en pleine page, ses moments EN FILET DE MARGE, et
              SEUL CE QUI N'EST PAS ORDINAIRE EST MARQUÉ. */}
          {moments.sort((a, b) => a.de - b.de).map((m) => (
            <div key={m.m} className="flex gap-4 border-b border-bordure py-3 last:border-0">
              <aside className="w-44 shrink-0 space-y-0.5 font-ui text-xs text-muet">
                <p className="text-encre-douce">{m.etiquette}</p>
                <p>
                  {m.fonction}
                  {/* la flèche de cible */}
                  {(m.cible ?? []).length > 0 && <> → {(m.cible ?? []).join(', ')}</>}
                </p>
                {/* un statut autre qu'`affirme`, en exposant */}
                {(m.statuts ?? []).filter((s) => s !== 'affirme').map((s) => (
                  <p key={s} className="text-attention">{s}</p>
                ))}
                {/* ⭐ L'INTERVALLE, DÉRIVÉ À LA LECTURE. Il ne vit nulle part en
                    base : le format ne déclare que `de`/`a`, et une clé de plus
                    déclencherait le refus n° 11. */}
                <p className="text-muet-clair" title="dérivé des numéros de phrase — jamais stocké">
                  {(() => {
                    const b = bornesDuMoment.get(m.m)
                    return b ? `phrases ${m.de}–${m.a} · car. ${b[0]}–${b[1]}` : `phrases ${m.de}–${m.a}`
                  })()}
                </p>
              </aside>
              <div className="min-w-0 flex-1 space-y-1">
                {phrases.slice(m.de - 1, m.a).map((p, k) => {
                  const n = m.de + k
                  const ph = parPhrase.get(n)
                  const defend = (ph?.fonctions ?? []).includes('defend_these')
                  const relance = (ph?.fonctions ?? []).length === 1 && ph?.fonctions[0] === 'relance'
                  const inhabituels = (ph?.statuts ?? []).filter((s) => s !== 'affirme')
                  const lect = lectures.get(n)
                  return (
                    <p key={n} className={`font-serif text-sm ${relance ? 'text-muet' : 'text-encre'}`}>
                      <span className="mr-1 font-ui text-xs text-muet-clair">{n}</span>
                      <span className={`${defend ? 'underline decoration-puce underline-offset-4' : ''}
                        ${porteuses.has(n) ? 'bg-attention-teinte' : ''}`}>{p}</span>
                      {inhabituels.map((s) => (
                        <sup key={s} className="ml-0.5 font-ui text-[10px] text-attention">{s}</sup>
                      ))}
                      {lect && (
                        <span className="mt-0.5 block pl-6 font-ui text-xs text-encre-douce">
                          {lect.drapeau === 'dominante' ? 'lecture dominante' : 'lectures équivalentes'} :{' '}
                          {lect.lectures.join(' · ')}
                        </span>
                      )}
                    </p>
                  )
                })}
              </div>
            </div>
          ))}
          {/* les concepts en pied de page — avec leurs OCCURRENCES, retrouvées
              par le code à partir des formes citées : « le modèle ne localise ni
              ne compte rien » (`05-` §1), et elles ne se stockent pas non plus. */}
          {concepts.length > 0 && (
            <p className="mt-3 border-t border-bordure pt-2 font-ui text-xs text-muet">
              concepts : {concepts.map((c) => {
                const o = occurrences.find((x) => x.concept === c.concept)
                return `${c.concept} (${c.formes.join(', ')}${
                  o ? ` — ${o.intervalles.length} occurrence(s) retrouvée(s)` : ''})`
              }).join(' · ')}
            </p>
          )}
        </section>
      ) : vue === 'formulaire' ? (
        <section className="rounded-xl border border-bordure bg-surface p-4">
          <p className="mb-2 font-ui text-xs text-muet">
            Le détail complet, toutes les valeurs déclarées. <strong>Cette vue ne disparaît
            jamais</strong> : la lecture annotée est un pari sur la fiabilité du générateur, et
            c&apos;est le banc qui dira un jour ce qu&apos;on peut cesser d&apos;afficher.
          </p>
          <pre className="max-h-[32rem] overflow-auto rounded-md border border-bordure bg-parchemin
                          p-3 font-mono text-xs text-encre">
            {JSON.stringify(reference, null, 2)}
          </pre>
          <p className="mt-2 font-ui text-xs text-muet">
            <strong>Ce que le format ne porte pas, et qui se dérive à la lecture</strong> : les
            intervalles des moments et les occurrences des concepts. Le format ne déclare que des
            numéros de phrase et des formes citées ; les bornes, elles, se recalculent à chaque
            lecture depuis la segmentation qui fait foi — <em>un second domicile de ce que
            {' '}<code>de</code>/<code>a</code> disent déjà finirait par diverger</em>.
          </p>
          <ul className="mt-1 font-ui text-xs text-muet-clair">
            {intervalles.map((x) => (
              <li key={x.m}>
                {x.m} → {x.intervalle
                  ? `caractères ${x.intervalle[0]}–${x.intervalle[1]} (fin exclue)`
                  : 'bornes introuvables — rien ne se devine'}
              </li>
            ))}
            {occurrences.map((x) => (
              <li key={x.concept}>
                « {x.concept} » → {x.intervalles.map((o) => `${o[0]}–${o[1]}`).join(', ') || 'aucune'}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        /* ── LA CORRECTION — « le professeur corrige ce qui est faux, PUIS
              valide l'ensemble » (`05-` §4.5). Sans elle, les deux BLOCAGES du
              §4.2 n'avaient aucune issue : le bouton de validation restait
              désactivé, et rien ne permettait de trancher. ── */
        <section className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
          <p className="font-ui text-xs text-encre-douce">
            <strong>Corrigez ce qui est faux, puis validez l&apos;ensemble.</strong>{' '}
            <strong>Toute correction repasse le contrôle</strong> avant que la validation
            redevienne possible — <em>déplacer une frontière de moment peut ouvrir un trou de
            couverture, et un trou ne passe jamais en silence</em>. Un refus n&apos;écrit rien ;
            un blocage restant s&apos;écrit, et vous pouvez reprendre.
          </p>
          <form action={actionCorr} className="space-y-2">
            <input type="hidden" name="reference_id" value={referenceId} />
            <textarea name="contenu" rows={22} spellCheck={false}
              defaultValue={JSON.stringify(reference, null, 2)}
              className="w-full rounded-md border border-bordure bg-parchemin p-3 font-mono
                         text-xs text-encre" />
            <button type="submit" disabled={corrEnCours}
              className="rounded-md bg-bouton px-4 py-2 font-ui text-sm text-surface disabled:opacity-50">
              {corrEnCours ? 'Contrôle…' : 'Corriger et repasser le contrôle'}
            </button>
          </form>
          {retourCorr && (
            <div className={`rounded-lg border px-3 py-2 space-y-1 ${
              retourCorr.ok ? 'border-ok bg-ok-teinte' : 'border-retard bg-retard-teinte'}`}>
              <p className="font-ui text-sm text-encre">{retourCorr.message}</p>
              {(retourCorr.empechements ?? []).map((e, i) => (
                <p key={i} className="font-ui text-xs text-encre-douce">· {e}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* LE GESTE — un seul, pour toute la référence. */}
      <div className="flex flex-wrap items-center gap-3">
        {!dejaValidee ? (
          <form action={action}>
            <input type="hidden" name="reference_id" value={referenceId} />
            <button type="submit" disabled={enCours || verdict.verdict !== 'conforme'}
              className="rounded-md bg-bouton px-4 py-2 font-ui text-sm text-surface disabled:opacity-50">
              {enCours ? 'Écriture…' : 'Valider toute la référence'}
            </button>
          </form>
        ) : (
          <form action={actionDev}>
            <input type="hidden" name="reference_id" value={referenceId} />
            <button type="submit"
              className="rounded-md border border-bordure-bouton px-4 py-2 font-ui text-sm text-encre-douce">
              Dévalider — explicitement
            </button>
          </form>
        )}
        <span className="font-ui text-xs text-muet">
          {dejaValidee
            ? 'Validée. Une référence validée ne se modifie plus en silence : corriger passe par une dévalidation explicite.'
            : 'Un seul geste, pour toute la référence — pas de validation champ par champ.'}
        </span>
      </div>
      {(retour ?? retourDev) && (
        <div className={`rounded-lg border px-3 py-2 space-y-1 ${
          (retour ?? retourDev)!.ok ? 'border-ok bg-ok-teinte' : 'border-retard bg-retard-teinte'}`}>
          <p className="font-ui text-sm text-encre">{(retour ?? retourDev)!.message}</p>
          {((retour ?? retourDev)!.empechements ?? []).map((e, i) => (
            <p key={i} className="font-ui text-xs text-encre-douce">· {e}</p>
          ))}
        </div>
      )}
    </div>
  )
}

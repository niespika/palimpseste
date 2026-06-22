import type { RetourV1, RetourVF } from '@/app/eleve/modules/aletheia/types'

// Rendu partagé des retours Aletheia (page semaine élève + drill-down prof).
// Objectif ergonomie ado (SPEC §3) : bulles dédiées, priorisées, pas de pavé.

type Accent = 'violet' | 'amber' | 'green' | 'stone' | 'sky'

const ACCENT: Record<Accent, string> = {
  violet: 'border-l-violet-300',
  amber: 'border-l-amber-300',
  green: 'border-l-green-300',
  stone: 'border-l-stone-300',
  sky: 'border-l-sky-300',
}

export function Bulle({ titre, accent = 'stone', children }: { titre: string; accent?: Accent; children: React.ReactNode }) {
  return (
    <section className={`bg-white border border-stone-200 border-l-4 ${ACCENT[accent]} rounded-xl p-4`}>
      <h4 className="text-sm font-medium text-stone-800 mb-2">{titre}</h4>
      {children}
    </section>
  )
}

function Liste({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-stone-700">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  )
}

// ── Retour V1 — socratique, éléments priorisés et digestes ────────────────────
export function VueRetourV1({ retour, montrerRemarque = false }: { retour: RetourV1; montrerRemarque?: boolean }) {
  return (
    <div className="space-y-3">
      {retour.relances?.length > 0 && (
        <Bulle titre="Pour creuser ton idée et tes arguments" accent="violet">
          <Liste items={retour.relances} />
        </Bulle>
      )}
      {retour.accord && (
        <Bulle titre="Sur ton accord" accent="sky">
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{retour.accord}</p>
        </Bulle>
      )}
      {retour.reponses_questions?.length > 0 && (
        <Bulle titre="Réponses à tes questions" accent="green">
          <Liste items={retour.reponses_questions} />
        </Bulle>
      )}
      {retour.vocabulaire?.length > 0 && (
        <Bulle titre="Vocabulaire" accent="amber">
          <dl className="space-y-1.5 text-sm">
            {retour.vocabulaire.map((v, i) => (
              <div key={i}>
                <dt className="font-medium text-stone-800 inline">{v.terme} — </dt>
                <dd className="text-stone-700 inline">{v.definition}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-stone-400 mt-2 pt-2 border-t border-stone-100">Ces mots deviennent des cartes à réviser dans Quazian.</p>
        </Bulle>
      )}
      {montrerRemarque && retour.remarque_questions && (
        <p className="text-xs text-stone-400 italic">{retour.remarque_questions}</p>
      )}
    </div>
  )
}

// ── Retour VF — reconstruction + architecture, en bulles dédiées ──────────────
export function VueRetourVF({ retour }: { retour: RetourVF }) {
  return (
    <div className="space-y-3">
      {retour.synthese_modele && (
        <Bulle titre="Synthèse modèle" accent="violet">
          <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{retour.synthese_modele}</p>
        </Bulle>
      )}

      {retour.ajouts_verifies?.length > 0 && (
        <Bulle titre="Ce que tu as ajouté en réécrivant" accent="amber">
          <ul className="space-y-2 text-sm">
            {retour.ajouts_verifies.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0" aria-hidden>{a.ancre ? '✓' : '⚠'}</span>
                <span>
                  <mark className="bg-amber-100 text-amber-900 rounded px-0.5">{a.extrait}</mark>
                  {a.note && <span className={a.ancre ? 'text-stone-500' : 'text-red-600'}> — {a.note}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-400 mt-2 pt-2 border-t border-stone-100">
            <span className="bg-amber-100 px-1 rounded">surligné</span> = ce que tu as ajouté ; ⚠ = à vérifier dans le texte.
          </p>
        </Bulle>
      )}

      {retour.nuances_et_erreurs?.length > 0 && (
        <Bulle titre="Nuances et points à revoir" accent="stone">
          <Liste items={retour.nuances_et_erreurs} />
        </Bulle>
      )}

      {(retour.architecture_amont?.length > 0 || retour.architecture_aval_jalons?.length > 0) && (
        <Bulle titre="Architecture de ce que tu as lu" accent="green">
          {retour.architecture_amont?.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-stone-500 mb-1">Ce que tu as déjà vu</p>
              <Liste items={retour.architecture_amont} />
            </div>
          )}
          {retour.architecture_aval_jalons?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-stone-500 mb-1">Jalons à venir</p>
              <Liste items={retour.architecture_aval_jalons} />
            </div>
          )}
        </Bulle>
      )}
    </div>
  )
}

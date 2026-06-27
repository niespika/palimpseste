import type { RetourV1, RetourVF } from '@/app/eleve/modules/aletheia/types'

// Rendu partagé des retours Aletheia (page semaine élève + drill-down prof).
// Objectif ergonomie ado (SPEC §3) : bulles dédiées, priorisées, pas de pavé.

export type Accent = 'violet' | 'amber' | 'green' | 'stone' | 'sky' | 'minium' | 'pigment' | 'or'

export const ACCENT: Record<Accent, string> = {
  violet: 'border-l-liseret',
  amber: 'border-l-attention',
  green: 'border-l-ok',
  stone: 'border-l-bordure',
  sky: 'border-l-info',
  minium: 'border-l-minium',   // rouge #B4452F (Aletheia)
  pigment: 'border-l-pigment', // bleu outremer #2C4A7C
  or: 'border-l-liseret',      // or #B8893B (= liseret Aletheia)
}

export function Bulle({ titre, accent = 'stone', children }: { titre: string; accent?: Accent; children: React.ReactNode }) {
  return (
    <section className={`bg-surface border border-bordure border-l-4 ${ACCENT[accent]} rounded-xl p-4`}>
      <h4 className="text-sm font-medium text-encre mb-2">{titre}</h4>
      {children}
    </section>
  )
}

function Liste({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-encre-douce">
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
          <p className="text-sm text-encre-douce whitespace-pre-wrap">{retour.accord}</p>
        </Bulle>
      )}
      {retour.reponses_questions?.length > 0 && (
        <Bulle titre="Réponses à tes questions" accent="minium">
          <Liste items={retour.reponses_questions} />
        </Bulle>
      )}
      {retour.vocabulaire?.length > 0 && (
        <Bulle titre="Vocabulaire" accent="amber">
          <dl className="space-y-1.5 text-sm">
            {retour.vocabulaire.map((v, i) => (
              <div key={i}>
                <dt className="font-medium text-encre inline">{v.terme} — </dt>
                <dd className="text-encre-douce inline">{v.definition}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muet mt-2 pt-2 border-t border-bordure">Ces mots deviennent des cartes à réviser dans Quazian.</p>
        </Bulle>
      )}
      {montrerRemarque && retour.remarque_questions && (
        <p className="text-xs text-muet italic">{retour.remarque_questions}</p>
      )}
    </div>
  )
}

// ── Retour VF — reconstruction + architecture, en bulles dédiées ──────────────
// `masquerSynthese` : la synthèse est déjà mise en avant en tête de la revue DONE
// → on l'omet dans le détail replié pour éviter le doublon.

export interface BulleVF { id: string; titre: string; accent: Accent; node: React.ReactNode }

// Liste des bulles du retour VF (contenu SANS le cadre Bulle). Partagée entre le
// rendu prof (VueRetourVF, qui re-emballe dans Bulle) et la validation de lecture
// élève (ValidationLecture, qui fournit l'en-tête + case à cocher).
export function bullesVF(retour: RetourVF, masquerSynthese = false): BulleVF[] {
  const bulles: BulleVF[] = []

  if (!masquerSynthese && retour.synthese_modele) {
    bulles.push({
      id: 'synthese',
      titre: 'Synthèse modèle',
      accent: 'violet',
      node: <p className="text-sm text-encre-douce whitespace-pre-wrap leading-relaxed">{retour.synthese_modele}</p>,
    })
  }

  if (retour.ajouts_verifies?.length > 0) {
    bulles.push({
      id: 'ajouts',
      titre: 'Ce que tu as ajouté en réécrivant',
      accent: 'pigment',
      node: (
        <>
          <ul className="space-y-2 text-sm">
            {retour.ajouts_verifies.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0" aria-hidden>{a.ancre ? '✓' : '⚠'}</span>
                <span>
                  <mark className="bg-attention-teinte text-attention rounded px-0.5">{a.extrait}</mark>
                  {a.note && <span className={a.ancre ? 'text-encre-douce' : 'text-retard'}> — {a.note}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muet mt-2 pt-2 border-t border-bordure">
            <span className="bg-attention-teinte px-1 rounded">surligné</span> = ce que tu as ajouté ; ⚠ = à vérifier dans le texte.
          </p>
        </>
      ),
    })
  }

  if (retour.nuances_et_erreurs?.length > 0) {
    bulles.push({
      id: 'nuances',
      titre: 'Nuances et points à revoir',
      accent: 'or',
      node: <Liste items={retour.nuances_et_erreurs} />,
    })
  }

  if (retour.architecture_amont?.length > 0 || retour.architecture_aval_jalons?.length > 0) {
    bulles.push({
      id: 'architecture',
      titre: 'Architecture de ce que tu as lu',
      accent: 'minium',
      node: (
        <>
          {retour.architecture_amont?.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-encre-douce mb-1">Ce que tu as déjà vu</p>
              <Liste items={retour.architecture_amont} />
            </div>
          )}
          {retour.architecture_aval_jalons?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-encre-douce mb-1">Jalons à venir</p>
              <Liste items={retour.architecture_aval_jalons} />
            </div>
          )}
        </>
      ),
    })
  }

  return bulles
}

export function VueRetourVF({ retour, masquerSynthese = false }: { retour: RetourVF; masquerSynthese?: boolean }) {
  return (
    <div className="space-y-3">
      {bullesVF(retour, masquerSynthese).map((b) => (
        <Bulle key={b.id} titre={b.titre} accent={b.accent}>{b.node}</Bulle>
      ))}
    </div>
  )
}

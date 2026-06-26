import BulleRisque from './BulleRisque'
import PastilleNiveau, { type NiveauLettre } from './PastilleNiveau'
import type { RowPilotage } from '@/utils/matrice-pilotage'

// ⚠️ PLACEHOLDER « EN CONSTRUCTION » — architecture visuelle seulement.
// La vue Compétences n'est PAS câblée : pas de référentiel, pas de calcul de
// niveau, aucune donnée. Cases vides « – ». Brancher les vraies données sera un
// lot ultérieur SANS retoucher cette mise en page.

// TODO compétences : remplacer ces libellés statiques par le vrai référentiel
// (liste + ordre), une fois la grille de compétences arrêtée.
const COMPETENCES_PLACEHOLDER = ['Analyser', 'Interpréter', 'Argumenter', 'Problématiser', 'Conceptualiser']

// TODO compétences : interfaces à compléter quand la source de niveau sera décidée
// (auto par module ou saisie prof) et l'échelle confirmée (A→D ou acquis/fragile…).
export interface Competence {
  id: string
  libelle: string
  ordre: number
}
export interface NiveauCompetence {
  competenceId: string
  eleveId: string
  niveau: NiveauLettre | null
}

const ECHELLE: { lettre: NiveauLettre; sens: string }[] = [
  { lettre: 'A', sens: 'maîtrisé' },
  { lettre: 'B', sens: 'acquis' },
  { lettre: 'C', sens: 'en cours' },
  { lettre: 'D', sens: 'fragile' },
]

export default function MatriceCompetences({ lignes }: { lignes: RowPilotage[] }) {
  return (
    <div className="space-y-3">
      {/* Bandeau « en construction » */}
      <div className="bg-attention-teinte border border-dashed border-attention rounded-xl px-4 py-3">
        <p className="font-corps text-sm text-attention">
          <strong>Zone en construction.</strong> La grille de compétences et le calcul des niveaux ne
          sont pas encore définis — cette vue pose l&apos;architecture visuelle (mêmes colonnes-modèle,
          une lettre par case). Aucune donnée réelle.
        </p>
      </div>

      {/* Légende d'échelle */}
      <div className="flex flex-wrap items-center gap-3 font-ui text-xs text-muet">
        <span className="tracking-[0.06em]">ÉCHELLE</span>
        {ECHELLE.map((e) => (
          <span key={e.lettre} className="inline-flex items-center gap-1.5">
            <PastilleNiveau niveau={e.lettre} /> {e.sens}
          </span>
        ))}
      </div>

      {/* Grille — même squelette que l'Activité, ruban d'angle, cases vides */}
      <div className="relative bg-surface border border-dashed border-attention rounded-xl overflow-hidden">
        <div className="pointer-events-none absolute top-4 -right-12 rotate-[34deg] bg-attention text-surface font-ui text-[11px] font-bold tracking-[0.06em] px-12 py-1 z-20">
          EN CONSTRUCTION
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-parchemin-fonce border-b border-bordure">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-parchemin-fonce text-left px-4 py-2.5 w-[150px] sm:w-[190px] border-r border-bordure"
                >
                  <span className="font-ui text-[10px] tracking-[0.06em] text-muet">ÉLÈVE</span>
                </th>
                {COMPETENCES_PLACEHOLDER.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="px-2 py-2.5 min-w-[108px] border-l border-bordure font-ui text-xs font-normal text-encre-douce"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.inscriptionId} className="border-b border-bordure last:border-0">
                  <th scope="row" className="sticky left-0 z-10 bg-surface text-left px-4 py-3 border-r border-bordure">
                    <span className="flex items-center gap-2">
                      {l.enDifficulte ? (
                        <BulleRisque raisons={l.raisons} />
                      ) : (
                        <span className="w-[18px] shrink-0" aria-hidden />
                      )}
                      <span className="font-corps text-[15px] text-encre truncate">{l.nom}</span>
                    </span>
                  </th>
                  {COMPETENCES_PLACEHOLDER.map((c) => (
                    // TODO compétences : injecter ici le PastilleNiveau du vrai niveau.
                    <td key={c} className="px-2 py-2.5 border-l border-bordure align-middle">
                      <PastilleNiveau niveau={null} />
                    </td>
                  ))}
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr>
                  <td
                    colSpan={COMPETENCES_PLACEHOLDER.length + 1}
                    className="px-4 py-8 text-center font-corps text-sm text-muet"
                  >
                    Aucun élève inscrit dans cette classe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-parchemin-fonce/60 border-t border-bordure px-4 py-2.5 text-center font-ui text-xs text-attention">
          compétences &amp; échelle à définir
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { chargerDiagnosticClasse } from './actions'
import { PROFIL_LABELS, type ProfilConcept } from '@/utils/diagnostic'
import { RapportIA } from './RapportIA'

export default async function DiagnosticPage() {
  const { diagnostics, profilesMap, conceptsClasse } = await chargerDiagnosticClasse()

  const eleveIds = Object.keys(diagnostics)

  // Trier les concepts par nombre d'idées fausses + lacunes
  const conceptsTries = Object.entries(conceptsClasse)
    .sort(([, a], [, b]) => (b.idee_fausse * 2 + b.lacune) - (a.idee_fausse * 2 + a.lacune))

  if (eleveIds.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">
        Aucune donnée de quizz disponible. Lance et ferme au moins un quizz pour voir le diagnostic.
      </div>
    )
  }

  return (
    <div>
      <RapportIA />

      {/* Carte de chaleur concept × élève */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-stone-600 mb-3">
          Fragilités par concept — {eleveIds.length} élève{eleveIds.length > 1 ? 's' : ''}
        </h3>

        {/* Légende */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {(['idee_fausse', 'lacune', 'maitrise', 'insuffisant'] as ProfilConcept[]).map((p) => {
            const { label, couleur, bg } = PROFIL_LABELS[p]
            return (
              <span key={p} className={`text-xs px-2 py-0.5 rounded-full border ${bg} ${couleur}`}>
                {label}
              </span>
            )
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="text-left pr-4 py-1 text-stone-400 font-normal min-w-32">Concept</th>
                {eleveIds.map((id) => (
                  <th key={id} className="px-1 py-1 text-stone-400 font-normal">
                    <Link href={`/prof/quazian/diagnostic/${id}`} className="hover:text-stone-700">
                      {profilesMap[id]?.display_name?.split(' ')[0] ?? '?'}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conceptsTries.slice(0, 20).map(([concept]) => (
                <tr key={concept} className="border-t border-stone-50">
                  <td className="pr-4 py-1 text-stone-700 font-medium truncate max-w-40">{concept}</td>
                  {eleveIds.map((eleveId) => {
                    const diag = diagnostics[eleveId]?.find((d) => d.concept_tag === concept)
                    const profil = diag?.profil ?? null
                    const { bg } = profil ? PROFIL_LABELS[profil] : { bg: 'bg-stone-50' }
                    return (
                      <td key={eleveId} className="px-1 py-1 text-center">
                        <div
                          className={`w-6 h-6 rounded ${bg} border mx-auto`}
                          title={profil ? `${PROFIL_LABELS[profil].label} (${diag?.scoreMoyen.toFixed(1)})` : 'Pas de données'}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liste des élèves */}
      <div>
        <h3 className="text-sm font-medium text-stone-600 mb-3">Vue par élève</h3>
        <div className="space-y-2">
          {eleveIds.map((id) => {
            const diag = diagnostics[id] ?? []
            const nIdeesFausses = diag.filter((d) => d.profil === 'idee_fausse').length
            const nLacunes = diag.filter((d) => d.profil === 'lacune').length
            const nMaitrise = diag.filter((d) => d.profil === 'maitrise').length

            return (
              <Link
                key={id}
                href={`/prof/quazian/diagnostic/${id}`}
                className="flex items-center gap-4 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:bg-stone-50 transition-colors"
              >
                <span className="font-medium text-stone-900 flex-1">
                  {profilesMap[id]?.display_name ?? id}
                </span>
                <div className="flex gap-2 text-xs">
                  {nIdeesFausses > 0 && (
                    <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-full">
                      {nIdeesFausses} idée{nIdeesFausses > 1 ? 's' : ''} fausse{nIdeesFausses > 1 ? 's' : ''}
                    </span>
                  )}
                  {nLacunes > 0 && (
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full">
                      {nLacunes} lacune{nLacunes > 1 ? 's' : ''}
                    </span>
                  )}
                  {nMaitrise > 0 && (
                    <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full">
                      {nMaitrise} maîtrisé{nMaitrise > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-stone-400 text-xs">→</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

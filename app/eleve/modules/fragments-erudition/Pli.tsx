// ============================================================================
// FRAGMENTS (élève) — LE PLI : une ligne « ▸ titre · déplier » qui s'ouvre.
// ----------------------------------------------------------------------------
// Handoff `design_handoff_fragments_eleve` §Accordéons : « de simples
// <details><summary> (progressive enhancement, zéro JS) ». Composant SERVEUR,
// donc utilisable depuis `AnalysePubliee` et `EssaiPublie`, qui doivent rester
// serveur (leurs `tuiles…` sont appelées par la page).
//
// `nom` : plusieurs plis du même nom forment un accordéon natif (un seul ouvert).
// ⚠️ `open` ne se calcule jamais depuis l'horloge ni depuis un état client —
//    cf. reference_details_open_hydratation.
// ============================================================================

interface Props {
  titre: React.ReactNode
  /** Ouvert au rendu. Défaut : fermé. */
  ouvert?: boolean
  /** Groupe d'accordéon (attribut `name` de <details>). */
  nom?: string
  /** Ce qui se lit à droite du titre quand le pli est FERMÉ (des lettres, un badge). */
  apercu?: React.ReactNode
  /** Rendu du corps sans marge intérieure (le contenu gère la sienne). */
  nu?: boolean
  /** Habillage du résumé : `carte` (bordure, fond surface) ou `ligne` (fond parchemin foncé, sans bordure). */
  aspect?: 'carte' | 'ligne'
  children: React.ReactNode
}

export default function Pli({ titre, ouvert = false, nom, apercu, nu, aspect = 'carte', children }: Props) {
  const cadre = aspect === 'carte'
    ? 'rounded-xl border border-bordure bg-surface'
    : 'rounded-xl bg-parchemin-fonce'
  return (
    <details name={nom} open={ouvert} className={`group overflow-hidden ${cadre}`}>
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-3 px-4 py-2.5
                          group-open:border-b group-open:border-bordure">
        <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
        <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
        <span className="min-w-0 flex-1 font-ui text-sm font-medium text-encre-douce">{titre}</span>
        {apercu && <span className="shrink-0 group-open:hidden">{apercu}</span>}
        <span className="shrink-0 font-ui text-xs text-muet group-open:hidden">déplier</span>
        <span className="hidden shrink-0 font-ui text-xs text-muet group-open:inline">replier</span>
      </summary>
      <div className={nu ? '' : 'px-4 py-3'}>{children}</div>
    </details>
  )
}

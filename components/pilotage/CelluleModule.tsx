import type { Cellule } from '@/utils/matrice-pilotage'

// Rendu du contenu d'une cellule élève × module selon son état.
//   • action  → chip rouge (« 2 à faire », « 12 à réviser », « 1 à valider »…)
//   • encours → texte sépia (« lecture 3/5 », « 2 en cours »)
//   • ok      → « à jour » en vert
//   • neutre  → « — » discret (module accessible mais rien à montrer)
// (Le cas `absent` — module non donné à la classe — est géré par la cellule
//  parente, qui grise le fond.)

// Une cellule peut porter une SECONDE LIGNE (`detail`) : « 13/94 cartes vues »
// sous « 3 à réviser », « thème validé » sous « 2/3 · 1 à faire ». Elle est
// discrète et ne change jamais la couleur de la première.

function Principal({ cellule }: { cellule: Cellule }) {
  switch (cellule.kind) {
    case 'action':
      return (
        <span className="font-ui text-xs bg-retard-teinte text-retard px-2 py-0.5 rounded-full whitespace-nowrap">
          {cellule.label}
        </span>
      )
    case 'encours':
      return <span className="font-ui text-xs text-encre-douce">{cellule.label}</span>
    case 'ok':
      return <span className="font-ui text-xs text-ok">{cellule.label}</span>
    default:
      return <span className="font-ui text-xs text-muet">{cellule.label}</span>
  }
}

export default function CelluleModule({ cellule }: { cellule: Cellule }) {
  if (!cellule.detail) return <Principal cellule={cellule} />
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <Principal cellule={cellule} />
      <span className="font-ui text-[10.5px] text-muet whitespace-nowrap">{cellule.detail}</span>
    </span>
  )
}

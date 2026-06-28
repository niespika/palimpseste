// Steppers d'avancement d'une semaine Aletheia — partagés élève + fiche prof.
// Les 4 étapes = Lecture · Retour · Réécriture · Retour final (`ETAPES_SEMAINE`).
// Toujours en pigment (plein/courant) ou creux (à venir) — jamais de vert sur la
// fiche prof. Server components (pas d'état).
import { ETAPES_SEMAINE, indexEtape } from '@/app/eleve/modules/aletheia/etapes'
import type { StatutAletheia } from '@/app/eleve/modules/aletheia/types'

// Micro-stepper : 4 points = les 4 étapes. Plein/courant = pigment · creux = à
// venir. DONE = 4 pleins.
export function MicroStepper({ statut, taille = 'normal' }: { statut: StatutAletheia; taille?: 'normal' | 'petit' }) {
  const courant = indexEtape(statut)
  const done = statut === 'DONE'
  const d = taille === 'petit' ? 'w-[7px] h-[7px]' : 'w-2.5 h-2.5'
  return (
    <div className={`flex ${taille === 'petit' ? 'gap-1' : 'gap-1.5'}`} aria-hidden>
      {[0, 1, 2, 3].map((i) => {
        const plein = done || i < courant
        const actif = !done && statut !== 'DRAFT' && i === courant
        return <span key={i} className={`${d} rounded-full ${plein || actif ? 'bg-pigment' : 'border border-bordure'}`} />
      })}
    </div>
  )
}

// Stepper nommé — situe l'avancement avec les libellés des 4 étapes. Fait/courant
// en pigment, ✓ pour les étapes passées (toutes ✓ si DONE → indexEtape = 4).
// `wrap` : passe à la ligne au lieu de scroller (évite scrollbar + libellé tronqué
// sur écran étroit) ; défaut = scroll horizontal (comportement élève d'origine).
export function StepperNomme({ statut, wrap = false }: { statut: StatutAletheia; wrap?: boolean }) {
  const courant = indexEtape(statut)
  return (
    <ol className={`flex items-center text-xs ${wrap ? 'flex-wrap gap-x-1.5 gap-y-1.5' : 'gap-1.5 overflow-x-auto -mx-1 px-1'}`}>
      {ETAPES_SEMAINE.map((label, i) => {
        const fait = i < courant
        const actif = i === courant
        return (
          <li key={label} className="flex items-center gap-1.5 shrink-0">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
              fait || actif ? 'bg-pigment text-surface' : 'bg-parchemin-fonce text-muet'
            }`}>
              {fait ? '✓' : i + 1}
            </span>
            <span className={`font-ui whitespace-nowrap ${actif ? 'text-pigment font-medium' : fait ? 'text-pigment' : 'text-muet'}`}>{label}</span>
            {i < ETAPES_SEMAINE.length - 1 && <span className="text-bordure" aria-hidden>·</span>}
          </li>
        )
      })}
    </ol>
  )
}

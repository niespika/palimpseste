// ============================================================================
// LA COPIE ANNOTÉE — un dépôt, côté professeur, DANS CODEX.
// Trois portes vers le MÊME écran (`EcranCopieAnnotee`), comme la passation.
// Handoff : `design_handoff_copie_annotee/HANDOFF.md` (éprouvé le 03/09).
// ⛔ Derrière `copie_annotee_actif` (OFF) : à OFF, la page dit « à OFF » et ne
//    charge rien — « limiter l'accès pour le moment » (Louis, 03/09). L'écart au
//    piège 41 (les écrans du professeur ne se ferment pas) est assumé et écrit.
// ⚠️ `<div>`, pas `<main>` — la coquille du rôle rend déjà le `<main>` (C5-L4).
// ============================================================================
import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/passation/garde'
import { lireLaPorteCopieAnnotee } from '@/utils/copie/porte'
import { chargerLaCopieAnnotee } from '@/utils/copie/vue'
import { EcranCopieAnnotee } from '@/components/copie/EcranCopieAnnotee'

export default async function CopieAnnoteeCodex(
  { params, searchParams }: {
    params: Promise<{ depotId: string }>
    searchParams: Promise<{ version?: string }>
  },
) {
  const { depotId } = await params
  const { version } = await searchParams
  const { admin } = await garderProf()
  if (!(await lireLaPorteCopieAnnotee(admin))) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <p className="rounded-lg border border-attention bg-attention-teinte p-3 text-sm text-encre">
          <strong>La copie annotée est à OFF.</strong> L’interrupteur <code>copie_annotee_actif</code> s’ouvre à la recette.
        </p>
      </div>
    )
  }
  const vue = await chargerLaCopieAnnotee(admin, depotId, version === 'vf' ? 'vf' : 'v1')
  if (!vue) notFound()
  return (
    <div className="mx-auto max-w-6xl p-4">
      <EcranCopieAnnotee vue={vue} basePassation="/prof/codex/passation" baseCopie="/prof/codex/copie" />
    </div>
  )
}

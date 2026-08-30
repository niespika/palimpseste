import { TuileAccentModule } from '@/components/TuileAccent'

// ⭐ `data-espace="eleve"` — handoff « Codex Exercices (élève) » §2. Il n'ouvre
//    QU'UNE chose : le bouton d'action en vert Codex estompé (#5F7365), déclaré
//    dans `globals.css` sur `[data-module="codex"][data-espace="eleve"]`.
//    ⚠️ Il ne se pose PAS sur `app/prof/codex/layout.tsx` : « côté professeur :
//       rien » (handoff §8) — le pigment plein y reste le bouton.
export default function CodexModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="codex" data-espace="eleve">
      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}

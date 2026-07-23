// =========================================================================
// Exemple : faire hériter le « monde » du module à toute une page.
// À adapter dans app/eleve/modules/[slug]/page.tsx (ou un layout de module).
//
// Le wrapper porte data-module="…" → --pigment, --pigment-teinte et
// --fond-module sont définis pour tout le sous-arbre (cf. globals.css).
// Les enfants utilisent alors : bg-pigment, text-pigment, border-pigment,
// bg-pigment-teinte, ou var(--fond-module) pour le fond de page.
// =========================================================================

import Pastille from '@/components/Pastille'

// slug d'URL → identifiant de module pour la charte
const MODULE_PAR_SLUG: Record<string, 'aletheia'|'codex'|'fragments'|'quazian'> = {
  'aletheia': 'aletheia',
  'codex': 'codex',
  'fragments-erudition': 'fragments',
  'quazian': 'quazian',
}

export default function PageModule({ slug, titre, sousTitre, children }: {
  slug: string
  titre: string
  sousTitre: string
  children: React.ReactNode
}) {
  const module = MODULE_PAR_SLUG[slug]

  return (
    // fond de page = vélin/teinte du module ; tout hérite de --pigment
    <div data-module={module} style={{ background: 'var(--fond-module)' }} className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* En-tête du monde */}
        <header className="flex items-center gap-5 mb-8">
          {module && <Pastille module={module} size={88} />}
          <div>
            <h1 className="font-marque font-semibold text-2xl tracking-wide text-pigment">
              {titre.toUpperCase()}
            </h1>
            <p className="font-titre italic text-xl text-muet mt-0.5">{sousTitre}</p>
          </div>
        </header>

        {/* Contenu — voir les patterns badge/bouton/carte dans le README */}
        {children}
      </div>
    </div>
  )
}

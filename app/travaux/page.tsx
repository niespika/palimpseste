import type { Metadata } from 'next'

// ============================================================================
// LA PAGE DES TRAVAUX — servie par `proxy.ts` quand l'interrupteur `TRAVAUX`
// est levé. Elle ne lit RIEN : ni session, ni base, ni paramètre. C'est
// délibéré — elle doit s'afficher même si Supabase est injoignable, sans quoi
// la page qui annonce la panne tomberait avec elle.
// ============================================================================

export const metadata: Metadata = {
  title: 'Palimpseste — en travaux',
  description: 'Le site est momentanément en travaux.',
}

export default function Travaux() {
  return (
    <main className="min-h-dvh bg-parchemin text-encre flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-marque text-2xl tracking-[0.18em] text-encre">PALIMPSESTE</p>

        <div className="mt-10 rounded-lg border border-bordure bg-surface px-6 py-10">
          <p className="font-titre text-2xl leading-snug text-encre">
            Le site est en travaux pour la fin de la journée.
          </p>
          <p className="font-corps mt-5 text-lg leading-relaxed text-encre-douce">
            Rien de ce que tu as déjà rendu n’est perdu. Reviens plus tard : tes exercices
            t’attendront, et leurs échéances en tiendront compte.
          </p>
        </div>

        <p className="font-ui mt-8 text-sm text-muet">Merci de ta patience.</p>
      </div>
    </main>
  )
}

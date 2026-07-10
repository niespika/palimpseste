// =========================================================================
// components/nav/SceauModule.tsx
// Sceau du module pour la Barre 2 de l'en-tête : disque teinté + sceau RECADRÉ
// (sans nom gravé, assets `pastille-<cle>.png`) en mix-blend multiply, coiffé
// d'un anneau d'or. Distinct de <Pastille> (qui garde les sceaux à nom gravé
// pour les corps de page). Purement présentationnel.
// =========================================================================

import Image from 'next/image'
import { MODULES, type CleModule } from './configModules'

export default function SceauModule({ cle, size = 64 }: { cle: CleModule; size?: number }) {
  const c = MODULES.find((m) => m.cle === cle)!.couleurs

  return (
    <span className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <span
        className="relative inline-flex overflow-hidden"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: c.teinte,
          border: `1px solid ${c.bordureSceau}`,
        }}
      >
        <Image
          src={`/sceaux/pastille-${cle}.png`}
          alt=""
          fill
          sizes={`${size}px`}
          style={{
            objectFit: 'cover',
            filter: 'brightness(1.06) contrast(1.04)',
            mixBlendMode: 'multiply',
          }}
        />
      </span>
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '50%',
          border: '3px solid #B8893B',
          boxShadow: `0 3px 12px rgba(${c.ombreAnneauRgb},.30)`,
        }}
      />
    </span>
  )
}

// =========================================================================
// components/nav/LogoPalimpseste.tsx
// Logo Palimpseste en pastille ronde : le sceau SEUL (médaillon recadré, sans
// le mot « PALIMPSESTE » dessous). Même technique que <Pastille> — disque clair
// + image N&B en mix-blend-mode:multiply — mais sur un fond parchemin neutre
// (le médaillon n'a pas de teinte de module attitrée).
//
// Pré-requis : public/sceaux/palimpseste_medaillon.png (carré, centré sur le
// cercle gravé, sans le mot).
// =========================================================================

import Image from 'next/image'

export default function LogoPalimpseste({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-surface border border-bordure overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src="/sceaux/palimpseste_medaillon.png"
        alt="Palimpseste"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          filter: 'brightness(1.05) contrast(1.05)',
          mixBlendMode: 'multiply',
        }}
      />
    </span>
  )
}

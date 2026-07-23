// =========================================================================
// components/Pastille.tsx
// Le sceau d'un module, posé en « pastille teintée ».
// Technique : disque de la teinte claire du module + image N&B en
// mix-blend-mode:multiply. Le filter brightness(1.09) remonte le papier crème
// du sceau au blanc AVANT le multiply → la zone sous l'image prend exactement
// la même teinte que l'anneau du disque (pas de bord carré visible).
//
// Pré-requis : déposer les 6 PNG dans public/sceaux/ :
//   public/sceaux/palimpseste.png  aletheia.png  codex.png
//                 fragments.png     quazian.png   scriptorium.png
// =========================================================================

import Image from 'next/image'

export type ModuleSceau =
  | 'palimpseste' | 'aletheia' | 'codex'
  | 'fragments' | 'quazian' | 'scriptorium'

// Teinte claire (disque) par module — identique à --pigment-teinte de globals.css
const TEINTE: Record<ModuleSceau, string> = {
  palimpseste: '#EDE6D6',
  aletheia:    '#DDE3EC',
  codex:       '#DCE6DF',
  fragments:   '#E2E3D2',
  quazian:     '#DCE6EC',
  scriptorium: '#E6DDC9',
}

interface Props {
  module: ModuleSceau
  /** Diamètre du disque en px (défaut 48). Le sceau occupe ~88 % pour garder
   *  le nom à l'intérieur du disque. */
  size?: number
  className?: string
}

export default function Pastille({ module, size = 48, className }: Props) {
  const inner = Math.round(size * 0.88)
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: TEINTE[module],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <Image
        src={`/sceaux/${module}.png`}
        alt=""
        width={inner}
        height={inner}
        style={{
          width: inner,
          height: inner,
          objectFit: 'cover',
          filter: 'brightness(1.09) contrast(1.04)',
          mixBlendMode: 'multiply',
        }}
      />
    </span>
  )
}

// Exemples :
//   <Pastille module="aletheia" size={48} />          // carte du tableau de bord
//   <Pastille module="fragments" size={88} />         // en-tête de page de module
//   <Pastille module="palimpseste" size={84} />       // page de connexion

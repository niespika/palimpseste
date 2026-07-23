// =========================================================================
// app/layout.tsx — chargement des 4 polices via next/font/google
// Remplacez la configuration de polices existante par celle-ci. Les variables
// CSS (--police-*) sont consommées par globals.css (@theme → font-marque, etc.)
// =========================================================================

import { Cinzel, Cormorant_Garamond, EB_Garamond, Alegreya_Sans } from 'next/font/google'
import './globals.css'

const marque = Cinzel({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--police-marque',
  display: 'swap',
})
const titre = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--police-titre',
  display: 'swap',
})
const corps = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--police-corps',
  display: 'swap',
})
const ui = Alegreya_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--police-ui',
  display: 'swap',
})

export const metadata = { title: 'Palimpseste' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${marque.variable} ${titre.variable} ${corps.variable} ${ui.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}

// Utilisation des polices dans les composants (classes Tailwind générées par @theme) :
//   font-marque  → Cinzel        (marque « PALIMPSESTE », noms de module en capitales)
//   font-titre   → Cormorant     (titres de page/section : « Bonjour, Camille »)
//   font-corps   → EB Garamond   (texte courant — défaut du <body>)
//   font-ui      → Alegreya Sans (nav, badges, dates, chiffres, boutons)

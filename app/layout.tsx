import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, EB_Garamond, Alegreya_Sans } from "next/font/google";
import "./globals.css";

// 4 rôles typographiques de la charte (cf. design_handoff_charte_palimpseste).
const marque = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--police-marque",
  display: "swap",
});
const titre = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--police-titre",
  display: "swap",
});
const corps = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--police-corps",
  display: "swap",
});
const ui = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--police-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Palimpseste",
  description: "Plateforme pédagogique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${marque.variable} ${titre.variable} ${corps.variable} ${ui.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

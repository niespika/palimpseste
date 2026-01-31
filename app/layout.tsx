import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Palimpseste",
  description: "Authentification simple pour Palimpseste"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Un « livre » Scriptorium dépose plusieurs PDF en une seule Server Action
    // (1 par semaine) ; le plafond par défaut (1 Mo) est trop bas. Action
    // réservée au prof (authentifiée). Voir app/prof/scriptorium/actions.ts.
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;

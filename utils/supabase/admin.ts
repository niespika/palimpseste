import * as React from 'react'
import { createClient } from '@supabase/supabase-js'

function fabriquer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Client avec la clé service_role — ne jamais utiliser côté navigateur
//
// ⭐ 17/09 — UN client par RENDU. Ce client est sans état (ni session ni
//    rafraîchissement) : le partager ne change rien à ce qu'il fait. Mais les
//    lecteurs mémoïsés par `cache()` ont le client pour clé — tant que chaque
//    appelant fabriquait le sien, la même ligne (`scriptorium_params`, surtout)
//    se relisait jusqu'à six fois par page.
//    Hors rendu, `cache` ne mémoïse pas : un client neuf par appel, comme
//    avant. MESURÉ le 17/09 (sonde jetée) : route, Server Action, et leurs
//    `after()` → deux appels, deux clients. Hors de Next (scripts, tests),
//    `cache` n'existe pas : même repli.
// ⛔ SEULE EXCEPTION, mesurée aussi : un `after()` lancé DEPUIS UN RENDU de page
//    garde la mémoire de ce rendu — même client, mêmes réglages mémoïsés, aussi
//    longtemps qu'il tourne. Aucun n'existe aujourd'hui (les 24 `after()` du
//    dépôt partent tous d'une action ou d'une route). Ne pas en lancer un depuis
//    une page s'il doit relire une porte pour pouvoir être coupé en vol.
const memo = (React as { cache?: <T extends (...a: never[]) => unknown>(f: T) => T }).cache
export const createAdminClient: typeof fabriquer = memo ? memo(fabriquer) : fabriquer

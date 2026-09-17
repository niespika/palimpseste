// ============================================================================
// LA LIGNE DES RÉGLAGES — lue UNE fois par rendu (17/09).
//
// `scriptorium_params` est une ligne unique (id = 1, ~1 Ko en prod) qui porte
// tous les interrupteurs. Chaque porte la relisait pour SA colonne : 29 sites de
// lecture, jusqu'à six allers-retours en série sur une seule page élève — pour
// une ligne qui ne change que lorsque le professeur bascule quelque chose.
//
// Ce lecteur rend `{ data, error }` tel que supabase-js le rend : CHAQUE porte
// garde sa propre règle d'échec (« illisible ⇒ fermée », journal ou non,
// tolérance des colonnes absentes). Il ne décide rien à leur place.
//
// ⚠️ `select('*')` et non la liste des colonnes : une colonne absente d'une des
//    deux bases ferait échouer la requête ENTIÈRE, donc fermerait TOUTES les
//    portes d'un coup. Avec `*`, la colonne absente vaut `undefined` — fermée,
//    elle seule.
// ⚠️ Mémoïsé sur le CLIENT : c'est `createAdminClient`, un par rendu, qui fait
//    que tous les appelants tombent sur la même clé. Hors rendu (route, cron,
//    Server Action, et leurs `after()` — mesuré), `cache` ne mémoïse pas : une
//    chaîne qui tourne dix minutes relit la porte à chaque fois, comme avant.
// ⛔ Un `after()` lancé depuis un RENDU, lui, garderait cette mémoire : voir
//    `utils/supabase/admin.ts`.
// ============================================================================
import * as React from 'react'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'

export type LigneDesReglages = Record<string, unknown>

async function lire(
  admin: SupabaseClient
): Promise<{ data: LigneDesReglages | null; error: PostgrestError | null }> {
  const { data, error } = await admin
    .from('scriptorium_params').select('*').eq('id', 1).maybeSingle()
  return { data: (data as LigneDesReglages | null) ?? null, error }
}

const memo = (React as { cache?: <T extends (...a: never[]) => unknown>(f: T) => T }).cache
export const lireLesReglages: typeof lire = memo ? memo(lire) : lire

import 'server-only'
// ============================================================================
// LA TROISIÈME VOIE DU RATTACHEMENT — L'INTERRUPTEUR, `notions_actif`. 10/09/2026.
// Patron : `utils/chaine/porte-cle.ts`, `utils/gabarit/porte.ts`.
// ----------------------------------------------------------------------------
// « Toute fonctionnalité nouvelle naît derrière un flag OFF » (`AGENTS.md`).
// Colonne `scriptorium_params.notions_actif` (`notions_actif.sql`), à OFF.
// ⚠️ Requête SÉPARÉE et TOLÉRANTE : colonne absente (migration non jouée) ou
//    illisible ⇒ OFF. « Une porte illisible se ferme, jamais l'inverse. »
// Ce qu'elle protège, et rien d'autre : dans `filtreDuCoursVu`, l'état
// `cours_etat = 'notions'` d'un sujet ou d'un texte devient servable dès qu'un
// cours VU par une classe de l'élève déclare l'une de ses notions (`01-` §4,
// couche 4 ; C4-L16). Porte fermée : `cours_par_notions_non_lu`, comme hier.
// Décision de Louis, 10/09 : la salve THLP sur « Les métamorphoses du moi » ne
// doit être servie ni aux 1HLP ni au tronc commun — et c'est le cours vu qui
// tient cette frontière, pas le générique.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export async function lireLaPorteNotions(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin
    .from('scriptorium_params').select('notions_actif').eq('id', 1).maybeSingle()
  if (error) return false
  return !!(data as { notions_actif?: boolean } | null)?.notions_actif
}

export async function basculerLaPorteNotions(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ notions_actif: actif })
    .eq('id', 1).select('notions_actif')
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'Le routeur lit les notions : un sujet ou un texte rattaché par notions se sert dès qu’un cours vu par une classe de l’élève déclare l’une de ses notions.'
    : 'Le routeur ne lit plus les notions : un sujet ou un texte rattaché par notions reste écarté, comme avant.' }
}

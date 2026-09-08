import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export type RetourPorteRelecture =
  | { ok: true; message: string; depuis: string | null }
  | { ok: false; message: string }

/** La date est celle du serveur, jamais une date de rattrapage saisie à l'écran. */
export async function basculerLesRetoursARelire(
  admin: SupabaseClient, actif: boolean, depuisAffiche: string | null,
): Promise<RetourPorteRelecture> {
  const depuis = actif ? new Date().toISOString() : null
  let requete = admin.from('scriptorium_params')
    .update({ retours_a_relire_depuis: depuis }).eq('id', 1)
  // Une seconde activation ne repousse jamais la date. Une ancienne page ne
  // peut pas désactiver une ouverture plus récente faite dans un autre onglet.
  requete = actif || depuisAffiche === null
    ? requete.is('retours_a_relire_depuis', null)
    : requete.eq('retours_a_relire_depuis', depuisAffiche)
  const { data, error } = await requete.select('retours_a_relire_depuis')
  if (error) return { ok: false, message: 'Le réglage n’a pas pu être enregistré. Recharge la page puis réessaie.' }
  if (data?.length === 1) return {
    ok: true, depuis: data[0].retours_a_relire_depuis,
    message: actif ? 'Signal activé pour les nouveaux retours.' : 'Signal désactivé.',
  }
  const relue = await admin.from('scriptorium_params')
    .select('retours_a_relire_depuis').eq('id', 1).maybeSingle()
  if (relue.error || !relue.data) return { ok: false, message: 'Ce réglage est indisponible pour le moment.' }
  const actuelle = relue.data.retours_a_relire_depuis as string | null
  if ((actif && actuelle !== null) || (!actif && actuelle === null)) return {
    ok: true, depuis: actuelle,
    message: actif ? 'Le signal était déjà activé : sa date de départ est conservée.' : 'Le signal est déjà désactivé.',
  }
  return { ok: false, message: 'Le réglage a changé dans un autre onglet. Recharge la page avant de le modifier.' }
}

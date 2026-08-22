import 'server-only'
// ============================================================================
// C4 · L5 — LA FACTURE, LUE OÙ ELLE S'ÉCRIT.
// ----------------------------------------------------------------------------
// « L'agrégation par élève, par type et par cycle se fait EN REQUÊTE — et jamais
//   en colonne : deux copies d'un même chiffre finissent par diverger. »
//                                                          — `07-` §1.2
//
// D'où : aucun compteur stocké ici. La dépense du mois se lit sur `api_couts`,
// le nombre d'appels d'un dépôt aussi — « le nombre d'appels d'un étage se lit
// AU NOMBRE DE LIGNES ».
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { couperLaChaine } from './acces'
import { debutDuMois, etatFacture, partConsommee, type EtatFacture } from './couts'

type Admin = ReturnType<typeof createAdminClient>

/**
 * La dépense du mois en cours, tous modules confondus — c'est la facture.
 *
 * ⚠️ LA SOMME SE FAIT EN BASE. Charger les lignes pour les additionner côté
 *    client passait sous le plafond de lignes de PostgREST (1000 par défaut),
 *    QUI NE SIGNALE RIEN : `error` reste nul, et la somme se fige sur un
 *    sous-total. La coupure automatique et le plafond mensuel cessaient alors
 *    d'exister exactement au moment où ils servent — au delà de mille appels
 *    dans le mois, c'est-à-dire dès la première classe.
 *
 * La fonction `chaine_depense_du_mois` est posée par `c4_l5_chaine_complement.sql`.
 * En son absence, on RETOMBE sur la pagination plutôt que sur un chiffre faux.
 */
export async function depenseDuMois(admin: Admin, maintenant = new Date()): Promise<number> {
  const depuis = debutDuMois(maintenant)
  const { data, error } = await admin.rpc('chaine_depense_du_mois', { depuis })
  if (!error && typeof data === 'number') return data
  if (error) {
    console.error(`[chaine] somme en base indisponible (${error.code} ${error.message}) — `
      + 'repli sur la pagination')
  }
  return depenseParPages(admin, depuis)
}

/** Le repli : on pagine, et on ne s'arrête que quand une page revient courte. */
async function depenseParPages(admin: Admin, depuis: string): Promise<number> {
  const PAGE = 1000
  let total = 0
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await admin
      .from('api_couts').select('cout')
      .gte('created_at', depuis)
      .order('created_at', { ascending: true })
      .range(debut, debut + PAGE - 1)
    if (error) {
      // Une facture qu'on ne sait pas lire ne doit pas ouvrir les vannes : on rend
      // +∞, la chaîne se coupe, et le motif part au journal.
      console.error(`[chaine] facture ILLISIBLE — ${error.code} ${error.message}`)
      return Number.POSITIVE_INFINITY
    }
    const lignes = (data ?? []) as Array<{ cout: number }>
    total += lignes.reduce((s, l) => s + Number(l.cout || 0), 0)
    if (lignes.length < PAGE) return total
  }
}

/** Le nombre d'appels DÉJÀ journalisés pour un dépôt — le plafond par dépôt le lit. */
export async function appelsDuDepot(admin: Admin, depotId: string): Promise<number> {
  const { count, error } = await admin
    .from('api_couts').select('id', { count: 'exact', head: true }).eq('depot_id', depotId)
  if (error) {
    console.error(`[chaine] appels du dépôt ILLISIBLES — ${error.code} ${error.message}`)
    return Number.POSITIVE_INFINITY
  }
  return count ?? 0
}

export interface VerdictFacture {
  etat: EtatFacture
  depense: number
  plafond: number
  part: number | null
}

/**
 * Le contrôle qui précède tout traitement. À la coupure, il bascule
 * l'interrupteur de la chaîne — et l'appelant laisse les dépôts EN FILE.
 *
 * L'alerte à 70 % n'a pas d'écran : le §1 n'en nomme aucun, et « une donnée que
 * rien ne nomme se signale, elle ne s'invente pas » (piège 5). Elle part donc en
 * TRACE SERVEUR, comme le signalement d'import de C4-L8 avant son écran.
 */
export async function controlerLaFacture(
  admin: Admin, plafondMensuelUsd: number, maintenant = new Date(),
): Promise<VerdictFacture> {
  const depense = await depenseDuMois(admin, maintenant)
  const f = { depenseMois: depense, plafondMensuel: plafondMensuelUsd }
  const etat = etatFacture(f)
  const part = partConsommee(f)
  if (etat === 'alerte') {
    console.error(`[chaine] ALERTE FACTURE — ${depense.toFixed(4)} $ sur un plafond de `
      + `${plafondMensuelUsd} $ (${part == null ? '?' : Math.round(part * 100)} %). `
      + 'Seuil du dispositif : 70 % (07- §2, C4-L5).')
  }
  if (etat === 'coupure') {
    await couperLaChaine(admin, `plafond mensuel atteint : ${depense.toFixed(4)} $ / ${plafondMensuelUsd} $`)
  }
  return { etat, depense, plafond: plafondMensuelUsd, part }
}

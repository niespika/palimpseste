import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CHAMPS_IDENTITE, memeIdentiteDeMesure } from './deplacement'
import { lireEtatDeConception } from './residu-serveur'
import type { EtatDeConception } from './residu'

// ============================================================================
// L'ENTRETIEN D'UNE CONCEPTION — ce que la page de passation doit savoir pour
// proposer de RÉUNIR un doublon ou de SUPPRIMER un résidu.
// ----------------------------------------------------------------------------
// Un seul chargeur pour les DEUX modules : « c'est le MÊME FLUX dans deux
// modules », et le résidu trouvé sur 1HLP le 26/08 était une LECTURE — donc
// invisible depuis Codex. Un bandeau posé dans un seul module aurait laissé
// l'autre sans issue.
// ============================================================================

export interface CopieVue { depotId: string; eleve: string; copie: string | null; aDeposé: boolean }

export interface EntretienDeConception {
  /** Rattachée à une ligne vivante, ou résidu (et pourquoi). */
  etat: EtatDeConception
  /** Une autre conception IDENTIQUE POUR LA MESURE, dans la même classe. */
  jumelleId: string | null
  /** Les copies déplaçables — celles qui portent quelque chose. */
  copiesRemises: { depotId: string; nom: string; remise: boolean }[]
  /** Vrai si aucune copie écrite n'est rattachée : la suppression est envisageable. */
  aucuneCopie: boolean
}

export async function chargerEntretienDeConception(
  admin: SupabaseClient, exerciceId: string, copies: readonly CopieVue[],
): Promise<EntretienDeConception> {
  const etat = await lireEtatDeConception(admin, exerciceId)

  // La jumelle : même classe, même identité de mesure. La comparaison porte sur
  // tous les champs qui entrent dans le jugement (`deplacement.ts`), jamais sur
  // le titre affiché.
  const champs = ['id', ...CHAMPS_IDENTITE].join(', ')
  const { data: moi } = await admin.from('exercices').select(champs).eq('id', exerciceId).maybeSingle()
  const source = (moi ?? null) as unknown as Record<string, unknown> | null
  let jumelleId: string | null = null
  if (source?.classe_id) {
    const { data: voisines } = await admin
      .from('exercices').select(champs).eq('classe_id', source.classe_id as string).neq('id', exerciceId)
    const j = ((voisines ?? []) as unknown as Array<Record<string, unknown>>)
      .find((e) => memeIdentiteDeMesure(source, e))
    jumelleId = j ? (j.id as string) : null
  }

  const marquees = copies.map((c) => ({
    depotId: c.depotId, nom: c.eleve, remise: !!c.copie || c.aDeposé,
  }))
  return {
    etat,
    jumelleId,
    copiesRemises: marquees,
    aucuneCopie: marquees.every((c) => !c.remise),
  }
}

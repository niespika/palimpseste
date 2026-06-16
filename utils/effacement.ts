import type { SupabaseClient } from '@supabase/supabase-js'

// ----------------------------------------------------------------------------
// Purge du stockage liée à l'effacement (Lot 2).
// Les cascades SQL (inscription_id ON DELETE CASCADE) suppriment les LIGNES du
// travail élève, mais PAS les fichiers dans les buckets. Pour un effacement
// complet (vie privée), on COLLECTE les chemins depuis les lignes AVANT la
// suppression, puis on RETIRE les fichiers APRÈS le succès de la suppression DB.
// Scopé par inscription → ne touche jamais les fichiers d'une autre classe.
// ----------------------------------------------------------------------------

export interface CheminsStockage {
  fragments: string[]
  essais: string[]
  oraux: string[]
  codex: string[]
}

/** Collecte (sans rien supprimer) tous les chemins de fichiers des inscriptions. */
export async function collecterCheminsInscriptions(
  admin: SupabaseClient,
  inscriptionIds: string[]
): Promise<CheminsStockage> {
  const vide: CheminsStockage = { fragments: [], essais: [], oraux: [], codex: [] }
  if (inscriptionIds.length === 0) return vide

  // fragments (photos des dépôts)
  const { data: depots } = await admin
    .from('fragments_depots').select('id').in('inscription_id', inscriptionIds)
  const depotIds = (depots ?? []).map((d) => d.id as string)
  const { data: photos } = depotIds.length > 0
    ? await admin.from('fragments_photos').select('storage_path').in('depot_id', depotIds)
    : { data: [] }

  // essais (photos)
  const { data: essais } = await admin
    .from('fragments_essais').select('id').in('inscription_id', inscriptionIds)
  const essaiIds = (essais ?? []).map((e) => e.id as string)
  const { data: essaiPhotos } = essaiIds.length > 0
    ? await admin.from('fragments_essais_photos').select('storage_path').in('essai_id', essaiIds)
    : { data: [] }

  // oraux (audio)
  const { data: oraux } = await admin
    .from('fragments_oraux').select('storage_path').in('inscription_id', inscriptionIds)

  // codex (manuscrits V1 + V-finale, tableaux de chemins)
  const { data: travaux } = await admin
    .from('codex_travaux').select('photos_v1, photos_vf').in('inscription_id', inscriptionIds)

  const garder = (xs: (string | null)[]) => xs.filter((x): x is string => !!x)

  return {
    fragments: garder((photos ?? []).map((p) => p.storage_path as string | null)),
    essais: garder((essaiPhotos ?? []).map((p) => p.storage_path as string | null)),
    oraux: garder((oraux ?? []).map((o) => o.storage_path as string | null)),
    codex: garder((travaux ?? []).flatMap((t) => [
      ...((t.photos_v1 as string[] | null) ?? []),
      ...((t.photos_vf as string[] | null) ?? []),
    ])),
  }
}

/** Retire les fichiers collectés, bucket par bucket. */
export async function retirerFichiers(admin: SupabaseClient, chemins: CheminsStockage): Promise<void> {
  if (chemins.fragments.length > 0) await admin.storage.from('fragments').remove(chemins.fragments)
  if (chemins.essais.length > 0) await admin.storage.from('essais').remove(chemins.essais)
  if (chemins.oraux.length > 0) await admin.storage.from('oraux').remove(chemins.oraux)
  if (chemins.codex.length > 0) await admin.storage.from('codex').remove(chemins.codex)
}

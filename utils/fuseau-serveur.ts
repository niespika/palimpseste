import 'server-only'
import { cache } from 'react'
import { createAdminClient } from '@/utils/supabase/admin'
import { FUSEAU_DEFAUT } from '@/utils/fuseau'

// ════════════════════════════════════════════════════════════════════════════
// Lecture du fuseau d'affichage configuré (singleton calendrier_params, id=1).
// SEUL point d'accès au fuseau → couture pour un futur fuseau « par prof » (il
// suffira de résoudre le bon prof ici, sans toucher aux ~30 call-sites).
//
// Enveloppé dans React `cache()` : une seule requête par rendu, même si plusieurs
// composants l'appellent. Best-effort : table absente / erreur → défaut (Montréal).
// ════════════════════════════════════════════════════════════════════════════

export const lireFuseau = cache(async (): Promise<string> => {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('calendrier_params').select('fuseau').eq('id', 1).maybeSingle()
    return (data?.fuseau as string | null)?.trim() || FUSEAU_DEFAUT
  } catch (e) {
    console.error('[fuseau] lireFuseau :', e)
    return FUSEAU_DEFAUT
  }
})

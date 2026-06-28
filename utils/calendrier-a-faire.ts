import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'

// Dérivation calendrier → « à faire » (famille 2 de la spec §7) : une échéance
// proche ENGENDRE une tâche. On n'affiche jamais l'événement nu ici (il est sur
// le calendrier) : seulement l'ACTION qu'il rend nécessaire. Les règles vivent
// ici (le « à faire » consomme le calendrier).

export interface TacheCalendrier {
  id: string
  label: string
  echeance: string // YYYY-MM-DD
  classeNom: string | null
  href: string
}

function un<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null
  return x ?? null
}

/**
 * Tâches déclenchées par l'approche d'une échéance (fenêtre `joursAvant`).
 * v1 : épreuve proche dont les dépôts ne sont pas encore ouverts → « ouvrir les
 * dépôts ». Conçu pour accueillir d'autres règles (tirage d'orateur, etc.).
 */
export async function tachesDeriveesDuCalendrier(joursAvant = 10): Promise<TacheCalendrier[]> {
  const supabase = await createClient()
  const today = jourDansFuseau(new Date(), await lireFuseau())
  const fin = toISODate(addDaysUTC(new Date(today + 'T00:00:00Z'), joursAvant))
  const taches: TacheCalendrier[] = []

  // Essais Fragments proches, dépôts non ouverts → action « ouvrir les dépôts ».
  const { data: eps } = await supabase
    .from('fragments_essais_classes')
    .select('essai_id, classe_id, date_essai, depots_ouverts, fragments_essais_epreuves(titre), classes(nom)')
    .gte('date_essai', today)
    .lte('date_essai', fin)
  for (const e of eps ?? []) {
    if (e.depots_ouverts) continue
    const titre = un<{ titre: string }>(e.fragments_essais_epreuves)?.titre ?? 'Essai'
    const nom = un<{ nom: string }>(e.classes)?.nom ?? null
    taches.push({
      id: `essai-${e.essai_id}-${e.classe_id}`,
      label: `Ouvrir les dépôts — ${titre}`,
      echeance: e.date_essai,
      classeNom: nom,
      href: `/prof/fragments-erudition/essais/${e.essai_id}`,
    })
  }

  taches.sort((a, b) => a.echeance.localeCompare(b.echeance))
  return taches
}

import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'

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
  const today = new Date().toISOString().slice(0, 10)
  const fin = toISODate(addDaysUTC(new Date(today + 'T00:00:00Z'), joursAvant))
  const taches: TacheCalendrier[] = []

  // Épreuves Fragments proches, dépôts non ouverts → action « ouvrir les dépôts ».
  const { data: eps } = await supabase
    .from('fragments_epreuves_classes')
    .select('epreuve_id, classe_id, date_epreuve, depots_ouverts, fragments_epreuves(titre), classes(nom)')
    .gte('date_epreuve', today)
    .lte('date_epreuve', fin)
  for (const e of eps ?? []) {
    if (e.depots_ouverts) continue
    const titre = un<{ titre: string }>(e.fragments_epreuves)?.titre ?? 'Épreuve'
    const nom = un<{ nom: string }>(e.classes)?.nom ?? null
    taches.push({
      id: `epreuve-${e.epreuve_id}-${e.classe_id}`,
      label: `Ouvrir les dépôts — ${titre}`,
      echeance: e.date_epreuve,
      classeNom: nom,
      href: `/prof/fragments-erudition/epreuves/${e.epreuve_id}`,
    })
  }

  taches.sort((a, b) => a.echeance.localeCompare(b.echeance))
  return taches
}

import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { lireGatePlanActif } from '@/utils/plan-exercices'
import { dateEffectiveSemaine, libelleTypeExercice } from '@/utils/plan-cadence'

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
  urgence?: 'retard' // échéance passée (exercice à concevoir) → priorité, tri en tête
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

  // Exercices « à concevoir » des plans d'évaluation VALIDÉS (§7 famille 2, gate).
  // A1 : échéance proche (∈ [today, fin]) → « à concevoir ». A2 : échéance passée →
  // « en retard » (urgence, triée en tête ci-dessous). Gate OFF/absent → bloc inerte
  // (aucune tâche de plan). Lecture via `admin` (tables du plan en RLS prof-only) ;
  // labels GÉNÉRIQUES par type (jamais titre/note — anti-spoiler, §8bis).
  const admin = createAdminClient()
  if (await lireGatePlanActif(admin)) {
    const { data: plans } = await admin
      .from('scriptorium_plans_evaluation')
      .select('id, classe_id, classes(nom)')
      .eq('statut', 'valide')
      .is('supprime_at', null)
    const planRows = plans ?? []
    if (planRows.length > 0) {
      const nomParPlan = new Map<string, string | null>()
      const classeParPlan = new Map<string, string>()
      for (const p of planRows) {
        nomParPlan.set(p.id as string, un<{ nom: string }>(p.classes)?.nom ?? null)
        classeParPlan.set(p.id as string, p.classe_id as string)
      }
      const { data: exos } = await admin
        .from('scriptorium_exercices_planifies')
        .select('id, plan_id, type_exercice, diagnostique, lieu, semaine_lundi, jour_prevu')
        .in('plan_id', planRows.map((p) => p.id as string))
        .eq('ancrage', 'semaine')
        .eq('statut', 'a_concevoir')
        .is('supprime_at', null)
      for (const e of exos ?? []) {
        // Échéance figée (§4.6) : jour_prevu sinon dimanche (maison) / lundi (classe).
        const echeance = dateEffectiveSemaine(e.semaine_lundi as string, (e.jour_prevu as string | null) ?? null, e.lieu as 'classe' | 'maison')
        const enRetard = echeance < today
        // Fenêtre : en retard (passé) OU à concevoir dans [today, fin]. Au-delà = pas encore.
        if (!enRetard && echeance > fin) continue
        const planId = e.plan_id as string
        const libelle = libelleTypeExercice(e.type_exercice as string, e.diagnostique as boolean)
        taches.push({
          id: `exo-${e.id}`,
          label: `${enRetard ? 'Exercice en retard' : 'Exercice à concevoir'} — ${libelle}`,
          echeance,
          classeNom: nomParPlan.get(planId) ?? null,
          href: `/prof/scriptorium?vue=evaluations&classe=${classeParPlan.get(planId)}`,
          ...(enRetard ? { urgence: 'retard' as const } : {}),
        })
      }
    }
  }

  // En retard d'abord (échéance passée), puis par échéance croissante. Gate OFF →
  // aucune tâche `urgence` → ordre identique à l'ancien tri (byte-compatible).
  taches.sort((a, b) => {
    const ra = a.urgence === 'retard' ? 0 : 1
    const rb = b.urgence === 'retard' ? 0 : 1
    return ra - rb || a.echeance.localeCompare(b.echeance)
  })
  return taches
}

import 'server-only'
// Garde + palette PARTAGÉS par les actions du plan d'évaluation (instance : actions.ts)
// ET du modèle class-agnostique (modele-actions.ts). Module server-only (PAS 'use server')
// pour pouvoir exporter un helper non-action retournant un client Supabase.
import { createClient } from '@/utils/supabase/server'
import { lireGatePlanActif } from '@/utils/plan-exercices'

// Prof + gate ON. Retourne { supabase, userId } ou { error }. Le gate OFF ne doit jamais
// écrire — l'invariant « inerte » vaut aussi côté écriture (instance ET modèle).
export async function verifierProfGate(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') return { error: 'Accès refusé.' }
  if (!(await lireGatePlanActif(supabase))) return { error: 'Le plan d’évaluation est désactivé.' }
  return { supabase, userId: user.id }
}

export function estLundi(iso: string): boolean {
  return (new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7 === 0
}

// Palette d'ajout manuel (ancrage 'semaine'). Clé = ID DE PALETTE, PAS type_exercice :
// l'écriture/la lecture existent en 2 variantes (formative maison / diagnostique classe),
// donc la clé les distingue. Chaque entrée porte la combinaison canonique complète du
// CHECK exercices_typologie_chk / modele_exos_typologie_chk (dont `diagnostique`).
// Diagnostics + Bac Blanc sont EN CLASSE → sur l'INSTANCE ils naissent sans jour (« à
// caler » §5.6) ; sur le MODÈLE ils n'ont pas de jour du tout (posé par classe après assignation).
export const TYPE_MANUEL: Record<string, {
  type_exercice: string
  diagnostique: boolean
  nature: 'formatif' | 'evaluatif'
  lieu: 'classe' | 'maison'
  module: string
}> = {
  ecriture:      { type_exercice: 'ecriture',     diagnostique: false, nature: 'formatif',  lieu: 'maison', module: 'codex' },
  lecture:       { type_exercice: 'lecture',      diagnostique: false, nature: 'formatif',  lieu: 'maison', module: 'aletheia' },
  quiz:          { type_exercice: 'quiz',         diagnostique: false, nature: 'evaluatif', lieu: 'classe', module: 'quazian' },
  examen_livre:  { type_exercice: 'examen_livre', diagnostique: false, nature: 'evaluatif', lieu: 'classe', module: 'aletheia' },
  ecriture_diag: { type_exercice: 'ecriture',     diagnostique: true,  nature: 'evaluatif', lieu: 'classe', module: 'codex' },
  lecture_diag:  { type_exercice: 'lecture',      diagnostique: true,  nature: 'evaluatif', lieu: 'classe', module: 'aletheia' },
  bac_blanc:     { type_exercice: 'bac_blanc',    diagnostique: false, nature: 'evaluatif', lieu: 'classe', module: 'codex' },
}

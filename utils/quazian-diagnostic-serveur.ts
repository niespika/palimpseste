import 'server-only'
// ============================================================================
// C6 · L1 — LE DIAGNOSTIC DE RÉTENTION PAR CIBLE, RÉPARÉ.
// ----------------------------------------------------------------------------
// ⭐ POURQUOI LE CORPS VIT ICI ET LA GARDE LÀ-BAS. La convention de couture
//    demande d'éprouver ce qu'on répare **PAR EXÉCUTION, jamais par lecture** —
//    or `chargerDiagnosticParUnite` est une server action : elle lit les cookies
//    de la requête (`verifierProf`) et **n'est pas appelable depuis un script de
//    recette**. Le corps déménage donc ici, l'action reste la GARDE DE RÔLE, et
//    le script de couture appelle exactement la ligne de code que l'écran
//    appelle. *Même partage que `utils/pilotage/gestes-serveur.ts`.*
//
// ⭐⭐ C6-L1 — LES DEUX FILS CASSÉS DU DIAGNOSTIC, RÉPARÉS DANS LE MÊME GESTE.
// 
// « Ranger un écran qui ne montre rien n'est pas le ranger » (arbitrage ② de
// Louis, 27/08). Cet écran était DOUBLEMENT MUET, et les deux fils étaient
// nommés depuis le 14/08 (`IDEES_post_rentree.md`, « renvoyé à C6 ») :
// 
// (a) il demandait `scriptorium_unites` où `type='unite'` → **ZÉRO LIGNE**
// depuis la réorganisation du Scriptorium (reconstaté le 28/08 : 0 en bac
// à sable comme en production) ;
// (b) il agrégeait les réponses par `quazian_quizzes.scope_unites` — colonne
// que **les quiz créés depuis C7-L1 laissent vide** au profit de
// `scope_contenus` (reconstaté : le seul quiz du bac à sable porte
// `scope_contenus`, et `scope_unites` vide).
// Résultat : l'écran ne montrait rien, **même une fois des quizz passés**.
// 
// ⭐ LE CORRECTIF EST DÉJÀ ÉPROUVÉ AILLEURS, ET ON LE RÉUTILISE TEL QUEL :
// `chargerCiblesQuazian` (`utils/quazian-cibles.ts`) — c'est exactement le
// geste que Codex a reçu le 14/08 (`lireUnitesScriptorium` → `lireCiblesCodex`).
// Elle rend l'ARC BI-SOURCE : les contenus (Textes et Cours de la
// bibliothèque, le monde d'aujourd'hui) ET les unités héritées, s'il en
// reste. ⛔ On ne la réécrit pas.
// 
// ⛔ ET LE DIAGNOSTIC NE PRODUIT AUCUNE LETTRE. « Quazian mesure sa rétention en
// continu et n'écrit pas dans le profil : c'est le signal du renvoi hors
// routeur, jamais une lettre » (`01-` §6, R4). Il se RANGE à côté de la
// matrice ; il n'entre dans aucune cellule.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { diagnostiquerEleve } from '@/utils/diagnostic'
import { chargerCiblesQuazian } from '@/utils/quazian-cibles'

export interface DiagnosticParCible {
  /** Les cibles vivantes de Quazian — l'ARC BI-SOURCE : contenus ET unités. */
  unites: Array<{ id: string; label: string }>
  parUnite: Record<string, {
    concepts: Record<string, { idee_fausse: number; lacune: number; maitrise: number }>
    nbEleves: number
  }>
}

export async function chargerLeDiagnosticParCible(
  client: SupabaseClient,
): Promise<DiagnosticParCible> {
  const [cibles, { data: quizzes }, { data: reponses }] = await Promise.all([
    chargerCiblesQuazian(client),
    // ⭐ LES DEUX BRAS DE PORTÉE, ET PAS UN SEUL : `scope_contenus` est celui des
    //    quiz d'aujourd'hui, `scope_unites` celui de l'ancien monde. Lire l'un
    //    sans l'autre est exactement le second fil cassé.
    client.from('quazian_quizzes').select('id, scope_unites, scope_contenus'),
    client
      .from('quazian_answers')
      .select(`
        score,
        quazian_sessions!inner(eleve_id, quiz_id),
        quazian_questions!inner(concept_tag)
      `)
      .not('score', 'is', null),
  ])

  const unites = cibles.map((c: { id: string; label: string }) => ({ id: c.id, label: c.label }))

  const scopeByQuiz = new Map<string, string[]>()
  for (const q of quizzes ?? []) {
    // L'UNION des deux bras. Un quiz n'en porte qu'un (arc exclusif), mais la
    // lecture n'a pas à le savoir : l'union est vraie dans les deux mondes.
    scopeByQuiz.set(q.id as string, [
      ...((q.scope_contenus ?? []) as string[]),
      ...((q.scope_unites ?? []) as string[]),
    ])
  }

  // (unité → élève → [{concept, score}])
  const parUniteEleve = new Map<string, Map<string, Array<{ concept_tag: string; score: number }>>>()
  for (const r of reponses ?? []) {
    const s = r.quazian_sessions as unknown as { eleve_id: string; quiz_id: string }
    const qst = r.quazian_questions as unknown as { concept_tag: string }
    for (const u of scopeByQuiz.get(s.quiz_id) ?? []) {
      let parEleve = parUniteEleve.get(u)
      if (!parEleve) { parEleve = new Map(); parUniteEleve.set(u, parEleve) }
      const arr = parEleve.get(s.eleve_id) ?? []
      arr.push({ concept_tag: qst.concept_tag, score: r.score })
      parEleve.set(s.eleve_id, arr)
    }
  }

  type ConceptStat = { idee_fausse: number; lacune: number; maitrise: number }
  type AggUnite = { concepts: Record<string, ConceptStat>; nbEleves: number }
  const parUnite: Record<string, AggUnite> = {}
  for (const [uniteId, parEleve] of parUniteEleve) {
    const concepts: Record<string, ConceptStat> = {}
    for (const reps of parEleve.values()) {
      for (const d of diagnostiquerEleve(reps)) {
        if (!concepts[d.concept_tag]) concepts[d.concept_tag] = { idee_fausse: 0, lacune: 0, maitrise: 0 }
        if (d.profil === 'idee_fausse') concepts[d.concept_tag].idee_fausse++
        else if (d.profil === 'lacune') concepts[d.concept_tag].lacune++
        else if (d.profil === 'maitrise') concepts[d.concept_tag].maitrise++
      }
    }
    parUnite[uniteId] = { concepts, nbEleves: parEleve.size }
  }

  return { unites, parUnite }
}

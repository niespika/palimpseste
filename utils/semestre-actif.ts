import 'server-only'
import { cache } from 'react'
import { createAdminClient } from '@/utils/supabase/admin'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { jourDansFuseau } from '@/utils/fuseau'
import { semestreActifAttendu, type SemestreBornes } from '@/utils/calendrier-grille'

// ════════════════════════════════════════════════════════════════════════════
// Matérialisation du semestre actif — le drapeau se CALCULE, il ne se saisit plus.
// ----------------------------------------------------------------------------
// `semesters.is_active` reste une colonne : une quinzaine de lectures font
// `.eq('is_active', true)` (Fragments, Quazian, tableaux de bord, santé…) et on ne
// les recâble pas dans ce lot. Mais la valeur est désormais DÉDUITE de la date du
// jour par `semestreActifAttendu` (fonction pure, testée) ; ici on se contente de
// la coucher en base quand elle diffère.
//
// Trois contraintes portées par le lot :
//  - « aujourd'hui » se lit dans le FUSEAU DE L'ÉCOLE, jamais en heure locale du
//    serveur ni en UTC brut (un rendu à 20 h à Toronto est déjà « demain » en UTC).
//  - l'écriture passe par `createAdminClient()` : la policy `semesters` est
//    prof-only (calendrier_c1a.sql §4) et la bascule doit avoir lieu même si c'est
//    un ÉLÈVE qui ouvre l'app le premier ce matin-là.
//  - le point d'appel se CHOISIT : `app/prof/layout.tsx` et `app/eleve/layout.tsx`,
//    les deux seuls endroits traversés par tout le monde. Ne pas le semer ailleurs.
//
// Idempotente et SILENCIEUSE : n'écrit que si le drapeau en base diffère de
// l'attendu (cas quasi-total : une lecture, zéro écriture), et n'échoue jamais
// bruyamment — une matérialisation en panne ne doit pas empêcher une page de
// s'afficher.
//
// Latence d'un rendu : appelée depuis un layout, elle tourne pendant que la page
// se rend (Next les évalue en parallèle). Le jour de la bascule S1→S2, la toute
// première navigation peut donc encore lire l'ancien drapeau ; la suivante est
// juste. Sans conséquence à l'usage (la règle 2 rend le prochain semestre actif
// des semaines à l'avance), mais dit ici plutôt que supposé.
// ════════════════════════════════════════════════════════════════════════════

type LigneSemestre = SemestreBornes & { is_active: boolean; archived_at: string | null }

async function lireSemestres(
  admin: ReturnType<typeof createAdminClient>
): Promise<LigneSemestre[] | null> {
  const res = await admin.from('semesters').select('id, start_date, end_date, is_active, archived_at')
  if (!res.error) return (res.data ?? []) as LigneSemestre[]
  // Dégradation si la migration `archived_at` n'est pas appliquée (patron de
  // config/page.tsx) : tous les semestres sont alors traités comme vivants.
  const repli = await admin.from('semesters').select('id, start_date, end_date, is_active')
  if (repli.error) return null
  return ((repli.data ?? []) as Omit<LigneSemestre, 'archived_at'>[]).map((s) => ({
    ...s,
    archived_at: null,
  }))
}

/**
 * Aligne `semesters.is_active` sur le semestre attendu à la date du jour.
 * Renvoie l'identifiant retenu (ou null), et si une écriture a eu lieu.
 * Enveloppée dans React `cache()` : une seule exécution par requête, même si
 * plusieurs composants l'appellent.
 */
export const materialiserSemestreActif = cache(
  async (): Promise<{ actif: string | null; ecrit: boolean }> => {
    try {
      const admin = createAdminClient()
      // Les deux lectures en parallèle : elles sont indépendantes, et cet appel est
      // sur le chemin de CHAQUE navigation — les enchaîner doublerait la latence.
      const [rows, fuseau] = await Promise.all([lireSemestres(admin), lireFuseau()])
      if (rows === null) return { actif: null, ecrit: false }

      const aujourdhui = jourDansFuseau(new Date(), fuseau)
      const vivants = rows.filter((s) => !s.archived_at)
      const attendu = semestreActifAttendu(vivants, aujourdhui)

      // Un semestre ARCHIVÉ peut avoir gardé le drapeau (l'archivage d'une année
      // porte désormais sur les deux semestres, actif compris) : on éteint sur
      // TOUTES les lignes, pas seulement les vivantes, sinon les lecteurs qui font
      // `.eq('is_active', true).maybeSingle()` tombent sur deux lignes.
      const aEteindre = rows.filter((s) => s.is_active && s.id !== attendu).map((s) => s.id)
      const cible = attendu ? rows.find((s) => s.id === attendu) : undefined
      const aAllumer = !!cible && !cible.is_active

      if (aEteindre.length === 0 && !aAllumer) return { actif: attendu, ecrit: false }

      // Éteindre d'abord : à aucun instant deux lignes ne portent le drapeau.
      if (aEteindre.length > 0) {
        const { error } = await admin.from('semesters').update({ is_active: false }).in('id', aEteindre)
        if (error) {
          console.error('[calendrier] matérialisation du semestre actif (extinction) :', error.message)
          return { actif: attendu, ecrit: false }
        }
      }
      if (aAllumer && attendu) {
        const { error } = await admin.from('semesters').update({ is_active: true }).eq('id', attendu)
        if (error) {
          console.error('[calendrier] matérialisation du semestre actif (allumage) :', error.message)
          return { actif: attendu, ecrit: false }
        }
      }
      return { actif: attendu, ecrit: true }
    } catch (e) {
      console.error('[calendrier] matérialisation du semestre actif :', e)
      return { actif: null, ecrit: false }
    }
  }
)

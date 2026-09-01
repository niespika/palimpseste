import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { lireGatePlanActif, plansValidesCourants } from '@/utils/plan-exercices'
import { resoudreDatesSyntheses } from '@/utils/plan-synthese'
import { clesSynthesesOuvertes } from '@/utils/plan-synthese-ouverture'
import { dateEffectiveSemaine, libelleTypeExercice } from '@/utils/plan-cadence'
import { moduleDuType } from '@/utils/examens/types'
import { construireApercuAssign, memoSocleFrise, type ApercuSemaine } from '@/utils/parcours-apercu'
import { semaineCourante } from '@/utils/scriptorium-corpus'

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
  urgence?: 'retard'    // échéance passée (exercice à concevoir) → traité à part (dashboard)
  exerciceId?: string   // exercice planifié sous-jacent (pour l'action « retirer » en retard)
  ctaLabel?: string     // libellé du lien d'action (défaut « Concevoir → ») : une synthèse
                        // se PRÉPARE (S4), elle ne se conçoit pas
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
    // Plan COURANT par classe (max AY) — même référentiel que la grille panoptique
    // (sinon un vieux plan 'valide' engendrerait des tâches pointant vers un plan
    // inatteignable depuis ?vue=evaluations&classe=X).
    const plans = await plansValidesCourants(admin)
    if (plans.length > 0) {
      const classeParPlan = new Map(plans.map((p) => [p.id, p.classeId]))
      const { data: classesRows } = await admin
        .from('classes').select('id, nom').in('id', plans.map((p) => p.classeId))
      const nomParClasse = new Map((classesRows ?? []).map((c) => [c.id as string, c.nom as string]))
      const { data: exos } = await admin
        .from('scriptorium_exercices_planifies')
        .select('id, plan_id, type_exercice, diagnostique, lieu, semaine_lundi, jour_prevu')
        .in('plan_id', plans.map((p) => p.id))
        .eq('ancrage', 'semaine')
        .eq('statut', 'a_concevoir')
        .is('supprime_at', null)
      for (const e of exos ?? []) {
        // Échéance figée (§4.6) : jour_prevu sinon dimanche (maison) / lundi (classe).
        const echeance = dateEffectiveSemaine(e.semaine_lundi as string, (e.jour_prevu as string | null) ?? null, e.lieu as 'classe' | 'maison')
        const enRetard = echeance < today
        // Fenêtre : en retard (passé) OU à concevoir dans [today, fin]. Au-delà = pas encore.
        if (!enRetard && echeance > fin) continue
        const classeId = classeParPlan.get(e.plan_id as string)
        const type = e.type_exercice as string
        const libelle = libelleTypeExercice(type, e.diagnostique as boolean)
        // Deep-link PAR MODULE quand le flux de conception existe (Q1) : un quiz mène
        // à sa conception Quazian pré-remplie ; les autres types, faute d'écran dédié,
        // renvoient à la grille du plan (relais manuel « Marquer conçu »).
        // ⭐ C4-L9 — LE TROISIÈME SITE. Les deux EXAMENS DIAGNOSTIQUES ont désormais
        //    leur écran de conception, chacun DANS SON MODULE : ils tombaient jusqu'ici
        //    dans la branche par défaut, et « un lot qui pose l'encart et oublie le
        //    calendrier laisse deux chemins qui disent des choses différentes ».
        //    ⚠️ La condition lit `diagnostique`, jamais le seul `type_exercice` : une
        //    écriture FORMATIVE (maison) est aussi de type `ecriture`, et elle n'a pas
        //    d'écran — elle reste au renvoi vers la grille.
        const moduleExamen = e.diagnostique === true
          ? moduleDuType(type)
          : null
        const href = type === 'quiz'
          ? `/prof/quazian/quizz?exercice=${e.id}`
          : moduleExamen
            ? `/prof/${moduleExamen}/examen-diagnostique/${e.id}`
            : `/prof/scriptorium?vue=evaluations&classe=${classeId}`
        taches.push({
          id: `exo-${e.id}`,
          label: `${enRetard ? 'Exercice en retard' : 'Exercice à concevoir'} — ${libelle}`,
          echeance,
          classeNom: classeId ? nomParClasse.get(classeId) ?? null : null,
          href,
          exerciceId: e.id as string,
          ...(enRetard ? { urgence: 'retard' as const } : {}),
        })
      }

      // « Caler le jour » (§5.6) : un exercice EN CLASSE CONÇU mais sans jour_prevu
      // engendre une tâche de PLANIFICATION (deep-link vers la grille du plan, où vit le
      // sélecteur de jour ; disparaît dès que le jour est posé). Deux restrictions :
      //  - `statut='concu'` SEULEMENT : tant qu'un exercice est `a_concevoir`, sa tâche
      //    « à concevoir » est le rappel actionnable (caler le jour d'un exercice non
      //    encore conçu est prématuré et dédoublerait le « en retard »). Couvre bien le
      //    cas de la décision ① (un quiz CONÇU mais jamais calé n'a plus de tâche
      //    « à concevoir » → sinon aucun rappel).
      //  - quiz DÉJÀ LANCÉ exclu : « réalisé » est DÉRIVÉ de lance_at, jamais un statut
      //    (SPEC §Statuts) ; sans ça un quiz surprise lancé sans jour posé nourrirait un
      //    « à caler » perpétuel + un « Retirer » destructif (élèves déjà passés). Même
      //    exclusion que l'émission calendrier (dédup E3, calendrier-evenements.ts).
      const { data: aCaler } = await admin
        .from('scriptorium_exercices_planifies')
        .select('id, plan_id, type_exercice, diagnostique, semaine_lundi, quiz_id')
        .in('plan_id', plans.map((p) => p.id))
        .eq('ancrage', 'semaine')
        .eq('lieu', 'classe')
        .eq('statut', 'concu')
        .is('jour_prevu', null)
        .is('supprime_at', null)
      const aCalerRows = aCaler ?? []
      const quizIds = aCalerRows.map((e) => e.quiz_id as string | null).filter((q): q is string => !!q)
      const quizLances = new Set<string>()
      if (quizIds.length > 0) {
        const { data: qz } = await admin.from('quazian_quizzes').select('id, lance_at').in('id', quizIds)
        for (const q of qz ?? []) if ((q as { lance_at?: string | null }).lance_at != null) quizLances.add(q.id as string)
      }
      for (const e of aCalerRows) {
        if (e.quiz_id && quizLances.has(e.quiz_id as string)) continue // réalisé (lancé) → jamais
        // jour_prevu null + classe ⇒ échéance = lundi de la semaine (dateEffectiveSemaine).
        const echeance = dateEffectiveSemaine(e.semaine_lundi as string, null, 'classe')
        const enRetard = echeance < today
        if (!enRetard && echeance > fin) continue
        const classeId = classeParPlan.get(e.plan_id as string)
        const libelle = libelleTypeExercice(e.type_exercice as string, e.diagnostique as boolean)
        taches.push({
          id: `jour-${e.id}`, // DISTINCT de `exo-${e.id}`
          label: `${enRetard ? 'Jour à caler (en retard)' : 'Caler le jour'} — ${libelle}`,
          echeance,
          classeNom: classeId ? nomParClasse.get(classeId) ?? null : null,
          href: `/prof/scriptorium?vue=evaluations&classe=${classeId}`,
          exerciceId: e.id as string,
          ctaLabel: 'Caler le jour →',
          ...(enRetard ? { urgence: 'retard' as const } : {}),
        })
      }

      // Synthèses de fin de cours (ancrage 'parcours', §5.4). Leur date n'est PAS
      // stockée : elle est résolue EN LOT (coût constant — une résolution par ligne
      // saturerait cette page, qui n'a pas de maxDuration). L'action est « préparer »
      // (S4), pas « concevoir » : elle mène à l'entrée dédiée de /prof/codex.
      const { data: synths } = await admin
        .from('scriptorium_exercices_planifies')
        .select('id, plan_id, parcours_id, contenu_id')
        .in('plan_id', plans.map((p) => p.id))
        .eq('ancrage', 'parcours')
        .eq('statut', 'a_concevoir')
        .is('supprime_at', null)
      // SOURDINE (01/09) — un cours COUPÉ dans l'instance de sa classe n'engendre plus
      // de tâche. La ligne reste en base : rouvrir le cours la ramène ici telle quelle.
      const demandesSynth = (synths ?? []).map((s) => ({
        cle: s.id as string,
        parcoursId: s.parcours_id as string,
        contenuId: s.contenu_id as string,
        classeId: classeParPlan.get(s.plan_id as string) as string,
      }))
      const ouvertes = await clesSynthesesOuvertes(admin, demandesSynth)
      const synthRows = (synths ?? []).filter((s) => ouvertes.has(s.id as string))
      if (synthRows.length > 0) {
        const dates = await resoudreDatesSyntheses(admin, synthRows.map((s) => ({
          cle: s.id as string,
          parcoursId: s.parcours_id as string,
          contenuId: s.contenu_id as string,
          classeId: classeParPlan.get(s.plan_id as string) as string,
        })))
        for (const s of synthRows) {
          const echeance = dates.get(s.id as string) ?? null
          // S6 — non datable ⇒ ni tâche ni événement. Garde INDISPENSABLE avant toute
          // comparaison : en JS `null < today` ET `null > fin` valent false, donc une
          // synthèse non résolue franchirait la fenêtre et s'afficherait sans échéance.
          if (echeance == null) continue
          const enRetard = echeance < today
          if (!enRetard && echeance > fin) continue
          const classeId = classeParPlan.get(s.plan_id as string)
          taches.push({
            id: `exo-${s.id}`,
            label: enRetard ? 'Synthèse en retard' : 'Synthèse à préparer',
            echeance,
            classeNom: classeId ? nomParClasse.get(classeId) ?? null : null,
            href: '/prof/codex',
            exerciceId: s.id as string,
            ctaLabel: 'Préparer →',
            ...(enRetard ? { urgence: 'retard' as const } : {}),
          })
        }
      }
    }
  }

  // Éléments d'instance NON VUS des semaines passées (RAG L3, §5.3) : de la matière
  // déjà enseignée dont le prof n'a pas cliqué « vu » — la grille d'instance est le
  // geste (le signal s'éteint quand tout est vu, déplacé ou retiré). NON gaté
  // (pilotage prof, pas de surface élève) ; tolérant si les tables d'instance
  // n'existent pas encore (migration scriptorium_rag_l1.sql non jouée → data null).
  {
    // Repli si `decalages` n'existe pas encore (migration parcours_decalages.sql
    // non jouée) : le signal « non vus passés » continue, sur mapping consécutif.
    const avecDec = await admin.from('scriptorium_parcours_classes')
      .select('id, parcours_id, classe_id, date_debut, horaire_snapshot, decalages').eq('statut', 'active')
    const assigns = avecDec.error
      ? (await admin.from('scriptorium_parcours_classes')
          .select('id, parcours_id, classe_id, date_debut, horaire_snapshot').eq('statut', 'active')).data
      : avecDec.data
    const rows = (assigns ?? []) as Record<string, unknown>[]
    if (rows.length > 0) {
      const parcoursIds = [...new Set(rows.map((a) => a.parcours_id as string))]
      const { data: parcs } = await admin.from('scriptorium_parcours')
        .select('id, titre, nb_semaines, supprime_at').in('id', parcoursIds)
      const metaParcours = new Map((parcs ?? [])
        .filter((p) => (p.supprime_at as string | null) == null)
        .map((p) => [p.id as string, { titre: p.titre as string, nb: (p.nb_semaines as number) ?? 0 }]))

      // Semaine courante par assignation (aperçu snapshot/frise, socle mémoïsé par AY).
      const socleDe = memoSocleFrise(admin)
      const concernees: { pcId: string; classeId: string; titre: string; courante: number }[] = []
      for (const a of rows) {
        const meta = metaParcours.get(a.parcours_id as string)
        if (!meta) continue
        const snap = a.horaire_snapshot as ApercuSemaine[] | null | undefined
        const res = await construireApercuAssign(admin, {
          parcoursId: a.parcours_id as string,
          nbSemaines: meta.nb,
          dateDebut: (a.date_debut as string | null) ?? null,
          snapshot: snap && Array.isArray(snap) && snap.length ? snap : null,
          decalages: (a.decalages as Record<string, number> | null) ?? null,
        }, socleDe)
        const courante = semaineCourante(res?.apercu ?? null, today)
        if (courante == null || courante <= 1) continue // rien de « passé » avant la semaine 2
        concernees.push({ pcId: a.id as string, classeId: a.classe_id as string, titre: meta.titre, courante })
      }

      if (concernees.length > 0) {
        const { data: crens } = await admin.from('scriptorium_parcours_classe_creneaux')
          .select('id, parcours_classe_id').in('parcours_classe_id', concernees.map((c) => c.pcId))
        const pcParCreneau = new Map((crens ?? []).map((c) => [c.id as string, c.parcours_classe_id as string]))
        const idsCreneaux = [...pcParCreneau.keys()]
        if (idsCreneaux.length > 0) {
          const { data: els } = await admin.from('scriptorium_parcours_classe_elements')
            .select('creneau_id, semaine').in('creneau_id', idsCreneaux).is('vu_at', null)
          const courantePc = new Map(concernees.map((c) => [c.pcId, c.courante]))
          const nbParPc = new Map<string, number>()
          for (const e of els ?? []) {
            const pcId = pcParCreneau.get(e.creneau_id as string)
            if (!pcId) continue
            const courante = courantePc.get(pcId)
            if (courante != null && (e.semaine as number) < courante) {
              nbParPc.set(pcId, (nbParPc.get(pcId) ?? 0) + 1)
            }
          }
          if (nbParPc.size > 0) {
            const classeIds = [...new Set(concernees.map((c) => c.classeId))]
            const { data: cls } = await admin.from('classes').select('id, nom').in('id', classeIds)
            const nomClasse = new Map((cls ?? []).map((c) => [c.id as string, c.nom as string]))
            for (const c of concernees) {
              const nb = nbParPc.get(c.pcId) ?? 0
              if (nb === 0) continue
              taches.push({
                id: `instance-vu-${c.pcId}`,
                label: `${nb} élément${nb > 1 ? 's' : ''} des semaines passées non marqué${nb > 1 ? 's' : ''} vu${nb > 1 ? 's' : ''} — ${c.titre}`,
                echeance: today,
                classeNom: nomClasse.get(c.classeId) ?? null,
                href: `/prof/scriptorium?vue=classes&classe=${c.classeId}&instance=${c.pcId}`,
                ctaLabel: 'Pointer →',
              })
            }
          }
        }
      }
    }
  }

  // Synthèses Scriptorium PRÊTES non consultées (RAG L7, §10.3) : le signal du
  // lundi — s'éteint quand le prof ouvre la synthèse (vue_at posé à l'ouverture).
  // Tolérant si la table n'existe pas encore (migration L7 non jouée → data null).
  {
    const { data: sy } = await admin
      .from('scriptorium_rag_syntheses')
      .select('id, classe_id, semaine_lundi')
      .eq('statut', 'READY').is('vue_at', null)
    const rows = sy ?? []
    if (rows.length > 0) {
      const classeIds = [...new Set(rows.map((r) => r.classe_id as string))]
      const { data: cls } = await admin.from('classes').select('id, nom').in('id', classeIds)
      const nomClasse = new Map((cls ?? []).map((c) => [c.id as string, c.nom as string]))
      for (const r of rows) {
        taches.push({
          id: `synthese-rag-${r.id}`,
          label: 'Synthèse Scriptorium prête',
          echeance: today,
          classeNom: nomClasse.get(r.classe_id as string) ?? null,
          href: `/prof/scriptorium?vue=classes&classe=${r.classe_id}&synthese=${r.id}`,
          ctaLabel: 'Lire →',
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

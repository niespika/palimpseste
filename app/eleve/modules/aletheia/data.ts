import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { inscriptionsModuleEleve } from '@/utils/acces'
import { contexteClasseEleve } from '../../contexte-classe'
import type { CapstoneRow, LivreAletheia, SemaineLivre, TravailAletheia } from './types'
import { AIDES_V1_DEFAUT, type AidesV1 } from './aides-v1'
import type { SeanceOrdinal } from '@/utils/aletheia-seance'
import { resoudreDatesLivre, formatEcheanceFr, livresGouvernesPourClasses, modeExposition, lireModeCActif } from '@/utils/aletheia-dates'
import { numeroAffiche, dansExtrait, titreSeanceAffiche } from '@/utils/aletheia-extrait'

export interface InscriptionAletheia { id: string; classe_id: string; classe_nom: string }

// Contexte Aletheia de l'élève : module actif ? inscriptions sur des classes AYANT
// le module (gate de visibilité), et inscription active (commutateur Lot 9). Source
// unique pour le planning, la page semaine ET les actions → scoping cohérent.
export async function contexteAletheia(
  supabase: SupabaseClient, userId: string,
): Promise<{ moduleActif: boolean; inscriptions: InscriptionAletheia[]; active: InscriptionAletheia | null }> {
  const { data: moduleData } = await supabase.from('modules').select('id, actif').eq('slug', 'aletheia').maybeSingle()
  if (!moduleData?.actif) return { moduleActif: false, inscriptions: [], active: null }
  const inscriptions = await inscriptionsModuleEleve(supabase, userId, moduleData.id as string)
  if (inscriptions.length === 0) return { moduleActif: true, inscriptions: [], active: null }
  const { active } = await contexteClasseEleve(supabase, userId)
  const inscriptionActive = inscriptions.find(i => i.id === active?.id) ?? inscriptions[0]
  return { moduleActif: true, inscriptions, active: inscriptionActive }
}

// (B4) Résout la classe à utiliser pour CE livre chez un élève potentiellement
// multi-classes. On privilégie la classe active (cookie) si elle expose le livre ;
// sinon on se replie sur une AUTRE inscription active (sur une classe ayant le module
// Aletheia) qui l'expose. `resolue` = null seulement si AUCUNE classe active ne
// l'expose (vrai 404). Motif : le gate « retours non lus » d'un élève bi-classe peut
// pointer un livre de sa classe B alors que son cookie est sur la classe A → la page
// semaine faisait notFound() sec. On résout désormais sur la classe qui expose le
// livre, pour la LECTURE comme pour la SOUMISSION (mode C / dates / séquentiel suivent
// cette même classe → cohérent). Mono-classe : `resolue` == `active` (non-régression).
export async function resoudreInscriptionLivre(
  admin: SupabaseClient, supabase: SupabaseClient, userId: string, livreId: string,
): Promise<{ moduleActif: boolean; inscriptions: InscriptionAletheia[]; active: InscriptionAletheia | null; resolue: InscriptionAletheia | null }> {
  const ctx = await contexteAletheia(supabase, userId)
  if (!ctx.moduleActif || !ctx.active) return { ...ctx, resolue: null }
  // Ordre d'essai : la classe active (cookie) D'ABORD (court-circuit mono-classe /
  // cas nominal), puis les autres inscriptions actives (repli bi-classe déterministe).
  const ordre = [ctx.active, ...ctx.inscriptions.filter((i) => i.id !== ctx.active!.id)]
  for (const insc of ordre) {
    if (await livreAccessible(admin, [insc.classe_id], livreId)) return { ...ctx, resolue: insc }
  }
  return { ...ctx, resolue: null }
}

// (Lot 2) La date indicative héritée « date_debut + (semaine-1)×7 » est SUPPRIMÉE :
// une séance est décorrélée du calendrier (mode a = sans date). En mode b, la date
// sera résolue en Lot 3 via resoudreDateSeance (dates issues du parcours). Le champ
// `dateIndicative` des types demeure, laissé vide tant que le résolveur n'est pas branché.

// Les livres assignés à une classe + leurs semaines (titre, chapitres, date).
// IMPORTANT : on n'expose JAMAIS fichier_ref / texte_extrait (ancrage IA, réservé
// serveur). Le Scriptorium est en RLS prof-only → lecture via le client admin.
export async function livresPourClasse(admin: SupabaseClient, classeId: string): Promise<LivreAletheia[]> {
  // (L4) Exposition UNION (supersède la décision 9 du SPEC Parcours) : le livre est
  // exposé s'il est assigné en DIRECT (scriptorium_unite_classes) OU s'il figure dans
  // un parcours assigné actif à la classe. ⚠️ R-EXPO : avant activation en prod,
  // AUDITER les créneaux-livre préexistants (RUNBOOK) — cf. SPEC §9 / addendum Q11.
  const [{ data: liens }, gouvernes] = await Promise.all([
    admin.from('scriptorium_unite_classes').select('unite_id').eq('classe_id', classeId),
    livresGouvernesPourClasses(admin, [classeId]),
  ])
  const bookIds = [...new Set([...(liens ?? []).map(l => l.unite_id as string), ...gouvernes])]
  if (bookIds.length === 0) return []

  const [{ data: unites }, { data: docs }] = await Promise.all([
    admin.from('scriptorium_unites')
      .select('id, label, date_debut, nb_semaines, auteur')
      .eq('type', 'livre')
      .is('supprime_at', null)   // un livre supprimé ne s'affiche plus (defense-in-depth : classes déjà détachées)
      .in('id', bookIds)
      .order('ordre', { ascending: true }),
    admin.from('scriptorium_documents')
      .select('unite_id, semaine, titre, chapitres')
      .in('unite_id', bookIds)
      .not('semaine', 'is', null)
      .order('semaine', { ascending: true }),
  ])

  const semainesParLivre = new Map<string, SemaineLivre[]>()
  for (const d of docs ?? []) {
    const uid = d.unite_id as string
    const arr = semainesParLivre.get(uid) ?? []
    arr.push({
      semaine: d.semaine as number,
      numero: d.semaine as number, // placeholder d'origine ; finalisé (position 1..K) plus bas
      titre: (d.titre as string) ?? `Séance ${d.semaine}`,
      chapitres: (d.chapitres as string | null) ?? null,
      dateIndicative: '',
    })
    semainesParLivre.set(uid, arr)
  }

  // (mode C) Kill-switch lu UNE fois pour tout l'appel (hoisté hors de la boucle par livre).
  const modeCActif = await lireModeCActif(admin)
  // Liens DIRECTS (scriptorium_unite_classes) → précédence livre-entier (A/B, jamais C).
  const directIds = new Set((liens ?? []).map(l => l.unite_id as string))

  // Dates « mode b » : résolues via le parcours (snapshot/frise). Mode a → vide +
  // gouverne=false (badge « sans échéances »). Un chargement par (livre, classe).
  const livres = await Promise.all((unites ?? []).map(async u => {
    const uid = u.id as string
    const seances = semainesParLivre.get(uid) ?? []
    const ordinaux = seances.map(s => s.semaine)
    // resoudreDatesLivre expose les créneaux gouvernants BRUTS → réutilisés par la détection
    // SANS recharger les parcours/assignations (R5 : un seul chargement par livre).
    const { dates, gouverne, creneauxGouvernants: creneaux } = await resoudreDatesLivre(admin, uid, classeId, ordinaux)
    // Détection du mode via la SOURCE UNIQUE (gate incontournable), sans I/O supplémentaire :
    // S / lien direct / créneaux / flag sont déjà connus.
    const verdict = await modeExposition(admin, uid, classeId, {
      seances: new Set(ordinaux),
      direct: directIds.has(uid),
      creneaux,
      modeCActif,
    })
    // MALCONFIG (gate ON uniquement) : livre gouverné à couverture vide → exclu + journalisé.
    // Sous gate OFF, modeExposition ne renvoie jamais MALCONFIG (repli-B) → jamais exclu.
    if (verdict.mode === 'MALCONFIG') {
      console.warn(`[aletheia] mode C MALCONFIG — livre ${uid} exclu pour la classe ${classeId} (couverture de créneaux vide).`)
      return null
    }
    const exposeesSet = new Set(verdict.exposees)
    return {
      id: uid,
      titre: u.label as string,
      auteur: (u.auteur as string | null) ?? null,
      date_debut: (u.date_debut as string | null) ?? null,
      nb_semaines: (u.nb_semaines as number | null) ?? null,
      gouverne,
      mode: verdict.mode, // 'A' | 'B' | 'C' (MALCONFIG déjà exclu)
      // Extrait (mode C) : ne garder que les séances exposées, renumérotées 1..K. En A/B,
      // exposees == toutes les séances et numero == semaine → identité (non-régression).
      semaines: seances
        .filter(s => exposeesSet.has(s.semaine))
        .map(s => {
          const numero = verdict.mode === 'C' ? numeroAffiche(verdict.exposees, s.semaine) : s.semaine
          return {
            ...s,
            numero,
            // Anti-fuite (#1) : neutralise le titre par défaut « Séance {origine} » en mode C.
            titre: titreSeanceAffiche(s.titre, s.semaine, numero, verdict.mode === 'C'),
            dateIndicative: formatEcheanceFr(dates.get(s.semaine)?.valeur ?? null),
          }
        }),
    }
  }))
  return livres.filter((l): l is LivreAletheia => l !== null)
}

// Un livre est accessible à l'élève s'il est assigné à l'une des classes fournies
// ET qu'il s'agit bien d'un livre (defense-in-depth : la table de liaison ne
// devrait contenir que des livres, mais on ne s'appuie pas dessus pour la garde).
export async function livreAccessible(admin: SupabaseClient, classeIds: string[], livreId: string): Promise<boolean> {
  if (classeIds.length === 0) return false
  const { data: lien } = await admin
    .from('scriptorium_unite_classes')
    .select('unite_id')
    .eq('unite_id', livreId)
    .in('classe_id', classeIds)
    .limit(1)
  // (L4) Exposition UNION : direct OU via un parcours assigné actif (supersède décision 9).
  let expose = (lien ?? []).length > 0
  if (!expose) expose = (await livresGouvernesPourClasses(admin, classeIds)).includes(livreId)
  if (!expose) return false
  // defense-in-depth : c'est bien un livre ET non supprimé (un créneau pointant un
  // livre soft-deleté ne doit pas le ré-exposer).
  const { data: u } = await admin.from('scriptorium_unites').select('type, supprime_at').eq('id', livreId).maybeSingle()
  return u?.type === 'livre' && (u?.supprime_at as string | null) == null
}

// Une semaine précise d'un livre (titre / chapitres / date), ou null si absente.
export async function semaineLivre(admin: SupabaseClient, livreId: string, semaine: SeanceOrdinal): Promise<SemaineLivre | null> {
  const { data: doc } = await admin.from('scriptorium_documents')
    .select('titre, chapitres')
    .eq('unite_id', livreId)
    .eq('semaine', semaine)
    .maybeSingle()
  if (!doc) return null
  return {
    semaine,
    numero: semaine, // identité : la page séance calcule la position 1..K via modeExposition (mode C)
    titre: (doc.titre as string) ?? `Séance ${semaine}`,
    chapitres: (doc.chapitres as string | null) ?? null,
    dateIndicative: '',
  }
}

// Réglages globaux Aletheia (Lot 6). aletheia_params est en RLS prof → lecture
// côté élève via le client admin (comme les lectures Scriptorium).
export async function lireReglages(admin: SupabaseClient): Promise<{ evalQuestions: boolean; deblocageSequentiel: boolean; aides: AidesV1 }> {
  const { data } = await admin.from('aletheia_params')
    .select('eval_questions_actif, deblocage_sequentiel, aide_these, aide_arguments, aide_accord, aide_questions, aide_vocabulaire')
    .eq('id', 1).maybeSingle()
  return {
    evalQuestions: !!data?.eval_questions_actif,
    deblocageSequentiel: !!data?.deblocage_sequentiel,
    aides: {
      these: data?.aide_these || AIDES_V1_DEFAUT.these,
      arguments: data?.aide_arguments || AIDES_V1_DEFAUT.arguments,
      accord: data?.aide_accord || AIDES_V1_DEFAUT.accord,
      questions: data?.aide_questions || AIDES_V1_DEFAUT.questions,
      vocabulaire: data?.aide_vocabulaire || AIDES_V1_DEFAUT.vocabulaire,
    },
  }
}

// Déblocage séquentiel (Lot 6 D) : une semaine est ouverte si le déblocage est
// off, OU si c'est la 1re semaine, OU si la semaine précédente (dans l'ordre) est DONE.
export function estSemaineDebloquee(semaines: SeanceOrdinal[], doneSet: Set<SeanceOrdinal>, semaine: SeanceOrdinal, sequentiel: boolean): boolean {
  if (!sequentiel) return true
  const ordre = [...semaines].sort((a, b) => a - b)
  const idx = ordre.indexOf(semaine)
  if (idx <= 0) return true
  return doneSet.has(ordre[idx - 1])
}

// Accès serveur à une séance (page séance + actions) : garde d'APPARTENANCE (mode C) PUIS
// déblocage séquentiel. En mode C, l'accès est restreint aux séances de l'extrait.
export async function peutAccederSemaine(admin: SupabaseClient, eleveId: string, livreId: string, semaine: SeanceOrdinal, classeId: string, exposeesPre?: SeanceOrdinal[]): Promise<boolean> {
  // (mode C, footgun F9) Refus INCONDITIONNEL si la séance n'appartient pas à l'extrait,
  // AVANT le raccourci `!deblocageSequentiel` — sinon une séance hors extrait fuiterait par
  // URL/action dans la config par défaut (deblocage off). Sous gate OFF, exposees = toutes
  // les séances → jamais refusé (non-régression). `exposeesPre` : réutilise un modeExposition
  // déjà calculé par l'appelant (perf #3), sinon on le calcule.
  const exposees = exposeesPre ?? (await modeExposition(admin, livreId, classeId)).exposees
  if (!dansExtrait(exposees, semaine)) return false

  const { deblocageSequentiel } = await lireReglages(admin)
  if (!deblocageSequentiel) return true
  const { data: faits } = await admin.from('aletheia_travaux')
    .select('semaine_index').eq('eleve_id', eleveId).eq('scriptorium_livre_id', livreId).eq('statut', 'DONE')
  const doneSet = new Set((faits ?? []).map(t => t.semaine_index as number))
  // Déblocage séquentiel restreint à l'EXTRAIT (§6.5) : le prédécesseur est celui de l'extrait,
  // pas une séance non exposée. En A/B, exposees = toutes les séances → comportement inchangé.
  return estSemaineDebloquee(exposees, doneSet, semaine, true)
}

// L'état du capstone du LIVRE (carte partagée, canonique), ou null si jamais lancé.
// La table est en RLS prof-only → lecture côté élève via le client admin, la garde
// d'accès (livre assigné + toutes semaines DONE) étant appliquée par l'appelant.
export async function chargerCapstoneLivre(admin: SupabaseClient, livreId: string): Promise<CapstoneRow | null> {
  const { data } = await admin
    .from('aletheia_capstone')
    .select('statut, contenu')
    .eq('scriptorium_livre_id', livreId)
    .maybeSingle()
  return (data as CapstoneRow | null) ?? null
}

// Toutes les séances EXPOSÉES du livre sont-elles DONE pour cet élève ? (gate du capstone :
// l'élève ne voit la carte partagée qu'après avoir lui-même tout terminé — anti-spoiler.)
// En mode C, l'ensemble itéré est l'EXTRAIT (K/K), pas le livre entier (§6.6). En A/B,
// exposees = toutes les séances → comportement inchangé (non-régression).
export async function toutesSemainesDone(admin: SupabaseClient, eleveId: string, livreId: string, classeId: string, exposeesPre?: SeanceOrdinal[]): Promise<boolean> {
  // `exposeesPre` : réutilise un modeExposition déjà calculé par l'appelant (perf #2/#4).
  const [exposees, { data: faits }] = await Promise.all([
    exposeesPre ?? modeExposition(admin, livreId, classeId).then(v => v.exposees),
    admin.from('aletheia_travaux').select('semaine_index').eq('eleve_id', eleveId).eq('scriptorium_livre_id', livreId).eq('statut', 'DONE'),
  ])
  if (exposees.length === 0) return false
  const doneSet = new Set((faits ?? []).map(t => t.semaine_index as number))
  return exposees.every(s => doneSet.has(s))
}

// Les travaux de l'élève pour un livre, indexés par numéro de semaine.
// (C1) Lecture via le client ADMIN + filtre eleve_id : aletheia_travaux n'a plus
// de policy SELECT élève (fermé pour ne pas exposer devoilement/retours à l'API).
export async function travauxParSemaine(
  admin: SupabaseClient, eleveId: string, livreId: string,
): Promise<Map<SeanceOrdinal, TravailAletheia>> {
  const { data } = await admin
    .from('aletheia_travaux')
    .select('*')
    .eq('eleve_id', eleveId)
    .eq('scriptorium_livre_id', livreId)
  const m = new Map<number, TravailAletheia>()
  for (const t of (data ?? []) as TravailAletheia[]) m.set(t.semaine_index, t)
  return m
}

import 'server-only'
// Loader de la GRILLE D'INSTANCE (RAG L3, SPEC §5.3) : pour une assignation
// (parcours × classe), les semaines de l'instance avec leurs éléments résolus
// (titres, badges, « vu », « à revoir »), les libellés datés via l'aperçu
// (snapshot publié prioritaire, repli frise) et la SEMAINE COURANTE (§5.2).
// Client prof (RLS prof-only sur toutes les tables lues) — surface prof.

import { createClient } from '@/utils/supabase/server'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { construireApercuAssign, memoSocleFrise, type AssignParcours, type ApercuSemaine } from '@/utils/parcours-apercu'
import { densifierDecalages, type Decalages } from '@/utils/frise-enseignement'
import { semaineCourante } from '@/utils/scriptorium-corpus'
import {
  resoudreFrisePourDate, calculerDiffHoraire,
  type ApercuFrise, type HoraireSnapshot, type DiffHoraire,
} from './parcours/frise-serveur'

export interface ElementInstance {
  id: string
  creneauId: string
  creneauTitre: string           // libellé du créneau porteur (confirmation de retrait)
  refType: 'contenu' | 'section' | 'livre_semaine'
  badge: 'Texte' | 'Cours' | 'Section' | 'Livre'
  titre: string
  vuAt: string | null
  aRevoir: boolean               // séance de livre hors de l'étendue réelle (schema-S2)
  ordre: number
  semaineReelle: number          // semaine DB (≠ semaine d'affichage si clampée §4.2) — cible des actions
}

// Un AUTRE parcours de la même classe qui occupe la même semaine d'enseignement.
// C'est ce qui rend l'ALTERNANCE lisible : sans ça, décaler une semaine se fait à
// l'aveugle et deux parcours se superposent sans que rien ne le dise.
export interface OccupationSemaine {
  pcId: string
  parcoursTitre: string
  semaine: number // n° de semaine de CET AUTRE parcours
}

export interface SemaineInstance {
  semaine: number
  libelle: string | null         // « S1 · sem. 5 — 21 sept » (aperçu) ; null si non datée
  lundi: string | null           // lundi qui FAIT FOI (snapshot publié si publié)
  // Lundi du RECALCUL live (frise × décalages). Renseigné SEULEMENT s'il diffère de
  // `lundi` : un horaire publié fige les dates, et poser un décalage sans re-publier
  // laisserait sinon deux dates à l'écran sans que rien ne dise laquelle vaut.
  lundiApresPublication: string | null
  decalage: number               // semaines d'enseignement sautées avant celle-ci
  peutRapprocher: boolean        // faux si k−1 est juste devant (ou si k = 1)
  courante: boolean
  occupee: OccupationSemaine[]
  elements: ElementInstance[]
}

// Bloc de planification de l'instance : ce que le PARCOURS DE LA CLASSE porte
// désormais, et que le panneau d'assignation du modèle ne porte plus.
export interface PlanificationInstance {
  dateDebut: string | null
  apercu: ApercuFrise | null      // recalcul LIVE (frise + décalages) ; null sans date
  snapshot: HoraireSnapshot | null
  diff: DiffHoraire | null
}

export interface InstanceDeClasse {
  pcId: string
  classeId: string
  classeNom: string
  parcoursId: string
  parcoursTitre: string
  nbSemaines: number
  nbClassesDuParcours: number    // le modèle sert N classes → « + une semaine » le dit
  datee: boolean                 // false → bandeau « instance non datée : exclue du RAG »
  semaineCourante: number | null
  nonVusPasses: number           // éléments des semaines passées non vus (miroir du « à faire »)
  planification: PlanificationInstance
  decalages: Decalages
  semaines: SemaineInstance[]
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function libelleLundi(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  if (!m || !d) return iso
  return `${d} ${MOIS_COURTS[m - 1] ?? ''}`
}

/** Grille d'instance d'une assignation. null si introuvable / parcours soft-deleté. */
export async function chargerInstanceDeClasse(pcId: string): Promise<InstanceDeClasse | null> {
  const supabase = await createClient()

  // Assignation. Les colonnes ajoutées après coup (snapshot d'horaire, décalages)
  // sont lues À PART et TOLÉRÉES absentes : une migration non jouée fait retomber
  // l'instance sur son comportement d'origine au lieu de vider l'écran.
  const [base, snapQ, decQ] = await Promise.all([
    supabase.from('scriptorium_parcours_classes')
      .select('id, parcours_id, classe_id, date_debut').eq('id', pcId).maybeSingle(),
    supabase.from('scriptorium_parcours_classes')
      .select('horaire_snapshot, snapshot_version, snapshot_genere_le').eq('id', pcId).maybeSingle(),
    supabase.from('scriptorium_parcours_classes')
      .select('decalages').eq('id', pcId).maybeSingle(),
  ])
  const pcRow = (base.data as Record<string, unknown> | null) ?? null
  if (!pcRow) return null
  const snapRow = snapQ.error ? null : (snapQ.data as Record<string, unknown> | null)
  const decalages: Decalages = (decQ.error ? null : (decQ.data?.decalages as Decalages | null)) ?? {}

  const [{ data: parc }, { data: classe }] = await Promise.all([
    supabase.from('scriptorium_parcours')
      .select('id, titre, nb_semaines, supprime_at').eq('id', pcRow.parcours_id as string).maybeSingle(),
    supabase.from('classes').select('id, nom').eq('id', pcRow.classe_id as string).maybeSingle(),
  ])
  if (!parc || parc.supprime_at || !classe) return null
  const nbSemaines = (parc.nb_semaines as number) ?? 0

  // Aperçu daté (snapshot prioritaire, repli frise) + semaine courante (§5.2).
  const snap = snapRow?.horaire_snapshot as ApercuSemaine[] | null | undefined
  const dateDebut = (pcRow.date_debut as string | null) ?? null
  const assign: AssignParcours = {
    parcoursId: parc.id as string,
    nbSemaines,
    dateDebut,
    snapshot: snap && Array.isArray(snap) && snap.length ? snap : null,
    decalages,
  }
  const apercuRes = await construireApercuAssign(supabase, assign)
  const aujourdHui = jourDansFuseau(new Date().toISOString(), await lireFuseau())
  const courante = semaineCourante(apercuRes?.apercu ?? null, aujourdHui)

  // ── Bloc de planification (la date vit ICI depuis le déménagement) ──────────
  // `apercu` est le recalcul LIVE (frise × décalages) — c'est lui qui montre au
  // prof l'effet d'un décalage AVANT publication ; le snapshot, lui, reste ce qui
  // fait foi pour les libellés de semaine tant qu'il n'est pas re-publié.
  const apercuLive = dateDebut ? await resoudreFrisePourDate(dateDebut, nbSemaines, decalages) : null
  const snapshot: HoraireSnapshot | null = snap && Array.isArray(snap) && snap.length
    ? {
        version: (snapRow?.snapshot_version as number | null) ?? 0,
        genereLe: (snapRow?.snapshot_genere_le as string | null) ?? null,
        semaines: snap,
      }
    : null
  const diff: DiffHoraire | null = snapshot && apercuLive
    ? calculerDiffHoraire(snapshot.semaines, apercuLive.semaines)
    : null

  // ── Occupation des semaines d'enseignement par les AUTRES parcours ─────────
  // ⚠️ L'occupation se lit sur les dates QUI S'APPLIQUERONT (frise × décalages), pas
  // sur l'horaire figé : le prof arrange ici un calendrier à venir, et un badge posé
  // sur la semaine d'un snapshot périmé désignerait la mauvaise. Hors édition les
  // deux coïncident — c'est le bandeau de diff qui signale quand elles divergent.
  // Un seul socle de frise mémoïsé pour toute la classe ; les instances non datées
  // n'occupent rien (elles n'ont pas de lundi).
  const occupationParLundi = new Map<string, OccupationSemaine[]>()
  const { data: autresLiens } = await supabase.from('scriptorium_parcours_classes')
    .select('id, parcours_id, date_debut')
    .eq('classe_id', classe.id as string)
    .neq('id', pcId)
  const autres = (autresLiens ?? []) as { id: string; parcours_id: string; date_debut: string | null }[]
  if (autres.length > 0) {
    const { data: autresParcs } = await supabase.from('scriptorium_parcours')
      .select('id, titre, nb_semaines, supprime_at').in('id', autres.map(a => a.parcours_id))
    const metaAutre = new Map((autresParcs ?? [])
      .filter(p => (p.supprime_at as string | null) == null)
      .map(p => [p.id as string, { titre: p.titre as string, nb: (p.nb_semaines as number) ?? 0 }]))
    // Snapshots + décalages des autres, tolérants (même raison que ci-dessus).
    const snapAutres = await supabase.from('scriptorium_parcours_classes')
      .select('id, horaire_snapshot').in('id', autres.map(a => a.id))
    const decAutres = await supabase.from('scriptorium_parcours_classes')
      .select('id, decalages').in('id', autres.map(a => a.id))
    const snapParPc = new Map((snapAutres.error ? [] : (snapAutres.data ?? []))
      .map(r => [r.id as string, r.horaire_snapshot as ApercuSemaine[] | null]))
    const decParPc = new Map((decAutres.error ? [] : (decAutres.data ?? []))
      .map(r => [r.id as string, (r.decalages as Decalages | null) ?? {}]))
    const socleDe = memoSocleFrise(supabase)
    for (const a of autres) {
      const meta = metaAutre.get(a.parcours_id)
      if (!meta) continue
      const sn = snapParPc.get(a.id)
      const res = await construireApercuAssign(supabase, {
        parcoursId: a.parcours_id,
        nbSemaines: meta.nb,
        dateDebut: a.date_debut,
        // Datée ⇒ on recalcule (voir ci-dessus). Le snapshot ne sert que de repli
        // pour une assignation publiée dont la date a été retirée depuis.
        snapshot: a.date_debut ? null : (sn && Array.isArray(sn) && sn.length ? sn : null),
        decalages: decParPc.get(a.id) ?? {},
      }, socleDe)
      for (const sem of res?.apercu ?? []) {
        if (sem.statut !== 'definie' || !sem.dateReelle) continue
        const arr = occupationParLundi.get(sem.dateReelle) ?? []
        arr.push({ pcId: a.id, parcoursTitre: meta.titre, semaine: sem.semaine })
        occupationParLundi.set(sem.dateReelle, arr)
      }
    }
  }

  // Créneaux puis éléments de l'instance (les éléments sont scopés par créneau).
  const { data: crens } = await supabase.from('scriptorium_parcours_classe_creneaux')
    .select('id, semaine, ordre, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin, titre_affiche')
    .eq('parcours_classe_id', pcId)
    .order('semaine', { ascending: true }).order('ordre', { ascending: true })
  const creneaux = (crens ?? []) as {
    id: string; semaine: number; ordre: number; ref_type: 'contenu' | 'livre'
    contenu_id: string | null; livre_id: string | null
    livre_semaine_debut: number | null; livre_semaine_fin: number | null; titre_affiche: string | null
  }[]
  const { data: els } = creneaux.length
    ? await supabase.from('scriptorium_parcours_classe_elements')
        .select('id, creneau_id, ref_type, section_id, livre_semaine, semaine, ordre, vu_at')
        .in('creneau_id', creneaux.map(c => c.id))
        .order('semaine', { ascending: true }).order('ordre', { ascending: true })
    : { data: [] as Record<string, unknown>[] }
  const elements = (els ?? []) as {
    id: string; creneau_id: string; ref_type: 'contenu' | 'section' | 'livre_semaine'
    section_id: string | null; livre_semaine: number | null; semaine: number; ordre: number; vu_at: string | null
  }[]

  // Résolution des titres : contenus, sections, livres + docs (séances, chapitres).
  const contenuIds = [...new Set(creneaux.map(c => c.contenu_id).filter((x): x is string => !!x))]
  const livreIds = [...new Set(creneaux.map(c => c.livre_id).filter((x): x is string => !!x))]
  const sectionIds = [...new Set(elements.map(e => e.section_id).filter((x): x is string => !!x))]
  const [{ data: conts }, { data: secs }, { data: livres }, { data: docs }] = await Promise.all([
    contenuIds.length
      ? supabase.from('scriptorium_contenus').select('id, titre, type, supprime_at').in('id', contenuIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    sectionIds.length
      ? supabase.from('scriptorium_contenu_sections').select('id, titre, niveau').in('id', sectionIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    livreIds.length
      ? supabase.from('scriptorium_unites').select('id, label, supprime_at').in('id', livreIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    livreIds.length
      ? supabase.from('scriptorium_documents').select('unite_id, semaine, chapitres').in('unite_id', livreIds).not('semaine', 'is', null)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])
  const contenuMap = new Map((conts ?? []).map(c => [c.id as string, { titre: c.titre as string, type: c.type as string, supprime: c.supprime_at != null }]))
  const sectionMap = new Map((secs ?? []).map(s => [s.id as string, { titre: s.titre as string, niveau: (s.niveau as number) ?? 1 }]))
  const livreMap = new Map((livres ?? []).map(l => [l.id as string, { label: l.label as string, supprime: l.supprime_at != null }]))
  const seancesParLivre = new Map<string, Set<number>>()
  const chapitresParSeance = new Map<string, string>() // `${livreId}|${k}` → chapitres
  for (const d of docs ?? []) {
    const lid = d.unite_id as string
    const k = d.semaine as number
    const set = seancesParLivre.get(lid) ?? new Set<number>()
    set.add(k)
    seancesParLivre.set(lid, set)
    const chap = (d.chapitres as string | null) ?? null
    if (chap) chapitresParSeance.set(`${lid}|${k}`, chap)
  }

  // Libellé + résolution de chaque élément (clé de tri : créneau porteur puis ordre).
  const creneauParId = new Map(creneaux.map(c => [c.id, c]))
  type ElementResolu = ElementInstance & { semaine: number; triCreneau: [number, number] }
  const resolus: ElementResolu[] = elements.map(e => {
    const cr = creneauParId.get(e.creneau_id)!
    // Clamp de lecture (§4.2) : un élément dérivé au-delà de nb_semaines (réduction
    // du parcours après coup) s'affiche dans la dernière semaine ; les actions
    // visent la semaine RÉELLE (semaineReelle).
    const semaine = Math.min(Math.max(1, e.semaine), Math.max(1, nbSemaines))
    const triCreneau: [number, number] = [cr.semaine, cr.ordre]
    if (e.ref_type === 'livre_semaine') {
      const info = cr.livre_id ? livreMap.get(cr.livre_id) : undefined
      const label = info && !info.supprime ? info.label : (cr.titre_affiche || 'livre retiré')
      const k = e.livre_semaine as number
      const chap = cr.livre_id ? chapitresParSeance.get(`${cr.livre_id}|${k}`) : undefined
      const aRevoir = !!cr.livre_id && !(seancesParLivre.get(cr.livre_id)?.has(k) ?? false)
      return {
        id: e.id, creneauId: cr.id, creneauTitre: label, refType: e.ref_type,
        badge: 'Livre' as const,
        titre: `${label} — séance ${k}${chap ? `, ${chap}` : ''}`,
        vuAt: e.vu_at, aRevoir, ordre: e.ordre, semaineReelle: e.semaine, semaine, triCreneau,
      }
    }
    const info = cr.contenu_id ? contenuMap.get(cr.contenu_id) : undefined
    const contenuTitre = info && !info.supprime ? info.titre : (cr.titre_affiche || 'contenu retiré')
    if (e.ref_type === 'section') {
      const sec = e.section_id ? sectionMap.get(e.section_id) : undefined
      // Un cours peut être découpé en chapitres ET en sous-chapitres imbriqués
      // (amendement PO 31/08) : le « §§ » garde la hiérarchie lisible là où le
      // prof coche « vu », les éléments restant une liste plate dans l'ordre du texte.
      const marque = sec?.niveau === 2 ? '§§ ' : ''
      return {
        id: e.id, creneauId: cr.id, creneauTitre: contenuTitre, refType: e.ref_type,
        badge: 'Section' as const,
        titre: `${contenuTitre} — ${sec ? `${marque}${sec.titre}` : 'section retirée'}`,
        vuAt: e.vu_at, aRevoir: !sec, ordre: e.ordre, semaineReelle: e.semaine, semaine, triCreneau,
      }
    }
    return {
      id: e.id, creneauId: cr.id, creneauTitre: contenuTitre, refType: e.ref_type,
      badge: (info?.type === 'texte' ? 'Texte' : 'Cours') as 'Texte' | 'Cours',
      titre: contenuTitre,
      vuAt: e.vu_at, aRevoir: false, ordre: e.ordre, semaineReelle: e.semaine, semaine, triCreneau,
    }
  })

  // Regroupement par semaine + tri stable (créneau porteur, puis ordre d'élément).
  const parSemaine = new Map<number, ElementResolu[]>()
  for (const e of resolus) {
    const arr = parSemaine.get(e.semaine) ?? []
    arr.push(e)
    parSemaine.set(e.semaine, arr)
  }
  const apercuParSemaine = new Map((apercuRes?.apercu ?? []).map(a => [a.semaine, a]))
  const liveParSemaine = new Map((apercuLive?.semaines ?? []).map(a => [a.semaine, a]))
  const dense = densifierDecalages(decalages, Math.max(1, nbSemaines))
  const semaines: SemaineInstance[] = []
  for (let k = 1; k <= Math.max(1, nbSemaines); k++) {
    const a = apercuParSemaine.get(k)
    const lundi = a && a.statut === 'definie' && a.dateReelle ? a.dateReelle : null
    const libelle = lundi
      ? `${a!.semestreNom ?? '—'} · sem. ${a!.pedaDansSemestre ?? '—'} — ${libelleLundi(lundi)}`
      : null
    const live = liveParSemaine.get(k)
    const lundiLive = live && live.statut === 'definie' ? live.dateReelle : null
    // Clé d'occupation : la date à venir si elle existe, l'actuelle sinon.
    const cleOccupation = lundiLive ?? lundi
    const els2 = (parSemaine.get(k) ?? []).sort((x, y) =>
      x.triCreneau[0] - y.triCreneau[0] || x.triCreneau[1] - y.triCreneau[1] || x.ordre - y.ordre)
    semaines.push({
      semaine: k,
      libelle,
      lundi,
      lundiApresPublication: lundiLive && lundiLive !== lundi ? lundiLive : null,
      decalage: dense[k - 1] ?? 0,
      // Rapprocher la semaine k la ferait rattraper k−1 dès qu'elles se touchent.
      peutRapprocher: k > 1 && (dense[k - 1] ?? 0) > (dense[k - 2] ?? 0),
      courante: courante != null && courante === k,
      occupee: cleOccupation ? (occupationParLundi.get(cleOccupation) ?? []) : [],
      elements: els2.map(e => ({
        id: e.id, creneauId: e.creneauId, creneauTitre: e.creneauTitre, refType: e.refType,
        badge: e.badge, titre: e.titre, vuAt: e.vuAt, aRevoir: e.aRevoir, ordre: e.ordre,
        semaineReelle: e.semaineReelle,
      })),
    })
  }

  const nonVusPasses = courante == null ? 0
    : resolus.filter(e => e.semaine < courante && e.vuAt == null).length

  // Combien de classes ce MODÈLE sert : « + une semaine » agit sur nb_semaines du
  // parcours, donc sur toutes ces classes — le bouton doit le dire, pas le taire.
  const { data: toutesAssign } = await supabase.from('scriptorium_parcours_classes')
    .select('id').eq('parcours_id', parc.id as string)
  const nbClassesDuParcours = (toutesAssign ?? []).length

  return {
    pcId: pcRow.id as string,
    classeId: classe.id as string,
    classeNom: (classe.nom as string) ?? 'Classe',
    parcoursId: parc.id as string,
    parcoursTitre: parc.titre as string,
    nbSemaines,
    nbClassesDuParcours,
    datee: apercuRes != null,
    semaineCourante: courante,
    nonVusPasses,
    planification: { dateDebut, apercu: apercuLive, snapshot, diff },
    decalages,
    semaines,
  }
}

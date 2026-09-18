// Plan de cours ÉLÈVE — le DTO `PlanEleve` et sa construction (PURE, testée sous
// node --test). Handoff `design_handoff_plan_cours_eleve` (18/09/2026) : la vue
// Année (rail des N semaines d'enseignement + une carte par parcours) devient
// l'écran d'entrée, le parcours s'ouvre en volet.
//
// ANTI-SPOILER : ce DTO ne porte que des TITRES et des STATUTS — jamais un texte de
// contenu (le contenu des semaines à venir n'existe que côté IA). Les libellés
// d'éléments sont ceux du squelette du corpus (`libelleMatiere`), déjà servis à
// l'élève depuis L6 ; `groupes` en est la partie « créneau » (« Cours « X » »).
//
// ⚠️ Éprouvé contre la base AVANT d'être suivi (règle AGENTS.md) — prod du 18/09 :
//  - 32 semaines d'enseignement (24/08/2026 → 10/05/2027), semaine courante 4 ;
//  - 1 à 2 parcours par classe, TOUS titrés (`titre` est NOT NULL en base : le
//    « parcours non dévoilé » de la maquette n'existe pas ; le DTO garde `titre: null`
//    pour le jour où il existera, le serveur ne l'émet jamais aujourd'hui) ;
//  - un parcours peut ALTERNER avec un autre (`decalages`) : « La Naissance de la
//    Tragédie » occupe les semaines d'année 2, 9 et 16 — une barre n'est donc pas un
//    intervalle mais une liste de SEGMENTS ; la piste se réserve sur l'ENJAMBÉE ;
//  - une semaine porte 3 à 25 éléments (1 à 2 créneaux) de 39 à 98 caractères : la
//    carte « en cours » montre les CRÉNEAUX de la semaine, pas les éléments.

import type { AnneeCorpus, InstanceCorpus } from './scriptorium-corpus'
import { statutDe, type StatutElement } from './scriptorium-corpus'
import { formatJour } from './fuseau'
import { libelleAnneeScolaire } from './frise-enseignement'

export type EtatParcours = 'termine' | 'en_cours' | 'a_venir'

export interface SemainePlan {
  k: number
  lundi: string | null          // libellé court (« lun. 15 sept. »), tel que la frise l'affiche
  courante: boolean
  elements: { libelle: string; statut: StatutElement }[]
  groupes: string[]             // créneaux distincts de la semaine (« Cours « X » »), titres seuls
}

export interface ParcoursPlan {
  id: string                    // id de l'assignation — adresse du volet (`?parcours=`)
  titre: string | null          // null = pas encore dévoilé (barre hachurée, compté dans « m autres »)
  semaineDebut: number          // semaine d'ANNÉE (1..nbSemaines) ; 0 si aucune semaine datée
  semaineFin: number
  semainesAnnee: number[]       // semaines d'année occupées, triées — la barre du rail (segments)
  etat: EtatParcours
  semaineCourante: number       // rang DANS le parcours (existant)
  nbSemaines: number
  lundiDebut: string | null     // « 8 septembre » — ISO formaté, jour + mois
  lundiFin: string | null       // lundi de la dernière semaine, même format
  reprise: string | null        // en cours mais pas cette semaine (alternance) : lundi de la prochaine
  nbElements: number
  nbElementsVus: number
  semaines: SemainePlan[]       // inchangé (frise) ; vide si `titre` null
}

export interface PlanEleve {
  annee: {
    libelle: string             // « 2026 – 2027 »
    nbSemaines: number
    semaineCourante: number     // 0 avant la rentrée
    lundiCourant: string | null // « lundi 14 septembre »
    reperes: number[]           // S1, S5, S10… (semaines d'année à étiqueter au-dessus du rail)
    mois: { semaine: number; libelle: string; court: string }[] // repères de mois sous le rail (« novembre » / « nov. »), dérivés des vrais lundis
  }
  parcours: ParcoursPlan[]
}

const jourMois = (iso: string) => formatJour(iso, { day: 'numeric', month: 'long' })

/** Repères S1 · S5 · S10 · … jusqu'à N (le dernier n'est ajouté que s'il est à ≥ 3 du précédent). */
export function reperesDuRail(nb: number): number[] {
  if (nb <= 0) return []
  const out = [1]
  for (let k = 5; k <= nb; k += 5) out.push(k)
  if (nb - out[out.length - 1] >= 3) out.push(nb)
  return out
}

/** Un repère de mois par changement de mois, en gardant ~4 étiquettes lisibles : le
 *  premier mois, puis un mois toutes les `pas` semaines environ (jamais deux voisins). */
export function moisDuRail(lundis: string[]): { semaine: number; libelle: string; court: string }[] {
  if (lundis.length === 0) return []
  const changements: { semaine: number; libelle: string; court: string }[] = []
  let dernier = ''
  lundis.forEach((iso, i) => {
    const m = formatJour(iso, { month: 'long' })
    if (m !== dernier) { changements.push({ semaine: i + 1, libelle: m, court: formatJour(iso, { month: 'short' }) }); dernier = m }
  })
  const pas = Math.max(1, Math.round(lundis.length / 4))
  const retenus: { semaine: number; libelle: string; court: string }[] = []
  for (const c of changements) {
    const prec = retenus[retenus.length - 1]
    if (!prec || c.semaine - prec.semaine >= pas) retenus.push(c)
  }
  return retenus
}

/** Segments contigus d'une liste triée de semaines d'année : [[2,2],[9,9],[16,16]] ou [[1,6]]. */
export function segmentsDe(semaines: number[]): [number, number][] {
  const out: [number, number][] = []
  for (const s of semaines) {
    const dernier = out[out.length - 1]
    if (dernier && s === dernier[1] + 1) dernier[1] = s
    else out.push([s, s])
  }
  return out
}

/**
 * Répartition des parcours sur les pistes du rail — glouton, première piste libre.
 * L'occupation est l'ENJAMBÉE [debut, fin] (un parcours qui alterne réserve tout son
 * intervalle : deux parcours entrelacés sur une même ligne seraient illisibles).
 * Rend, dans l'ordre des parcours reçus, le numéro de piste (0-based) ; les parcours
 * sans semaine datée (debut 0) n'ont pas de piste (-1).
 */
export function pistesDuRail(parcours: { semaineDebut: number; semaineFin: number }[]): number[] {
  const pistes: [number, number][][] = []
  const ordre = parcours.map((p, i) => i).sort((a, b) =>
    parcours[a].semaineDebut - parcours[b].semaineDebut || parcours[a].semaineFin - parcours[b].semaineFin || a - b)
  const out = new Array<number>(parcours.length).fill(-1)
  for (const i of ordre) {
    const p = parcours[i]
    if (p.semaineDebut <= 0) continue
    let piste = pistes.findIndex(occ => occ.every(([d, f]) => p.semaineFin < d || p.semaineDebut > f))
    if (piste === -1) { piste = pistes.length; pistes.push([]) }
    pistes[piste].push([p.semaineDebut, p.semaineFin])
    out[i] = piste
  }
  return out
}

export function etatParcours(semaineDebut: number, semaineFin: number, couranteAnnee: number): EtatParcours {
  if (semaineDebut <= 0) return 'a_venir'
  if (couranteAnnee < semaineDebut) return 'a_venir'
  if (couranteAnnee > semaineFin) return 'termine'
  return 'en_cours'
}

/**
 * Construit le DTO élève depuis la matière structurée de la classe. `matiere` null
 * (aucune instance active datée) → plan vide, année à zéro.
 */
export function construirePlanEleve(
  matiere: { instances: InstanceCorpus[]; annee: AnneeCorpus } | null,
): PlanEleve {
  if (!matiere) {
    return { annee: { libelle: '', nbSemaines: 0, semaineCourante: 0, lundiCourant: null, reperes: [], mois: [] }, parcours: [] }
  }
  const { annee } = matiere
  const courante = annee.semaineCourante
  const parcours: ParcoursPlan[] = matiere.instances.map((inst, i) => {
    const parSemaine = new Map<number, { libelle: string; statut: StatutElement }[]>()
    const groupesParSemaine = new Map<number, string[]>()
    let vus = 0
    for (const e of inst.elements) {
      const statut = statutDe(e, inst.semaineCourante)
      if (statut === 'vu') vus++
      const arr = parSemaine.get(e.semaine) ?? []
      arr.push({ libelle: e.libelleMatiere, statut })
      parSemaine.set(e.semaine, arr)
      const g = groupesParSemaine.get(e.semaine) ?? []
      if (!g.includes(e.groupeLibelle)) g.push(e.groupeLibelle)
      groupesParSemaine.set(e.semaine, g)
    }
    const semainesAnnee = Object.values(inst.semainesAnnee ?? {}).sort((a, b) => a - b)
    const semaineDebut = semainesAnnee[0] ?? 0
    const semaineFin = semainesAnnee[semainesAnnee.length - 1] ?? 0
    const etat = etatParcours(semaineDebut, semaineFin, courante)
    const iso = inst.lundisISO ?? {}
    const ks = Object.keys(iso).map(Number).sort((a, b) => a - b)
    const lundiDebut = ks.length ? jourMois(iso[ks[0]]) : null
    const lundiFin = ks.length ? jourMois(iso[ks[ks.length - 1]]) : null
    // Alternance : en cours, mais la semaine d'année courante n'est pas une des siennes →
    // la prochaine semaine datée du parcours strictement après la courante.
    let reprise: string | null = null
    if (etat === 'en_cours' && !semainesAnnee.includes(courante)) {
      const kProchaine = ks.find(k => (inst.semainesAnnee?.[k] ?? 0) > courante)
      if (kProchaine != null) reprise = jourMois(iso[kProchaine])
    }
    return {
      id: inst.pcId ?? `parcours-${i}`,
      titre: inst.parcoursTitre,
      semaineDebut, semaineFin, semainesAnnee, etat,
      semaineCourante: inst.semaineCourante,
      nbSemaines: inst.nbSemaines,
      lundiDebut, lundiFin, reprise,
      nbElements: inst.elements.length,
      nbElementsVus: vus,
      semaines: Array.from({ length: inst.nbSemaines }, (_, k) => k + 1)
        .filter(k => (parSemaine.get(k) ?? []).length > 0)
        .map(k => ({
          k,
          lundi: inst.lundis[k] ?? null,
          courante: k === inst.semaineCourante,
          elements: parSemaine.get(k) ?? [],
          groupes: groupesParSemaine.get(k) ?? [],
        })),
    }
  })
  return {
    annee: {
      libelle: libelleAnneeScolaire(annee.ay).replace('-', ' – '),
      nbSemaines: annee.nbSemaines,
      semaineCourante: courante,
      lundiCourant: courante > 0 && annee.lundis[courante - 1]
        ? formatJour(annee.lundis[courante - 1], { weekday: 'long', day: 'numeric', month: 'long' })
        : null,
      reperes: reperesDuRail(annee.nbSemaines),
      mois: moisDuRail(annee.lundis),
    },
    parcours,
  }
}

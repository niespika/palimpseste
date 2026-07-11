import type { CapstoneLien, ReferenceChapitre } from '@/app/eleve/modules/aletheia/types'

// ── Utilitaires PURS de la vue livre (importables serveur et client) ──────────

export type EtatFiche = 'prete' | 'amendee' | 'a_generer'

// Une semaine du livre côté vue (un document par semaine ; textes fusionnés si plusieurs).
export interface SemaineVue {
  semaine: number
  titre: string
  chapitres: string | null
  texte: string | null
}

// Formate une date Postgres (« YYYY-MM-DD ») sans passer par `new Date`, qui
// la parse en UTC puis la reformate dans le fuseau du serveur (dérive d'un jour).
// Instant ISO → « JJ/MM » (getters UTC : dérive possible d'un jour autour de minuit
// UTC, négligeable pour un libellé indicatif — lire le fuseau coûterait une requête).
export function formatJourMois(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

// État d'une fiche de semaine. `amendeGlobal` = amende_par_prof du livre : seul
// marquage disponible pour le contenu antérieur aux stamps par semaine (approximation
// legacy — on ne sait pas QUELLE semaine a été touchée).
export function etatFiche(chapitre: ReferenceChapitre | undefined, amendeGlobal: boolean): EtatFiche {
  if (!chapitre || !chapitre.these_canonique.trim()) return 'a_generer'
  if (chapitre.amende_le) return 'amendee'
  if (!chapitre.genere_le && amendeGlobal) return 'amendee'
  return 'prete'
}

// Sous-statut du badge (« générée le 12/06 », « générée le … · amendée le … »…).
// `updatedAt` = updated_at global de la référence (repli pour le contenu legacy).
export function sousStatutFiche(chapitre: ReferenceChapitre | undefined, etat: EtatFiche, updatedAt: string | null): string {
  if (etat === 'a_generer') return 'aucun contenu pour l’instant'
  const genere = chapitre?.genere_le ? formatJourMois(chapitre.genere_le) : updatedAt ? formatJourMois(updatedAt) : ''
  if (etat === 'amendee') {
    const amende = chapitre?.amende_le ? formatJourMois(chapitre.amende_le) : ''
    if (chapitre?.genere_le && amende) return `générée le ${genere} · amendée le ${amende}`
    if (amende) return `amendée le ${amende}`
    return 'amendée à la main'
  }
  return genere ? `générée le ${genere}` : 'générée'
}

// ── Résolution des liens de la carte vers des numéros de semaine ──────────────
// CapstoneLien.de/vers sont des chaînes LIBRES (noms de chapitres produits par l'IA
// ou saisis par le prof) : on tente de les rapprocher des semaines du livre pour
// rendre « S2 → S6 » cliquable ; une extrémité non résolue reste un libellé brut.

export interface LienResolu {
  de: number | null
  vers: number | null
  relation: string
  brutDe: string
  brutVers: string
}

// Même recette que utils/detecteur-integrite.ts : accents retirés, minuscules,
// ponctuation → espace, espaces effondrés.
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function resoudreLiens(
  liens: CapstoneLien[],
  semaines: { semaine: number; titre: string; chapitres: string | null }[],
): LienResolu[] {
  // Index clé normalisée (titre / chapitres) → semaine. Une clé portée par deux
  // semaines différentes est ambiguë : marquée null, jamais résolue.
  const index = new Map<string, number | null>()
  const poser = (brut: string | null, sem: number) => {
    const cle = brut ? normaliser(brut) : ''
    if (!cle) return
    if (index.has(cle) && index.get(cle) !== sem) index.set(cle, null)
    else index.set(cle, sem)
  }
  for (const s of semaines) {
    poser(s.titre, s.semaine)
    poser(s.chapitres, s.semaine)
  }
  const numeros = new Set(semaines.map(s => s.semaine))

  const resoudre = (brut: string): number | null => {
    const cle = normaliser(brut)
    if (!cle) return null
    // « s6 » / « semaine 6 » — accepté aussi en préfixe (« semaine 6 le titre »).
    const motif = cle.match(/^s(?:emaine)?\s*0*(\d+)\b/)
    if (motif) {
      const n = Number(motif[1])
      if (numeros.has(n)) return n
    }
    if (index.has(cle)) return index.get(cle) ?? null
    // Inclusion UNIQUE (les deux formes ≥ 4 caractères pour éviter le bruit).
    if (cle.length >= 4) {
      const candidats = new Set<number>()
      for (const [k, sem] of index) {
        if (sem == null || k.length < 4) continue
        if (k.includes(cle) || cle.includes(k)) candidats.add(sem)
      }
      if (candidats.size === 1) return [...candidats][0]
    }
    return null
  }

  return liens.map(l => ({
    de: resoudre(l.de),
    vers: resoudre(l.vers),
    relation: l.relation,
    brutDe: l.de,
    brutVers: l.vers,
  }))
}

// ── Sélection de semaine (état d'URL) ─────────────────────────────────────────

// `?semaine=` validé : entier présent parmi les semaines existantes, sinon undefined.
export function semaineValide(param: string | undefined, semaines: { semaine: number }[]): number | undefined {
  if (!param) return undefined
  const n = Number(param)
  if (!Number.isInteger(n)) return undefined
  return semaines.some(s => s.semaine === n) ? n : undefined
}

// Séance sélectionnée par défaut dans la vue-livre : la PREMIÈRE séance (décision Q9,
// book-level, décorrélée de toute date — mode a sans date). Snap à la plus petite
// séance existante (les numéros peuvent avoir des trous).
export function semaineParDefaut(semaines: { semaine: number }[]): number {
  if (semaines.length === 0) return 1
  return Math.min(...semaines.map(s => s.semaine))
}

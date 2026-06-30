// Utilitaires de découpe partagés entre la CRÉATION (à partir d'un PDF) et la
// MODIFICATION (re-découpe d'un livre existant). Module pur (ni 'use server' ni
// 'use client') → importable des deux côtés.

// Réassemble les textes des semaines (dans l'ordre) en UN texte continu, et renvoie
// pour chaque semaine ses bornes de LIGNE (1-based, fin incluse) dans ce texte.
// Le client (réassemblage pour le navigateur) et le serveur (re-découpe) appellent
// cette même fonction sur les mêmes textes → mêmes index de ligne.
export function reassemblerLivre(textes: string[]): { texte: string; bornes: { debutLigne: number; finLigne: number }[] } {
  const lignes: string[] = []
  const bornes: { debutLigne: number; finLigne: number }[] = []
  for (const t of textes) {
    const ls = (t ?? '').split('\n')
    const debutLigne = lignes.length + 1
    for (const l of ls) lignes.push(l)
    bornes.push({ debutLigne, finLigne: lignes.length })
  }
  return { texte: lignes.join('\n'), bornes }
}

export interface PosLigne { p: number; l: number }
export interface Signet { titre: string; page: number; niveau: number }

// Nombre de lignes par page en RE-DÉCOUPE (le texte réassemblé est synthétiquement
// re-paginé en pages de lecture). N'affecte PAS la création (vraies pages du PDF).
export const LIGNES_PAR_PAGE = 32

// Découpe un texte continu en « pages » de lecture (chunk PUR du tableau split('\n')).
// INVARIANT : préserve exactement le nombre total de lignes (Σ des lignes des pages
// == texte.split('\n').length). La garde anti-dérive (TOCTOU) de modifierLivreComplet
// en dépend — ne jamais reformater/wrapper les lignes ici.
export function paginer(texte: string, lignesParPage: number = LIGNES_PAR_PAGE): string[] {
  const lignes = (texte ?? '').split('\n')
  const n = Math.max(1, lignesParPage)
  const pages: string[] = []
  for (let i = 0; i < lignes.length; i += n) pages.push(lignes.slice(i, i + n).join('\n'))
  return pages.length ? pages : ['']
}

// Convertit une position {p,l} (page 1-based, ligne 1-based dans la page) en numéro de
// ligne GLOBAL 1-based dans le texte réassemblé. Σ des lignes des pages avant p, + l.
export function posVersLigneGlobale(pages: string[], pos: PosLigne): number {
  let avant = 0
  for (let i = 0; i < pos.p - 1 && i < pages.length; i++) avant += pages[i].split('\n').length
  return avant + pos.l
}

// Inverse de posVersLigneGlobale : un numéro de ligne GLOBAL 1-based → {p,l}.
// Sert à pré-placer les marqueurs (bornesInitiales) après re-pagination.
export function ligneGlobaleVersPos(pages: string[], ligne: number): PosLigne {
  let reste = ligne
  for (let p = 0; p < pages.length; p++) {
    const nb = pages[p].split('\n').length
    if (reste <= nb) return { p: p + 1, l: reste }
    reste -= nb
  }
  // Au-delà du total (ne devrait pas arriver) : dernière ligne de la dernière page.
  const dern = Math.max(1, pages.length)
  return { p: dern, l: Math.max(1, (pages[dern - 1] ?? '').split('\n').length) }
}

// Acronyme d'un titre de livre : initiales des mots significatifs (ignore articles et
// prépositions), MAJUSCULES, 3 max. Repli : 2 premières lettres du titre, ou 'PDF' si vide.
const MOTS_VIDES = new Set(['la', 'le', 'les', "l'", 'de', 'des', 'du', "d'", 'et', 'à', 'a', 'un', 'une', 'the', 'of', 'and', 'to', 'in'])
export function initialesLivre(titre: string): string {
  const mots = (titre ?? '')
    .split(/[\s'’-]+/)
    .map(m => m.trim())
    .filter(m => m.length > 0 && !MOTS_VIDES.has(m.toLowerCase()))
  if (mots.length > 0) return mots.slice(0, 3).map(m => m[0]!.toUpperCase()).join('')
  const net = (titre ?? '').replace(/[^\p{L}]/gu, '')
  return net ? net.slice(0, 2).toUpperCase() : 'PDF'
}

// Apparie chaque signet à une LIGNE par correspondance de titre, et renvoie une map
// "p:l" → { niveau, titre } que PageLivre lit pour styler les titres.
// - opts.parPage (CRÉATION) : on cherche le titre DANS sa page PDF (signet.page).
// - sinon (RE-DÉCOUPE) : la pagination est synthétique → on cherche globalement, page
//   par page, dans l'ordre du livre (1er match consommé).
// Correspondance : la ligne (trim) ÉGALE le titre (trim) ou COMMENCE par lui (insensible
// à la casse/espaces). Repli propre : signets vide / aucun match → map vide.
export function apparierSignets(
  lignesParPage: string[][],
  signets: Signet[] | null | undefined,
  opts: { parPage: boolean },
): Map<string, { niveau: number; titre: string }> {
  const out = new Map<string, { niveau: number; titre: string }>()
  if (!signets || signets.length === 0) return out
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  const utilisees = new Set<string>()   // "p:l" déjà prises

  // Une ligne correspond à un signet si les textes (normalisés) sont égaux, ou si l'un
  // est un PRÉFIXE de l'autre ET que le plus court couvre l'essentiel du plus long
  // (≥ 60 %, ≥ 4 caractères). La garde de ratio évite qu'un signet court (« I », « Part »)
  // « avale » une ligne bien plus longue par simple préfixe (faux titre).
  const correspond = (a: string, b: string): boolean => {
    if (!a || !b) return false
    if (a === b) return true
    const court = a.length <= b.length ? a : b
    const long = a.length <= b.length ? b : a
    return long.startsWith(court) && court.length >= 4 && court.length >= long.length * 0.6
  }

  const chercherDansPage = (p: number, cible: string): number | null => {
    const lignes = lignesParPage[p - 1] ?? []
    for (let i = 0; i < lignes.length; i++) {
      const cle = `${p}:${i + 1}`
      if (utilisees.has(cle)) continue
      if (correspond(norm(lignes[i]), cible)) return i + 1
    }
    return null
  }

  for (const sg of signets) {
    const cible = norm(sg.titre)
    if (!cible) continue
    let trouve: { p: number; l: number } | null = null
    if (opts.parPage && sg.page >= 1 && sg.page <= lignesParPage.length) {
      const l = chercherDansPage(sg.page, cible)
      if (l) trouve = { p: sg.page, l }
    }
    if (!trouve) {
      for (let p = 1; p <= lignesParPage.length && !trouve; p++) {
        const l = chercherDansPage(p, cible)
        if (l) trouve = { p, l }
      }
    }
    if (trouve) {
      const cle = `${trouve.p}:${trouve.l}`
      utilisees.add(cle)
      out.set(cle, { niveau: sg.niveau, titre: sg.titre })
    }
  }
  return out
}

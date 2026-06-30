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

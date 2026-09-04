// ============================================================================
// ALETHEIA — LES LIENS DE LA CARTE D'ARCHITECTURE, EN PHRASES (module PUR).
// ----------------------------------------------------------------------------
// Demande de Louis (04/09) : plus de flèche ni de verbe nu (« S1 → S2 · prépare : … »).
// Un lien se lit seul : « La séance 1 prépare la séance 2 : poser le problème appelle… ».
// Le modèle rend désormais une phrase complète ; les cartes d'avant (« prépare : … ») sont
// recomposées ici, à l'affichage, sans toucher aux données.
// ============================================================================

const nom = (x: string | number | null | undefined): string =>
  typeof x === 'number' ? `la séance ${x}` : (x ?? '').toString().trim() ? `« ${(x as string).trim()} »` : 'cette séance'

/** « La séance 1 prépare la séance 2 : … » — de/vers en numéros de séance ou en titres de chapitre. */
export function phraseDuLienCarte(de: string | number | null | undefined, vers: string | number | null | undefined, relation: string | null | undefined): string {
  const r = (relation ?? '').trim()
  if (!r) return `${majuscule(nom(de))} mène à ${nom(vers)}.`
  // Déjà une phrase (le nouveau prompt, ou un prof qui l'a écrite ainsi).
  if (/^(la séance|la semaine|le chapitre|cette séance|ce chapitre|«)/i.test(r)) return /[.!?]$/.test(r) ? r : `${r}.`
  const m = /^([^:]{1,40}?)\s*:\s*([\s\S]+)$/.exec(r)
  const verbe = (m ? m[1] : r).trim().toLowerCase()
  const reste = m ? m[2].trim().replace(/[.]$/, '') : ''
  const tete = `${majuscule(nom(de))} ${verbe} ${nom(vers)}`
  return reste ? `${tete} : ${reste}.` : `${tete}.`
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

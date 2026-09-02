// Le MODÈLE d'un parcours et ses INSTANCES de classe (02/09/2026) — les règles PURES
// de la propagation, sans base ni client. Exécutées par `app/prof/scriptorium/actions.ts`,
// éprouvées dans `parcours-propagation.test.ts`.
//
// ⭐ POURQUOI. « Je sais combien de temps vont durer mes cours, mais le contenu exact,
//    je ne sais pas » (Louis, 01/09) : un parcours se remplit au fil de l'année, APRÈS
//    avoir été assigné. Or l'instance d'une classe était une photo du modèle prise à
//    l'assignation — un cours ajouté ensuite n'arrivait dans aucune classe.
//
// ⭐ LA RÈGLE, EN UNE PHRASE. Ce que le modèle ajoute, retire ou déplace, les classes le
//    suivent — SAUF CE QU'UNE CLASSE A DÉJÀ VU. Une copie dont aucun élément n'est coché
//    « vu » est encore une intention du modèle : elle suit. Dès qu'un élément est vu, la
//    copie appartient à l'histoire de la classe, et le modèle ne la touche plus.

/** Une copie d'un créneau du modèle dans une instance, telle que la propagation la voit. */
export interface CopieDeModele {
  id: string          // créneau d'INSTANCE
  pcId: string        // assignation (scriptorium_parcours_classes.id)
  modeleId: string    // créneau du MODÈLE dont elle est la copie
  semaine: number
  ordre: number
  vue: boolean        // au moins un de ses éléments est coché « vu »
}

/**
 * Partage les copies entre celles qui SUIVENT le modèle (intactes) et celles qui
 * RESTENT à la classe (vues). Les comptes sont en CLASSES distinctes, parce que c'est
 * ce que le professeur lit : « retiré de 2 classes ; conservé dans 1 ».
 */
export function partagerCopies(copies: CopieDeModele[]): {
  intactes: CopieDeModele[]
  vues: CopieDeModele[]
  nbClassesIntactes: number
  nbClassesVues: number
} {
  const intactes = copies.filter(c => !c.vue)
  const vues = copies.filter(c => c.vue)
  return {
    intactes,
    vues,
    nbClassesIntactes: new Set(intactes.map(c => c.pcId)).size,
    nbClassesVues: new Set(vues.map(c => c.pcId)).size,
  }
}

/**
 * RÉORDONNANCEMENT — les copies d'une semaine d'instance permutent PARMI LES POSITIONS
 * QU'ELLES OCCUPENT DÉJÀ, dans l'ordre du modèle. Les créneaux propres à la classe
 * gardent leur position exacte : on ne réécrit que ce qui vient du modèle, et l'instance
 * ne sait pas réordonner ses créneaux — il n'y a donc aucun choix de classe à écraser.
 * Ne renvoie que les copies dont l'ordre CHANGE (la permutation restreinte à celles-ci
 * reste une permutation : les positions écrites sont exactement celles libérées).
 * Une copie dont le modèle n'est pas dans `ordreModele` passe après les autres.
 */
export function reassignerPositions(
  copies: { id: string; modeleId: string; ordre: number }[],
  ordreModele: string[],
): { id: string; ordre: number }[] {
  const rang = new Map(ordreModele.map((id, i) => [id, i]))
  const positions = copies.map(c => c.ordre).sort((a, b) => a - b)
  const triees = [...copies].sort((a, b) =>
    (rang.get(a.modeleId) ?? Number.POSITIVE_INFINITY) - (rang.get(b.modeleId) ?? Number.POSITIVE_INFINITY)
    || a.ordre - b.ordre)
  return triees
    .map((c, i) => ({ id: c.id, ordre: positions[i] }))
    .filter(n => copies.find(c => c.id === n.id)!.ordre !== n.ordre)
}

/** La CIBLE d'un créneau (modèle ou instance) : ce qu'il sert, indépendamment de sa place. */
export interface CibleCreneau {
  refType: string
  contenuId: string | null
  livreId: string | null
  livreSemaineDebut: number | null
  livreSemaineFin: number | null
}

/** Deux créneaux servent-ils exactement la même chose (même contenu, ou même livre et même tranche) ? */
export function memeCible(a: CibleCreneau, b: CibleCreneau): boolean {
  if (a.refType !== b.refType) return false
  if (a.refType === 'contenu') return a.contenuId != null && a.contenuId === b.contenuId
  return a.livreId != null && a.livreId === b.livreId
    && (a.livreSemaineDebut ?? null) === (b.livreSemaineDebut ?? null)
    && (a.livreSemaineFin ?? null) === (b.livreSemaineFin ?? null)
}

/**
 * CE QUI MANQUE À UNE CLASSE — les créneaux du modèle sans copie dans l'instance, une fois
 * reconnus ceux que la classe avait AJOUTÉS ELLE-MÊME avec la même cible (un cours posé à la
 * main dans l'instance avant d'être posé dans le modèle n'est pas « absent » : il est là).
 * Chaque créneau propre ne reconnaît qu'un créneau du modèle — deux fois le même cours
 * dans le modèle demande deux créneaux dans la classe.
 */
export function absentsDuModele<M extends CibleCreneau & { id: string }>(
  modele: M[],
  instance: (CibleCreneau & { modeleId: string | null })[],
): M[] {
  const copies = new Set(instance.map(c => c.modeleId).filter((x): x is string => !!x))
  const propres = instance.filter(c => !c.modeleId)
  const pris = new Set<number>()
  const absents: M[] = []
  for (const m of modele) {
    if (copies.has(m.id)) continue
    const i = propres.findIndex((p, idx) => !pris.has(idx) && memeCible(m, p))
    if (i >= 0) { pris.add(i); continue }
    absents.push(m)
  }
  return absents
}

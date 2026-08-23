// ============================================================================
// C4 · L10 — LES SLOTS D'UN PROMPT, ET LE REFUS QUI TOMBE AU CHARGEMENT.
// ----------------------------------------------------------------------------
// « La chaîne ne substitue AUCUN slot de prompt, et les six fiches en portent.
//   Aujourd'hui le modèle recevrait la chaîne littérale `{copie}`. »
//
// Les prompts des fiches sont des GABARITS À SLOTS NOMMÉS — `{sujet}`,
// `{copie}`, `{pre_releve}`, `{releve_phase_1}`… Le banc de calibration a toute
// la machinerie (`copies-tests/_commun/banc.py` : `slots_du`, `separe_slots`,
// `verifie_slots_p1`, `verifie_slots_p2`) et il REFUSE AVANT TOUT APPEL, dans
// les deux sens :
//
//   · « REFUS : slot(s) du prompt P1 sans fournisseur » ;
//   · « REFUS : pre_p1 fournit … que le prompt P1 ne contient pas — un bloc
//     calculé qui n'est jamais injecté est un TROU SILENCIEUX ».
//
// Ce module porte le même contrôle et le même refus dans la chaîne. Il tombe
// AU CHARGEMENT — `verifierCoherence()` l'exécute, donc la suite de tests et la
// recette —, jamais au premier appel : un appel dépensé sur une chaîne qui
// produirait des trous est un appel perdu, et la mesure qui en sort est fausse.
//
// ⚠️ C'est pourquoi un branchement DÉCLARE les slots qu'il remplit au lieu de se
//    contenter de les remplir : une déclaration se contrôle sans dépôt sous la
//    main, une valeur non. Le désaccord entre la déclaration et ce que le
//    crochet rend vraiment est repris à l'exécution, et il alerte.
// ============================================================================

import { baliser, declarationDeMateriau, type BlocMateriau } from './anti-injection'

/**
 * La forme d'un slot — celle du banc, à l'identique
 * (`banc.py` : `RE_SLOT = re.compile(r"\{([a-z][a-z0-9_]*)\}")`).
 *
 * ⚠️ La minuscule initiale n'est pas décorative : elle sépare les slots des
 *    prompts de fiche des variables `{{MAJUSCULES}}` du gabarit de Calame
 *    (`07-` §4). Deux conventions, deux substituants, aucun recouvrement.
 */
const RE_SLOT = /\{([a-z][a-z0-9_]*)\}/g

/** Les noms des slots d'un gabarit, dans l'ordre où ils apparaissent. */
export function slotsDu(gabarit: string): string[] {
  const vus = new Set<string>()
  for (const m of (gabarit ?? '').matchAll(RE_SLOT)) {
    if (!vus.has(m[1])) vus.add(m[1])
  }
  return [...vus]
}

/**
 * La TÊTE INVARIANTE d'un gabarit, et sa queue.
 *
 * La tête est tout ce qui précède le premier slot : elle ne porte aucun slot,
 * donc elle est IDENTIQUE d'une copie à l'autre, donc elle se cache — « la mise
 * en cache du préfixe commun est une exigence, pas une astuce » (`07-` §2,
 * C4-L5). Sur les six fiches, c'est le rôle, le principe, le catalogue et le
 * schéma de sortie : tout le prompt sauf ses dernières lignes.
 *
 * ⚠️ La coupe se fait sur le GABARIT, jamais sur le texte substitué : c'est ce
 *    qui garantit que la tête ne peut pas contenir un mot de l'élève.
 */
export function separerTete(gabarit: string): { tete: string; queue: string } {
  const m = new RegExp(RE_SLOT.source).exec(gabarit ?? '')
  if (!m) return { tete: gabarit ?? '', queue: '' }
  return { tete: (gabarit ?? '').slice(0, m.index), queue: (gabarit ?? '').slice(m.index) }
}

/**
 * La substitution — chaque slot reçoit sa valeur SOUS BALISE.
 *
 * ⭐ Tout ce que la chaîne injecte est du MATÉRIAU, jamais une instruction : la
 *    copie de l'élève, le pré-relevé calculé sur ses mots, le sujet, le relevé
 *    que P1 a rendu. Aucun n'a à être obéi. Les baliser tous est plus simple
 *    qu'un tri par slot — et strictement plus sûr que la première des quatre
 *    défenses du `01-` §12, qui ne l'exige que de la copie.
 *
 * ⛔ ET LE GABARIT BRUT NE PART JAMAIS À CÔTÉ DU SUBSTITUÉ. La leçon est déjà
 *    payée sur Calame (`chaine.ts`) : « empiler le gabarit brut à côté du
 *    substitué donnait au modèle DEUX exemplaires contradictoires du même
 *    contrat ». Ici elle coûterait plus cher encore — la copie brute à côté de
 *    la copie RENUMÉROTÉE, dont les numéros de phrase sont ceux que tout le
 *    relevé désigne.
 */
export function substituer(queue: string, valeurs: Readonly<Record<string, string>>): string {
  let sortie = queue
  for (const [nom, valeur] of Object.entries(valeurs)) {
    const bloc: BlocMateriau = { nom, contenu: valeur }
    sortie = sortie.split(`{${nom}}`).join(baliser([bloc]))
  }
  return sortie
}

/**
 * Le message d'un appel à gabarit : la déclaration de matériau, puis la queue
 * substituée, puis la demande. L'ordre compte — la déclaration doit précéder ce
 * qu'elle déclare, et les blocs vivent maintenant DANS la queue.
 */
export function messageDuGabarit(
  queue: string,
  valeurs: Readonly<Record<string, string>>,
  demande: string,
): string {
  const noms = Object.keys(valeurs)
  if (!noms.length) return [queue, demande].filter(Boolean).join('\n\n')
  return [declarationDeMateriau(noms), substituer(queue, valeurs), demande]
    .filter(Boolean).join('\n\n')
}

// ── Les refus, portés du banc et rendus AU CHARGEMENT ───────────────────────

/**
 * Les deux sens du contrôle d'un étage d'extraction — `banc.py`
 * `verifie_slots_p1`. Rend la liste des refus ; vide quand tout se tient.
 *
 * `natifs` : ce que le CONTEXTE DE L'EXERCICE sert (sujet, copie, consigne…).
 * `fournis` : ce que le crochet pré-phase DÉCLARE remplir.
 */
export function refusSlotsExtraction(
  gabarit: string,
  fournis: readonly string[],
  natifs: readonly string[],
  quoi: string,
): string[] {
  const refus: string[] = []
  const slots = new Set(slotsDu(gabarit))
  const ensFournis = new Set(fournis)
  const ensNatifs = new Set(natifs)
  const sansFournisseur = [...slots].filter((s) => !ensFournis.has(s) && !ensNatifs.has(s))
  if (sansFournisseur.length) {
    refus.push(`REFUS : slot(s) du prompt ${quoi} sans fournisseur : ${sansFournisseur.join(', ')}. `
      + `Ils doivent venir du contexte de l'exercice (${[...ensNatifs].sort().join(', ') || 'aucun'}) `
      + `ou du crochet pré-phase.`)
  }
  // L'autre sens, et c'est celui qu'on oublie : un bloc CALCULÉ que le prompt
  // n'injecte nulle part est un travail fait pour rien, et rien ne le dit.
  const jamaisInjectes = [...ensFournis].filter((s) => !slots.has(s))
  if (jamaisInjectes.length) {
    refus.push(`REFUS : le crochet pré-phase fournit ${jamaisInjectes.join(', ')} que le prompt `
      + `${quoi} ne contient pas — un bloc calculé qui n'est jamais injecté est un trou silencieux.`)
  }
  return refus
}

/**
 * Le contrôle d'un étage de jugement — `banc.py` `verifie_slots_p2`. Rend le
 * slot du DOCUMENT et les refus.
 *
 * « Le slot du document se déclare dès que le prompt P2 en porte plus d'un »
 * (`CONTRAT-MODULES.md` §2, `SLOT_DOCUMENT_P2`) ; quand le prompt n'a qu'un
 * slot, c'est lui, sans déclaration. *Deviner le document par soustraction
 * marcherait — jusqu'au jour où un `pre_p2` incomplet ferait passer le relevé
 * entier dans le slot du référent, sans que rien ne le voie.*
 *
 * ⚠️ `injection_p2` n'est pas construit — AUCUN module ne l'utilise, et on ne
 *    bâtit pas un canal sans client. Un slot de P2 qui ne serait ni le document
 *    ni servi par `preP2` est donc un refus, sans échappatoire.
 */
export function refusSlotsJugement(
  gabarit: string,
  slotDocumentDeclare: string | null,
  fournis: readonly string[],
  natifs: readonly string[],
): { slotDocument: string | null; refus: string[] } {
  const refus: string[] = []
  const slots = slotsDu(gabarit)
  if (!slots.length) {
    return { slotDocument: null,
      refus: ['REFUS : le prompt de jugement ne porte aucun slot — le juge ne recevrait pas '
        + 'le document produit par la chaîne.'] }
  }
  let doc = slotDocumentDeclare
  if (doc == null) {
    if (slots.length !== 1) {
      refus.push(`REFUS : le prompt de jugement porte ${slots.length} slots (${slots.join(', ')}) `
        + `et le branchement ne dit pas lequel est le document. Déclarer \`slotDocument\` `
        + '(`CONTRAT-MODULES.md` §2, `SLOT_DOCUMENT_P2`).')
      return { slotDocument: null, refus }
    }
    doc = slots[0]
  } else if (!slots.includes(doc)) {
    refus.push(`REFUS : le branchement déclare \`slotDocument\` « ${doc} », absent du prompt de `
      + `jugement (${slots.join(', ')}).`)
    return { slotDocument: null, refus }
  }
  const ensFournis = new Set(fournis)
  const ensNatifs = new Set(natifs)
  const restants = slots.filter((s) => s !== doc && !ensFournis.has(s) && !ensNatifs.has(s))
  if (restants.length) {
    refus.push(`REFUS : slot(s) du prompt de jugement sans fournisseur : ${restants.join(', ')}. `
      + "Ils doivent venir de `preP2` (le contexte de l'exercice). Un slot qui se calcule sur le "
      + 'RELEVÉ passerait par `injection_p2`, qu\'aucun module n\'utilise et que la chaîne ne '
      + 'construit pas : dans ce cas la règle du contrat §2 est à rouvrir, pas à contourner.')
  }
  const jamaisInjectes = [...ensFournis].filter((s) => !slots.includes(s) || s === doc)
  if (jamaisInjectes.length) {
    refus.push(`REFUS : \`preP2\` fournit ${jamaisInjectes.join(', ')} que le prompt de jugement `
      + "ne contient pas (ou qui EST le document) — un slot servi et jamais injecté est un trou "
      + 'silencieux.')
  }
  return { slotDocument: doc, refus }
}

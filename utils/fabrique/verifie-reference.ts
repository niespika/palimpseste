// ============================================================================
// C4 · L8 — LE CONTRÔLE DE LA RÉFÉRENCE DÉCOMPOSÉE, porté en plateforme.
// ----------------------------------------------------------------------------
// Port fidèle de `copies-tests/_commun/verifie-reference.py` (dépôt
// `palimpseste-conception`), qui FAIT FOI : treize refus, deux blocages, sept
// signalements — « et il ne les confond pas » (`05-` §4.7).
//
// POURQUOI UN PORT, ET PAS UN APPEL
//   Le script vit dans l'autre dépôt, en Python, et sert le GÉNÉRATEUR hors
//   plateforme. La plateforme, elle, doit rendre le même verdict à l'import
//   (refus n° 17, blocage n° 2 — `08-` §7) et à la validation d'une référence
//   corrigée (`05-` §4.5). Elle ne peut pas dépendre d'un interpréteur Python.
//
// CE QUI TIENT LE PORT HONNÊTE — et c'est la seule preuve qui vaille :
//   `utils/fabrique/verifie-reference.test.ts` REJOUE les vecteurs d'autotest
//   du script — la référence conforme qui doit passer, les treize refus
//   provoqués un par un, les deux blocages (« ils bloquent et ne refusent
//   pas »), les trois marquages doubles qui doivent passer, les sept
//   signalements. « Ce que tu construis doit rendre les mêmes verdicts sur les
//   mêmes vecteurs — c'est la preuve du port, la seule » (piège 22).
//
// ⚠️ LE CRIBLE « CITE OU REFUSE » NE VIT PAS ICI, ET C'EST VOULU.
//   Le script porte cinq phrases exactes du `02-` §6 A et refuse de juger si
//   l'une d'elles a bougé. La plateforme n'a pas les sources sous la main : son
//   équivalent est le CONTRÔLE DE DÉRIVATION (`scripts/derive-doctrine.py
//   --verifie`), qui compare les empreintes des sources à celles du dernier
//   remplissage. Les quatre listes fermées ci-dessous sont donc recopiées du
//   `02-` §6 A, et c'est le seul endroit du lot où quelque chose l'est : le
//   format de la référence n'a PAS de table dérivée, et le §1.1 dit que « le
//   format du `contenu` ne s'écrit pas ici : il fait foi au `02-` §6 ». La
//   divergence se voit au test, qui rejoue la fixture réelle.
// ============================================================================

// ── Les listes du `02-` §6 A ────────────────────────────────────────────────
export const FONCTIONS_MOMENT = ['pose', 'nuance', 'refute', 'illustre', 'conclut', 'precise'] as const
export const FONCTIONS_PHRASE = ['defend_these', 'illustre', 'explique', 'relance'] as const
export const STATUTS = ['affirme', 'rapporte', 'concede', 'hypothetique', 'ironique'] as const
export const DRAPEAUX = ['dominante', 'equivalentes'] as const

// Le schéma : les seules clés que le format déclare. Toute autre clé est la
// porte par laquelle une crédence chiffrée reviendrait (refus n° 11).
const CLES: Record<string, ReadonlySet<string>> = {
  racine: new Set(['phrases', 'moments', 'concepts', 'lectures', 'armature', 'hesitation']),
  armature: new Set(['question_directrice', 'these', 'these_phrases']),
  phrase: new Set(['n', 'fonctions', 'statuts']),
  moment: new Set(['m', 'de', 'a', 'fonction', 'cible', 'statuts', 'etiquette']),
  concept: new Set(['concept', 'formes']),
  lecture: new Set(['n', 'drapeau', 'lectures']),
}

const MOTS_MAX_LECTURE = 30
const ETIQUETTE_MIN = 5
const ETIQUETTE_MAX = 10

export interface VerdictReference {
  verdict: 'conforme' | 'blocage' | 'refus'
  refus: string[]
  blocages: string[]
  signalements: string[]
  annonces: string[]
}

/**
 * ⚠️ `\s` N'EST PAS LE MÊME JEU DE CARACTÈRES DES DEUX CÔTÉS.
 *
 * Le `\s` de Python prend NEL et les séparateurs de fichier ; celui de
 * JavaScript non. Celui de JavaScript prend le BOM ; celui de Python non. Deux
 * moteurs, deux découpages — donc DEUX COMPTES DE PHRASES pour le même texte,
 * alors que cette segmentation FAIT FOI et sert aussi au pré-relevé de la
 * Synthèse. Un BOM au milieu d'un texte concaténé suffit à les faire diverger.
 * On écrit donc la classe en toutes lettres, celle de Python.
 */
const ESPACE = '[ \\t\\n\\r\\f\\v\\x1c-\\x1f\\x85\\u00a0\\u1680\\u2000-\\u200a'
  + '\\u2028\\u2029\\u202f\\u205f\\u3000]'
const COUPURE = new RegExp(`(?<=[.!?…])${ESPACE}+`)
const NON_ESPACE = new RegExp(`(?:(?!${ESPACE})[\\s\\S])+`, 'g')

/**
 * ⚠️ `str.strip()` DE PYTHON, ET NON `String.trim()`. La classe ci-dessus était
 * déjà la bonne ; c'est le ROGNAGE qui ne l'était pas. `trim()` retire le BOM
 * (U+FEFF) que Python GARDE, et ignore U+001C–U+001F et U+0085 (NEL) que Python
 * RETIRE. Un caractère d'un côté, cinq de l'autre — et la segmentation
 * divergeait : un BOM en queue donnait deux phrases à Python et une au port,
 * alors que c'est CETTE segmentation qui localise un exercice dans le texte.
 */
const ROGNE = new RegExp(`^(?:${ESPACE})+|(?:${ESPACE})+$`, 'g')
const rogne = (s: string): string => (s || '').replace(ROGNE, '')

/** La segmentation QUI FAIT FOI — la même que le pré-relevé de la Synthèse
 *  (`05-` §4.7). C'est elle qui fait que la référence et les copies se comptent
 *  en phrases identiques. */
export function phrasesDuTexte(texte: string): string[] {
  const brut = rogne(texte || '').split(COUPURE)
  return brut.map(rogne).filter((p) => p.length > 0)
}

/**
 * Casse et accents repliés, pour chercher une forme de concept.
 *
 * ⚠️ Python replie par `casefold()`, qui va PLUS LOIN que `toLowerCase()` : il
 * rabat l'eszett sur « ss » et décompose les ligatures. Sans cela, un concept
 * déclaré en capitales ne se retrouverait pas dans un texte qui porte
 * l'eszett, le refus n° 10 se déclencherait à tort, et la validation d'une
 * référence corrigée serait GELÉE — cette fonction est en ligne, à l'écran du
 * `05-` §4.4. Le détail du repli, et les deux pièges, sont dans le corps.
 */
function plie(s: string): string {
  // \u26a0\ufe0f LA SOURCE \u00c9CRIT : NFD \u2192 retrait des marques `Mn` \u2192 `casefold()`.
  //
  // 1. **NFKD n'est PAS NFD.** NFKD est une d\u00e9composition de COMPATIBILIT\u00c9 :
  //    elle rabat l'ins\u00e9cable sur l'espace, `\u2026` sur trois points, `x\u00b2` sur
  //    `x2`, la pleine chasse sur l'ASCII. `casefold()` n'en fait RIEN \u2014 le
  //    port acceptait donc des formes que le script refuse.
  // 2. **L'ORDRE.** Replier l'eszett AVANT `toLowerCase()` laissait passer
  //    l'eszett CAPITAL (U+1E9E) : il devenait `\u00df` et ne valait plus \u00ab ss \u00bb.
  //    Le refus n\u00b0 10 se d\u00e9clenchait alors \u00e0 tort \u2014 exactement le GEL que le
  //    commentaire ci-dessus annonce vouloir \u00e9viter. On minusculise d'abord.
  //
  // `toLowerCase()` n'est pas un repli complet : on ajoute ce que `casefold()`
  // fait et qu'il ne fait pas \u2014 l'eszett, les ligatures latines, le sigma final
  // (`toLowerCase()` applique la r\u00e8gle Final_Sigma, `casefold()` non) et le
  // signe micro. Le reste du repli complet n'existe pas dans ce corpus.
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[\u00df\u1e9e]/g, 'ss')
    .replace(/\u03c2/g, '\u03c3')
    .replace(/\ufb00/g, 'ff').replace(/\ufb01/g, 'fi').replace(/\ufb02/g, 'fl')
    .replace(/\ufb03/g, 'ffi').replace(/\ufb04/g, 'ffl')
    .replace(/[\ufb05\ufb06]/g, 'st')
    .replace(/\u00b5/g, '\u03bc')
}

function mots(s: unknown): string[] {
  return typeof s === 'string' ? (s.match(NON_ESPACE) ?? []) : []
}

const estObjet = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)

const liste = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])

const texteDe = (x: unknown): string => (typeof x === 'string' ? x : '')

const entier = (x: unknown, defaut: number): number =>
  typeof x === 'number' && Number.isInteger(x) ? x : defaut

/**
 * Le contrôle. Rend les trois verdicts, et il NE LES CONFOND PAS :
 *   `refus`        → la référence n'est pas soumise au professeur, on régénère ;
 *   `blocages`     → elle lui est soumise, mais il doit trancher avant de valider ;
 *   `signalements` → ils s'affichent, ils n'arrêtent rien.
 */
export function controleReference(ref: unknown, texte: string): VerdictReference {
  const refus: string[] = []
  const blocages: string[] = []
  const signalements: string[] = []
  const annonces: string[] = []

  const r: Record<string, unknown> = estObjet(ref) ? ref : {}

  const phrasesTxt = phrasesDuTexte(texte)
  const N = phrasesTxt.length
  annonces.push(`texte segmenté : ${N} phrase(s), ${mots(texte).length} mot(s)`)

  // ── clés non déclarées (refus 11) ─────────────────────────────────────────
  for (const k of Object.keys(r)) {
    if (!CLES.racine.has(k)) refus.push(`racine : clé « ${k} » que le format ne déclare pas`)
  }

  // ⚠️ MAL FORMÉ N'EST PAS ABSENT. Le script qui fait foi s'ARRÊTE sur un `null`
  // glissé dans `moments[]` ou `concepts[]` — et l'import le traduit en refus
  // n° 17. Les écarter en silence rendait la référence « conforme ».
  const trier = (brut: unknown, nom: string) => {
    const tout = liste(brut)
    for (const [i, x] of tout.entries()) {
      if (!estObjet(x)) refus.push(`${nom} : l'entrée ${i} n'est pas un objet (${JSON.stringify(x)})`)
    }
    return tout.filter(estObjet)
  }
  const phrases = trier(r.phrases, 'phrases')
  const moments = trier(r.moments, 'moments')
  const concepts = trier(r.concepts, 'concepts')
  const lectures = trier(r.lectures, 'lectures')

  // ⚠️ `p.get('n', i)` DE PYTHON : l'index ne remplace la valeur que si la clé
  //    est ABSENTE. `??` le fait AUSSI sur `null` — une phrase `{"n": null}`
  //    s'annonçait « phrase 0 » au professeur là où le script écrit « phrase
  //    None » : un identifiant faux dans le message qui doit le guider.
  const ouIndex = (o: Record<string, unknown>, cle: string, i: number): unknown =>
    (Object.hasOwn(o, cle) ? o[cle] : i)

  phrases.forEach((p, i) => {
    for (const k of Object.keys(p)) {
      if (!CLES.phrase.has(k)) refus.push(`phrase ${ouIndex(p, 'n', i)} : clé « ${k} » non déclarée`)
    }
  })
  moments.forEach((m, i) => {
    for (const k of Object.keys(m)) {
      if (!CLES.moment.has(k)) refus.push(`moment ${ouIndex(m, 'm', i)} : clé « ${k} » non déclarée`)
    }
  })
  concepts.forEach((c, i) => {
    for (const k of Object.keys(c)) {
      if (!CLES.concept.has(k)) refus.push(`concept ${ouIndex(c, 'concept', i)} : clé « ${k} » non déclarée`)
    }
  })
  lectures.forEach((l, i) => {
    for (const k of Object.keys(l)) {
      if (!CLES.lecture.has(k)) refus.push(`lectures, phrase ${ouIndex(l, 'n', i)} : clé « ${k} » non déclarée`)
    }
  })

  // ── couverture des phrases (refus 2) ──────────────────────────────────────
  const vus = phrases.map((p) => p.n)
  const attendus = Array.from({ length: N }, (_, i) => i + 1)
  const vusSet = new Set(vus)
  const manquantes = attendus.filter((x) => !vusSet.has(x)).sort((a, b) => a - b)
  // Python garde TOUT ce qui n'est pas `None` : une entrée dont le numéro est
  // écrit en chaîne y est une phrase qui n'existe pas, et refuse. Ne retenir
  // que les nombres la laissait passer.
  const enTrop = [...vusSet]
    .filter((x) => x !== null && x !== undefined && !attendus.includes(x as number))
    .sort((a, b) => (a as number) - (b as number))
  // ⚠️ `.sort()` NU TRIE EN CHAÎNES : {3, 10} sortait « [10,3] » au professeur,
  //    là où `sorted()` rend « [3, 10] ». Les nombres d'abord, numériquement.
  const doublons = [...new Set(vus.filter((x) => x !== undefined && x !== null
    && vus.filter((y) => y === x).length > 1))]
    .sort((a, b) => {
      const na = typeof a === 'number'; const nb = typeof b === 'number'
      if (na && nb) return (a as number) - (b as number)
      if (na !== nb) return na ? -1 : 1
      return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
    })
  if (manquantes.length) refus.push(`phrases sans entrée : ${JSON.stringify(manquantes)}`)
  if (enTrop.length) refus.push(`entrées pour des phrases qui n'existent pas : ${JSON.stringify(enTrop)}`)
  if (doublons.length) refus.push(`phrases déclarées deux fois : ${JSON.stringify(doublons)}`)

  // ── fonctions et statuts de phrase (refus 3, 4, 5) ────────────────────────
  // Un statut porté par un MOMENT vaut pour ses phrases sans y être recopié
  // (`02-` §6 A ; `05-` §1) : le code rend l'UNION.
  const momentPorteStatut = new Map<number, boolean>()
  for (const m of moments) {
    for (let n = entier(m.de, 0); n <= entier(m.a, -1); n++) {
      momentPorteStatut.set(n, liste(m.statuts).length > 0)
    }
  }

  for (const p of phrases) {
    const n = p.n
    const fs = liste(p.fonctions)
    const st = liste(p.statuts)
    if (fs.length === 0) refus.push(`phrase ${n} : aucune fonction déclarée`)
    for (const f of fs) {
      if (!(FONCTIONS_PHRASE as readonly unknown[]).includes(f)) {
        refus.push(`phrase ${n} : fonction « ${f} » hors liste du \`02-\` §6 A`)
      }
    }
    for (const s of st) {
      if (!(STATUTS as readonly unknown[]).includes(s)) {
        refus.push(`phrase ${n} : statut « ${s} » hors liste du \`02-\` §6 A`)
      }
    }
    // « Une pure `relance` n'en porte aucun » — hors ces trois cas, un silence
    // est un trou (`05-` §4.1, refus n° 4).
    const pureRelance = fs.length === 1 && fs[0] === 'relance'
    if (st.length === 0 && !pureRelance && !momentPorteStatut.get(n as number)) {
      refus.push(`phrase ${n} : aucun statut d'énonciation, ni sur elle ni sur son moment`)
    }
  }

  // ── couverture des moments (refus 1) ──────────────────────────────────────
  const ids = moments.map((m) => m.m)
  if (new Set(ids).size !== ids.length) {
    refus.push(`identifiants de moment en double : ${JSON.stringify(ids)}`)
  }
  const ordre = [...moments].sort((a, b) => entier(a.de, 0) - entier(b.de, 0))
  if (moments.length === 0) {
    refus.push('aucun moment — la couverture du texte est vide')
  } else {
    if (entier(ordre[0].de, 0) !== 1) {
      refus.push(`le premier moment commence à la phrase ${ordre[0].de}, pas à 1`)
    }
    for (let i = 0; i + 1 < ordre.length; i++) {
      const a = ordre[i]
      const b = ordre[i + 1]
      if (entier(b.de, 0) !== entier(a.a, 0) + 1) {
        const mot = entier(b.de, 0) <= entier(a.a, 0) ? 'chevauchement' : 'trou'
        refus.push(`${mot} entre ${a.m} (finit en ${a.a}) et ${b.m} (commence en ${b.de})`)
      }
    }
    if (entier(ordre[ordre.length - 1].a, 0) !== N) {
      refus.push(`le dernier moment finit à la phrase ${ordre[ordre.length - 1].a}, le texte en a ${N}`)
    }
    for (const m of moments) {
      if (entier(m.de, 0) > entier(m.a, 0)) {
        refus.push(`${m.m} : bornes inversées (${m.de} → ${m.a})`)
      }
    }
  }

  // ── fonction, cible, statuts, étiquette du moment (5, 6, 7 + blocage 1) ───
  const debut = new Map<unknown, unknown>()
  for (const m of moments) debut.set(m.m, m.de)
  for (const m of moments) {
    const mid = m.m
    const f = m.fonction
    const cible = liste(m.cible)
    if (!(FONCTIONS_MOMENT as readonly unknown[]).includes(f)) {
      refus.push(`${mid} : fonction « ${f} » hors liste du \`02-\` §6 A`)
    }
    for (const s of liste(m.statuts)) {
      if (!(STATUTS as readonly unknown[]).includes(s)) {
        refus.push(`${mid} : statut « ${s} » hors liste du \`02-\` §6 A`)
      }
    }
    for (const c of cible) {
      if (!debut.has(c)) {
        refus.push(`${mid} : cible « ${c} » — ce moment n'existe pas`)
      } else if (c === mid) {
        refus.push(`${mid} : se vise lui-même`)
      } else if (entier(debut.get(c), 0) > entier(m.de, 0)) {
        signalements.push(`${mid} vise « ${c} », qui vient APRÈS lui — possible, rare, à regarder`)
      }
    }
    if (f === 'pose' && cible.length) {
      refus.push(`${mid} : \`pose\` avec une cible (${JSON.stringify(cible)}) — le format l'interdit`)
    }
    // BLOCAGE (1) — « le professeur tranche, rien ne se devine » (`05-` §4.2).
    if ((FONCTIONS_MOMENT as readonly unknown[]).includes(f) && f !== 'pose' && cible.length === 0) {
      blocages.push(`${mid} : fonction « ${f} » sans cible — le professeur tranche, rien ne se devine`)
    }
    const nb = mots(m.etiquette).length
    if (!(nb >= ETIQUETTE_MIN && nb <= ETIQUETTE_MAX)) {
      signalements.push(`${mid} : étiquette de ${nb} mot(s), hors ${ETIQUETTE_MIN}-${ETIQUETTE_MAX}`)
    }
  }

  // ── les lectures défendables (refus 8, 9) ─────────────────────────────────
  const theses = new Set(phrases.filter((p) => liste(p.fonctions).includes('defend_these')).map((p) => p.n))
  const portees = new Set(lectures.map((l) => l.n))
  for (const l of lectures) {
    const n = l.n
    const dr = l.drapeau
    const ls = liste(l.lectures)
    if (!theses.has(n)) refus.push(`lectures sur la phrase ${n}, qui n'est pas \`defend_these\``)
    if (!(DRAPEAUX as readonly unknown[]).includes(dr)) {
      refus.push(`lectures, phrase ${n} : drapeau « ${dr} » hors liste`)
    }
    if (ls.length === 0) refus.push(`lectures, phrase ${n} : entrée sans aucune lecture`)
    if (ls.length === 1 && dr === 'equivalentes') {
      refus.push(`lectures, phrase ${n} : une seule lecture ne peut pas être « equivalentes »`)
    }
    for (const x of ls) {
      const nb = mots(x).length
      if (nb > MOTS_MAX_LECTURE) {
        signalements.push(`lectures, phrase ${n} : une lecture de ${nb} mots (au-delà de ${MOTS_MAX_LECTURE})`)
      }
    }
  }
  for (const n of [...theses].filter((x) => !portees.has(x)).sort()) {
    refus.push(`phrase ${n} : \`defend_these\` sans aucune lecture défendable`)
  }

  // ── l'armature (refus 12, 13 + blocage 2) ─────────────────────────────────
  // « Tout ce qui touche à son CONTENU bloque au lieu de refuser » : la
  // qualification vient de G1, qui n'a pas vu le texte entier, et l'armature de
  // G3, qui l'a vu ; refuser ferait décider le plus aveugle (`05-` §4.2).
  const armDeclaree = estObjet(r.armature)
  const arm: Record<string, unknown> = armDeclaree ? (r.armature as Record<string, unknown>) : {}
  if (!armDeclaree) {
    refus.push('armature absente — le format la déclare obligatoire')
  } else {
    for (const k of Object.keys(arm)) {
      if (!CLES.armature.has(k)) refus.push(`armature : clé « ${k} » que le format ne déclare pas`)
    }
  }
  // `rogne`, jamais `trim` : le script fait `.strip()` (cf. la note en tête).
  // Une thèse réduite à un NEL est VIDE pour Python et pleine pour `trim()`.
  const q = rogne(texteDe(arm.question_directrice))
  const th = rogne(texteDe(arm.these))
  if (armDeclaree) {
    if (!q) refus.push('armature : la question directrice est vide')
    if (!th) refus.push('armature : la thèse est vide')
  }
  for (const [nom, val] of [['question directrice', q], ['thèse', th]] as const) {
    const nb = mots(val).length
    if (nb > MOTS_MAX_LECTURE) {
      signalements.push(`armature : ${nom} de ${nb} mots (au-delà de ${MOTS_MAX_LECTURE})`)
    }
  }
  if (q && !q.includes('?')) {
    signalements.push("armature : la question directrice ne porte pas de point d'interrogation")
  }

  // Les statuts d'une phrase = les siens UNIS à ceux de son moment (`05-` §1).
  const statutsDuMoment = new Map<number, Set<unknown>>()
  for (const m of moments) {
    for (let n = entier(m.de, 0); n <= entier(m.a, -1); n++) {
      const s = statutsDuMoment.get(n) ?? new Set<unknown>()
      for (const x of liste(m.statuts)) s.add(x)
      statutsDuMoment.set(n, s)
    }
  }
  const parN = new Map<unknown, Record<string, unknown>>()
  for (const p of phrases) parN.set(p.n, p)
  const porteuses = Array.isArray(arm.these_phrases) ? arm.these_phrases : []
  if (armDeclaree && porteuses.length === 0) {
    signalements.push('armature : la thèse n\'est portée par aucune phrase — légal, un auteur peut la distribuer, à regarder')
  }
  for (const n of porteuses) {
    const p = parN.get(n)
    if (p === undefined) {
      refus.push(`armature : la thèse cite la phrase ${n}, qui n'existe pas`)
      continue
    }
    if (!liste(p.fonctions).includes('defend_these')) {
      blocages.push(`armature : la phrase ${n} porte la thèse mais n'est pas \`defend_these\` — le professeur tranche`)
    }
    // L'exigence est POSITIVE : la phrase doit être AFFIRMÉE. « Énumérer les
    // statuts interdits en oublierait toujours un » — et le marquage multiple
    // est la porte de sortie : « rapporte + affirme » est une autorité reprise
    // à son compte, « concede + affirme » une concession vraiment accordée.
    const st = new Set<unknown>([...liste(p.statuts), ...(statutsDuMoment.get(n as number) ?? [])])
    if (!st.has('affirme')) {
      const liste_st = [...st].sort()
      blocages.push(`armature : la phrase ${n} porte la thèse alors que l'auteur ne l'AFFIRME pas `
        + `(statuts : ${liste_st.length ? JSON.stringify(liste_st) : 'aucun'}) — il l'énonce sans la soutenir ; `
        + 'le professeur tranche')
    }
    if (st.has('ironique')) {
      signalements.push(`armature : la phrase ${n} porte la thèse au statut \`ironique\` — la thèse est son sens, pas sa lettre`)
    }
  }

  // ── les concepts (refus 10) ───────────────────────────────────────────────
  const plieTexte = plie(texte)
  for (const c of concepts) {
    const formes = liste(c.formes)
    if (formes.length === 0) {
      refus.push(`concept « ${c.concept} » : aucune forme déclarée`)
      continue
    }
    const trouvees = formes.filter((f) => plieTexte.includes(plie(texteDe(f))))
    if (trouvees.length === 0) {
      refus.push(`concept « ${c.concept} » : aucune de ses formes ${JSON.stringify(formes)} ne se retrouve dans le texte`)
    }
  }

  annonces.push(`${moments.length} moment(s) · ${phrases.length} phrase(s) · `
    + `${lectures.reduce((s, l) => s + liste(l.lectures).length, 0)} lecture(s) `
    + `sur ${lectures.length} phrase(s)-thèses · ${concepts.length} concept(s)`)
  const valeurs = moments.filter((m) => mots(m.etiquette).length > 0).length * 4
    + phrases.length * 2
    + lectures.reduce((s, l) => s + liste(l.lectures).length + 1, 0)
    + concepts.length
    // `if arm else 0` en Python : un objet vide y est FAUX, il ne compte rien.
    + (Object.keys(arm).length > 0 ? 2 + liste(arm.these_phrases).length : 0)
  annonces.push(`valeurs déclarées, telles que l'écran les compte : ~${valeurs}`)

  return {
    verdict: refus.length ? 'refus' : blocages.length ? 'blocage' : 'conforme',
    refus,
    blocages,
    signalements,
    annonces,
  }
}

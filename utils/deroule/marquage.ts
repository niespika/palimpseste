// ============================================================================
// C4 · L15 — CE QUE L'ÉCRAN MET EN ÉVIDENCE DANS LE MATÉRIAU.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// ⭐ LA RÈGLE, ET SON MOTIF (`02-` §5, décision de Louis du 24/08) :
//
//    | Cran      | Ce que l'écran met en évidence dans le matériau            |
//    |-----------|-----------------------------------------------------------|
//    | 1         | **les candidats servis**, chacun là où il apparaît — et    |
//    |           | **eux seuls**, la `reponse_attendue` COMPRISE, « sans quoi |
//    |           | le marquage la désignerait »                               |
//    | 3 · 5     | **le passage fautif** — celui, et celui-là seul, où la     |
//    |           | `version_corrigee` du matériau diffère de son `contenu`    |
//    | 4 · 7 · 9 | **rien. L'y trouver EST le travail.**                      |
//
//    « Au grain du MOT, un exercice sans marquage mesure la RECHERCHE et non le
//    SENS : servir quatre mots et cinq phrases oblige l'élève à retrouver les
//    candidats avant de pouvoir juger. » **Sans ce module, la mesure change de
//    nature.**
//
// ⚠️ LA TABLE NE PORTE QUE SIX CRANS, ET LES TROIS ABSENTS NE SONT PAS UN
//    OUBLI. Les crans **2, 6 et 8** n'y sont ni en « marque » ni en « rien » :
//    leur `materiau_cible` vaut `null` (`02-` §2.2) — **il n'y a pas de
//    matériau**. « Rien à marquer » est une décision ; « pas de matériau » est
//    une absence. Ici les deux mènent au même geste — ne rien marquer —, et
//    c'est ce qui rend l'absence sûre : `regleDeMarquage(null)` ne devine rien.
//
// ⭐⭐ AUCUN CHAMP N'EST À AJOUTER, ET C'EST LE POINT (`08-` §5) : les candidats
//    sont les `distracteurs` et la `reponse_attendue` du cas, le passage fautif
//    est un diff entre deux champs du matériau. **Le lecteur dérive, il ne lit
//    pas** — « un champ de plus serait une seconde source de vérité pour une
//    chose que le fichier dit déjà ».
//
// ⭐ CE QUI DÉCLENCHE EST LA RÈGLE DU CRAN, JAMAIS LA PRÉSENCE D'UN CHAMP.
//    Deux pièges symétriques, et le code doit tomber entre les deux :
//    · **le cran 5 n'a AUCUN distracteur** (`distracteurs` = `null`, `02-`
//      §2.2) et il se marque quand même — un code qui conditionnerait le diff
//      sur la présence de distracteurs ne marquerait jamais rien au cran 5 ;
//    · **le cran 4 A une `reponse_attendue`** et ne se marque pas — l'élève y
//      cherche L'ENDROIT (« le défaut est nommé, sa place non »), et le
//      marquage répondrait à la question posée.
//    D'où la forme de ce module : il ne reçoit QUE la phrase de la règle, et
//    c'est elle qui commande.
//
// ⛔⛔ AUCUN `dangerouslySetInnerHTML`, ET CE N'EST PAS UNE PRÉFÉRENCE. Le
//    module ne produit **aucun HTML et aucune chaîne balisée** : il rend des
//    SEGMENTS, et c'est le composant React qui met les marqués en `<strong>` —
//    exactement le patron de `utils/deroule/balisage.ts`. Le dépôt ne porte
//    aucune occurrence d'`innerHTML`, et le matériau vient d'un IMPORT DE
//    FICHIER (`08-` §4) : un matériau qui porterait `<script>` doit ressortir
//    en TEXTE, et le seul moyen de le garantir structurellement est de ne
//    jamais fabriquer de balise ici. *L'aperçu de la fabrique, lui, fabrique du
//    HTML (`h.replace(…, '$1<b>$2</b>')` dans `generateur/web/index.html`) : on
//    recopie son ALGORITHME, jamais son rendu. C'est la seule adaptation, et
//    elle est structurelle.*
//
// ⚠️ MARQUER N'EST PAS BALISER, ET LE MATÉRIAU RESTE « TEL QU'IL EST STOCKÉ ».
//    `balisage.ts` INTERPRÈTE des caractères de la consigne (`**x**` → gras) ;
//    ce module **n'interprète aucun caractère du matériau** — il ne lit pas de
//    `**`, il ne retire rien, il n'ajoute rien. Il **calcule des bornes** à
//    partir d'AILLEURS (les candidats servis, le diff) et **le texte reste
//    octet pour octet ce que la base porte** : la concaténation des `texte` de
//    tous les segments rend le matériau à l'identique, et un test le prouve.
//    Les deux règles cohabitent, et il fallait le dire.
//
// ⛔⛔ `version_corrigee` NE DESCEND JAMAIS À L'ÉCRAN — C'EST LA RÉPONSE. Aux
//    crans 3 et 5, « la `reponse_attendue` […] est la version corrigée à la
//    transformation » (`02-` §2.3.4) : le champ dont on tire le diff EST ce que
//    l'élève doit produire. ⭐ **L'algorithme s'en protège par construction** :
//    `motsAMarquer` ne rend jamais que des fragments de `contenu`
//    (`mots.slice(…)` sur le matériau servi) — **rien de la version corrigée
//    n'en sort, même par accident**. Le diff se calcule côté serveur, et seules
//    les POSITIONS descendent.
// ============================================================================

/**
 * Un morceau de matériau, marqué ou non. La concaténation des `texte`, dans
 * l'ordre, EST le matériau — octet pour octet.
 */
export interface SegmentMateriau {
  texte: string
  marque: boolean
}

/**
 * Les trois régimes que la table du `02-` §5 déclare, plus l'absence.
 *
 * ⚠️ On lit la PHRASE de la source, pas un code : c'est ce que fait l'aperçu
 * élève du générateur (`motsAMarquer`, `generateur/web/index.html`), et c'est
 * ce qui permet à la doctrine de rester DÉRIVÉE plutôt que traduite. Une
 * énumération figerait ici une rédaction que le `02-` a le droit de retoucher.
 */
export type RegimeMarquage = 'candidats' | 'passage_fautif' | 'rien'

/**
 * La règle du cran, lue sur la phrase que la doctrine porte
 * (`exercices_crans.marquage`).
 *
 * `null` — la règle est absente : **on ne marque rien, et on ne devine rien**.
 * C'est le cas des crans 2, 6 et 8 (pas de matériau), et celui d'une base qui
 * n'a pas encore reçu la re-dérivation.
 *
 * ⚠️ L'ordre des tests compte : « rien » se reconnaît EN PREMIER, sur le début
 * de la phrase. La cellule des crans 4, 7 et 9 est « rien. L'y trouver EST le
 * travail. » — elle ne contient ni « candidats servis » ni « version_corrigee »,
 * mais l'ancre `^` est ce qui rend le test insensible à une reformulation.
 */
export function regimeDeMarquage(regle: string | null | undefined): RegimeMarquage | null {
  const r = (regle ?? '').trim()
  if (!r) return null
  if (/^rien/i.test(r)) return 'rien'
  if (/candidats servis/i.test(r)) return 'candidats'
  if (/version_corrigee/i.test(r)) return 'passage_fautif'
  return null
}

/**
 * ⭐ L'EXPRESSION QUI RECONNAÎT UNE SUITE DE MOTS DANS LE MATÉRIAU — écrite
 * **UNE SEULE FOIS**, et employée aux deux bouts : par `estFragment`, qui décide
 * si un candidat se marque, et par `bornes`, qui le marque. ⛔ **C'est la
 * condition de la règle, pas une commodité** — « avec la MÊME expression que le
 * marquage emploiera ensuite, pour qu'aucun candidat retenu ici n'échoue
 * là-bas » (`generateur/web/index.html`, `motifDe`). *Deux expressions qui se
 * ressemblent finiraient par diverger, et le désaccord serait invisible : un
 * candidat déclaré marquable qui ne se marque pas.*
 *
 * Le détail de chaque garde — l'espace rebâti, les bornes de lettres unicode —
 * est à `bornes`, qui s'en sert.
 */
function motifDe(suite: readonly string[], global: boolean): RegExp {
  const echappe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\p{L}])(${suite.map(echappe).join('\\s+')})(?![\\p{L}])`,
    global ? 'gu' : 'u')
}

/**
 * ⭐⭐ CE QUI DÉPARTAGE UN CANDIDAT MARQUABLE D'UN REMPLACEMENT.
 *
 * ⛔ « Un candidat qui n'est pas un fragment du matériau ne se marque pas » —
 * « au cran 3 les candidats sont des REMPLACEMENTS, ils n'y figurent pas »
 * (`02-` §5). **La source pose la règle sans dire comment on reconnaît un
 * fragment : on la lui demande LITTÉRALEMENT** — le candidat se retrouve-t-il,
 * mot pour mot, dans le matériau ? *La règle est muette là où elle ne s'applique
 * pas : elle ne peut donc pas mal se comporter.*
 *
 * ⛔⛔ **CE MODULE PORTAIT UN SEUIL DE DEUX MOTS, ET IL ÉTAIT FAUX.**
 * `MOTS_MAX_PAR_CANDIDAT = 2` recopiait un chiffre de l'aperçu du générateur —
 * qui l'a lui-même abandonné le 27/08, après avoir mesuré que **37
 * candidats-phrases restaient nus** des deux côtés. ⭐ **La longueur n'a jamais
 * été ce que la règle demande** : un mot de deux lettres et une phrase de
 * quarante se marquent pareil ; ce qui les départage est d'être, ou non, un
 * fragment du matériau. *Le seuil se déclarait « port fidèle » ; la fidélité
 * était rompue depuis le 27/08.*
 *
 * ⚠️ La fabrique teste sur le corps ÉCHAPPÉ, parce qu'elle fabrique du HTML ;
 * ici rien n'est échappé nulle part — ni le corps, ni le candidat, ni à
 * `bornes`. **Les deux voies restent comparables** : c'est la même expression
 * sur le même texte, et c'est la seule adaptation, déjà annoncée en tête.
 */
function estFragment(corps: string, suite: readonly string[]): boolean {
  return suite.length > 0 && motifDe(suite, false).test(corps)
}

/** Les mots d'une chaîne, blancs normalisés — la découpe du générateur. */
function mots(x: string): string[] {
  const t = x.trim()
  return t === '' ? [] : t.split(/\s+/)
}

/**
 * ⭐ LES SUITES DE MOTS À MARQUER — port fidèle de `motsAMarquer`
 * (`generateur/web/index.html`), qui est la spécification exécutable de cette
 * règle : elle est écrite, et elle est jouée.
 *
 * @param regime    ce que le cran commande, tiré de `regimeDeMarquage`.
 * @param candidats **les quatre candidats SERVIS**, dans l'ordre réellement
 *   mêlé — jamais la banque. « L'écran sert QUATRE candidats : trois
 *   distracteurs tirés de la banque, plus la `reponse_attendue` » (`02-` §5) ;
 *   la banque, elle, en porte 10 à 15. ⚠️ **La bonne réponse est marquée avec
 *   les trois autres** : « et eux seuls, la `reponse_attendue` comprise, sans
 *   quoi le marquage la désignerait ». Marquer les trois distracteurs seuls
 *   ferait de la réponse le seul candidat NON marqué — le marquage deviendrait
 *   la réponse.
 * @param contenu   le matériau, tel que l'élève le lit.
 * @param versionCorrigee « le même matériau SANS le défaut » (`08-` §4).
 *   ⛔ Il NE SORT PAS d'ici : seules des tranches de `contenu` en sortent.
 */
export function motsAMarquer(
  regime: RegimeMarquage | null,
  { candidats, contenu, versionCorrigee, consigne, observable }: {
    candidats?: readonly string[] | null
    contenu?: string | null
    versionCorrigee?: string | null
    /** ⭐ La consigne du CAS — règle (2) du `02-` §5 : ce qu'elle cite se marque. */
    consigne?: string | null
    /** ⭐ L'observable ISOLÉ — il porte les deux exceptions à la règle (1). */
    observable?: string | null
  },
): string[][] {
  const out: string[][] = []
  if (regime === null || regime === 'rien') return out

  if (regime === 'candidats') {
    // ⭐⭐ LES QUATRE, OU AUCUN — la garde que la fabrique a posée le 27/08.
    //    « Et eux seuls, la `reponse_attendue` comprise, sans quoi le marquage
    //    la désignerait » : ce que le marquage ne doit pas faire, c'est
    //    DÉSIGNER. ⛔ Or **n'en marquer que trois désigne le quatrième tout
    //    autant** — et c'est pire que de n'en marquer aucun, puisque le seul
    //    candidat nu serait montré du doigt. Le test porte donc sur les QUATRE
    //    ENSEMBLE : un seul remplacement parmi eux, et on ne marque plus rien.
    // ⚠️ `contenu` devient nécessaire ICI, là où le seuil de mots s'en passait :
    //    un fragment ne se reconnaît que contre le matériau qui le porte. Sans
    //    matériau, aucun candidat n'est un fragment, et on ne marque rien — ce
    //    qui est la bonne réponse, pas un repli.
    const corps = contenu ?? ''
    const suites = (candidats ?? []).map((c) => mots(c ?? ''))
    if (suites.length && suites.every((j) => estFragment(corps, j))) {
      out.push(...suites)
      return out
    }
    // ⭐⭐ LA RÈGLE (2) VAUT ICI AUSSI, EN REPLI — 29/08, relevé par Louis au
    //    cran 1 : « je vois des références au matériau dans la consigne et le
    //    texte qui devrait être en gras ne l'est pas ». Quand les candidats sont
    //    des REMPLACEMENTS et non des fragments, rien ne se marque — mais si la
    //    consigne CITE un passage du matériau, elle nomme l'endroit, et c'est
    //    lui qu'on montre.
    // ⛔ **Elle ne DÉSIGNE PAS la réponse** : ce qu'elle marque vient de la
    //    consigne, que l'élève lit de toute façon. La garde « les quatre ou
    //    aucun » reste entière — elle porte sur les CANDIDATS, pas sur ce
    //    repère.
    // ⚠️ Mesuré : 11 cas de cran 1 sur 141 muets. Ce n'est pas le remède du
    //    cran 1 — 130 consignes DÉSIGNENT le matériau sans le CITER (« À ce
    //    tournant », « Cette phrase ») —, c'est ce qui est réparable sans
    //    inventer ce que la consigne montre du doigt.
    const a0 = mots(corps)
    for (const j of citationDeLaConsigne(consigne)) {
      const i = indexDeLaSuite(a0, j)
      if (i < 0) continue
      const p0 = bornesDePhrase(a0, i, i + j.length)
      out.push(a0.slice(p0.debut, p0.fin))
    }
    return out
  }

  // ── Le passage fautif — crans 3 et 5 ──────────────────────────────────────
  // ⚠️⚠️ LE DIFF PEUT ÊTRE VIDE, ET C'EST LÉGITIME, DEUX FOIS. (a)
  //    `version_corrigee` est FACULTATIF (`08-` §4, « Obligatoire : non ») et le
  //    refus n° 12, qui liste pourtant tous les appuis qui doivent suivre le
  //    cran, ne le nomme pas : un matériau de cran 3 ou 5 sans version corrigée
  //    passe tous les contrôles. (b) Le `02-` §2.3.1 a pose que l'injecté « ne
  //    porte pas que des défauts — il porte aussi ce qui est RÉUSSI » : un
  //    matériau calibré sur une réussite n'a AUCUN passage fautif.
  // ⛔ **Rien à marquer n'est pas une panne** : on ne lève pas, on ne marque pas
  //    tout, on ne marque pas le premier mot. Et on ne « répare » pas la source
  //    en rendant `version_corrigee` obligatoire — ce serait une règle neuve.
  const a = mots(contenu ?? '')
  if (!a.length) return out

  // ⭐ RÈGLE (2) — LA CITATION DE LA CONSIGNE PASSE AVANT LE DIFF, et vaut même
  //    quand il est VIDE. C'est le cas qui restait muet : la correction AJOUTE
  //    un début au lieu de remplacer, « on ne surligne pas une absence » — mais
  //    la consigne, elle, NOMME l'endroit.
  for (const j of citationDeLaConsigne(consigne)) {
    const i = indexDeLaSuite(a, j)
    if (i < 0) continue
    const p = bornesDePhrase(a, i, i + j.length)
    out.push(a.slice(p.debut, p.fin))
  }
  if (out.length) return out

  const b = mots(versionCorrigee ?? '')
  if (!b.length) return out

  const t = tranchesDuDiff(a, b)
  if (!t) return out

  // ⭐⭐ LES DEUX EXCEPTIONS PASSENT AVANT TOUT, et elles se lisent sur
  //    l'OBSERVABLE (`02-` 6.2 §5).
  const obs = observable ?? ''
  if (OBSERVABLE_SANS_EXTENSION.test(obs)) {
    // Le mot EST la désignation : on ne l'étend pas.
    out.push(a.slice(t.debut, t.fin))
    return out
  }
  if (OBSERVABLE_DE_COUTURE.test(obs)) {
    // La couture, et elle seule — quand elle existe. ⚠️ Si le diff ne commence
    //    pas à une frontière de phrase, il n'y a pas de couture à montrer : on
    //    retombe sur la phrase, plutôt que d'inventer un joint.
    const c = coutureOuNull(a, t.debut)
    const p2 = c ?? bornesDePhrase(a, t.debut, t.fin)
    out.push(a.slice(p2.debut, p2.fin))
    return out
  }
  // ⚠️ PARTOUT AILLEURS, LA (1) : le passage s'étend à sa phrase. La règle (3)
  //    ne se lit PLUS sur la position du diff — elle se lit sur ce que
  //    l'exercice MESURE, et c'est la branche du dessus.
  const p = bornesDePhrase(a, t.debut, t.fin)
  out.push(a.slice(p.debut, p.fin))
  return out
}

/** L'index du premier mot d'une suite dans une autre, ou −1. Comparaison NUE. */
function indexDeLaSuite(dans: readonly string[], suite: readonly string[]): number {
  if (!suite.length || suite.length > dans.length) return -1
  const nu = (s: string) => s.replace(/^[\u00ab\u201c"'(\u2018]+|[\u00bb\u201d"'),.;:!?\u2026\u2019]+$/gu, '')
  for (let i = 0; i + suite.length <= dans.length; i++) {
    let ok = true
    for (let k = 0; k < suite.length; k++) {
      if (nu(dans[i + k]) !== nu(suite[k])) { ok = false; break }
    }
    if (ok) return i
  }
  return -1
}

/**
 * ⭐⭐ LES DEUX EXCEPTIONS À LA RÈGLE (1) — `02-` 6.2 §5, 29/08, et elles se
 * lisent sur L'OBSERVABLE, jamais sur la position du diff.
 *
 * ⛔ **`mot_impropre` : le mot NE S'ÉTEND PAS.** Le mot *est* la désignation —
 *    c'est tout l'exercice, et le §5 le disait déjà (« le mot en gras »,
 *    décision de Louis du 24/08). *Mesuré : cinq consignes promettaient un gras
 *    que la règle (1) avait remplacé par la phrase entière.*
 *
 * ⛔ **La famille du LIEN : la couture, et elle seule.** C'est le domaine propre
 *    de la règle (3), et il fallait le NOMMER au lieu de le deviner. *Mesuré :
 *    la couture se déclenchait sur 57 cas dont 20 n'avaient rien d'un défaut de
 *    lien — `densite_friction`, `debat_situe`, `enjeu`. Elle les attrapait parce
 *    que la correction remplace le premier mot d'une phrase, ce qui n'en fait
 *    pas une couture.*
 */
const OBSERVABLE_SANS_EXTENSION = /^mot_impropre$/
const OBSERVABLE_DE_COUTURE = /^(jointure_|charniere_|attache_|bloc_relie)/

/**
 * ⭐⭐ LES BORNES DE PHRASE — règle (1) du `02-` §5, 29/08.
 *
 * « Le diff dit OÙ ; ces trois règles disent JUSQU'OÙ. » La correction ne change
 * parfois qu'UN mot, et l'écran surlignait « il ». *Un mot seul ne montre rien.*
 * On étend donc le passage au début de la phrase où il commence et à la fin de
 * celle où il finit.
 *
 * ⚠️ La coupe se fait sur `.` `?` `!` `…` suivis d'un blanc — la même famille de
 *    fins de phrase que partout ailleurs. Un point d'abréviation ne coupe pas
 *    puisqu'il n'est pas suivi d'un blanc majuscule ; on ne cherche pas mieux :
 *    une borne trop large montre une phrase de plus, jamais un texte faux.
 */
function bornesDePhrase(mots: readonly string[], debut: number, fin: number):
{ debut: number; fin: number } {
  const finit = (m: string) => /[.?!\u2026]["\u00bb\u2019)]?$/u.test(m)
  let d = debut
  while (d > 0 && !finit(mots[d - 1])) d--
  let f = fin
  while (f < mots.length && !finit(mots[f - 1])) f++
  return { debut: d, fin: Math.max(f, fin) }
}

/**
 * ⭐⭐ LA COUTURE — règle (3) du `02-` §5, 29/08.
 *
 * « Un diff qui commence AU PREMIER MOT d'une phrase désigne une COUTURE, pas
 * une phrase. » Le défaut n'est pas *dans* cette phrase : il est **entre elle et
 * celle qui précède**. On marque le dernier mot d'avant et le premier d'ici.
 *
 * ⛔ **Elle l'emporte sur la règle (1)** : étendre à la phrase entière
 *    montrerait un texte JUSTE et cacherait le seul endroit qui cloche.
 * *Éprouvé sur `phrase × jointure_presente` : « Une » devient « principe. Une »,
 * la formule que Louis a lui-même écrite en relisant le cran 3.*
 */
function coutureOuNull(mots: readonly string[], debut: number):
{ debut: number; fin: number } | null {
  if (debut === 0) return null
  const finit = (m: string) => /[.?!\u2026]["\u00bb\u2019)]?$/u.test(m)
  return finit(mots[debut - 1]) ? { debut: debut - 1, fin: debut + 1 } : null
}

/**
 * ⭐⭐ LA PHRASE QUE LA CONSIGNE CITE — règle (2) du `02-` §5, 29/08.
 *
 * « Une consigne qui dit “la phrase qui commence par ‘Baudelaire place’” porte
 * déjà sa cible entre guillemets. » On la retrouve LITTÉRALEMENT dans le
 * matériau, du même geste que les candidats au cran 1, puis on l'étend aux
 * bornes de sa phrase.
 *
 * ⭐ **Cette règle passe AVANT le diff**, et c'est tout son intérêt : elle vaut
 *    même quand le diff est VIDE — le cas resté muet, où la correction AJOUTE un
 *    début au lieu de remplacer. *« On ne surligne pas une absence » ; mais la
 *    consigne, elle, nomme l'endroit.*
 * ⚠️ On ne retient qu'une citation d'AU MOINS DEUX MOTS : un fragment d'un mot
 *    se retrouverait partout et désignerait n'importe quoi.
 */
function citationDeLaConsigne(consigne: string | null | undefined): string[][] {
  const out: string[][] = []
  if (!consigne) return out
  for (const m of consigne.matchAll(/[\u00ab\u201c"\u2018\u2019']\s*([^\u00bb\u201d"\u2019']{3,120}?)\s*[\u00bb\u201d"\u2019']/gu)) {
    const j = mots(m[1] ?? '')
    if (j.length >= 2) out.push(j)
  }
  return out
}

/**
 * ⭐ LE DIFF, EN RANGS DE MOTS — le préfixe commun, puis le suffixe commun ; le
 * milieu EST le passage. **« Celui, et celui-là seul » : un seul passage,
 * jamais deux**, et c'est cette forme qui le garantit.
 *
 * ⛔ **UN SEUL DOMICILE.** `motsAMarquer` en tire les MOTS à marquer,
 * `intervalleDuPassageFautif` en tire la POSITION. *Deux calculs qui se
 * ressemblent finiraient par diverger, et le marquage désignerait alors un
 * autre endroit que la cible de la désignation.*
 *
 * @returns `null` quand le diff est vide — la correction AJOUTE au lieu de
 *   remplacer, « un manque n'est pas un défaut » (`02-` §2.3.3).
 */
function tranchesDuDiff(
  a: readonly string[], b: readonly string[],
): { debut: number; fin: number } | null {
  let d = 0
  while (d < a.length && d < b.length && a[d] === b[d]) d++
  let f = 0
  while (f < a.length - d && f < b.length - d && a[a.length - 1 - f] === b[b.length - 1 - f]) f++
  return d < a.length - f ? { debut: d, fin: a.length - f } : null
}

/** Les mots d'un texte AVEC leurs bornes — même découpe que `mots()`. */
function motsSitues(texte: string): Array<{ debut: number; fin: number }> {
  const out: Array<{ debut: number; fin: number }> = []
  const re = /\S+/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(texte)) !== null) out.push({ debut: m.index, fin: m.index + m[0].length })
  return out
}

/**
 * ⭐⭐ LE PASSAGE FAUTIF, EN INTERVALLE DE CARACTÈRES — la CIBLE de la
 * désignation (`02-` §5, « L'élève DÉSIGNE dans le matériau »).
 *
 * ⛔⛔ **IL SE SITUE, IL NE SE CHERCHE PAS — ET C'EST TOUTE LA DIFFÉRENCE.**
 * Le marquage, lui, CHERCHE : « chacun là où il apparaît », et un candidat qui
 * revient trois fois se marque trois fois. La cible est l'inverse : **un
 * endroit**, celui que le diff désigne. *Éprouvé sur la banque du 28/08 : le
 * passage fautif d'`ex-exemple-composer-04-densite-friction-1` est le mot « il »
 * — qui apparaît deux fois. Chercher rendait l'englobant des deux occurrences,
 * **29 mots au lieu d'un**, et la désignation devenait injugeable : plus aucune
 * zone ne pouvait manquer une cible aussi large.* Deux cas sur 290, et ils
 * suffisaient.
 *
 * Base 0, fin exclue.
 */
export function intervalleDuPassageFautif(
  contenu: string | null | undefined, versionCorrigee: string | null | undefined,
): [number, number] | null {
  const texte = contenu ?? ''
  const a = mots(texte)
  const b = mots(versionCorrigee ?? '')
  if (!a.length || !b.length) return null
  const t = tranchesDuDiff(a, b)
  if (!t) return null
  const situes = motsSitues(texte)
  const premier = situes[t.debut]
  const dernier = situes[t.fin - 1]
  if (!premier || !dernier) return null
  return [premier.debut, dernier.fin]
}

/**
 * ⭐ LES BORNES, DANS LE TEXTE — port fidèle de `marque()`
 * (`generateur/web/index.html`), moins son HTML.
 *
 * ⚠️ **L'ESPACE ENTRE LES MOTS SE REBÂTIT** (`\s+`), « sans quoi un retour à la
 * ligne dans le matériau ferait échouer la reconnaissance » : le candidat
 * « le garant » et le matériau qui l'écrit sur deux lignes doivent se
 * reconnaître.
 *
 * ⚠️ **LES BORNES SONT DES LETTRES UNICODE** — `(^|[^\p{L}])` à gauche,
 * `(?![\p{L}])` à droite — pour ne pas marquer un mot À L'INTÉRIEUR d'un autre
 * (« or » dans « alors »). La borne gauche CONSOMME un caractère, qui n'est pas
 * marqué : c'est pourquoi l'intervalle commence après elle.
 *
 * ⚠️ **LA RECONNAISSANCE EST GLOBALE** : un candidat qui apparaît deux fois se
 * marque deux fois — « chacun là où il apparaît » le demande.
 */
function bornes(texte: string, suites: readonly (readonly string[])[]): Array<[number, number]> {
  const trouves: Array<[number, number]> = []
  for (const suite of suites) {
    if (!suite.length) continue
    // ⭐ L'EXPRESSION VIENT DE `motifDe`, celle-là même dont `estFragment` s'est
    //    servi pour décider que ce candidat se marquait : c'est ce qui garantit
    //    qu'aucun candidat retenu là-bas n'échoue ici.
    const re = motifDe(suite, true)
    let m: RegExpExecArray | null
    while ((m = re.exec(texte)) !== null) {
      const debut = m.index + m[1].length
      trouves.push([debut, debut + m[2].length])
      // Le `g` avance déjà `lastIndex` ; la garde ci-dessous n'existe que pour
      // le cas dégénéré d'une correspondance vide, qui bouclerait sans fin.
      if (m[0].length === 0) re.lastIndex++
    }
  }
  return trouves
}

/**
 * ⭐ LE MATÉRIAU, DÉCOUPÉ EN SEGMENTS MARQUÉS ET NON MARQUÉS.
 *
 * C'est la seule sortie de ce module, et elle est PARTITIONNANTE : la
 * concaténation des `texte`, dans l'ordre, rend `texte` à l'octet près. Aucun
 * caractère n'est ajouté, retiré, échappé ni interprété.
 *
 * Les intervalles trouvés se FUSIONNENT quand ils se chevauchent ou se
 * touchent : deux candidats qui se recouvrent font un seul segment marqué,
 * jamais deux `<strong>` imbriqués.
 */
export function segmenterMateriau(
  texte: string, suites: readonly (readonly string[])[],
): SegmentMateriau[] {
  if (!texte) return []
  return segmenterParIntervalles(texte, bornes(texte, suites))
}

/**
 * ⭐ C5-L2 — LA MÊME DÉCOUPE, À PARTIR DE BORNES DÉJÀ CONNUES.
 *
 * `segmenterMateriau` CALCULE ses bornes (les candidats servis, le diff) ; la
 * lecture, elle, les A DÉJÀ : `exercices.materiau_source_localisation` porte la
 * sélection que le professeur a faite dans le texte, **en caractères, base 0,
 * fin exclue** (`02-` §6 B.1 ; C5-L1). Il n'y a donc rien à chercher — il n'y a
 * qu'à découper.
 *
 * ⛔ **CE N'EST PAS UN SECOND SEGMENTEUR** : c'est celui-ci que
 * `segmenterMateriau` appelle depuis C5-L2, et la garantie de partition est
 * écrite une seule fois — la concaténation des `texte`, dans l'ordre, rend
 * `texte` à l'octet près. *Deux découpes d'un même texte seraient deux
 * domiciles, et la promesse « pas un octet retouché » n'en aurait plus qu'un
 * demi.*
 *
 * Les intervalles se trient, se BORNENT au texte et FUSIONNENT quand ils se
 * chevauchent ou se touchent. Un intervalle vide ou hors du texte est ignoré :
 * on ne devine pas, et on ne lève pas — un englobant mal saisi doit rendre le
 * texte entier NON marqué, jamais un écran mort.
 */
export function segmenterParIntervalles(
  texte: string, intervalles: readonly (readonly [number, number])[],
): SegmentMateriau[] {
  if (!texte) return []
  const propres = intervalles
    .map(([d, f]) => [Math.max(0, Math.min(d, texte.length)),
      Math.max(0, Math.min(f, texte.length))] as [number, number])
    .filter(([d, f]) => f > d)
    .sort((x, y) => x[0] - y[0] || x[1] - y[1])

  const fusion: Array<[number, number]> = []
  for (const [d, f] of propres) {
    const dernier = fusion[fusion.length - 1]
    if (dernier && d <= dernier[1]) dernier[1] = Math.max(dernier[1], f)
    else fusion.push([d, f])
  }
  if (!fusion.length) return [{ texte, marque: false }]

  const out: SegmentMateriau[] = []
  let curseur = 0
  for (const [d, f] of fusion) {
    if (d > curseur) out.push({ texte: texte.slice(curseur, d), marque: false })
    out.push({ texte: texte.slice(d, f), marque: true })
    curseur = f
  }
  if (curseur < texte.length) out.push({ texte: texte.slice(curseur), marque: false })
  return out
}

/**
 * ⭐ LE GESTE COMPLET, EN UN APPEL — celui que l'écran et l'aperçu partagent.
 *
 * ⚠️ **`candidats` DOIT ÊTRE CE QUI A ÉTÉ RÉELLEMENT SERVI.** Là où l'offre de
 * crédence ne se compose pas — `empechement` non nul (banque trop courte,
 * `reponse_attendue` manquante), ou cran sans crédence —, **il n'y a pas de
 * « candidats servis » et il n'y a rien à marquer.** L'appelant passe alors
 * une liste vide : on ne devine pas.
 *
 * ⛔ **`versionCorrigee` NE RESSORT PAS.** La valeur de retour ne porte que des
 * tranches de `contenu`.
 */
/**
 * ⛔⛔ MARQUER TOUT, C'EST NE DÉSIGNER RIEN — garde du 29/08.
 *
 * Mesuré au cran 1 : **8 cas** où le passage marqué couvrait le matériau
 * ENTIER, parce qu'un candidat servi était le matériau lui-même. *Un
 * surlignage qui prend tout ne dit pas où regarder ; il fatigue l'œil et
 * n'apprend rien.* On préfère alors ne rien marquer — ce que le `02-` §5
 * appelle déjà « rien à marquer n'est pas une panne ».
 *
 * ⚠️⚠️ ELLE NE VAUT QU'AU RÉGIME `candidats`, et c'est une correction : aux
 *    crans 3 et 5, un matériau d'UNE SEULE PHRASE est légitimement marqué en
 *    entier — la règle (1) l'étend à sa phrase, et sa phrase est tout le
 *    matériau. *Huit tests l'ont dit avant que je m'en avise.* Là-bas, tout
 *    marquer est la bonne réponse ; ici, c'est un candidat qui recopie le
 *    matériau.
 */
function marqueTout(contenu: string, jetons: readonly string[][]): boolean {
  const total = mots(contenu).length
  if (!total) return false
  const couverts = jetons.reduce((n, j) => n + j.length, 0)
  return couverts >= total
}

export function marquerLeMateriau(
  contenu: string | null | undefined,
  regle: string | null | undefined,
  appui: { candidats?: readonly string[] | null; versionCorrigee?: string | null
    consigne?: string | null; observable?: string | null } = {},
): SegmentMateriau[] | null {
  if (contenu == null) return null
  const regime = regimeDeMarquage(regle)
  const jetons = motsAMarquer(regime, {
    candidats: appui.candidats, contenu, versionCorrigee: appui.versionCorrigee,
    consigne: appui.consigne, observable: appui.observable,
  })
  const efface = regime === 'candidats' && marqueTout(contenu, jetons)
  return segmenterMateriau(contenu, efface ? [] : jetons)
}

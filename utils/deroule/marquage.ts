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
 * ⭐ LE SEUIL DU CANDIDAT MARQUABLE — UN OU DEUX MOTS, PAS PLUS.
 *
 * ⛔ « Un candidat qui n'est pas un fragment du matériau ne se marque pas » —
 * « au cran 3 les candidats sont des REMPLACEMENTS, ils n'y figurent pas »
 * (`02-` §5). La source pose la règle ; elle ne dit pas comment on distingue un
 * fragment d'un remplacement. **L'aperçu du générateur l'opérationnalise, et ce
 * seuil est SON chiffre** : `j.length && j.length <= 2` dans `motsAMarquer`.
 * On le recopie, on ne l'invente pas — le porter à trois ferait marquer des
 * bouts de phrase, le ramener à un raterait « le garant » et « en effet ».
 */
export const MOTS_MAX_PAR_CANDIDAT = 2

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
  { candidats, contenu, versionCorrigee }: {
    candidats?: readonly string[] | null
    contenu?: string | null
    versionCorrigee?: string | null
  },
): string[][] {
  const out: string[][] = []
  if (regime === null || regime === 'rien') return out

  if (regime === 'candidats') {
    for (const c of candidats ?? []) {
      const j = mots(c ?? '')
      if (j.length && j.length <= MOTS_MAX_PAR_CANDIDAT) out.push(j)
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
  const b = mots(versionCorrigee ?? '')
  if (!a.length || !b.length) return out

  // Le préfixe commun, puis le suffixe commun ; le milieu EST le passage.
  // « celui, et celui-là seul » : UN SEUL passage, jamais deux — c'est
  // exactement ce que la source exige, et c'est ce que cette forme garantit.
  let d = 0
  while (d < a.length && d < b.length && a[d] === b[d]) d++
  let f = 0
  while (f < a.length - d && f < b.length - d && a[a.length - 1 - f] === b[b.length - 1 - f]) f++
  if (d < a.length - f) out.push(a.slice(d, a.length - f))
  return out
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
  const echappe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const trouves: Array<[number, number]> = []
  for (const suite of suites) {
    if (!suite.length) continue
    const motif = suite.map(echappe).join('\\s+')
    const re = new RegExp(`(^|[^\\p{L}])(${motif})(?![\\p{L}])`, 'gu')
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
export function marquerLeMateriau(
  contenu: string | null | undefined,
  regle: string | null | undefined,
  appui: { candidats?: readonly string[] | null; versionCorrigee?: string | null } = {},
): SegmentMateriau[] | null {
  if (contenu == null) return null
  const regime = regimeDeMarquage(regle)
  return segmenterMateriau(contenu, motsAMarquer(regime, {
    candidats: appui.candidats, contenu, versionCorrigee: appui.versionCorrigee,
  }))
}

// ============================================================================
// LA CONSIGNE, QUELLE QUE SOIT SA FORME PHYSIQUE — le `07-` §1.1 la laisse libre.
// ----------------------------------------------------------------------------
// ⚠️ MODULE PUR, ET C'EST LA RAISON D'ÊTRE DE CE FICHIER. Il vivait dans
//    `contexte.ts`, qui porte `import 'server-only'` et n'est donc PAS testable
//    sous `npm test`. Le patron du dépôt est d'extraire le pur (cf.
//    `utils/cout-usage.ts`) : rien ici n'importe la base ni le serveur.
//
// ⭐ CE QUE CE MODULE RÉPARE — smoke élève du 24/08. La lecture ne connaissait
//    que trois formes : une chaîne, `{texte}`, `{cas:[…]}`. Or **une paire écrit
//    un TABLEAU NU** — `cas.map((x) => x.consigne)`, dans `editerInstance`. Ce
//    n'était aucune des trois : on tombait sur le repli `JSON.stringify`, et
//    **l'élève lisait `["« … »","« … »"]`**. Le modèle qui écrit le retour
//    aussi, puisque `ctx.consigne` sert toute la chaîne.
// ============================================================================

/**
 * La consigne servie en texte.
 *
 * Quatre formes admises, et le repli ne sert plus qu'à ce qui n'est vraiment
 * pas une consigne :
 *   · une **chaîne** — le cas ordinaire, un seul cas ;
 *   · un **tableau nu** — la forme d'une PAIRE, deux consignes, une par cas ;
 *   · `{ texte }` — la forme portée par l'import ;
 *   · `{ cas: […] }` — l'autre forme de paire, déjà connue.
 */
export function enTexte(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return casNommes(v)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.texte === 'string') return o.texte
    if (Array.isArray(o.cas)) return casNommes(o.cas as unknown[])
  }
  return JSON.stringify(v ?? null)
}

/**
 * Les consignes d'une paire, une par cas, **chacune sous son nom**.
 *
 * ⚠️ NOMMÉES, JAMAIS CONCATÉNÉES À PLAT : « pour une paire il y a DEUX
 *    consignes, une pour chaque exercice » (Louis, 24/08). Un modèle qui reçoit
 *    deux énoncés collés bout à bout ne sait plus lequel il juge.
 */
export function casNommes(cas: unknown[]): string {
  // Une paire dégénérée (un seul élément) rend sa consigne seule : la nommer
  // « Cas 1 » quand il n'y en a qu'un serait un décor, pas une information.
  if (cas.length === 1) return typeof cas[0] === 'string' ? cas[0] : JSON.stringify(cas[0])
  return cas
    .map((c, i) => `Cas ${i + 1} — ${typeof c === 'string' ? c : JSON.stringify(c)}`)
    .join('\n')
}

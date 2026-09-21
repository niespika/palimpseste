import type Anthropic from '@anthropic-ai/sdk'
// Briques IA COMMUNES aux modules (RAG L5, SPEC §9.3) — EXTRACTION à
// comportement constant depuis utils/aletheia-retours.ts : le REGISTRE et les
// helpers d'injection/neutralisation y étaient locaux ; le chat Scriptorium les
// partage désormais. Aucun changement de contenu : le `git diff` des prompts
// Aletheia rendus est vide (même chaîne REGISTRE, mêmes remplacements).

// Le texte élève est inséré entre des balises <<<…>>>. On neutralise toute tentative
// de "fermer" une balise pour injecter de fausses consignes (défense en profondeur :
// le contexte IA contient du texte du livre — amont déjà lu + texte de la semaine).
export const sansDelims = (s: string): string => s.replace(/<<<|>>>/g, '·')

// ── Identité — LE FICHIER DE PERSONNALITÉ PARTAGÉ (`07-` §4) ────────────────
// « Calame est le nom de l'IA quand la plateforme s'adresse à l'élève. Tous les
//   retours sont de sa voix […], la Discussion l'est aussi […] et les séances de
//   lecture guidée des livres également. Une seule voix, un seul ton, quel que
//   soit l'atelier. […] Un seul fichier de personnalité, partagé par tous ces
//   endroits. […] L'IDENTITÉ VIT DANS LE FICHIER PARTAGÉ ; CHAQUE ATELIER
//   N'ÉCRIT QUE SON RÔLE. »                                       — `07-` §4
//
// C4-L11 : l'identité n'existait que dans la chaîne, recopiée en dur à l'appel
// chaud (`chaine.ts`) et écrite dans le gabarit du §4 ; le tuteur disait « le
// tuteur du cours », Aletheia « un tuteur de lecture » — trois voix. Elle
// descend ici, et les trois surfaces la REÇOIVENT.
//
// ⚠️ « Deux fichiers de personnalité — un par atelier — donneraient deux Calame
//    qui divergeraient en un trimestre » : ne recopie jamais ce bloc dans un
//    prompt d'atelier, et ne l'accroche à AUCUNE section éditable en base
//    (`rag_prompt_ton` est la section du TUTEUR, pas ce fichier).
export const IDENTITE = `## Qui tu es (RÈGLE TRANSVERSALE)
Tu es Calame. C'est le nom de la plateforme Palimpseste quand elle s'adresse à un élève : les retours sur ses exercices, la Discussion sur le cours, les séances de lecture guidée des livres — c'est toujours toi. Une seule voix, un seul ton, quel que soit l'atelier ; l'atelier ne dit que ton RÔLE du moment. Tu écris avec chaleur et précision, jamais de condescendance, jamais de généralités. Tu parles de son TRAVAIL, jamais de sa personne.`

// ── Registre — rappel transversal injecté dans TOUS les prompts (SPEC §2.3) ───
// C'est le `ton` du fichier de personnalité partagé au sens du `07-` §4 — « le
// rappel de registre de langue que TOUS les prompts de la plateforme
// reçoivent ». ⚠️ À NE PAS CONFONDRE avec le registre de RETOUR (descriptif /
// interrogatif / démonstratif), élu par le `01-` §8.7, qui est la variable
// `{{REGISTRE}}` du gabarit : « substituer l'un dans l'autre est un mode de
// panne, pas une hypothèse » (`07-` §4).
export const REGISTRE = `## Registre (RÈGLE TRANSVERSALE)
Tu écris pour des élèves de 1ère / Terminale, pas toujours à l'aise avec la langue ni dotés d'une grande culture. Donc : phrases COURTES, mots SIMPLES, tout terme difficile explicité entre parenthèses. Rends les nuances saisissables SANS niveler la philosophie : la nuance reste là, mais accessible. Pas de jargon gratuit, pas de longues périodes.`

// Remplace {var} en UNE seule passe : un {placeholder} présent dans le texte de
// l'élève n'est donc jamais ré-interprété comme une autre variable injectée ensuite
// (et les « $ » du contenu restent littéraux). Un {token} inconnu est laissé tel quel.
export function injecter(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, cle: string) => (cle in vars ? vars[cle] : match))
}

export function extraireJSON(texte: string): string {
  return texte.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
}

// ── Sorties JSON contraintes — LA GRAMMAIRE NE SAIT PAS ÉCHAPPER (21/09) ─────
// Nina P., S3 (Vestigia) : le modèle écrit « la question "qui suis-je ?" » avec
// des guillemets DROITS. Sans schéma, `JSON.parse` cassait (analyse en erreur).
// AVEC `output_config.format`, le `"` brut est accepté par la grammaire comme FIN
// DE CHAÎNE, la clé suivante est forcée, et le modèle CONTINUE SA PHRASE dans le
// champ d'après : JSON valide, quatre champs qui sont les morceaux d'une seule
// phrase, rien ne lève. Deux parades, ensemble :
//   1. la règle ci-dessous, ajoutée PAR LE CODE à chaque appel (un prompt
//      personnalisé en base ne peut pas l'omettre) ;
//   2. `creerJsonSurveille` : la signature de la corruption est un champ texte
//      qui COMMENCE par une ponctuation de continuation — on rejoue l'appel une
//      fois, et on le dit au journal.
export const REGLE_JSON_TEXTE = `

## Règle de format (impérative)
Dans TOUTES les chaînes de ta réponse JSON, n'écris JAMAIS le guillemet droit (") ni la barre oblique inverse (\\). Pour citer un mot ou une phrase, utilise les guillemets français « … » ou l'apostrophe. Cette règle vaut aussi pour la transcription : remplace les guillemets droits de la copie par « ».`

const DEBUT_SUSPECT = /^[,;.»)\]]/

/** Chemin du premier champ texte dont le début trahit une chaîne coupée, ou null. */
export function champJsonSuspect(texte: string): string | null {
  let obj: unknown
  try { obj = JSON.parse(extraireJSON(texte)) } catch { return null }
  const visiter = (v: unknown, chemin: string): string | null => {
    if (typeof v === 'string') return DEBUT_SUSPECT.test(v.trimStart()) ? chemin : null
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) { const r = visiter(v[i], `${chemin}[${i}]`); if (r) return r } return null }
    if (v && typeof v === 'object') { for (const [k, x] of Object.entries(v)) { const r = visiter(x, chemin ? `${chemin}.${k}` : k); if (r) return r } return null }
    return null
  }
  return visiter(obj, '')
}

/**
 * `messages.create` non streamé, rejoué UNE fois si la réponse porte la signature
 * d'une chaîne coupée. L'usage rendu SOMME les deux appels (le coût est vrai).
 */
export async function creerJsonSurveille(
  client: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  contexte: string,
): Promise<Anthropic.Message> {
  const premier = await client.messages.create(params)
  const texte1 = premier.content[0]?.type === 'text' ? premier.content[0].text : ''
  const suspect1 = champJsonSuspect(texte1)
  if (!suspect1) return premier
  console.warn(`[ia] ${contexte} : champ « ${suspect1} » commence par une ponctuation (chaîne coupée par un guillemet ?) — reprise de l'appel`)
  const second = await client.messages.create(params)
  const texte2 = second.content[0]?.type === 'text' ? second.content[0].text : ''
  const suspect2 = champJsonSuspect(texte2)
  if (suspect2) console.error(`[ia] ${contexte} : toujours suspect après reprise (« ${suspect2} »)`)
  return {
    ...second,
    usage: {
      ...second.usage,
      input_tokens: premier.usage.input_tokens + second.usage.input_tokens,
      output_tokens: premier.usage.output_tokens + second.usage.output_tokens,
    },
  }
}

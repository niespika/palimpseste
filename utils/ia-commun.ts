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

// ----------------------------------------------------------------------------
// Rubrique partagée (Lot 5, Phase 2). Source unique : l'échelle E → A des
// sections + les descripteurs de niveaux, définie UNE fois et importée par les
// 4 prompts d'évaluation (écrit / oral / essai / synthèse) via la variable
// {{rubrique}}. Chaque prompt ne garde que ses instructions propres au type de
// travail. Éditable par le prof (config.rubrique) ; ce défaut sinon.
// ----------------------------------------------------------------------------

export const RUBRIQUE_DEFAUT = `## Échelle d'évaluation des sections — lettres E → A

Chaque section (compétence) est évaluée sur cinq niveaux, de E (le plus faible) à
A (le plus fort) ; la valeur 0-4 équivalente est indiquée entre parenthèses. Les
lettres ne s'additionnent pas (elles servent à l'affichage pour l'élève) :

- A (4) — Excellent : richesse, précision, initiative personnelle ; rare.
- B (3) — Bon : effort visible, contenu substantiel, soin réel.
- C (2) — Satisfaisant : le contrat est rempli honnêtement, sans plus.
- D (1) — Insuffisant : la section existe mais reste superficielle, expédiée, ou hors sujet.
- E (0) — Très insuffisant : section absente ou vide de contenu réel.

Évalue avec exigence mais sans sévérité gratuite (C = le contrat est rempli ;
B = un vrai travail ; A = exceptionnel, rare). Respecte le format de sortie
demandé plus bas dans ce prompt.`

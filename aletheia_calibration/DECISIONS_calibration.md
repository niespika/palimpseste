# Décisions de calibration Aletheia — synthèse (livre de test : NdT 4 sem.)

Issu de la revue adversariale (`REVIEW_Aletheia_Adversarial.md`) + du test-retest (`RESULTATS_test_retest.md`), validé empiriquement par le harnais `aletheia_calibration/`.

## Correctifs livrés (branche `fix/aletheia-diagnostic-mal-definie`, 4 commits, NON mergés)

| # | Commit | Quoi | Validation |
|---|---|---|---|
| 1 | `118a4bf` | **`these_mal_definie` décidé par la référence** (plus par l'inférence par élève) | S10 (chapitre descriptif) flague 100 % ; S04/S09/S11/S13 (faibles/vides) ne flaguent plus → vraie note E ; contrôles inchangés |
| 2 | `8c3f9d2` | **Retour VF : teaser permis / réponse jamais révélée + `temperature: 0`** | Juge aligné : 92,5 % teasers (voulus), spoilers niveau 2 = 0/40 à T=0 (vs ~12 % à T=1). Exfiltration par injection = risque résiduel assumé |
| 3 | `579e5e6` | **Diagnostic à `temperature: 0`** (2 phases) | Notation déterministe ; épingle le tir unique sur les cas limites |
| 4 | `e1e3aa3` | **Signal intégrité cible le NON-TRAVAIL** (attrape le remplissage creux) | S13 (blabla creux) → hors_sujet 10/10 ; S06/S01 → aucun ; S07 (hors-sujet substantiel) → alerte prof, pas un strike |

## Reliquat ASSUMÉ — offset d'axes du diagnostic (#3, NON corrigé)

Le diagnostic présente un **décalage systématique CONSTANT** vs l'étalon prof (mesuré, faible variance) :
- **axe thèse : +1 (un peu indulgent)** sur le milieu de gamme (une thèse partielle est lue comme pleinement saisie) ;
- **axe arguments : −1 (un peu sévère)** sur le haut (une restitution complète est notée B, pas A).
Les extrêmes (E ; D côté args) sont justes.

**Décision : accepté et documenté, NON corrigé.** Raisons :
1. L'offset est **constant** (prévisible, pas du bruit).
2. Le diagnostic est **prof-only, interne et relatif** : il calibre la difficulté des retours par la **trajectoire** (progression semaine après semaine), pas par la note absolue → un décalage uniforme est largement neutre.
3. La sévérité côté arguments (−1) est plutôt **plus sûre** (sous-estimer la compréhension → retours plus soutenants).
4. Tentative de correction par prompt (exigence de complétude thèse / « cœur = A » args) = **demi-échec** : 2 cas corrigés, 1 cassé (S08 A→B), args quasi inchangé, **+ régression** (prompt rallongé → dépassement du plafond 512 tokens en phase 2 → troncatures, ex. S02 7/12). Reverté.

**À revisiter** seulement si l'offset gêne en usage réel → piste robuste = **few-shot anchoring** (exemples notés par niveau), au prix de +tokens/latence par diagnostic.

## Reste à faire
- Merger la branche sur `main` (4 correctifs validés, AUCUN SQL requis — changements de prompt/code purs).
- Tester en session élève réelle (jamais fait).
- Reliquats de la revue non traités ici : exfiltration VF par injection (assumée), et les findings faibles/info du rapport adversarial.

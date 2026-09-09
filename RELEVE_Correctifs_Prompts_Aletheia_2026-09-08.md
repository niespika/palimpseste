# Correctifs des prompts Aletheia — 8 septembre 2026

> **Mise à jour de déploiement — 08/09, soirée (Toronto).** Corrections poussées sur `main` (`de0c0d6`) et déploiement Vercel réussi. Migration appliquée à la sandbox ; application en production en attente d’autorisation explicite. Les mentions « aucun push » ci-dessous décrivent l’état au moment de la recette initiale.
Les correctifs AP1–AP5 et AP7 sont implémentés localement. **AP6 est retiré comme défaut**, conformément à l'arbitrage de Louis : la connaissance de l'aval peut éclairer la lecture d'un classique. **Aucun push, aucune migration ou modification de production.**

## Ce qui change

| Point | Comportement corrigé |
|---|---|
| AP1 — diagnostic | « niveau B » est lu comme B. Les mots contenant une lettre A–E ne deviennent plus des niveaux. Les objets incomplets, inventaires vides et niveaux inexploitables déclenchent un échec, sans publication d'une phase réussie. Une absence de compréhension explicitement constatée reste mesurable. |
| AP2 — retours | Une couverture manquante n'est plus reconstruite comme « tout est présent ». L'interaction exige une mesure valide sur chaque phrase, côté préparation **et** action serveur. Une compréhension partielle produit une invitation à compléter/préciser. Les verdicts de nuance et de rappel inconnus ne deviennent plus une confirmation ou un jugement négatif ; un booléen d'ancrage invalide fait échouer la génération. |
| AP3 — tournantes | Le retour argumentatif reçoit la question effectivement posée et le critère correspondant : exemple, objection ou destinataire. L'accord historique garde son traitement lorsqu'il a réellement été demandé. |
| AP4 — aphorismes | L'inventaire identifie une entrée exacte de la référence correspondant au fragment choisi. Une correspondance absente suspend le diagnostic. La réponse à la tournante « fil » et ses preuves sont transportées séparément. Cet axe est non applicable lorsque la question n'a pas été posée, même si le modèle propose une lettre. |
| AP5 — référence | Aucune mesure n'est lancée sans thèse canonique et arguments de référence disponibles. La phase reste à reprendre après préparation de la fiche. |
| AP7 — exposition | Le contexte d'amont VF et son repli en texte brut utilisent la même liste de séances exposées que les paires de passages. Une liste vide signifie bien aucune séance. Cette correction évite de présenter comme déjà étudié un contenu non exposé ; elle n'interdit pas l'éclairage interprétatif autorisé pour AP6. |

Les nouveaux inventaires conservent une version de protocole, le modèle, et des empreintes des prompts et de la référence dans leur JSON. Ces traces permettent de distinguer les conditions de mesure ; elles ne sont pas un archivage intégral des anciens prompts. Aucun changement de schéma SQL n'est nécessaire pour ces ajouts.

## Arbitrage AP6 appliqué

- Les fiches restent générées par lots de deux séances.
- Leur prompt autorise explicitement un éclairage venant de la suite lorsqu'il aide à comprendre, en distinguant cet éclairage de ce qui est établi dans la séance.
- Il ne doit pas être reproché à l'élève de ne pas avoir anticipé cette information.
- Le contexte de tous les retours n'a pas été élargi automatiquement au livre entier. Le capstone conserve son rôle de carte finale du livre.

## Ce que la calibration réelle a ajouté

Huit textes/copies entièrement fictifs ont été éprouvés avec Sonnet 4.6 à température 0, en plusieurs passes. Le script n'a pas accès aux copies réelles et n'écrit pas les coûts dans la base. Un premier appel a échoué sur le réseau et a été repris.

Les premiers résultats ont montré que des consignes de genre placées dans un tronc argumentatif ne suffisaient pas toujours : le modèle pouvait encore demander un panorama des fragments, ou omettre la réponse du dialogue sur la position de l'auteur.

Les corrections issues de ces essais sont :

1. Les critères de l'inventaire par défaut sont adaptés aux gabarits non argumentatifs, au lieu de conserver une tâche générique de restitution des arguments. Les consignes du gabarit sont explicitées comme prioritaires.
2. Dans le dialogue, la réponse sur la position de l'auteur et son indice figurent aussi dans l'entrée principale de l'axe 1, avec l'attribution des voix. La seconde phase reçoit toujours l'inventaire, pas la prose originale.
3. Pour la tournante « fil », un lien avec **un autre fragment** suffit : les fragments supplémentaires non cités ne deviennent pas des manques attendus.

### Contrôles observés

| Cas fictif | Niveaux observés après l'ajustement concerné, axe 1 / axe 2 |
|---|---|
| Argumentatif juste, langue fragile | A / B |
| Argumentatif avec contresens, langue fluide | E / E après reprise de l'échec réseau |
| Dialogue juste, indice de l'auteur explicite | B / B |
| Dialogue avec attribution inversée | E / E |
| Aphorisme avec lien demandé | B / A |
| Aphorisme sans question sur le fil | A / non applicable |
| Notion et application justes | A / A |
| Notion comprise, application non réfutable | B / D |

Ces attentes sont des contrôles construits pour cette recette, **pas un étalon validé par le professeur**. Ce petit corpus confirme les distinctions recherchées ; il ne démontre pas la justesse de toutes les notes ni la stabilité sur les livres réels. Le biais historique de calibration n'a pas été corrigé par un décalage automatique des notes.

Les fichiers conservés sont des étapes successives, pas un tir unique :

- `aletheia_calibration/resultats/prompts_correctifs_2026-09-08.json` : première passe, avec les échecs et les défauts ayant conduit aux ajustements.
- `aletheia_calibration/resultats/prompts_correctifs_2026-09-08_reprise_1788914352269.json` : reprise des six cas non argumentatifs ; le dialogue juste nécessitait encore le regroupement de ses réponses.
- `aletheia_calibration/resultats/prompts_correctifs_2026-09-08_reprise_1788914442133.json` : validation finale des deux dialogues.

Le résultat du contresens argumentatif repris a été observé dans la sortie console d'une passe intermédiaire ; son fichier avait été remplacé lors d'une reprise. Le script horodate maintenant chaque fichier de reprise pour éviter cette perte de trace.

## Validation technique

- **2 596 tests réussis**, aucun échec, dont les tests du précédent audit de code et les nouvelles non-régressions des prompts.
- TypeScript et ESLint : réussis.
- Compilation Next.js finale : réussie, derniers ajustements inclus.
- `git diff --check` : réussi.

La recette hors ligne est incluse dans `npm test` :

```sh
node scripts/recette/audit-prompts-aletheia-2026-09-08.cjs
```

La calibration réseau exige une invocation explicite et peut être restreinte à certains cas :

```sh
node scripts/recette/aletheia-prompts-calibration.cjs --live
node scripts/recette/aletheia-prompts-calibration.cjs --live --only=dialogue-juste,dialogue-inversion
```

## État de livraison

Le push reste en attente, conformément à la demande de Louis. Ces modifications ne recalculent pas les diagnostics historiques et ne réécrivent pas les retours déjà lus. La migration de cohérence préparée lors du précédent chantier reste nécessaire à l'ensemble des correctifs déjà en attente ; cet audit de prompts n'ajoute aucune migration.

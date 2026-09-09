# Audit du code d’Aletheia — 8 septembre 2026

> **Suite à la demande de correction :** les six correctifs sont implémentés et éprouvés localement. Voir `RELEVE_Correctifs_Aletheia_2026-09-08.md` pour les validations et les étapes de mise en service restantes. Le texte ci-dessous conserve les constats de l’audit initial.

Révision examinée : `afd70d3`. **Six défauts retenus, dont deux à corriger en priorité.** Aucune correction applicative, migration, modification de configuration ou opération sur une base n’a été effectuée.

L’audit couvre les parcours de lecture élève et professeur, les soumissions V1/VF, leurs retours et diagnostics, la reprise des interactions d’étayage, ainsi que les points d’entrée vers les exercices et passations partagés avec Codex. Il ne constitue pas une nouvelle recette exhaustive du moteur partagé.

Les constats combinent lecture du code et reproductions isolées exécutant les fonctions du dépôt avec une base en mémoire, des réponses IA simulées et, pour F4, des hooks React simulés. **Ils démontrent des comportements du code, pas leur fréquence ni le nombre d’élèves affectés en production.** Aucun rendu dans un navigateur, contrôle visuel aux trois tailles ou contrôle des politiques RLS effectivement déployées n’a été réalisé.

| Réf. | Priorité | Défaut | Conséquence |
|---|---|---|---|
| F1 | P1 | Générations concurrentes sans réservation ni version de copie | Appels IA multiples ; ancien retour attaché à une nouvelle copie |
| F2 | P1 | Diagnostic conservé après modification de la copie | Niveaux et étayage fondés sur un texte périmé |
| F3 | P2 | Livres de parcours absents du suivi professeur | Travail visible à l’élève, absent du suivi et du diagnostic manuel |
| F6 | P2 | Synthèse interactive proposée sans couverture disponible | Clôture de la séance impossible dans ce cas de repli |
| F4 | P2 | Phrase révélée non restaurée après rechargement | Aide perdue et nouvelle vérification interdite dans l’écran |
| F5 | P2 | Le graphe reprend la V1 quand la VF déclare la thèse non définie | Ancien niveau affiché à la place d’une absence de mesure |

P1 : correction prioritaire pour protéger la cohérence des retours et diagnostics. P2 : correction nécessaire, avec un scénario plus circonscrit.

## F1 — Une relance peut enregistrer un ancien retour sur une nouvelle copie

**Sources :** `app/eleve/modules/aletheia/actions.ts`, `relancerRetour` ; `utils/aletheia-retours.ts:265`, `:273`, `:285`, `:387` et branche VF `:600`.

La relance contrôle l’âge de `updated_at`, puis programme un nouvel appel sans réserver le travail ni actualiser cet horodatage. Le générateur lit simplement `V1_SUBMITTED` ou `VF_SUBMITTED` avant l’appel IA. Plusieurs invocations peuvent donc passer simultanément. Le contrôle du statut au moment d’enregistrer le résultat protège seulement certaines écritures finales ; il ne déduplique pas les appels.

**Scénario reproduit sur V1 :**

1. Une génération A reste en attente sur la copie initiale.
2. Une génération B du même travail démarre : deux appels IA sont effectivement enregistrés par le double de test.
3. B échoue et remet le travail en `DRAFT`.
4. L’élève modifie sa copie et la resoumet : retour à `V1_SUBMITTED`.
5. A termine. Son écriture ne compare que l’identifiant et le statut : elle passe et attache son ancien retour à la nouvelle copie.

Résultat observé : texte `NOUVELLE COPIE`, retour `Retour de l’ANCIENNE COPIE`, statut `FEEDBACK1_READY`. La VF porte le même schéma de lecture, remise en état et écriture ; sa course n’a pas été rejouée séparément.

**Correction conseillée :** attribuer une version à chaque soumission et réserver atomiquement chaque tentative de génération. Les écritures de succès et d’échec doivent vérifier cette version et la tentative propriétaire. La relance doit récupérer une réservation expirée, avec un délai renouvelé.

## F2 — Un diagnostic peut rester celui d’une copie que l’élève a remplacée

**Sources :** `app/eleve/modules/aletheia/actions.ts:190` ; `utils/aletheia-retours.ts:393`, `:1280`, `:1290` et `:1328`.

Le générateur de retour absorbe son erreur après avoir remis le travail en `DRAFT`. L’action poursuit alors son callback et lance le diagnostic automatique : séance 1, ou toutes les séances avec l’étayage actif. `diagnostiquerTravail` ne lit pas le statut du travail et peut donc diagnostiquer ce brouillon redevenu modifiable.

La resoumission conserve le même identifiant de travail. Or le diagnostic considère une phase achevée dès que `inventaire_v1` ou `inventaire_vf` existe, sans comparer le texte ni une version de soumission. Aucun mécanisme dans cette resoumission n’invalide le diagnostic antérieur.

**Reproduction :** un travail `DRAFT` contenant la copie initiale reçoit un diagnostic ; après remplacement du texte et resoumission, un nouvel appel au diagnostic ne déclenche aucun appel IA et conserve l’inventaire précédent.

Le problème dépasse le graphe : `utils/aletheia/forme-serveur.ts` lit ces diagnostics pour déterminer l’aide des séances suivantes. Le même défaut de rattachement existe pour la VF après un échec de retour final.

**Correction conseillée :** rattacher chaque phase du diagnostic à une version immuable du texte. Ne jamais considérer un inventaire ancien comme valide pour une nouvelle version. Définir explicitement si le diagnostic d’une soumission dont le retour a échoué doit être conservé comme historique ou attendu jusqu’à stabilisation.

## F3 — Les livres distribués uniquement par parcours disparaissent côté professeur

**Sources :** `app/prof/aletheia/donnees.ts:11`, `app/prof/aletheia/actions.ts:145`, `app/prof/aletheia/page.tsx` ; comparaison avec `app/eleve/modules/aletheia/data.ts:77`.

Le lecteur élève calcule l’union des affectations directes et des livres gouvernés par un parcours assigné. Le lecteur professeur `livresDeClasse`, le compteur des livres par classe et `lancerDiagnosticClasse` consultent uniquement `scriptorium_unite_classes`.

**Reproduction :** avec un livre exposé uniquement par un parcours, `livresPourClasse` renvoie un livre et `livresDeClasse` renvoie une liste vide. La sélection des travaux pour le diagnostic manuel s’arrête également immédiatement lorsqu’aucun lien direct n’existe.

Le professeur peut lire « Aucun livre assigné » alors que ses élèves y travaillent. La fiche individuelle réutilise `livresDeClasse`, donc ouvrir le détail de l’élève ne contourne pas le défaut. Les diagnostics automatiques peuvent exister sans apparaître dans ce suivi.

**Correction conseillée :** partager la résolution des livres exposés entre les lecteurs élève/professeur et le diagnostic manuel, en conservant les gardes d’accès propres à chacun.

## F6 — Une synthèse sans couverture peut bloquer la clôture

**Sources :** `utils/aletheia-retours.ts:646`, `:724` ; `utils/aletheia/retour-vf-serveur.ts:126` ; `app/eleve/modules/aletheia/actions.ts:537` ; `components/aletheia/RetourFinalAgi.tsx:275`.

La génération accepte une synthèse produite par le modèle lorsque la synthèse canonique de la fiche est absente ou vide. Mais les identifiants à évaluer pour `synthese_couverture` sont exclusivement calculés depuis la fiche canonique. Cette couverture reste donc vide dans ce repli.

Si le retour contient également une nuance détaillée, la page active le retour interactif. `preparerRetourFinal` transforme alors toute synthèse non vide en synthèse interactive, sans vérifier sa couverture. Son bouton appelle `comparerSyntheseAction`, qui refuse précisément une couverture vide : « Cette synthèse n’a pas été jugée. » Le bouton de clôture n’apparaît qu’après une comparaison réussie, et la tuile à barre intégrée supprime le bouton générique.

**Reproduction isolée :** une fiche `READY` à synthèse vide et une réponse IA avec synthèse de repli et nuance produisent un travail `FEEDBACK2_READY`, avec une couverture vide, puis une synthèse interactive non vide. Le refus de comparaison et l’absence du bouton de clôture sont établis par lecture des branches correspondantes. Ce cas n’a pas été observé sur un élève réel.

**Correction conseillée :** conserver la lecture simple lorsque la couverture de la synthèse affichée est indisponible. Si la référence peut changer pendant la génération, figer également le texte de synthèse dont les phrases ont été évaluées.

## F4 — Recharger la page fait perdre la phrase révélée après les essais

**Sources :** `app/eleve/modules/aletheia/ReponsesRelancesFil.tsx:53`, `:63`, `:77` et `:116` ; préparation dans `utils/aletheia/fenetre-serveur.ts:37`.

Pendant la session, l’action renvoie les identifiants de la bonne phrase après un succès ou le deuxième échec. Le composant les garde dans `pivot`. Après un rechargement complet, il restaure le verdict, le nombre d’essais et la sélection de l’élève, mais pas ce `pivot`. La préparation serveur ne tient pas compte des essais pour restituer une phrase déjà révélée.

Le calcul de `merite` vaut pourtant toujours vrai dès deux essais : la sélection devient non cliquable et le bouton de vérification disparaît. Après deux erreurs, l’élève peut donc voir son ancien mauvais surlignage, sans la bonne phrase, puis lire une invitation à répondre en s’appuyant sur une phrase censée être montrée.

**Reproduction du composant avec hooks simulés :** état restauré avec deux essais, `enEvidence = []`, `cliquable = false`, bouton « Ta réponse → ». Aucun rendu navigateur n’est revendiqué.

**Correction conseillée :** reconstruire côté serveur les pivots déjà révélés, à partir des essais persistés et de la référence, puis les transmettre explicitement à l’état initial du composant.

## F5 — Le graphe réutilise un ancien niveau malgré une VF « mal définie »

**Sources :** `app/prof/aletheia/diagnostic.ts:8` ; consommateur `app/prof/aletheia/eleve/[eleveId]/GrapheProgression.tsx:37`.

`niveauThese` ne regarde `these_mal_definie_vf` que lorsque `niveau_these_vf` est non nul. Pourtant le producteur pose précisément ce niveau à `null` quand la thèse est déclarée mal définie. Le lecteur saute donc cette branche et reprend la V1.

**Reproduction :** V1 à `3`, VF à `null`, `these_mal_definie_vf = true` → résultat `3`, au lieu de `null`. Le graphe place un point là où sa règle prévoit une interruption de la courbe.

**Correction conseillée :** traiter d’abord le caractère non défini de la mesure VF, puis sa valeur, avant d’envisager le repli vers une V1 en l’absence de diagnostic final.

## Vérification et reprise

**219 tests existants réussis, 0 échec**, ciblant `utils/aletheia/*.test.ts`, `utils/aletheia-*.test.ts`, les onglets Aletheia et `utils/passation/*.test.ts`.

```sh
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-ts-resolver.mjs --test 'utils/aletheia/*.test.ts' 'utils/aletheia-*.test.ts' 'utils/codex-onglets/onglets-aletheia.test.ts' 'utils/passation/*.test.ts'
node scripts/recette/audit-aletheia-2026-09-08.cjs
```

Le second script charge le code TypeScript du dépôt et remplace ses dépendances externes. Il ne lit aucune clé, n’appelle aucun fournisseur IA et ne contacte aucune base. **Mise à jour après correction : ses assertions vérifient désormais les comportements attendus**, et le harnais est intégré à `npm test`. La recette PostgreSQL distincte vérifie la migration et les courses sous verrous réels. Le message d’échec réseau est injecté volontairement pour F1.

Ordre conseillé : corriger ensemble le rattachement des retours et diagnostics à la version de copie (F1/F2), rétablir la possibilité de clôturer le repli de synthèse (F6), harmoniser le suivi des livres (F3), puis réparer la reprise du surlignage et le graphe (F4/F5). Une vérification ultérieure en base serait nécessaire pour chiffrer les travaux réellement concernés, et une recette navigateur pour valider les parcours corrigés.

# Pilote argument — distribution automatique, 11 septembre 2026 au soir

**Publication demandée par Louis — 11/09 au soir (12/09 UTC).** Autorisation explicite de publier, déployer et ouvrir la distribution automatique. Commande dédiée ajoutée dans Scriptorium → Paramètres → « Le pilote argument — crans 6 et 8 » : ouvrir/fermer la distribution sans fermer l’accès aux exercices déjà attribués. La commande générale du pilote reste distincte. Seize contrôles isolés des deux actions serveur réussis ; TypeScript, ESLint ciblé et build de production réussis (polices téléchargées avec accès réseau). Déploiement et migration production en cours ; l’état OFF et « non autorisé » ci-dessous devient historique dès leur vérification finale. Aucune calibration relancée, aucune manipulation de l’écran ou de Chrome.


## État livré

Raccordement réalisé localement pour TC, 1HLP et THLP, aux crans 6 et 8. Le routeur reçoit des offres admissibles pour la classe de l’élève ; seule l’offre choisie devient un exercice, un contrat figé et un dépôt. La pose hebdomadaire et « en faire plus » utilisent la même offre. Les instances attribuées manuellement restent exclues de la banque commune.

**Local et sandbox seulement.** Aucun push, déploiement, import ou changement de production pendant cette séance. Le bouton des paramètres du commit `fab8e12` est conservé et sera inclus par la publication de cette branche. `origin/main` revérifié à `ed1dbd8` ; dernier déploiement Production déclaré par GitHub/Vercel : ce même commit, statut `success`, créé le 12/09 à 00:24 UTC. L’alias public n’a pas été inspecté visuellement.

## Fonctionnement et garde-fous

- Nouvelle porte `pilote_argument_banque_actif`, **OFF par défaut**. Il faut aussi que le pilote et le routeur soient ouverts. La fermeture du bouton existant suspend donc également cette distribution ; elle ne détruit aucun contrat.
- Admissibilité reprise du pilote : bon parcours et niveau, classe active, sujet validé et non bloqué, cours vu ou en cours. Ouverture par notion en TC et par grand thème en HLP. Une nouvelle vérification précède la transaction, qui contrôle aussi l’inscription et l’état du sujet.
- Identité stable par élève, classe, sujet et cran. Un sujet/cran déjà attribué, y compris manuellement, n’est pas reproposé. Le même sujet ne peut pas être sélectionné au 6 puis au 8 dans le même cycle, y compris dans le bonus.
- Durées, budgets, ordre des compétences, registre et sondes restent ceux du moteur. Le contrat se fige après le choix de la principale et de la secondaire. Les neuf configurations restent valides ; aucune sonde silencieuse supplémentaire n’est ajoutée au pilote. Les alternatives virtuelles non attribuées ne deviennent pas des liens vers des exercices inexistants.
- Transaction pour la semaine entière, y compris ses exercices ordinaires : décisions, exercices du pilote, contrats et dépôts réussissent ou sont annulés ensemble. Une clé de service et un verrou par élève/cycle empêchent les doublons ; le bonus garde son rang et sa marque. Une reprise conserve le brouillon, le statut et la date d’assignation.
- Contrat 0.4, treize attentes, questions et retours acceptés inchangés. Les anciens contrats gardent leur version. Aucun seuil B/A, aucune lettre ni réussite globale n’est fabriqué à partir du jugement local.

## Vérification effectivement réalisée

La migration `pilote_argument_banque.sql` a d’abord été jouée dans une transaction annulée, sans ses propres `begin/commit`. L’absence de la colonne, de la table et de la RPC a été revérifiée après annulation. Application sandbox ensuite : porte OFF, RPC inaccessible à `authenticated`, tables privées. `pilote_argument_banque_rollback.sql` a été éprouvé : seule la nouvelle porte est fermée, les autres paramètres sont conservés.

Recette sur comptes et classes synthétiques, puis retrait du décor dans `finally` :

| Contrôle | Résultat |
|---|---|
| Offre sandbox sur les cours du décor | TC : 9 sujets ouverts par la vérité ; 1HLP : 20 ; THLP : 46 |
| Service automatique, vivier contrôlé | Les six combinaisons parcours × cran ont produit leurs contrats et dépôts |
| Deux appels concurrents et troisième appel de reprise | Un seul service ; seules les offres choisies sont matérialisées |
| Sujet sans cours admissible, portes fermées | Aucun sujet offert / attribution refusée |
| Échec sur la deuxième ligne d’une semaine | Première insertion annulée ; nouvelle tentative possible |
| Brouillon repris après succès | Texte, statut et `assigne_at` conservés |
| Bonus concurrent | Une décision et un dépôt ; marque `bonus` conservée |
| Vrai point d’entrée hebdomadaire, banque entière, gabarit ON | Un pilote au cran 6 pour chacun des trois parcours, après les prérequis synthétiques nécessaires |
| Cran 8, gabarit et juge-mesure ON | Service par le signal de trajectoire déjà adopté, éprouvé dans les trois parcours sur mesures synthétiques |
| Passation d’un cran 8 automatiquement servi | V1 → retour → VF → retour final, côté serveur ; aucune aide dans la projection avant V1 |
| Progression | Lettres-équivalentes et delta global NULL ; aucune seconde mesure VF ; pilote exclu du registre des réussites |
| Conservation et nettoyage | Empreintes exactes des sujets, exercices, matériaux, cas et contrats préexistants retrouvées ; paramètres restaurés ; comptes et décor retirés |
| Contrôles locaux | 2 633 tests réussis, TypeScript et ESLint ciblé, contrôle du diff |

Les premiers essais avec la banque entière ne sélectionnaient pas le pilote : le décor avait des réussites aux crans 2, 4 et 5 mais omettait les prérequis 1 et 3 que le routeur exige. Le décor a été complété et le point d’entrée a ensuite servi le cran 6. **Aucune règle de progression n’a été modifiée pour obtenir ce résultat.**

La passation IA fonctionnelle unique a utilisé dix appels comptabilisés par la chaîne, environ 130 secondes pour les deux versions. Une alerte de fidélité P1 sur une citation non littérale a été conservée dans la preuve. Cela ne valide pas la qualité pédagogique du jugement ; aucun banc de calibration ni gold n’a été relancé ou modifié.

État sandbox final : nouvelle porte OFF, pilote OFF, notions OFF, routeur ON, gabarit ON, juge-mesure OFF, comme avant les essais pour les paramètres existants ; 1 182 exercices et 128 sujets. La nouvelle structure SQL reste installée en sandbox.

## Limites et suite

L’accès automatique dépend toujours de la progression de chaque élève. Ouvrir les portes ne donne pas immédiatement un cran 6/8 à tous : un objet neuf reste en méthode ; les prérequis et les sondes continuent de décider. Les preuves sur profils synthétiques ne prédisent pas la sélection des élèves réels lundi. La réussite locale du pilote ne débloque toujours pas, à elle seule, un cran supérieur et ne fait pas monter une lettre.

Le contrôle de la passation est serveur, pas une traversée des écrans. Aucune capture, aucune action sur Chrome, le pointeur ou l’écran. Pas de nouvelle recette visuelle du bouton `fab8e12`. Les irrégularités pédagogiques déjà admises restent des limites ; la calibration approfondie reste différée.

Pour la publication : conserver `fab8e12` et ce raccordement ensemble, vérifier l’activité réelle, publier le code avec la nouvelle porte fermée, puis appliquer la migration de production et ouvrir la nouvelle porte seulement dans le cadre d’une autorisation adaptée. Les anciennes autorisations de publication jusqu’à `ed1dbd8` ne constituent pas une nouvelle autorisation de ces mutations. Ne pas rejouer les migrations déjà appliquées du pilote manuel ou des notions, ni refermer leurs portes de production précédemment ouvertes.

Outillage durable : `scripts/recette/sql-banque-argument.mjs` et `scripts/recette/raccordement-banque-argument.ts`, strictement bornés à la sandbox. Les registres privés permettent `--nettoyer` après interruption. Les preuves détaillées sont dans `scripts/recette/pilote-argument/campagnes/v04-2026-09-11/raccordement-recette-*.json` et `.log`, ignorés par Git ; les essais 2 (passation), 5 (point d’entrée complet) et 6 (trajectoire au 8) portent les preuves finales.

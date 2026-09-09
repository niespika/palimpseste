# Audit des prompts Aletheia — 8 septembre 2026

**Suite du 8 septembre :** correctifs AP1–AP5 et AP7 autorisés puis implémentés localement. **AP6 retiré comme défaut**, sur arbitrage explicite de Louis : connaître l’aval peut aider à comprendre les classiques (notamment l’ironie de Socrate). Les lots de deux sont conservés, et le prompt de référence autorise cet éclairage sans en faire un prérequis attendu de l’élève. Le corps ci-dessous conserve le constat initial ; l’état final figure dans `RELEVE_Correctifs_Prompts_Aletheia_2026-09-08.md`.

Audit demandé pendant l'attente du push. **Aucune modification des prompts, du code applicatif ou de la production ; aucun déploiement.** Ce document et la recette de reproduction sont les seuls ajouts de cet audit.

## Verdict

Le dispositif pédagogique a une structure cohérente : V1 socratique, VF explicative, diagnostic en deux étapes pour séparer compréhension et qualité de rédaction. Les problèmes prioritaires sont dans le **contrat entre questions, contexte fourni au modèle et interprétation de ses réponses**. Allonger les consignes ne suffira pas à les corriger.

Sept constats sont détaillés ci-dessous. Les sondes exécutent le code réel avec des réponses IA et une base **simulées**. Elles démontrent les transformations et les pertes de données ; elles ne mesurent pas leur fréquence avec le modèle en service.

| Réf. | Priorité | Constat | Situation observée en production |
|---|---|---|---|
| AP1 | P1 | Le lecteur de niveaux peut transformer « niveau B » en E et accepter un diagnostic vide | Chemin utilisé ; aucune anomalie de ce type établie dans les diagnostics stockés |
| AP2 | P2 | Une réponse absente ou invalide devient un verdict pédagogique certain | Chemin de l'étayage actif ; occurrence réelle non établie |
| AP3 | P2 | La question tournante argumentative n'entre pas dans les prompts V1/VF | Un travail terminé porte déjà la tournante « exemple » |
| AP4 | P2 | Le diagnostic aphoristique perd la réponse sur le fil et le repère du fragment | Latent : les trois livres actifs sont argumentatifs |
| AP5 | P2 | Un niveau est calculé même sans référence permettant de le juger | Aucun des 40 diagnostics stockés n'est actuellement privé de référence |
| AP6 | Arbitrage : retiré | La génération de la synthèse canonique reçoit aussi la séance suivante | Lots de deux dans le code ; aucun spoiler réel établi par cet audit |
| AP7 | P2 | L'amont VF assimile les séances antérieures aux séances exposées | Latent : mode C désactivé |

P1 : correction prioritaire avant de se fier à la mesure. P2 : défaut à corriger dans le flux concerné, en distinguant les chemins actifs de ceux à éprouver avant activation.

## Périmètre et mesures

- Copie locale sur `afd70d3`, incluant les correctifs de concurrence du précédent audit encore non poussés.
- Lecture des prompts V1, VF, référence canonique, inventaire, niveau et carte finale ; des quatre gabarits ; des blocs d'étayage ; de l'assemblage, des parseurs et de la publication des résultats.
- Vérification des décisions de `SPEC_Aletheia_Etayage_par_niveau.md`, des résultats historiques de calibration et de leurs arbitrages. Les anciens rapports ont été confrontés au code, pas repris comme des constats actuels.
- Lecture seule de production les **8 septembre à 19 h 59 et 20 h 00, heure de Montréal**. Aucun nom d'élève ni extrait de copie n'est conservé dans ce rapport ou dans la recette.

### Configuration et corpus conservé

- Les six surcharges de prompts et `blocs_gabarits` sont `null` : la configuration utilise les défauts du code déployé.
- `aletheia_etayage_actif = true` ; `mode_c_actif = false`.
- Trois livres actifs, tous de gabarit argumentatif ; leurs références sont `READY`, sans thèse canonique vide ni surcharge de gabarit par séance.
- 46 travaux, **40 retours V1**, **40 retours VF**, **40 lignes de diagnostic**. Ces lignes peuvent porter les deux phases : ce ne sont pas 40 appels IA.
- Aucun inventaire normalisé vide, ni niveau de thèse manquant sans drapeau de non-applicabilité, dans les phases stockées inspectées. Cela ne prouve pas la justesse des niveaux.
- Sur les 40 V1, le volume médian est de **526 mots**, maximum **954**, et **37 dépassent 300 mots**. Mais seuls **deux** portent la structure du nouvel étayage : **287 et 211 mots**. Le corpus historique ne permet donc pas d'affirmer que le budget actuel échoue.
- Les compteurs concernent les travaux conservés en base, sans requalification de leur origine éventuelle de test. Ils ne sont pas un décompte d'élèves distincts.

## AP1 — Une sortie mal formée devient une mesure fausse ou un diagnostic réputé fait

**Sources :** `utils/aletheia-retours.ts:1219` (`lettreNiveau`), `:1256` (inventaire), `:1274` (niveaux), `:1305` (phases manquantes) ; `aletheia_retours_coherents.sql:91` (publication préparée).

Le parseur prend la **première lettre A–E n'importe où dans la chaîne**. Il trouve donc le E de « niveau » avant le B annoncé. Reproductions :

- `"B"` représente bien B, mais **`"niveau B"` devient E** ; cette variante est pourtant citée comme tolérée dans le commentaire du code.
- **`"indisponible"` devient D**, au lieu d'un résultat inexploitable.
- Deux réponses JSON `{}` sont acceptées par `diagnostiquerPhase` : inventaire normalisé vide, niveaux `null`, aucune exception.

La suite considère une phase faite dès que son inventaire existe. La nouvelle RPC protège la version de copie, mais ne rejette pas cet inventaire vide normalisé : ces deux protections répondent à des problèmes différents. Un résultat invalide peut donc être durablement retenu et, s'il produit une lettre, influencer l'adaptation des retours.

**Correction proposée :** schéma obligatoire pour chaque étape ; lecture d'une lettre isolée, avec éventuelles variantes explicitement reconnues ; rejet des valeurs indéterminées plutôt que conversion implicite. Distinguer un inventaire valide constatant une absence de compréhension d'un objet sans champs. Ne publier une phase réussie qu'après validation des deux sorties.

**Validation attendue :** B reste B, « niveau B » devient B ou est explicitement refusé, « indisponible » n'est jamais une note ; `{}` laisse la phase en échec/reprise.

## AP2 — L'absence de mesure se transforme en certitude pédagogique

**Sources :** `utils/aletheia/retour-vf.ts:128`, `:161`, `:177` ; `utils/aletheia-retours.ts:599` ; `utils/aletheia/retour-v1.ts:94`.

Plusieurs replis ont un sens pédagogique qu'une valeur manquante ne justifie pas :

- `lireCouverture([], ids)` marque **toutes les phrases « présentes »**. La comparaison répond ensuite : « Ta version disait déjà tout ce que dit cette synthèse. »
- Même avec une sortie valide, une couverture composée uniquement de **« partiel »** produit cette affirmation de complétude : le comparateur ne cherche que les éléments « absents ».
- Une nuance dont le verdict est inconnu devient **« confirme »**.
- Un ajout avec `ancre: "false"`, ou sans booléen, devient **ancré**.
- Un rappel dont le verdict est inconnu devient **« à côté »** : le défaut de format peut ici déprécier le travail.

Les assertions reproduisent ces cinq comportements. Le précédent correctif empêchant l'ouverture d'une synthèse sans référence n'y suffit pas : `lireCouverture` fabrique lui-même une couverture complète avant le contrôle d'interface.

**Correction proposée :** séparer `non_mesure` des verdicts de compréhension ; exiger des booléens et des énumérations valides ; afficher une formulation neutre ou reprendre la génération quand la mesure manque. Traiter les éléments partiels comme des nuances à compléter, sans les assimiler à une compréhension totale.

## AP3 — L'élève répond à une question, le retour en évalue une autre

**Sources :** `utils/aletheia/gabarits.ts:57` (cycle argumentatif), `:181` (bloc vide) ; `utils/aletheia-retours.ts:327`, `:683`, `:1120`.

Le gabarit argumentatif fait tourner accord, objection, destinataire et exemple. Le serveur retrouve correctement la question figée sur le travail, mais **ni son bloc argumentatif vide ni les troncs V1/VF n'utilisent `{question_tournante}`**. Les troncs continuent à définir `accord` comme une prise de position personnelle.

La sonde remplace « Es-tu d'accord… ? » par « Donne un exemple… » : les deux prompts restent identiques, octet pour octet, en V1 comme en VF. Le modèle n'apprend pas quelle opération a été demandée. Il peut reprocher à un exemple de ne pas justifier un accord que le formulaire n'a jamais sollicité.

**Production :** un travail terminé porte déjà `tournante_cle = exemple`. Cela confirme l'usage du chemin, pas une mauvaise remarque particulière dans son retour.

**Correction proposée :** transmettre dans tous les gabarits le libellé exact et le rôle de la question posée ; adapter les critères au type de réponse. Conserver le comportement historique seulement quand la tournante est effectivement l'accord.

## AP4 — Le diagnostic aphoristique ne reçoit pas toutes ses preuves

**Sources :** `SPEC_Aletheia_Etayage_par_niveau.md:306` ; `utils/aletheia/gabarits.ts:239` ; `utils/aletheia-retours.ts:1245`, `:1260`, `:1295`.

La spécification réserve l'axe 2 au tournant **« quel fil vois-tu… ? »**. Cette réponse est dans `accord`, mais le diagnostic ne lit ni `accord`, ni `accord_vf`, ni le libellé de la tournante. L'élève peut avoir explicité le lien dans le champ prévu : la mesure ne le voit pas. Elle peut inversement noter un lien évoqué ailleurs alors que cet axe devrait rester non applicable pour cette séance.

L'axe 1 perd aussi un repère utile : l'inventaire voit le fragment recopié, mais aucun identifiant de fragment n'est requis dans sa sortie. Le niveau reçoit une reformulation sans le passage original ; même un numéro conservé dans `note` est supprimé de son entrée. Il doit retrouver le fragment à partir de l'interprétation de l'élève, ce qui devient particulièrement fragile lorsque cette interprétation est erronée. La référence ne conserve en outre que cinq à huit fragments importants : elle n'assure pas une correspondance pour tout choix autorisé.

**Correction proposée :** transporter la tournante et sa réponse, un repère du fragment choisi, les éléments attestés et l'applicabilité de chaque axe. Le niveau doit comparer au fragment identifié, sans exiger une restitution des fragments non choisis. Une référence manquante pour ce fragment doit être signalée.

**Portée :** défaut latent, aucun gabarit aphoristique actif dans le relevé de production.

## AP5 — Sans référence, la phase de niveau juge sans étalon

**Sources :** `utils/aletheia-retours.ts:1150`, `:1261`, `:1276`, `:1323`.

Si la référence manque, est en cours de génération ou ne couvre pas la semaine, l'appel de niveau reçoit « référence indisponible — juge depuis l'inventaire seul ». Or :

- il ne voit pas le texte du chapitre ;
- l'inventaire reformule la thèse de l'élève sans fournir la thèse correcte à comparer ;
- le prompt lui impose de déterminer la non-applicabilité depuis la référence ;
- `these_mal_definie` et `note`, produits par l'inventaire, sont retirés de son entrée.

Le contrat de la seconde étape est donc impossible à satisfaire correctement dans ce cas. La sonde confirme qu'elle est néanmoins appelée et qu'un A simulé est accepté sans signal de dégradation.

**Correction proposée :** suspendre le niveau jusqu'à disponibilité d'une référence valide pour les axes concernés ; conserver éventuellement un inventaire explicitement provisoire. Ne pas enregistrer comme mesure normale une auto-évaluation sans étalon.

**Production :** les 40 lignes de diagnostic inspectées ont actuellement leur référence. Le risque reste présent pour une préparation partielle ou une régénération.

## AP6 — Le contexte des synthèses canoniques contient de l'aval (recommandation retirée)

**Sources :** `utils/aletheia-retours.ts:961`, `:1023`, `:1042`, `:1069`, `:747`.

Le retour VF direct borne son contexte aux textes antérieurs/courants et aux titres suivants. Mais la synthèse affichée est ensuite remplacée par celle de la fiche canonique. Cette fiche est générée **par lots de deux semaines** : pour rédiger la synthèse de la première, le modèle reçoit aussi le texte intégral de la deuxième.

L'interdiction de spoiler existe dans le prompt de référence ; elle n'est donc pas absente. En revanche, le commentaire « jamais l'aval » est faux à l'intérieur d'un lot. La protection dépend de l'obéissance du modèle. La sonde confirme qu'une synthèse 1 simulée reprenant le texte 2 est conservée et peut devenir la synthèse montrée à tous les élèves.

**Recommandation initiale, retirée après arbitrage de Louis :** générer le texte destiné à l'élève avec un contexte borné à sa séance et à l'amont admissible. Une extraction prof regroupée peut rester groupée si elle ne sert pas directement de synthèse élève. Ajouter un test de non-divulgation sur la référence, pas seulement sur le retour VF.

**Limite de preuve :** chemin de contamination confirmé ; aucune fréquence de spoiler ni fuite réelle démontrée dans les synthèses de production.

## AP7 — En mode C, « antérieur » n'implique pas « exposé »

**Sources :** `utils/aletheia/exposition-serveur.ts:8` ; `utils/aletheia-retours.ts:500`, `:557`, `:650`.

Le rappel et les identifiants des paires de passages filtrent les séances exposées. Le grand bloc textuel `amont_structure` ne le fait pas : il charge tous les documents ou toutes les fiches de numéro inférieur. Il les présente ensuite comme **déjà lus par l'élève**.

Avec les seules séances 1 et 3 dans une fixture, le contexte de la séance 3 contient le texte 1 sans aucun moyen d'exprimer que cette séance n'a pas été exposée. Le filtrage des identifiants interactifs ne protège pas les remarques textuelles ou les liens libres contre cette information supplémentaire.

**Correction proposée :** appliquer la même liste d'exposition à tout le contexte amont et à ses replis. Séparer explicitement le contexte du professeur de ce que l'élève est censé connaître.

**Portée :** mode C OFF en production ; correction à éprouver avant son activation.

## Appréciation pédagogique et points à conserver

1. **La progression V1 → VF est pertinente.** La V1 ne doit pas donner directement la solution aux deux premiers champs ; la VF peut expliquer et faire comparer. Le vocabulaire, les réponses aux questions et le rappel ont des rôles différents : il ne faut pas uniformiser toutes les bulles en questions socratiques.
2. **Répondre aux questions est une décision explicite**, pas un bug à supprimer. La frontière reste à préciser lorsqu'une question redemande exactement la tâche principale. C'est un cas à inclure dans une prochaine calibration, sans retirer le droit de poser une vraie question (`SPEC`, D11).
3. **L'inventaire avant le niveau limite l'influence de la rédaction.** Il faut préserver cette séparation, tout en lui ajoutant les repères nécessaires. Une reformulation en une seule phrase peut lisser un contresens : des éléments observés et leurs justifications aideraient le professeur à contrôler le diagnostic, sans réintroduire une appréciation du style.
4. **Le barème possède une calibration historique et un biais accepté.** Le dossier `aletheia_calibration/DECISIONS_calibration.md` documente une tendance à surévaluer la thèse et sous-évaluer les arguments d'un cran sur certains cas. Cette décision ne justifie pas une correction automatique de ±1 : elle ne démontre pas que l'écart est constant pour les nouveaux livres et gabarits. Cet audit ne modifie pas l'arbitrage.
5. **Température explicitement fixée à 0** pour les deux étapes du diagnostic et le retour VF ; contrôles de troncature présents dans les appels examinés. Les anciens rapports disant le contraire ne décrivent plus ces lignes de code. Cela ne constitue pas une garantie générale de déterminisme ou de justesse.
6. **La confidentialité est formulée**, et le retour élève sélectionne ses champs au lieu d'exposer tout le JSON prof. Les règles et les écrits sont cependant dans le même message ; l'historique des synthèses est réinjecté sans le même encadrement que la copie courante. Le risque d'instructions parasites reste à éprouver, sans prétendre qu'une nouvelle exploitation a été démontrée ici.
7. **Le capstone est distinct du retour hebdomadaire** : le livre entier convient à une carte finale. Le problème AP6 concerne le texte montré avant la fin de la lecture, pas le principe d'une carte complète à l'issue du livre.

### Deux incohérences secondaires de formulation

- Le bloc V1 peut demander deux relances maximum, puis le tronc demander « 2 à 4 ». Le code plafonne effectivement la sortie pour la forme concernée ; harmoniser les consignes évitera une génération inutile suivie d'une coupe.
- Les paires amont demandent une phrase complète de 25 mots maximum, mais leur exemple JSON dit « ≤ 12 mots » (`utils/aletheia/retour-vf.ts:98`, `:115`). Aligner l'exemple sur la tâche.

## Suite recommandée

1. Corriger AP1–AP3 : validation des résultats, distinction absence/partiel/présent, transmission de la question réellement posée.
2. Traiter AP5–AP6 pour garantir un étalon disponible et un contexte borné ; couvrir AP4/AP7 avant usage des gabarits ou modes concernés.
3. Rejouer une calibration courte par gabarit sur des copies synthétiques ou un corpus explicitement retenu : compréhension juste mal rédigée, contresens bien écrit, absence d'idée, réponse partielle, choix de fragments différents, tournante « fil », référence absente, tentative de faire révéler la référence et information réservée à la séance suivante. Comparer séparément la justesse pédagogique, les niveaux et la conformité de format.
4. Garder un historique de version des prompts et références pour rendre les résultats comparables. Une mise à jour des prompts ne corrige pas rétroactivement les diagnostics existants ; une éventuelle reprise doit être ciblée et décidée sur des cas vérifiés.

## Reproduction et limites

```sh
node scripts/recette/audit-prompts-aletheia-2026-09-08.cjs
```

**Résultat : sept sondes réussies.** Elles vérifient les défauts décrits ; elles ne sont pas des tests attestant le comportement souhaité. Après correction, leurs attentes devront être inversées ou remplacées par des tests de non-régression.

Aucun nouvel appel à un modèle, aucune réévaluation des élèves, aucune mutation de production. L'inspection en base est descriptive : aucune copie réelle n'a été renotée par le professeur dans cet audit, et les textes des retours n'ont pas fait l'objet d'une relecture pédagogique exhaustive. Les risques probabilistes sont identifiés comme tels. **Le push reste en attente.**

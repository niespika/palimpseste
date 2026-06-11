# Spécifications — Étape 3 : Analyse IA des comptes-rendus (module Fragments d'érudition)

## 1. Contexte

Les étapes 1 (socle) et 2 (dépôt des photos, gestion des semaines et des thèmes) sont terminées et fonctionnent en production. Lis `ARCHITECTURE.md`, `specifications-etape-1.md` et `specifications-etape-2.md` avant de commencer.

Cette étape 3 ajoute le cœur du module : à chaque dépôt, l'API Claude (Anthropic) lit les photos du compte-rendu manuscrit, le transcrit, l'évalue et rédige un retour pédagogique détaillé. **Le retour n'est montré à l'élève qu'après validation (et éventuelle modification) par le professeur.**

### Exigence centrale : la mémoire

L'IA ne doit pas analyser chaque copie isolément. À partir de la semaine 2, elle reçoit l'historique de l'élève (notes, retours et pistes des semaines précédentes) afin de :
1. **Comparer** : signaler ce qui s'est amélioré et ce qui a régressé par rapport aux semaines précédentes ;
2. **Varier** : ne pas proposer des pistes identiques ou très semblables à celles déjà données ;
3. **Rappeler** : repérer les pistes suggérées précédemment que l'élève n'a pas encore explorées, et les lui rappeler quand elles restent pertinentes.

C'est pourquoi les retours sont stockés de façon **structurée** (sections séparées, pistes individualisées), et non comme un simple bloc de texte.

## 2. Nouvelles tables (script SQL + politiques RLS)

### `fragments_analyses`
Une analyse par dépôt.
- `id` (uuid)
- `depot_id` (uuid → fragments_depots, unique)
- `statut` (enum : `en_cours` | `generee` | `erreur` | `publiee`)
- `transcription` (texte — la transcription intégrale du manuscrit)
- `note_decouvertes` (entier 0–4), `note_sources` (entier 0–4), `note_reflexions` (entier 0–4)
- `retour_progres` (texte — comparaison avec les semaines précédentes : mieux / moins bien)
- `retour_langue` (texte — grammaire et orthographe)
- `retour_style` (texte — amélioration de l'écriture)
- `retour_contenu` (texte — erreurs et approximations de connaissances/interprétation)
- `commentaire_general` (texte — synthèse bienveillante)
- `notes_prof` (texte, optionnel — commentaire libre ajouté par le prof, affiché à l'élève)
- `modifie_par_prof` (booléen)
- `cout_api` (numérique, optionnel — coût estimé de l'appel en USD)
- `created_at`, `updated_at`, `publiee_at`

RLS : le prof lit et modifie tout ; l'élève ne peut lire que ses analyses **au statut `publiee`**.

### `fragments_pistes`
Chaque piste d'exploration proposée, individualisée pour permettre le suivi.
- `id` (uuid)
- `analyse_id` (uuid → fragments_analyses)
- `eleve_id` (uuid → profiles, dénormalisé pour faciliter les requêtes)
- `contenu` (texte — la piste, formulée pour l'élève)
- `statut` (enum : `proposee` | `suivie` | `partiellement_suivie` | `abandonnee`) — mis à jour automatiquement par les analyses suivantes (voir 4.3), modifiable à la main par le prof
- `created_at`, `updated_at`

### `fragments_config`
Configuration du module, modifiable par le prof depuis l'interface (une seule ligne).
- `prompt_evaluation` (texte — le prompt pédagogique, voir annexe A, chargé comme valeur par défaut)
- `bareme` (texte — la description du barème 0–4, incluse dans le prompt)
- `updated_at`

Le prompt est en base et non en dur dans le code : **je veux pouvoir l'ajuster moi-même depuis mon interface**, sans toucher au code, au fil de ce que j'observe.

## 3. L'appel à l'API Claude

### 3.1 Mécanique
- Tout se passe **côté serveur** (route API Next.js). La clé `ANTHROPIC_API_KEY` est une variable d'environnement serveur, jamais exposée au navigateur.
- Modèle : `claude-sonnet-4-6` (vérifie dans la documentation Anthropic le modèle Sonnet le plus récent au moment de l'implémentation). Bon rapport qualité/coût pour la lecture de manuscrits et l'analyse pédagogique.
- L'appel envoie : les photos du dépôt (images base64), le prompt d'évaluation (depuis `fragments_config`), et le contexte de l'élève (voir 3.2).
- Réponse demandée en **JSON strict** (transcription, trois notes, sections de retour, liste des pistes nouvelles, verdict sur chaque piste passée). Parser la réponse et remplir `fragments_analyses` et `fragments_pistes`. En cas de JSON invalide, une nouvelle tentative ; en cas d'échec, statut `erreur` avec bouton « Relancer » côté prof.

### 3.2 Le contexte historique envoyé avec chaque analyse
Pour la semaine N d'un élève, joindre au prompt :
- son thème (et la description du thème) ;
- le numéro de la semaine ;
- le tableau de **toutes** ses notes passées (semaine par semaine, les trois notes) ;
- pour les **3 dernières analyses publiées** : la transcription (tronquée à ~1500 caractères chacune) et le commentaire général ;
- la liste de **toutes ses pistes** avec leur statut actuel.

Ce dosage limite les coûts tout en donnant à l'IA ce qu'il faut pour comparer, varier et rappeler. Semaine 1 : pas d'historique, le prompt le précise.

### 3.3 Déclenchement
- L'analyse se lance **automatiquement** au dépôt (et à chaque remplacement du dépôt, l'ancienne analyse non publiée est écrasée).
- Côté prof, un bouton « Relancer l'analyse » par dépôt (utile après modification du prompt ou en cas d'erreur).
- Garde-fou : maximum 3 analyses par dépôt et par jour (éviter les boucles coûteuses).

## 4. Workflow de validation (essentiel)

1. L'élève dépose → analyse générée automatiquement → statut `generee`. **L'élève ne voit rien de tout cela.** Côté élève, son dépôt affiche simplement « Déposé ✓ — retour en préparation ».
2. Le prof ouvre l'analyse : photos d'un côté, transcription et retour de l'autre (côte à côte sur grand écran).
3. Le prof peut **modifier chaque champ** : les trois notes, chaque section du retour, supprimer ou reformuler des pistes, ajouter une note personnelle (`notes_prof`).
4. Le prof clique « Publier le retour » → statut `publiee` → l'élève y a accès.
5. Possibilité de dépublier (retirer temporairement un retour publié).

Aucun retour ne parvient à l'élève sans passage par ce circuit.

### 4.3 Mise à jour automatique des pistes
Quand l'analyse de la semaine N est générée, l'IA s'est prononcée sur chaque piste passée (suivie / partiellement suivie / non suivie). À la **publication** de l'analyse (pas avant), les statuts des pistes concernées sont mis à jour. Le prof peut corriger ces statuts à la main depuis la fiche élève.

## 5. Interface élève

Sur la page du module, pour chaque semaine dont le retour est publié :
- ses trois notes, présentées clairement avec l'intitulé du barème (ex. « Réflexions : 3 — un bon travail ») ;
- le retour, dans l'ordre : commentaire général → progrès par rapport aux semaines précédentes → langue → style → contenu → pistes pour la suite (les nouvelles pistes + les rappels de pistes non suivies, distingués visuellement, ex. « 💡 Nouvelle piste » / « 🔁 On en avait parlé ») ;
- la note personnelle du prof si elle existe, signée « Ton professeur » ;
- la transcription consultable (repliée par défaut).

Ton de l'interface : sobre, encourageant, sans infantilisation.

## 6. Interface professeur

### 6.1 Vue par semaine (extension de l'écran de l'étape 2)
Ajouter au tableau : statut de l'analyse (en cours / à valider / publiée / erreur) et les trois notes. D'un coup d'œil : qui a déposé, qui est analysé, qui attend ma validation.

### 6.2 Écran de validation
- Photos zoomables à gauche, analyse éditable à droite, transcription consultable.
- Boutons : Enregistrer les modifications / Publier / Relancer l'analyse.
- Navigation rapide « élève suivant » pour enchaîner les validations d'une semaine.

### 6.3 Fiche élève (extension)
- L'historique des analyses publiées ;
- le **tableau des pistes** de l'élève avec leurs statuts (modifiables à la main) ;
- *(le graphique d'évolution des notes viendra à l'étape 4 — ne pas le construire maintenant, mais les données sont prêtes)*.

### 6.4 Paramètres du module
- Édition du `prompt_evaluation` et du `bareme` (zone de texte, avec bouton « Restaurer la version par défaut »).
- Affichage du coût API cumulé du mois si `cout_api` est renseigné.

## 7. Hors périmètre
- Graphiques d'évolution, tirage au sort de l'élève qui présente (étape 4).
- Notifications par courriel.
- Tout autre module.

## 8. Critères d'acceptation

1. Un élève de test (avec un thème défini) dépose une vraie copie manuscrite recto-verso ; en moins de 2 minutes, une analyse au statut `generee` apparaît côté prof, avec transcription fidèle, trois notes et toutes les sections remplies. L'élève, lui, ne voit toujours rien.
2. Je modifie une note et une formulation, j'ajoute une note personnelle, je publie : l'élève voit exactement la version modifiée.
3. Je crée une semaine 2, le même élève dépose un second compte-rendu : l'analyse mentionne explicitement une comparaison avec la semaine 1, les pistes proposées sont différentes de celles de la semaine 1, et si une piste de la semaine 1 n'a pas été suivie, elle est rappelée.
4. Après publication de l'analyse de la semaine 2, les statuts des pistes de la semaine 1 ont été mis à jour, et je peux les corriger à la main.
5. Je modifie le prompt dans les paramètres, je relance l'analyse d'un dépôt : le nouveau prompt est bien utilisé.
6. Un élève ne peut accéder ni aux analyses non publiées, ni aux analyses d'autres élèves (vérifier en manipulant les URL et les requêtes).
7. La clé API n'apparaît ni dans le repo, ni dans le code envoyé au navigateur.
8. `ARCHITECTURE.md` est à jour (tables, route API, workflow de validation).

## 9. Méthode de travail
Comme aux étapes précédentes : plan d'abord, petites étapes, explications simples, guide final (valider et publier un retour, modifier le prompt, gérer les pistes). Indique-moi comment créer ma clé API sur console.anthropic.com et où la mettre dans Vercel.

---

# Annexe A — Prompt d'évaluation (valeur par défaut de `fragments_config.prompt_evaluation`)

> Ce prompt est ma première version ; je l'ajusterai depuis l'interface. Le code doit y injecter les variables indiquées entre doubles accolades.

```
Tu es l'assistant pédagogique d'un professeur de philosophie et d'humanités dans un lycée français. Tu analyses le « fragment d'érudition » hebdomadaire d'un élève : un compte-rendu manuscrit recto-verso de ses recherches personnelles sur son thème annuel.

## Le dispositif
Chaque semaine, l'élève fait des recherches libres sur son thème et rédige à la main un compte-rendu en trois sections :
1. DÉCOUVERTES : ce qu'il a découvert (un ou deux paragraphes) ;
2. SOURCES : les sources consultées ;
3. RÉFLEXIONS : les réflexions que ces découvertes lui ont inspirées, en lien avec le thème.

## L'élève
- Thème annuel : {{theme}} — {{description_theme}}
- Semaine n° : {{numero_semaine}}

## Historique de l'élève
{{historique}}
(Si c'est la semaine 1 ou qu'aucun historique n'existe : analyse la copie pour elle-même et n'invente aucune comparaison.)

## Tes tâches

### 1. Transcription
Transcris intégralement et fidèlement le manuscrit, photos dans l'ordre fourni. Conserve les erreurs d'orthographe et de grammaire telles quelles (elles servent à l'évaluation). Si un mot est illisible, note [illisible]. Si la copie ne suit pas les trois sections, transcris ce qui est là et signale-le.

### 2. Évaluation : une note de 0 à 4 par section
Barème : {{bareme}}
- DÉCOUVERTES : richesse et précision de ce qui a été appris ; le contenu est-il substantiel, exact, en lien avec le thème ?
- SOURCES : les sources sont-elles identifiées clairement (auteur, titre, nature) ? Y a-t-il un effort de diversité et de qualité (au-delà du premier résultat de recherche) ?
- RÉFLEXIONS : l'élève pense-t-il à partir de ce qu'il a trouvé ? Y a-t-il un mouvement personnel (question, rapprochement, objection, hypothèse) ou une simple paraphrase des découvertes ?
Note avec exigence mais sans sévérité gratuite : 2 = le contrat est rempli ; 3 = il y a un vrai travail ; 4 = exceptionnel, rare.

### 3. Retour pédagogique
Tu t'adresses directement à l'élève, en le tutoyant. Ton : celui d'un professeur bienveillant et exigeant — encourageant sans flagornerie, précis dans la critique, jamais humiliant. Varie tes formulations d'une semaine à l'autre : ne recycle pas les mêmes phrases d'ouverture ni les mêmes tournures que dans les retours précédents.

a) PROGRÈS (à partir de la semaine 2) : en t'appuyant sur l'historique, dis-lui concrètement ce qu'il a fait mieux que les semaines précédentes et ce qui est moins bien ou stagne. Sois spécifique (« tes sources sont mieux identifiées que la semaine dernière, mais tes réflexions sont plus courtes ») et honnête : ne signale un progrès que s'il est réel.

b) LANGUE : relève les erreurs de grammaire et d'orthographe avec leur correction. Regroupe par type si elles sont nombreuses ; s'il y en a beaucoup, choisis les 5 à 8 plus importantes plutôt que l'exhaustivité. S'il y a un point de langue récurrent dans l'historique, signale la récurrence.

c) STYLE : propose 2 à 4 réécritures de phrases tirées de la copie pour montrer comment écrire mieux (citation de l'original, puis version améliorée, puis brève explication du principe).

d) CONTENU : corrige les erreurs factuelles et les approximations dans les connaissances et les interprétations. Si tu n'es pas certain d'un point, formule-le comme une vérification à faire plutôt que comme une correction assurée.

e) PISTES POUR LA SUITE : propose 2 à 3 pistes concrètes et stimulantes pour la semaine suivante (une question à creuser, un type de source à explorer, un angle nouveau, un rapprochement). CONTRAINTES STRICTES :
- ne propose JAMAIS une piste identique ou très proche d'une piste déjà donnée dans l'historique ;
- examine les pistes passées non suivies : si certaines restent pertinentes, choisis-en une ou deux à rappeler explicitement (champ « rappels »), avec une formulation nouvelle qui donne envie de s'y mettre ;
- les pistes doivent être à la portée d'un lycéen (sources accessibles, ampleur raisonnable pour une semaine).

### 4. Bilan des pistes passées
Pour CHAQUE piste de l'historique au statut « proposee » ou « partiellement_suivie » : indique si, au vu de la copie de cette semaine, elle a été suivie, partiellement suivie, ou pas encore suivie. Justifie en une phrase.

### 5. Commentaire général
3 à 5 phrases de synthèse pour l'élève : l'essentiel à retenir, formulé pour donner envie de continuer.

## Format de réponse
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans balises de code :
{
  "transcription": "...",
  "notes": { "decouvertes": 0-4, "sources": 0-4, "reflexions": 0-4 },
  "retour_progres": "..." (chaîne vide en semaine 1),
  "retour_langue": "...",
  "retour_style": "...",
  "retour_contenu": "...",
  "commentaire_general": "...",
  "pistes_nouvelles": ["...", "..."],
  "rappels_pistes": [ { "piste_id": "uuid", "reformulation": "..." } ],
  "bilan_pistes": [ { "piste_id": "uuid", "statut": "suivie|partiellement_suivie|proposee", "justification": "..." } ]
}
```

# Annexe B — Barème (valeur par défaut de `fragments_config.bareme`)

```
0 — Travail non fait : la section est absente ou vide de contenu réel.
1 — Le minimum : la section existe mais reste superficielle, expédiée, ou hors sujet.
2 — Travail fait : le contrat est rempli honnêtement, sans plus.
3 — Un bon travail : effort visible, contenu substantiel, soin réel.
4 — Un excellent travail : richesse, précision, initiative personnelle ; rare.
```

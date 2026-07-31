# PROMPT — Mise à jour de la SPEC C3 après la révision du routeur (30/07)

> **Usage** : session sur le repo `palimpseste`, travaillant sur `SPEC_C3_exercices_competences.md`.
> Objet : appliquer **en un bloc** les amendements issus de la révision intégrale du
> `01-routeur.md` (30 juillet 2026, quatorze passes, document validé par Louis). C'est la
> **passe C3 unique** décidée par Louis le 30/07 — rien n'a été écrit dans C3 pendant la révision,
> tout est ici.
>
> **Source de vérité en cas de doute** : le journal de `palimpseste-conception/CONTEXTE.md`
> (les entrées du 30/07, une par passe — le récapitulatif consolidé est dans l'entrée « passe §5 »,
> complété aux passes suivantes) et le `01-routeur.md` validé. Si ce prompt et le journal
> divergent, **le journal fait foi**. Si le dossier `palimpseste-conception` n'est pas accessible
> depuis cette session, ce prompt est autoportant.

---

## Ta première action

Lire, dans cet ordre :

1. `SPEC_C3_exercices_competences.md` — **le Tableau de bord du socle** (état actuel : v4.2, amendements A1-A8), puis §0, §4, §6 ;
2. si accessible : `palimpseste-conception/01-routeur.md` (le document validé — c'est lui que ces amendements reflètent) et le journal du `CONTEXTE.md` au 30/07.

## Les règles

- **Régimes d'amendement** (tableau de bord, section A) : (a) correction d'une contradiction — immédiate ; (b) périmètre — inscrit même non tranché. Chaque amendement ci-dessous porte son régime proposé.
- **Version** : la spec passe de **v4.2 à v4.3** (règle d'A7 : toute série d'amendements incrémente le numéro mineur, pour que le contrôle de manifeste soit mécanique). Mettre à jour l'en-tête.
- **Une ligne datée par amendement** au journal du tableau de bord, origine : « Révision du `01-routeur.md`, 30/07 ». Numérotation continue (A9, A10, …) — regroupe autrement si c'est plus lisible, mais chaque changement a sa ligne.
- **Ne rien trancher.** Les ouvertures B1-1 (le cœur R1-R6 n'appartient à aucun lot), B1-3 (construction de la semaine), B1-4 (« pousser où ça progresse ») et B1-5 (ciblage lecture) **restent ouvertes** — deux sessions dédiées sont actées pour B1-3 et B1-5. En cas de doute ou de décision non couverte ici : noter la question et s'arrêter.
- **Ne pas réécrire les prompts de lot** (`PROMPT_Code_C4_L1.md`, `PROMPT_Code_C4_L2.md`). Ils exigent la v4, la spec passe v4.3 : ils restent arrêtés d'eux-mêmes. Mettre seulement à jour la note « Conséquence de manifeste » : B1-7 étant fermée (A8) et le routeur validé, **plus rien n'attend** — leur réécriture peut être lancée par Louis quand il veut.

---

## Les amendements à appliquer

### A9 — Renommages de schéma *(régime a — AVANT la migration C4-L1, tant qu'ils sont gratuits)*

- **`duree_cycle_min` → `duree_exercice_min`** : au §5 (bloc « Durées — deux champs au lieu d'un ») et au §6 (table `exercices_types`).
- **`regime_cycle` → `regime_v1vf`** : au §6 (table `exercices_types`).
- *Raison commune : « cycle » désigne désormais la **semaine de travail** (01-routeur §1, acté 30/07) ; un cycle contient plusieurs exercices. Les anciens noms se lisaient à contre-sens — une durée « de cycle » par exercice, un régime « de cycle » qui est en réalité le régime v1→vf du type.*

### A10 — Le vocabulaire « cycle » dans le corps de C3 *(régime a)*

- §0, lexique : « **Coût par cycle** : … soit **2N + 4** » → coût **par exercice** (les deux appels chauds sont le retour de v1 et le retour final d'**un** exercice).
- §4, budgets : « en **temps de cycle** » → « en **temps d'exercice, cumulé par semaine** » (le budget reste hebdomadaire ; ce qui se somme, ce sont des durées d'exercices).
- **Vérification mécanique** : chercher toute autre occurrence de « cycle » au sens « séquence v1→vf d'un exercice » et la requalifier. Attention : « cycle à six temps » (§3) désigne le déroulé d'un exercice — à requalifier en conséquence ou à laisser avec une note, selon le contexte de la phrase ; ne pas corriger aveuglément.

### A11 — La règle de la mesure secondaire *(régime a)*

Au §6, bloc `exercices_types` : la phrase « la compétence mesurée en secondaire **n'est jamais celle qu'on travaille dans le cycle de la semaine** » reposait sur une prémisse fausse (une seule compétence travaillée par semaine — or on en travaille plusieurs, Louis 30/07). Réécrire en trois étages (source : 01-routeur §1.4) :

1. **contrainte dure** : la secondaire d'un exercice n'est jamais **la cible de cet exercice** ;
2. **préférence, non interdiction** : on sonde de préférence ce qu'on n'entraîne pas dans le cycle ;
3. **motifs légitimes de sondage** : une compétence qui semble stagner (vérifier), une compétence au niveau cible atteint (vérifier que ça tient).

Et le renvoi « *la règle d'espacement elle-même appartient au routeur et reste à écrire* » devient : « **écrite le 30/07 — `01-routeur.md` §6** » (pool des candidates, priorités, une sonde par compétence par cycle au moment optimal, plafond de sondes).

### A12 — La cadence 2-1 est supprimée *(régime b, tranché par Louis le 30/07 — s'applique au corps)*

Le partage écriture/lecture n'est plus une rotation calendaire : il est **probabiliste, par élève** (fonction de l'élève, de son travail, de son progrès). Le nombre de cycles de l'année est une **dérivée du Calendrier** (semaines de cours − 2). **Vérification mécanique** : chercher toutes les occurrences de « 2-1 » dans C3 et les corriger.

### A13 — L'année d'exercices s'arrête début mai *(régime a)*

L'année scolaire se termine le **20 mai** pour les premières et terminales ; plus d'exercices après le **10 mai** (Louis, 30/07). Conséquences :

- la **note d'étalonnage** du §4 : « le diagnostique de septembre contre une passation du même format **en juin** » → **début mai** ;
- vérifier le **chiffrage annuel** (§10, risques/coûts) s'il suppose ~34 semaines — l'ordre de grandeur est désormais ~28 cycles.

### A14 — A5 est TRANCHÉ : R6 réécrite, le drapeau « transfert » passe au GENRE *(régime a — ferme B2-14)*

Décision de Louis du 30/07 (01-routeur §5) : la fonction « cibles primaires TC et HLP disjointes la même semaine » est **dissoute** (flux unique, profil unique, budget unique) ; le drapeau « transfert » compare désormais les mesures d'une même compétence **par genre d'exercice**, non par parcours. Dans C3 :

- **ajouter un champ `genre` nullable** à `exercices_types` (§6) — valeurs : `dissertation`, `explication_texte` (genres du tronc commun), `question_interpretation`, `essai` (genres de HLP) ; les types génériques n'en ont pas ;
- **l'ordre d'attribution du parcours d'une mesure** : la classe (passation en classe, lecture du livre) → le genre du type → `indetermine` ;
- mettre à jour le commentaire de `competences_mesures` (§6) qui décrit le drapeau R6 via le `classe_id` des diagnostiques ;
- **fermer B2-14** au tableau de bord : « A5 tranché le 30/07 — R6 réécrite en règle d'observation (drapeau par genre), voir 01-routeur §5 ».

### A15 — B1-2 se referme : la règle d'espacement existe *(régime a)*

Mettre à jour la ligne **B1-2** du tableau de bord : la règle d'espacement des mesures secondaires est **écrite** (01-routeur §6). Le calcul de N est donc spécifiable ; le chiffrage réel des appels dépend encore du **plafond de sondes par cycle** (paramètre provisoire, 01-routeur §11).

### A16 — Statut de relecture du routeur *(régime a — c'est lui que la règle de manifeste interroge)*

Tableau de statut du §0 : `01-routeur.md` → « **relu intégralement par Louis le 30/07** — quatorze passes (§1-§13 + annexe B), révision close ». Mettre à jour **B1-6** en conséquence : les lots dont le manifeste exige le routeur ne sont plus bloqués par *son* statut (restent les autres documents en relecture : `02-`, `03-`, `04-`).

### A17 — B4 renvoie au §11 du routeur *(régime a — pas de double copie)*

Le §11 du 01-routeur est désormais le **registre faisant foi des paramètres du routeur** (décision de Louis, 30/07 ; valeurs importées de B4 ce jour-là). Dans **B4** : remplacer les lignes « Budgets élève », « Plancher de mesure », « Fenêtre de montée temporelle », « Cadence d'ancre », « Quota bonus » par **un renvoi** vers `01-routeur.md` §11. B4 garde les paramètres de la plateforme hors routeur (critère de recette, `confiance_ocr`, contrat de latence, seuil « semaine faite », seuil des contestations, corpus de textes, échelle du Monitoring).

### A18 — L'ouverture n°19 (B3) se referme *(régime a)*

« Distinction visuelle Calame / Aletheia » : résolue par la décision de navigation du 30/07 (01-routeur §2) — le cycle vit sur **une page unique** dont **seul l'en-tête change** (module, couleur, voix de l'IA) ; la famille est un **attribut visuel, jamais un lieu**. Fermer la ligne avec ce renvoi.

### A19 — Diagnostics : vérifications de cohérence *(régime a si contradiction trouvée, sinon rien)*

- Le format de la semaine 1 est **« essai + explication de texte »** (Louis, 30/07) — c'est déjà ce que disent §1.4 (A7) et §3 : **vérifier**, ne corriger que si une phrase dit autre chose.
- Les formats de **décembre et février/mars** sont passés **[à valider]** (l'ancienne « progression de grain des diagnostics » supposait un septembre micro) : vérifier que rien dans C3 ne cite cette progression micro→méso→macro ; si C3 doit porter ce point ouvert, l'inscrire en **B3** (texte non spécifié volontairement).
- Le seuil d'entrée du Questionnement est passé d'**[à valider] à acté** (principe ; chiffre provisoire) — vérifier si C3 le cite et mettre le statut à jour.

---

## Fin de session (obligatoire)

1. **Vérifications mécaniques** avant de clore : `grep` sur « duree_cycle_min », « regime_cycle », « 2-1 », « en juin », « provenance » — zéro occurrence non voulue.
2. Mettre à jour l'**en-tête** de C3 (statut : v4.3, amendements A1-A19) et le **résumé** s'il cite des points modifiés.
3. **Journaliser au `CONTEXTE.md`** de `palimpseste-conception` (si accessible ; sinon, produire l'entrée de journal en fin de réponse pour que Louis la colle) : une entrée datée, la liste des amendements appliqués, et la ligne obligatoire — « **impact C3 : amendements A9-A19 appliqués, spec en v4.3** ».
4. Signaler explicitement à Louis : **les prompts C4-L1 et C4-L2 sont réécrivables** (B1-7 fermée par A8, routeur validé, schéma stabilisé par A9/A14) — c'est à lui de lancer ce chantier.

## Interdits

- Ne rien trancher à la place de Louis — B1-1, B1-3, B1-4, B1-5 et les décisions différées de B2 restent ouvertes.
- Ne pas modifier `00-referentiel.md` ni `01-routeur.md` (validés) ni `02-`/`03-`/`04-` (en relecture).
- Ne pas réécrire les prompts de lot dans cette session.
- Ne pas régénérer C3 en entier : **insertions et remplacements ciblés uniquement**, relire chaque zone avant de l'écrire.

# PLAN_CHANTIERS_RENTREE — tout doit être prêt le mardi 25 août 2026

> **Contrainte cadre :** après le 25 août, plus de développement — uniquement les bugs révélés par le
> live-test avec ~70 élèves. Donc tout ce qui compte doit être **mergé, recetté et activable** avant.
> Ce document est la source de vérité : ordre, périmètre, lignes de coupe, répartition des modèles.
> Chaque session Claude Code démarre en lisant la section du chantier concerné, rien de plus.
>
> *Écrit le 22/07 ; recalé le 23/07 : semaines alignées sur les cycles de crédits (jeudi → mercredi),
> liste de la revue prof-élève intégrée (voir `LISTE_revue_prof_eleve.md`), répartition Fable/standard.*

---

## 0. Le cadre — crédits, pas jours-homme

Le mode de travail : **tu promptes, Code implémente, tu testes en utilisateur.** Il n'y a pas de
« révision de code » humaine. Les limites réelles sont donc :

1. **5 cycles de crédits** (jeudi → mercredi) d'ici la rentrée — c'est le quota hebdo qui rythme, pas
   les journées. Un cycle cramé le lundi = deux jours de tâches manuelles (recette, données, checklist).
2. **Fable plafonné à ~50 % du bilan hebdo** → la finesse se rationne (voir §5).
3. **Tes heures de test utilisateur** — incompressibles et séquentielles : c'est toi qui vérifies
   chaque lot, et la recette finale ne se délègue pas.

Les estimations en **j-éq** (jour-équivalent) ci-dessous sont des **poids relatifs** — grosso modo
« une demi-journée à une journée de sessions Code + ton test derrière ». Elles servent à répartir les
chantiers sur les semaines et à hiérarchiser les coupes, **pas à chronométrer**. Si une semaine finit
en avance : on tire le chantier suivant, on n'invente rien de neuf.

- **Charge totale : ~38 j-éq** (les gros morceaux de ta revue prof-élève sont intégrés).
- Ce qui fait tenir le plan : **les lignes de coupe pré-décidées** (~7-9 j-éq récupérables, colonne
  « Coupe » de chaque chantier) + **deux gels** :
  - **Gel des specs : mercredi 29 juillet** (fin du cycle 1). Ensuite, toute idée → `IDEES_post_rentree.md`.
  - **Gel des features : mercredi 19 août au soir** (fin du cycle 4). Ensuite : prod, données, recette, bugs.
- **La règle :** en retard sur un chantier → on active sa coupe, on ne glisse pas. La coupe se décide
  au **check-in du mercredi soir** (fin de cycle), jamais en panique en milieu de semaine.

---

## 1. Règles anti-étalement

- **R1 — Un seul gros chantier neuf.** Exercices d'écriture (Codex), de lecture (Aletheia) et
  compétences = **UN moteur + UN référentiel**, instanciés deux fois. Une spec (C3), un schéma.
- **R2 — Tout le neuf naît gaté** (`exercices_actif`, comme `rag_actif`) : mergeable tôt, activable à
  la rentrée sans redéploiement. Le flip est une décision de recette.
- **R3 — Réutiliser l'existant, toujours.** Lignes `a_concevoir` du plan d'évaluation, pipeline
  photo/OCR Codex, rubrique E-A Fragments, patron modèle→instance, grille d'instance RAG.
- **R4 — Une session Code = un lot d'un chantier.** Contexte : ce plan + la spec du lot. `/clear` entre
  les lots. Pas deux chantiers dans une session.
- **R5 — Pas de re-audit global.** L'AUDIT du 2 juillet reste la référence. Durcissement multi-agents :
  deux fois dans le mois (spec C3, recette C13).
- **R6 — Discipline SQL.** `SUIVI_SQL.md` : chaque migration = une ligne (fichier, date sandbox, date
  prod). Sandbox d'abord, prod ensuite, noté immédiatement. 30 s qui éliminent le risque n°1 de l'audit.
- **R7 — Les décisions se prennent ici ou dans une spec, jamais en cours de session Code.** Une question
  surgit en codant → on note, on tranche au check-in, on reprend.
- **R8 — Le principe d'interface (issu de ta revue) : un module = 2-3 onglets.**
  Prof — Fragments : Semaine · Suivi · Évaluations · Paramètres / Quazian : Flashcards · Quiz ·
  Paramètres / Codex : Exercices · Synthèse · Paramètres / Aletheia : Exercices · Livres · Paramètres /
  Scriptorium : Classes · Parcours · Ressources · Paramètres.
  Élève — Fragments : Écrit · Oral · Essai / Quazian : Flashcards · Quiz / Codex : Exercices · Synthèse /
  Aletheia : Exercices · Livres / Scriptorium : Plan de cours · Discussion.

---

## 2. Calendrier — 5 cycles de crédits (jeudi → mercredi)

| Cycle | Dates | Chantiers | Jalon de fin de cycle (mercredi soir) |
|---|---|---|---|
| **S1** | jeu 23 → mer 29/07 | C0 hygiène · C1 robustesse · C11a coûts API · **C3 spec exercices+compétences** · C2 RAG (début) | Sécurité/robustesse mergées ; coûts fiables ; **spec C3 gelée** — *gel des specs* |
| **S2** | jeu 30/07 → mer 05/08 | C2 RAG (fin, incl. Plan de cours/Discussion élève) · C4 moteur + écriture (début) | RAG calibré, écran élève 2 onglets ; schéma + conception prof des exercices OK |
| **S3** | jeu 06 → mer 12/08 | C4 (fin, incl. revue Synthèse) · C5 lecture · C6 compétences (début) | Un exercice d'**écriture** et un de **lecture** bout en bout, niveaux écrits (gaté) |
| **S4** | jeu 13 → mer 19/08 | C6 (fin) · C7 Quazian · C8 Fragments · C10a UI élève · C11b prod (mar-mer) · *(C9 si crédits)* | Matrice + retour élève vivants ; Fragments réorganisé ; prod montée — **gel des features mer 19/08** |
| **S5** | jeu 20 → lun 24/08 | C12 données de rentrée · C10b UI prof · **C13 recette générale** | Recette 4 personas passée ; smoke prod vert ; checklist jour J verte |
| 🎒 | **mar 25/08** | **Rentrée** | |

Poids par cycle : S1 ≈ 6¾ · S2 ≈ 6 · S3 ≈ 6½ · **S4 ≈ 10¾ (+2 si C9) — surcharge franche** · S5 ≈ 6 en 5 jours.
**S4 ne passera pas entière, c'est prévu :** l'arbitrage du **mercredi 12/08** décide ce qui glisse
(C9 → recette ou post-rentrée ; moitié design de C7/C8 → C10b ou post-rentrée). S5 démarre avec un
**cycle de crédits frais** — c'est voulu : la recette génère des bugs, il faut du quota pour les corriger.

---

## 2 bis. Check-in de fin de cycle S1 — *rattrapé le jeu 30/07 (le mercredi soir a été manqué)*

**Jalon S1 atteint sur les quatre chantiers.** « Sécurité/robustesse mergées ; coûts fiables ;
spec C3 gelée » : les trois sont soldés, et C2 a même pris de l'avance sur S2.

| Chantier | État réel au 30/07 | Preuve |
|---|---|---|
| **C0** hygiène & suivi SQL | fait | `9d02454` |
| **C1** robustesse & sécurité | **fait le 24/07, mergé le 25/07** | `a686f61` · `fba3c11` · `c205e7b` → `e801647` |
| **C2** RAG + écran élève | **fait, y compris la part S2** — L6, L8, L8-bis, L9 | `e8792ab` · `54235b1` · `9bb372d` · `b8facf1` |
| **C11a** coûts API | **fait le 25/07**, recette 1-5 validée | `8d96c85` · `25e1884` · `7404cf7` |
| **C3** spec exercices+compétences | **GELÉE le 29/07** — v4.3, amendements A1 à A19 | `SPEC_C3_exercices_competences.md` |

**Consommation de crédits — c'est le point dur du check-in.** Le cycle S2 (jeu 30/07 → mer 05/08) a
brûlé **42 % du bilan tous modèles et 31 % du bilan Fable en une seule journée, la première sur sept**.
Au même rythme, le cycle est sec dimanche. Le 30/07 a porté quatre séances lourdes — révision intégrale
du routeur, arbitrage des revues adversariales, audit + banc de Structure, constitution de la v1.7
d'Expression : c'est un pic, pas un régime. **Coupe proposée pour la suite de S2 [à valider]** : une
seule séance 🎻 par jour ; les bancs en Haiku sauf contre-épreuve explicite ; les sessions ⚙️ de code
lancées directement dans Claude Code, sans passer par une séance de conception préalable.

**Le chemin critique de S2 n'est pas le code, c'est `02-exercices.md`.** Le jalon de mercredi prochain
demande « schéma + conception prof des exercices OK », or C4 ne peut pas démarrer avant que C3 passe
en v4.4, qui attend la révision de `02-exercices.md` — règle de manifeste : un lot dont le manifeste
exige un document « en relecture » s'arrête de lui-même, et **C4-L1 crée `exercices_types`**, dont les
colonnes sortent de ce document. Séquence d'août arrêtée le 31/07 : *(1)* branche d'échec du pipeline
(question F4) → *(2)* révision de `02-exercices.md` → *(3)* séance unique « construction de la semaine
+ ciblage lecture » → *(4)* matrice normative par statut de recette → *(5)* gel de C3 en un bloc →
*(6)* réécriture de `PROMPT_Code_C4_L1.md` et `C4_L2` + création du lot R1-R6. En parallèle et
indépendamment : **les bancs, seule échéance dure, tournés le 24/08 au soir**.

**Amendements C3 en attente — liste de référence unique** : `AMENDEMENTS_C3_en_attente_2026-07-31.md`,
vingt-sept amendements consolidés depuis trois sources qui ne se connaissaient pas, dont **six que le
résumé du relevé d'arbitrage laissait tomber**. C'est de cette liste, et non du résumé, que part la
passe C3.

---

## 3. Les chantiers

*(Modèle indiqué par chantier : 🎻 = Fable (finesse) · ⚙️ = standard (exécution). Voir §5.)*

### C0 — Hygiène & suivi SQL *(S1 · 0,5 j-éq · ⚙️)*
`SUIVI_SQL.md` (état constaté — la base sandbox fait foi, on ne rejoue rien) ; commiter les fichiers
précieux non suivis (seed_prod, RUNBOOK, specs, calibration) ; purger les branches mergées ; ne PAS
rejouer `review_fixes_2026-06-21.sql` ni `codex_schema.sql §5` (régressions documentées).
**Fait quand :** journal en vigueur, repo propre. **Coupe :** aucune.

### C1 — Robustesse & sécurité élève *(S1 · 2,5 j-éq · 🎻 conception / ⚙️ exécution)*
**✅ TERMINÉ le 24/07.** Session A close le 23/07 (RLS élève + gardes — code sur `main` `a686f61`, SQL
sandbox ☑) ; Sessions B (B1-B4, parcours élève fail-visible) et C (items 7-8 : redirect sûr, fiche
canonique continue, V1 nourri par la fiche) closes le 24/07 — commits `fba3c11` et `c205e7b` sur
`feat/c2-l8-calibration`, **mergée vers `main` le 25/07** (`e801647`, qui embarque aussi le banc L8 de C2).
Item 8 tenu dans S1 : coupe non activée. Tests humains soldés → `SUIVI_tests_manuels.md` ; les casses
découvertes en testant (Quazian, semaines Fragments) sont consignées en ⚠️ dans C7/C8 ci-dessous.
Correctifs ciblés des 🔴 de l'audit — pas de refonte : (1) RLS « FOR ALL » élève → policies granulaires
+ gardes serveur (notes de quiz, validation Codex, machine à états Aletheia) ; (2) garde de classe sur
le quiz individuel ; (3) gate « retours non lus » aligné sur l'accès réel ; (4) soumissions V1/VF
fail-visible (message + texte préservé) ; (5) feedback re-soumission « petit malin » ; (6) 404 élève
multi-classes sur le gate Aletheia ; (7) open redirect `/auth/confirm` + vérif inscription ;
(8) prompts 🔴 : fiche canonique sur livre entier, retour V1 nourri de la fiche.
**Fait quand :** un élève-test ne casse plus rien via l'API ; un échec de soumission se voit.
**Coupe :** item 8 → S2. *(La conception des correctifs RLS se fait en Fable — c'est de la sécurité ;
la pose des policies est du standard.)*

### C2 — Scriptorium : finir le RAG + écran élève *(S1-S2 · 3 j-éq · ⚙️, calibration 🎻)*
**✅ TERMINÉ le 26/07, part S2 comprise.** L6 écran élève (Plan de cours + Discussion épistolaire,
sous-onglets, densité) mergé le 25/07 — `49cbfa5`, `e8792ab`, `0ec7930`, `e773ce1`, `7fa1cd0`,
merge `9bb372d`. L8 banc anti-spoiler + L8-bis affinage : `2e1d6c8`, `54235b1`, clos au verdict du
25/07 (`2159179`), merge `e801647`. L9 prompt du tuteur éditable par sections : `f357d68`, migration
sandbox jouée (`4ad5311`), merge `b8facf1`. `rag_actif` reste **OFF** — le flip se décide en C13.
Coupe « vue Année » non activée. Tests humains → `SUIVI_tests_manuels.md`.
**L6 selon ta revue** : côté élève, 2 onglets **Plan de cours · Discussion** — Plan de cours en 2 vues
(Année = les parcours ; Parcours = textes/livres, les livres renvoyant vers Aletheia), statuts
vu/en cours/à venir ; Discussion au design « échange épistolaire » + bandeau de transparence.
**L8** : banc de calibration anti-spoiler (fixtures + scénarios adversariaux) + un run complet +
correctifs — **l'analyse des fuites se fait en Fable**, c'est le cœur pédagogique.
**L9 (ajout du 25/07, demande Louis)** : le prompt du tuteur de Discussion devient **visible et
éditable par sections** dans Scriptorium → Paramètres — éditables : ton, relances (dont les questions
de fin de message), longueur ; **verrouillées** : les sections anti-spoiler que le banc L8 valide.
Défaut dans le code (patron des prompts Fragments, spec Lot 5 §5.6) ; après toute édition, bandeau
« recommandé : rejouer le banc L8 ».
**Fait quand :** run L8 sans fuite de sentinelle ; l'écran élève tient sur mobile ; `rag_actif` reste
OFF — flip décidé en C13. **Coupe :** vue « Année » (v1 = vue Parcours seule) ; flip OFF à la rentrée
n'est pas un échec ; L9 dégrade en « prompt visible, non éditable » si S2 déborde. *(Les « notes » dans
l'espace de droite → post-rentrée.)*

### C3 — SPEC unique « Exercices & Compétences » *(S1 · 1,5 j-éq · 🎻 pur — gel mer 29/07)*
**✅ GELÉE le 29/07 — `SPEC_C3_exercices_competences.md`, v4.3, amendements A1 à A19.** Séance
d'arbitrage intégrale (trois revues adversariales fusionnées, Louis a validé les items un par un —
`RELEVE_Arbitrage_C3_2026-07-29.md`), puis passe unique d'application A9-A19 le 30/07 après la
révision complète du `01-routeur.md`. Le gel ne fige pas la spec : il déplace la charge de la preuve,
et **toute évolution est un amendement daté**, posé en un bloc et jamais au fil des relectures.
⚠️ **v4.4 en attente** : vingt-sept amendements consolidés dans `AMENDEMENTS_C3_en_attente_2026-07-31.md`,
dont un daté « avant que le lot C4-L1 crée les tables » (forme de `lucidite_incompris`). La passe est
**bloquée derrière la révision de `02-exercices.md`** — voir le check-in du § 2 bis.
Le seul gros morceau neuf. À trancher : (1) référentiel E-A — ~4-6 compétences d'écriture, ~4-6 de
lecture, harmonisées avec les axes Fragments ; (2) formats v1 verrouillés — écriture formative maison
(texte tapé), écriture diagnostique classe (manuscrit + pipeline Codex), lecture = extrait + 2-4
questions rédigées courtes ; (3) schéma (`exercices`, `exercices_depots`, `exercices_retours`,
`competences_niveaux` + FK dans `scriptorium_exercices_planifies`) ; (4) boucle plan → module
(`a_concevoir` → Concevoir → `concu` → calendrier élève) ; (5) retour élève en lettres, formulation
positive, « quoi travailler » ; (6) « en faire plus » v1 ; (7) anti-triche T2 pour les diagnostiques ;
(8) gate `exercices_actif`. **Prompts IA des retours = Fable, ici, dans la spec** — c'est là que la
qualité pédagogique se joue. Une passe de durcissement adversarial (la seule).
**Fait quand :** décisions tranchées, lots découpés, prompts de session prêts.
**Coupe :** aucune — c'est elle qui définit les coupes de C4/C5/C6.

### C4 — Moteur d'exercices + écriture (Codex) + revue Synthèse *(S2-S3 · 5,5 j-éq · ⚙️, prompts 🎻)*
Dans l'ordre : L1 schéma → L2 conception prof (depuis les lignes `a_concevoir` du plan + manuel) →
L3 élève formatif maison (rédaction, retour ancré Scriptorium, validation « lu ») → L4 élève
diagnostique classe (pipeline manuscrit) → L5 écriture des niveaux + coût API → L6 **onglets Codex
« Exercices · Synthèse » (prof et élève) + revue complète de Synthèse et des Paramètres** (ta revue) →
L7 recette du flux. **Fait quand :** une ligne « écriture » du plan se conçoit, se fait (maison ET
classe), se corrige, écrit des niveaux — gaté ; Codex a ses 2 onglets propres.
**Coupe :** conception Bac blanc ; diagnostique sans pipeline manuscrit ; la revue Synthèse peut se
réduire à onglets + design (logique inchangée).

### C5 — Lecture (Aletheia) + onglets Livres *(S3 · 3,5 j-éq · ⚙️, prompts 🎻)*
Le moteur branché sur la lecture : conception prof (extrait des contenus ou tranche de livre +
questions), passation, retour ancré au texte, niveaux. **Non-spoiler** : un exercice sur livre ne
référence que l'amont exposé. + **Onglets Aletheia « Exercices · Livres » (prof et élève)**, Livres au
design « biblio » (ton design en cours), Paramètres revus.
**Fait quand :** même critère que C4 côté lecture ; zéro spoiler d'aval ; les 2 onglets en place.
**Coupe :** un seul format élève ; design biblio réduit à la grille de tuiles.

### C6 — Compétences : retour prof & retour élève *(S3-S4 · 2,5 j-éq · 🎻 formulations / ⚙️ le reste)*
(1) Prof : `MatriceCompetences` réelle — classe × compétence en lettres → clic → élève (niveaux,
historique, provenance) ; y ranger le **diagnostic Quazian** (fragilités) plutôt qu'un onglet à part.
(2) Élève : niveau par compétence en lettres, formulation positive (🎻), « quoi travailler » (1-3
compétences + geste concret). (3) « En faire plus » v1 : refaire un exercice formatif facultatif,
flashcards liées, ou question au RAG. (4) Axes Fragments branchés comme source.
**Fait quand :** la matrice affiche du vrai ; l'élève sait son niveau, quoi travailler, et a un geste
cliquable. **Coupe :** courbes d'évolution ; mapping Fragments réduit aux 2-3 axes évidents.

### C7 — Quazian : refonte ciblée *(S4 · 3 j-éq · mini-spec 🎻 / ⚙️ le reste)*
Ta revue l'élargit : (1) **flashcards depuis les contenus**, avec la **nouvelle logique « vu »** —
quand tu coches « vu » dans Scriptorium, les cartes de l'élément se génèrent automatiquement et
entrent en **file de validation prof** (mini-spec Fable : déclencheur, volume 1-2 cartes/texte, dédup) ;
(2) **onglets « Flashcards · Quiz »** prof et élève (« Semaine » disparaît), design refait ;
(3) **commutateur élève à 3 états : Toutes les classes / X / Y** — « Toutes » agrège tableau de bord
et calendrier, les modules restent par classe (v1) ; scoping classe respecté par Quazian ET Codex
élève ; (4) diagnostic fondu dans C6 + entrée « fragilités » dans Quiz ; (5) vérifier le « flashcards
gelées » de l'intégrité (assumer ou retirer) ; (6) affichages de notes cohérents.
⚠️ **Constat 24/07 (tests C1, sandbox) :** la création de flashcards et de quiz est déjà **cassée** — Quazian ne reconnaît plus l'architecture Scriptorium actuelle. Le chantier commence donc par une remise en marche (diagnostic), pas seulement une réorganisation.
**Fait quand :** cartes générées au « vu » et validées en file ; un bi-classe voit juste ; 2 onglets.
**Coupe :** design Paramètres ; la génération auto peut dégrader en « bouton Générer » par élément
(même file de validation) si le déclencheur « vu » résiste.

### C8 — Fragments : réorganisation + fond *(S4 · 4 j-éq · ⚙️, arbitrages 🎻)*
Ta revue en fait le cœur : (1) **réorg des onglets prof — Semaine · Suivi · Évaluations · Paramètres**
(Suivi = fusion Thèmes + Vue d'ensemble, par classe et par élève : thème, moyenne, taux de dépôt,
clic = progression ; Évaluations = Essai | Synthèse en toggle) ; (2) **validation par LOT** (le goulot :
3-7 h/sem à 90 élèves) ; (3) **bug calendrier/semaine lié aux semestres** à diagnostiquer (probable
cousin du « deux définitions de semaine N » de l'audit) ; (4) bug « Expression comptée deux fois » ;
(5) synthèse de semestre minimale (générer + publier) ; (6) prompt hebdo par défaut dans le code ;
(7) dates limites fuseau Toronto ; (8) côté élève : onglets **Écrit · Oral · Essai**, design vérifié.
⚠️ **Constat 24/07 (tests C1, sandbox) :** le point (3) est confirmé et **bloquant** — Fragments ne reconnaît plus la nouvelle architecture du calendrier : impossible de créer des semaines, donc aucun dépôt possible. Diagnostic en tête de chantier.
**Fait quand :** 30 dépôts validés < 30 min ; onglets en place des deux côtés ; le bug semestre est
compris et corrigé. **Coupe :** toggle semestre retiré si superflu (ta question — on tranche au
check-in) ; synthèse réduite ; D12 différé.

### C9 — Scriptorium prof : onglets + design *(S4 si crédits · 2 j-éq · ⚙️)*
**Ressuscité : ta revue re-valide la spec `SPEC_scriptorium_reorg_onglets.md`** (Classes · Parcours ·
Ressources · Paramètres). Classes : classes à gauche / détail à droite, « à faire pour cette classe »,
frise « où on en est » (s'appuie sur la grille d'instance RAG L3 existante). Ressources : 3 ressources
à gauche, étagères à droite (Textes = parchemin, Cours = dossiers, Livres = design biblio), boutons
retour. Parcours : tuile parchemin. Paramètres : design.
**Fait quand :** les 4 onglets en place, navigation évidente. **Coupe :** c'est le premier chantier à
glisser en recette ou post-rentrée si S4 déborde (fonctionnellement, tout marche déjà sans lui).

### C10 — Passe UI : mobile + laptop, prof + élève *(C10a S4 · 1,5 — C10b S5 · 1,5 j-éq · ⚙️)*
**La checklist, c'est `LISTE_revue_prof_eleve.md`** (ta revue) + la matrice module × onglet × device.
Pas de redesign hors liste ; timeboxé. **C10a (élève d'abord, mobile d'abord — 375px)** : menu
déroulant aligné sur les accès réels, tableau de bord « à faire » complet (y compris exercices C4/C5),
commutateur 3 états visible, densité/cibles tactiles. **C10b (prof, laptop d'abord)** : **tableau de
bord prof recentré sur 4 blocs** — à préparer / non remis / élèves en difficulté / synthèse RAG hebdo
(mini-spec 🎻 de 10 lignes) ; pilotage élèves « tous visibles, classes en filtre » ; bouton retour des
classes ; historique intégrité cliquable ; design calendrier léger.
**Fait quand :** checklist verte ou 🚩-acceptée ; zéro écran élève cassé sur téléphone.
**Coupe :** mobile prof ; les 🚩 cosmétiques → `IDEES_post_rentree.md`.

### C11 — Coûts API, prod, sauvegardes *(C11a S1 · 0,75 — C11b S4 mar-mer · 1,75 j-éq · ⚙️)*
**✅ C11a TERMINÉ le 25/07** — `api_couts` absente en base créée et journalisation dé-silencée
(`8d96c85`), attribution élève/classe + modèle/tokens (`25e1884`), recette 1-5 validée et reliquats
routés (`7404cf7`), merge `942a349`. Écran des coûts spécifié : `SPEC_C11c_ecran_couts.md`.
**C11a :** l'audit conclut que le suivi Aletheia/Quazian est **probablement muet** (table `api_couts`
peut-être jamais créée + erreur avalée dans `utils/cout-api.ts`). Vérifier/créer (sandbox + prod,
journal R6), dé-silencer, tuile « coûts totaux » au tableau de bord, brancher les nouveaux appels.
**C11b :** dérouler le RUNBOOK (base prod, schéma, config, buckets + policies, env vars, compte prof,
smoke test 8 points) ; **pg_dump quotidien automatisé** (+ une restauration réellement testée) ; copie
hebdo des buckets Storage ; alerte erreurs (logs Vercel + email ; Sentry si 2 h suffisent).
**Fait quand :** chaque module apparaît dans la tuile ; smoke 8/8 ; un dump a été restauré une fois.
**Coupe :** observabilité = logs. Jamais la sauvegarde.

### C12 — Données de rentrée *(S5 · 1 j-éq · ⚙️ + toi)*
Calendrier 2026-27 en prod (semestres, vacances, jours de cours, exceptions — en SQL si l'UI manque) ;
**vérifier si un semestre peut s'effacer** (ta question — sinon petit ajout gardé) ; classes réelles ;
import CSV testé sur 2-3 adresses à toi ; invitations Resend vérifiées ; modules assignés ; plans
d'évaluation instanciés ; parcours assignés (semaines 1-3) ; livres découpés.
**Fait quand :** un élève-test invité arrive sur un espace complet et daté juste.
**Coupe :** contenu au-delà de la semaine 3.

### C13 — Recette générale & jour J *(S5 · 3,5 j-éq · toi + ⚙️ pour les fixes, 🎻 pour les bugs vicieux)*
**4 personas :** élève mono-classe (mobile) · élève **bi-classe** (mobile+laptop, commutateur 3 états) ·
« petit malin » (triche photo, hors-sujet, spam, tentative API) · toi prof (laptop+mobile).
**Scénario « 2 premières semaines » compressé :** inscription → fragments (dépôt, retard, validation
par lot, publication, lecture) → quiz + flashcards → séance Codex → Aletheia séance 1 → exercice
diagnostique écriture → exercice lecture → niveaux → matrice → « quoi travailler » → RAG (dont
tentatives de spoiler) → calendrier → coûts. À dérouler sur sandbox (début S5) puis prod (fin S5).
Bugs : bloquant/gênant → corrigés ; cosmétique → `IDEES_post_rentree.md`.
**Gates (ven 21/08) :** `plan_evaluation_actif` ON · `exercices_actif` ON · `rag_actif` selon L8 ·
mode C OFF. **Checklist jour J (lun 24/08) :** smoke 8/8 ✅ · comptes/classes/parcours ✅ · gates ✅ ·
vrai téléphone d'élève ✅ · procédure incident écrite ✅.
**Fait quand :** les 4 personas traversent sans bloquant, sur les 2 environnements.

---

## 4. Piste parallèle (hors-code, hors quota) — vie privée / Loi 25

Voix, photos de copies et textes d'élèves mineurs partent chez Anthropic/Groq/Resend sans cadre
(audit 🔴). Minimum vital administratif : une **lettre d'information parents/élèves** (données,
sous-traitants, rétention), validée par la direction avant le 25/08. Je la rédige ici sur demande —
ça ne touche pas au quota de dev.

---

## 5. Crédits & modèles — où mettre la finesse (Fable ≤ ~50 % du bilan)

**Le principe : Fable écrit la partition et juge ; le modèle standard joue les notes.**

| 🎻 **Fable (finesse — à rationner)** | ⚙️ **Standard (exécution — le volume)** |
|---|---|
| La spec C3 entière + son durcissement | Implémentation de tous les lots une fois spécifiés |
| **Tous les prompts IA pédagogiques** (retours d'exercercices C4/C5, formulations compétences C6, calibration RAG) | Design & UI : C9, C10, onglets, densité, responsive — sauf revue finale des 2-3 écrans critiques |
| Conception des correctifs de sécurité C1 (RLS) | Pose des policies, migrations, recâblages mécaniques |
| Mini-specs : flashcards-sur-« vu » (C7), TdB prof 4 blocs (C10b), commutateur 3 états (C7) | Réorganisations d'onglets (C4/C5/C7/C8/C9) |
| Analyse des fuites de calibration L8 (C2) | Banc de calibration lui-même, fixtures, script |
| Bugs vicieux en recette (états, dates, RLS) | Bugs simples en recette, data entry C12 |
| Les check-ins du mercredi (arbitrages, coupes) | — |

Règles pratiques : viser **~⅓ du volume en Fable**, garder de la réserve Fable pour S4-S5 (recette =
bugs vicieux) ; si le quota Fable est entamé à >60 % en milieu de cycle, tout ce qui reste passe en
standard sauf prompts pédagogiques ; si le quota TOTAL approche, basculer sur les tâches sans crédits
(recette manuelle, checklist UI, données, lettre Loi 25).

---

## 6. NON-buts d'août (différé, assumé)

Mode C Aletheia (carte-de-parcours) · import PDF lots D/E/F · « modèle vivant » du plan · moteur
adaptatif / Profil élève complet · recâblage Fragments par classe (D12) · refonte visuelle profonde ·
unification fine des conventions de coûts · dossier RGPD complet (au-delà de la lettre) · tests/CI
généralisés · **messagerie prof→élève** (ton encadré « Plus tard ») · **notes dans le chat Scriptorium**.
Tout émergent → `IDEES_post_rentree.md`.

---

## 7. Correspondance avec tes demandes

| Ta demande | Chantier(s) |
|---|---|
| Parcours d'exercices d'écriture Codex + compétences d'écriture | **C3 + C4 + C6** |
| Parcours d'exercices de lecture Aletheia + compétences de lecture | **C3 + C5 + C6** |
| Finir le RAG (+ écran élève Plan de cours/Discussion) | **C2** |
| Expérience élève mono ET multi-classe (commutateur 3 états) | **C1 + C7 + C10 + C13** |
| Apparence laptop/mobile, général + par module + par onglet | **C10** (checklist = `LISTE_revue_prof_eleve.md`) + design intégré à C4/C5/C7/C8/C9 |
| Évaluation par compétences : tableau prof, retour élève, « en faire plus » | **C6** (+ C3) |
| Coût API | **C11a** (à réparer, pas juste vérifier) |
| Fragments en profondeur (+ réorg onglets de ta revue) | **C8** |
| Scriptorium structure/apparence | **C2 + C9** |
| Quazian (refonte + logique flashcards « vu ») | **C7** |
| Prêt pour 70 élèves | **C0 + C1 + C11b + C12 + C13** |

---

## 8. Comment on travaille — la boucle, et le suivi

**La boucle par chantier :**
1. **Ici, avec moi (Fable) :** « on attaque C4 » → je produis la spec du chantier + les **prompts de
   session prêts à coller** (un par lot), je les écris directement dans le repo.
2. **Toi, dans Claude Code** (modèle standard sauf mention 🎻) : tu colles le prompt du lot, tu laisses
   tourner, tu **testes en utilisateur**. Bug simple → tu relances Code directement.
3. **Question de fond, arbitrage, prompt pédagogique** → tu reviens ici plutôt que d'improviser dans Code.
4. **Chantier fini** → tu me le dis en une ligne (« C4 fait », « C8 fait sauf synthèse ») → je mets à
   jour le tableau de bord, ce fichier **et `SUIVI_tests_manuels.md`** (créé le 24/07 : les tests
   manuels de chaque chantier y vivent — ajoutés à l'écriture des specs, cochés à la validation).

**Le suivi :** je ne me tiens **pas** au courant tout seul — je ne tourne pas entre nos échanges, et je
ne vois ton dossier que quand l'app est ouverte. Le rituel qui remplace ça :
**le check-in du mercredi soir** (fin de ton cycle de crédits), 10 minutes ici : fait / pas fait /
crédits restants → on active les coupes du cycle qui démarre le jeudi, je mets à jour l'artefact et ce
plan, et je te prépare les specs/prompts du cycle suivant pendant que ton quota se recharge.
Entre deux mercredis : une ligne ici suffit à tout moment pour marquer un avancement.

*(Sur demande, je peux programmer un rappel automatique chaque mercredi soir qui rouvre la
conversation pour le bilan.)*

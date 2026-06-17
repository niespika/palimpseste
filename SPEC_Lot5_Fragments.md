# SPEC — Lot 5 : Fragments (côté prof) — révisé

> Lot du plan global (`PLAN_Palimpseste_modifications.md`). **Le plus gros — plusieurs sous-onglets.** Cette version **remplace** la précédente : le **modèle de notation** a été clarifié (sections en lettres vs note finale /20), et la **synthèse** de fin de semestre n'est **pas** Codex.
> **Prérequis : Lot 1 implémenté** (scoping par inscription élève × classe) **+ le modèle semestre (5.0) et le modèle de notation, à poser en premier dans ce lot.**
> Spec standard (pas d'audit-first).
>
> **Réutilise le composant tuile-classe du Lot 3** dans 5.1 à 5.4.
> **Liens inter-lots :** prépare le côté élève (Lot 10). La synthèse de fin de semestre est **distincte de Codex (Lot 8)**.

---

## Ordre intra-lot recommandé

1. **5.0 — modèle semestre** (tout en dépend).
2. **Modèle de notation + le barème de 5.6** (l'échelle des sections E-A ↔ 0-4, consommée par 5.2 et 5.4).
3. **Onglets 5.1 → 5.4.**
4. **Le reste de 5.6** (prompts).
5. **5.5 — différé** (ne pas construire).

---

## 5.0 — Modèle semestre (fondation)

- L'année compte **deux semestres**. **Tout** dans Fragments (semaines, thèmes, vue d'ensemble, épreuves) est **scopé à un semestre**.
- **Contexte semestre :** un **sélecteur** au niveau du module ; par défaut le **semestre courant** ; les semestres passés restent **consultables**.
- **Thème par (inscription, semestre) :** chaque élève a **un thème par semestre et par classe** ; il **change de thème** à la fin d'un semestre. Découle du scoping Lot 1 (thèmes distincts HLP / Philo, changeant chacun par semestre).
- **Définition de semestre :** *reco — marqueurs **S1 / S2** que le prof bascule. Ce sont les **semaines** qui portent les échéances de dépôt, pas le semestre.*

### ⚠️ Distinction à ne pas rater : modèle (5.0) vs onglet (5.5)

- **5.0 = le modèle semestre → DANS CE LOT.**
- **5.5 = l'onglet « semestre » → DIFFÉRÉ** (tests en cours). **Différer l'onglet ≠ différer le modèle.**

---

## ⭐ Modèle de notation (fondation transversale du lot)

**Deux niveaux distincts — ne pas les confondre.**

### Niveau 1 — Évaluation des sections / compétences → **lettres (E-A, 0-4 sous-jacent)**

Chaque travail est évalué sur des **sections**, chacune sur une échelle **E → A** (5 niveaux, valeur 0-4 sous-jacente). Sections par type :

| Type de travail | Sections |
|---|---|
| **Oral** | Contenu, Structure, Expression |
| **Écrit** (fragment hebdo) | Découverte, Sources, Expression |
| **Essai** | Structure, Argumentation, Expression, Connaissance |

> **Pourquoi des lettres :** en chiffres, les élèves croient que la note finale est l'**addition** des sections ; et une lettre est **moins brutale** qu'un chiffre.

### Niveau 2 — Note finale → **chiffrée /20**

La **note finale sur 20** reste **numérique** et n'existe **que** pour : **l'oral**, **l'essai**, et la **synthèse de fin de semestre**. Le **fragment écrit hebdomadaire n'a PAS de /20** (seulement ses sections en lettres).

### Conséquences

- **Le barème (5.6) ne régit QUE l'échelle des sections (E-A ↔ 0-4).** Le /20 est numérique brut, **hors** barème lettres.
- **Sections factorisées en rubrique partagée** (low-regret, prépare l'agrégation — voir la note dédiée en fin de spec) : définir les compétences + l'échelle E-A comme **une rubrique unique** (source de vérité), que chaque type de travail consomme via un **sous-ensemble**. Ne renomme rien d'imposé pour l'instant ; structure juste pour que la convergence soit facile.

---

## La synthèse de fin de semestre (≠ Codex)

- À la fin d'un semestre, une **synthèse** produit une **note /20** pour l'ensemble **fragment-écrit + fragment-oral**, via le **Prompt Synthèse** (5.6). **Sans rapport avec Codex.**
- **Où vit le workflow :** très probablement dans l'**onglet « semestre » (5.5, différé)**. Donc on **expose le Prompt Synthèse maintenant** (5.6), mais le **workflow de synthèse vient avec 5.5**. *(À confirmer.)*

---

## 5.1 — Onglet « semaine » (fusion)

- **Fusionner** « vue par semaine » et « semaine » en **un seul** onglet.
- Bouton **« nouvelle semaine »** : crée une semaine dans le semestre courant ; elle porte son **échéance de dépôt**.
- **Niveau onglet :** liste des **semaines** du semestre.
- **Clic sur une semaine →** tuiles de classe *(composant Lot 3)*, résumé = compteurs **{déposés, en retard, manquant, à valider, publié}** pour cette semaine.
- **Clic sur une tuile de classe →** détail classe *(composant Lot 3)* : liste des élèves, statut par élève = état de son fragment de la semaine (et, une fois évalué, ses **sections en lettres**).
- **Orateurs :** bouton **« choisir l'orateur » seulement dans le détail d'une classe**. Le prof **fixe d'abord le nombre d'orateurs** (cette classe, cette semaine), puis **désigne** ce nombre d'élèves. *(L'oral est évalué sur ses sections en lettres **+ /20** → relié à « fragment oral » côté élève, Lot 10.)*

**Cycle de vie d'un fragment de semaine (définit les compteurs) :**
1. **Manquant** — rien déposé (semaine due).
2. **Déposé** — soumis ; sous-marqueur **à temps / en retard** selon l'échéance.
3. **À valider** — déposé, en attente de validation du prof.
4. **Publié** — validé / publié par le prof.

> Les compteurs **ne partitionnent pas** : *déposés* inclut *à valider* et *publié* ; *en retard* ⊆ *déposés*. Petit tableau de bord, pas répartition exclusive. *(Sémantique à confirmer.)*

---

## 5.2 — Onglet « vue d'ensemble »

- **Proche de l'existant** — surtout **aligner au motif tuile** et au **scope semestre**.
- Tuiles de classe, résumé = **moyennes par section** de la classe. Clic → détail classe : par élève, **moyenne par section** + **taux de dépôt**.
- **« Moyennes par section » = moyennes des évaluations de sections en LETTRES.** Calcul sur les valeurs **0-4** (mapping du **barème**, 5.6), **affichage en lettre**. → **5.2 dépend du barème de 5.6.** Le **/20 n'entre PAS** dans la moyenne par section.

---

## 5.3 — Onglet « thèmes »

- Tuiles de classe → liste d'élèves **déroulante** avec leur **thème** (semestre courant).
- **Unifier** « thème » et « question d'essai » en **un seul champ**.
- Le prof **voit et édite** le thème de chaque élève (par inscription, par semestre). *(Origine — prof assigne vs élève choisit — à confirmer ; défaut : éditable par le prof.)*

---

## 5.4 — Onglet « épreuve »

- **Assigner une épreuve à une ou plusieurs classes**, avec **dates par classe** (même épreuve, date propre à chaque classe ; chaque couple (épreuve, classe) a son **état ouverte / fermée**). → relation épreuve ↔ classe **plusieurs-à-plusieurs** portant **date + état**.
- Tuiles de classe → **liste des épreuves** (nom, date, ouverte/fermée).
- **Clic sur une épreuve →** **détail (existant)** + **« fermer le dépôt » (existant)** + **graphes** :
  - **Répartition des lettres** = distribution des **évaluations de sections** (lettres). **C'est le graphe principal** (les fragments tournent surtout autour de cette évaluation).
  - **Répartition des notes** = distribution du **/20** — **seulement** si l'épreuve porte un /20 (oral, essai, synthèse). Pour une épreuve **sans** /20 (écrit), seul le graphe **lettres** s'applique.
- **Le reste de l'onglet est bon** — ne pas réécrire le détail ni la fermeture.

---

## 5.5 — Onglet « semestre »

**DIFFÉRÉ.** Ne pas construire (cf. 5.0 vs 5.5). Héberge probablement le **workflow de synthèse de fin de semestre** — à traiter quand tu reprendras cet onglet.

---

## 5.6 — Onglet « paramètre »

- Présentation en **tuiles (ou déroulants)** — clic → détail ; pas tout déroulé en permanence.
- **Tuiles :** **Barème**, **Prompt Évaluation Fragment**, **Prompt Évaluation Oral**, **Prompt Essai**, **Prompt Synthèse**.
- **Barème = échelle des SECTIONS uniquement (E-A ↔ 0-4).** Le /20 n'y touche pas. C'est ce mapping que 5.2 et 5.4 consomment → à poser **tôt**.
- **Prompt Synthèse = la synthèse de fin de semestre des fragments (écrit + oral).** **Pas** Codex.
- **Prompts :** au minimum **visibles** ; **éditables** depuis l'UI si tu veux *(à confirmer)*.
- **Rubrique partagée (low-regret) :** les 4 prompts d'évaluation devraient **importer une rubrique commune** (définitions des compétences + échelle E-A, définies **une fois**) et ne différer que par les **instructions propres à chaque type de travail**. Même logique que le composant partagé du Lot 3 : une source, des consommateurs. C'est aussi ce qui rend l'agrégation possible plus tard (voir note).

---

## À confirmer (avec recommandations)

1. **Compteurs 5.1** — cumulatifs (tableau de bord) ou exclusifs ? *Reco : cumulatifs.*
2. **Quelles épreuves portent un /20 ?** *Reco : oral, essai, synthèse ; l'écrit, non.*
3. **Origine du thème 5.3** — prof assigne ou élève choisit ? *Reco : éditable par le prof a minima.*
4. **Prompts 5.6** — visibles seulement ou éditables ? *Reco : éditables.*
5. **Rubrique partagée** — adopter dès maintenant la structure « définitions + échelle E-A en source unique, prompts qui l'importent » ? *Reco : oui (low-regret, prépare l'agrégation sans rien imposer). Voir note ci-dessous.*

---

## Note — rubrique partagée, axes de compétences & agrégation

*Préparation, non bloquant pour le Lot 5. Décisions actées ici pour la **rubrique** (qui se met en place dès le Lot 5) et pour le **lot d'agrégation dédié** (différé, après Codex Lot 8 et tableau de bord élève Lot 9).*

**Architecture à deux couches — sections (tâches) vs axes (construits) :**
- Les **sections** sont ce que l'élève voit et ce qui est évalué par travail (Découverte, Sources, Structure…). Ce sont des **tâches**, pas forcément des construits purs.
- Les **axes de compétences** sont les **construits purs** sur lesquels on agrège (Expression, Structure, Argumentation, Connaissance, Synthèse, Sources…), tous sur l'échelle **E-A**.
- **Mapping plusieurs-à-plusieurs :** une section peut charger sur **plusieurs** axes, et un axe reçoit de **plusieurs** sections / types de travaux. **L'agrégation se fait au niveau des axes.**

**Cas « Découverte » (écrit) :** section **composite** — l'élève restitue ce qu'il a découvert sur son thème, ce qui mêle **Connaissance** (restitution), **Synthèse** (intégration) et **Expression**. Donc Découverte → {Connaissance, Synthèse, Expression}. L'évaluation de l'écrit produit des lettres sur ces **axes** (et, au choix, une lettre holistique « Découverte » pour l'élève).

> ⚠️ **Confond à corriger :** l'écrit liste aujourd'hui **Expression** comme section **et** l'inclut dans **Découverte** → Expression comptée **deux fois**. Démêler : Expression reste un axe propre ; Découverte n'apporte au plus que sa part non-Expression (Connaissance + Synthèse).
> **À trancher (toi) :** afficher les lettres **par axe** à l'élève (plus diagnostique : « connaissances solides, synthèse à travailler ») ou garder une lettre **holistique** par section côté élève, tout en capturant les axes en dessous pour le profil ?

**Couche d'agrégation (différée) — décisions actées :**
- **Étiquette ≠ construit :** un axe partagé (ex. Expression oral vs écrit) porte des **descripteurs propres au mode** dans la rubrique, sans forcer une identité.
- **Couverture inégale :** afficher le **n / la confiance** par axe ; pas de fausse précision sur un axe à observation unique.
- **Fonction d'agrégation :** **moyenne pondérée par la récence** par axe.
- Échelle E-A traitée comme 0-4 (espacement supposé égal — assumé et documenté).

**Ce que le Lot 5 fait dès maintenant :** garder les sections sur l'échelle E-A et **factoriser la rubrique** (définitions d'axes + échelle, en source unique, importée par les prompts). Capturer la donnée de façon **commensurable** pour ne pas avoir à la re-collecter.

---

## Fait quand

- **Sections évaluées en lettres (E-A)** ; **note finale /20 chiffrée**, uniquement pour **oral / essai / synthèse**. Le fragment écrit hebdo n'a **pas** de /20.
- Tout Fragments est **scopé par semestre** (sélecteur ; passés consultables) ; **thème par (classe, semestre)** changeant au semestre suivant.
- Onglet **« semaine » unique** (fusion), **« nouvelle semaine »** ; semaine → tuiles de classe (compteurs) → détail élève ; **orateurs** choisis dans une classe après fixation de leur nombre.
- **Vue d'ensemble** : tuiles de classe (moyennes **de sections, en lettres**) → détail élève (moyenne par section + taux de dépôt). Le /20 n'entre pas dans la moyenne par section.
- **Thèmes** : tuiles de classe → thèmes par élève, **un seul champ**.
- **Épreuve** : assignation **multi-classes avec dates par classe** ; tuiles → liste d'épreuves ; détail + fermeture (existants) + **graphe lettres (principal)** + **graphe /20 (si applicable)**.
- **Paramètre** : tuiles **Barème (sections E-A) + 4 prompts** ; **Prompt Synthèse distinct de Codex** ; prompts important une **rubrique partagée**.
- **5.1 à 5.4 réutilisent** le composant tuile-classe du Lot 3.
- **5.5 (onglet semestre) PAS** construit (différé) ; le **modèle** semestre, si. Le **workflow de synthèse** suivra avec 5.5.

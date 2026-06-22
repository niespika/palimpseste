# SPEC — Aletheia : affinages (guideline général)

> Document de cadrage pour une passe d'affinages sur Aletheia (déjà bien avancée).
> **Guideline d'intention, pas spec rigide** — à discuter avec Code, qui a la tête dans le code. Réutilise les primitives en place (rendu des retours de **Codex**, mécanisme de **cartes personnelles** de Quazian, tableaux de bord prof, `PromptConfig`) ; **teste à chaque étape** (cf. conventions de `PLAN_Aletheia.md`).
> Ce document **met à jour** `aletheia-spec.md` (§4 saisie, §5 prompts) et **remplace** les Lots 7-9 envisagés.

---

## 1. Saisie élève — 5 champs

À la place du couple « résumé + questions », l'élève remplit **5 champs distincts** par semaine :

1. **Thèse** — l'idée principale du chapitre selon l'élève. *(Libeller « idée principale » plutôt que « thèse » au sens strict : certains chapitres de Nietzsche tiennent plusieurs mouvements plutôt qu'une thèse nette ; le retour saura le dire.)*
2. **Arguments** — les raisons / arguments avancés par l'auteur pour soutenir cette idée.
3. **Accord** — l'élève est-il d'accord ou non, et pourquoi.
4. **Questions** — 2-3 questions sur le texte.
5. **Vocabulaire** — la liste des mots/termes qu'il ne comprend pas.

**Version retravaillée (vf) : uniquement Thèse, Arguments, Accord.** Les Questions sont traitées (réponses) sans réécriture ; le Vocabulaire alimente Quazian (§4).

*Intérêt pédagogique : séparer **thèse** et **arguments** entraîne la distinction que les élèves confondent (l'affirmation vs ce qui la soutient) ; placer l'**accord** après la reconstruction impose le bon ordre — comprendre d'abord, évaluer ensuite.*

---

## 2. Les deux retours IA

⚠️ **Deux prompts à (re)générer : un prompt de retour V1 et un prompt de retour VF.** Les deux passent par `PromptConfig` (éditables depuis la console dev).

### 2.1 Retour V1 — socratique, par section

Un **seul appel IA**, un **document unique à sections identifiées**, **traitement spécifique par champ** :

- **Thèse / Arguments** — **socratique** : ne corrige pas directement ; pose une question qui amène l'élève à repérer l'erreur, en renvoyant à un passage précis.
- **Accord** — c'est un **révélateur de compréhension** (on ne conteste pas valablement une idée mal lue). Le retour vérifie que l'élève a bien saisi l'idée, puis le **pousse à nuancer ou à justifier** si nécessaire. **Pas de recherche d'objection.**
- **Questions** — **réponses** claires, ancrées dans le texte.
- **Vocabulaire** — **définitions** ancrées dans le texte et accessibles ; affichées dans le retour **et** routées vers Quazian (§4). *(Un seul appel suffit pour une définition adéquate — pas de double appel.)*

Invariants : ancrage strict à la semaine, citations (chapitre/section), adaptativité légère sans plafond, ne réécrit pas à la place de l'élève.

### 2.2 Retour VF — reconstruction + architecture

Après la vf (Thèse / Arguments / Accord retravaillés) :

- **Synthèse modèle** des trois champs, **courte** (≤ ~200 mots).
- **Ajouts à la vf vérifiés contre le livre** : tout ce que l'élève a ajouté en réécrivant est contrôlé ; une affirmation non ancrée ou fausse est signalée. **Comme dans Codex, ces ajouts sont surlignés en jaune** dans le rendu *(à caler sur l'implémentation réelle de Codex avec Code)*.
- **Architecture de ce que tu as lu** — **divulgation progressive** : liens **amont** (semaines ≤ N) explicites ; liens **aval** (> N) en **jalons** seulement, jamais le contenu. (Le modèle reçoit le livre entier mais ne spoile jamais au-delà de N.)

Continuité : les synthèses des semaines précédentes sont réinjectées.

### 2.3 Registre — transversal à TOUS les retours

Public = élèves de **1ère / Terminale**, pas forcément à l'aise avec la langue ni dotés d'une grande culture. Donc : **phrases courtes, mots simples, termes difficiles explicités, nuances rendues saisissables** — **sans niveler la philosophie** (la nuance reste présente, mais accessible).

---

## 3. Présentation des retours — ergonomie ado

Rapprocher le rendu de **Codex**, et **fuir le pavé monolithique** (un ado n'aime pas lire de gros blocs) :

- **Retour V1** : éléments **priorisés et digestes** (à la façon du retour V1 de Codex, plafonné à quelques items), pas un mur de texte.
- **Retour VF** : éléments répartis en **bulles dédiées** — une bulle *Synthèse modèle* (avec surlignage jaune des ajouts), une bulle *Nuances & points à revoir*, une bulle *Architecture de ce que tu as lu*, etc.
- **Ouvert à mieux** : si une organisation plus ergonomique se dégage (accordéons, onglets, progression visuelle…), à explorer avec Code. Objectif : **lisible et engageant pour un ado**.

---

## 4. Vocabulaire → flashcards Quazian

- Les **définitions** viennent de l'unique appel du retour V1 (§2.1).
- Elles créent des **cartes personnelles** dans Quazian, via le **mécanisme existant** : **FSRS** (`ts-fsrs`), **exclues du périmètre des quizz**, **dédupliquées**, **ancrées** sur le livre.
- **Pas de validation prof** (travail autonome de vacances ; la sûreté vient de l'ancrage).

> *Note (hors périmètre immédiat) : les cartes générées depuis les **Fragments** sont jugées une mauvaise idée et **à supprimer — plus tard**. Ne pas modeler les cartes d'Aletheia dessus ; reprendre le patron de génération ancrée façon Codex.*

---

## 5. Vue prof — onglet « Classe »

Le module a déjà un onglet **Paramètres** (les prompts). **Ajouter un onglet « Classe » :**

- **Liste de classe** : les élèves d'une classe et leur **avancée** dans les livres qui leur sont assignés — par élève et par livre : **semaine en cours**, **statut**, **barre de progression** (X/N semaines). Réutilise les composants de tableau de bord existants (Fragments/Quazian/Codex).
- **Drill-down élève** (clic) : **par chapitre**,
  - la **V1 des 5 champs** + son **retour V1**,
  - la **VF des 3 champs** modifiés + son **retour VF**,
  - la **carte** générée en fin de lecture (cf. §6).

---

## 6. Capstone — génération unique et partagée

La carte d'architecture porte sur **le livre**, donc elle est **la même pour tous** :

- **Générée une seule fois par livre**, **paresseusement**, quand le **premier élève** termine sa lecture ; **mise en cache au niveau du livre** (`scriptorium_livre_id`) ; puis **servie telle quelle** aux autres élèves et **visible côté prof**.
- **Canonique** : le prompt `ALETHEIA_CAPSTONE` ne prend **plus le parcours d'un élève** — seulement le **livre entier** + la **structure des semaines/chapitres** de l'Unité Livre.
- **Courte et lisible** (≤ ~300 mots), **tous les liens aval enfin révélés** (à ce stade, tout est lu).
- À **distinguer** de la bulle « Architecture de ce que tu as lu » du retour VF : celle-ci est **progressive et par élève** ; la carte finale est **complète et partagée**.

---

## 7. Notes modèle de données (à réconcilier avec `ARCHITECTURE.md`)

- `aletheia_travaux` : remplacer `resume_initial`/`questions` par les **5 champs v1** (`these`, `arguments`, `accord`, `questions`, `vocabulaire`) + les **3 champs vf** (`these_vf`, `arguments_vf`, `accord_vf`) ; **deux retours** (`retour_v1`, `retour_vf` en json) ; `retour_vf_lu_at` (validation de lecture, gate de clôture inchangé). *(Le `devoilement` par semaine devient optionnel — utile seulement à la continuité des retours, plus nécessaire au capstone.)*
- `aletheia_capstone` : **clé = `scriptorium_livre_id`** (une seule ligne **par livre**, partagée), `contenu` (json), `created_at`. *(Plus de capstone par élève.)*
- Cartes de vocabulaire : créées dans les tables **Quazian** existantes (cartes personnelles), **pas** dans Aletheia.

---

*Flexibilité & tests : voir les conventions transverses de `PLAN_Aletheia.md`. Ce document décrit l'intention ; cale l'implémentation sur l'existant et signale les écarts.*

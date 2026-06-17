# SPEC — Lot 7 : Quazian (côté prof)

> Lot du plan global (`PLAN_Palimpseste_modifications.md`).
> **Prérequis : Lot 1** (classes par déroulant, scoping) **+ Lot 6** (Scriptorium = **source** du contenu des cartes). Spec standard.
>
> **Réutilise le primitif de tuile du Lot 3** (tuiles **unité** comme Scriptorium ; tuiles **classe**). Le drill mène aux cartes / quizz / élèves selon l'onglet.
> **Liens :** cartes générées → **nouvelles cartes signalées** pour le Lot 11 ; quizz **par déroulant** → résout proprement le **bug de visibilité du Lot 0** si la cause était le rattachement par nom.

---

## 7.1 — Onglet « flashcard »

- Tuiles **unité**. Chaque tuile **liste ses semaines** (structure Scriptorium, Lot 6) ; pour chaque semaine, **statut des cartes** : **nombre de cartes**, ou **« à générer »**.
- Clic sur une semaine → **générer les cartes pour CETTE semaine uniquement**, depuis le contenu Scriptorium de cette semaine (texte + légendes ; images au modèle multimodal — décision Lot 6).
- Les cartes générées atterrissent dans l'**écran existant** où le prof les **revoit / édite** (le reste de l'écran reste identique).
- **Génération incrémentale :** régénérable à mesure que le contenu grandit ; les **nouvelles cartes sont marquées** → alimente « cartes ajoutées » côté élève (Lot 11).

## 7.2 — Onglet « diagnostique »

- Aujourd'hui : diagnostic **quizz** seulement. **Ajouter un diagnostic flashcards.**
- **Tuile « quizz »** → diagnostic des quizz *(non encore testé de ton côté — gardée légère / extensible).*
- **Tuile « classe »** *(composant Lot 3)* → classes, **déroulant des élèves** : par élève, **révise-t-il ses cartes** + **temps passé** (et utilement : dernière activité, backlog de cartes dues).

## 7.3 — Onglet « quizz »

- Garder **« créer un nouveau quizz »**, mais **nombre de questions flexible**.
- Création : **classe par menu déroulant** (classes créées fin août, Lot 1) — **jamais** en tapant un nom. *(Résolution propre du bug de visibilité quizz du Lot 0 si la cause était le rattachement par nom.)*
- Sous le bouton : **tuiles de classe** (nom + **nombre de quizz faits**) *(primitif Lot 3)*. Clic → **liste des quizz de la classe** (et, plus loin, résultats par élève).

## 7.4 — Onglet « paramètres »

- Ajouter une section affichant le **prompt de génération des flashcards** et le **prompt de génération des quizz**. **Visibles** (éditables si tu veux).
- *Ce sont des prompts de **génération de contenu**, distincts des prompts d'**évaluation** (rubrique d'axes) des Fragments — **pas** de lien rubrique ici.*

---

## À confirmer

1. **Portée des cartes** — *reco : une carte est liée à son **contenu source** ; sa visibilité élève est **dérivée** (l'élève voit les cartes dont le contenu source est assigné à une de ses classes). Évite de dupliquer par (semaine × classe) tout en respectant des contenus différents par classe.*
2. **Prompts** — visibles seulement ou éditables ? *Reco : éditables.*
3. **Diagnostic quizz** — à étoffer après tes tests.

## Fait quand

- Tuile unité → **semaines + statut cartes** (nombre / « à générer ») ; génération **par semaine** depuis Scriptorium ; cartes revues / éditées dans l'écran existant ; **nouvelles cartes marquées**.
- Diagnostic **flashcards** (révision + temps par élève via tuile classe) **et** entrée diagnostic quizz.
- Quizz : **nombre de questions flexible**, **classe par déroulant**, tuiles de classe (nb de quizz faits).
- Paramètres exposent les **deux prompts de génération**.

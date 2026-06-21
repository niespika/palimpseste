# SPEC — Aletheia / Lot 2 : Structure + planning élève (IA stubbée)

> Conventions transverses : voir `PLAN_Aletheia.md`. Dépendances : Lot 1.

## Objectif

Poser la couche de données d'Aletheia et le parcours élève complet (planning + écriture + gate de validation), **avec les retours IA stubbés**, pour pouvoir tester la boucle de bout en bout avant de brancher les vrais prompts (Lots 3-4).

## Détail

**1. Tables (préfixe `aletheia_`, à réconcilier avec `ARCHITECTURE.md`).**
- `aletheia_travaux` : travail d'un élève pour une semaine. Champs clés : `scriptorium_livre_id`, `semaine_index`, `eleve_id`, `statut`, `resume_initial`, `questions` (string[]), `retour_1` (json), `resume_vf`, `retour_2` (json), `retour_2_lu_at`, `devoilement` (json), `updated_at`.
- `aletheia_capstone` : `scriptorium_livre_id`, `eleve_id`, `contenu` (json), `created_at`.

**2. Machine à états.**
```
DRAFT → V1_SUBMITTED → FEEDBACK1_READY → VF_SUBMITTED → FEEDBACK2_READY → DONE
```
Transitions **strictes** : pas de vf avant le retour 1 ; pas de clôture (`DONE`) sans `retour_2_lu_at` renseigné.

**3. Planning élève (lecture seule, SANS PDF).**
- Lit l'Unité Livre depuis Scriptorium. Affiche, par semaine : **titre**, **chapitres**, et une **date indicative** (déduite de `date_de_début` + `semaine_index`).
- **Aucun PDF, aucune visionneuse de lecture.** L'élève lit son propre exemplaire.
- Respecte le **commutateur de contexte de classe** existant si l'élève est multi-classe.

**4. Espace d'écriture (par semaine).**
- Champs **résumé** (1-2 §) + **questions** (2-3) → bouton *soumettre* → `V1_SUBMITTED`.
- Après le retour 1 : champ **vf** → *soumettre* → `VF_SUBMITTED`.
- Après le retour 2 : affichage du retour + **bouton « J'ai lu »** (validation de lecture, façon Fragments) → `retour_2_lu_at` → `DONE`. **Tant que non validé, la semaine ne se clôt pas.**

**5. Stubs IA.**
- `retour_1` et `retour_2` renvoient un **JSON placeholder** conforme aux schémas de sortie (cf. `aletheia-spec.md` §5.1/5.2), afin d'exercer toute la machine à états et l'UI. Les vrais prompts arrivent aux Lots 3-4.

## Flexibilité

- Réutilise les composants de navigation/écriture côté élève déjà en place (Fragments/Codex), et **le composant/pattern de validation de lecture des Fragments** pour le gate.
- Si un service « Profil élève » ou une convention de statut existe déjà, aligne-toi dessus.

## Tests (avant de continuer)

- **Parcours élève complet avec stubs** : voir le planning (semaines/titres/chapitres, **pas de PDF**) → déposer résumé + questions → recevoir le retour 1 stub → déposer la vf → recevoir le retour 2 stub → **valider la lecture** → semaine `DONE`.
- Vérifier qu'on **ne peut pas sauter d'étape** (pas de vf avant retour 1 ; pas de clôture sans validation).

## Fait quand

- Tables créées et alignées sur les conventions ; machine à états respectée.
- Planning élève **sans PDF** ; espace d'écriture résumé/questions puis vf.
- Gate de **validation de lecture** fonctionnel.
- Boucle **testable de bout en bout** avec stubs.

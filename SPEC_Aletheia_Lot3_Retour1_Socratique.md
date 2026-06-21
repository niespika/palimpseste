# SPEC — Aletheia / Lot 3 : Retour 1 socratique + pipeline d'ancrage

> Conventions transverses : voir `PLAN_Aletheia.md`. Dépendances : Lot 2.

## Objectif

Remplacer le stub du retour 1 par un **vrai retour socratique ancré**, et bâtir le **pipeline d'ancrage** qui extrait le texte des PDF de la semaine.

## Détail

**1. Pipeline d'ancrage (périmètre semaine).**
- Extraire le **texte des PDF de la semaine courante** (Scriptorium). **Réutilise le pipeline d'extraction de Codex/Scriptorium** s'il existe ; sinon ajoute-en un minimal.
- Expose une fonction qui **assemble le contexte d'ancrage** (ici : les chapitres de la semaine) — garde cette fonction comme une **couture** réutilisable (le Lot 4 en aura besoin avec un périmètre différent).

**2. Prompt `ALETHEIA_FEEDBACK_1`.**
- Crée l'entrée dans **`PromptConfig`** (éditable depuis la console dev, comme les autres prompts). Contenu = §5.1 de `aletheia-spec.md`.
- Invariants à encoder : **questionne** les erreurs (ne corrige jamais directement), **répond** aux questions de l'élève, **adaptativité légère sans plafond**, **ancrage strict** à la semaine, **citations** (chapitre/section), **ne réécrit pas** le résumé, **3-5 relances max**, ton bienveillant.

**3. Câblage.**
- À la soumission du résumé+questions (`V1_SUBMITTED`), appelle le modèle avec : `{texte_unite}` (texte extrait de la semaine), `{resume_eleve}`, `{questions_eleve}`, `{syntheses_precedentes}` (résumés validés des semaines antérieures — vide en semaine 1).
- Parse le JSON et affiche le retour structuré (*questions pour avancer* / *réponses à tes questions*).
- Réutilise l'**infra d'appel IA** et le **chargement `PromptConfig`** déjà en place (Fragments/Codex) — ne réinvente pas.

## Flexibilité

- Si l'extraction PDF existe déjà ailleurs, branche-toi dessus. Si les PDF posent des soucis d'extraction (mise en page, colonnes), applique un nettoyage léger et signale les cas douteux.
- Le format exact d'affichage du retour peut suivre les composants de retour existants ; le **contrat** est le JSON de sortie.

## Tests / calibrage (avant de continuer)

- **Cas réel** : un extrait réel (ex. *Naissance de la tragédie*, chap. 1-4) + un **résumé d'élève réaliste** contenant **une erreur de compréhension volontaire** et 2-3 questions.
- Vérifier que le retour 1 : **questionne** l'erreur sans la corriger ; **répond** aux questions ; **cite** des passages ; **ne mentionne pas** Schopenhauer/Wagner/la suite du livre ; reste sous 3-5 relances.
- Le calibrage fin du prompt se fera côté prof via la console — assure-toi qu'il est **bien éditable** et que les changements sont pris en compte.

## Fait quand

- Pipeline d'ancrage **semaine** opérationnel (couture réutilisable).
- `ALETHEIA_FEEDBACK_1` dans `PromptConfig`, **éditable**.
- Retour 1 **réel, ancré, socratique**, structuré selon le JSON cible.
- `{syntheses_precedentes}` réinjectées.

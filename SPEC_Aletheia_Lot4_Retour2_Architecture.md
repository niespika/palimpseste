# SPEC — Aletheia / Lot 4 : Retour 2 (reconstruction + architecture) + validation de lecture

> Conventions transverses : voir `PLAN_Aletheia.md`. Dépendances : Lot 3.

## Objectif

Remplacer le stub du retour 2 par un **vrai retour ancré sur le livre entier**, avec **divulgation progressive**, **vérification des ajouts à la vf**, **plafond de longueur**, et activer pleinement le **gate de validation de lecture**.

## Détail

**1. Ancrage (périmètre livre entier).**
- Réutilise la couture d'ancrage du Lot 3 avec un périmètre **« toute l'Unité Livre »** (texte de tous les PDF de toutes les semaines).
- **Garde la couture explicite** : pour un livre court (cas pilote), injection directe ; pour un livre long, il faudra une étape de récupération (chunking + retrieval). **Ne hardcode pas « injecte tout »** — passe par la fonction d'assemblage du contexte.

**2. Prompt `ALETHEIA_FEEDBACK_2`.**
- Entrée **`PromptConfig`** éditable. Contenu = §5.2 de `aletheia-spec.md`.
- Variables : `{livre_entier}`, `{resume_initial_eleve}`, `{resume_vf_eleve}`, `{syntheses_precedentes}`, `{architectures_precedentes}`, `{semaine_courante_N}`, `{total_semaines}`.
- Invariants à encoder :
  - **Longueur : synthèse modèle ≤ ~200 mots** (priorité absolue à la lisibilité).
  - **Ajouts à la vf** (logique Codex) : si l'élève a **ajouté du contenu nouveau**, **vérifie-le contre `{livre_entier}`** et signale toute affirmation **non ancrée ou fausse** introduite à la réécriture.
  - **Divulgation progressive** : **amont** (≤ N) explicite ; **aval** (> N) **jalons seulement**, jamais le contenu. ⚠️ Le modèle **reçoit** le livre entier mais **ne spoile jamais** au-delà de N.
  - **Continuité** via `{syntheses_precedentes}` ; **citations**.

**3. Câblage + persistance.**
- À la soumission de la vf (`VF_SUBMITTED`), appelle le modèle → `FEEDBACK2_READY`.
- **Persiste `devoilement`** (`architecture_amont` + `architecture_aval_jalons`) dans `aletheia_travaux` — il alimente la mémoire (retours ultérieurs) et le capstone (Lot 5).

**4. Validation de lecture (gate réel).**
- Le gate posé au Lot 2 (stub) est maintenant câblé au **vrai retour 2** : l'élève clique « J'ai lu » → `retour_2_lu_at` → `DONE`. **La semaine ne se clôt pas sans cette validation.**

## Flexibilité

- Le plafond de ~200 mots est un point de **calibrage** : si le modèle déborde, durcis la consigne (et envisage un garde-fou côté code qui signale un dépassement franc). Ne tronque pas brutalement au milieu d'une phrase.
- L'emplacement de `{architectures_precedentes}` (les `devoilement` passés) dans le contexte : choisis ce qui donne la meilleure continuité sans gonfler inutilement le prompt.

## Tests / calibrage (avant de continuer)

- **Cas réel sur une semaine ≥ 2** (pour avoir de l'amont), avec une **vf réaliste** qui (a) garde une **erreur résiduelle** et (b) **ajoute une affirmation non ancrée**.
- Vérifier que le retour 2 : reste **≤ ~200 mots** ; **pointe l'erreur** ; **signale l'ajout non ancré** ; **explicite l'amont** ; **ne donne que des jalons** pour l'aval (ne spoile pas) ; **cite**.
- Vérifier la **persistance de `devoilement`** et que la **validation de lecture clôt** bien la semaine.

## Fait quand

- Ancrage **livre entier** via la couture (prête pour un futur retrieval).
- `ALETHEIA_FEEDBACK_2` dans `PromptConfig`, éditable.
- Règles respectées : **longueur**, **ajouts vérifiés**, **divulgation progressive**, continuité, citations.
- `devoilement` **persisté** ; **gate de validation de lecture** clôturant la semaine.

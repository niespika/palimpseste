# IDEES_post_rentree — le parking à idées

> Règle du plan de rentrée : après le gel des specs (dim 26/07), **toute idée nouvelle atterrit ici**
> au lieu d'entrer dans le périmètre. On rouvre ce fichier en septembre, à tête reposée.

## Déjà différé par le plan (repris de PLAN_CHANTIERS_RENTREE.md §6)

- Mode C Aletheia (C2.x, carte-de-parcours Scriptorium)
- Import PDF lots D/E/F (signets, garde-fous IA, chunking)
- « Modèle vivant » du plan d'évaluation (propagation modèle→instances)
- Moteur adaptatif / Profil élève complet (spec à ouvrir avant les modules analyse/écriture)
- Recâblage Fragments par classe (D12)
- Refonte visuelle profonde / design system v2
- Unification fine des conventions de coûts API
- Dossier RGPD/Loi 25 complet (au-delà de la lettre d'information)
- Tests automatisés / CI généralisés (chantier de septembre-octobre)
- Crochet `niveaux` de la synthèse RAG → branché au système de compétences

## Idées nouvelles (au fil de l'eau)

- **Fragments — page élève n'honore pas `modules.actif`.** Contrairement à codex/quazian/aletheia (dont les pages de validation font `notFound()` sur `!modules.actif`), `app/eleve/modules/fragments-erudition/page.tsx` et `validerLectureRetour` ne gardent que sur l'assignation (`inscriptionsModuleEleve`), jamais sur `modules.actif`. Donc désactiver Fragments globalement tout en le laissant assigné laisse l'élève y accéder. Piste consistance : ajouter la garde `actif` à la page + `validerLectureRetour` (le gate C1-B1 est déjà correct dans les deux cas — il reflète cette garde réelle par module). *(repéré pendant la revue C1-B1)*
- **Aletheia/Codex — brouillon persistant des soumissions (localStorage).** C1-B2 rend l'échec de soumission visible et garde le texte dans le formulaire (state React), mais un rechargement / onglet fermé / redirection `/login` après expiration de session perd encore les 5 champs V1 (jusqu'à ~8000 car. chacun). Piste : autosave localStorage clé `(livreId, semaine, champ)` purgée à la soumission réussie. Le brouillon SERVEUR reste un non-but (SPEC B2). *(scope-out assumé pendant C1-B2)*
- **Codex — consignes prof jamais vues par l'élève.** `app/eleve/modules/codex/synthese/[sessionId]/page.tsx:60` lit `codex_params` (consigne_v1/consigne_vf) avec le client user-scoped, or `codex_params` est prof-only (RLS) → la lecture renvoie toujours `null` et l'élève voit TOUJOURS les consignes par défaut (`consignes.ts`), jamais celles éditées par le prof. Correctif : lire via client admin (comme les autres lectures Codex élève). *(repéré pendant l'inventaire C1-A, hors périmètre sécurité)*

## Bugs cosmétiques 🚩 acceptés pendant la passe UI (C10)

- …

# PLAN — Module **Aletheia** (plan maître)

> Plan d'exécution. Le **quoi / pourquoi** (design, prompts, modèle) est dans `aletheia-spec.md` — réfère-t'y.
> Ce fichier porte les **conventions transverses** (valables pour tous les lots) et l'**index des lots**.

---

## Conventions transverses (à respecter dans TOUS les lots)

**Flexibilité — tu as la tête dans le code.**
- Ces specs décrivent l'**intention** et les **contrats**, pas l'implémentation ligne à ligne.
- **Inspecte l'existant d'abord.** Réutilise les primitives en place : composants UI (tuiles, arborescence, `DétailClasse`, commutateur de contexte de classe), pipeline d'appel IA, chargement des prompts (`PromptConfig`), `AppConfig`, stockage de fichiers, et les mécanismes déjà éprouvés de **Fragments** (validation de lecture) et **Codex** (V1→VF, extraction PDF, ancrage Scriptorium).
- Les **noms de fichiers/tables/champs** proposés ici sont **indicatifs** : aligne-les sur les conventions réelles (`ARCHITECTURE.md`).
- **Si la réalité du code diffère** de ce qui est décrit : privilégie la **cohérence avec l'existant**, fais le choix le plus simple, et **signale l'écart** dans ton récap de fin de lot.

**Tests réguliers (comme pour Cogito).**
- À la fin de chaque lot — et autant que possible à chaque sous-étape — **lance l'app et teste le vrai chemin** : création côté prof, parcours côté élève, appel IA avec un cas réel.
- **Ne passe pas au lot suivant sans un test vert.**
- Reviens avec un **récap** : ce qui marche, ce que tu as adapté, les limites rencontrées.

**Invariants produit.**
- **Terminologie** : module = *Aletheia* ; contenu = *Unité Livre* (vit dans Scriptorium) ; unité de travail élève = *semaine* ; retours = *retour 1* (socratique) / *retour 2* (architecture) / *capstone*.
- **Formatif, sans note** : aucune lettre (E–A), aucun /20, nulle part.
- **Aucun anti-triche** (travail autonome).
- **Élève sans accès au PDF** : il lit son propre exemplaire ; il ne voit que le **planning** et son espace d'écriture. Les PDF de Scriptorium = **ancrage IA uniquement**.
- **Ancrage strict** : tout retour IA s'appuie sur les PDF de l'Unité Livre, **jamais** de source externe (ni Schopenhauer, ni Wagner, ni littérature critique).
- **Lisibilité des retours** : retour 2 ≤ ~200 mots, capstone ≤ ~300 mots ; lecture du retour 2 **validée** par l'élève (gate de clôture de semaine).

---

## Graphe des lots

```
Lot 1 (Scriptorium : type « Livre »)
   └─> Lot 2 (Structure Aletheia + planning élève, IA stubbée)
          ├─> Lot 3 (Retour 1 socratique + pipeline d'ancrage)
          │      └─> Lot 4 (Retour 2 architecture + validation de lecture)
          │             └─> Lot 5 (Capstone)
          └────────────────────────────> Lot 6 (Affinages, optionnel)
```

Ordre recommandé : **1 → 2 → 3 → 4 → 5**, puis **6** si souhaité. Chaque lot est testable seul.

---

## Index des lots

| Lot | Fichier | Objet | Dépend de |
|---|---|---|---|
| 1 | `SPEC_Aletheia_Lot1_Scriptorium_Livre.md` | Type de contenu **Livre** dans Scriptorium (2 boutons) | — |
| 2 | `SPEC_Aletheia_Lot2_Structure_Planning.md` | Tables Aletheia, machine à états, **planning élève** (sans PDF), espace d'écriture, IA stubbée | 1 |
| 3 | `SPEC_Aletheia_Lot3_Retour1_Socratique.md` | **Retour 1** réel (socratique) + pipeline d'ancrage semaine | 2 |
| 4 | `SPEC_Aletheia_Lot4_Retour2_Architecture.md` | **Retour 2** réel (reconstruction + architecture, divulgation progressive) + **validation de lecture** | 3 |
| 5 | `SPEC_Aletheia_Lot5_Capstone.md` | **Capstone** : carte finale courte et lisible | 4 |
| 6 | `SPEC_Aletheia_Lot6_Affinages.md` | Affinages optionnels (édition prompts, qualité des questions, export carte, pacing) | 2 |

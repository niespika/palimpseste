# Spécifications — Module Codex (synthèse de consolidation)

> *Palimpseste, module d'intégration. Anciennement « Synthèse ».*
> **Avant l'implémentation, lire `ARCHITECTURE.md`, les specs des Fragments, du Scriptorium et de Quazian.** Réutiliser : le pipeline photo + OCR + analyse IA des Fragments ; le mécanisme de **séance live chronométrée** de Quazian (lancement, phases, fermeture) ; et le système de **cartes / FSRS** de Quazian, que Codex alimente.

---

## 1. Contexte et intention

Les flashcards consolident des atomes ; la synthèse les **intègre**. Écrire de mémoire un récapitulatif d'une unité de cours force la réorganisation, relie les idées, révèle les trous — l'étape qui transforme la rétention en compréhension. La recherche sur le résumé n'est mitigée *que pour le résumé non guidé* : ce qui le rend efficace, c'est le feedback suivi d'une réécriture. Le module est bâti là-dessus.

**Évalué, pas noté.** Codex est un outil de *consolidation*, pas un instrument de mesure — c'est Quazian qui porte l'évaluation sommative. Aucune note n'en sort. Y mettre un chiffre créerait les mauvaises incitations (écrire pour la note, se couvrir) alors qu'on veut que l'élève *ose* exposer ses trous. La récupération à faible enjeu apprend mieux.

Place dans l'arc Palimpseste : Scriptorium (contenu) → Quazian/flashcards (rétention) → **Codex (intégration)** → analyse et écriture (application).

---

## 2. Décisions de conception arrêtées

- **Granularité** : une synthèse **par unité** du Scriptorium (cadence ≈ toutes les 2 semaines).
- **Livre fermé**, **manuscrit**, **en classe** : V1 (25 min) puis V-finale (25 min), précédées d'une **heure de discussion de synthèse** menée par le prof (orale, **hors logiciel** — Codex démarre à l'écriture de la V1).
- **Évalué, pas noté.** Pas de chiffre. Les axes de la rubrique sont des *dimensions de retour*, pas des poids de calcul.
- **Ce que le prof valide = uniquement le retour critique de la V-finale** (§4). Le retour V1 et le retour mécanique (ortho-grammaire-structure-argumentation) sont **auto, jamais validés**.
- **Retour adossé au Scriptorium** (V1 comme V-finale).
- **Trace durable** : le retour critique validé + la synthèse complétée = matériel de révision (§5).
- **Cartes automatiques** depuis les erreurs corrigées (cap **1-3**, dédupliquées), branchées sur FSRS (§5).
- **Pas de moteur adaptatif** : tâche unique ; adaptativité limitée à l'emphase du retour, sans plafond fixe.
- **Signaux exportés** vers un futur **Profil élève** (§7).

---

## 3. Déroulé d'une séance

```
[Hors logiciel] 1 h de discussion de synthèse menée par le prof
        │
        ▼
Le prof lance la séance (unité X) ──► phase_1
        │
   PHASE 1 — V1 (25 min, livre fermé, manuscrit)
        │   écrit → photo → OCR → analyse IA vs Scriptorium + mécanique
        ▼
   ÉCRAN UNIQUE — suggestions (auto, immédiat, NON validé)
        │   plafond ≈ 6-8 : 3 oublis + 3-5 erreurs/ambiguïtés, hiérarchisés
        │   ortho = indications GÉNÉRIQUES (surtout erreurs récurrentes de l'élève)
        ▼
Le prof passe en phase_2 ──► PHASE 2 — V-finale (25 min)
        │   réécrit avec les suggestions sous les yeux → photo → bouton « envoyer »
        ▼
   RETOUR CRITIQUE DE LA V-FINALE (généré à l'envoi) ──► au prof pour VALIDATION
        │   2 écrans :
        │   (1) erreurs + corrections ; suivi des suggestions ; ce qui pouvait aller
        │       plus loin ; ce qui n'a pas été amélioré
        │   (2) synthèse complétée — ajouts IA pour les oublis, CLAIREMENT marqués,
        │       adossés au Scriptorium → l'élève repart avec une synthèse complète
        ▼
   Prof valide / ajuste ──► l'élève reçoit le retour validé = sa TRACE
        │
        ▼
   Cartes auto (1-3 erreurs, dédup) ──► deck perso FSRS (hors périmètre quizz)
```

**Formulations attendues** :
- *Oublis* : « tu n'as pas parlé de X ni de Y, ni de [tel penseur] ».
- *Erreur factuelle* : « tu confonds X et Y » (correction ferme).
- *Ambiguïté interprétative* : « ce passage peut se lire comme X, mais ton cours soutient plutôt Y » — ancrer dans le cours, pas dans une vérité absolue.

**Contrainte de latence** : le retour V1 doit revenir *dans le temps de la séance* (OCR + analyse rapides, affichage progressif).

---

## 4. Validation par le prof

- Le prof valide **seulement le retour critique de la V-finale** (les 2 écrans). Tout le reste est auto.
- **Attention particulière aux ajouts** (écran 2) : corriger le texte de l'élève est un commentaire ; *ajouter* un point omis est du contenu généré — moins risqué car adossé au Scriptorium, mais le risque résiduel est dans la *sélection et la formulation*. À ne pas survoler.
- **Tri de la file** : prioriser sur le **retour lui-même** (volume + incertitude de l'IA), pas sur le « niveau » de l'élève — un élève fort peut commettre une erreur rare mais grave qu'un tri par niveau laisserait filer. Les passages de fond ambigus sont mis en avant ; le reste est validable **en lot**.

---

## 5. Trace et cartes

- Le retour critique validé + la synthèse complétée constituent, par élève et par unité, une **trace durable** consultable en révision : la liste de *ce que cet élève précis n'a pas su dire*, avec la bonne version.
- **Cartes automatiques** : les **1 à 3** erreurs corrigées les plus importantes deviennent des flashcards personnelles, injectées dans le système FSRS de Quazian.
  - `source = codex`, `eleve_id` renseigné. **Exclues du périmètre des quizz** (comme les cartes-fragments).
  - **Sûres par construction** : leur contenu est la correction *validée par le prof et adossée au Scriptorium* — aucun risque de graver une erreur (contrairement aux cartes-fragments §5.5 de Quazian).
  - **Déduplication** : une erreur récurrente d'une synthèse à l'autre ne crée pas de doublon, mais *renforce* la carte existante. La récurrence est marquée comme **signal de fragilité** (tableau de bord + Profil élève).

---

## 6. Modèle de données (à réconcilier avec `ARCHITECTURE.md`)

Préfixe proposé : `codex_`.

| Table | Rôle | Champs clés |
|---|---|---|
| `codex_sessions` | Séance (classe × unité) | `id`, `classe_id`, `scriptorium_unite_id`, `statut` (`brouillon`/`phase_1`/`phase_2`/`fermee`), `lance_at`, `duree_phase_min` (défaut 25), `created_by` |
| `codex_travaux` | Travail d'un élève | `id`, `session_id`, `eleve_id`, `photo_v1_ref`, `texte_v1_ocr`, `ocr_confiance_v1`, `suggestions_v1` (json), `photo_vf_ref`, `texte_vf_ocr`, `ocr_confiance_vf`, `retour_critique` (json : erreurs+corrections, suivi des suggestions, améliorations possibles), `synthese_completee` (texte, ajouts marqués), `statut_validation` (`en_attente`/`valide`), `valide_par`, `valide_at` |
| `codex_erreurs` | Erreurs corrigées (trace, dédup, cartes, signaux) | `id`, `travail_id`, `eleve_id`, `concept_tag`, `description`, `correction`, `importance`, `est_recurrente` (bool), `flashcard_id` (nullable si promue en carte) |

---

## 7. Dépendances et signaux

- **Lit** le Scriptorium : contenu de l'unité, comme référence du retour et des ajouts (l'élève, lui, écrit à livre fermé).
- **Écrit** dans Quazian : cartes personnelles (FSRS).
- **Émet des signaux** (erreurs récurrentes, fragilités, patterns par compétence) destinés à un futur **Profil élève** — couche d'apprenant partagée, jumelle du Scriptorium côté contenu. Le service n'est **pas construit ici** ; Codex persiste simplement ses signaux dans une forme propre et interrogeable (`codex_erreurs`) pour migration ultérieure. Le Profil élève fera l'objet de sa propre spec ; son principal consommateur sera le moteur adaptatif des modules analyse et écriture.

---

## 8. Découpage en étapes

1. **Étape 1 — Séance live** : création (classe × unité), lancement, phases chronométrées (25 min), fermeture manuelle/auto. Réutiliser la passation de Quazian.
2. **Étape 2 — V1** : photo + OCR (pipeline Fragments), analyse vs Scriptorium + mécanique, **écran unique de suggestions** plafonné et hiérarchisé, ortho générique. Rapide et progressif.
3. **Étape 3 — V-finale** : réécriture avec suggestions à l'écran, photo + OCR, bouton d'envoi déclenchant le retour critique.
4. **Étape 4 — Retour critique + validation** : 2 écrans (erreurs+corrections / synthèse complétée), file de validation triée, validation en lot + cas de fond.
5. **Étape 5 — Trace + cartes** : persistance de la trace, génération de cartes (cap 1-3, dédup) vers FSRS, marquage des récurrences.

---

## 9. Critères d'acceptation

- [ ] Une séance est rattachée à une **unité** du Scriptorium ; deux phases manuscrites de 25 min, livre fermé.
- [ ] Le retour V1 est sur **un seul écran**, plafonné (~6-8 : 3 oublis + 3-5 erreurs), hiérarchisé, **non validé**, et revient **dans le temps de la séance**.
- [ ] Ortho-grammaire = indications **génériques** (pas de marquage de fautes précises) ; les fautes d'OCR ne sont **jamais** comptées comme fautes.
- [ ] Le retour critique de la V-finale est en **2 écrans** ; les ajouts IA y sont **clairement marqués** et adossés au Scriptorium.
- [ ] **Aucune note** n'est produite.
- [ ] Le prof valide **uniquement** le retour critique de la V-finale ; tri sur le retour (volume + incertitude), validation en lot possible.
- [ ] La trace validée est consultable par l'élève en révision.
- [ ] Cartes auto : **1-3** erreurs max, **dédupliquées**, vers FSRS, `source = codex`, **hors périmètre quizz**.
- [ ] **Aucun moteur adaptatif** ; adaptativité limitée à l'emphase du retour, sans plafond.
- [ ] Les signaux d'erreurs sont persistés dans une forme interrogeable, prête à migrer vers un futur Profil élève.
- [ ] Accès & rétention alignés sur Quazian §9bis (l'élève ne voit que son travail ; purge fin d'année / cycle 2 ans).

---

## 10. Points laissés ouverts (à ajuster aux tests)

- Durée des phases (25 min par défaut).
- Plafond et hiérarchisation des suggestions V1.
- Seuil de confiance OCR sous lequel l'ortho n'est pas évaluée.
- Critère exact d'« importance » qui sélectionne les 1-3 erreurs promues en cartes.
- Calendrier de la spec du **Profil élève** (à ouvrir avant les modules analyse/écriture).

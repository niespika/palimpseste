# Revue adversariale — Module Calendrier (2026-06-21)

Revue multi-dimensions (5 axes : migrations, bascule, dates, vues, sécurité), chaque finding vérifié par un agent sceptique indépendant. **30 findings bruts → 17 confirmés** (1 élevé / 5 moyens / 9 faibles / 2 info). **Tous corrigés** (sauf 1 info non bloquante, voir bas).

## Élevé
- **Suppression de semestre = perte de données silencieuse** (`config/actions.ts supprimerSemestre`). Le garde ne vérifiait que semaines/thèmes/synthèses ; or `fragments_essais_epreuves` (→ épreuves + copies élèves) et `quazian_semester`/`quazian_quizzes` cascadent depuis `semesters`. → **Corrigé** : garde étendu aux tables Fragments (`semestre_id`, dont `fragments_essais_epreuves`) ET Quazian (`semester_id`).

## Moyens
- **Page Notes de semestre Quazian affichait des UUID** au lieu des noms de classe (titres de section + options du select). → **Corrigé** : map `id→nom` (`libelleClasse`).
- **Note de semestre invisible pour un élève bi-classe** (`diagnostic/actions.ts`, `maybeSingle()` sur 2 lignes → erreur → null). → **Corrigé** : `.order(note_finale desc).limit(1)`.
- **`regenererSemaines` laissait une semaine périmée** quand une semaine de travail stockée passait en vacances (le `continue` sautait sa mise à jour). → **Corrigé** : la semaine est marquée `is_vacation=true, pedagogical_number=null` (non destructif).
- **Échéances Aletheia dérivées de `nb_semaines`** (compteur) au lieu des semaines réelles. → **Corrigé** : dérivées des documents (`scriptorium_documents.semaine`, 1-based, comme la vue élève).

## Faibles (corrigés)
- Quizz créé sans semestre actif → orphelin : **refus** désormais (`creerQuizz`).
- Semaine ouverte côté élève non scopée au semestre actif (affichage **et** dépôt) : `.eq('semestre_id', actif)` ajouté sur `app/eleve/page.tsx`, `eleve/modules/fragments-erudition/page.tsx`, + **garde serveur** dans l'action de dépôt.
- `lance_at` extrait en UTC (`slice(0,10)`) → décalage d'un jour en soirée : helper **`jourParis`** (fuseau Europe/Paris) pour quizz/codex + tous les « aujourd'hui ».
- Filtre « tout désélectionner » réaffichait tout : **sentinelle `aucune`** (FiltreClasses + vue).
- `EditeurDate` : l'événement déplacé disparaissait sans retour → **navigation vers le jour cible**.
- Flèches ←/→ sans libellé : **`aria-label`** ajouté.
- `definirSemestreActif` non atomique (0/2 actifs) : **index unique partiel** `uniq_semesters_un_seul_actif` (`calendrier_review_fixes.sql`).
- Vacances hors fenêtre du semestre : **bornes** validées dans creer/modifierHoliday.

## Info
- Titre vue semaine hors semestre (double espace) : **corrigé** (préfixe conditionnel).
- Bande dashboard hors `Promise.all` (latence) : **non corrigé** (optimisation pure, mono-prof faible volume — peut être enveloppée dans `<Suspense>` plus tard).

## SQL à exécuter
`calendrier_review_fixes.sql` (index unique partiel — recommandé).

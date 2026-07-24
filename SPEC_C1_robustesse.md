# SPEC_C1_robustesse — sécurité & robustesse élève (chantier C1 du plan de rentrée)

> **But.** 70 élèves réels arrivent le 25/08 et il n'y aura plus de temps de dev après. Ce chantier
> ferme les trous structurels relevés 🔴 par `AUDIT_Consolidation_2026-07-02.md` (committé — greper
> les constats cités ci-dessous). **Correctifs ciblés, pas de refonte.**
>
> **Méthode.** 3 sessions Claude Code (modèle standard), une branche unique `feat/c1-robustesse`,
> merge dans `main` à la fin après les tests. Prompts prêts à coller en fin de fichier. `/clear`
> entre les sessions. Si un choix de conception s'avère ambigu (surtout en RLS) : poser la question
> à Louis, ne pas improviser.
>
> **Interdits.** Pas de refonte UI, pas de renommage, pas de nouvelle feature, rien hors liste.
> Toute découverte annexe → une ligne dans `IDEES_post_rentree.md`.

---

## Session A — RLS élève & gardes serveur (le cœur)

**Constats audit à greper :** « FOR ALL », « PostgREST », « machine à états », « garde de classe ».
Résumé : des policies élève de type `FOR ALL` permettent à un élève, via l'API Supabase directe
(PostgREST + anon key), de modifier sa note de quizz, valider son propre Codex, et contourner la
machine à états Aletheia. Et la garde de classe du correctif « quizz invisible » (bug 0.3) n'a été
appliquée qu'à la **liste** des quizz, pas au **quiz individuel**.

**À faire :**

- **A1 — Inventaire.** Recenser toutes les policies élève trop permissives : sources = les `.sql` de
  la racine (`grep -il "for all" *.sql`) + les constats de l'audit. Lister table par table ce qu'un
  élève peut écrire aujourd'hui et ce qu'il DEVRAIT pouvoir écrire.
- **A2 — Migration `c1_rls_eleve.sql`.** Remplacer les `FOR ALL` élève par des policies granulaires.
  Le **patron maison** à répliquer est celui des migrations récentes (`plan_evaluation_phase_a.sql`,
  `scriptorium_rag_l5_chat.sql`) : SELECT restreint à ses propres lignes ; écritures sensibles
  **uniquement via server actions** (client admin + garde applicative) ; l'élève ne peut jamais
  écrire directement : notes/scores (`quazian_answers`, `quazian_quiz_scores`, sessions), statuts de
  validation Codex (`statut_validation`, `valide_par`, `valide_at`), états et retours Aletheia
  (`statut`, `retour_*`, `devoilement`), et tout champ `*_lu_at` hors du flux de validation prévu.
  Migration **additive et idempotente** (DROP POLICY IF EXISTS + CREATE), comme les récentes.
- **A3 — Gardes serveur.** Vérifier que chaque transition d'état (Aletheia V1→VF→DONE, Codex
  phases/validation, passation quizz) passe par une server action qui revalide : propriété de la
  ligne, état amont attendu, appartenance à la classe. Combler ce qui manque.
- **A4 — Garde du quiz individuel.** Répliquer la garde de classe du correctif 0.3 sur la
  page/route du quiz individuel (élève d'une autre classe → refus propre, pas de données).
- **A5 — Script de vérification `scripts/verif_rls_c1.mjs`.** Avec `.env.local` (URL + anon key) et
  un compte élève de test : TENTER les écritures interdites (update note, update statut_validation,
  saut d'état Aletheia, lecture du quiz d'une autre classe) et vérifier le refus (0 ligne / erreur).
  Le script est conservé — la recette C13 le rejouera.

**Exécution SQL :** Code écrit `c1_rls_eleve.sql` **+ la ligne dans `SUIVI_SQL.md`** ; Louis
l'exécute dans le SQL Editor Supabase (sandbox) et confirme ; ENSUITE seulement, lancer A5.

**Fait quand :** les flux élève normaux passent tous (quiz complet, séance Codex, séance Aletheia,
dépôt Fragments) ET `verif_rls_c1.mjs` montre zéro écriture interdite possible.

---

## Session B — Parcours élève sans impasses

**Constats audit à greper :** « retours non lus », « échec silencieux », « petit malin »,
« multi-classes », « 404 ».

- **B1 — Gate « retours non lus » aligné.** Un retour non lu ne doit bloquer que **son propre
  module**, et un retour devenu illisible (module désactivé, classe changée) ne doit **rien**
  bloquer. Aujourd'hui un retour illisible peut geler tous les rendus de l'élève.
- **B2 — Soumissions fail-visible.** `soumettreV1`/`soumettreVf` (Aletheia) et leurs équivalents
  Codex : encadrer l'appel (try/catch + état d'erreur), afficher un message clair, **ne jamais
  perdre le texte saisi** (il reste dans le formulaire), offrir « réessayer ». Cas visés : réseau
  coupé, session expirée. (Le brouillon persistant côté serveur est un NON-but — trop gros.)
- **B3 — Re-soumission après flag « petit malin ».** Dès la 2ᵉ tentative, l'élève voit toujours un
  état clair (« ton travail a été re-soumis / signalé »), jamais un silence (aujourd'hui la dédup du
  strike produit un avertissement null → rien à l'écran).
- **B4 — 404 bi-classe Aletheia.** Reproduire avec un élève inscrit dans 2 classes : le gate
  Aletheia peut renvoyer 404 selon le contexte de classe. Corriger la résolution de classe
  (contexte/cookie → repli propre sur une classe où le livre est exposé, jamais un 404 sec).

**Fait quand** (tests manuels de Louis) : couper le wifi pendant une soumission → message + texte
préservé ; re-soumettre un travail flagué → bandeau visible ; un élève bi-classe traverse Aletheia
dans ses deux classes ; un retour d'un module désactivé ne bloque plus rien.

---

## Session C — Auth + qualité des prompts IA

**Constats audit à greper :** « open redirect », « fiche de lecture canonique », « SEMAINES_PAR_LOT »,
« retour V1 ».

- **C-a — Open redirect `/auth/confirm`.** Neutraliser le cas `//` : n'accepter que des chemins
  relatifs internes (normalisation/liste blanche). Vérifier ensuite le flux complet d'invitation
  élève : email → lien → finalisation → login.
- **C-b — Fiche canonique sur le livre entier.** `utils/aletheia-retours.ts` : la génération par
  lots (`SEMAINES_PAR_LOT = 2`, contrainte Vercel 60 s) est devenue **aveugle** — chaque lot ignore
  le reste du livre, ce qui contamine diagnostic, retour VF et synthèse élève. Correctif : garder la
  taille de lot (le timeout ne bouge pas) mais donner à chaque lot **les fiches déjà générées des
  semaines précédentes** comme contexte de continuité ; et si une génération reste partielle, le
  **signaler au diagnostic prof** (pas de silence).
- **C-c — Retour V1 nourri par la fiche.** Injecter la fiche canonique de la **séance courante**
  dans le prompt du retour V1 socratique. Zéro risque de spoiler (la fiche de la séance N ne couvre
  que ≤ N). La posture ne change pas : la fiche sert à mieux **cibler les relances**, pas à donner
  la réponse. Ne pas toucher aux prompts édités par le prof en base — c'est l'assemblage du contexte
  qui change.

**Fait quand :** le lien piégé `//evil` ne sort plus du site ; régénérer les fiches d'un livre test
donne des fiches cohérentes entre chapitres ; sur une séance test, le retour V1 avant/après montre
des relances mieux ancrées, à coût par appel comparable (cache).

---

## Prompts de session (copier-coller dans Claude Code, modèle standard)

**Session A :**
```
Lis AGENTS.md, puis PLAN_CHANTIERS_RENTREE.md (section C1) et SPEC_C1_robustesse.md (Session A
uniquement). Crée la branche feat/c1-robustesse depuis main. Fais A1→A5 exactement : inventaire,
migration c1_rls_eleve.sql (patron des migrations récentes, additive, idempotente) + ligne dans
SUIVI_SQL.md, gardes serveur, garde du quiz individuel, script scripts/verif_rls_c1.mjs.
ARRÊTE-TOI après avoir écrit la migration et demande-moi de l'exécuter dans le SQL Editor sandbox
avant de lancer le script de vérification. Termine par la liste des tests manuels que je dois faire.
Rien hors périmètre ; découvertes → IDEES_post_rentree.md.
```

**Session B :**
```
Lis AGENTS.md, puis SPEC_C1_robustesse.md (Session B uniquement). Sur la branche feat/c1-robustesse.
Fais B1→B4 : gate retours non lus aligné, soumissions fail-visible sans perte de texte (Aletheia +
Codex), feedback re-soumission après flag, correction du 404 élève bi-classe Aletheia. Termine par
la liste des tests manuels que je dois faire (y compris le scénario wifi coupé et le scénario
bi-classe). Rien hors périmètre ; découvertes → IDEES_post_rentree.md.
```

**Session C :**
```
Lis AGENTS.md, puis SPEC_C1_robustesse.md (Session C uniquement). Sur la branche feat/c1-robustesse.
Fais C-a, C-b, C-c : open redirect /auth/confirm + vérif du flux d'invitation ; fiche canonique
générée avec continuité inter-lots + signalement des générations partielles ; injection de la fiche
de la séance courante dans le retour V1 (assemblage du contexte, pas les prompts en base). Termine
par la liste des tests manuels. Rien hors périmètre ; découvertes → IDEES_post_rentree.md.
```

**Après les 3 sessions et les tests :** merger `feat/c1-robustesse` dans `main`, dire « C1 fait » à
Claude dans Cowork (+ signaler ce qui a coincé, s'il y a lieu).

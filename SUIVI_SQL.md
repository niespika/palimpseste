# SUIVI_SQL — journal des migrations (C0, ouvert le 23/07/2026)

## Le protocole (règle R6 du plan de rentrée)

1. Toute nouvelle migration = **un fichier `.sql` dans le repo** + **une ligne dans le journal ci-dessous**.
2. Exécution **sandbox d'abord** (base actuelle `aoakpxxlyvthzueaywna`), on note la date.
3. **Prod ensuite** (quand elle existera), on note la date. Jamais l'inverse, jamais sans noter.
4. On ne rejoue **jamais** un fichier de l'archive (section du bas) — la base sandbox fait foi.
5. **⚠️ Un élève réel utilise la base** (Aletheia, lecture en cours — pilote conscient des travaux).
   Toute migration qui touche des tables ou policies de **flux existants** (Aletheia, Fragments,
   Quazian, Codex, auth) suit le protocole renforcé : **code d'abord** (merge + push du code qui va
   avec), **SQL ensuite**, dans une **fenêtre calme**, avec **script de retour arrière prêt**
   (`*_rollback.sql`) et **smoke test élève immédiat** (au minimum : connexion élève test + une
   soumission Aletheia). Les migrations **additives et gatées** (tables neuves, flags OFF — C3/C4/C5)
   s'appliquent normalement : elles ne peuvent rien casser d'existant.
6. **⚠️ Répétition à blanc : RETIRER le `begin;`/`commit;` du fichier avant de le jouer.**
   La répétition à blanc (jouer la migration dans une transaction, constater, puis `rollback`)
   est une bonne pratique — elle a validé `c7_quazian_contenus.sql` le 13/08. Mais **nos fichiers
   de migration portent leur propre `begin;` … `commit;`** : les inclure tels quels (`\i`, ou un
   copier-coller intégral) dans une transaction d'essai fait que **le `commit;` du fichier valide
   la transaction englobante** — la répétition s'exécute alors POUR DE BON, et tout ce qui suit
   passe en autocommit. Postgres ne prévient que par un discret `WARNING: there is already a
   transaction in progress`.
   **Le mode opératoire** : copier le CORPS du fichier (entre son `begin;` et son `commit;`) dans
   sa propre transaction d'essai, jamais le fichier entier ; puis, après le `rollback`, **vérifier
   par une requête** que le schéma et les données sont bien revenus à l'état d'avant — ne jamais
   se fier au seul « ROLLBACK » affiché.
   **Vécu le 14/08 (C7·L3)** : la répétition de `c7_quazian_sections.sql` s'est validée seule. La
   migration est passée hors séquence (avant le merge du code), une carte de test est restée en
   base, et les 2 sous-sections d'un cours plus leurs 4 éléments d'instance ont été **supprimés** —
   reconstruits à l'identique depuis `texte_extrait`, sauf l'horodatage d'un clic « vu », qui
   n'avait pas été relevé et reste donc inventé.

> **Note prod :** la base de production n'existe pas encore. Elle naîtra au chantier C11b (~mar-mer
> 18-19/08) d'un **dump du schéma de la sandbox** — tout l'historique ci-dessous y sera donc
> automatiquement. La colonne « Prod » ne se remplit que pour les migrations **postérieures au dump** ;
> au moment du montage, reporter ici la date du dump et cocher « incluse au dump » pour les lignes
> antérieures.

> **Où est la « sandbox » ? (clarifié le 23/07)** Jusqu'au montage de la prod propre (C11b), il
> n'existe qu'UNE base Supabase — l'actuelle (`aoakpxxlyvthzueaywna`) : **c'est elle, la sandbox**,
> même si palimpseste.ink pointe dessus. Attention : elle n'est **pas** purement du test — un élève
> pilote y travaille (règle 5 ci-dessus). « Exécuter en sandbox » = le SQL Editor de cette base.
> À C11b, une NOUVELLE base devient la prod (RUNBOOK) et celle-ci reste la sandbox ; les env vars
> Vercel Production/Preview seront alors séparées. **À trancher à C11b : le sort des données de
> l'élève pilote** (migrer ses lignes Aletheia vers la prod propre, ou réinitialiser avec son
> accord). **Neon ou autre Postgres nu : non** — l'app dépend de Supabase de bout en bout
> (Auth/comptes, RLS `auth.uid()`, Storage photos/voix, API PostgREST via supabase-js) ; les deux
> environnements doivent être des projets Supabase.

## Journal actif

| Date | Fichier | Zone / chantier | Sandbox | Prod | Notes |
|---|---|---|---|---|---|
| *(exemple)* | *`exercices_l1.sql`* | *C4 — moteur exercices* | *☐* | *☐* | *— créer la ligne AVANT d'exécuter* |
| 2026-07-23 | `scriptorium_rag_l1_sectionF.sql` | RAG L1 §F — matérialisation (déploiement RAG) | ☑ (23/07) | ☐ | Re-run idempotent de la SECTION F seule de `scriptorium_rag_l1.sql` (archivé), à l'étape de déploiement RAG (push `main` du 23/07 : RAG L1-L7 + C0 + C1). Matérialise les assignations parcours→classe existantes en instances. Sections A-E déjà en base → NE joue QUE §F. DRY-RUN avant / vérif après (dans le fichier). Gate `rag_actif` reste OFF. |
| 2026-07-23 | `c1_rls_eleve.sql` | C1 — robustesse élève (Session A) | ☑ (23/07) | ☐ | RLS élève FOR ALL → SELECT-only/FERMÉ : **aletheia_travaux FERMÉ** (5 lectures basculées admin) + **codex_travaux FERMÉ** (lectures 100 % admin) ; quazian_sessions/answers/quiz_scores en SELECT own (⚠️ **drop DES DEUX policies : lot1 `*_eleve_own` + socle `eleve_own_*`**, sinon écriture reste ouverte) ; ré-assertion codex_sessions_eleve_read stricte. **+ profiles : drop `Mise à jour profil personnel` (UPDATE) = ferme l'escalade élève→prof + auto-déblocage ; INSERT `Trigger peut créer un profil` resserré à `auth.uid()=id`** (trigger `handle_new_user` SECURITY DEFINER confirmé au dump → indépendant). Calé sur le dump pg_policies du 23/07. **Protocole renforcé (règle 5)** : code C1-A **mergé+poussé d'abord** (écritures Quazian + lectures Aletheia basculées admin), SQL ensuite, fenêtre calme, smoke test élève. Retour arrière prêt : `c1_rls_eleve_rollback.sql`. |
| 2026-07-25 | `c11a_api_couts.sql` | C11a — coûts API (journal transverse) | ☑ (26/07) | ☐ | **Additive** (table neuve, aucune policy existante touchée) → protocole **normal**, pas de protocole renforcé. Crée `api_couts` (module, cout, created_at) + index `created_at` + RLS lecture prof. **Constat vérifié en base le 25/07 : `select to_regclass('public.api_couts')` → NULL — la table n'a jamais existé**, donc les 14 sites `enregistrerCoutApi()` (Aletheia ×6, Quazian ×6, Scriptorium/RAG ×2) écrivaient dans le vide depuis juin. Contenu identique à `api_couts.sql` (archivé, **à ne pas rejouer**) + bloc de vérification. Idempotent, rejouable. Le code du même chantier dé-silence l'écriture (`{ error }` au lieu d'un `await` nu) et la tuile prof (total partiel annoncé). **v2 avant exécution (C11a-bis, 25/07) : + attribution élève/classe/modèle/tokens** — le fichier n'ayant jamais été joué, il est enrichi EN PLACE (pas d'ALTER, et surtout aucune ligne écrite sans attribution) : 7 colonnes nullables (`eleve_id`/`classe_id` en `on delete set null`, `modele`, 4 compteurs `tokens_*`) + index partiel `idx_api_couts_eleve`. RLS et policy inchangées. Vérif après exécution : bloc en pied de fichier (dont `colonnes_attribution = 7`), puis la requête de contrôle par module (appels / attribués élève / attribués classe / avec tokens) après une génération IA. |
| 2026-07-26 | `c2_l9_prompt_tuteur.sql` | C2 · L9 — prompt du tuteur éditable par sections | ☑ (26/07) | ☐ | **Additive** (4 colonnes NULLABLES sur `scriptorium_params`, sans `default` → pas de réécriture de table ni de verrou long ; aucune policy touchée, RLS inchangée) → protocole **normal**. Ajoute `rag_prompt_ton`, `rag_prompt_relances`, `rag_prompt_longueur` (overrides des 3 SEULES sections éditables du prompt du tuteur ; `NULL` = défaut du code) + `rag_prompt_sections_maj` (horodatage → bandeau « rejouer le banc L8 »). **Les sections verrouillées (anti-spoiler, périmètre, sources, refus) n'ont volontairement PAS de colonne** : elles vivent dans `utils/scriptorium-prompt-tuteur.ts`, le stockage qui permettrait de les écraser n'existe pas. ⚠️ **`rag_prompt` (ancien prompt INTÉGRAL, L5) n'est plus lu par le code** — conservé en base (rien de détruit), commenté comme dormant ; le constat en pied de fichier dit s'il contenait quelque chose (attendu : vide, cf. rapport de calibration du 25/07 ; **constaté vide à l'exécution du 26/07** — `ancien_prompt = f` : la colonne n'a jamais servi, le retrait de sa lecture ne change rien au prompt effectif). Le code tolère l'absence des colonnes (`select('*')`) → il peut partir avant le SQL ; l'enregistrement depuis l'écran prof, lui, échoue tant que ce fichier n'est pas joué. Gate `rag_actif` non touché (reste OFF). Idempotent, rejouable. Vérif après exécution : bloc en pied de fichier (`colonnes_l9 = 4`) + `npm test` (assertion « assemblage = prompt du banc L8, octet pour octet »). **Passées le 26/07 : `colonnes_l9 = 4`, `sections_definies = 0`, `derniere_modif` NULL ; `npm test` 132/132.** |
| 2026-08-13 | `c7_quazian_contenus.sql` | C7 · L1 — Quazian, remise en marche (arc bi-source unité \| contenu) | ☑ (13/08) | ☐ | **Ligne créée AVANT exécution.** Rend `quazian_flashcards.scriptorium_unite_id` et `quazian_publications.scriptorium_unite_id` NULLABLES, ajoute `contenu_id` (FK `scriptorium_contenus` ; `restrict` côté cartes, `cascade` côté publications) + un CHECK d'arc exclusif sur chacune, un index (unique pour les publications), et `quazian_quizzes.scope_contenus uuid[]`. **Patron strict de `plan_evaluation_phase_a.sql` §5** (arc bi-source `codex_sessions`). Motif : Quazian ancrait tout sur `scriptorium_unites` où `type='unite'` — **0 ligne depuis la réorganisation du Scriptorium**, donc création de flashcards et de quiz impossibles depuis le 24/07 (diagnostic complet : `RAPPORT_Diagnostic_C7_quazian.md`). **Protocole RENFORCÉ (règle 5)** bien qu'additive dans ses effets : elle touche des tables d'un flux existant (Quazian) et n'est pas gatée → code mergé+poussé d'abord, SQL ensuite, fenêtre calme, retour arrière prêt (`c7_quazian_contenus_rollback.sql`), smoke test élève. Risque réel nul : **les trois tables sont vides** (0 carte, 0 publication, 0 quiz — constaté le 13/08), aucune donnée à convertir, aucune policy touchée. **Répétition à blanc jouée le 13/08 en transaction ANNULÉE** : les 5 drapeaux de vérification à `t`, l'arc refuse bien une ligne à deux bras comme une ligne à zéro bras, une carte ancrée contenu s'insère et se publie, le périmètre élève rend « classe Test, 6 élèves actifs, 1 carte visible », et la purge du contenu porteur est refusée par la FK — puis `rollback`, sandbox intacte (revérifiée : 0 carte, colonne absente, `not null` toujours en place). Vérif après exécution : bloc en pied de fichier. **Exécutée en sandbox le 13/08 : `colonnes = 3`, `fc_unite_nullable`, `pub_unite_nullable`, `arcs_poses`, `index_poses` tous à `t`** ; les deux FK confirmées avec leurs modes voulus (`ON DELETE RESTRICT` pour les cartes, `ON DELETE CASCADE` pour les publications), 0 carte en base. |
| 2026-08-13 | `c7_quazian_contenus_rollback.sql` | C7 · L1 — Quazian, remise en marche | ☐ | ☐ | **rollback — n'exécuter qu'en cas de problème.** Retire l'arc bi-source et `scope_contenus`. ⚠️ **Destructif si des cartes du bras contenu existent** : le retour au `not null` l'exige, donc le fichier les SUPPRIME explicitement (cascade → `quazian_card_states`, donc l'historique FSRS des élèves). Bloc de constat en tête à LIRE d'abord (il compte ce qui va partir). Joué peu après la migration, il ne détruit rien : les tables étaient vides. |
| 2026-08-14 | `c7_quazian_sections.sql` | C7 · L3 — Quazian, tuiles par cours et visibilité au « vu » | ☑ (14/08) | ☐ | **Ligne créée AVANT exécution.** ⚠️ **Exécutée HORS SÉQUENCE, par accident — dit ici plutôt que lissé.** La répétition à blanc (patron de C7·L1 : jouer le fichier dans une transaction puis l'annuler) a buté sur le `commit;` que le fichier porte lui-même : il a validé la transaction englobante au lieu de la laisser ouverte. La migration s'est donc appliquée **avant le merge et le push du code**, là où le protocole renforcé veut l'inverse. Écart de séquence sans conséquence technique (additive, aucune policy touchée, rollback prêt, 0 ligne à convertir) : **conservée telle quelle sur décision de Louis (14/08)** plutôt que retirée pour être rejouée. Deux autres effets de la même transaction ont dû être RÉPARÉS : une carte de test restée en base, et les 2 sous-sections de « NAture humaine » + leurs 4 éléments d'instance supprimés — reconstruits à l'identique depuis `texte_extrait` (lignes 1-21 et 22-111, 1835 et 7624 signes, découpe contiguë prouvée par 1835 + 1 + 7624 = 9460), avec l'état du « vu » d'origine ; **seul l'instant du clic « vu » est reconstruit** (l'horodatage exact n'avait pas été relevé). État d'après réparation vérifié identique au relevé d'avant : 18 cartes, 2 sections, 17 éléments, 1 sous-section vue. **Vérification de la migration passée à l'exécution : `colonne_posee`, `nullable`, `check_pose`, `index_pose`, `fk_set_null` tous à `t`** ; et le `set null` prouvé en vrai (sections supprimées → la carte survit, `section_id` à null, `contenu_id` intact). Ajoute `quazian_flashcards.section_id` (FK `scriptorium_contenu_sections`, **nullable**, `on delete set null`) + un CHECK de subordination (`section_id` non nul ⇒ `contenu_id` non nul) + un index partiel. Motif : la visibilité élève quitte le geste « Publier » pour le **« vu » du Scriptorium**, qui vit par CLASSE et par ÉLÉMENT — et un cours découpé est matérialisé en un élément PAR SOUS-SECTION. Sans cette colonne, le « vu » ne peut filtrer qu'au grain du cours entier (question §10.4 du `RAPPORT_Diagnostic_C7_quazian.md`). **`on delete set null` est LE choix du fichier** : une re-découpe (`remplacerDecoupe`) supprime et recrée les sections avec des uuid neufs — en `restrict` la re-découpe deviendrait impossible dès qu'un cours a des cartes, en `cascade` elle détruirait les cartes ET l'historique FSRS des élèves ; en `set null` la carte survit et retombe au grain « cours entier » (dé-granulation assumée, réversible par une re-génération). **Protocole RENFORCÉ (règle 5)** bien qu'additive : table d'un flux existant (Quazian), non gatée → code mergé+poussé d'abord, SQL ensuite, fenêtre calme, retour arrière prêt (`c7_quazian_sections_rollback.sql`), smoke test élève. Risque : **18 cartes en base** (toutes sur « Cognitif », bras contenu, `section_id` null par construction → le CHECK est satisfait d'emblée) ; aucune policy touchée. `quazian_publications` n'est pas touchée par ce fichier : elle reste en base, le code cesse seulement de lire et d'écrire son bras contenu. Vérif après exécution : bloc en pied de fichier (5 drapeaux à `t`, dont `fk_set_null`). |
| 2026-08-14 | `c7_quazian_rls_eleve.sql` | C7 · L3 — Quazian, lecture élève des flashcards | ☑ (14/08) | ☐ | **Ligne créée AVANT exécution.** Retire la policy `eleve_read_flashcards` sur `quazian_flashcards` — **une seule instruction**. Motif : elle est MORTE des deux côtés (elle joint sur `scriptorium_unite_id`, NULL pour toute carte du bras contenu → `NULL = NULL` jamais vrai ; et elle exige une ligne `quazian_publications`, que C7·L3 abolit). **Mesuré le 14/08 en simulant l'identité d'un élève** (rôle `authenticated` + claims JWT, transaction annulée) : **zéro carte lisible**. Elle échouait donc du bon côté, mais elle a coûté un **bug MUET** découvert à la recette : `soumettreNote` lisait la carte avec le client user-scoped avant de créer l'état FSRS → `null` → sortie silencieuse → **aucun état FSRS jamais créé depuis C7·L1** (0 ligne dans `quazian_card_states`, tous élèves confondus) ; l'élève notait, l'écran disait « ✓ N cartes révisées », rien n'était enregistré. **Correctif de code joué d'abord** (la garde lit en `admin`) : 30 états + 30 lignes de journal au premier essai. **Décision de Louis (14/08) : retirer plutôt que réécrire** — réécrire la policy obligerait à refaire en SQL toute la logique du « vu », donc à tenir la règle à DEUX endroits (TypeScript + SQL), ce qui est exactement la divergence qu'on répare. La règle vit dans le CODE (`utils/quazian-visibilite.ts`, pure et testée), patron déjà retenu pour le RAG (`scriptorium_rag_l1.sql` §D : aucune policy élève, lecture admin + garde applicative). **Inventaire des accès fait avant** : plus aucun appel n'interroge cette table sous l'identité d'un élève (les deux appels élève sont en `admin`, tout le reste est prof et couvert par `prof_all_flashcards`, Codex écrit en `admin`, le quizz élève n'y touche pas). RLS **reste active**, `prof_all_flashcards` intacte. **PROTOCOLE RENFORCÉ** (policy d'un flux existant) : le correctif de `soumettreNote` doit être **mergé et poussé AVANT** ce SQL. Rollback : `c7_quazian_rls_eleve_rollback.sql`. Vérif : bloc en pied de fichier + smoke élève (une révision doit créer sa ligne). **Exécutée en sandbox le 14/08, APRÈS merge et push du code** (protocole respecté cette fois) : les trois drapeaux à `t` — `policy_retiree`, `policy_prof_intacte`, `rls_toujours_active`. **Smoke élève passé** : états FSRS 30 → 35 après le retrait (la lecture élève survit sans la policy, l'écriture tient), et soumission Aletheia d'Elo aboutie avec son retour V1 généré sans erreur. |
| 2026-08-14 | `c7_quazian_rls_eleve_rollback.sql` | C7 · L3 — Quazian, lecture élève des flashcards | ☐ | ☐ | **rollback — n'exécuter qu'en cas de problème.** Recrée `eleve_read_flashcards` à l'identique (expression relevée sur `pg_policies` le 14/08). **Non destructif et sans effet observable** : la policy restaurée n'autorise rien — c'est tout le motif de son retrait. ⚠️ Ne « répare » donc PAS la lecture élève : si un appel devait un jour lire cette table sous l'identité d'un élève, il faudrait une policy qui parle la langue du « vu », pas celle-ci — et lire d'abord le § « choix de fond » du fichier aller. |
| 2026-08-14 | `c7_quazian_sections_rollback.sql` | C7 · L3 — Quazian, visibilité au « vu » | ☐ | ☐ | **rollback — n'exécuter qu'en cas de problème.** Retire `section_id`, son CHECK et son index. **NON destructif** (contrairement au rollback de L1) : aucune carte supprimée, aucun `quazian_card_states` touché — on ne perd qu'une précision, les cartes retombant au grain « cours entier ». Bloc de constat en tête à LIRE d'abord (il compte ce qui perd sa précision). |
| 2026-08-14 | `acces_classes_l1_retirer_inscription.sql` | Accès & classes · L1 — retrait d'un élève d'une classe | ☐ | ☐ | **Ligne créée AVANT exécution.** Reprend `retirer_inscription` (version de juin, `fix_retirer_inscription.sql`, **archive — jamais rejouée**) et l'aligne sur le schéma d'août : **une seule instruction ajoutée**, `delete from scriptorium_conversations where eleve_id = … and classe_id = …` (les messages suivent par cascade). Motif — diagnostic du 14/08 en base : la croix du Pilotage « ne retirait rien » à cause du `confirm()` natif côté code, **pas** de cette fonction ; les **12 FK pointant `inscriptions` sont toutes `on delete cascade`**, aucune ne bloque le delete, et une répétition à blanc du retrait (Sacha × T5, transaction annulée) passe sans erreur. En revanche la fonction laissait du **travail orphelin** : `scriptorium_conversations`, née en juillet (RAG L5), est scopée (élève × CLASSE) **sans `inscription_id`** → aucune cascade ne l'atteint. Prouvé par répétition à blanc (conversation + message semés sur Sacha × Test, retrait, `rollback`) : **tous deux survivaient**. Volontairement NON touchés : `api_couts` (journal de coûts, doit survivre), `aletheia_capstone` (partagé par livre), `integrite_*` (scopés par élève, pas par classe), `quazian_card_states` (branche « dernière inscription » inchangée — son `inscription_id` est NULL sur les 35 lignes existantes). **PROTOCOLE RENFORCÉ** (fonction destructive d'un flux existant) : code mergé+poussé d'abord, SQL ensuite, fenêtre calme, rollback prêt, smoke élève. Constat AVANT et vérification APRÈS dans le fichier (drapeau `scriptorium_couvert`). |
| 2026-08-14 | `acces_classes_l1_retirer_inscription_rollback.sql` | Accès & classes · L1 — retrait d'un élève d'une classe | ☐ | ☐ | **rollback — n'exécuter qu'en cas de problème.** Restaure la définition relevée sur `pg_get_functiondef` le 14/08 (état réel de la sandbox, pas une reconstitution). **Non destructif**, mais ⚠️ il REMET le trou : les conversations Scriptorium survivraient de nouveau au retrait. |
| 2026-07-23 | `c1_rls_eleve_rollback.sql` | C1 — robustesse élève (Session A) | ☐ | ☐ | **rollback — n'exécuter qu'en cas de problème.** Restaure les policies élève FOR ALL d'avant `c1_rls_eleve.sql` (aletheia_travaux, codex_travaux, quazian_sessions/answers/quiz_scores — doublons socle inclus), reconstituées d'après le dump du 23/07, et retire les SELECT-only introduites. Ne restaure **pas** `codex_sessions_eleve_read` (stricte), ni les resserrements profiles (UPDATE retirée, INSERT resserré) — les rouvrir n'apporterait rien. Requête `pg_policies` de contrôle en pied de fichier. |
|  |  |  |  |  |  |

> **Reliquats sécurité → Session B** (analysés au dump du 23/07, hors périmètre A2, décision Louis) :
> `fragments_depots` — UPDATE élève sur sa propre ligne permet de blanchir
> `photos_suspectes`/`signal_integrite` ou rétro-dater `statut` (module masqué dans le pilote
> Aletheia-only ; chemin d'écriture delete+insert user-scoped délicat → à traiter en B, pas ici).
> `quazian_card_states`/`review_log` — self-write FSRS d'auto-révision **non noté** → accepté tel quel.

> **C1 Session A — CLOSE 23/07.** Code mergé+poussé (`main` `a686f61`, déployé), SQL exécuté sandbox.
> Vérif `scripts/verif_rls_c1.mjs` : **13 PASS · 0 FAIL** — escalade `profiles` (role→prof, integrite,
> INSERT forgé) définitivement fermée ; `codex_travaux`/`aletheia_travaux` fermés confirmés. Les 7 SKIP =
> manque de données sur le compte test (pas de faille) ; la fermeture Quazian/Codex/Aletheia est garantie
> par l'atomicité de la transaction (le blocage `profiles` prouve le commit). Smoke **Aletheia OK** sur
> palimpseste.ink (planning + séance rendus → bascule des 5 lectures en admin validée).
> **Reliquat test :** smoke Quazian/Codex **différé** (bloqué par un bug de création de séance, hors C1)
> → à passer en recette C13 avec les vrais personas (le seed de démo aussi, pour ne pas polluer la base live).

---

## Archive — 57 fichiers historiques (état au 23/07 — NE JAMAIS REJOUER)

Le statut d'exécution historique n'a pas été journalisé (constat 🔴 de l'audit du 02/07). Inutile de
le reconstituer : **la base sandbox fait foi**, et le futur dump prod capturera son état exact.
Ces fichiers restent dans le repo comme trace de conception, pas comme scripts rejouables.

**⚠️ Dangers connus (ne jamais ré-exécuter, même « pour être sûr ») :**
- `review_fixes_2026-06-21.sql` — le rejouer **réintroduirait** le bug `aletheia_capstone.eleve_id`
  dans les deux RPC (constat 🔴 de l'audit).
- `codex_schema.sql` — son §5 rejoué **rétrécirait** la contrainte `quazian_flashcards.source`
  (supprimerait la valeur `'aletheia'`).
- `calendrier_c1b_cutover.sql` — a **droppé `fragments_semestres`** ; toute doc qui y fait référence
  (vieux RUNBOOK/seed) est périmée sur ce point.
- `seed_prod.sql` — n'est pas une migration : c'est le seed de config minimale du RUNBOOK (à n'utiliser
  qu'au montage de la prod, C11b).

**Fondations & classes (4)** : `lot1_classe_schema.sql` · `lot2_cycle_de_vie.sql` ·
`fix_effacer_classe.sql` · `fix_retirer_inscription.sql`

**Fragments (8)** : `lot5a_semestre.sql` · `lot5b_notation.sql` · `lot5c_themes.sql` ·
`lot5d_epreuves.sql` · `lot10_fragments_eleve.sql` · `fragments_integrite.sql` ·
`fragments_photo_seuil.sql` · `fragments_rename_essai.sql`

**Scriptorium — base (4)** : `lot6_scriptorium.sql` · `scriptorium_imports.sql` ·
`scriptorium_livre_auteur_signets.sql` · `scriptorium_suppression_unite.sql`

**Scriptorium — Parcours (6)** : `parcours_phase_a.sql` · `parcours_snapshot_horaire.sql` ·
`parcours_purge_l7_audit.sql` · `parcours_purge_l7_phase_a.sql` · `parcours_purge_l8_prep.sql` ·
`parcours_purge_l8_phase_b.sql`

**Scriptorium — Plan d'évaluation (2)** : `plan_evaluation_phase_a.sql` · `plan_evaluation_modele.sql`

**Scriptorium — RAG (3)** : `scriptorium_rag_l1.sql` · `scriptorium_rag_l5_chat.sql` ·
`scriptorium_rag_l7_syntheses.sql`

**Quazian (2)** : `lot7_quazian.sql` · `calendrier_c1c_quazian.sql`

**Codex (4)** : `codex_schema.sql` ⚠️ · `codex_consignes.sql` · `codex_synthese_lu.sql` ·
`codex_policy_brouillon.sql`

**Aletheia (11)** : `aletheia_lot1_livre.sql` · `aletheia_lot2.sql` · `aletheia_lot3.sql` ·
`aletheia_lot4.sql` · `aletheia_lot5.sql` · `aletheia_lot6.sql` · `aletheia_affinages.sql` ·
`aletheia_aides_v1.sql` · `aletheia_carte_diagnostic.sql` · `aletheia_mode_c.sql` ·
`aletheia_seance_comments.sql`

**Calendrier (7)** : `calendrier_c1a.sql` · `calendrier_c1b_cutover.sql` ⚠️ · `calendrier_c2_semaines.sql` ·
`calendrier_c7_jours_cours.sql` · `calendrier_params.sql` · `calendrier_review_fixes.sql` ·
`calendrier_config_archivage.sql`

**Intégrité (2)** : `integrite_evenements.sql` · `integrite_petits_malins.sql`

**Transverse (3)** : `api_couts.sql` *(**tranché le 25/07 (C11a) : JAMAIS exécuté** — table absente en
base, constaté par `to_regclass`. Remplacé par `c11a_api_couts.sql` au journal actif ; celui-ci reste
archivé et non rejouable)* · `retours_lus.sql` · `review_fixes_2026-06-21.sql` ⚠️

**Seed (1)** : `seed_prod.sql`

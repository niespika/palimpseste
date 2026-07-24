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
| 2026-07-23 | `c1_rls_eleve.sql` | C1 — robustesse élève (Session A) | ☐ | ☐ | RLS élève FOR ALL → SELECT-only/FERMÉ : **aletheia_travaux FERMÉ** (5 lectures basculées admin) + **codex_travaux FERMÉ** (lectures 100 % admin) ; quazian_sessions/answers/quiz_scores en SELECT own (⚠️ **drop DES DEUX policies : lot1 `*_eleve_own` + socle `eleve_own_*`**, sinon écriture reste ouverte) ; ré-assertion codex_sessions_eleve_read stricte. **+ profiles : drop `Mise à jour profil personnel` (UPDATE) = ferme l'escalade élève→prof + auto-déblocage ; INSERT `Trigger peut créer un profil` resserré à `auth.uid()=id`** (trigger `handle_new_user` SECURITY DEFINER confirmé au dump → indépendant). Calé sur le dump pg_policies du 23/07. **Protocole renforcé (règle 5)** : code C1-A **mergé+poussé d'abord** (écritures Quazian + lectures Aletheia basculées admin), SQL ensuite, fenêtre calme, smoke test élève. Retour arrière prêt : `c1_rls_eleve_rollback.sql`. |
| 2026-07-23 | `c1_rls_eleve_rollback.sql` | C1 — robustesse élève (Session A) | ☐ | ☐ | **rollback — n'exécuter qu'en cas de problème.** Restaure les policies élève FOR ALL d'avant `c1_rls_eleve.sql` (aletheia_travaux, codex_travaux, quazian_sessions/answers/quiz_scores — doublons socle inclus), reconstituées d'après le dump du 23/07, et retire les SELECT-only introduites. Ne restaure **pas** `codex_sessions_eleve_read` (stricte), ni les resserrements profiles (UPDATE retirée, INSERT resserré) — les rouvrir n'apporterait rien. Requête `pg_policies` de contrôle en pied de fichier. |
|  |  |  |  |  |  |

> **Reliquats sécurité → Session B** (analysés au dump du 23/07, hors périmètre A2, décision Louis) :
> `fragments_depots` — UPDATE élève sur sa propre ligne permet de blanchir
> `photos_suspectes`/`signal_integrite` ou rétro-dater `statut` (module masqué dans le pilote
> Aletheia-only ; chemin d'écriture delete+insert user-scoped délicat → à traiter en B, pas ici).
> `quazian_card_states`/`review_log` — self-write FSRS d'auto-révision **non noté** → accepté tel quel.

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

**Transverse (3)** : `api_couts.sql` *(statut réel inconnu — vérifié/réparé au chantier C11a)* ·
`retours_lus.sql` · `review_fixes_2026-06-21.sql` ⚠️

**Seed (1)** : `seed_prod.sql`

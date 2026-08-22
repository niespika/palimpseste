-- ============================================================================
-- C4 · L3 — RETOUR ARRIÈRE de `c4_l3_deroule.sql`.
-- ----------------------------------------------------------------------------
-- ⚠️ À LIRE D'ABORD — le bloc de CONSTAT ci-dessous compte ce qui va partir.
--    Joue-le seul, lis-le, et ne descends qu'ensuite.
--
-- ⚠️ CE QUE CE FICHIER DÉTRUIT, ET QUI NE SE RECONSTRUIT PAS :
--    · `saisie_telemetrie` — trois des sept signaux du faisceau (`06-` §6) sur
--      TOUS les dépôts déjà passés. Rien d'autre ne les porte : le rythme de
--      frappe et les sessions d'écriture ne se recalculent d'aucune façon après
--      coup, la copie ne garde pas la trace de la manière dont elle a été
--      tapée. Une convergence du faisceau devient, pour ces dépôts, indécidable.
--    · `aide_consommee` — le compteur de l'écran, sur les dépôts non encore
--      mesurés. Ceux qui SONT mesurés ont déjà vu leur valeur recopiée dans
--      `competences_mesures.aide_consommee` par la chaîne : celle-là survit.
--    · `cours_declares` et `notions` des démonstrations — perdues avec la
--      colonne ; elles se redéposent par l'import (C4-L8).
--
-- ⚠️ CE QU'IL NE FAIT PAS :
--    · Il ne touche NI `collages_bloques` NI `journaliser_collage()` — elles
--      sont à C4-L4, ce fichier ne les a jamais posées.
--    · Il ne ferme RIEN. Si le but est d'ARRÊTER le déroulé de l'élève, poser
--      `exercices_actif = false` suffit, et ce fichier n'a pas à être joué.
--    · ⚠️ TOUT LE CODE DE C4-L3 LIT CES QUATRE DONNÉES : après ce rollback, il
--      faut retirer le code aussi. La télémétrie et le compteur d'aide sont
--      écrits à chaque frappe et à chaque dépliage — leurs écritures
--      échoueront, et supabase-js NE LÈVE PAS : elles échoueront EN SILENCE.
-- ============================================================================

-- ── CONSTAT — à jouer SEUL, avant tout, et à lire ───────────────────────────
select
  (select count(*) from public.exercices_depots
    where saisie_telemetrie is not null and saisie_telemetrie <> '{}'::jsonb)
                                                          as depots_avec_telemetrie,
  (select count(*) from public.exercices_depots where aide_consommee > 0)
                                                          as depots_avec_aide,
  (select count(*) from public.exercices_depots
    where aide_consommee > 0 and id not in
      (select depot_id from public.competences_mesures where depot_id is not null))
                                                          as aide_non_encore_recopiee,
  (select count(*) from public.exercices_demonstrations
    where cours_declares is not null or notions is not null)
                                                          as demos_declarees,
  (select vf_delai_jours from public.scriptorium_params where id = 1)
                                                          as delai_vf_courant;

begin;

-- Les gardes d'abord, les colonnes ensuite : une garde qui survit à sa colonne
-- fait échouer le `drop` avec un message qui ne dit pas pourquoi.
alter table public.exercices_depots  drop constraint if exists depots_saisie_telemetrie_chk;
alter table public.exercices_depots  drop constraint if exists depots_aide_consommee_chk;
alter table public.scriptorium_params drop constraint if exists params_vf_delai_chk;

drop function if exists public.saisie_telemetrie_bien_formee(jsonb);

alter table public.exercices_depots        drop column if exists saisie_telemetrie;
alter table public.exercices_depots        drop column if exists aide_consommee;
alter table public.exercices_demonstrations drop column if exists cours_declares;
alter table public.exercices_demonstrations drop column if exists notions;
alter table public.scriptorium_params      drop column if exists vf_delai_jours;

commit;

-- ============================================================================
-- VÉRIFICATION DU RETOUR ARRIÈRE — cinq drapeaux, tous attendus à `t`.
-- ⚠️ Vérifiée PAR REQUÊTE, jamais sur la foi du mot « ROLLBACK » affiché.
-- ============================================================================
select
  not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'exercices_depots'
                 and column_name in ('saisie_telemetrie', 'aide_consommee'))
                                                          as colonnes_depot_absentes,
  not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'exercices_demonstrations'
                 and column_name in ('cours_declares', 'notions'))
                                                          as colonnes_demo_absentes,
  not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'scriptorium_params'
                 and column_name = 'vf_delai_jours')      as echeance_absente,
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public'
                 and p.proname = 'saisie_telemetrie_bien_formee')
                                                          as fonction_absente,
  -- Ce que C4-L4 a posé est INTACT : le rollback n'a pas débordé.
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'exercices_depots'
             and column_name = 'collages_bloques')
  and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname = 'journaliser_collage')
                                                          as c4l4_intact;

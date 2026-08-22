-- ============================================================================
-- C4 · L4 — LE JOURNAL DES COLLAGES : ROLLBACK. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- Écrit EN MÊME TEMPS que `c4_l4_collage_journal.sql`, AVANT son exécution —
-- « une ligne de journal atteste une intention, pas un fichier : `ls` avant de
-- te fier à une case de rollback ».
--
-- CE QU'IL DÉFAIT, DANS L'ORDRE INVERSE :
--   1. il retire `journaliser_collage()` — ⚠️ le code de C4-L4 l'appelle : après
--      ce rollback, chaque tentative de collage bloquée renverra une erreur que
--      le serveur avale (elle n'interrompt pas l'élève, cf. `depots.ts`), et
--      PLUS RIEN ne sera journalisé ;
--   2. il retire la garde `depots_collages_chk` et `collages_bien_formes()` ;
--   3. il retire la colonne `collages_bloques` — ⚠️ AVEC SON CONTENU : les
--      tentatives déjà journalisées sont PERDUES, et elles ne se reconstruisent
--      d'aucune façon (rien d'autre ne les porte : le `console.warn` du serveur
--      est parti avec les journaux de l'hébergeur).
--
-- ⚠️ Le retirer NE ferme rien et n'arrête rien : le BLOCAGE du collage vit dans
--    le navigateur (`EcranEleve.tsx`), pas ici. Ce fichier n'ôte que la trace.
-- ============================================================================

begin;

drop function if exists public.journaliser_collage(uuid, text);

alter table public.exercices_depots drop constraint if exists depots_collages_chk;

drop function if exists public.collages_bien_formes(jsonb);

alter table public.exercices_depots drop column if exists collages_bloques;

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Trois drapeaux, tous attendus à `t`.
-- ============================================================================
select
  not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'exercices_depots'
                 and column_name = 'collages_bloques')                 as colonne_retiree,
  not exists (select 1 from pg_constraint where conname = 'depots_collages_chk')
                                                                       as garde_retiree,
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public'
                 and p.proname in ('collages_bien_formes', 'journaliser_collage'))
                                                                       as fonctions_retirees;

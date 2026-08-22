-- ============================================================================
-- ROLLBACK de `securite_rpc_definer.sql` — N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️⚠️ CE FICHIER ROUVRE UNE FAILLE. Ce n'est pas une formule de prudence :
-- il rend à `anon` et à `authenticated` le droit d'exécuter des fonctions
-- `security definer` QUI NE VÉRIFIENT PAS LEUR APPELANT, dont deux qui
-- SUPPRIMENT LE TRAVAIL DES ÉLÈVES (`effacer_classe`, `retirer_inscription` —
-- `quazian_answers`, `codex_travaux`, `aletheia_travaux`).
--
-- AVANT DE LE JOUER, POSE-TOI LA BONNE QUESTION. Le fichier d'origine ne
-- retire de droits qu'à `anon` et `authenticated`, et l'application n'appelle
-- ces fonctions QUE par le client admin (`service_role`), qui conserve les
-- siens. Une panne apparue après son exécution vient donc, presque à coup sûr,
-- d'un appelant qu'on n'avait pas recensé — un script, un outil, un écran qui
-- passerait par la session de l'utilisateur au lieu du client admin.
--
-- LE BON RÉFLEXE N'EST PAS CE FICHIER : c'est de TROUVER l'appelant et de le
-- faire passer par `service_role`. Rouvrir à toute la Terre pour débloquer un
-- appelant vaut bien moins que de corriger l'appelant.
--
-- Si tu le joues quand même, joue-le en connaissance de cause, et REFERME dès
-- que l'appelant est corrigé.
--
-- `est_prof` n'apparaît pas ici : le fichier d'origine ne l'a jamais touchée
-- (19 policies RLS l'appellent — elle doit rester exécutable par
-- `authenticated`).
-- ============================================================================

begin;

grant execute on function public.effacer_classe(uuid)
  to anon, authenticated;
grant execute on function public.retirer_inscription(uuid)
  to anon, authenticated;
grant execute on function public.poser_statut_recette(text, text, timestamptz)
  to anon, authenticated;
grant execute on function public.poser_statut_recette_monitoring(text, timestamptz)
  to anon, authenticated;
-- ⚠️⚠️ CETTE LIGNE ÉCHOUERA — et c'est voulu. `handle_new_user()` a été
--    RETIRÉE de la base le 21/08 (`securite_handle_new_user_retrait.sql`),
--    parce qu'elle était du code mort : 0 trigger, 0 appelant, 0 policy.
--    `function public.handle_new_user() does not exist` est donc le
--    comportement NORMAL de ce fichier depuis cette date.
--    ⇒ Si tu joues ce rollback, RETIRE cette ligne d'abord. Et si tu veux
--      vraiment la fonction, c'est l'autre rollback qu'il faut :
--      `securite_handle_new_user_retrait_rollback.sql`, qui la recrée ET
--      la referme dans la même transaction.
-- grant execute on function public.handle_new_user()
--   to anon, authenticated;

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — retour à l'état d'AVANT le correctif,
-- c'est-à-dire À L'ÉTAT VULNÉRABLE. Attendu : `t | t` partout.
-- ============================================================================
-- select p.proname,
--        has_function_privilege('anon',          p.oid, 'EXECUTE') as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as eleve
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.prosecdef
-- order by p.proname;

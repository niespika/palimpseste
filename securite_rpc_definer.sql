-- ============================================================================
-- SÉCURITÉ — LES FONCTIONS `security definer` EXPOSÉES PAR POSTGREST.
-- Trouvé par la revue adversariale bornée de C4-L8, le 21/08/2026.
-- ----------------------------------------------------------------------------
-- LE DÉFAUT. Supabase pose, au montage du projet :
--     alter default privileges in schema public
--       grant all on functions to postgres, anon, authenticated, service_role;
-- Toute fonction créée dans `public` naît donc avec un grant EXECUTE **DIRECT**
-- pour `anon` et `authenticated`. Un `revoke ... from public` NE LE RETIRE PAS :
-- `public` est le pseudo-rôle « tout le monde », pas la liste des rôles nommés.
-- Et PostgREST publie toute fonction de `public` en `/rest/v1/rpc/<nom>`.
--
-- CONSTAT DU 21/08, par `has_function_privilege` :
--     effacer_classe                  | anon: t | authenticated: t
--     retirer_inscription             | anon: t | authenticated: t
--     poser_statut_recette            | anon: t | authenticated: t
--     poser_statut_recette_monitoring | anon: t | authenticated: t
--     handle_new_user                 | anon: t | authenticated: t
--     est_prof                        | anon: t | authenticated: t
--     chaine_depense_du_mois          | anon: f | authenticated: f   <── la preuve
-- `chaine_depense_du_mois` (C4-L5) est la SEULE dont le revoke nommait
-- `public, anon, authenticated` — et la seule fermée. Le reste du dépôt a écrit
-- `from public` seul, et croyait fermer.
--
-- CE QUE ÇA OUVRE. Ces fonctions sont `security definer` et NE VÉRIFIENT PAS
-- LEUR APPELANT (aucun `auth.uid()`, aucune lecture de `profiles.role`) : le
-- grant était leur seule protection.
--   · `effacer_classe(uuid)` et `retirer_inscription(uuid)` SUPPRIMENT le
--     travail des élèves — `quazian_answers`, `quazian_sessions`,
--     `quazian_quiz_scores`, `codex_travaux`, `aletheia_travaux`.
--   · `poser_statut_recette*` réécrit `statut_recette` pour TOUTE la cohorte, et
--     `differee` éteint l'évaluation sans franchir aucun plancher mécanique.
-- La clé `anon` vit dans le bundle du navigateur : elle n'est pas un secret.
--
-- ⚠️ `est_prof()` N'EST PAS RÉVOQUÉE, ET C'EST VOULU : **19 policies RLS
--    l'appellent** (constaté par requête sur `pg_policies`). La fermer à
--    `authenticated` empêcherait l'évaluation des policies et casserait la
--    sécurité au lieu de la renforcer. Elle ne rend qu'un booléen « suis-je
--    prof », ne lit rien de sensible et n'écrit rien.
--
-- PORTÉE. Ce fichier ne touche QUE des privilèges : aucune table, aucune
-- donnée, aucune policy, aucun schéma. Il RETIRE des droits — il ne peut pas
-- ouvrir ce qui est fermé. Les quatre fonctions ne sont appelées, dans toute
-- l'application, que par le client admin (`service_role`) :
--   app/prof/classes/actions.ts:82 et :243
--   app/prof/competences/actions.ts:157 et :172
-- `service_role` conserve son droit : le professeur ne perd RIEN.
--
-- Retour arrière : `securite_rpc_definer_rollback.sql` (qui ROUVRE le trou).
-- ============================================================================

begin;

-- ── Les deux destructrices (antérieures à C4-L8) ────────────────────────────
revoke all on function public.effacer_classe(uuid)
  from public, anon, authenticated;
revoke all on function public.retirer_inscription(uuid)
  from public, anon, authenticated;

-- ── Les deux de C4-L8, dont le revoke ne nommait que `public` ───────────────
revoke all on function public.poser_statut_recette(text, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.poser_statut_recette_monitoring(text, timestamptz)
  from public, anon, authenticated;

-- ── La fonction de trigger : un trigger n'exige pas d'EXECUTE à la volée ────
-- (le privilège se contrôle à la CRÉATION du trigger, pas à son
--  déclenchement) — la fermer ne peut pas empêcher l'inscription d'un compte.
revoke all on function public.handle_new_user()
  from public, anon, authenticated;

-- ── Ce dont l'application a réellement besoin ───────────────────────────────
grant execute on function public.effacer_classe(uuid)                                to service_role;
grant execute on function public.retirer_inscription(uuid)                           to service_role;
grant execute on function public.poser_statut_recette(text, text, timestamptz)       to service_role;
grant execute on function public.poser_statut_recette_monitoring(text, timestamptz)  to service_role;

-- ── LA DETTE, à ne pas oublier : le grant n'est qu'une serrure extérieure ───
-- Une fonction `security definer` devrait vérifier son appelant ELLE-MÊME, pour
-- rester close même si un privilège est reposé un jour par mégarde (une
-- migration future qui recrée la fonction la fera renaître grantée). La garde
-- interne à écrire, fonction par fonction, dans un lot ultérieur :
--     if not exists (select 1 from profiles
--                    where id = auth.uid() and role = 'prof') then
--       raise exception 'Réservé au professeur';
--     end if;
-- Ce fichier ne la pose PAS : recréer cinq fonctions d'un flux existant n'est
-- pas une opération de fenêtre calme, et le revoke suffit à fermer aujourd'hui.

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — à jouer telle quelle.
-- Attendu : `est_prof` seule à `t | t` ; TOUTES les autres à `f | f`.
-- ============================================================================
-- select p.proname,
--        has_function_privilege('anon',          p.oid, 'EXECUTE') as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as eleve,
--        has_function_privilege('service_role',  p.oid, 'EXECUTE') as service
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.prosecdef
-- order by p.proname;

-- ============================================================================
-- ROLLBACK de `securite_search_path_reste.sql` — N'EXÉCUTER QU'EN CAS DE
-- PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️ CE QU'IL ROUVRE est petit, et il faut le dire exactement : il remet
-- `pg_temp` **implicitement en premier** dans le chemin de résolution de cinq
-- fonctions `security definer`. Ce n'est pas exploitable aujourd'hui — elles
-- sont fermées à `anon` et à `authenticated`, et planter un objet leurre dans
-- `pg_temp` supposerait d'être déjà `service_role`. Mais c'est un retour en
-- arrière sur une doctrine, pas une correction.
--
-- AVANT DE LE JOUER, POSE-TOI LA BONNE QUESTION. Le fichier d'origine ne fait
-- que **nommer `pg_temp` en dernier** — il ne retire aucun droit, ne recrée
-- aucune fonction, ne touche aucune donnée. Une panne apparue après lui ne
-- peut venir que d'un cas : **une de ces fonctions résolvait un objet HORS de
-- `public`** — un schéma d'extension, un objet temporaire qu'elle créait
-- elle-même.
--
-- LE BON RÉFLEXE N'EST ALORS PAS CE FICHIER : c'est d'**AJOUTER le schéma
-- manquant** au `search_path` de la seule fonction concernée, en gardant
-- `pg_temp` en dernier. Par exemple :
--     alter function public.<nom>(<args>) set search_path = public, extensions, pg_temp;
--
-- ⚠️ CE FICHIER NE TOUCHE À AUCUN PRIVILÈGE, comme l'original. Le `revoke` de
--    `securite_rpc_definer.sql` (21/08) reste en place.
--
-- ⚠️ IL NE TOUCHE PAS NON PLUS `est_prof()` NI `handle_new_user()` : elles ont
--    reçu leur `search_path` par `securite_vue_et_search_path.sql`, et c'est
--    l'autre rollback qui les concerne.
-- ============================================================================

begin;

alter function public.chaine_depense_du_mois(timestamp with time zone)
  set search_path = public;

alter function public.effacer_classe(uuid)
  set search_path = public;

alter function public.poser_statut_recette(text, text, timestamp with time zone)
  set search_path = public;

alter function public.poser_statut_recette_monitoring(text, timestamp with time zone)
  set search_path = public;

alter function public.retirer_inscription(uuid)
  set search_path = public;

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — retour à l'état d'AVANT : cinq fonctions à
-- `search_path=public`, deux à `search_path=public, pg_temp`, et les
-- privilèges INCHANGÉS.
-- ============================================================================
-- select p.oid::regprocedure::text                                    as signature,
--        coalesce(array_to_string(p.proconfig, ' | '), '-- aucun --')  as config,
--        has_function_privilege('anon',          p.oid, 'EXECUTE')     as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE')     as authenticated
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.prosecdef
--  order by p.proname;

-- ============================================================================
-- SÉCURITÉ — LES CINQ FONCTIONS QUI PORTAIENT `search_path = public` SEUL.
-- Trouvé au constat du 21/08, en jouant `securite_vue_et_search_path.sql` —
-- une trouvaille NON PRÉDITE : le balayage demandait le `proconfig` de TOUTES
-- les fonctions `security definer`, pas seulement des deux qu'on nommait.
-- ----------------------------------------------------------------------------
-- LE DÉFAUT, ET IL EST SUBTIL. `set search_path = public` a l'air d'un
-- durcissement. Il n'en est pas tout à fait un : **quand `pg_temp` n'est pas
-- NOMMÉ dans le chemin, PostgreSQL le cherche IMPLICITEMENT EN PREMIER**. Un
-- `search_path` qui vaut `public` seul laisse donc le schéma temporaire DEVANT
-- `public` — c'est-à-dire précisément le trou qu'on croyait boucher. La parade
-- que documente `CREATE FUNCTION` est de le nommer EN DERNIER :
--     « forcing the temporary schema to be searched last ».
--
-- ⚠️ NON EXPLOITABLE AUJOURD'HUI, et il faut le dire aussi nettement que le
-- défaut. Les cinq fonctions sont **fermées à `anon` et à `authenticated`**
-- (`securite_rpc_definer.sql`, 21/08 — vérifié au même constat : `f | f` sur
-- les cinq). Seul `service_role` peut les appeler ; or planter un objet leurre
-- dans `pg_temp` suppose d'ouvrir une session et d'y créer une table
-- temporaire — donc d'être déjà `service_role`. **L'attaque supposerait ce
-- qu'elle cherche à obtenir.**
--
-- ALORS POURQUOI LE FAIRE ? Pas pour le risque : **pour la doctrine**. Depuis
-- le 21/08, la base porte DEUX FORMES de `search_path` sur des objets de même
-- nature — `public, pg_temp` sur deux fonctions, `public` sur cinq. *Une règle
-- écrite à deux endroits diverge* ; et le jour où l'une de ces cinq est
-- re-grantée par mégarde — ce que la dette du `securite_rpc_definer.sql` dit
-- explicitement possible —, c'est la forme faible qui sera en place.
--
-- ----------------------------------------------------------------------------
-- PORTÉE. Ce fichier ne touche NI table, NI donnée, NI policy, NI privilège.
-- Il change **une option**, sur cinq fonctions, par `alter function`.
--
-- ⚠️⚠️ `alter function`, ET SURTOUT PAS `create or replace` — la règle de la
-- maison depuis le 21/08 : Supabase pose au montage un `alter default
-- privileges … grant all on functions to anon, authenticated`, donc recréer
-- une fonction de `public` la fait RENAÎTRE GRANTÉE. `alter … set` ne touche
-- aucun privilège : le `revoke` du 21/08 tient.
--
-- ⚠️ LES SIGNATURES SONT CELLES DU CATALOGUE, relevées le 21/08 par
-- `p.oid::regprocedure` — pas recopiées d'un fichier de migration, qui pourrait
-- avoir divergé :
--     chaine_depense_du_mois(timestamp with time zone)
--     effacer_classe(uuid)
--     poser_statut_recette(text, text, timestamp with time zone)
--     poser_statut_recette_monitoring(text, timestamp with time zone)
--     retirer_inscription(uuid)
--
-- ⚠️ `est_prof()` et `handle_new_user()` NE SONT PAS ICI : elles portent déjà
-- `public, pg_temp` depuis `securite_vue_et_search_path.sql`.
--
-- LA DETTE, inchangée : le `search_path` reste une serrure EXTÉRIEURE. Une
-- fonction `security definer` devrait vérifier son appelant elle-même. Cette
-- garde interne n'est toujours pas écrite — elle exigerait de recréer les
-- fonctions, avec le piège des privilèges ci-dessus.
--
-- Retour arrière : `securite_search_path_reste_rollback.sql`.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- CONSTAT AVANT — à jouer d'abord. Attendu, écrit AVANT de jouer :
--   · SEPT fonctions `security definer` dans `public` ;
--   · `est_prof` et `handle_new_user` à `search_path=public, pg_temp` ;
--   · LES CINQ AUTRES à `search_path=public` — et à `anon: f | authenticated: f`.
-- ⚠️ Si l'une des cinq est à `t` sur `anon` ou `authenticated`, ARRÊTER : le
--    `revoke` du 21/08 aurait été défait, et c'est CELA qu'il faut traiter
--    d'abord.
-- ════════════════════════════════════════════════════════════════════════════
-- select p.oid::regprocedure::text                                    as signature,
--        coalesce(array_to_string(p.proconfig, ' | '), '-- aucun --')  as config,
--        has_function_privilege('anon',          p.oid, 'EXECUTE')     as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE')     as authenticated,
--        has_function_privilege('service_role',  p.oid, 'EXECUTE')     as service_role
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.prosecdef
--  order by p.proname;
-- ════════════════════════════════════════════════════════════════════════════


begin;

alter function public.chaine_depense_du_mois(timestamp with time zone)
  set search_path = public, pg_temp;

alter function public.effacer_classe(uuid)
  set search_path = public, pg_temp;

alter function public.poser_statut_recette(text, text, timestamp with time zone)
  set search_path = public, pg_temp;

alter function public.poser_statut_recette_monitoring(text, timestamp with time zone)
  set search_path = public, pg_temp;

alter function public.retirer_inscription(uuid)
  set search_path = public, pg_temp;

commit;


-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — à jouer telle quelle.
-- Attendu : **les SEPT** fonctions à `search_path=public, pg_temp`, et
-- **AUCUN privilège n'a bougé** — `est_prof` seule à `t | t`, les six autres
-- à `f | f`, toutes à `service_role: t`.
-- ⚠️ Le contrôle qui compte n'est pas « sept lignes » : c'est **zéro ligne**
--    dans la seconde requête, celle qui cherche ce qui DIVERGE encore.
-- ============================================================================
-- select p.oid::regprocedure::text                                    as signature,
--        coalesce(array_to_string(p.proconfig, ' | '), '-- aucun --')  as config,
--        has_function_privilege('anon',          p.oid, 'EXECUTE')     as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE')     as authenticated,
--        has_function_privilege('service_role',  p.oid, 'EXECUTE')     as service_role
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.prosecdef
--  order by p.proname;
--
-- select count(*) as fonctions_qui_divergent_encore
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.prosecdef
--    and coalesce(array_to_string(p.proconfig, ','), '') is distinct from 'search_path=public, pg_temp';
--   -- attendu : 0

-- ============================================================================
-- ROLLBACK de `securite_vue_et_search_path.sql` — N'EXÉCUTER QU'EN CAS DE
-- PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️⚠️ CE FICHIER ROUVRE UN CONTOURNEMENT DE RLS **ET REND À `anon` LE DROIT DE
-- LIRE LA VUE**. Ce n'est pas une formule de prudence : il rend à
-- `assiduite_hebdo_classe` le pouvoir de s'exécuter avec les droits de son
-- PROPRIÉTAIRE — donc de traverser les policies de `assiduite_hebdo` et
-- d'`inscriptions` sans les faire jouer — et il rouvre cette vue au rôle `anon`,
-- dont la clé vit dans le bundle du navigateur. **Les deux tours de clef sont
-- rendus d'un coup.**
--
-- AVANT DE LE JOUER, POSE-TOI LA BONNE QUESTION. Le fichier d'origine ne fait
-- que trois choses, et deux d'entre elles ne retirent de droit à personne :
--   · il fait jouer la RLS sur une vue que PERSONNE ne lit (0 occurrence dans
--     tout le code, 0 ligne en base au 21/08) ;
--   · il fixe le `search_path` de deux fonctions, PAR `alter function` — donc
--     sans toucher un seul privilège ;
--   · il retire à `anon` — et à `anon` SEUL — les droits sur cette vue.
--     `authenticated` et `service_role` gardent les leurs.
-- Une panne apparue après son exécution ne peut donc PRESQUE PAS en venir.
-- Trois cas seulement sont concevables, et chacun a un meilleur remède que ce
-- fichier :
--   1. **Un écran prof rend 0 ligne** (au lieu d'échouer) → la RLS
--      d'`assiduite_hebdo` ne reconnaît pas ce professeur. LE BON RÉFLEXE est
--      de regarder la policy `assiduite_hebdo_prof_all`, pas de rouvrir la vue.
--   2. **Un appel rend « permission denied » sur la vue** → il passe par la clé
--      ANONYME là où il devrait passer par une session authentifiée ou par le
--      client admin. LE BON RÉFLEXE est de corriger l'appelant. *Rouvrir à
--      toute la Terre pour débloquer un appelant vaut bien moins que de
--      corriger l'appelant.*
--   3. **Une fonction ne trouve plus un objet hors de `public`** (un schéma
--      d'extension, par exemple) → LE BON RÉFLEXE est d'AJOUTER ce schéma au
--      `search_path`, **`pg_temp` restant en dernier**, pas de retirer le
--      `search_path`.
--
-- Si tu le joues quand même, joue-le en connaissance de cause, et REFERME dès
-- que la cause est trouvée.
--
-- ⚠️ CE FICHIER NE TOUCHE À AUCUN PRIVILÈGE SUR LES FONCTIONS. En particulier
--    il ne re-grante rien : le `revoke` de `securite_rpc_definer.sql` (21/08)
--    reste en place, et `handle_new_user` reste injoignable par `anon`. Pour
--    défaire CELA — ce qu'il ne faut pas faire —, c'est l'autre rollback.
--
-- ⚠️ LE `grant all … to anon` CI-DESSOUS SUPPOSE QUE C'ÉTAIT L'ÉTAT D'AVANT.
--    C'est ce que pose Supabase au montage (`alter default privileges … grant
--    all on tables to anon, authenticated`), et c'est ce que la requête (2) du
--    constat d'AVANT doit avoir confirmé : SELECT/INSERT/UPDATE/DELETE à `t`.
--    **Si le constat disait autre chose, N'EXÉCUTE PAS cette ligne telle
--    quelle** — rends exactement ce qui était là, ni plus, ni moins.
--
-- ⚠️ IL N'Y A PAS DE `reset (security_invoker)` UTILE ICI : `set
--    (security_invoker = false)` et `reset (security_invoker)` rendent le même
--    comportement (droits du propriétaire). On écrit `= false` EXPRESSÉMENT,
--    pour que l'état d'après soit LISIBLE dans `pg_class.reloptions` au lieu
--    d'être une absence — une absence ne dit pas si quelqu'un a décidé, ou si
--    personne n'y a pensé. C'est la seule différence avec l'état d'avant le
--    correctif, et elle est en faveur de la lisibilité.
-- ============================================================================

begin;

-- ── La vue redevient exécutée avec les droits de son propriétaire ───────────
-- ⚠️ C'EST LE CONTOURNEMENT DE RLS QU'ON REPOSE.
alter view public.assiduite_hebdo_classe set (security_invoker = false);

-- ── Et `anon` redevient capable de la lire ──────────────────────────────────
-- ⚠️ C'EST LE SECOND TOUR DE CLEF QU'ON REND. Voir le ⚠️ de l'en-tête sur ce
--    que `all` suppose.
grant all on public.assiduite_hebdo_classe to anon;

-- ── Les deux fonctions reperdent leur `search_path` ─────────────────────────
-- `reset` retire l'option et remet `proconfig` à NULL — l'état exact d'avant.
alter function public.est_prof()        reset search_path;
alter function public.handle_new_user() reset search_path;

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — retour à l'état d'AVANT le correctif,
-- c'est-à-dire À L'ÉTAT CONTOURNABLE ET LISIBLE PAR `anon`.
-- Attendu : `security_invoker` = « false » sur la vue ; `anon_lit` = t ;
-- `— aucun —` en config sur les deux fonctions ; et les privilèges sur les
-- FONCTIONS inchangés (`est_prof` à `t | t`, `handle_new_user` à `f | f`).
-- ============================================================================
-- select c.relname as vue,
--        coalesce((select option_value from pg_options_to_table(c.reloptions)
--                   where option_name = 'security_invoker'), '— non posé —') as security_invoker,
--        has_table_privilege('anon',          c.oid, 'SELECT') as anon_lit,
--        has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_lit
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'public' and c.relkind in ('v','m') order by 1;
--
-- select p.proname,
--        coalesce(array_to_string(p.proconfig, ' | '), '— aucun —')  as config,
--        has_function_privilege('anon',          p.oid, 'EXECUTE')   as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE')   as authenticated
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.prosecdef order by p.proname;

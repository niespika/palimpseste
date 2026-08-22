-- ============================================================================
-- ROLLBACK de `securite_handle_new_user_retrait.sql` — il RECRÉE
-- `handle_new_user()`, à l'identique.
-- ----------------------------------------------------------------------------
-- LA SOURCE CI-DESSOUS N'EST PAS RECOPIÉE D'UN FICHIER DE MIGRATION : elle est
-- celle que `pg_get_functiondef()` a rendue **le 21/08, juste avant la
-- suppression**, sur la fonction telle qu'elle vivait en base. C'est la seule
-- version qui fasse foi — un fichier de migration peut avoir divergé, la base
-- non.
--
-- ⚠️⚠️ LE PIÈGE DE CE FICHIER, ET IL EST SÉRIEUX : **recréer une fonction dans
-- `public` la fait RENAÎTRE GRANTÉE à `anon` et `authenticated`.** Supabase
-- pose au montage un `alter default privileges in schema public grant all on
-- functions to postgres, anon, authenticated, service_role` — c'est le trou
-- que `securite_rpc_definer.sql` a refermé le 21/08, et un `create` nu le
-- rouvrirait **en silence**. C'est précisément le mode de panne que la dette du
-- 21/08 annonçait : *« une migration future qui recrée la fonction la fera
-- renaître grantée »*.
-- **D'où le `revoke` qui suit immédiatement le `create`, dans la MÊME
-- transaction.** Ne jamais séparer les deux.
--
-- AVANT DE LE JOUER, POSE-TOI LA BONNE QUESTION. Le fichier d'origine supprime
-- une fonction dont le constat a montré qu'elle n'avait **aucun appelant** :
-- 0 trigger, 0 fonction, 0 policy, 0 dépendance de catalogue. Si quelque chose
-- casse après lui, ce n'est **presque à coup sûr pas lui** — cherche d'abord
-- ailleurs. Le seul chemin concevable serait un trigger sur `auth.users`
-- recréé entre-temps par une autre main.
--
-- Et si tu la recrées vraiment : **elle redevient une fonction `security
-- definer` sans contrôle d'appelant**. Le geste qui manque — et qui manquait
-- déjà — est celui de la dette :
--     if not exists (select 1 from profiles
--                    where id = auth.uid() and role = 'prof') then
--       raise exception 'Réservé au professeur';
--     end if;
-- Ce fichier ne le pose PAS : un rollback restaure, il n'améliore pas.
-- ============================================================================

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
  begin
    insert into public.profiles (id, role, display_name)
    values (
      new.id,
      coalesce(
        (new.raw_user_meta_data->>'role')::role_utilisateur,
        'eleve'
      ),
      coalesce(new.raw_user_meta_data->>'display_name', new.email)
    );
    return new;
  end;
$function$;

-- ⚠️ INDISSOCIABLE DU `create` CI-DESSUS. Sans cette ligne, la fonction renaît
--    exécutable par `anon` — dont la clé vit dans le bundle du navigateur.
revoke all on function public.handle_new_user() from public, anon, authenticated;

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — la fonction existe de nouveau, ET ELLE EST
-- FERMÉE.
-- Attendu : une ligne, `search_path=public, pg_temp`, **`anon: f` et
-- `authenticated: f`**, `service_role: t`.
-- ⚠️ SI `anon` OU `authenticated` REND `t`, LE `revoke` N'A PAS PRIS — le trou
--    du 21/08 est rouvert. Rejouer le `revoke` avant toute autre chose.
-- ============================================================================
-- select p.oid::regprocedure::text                                    as signature,
--        coalesce(array_to_string(p.proconfig, ' | '), '-- aucun --')  as config,
--        has_function_privilege('anon',          p.oid, 'EXECUTE')     as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE')     as authenticated,
--        has_function_privilege('service_role',  p.oid, 'EXECUTE')     as service_role
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname = 'handle_new_user';
--
-- -- ⚠️ Et la recréer NE LA RATTACHE À AUCUN TRIGGER : elle redevient ce
-- --   qu'elle était, c'est-à-dire du code mort.
-- select count(*) as triggers_qui_l_appellent
--   from pg_trigger t
--  where not t.tgisinternal and t.tgfoid = 'public.handle_new_user()'::regprocedure;
--   -- attendu : 0

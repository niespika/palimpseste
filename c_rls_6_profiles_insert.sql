-- ============================================================================
-- C-RLS-6 — `profiles` cesse d'accepter une insertion directe : l'escalade de
-- rôle est murée. Campagne C (revue RLS), constat 6. Écrit le 2026-08-29.
-- ----------------------------------------------------------------------------
-- ⛔ LE DÉFAUT. La policy « Trigger peut créer un profil » a pour seul
--    `with_check` : `(auth.uid() = id)`. Elle borne l'IDENTITÉ, jamais la
--    VALEUR de `role`. Un compte authentifié SANS ligne `profiles` peut donc
--    s'insérer lui-même avec `role:'prof'` et devenir professeur.
--    ⭐ Mesuré, pas déduit : l'escalade a été jouée en bac à sable — `INSERT 0 1`,
--    `est_prof()` passe à `true`, et les deux policies prof s'ouvrent du même
--    coup, dont « Prof modifie tous les profils » (UPDATE sur TOUS les profils).
--
-- ⛔⛔ ET LE TRIGGER DU NOM N'EXISTE PLUS. `handle_new_user` a été retiré
--     (`securite_handle_new_user_retrait.sql`) : `pg_trigger` sur `auth.users`
--     rend **0 ligne dans les deux bases**. Tout compte naît donc ORPHELIN, et
--     c'est une seconde instruction applicative — non la base — qui lui pose son
--     profil. La policy porte le nom d'un mécanisme mort.
--
-- ⭐ CE QUI REND LE GESTE GRATUIT, ET C'EST LA MESURE QUI COMMANDE :
--    sur **162** occurrences de `from('profiles')` dans le dépôt, il y a
--    exactement **TROIS insert** — `app/prof/eleves/actions.ts:122`, `:157`,
--    `:294` — et **tous les trois tournent sur `createAdminClient()`**, qui
--    contourne la RLS. Aucun `upsert`. La policy ne sert donc **aucun** chemin
--    applicatif : ni la création d'élève, ni l'invitation, ni l'import CSV.
--
-- ⛔ CE FICHIER CORRIGE UNE FAUSSETÉ ÉCRITE DANS LE DÉPÔT.
--    `securite_handle_new_user_retrait.sql:51-55` affirme que cette policy
--    « sert toujours — c'est elle qui autorise l'insertion du profil au moment
--    de la création de compte ». **C'est faux**, et un lecteur qui s'y fierait
--    renoncerait au présent correctif.
--
-- ⚠️ LES 63 COMPTES EXISTANTS NE SONT PAS CONCERNÉS — mesuré : `UPDATE 0` et
--    `DELETE 0` sur autrui, dans les deux bases. Le défaut ne vise que les
--    comptes FUTURS ou orphelins. Et il n'y a **0 orphelin** aujourd'hui.
--
-- ⚠️ LA PORTE D'ENTRÉE DIVERGE ENTRE LES BASES, ET ELLE N'EST PAS DANS LE DÉPÔT :
--    `disable_signup` vaut **false en bac à sable** (inscription publique
--    OUVERTE, et la clé anon est par construction publique) et **true en
--    production**. C'est un réglage du tableau de bord Supabase — zéro
--    occurrence dans le dépôt, aucune ligne de `SUIVI_SQL.md`. **Ce correctif
--    mure la porte quel que soit l'état de ce bouton**, ce qui est précisément
--    son intérêt : il ne dépend plus d'un réglage que rien ne surveille.
--
-- ⚠️ ORDRE : **SQL SEUL, AUCUN CODE** (règle R6, protocole renforcé — `profiles`
--    est une table VIVANTE du flux auth, 63 comptes en prod, 18 en bac à sable).
--    La migration est INERTE pour le code déployé, qui n'insère qu'en admin.
--
-- Retour arrière : `c_rls_6_profiles_insert_rollback.sql` (il ROUVRE l'escalade).
-- ============================================================================

begin;

-- ── Constat de tête ───────────────────────────────────────────────────────
do $$
declare
  v_policies text;
  v_comptes bigint;
  v_orphelins bigint;
  v_profs bigint;
begin
  select string_agg(policyname || ' (' || cmd || ')', ', ' order by cmd, policyname)
    into v_policies from pg_policies where tablename = 'profiles';
  select count(*) into v_comptes from profiles;
  select count(*) into v_orphelins from auth.users u
    left join profiles p on p.id = u.id where p.id is null;
  select count(*) into v_profs from profiles where role = 'prof';
  raise notice 'AVANT — policies : %', v_policies;
  raise notice 'AVANT — % profils, dont % prof · % compte(s) auth SANS profil', v_comptes, v_profs, v_orphelins;
end $$;

-- ── Le geste ──────────────────────────────────────────────────────────────
drop policy if exists "Trigger peut créer un profil" on profiles;

-- ── Contrôle de pied — il s'exécute AVANT le commit ──────────────────────
do $$
declare
  v_insert int;
  v_reste int;
  v_comptes bigint;
  v_profs bigint;
  v_rls boolean;
begin
  -- ⭐ Le drapeau qui compte : plus AUCUNE policy n'autorise une insertion.
  --    On le mesure sur le `cmd`, pas sur le nom — une seconde policy INSERT
  --    oubliée compterait ici. (C'est la leçon de C-RLS-4 : les policies
  --    permissives sont OR'ées, en retirer une n'en ferme pas deux.)
  select count(*) into v_insert from pg_policies
   where tablename = 'profiles' and cmd in ('INSERT', 'ALL');
  select count(*) into v_reste from pg_policies where tablename = 'profiles';
  select count(*) into v_comptes from profiles;
  select count(*) into v_profs from profiles where role = 'prof';
  select relrowsecurity into v_rls from pg_class where relname = 'profiles';

  raise notice 'APRÈS — % policy(ies) restantes, dont % autorisant un INSERT', v_reste, v_insert;
  raise notice 'APRÈS — % profils, dont % prof · RLS : %', v_comptes, v_profs, v_rls;

  if v_insert <> 0 then
    raise exception 'ÉCHEC — % policy(ies) autorisent encore une insertion directe', v_insert;
  end if;
  if v_reste <> 3 then
    raise exception 'ÉCHEC — % policies restantes, 3 attendues (les 2 SELECT et l''UPDATE prof)', v_reste;
  end if;
  if not v_rls then
    raise exception 'ÉCHEC — RLS désactivée sur profiles';
  end if;
  raise notice '✅ les trois drapeaux sont bons.';
end $$;

commit;

-- ⭐ L'épreuve par l'échec se joue APRÈS, hors transaction, dans la peau d'un
--    compte orphelin : créer un compte, tenter le POST `/rest/v1/profiles` avec
--    `role:'prof'`, et constater le refus. Un contrôle en SQL dit l'état des
--    policies ; il ne dit pas ce que PostgREST rend.

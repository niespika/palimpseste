-- ============================================================================
-- C-RLS-6 — RETOUR ARRIÈRE : `profiles` réaccepte une insertion directe.
-- ----------------------------------------------------------------------------
-- ⛔⛔ CE FICHIER ROUVRE L'ESCALADE DE RÔLE. Il repose la policy telle qu'elle
--     était, `with_check (auth.uid() = id)` — qui borne l'identité et **jamais
--     la valeur de `role`**. La rejouer, c'est rendre à tout compte authentifié
--     sans profil le pouvoir de se déclarer professeur, et d'ouvrir du même
--     coup « Prof lit tous les profils » et « Prof modifie tous les profils ».
--
-- ⚠️ QUAND SERVIRAIT-IL VRAIMENT ? Seulement si un chemin applicatif se mettait
--    à insérer un profil avec le client de l'UTILISATEUR. Aujourd'hui aucun ne
--    le fait — les trois insert du dépôt passent par le client service-role.
--    **Si ce jour arrive, le bon geste n'est PAS ce fichier** : c'est de reposer
--    une policy qui contraint AUSSI le rôle, soit
--        with check (auth.uid() = id and role = 'eleve')
--    ce qui ferme l'escalade tout en rouvrant le chemin. Ce rollback-ci ne rend
--    que l'état d'AVANT, défaut compris — c'est son unique objet.
--
-- ⚠️ Rien d'autre n'est touché : aucune donnée, aucune colonne, aucun droit,
--    aucun interrupteur. Les trois autres policies n'ont jamais bougé.
-- ============================================================================

-- ── Constat de tête — À JOUER AVANT, hors transaction ────────────────────
-- Il dit ce que la réouverture expose : combien de comptes pourraient s'en
-- servir aujourd'hui. *Un retour arrière qu'on joue sans savoir ce qu'il rouvre
-- n'est pas un retour arrière.*
select
  (select count(*) from auth.users u left join profiles p on p.id = u.id
    where p.id is null)                                as comptes_orphelins_donc_capables,
  (select count(*) from profiles)                      as profils_exposes_a_la_lecture,
  (select count(*) from profiles where role = 'prof')  as profs_actuels;

begin;

drop policy if exists "Trigger peut créer un profil" on profiles;
create policy "Trigger peut créer un profil" on profiles
  for insert
  with check (auth.uid() = id);

do $$
declare v_n int;
begin
  select count(*) into v_n from pg_policies
   where tablename = 'profiles' and policyname = 'Trigger peut créer un profil';
  if v_n <> 1 then
    raise exception 'ÉCHEC du retour arrière — la policy n''est pas reposée (% trouvée)', v_n;
  end if;
  raise notice '⚠️ la policy est reposée : L''ESCALADE DE RÔLE EST ROUVERTE.';
end $$;

commit;

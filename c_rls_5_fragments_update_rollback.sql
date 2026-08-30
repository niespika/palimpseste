-- ============================================================================
-- C-RLS-5 — RETOUR ARRIÈRE : l'élève reprend l'UPDATE de ses dépôts Fragments.
-- ----------------------------------------------------------------------------
-- ⛔⛔ IL ROUVRE L'EFFACEMENT DES MARQUES. La policy reposée ouvre la ligne
--     ENTIÈRE : `photos_suspectes` et `signal_integrite` redeviennent
--     effaçables par l'élève sur son propre dépôt.
--
-- ⚠️ QUAND SERVIRAIT-IL ? Seulement si un chemin applicatif se mettait à faire
--    un UPDATE de `fragments_depots` avec le client de l'ÉLÈVE. Aucun ne le
--    fait aujourd'hui (0 `.update()` sur 31 occurrences). **Et ce jour-là, le
--    bon geste ne serait PAS ce fichier** mais une policy bornée aux colonnes
--    que ce chemin a besoin d'écrire — la base ne sachant pas restreindre une
--    colonne dans une policy, cela passerait par un `grant`/`revoke` de colonne
--    ou par un passage en client admin gardé dans le code, patron C1.
--
-- ⚠️ Rien d'autre n'est touché : aucune donnée, aucune colonne, aucun droit,
--    aucun interrupteur. Les quatre autres policies n'ont jamais bougé.
-- ============================================================================

-- ── Constat de tête — À JOUER AVANT, hors transaction ────────────────────
-- Il dit ce que la réouverture expose. *Un retour arrière qu'on joue sans
-- savoir ce qu'il rouvre n'est pas un retour arrière.*
select
  (select count(*) from fragments_depots)                                  as depots_exposes,
  (select count(*) from fragments_depots
    where photos_suspectes or signal_integrite is not null)                as marques_effacables,
  (select count(*) from fragments_semaines where ouverte)                  as semaines_ouvertes;

begin;

drop policy if exists "Élève met à jour ses dépôts" on fragments_depots;
create policy "Élève met à jour ses dépôts" on fragments_depots
  for update
  using (auth.uid() = eleve_id);

do $$
declare v_n int;
begin
  select count(*) into v_n from pg_policies
   where tablename = 'fragments_depots' and policyname = 'Élève met à jour ses dépôts';
  if v_n <> 1 then
    raise exception 'ÉCHEC du retour arrière — la policy n''est pas reposée (% trouvée)', v_n;
  end if;
  raise notice '⚠️ la policy est reposée : L''EFFACEMENT DES MARQUES EST ROUVERT.';
end $$;

commit;

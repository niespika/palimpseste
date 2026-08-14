-- ============================================================================
-- C7 · L3 — RETOUR ARRIÈRE de c7_quazian_rls_eleve.sql.
-- N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- CE QUE ÇA FAIT : recrée `eleve_read_flashcards` À L'IDENTIQUE, telle qu'elle
-- était en base le 14/08 avant le retrait (relevée sur `pg_policies`, expression
-- reproduite mot pour mot).
--
-- ⚠️ NON DESTRUCTIF, et sans effet observable : la policy recréée n'autorise
-- RIEN — c'est tout le motif de son retrait. Elle joint sur
-- `scriptorium_unite_id`, NULL pour toute carte du bras contenu (`NULL = NULL`
-- n'est jamais vrai), et exige une ligne `quazian_publications` que plus aucun
-- code n'écrit. La remettre ne rend donc pas une seule carte lisible à un élève ;
-- elle ne fait que restaurer l'état antérieur du schéma, pour le cas où l'on
-- voudrait repartir de là.
--
-- ⚠️ CE QU'IL NE FAUT SURTOUT PAS EN DÉDUIRE : rejouer ce rollback ne « répare »
-- pas la lecture élève. Si un appel se remet un jour à interroger
-- `quazian_flashcards` sous l'identité d'un élève, il faudra une policy qui
-- parle la langue du « vu » — pas celle-ci. Et avant de l'écrire, relire le §
-- « choix de fond » de `c7_quazian_rls_eleve.sql` : la règle vit dans le CODE
-- (`utils/quazian-visibilite.ts`), la dupliquer en SQL est ce qui a produit
-- l'accident qu'on répare.
-- ============================================================================

begin;

drop policy if exists eleve_read_flashcards on quazian_flashcards;
create policy eleve_read_flashcards on quazian_flashcards
  for select
  using (
    statut = 'valide'
    and eleve_id is null
    and exists (
      select 1 from quazian_publications qp
      where qp.scriptorium_unite_id = quazian_flashcards.scriptorium_unite_id
        and qp.flashcards_visibles = true
    )
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'eleve'
    )
  );

commit;

-- ── Vérification (attendu : 1) ───────────────────────────────────────────────
-- select count(*) as policy_restauree from pg_policies
--   where schemaname='public' and tablename='quazian_flashcards'
--     and policyname='eleve_read_flashcards';

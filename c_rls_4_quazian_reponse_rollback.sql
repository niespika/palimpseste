-- ============================================================================
-- C-RLS-4 — RETOUR ARRIÈRE : l'élève reprend la lecture de `quazian_questions`.
-- ----------------------------------------------------------------------------
-- ⛔⛔ CE FICHIER ROUVRE LA FUITE. Il ne répare rien : il remet les deux
--     policies telles qu'elles étaient, **y compris celle qui ne vérifie pas la
--     classe**. Rejouer ceci, c'est rendre la bonne réponse de tout quizz
--     `lance` lisible par tout élève de la plateforme, avant qu'il réponde.
--
-- ⚠️ QUAND IL SERT VRAIMENT : si la migration a été jouée **avant** que le code
--    correspondant soit déployé, la passation casse — l'ancien code lit
--    `quazian_questions` avec le client de l'élève. **Le bon geste est alors de
--    DÉPLOYER LE CODE**, pas de rouvrir la base ; ce fichier n'est là que si le
--    déploiement est impossible dans l'immédiat.
--
-- ⛔ Il ne restaure PAS un demi-remède : reposer la seule policy de classe
--    laisserait quand même la réponse lisible à l'élève de la classe — c'est le
--    défaut d'origine, moins son aggravation. Ce n'est pas un retour arrière,
--    c'est un troisième état. Tout ou rien.
--
-- ⚠️ Rien d'autre n'est touché : aucune donnée, aucune colonne, aucun droit,
--    aucun interrupteur. `prof_all_questions` n'a jamais bougé.
-- ============================================================================

-- ── Constat de tête — À JOUER AVANT, hors transaction ─────────────────────
-- Il dit ce que la réouverture exposera. *Un retour arrière qu'on joue sans
-- savoir ce qu'il rouvre n'est pas un retour arrière.*
select
  (select count(*) from quazian_quizzes where statut = 'lance')  as quizz_en_cours,
  (select count(*) from quazian_questions q join quazian_quizzes z on z.id = q.quiz_id
    where z.statut = 'lance')                                     as reponses_exposees,
  (select count(*) from profiles where role = 'eleve')            as eleves_qui_pourront_lire;

begin;

drop policy if exists eleve_read_questions_actifs on quazian_questions;
create policy eleve_read_questions_actifs on quazian_questions
  for select
  using (
    exists (
      select 1 from quazian_quizzes qz
      where qz.id = quazian_questions.quiz_id
        and qz.statut = any (array['lance'::text, 'ferme'::text])
    )
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'eleve'::role_utilisateur
    )
  );

drop policy if exists quazian_questions_eleve_classe on quazian_questions;
create policy quazian_questions_eleve_classe on quazian_questions
  for select
  using (
    exists (
      select 1 from quazian_quizzes q
      join inscriptions i on i.classe_id = q.classe_id
      where q.id = quazian_questions.quiz_id
        and q.statut = any (array['lance'::text, 'ferme'::text])
        and i.eleve_id = auth.uid() and i.statut = 'active'
    )
  );

do $$
declare v_n int;
begin
  select count(*) into v_n from pg_policies
   where tablename = 'quazian_questions'
     and policyname in ('eleve_read_questions_actifs', 'quazian_questions_eleve_classe');
  if v_n <> 2 then
    raise exception 'ÉCHEC du retour arrière — % policy(ies) reposée(s) sur 2', v_n;
  end if;
  raise notice '⚠️ les deux policies sont reposées : LA FUITE EST ROUVERTE.';
end $$;

commit;

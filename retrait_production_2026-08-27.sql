-- ─────────────────────────────────────────────────────────────────────────────
-- retrait_production_2026-08-27.sql
--
-- CE QU'IL FAIT. Il retire de `exercices` les instances importées des crans de
-- PRODUCTION — 2 `production_guidee`, 6 `production_etayee`, 8 `production_autonome`.
-- Vingt et une ont été versées par la première banque ; elles sont retirées du
-- dépôt de conception le 27/08, et elles seront RÉÉCRITES.
--
-- POURQUOI. Leur consigne venait d'un patron du `04-` §14.1 qui ne nommait jamais
-- le sujet — « Écris le paragraphe. », rien d'autre — et leur guide, au cran 2,
-- portait parfois la réponse elle-même. Les deux tables ont été amendées ; ces
-- exercices-là sont d'avant. Ils portent les MÊMES `id_import` que ceux qui
-- viendront : sans ce retrait, le prochain import les rencontre.
--
-- ⚠️ CE N'EST PAS UNE MIGRATION DE SCHÉMA — aucune table, aucune colonne,
--    aucune policy ne change. C'est un retrait de DONNÉES, et il est gardé.
--
-- ⛔ LES DEUX GARDES. Le retrait s'annule de lui-même si un élève a déposé quoi
--    que ce soit sur l'une de ces conceptions, ou si le routeur en a assigné une.
--    Ce sont les deux mêmes refus que la suppression à l'unité de l'application
--    (`app/prof/examens-diagnostiques/actions.ts`) : on ne les contourne pas
--    parce qu'on supprime en masse.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── Garde 1 — aucune copie d'élève ──────────────────────────────────────────
do $$
declare n int;
begin
  select count(*) into n
    from exercices_depots d
    join exercices e on e.id = d.exercice_id
   where e.cran in ('2','6','8') and e.id_import is not null;
  if n > 0 then
    raise exception 'RETRAIT REFUSÉ — % dépôt(s) d''élève portent sur ces conceptions. '
      'Les supprimer effacerait des copies, des retours et des mesures.', n;
  end if;
end $$;

-- ── Garde 2 — aucune assignation du routeur ─────────────────────────────────
do $$
declare n int;
begin
  select count(*) into n
    from routeur_decisions r
    join exercices e on e.id = r.exercice_id
   where e.cran in ('2','6','8') and e.id_import is not null;
  if n > 0 then
    raise exception 'RETRAIT REFUSÉ — le routeur a déjà assigné % de ces exercices.', n;
  end if;
end $$;

-- ── Le retrait, et son compte ───────────────────────────────────────────────
with partis as (
  delete from exercices
   where cran in ('2','6','8') and id_import is not null
  returning id_import
)
select count(*) as retirees, string_agg(id_import, ', ' order by id_import) as lesquelles
  from partis;

commit;

-- ============================================================================
-- C4 — LE RETRAIT DES COLONNES DORMANTES DU STATUT DE RECETTE.
-- ----------------------------------------------------------------------------
-- Suite de `c4_statut_recette_global.sql`, qui a déménagé le statut vers
-- `competences_statut_recette` (une ligne par compétence) et laissé les colonnes
-- par élève DORMANTES, commentées comme telles. Ce fichier les retire.
--
-- ⛔ CE FICHIER EST DESTRUCTIF. Protocole RENFORCÉ (`SUIVI_SQL.md`, règle 5) :
--    CODE D'ABORD — fait : plus aucun lecteur applicatif ne nomme ces colonnes,
--    vérifié par balayage (`utils/`, `app/`, `scripts/`) ; les onze scripts de
--    recette lisent `competences_statut_recette`. Répétition à blanc CORPS SEUL
--    (règle 6). Rollback : `c4_statut_recette_retrait_rollback.sql`.
--
-- ⭐⭐ CE QUI DÉMÉNAGE PLUTÔT QUE DE MOURIR — ET C'EST LE POINT DU FICHIER.
--    Le trigger `trg_statut_porte_sa_date` ne protège pas une colonne : il porte
--    UNE RÈGLE, celle du `07-` §1.3 — « POSER UN STATUT EN ÉCRIT LA DATE DANS LE
--    MÊME GESTE », dont le seul lecteur est le recalcul de la lettre « depuis
--    les seules mesures postérieures à la recette ». Le retirer avec la colonne
--    ferait disparaître la règle EN SILENCE, et rien ne le dirait : la RPC la
--    tient par construction, mais un `update` direct sur la nouvelle table
--    passerait. ⛔ **La garde est donc RECRÉÉE sur `competences_statut_recette`
--    AVANT que l'ancienne ne parte.**
--
-- ⚠️ CE QUI EST PERDU, ET IL FAUT LE DIRE : l'HISTORIQUE PAR ÉLÈVE. Les colonnes
--    portaient une valeur par élève ; elles n'en portent plus qu'une copie
--    périmée depuis le déménagement, et personne ne la lit. Le rollback les
--    remplit depuis la valeur GLOBALE — c'est-à-dire la bonne — mais il ne
--    ressuscite aucune divergence par élève. Il n'y en avait aucune : la
--    migration précédente s'arrêtait s'il y en avait eu.
-- ============================================================================

begin;

-- ── 1. Le constat d'entrée — on refuse de partir à l'aveugle ────────────────
do $garde$
declare
  n_global int;
  n_moni   int;
begin
  select count(*) into n_global from competences_statut_recette;
  if n_global < 7 then
    raise exception
      'ARRÊT : competences_statut_recette porte % ligne(s), 7 attendues (les six + monitoring). '
      'Le déménagement n''est pas complet — ne pas retirer les colonnes.', n_global
      using errcode = 'check_violation';
  end if;
  select count(*) into n_moni from competences_statut_recette where competence = 'monitoring';
  if n_moni <> 1 then
    raise exception 'ARRÊT : la ligne `monitoring` manque à competences_statut_recette.'
      using errcode = 'check_violation';
  end if;
end $garde$;

-- ── 2. LA GARDE DÉMÉNAGE — avant tout retrait ───────────────────────────────
-- `07-` §1.3 : « poser un statut en écrit la date DANS LE MÊME GESTE ».
create or replace function public.garde_statut_global_porte_sa_date()
returns trigger language plpgsql as $fn$
begin
  if tg_op = 'INSERT' then
    if new.statut_recette_pose_le is null then
      new.statut_recette_pose_le := now();
    end if;
    return new;
  end if;
  if new.statut_recette is distinct from old.statut_recette
     and new.statut_recette_pose_le is not distinct from old.statut_recette_pose_le then
    raise exception 'Garde 07- §1.3 : poser un statut en écrit la date DANS LE MÊME GESTE (compétence %).',
      old.competence using errcode = 'check_violation';
  end if;
  return new;
end $fn$;

comment on function public.garde_statut_global_porte_sa_date() is
  'La garde du 07- §1.3, DÉMÉNAGÉE depuis competences_niveaux avec le statut lui-même. '
  'Elle ne protège pas une colonne : elle tient une règle — la date a un lecteur unique, '
  'le recalcul de la lettre « depuis les seules mesures postérieures à la recette ».';

drop trigger if exists trg_statut_global_porte_sa_date on competences_statut_recette;
create trigger trg_statut_global_porte_sa_date
  before insert or update on competences_statut_recette
  for each row execute function public.garde_statut_global_porte_sa_date();

-- ── 3. L'ancienne garde part — elle n'a plus de colonne à garder ────────────
drop trigger if exists trg_statut_porte_sa_date on competences_niveaux;
drop function if exists public.garde_statut_porte_sa_date();

-- ── 4. Les colonnes ─────────────────────────────────────────────────────────
-- ⚠️ Les deux `CHECK` de domaine partent avec elles, sans qu'on les nomme :
--    `competences_niveaux_statut_recette_check` et son homologue du monitoring.
--    Le domaine, lui, reste gardé — la NOUVELLE table porte le sien.
alter table competences_niveaux  drop column if exists statut_recette;
alter table competences_niveaux  drop column if exists statut_recette_pose_le;
alter table monitoring_niveaux   drop column if exists statut_recette;

-- ── 5. Le constat de sortie — par requête, jamais supposé ───────────────────
select
  (select count(*) from information_schema.columns
    where table_name = 'competences_niveaux'
      and column_name in ('statut_recette', 'statut_recette_pose_le'))        as colonnes_restantes_niveaux,
  (select count(*) from information_schema.columns
    where table_name = 'monitoring_niveaux' and column_name = 'statut_recette') as colonne_restante_moni,
  (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where c.relname = 'competences_niveaux' and t.tgname = 'trg_statut_porte_sa_date') as ancienne_garde,
  (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where c.relname = 'competences_statut_recette'
      and t.tgname = 'trg_statut_global_porte_sa_date')                        as garde_demenagee,
  (select count(*) from competences_statut_recette)                            as lignes_de_statut,
  (select count(*) from competences_niveaux)                                   as lignes_niveaux_intactes,
  (select count(*) from monitoring_niveaux)                                    as lignes_moni_intactes;

commit;

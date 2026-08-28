-- ============================================================================
-- C6 · L3 — « EN FAIRE PLUS » : LA MARQUE `bonus` PREND SON DOMICILE AU JOURNAL.
-- ----------------------------------------------------------------------------
-- `01-routeur.md` §5, en toutes lettres : « Un exercice servi sur ce quota porte
-- la marque `bonus` AU JOURNAL (§11). » Le journal du §11, point 1, est
-- `routeur_decisions` (`07-Implementation.md` §1.5 : « le journal des
-- décisions »). Il n'avait aucune colonne pour la porter : ce fichier la pose.
--
-- ⛔⛔ POURQUOI PAS `exercices.bonus`, QUI EXISTE DÉJÀ ET QUE LA CHAÎNE LIT.
--    `exercices` est LA BANQUE DES INSTANCES, et « entre élèves, une instance se
--    ressert — une instance, plusieurs dépôts » (`utils/moteur/vivier.ts`). Le
--    fait, lui, est par (ÉLÈVE × EXERCICE) : un `true` posé sur l'instance que
--    Léa a demandée en bonus marquerait aussi la mesure de Tom, à qui la même
--    instance aura été IMPOSÉE la semaine suivante — et le journal de fin
--    d'année dirait l'inverse de ce que le `01-` §5 lui demande de dire.
--
-- ⛔ POURQUOI PAS `exercices_depots`. Ce serait un SECOND DOMICILE de ce que la
--    décision dit déjà, et « deux domiciles finissent par diverger » (`07-`
--    §1.1). Le dépôt a deux écrivains (routeur et professeur) quand la marque
--    n'a qu'un auteur possible : « le drapeau est une décision du ROUTEUR, pas
--    de la conception » (`08-FORMAT_IMPORT.md` §7.3). `routeur_decisions` n'a
--    qu'un écrivain, et c'est lui.
--
-- ⭐ ET LE CHEMIN AVAL EXISTE DÉJÀ, SANS UN SAUT DE PLUS :
--    `exercices_depots.routeur_decision_id` → `routeur_decisions`, que
--    `utils/chaine/contexte.ts` interroge DÉJÀ pour `sondes_retenues` — et pour
--    exactement le même motif : « le drapeau vient de la décision
--    d'assignation ; la chaîne LE RECOPIE sur la mesure, ELLE NE LE DEVINE PAS ».
--
-- ⭐ ADDITIVE ET INERTE. Une colonne `boolean not null default false` — la forme
--    exacte de `degrade`, sur cette même table. Aucun code déployé ne la lit,
--    aucune ligne existante n'est invalidée, et la table porte **0 ligne dans
--    les deux bases** (constaté par requête le 2026-08-28, avant écriture).
--    ⛔ Ce n'est PAS un septième interrupteur (`07-` §5) : elle n'ouvre ni ne
--    ferme rien. Un `false` partout = le comportement d'avant, à l'identique.
--
-- Rollback : `c6_l3_bonus_au_journal_rollback.sql`.
-- ============================================================================

-- ── CONSTAT DE TÊTE — ce qu'on trouve avant d'écrire ────────────────────────
select
  (select count(*) from routeur_decisions)                        as decisions_avant,
  (select count(*) from routeur_decisions where degrade)          as degradees_avant,
  (select count(*) from exercices where bonus)                    as instances_marquees,
  (select count(*) from competences_mesures where bonus)          as mesures_marquees,
  (select count(*) from information_schema.columns
     where table_name = 'routeur_decisions' and column_name = 'bonus') as colonne_deja_posee;

begin;

alter table routeur_decisions
  add column if not exists bonus boolean not null default false;

comment on column routeur_decisions.bonus is
  '01- §5 — vrai quand cet exercice a été servi sur le BUDGET OPTIONNEL, à la '
  'demande de l''élève (le « pull » de C6-L3). « Un exercice servi sur ce quota '
  'porte la marque bonus AU JOURNAL (§11). » ⛔ C''est ICI que le fait vit, et '
  'pas sur exercices.bonus : exercices est la BANQUE, et entre élèves une '
  'instance se ressert — le fait, lui, est par (élève × exercice). La chaîne la '
  'relit par exercices_depots.routeur_decision_id et la recopie sur '
  'competences_mesures.bonus, comme elle le fait déjà pour sonde_montee. '
  '⛔ Le bonus reste un exercice NORMAL : il compte dans les tables de '
  'proportion, dans la couverture R5 et dans les compteurs d''escalade — il ne '
  'porte simplement AUCUNE sonde secondaire (la phase C a placé les siennes à la '
  'construction, quand il n''existait pas).';

-- ⭐ L'index sert la seule requête chaude du lot : « combien de minutes de bonus
--    cet élève a-t-il déjà consommées CE CYCLE ? » — lue à chaque affichage de
--    l'offre et à chaque demande. Partiel, donc minuscule : il ne porte que les
--    lignes marquées, et elles sont rares par construction.
create index if not exists idx_routeur_decisions_bonus
  on routeur_decisions (eleve_id, cycle_lundi) where bonus;

-- ── CONSTAT DE PIED — quatre drapeaux, tous attendus à `t` ──────────────────
select
  (select count(*) = 1 from information_schema.columns
     where table_name = 'routeur_decisions' and column_name = 'bonus')      as colonne_posee,
  (select is_nullable = 'NO' and column_default = 'false'
     from information_schema.columns
     where table_name = 'routeur_decisions' and column_name = 'bonus')      as not_null_defaut_faux,
  (select count(*) = 1 from pg_indexes
     where tablename = 'routeur_decisions' and indexname = 'idx_routeur_decisions_bonus')
                                                                            as index_pose,
  -- ⛔ Aucune ligne n'a été écrite ni réécrite : la migration ne touche AUCUNE
  --    donnée. Sur une table vide c'est trivial ; le drapeau existe pour que
  --    le jour où elle ne l'est plus, le rejeu le dise.
  (select count(*) = 0 from routeur_decisions where bonus)                  as aucune_ligne_marquee,
  (select count(*) from routeur_decisions)                                  as decisions_intactes;

commit;

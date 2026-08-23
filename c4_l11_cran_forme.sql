-- ============================================================================
-- C4 · L11 — LA FORME DU `cran` : UNE SEULE, SOUS CONTRAINTE.
-- ----------------------------------------------------------------------------
-- ⭐⭐ L'ARBITRAGE — LE NUMÉRO FAIT FOI EN BASE.
--
-- C'est le SEUL arbitrage de ce lot, et il est nommé comme tel : « quelle forme
-- de `cran` fait foi — cela se tranche ici, et se dit au relevé » (`07-` §2).
-- Le `02-` §2.1 et §2.2 donnent LES DEUX — un `#` de 1 à 9 ET un code
-- (`diagnostic_guide`, `production_guidee`…) —, et la source ne tranche pas :
-- elle décrit une échelle, pas un stockage. ⛔ LE `02-` §2 NE BOUGE PAS : il est
-- GELÉ, il a raison de donner les deux, et l'arbitrage porte sur la
-- REPRÉSENTATION EN BASE, sur elle seule.
--
-- Ce qui l'a tranché, en quatre constats :
--   1. `exercices_crans.cran` est un `int PRIMARY KEY` (`c4_l8_doctrine.sql`) :
--      le numéro EST déjà la clé de la table des crans, et le code vit à côté,
--      `text not null unique` — disponible d'une jointure, toujours.
--   2. TROIS des quatre tables de doctrine le portent déjà en entier, sous
--      `check (cran between 1 and 9)` : `exercices_crans`, `exercices_routes`,
--      `exercices_consignes_production`. La quatrième, `exercices_types_crans`,
--      est DÉRIVÉE — elle suit son dériveur, et c'est ce que fait ce fichier.
--   3. L'échelle est ORDINALE (`02-` §2, « l'échelle d'autonomie ») et le
--      `04-` §14 parle « des crans 2, 6 et 8 ». Un `check between 1 and 9` dit
--      la forme en un mot ; sur du texte il faudrait énumérer neuf chaînes.
--   4. ⭐ TOUS LES CHEMINS D'ÉCRITURE RÉELS ÉCRIVENT DÉJÀ LE NUMÉRO : l'écran de
--      conception (`app/prof/conception/actions.ts`) et l'import
--      (`utils/fabrique/import-ecriture.ts`, dont le refus n° 5 exige
--      `Number.isInteger(cran)`). Les six lignes au CODE constatées en base le
--      22/08 viennent TOUTES des décors de recette — un décor, pas une voie de
--      production. Le compte du 22/08 : **6 au code, 5 au numéro** (le chiffre
--      de C4L3-20, recompté et confirmé).
--
-- ⚠️⚠️ PROTOCOLE RENFORCÉ (`SUIVI_SQL.md`, règle 5, étendue par le journal) :
--    « `exercices` porte des lignes de recette » — instances réelles, conçues et
--    assignées. Code d'abord, SQL ensuite, fenêtre calme, rollback prêt, et
--    répétition à blanc EN COPIANT LE CORPS de ce fichier, jamais le fichier
--    entier (règle 6 : son `commit;` validerait la transaction d'essai).
--
-- ⚠️ L'ORDRE COMPTE, et il est tenu dans UNE SEULE TRANSACTION : convertir
--    AVANT de poser le `CHECK`, sinon le `CHECK` refuse les lignes qu'il doit
--    corriger.
--
-- ⛔⛔ CE QUE CE FICHIER NE FAIT PAS, ET NE DOIT JAMAIS FAIRE.
--    Il ne réintroduit PAS `exercices_cran_chk` — « `statut = 'a_concevoir'` ou
--    `cran is not null` » —, ni sous ce nom ni sous un autre. C4-L9 l'a
--    SUPPRIMÉE (`c4_l9_examens_diagnostiques.sql:230`) parce qu'« un `CHECK` ne
--    pouvait pas lire `exercices_types.nature` », et son drapeau de vérification
--    (`:360`) EXIGE que le CHECK ait disparu. Ce qui la remplace est le trigger
--    `trg_exercices_cran_selon_le_type`. La rétablir casserait le drapeau ET le
--    trigger d'un même geste.
--    ⭐ LA CONTRAINTE DE FORME N'EST PAS LA GARDE DE PRÉSENCE : elle ne regarde
--       QUE la colonne, et elle TOLÈRE `NULL` — un examen diagnostique (type de
--       nature `complet`) n'a PAS DE CRAN DU TOUT, et
--       `types_complet_macro_sans_cran_chk` lui en interdit un.
--
-- Rollback : `c4_l11_cran_forme_rollback.sql`.
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT — les deux formes, comptées ────────────────────────────
select
  count(*) filter (where cran ~ '^[1-9]$')                     as au_numero,
  count(*) filter (where cran is not null and cran !~ '^[1-9]$') as au_code,
  count(*) filter (where cran is null)                          as sans_cran,
  count(*)                                                      as total
  from public.exercices;

-- ── 1. CONVERTIR — le code devient son numéro, par la table des crans ───────
-- ⚠️ La correspondance ne se tape pas : elle se LIT sur `exercices_crans`, qui
--    est DÉRIVÉE du `02-` §2.1. Une table de correspondance écrite ici serait un
--    second domicile de la doctrine.
update public.exercices e
   set cran = c.cran::text
  from public.exercices_crans c
 where e.cran = c.code;

-- Si une valeur résiste — ni numéro, ni code connu —, on s'arrête AVANT de
-- changer le type : un `alter … using` échouerait plus loin, avec un message
-- qui ne dirait pas laquelle.
do $$
declare v_reste int;
begin
  select count(*) into v_reste
    from public.exercices where cran is not null and cran !~ '^[1-9]$';
  if v_reste > 0 then
    raise exception 'ARRÊT — % ligne(s) d''`exercices` portent un `cran` qui n''est '
      'ni un numéro de 1 à 9 ni un code connu d''`exercices_crans`. '
      'Les lire une par une avant de rejouer.', v_reste;
  end if;
end $$;

-- ── 2. LE TYPE — `text` devient `integer`, comme les trois autres tables ────
alter table public.exercices
  alter column cran type integer using (nullif(cran, '')::integer);

-- ── 3. LE `CHECK` DE FORME — une valeur parmi neuf, et `NULL` TOLÉRÉ ────────
alter table public.exercices drop constraint if exists exercices_cran_forme_chk;
alter table public.exercices
  add constraint exercices_cran_forme_chk
  check (cran is null or (cran between 1 and 9));

comment on column public.exercices.cran is
  'Le cran élu, EN NUMÉRO (1 à 9) — l''arbitrage de C4-L11. Le 02- §2.1 donne le '
  'numéro ET le code ; la base porte le numéro, et le code se relit sur '
  'exercices_crans.code (unique). NULL sur un type de nature `complet` — un '
  'examen diagnostique n''a pas de cran, et n''en aura jamais (07- §1.1). '
  'La GARDE DE PRÉSENCE, elle, vit au trigger trg_exercices_cran_selon_le_type '
  '(C4-L9) — jamais dans un CHECK, qui ne sait pas lire exercices_types.nature.';

-- ── 4. LA TABLE DÉRIVÉE — `exercices_types_crans.cran` passe entier ─────────
-- ⚠️ C'est le piège 11 vu par l'autre bout : `exercices_crans.cran` est un
--    entier, `exercices_types_crans.cran` était du texte, et
--    `utils/chaine/contexte.ts` interrogeait DÉJÀ les deux, avec deux types.
-- ⚠️⚠️ CETTE TABLE NE SE CORRIGE PAS À LA MAIN — elle est DÉRIVÉE : le
--    `delete`/`insert` de `scripts/derive-doctrine.py --sql` la remplit. Le
--    DÉRIVEUR a été changé dans le même geste (il écrit désormais un entier) ;
--    ce qui suit ne fait que mettre le TYPE de la colonne d'accord avec lui,
--    pour que `--sql` n'ait pas à recréer la table. Sans le changement du
--    dériveur, la base redeviendrait du texte au prochain passage.
alter table public.exercices_types_crans
  alter column cran type integer using (nullif(cran, '')::integer);

alter table public.exercices_types_crans
  drop constraint if exists exercices_types_crans_cran_chk;
alter table public.exercices_types_crans
  add constraint exercices_types_crans_cran_chk
  check (cran between 1 and 9);

comment on column public.exercices_types_crans.cran is
  'Le cran, EN NUMÉRO — aligné sur exercices_crans.cran (int) par C4-L11. '
  'Table DÉRIVÉE : elle se remplit par scripts/derive-doctrine.py --sql, jamais '
  'à la main. --verifie la contrôle depuis C4-L11 (le douzième verdict).';

-- ── LE CONSTAT APRÈS — une seule forme, sous contrainte ─────────────────────
select
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices' and column_name = 'cran')
                                                              as type_exercices_cran,
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_types_crans' and column_name = 'cran')
                                                              as type_types_crans_cran,
  (select count(*) from pg_constraint where conname = 'exercices_cran_forme_chk')
                                                              as check_de_forme,
  -- ⭐ Le drapeau de C4-L9 : le CHECK de PRÉSENCE doit rester ABSENT.
  (select count(*) from pg_constraint where conname = 'exercices_cran_chk')
                                                              as exercices_cran_chk_absent_attendu_0,
  (select count(*) from pg_trigger where tgname = 'trg_exercices_cran_selon_le_type')
                                                              as trigger_de_presence_intact_attendu_1,
  (select count(*) from public.exercices where cran is not null) as instances_avec_cran,
  (select count(*) from public.exercices where cran is null)     as instances_sans_cran;

commit;

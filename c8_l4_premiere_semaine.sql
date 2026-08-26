-- ============================================================================
-- C8 · L4 — LA PREMIÈRE SEMAINE COMPTÉE PAR FRAGMENTS.
-- ----------------------------------------------------------------------------
-- CE QUE CE FICHIER FAIT, ET RIEN D'AUTRE — un geste, additif :
--   (1) `semesters.fragments_premiere_semaine` : le numéro de la première
--       semaine pédagogique à partir de laquelle Fragments RÉCLAME un fragment.
--   Plus un `CHECK` (>= 1) et un `comment on column`.
--
-- ⛔ AUCUNE DONNÉE N'EST ÉCRITE. Le défaut vaut `1` — c'est exactement le
--   comportement d'aujourd'hui, et c'est l'ÉTAT NEUTRE du lot : tant que
--   personne ne pose une autre valeur, rien ne change nulle part. La valeur se
--   pose À L'ÉCRAN (`/prof/calendrier/config`, section Semestres), jamais par
--   migration : elle se règle chaque année, et une valeur tapée ici serait à
--   retaper à chaque rentrée, dans deux bases, à la main.
--
-- POURQUOI IL EXISTE.
--   Fragments compte les semaines depuis la PREMIÈRE du semestre. Or l'élève
--   n'a pas encore de sujet : en semaine 1 on présente le dispositif, en
--   semaine 2 chacun choisit son thème, et ce n'est qu'ensuite qu'un fragment
--   peut être réclamé. Les sept sites qui comptent réclamaient donc deux
--   fragments que personne n'avait demandés — « dépôts manquants » à l'écran
--   des élèves à risque, taux de dépôt faux dans le dossier envoyé au modèle
--   pour le bilan de semestre, et une charge de travail budgétée en trop au
--   panoptique de Scriptorium.
--   ⚠️ **Le semestre 2 n'a pas le même décalage** : les sujets y sont déjà
--   choisis, seule la première semaine saute (le temps d'en changer). D'où une
--   valeur PAR SEMESTRE, et non un réglage global : `fragments_config` aurait
--   imposé au S2 le décalage du S1.
--
-- ⭐ POURQUOI C'EST ICI ET PAS SUR `fragments_semaines`.
--   `fragments_semaines` porte un nom qui ment : c'est la grille de semaines de
--   L'ÉCOLE, pas celle de Fragments. La lisent aussi le calendrier de l'élève,
--   le panoptique de Scriptorium et la config du Calendrier. **Décaler la
--   numérotation déplacerait toute l'année scolaire.** Le semestre, lui, est le
--   propriétaire naturel d'un « à partir de quand » : il porte déjà ses dates,
--   ses vacances et son drapeau actif.
--
-- ⚠️ L'ORDRE : SQL D'ABORD, CODE ENSUITE — et c'est délibéré (patron C4-L16).
--   La règle 5 du `SUIVI_SQL.md` veut « code d'abord » sur les tables d'un flux
--   vivant, et `semesters` en est une. Elle s'inverse ici pour la même raison
--   qu'à C4-L16 : une colonne additive est **invisible** au code qui ne la lit
--   pas, tandis que du code qui la lirait avant qu'elle existe ferait échouer
--   le `select` — PostgREST rend une erreur, `data` revient `null`, et les
--   écrans concluraient « aucun semestre ». Or `/prof/fragments-erudition`,
--   `/eleve` et `/prof/scriptorium` ne sont derrière **aucun** drapeau.
--
-- ⭐ LE GESTE EST LE PLUS DOUX POSSIBLE : `add column` d'un `integer` à défaut
--   CONSTANT, stocké en `attmissingval` par Postgres >= 11 — aucune réécriture
--   de table, aucun verrou long. Aucune policy, aucune RLS touchée. Et le
--   `CHECK` ne peut pas échouer à la validation : toutes les lignes existantes
--   reçoivent `1`, qui le satisfait.
--
-- Rollback : `c8_l4_premiere_semaine_rollback.sql`.
-- ============================================================================

begin;

-- ── Constat AVANT (l'éditeur SQL de Supabase ne rend que la DERNIÈRE requête :
--    lancer celle-ci séparément si l'on veut la voir) ───────────────────────
select
  count(*)                                                as semestres,
  count(*) filter (where archived_at is null)             as vivants,
  (select count(*)
     from information_schema.columns
    where table_name  = 'semesters'
      and column_name = 'fragments_premiere_semaine')     as colonne_deja_la
from semesters;

-- ── (1) La colonne ──────────────────────────────────────────────────────────
alter table semesters
  add column if not exists fragments_premiere_semaine integer not null default 1;

-- Un `CHECK` nommé, jamais inline : un jour où il faudrait l'élargir, une
-- contrainte auto-nommée se droppe et se recrée à l'aveugle (leçon C4-L16).
alter table semesters
  drop constraint if exists semesters_fragments_premiere_semaine_check;
alter table semesters
  add constraint semesters_fragments_premiere_semaine_check
  check (fragments_premiere_semaine >= 1);

comment on column semesters.fragments_premiere_semaine is
  'C8-L4 — numéro de la première semaine pédagogique où Fragments réclame un fragment. '
  'Les semaines de numéro inférieur sortent du dénominateur ET du numérateur du taux de '
  'dépôt (présentation du dispositif, choix des sujets) ; elles gardent leurs dépôts, '
  'leurs retours et leurs notes. 1 = aucun décalage (défaut). Se pose à l''écran '
  '/prof/calendrier/config, section Semestres.';

-- ── Constat APRÈS ───────────────────────────────────────────────────────────
select
  (select count(*)
     from information_schema.columns
    where table_name  = 'semesters'
      and column_name = 'fragments_premiere_semaine'
      and is_nullable = 'NO'
      and column_default = '1')                           as colonne_ok,
  (select count(*)
     from pg_constraint
    where conname = 'semesters_fragments_premiere_semaine_check') as check_ok,
  (select count(*) from semesters
    where fragments_premiere_semaine <> 1)                as valeurs_non_neutres,
  (select col_description('semesters'::regclass,
            (select attnum from pg_attribute
              where attrelid = 'semesters'::regclass
                and attname  = 'fragments_premiere_semaine')) is not null) as commentaire_pose;

commit;

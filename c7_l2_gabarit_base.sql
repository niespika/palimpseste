-- ============================================================================
-- C7 · L2 — LA BASE DU GABARIT : la grille du 09- dérivée, les tests, les pièces,
-- le marquage par cran × variante, `variante` / `probleme` / `constituant` /
-- `pieces`, et l'interrupteur `gabarit_actif`, à OFF. 2026-09-03.
-- (`10-Gabarit.md` §8, arrêté par Louis le 03/09 ; `07-` §1.1 amendé et §2 C7-L2 ;
--  `08-FORMAT_IMPORT.md` v1.8, format 1.5.)
-- ----------------------------------------------------------------------------
-- 1. QUATRE TABLES DE DOCTRINE, DÉRIVÉES — jamais écrites à la main :
--    `exercices_problemes` (le 09-, une ligne par clé `objet.constituant.variante`),
--    `exercices_tests` (les questions du cran 6, une clé par question),
--    `exercices_pieces` (la pièce du cran 2 et son geste, par fiche),
--    `exercices_marquage_gabarit` (le 10- §5, par cran × variante).
--    Elles se remplissent par `scripts/derive-doctrine.py --sql`, comme les autres,
--    et `--verifie` les compare. Vides tant que la dérivation n'a pas tourné.
-- 2. `exercices.variante` (a | b, aux crans 1 et 4 — l'import le tient),
--    `exercices_cas.probleme` (la clé), `.constituant` et `.pieces` (au cran 2).
--    ⛔ Pas de clé étrangère de `probleme` vers la grille : la dérivation REMPLACE
--    la grille en bloc, et une contrainte l'en empêcherait. Le contrôle d'import
--    refuse une clé inconnue ; `--verifie` dit si la grille a bougé.
-- 3. `scriptorium_params.gabarit_actif boolean not null default false` — patron
--    `copie_annotee_actif` ; le code le lit par une requête tolérante.
-- ⛔ RLS : même posture que les autres tables de doctrine (`c4_l8_doctrine.sql`
--    §10) — RLS active, policy PROF `for all`, aucune policy élève. Les colonnes
--    neuves d'`exercices` et `exercices_cas` sont ADDITIVES et NULLABLES ; aucun
--    `select('*')` sur `exercices` dans le code ; `exercices_cas` est lue par
--    `select('*')` à deux endroits (vérifié) — des colonnes en plus n'y changent
--    rien. Ordre de déploiement indifférent : le code ne nomme ces colonnes que
--    pour un fichier au format 1.5.
-- Rollback : `c7_l2_gabarit_base_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from exercices) as exercices_avant,
  (select count(*) from exercices_cas) as cas_avant,
  (select count(*) from information_schema.tables
     where table_name in ('exercices_problemes','exercices_tests','exercices_pieces','exercices_marquage_gabarit'))
    as tables_deja_posees,
  (select count(*) from information_schema.columns
     where (table_name = 'exercices' and column_name = 'variante')
        or (table_name = 'exercices_cas' and column_name in ('probleme','constituant','pieces'))
        or (table_name = 'scriptorium_params' and column_name = 'gabarit_actif'))
    as colonnes_deja_posees;

begin;

-- ── 1. Les quatre tables de doctrine ──────────────────────────────────────────
create table if not exists exercices_problemes (
  cle                   text primary key,                       -- objet.constituant.variante
  type_id               uuid not null references exercices_types(id) on delete cascade,
  objet_code            text not null,
  genre                 text,                                   -- sur les objets terminaux
  constituant           text not null,
  variante_probleme     text not null,                          -- le troisième segment de la clé
  mode_probleme         text not null,                          -- substitué · mal dirigé · absent … (09- §0)
  observable_texte      text not null,                          -- la cellule, telle quelle
  observable_code       text,                                   -- null quand aucun observable n'est routé (⚠️ du 09-)
  observable_competence text,
  mode_receptif         text,
  observable_route      boolean not null default true,
  forme                 text not null check (forme in ('local','global')),
  grains                text[] not null,
  enonce                text not null,                          -- ce que l'élève lit
  exemple               text,
  correction            text,
  banque                text,                                   -- l'id du matériau, quand l'exemple en vient
  note                  text,
  source_section        text not null,
  derive_at             timestamptz not null default now()
);
create index if not exists exercices_problemes_objet_idx on exercices_problemes (objet_code, genre);

create table if not exists exercices_tests (
  cle        text primary key,                                  -- objet.test.n · objet.genre.test.n
  type_id    uuid not null references exercices_types(id) on delete cascade,
  objet_code text not null,
  genre      text,
  n          int  not null check (n >= 1),
  question   text not null,
  derive_at  timestamptz not null default now()
);

create table if not exists exercices_pieces (
  cle        text primary key,                                  -- objet · objet.genre
  type_id    uuid not null references exercices_types(id) on delete cascade,
  objet_code text not null,
  genre      text,
  piece      text not null,                                     -- le constituant servi par défaut
  geste      text not null,                                     -- écrit à la main, recopié dans la consigne
  derive_at  timestamptz not null default now()
);

create table if not exists exercices_marquage_gabarit (
  cran      int  not null check (cran between 1 and 9),
  variante  text not null check (variante in ('a','b','-')),
  marquage  text,                                               -- null : rien n'est marqué
  derive_at timestamptz not null default now(),
  primary key (cran, variante)
);

do $rls$
declare t text;
begin
  foreach t in array array[
    'exercices_problemes','exercices_tests','exercices_pieces','exercices_marquage_gabarit'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_prof_all', t);
    execute format($p$create policy %I on %I for all
        using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
        with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))$p$,
      t || '_prof_all', t);
  end loop;
end $rls$;

-- ── 2. Les colonnes du gabarit sur l'instance et le cas ───────────────────────
alter table exercices
  add column if not exists variante text;
alter table exercices drop constraint if exists exercices_variante_chk;
alter table exercices add constraint exercices_variante_chk
  check (variante is null or variante in ('a','b'));

alter table exercices_cas
  add column if not exists probleme    text,
  add column if not exists constituant text,
  add column if not exists pieces      jsonb;
alter table exercices_cas drop constraint if exists cas_pieces_forme_chk;
alter table exercices_cas add constraint cas_pieces_forme_chk
  check (pieces is null or jsonb_typeof(pieces) = 'array');

-- ── 3. L'interrupteur du chapitre, à OFF ──────────────────────────────────────
alter table scriptorium_params
  add column if not exists gabarit_actif boolean not null default false;

commit;

-- constat de pied : cinq drapeaux, plus les témoins
select
  (select count(*) from information_schema.tables
     where table_name in ('exercices_problemes','exercices_tests','exercices_pieces','exercices_marquage_gabarit')) = 4
    as tables_posees,
  (select count(*) from information_schema.columns
     where (table_name = 'exercices' and column_name = 'variante')
        or (table_name = 'exercices_cas' and column_name in ('probleme','constituant','pieces'))) = 4
    as colonnes_posees,
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'gabarit_actif') as porte_posee,
  not exists (select 1 from scriptorium_params where gabarit_actif) as porte_a_off,
  (select count(*) from pg_policies
     where tablename in ('exercices_problemes','exercices_tests','exercices_pieces','exercices_marquage_gabarit')) = 4
    as policies_posees,
  (select count(*) from exercices) as exercices_intacts,
  (select count(*) from exercices_cas) as cas_intacts;

-- ============================================================================
-- C4 · L8 — COMPLÉMENT À LA DOCTRINE DÉRIVÉE : deux données que les écrans et
-- les contrôles lisent, et qui n'avaient pas de domicile.
-- Fichier : c4_l8_doctrine_complement.sql
-- ----------------------------------------------------------------------------
-- À jouer APRÈS `c4_l8_doctrine.sql`. Les deux se remplissent par
-- `scripts/derive-doctrine.py --sql` : RIEN N'EST SEEDÉ ICI.
--
-- (1) `exercices_types.libelle` — le NOM LISIBLE de l'objet.
--     Les quinze patrons du `04-` §14.1 portent la case `<objet>` — « la case
--     que remplit l'objet du `02-` §1 » —, et l'écran de conception doit
--     l'écrire dans la consigne qu'il propose : « Voici <ce qui est servi>.
--     ÉCRIS <objet> en t'appuyant dessus. » Le seed de C4-L1 n'a posé que le
--     `code` ; le libellé vit en tête de chaque section du `04-` :
--     `## 3. « L'argument » — argument`. Il se DÉRIVE de là.
--
-- (2) `demonstrations_formes` — l'appariement forme × grain du `06-` §2.
--     « Une forme inattendue pour son grain est SIGNALÉE, jamais refusée »
--     (`08-` §5 bis, §7.3 ; piège 20). Le contrôle d'import a besoin de
--     l'appariement pour signaler ; `noyau/doctrine.py` le LIT au `06-` §2
--     « pour empêcher `verifie-import.py` de signaler selon une règle que la
--     source aurait changée ». La plateforme le lit ici, dérivé de la même
--     phrase.
--
-- PROTOCOLE : NORMAL — une colonne NULLABLE sur une table neuve de C4-L1 et une
-- table neuve, toutes deux gatées.
-- Rollback : `c4_l8_doctrine_complement_rollback.sql`.
-- ============================================================================

begin;

alter table exercices_types add column if not exists libelle text;
comment on column exercices_types.libelle is
  'Le nom lisible de l''objet — « L''argument », « La problématisation ». DÉRIVÉ de l''en-tête de '
  'section du 04- (`## N. « … » — code`), jamais tapé. C''est lui qui remplit la case <objet> des '
  'quinze patrons du 04- §14.1.';

create table if not exists demonstrations_formes (
  forme     text primary key check (forme in ('exemple','modelage','checklist')),
  grain     text not null check (grain in ('micro','meso','macro')),
  derive_at timestamptz not null default now()
);
comment on table demonstrations_formes is
  'L''appariement forme × grain du 06- §2 — exemple au micro, modelage au meso, checklist au macro. '
  'DÉRIVÉ de la phrase du 06- §2, jamais recopié : « la règle pédagogique vit au 06-, et c''est là '
  'qu''elle se discute » (08- §5 bis). Une forme inattendue pour son grain est SIGNALÉE, jamais refusée.';

alter table demonstrations_formes enable row level security;
drop policy if exists demonstrations_formes_prof_all on demonstrations_formes;
create policy demonstrations_formes_prof_all on demonstrations_formes for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION
-- select
--   (select count(*) from information_schema.columns where table_schema='public'
--      and table_name='exercices_types' and column_name='libelle') as colonne_libelle,  -- 1
--   (select count(*) from demonstrations_formes) as formes;                             -- 0 avant dérivation
-- ============================================================================

-- ============================================================================
-- C8 · FRAGMENTS — LE THÈME EST PROPOSÉ PAR L'ÉLÈVE, ET LE PROFESSEUR LE VALIDE.
-- ----------------------------------------------------------------------------
-- Demande de Louis, 2026-09-02 : « aujourd'hui c'est moi qui fixe le thème sur
-- lequel l'élève fera ses fragments. Serait-il possible que ce soit l'élève qui
-- l'écrive lui-même, et que je reçoive un signal pour relire et valider ? »
--
-- Deux INSTANTS, nullables, sans `default`, sur `fragments_themes` :
--   · `propose_at` — la dernière fois que l'ÉLÈVE a écrit ou changé son thème ;
--   · `valide_at`  — la dernière fois que le PROFESSEUR l'a validé (ou l'a écrit
--     lui-même : sa main vaut validation).
-- « À valider » se DÉRIVE : `propose_at` non nul ET (`valide_at` nul OU
-- `propose_at` > `valide_at`). Les thèmes déjà posés par le professeur
-- (`propose_at` nul) ne deviennent donc pas « à valider » par le rejeu.
--
-- ⭐ ADDITIVE ET INERTE : aucun lecteur déployé ne fait `select('*')` sur cette
--    table (vérifié : la page élève, Suivi, l'analyse, l'essai nomment leurs
--    champs). ⛔ Aucune policy touchée : l'élève ÉCRIT par une action serveur
--    (client admin, inscription vérifiée dans le code), il LIT par sa policy
--    existante « Élève lit son thème ».
--
-- Rollback : `c8_theme_propose_par_eleve_rollback.sql`.
-- ============================================================================

-- ── CONSTAT DE TÊTE ─────────────────────────────────────────────────────────
select
  (select count(*) from fragments_themes)                                  as themes_avant,
  (select count(*) from fragments_themes where coalesce(theme, '') <> '')  as themes_definis,
  (select count(*) from information_schema.columns
     where table_name = 'fragments_themes'
       and column_name in ('propose_at', 'valide_at'))                     as colonnes_deja_posees;

begin;

alter table fragments_themes
  add column if not exists propose_at timestamptz null,
  add column if not exists valide_at  timestamptz null;

comment on column fragments_themes.propose_at is
  'C8 — la dernière fois que l''ÉLÈVE a écrit ou changé son thème (action serveur). '
  'NULL = thème posé par le professeur, ou jamais écrit. « À valider » = propose_at '
  'non nul et (valide_at nul ou propose_at > valide_at).';
comment on column fragments_themes.valide_at is
  'C8 — la dernière validation du thème par le PROFESSEUR (bouton « Valider » de Suivi, '
  'ou sa propre édition : sa main vaut validation). NULL = jamais validé.';

-- ── CONSTAT DE PIED — trois drapeaux, tous attendus à `t` ───────────────────
select
  (select count(*) = 2 from information_schema.columns
     where table_name = 'fragments_themes'
       and column_name in ('propose_at', 'valide_at'))                     as colonnes_posees,
  (select bool_and(is_nullable = 'YES' and column_default is null)
     from information_schema.columns
     where table_name = 'fragments_themes'
       and column_name in ('propose_at', 'valide_at'))                     as nullables_sans_defaut,
  (select count(*) = 0 from fragments_themes where propose_at is not null) as aucun_theme_a_valider,
  (select count(*) from fragments_themes)                                  as themes_intacts;

commit;

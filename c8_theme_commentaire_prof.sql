-- ============================================================================
-- C8 · FRAGMENTS — LE PROFESSEUR COMMENTE LE THÈME PROPOSÉ, SANS LE VALIDER
-- NI LE MODIFIER.
-- ----------------------------------------------------------------------------
-- Demande de Louis, 2026-09-02 (le soir même de `c8_theme_propose_par_eleve.sql`) :
-- « Ce n'est ni valider, ni modifier, c'est "ajouter un commentaire" — et ce
-- commentaire doit apparaître dans le À faire de l'élève. »
--
-- Deux colonnes NULLABLES, sans `default`, sur `fragments_themes` :
--   · `commentaire_prof` — le texte que le PROFESSEUR laisse sous le thème ;
--   · `commente_at`      — l'instant de ce commentaire (le dernier ; un nouveau
--     commentaire remplace l'ancien).
-- « Commenté » se DÉRIVE (`utils/fragments-theme.ts`) : `commente_at` non nul,
-- texte non vide, ET l'élève n'a pas re-proposé depuis (`propose_at` ≤
-- `commente_at`), ET le professeur n'a pas validé depuis (`valide_at` ≤
-- `commente_at`). Le commentaire s'éteint donc de lui-même par la réponse de
-- l'élève ou par la validation du professeur ; rien à effacer.
--
-- ⭐ ADDITIVE ET INERTE : aucun lecteur déployé ne fait `select('*')` sur cette
--    table (vérifié le 02/09 : page élève, Suivi, analyses, essai, tableau de
--    bord prof nomment leurs champs). ⛔ Aucune policy touchée : seul le
--    PROFESSEUR écrit (client user-scoped, policy prof existante), l'élève LIT
--    par sa policy « Élève lit son thème ».
-- ⚠️ Au 02/09 la table porte 2 lignes en PRODUCTION (deux thèmes proposés par
--    des élèves le soir même) et 1 en bac à sable : ordre SQL d'abord, code
--    ensuite — le code neuf nomme ces colonnes dans ses `select`.
--
-- Rollback : `c8_theme_commentaire_prof_rollback.sql`.
-- ============================================================================

-- ── CONSTAT DE TÊTE ─────────────────────────────────────────────────────────
select
  (select count(*) from fragments_themes)                                  as themes_avant,
  (select count(*) from fragments_themes where propose_at is not null)     as themes_proposes,
  (select count(*) from information_schema.columns
     where table_name = 'fragments_themes'
       and column_name in ('commentaire_prof', 'commente_at'))             as colonnes_deja_posees;

begin;

alter table fragments_themes
  add column if not exists commentaire_prof text null,
  add column if not exists commente_at timestamptz null;

comment on column fragments_themes.commentaire_prof is
  'C8 — le commentaire du PROFESSEUR sous le thème (ni validation, ni modification). '
  'Le dernier écrit remplace le précédent. « Commenté » = commente_at non nul, texte non '
  'vide, propose_at ≤ commente_at et valide_at ≤ commente_at (dérivé, utils/fragments-theme.ts).';
comment on column fragments_themes.commente_at is
  'C8 — l''instant du dernier commentaire du professeur. NULL = jamais commenté.';

-- ── CONSTAT DE PIED — trois drapeaux, tous attendus à `t` ───────────────────
select
  (select count(*) = 2 from information_schema.columns
     where table_name = 'fragments_themes'
       and column_name in ('commentaire_prof', 'commente_at'))             as colonnes_posees,
  (select bool_and(is_nullable = 'YES' and column_default is null)
     from information_schema.columns
     where table_name = 'fragments_themes'
       and column_name in ('commentaire_prof', 'commente_at'))             as nullables_sans_defaut,
  (select count(*) = 0 from fragments_themes where commente_at is not null) as aucun_commentaire,
  (select count(*) from fragments_themes)                                  as themes_intacts;

commit;

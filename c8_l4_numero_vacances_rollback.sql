-- ============================================================================
-- C8 · L4 (correctif) — ROLLBACK : `numero` redevient obligatoire.
-- ----------------------------------------------------------------------------
-- ⛔ CE FICHIER NE PEUT PAS RESTITUER LES ANCIENS NUMÉROS, et il ne le prétend
--   pas. Les valeurs que la migration a effacées étaient des numéros PÉRIMÉS —
--   celui qu'une semaine portait avant de devenir vacance — et ils ne sont
--   nulle part ailleurs en base. **Ils ne désignaient aucune semaine réelle**
--   (ils collisionnaient avec ceux qui en désignent), donc il n'y a rien de
--   sensé à restituer : ce fichier repose `0` pour satisfaire le `not null`.
--   ⚠️ Un `0` est un numéro qu'aucun écran ne sait afficher joliment. C'est
--   assumé : ce fichier est un retour arrière, pas un état de service.
--
-- ⚠️ L'ORDRE : SQL D'ABORD, CODE ENSUITE — l'inverse de la migration.
--   Le code du lot tolère `numero = null` ; du code ancien ne le tolère pas.
--   Remettre le `not null` d'abord ne casse rien ; revenir au code d'avant
--   ensuite.
--
-- ⭐ ET IL Y A PLUS DOUX. Si le but est seulement de faire taire un affichage,
--   il n'y a rien à défaire ici : les numéros en double étaient le DÉFAUT, pas
--   une fonctionnalité. Ne jouer ce fichier que si le lot quitte le dépôt.
-- ============================================================================

begin;

-- ── Ce qui va être forcé à 0 ────────────────────────────────────────────────
select id, date_debut, end_date, is_vacation, pedagogical_number
  from fragments_semaines
 where numero is null
 order by date_debut;

-- ── Reposer une valeur, puis la contrainte ──────────────────────────────────
update fragments_semaines set numero = 0 where numero is null;

alter table fragments_semaines
  alter column numero set not null;

comment on column fragments_semaines.numero is
  'Numéro pédagogique de la semaine, continu en sautant les vacances.';

-- ── Constat APRÈS ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_name = 'fragments_semaines'
      and column_name = 'numero' and is_nullable = 'NO')  as not_null_repose,
  (select count(*) from fragments_semaines where numero = 0) as lignes_a_zero;

commit;

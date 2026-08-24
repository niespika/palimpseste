-- ============================================================================
-- C4 · L14 — ROLLBACK de `exercices_cas.pourquoi_juste`.
-- ----------------------------------------------------------------------------
-- ⛔⛔ CE FICHIER DÉTRUIT DE LA DONNÉE, ET ELLE NE SE RECALCULE PAS.
--   `pourquoi_juste` est **saisi à la conception** ou **déposé par l'import** :
--   il ne se dérive de rien — ni du `defaut`, ni de la `reponse_attendue`, ni
--   des `pourquoi_faux` des distracteurs. Une colonne droppée emporte donc,
--   pour chaque cas, une phrase que personne ne peut réécrire à sa place.
--   **Relever son contenu AVANT de jouer ce fichier** — le `select` ci-dessous
--   est là pour ça, et il s'exécute d'abord.
--
-- QUAND LE JOUER : seulement si la colonne pose un problème que le CODE ne peut
--   pas régler. Elle est **NULLABLE et sans contrainte** : du code qui ne la lit
--   pas ne la voit pas. Revenir au code d'avant suffit dans presque tous les cas
--   — les trois écrivains (`import-ecriture.ts`, la conception, l'édition) et
--   les deux lecteurs (`vue.ts`, l'écran d'édition) la tolèrent absente.
--
-- ⚠️ RÈGLE 6 — RÉPÉTITION À BLANC : copier le CORPS de ce fichier, jamais le
--   fichier entier (son `commit;` validerait la transaction d'essai).
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT — ET LE RELEVÉ DE CE QUI VA DISPARAÎTRE ────────────────
-- ⛔ Recopier cette sortie AILLEURS avant de continuer : après le `commit`,
--    elle n'existe plus nulle part.
select c.exercice_id, c.ordre, e.cran, c.pourquoi_juste
  from public.exercices_cas c
  join public.exercices e on e.id = c.exercice_id
 where c.pourquoi_juste is not null
 order by c.exercice_id, c.ordre;

select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_cas'
      and column_name = 'pourquoi_juste')                        as colonne_avant_attendu_1,
  (select count(*) from public.exercices_cas
    where pourquoi_juste is not null)                            as cas_qui_perdent_leur_pourquoi;

-- ── LE RETRAIT ──────────────────────────────────────────────────────────────
alter table public.exercices_cas drop column if exists pourquoi_juste;

-- ── LE CONSTAT APRÈS ────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_cas'
      and column_name = 'pourquoi_juste')                        as colonne_apres_attendu_0,
  -- Le reste de la table est intact : la colonne partait seule.
  (select count(*) from public.exercices_cas)                    as cas_en_base,
  (select count(*) from pg_constraint
    where conrelid = 'public.exercices_cas'::regclass)           as contraintes_de_la_table,
  (select count(*) from pg_trigger
    where tgname = 'trg_cas_de_la_paire')                        as garde_de_la_paire_intacte_attendu_1;

commit;

-- ============================================================================
-- Lot 5 — Phase 3 : thèmes par semestre (5.3)
-- ----------------------------------------------------------------------------
-- Le thème d'un élève n'est plus « un par inscription » mais « un par
-- (inscription, semestre) » : il change au semestre suivant. On unifie aussi
-- « thème » et « question d'essai » en UN seul champ (`theme`) — la colonne
-- `question` disparaît, son contenu est replié dans `theme` quand `theme` est
-- vide.
--
-- À exécuter APRÈS lot5a_semestre.sql (qui garantit un semestre « courant »).
-- Migration en place, sans perte : backfill au semestre courant + coalesce de
-- `question` avant suppression de la colonne.
-- ============================================================================

begin;

-- ── 1. Scope par semestre ───────────────────────────────────────────────────
-- Ajout nullable d'abord (pour pouvoir backfiller), puis NOT NULL.
alter table fragments_themes
  add column if not exists semestre_id uuid references fragments_semestres(id) on delete cascade;

-- Backfill : les thèmes existants appartiennent au semestre courant.
update fragments_themes
   set semestre_id = (select id from fragments_semestres where courant limit 1)
 where semestre_id is null;

-- Un thème appartient toujours à un semestre (échoue si lot5a n'a pas tourné).
alter table fragments_themes
  alter column semestre_id set not null;

-- ── 2. Fusion « thème » / « question d'essai » ──────────────────────────────
-- Le thème EST la question travaillée toute l'année. On replie `question` dans
-- `theme` uniquement quand `theme` est vide (on ne réécrit jamais un thème déjà
-- saisi), puis on supprime la colonne devenue redondante.
update fragments_themes
   set theme = question
 where (theme is null or btrim(theme) = '')
   and question is not null and btrim(question) <> '';

alter table fragments_themes drop column if exists question;

-- ── 3. Unicité : « par inscription » → « par (inscription, semestre) » ───────
-- L'ancienne contrainte unique(inscription_id) du Lot 1 empêcherait un second
-- thème (semestre suivant) pour la même inscription.
alter table fragments_themes
  drop constraint if exists fragments_themes_inscription_key;
alter table fragments_themes
  add  constraint fragments_themes_inscription_semestre_key
  unique (inscription_id, semestre_id);

-- L'index (inscription_id, semestre_id) est fourni par la contrainte unique.
-- On garde idx_fragments_themes_inscription (Lot 1) pour les balayages par élève.

commit;

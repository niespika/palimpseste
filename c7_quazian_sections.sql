-- ============================================================================
-- C7 · L3 — Une carte porte la SOUS-SECTION dont elle est née.
-- Fichier : c7_quazian_sections.sql — cf. PROMPT_Code_C7_L3.md (objectif 2),
-- RAPPORT_Diagnostic_C7_quazian.md §10.4, scriptorium_rag_l1.sql §A et §C.
-- ----------------------------------------------------------------------------
-- POURQUOI : la visibilité élève passe du geste « Publier » au « vu » du
-- Scriptorium. Or le « vu » vit sur `scriptorium_parcours_classe_elements`, et
-- un cours DÉCOUPÉ y est matérialisé en un élément PAR SOUS-SECTION
-- (`ref_type='section'`, `section_id` → `scriptorium_contenu_sections`). Une
-- carte ancrée au seul `contenu_id` ne sait pas de quelle sous-section elle
-- vient : le « vu » ne pourrait filtrer qu'au grain du cours entier, c'est-à-dire
-- tout ou rien. C'est la méta-donnée qui manque — la question était posée au
-- §10.4 du rapport, ce fichier y répond.
--
-- CE QUE ÇA FAIT : une seule colonne, `quazian_flashcards.section_id`, nullable,
-- qui PRÉCISE le bras contenu sans ouvrir un troisième bras :
--   • null            → carte au grain CONTENU (texte source, cours non découpé,
--                       carte ajoutée à la main, carte d'avant ce lot) ;
--   • non null        → carte née d'une sous-section précise de ce contenu.
-- Un CHECK dit cette subordination : `section_id` non nul ⇒ `contenu_id` non nul.
-- L'arc bi-source de C7·L1 (`quazian_flashcards_source_chk`) reste seul maître
-- du choix unité | contenu ; on ne le touche pas.
--
-- ⚠️ `on delete set null` — LE point du fichier. Une RE-DÉCOUPE (`remplacerDecoupe`,
-- app/prof/scriptorium/actions.ts:925) SUPPRIME puis RECRÉE les sections d'un
-- cours : même à découpe identique, les sections repartent avec des uuid NEUFS
-- (le « vu » est reporté par correspondance de TITRE, pas d'identifiant). Les
-- trois modes possibles, et pourquoi celui-ci :
--   • `restrict` → le `delete` des sections échoue dès qu'une carte y pend :
--     la re-découpe d'un cours deviendrait impossible tant qu'il a des cartes.
--     On bloquerait le Scriptorium au nom de Quazian. Non.
--   • `cascade`  → la re-découpe DÉTRUIRAIT les cartes, et avec elles les
--     `quazian_card_states` (l'historique FSRS des élèves). Le contraire exact
--     de la garde posée en L1 sur `contenu_id` (`restrict`, précisément pour ne
--     pas emporter l'historique en silence). Non.
--   • `set null` → la carte SURVIT et retombe au grain « cours entier » : elle
--     reste visible dès que le cours est entamé, son historique FSRS est intact.
--     C'est le comportement voulu.
-- Conséquence à assumer, et à dire au prof : re-découper un cours DÉ-GRANULE ses
-- cartes (toutes retombent au grain contenu). Aucune perte, une précision perdue.
-- ⚠️ Et « régénérer » ne la rend PAS : `genererCartes` INSÈRE, elle ne remplace
-- rien — on obtiendrait les anciennes cartes au grain contenu PLUS un jeu neuf
-- ancré aux sous-sections, donc des doublons. Retrouver le grain fin demande
-- d'archiver ou supprimer les anciennes d'abord (constat de la recette du 14/08).
--
-- CE QUE ÇA NE FAIT PAS : aucune policy touchée, aucune RLS modifiée, aucune
-- colonne supprimée, aucune donnée détruite. `quazian_publications` RESTE en
-- base intacte (le code cesse de lire et d'écrire son bras contenu ; son sort
-- est un arbitrage, §10.1 du rapport — pas une remise en marche).
-- Pas de FK COMPOSITE (section_id, contenu_id) → sections(id, contenu_id) : elle
-- garantirait structurellement que la section appartient bien à CE contenu, mais
-- le prompt de lot spécifie une FK simple + le CHECK de subordination, et le
-- couple n'est écrit qu'en un seul endroit (`genererCartes`, toujours depuis la
-- même cible). À rouvrir si un second écrivain apparaît.
--
-- ── Protocole (règles R6 + 5 de SUIVI_SQL.md) ────────────────────────────────
-- Additive (une colonne neuve, un CHECK que TOUTES les lignes existantes
-- satisfont d'emblée — 18 cartes, `section_id` null par construction), mais elle
-- touche une table d'un FLUX EXISTANT (Quazian) et n'est pas gatée : PROTOCOLE
-- RENFORCÉ. Code d'abord (merge + push), SQL ensuite, fenêtre calme, retour
-- arrière prêt (`c7_quazian_sections_rollback.sql`), smoke test élève.
-- Idempotent, rejouable (`if not exists` / `duplicate_object`).
--
-- ── Ordre code / SQL ─────────────────────────────────────────────────────────
-- Le code de L3 écrit `section_id` dès qu'un cours découpé se génère : tant que
-- ce fichier n'est pas joué, la génération sur un cours DÉCOUPÉ échoue avec le
-- message de Postgres (colonne absente). Un cours non découpé et un texte source
-- passent sans lui. La LECTURE, elle, tolère l'absence de la colonne — la
-- visibilité élève retombe alors au grain contenu, comme avant le lot.
-- ============================================================================

begin;

-- 1. quazian_flashcards.section_id — la précision du bras contenu ------------
alter table quazian_flashcards add column if not exists section_id uuid
  references scriptorium_contenu_sections(id) on delete set null;

-- Subordination au bras contenu : une carte ne peut pas porter une sous-section
-- sans porter le contenu qui la contient. (Une carte du bras UNITÉ hérité a donc
-- toujours `section_id` null — les unités n'ont pas de sections.)
do $$ begin
  alter table quazian_flashcards add constraint quazian_flashcards_section_chk check (
    section_id is null or contenu_id is not null
  );
exception when duplicate_object then null; end $$;

-- Index partiel : la visibilité élève et l'écran prof filtrent sur les cartes
-- QUI ONT une sous-section ; les autres se lisent déjà par `contenu_id`
-- (idx_quazian_flashcards_contenu, C7·L1).
create index if not exists idx_quazian_flashcards_section
  on quazian_flashcards(section_id) where section_id is not null;

commit;

-- ── Vérification (à exécuter après ; attendu : tout à `t`) ───────────────────
-- select
--   (select count(*) = 1 from information_schema.columns
--      where table_schema='public' and table_name='quazian_flashcards'
--        and column_name='section_id')                          as colonne_posee,
--   (select is_nullable = 'YES' from information_schema.columns
--      where table_schema='public' and table_name='quazian_flashcards'
--        and column_name='section_id')                          as nullable,
--   (select count(*) = 1 from pg_constraint
--      where conname = 'quazian_flashcards_section_chk')        as check_pose,
--   (select count(*) = 1 from pg_indexes where schemaname='public'
--      and indexname = 'idx_quazian_flashcards_section')        as index_pose,
--   (select confdeltype = 'n' from pg_constraint c              -- 'n' = SET NULL
--      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
--      where c.contype = 'f' and c.conrelid = 'quazian_flashcards'::regclass
--        and a.attname = 'section_id')                          as fk_set_null;
--
-- ── Constat d'entrée (attendu au 14/08 : 18 cartes, toutes au grain contenu) ─
-- select count(*) as cartes_partagees,
--        count(*) filter (where contenu_id is not null) as bras_contenu,
--        count(*) filter (where scriptorium_unite_id is not null) as bras_unite
-- from quazian_flashcards where eleve_id is null;

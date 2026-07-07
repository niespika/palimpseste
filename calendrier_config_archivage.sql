-- ════════════════════════════════════════════════════════════════════════════
-- Archivage des semestres (refonte /prof/calendrier/config)
-- ════════════════════════════════════════════════════════════════════════════
-- Ajoute un marqueur d'archivage à `semesters`. Sémantique : `archived_at is null`
-- = semestre vivant (affiché dans les listes de l'app) ; `archived_at is not null`
-- = archivé (masqué des listes, restaurable depuis l'onglet Archives de la config).
-- L'année scolaire n'est PAS stockée : elle se déduit des dates (rentrée sept → août)
-- côté application. Aucune donnée détruite par l'archivage (réversible).
--
-- Garde-fou applicatif (config/actions.ts) : on n'archive jamais le semestre actif.
-- Le code dégrade proprement AVANT cette migration (archived_at traité comme null),
-- donc la page reste fonctionnelle ; exécuter pour activer l'archivage.
--
-- Migration MANUELLE (preview puis prod). Voir AGENTS.md / workflow déploiement.

begin;

alter table semesters
  add column if not exists archived_at timestamptz;

-- Accélère le filtrage « vivants » (archived_at is null) des listes de l'app.
create index if not exists idx_semesters_archived_at
  on semesters (archived_at);

commit;

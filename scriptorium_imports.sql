-- scriptorium_imports — stockage TRANSITOIRE du texte d'un PDF déposé pour créer
-- un livre Aletheia en mode « 1 PDF découpé en semaines » (SPEC_import_pdf_scriptorium.md).
--
-- Le PDF lui-même n'est PAS conservé : on extrait son texte page par page (une
-- entrée du tableau `pages` = une page), on le garde ici le temps que le prof
-- découpe le livre (aperçu des bornes), puis la ligne est purgée à la création
-- du livre — ou par TTL best-effort (> 24 h) au prochain dépôt/chargement.
--
-- Accès SERVICE-ROLE uniquement (createAdminClient), filtré par user_id côté code.
-- Jamais exposé au navigateur ni à l'élève. RLS activé sans policy publique.

create table if not exists scriptorium_imports (
  import_id   uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  total_pages int  not null,
  pages       jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists scriptorium_imports_user_idx    on scriptorium_imports(user_id);
create index if not exists scriptorium_imports_created_idx  on scriptorium_imports(created_at);

alter table scriptorium_imports enable row level security;
-- Aucune policy : seul le service_role y accède (côté serveur, via l'admin client).

-- Retour arrière de `scriptorium_presentation.sql` (2026-09-14).
-- Retire la colonne ; ne supprime PAS les fichiers du bucket `scriptorium`
-- (chemins `<prof>/<contenu>/presentation.html`), à nettoyer à la main si besoin.
begin;
alter table scriptorium_contenus drop column if exists presentation_ref;
commit;
select not exists (select 1 from information_schema.columns
  where table_name = 'scriptorium_contenus' and column_name = 'presentation_ref') as colonne_retiree;

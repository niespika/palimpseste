-- Retour arrière audit Aletheia F1/F2 — uniquement avec le code d'avant.
-- Les copies et retours restent intacts. Les diagnostics invalidés depuis la
-- migration ne sont pas restaurables : ils devront être recalculés si nécessaire.
begin;
drop trigger if exists aletheia_versionner_copie on public.aletheia_travaux;
drop function if exists public.aletheia_versionner_copie();
drop function if exists public.aletheia_reclamer_retour(uuid, text);
drop function if exists public.aletheia_enregistrer_diagnostic(uuid, text, uuid, jsonb);
alter table public.aletheia_travaux
  drop column if exists v1_revision,
  drop column if exists vf_revision,
  drop column if exists retour_generation,
  drop column if exists retour_generation_at;
commit;

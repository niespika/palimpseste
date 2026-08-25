-- ============================================================================
-- C11b — Storage minimal et privé pour la nouvelle production
--
-- Ce fichier ne copie aucun objet. Il crée uniquement les cinq buckets attendus
-- par le code et remplace les anciennes policies directes par le seul accès
-- navigateur encore nécessaire : Fragments, dans le dossier d'un profil élève.
--
-- À exécuter d'abord en sandbox, puis en production (SUIVI_SQL.md).
-- ============================================================================

begin;

-- Les cinq buckets sont privés. Fragments est le seul upload direct depuis le
-- navigateur : le code produit toujours un JPEG visé à 0,8 Mo ; la marge à
-- 2 Mo protège le projet sans gêner l'usage normal.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  ('fragments',   'fragments',   false, 2000000, array['image/jpeg']::text[]),
  ('oraux',       'oraux',       false, null,    null),
  ('essais',      'essais',      false, null,    null),
  ('scriptorium', 'scriptorium', false, null,    null),
  ('codex',       'codex',       false, null,    null)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies historiques : les accès prof et les quatre autres buckets passent
-- désormais par service_role ou par des URL signées créées côté serveur.
drop policy if exists "Prof lit toutes les photos"      on storage.objects;
drop policy if exists "Prof supprime toutes les photos" on storage.objects;
drop policy if exists "eleve upload token oraux"        on storage.objects;
drop policy if exists "prof lit oraux"                  on storage.objects;
drop policy if exists "prof supprime oraux"             on storage.objects;
drop policy if exists "prof upload oraux"               on storage.objects;
drop policy if exists prof_delete_scriptorium            on storage.objects;
drop policy if exists prof_read_scriptorium              on storage.objects;
drop policy if exists prof_upload_scriptorium            on storage.objects;
drop policy if exists "Élève dépose ses photos"         on storage.objects;
drop policy if exists "Élève lit ses photos"            on storage.objects;
drop policy if exists "Élève supprime ses photos"       on storage.objects;

-- Noms stables : le fichier est rejouable sans empiler de policies.
drop policy if exists fragments_eleve_insert_own on storage.objects;
drop policy if exists fragments_eleve_select_own on storage.objects;
drop policy if exists fragments_eleve_update_own on storage.objects;
drop policy if exists fragments_eleve_delete_own on storage.objects;

create policy fragments_eleve_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fragments'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'eleve'::public.role_utilisateur
  )
);

-- SELECT et UPDATE sont requis par upload(..., { upsert: true }).
create policy fragments_eleve_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'fragments'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'eleve'::public.role_utilisateur
  )
);

create policy fragments_eleve_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'fragments'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'eleve'::public.role_utilisateur
  )
)
with check (
  bucket_id = 'fragments'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'eleve'::public.role_utilisateur
  )
);

create policy fragments_eleve_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fragments'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'eleve'::public.role_utilisateur
  )
);

-- Garde atomique : cinq buckets privés et exactement les quatre policies neuves.
do $$
declare
  buckets_prives integer;
  policies_neuves integer;
  policies_total integer;
begin
  select count(*) into buckets_prives
  from storage.buckets
  where (
      id = 'fragments'
      and public is false
      and file_size_limit = 2000000
      and allowed_mime_types = array['image/jpeg']::text[]
    )
    or (
      id in ('oraux', 'essais', 'scriptorium', 'codex')
      and public is false
      and file_size_limit is null
      and allowed_mime_types is null
    );

  select count(*) into policies_neuves
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname in (
      'fragments_eleve_insert_own',
      'fragments_eleve_select_own',
      'fragments_eleve_update_own',
      'fragments_eleve_delete_own'
    );

  select count(*) into policies_total
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects';

  if buckets_prives <> 5 then
    raise exception 'Storage C11b incomplet : % bucket(s) privé(s) sur 5', buckets_prives;
  end if;
  if policies_neuves <> 4 then
    raise exception 'Storage C11b incomplet : % policy/policies sur 4', policies_neuves;
  end if;
  if policies_total <> 4 then
    raise exception 'Storage C11b inattendu : % policies Storage au total, 4 attendues', policies_total;
  end if;
end
$$;

commit;

-- Vérification lisible après exécution.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('fragments', 'oraux', 'essais', 'scriptorium', 'codex')
order by id;

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

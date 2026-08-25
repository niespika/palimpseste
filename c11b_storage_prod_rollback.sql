-- ============================================================================
-- C11b — retour arrière des policies Storage
--
-- Ne supprime aucun bucket ni aucun fichier. Restaure les douze policies et
-- les réglages de buckets observés dans la sandbox avant C11b.
-- ============================================================================

begin;

update storage.buckets
set
  file_size_limit = null,
  allowed_mime_types = null
where id in ('fragments', 'oraux', 'essais', 'scriptorium', 'codex');

drop policy if exists fragments_eleve_insert_own on storage.objects;
drop policy if exists fragments_eleve_select_own on storage.objects;
drop policy if exists fragments_eleve_update_own on storage.objects;
drop policy if exists fragments_eleve_delete_own on storage.objects;

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

create policy "Prof lit toutes les photos"
on storage.objects for select
using (bucket_id = 'fragments' and public.est_prof());

create policy "Prof supprime toutes les photos"
on storage.objects for delete
using (bucket_id = 'fragments' and public.est_prof());

create policy "Élève dépose ses photos"
on storage.objects for insert
with check (
  bucket_id = 'fragments'
  and auth.uid()::text = (string_to_array(name, '/'))[1]
);

create policy "Élève lit ses photos"
on storage.objects for select
using (
  bucket_id = 'fragments'
  and auth.uid()::text = (string_to_array(name, '/'))[1]
);

create policy "Élève supprime ses photos"
on storage.objects for delete
using (
  bucket_id = 'fragments'
  and auth.uid()::text = (string_to_array(name, '/'))[1]
);

create policy "eleve upload token oraux"
on storage.objects for update
using (bucket_id = 'oraux' and public.est_prof());

create policy "prof lit oraux"
on storage.objects for select
using (
  bucket_id = 'oraux'
  and (public.est_prof() or auth.uid()::text = split_part(name, '/', 1))
);

create policy "prof supprime oraux"
on storage.objects for delete
using (bucket_id = 'oraux' and public.est_prof());

create policy "prof upload oraux"
on storage.objects for insert
with check (bucket_id = 'oraux' and public.est_prof());

create policy prof_delete_scriptorium
on storage.objects for delete
using (
  bucket_id = 'scriptorium'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'prof'::public.role_utilisateur
  )
);

create policy prof_read_scriptorium
on storage.objects for select
using (
  bucket_id = 'scriptorium'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'prof'::public.role_utilisateur
  )
);

create policy prof_upload_scriptorium
on storage.objects for insert
with check (
  bucket_id = 'scriptorium'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'prof'::public.role_utilisateur
  )
);

commit;

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

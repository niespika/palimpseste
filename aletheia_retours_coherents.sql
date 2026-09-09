-- Audit Aletheia F1/F2 — 08/09/2026.
-- Flux existant : code mergé/poussé d'abord, sandbox puis prod en fenêtre calme,
-- smoke élève immédiat. Retour arrière : aletheia_retours_coherents_rollback.sql.
-- Répétition : extraire le corps BEGIN/COMMIT, puis vérifier après ROLLBACK.
begin;

alter table public.aletheia_travaux
  add column if not exists v1_revision uuid not null default gen_random_uuid(),
  add column if not exists vf_revision uuid not null default gen_random_uuid(),
  add column if not exists retour_generation uuid,
  add column if not exists retour_generation_at timestamptz;

-- La version change dans la MÊME transaction que la copie. L'invalidation et
-- l'enregistrement d'un diagnostic prennent toujours le verrou travail AVANT diagnostic.
create or replace function public.aletheia_versionner_copie()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  v1_change boolean;
  vf_change boolean;
begin
  v1_change := row(new.these, new.arguments, new.accord, new.questions, new.vocabulaire,
                   new.champ_fixe, new.rappel, new.tournante_cle, new.forme)
    is distinct from row(old.these, old.arguments, old.accord, old.questions, old.vocabulaire,
                         old.champ_fixe, old.rappel, old.tournante_cle, old.forme)
    or (old.statut = 'DRAFT' and new.statut = 'V1_SUBMITTED');
  vf_change := v1_change or row(new.these_vf, new.arguments_vf, new.accord_vf,
                                new.champ_fixe_vf, new.reponses_relances)
    is distinct from row(old.these_vf, old.arguments_vf, old.accord_vf,
                         old.champ_fixe_vf, old.reponses_relances)
    or (old.statut = 'FEEDBACK1_READY' and new.statut = 'VF_SUBMITTED');
  if v1_change then
    new.v1_revision := gen_random_uuid();
    update public.aletheia_diagnostic set inventaire_v1 = null, niveau_these_v1 = null,
      niveau_arguments_v1 = null, these_mal_definie_v1 = null, erreur_at = null,
      updated_at = clock_timestamp() where travail_id = new.id;
  end if;
  if vf_change then
    new.vf_revision := gen_random_uuid();
    update public.aletheia_diagnostic set inventaire_vf = null, niveau_these_vf = null,
      niveau_arguments_vf = null, these_mal_definie_vf = null, erreur_at = null,
      updated_at = clock_timestamp() where travail_id = new.id;
  end if;
  if v1_change or vf_change or new.statut is distinct from old.statut then
    new.retour_generation := null;
    new.retour_generation_at := null;
  end if;
  return new;
end $$;

drop trigger if exists aletheia_versionner_copie on public.aletheia_travaux;
create trigger aletheia_versionner_copie before update on public.aletheia_travaux
  for each row execute function public.aletheia_versionner_copie();

-- Réservation avec bail de 90 s. Le snapshot et le jeton sont rendus ensemble ;
-- jamais une lecture de copie indépendante de la réservation.
create or replace function public.aletheia_reclamer_retour(p_travail uuid, p_phase text)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare t public.aletheia_travaux%rowtype;
begin
  if p_phase not in ('v1', 'vf') or p_phase is null then raise exception 'Phase inconnue'; end if;
  select * into t from public.aletheia_travaux where id = p_travail for update;
  if not found or t.statut <> (case p_phase when 'v1' then 'V1_SUBMITTED' else 'VF_SUBMITTED' end) then return null; end if;
  if t.retour_generation is not null and t.retour_generation_at > clock_timestamp() - interval '90 seconds' then return null; end if;
  update public.aletheia_travaux set retour_generation = gen_random_uuid(),
    retour_generation_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = p_travail returning * into t;
  return to_jsonb(t);
end $$;

-- Enregistre UNE phase ; un échec VF ne jette jamais une V1 réussie. Le verrou
-- et la version empêchent une tâche ancienne de réintroduire un diagnostic invalidé.
-- p_resultat NULL marque l'échec, sans écraser une phase déjà réussie.
create or replace function public.aletheia_enregistrer_diagnostic(
  p_travail uuid, p_phase text, p_revision uuid, p_resultat jsonb
) returns boolean language plpgsql set search_path = public, pg_temp as $$
declare t public.aletheia_travaux%rowtype;
begin
  if p_phase not in ('v1', 'vf') or p_phase is null then raise exception 'Phase inconnue'; end if;
  select * into t from public.aletheia_travaux where id = p_travail for update;
  if not found then return false; end if;
  if p_phase = 'v1' then
    if t.v1_revision is distinct from p_revision or t.statut not in ('FEEDBACK1_READY','VF_SUBMITTED','FEEDBACK2_READY','DONE') then return false; end if;
  else
    if t.vf_revision is distinct from p_revision or t.statut not in ('FEEDBACK2_READY','DONE') then return false; end if;
  end if;
  insert into public.aletheia_diagnostic (travail_id, eleve_id, scriptorium_livre_id, semaine_index)
    values (t.id, t.eleve_id, t.scriptorium_livre_id, t.semaine_index)
    on conflict (travail_id) do nothing;
  if p_phase = 'v1' then
    update public.aletheia_diagnostic set
      inventaire_v1 = p_resultat->'inventaire',
      niveau_these_v1 = (p_resultat->'niveaux'->>'niveau_these')::smallint,
      niveau_arguments_v1 = (p_resultat->'niveaux'->>'niveau_arguments')::smallint,
      these_mal_definie_v1 = (p_resultat->'niveaux'->>'these_mal_definie')::boolean,
      erreur_at = case when p_resultat is null then clock_timestamp() else null end,
      updated_at = clock_timestamp()
    where travail_id = t.id and inventaire_v1 is null;
  else
    update public.aletheia_diagnostic set
      inventaire_vf = p_resultat->'inventaire',
      niveau_these_vf = (p_resultat->'niveaux'->>'niveau_these')::smallint,
      niveau_arguments_vf = (p_resultat->'niveaux'->>'niveau_arguments')::smallint,
      these_mal_definie_vf = (p_resultat->'niveaux'->>'these_mal_definie')::boolean,
      erreur_at = case when p_resultat is null then clock_timestamp() else null end,
      updated_at = clock_timestamp()
    where travail_id = t.id and inventaire_vf is null;
  end if;
  return found;
end $$;

revoke all on function public.aletheia_versionner_copie() from public, anon, authenticated;
revoke all on function public.aletheia_reclamer_retour(uuid, text) from public, anon, authenticated;
revoke all on function public.aletheia_enregistrer_diagnostic(uuid, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.aletheia_reclamer_retour(uuid, text) to service_role;
grant execute on function public.aletheia_enregistrer_diagnostic(uuid, text, uuid, jsonb) to service_role;

commit;

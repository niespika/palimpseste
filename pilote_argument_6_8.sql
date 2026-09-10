-- Pilote argument : tables additives, porte OFF. Sandbox avant production.
begin;
alter table public.scriptorium_params add column if not exists pilote_argument_actif boolean not null default false;

create table if not exists public.exercices_pilote_argument (
  exercice_id uuid primary key references public.exercices(id) on delete cascade,
  requete_id uuid not null unique,
  contrat jsonb not null check (jsonb_typeof(contrat) = 'object'),
  created_at timestamptz not null default now()
);
create table if not exists public.exercices_pilote_argument_jugements (
  depot_id uuid not null references public.exercices_depots(id) on delete cascade,
  version text not null check (version in ('v1', 'vf')),
  empreinte_texte text not null,
  empreinte_pedagogique text not null,
  extraction jsonb not null,
  jugement jsonb not null,
  modele text not null,
  created_at timestamptz not null default now(),
  primary key (depot_id, version)
);
alter table public.exercices_pilote_argument enable row level security;
alter table public.exercices_pilote_argument_jugements enable row level security;
revoke all on public.exercices_pilote_argument, public.exercices_pilote_argument_jugements from anon, authenticated;
grant all on public.exercices_pilote_argument, public.exercices_pilote_argument_jugements to service_role;

-- Un contrat présenté ne se réécrit pas. Créer une nouvelle attribution pour le modifier.
create or replace function public.pilote_argument_contrat_immuable() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin raise exception 'Le contrat du pilote est figé à son attribution'; end $$;
drop trigger if exists pilote_argument_immuable on public.exercices_pilote_argument;
create trigger pilote_argument_immuable before update on public.exercices_pilote_argument
for each row execute function public.pilote_argument_contrat_immuable();
revoke all on function public.pilote_argument_contrat_immuable() from public, anon, authenticated;

-- Appel réservé au serveur, après contrôle professeur et admissibilité Scriptorium.
-- Instance, contrat et dépôts sont créés ensemble ; la clé de requête rend le clic idempotent.
create or replace function public.attribuer_pilote_argument(p_requete uuid, p_contrat jsonb, p_eleves uuid[], p_echeance timestamptz)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare ex uuid; classe uuid; sujet uuid; modes jsonb; principale text; secondaire text; typ uuid;
begin
  if not exists(select 1 from scriptorium_params where id=1 and pilote_argument_actif) then raise exception 'Pilote fermé'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_requete::text, 0));
  select exercice_id into ex from exercices_pilote_argument where requete_id=p_requete;
  if ex is not null then return ex; end if;
  classe := (p_contrat->>'classe_id')::uuid;
  sujet := (p_contrat->'sujet'->>'id')::uuid;
  principale := p_contrat->>'principale'; secondaire := p_contrat->>'secondaire';
  if principale not in ('argumentation','expression','structure') or principale is null
    or (secondaire is not null and (secondaire not in ('argumentation','expression','structure') or secondaire=principale))
    or (p_contrat->>'cran')::int not in (6,8) then raise exception 'Prescription invalide'; end if;
  if coalesce(cardinality(p_eleves),0)=0 or exists(
    select 1 from unnest(p_eleves) e where not exists(
      select 1 from inscriptions i join classes c on c.id=i.classe_id
      where i.eleve_id=e and i.classe_id=classe and i.statut='active' and c.statut='active'))
  then raise exception 'Inscription incompatible'; end if;
  if not exists(select 1 from exercices_sujets where id=sujet and statut='valide' and not bloque
    and enonce=p_contrat->'sujet'->>'enonce' and cours_etat='notions') then raise exception 'Sujet modifié ou indisponible'; end if;
  select id into strict typ from exercices_types where code='argument';
  modes := jsonb_build_object(principale,jsonb_build_array('composer'));
  if secondaire is not null then modes := modes || jsonb_build_object(secondaire,jsonb_build_array('composer')); end if;
  insert into exercices(type_id, classe_id, lieu, consigne_instanciee, cran, cible_primaire, modes_par_competence,
    statut, paire_diagnostic, materiau_source_sujet_id, id_import)
  values(typ,classe,'maison',to_jsonb(p_contrat->>'consigne'),(p_contrat->>'cran')::int,principale,modes,
    'assigne',false,sujet,'pilote-argument-'||p_requete) returning id into ex;
  insert into exercices_pilote_argument(exercice_id,requete_id,contrat) values(ex,p_requete,p_contrat);
  insert into exercices_depots(exercice_id,eleve_id,statut,origine,echeance)
    select ex,e,'assigne','prof',p_echeance from (select distinct unnest(p_eleves) e) x;
  return ex;
end $$;
revoke all on function public.attribuer_pilote_argument(uuid,jsonb,uuid[],timestamptz) from public, anon, authenticated;
grant execute on function public.attribuer_pilote_argument(uuid,jsonb,uuid[],timestamptz) to service_role;

-- Écrit la trace sur la copie effectivement enregistrée, sous verrou de dépôt.
create or replace function public.enregistrer_relecture_argument(p_depot uuid,p_eleve uuid,p_texte text,p_trace jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare d exercices_depots;
begin
  if not exists(select 1 from scriptorium_params where id=1 and pilote_argument_actif) then raise exception 'Pilote fermé'; end if;
  select * into strict d from exercices_depots where id=p_depot and eleve_id=p_eleve for update;
  if d.v1_remis_at is not null or d.statut not in ('assigne','ouvert') or d.texte_v1 is distinct from p_texte
    or not exists(select 1 from exercices_pilote_argument where exercice_id=d.exercice_id and contrat->>'cran'='6')
    then raise exception 'Le texte a changé ou ne peut plus être relu'; end if;
  insert into exercices_metacognition(depot_id,credence) values(p_depot,jsonb_build_array(p_trace))
  on conflict(depot_id) do update set credence=
    coalesce((select jsonb_agg(e) from jsonb_array_elements(coalesce(exercices_metacognition.credence,'[]')) e
      where e->>'forme' is distinct from 'auto_test'),'[]'::jsonb)||jsonb_build_array(p_trace);
end $$;
revoke all on function public.enregistrer_relecture_argument(uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.enregistrer_relecture_argument(uuid,uuid,text,jsonb) to service_role;
commit;

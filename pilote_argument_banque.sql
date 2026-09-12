-- Raccordement automatique du pilote : nouvelle porte OFF, attribution atomique.
-- Ne remplace ni les contrats existants ni la RPC manuelle.
begin;
alter table public.scriptorium_params add column if not exists pilote_argument_banque_actif boolean not null default false;

create table if not exists public.pilote_argument_services (
  eleve_id uuid not null references public.profiles(id) on delete cascade,
  cycle_lundi date not null,
  bonus_rang integer not null check (bonus_rang >= -1), -- -1 = semaine entière
  resultat jsonb not null,
  created_at timestamptz not null default now(),
  primary key(eleve_id, cycle_lundi, bonus_rang)
);
alter table public.pilote_argument_services enable row level security;
revoke all on public.pilote_argument_services from public, anon, authenticated;
grant all on public.pilote_argument_services to service_role;

-- Une transaction pour la semaine MIXTE entière : aucune décision orpheline,
-- aucun contrat sans dépôt. Deux appels concurrents retrouvent le premier résultat.
create or replace function public.servir_banque_argument(
  p_eleve uuid, p_cycle date, p_bonus_rang integer, p_lignes jsonb, p_contrats jsonb, p_echeance timestamptz
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare l jsonb; c jsonb; ex uuid; dec_id uuid; dep_id uuid; typ uuid;
  principale text; secondaire text; modes jsonb; classe uuid; sujet uuid;
  resultat jsonb; depots jsonb := '[]'::jsonb;
begin
  if not exists(select 1 from scriptorium_params where id=1 and routeur_actif and exercices_actif
    and pilote_argument_actif and pilote_argument_banque_actif) then raise exception 'Distribution argument fermée'; end if;
  if extract(isodow from p_cycle) <> 1 or p_bonus_rang < -1 or p_bonus_rang is null
    or jsonb_typeof(p_lignes) is distinct from 'array' or jsonb_array_length(p_lignes)=0
    or (p_bonus_rang >= 0 and jsonb_array_length(p_lignes)<>1)
    or jsonb_typeof(p_contrats) is distinct from 'object' then raise exception 'Service invalide'; end if;
  perform pg_advisory_xact_lock(hashtextextended('argument-auto:'||p_eleve||':'||p_cycle,0));
  select s.resultat into resultat from pilote_argument_services s
    where s.eleve_id=p_eleve and s.cycle_lundi=p_cycle and s.bonus_rang=p_bonus_rang;
  if resultat is not null then return resultat || '{"deja_servi":true}'::jsonb; end if;
  -- Compatibilité avec les semaines posées avant ce raccordement : aucun rattrapage.
  if p_bonus_rang=-1 and exists(select 1 from routeur_decisions where eleve_id=p_eleve and cycle_lundi=p_cycle
    and not bonus and regle_declenchee is distinct from 'override_prof') then
    return '{"deja_servi":true,"depots":[]}'::jsonb;
  end if;
  if p_bonus_rang>=0 and (select count(*) from routeur_decisions where eleve_id=p_eleve and cycle_lundi=p_cycle and bonus)<>p_bonus_rang
    then raise exception 'Le quota bonus a changé : reprendre la sélection'; end if;
  for l in select value from jsonb_array_elements(p_lignes) loop
    if l->>'eleve_id' is distinct from p_eleve::text or l->>'cycle_lundi' is distinct from p_cycle::text
      then raise exception 'Décision étrangère au service'; end if;
    ex := (l->>'exercice_id')::uuid;
    c := p_contrats->(ex::text);
    if c is not null then
      classe := (c->>'classe_id')::uuid; sujet := (c->'sujet'->>'id')::uuid;
      principale := c->>'principale'; secondaire := c->>'secondaire';
      if principale is null or principale not in ('argumentation','expression','structure')
        or principale is distinct from l->>'cible_retenue'
        or (secondaire is not null and (secondaire not in ('argumentation','expression','structure') or secondaire=principale))
        or coalesce((c->>'cran')::int,0) not in (6,8)
        or nullif(c->>'empreinte_pedagogique','') is null
        or coalesce(jsonb_array_length(c->'admissibilite'->'cours_ids'),0)=0
        or exists(select 1 from jsonb_array_elements(coalesce(l->'sondes_retenues','[]')) s where (s->>'sonde_montee')::boolean is distinct from true)
        then raise exception 'Contrat automatique invalide'; end if;
      if not exists(select 1 from inscriptions i join classes cl on cl.id=i.classe_id
        where i.eleve_id=p_eleve and i.classe_id=classe and i.statut='active' and cl.statut='active'
        and ((c->>'parcours'='TC' and cl.niveau='terminale' and cl.type_pedagogique='tc')
          or (c->>'parcours'='THLP' and cl.niveau='terminale' and cl.type_pedagogique='hlp')
          or (c->>'parcours'='1HLP' and cl.niveau in ('1ere','premiere') and cl.type_pedagogique='hlp')))
        then raise exception 'Inscription incompatible'; end if;
      perform 1 from exercices_sujets where id=sujet and statut='valide' and not bloque and cours_etat='notions'
        and enonce=c->'sujet'->>'enonce' and to_jsonb(notions)=c->'sujet'->'notions'
        and forme=case when c->>'parcours'='TC' then 'dissertation_tc' else 'essai_hlp' end for share;
      if not found then raise exception 'Sujet modifié ou indisponible'; end if;
      select id into strict typ from exercices_types where code='argument';
      modes := jsonb_build_object(principale,jsonb_build_array('composer'));
      if secondaire is not null then modes := modes || jsonb_build_object(secondaire,jsonb_build_array('composer')); end if;
      insert into exercices(id,type_id,classe_id,lieu,consigne_instanciee,cran,cible_primaire,modes_par_competence,
        statut,paire_diagnostic,materiau_source_sujet_id,id_import)
      values(ex,typ,classe,'maison',to_jsonb(c->>'consigne'),(c->>'cran')::int,principale,modes,
        'assigne',false,sujet,'pilote-argument-auto-'||ex);
      insert into exercices_pilote_argument(exercice_id,requete_id,contrat) values(ex,ex,c);
    else
      -- La banque ordinaire garde ses instances ; un pilote ancien n'est jamais
      -- réutilisé comme un modèle universel par cette branche.
      if not exists(select 1 from exercices e where id=ex and not bloque and statut in ('concu','assigne') and lieu='maison'
        and coalesce(id_import,'') not like 'pilote-argument-%'
        and (classe_id is null or exists(select 1 from inscriptions i join classes cl on cl.id=i.classe_id
          where i.eleve_id=p_eleve and i.classe_id=e.classe_id and i.statut='active' and cl.statut='active')))
        then raise exception 'Instance indisponible'; end if;
    end if;
    insert into routeur_decisions(eleve_id,cycle_lundi,exercice_id,cible_retenue,regle_declenchee,alternatives_ecartees,
      sondes_retenues,propositions_iso_duree,choix_eleve,borne_amont,tirage_aleatoire,etat_escalade,degrade,bonus)
    values(p_eleve,p_cycle,ex,l->>'cible_retenue',l->>'regle_declenchee',l->'alternatives_ecartees',l->'sondes_retenues',
      nullif(l->'propositions_iso_duree','null'::jsonb),null,l->'borne_amont',nullif(l->'tirage_aleatoire','null'::jsonb),
      l->'etat_escalade',coalesce((l->>'degrade')::boolean,false),p_bonus_rang>=0) returning id into dec_id;
    insert into exercices_depots(eleve_id,exercice_id,origine,routeur_decision_id,assigne_at,echeance)
    values(p_eleve,ex,'routeur',dec_id,p_cycle::timestamp at time zone 'UTC' + interval '12 hours',p_echeance) returning id into dep_id;
    depots := depots || jsonb_build_array(jsonb_build_object('depot_id',dep_id,'exercice_id',ex,'decision_id',dec_id));
  end loop;
  resultat := jsonb_build_object('deja_servi',false,'depots',depots);
  insert into pilote_argument_services(eleve_id,cycle_lundi,bonus_rang,resultat) values(p_eleve,p_cycle,p_bonus_rang,resultat);
  return resultat;
end $$;
revoke all on function public.servir_banque_argument(uuid,date,integer,jsonb,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.servir_banque_argument(uuid,date,integer,jsonb,jsonb,timestamptz) to service_role;
commit;

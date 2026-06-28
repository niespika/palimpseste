-- ════════════════════════════════════════════════════════════════════════════
-- Fuseau horaire d'affichage configurable par le prof (singleton global)
-- ════════════════════════════════════════════════════════════════════════════
-- Le fuseau choisi pilote l'affichage des INSTANTS (timestamptz : created_at,
-- lance_at, photo_prise_at, échéances avec heure…) ET le calcul du « jour courant /
-- sur quel jour tombe un événement » (cf. jourDansFuseau, ex-jourParis). Les dates
-- pures (colonnes `date` : semestres, vacances, grille de semaines) restent en UTC.
-- Singleton calqué sur integrite_params (id=1). Lu côté serveur via le service_role
-- (cf. utils/fuseau-serveur.ts → lireFuseau, seul point d'accès). Défaut : Montréal.
--
-- Migration MANUELLE (preview puis prod). Voir AGENTS.md / workflow déploiement.

begin;

create table if not exists calendrier_params (
  id          integer primary key default 1,
  fuseau      text not null default 'America/Toronto',
  updated_at  timestamptz not null default now(),
  constraint calendrier_params_singleton check (id = 1)
);
insert into calendrier_params (id) values (1) on conflict (id) do nothing;

-- RLS : lecture par tous (les élèves ont besoin de l'heure), écriture prof seul.
alter table calendrier_params enable row level security;
drop policy if exists calendrier_params_lecture on calendrier_params;
create policy calendrier_params_lecture on calendrier_params
  for select using (true);
drop policy if exists calendrier_params_prof_ecriture on calendrier_params;
create policy calendrier_params_prof_ecriture on calendrier_params
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

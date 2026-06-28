-- ════════════════════════════════════════════════════════════════════════════
-- Journal d'événements « intégrité » — historique daté (strike / blocage / déblocage)
-- ════════════════════════════════════════════════════════════════════════════
-- Complète integrite_petits_malins.sql (déjà appliqué). Les signalements existants
-- (table integrite_signalements) restent la source des AVIS (1 par rendu fautif) ;
-- ce journal ajoute la TRAÇABILITÉ des transitions d'état au niveau de l'élève :
--   • strike    : un strike a été comptabilisé (algo direct OU IA confirmé par le prof)
--   • blocage   : l'élève vient d'être bloqué (auto au seuil, ou manuel par le prof)
--   • deblocage : le prof a débloqué l'élève (-1 strike)
-- Sert à la fois le tableau « Historique » prof (nb de déblocages = count des
-- événements 'deblocage') et la page élève (/eleve/integrite : chronologie).
--
-- Migration MANUELLE (preview puis prod). Voir AGENTS.md / workflow déploiement.

begin;

create table if not exists integrite_evenements (
  id             uuid primary key default gen_random_uuid(),
  eleve_id       uuid not null references profiles(id) on delete cascade,
  type           text not null check (type in ('strike', 'blocage', 'deblocage')),
  source         text,                 -- 'algo' | 'ia' | 'manuel' | 'auto' (null toléré)
  signalement_id uuid references integrite_signalements(id) on delete set null,
  module         text,                 -- snapshot lisible (le signalement peut disparaître)
  motif          text,                 -- snapshot du motif
  strikes_avant  integer,
  strikes_apres  integer,
  acteur_id      uuid references profiles(id) on delete set null, -- prof ; null si auto/élève
  created_at     timestamptz not null default now()
);
create index if not exists idx_integrite_evenements_eleve
  on integrite_evenements(eleve_id, created_at desc);

-- ── RLS : lecture/écriture directe réservée au prof (le code serveur passe par le
-- service_role qui contourne RLS ; l'élève lit ses événements via le service_role) ──
alter table integrite_evenements enable row level security;
drop policy if exists integrite_evenements_prof_all on integrite_evenements;
create policy integrite_evenements_prof_all on integrite_evenements
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

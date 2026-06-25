-- ════════════════════════════════════════════════════════════════════════════
-- Détection « petits malins » transverse (Aletheia, Codex, Fragments)
-- ════════════════════════════════════════════════════════════════════════════
-- Strike = rendu vide / aveu détecté SANS IA (auto, source 'algo', comptabilisé
-- direct) OU rendu hors-sujet / bâclé repéré par l'IA puis CONFIRMÉ par le prof
-- (source 'ia'). À `seuil_strikes` (défaut 3) strikes, l'élève ne peut plus rien
-- rendre ni réviser ses flashcards (le quizz reste ouvert) jusqu'au déblocage prof.
-- Déblocage = -1 strike (le prochain incident re-bloque). Tout est éditable par le
-- prof (seuil + messages + interrupteur global), actif par défaut.
--
-- Migration MANUELLE (preview puis prod). Voir AGENTS.md / workflow déploiement.

begin;

-- ── Journal des signalements (1 par rendu fautif ; source du « à faire » prof) ──
create table if not exists integrite_signalements (
  id            uuid primary key default gen_random_uuid(),
  eleve_id      uuid not null references profiles(id) on delete cascade,
  module        text not null check (module in ('aletheia', 'codex', 'fragments')),
  rendu_ref     text not null,            -- id stable du rendu → dédup : 1 strike / rendu
  type          text not null,            -- vide | aveu_non_travail | hors_sujet | section_na | bacle
  motif         text,                     -- phrase courte (affichée au prof)
  source        text not null check (source in ('algo', 'ia')),
  -- en_attente : signal IA, attend la décision prof (confirmer → +1 strike, ou écarter)
  -- confirme   : compte comme strike (algo direct, ou IA confirmé par le prof)
  -- rejete     : prof a écarté (faux positif) — ne compte pas
  statut        text not null default 'confirme'
                check (statut in ('en_attente', 'confirme', 'rejete')),
  compte_strike boolean not null default false,  -- true quand le strike a été comptabilisé
  acquitte_at   timestamptz,              -- prof a traité l'alerte (sort du « à faire »)
  created_at    timestamptz not null default now(),
  unique (eleve_id, module, rendu_ref)
);
create index if not exists idx_integrite_signalements_eleve on integrite_signalements(eleve_id);
create index if not exists idx_integrite_signalements_afaire on integrite_signalements(acquitte_at) where acquitte_at is null;

-- ── Compteur + blocage au niveau de l'élève (global, tous modules) ─────────────
alter table profiles
  add column if not exists integrite_strikes   integer     not null default 0,
  add column if not exists integrite_bloque    boolean     not null default false,
  add column if not exists integrite_bloque_at timestamptz;

-- ── Paramètres globaux (1 ligne ; message null → défaut du code) ───────────────
create table if not exists integrite_params (
  id             integer primary key default 1,
  actif          boolean not null default true,
  seuil_strikes  integer not null default 3,
  message_strike text,
  message_bloque text,
  updated_at     timestamptz not null default now(),
  constraint integrite_params_singleton check (id = 1)
);
insert into integrite_params (id) values (1) on conflict (id) do nothing;

-- ── RLS : lecture/écriture directe réservée au prof (le code serveur passe par le
-- service_role qui contourne RLS) ─────────────────────────────────────────────
alter table integrite_params enable row level security;
drop policy if exists integrite_params_prof_all on integrite_params;
create policy integrite_params_prof_all on integrite_params
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

alter table integrite_signalements enable row level security;
drop policy if exists integrite_signalements_prof_all on integrite_signalements;
create policy integrite_signalements_prof_all on integrite_signalements
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

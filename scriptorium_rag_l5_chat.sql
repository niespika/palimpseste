-- ============================================================================
-- SCRIPTORIUM RAG — Lot L5 : chat élève (conversations + messages).
-- Fichier : scriptorium_rag_l5_chat.sql — cf. SPEC_scriptorium_rag.md §7.2.
-- ----------------------------------------------------------------------------
-- Deux tables. RLS :
--  • l'élève LIT et gère SES conversations (renommage, soft-delete) et LIT les
--    messages de ses conversations (affichage du fil) ;
--  • l'ÉCRITURE des messages passe par la route serveur (service role) — le
--    coût/modèle y sont journalisés, le quota appliqué ;
--  • AUCUNE policy prof : l'engagement « le prof ne lit pas les transcripts »
--    est tenu au niveau DB (§2 décision 7). Seuls les traitements serveur
--    (synthèse hebdo L7, via client admin) y accèdent.
-- Idempotent, additif, rejouable. Aucune donnée détruite.
-- Prérequis : scriptorium_rag_l1.sql (colonnes rag_* de scriptorium_params).
-- ============================================================================

begin;

create table if not exists scriptorium_conversations (
  id          uuid primary key default gen_random_uuid(),
  eleve_id    uuid not null references profiles(id) on delete cascade,
  classe_id   uuid not null references classes(id) on delete cascade,
  titre       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  supprime_at timestamptz                    -- soft-delete élève (la synthèse hebdo lit TOUT)
);
create index if not exists idx_conversations_eleve
  on scriptorium_conversations(eleve_id, classe_id) where supprime_at is null;

create table if not exists scriptorium_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references scriptorium_conversations(id) on delete cascade,
  role            text not null check (role in ('eleve', 'assistant')),
  contenu         text not null,
  modele          text,                      -- traçabilité du modèle ayant produit la réponse
  cout            numeric,                   -- coût du tour assistant (usd)
  created_at      timestamptz not null default now()
);
create index if not exists idx_messages_conversation
  on scriptorium_messages(conversation_id, created_at);

alter table scriptorium_conversations enable row level security;
alter table scriptorium_messages      enable row level security;

-- L'élève gère SES conversations (lecture, création, renommage, soft-delete).
drop policy if exists conversations_eleve_all on scriptorium_conversations;
create policy conversations_eleve_all on scriptorium_conversations
  for all
  using (eleve_id = auth.uid())
  with check (eleve_id = auth.uid());

-- L'élève LIT les messages de ses conversations (l'écriture vient du serveur).
drop policy if exists messages_eleve_select on scriptorium_messages;
create policy messages_eleve_select on scriptorium_messages
  for select
  using (exists (
    select 1 from scriptorium_conversations c
    where c.id = conversation_id and c.eleve_id = auth.uid()
  ));

commit;

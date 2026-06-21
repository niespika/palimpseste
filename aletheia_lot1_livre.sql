-- ============================================================================
-- Aletheia — Lot 1 : type de contenu « Livre » dans Scriptorium
-- ----------------------------------------------------------------------------
-- Évolution ADDITIVE. Un « Livre » réutilise le modèle d'unité existant plutôt
-- que d'introduire un modèle parallèle (cf. SPEC_Aletheia_Lot1) :
--
--   • Livre        = une ligne `scriptorium_unites` avec `type = 'livre'`
--                    (label = titre général ; + `date_debut`, `nb_semaines`).
--   • Semaine      = une ligne `scriptorium_documents` rattachée à ce livre
--                    (`semaine` = index, `titre`, `chapitres`, `fichier_ref` =
--                    le PDF d'ancrage, `texte_extrait` = texte extrait du PDF).
--   • Classes      = assignation par semaine via `scriptorium_document_classes`
--                    (table de liaison Lot 6, détachement à l'effacement Lot 2).
--
-- Aletheia (lots 2+) ne possède que ses propres tables `aletheia_*` ; côté
-- Scriptorium il référencera `scriptorium_livre_id = scriptorium_unites.id`
-- (les semaines = documents de cette unité, ordonnés par `semaine`).
--
-- Le discriminant `type` permet aux autres modules (Quazian, Codex) d'EXCLURE
-- les livres de leurs sélecteurs d'unités « de cours » (filtre `type = 'unite'`).
-- Les lignes existantes prennent le défaut 'unite' → aucun impact sur les données.
--
-- ⚠️ COUPLAGE CODE ↔ MIGRATION : le code de ce lot ajoute `.eq('type','unite')`
-- à des pages Quazian/Codex DÉJÀ déployées (quazian/page.tsx, quazian/actions.ts,
-- quazian/quizz/page.tsx, codex/actions.ts) + la page Scriptorium lit `type`.
-- PostgREST renvoie une 400 si la colonne n'existe pas → ces pickers d'unités
-- deviennent vides tant que CETTE migration n'est pas appliquée. À exécuter AVANT
-- (ou avec) le déploiement du code — ce n'est PAS optionnel.
-- ============================================================================

begin;

-- ── 1. Discriminant + métadonnées de livre, portées par le conteneur (unité) ─
alter table scriptorium_unites
  add column if not exists type text not null default 'unite';   -- 'unite' | 'livre'

-- Garde le discriminant fiable (tout le filtrage Quazian/Codex en dépend).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'scriptorium_unites_type_chk') then
    alter table scriptorium_unites
      add constraint scriptorium_unites_type_chk check (type in ('unite', 'livre'));
  end if;
end $$;

alter table scriptorium_unites
  add column if not exists date_debut date;                      -- début de lecture (livre)

alter table scriptorium_unites
  add column if not exists nb_semaines integer;                  -- durée de lecture (livre)

-- ── 2. Référence des chapitres à lire pour une semaine de livre (texte libre) ─
-- Sert au planning de l'élève (« Chap. 1-4 ») ; l'élève lit son propre exemplaire.
alter table scriptorium_documents
  add column if not exists chapitres text;

commit;

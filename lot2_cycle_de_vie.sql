-- ============================================================================
-- Lot 2 — Cycle de vie d'une classe
-- ----------------------------------------------------------------------------
-- L'effacement d'une classe et le retrait d'un élève sont entièrement gérés
-- côté application (action serveur `effacerClasse` / `retirerEleve`), qui :
--   * purge le STOCKAGE (photos fragments/essais, audio oraux, manuscrits Codex)
--     — les cascades SQL ne suppriment QUE les lignes, pas les fichiers ;
--   * SUPPRIME le travail élève scopé (via cascade `inscriptions → inscription_id`) ;
--   * DÉTACHE le contenu prof (Scriptorium, définitions de quizz) ;
--   * ne touche jamais aux comptes élèves ni au travail d'autres classes.
--
-- Côté schéma, le Lot 2 n'ajoute qu'un marqueur d'écartement de rappel.
-- (Décision : « cette classe continue » se tait jusqu'à l'effacement → booléen.)
-- ============================================================================

begin;

-- Rappel de fin d'année (30/06 & 30/08) calculé à l'ouverture du dashboard.
-- true = le prof a répondu « cette classe continue » → plus jamais relancé.
alter table classes
  add column if not exists rappel_ecarte boolean not null default false;

-- Le détachement vide la réf classe (texte legacy) des unités Scriptorium pour
-- qu'une classe homonyme n'hérite de rien. Garantir que la colonne est nullable
-- (no-op si elle l'est déjà).
alter table scriptorium_unites alter column classe drop not null;

-- ── Effacement atomique d'une classe ────────────────────────────────────────
-- Tout l'effacement DB en UNE transaction (les appels supabase-js séparés ne le
-- seraient pas → risque d'état partiel). La purge du STOCKAGE reste côté action
-- (collecte des chemins avant l'appel, suppression des fichiers après succès).
--
-- SUPPRIME : le travail élève scopé (via cascade inscriptions → inscription_id),
--   les notes /20 de semestre (texte legacy non cascadé), les séances Codex
--   (FK en SET NULL), classe_modules (cascade).
-- DÉTACHE : Scriptorium (classe_id + texte legacy), quazian_publications, et
--   quazian_quizzes.classe_id (SET NULL automatique au delete de la classe).
-- NE TOUCHE PAS : comptes élèves, travail d'autres classes.
create or replace function effacer_classe(p_classe_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_nom text;
begin
  select nom into v_nom from classes where id = p_classe_id;
  if v_nom is null then return; end if;

  -- Journal de révision (défensif : au cas où la FK card_state ne cascade pas)
  delete from quazian_review_log rl
   using quazian_card_states cs, inscriptions i
   where rl.card_state_id = cs.id
     and cs.inscription_id = i.id
     and i.classe_id = p_classe_id;

  -- SUPPRIMER ce que la cascade « classe » ne couvre pas
  delete from quazian_semester where classe_id = v_nom;       -- notes /20 (texte legacy)
  delete from codex_sessions   where classe_id = p_classe_id; -- séances (FK SET NULL)

  -- DÉTACHER le contenu prof (vider la réf classe, garder le contenu)
  update scriptorium_unites
     set classe_id = null, classe = null
   where classe_id = p_classe_id;
  update quazian_publications
     set classe_id = null
   where classe_id = v_nom;

  -- Supprimer la classe → cascade inscriptions → tout le travail scopé +
  -- classe_modules ; quazian_quizzes.classe_id passe à NULL (détaché).
  delete from classes where id = p_classe_id;
end;
$$;

-- ── Retrait dur d'une seule inscription (élève × classe) ─────────────────────
-- Supprime l'inscription (cascade son travail scopé) + ses notes de semestre +
-- son journal de révision, sans toucher au compte ni aux autres classes.
create or replace function retirer_inscription(p_inscription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_eleve uuid; v_classe_nom text;
begin
  select i.eleve_id, c.nom into v_eleve, v_classe_nom
    from inscriptions i join classes c on c.id = i.classe_id
   where i.id = p_inscription_id;
  if v_eleve is null then return; end if;

  delete from quazian_review_log rl
   using quazian_card_states cs
   where rl.card_state_id = cs.id
     and cs.inscription_id = p_inscription_id;

  delete from quazian_semester where classe_id = v_classe_nom and eleve_id = v_eleve;

  delete from inscriptions where id = p_inscription_id; -- cascade le travail scopé
end;
$$;

commit;

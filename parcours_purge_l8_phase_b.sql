-- ============================================================================
-- MIGRATION L8 — PHASE B (PURGE DURE, IRRÉVERSIBLE) — Scriptorium → Parcours
-- ----------------------------------------------------------------------------
-- Supprime définitivement les unités pilote (type='unite') + toutes leurs
-- dépendances Quazian/Codex. GARDE les livres (type='livre') + tout Aletheia +
-- le vocabulaire-livre. Perte ACCEPTÉE par le PO (2026-07-09) : 3 unités,
-- 4 documents, 44 flashcards jamais révisées ; 0 progression élève, 0 Codex.
--
-- ⚠️ PAS DE TEMP TABLES : le SQL Editor Supabase les perd (session/advisor).
--   On utilise deux tables ORDINAIRES dans le schéma `_mig` (non exposé par
--   PostgREST), avec RLS activée EN LIGNE → l'advisor ne pose plus de dialogue :
--     _mig.perim(kind,id)  = périmètre calculé (u/d/f/cs), transitoire (droppé à la fin)
--     _mig.bak(source,data) = backup JSONB des lignes supprimées (conservé = filet)
--
-- FK NO ACTION gérées (introspection live) :
--   * quazian_flashcards.scriptorium_doc_id → scriptorium_documents : périmètre 'f'
--     élargi (OR scriptorium_doc_id ∈ 'd') → cartes supprimées AVANT les docs ;
--   * quazian_questions.flashcard_source_id → quazian_flashcards (NULLABLE) :
--     lien de provenance coupé (NULL) AVANT le delete des cartes.
--
-- STORAGE : 2 fichiers à retirer À LA MAIN du bucket 'scriptorium' (fin de fichier).
-- ⚠️ Exécuter TOUT le bloc begin…commit en UN SEUL batch.
-- ----------------------------------------------------------------------------
-- ✅ EXÉCUTÉ le 2026-07-09 (base partagée). NB : le run RÉUSSI a utilisé une
--    variante TEMP-TABLE antérieure de ce script → le backup vit dans des tables
--    _mig.bak_scriptorium_unites / _mig.bak_quazian_flashcards / … (PAS _mig.bak).
--    Résultat vérifié : 0 unité, 0 orphelin (docs/flashcards/codex), 6 livres +
--    3 aletheia_travaux intacts ; backup peuplé (unites=3, documents=4, flashcards=44).
--    CETTE version (tables ordinaires _mig.perim/_mig.bak, RLS en ligne) est la forme
--    DURCIE, robuste au SQL Editor Supabase — à réutiliser si la purge doit être rejouée.
-- ============================================================================

begin;

  create schema if not exists _mig;

  -- ══ Périmètre : table ordinaire _mig.perim (kind ∈ u|d|f|cs) ═══════════════
  drop table if exists _mig.perim;
  create table _mig.perim (kind text not null, id uuid not null);
  alter table _mig.perim enable row level security;   -- deny-all (schéma _mig non exposé)

  insert into _mig.perim
    select 'u', id from scriptorium_unites where type = 'unite';
  insert into _mig.perim
    select 'd', id from scriptorium_documents where unite_id in (select id from _mig.perim where kind='u');
  -- 'f' élargi : cartes d'unité PAR scriptorium_unite_id OU référençant un doc d'unité.
  -- Exclut le vocab-livre (unite_id = livre ∉ 'u' ET scriptorium_doc_id = doc-livre ∉ 'd').
  insert into _mig.perim
    select 'f', id from quazian_flashcards
    where scriptorium_unite_id in (select id from _mig.perim where kind='u')
       or scriptorium_doc_id   in (select id from _mig.perim where kind='d');
  insert into _mig.perim
    select 'cs', id from codex_sessions where scriptorium_unite_id in (select id from _mig.perim where kind='u');

  -- ══ GARDE-FOU (avant toute écriture de backup / suppression) ═══════════════
  do $$
  declare n_non_unite int; n_aletheia int; n_u int;
  begin
    select count(*) into n_u from _mig.perim where kind='u';
    -- Anti-footgun : périmètre vide = script déjà joué → NE PAS écraser _mig.bak.
    if n_u = 0 then
      raise exception 'ABORT: perimetre vide (aucune type=unite — deja purge ?) — backup _mig.bak preserve';
    end if;
    select count(*) into n_non_unite
      from scriptorium_unites u
      where u.id in (select id from _mig.perim where kind='u') and u.type is distinct from 'unite';
    select count(*) into n_aletheia from (
      select 1 from aletheia_travaux          where scriptorium_livre_id in (select id from _mig.perim where kind='u')
      union all select 1 from aletheia_capstone        where scriptorium_livre_id in (select id from _mig.perim where kind='u')
      union all select 1 from aletheia_livre_reference where scriptorium_livre_id in (select id from _mig.perim where kind='u')
      union all select 1 from aletheia_diagnostic      where scriptorium_livre_id in (select id from _mig.perim where kind='u')) x;
    if n_non_unite <> 0 or n_aletheia <> 0 then
      raise exception 'ABORT: perimetre touche % non-unite / % Aletheia', n_non_unite, n_aletheia;
    end if;
  end $$;

  -- ══ ÉTAPE 0 — BACKUP JSONB (_mig.bak) : filet de restauration ══════════════
  drop table if exists _mig.bak;
  create table _mig.bak (source text not null, data jsonb not null);
  alter table _mig.bak enable row level security;

  insert into _mig.bak select 'scriptorium_unites',           to_jsonb(t) from scriptorium_unites t           where t.id in (select id from _mig.perim where kind='u');
  insert into _mig.bak select 'scriptorium_documents',        to_jsonb(t) from scriptorium_documents t        where t.id in (select id from _mig.perim where kind='d');
  insert into _mig.bak select 'scriptorium_document_classes', to_jsonb(t) from scriptorium_document_classes t where t.document_id in (select id from _mig.perim where kind='d');
  insert into _mig.bak select 'scriptorium_contenu_images',   to_jsonb(t) from scriptorium_contenu_images t   where t.document_id in (select id from _mig.perim where kind='d');
  insert into _mig.bak select 'scriptorium_unite_classes',    to_jsonb(t) from scriptorium_unite_classes t    where t.unite_id in (select id from _mig.perim where kind='u');
  insert into _mig.bak select 'quazian_flashcards',           to_jsonb(t) from quazian_flashcards t           where t.id in (select id from _mig.perim where kind='f');
  insert into _mig.bak select 'quazian_card_states',          to_jsonb(t) from quazian_card_states t          where t.flashcard_id in (select id from _mig.perim where kind='f');
  insert into _mig.bak select 'quazian_review_log',           to_jsonb(t) from quazian_review_log t           where t.card_state_id in (select id from quazian_card_states where flashcard_id in (select id from _mig.perim where kind='f'));
  insert into _mig.bak select 'quazian_publications',         to_jsonb(t) from quazian_publications t         where t.scriptorium_unite_id in (select id from _mig.perim where kind='u');
  insert into _mig.bak select 'codex_sessions',               to_jsonb(t) from codex_sessions t               where t.id in (select id from _mig.perim where kind='cs');
  insert into _mig.bak select 'codex_travaux',                to_jsonb(t) from codex_travaux t                where t.session_id in (select id from _mig.perim where kind='cs');
  insert into _mig.bak select 'codex_erreurs',                to_jsonb(t) from codex_erreurs t                where t.travail_id in (select id from codex_travaux where session_id in (select id from _mig.perim where kind='cs'));
  -- Liens qui seront NULLifiés (pas supprimés) → snapshot pour restaurabilité complète :
  insert into _mig.bak select 'quazian_questions_srclink', jsonb_build_object('id', id, 'flashcard_source_id', flashcard_source_id)
    from quazian_questions where flashcard_source_id in (select id from _mig.perim where kind='f');
  insert into _mig.bak select 'codex_erreurs_fclink', jsonb_build_object('id', id, 'flashcard_id', flashcard_id)
    from codex_erreurs where flashcard_id in (select id from _mig.perim where kind='f');

  -- ══ ÉTAPE 2 — PURGE (feuille → racine) ═════════════════════════════════════
  -- NO ACTION #2 : couper le lien de provenance AVANT de supprimer les cartes.
  update quazian_questions set flashcard_source_id = null
    where flashcard_source_id in (select id from _mig.perim where kind='f');

  delete from quazian_review_log  where card_state_id in (select id from quazian_card_states where flashcard_id in (select id from _mig.perim where kind='f'));
  delete from quazian_card_states where flashcard_id in (select id from _mig.perim where kind='f');
  delete from codex_erreurs       where travail_id in (select id from codex_travaux where session_id in (select id from _mig.perim where kind='cs'));
  delete from codex_travaux       where session_id in (select id from _mig.perim where kind='cs');
  delete from quazian_flashcards  where id in (select id from _mig.perim where kind='f');
  delete from codex_sessions      where id in (select id from _mig.perim where kind='cs');
  delete from quazian_publications where scriptorium_unite_id in (select id from _mig.perim where kind='u');
  delete from scriptorium_contenu_images   where document_id in (select id from _mig.perim where kind='d');
  delete from scriptorium_document_classes where document_id in (select id from _mig.perim where kind='d');
  delete from scriptorium_documents        where id in (select id from _mig.perim where kind='d');
  delete from scriptorium_unite_classes    where unite_id in (select id from _mig.perim where kind='u');
  delete from scriptorium_unites where id in (select id from _mig.perim where kind='u') and type = 'unite';

  -- ══ Vérif post-purge : ASSERTION (raise → ROLLBACK auto si surprise) ═══════
  do $$
  declare n_unites int; n_livres int; n_alet int;
  begin
    select count(*) into n_unites from scriptorium_unites where type = 'unite';
    select count(*) into n_livres from scriptorium_unites where type = 'livre';
    select count(*) into n_alet   from aletheia_travaux;
    raise notice 'POST-PURGE unites=% (attendu 0) livres=% aletheia_travaux=%', n_unites, n_livres, n_alet;
    if n_unites <> 0 then
      raise exception 'ABORT post-purge: % unite(s) type=unite restante(s) -> rollback', n_unites;
    end if;
  end $$;

  drop table _mig.perim;   -- périmètre transitoire (on garde _mig.bak = le filet)

commit;

-- ============================================================================
-- ÉTAPE 1 (Storage) — À FAIRE À LA MAIN : dashboard Supabase → Storage →
-- bucket 'scriptorium' → supprimer ces 2 objets (les 2 autres docs sont text-only) :
--   1a85a093-f845-4b2e-97c1-2b2ce17578a3/1585eb3d-04b3-410d-813e-5896283d3f1d/1781622509937.pdf
--   1a85a093-f845-4b2e-97c1-2b2ce17578a3/dad3000d-a38f-4673-9d83-52b989169037/1781633155845.pdf
-- (Chemins captés en prep → décorrélé de la purge : à faire après commit.)
--
-- RESTAURATION (si besoin, ordre racine→feuille) — exemple pour une table pleine :
--   insert into scriptorium_unites
--     select (jsonb_populate_record(null::scriptorium_unites, data)).*
--     from _mig.bak where source = 'scriptorium_unites';
--   ... puis restaurer les liens NULLifiés depuis les sources *_srclink / *_fclink.
--
-- NETTOYAGE FINAL (seulement quand la purge est jugée définitive, après quelques
-- jours) : drop schema _mig cascade;   -- retire _mig.bak + phase_a_flip
-- ============================================================================

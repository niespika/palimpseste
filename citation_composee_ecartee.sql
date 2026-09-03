-- ============================================================================
-- C6 · L1 — LE PROFESSEUR EFFACE UN DRAPEAU « CITATION COMPOSÉE ».
-- ----------------------------------------------------------------------------
-- Demande de Louis, 2026-09-02 : « J'ai reçu des signaux parce que l'OCR de
-- copies de mes élèves n'était pas fiable […] ils sont toujours là, mais je ne
-- peux pas les effacer. » Sur la classe T5 de production : 19 drapeaux sur
-- 17 élèves, et aucun geste pour les faire partir.
--
-- Le drapeau, lui, reste DÉRIVÉ (`utils/pilotage/attention-serveur.ts`,
-- `drapeauxDeCitationComposee`) : il se recalcule à chaque lecture depuis le
-- retour et la production, et rien de ce calcul n'est écrit en base. Ce qui
-- s'écrit ici, c'est LE GESTE DU PROFESSEUR — « j'ai vu, j'efface » —, au même
-- titre que `dossier_n3_traite_at` ou `acquitte_at` : la marque QU'UN HUMAIN A
-- REGARDÉ, et rien d'autre. Un retour écarté n'est ni corrigé ni retiré ; il
-- ne remonte simplement plus dans « Ce qui demande votre attention ».
--
-- UNE colonne NULLABLE, sans `default`, sur `exercices_retours` :
--   · `citation_composee_ecartee_at` — l'instant où le professeur a effacé le
--     drapeau de ce retour. NULL = jamais effacé : le drapeau se lève si le
--     calcul le lève.
--
-- ⭐ ADDITIVE ET INERTE : aucun lecteur ne fait `select('*')` sur
--    `exercices_retours` (vérifié le 02/09, `grep` sur `app/` et `utils/`), et le
--    code neuf la lit par une requête SÉPARÉE et TOLÉRANTE : colonne absente ⇒
--    aucun drapeau écarté et un incident à l'écran, jamais une page cassée.
--    L'ordre de déploiement est donc indifférent. ⛔ Aucune policy touchée :
--    seul le professeur écrit, par une action serveur (client admin, garde de
--    rôle) ; l'élève ne lit pas cette colonne.
-- ⚠️ `exercices_retours` est une table du flux VIVANT (les retours servis aux
--    élèves) : protocole renforcé — répétition à blanc sur le CORPS, retour
--    vérifié par requête, bac à sable avant prod.
--
-- Rollback : `citation_composee_ecartee_rollback.sql`.
-- ============================================================================

-- ── CONSTAT DE TÊTE ─────────────────────────────────────────────────────────
select
  (select count(*) from exercices_retours)                                 as retours_avant,
  (select count(*) from exercices_retours where published_at is not null)  as retours_publies,
  (select count(*) from information_schema.columns
     where table_name = 'exercices_retours'
       and column_name = 'citation_composee_ecartee_at')                   as colonne_deja_posee;

begin;

alter table exercices_retours
  add column if not exists citation_composee_ecartee_at timestamptz null;

comment on column exercices_retours.citation_composee_ecartee_at is
  'C6-L1 — l''instant où le PROFESSEUR a effacé le drapeau « citation composée » de ce retour '
  '(page d''attention de la classe). NULL = jamais effacé. Le drapeau reste dérivé à la lecture ; '
  'cette colonne ne marque que le geste — le retour n''est ni corrigé ni retiré.';

-- ── CONSTAT DE PIED — trois drapeaux, tous attendus à `t` ───────────────────
select
  (select count(*) = 1 from information_schema.columns
     where table_name = 'exercices_retours'
       and column_name = 'citation_composee_ecartee_at')                   as colonne_posee,
  (select bool_and(is_nullable = 'YES' and column_default is null)
     from information_schema.columns
     where table_name = 'exercices_retours'
       and column_name = 'citation_composee_ecartee_at')                   as nullable_sans_defaut,
  (select count(*) = 0 from exercices_retours
     where citation_composee_ecartee_at is not null)                       as aucun_ecarte,
  (select count(*) from exercices_retours)                                 as retours_intacts;

commit;

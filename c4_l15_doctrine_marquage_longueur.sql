-- ============================================================================
-- C4 · L15 — DEUX COLONNES DÉRIVÉES DE PLUS SUR `exercices_crans`.
--            `marquage` (`02-` §5) et `longueur` (`02-` §2.3.3).
-- ----------------------------------------------------------------------------
-- ⚠️ CETTE MIGRATION N'AJOUTE AUCUNE DONNÉE — elle ouvre deux colonnes VIDES.
--    Ce qui les remplit est `scripts/derive-doctrine.py --sql`, comme les
--    quatorze autres colonnes de cette table : « la doctrine en base est
--    DÉRIVÉE, jamais tapée, et il n'y a qu'un dériveur » (`PLAN_DE_CHANTIER.md`
--    §5). C'est pourquoi on ne trouvera ici ni `update`, ni `insert`, ni la
--    moindre valeur recopiée du `02-` : les écrire ici en ferait un SECOND
--    domicile, qui divergerait des sources au premier amendement.
--
-- ⚠️ L'ORDRE, ET IL N'Y EN A QU'UN. Cette migration d'abord ; la
--    re-dérivation ensuite (`--sql`, en un geste séparé, journalisé). Entre les
--    deux, la base porte les colonnes à `NULL` et le contrôle de dérivation
--    dira `exercices_crans : DIVERGE — 6 manquantes en base, 6 en trop` : c'est
--    le comportement attendu, pas une panne. ⭐ Et le code le supporte : une
--    règle de marquage absente ne marque RIEN, une longueur absente ne mesure
--    RIEN — l'écran d'aujourd'hui, exactement. Le cas VIDE est éprouvé
--    (`utils/deroule/marquage.test.ts`, `utils/fabrique/verifie-import.test.ts`).
--
-- POURQUOI ADDITIVE ET SANS RISQUE
--   `exercices_crans` est une table de DOCTRINE, dérivée, que `--sql` vide et
--   réinsère à chaque passe. **Aucune clé étrangère ne pointe vers elle**
--   (vérifié par requête `pg_constraint` le 22/08, journal du 22/08). Deux
--   colonnes `text` NULLABLE sans contrainte n'invalident donc rien, et un
--   `insert` qui les ignore continue de passer.
--
-- ⛔ PAS DE `CHECK` SUR CES DEUX COLONNES, ET C'EST DÉLIBÉRÉ. Elles portent une
--    PHRASE DE LA SOURCE, mot pour mot — « le passage fautif — celui, et
--    celui-là seul, où la version_corrigee du matériau diffère de son
--    contenu », « le quart ». Une contrainte d'énumération figerait ici une
--    rédaction que le `02-` a le droit de retoucher : la source bougerait, la
--    dérivation échouerait, et on aurait fabriqué un troisième domicile. Ce qui
--    surveille ces colonnes est le CONTRÔLE DE DÉRIVATION, pas la base.
--
-- ROLLBACK : `c4_l15_doctrine_marquage_longueur_rollback.sql`.
-- ============================================================================

begin;

alter table exercices_crans
  add column if not exists marquage text,
  add column if not exists longueur text;

comment on column exercices_crans.marquage is
  'Ce que l''écran met en évidence DANS le matériau, cran par cran (02- §5, table '
  '« Ce que l''écran met en évidence dans le matériau »). NULL aux crans 2, 6 et 8, '
  'qui n''ont pas de materiau_cible — l''absence est une donnée, pas un oubli. '
  'DÉRIVÉE par scripts/derive-doctrine.py — jamais écrite à la main.';

comment on column exercices_crans.longueur is
  'La longueur du materiau_cible de provenance `genere`, cran par cran (02- §2.3.3). '
  '⚠️ C''est une FRACTION DE L''ÉTENDUE DU SUPPORT, JAMAIS UN COMPTE ABSOLU : '
  '« le quart », « la moitié », « le matériau entier ». NULL aux crans 2, 6 et 8. '
  'DÉRIVÉE par scripts/derive-doctrine.py — jamais écrite à la main.';

commit;

-- ── Le constat, à jouer APRÈS (lecture seule) ───────────────────────────────
-- Attendu JUSTE APRÈS cette migration, avant la re-dérivation :
--   9 lignes, 0 marquage, 0 longueur.
-- Attendu APRÈS la re-dérivation :
--   9 lignes, 6 marquage, 6 longueur — et les trois crans muets sont 2, 6 et 8.
--
-- select count(*)                                          as crans,
--        count(marquage)                                   as avec_marquage,
--        count(longueur)                                   as avec_longueur,
--        string_agg(cran::text, ',' order by cran)
--          filter (where marquage is null)                 as crans_sans_marquage
--   from exercices_crans;

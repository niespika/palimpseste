-- ============================================================================
-- C4 · L11 — LES DEUX RETRAITS. ⚠️ CE FICHIER N'EST PAS ADDITIF.
-- ----------------------------------------------------------------------------
-- 1. `exercices_squelettes.prompt_version` — LE SEUL GESTE DESTRUCTIF DU LOT.
--
--    « RIEN N'EST VERSIONNÉ PAR PHASE » (`01-` §11). Le `07-` §1.2 dit pourquoi
--    la colonne tombe : « Pas de `prompt_version` à côté d'elle : un prompt vit
--    dans sa fiche, donc l'`instrument_version` bouge dès qu'un prompt bouge —
--    UNE SECONDE COLONNE SERAIT UNE COPIE DU MÊME CHIFFRE, et deux copies
--    finissent par diverger. »
--
--    ⭐ `instrument_version` RESTE, et retirer les deux serait l'erreur
--       SYMÉTRIQUE : c'est LE versionnage, « sur la mesure ET sur le squelette »
--       (`01-` §11) — la ligne VERSION de la fiche dont l'instrument est dérivé.
--
--    ⚠️ CODE D'ABORD, SQL ENSUITE, et l'inverse casse la chaîne entre les deux
--       gestes : `utils/chaine/chaine.ts` posait la colonne DEUX FOIS (une à
--       l'extraction, une au jugement), avec exactement la valeur
--       d'`instrument_version`. Les deux écritures ont été retirées d'abord.
--
--    ⚠️⚠️ LA TABLE N'EST PLUS VIDE depuis C4-L10 : la recette de l'Expression y
--       a écrit un squelette réel, et elle se remplira dès qu'un dépôt sera
--       traité. Le constat ci-dessous COMPTE LES LIGNES AVANT, vérifie
--       qu'`instrument_version` est intacte sur TOUTES, et recompte après.
--
--    ⚠️ CE QUE LE ROLLBACK NE REND PAS, et il faut le dire plutôt que le laisser
--       deviner : il RECRÉE LA COLONNE NULLABLE, et ne récupère RIEN de ce
--       qu'elle portait. ⭐ Ce n'est pas grave, et c'est vérifiable : la colonne
--       portait EXACTEMENT `instrument_version` — la valeur est donc encore là,
--       à côté, sur la même ligne. Le contrôle d'égalité ci-dessous le prouve
--       AVANT le `drop`.
--
-- 2. `idx_exercices_planifie` — L'INDEX DEVENU REDONDANT.
--
--    `uk_exercices_planifie` (C4-L9, UNIQUE) et `idx_exercices_planifie`
--    (C4-L1, non unique) ont LA MÊME CLÉ et LE MÊME PRÉDICAT — constaté par
--    `pg_indexes` le 22/08. Un index unique sert toutes les lectures que servait
--    le simple ; le coût du doublon est UNE ÉCRITURE D'INDEX DE PLUS PAR
--    INSTANCE. « Retrait, ou jamais » : c'est le retrait.
--
--    ⚠️⚠️ ET IL FAUT LE DIRE À C4-L9. `c4_l9_examens_diagnostiques_rollback.sql`
--       COMPTAIT EXPLICITEMENT sur cet index : « `uk_exercices_planifie`
--       disparaît […] `idx_exercices_planifie` (C4-L1, non unique) reste : les
--       lectures continuent de marcher ». Ce rollback devenait donc FAUX. Il a
--       été AMENDÉ dans le même geste — il recrée désormais l'index simple
--       quand il retire l'unique — et le `SUIVI_SQL.md` le porte aussi.
--       *Le rollback de C4-L9 n'a jamais été joué (☐ sandbox, ☐ prod) : on
--        amende un fichier qui n'a rien fait tourner, pas une migration jouée.*
--
-- Protocole : renforcé (`SUIVI_SQL.md`, règle 5 étendue — `exercices` et
-- `exercices_squelettes` portent des lignes de recette). Répétition à blanc en
-- copiant LE CORPS de ce fichier, jamais le fichier entier (règle 6).
--
-- Rollback : `c4_l11_retraits_rollback.sql`.
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT — et la preuve que le rollback ne perd rien ────────────
select
  (select count(*) from public.exercices_squelettes)              as squelettes_avant,
  (select count(*) from public.exercices_squelettes
    where instrument_version is not null)                         as avec_instrument_version,
  -- ⭐ LA PREUVE : les deux colonnes portent la MÊME valeur, ligne à ligne.
  --    Si ce compte n'est pas 0, la colonne portait autre chose que sa jumelle
  --    et le `drop` perdrait une information réelle : S'ARRÊTER ET LIRE.
  (select count(*) from public.exercices_squelettes
    where prompt_version is distinct from instrument_version)     as divergentes_attendu_0,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'idx_exercices_planifie') as index_simple_avant,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'uk_exercices_planifie')  as index_unique_avant;

do $$
declare v_div int;
begin
  select count(*) into v_div from public.exercices_squelettes
   where prompt_version is distinct from instrument_version;
  if v_div > 0 then
    raise exception 'ARRÊT — % squelette(s) portent un `prompt_version` DIFFÉRENT de leur '
      '`instrument_version`. Le retrait perdrait une information réelle, et le relevé '
      'affirme le contraire. Lire ces lignes avant de rejouer.', v_div;
  end if;
end $$;

-- ── 1. LE `DROP COLUMN` — destructif, et assumé ─────────────────────────────
alter table public.exercices_squelettes drop column if exists prompt_version;

-- ── 2. LE `DROP INDEX` — le doublon s'en va, l'unique reste ─────────────────
-- ⚠️ On ne retire le simple QUE SI l'unique est là : sinon on perdrait l'index
--    tout court, et la lecture inverse (de la ligne de plan vers son instance)
--    ferait un balayage complet.
do $$
begin
  if not exists (select 1 from pg_indexes
                  where schemaname = 'public' and indexname = 'uk_exercices_planifie') then
    raise exception 'ARRÊT — `uk_exercices_planifie` est absent : retirer '
      '`idx_exercices_planifie` laisserait `exercice_planifie_id` SANS AUCUN INDEX.';
  end if;
end $$;

drop index if exists public.idx_exercices_planifie;

-- ── LE CONSTAT APRÈS ────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_squelettes'
      and column_name = 'prompt_version')                         as prompt_version_restante_attendu_0,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_squelettes'
      and column_name = 'instrument_version')                     as instrument_version_intacte_attendu_1,
  (select count(*) from public.exercices_squelettes)              as squelettes_apres,
  (select count(*) from public.exercices_squelettes
    where instrument_version is not null)                         as avec_instrument_version_apres,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'idx_exercices_planifie') as index_simple_apres_attendu_0,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'uk_exercices_planifie')  as index_unique_apres_attendu_1;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- C6 · L1 — ROLLBACK. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ DESTRUCTIF SI DES SIGNALEMENTS `exercices` EXISTENT : le retour au `CHECK`
--    à trois valeurs les refuserait. Le fichier les COMPTE d'abord (bloc 0) et
--    les SUPPRIME explicitement — ce sont des drapeaux de faisceau, jamais du
--    travail d'élève, et aucun n'a compté de strike (le type de faisceau
--    n'en compte aucun, par construction).
--    ⛔ LIRE LE BLOC 0 AVANT D'ALLER PLUS LOIN.
--
-- ⚠️ Les deux colonnes de `scriptorium_params` sont RETIRÉES : elles ne portent
--    qu'un réglage, et NULL était leur état de naissance.
-- ⛔ La fonction `marquer_contestation_traitee` est retirée ; les `traite_at`
--    déjà posés dans `contestation_points` RESTENT — ce sont des faits, et un
--    rollback de schéma n'efface pas un fait. Une clé inconnue dans un acte est
--    ignorée sans façon par `pointsContestes()` : rien ne casse.
-- ⛔ AUCUN INTERRUPTEUR N'EST TOUCHÉ.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 0. CE QUI VA PARTIR — à lire avant tout ────────────────────────────────
select
  (select count(*) from public.integrite_signalements
    where module = 'exercices')                                  as signalements_exercices_a_supprimer,
  (select count(*) from public.integrite_signalements
    where module = 'exercices' and compte_strike)                as dont_ayant_compte_un_strike,
  (select count(*) from public.integrite_signalements)           as signalements_au_total;

-- ── 1. Les signalements du faisceau partent — sinon le CHECK les refuserait ──
delete from public.integrite_signalements where module = 'exercices';

-- ── 2. Le CHECK revient à ses trois valeurs d'origine ───────────────────────
alter table public.integrite_signalements
  drop constraint if exists integrite_signalements_module_check;
alter table public.integrite_signalements
  add constraint integrite_signalements_module_check
  check (module in ('aletheia', 'codex', 'fragments'));

-- ── 3. Les deux paramètres ──────────────────────────────────────────────────
alter table public.scriptorium_params
  drop column if exists contestations_repetees_seuil,
  drop column if exists faisceau_convergence_seuil;

-- ── 4. La fonction ──────────────────────────────────────────────────────────
drop function if exists public.marquer_contestation_traitee(uuid, text, timestamptz);

-- ── 5. Le constat de pied ───────────────────────────────────────────────────
select
  (select pg_get_constraintdef(oid) not like '%exercices%'
     from pg_constraint
    where conname = 'integrite_signalements_module_check')        as check_revenu_a_trois,
  (select count(*) = 0 from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name in ('contestations_repetees_seuil',
                          'faisceau_convergence_seuil'))          as params_retires,
  (select count(*) = 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'marquer_contestation_traitee') as fonction_retiree;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- seed_prod.sql — CONFIG MINIMALE pour une base PROD neuve (Chemin A)
-- ════════════════════════════════════════════════════════════════════════════
-- À exécuter dans le SQL Editor de la NOUVELLE base de prod, APRÈS avoir importé
-- le schéma (structure) de la base actuelle (cf. RUNBOOK_prod_propre.md, étape 2).
--
-- Ce fichier ne contient AUCUNE donnée d'élève / de contenu. Il réinsère
-- uniquement les lignes de configuration « singleton » sans lesquelles l'app se
-- dégrade (fuseau horaire, paramètres modules) + le bucket Storage versionné.
--
-- Tout est idempotent (on conflict do nothing) → ré-exécutable sans risque.
--
-- ⚠️ Ce fichier est un FILET DE SÉCURITÉ (params 100 % par défaut). Pour copier
--    fidèlement ta config réelle (liste des modules, prompts que tu as édités,
--    semestre courant…), préfère le data-dump ciblé de l'étape 3 du runbook.
--    Les *_params laissés par défaut = « prompts par défaut calibrés du code ».
--
-- ⚠️ La table `modules` n'est PAS seedée ici (seuls codex/aletheia sont connus
--    du SQL ; scriptorium/quazian/fragments préexistent et ne sont versionnés
--    nulle part). → copie-la via le data-dump de l'étape 3, sinon l'app
--    n'affichera aucun module.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── Fuseau horaire d'affichage (singleton id=1, défaut America/Toronto) ──────
insert into calendrier_params (id) values (1) on conflict (id) do nothing;

-- ── Paramètres Codex (singleton id=1 : durées, plafonds, seuils OCR…) ────────
insert into codex_params (id) values (1) on conflict (id) do nothing;

-- ── Paramètres Aletheia (singleton id=1 : prompts NULL = défauts du code) ─────
insert into aletheia_params (id) values (1) on conflict (id) do nothing;

-- ── Paramètres Intégrité (singleton id=1 : actif, seuil de strikes…) ─────────
insert into integrite_params (id) values (1) on conflict (id) do nothing;

-- ── Bucket Storage versionné : codex (manuscrits V1/V-finale, privé) ─────────
-- Les AUTRES buckets (photos Fragments, oraux, imports/images Scriptorium) ont
-- été créés à la main dans le dashboard → à recréer côté dashboard de la prod
-- (cf. runbook étape 4). Leurs policies non plus ne sont pas versionnées.
insert into storage.buckets (id, name, public)
values ('codex', 'codex', false)
on conflict (id) do nothing;

commit;

-- ── À faire ensuite, hors de ce fichier (cf. runbook) ────────────────────────
--   • copier la table `modules` + `fragments_semestres` (data-dump étape 3) ;
--   • recréer les buckets dashboard + leurs policies Storage (étape 4) ;
--   • créer ton compte prof puis : update profiles set role='prof' where id='<uuid>';
--   • vérifier le trigger auth.users → profiles (étape 7).

-- ============================================================================
-- C4 · L11 — LES CORRECTIFS : la part ADDITIVE.
-- ----------------------------------------------------------------------------
-- Deux colonnes, toutes deux NULLABLES, aucune donnée touchée, aucune garde
-- resserrée. Protocole NORMAL (`SUIVI_SQL.md`, règle 5 : « les migrations
-- additives et gatées s'appliquent normalement »).
--
-- 1. `exercices.cible_primaire` — « LA COMPÉTENCE QUI COMMANDE LE RETOUR »
--    (`07-` §1.1 ; `01-` §1, point 1 : « l'exercice porte la cible »).
--
--    ⚠️⚠️ ELLE EST NULLABLE, ET ELLE LE RESTE. « Sur la voie du routeur elle
--       reste NULL : la cible est la sortie de la couche 2 et vit à la décision
--       (`routeur_decisions.cible_retenue`) » — UN `NOT NULL` CASSERAIT TOUTE LA
--       VOIE DU ROUTEUR. Le `07-` §1.1 la nomme d'ailleurs « la `cible_primaire`
--       NULLABLE » dans la liste des colonnes d'`exercices`.
--
--    ⭐ CE QU'ELLE PROTÈGE, et pourquoi l'échéance était ferme : « en version
--       finale, les appels froids ne se rejouent que pour la SEULE compétence
--       visée par le retour (`01-` §11) — une cible tirée de l'ordre d'un
--       tableau ferait porter le `delta_v1_vf`, donc le signal de réceptivité de
--       N2, sur une compétence que personne n'a choisie. »
--
--    Le `CHECK` borne le domaine aux SIX compétences du référentiel — en
--    identifiant nu, « pas de préfixe » (`07-` §1.2) — et TOLÈRE `NULL`.
--    ⛔ Il ne dit RIEN de la présence : ce n'est pas une garde de voie.
--
-- 2. `scriptorium_params.exercices_retour_longueur` — LE PARAMÈTRE DE PLATEFORME
--    de la `longueur` du retour (`07-` §4).
--
--    « La `longueur` […] est propre au retour — celle d'une réponse de Discussion
--      n'est pas celle d'un retour — et son domicile est un PARAMÈTRE DE
--      PLATEFORME, au même endroit que les interrupteurs (§5), NULL VALANT LA
--      RÈGLE 7 DU GABARIT. »
--
--    ⛔ CE N'EST PAS `rag_prompt_longueur`, qui est la section éditable DU
--       TUTEUR (`utils/scriptorium-rag.ts`). Deux ateliers, deux réglages —
--       « une identité recopiée dans la section éditable d'un atelier EST le
--       second fichier de personnalité que le §4 interdit ».
--    ⛔ CE N'EST PAS NON PLUS UNE VARIABLE : « `{{...}}` ne désigne que ce que
--       l'assembleur substitue : `{{COMPETENCE}}`, `{{MOMENT}}` et
--       `{{REGISTRE}}`. Il n'y en a pas d'autres. » C'est un remplacement de
--       SECTION NOMMÉE (`regle_7`), et `assemblerGabarit` en tient la garde :
--       une section verrouillée ne se remplace jamais.
--
-- ⚠️ ORDRE : le CODE est passé d'abord pour la `longueur` (elle se lit sur une
--    colonne absente → `null` → la règle 7 tient, comportement voulu) ; pour
--    `cible_primaire`, le SQL passe AVANT le déploiement du code, parce que
--    `utils/deroule/depot.ts` la SÉLECTIONNE EXPLICITEMENT et qu'un `select`
--    d'une colonne absente fait échouer la requête ENTIÈRE (`42703`) — l'écran
--    du déroulé serait mort pour tous les élèves. C'est le défaut que la recette
--    de C4-L3 a trouvé le 22/08 ; on ne le rejoue pas à l'envers.
--
-- Rollback : `c4_l11_additifs_rollback.sql`.
-- ============================================================================

begin;

-- ── 1. `exercices.cible_primaire` ───────────────────────────────────────────
alter table public.exercices
  add column if not exists cible_primaire text;

alter table public.exercices
  drop constraint if exists exercices_cible_primaire_chk;
alter table public.exercices
  add constraint exercices_cible_primaire_chk
  check (cible_primaire is null or cible_primaire in
    ('expression','argumentation','structure','connaissance','synthese','questionnement'));

comment on column public.exercices.cible_primaire is
  'La compétence qui commande le retour (07- §1.1 ; 01- §1). NULLABLE, et elle '
  'le reste : NULL sur la voie du routeur, où la cible vit à '
  'routeur_decisions.cible_retenue ; posée par l''écran de conception sur la '
  'voie du professeur. Ordre de lecture : décision → cible_primaire → repli '
  'alphabétique (utils/chaine/chaine.ts, cibleDuRetour).';

-- ── 2. `scriptorium_params.exercices_retour_longueur` ───────────────────────
alter table public.scriptorium_params
  add column if not exists exercices_retour_longueur text;

comment on column public.scriptorium_params.exercices_retour_longueur is
  'Le paramètre de plateforme de la LONGUEUR du retour (07- §4). NULL vaut la '
  'règle 7 du gabarit, mot pour mot. Remplace la SECTION nommée regle_7 — jamais '
  'une variable. À ne pas confondre avec rag_prompt_longueur, qui est la section '
  'éditable du TUTEUR.';

-- ── LE CONSTAT — ce que la migration a fait, à lire à l'écran ───────────────
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices'
      and column_name = 'cible_primaire' and is_nullable = 'YES')   as cible_primaire_nullable,
  (select count(*) from pg_constraint
    where conname = 'exercices_cible_primaire_chk')                 as check_de_domaine,
  (select count(*) from public.exercices where cible_primaire is not null)
                                                                    as instances_deja_ciblees,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name = 'exercices_retour_longueur')                as parametre_longueur,
  (select exercices_retour_longueur from public.scriptorium_params where id = 1)
                                                                    as longueur_posee;

commit;

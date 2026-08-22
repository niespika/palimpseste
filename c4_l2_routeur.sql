-- ============================================================================
-- C4 · L2 — LE PILOTAGE DU PROFESSEUR : ce que le §1 nomme et que la base ne
--           porte pas encore.
-- ----------------------------------------------------------------------------
-- « CE LOT NE CRÉE AUCUNE TABLE — le schéma est joué à C4-L1 (`07-` §1). Ce que
--   le §1 NOMME sans que la base le porte encore — LE PLANCHER ET LE PLAFOND DE
--   L'ÉLÈVE, LA PRÉFÉRENCE RECUEILLIE, UN SEUIL EN CONFIGURATION — s'ajoute en
--   MIGRATION ADDITIVE sous les conventions de dépôt ; LA FORME PHYSIQUE
--   T'APPARTIENT. Une donnée que RIEN ne nomme se signale, elle ne s'invente
--   pas. »                                            — PROMPT_Code_C4_L2, piège 11
--
-- Manifeste du lot : `07-Implementation.md` §1 et §5 (VERSION 2.24, RELU ET
-- VALIDÉ — §1 et §5 OUVERTS À L'IMPLÉMENTATION) · `01-routeur.md` §4, §5, §6, §8,
-- §9 (VERSION 5.4, VALIDÉ ET GELÉ) · `06-Palimpseste.md` §5 (VERSION 2.5, VALIDÉ
-- ET GELÉ) · ce journal.
--
-- ADDITIVE ET GATÉE → PROTOCOLE NORMAL (SUIVI_SQL règle 5). Aucune table neuve,
-- aucune policy touchée, AUCUNE COLONNE EXISTANTE MODIFIÉE : sept colonnes
-- NULLABLES ou à défaut, sur quatre tables. `profiles` reçoit cinq colonnes de
-- plus — c'est exactement le patron que C4-L1 a suivi pour les trois champs
-- d'aménagement, et que le `07-` §1.3 nomme (« les trois champs s'y ajoutent en
-- migration additive, comme ceux de l'intégrité avant eux »).
--
-- ⚠️ `routeur_actif` N'EST PAS TOUCHÉ, et il reste à OFF : « le routeur prend ses
--    couches à l'allumage SANS RIEN CHANGER AU SCHÉMA NI AUX ÉCRANS » (`07-` §5).
--    Ce fichier ne fait qu'ouvrir les cases que les règles écrites lisent déjà.
--
-- CE QUE CE FICHIER FAIT, EN QUATRE POINTS :
--
--   1. `profiles` — LE BUDGET DE L'ÉLÈVE (§4, couche 0).
--      « Le budget est une propriété de l'ÉLÈVE, PAS DE LA CLASSE : un bi-classe
--        a UN SEUL budget. » Les chiffres du §4 sont des VALEURS PAR DÉFAUT
--      « RÉGLABLES PAR ÉLÈVE ET PAR LOT — proposées, jamais imposées » : les
--      colonnes sont donc NULLABLES, et NULL veut dire « le défaut de sa
--      situation », jamais zéro. La situation, elle, NE SE STOCKE PAS — elle se
--      dérive de l'union des inscriptions actives (`07-` §1.3).
--
--   2. `profiles` — LA PRÉFÉRENCE RECUEILLIE (§5, « Non tranché »).
--      L'écran des budgets « la recueille à intervalle régulier » (`07-` §2), ET
--      C'EST TOUT : « sa place dans le ciblage N'EST PAS TRANCHÉE » et « C4-L2 se
--      construit sans elle ». ⚠️ NI SA QUESTION NI SES VALEURS NE SONT ÉCRITES
--      DANS LES SOURCES : la case est posée, le CONTENU EST SIGNALÉ AU
--      PROFESSEUR — « il ne s'invente pas, et il ne se repêche pas dans
--      l'archive » (piège 5). D'où un `jsonb` sans liste fermée : une liste
--      fermée inventée ici deviendrait la source de ce que personne n'a décidé.
--
--   3. `competences_niveaux.lettre_initiale` — LE PLAFOND SANS ANCRE (§9).
--      « Compétence SANS ANCRE RÉELLE — un régime propre : le plafond vaut
--        VALEUR INITIALE + 1 (et non ancre + 2), la descente est impossible, et
--        aucun drapeau de discordance ne se lève. »
--      ⚠️ CETTE VALEUR N'EST NULLE PART DÉRIVABLE : `competences_niveaux` porte
--         UN ÉTAT, écrasé à chaque écriture — la première lettre d'une compétence
--         est perdue dès la deuxième. Sans colonne, le régime du §9 n'a pas de
--         borne et le plafond ne se calcule pas. *Le §1 est OUVERT À
--         L'IMPLÉMENTATION ; la ligne est portée au `07-` §1.3 depuis le relevé
--         de ce lot, comme le régime le permet.*
--
--   4. `routeur_decisions.etat_escalade` — LE POINT 3 DU §11.
--      « Chaque escalade : degré, intervention appliquée, issue, ET L'ÉTAT
--        D'ESCALADE AU MOMENT DE CHAQUE MESURE. » L'état vit dans
--      `competences_escalade`, mais c'est un ÉTAT COURANT : il ne dit pas ce
--      qu'il valait quand la mesure a été prise, et la BOUCLE DE CALIBRATION
--      SYSTÈME du §11 exige une « STRATIFICATION OBLIGATOIRE PAR ÉTAT
--      D'ESCALADE ». Le routeur décide tout à la construction du cycle (§5) : il
--      connaît donc l'état à cet instant, et c'est là qu'il l'écrit. La mesure le
--      retrouve par son dépôt → sa décision. *Même régime que le point 3 :
--      porté au `07-` §1.5 depuis le relevé.*
--
--   5. `scriptorium_params` — LES DEUX RÉGLAGES DE L'ASSIDUITÉ (`06-` §5).
--      « JAMAIS UNE CONSTANTE EN DUR » — la source le dit deux fois, pour le
--      SEUIL DE « SEMAINE FAITE » et pour LA MOITIÉ qui borne le bas de la frise.
--      Plus le contrat de classe, qui est le même trois-quarts lu contre les
--      élèves : « la classe a fait sa semaine quand LES TROIS QUARTS de ses
--      élèves ont fait la leur ». Au même emplacement que les interrupteurs —
--      patron déjà suivi par `c2_l9_prompt_tuteur.sql`, `c4_l8_doctrine.sql` et
--      `c4_l5_chaine.sql`.
--
-- CE QU'IL NE FAIT PAS : aucune table, aucune vue, aucune policy, aucun index sur
-- une table qu'un élève réel écrit, aucun `update` de donnée existante, et il ne
-- touche à AUCUN des six interrupteurs.
--
-- Retour arrière : `c4_l2_routeur_rollback.sql`.
-- ============================================================================

begin;

-- ── 1. Le budget de l'élève — §4, couche 0 ─────────────────────────────────
alter table public.profiles
  add column if not exists budget_plancher_min  integer,
  add column if not exists budget_plafond_min   integer,
  add column if not exists budget_optionnel_min integer;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'profiles_budget_positif_chk'
                    and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles
      add constraint profiles_budget_positif_chk
      check ((budget_plancher_min  is null or budget_plancher_min  > 0)
         and (budget_plafond_min   is null or budget_plafond_min   > 0)
         and (budget_optionnel_min is null or budget_optionnel_min >= 0));
  end if;
end $$;

-- ⚠️ PAS de contrainte « plafond >= plancher » : le §4 rend ces valeurs
--    « RÉGLABLES PAR ÉLÈVE », et un professeur qui saisit un plafond sous le
--    plancher doit être AVERTI, pas refusé — l'écran le dit, le moteur
--    journalise l'écart, et le plafond reste la borne dure (§5, PB6). Une
--    contrainte ici transformerait un avertissement en erreur de saisie.

comment on column public.profiles.budget_plancher_min is
  '01- §4, couche 0 — le plancher HEBDOMADAIRE de l''élève, en minutes. NULL = le défaut de sa '
  'SITUATION (TC seul 45 · HLP seul 60 · bi-classe 90), qui se DÉRIVE de l''union de ses '
  'inscriptions actives et ne se stocke jamais. « Le routeur remplit AU MOINS jusqu''au plancher » '
  '— mais le plancher n''est PAS une borne dure : sous lui, l''écart se journalise et le solde '
  'revient aux exercices communs (voie mixte).';
comment on column public.profiles.budget_plafond_min is
  '01- §4, couche 0 — le plafond hebdomadaire, en minutes. NULL = le défaut de sa situation '
  '(60 · 90 · 120). C''est une BORNE DURE, opérée par PB6 (§5) : jamais dépassée.';
comment on column public.profiles.budget_optionnel_min is
  '01- §4, couche 0 — le quota « en faire plus », en minutes (défaut : 30 partout). ⚠️ Seule sa '
  'VALEUR se règle ici ; sa CONSOMMATION — le pull, la suggestion push, le marquage `bonus` — '
  'est C6-L3 et ne se construit pas à ce lot.';

-- ── 2. La préférence recueillie — §5, « Non tranché » ──────────────────────
alter table public.profiles
  add column if not exists preference_recueillie_at timestamptz,
  add column if not exists preference_reponse       jsonb;

comment on column public.profiles.preference_recueillie_at is
  '01- §5 — la date du dernier recueil. L''écran des budgets recueille la préférence de l''élève '
  '« à intervalle régulier » (07- §2). ⚠️ SA PLACE DANS LE CIBLAGE N''EST PAS TRANCHÉE, et '
  '« C4-L2 SE CONSTRUIT SANS ELLE » (PLAN_DE_CHANTIER §6) : aucune règle de ce lot ne la lit.';
comment on column public.profiles.preference_reponse is
  '01- §5 — la réponse, en jsonb ET SANS LISTE FERMÉE, délibérément. ⚠️ NI LA QUESTION NI SES '
  'VALEURS NE SONT ÉCRITES DANS LES SOURCES : le recueil est posé, le CONTENU EST SIGNALÉ AU '
  'PROFESSEUR — « il ne s''invente pas, et il ne se repêche pas dans l''archive ». Une liste '
  'fermée posée ici deviendrait la source de ce que personne n''a décidé.';

-- ── 3. Le plafond sans ancre — §9 ──────────────────────────────────────────
alter table public.competences_niveaux
  add column if not exists lettre_initiale    text,
  add column if not exists lettre_initiale_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'competences_niveaux_lettre_initiale_chk'
                    and conrelid = 'public.competences_niveaux'::regclass) then
    alter table public.competences_niveaux
      add constraint competences_niveaux_lettre_initiale_chk
      check (lettre_initiale is null or lettre_initiale in ('E','D','C','B','A'));
  end if;
end $$;

comment on column public.competences_niveaux.lettre_initiale is
  '01- §9 — la PREMIÈRE lettre de cette compétence, celle que le cold start a posée. Elle borne le '
  'régime « sans ancre réelle » : plafond = VALEUR INITIALE + 1 (et non ancre + 2), descente '
  'impossible, aucun drapeau de discordance — « jusqu''à sa première ancre véritable ». ⚠️ Elle '
  'NE SE DÉRIVE PAS : `lettre` est un ÉTAT, écrasé à chaque écriture, et la première valeur est '
  'perdue dès la deuxième. Sans elle le plafond du régime propre ne se calcule pas. Ajoutée par '
  'C4-L2, depuis son relevé (le §1 est ouvert à l''implémentation).';
comment on column public.competences_niveaux.lettre_initiale_at is
  '01- §9 — quand la lettre initiale a été posée. À NE PAS CONFONDRE avec `statut_recette_pose_le`, '
  'qui borne les mesures que la lettre relit (07- §1.3), ni avec `updated_at`, que toute écriture '
  'touche.';

-- ── 4. L'état d'escalade à la décision — §11, point 3 ──────────────────────
alter table public.routeur_decisions
  add column if not exists etat_escalade jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'routeur_etat_escalade_objet_chk'
                    and conrelid = 'public.routeur_decisions'::regclass) then
    alter table public.routeur_decisions
      add constraint routeur_etat_escalade_objet_chk
      check (etat_escalade is null or jsonb_typeof(etat_escalade) = 'object');
  end if;
end $$;

comment on column public.routeur_decisions.etat_escalade is
  '01- §11, point 3 — « l''état d''escalade AU MOMENT DE CHAQUE MESURE ». Forme : '
  '{ "<competence>": { "<observable>": { "degre": "N1|N2|N3", "branche_n2": "…" } } }. '
  '⚠️ `competences_escalade` porte l''état COURANT, pas celui qu''il avait quand la mesure a été '
  'prise — or la boucle de calibration système du §11 exige une « STRATIFICATION OBLIGATOIRE PAR '
  'ÉTAT D''ESCALADE ». Le routeur décide tout à la construction du cycle (§5) : il connaît l''état '
  'à cet instant, et l''écrit ici. La mesure le retrouve par son dépôt → sa décision. Ajoutée par '
  'C4-L2, depuis son relevé.';

-- ── 5. Les deux réglages de l'assiduité — `06-` §5 ─────────────────────────
alter table public.scriptorium_params
  add column if not exists assiduite_seuil_semaine_faite numeric not null default 0.75,
  add column if not exists assiduite_borne_basse_frise   numeric not null default 0.50,
  add column if not exists assiduite_contrat_classe      numeric not null default 0.75;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'params_assiduite_bornes_chk'
                    and conrelid = 'public.scriptorium_params'::regclass) then
    alter table public.scriptorium_params
      add constraint params_assiduite_bornes_chk
      check (assiduite_seuil_semaine_faite > 0 and assiduite_seuil_semaine_faite <= 1
         and assiduite_borne_basse_frise   > 0 and assiduite_borne_basse_frise   <= 1
         and assiduite_contrat_classe      > 0 and assiduite_contrat_classe      <= 1
         and assiduite_borne_basse_frise  <= assiduite_seuil_semaine_faite);
  end if;
end $$;

comment on column public.scriptorium_params.assiduite_seuil_semaine_faite is
  '06- §5 — « une semaine est FAITE quand l''élève a rendu au moins TROIS QUARTS de ses exercices '
  'assignés. La valeur est arrêtée ; elle reste UN PARAMÈTRE DE CONFIGURATION, JAMAIS UNE '
  'CONSTANTE EN DUR. » C''est aussi LA BORNE HAUTE DE LA FRISE : le vert commence ici.';
comment on column public.scriptorium_params.assiduite_borne_basse_frise is
  '06- §5 — la moitié qui sépare l''ORANGE du ROUGE à la frise : « orange, AU MOINS LA MOITIÉ sans '
  'atteindre le seuil ; rouge, SOUS LA MOITIÉ ». « La moitié, COMME LUI, reste un réglage, jamais '
  'une constante en dur. » La garde impose qu''elle ne dépasse pas le seuil : sinon l''orange '
  'n''existerait plus.';
comment on column public.scriptorium_params.assiduite_contrat_classe is
  '06- §5 — « la classe a fait sa semaine quand LES TROIS QUARTS de ses élèves ont fait la leur. '
  'Le professeur EST AVERTI quand le contrat n''est pas rempli » — un avertissement, JAMAIS une '
  'action automatique. ⚠️ Le TAUX D''INACTIVITÉ, lui, ne se stocke pas : la vue '
  '`assiduite_hebdo_classe` le calcule déjà (07- §1.5).';

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. DOUZE drapeaux, tous attendus à `t`.
-- ============================================================================
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name in ('budget_plancher_min','budget_plafond_min','budget_optionnel_min')
  ) = 3                                                                as budget_pose,
  (select count(*) from public.profiles
    where budget_plancher_min is not null or budget_plafond_min is not null
       or budget_optionnel_min is not null) = 0                        as aucun_budget_impose,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name in ('preference_recueillie_at','preference_reponse')
  ) = 2                                                                as preference_posee,
  (select count(*) from public.profiles
    where preference_reponse is not null) = 0                          as aucune_preference_inventee,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'competences_niveaux'
      and column_name in ('lettre_initiale','lettre_initiale_at')) = 2  as lettre_initiale_posee,
  (select count(*) from pg_constraint
    where conname = 'competences_niveaux_lettre_initiale_chk'
      and conrelid = 'public.competences_niveaux'::regclass) = 1        as garde_lettre_initiale,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'routeur_decisions'
      and column_name = 'etat_escalade') = 1                            as etat_escalade_pose,
  (select count(*) from pg_constraint
    where conname = 'routeur_etat_escalade_objet_chk'
      and conrelid = 'public.routeur_decisions'::regclass) = 1          as garde_etat_escalade,
  (select assiduite_seuil_semaine_faite from public.scriptorium_params limit 1) = 0.75
                                                                        as seuil_semaine_faite,
  (select assiduite_borne_basse_frise from public.scriptorium_params limit 1) = 0.50
                                                                        as borne_basse_frise,
  (select assiduite_contrat_classe from public.scriptorium_params limit 1) = 0.75
                                                                        as contrat_de_classe,
  -- LE DRAPEAU QUI COMPTE LE PLUS : les six interrupteurs n'ont pas bougé.
  (select not (exercices_actif or routeur_actif or competences_affichage_actif
            or chaine_actif or fabrique_actif or passation_classe_actif)
     from public.scriptorium_params limit 1)                            as les_six_toujours_a_off;

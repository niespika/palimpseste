-- ============================================================================
-- C4 · L2 — ROLLBACK. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- ⚠️ DESTRUCTIF DE CE QUE LES COLONNES PORTENT — et une seule perte est réelle :
--
--   · `competences_niveaux.lettre_initiale` — LA SEULE VALEUR IRRÉCUPÉRABLE.
--     C'est la PREMIÈRE lettre de chaque compétence, et elle NE SE DÉRIVE DE
--     RIEN : `lettre` est un état écrasé à chaque écriture. La retirer, c'est
--     rendre le plafond du régime « sans ancre » (§9) incalculable pour toute
--     compétence qui n'a pas encore d'ancre réelle — jusqu'à un nouveau cold
--     start. Le constat ci-dessous COMPTE ce qui va partir : s'il rend autre
--     chose que 0, RELEVER LES VALEURS AVANT DE JOUER CE FICHIER.
--
--   · les BUDGETS réglés par élève repassent au défaut de leur situation. Rien
--     n'est faussé — le défaut est la valeur proposée du §4 —, mais le réglage
--     du professeur est perdu et devra se ressaisir.
--
--   · les PRÉFÉRENCES recueillies sont perdues. Aujourd'hui elles sont
--     nécessairement vides : ni la question ni ses valeurs ne sont écrites dans
--     les sources, donc rien ne s'y est encore écrit.
--
--   · `routeur_decisions.etat_escalade` — la stratification de la boucle de
--     calibration système (§11) devient impossible sur les décisions déjà
--     prises. Les décisions elles-mêmes restent intactes.
--
--   · les DEUX RÉGLAGES d'assiduité repassent à leurs défauts de démarrage
--     (0,75 et 0,50) — et le code, qui les lit en configuration, retombera sur
--     ses défauts de démarrage identiques. Aucun compte ne change.
--
-- ⚠️ AUCUN INTERRUPTEUR N'EST TOUCHÉ, ni par la migration ni par ce rollback :
--    `routeur_actif` était à OFF et y reste.
--
-- LIRE D'ABORD le bloc de constat : il compte ce qui va partir.
-- ============================================================================

-- ── Constat, AVANT toute chose ─────────────────────────────────────────────
select
  (select count(*) from public.competences_niveaux
     where lettre_initiale is not null)  as lettres_initiales_perdues_SANS_RETOUR,
  (select count(*) from public.profiles
     where budget_plancher_min is not null or budget_plafond_min is not null
        or budget_optionnel_min is not null) as budgets_regles_a_ressaisir,
  (select count(*) from public.profiles
     where preference_recueillie_at is not null) as preferences_recueillies_perdues,
  (select count(*) from public.routeur_decisions
     where etat_escalade is not null)    as decisions_qui_perdent_leur_stratification,
  (select assiduite_seuil_semaine_faite from public.scriptorium_params limit 1)
                                          as seuil_semaine_faite_avant_retrait,
  (select assiduite_borne_basse_frise from public.scriptorium_params limit 1)
                                          as borne_basse_frise_avant_retrait;

begin;

-- ⚠️ CE FICHIER NE REFUSE PAS À BASE NON VIDE. « Un rollback qui ne part qu'à
--    base vide n'est pas un rollback : il devient inutilisable dès la première
--    ligne écrite, c'est-à-dire exactement au moment où l'on découvrirait le
--    problème qui le motive » (patron de `c4_l5_chaine_rollback.sql`). Le
--    constat ci-dessus a dit ce qui part ; c'est à l'opérateur de décider.

-- ── 5. Les deux réglages de l'assiduité ────────────────────────────────────
alter table public.scriptorium_params
  drop constraint if exists params_assiduite_bornes_chk;
alter table public.scriptorium_params
  drop column if exists assiduite_seuil_semaine_faite,
  drop column if exists assiduite_borne_basse_frise,
  drop column if exists assiduite_contrat_classe;

-- ── 4. L'état d'escalade à la décision ─────────────────────────────────────
alter table public.routeur_decisions
  drop constraint if exists routeur_etat_escalade_objet_chk;
alter table public.routeur_decisions
  drop column if exists etat_escalade;

-- ── 3. Le plafond sans ancre ───────────────────────────────────────────────
alter table public.competences_niveaux
  drop constraint if exists competences_niveaux_lettre_initiale_chk;
alter table public.competences_niveaux
  drop column if exists lettre_initiale,
  drop column if exists lettre_initiale_at;

-- ── 2. La préférence recueillie ────────────────────────────────────────────
alter table public.profiles
  drop column if exists preference_recueillie_at,
  drop column if exists preference_reponse;

-- ── 1. Le budget de l'élève ────────────────────────────────────────────────
alter table public.profiles
  drop constraint if exists profiles_budget_positif_chk;
alter table public.profiles
  drop column if exists budget_plancher_min,
  drop column if exists budget_plafond_min,
  drop column if exists budget_optionnel_min;

commit;

-- ============================================================================
-- VÉRIFICATION DU RETOUR ARRIÈRE — SEPT drapeaux, tous attendus à `t`.
-- « Ne jamais se fier au seul ROLLBACK affiché : vérifier PAR REQUÊTE »
-- (SUIVI_SQL, règle 6).
-- ============================================================================
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name like 'budget_%') = 0                              as budget_retire,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name like 'preference_%') = 0                          as preference_retiree,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'competences_niveaux'
      and column_name like 'lettre_initiale%') = 0                      as lettre_initiale_retiree,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'routeur_decisions'
      and column_name = 'etat_escalade') = 0                            as etat_escalade_retire,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name like 'assiduite_%') = 0                           as reglages_retires,
  -- Ce que le rollback NE DOIT PAS avoir touché.
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name in ('mode_saisie_force','exception_expression','exception_orthographe')
  ) = 3                                                                 as amenagements_c4l1_intacts,
  (select not (exercices_actif or routeur_actif or competences_affichage_actif
            or chaine_actif or fabrique_actif or passation_classe_actif)
     from public.scriptorium_params limit 1)                            as les_six_toujours_a_off;

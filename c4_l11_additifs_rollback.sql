-- ============================================================================
-- C4 · L11 — ROLLBACK de la part ADDITIVE.
-- ----------------------------------------------------------------------------
-- ⚠️ CE QU'IL DÉFAIT, ET CE QU'IL PERD.
--
--   · `exercices.cible_primaire` disparaît, ET AVEC ELLE TOUTE CIBLE POSÉE PAR
--     LE PROFESSEUR. Rien ne la reconstruit : c'est une SAISIE, pas une dérivée.
--     Le compte est fait ci-dessous AVANT le `drop` — s'il n'est pas nul, ce
--     retour arrière détruit du travail, et la décision n'appartient pas à un
--     fichier.
--     ⚠️⚠️ ET IL FAUT REVENIR AU CODE D'ABORD : `utils/deroule/depot.ts` la
--        SÉLECTIONNE EXPLICITEMENT. La retirer sous un code qui la nomme fait
--        échouer la requête ENTIÈRE (`42703`) — donc `lireDepotMaison` rend
--        `null`, donc l'écran du déroulé dit « exercice introuvable » À TOUS LES
--        ÉLÈVES, sans autre symptôme. **Revenir au code, PUIS jouer ceci.**
--
--   · `scriptorium_params.exercices_retour_longueur` disparaît, et avec elle le
--     texte que le professeur y aurait posé. Sans conséquence pour la chaîne :
--     `lireLongueurDuRetour` rend alors `null`, et « NULL vaut la règle 7 » —
--     le gabarit de la source reprend, mot pour mot.
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT — ce que ce retour arrière va détruire ─────────────────
select
  (select count(*) from public.exercices where cible_primaire is not null)
    as cibles_posees_qui_seront_perdues,
  (select exercices_retour_longueur from public.scriptorium_params where id = 1)
    as longueur_qui_sera_perdue;

alter table public.exercices drop constraint if exists exercices_cible_primaire_chk;
alter table public.exercices drop column if exists cible_primaire;

alter table public.scriptorium_params drop column if exists exercices_retour_longueur;

-- ── LE CONSTAT APRÈS ────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices'
      and column_name = 'cible_primaire')                       as cible_primaire_restante,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name = 'exercices_retour_longueur')            as parametre_longueur_restant;

commit;

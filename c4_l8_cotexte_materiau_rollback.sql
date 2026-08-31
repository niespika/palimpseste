-- ═══════════════════════════════════════════════════════════════════════════
-- c4_l8_cotexte_materiau_rollback.sql — retour arrière du 31/08
--
-- ⛔⛔ IL DÉTRUIT LES CO-TEXTES ET LES RATTACHEMENTS QUI LES DÉSIGNENT. La
--     section B supprime les lignes de rôle `co_texte` : si la banque en porte,
--     leur TEXTE disparaît, et il ne se retrouve que dans le fichier d'import.
--     Le contrôle à passer AVANT est en tête de la section B — il doit rendre 0.
--
-- ⚠️ IL REPOSE LES TROIS `NOT NULL`. Ils ne peuvent revenir que si aucune ligne
--    ne porte de valeur nulle : la section B doit donc avoir tout nettoyé, sinon
--    l'`alter` échoue — et c'est voulu, il vaut mieux qu'il échoue.
--
-- ⚠️ Il NE défait PAS ce que le code aura branché. Si les lecteurs (import,
--    déroulé, aperçu, vivier) lisent déjà la colonne, les retirer d'abord.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── A. L'instance cesse de désigner un co-texte ────────────────────────────
alter table exercices drop constraint if exists exercices_cotexte_materiau_fk;
alter table exercices drop constraint if exists exercices_cotexte_role_chk;
alter table exercices drop column if exists cotexte_materiau_id;
alter table exercices drop column if exists cotexte_role;

-- ── B. ⛔ LE POINT DE NON-RETOUR ───────────────────────────────────────────
-- Le contrôle à passer avant de jouer ce fichier — il doit rendre 0 :
--     select count(*) from exercices_materiaux where role = 'co_texte';
-- S'il rend autre chose, la ligne ci-dessous DÉTRUIT DU TEXTE. Exporter d'abord.
delete from exercices_materiaux where role = 'co_texte';

alter table exercices_materiaux drop constraint if exists exercices_materiaux_role_champs_chk;
alter table exercices_materiaux drop constraint if exists exercices_materiaux_id_role_key;
alter table exercices_materiaux drop constraint if exists exercices_materiaux_role_check;
alter table exercices_materiaux drop column if exists role;

-- ── C. Le domaine des six compétences redevient strict ─────────────────────
alter table exercices_materiaux
  drop constraint if exists exercices_materiaux_observable_competence_check;
alter table exercices_materiaux
  add constraint exercices_materiaux_observable_competence_check check (
    observable_competence in
      ('expression', 'argumentation', 'structure', 'connaissance', 'synthese', 'questionnement'));

-- ── D. Les trois `not null` reviennent — ils échoueront s'il reste un vide ──
alter table exercices_materiaux alter column observable_code       set not null;
alter table exercices_materiaux alter column observable_competence set not null;
alter table exercices_materiaux alter column defaut                set not null;

commit;

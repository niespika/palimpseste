-- ============================================================================
-- LE SUIVI DU MODÈLE PAR UNE CLASSE — deux colonnes pour trois gestes (02/09/2026).
-- ----------------------------------------------------------------------------
-- ⭐ POURQUOI. Depuis le 02/09 (commit 0bb9e86), le MODÈLE d'un parcours suit ses
--    classes : un ajout, un retrait ou un déplacement au modèle redescend dans
--    chaque instance active, sauf sur ce qu'une classe a déjà vu. Trois choses
--    étaient restées hors du geste, et Louis a demandé les trois le jour même :
--      1. une classe ne savait pas réordonner ses créneaux — c'est du code seul,
--         et la propagation de l'ordre respecte désormais un ordre choisi ;
--      2. une copie VUE puis retirée du modèle devenait indiscernable d'un ajout
--         à la main (la FK `modele_creneau_id … on delete set null` efface la
--         provenance) → `modele_retire_at` la garde ;
--      3. aucun interrupteur « cette classe ne suit plus le modèle »
--         → `suit_modele`.
--
-- ⭐ LA FORME.
--    · `scriptorium_parcours_classes.suit_modele boolean not null default true` :
--      `true` = l'instance reçoit ce que le modèle ajoute, retire, déplace ou
--      réordonne (règle du 02/09) ; `false` = rien n'y arrive ni n'en part de
--      lui-même, le panneau de reprise de l'instance reste le seul chemin.
--      Le DÉFAUT `true` est exactement le comportement d'aujourd'hui.
--    · `scriptorium_parcours_classe_creneaux.modele_retire_at timestamptz` :
--      posé par `retirerCreneauxModele` sur les copies CONSERVÉES (déjà vues)
--      juste avant le DELETE du créneau modèle ; null sur une copie vivante et
--      sur un créneau propre. Remis à null si le modèle reprend le même contenu
--      (rattachement d'un jumeau, `copierCreneauModele`).
--
-- ⛔ CE QUE CES COLONNES NE SONT PAS. `suit_modele` n'est pas `statut`
--    (`archivee` sort l'instance de TOUT, corpus compris) ; `modele_retire_at`
--    n'est pas un soft-delete (la copie reste servie, vue et pilotée).
--
-- ⚠️ ORDRE DE DÉPLOIEMENT INDIFFÉRENT, et c'est voulu : le code lit les deux
--    colonnes par des requêtes SÉPARÉES et TOLÉRANTES (colonne absente ⇒ toutes
--    les classes suivent, aucun jeton « plus au modèle ») ; seul l'interrupteur
--    répond alors « migration pas encore jouée ».
--
-- ⚠️ MIGRATION ADDITIVE : deux colonnes, l'une à `default` (non-réécrivant
--    depuis PG 11), l'autre nullable ; aucune policy touchée, aucune ligne
--    réécrite. Protocole NORMAL (`SUIVI_SQL.md` R6) — sandbox d'abord, prod ensuite.
--
-- ⚠️ RÉPÉTITION À BLANC : copier le CORPS entre le `begin;` et le `commit;`,
--    JAMAIS le fichier entier — son `commit;` validerait la transaction d'essai
--    (`SUIVI_SQL.md`, point 6, vécu le 14/08).
--
-- Idempotent, rejouable : `add column if not exists`.
-- Retour arrière : `parcours_suivi_du_modele_rollback.sql`.
-- Prérequis : `parcours_phase_a.sql` (scriptorium_parcours_classes),
--             `scriptorium_rag_l1.sql` (scriptorium_parcours_classe_creneaux).
-- ============================================================================

begin;

alter table scriptorium_parcours_classes
  add column if not exists suit_modele boolean not null default true;

comment on column scriptorium_parcours_classes.suit_modele is
  'Cette instance suit-elle son modèle ? true (défaut) : ce que le modèle ajoute, retire, déplace ou '
  'réordonne redescend ici, sauf sur ce que la classe a déjà vu. false : rien n''arrive ni ne part '
  'de lui-même ; la reprise se fait à la main dans l''instance. Lu par actions.ts (instancesDetachees), '
  'écrit par reglerSuiviModele.';

alter table scriptorium_parcours_classe_creneaux
  add column if not exists modele_retire_at timestamptz;

comment on column scriptorium_parcours_classe_creneaux.modele_retire_at is
  'Quand le modèle a retiré ce créneau alors que la classe l''avait déjà vu : la copie est conservée '
  'et l''écran la marque « plus au modèle ». null = copie vivante ou créneau propre. Posé par '
  'retirerCreneauxModele, remis à null au rattachement d''un jumeau (copierCreneauModele).';

commit;

-- ── Vérification (à lire APRÈS exécution) ───────────────────────────────────
-- Attendu : suit_modele_posee = t, modele_retire_posee = t, ne_suivent_pas = 0
--           (toutes les assignations suivent, comme avant), marquees = 0.
select
  (select count(*) = 1 from information_schema.columns
     where table_name = 'scriptorium_parcours_classes' and column_name = 'suit_modele')             as suit_modele_posee,
  (select count(*) = 1 from information_schema.columns
     where table_name = 'scriptorium_parcours_classe_creneaux' and column_name = 'modele_retire_at') as modele_retire_posee,
  (select count(*) from scriptorium_parcours_classes)                                                as assignations,
  (select count(*) from scriptorium_parcours_classes where not suit_modele)                          as ne_suivent_pas,
  (select count(*) from scriptorium_parcours_classe_creneaux)                                        as creneaux_instance,
  (select count(*) from scriptorium_parcours_classe_creneaux where modele_retire_at is not null)     as marquees;

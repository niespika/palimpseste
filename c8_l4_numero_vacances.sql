-- ============================================================================
-- C8 · L4 (correctif) — UNE SEMAINE DE VACANCES N'A PAS DE NUMÉRO.
-- ----------------------------------------------------------------------------
-- CE QUE CE FICHIER FAIT, ET RIEN D'AUTRE — deux gestes :
--   (1) `fragments_semaines.numero` perd son `not null` ;
--   (2) les lignes `is_vacation = true` passent à `numero = null`.
--   Plus un `comment on column`.
--
-- POURQUOI IL EXISTE.
--   `synchroniserSemaines` marque une semaine de vacances en remettant
--   `pedagogical_number` à `null` — mais **jamais `numero`**, qui est `not null`
--   et garde donc la valeur qu'il avait avant. Les deux colonnes portent
--   pourtant la MÊME grandeur (le sync leur écrit la même valeur pour une
--   semaine de travail) : l'une dit la vérité, l'autre ment.
--
--   ⭐ CONSTATÉ EN BASE LE 25/08, ET VISIBLE À L'ÉCRAN. Le semestre actif porte
--   les numéros **10, 13, 14 et 17 en DOUBLE** — une fois en travail, une fois
--   en vacances —, et l'axe du graphique de progression d'un élève affiche
--   littéralement « S10 S10 … S13 S13 … S14 S14 … S17 S17 ».
--
-- ⭐ POURQUOI `null` ET PAS UN SENTINELLE (`0`, `-1`).
--   La table a DÉJÀ tranché cette question : `pedagogical_number` est nullable
--   et vaut `null` sur ces mêmes lignes, précisément parce qu'une semaine de
--   vacances n'a pas de numéro pédagogique. Aligner `numero` sur elle ne crée
--   aucune convention neuve — cela SUPPRIME une divergence entre deux colonnes
--   qui disent la même chose. Un `0` aurait fabriqué une semaine zéro que rien
--   ne définit, et qu'un écran finirait par afficher.
--
-- ⚠️ CE QUI EST PERDU, ET POURQUOI CE N'EST RIEN.
--   Les valeurs écrasées sont des numéros PÉRIMÉS — celui que la semaine portait
--   avant de devenir vacance. Aucun n'est une donnée : ils ne désignent aucune
--   semaine de travail réelle, et ils COLLISIONNENT avec ceux qui en désignent.
--   ⭐ Vérifié avant écriture, le 25/08 : **les 9 lignes de vacances de la base
--   portent 0 dépôt et 0 présentation**. Rien n'est rattaché à ce qu'on nettoie.
--   Le `select` de tête le re-vérifie à chaque exécution.
--
-- ⚠️ L'ORDRE : CODE D'ABORD, SQL ENSUITE — l'INVERSE de `c8_l4_premiere_semaine.sql`.
--   Ici la colonne existe déjà et le code la lit : c'est sa NULLABILITÉ qui
--   change. Du code ancien qui suppose `numero` non nul afficherait « Semaine
--   null » sur les écrans qui ne filtrent pas les vacances, et surtout
--   `order by numero desc` place les `NULL` EN PREMIER sous PostgreSQL — une
--   semaine de vacances restée `ouverte` gagnerait la sélection de « la semaine
--   courante » côté élève. **Le code du lot ferme les deux** (filtre
--   `is_vacation = false` sur les trois lectures de la semaine ouverte, replis
--   d'affichage), et il doit être déployé AVANT ce fichier.
--
-- ⭐ GESTE DOUX : `drop not null` ne réécrit pas la table et ne peut pas échouer.
--   L'`update` ne touche que les lignes de vacances (9 au 25/08).
--
-- Rollback : `c8_l4_numero_vacances_rollback.sql`.
-- ============================================================================

begin;

-- ── Constat AVANT — dont la garde « rien n'est rattaché » ────────────────────
select
  count(*) filter (where is_vacation)                        as lignes_vacances,
  count(*) filter (where is_vacation and numero is not null) as a_nettoyer,
  (select count(*) from fragments_depots d
     join fragments_semaines s on s.id = d.semaine_id
    where s.is_vacation)                                     as depots_sur_vacances,
  (select count(*) from fragments_presentations p
     join fragments_semaines s on s.id = p.semaine_id
    where s.is_vacation)                                     as presentations_sur_vacances,
  (select count(*) from (
     select semestre_id, numero from fragments_semaines
      where numero is not null
      group by semestre_id, numero having count(*) > 1) x)   as numeros_en_double
from fragments_semaines;

-- ── (1) La colonne peut enfin dire « pas de numéro » ────────────────────────
alter table fragments_semaines
  alter column numero drop not null;

-- ── (2) Les semaines de vacances cessent de porter un numéro périmé ─────────
update fragments_semaines
   set numero = null
 where is_vacation and numero is not null;

comment on column fragments_semaines.numero is
  'Numéro pédagogique de la semaine, continu en sautant les vacances. '
  'NULL sur une semaine de vacances — elle n''en a pas (C8-L4). '
  'Doit rester égal à `pedagogical_number` : les deux colonnes portent la même '
  'grandeur, `numero` étant l''historique. Écrit par synchroniserSemaines().';

-- ── Constat APRÈS ───────────────────────────────────────────────────────────
select
  (select count(*) from fragments_semaines
    where is_vacation and numero is not null)                as vacances_encore_numerotees,
  (select count(*) from fragments_semaines
    where not is_vacation and numero is null)                as travail_sans_numero,
  (select count(*) from fragments_semaines
    where numero is distinct from pedagogical_number)        as colonnes_en_desaccord,
  (select count(*) from (
     select semestre_id, numero from fragments_semaines
      where numero is not null
      group by semestre_id, numero having count(*) > 1) x)   as numeros_en_double_restants;

commit;

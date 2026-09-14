-- ============================================================================
-- PLAN D'ÉVALUATION — « annoncer » un examen au calendrier ÉLÈVE (additive, NON-CASSANTE).
-- Fichier : plan_evaluation_annonce.sql   (rollback : plan_evaluation_annonce_rollback.sql)
-- ----------------------------------------------------------------------------
-- Demande de Louis (14/09/2026) : ses élèves veulent les dates d'examen au calendrier.
-- Le calendrier élève RETIENT tout créneau du plan (utils/calendrier-evenements.ts,
-- §8bis-3) sauf un quiz conçu sous `quiz_annonce_defaut`. Cette colonne est
-- l'interrupteur PAR EXAMEN : `annonce = true` ⇒ le créneau est émis au calendrier
-- élève sous son libellé GÉNÉRIQUE (le titre reste prof-only, anti-spoiler).
--
-- Deux arbitrages de Louis, portés par le CHECK :
--   · un exercice `a_concevoir` est annonçable (la date, pas le sujet) ;
--   · le jour est OBLIGATOIRE : pas d'annonce sans `jour_prevu` — sans quoi l'élève
--     lirait le jour par défaut de la semaine, qui n'est pas la date de l'examen.
-- Et par construction : seul un exercice ÉVALUATIF EN CLASSE (un examen) s'annonce.
-- Toute écriture qui remet `jour_prevu` à null (caler « à caler », déplacer,
-- reporter) DOIT donc remettre `annonce` à false — le code le fait ; le CHECK le garde.
--
-- Porte : la colonne naît à false pour toutes les lignes — rien ne change pour
-- l'élève tant que le prof n'annonce pas, examen par examen. `plan_evaluation_actif`
-- reste la porte amont. Idempotent, rejouable, aucune donnée modifiée.
-- ============================================================================

begin;

alter table scriptorium_exercices_planifies
  add column if not exists annonce boolean not null default false;

alter table scriptorium_exercices_planifies
  drop constraint if exists exercices_annonce_chk;
alter table scriptorium_exercices_planifies
  add constraint exercices_annonce_chk check (
    not annonce
    or (jour_prevu is not null and nature = 'evaluatif' and lieu = 'classe' and statut <> 'annule')
  );

comment on column scriptorium_exercices_planifies.annonce is
  'Examen annoncé au calendrier élève (libellé générique). Exige jour_prevu, évaluatif, en classe.';

commit;

-- Vérification (à jouer après) :
--   select count(*) filter (where annonce) as annonces, count(*) as total
--   from scriptorium_exercices_planifies where supprime_at is null;
--   -- attendu juste après la migration : annonces = 0.

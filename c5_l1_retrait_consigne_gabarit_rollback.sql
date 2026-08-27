-- ============================================================================
-- ROLLBACK de `c5_l1_retrait_consigne_gabarit.sql`.
-- ----------------------------------------------------------------------------
-- Il recrée `exercices_types.consigne_gabarit` — `text`, NULLABLE, sans `CHECK`,
-- exactement la forme qu'elle avait (`c4_l1_schema.sql` : `consigne_gabarit text`).
--
-- ⭐ IL NE RÉCUPÈRE RIEN, ET C'EST SANS OBJET : la colonne était NULL sur les
--    quinze lignes des deux bases, et le fichier direct REFUSE DE JOUER si une
--    seule ligne porte une valeur. Il n'y a donc jamais rien eu à perdre.
--
-- ⚠️ CE QU'IL NE REND PAS, ET QU'IL NE DOIT PAS RENDRE : la DÉCLARATION au
--    `07-Implementation.md` §1.1. La colonne a été retirée de la source sur
--    décision de Louis du 26/08, avec sa généalogie ; rejouer ce rollback
--    recrée une colonne que PLUS AUCUNE SOURCE NE DÉCLARE. Ne l'employer que
--    pour défaire une exécution ratée — jamais pour rouvrir la décision, qui se
--    rouvre au `07-`, pas en base.
-- ============================================================================

begin;

alter table exercices_types add column if not exists consigne_gabarit text;

comment on column exercices_types.consigne_gabarit is
  'RECRÉÉE PAR ROLLBACK. ⚠️ Plus aucune source ne la déclare depuis le 07- v2.55 (26/08) : '
  'la banque de consignes vit à `exercices_routes` (objet × mode × cran), dérivée par '
  'scripts/derive-doctrine.py. Cette colonne est un reliquat — voir 07- §1.1.';

select 'exercices_types.consigne_gabarit : ' || case
  when exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'exercices_types'
                  and column_name = 'consigne_gabarit')
    then 'RECRÉÉE (vide)'
  else 'ABSENTE — le rollback a échoué'
end as verdict;

commit;

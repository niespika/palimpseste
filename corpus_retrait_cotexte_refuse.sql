-- ═══════════════════════════════════════════════════════════════════════════
-- corpus_retrait_cotexte_refuse.sql — 2026-08-31
--
-- LES 21 INSTANCES DES CRANS DE PRODUCTION SORTENT DU VIVIER.
--
-- ⛔ LE MOTIF. À l'import du 31/08, les SEPT matériaux de co-texte
--    (`mat-*-composer-cotexte`) ont été REFUSÉS par la base :
--
--      new row for relation "exercices_materiaux" violates check constraint
--      "exercices_materiaux_observable_competence_check"
--
--    Un co-texte n'a NI observable NI défaut — ce n'est pas un matériau
--    calibré, c'est le texte qui entoure, celui que l'élève lit pour savoir
--    de quoi il parle. `c4_l8_fabrique.sql:454` exige pourtant
--    `observable_competence` NOT NULL parmi les six compétences, et
--    `import-ecriture.ts:373` y écrit `''`.
--
-- ⛔⛔ ET LA CASSE EST MUETTE. `import-ecriture.ts:446` écrit
--     `materiau_id: c?.materiau ? (idMateriau.get(...) ?? null) : null` — le
--     `?? null` avale l'absence. Les 21 instances se sont écrites, leurs cas
--     se sont écrits, le compteur `entres.exercices` s'est incrémenté, et
--     RIEN n'a dit que l'appui nommé n'existait pas. Elles sont passées à
--     `concu`, donc SERVABLES (`utils/moteur/vivier.ts:460`).
--
--     Ce que l'élève lirait, tel quel :
--       « Voici l'argument à illustrer. Écris l'exemple qui illustre cet
--         argument. »        → aucun argument à l'écran.
--       « Voici l'auteur et sa thèse… »   → aucun auteur, aucune thèse.
--       « Voici deux questions… garde-en une, écarte l'autre. » → aucune question.
--
-- ✅ MESURÉ AVANT ÉCRITURE (production, 31/08) : 21 cibles dérivées du fichier
--    réellement importé (`generateur/banque/banque.json`), 21 trouvées en base,
--    toutes `concu`, 21 cas dont 0 avec `materiau_id`, **0 dépôt élève**,
--    **0 décision de routeur**. Rien n'est retiré à un élève.
--
-- ⚠️ PROD SEULEMENT — ces lignes n'existent pas en bac à sable : elles sont
--    nées de l'import du 31/08 en production. Rien à jouer en sandbox.
--
-- ⚠️ CE N'EST PAS UNE SUPPRESSION. `statut` revient à `a_concevoir` (la file de
--    validation, où le professeur les reprend) et `bloque` passe à `true` pour
--    que `validerEnFile` REFUSE de les revalider par mégarde tant que le
--    co-texte n'a pas sa place en base — « une entrée bloquée ne se valide pas
--    tant qu'elle l'est ». Le retour arrière est `*_rollback.sql`.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

update exercices
   set statut   = 'a_concevoir',
       bloque   = true,
       blocages = jsonb_build_array(
         'Import du 31/08 : le co-texte que le cas nomme (`mat-*-composer-cotexte`) a été '
         'REFUSÉ par la base (`exercices_materiaux_observable_competence_check` — un co-texte '
         'n''a ni observable ni défaut). `exercices_cas.materiau_id` est resté NUL, et la '
         'consigne désigne un texte que l''élève ne voit pas. À rouvrir quand le co-texte aura '
         'sa place en base.')
 where statut = 'concu'
   and id_import in (
     'ex-exemple-composer-02-production',
     'ex-exemple-composer-06-production',
     'ex-exemple-composer-08-production',
     'ex-objection-composer-02-production',
     'ex-objection-composer-06-production',
     'ex-objection-composer-08-production',
     'ex-paragraphe-composer-02-production',
     'ex-paragraphe-composer-06-production',
     'ex-paragraphe-composer-08-production',
     'ex-partie-generique-composer-02-production',
     'ex-partie-generique-composer-06-production',
     'ex-partie-generique-composer-08-production',
     'ex-partie-partie-synth-composer-02-production',
     'ex-partie-partie-synth-composer-06-production',
     'ex-partie-partie-synth-composer-08-production',
     'ex-phrase-composer-02-production',
     'ex-phrase-composer-06-production',
     'ex-phrase-composer-08-production',
     'ex-transition-composer-02-production',
     'ex-transition-composer-06-production',
     'ex-transition-composer-08-production');

-- Le contrôle, DANS la transaction : 21 attendues.
select count(*) as retirees
  from exercices
 where bloque and statut = 'a_concevoir'
   and id_import like 'ex-%-production';

commit;

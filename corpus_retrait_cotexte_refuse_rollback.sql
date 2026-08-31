-- ═══════════════════════════════════════════════════════════════════════════
-- corpus_retrait_cotexte_refuse_rollback.sql — retour arrière du 31/08
--
-- ⛔⛔ IL REMET DANS LE VIVIER 21 INSTANCES DONT LA CONSIGNE DÉSIGNE UN TEXTE
--     QUE L'ÉLÈVE NE VOIT PAS. Ne l'exécuter que si le co-texte est ENTRÉ en
--     base ET que `exercices_cas.materiau_id` a été raccordé — sinon on
--     rouvre exactement le défaut que l'aller a fermé.
--
-- ✅ LE CONTRÔLE À PASSER AVANT : la requête ci-dessous doit rendre 21.
--      select count(*) from exercices e
--        join exercices_cas c on c.exercice_id = e.id
--       where e.id_import like 'ex-%-0[268]-production'
--         and c.materiau_id is not null;
-- ═══════════════════════════════════════════════════════════════════════════

begin;

update exercices
   set statut   = 'concu',
       bloque   = false,
       blocages = '[]'::jsonb
 where statut = 'a_concevoir'
   and bloque
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

commit;

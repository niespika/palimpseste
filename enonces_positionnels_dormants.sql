-- ============================================================================
-- LES CINQ ÉNONCÉS POSITIONNELS DORMANTS — validés par Louis le 2026-09-07 au soir
-- sur l'artefact « Les énoncés positionnels ».
-- ----------------------------------------------------------------------------
-- Suite de `enonces_positionnels_4b.sql`, qui a corrigé les DEUX clés servies.
-- Celles-ci n'ont AUCUN exercice en base : elles ne fuient pas aujourd'hui, elles
-- fuiraient à la première vague qui les instancie. On les corrige AVANT.
--
-- ⭐ LE TRI, ET IL EST LA RAISON DE CE FICHIER. Sur les 18 clés à marqueur
--    positionnel dur, trois familles :
--    · **5 FUIENT** — le marqueur SITUE le passage à trouver. Les voici.
--    · **7 sont DÉFINITIONNELLES** — « la dernière partie » d'un plan, « la
--      question finale » d'une problématisation : la position NOMME l'objet, et
--      la retirer rendrait l'énoncé faux. **Non touchées, décision de Louis.**
--    · **4 sont du CONTEXTE** — le marqueur désigne un repère, pas la cible.
--      **Non touchées.**
--
-- ⛔ AUCUNE ligne `exercices_cas` n'est touchée : ces cinq clés n'ont pas
--    d'exercice, donc pas de `reponse_attendue` à aligner. Vérifié avant.
-- ⚠️ `paragraphe.idee.non_tenue` est la seule réécriture de FOND : « la première
--    phrase annonce » devient « le paragraphe annonce », parce que retirer le
--    seul mot « première » aurait laissé « la phrase annonce une idée… on ne
--    retrouve pas sa phrase », qui ne veut plus rien dire.
--
-- Source amendée : `09-Objets.md` (les cinq entrées, plus le renvoi du §12 qui
-- cite `conclusion.portee.idee_neuve`). Fixture rejouée, diff vérifié = 5.
-- Retour arrière : `enonces_positionnels_dormants_rollback.sql`.
-- ============================================================================

begin;

update exercices_problemes set enonce =
  'La phrase dit que le texte laisse des questions ouvertes, sans citer un seul passage que la lecture retenue n''explique pas.'
 where cle = 'conclusion.ouvert.convenance' and enonce like 'La dernière phrase%';

update exercices_problemes set enonce =
  'La phrase dit que la question était importante, sans dire ce que la réponse change à ce qu''on croyait en lisant le sujet.'
 where cle = 'conclusion.portee.declaree' and enonce like 'La dernière phrase%';

update exercices_problemes set enonce =
  'La phrase lance une idée qui n''apparaît nulle part dans le devoir.'
 where cle = 'conclusion.portee.idee_neuve' and enonce like 'La dernière phrase%';

update exercices_problemes set enonce =
  'La réponse irait telle quelle à dix autres sujets. Rien du sujet ne s''y retrouve.'
 where cle = 'conclusion.reponse.passe_partout' and enonce like 'La réponse finale%';

update exercices_problemes set enonce =
  'Le paragraphe annonce une idée, mais ce qu''il montre ensuite en est une autre. Si on le résume, on ne retrouve pas ce qu''il annonçait.'
 where cle = 'paragraphe.idee.non_tenue' and enonce like 'La première phrase%';

commit;

-- ── VÉRIFICATION — les deux drapeaux doivent être `t` ───────────────────────
-- select
--   (select count(*) = 5 from exercices_problemes where cle in (
--      'conclusion.ouvert.convenance','conclusion.portee.declaree','conclusion.portee.idee_neuve',
--      'conclusion.reponse.passe_partout','paragraphe.idee.non_tenue')
--      and enonce not like 'La dernière%' and enonce not like 'La première%'
--      and enonce not like 'La réponse finale%')                                as les_cinq_nettes,
--   -- ⚠️ Les SEPT définitionnelles et les QUATRE de contexte doivent être INTACTES.
--   (select count(*) = 7 from exercices_problemes where cle in (
--      'paragraphe.idee.tardive','partie.solution.tranche','plan.derniere.compromis',
--      'plan.derniere.troisieme_avis','problematisation.question.orientee',
--      'problematisation.question.plaquee','problematisation.question.retournee')) as sept_intactes;

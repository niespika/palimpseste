-- Retour arrière de `enonces_positionnels_4b.sql` — écrit AVANT l'exécution.
-- ⚠️ Il remet la faute d'accord (« Il se contredit ») : c'est bien un retour à
--    l'état d'avant, pas une correction partielle.
begin;
update exercices_problemes
   set enonce = 'La dernière phrase revient sur ce que le paragraphe vient de montrer. Il se contredit au lieu de conclure.'
 where cle = 'paragraphe.retour.retractation';
update exercices_problemes
   set enonce = 'La dernière phrase, au lieu de dire ce que le paragraphe a réglé du sujet, lance une idée nouvelle.'
 where cle = 'paragraphe.retour.idee_neuve';
update exercices_cas
   set reponse_attendue = 'La dernière phrase revient sur ce que le paragraphe vient de montrer. Il se contredit au lieu de conclure.'
 where reponse_attendue = 'La phrase revient sur ce que le paragraphe vient de montrer. Elle le contredit au lieu de conclure.';
update exercices_cas
   set reponse_attendue = 'La dernière phrase, au lieu de dire ce que le paragraphe a réglé du sujet, lance une idée nouvelle.'
 where reponse_attendue = 'La phrase, au lieu de dire ce que le paragraphe a réglé du sujet, lance une idée nouvelle.';
commit;

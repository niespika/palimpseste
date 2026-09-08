-- Retour arrière de `enonces_positionnels_dormants.sql` — écrit AVANT l'exécution.
begin;
update exercices_problemes set enonce = 'La dernière phrase dit que le texte laisse des questions ouvertes, sans citer un seul passage que la lecture retenue n''explique pas.'
 where cle = 'conclusion.ouvert.convenance';
update exercices_problemes set enonce = 'La dernière phrase dit que la question était importante, sans dire ce que la réponse change à ce qu''on croyait en lisant le sujet.'
 where cle = 'conclusion.portee.declaree';
update exercices_problemes set enonce = 'La dernière phrase lance une idée qui n''apparaît nulle part dans le devoir.'
 where cle = 'conclusion.portee.idee_neuve';
update exercices_problemes set enonce = 'La réponse finale irait telle quelle à dix autres sujets. Rien du sujet ne s''y retrouve.'
 where cle = 'conclusion.reponse.passe_partout';
update exercices_problemes set enonce = 'La première phrase annonce une idée, mais ce que le paragraphe montre ensuite en est une autre. Si on le résume, on ne retrouve pas sa première phrase.'
 where cle = 'paragraphe.idee.non_tenue';
commit;

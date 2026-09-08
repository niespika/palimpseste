-- ============================================================================
-- LES ÉNONCÉS POSITIONNELS DU 4(b) — deux clés, et la faute d'accord de l'une.
-- Décision de Louis, 2026-09-07 au soir, sur sa propre recette.
-- ----------------------------------------------------------------------------
-- LE DÉFAUT. Au cran 4 variante (b), la consigne CITE l'énoncé du problème puis
-- demande « Surligne le passage qui le porte » (`10-` §3). Un énoncé qui dit
-- « La DERNIÈRE phrase… » désigne donc déjà le passage à trouver : il ne reste
-- rien à chercher. C'est la seule configuration où la fuite existe — aux crans
-- 7 et 9 la consigne ne cite pas l'énoncé, aux crans 3 et 5 le passage est en
-- gras et le marqueur est redondant, pas révélateur.
--
-- ⭐ MESURÉ AVANT D'ÉCRIRE : 18 des 206 clés portent un marqueur positionnel
--    dur ; **2 seulement sont servies à un 4(b)** — les deux d'ici. Les 16 autres
--    n'ont AUCUN exercice : elles fuiraient à la prochaine vague, pas aujourd'hui.
--    ⚠️ Elles ont été triées À LA MAIN le 07/09, clé par clé — 5 fuites (corrigées
--    par `enonces_positionnels_dormants.sql`), 7 définitionnelles et 4 de contexte,
--    laissées telles quelles. **Aucun garde-fou automatique n'existe encore** :
--    rien n'empêche une clé neuve de réintroduire le défaut. À écrire.
--
-- ⚠️ ET UNE FAUTE D'ACCORD, relevée par Louis sur la même clé : « Il se
--    contredit » — « il » n'a pour antécédent que « le paragraphe », alors que
--    c'est LA PHRASE qui contredit. « Elle le contredit » lève l'ambiguïté.
--
-- LES DEUX DOMICILES QUE CE FICHIER TOUCHE, et pourquoi les deux :
--   · `exercices_problemes.enonce` — la grille, ce que la CONSIGNE cite ;
--   · `exercices_cas.reponse_attendue` — ce que « Ce qu'il fallait voir » sert.
--   Le générateur écrit littéralement `reponse_attendue = c.enonce` aux crans
--   1, 4 et 9 (`generateur/noyau/gabarit.py`) : les deux portent donc la MÊME
--   chaîne, et n'en corriger qu'une les ferait DIVERGER — pire que la répétition.
--
-- ⛔ CE FICHIER NE RÉGÉNÈRE PAS LA TABLE. `derive-doctrine.py --sql` la remplace
--    EN BLOC, ce qui embarquerait les amendements non relus d'une autre séance
--    (`02-`, `10-`, en cours au moment où ceci est écrit). Deux `update` ciblés,
--    idempotents, qui ne touchent que ce qui porte l'ancienne chaîne.
--
-- Sources : `09-Objets.md` (amendé le 07/09, les deux entrées) ·
--           `10-Gabarit.md` §2, §3 · `02-exercices.md` §5.
-- Retour arrière : `enonces_positionnels_4b_rollback.sql`.
-- ============================================================================

begin;

-- ── 1) LA GRILLE ────────────────────────────────────────────────────────────
update exercices_problemes
   set enonce = 'La phrase revient sur ce que le paragraphe vient de montrer. Elle le contredit au lieu de conclure.'
 where cle = 'paragraphe.retour.retractation'
   and enonce = 'La dernière phrase revient sur ce que le paragraphe vient de montrer. Il se contredit au lieu de conclure.';

update exercices_problemes
   set enonce = 'La phrase, au lieu de dire ce que le paragraphe a réglé du sujet, lance une idée nouvelle.'
 where cle = 'paragraphe.retour.idee_neuve'
   and enonce = 'La dernière phrase, au lieu de dire ce que le paragraphe a réglé du sujet, lance une idée nouvelle.';

-- ── 2) CE QUE L'ÉCRAN SERT EN CORRECTION ────────────────────────────────────
-- ⚠️ Filtré sur la CHAÎNE, pas sur la clé : un cas dont la `reponse_attendue`
--    aurait été retouchée à la main ne doit pas être écrasé.
update exercices_cas
   set reponse_attendue = 'La phrase revient sur ce que le paragraphe vient de montrer. Elle le contredit au lieu de conclure.'
 where reponse_attendue = 'La dernière phrase revient sur ce que le paragraphe vient de montrer. Il se contredit au lieu de conclure.';

update exercices_cas
   set reponse_attendue = 'La phrase, au lieu de dire ce que le paragraphe a réglé du sujet, lance une idée nouvelle.'
 where reponse_attendue = 'La dernière phrase, au lieu de dire ce que le paragraphe a réglé du sujet, lance une idée nouvelle.';

commit;

-- ── VÉRIFICATION (à jouer APRÈS) — les quatre drapeaux doivent être `t` ──────
-- ⚠️ LE DRAPEAU NE PORTE QUE SUR LES DEUX CLÉS TOUCHÉES. Un contrôle « plus
--    aucun énoncé ne commence par La dernière phrase » serait FAUX : 16 autres
--    clés en portent un, et elles ne sont servies à AUCUN 4(b) — c'est mesuré,
--    et c'est pourquoi ce fichier ne les touche pas.
-- select
--   (select count(*) = 0 from exercices_problemes
--       where cle in ('paragraphe.retour.retractation','paragraphe.retour.idee_neuve')
--         and enonce like 'La dernière phrase%')                                                    as grille_nette,
--   (select count(*) = 0 from exercices_cas where reponse_attendue like 'La dernière phrase revient%'
--       or reponse_attendue like 'La dernière phrase, au lieu%')                                    as cas_nets,
--   (select count(*) = 1 from exercices_problemes
--       where cle = 'paragraphe.retour.retractation' and enonce like 'La phrase revient%')          as retractation_ok,
--   (select count(*) = 1 from exercices_problemes
--       where cle = 'paragraphe.retour.idee_neuve' and enonce like 'La phrase, au lieu%')           as idee_neuve_ok;

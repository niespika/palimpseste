-- ============================================================================
-- C5 · L1 — LE RETRAIT DE `exercices_types.consigne_gabarit`.
-- ⚠️ CE FICHIER N'EST PAS ADDITIF. ⚠️ IL N'A PAS ENCORE ÉTÉ JOUÉ.
-- ----------------------------------------------------------------------------
-- ⭐ CE N'ÉTAIT PAS UNE DONNÉE MANQUANTE, C'ÉTAIT UN RELIQUAT — et la dette
--    était DIAGNOSTIQUÉE DEPUIS LE 16/08 sans avoir jamais été écrite
--    (`CONTEXTE.md`, dépôt `palimpseste-conception`, deux entrées du 16 août) :
--
--      « Le `07-` §1.1 met UNE SEULE `consigne_gabarit` À PLAT sur la ligne du
--        type — treize valeurs. Le `02-` §6 B.1 demande une BANQUE de consignes
--        pour le couple objet × mode × cran, "tenue par
--        `04-Instances_Exercices.md`" — de l'ordre de 400 cases. […] Le schéma
--        sait déjà déclarer par cran ; `consigne_gabarit` est restée à plat PAR
--        OUBLI. Ce n'est pas un arbitrage à rendre, c'est une dette du `07-` à
--        écrire. »
--
--    Elle est écrite : `07-Implementation.md` **v2.55**, §1.1 — la colonne sort
--    de la déclaration d'`exercices_types`, sur DÉCISION DE LOUIS DU 26/08.
--    Ce fichier ne fait que suivre la source ; il ne décide rien.
--
-- LES TROIS ÉCARTS QU'AUCUNE VALEUR N'AURAIT PU COMBLER (mesurés le 16/08) :
--   · la CARDINALITÉ — 13 contre ~400 ;
--   · la VARIATION — une valeur unique par objet veut dire que la consigne ne
--     change NI AVEC LE MODE NI AVEC LE CRAN, quand le `04-` §14.1 tire le VERBE
--     du mode et l'APPUI du cran ;
--   · le STOCK EXISTANT qui ne rentre pas — 324 consignes aux `instances/`,
--     plus 15 patrons.
--
-- ⭐ CE QUI FAIT LE TRAVAIL AUJOURD'HUI, ET QUI EST LA BONNE SOURCE :
--    `exercices_routes` — 3264 lignes, DÉRIVÉES par `scripts/derive-doctrine.py`
--    depuis le 20/08 (C4-L8) —, servie par le pipeline de conception à son
--    étage 4, avec sa réécriture de formulation. « Les questions engendrées
--    depuis la consigne-gabarit du type » le sont, correctement, DEPUIS LA ROUTE.
--
-- ⚠️ LE `drop` EST SANS PERTE, ET ÇA SE VÉRIFIE AVANT : la colonne est NULL sur
--    LES QUINZE LIGNES — les treize objets et les deux examens diagnostiques —,
--    en bac à sable COMME EN PROD (vérifié par requête le 26/08 :
--    `consigne_gabarit=not.is.null` rend `[]` des deux côtés). Le bloc de
--    contrôle ci-dessous REFUSE DE JOUER si une seule ligne porte une valeur.
--
-- ⚠️ AUCUN LECTEUR À RETIRER D'ABORD, et c'est ce qui distingue ce retrait de
--    celui de C4-L11 : `grep -rn consigne_gabarit` sur le dépôt ne rend, hors
--    fichiers `.sql` et relevés, AUCUN lecteur applicatif — ni écran, ni
--    dériveur, ni contrôle d'import. `c4_l8_doctrine.sql` la nomme pour dire
--    qu'il ne la remplit pas.
--
-- ⚠️ CE QUE LE ROLLBACK REND, ET CE QU'IL NE REND PAS : il recrée la colonne
--    `text` NULLABLE, avec son commentaire. Il ne récupère rien de ce qu'elle
--    portait — et c'est sans objet, elle ne portait rien.
--
-- PROTOCOLE : bac à sable d'abord, prod ensuite, jamais l'inverse et jamais sans
-- noter (`SUIVI_SQL.md`, règle R6). ⚠️ `exercices_types` est une table de
-- DOCTRINE, remplie par un dériveur unique : après exécution, rejouer
-- `python3 scripts/derive-doctrine.py --verifie` et attendre `IDENTIQUE`.
-- ============================================================================

begin;

-- ── Le contrôle qui REFUSE DE JOUER si la colonne porte quoi que ce soit ─────
do $$
declare v_pleines int; v_total int;
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'exercices_types'
       and column_name = 'consigne_gabarit')
  then
    raise notice 'consigne_gabarit est déjà absente — rien à faire.';
    return;
  end if;

  select count(*) into v_total from exercices_types;
  execute 'select count(*) from exercices_types where consigne_gabarit is not null'
     into v_pleines;

  if v_pleines > 0 then
    raise exception
      'REFUS : % ligne(s) sur % portent une `consigne_gabarit` non nulle. '
      'Le retrait serait une PERTE, pas un nettoyage — et la source dit que la '
      'colonne est un reliquat vide (07- §1.1, v2.55). Regarder ce qui les a '
      'écrites AVANT de rejouer ce fichier.', v_pleines, v_total;
  end if;

  raise notice 'contrôle : % ligne(s), 0 valeur — le retrait est sans perte.', v_total;
end $$;

alter table exercices_types drop column if exists consigne_gabarit;

-- ── Le constat, après ────────────────────────────────────────────────────────
select 'exercices_types.consigne_gabarit : ' || case
  when exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'exercices_types'
                  and column_name = 'consigne_gabarit')
    then 'ENCORE LÀ — le retrait a échoué'
  else 'RETIRÉE (' || (select count(*) from exercices_types)::text || ' ligne(s) intactes)'
end as verdict;

commit;

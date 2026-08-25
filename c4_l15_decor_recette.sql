-- ============================================================================
-- C4 · L15 — LE DÉCOR DE RECETTE : quatre crans que la sandbox ne portait pas.
-- ----------------------------------------------------------------------------
-- ⚠️ CE N'EST PAS UNE MIGRATION : aucun objet de schéma n'est touché. C'est du
--    DÉCOR — des lignes de données, semées pour que les cinq clauses du « fait
--    quand » puissent se prouver À L'ÉCRAN, sur des instances réelles.
--
-- ⚠️ POURQUOI IL FAUT EN SEMER. Relevé à la séance du 24/08, la sandbox portait
--    des instances aux crans 1, 2, 3, 4, 5 et 8 — **mais AUCUNE au cran 6**, et
--    les seules du cran 1 étaient en `lieu = 'classe'`, que le déroulé maison ne
--    charge pas. Or « un smoke à l'écran, sur un cran 6 réel, est la seule
--    preuve » du repli du guide : le patron du cran 8 est celui du cran 6 amputé
--    de sa case, mot pour mot, et **une case vide ne fait tomber aucun test**.
--
-- ⭐ CE QUE CHAQUE PIÈCE PROUVE, ET POURQUOI ELLE EST FAITE AINSI :
--   · `mat-c4l15-substitution` — un matériau dont la `version_corrigee`
--     REMPLACE un mot (« donc » → « or »). C'est le cas de la SUBSTITUTION, que
--     la sandbox ne portait pas : ses trois matériaux portent tous un défaut
--     d'ABSENCE, où le diff est légitimement vide.
--   · `ex-c4l15-cran1` — cran 1, quatre candidats qui sont des MOTS DU TEXTE :
--     les quatre doivent se marquer, **la bonne réponse comprise**.
--   · `ex-c4l15-cran5` — cran 5, SANS AUCUN DISTRACTEUR (la doctrine les y met à
--     `null`) : il doit marquer quand même. C'est le déclencheur par le CRAN.
--   · `ex-c4l15-cran4` — cran 4, le MÊME matériau que le cran 5 : il ne doit
--     RIEN marquer, alors qu'il a de quoi. « L'y trouver EST le travail. »
--   · `ex-c4l15-cran6` — cran 6, consigne composée sur le patron du `04-` §14.1
--     (« Écris l'argument. » + le guide) : le bloc doit se replier.
--   · `ex-c4l15-cran6-nu` — cran 6 dont la consigne NE PORTE PAS son guide :
--     le bloc doit RESTER, et un avertissement doit se lever. C'est la garde.
--
-- ⚠️ LE DÉCOR EST EN `lieu = 'maison'` ET `statut = 'assigne'` : c'est la seule
--    forme que `lireDepotMaison` charge.
-- ⛔ IL EST RATTACHÉ À UN ÉLÈVE EXISTANT, choisi par requête au moment de
--    l'exécution — aucun compte n'est créé, aucune inscription n'est touchée.
--
-- ROLLBACK : `c4_l15_decor_recette_rollback.sql`. Tout ce que ce fichier sème
-- porte un `id_import` préfixé `…c4l15…`, et le retrait n'a donc pas à deviner.
-- ============================================================================

begin;

-- ── Le matériau de SUBSTITUTION ─────────────────────────────────────────────
insert into exercices_materiaux
  (id_import, type_id, objet_code, support, contenu, version_corrigee,
   observable_code, observable_competence, defaut, mode, famille, statut)
select 'mat-c4l15-substitution',
       t.id, 'argument', 'extrait',
       'Les villes du Nord ont interdit les feux de bois. La qualite de l''air y est donc meilleure.',
       'Les villes du Nord ont interdit les feux de bois. La qualite de l''air y est or meilleure.',
       'garant_present', 'argumentation',
       'le connecteur affirme un rapport de consequence que rien n''etablit',
       'composer', 'le connecteur ment', 'valide'
  from exercices_types t where t.code = 'argument'
on conflict (id_import) do nothing;

-- ── Les cinq instances ──────────────────────────────────────────────────────
-- ⚠️ `consigne_instanciee` est un jsonb : une CHAÎNE pour un cas, un TABLEAU
--    pour la paire. Les crans 1 et 4 sont des crans de diagnostic, donc des
--    paires (`02-` §2.3.1 a) ; les crans 5 et 6 portent un cas.
insert into exercices (id_import, type_id, lieu, cran, genre, consigne_instanciee,
                       paire_diagnostic, guide, statut, modes_par_competence,
                       observable_isole_code, observable_isole_competence,
                       materiau_cible_provenance, materiau_cible_support)
select v.id_import, t.id, 'maison', v.cran, null, v.consigne, v.paire,
       -- ⚠️ `modes_par_competence` porte une LISTE par compétence, pas une
       --    chaîne : `exercices_modes_chk` refuse tout ce qui n'est pas un
       --    tableau (`modes_par_competence_bien_forme`).
       -- ⚠️ `exercices.statut` n'a PAS les mêmes valeurs que
       --    `exercices_materiaux.statut` : ici c'est le cycle de vie de
       --    l'instance — `a_concevoir` · `concu` · `assigne` · `clos` —, là
       --    c'est la file de validation — `a_valider` · `valide` · `retire`.
       --    Deux colonnes du même nom, deux énumérations.
       v.guide, 'assigne', '{"argumentation": ["composer"]}'::jsonb,
       v.obs, case when v.obs is null then null else 'argumentation' end,
       v.cible, case when v.cible is null then null else 'extrait' end
  from exercices_types t,
       (values
         ('ex-c4l15-cran1', 1,
          '["Parmi ces quatre mots en gras dans le texte, lequel dit le vrai rapport entre les deux idees ?","Meme famille, sans indication : lequel dit le vrai rapport ?"]'::jsonb,
          true, null::text, 'garant_present', 'genere'),
         ('ex-c4l15-cran5', 5,
          '"Le mot en gras dit un rapport que rien n''etablit. Reecris la phrase."'::jsonb,
          false, null, 'garant_present', 'genere'),
         ('ex-c4l15-cran4', 4,
          '["Un connecteur affirme un rapport que rien n''etablit. Dis ou.","Meme famille, sans indication : dis ou."]'::jsonb,
          true, null, 'garant_present', 'genere'),
         ('ex-c4l15-cran6', 6,
          '"Ecris l''argument. Conclusion ? Preuve ? Quelle raison fait que cette preuve-la justifie cette conclusion-la ?"'::jsonb,
          false,
          'Conclusion ? Preuve ? Quelle raison fait que cette preuve-la justifie cette conclusion-la ?',
          null, null),
         ('ex-c4l15-cran6-nu', 6,
          '"Ecris l''argument."'::jsonb,
          false,
          'Conclusion ? Preuve ? Quelle raison fait que cette preuve-la justifie cette conclusion-la ?',
          null, null)
       ) as v(id_import, cran, consigne, paire, guide, obs, cible)
 -- ⚠️ `exercices.id_import` n'a AUCUNE contrainte d'unicité — seul
 --    `exercices_materiaux` en porte une. Un `on conflict (id_import)` échoue
 --    donc ici (« no unique or exclusion constraint matching »), et un simple
 --    rejeu SÈMERAIT LES LIGNES EN DOUBLE. D'où le `not exists` : il rend ce
 --    fichier idempotent sans s'appuyer sur une contrainte qui n'existe pas.
 where t.code = 'argument'
   and not exists (select 1 from exercices x where x.id_import = v.id_import);

-- ── Les cas ─────────────────────────────────────────────────────────────────
-- ⚠️ Les distracteurs sont des OBJETS `{texte, pourquoi_faux}` (`08-` §5.2), et
--    au cran 1 ce sont des MOTS DU TEXTE : c'est ce qui les rend marquables (la
--    règle du `02-` §5 « un candidat qui n'est pas un fragment du matériau ne se
--    marque pas », opérationnalisée par le seuil d'un ou deux mots).
insert into exercices_cas (exercice_id, ordre, materiau_id, defaut, distracteurs,
                           reponse_attendue, pourquoi_juste)
select e.id, v.ordre, m.id, v.defaut, v.distracteurs::jsonb, v.attendue, v.pourquoi
  from exercices e
  join (values
    ('ex-c4l15-cran1', 1, 'mat-c4l15-substitution', 'le connecteur ment',
     '[{"texte":"interdit","pourquoi_faux":"il decrit la mesure, il ne relie rien"},{"texte":"meilleure","pourquoi_faux":"il qualifie, il ne relie pas"},{"texte":"villes","pourquoi_faux":"c''est le sujet, pas le rapport"}]',
     'donc', 'c''est lui qui affirme la consequence que rien n''etablit'),
    ('ex-c4l15-cran1', 2, 'mat-garant-a', 'le garant manque',
     '[{"texte":"machines","pourquoi_faux":"c''est le sujet"},{"texte":"remplacent","pourquoi_faux":"c''est la preuve, pas le lien"},{"texte":"travail","pourquoi_faux":"c''est la conclusion"}]',
     'donc', 'c''est lui qui affirme la consequence'),
    ('ex-c4l15-cran5', 1, 'mat-c4l15-substitution', 'le connecteur ment',
     null, 'Les villes du Nord ont interdit les feux de bois. La qualite de l''air y est or meilleure.', null),
    ('ex-c4l15-cran4', 1, 'mat-c4l15-substitution', 'le connecteur ment',
     null, 'le connecteur de la seconde phrase', null),
    ('ex-c4l15-cran4', 2, 'mat-garant-a', 'le garant manque',
     null, 'le lien entre la preuve et la conclusion', null),
    ('ex-c4l15-cran6', 1, null, null, null, null, null),
    ('ex-c4l15-cran6-nu', 1, null, null, null, null, null)
  ) as v(ex, ordre, mat, defaut, distracteurs, attendue, pourquoi)
    on v.ex = e.id_import
  left join exercices_materiaux m on m.id_import = v.mat
 where not exists (select 1 from exercices_cas c
                    where c.exercice_id = e.id and c.ordre = v.ordre);

-- ── Les dépôts, sur des élèves EXISTANTS ────────────────────────────────────
-- ⛔ AUCUN COMPTE N'EST CRÉÉ, et aucune inscription n'est touchée : on pose des
--    dépôts pour des élèves qui existent déjà.
-- ⚠️ DEUX ÉLÈVES, ET LA RAISON EST LA RECETTE. `Sacha` porte déjà le décor de
--    C4-L8 — c'est le compte des smokes serveur. Mais **la recette R1 se joue
--    À L'ÉCRAN, dans un navigateur, avec le compte réellement connecté** : c'est
--    `Elo`, et sans dépôt à son nom `lireDepotMaison` refuse — il filtre sur
--    `eleve_id`, et c'est exactement la garde qu'on veut garder.
-- ⭐ `uk_depots_eleve_exercice` est UNIQUE (eleve_id, exercice_id) : les deux
--    séries cohabitent sans se marcher dessus, et le `not exists` rend le
--    fichier rejouable autant de fois qu'on veut.
insert into exercices_depots (eleve_id, exercice_id, origine, statut)
select v.eleve::uuid, e.id, 'routeur', 'assigne'
  from exercices e
  cross join (values
      ('108aaa3a-2fd8-4382-b328-a430d0255e72'),   -- Sacha — les smokes serveur
      ('89662514-ea26-4cc3-9708-c228eea6d136')    -- Elo   — la recette à l'écran
    ) as v(eleve)
 where e.id_import like 'ex-c4l15-%'
   and not exists (select 1 from exercices_depots d
                    where d.exercice_id = e.id and d.eleve_id = v.eleve::uuid);

commit;

-- ── Le constat (lecture seule) ──────────────────────────────────────────────
-- select e.id_import, e.cran, count(c.id) as cas, count(d.id) as depots
--   from exercices e
--   left join exercices_cas c on c.exercice_id = e.id
--   left join exercices_depots d on d.exercice_id = e.id
--  where e.id_import like 'ex-c4l15-%'
--  group by e.id_import, e.cran order by e.cran;

-- ============================================================================
-- C4 · L1 — LE SEED (données, additive, idempotente).
-- Fichier : c4_l1_seed.sql — à jouer APRÈS `c4_l1_schema.sql`.
-- ----------------------------------------------------------------------------
-- LES TREIZE OBJETS FONT FOI AU `02-exercices.md` §1 — citation portée par le
-- `07-Implementation.md` §1.1. Sa table à SIX COLONNES (Objet · Nature · Grain ·
-- support_source · genre · Compétences) EST le contenu de ce seed, recopiée
-- colonne pour colonne. Aucune autre section du `02-` n'a été ouverte.
--
-- RÈGLE DE CE FICHIER (07- §1.1) : « une valeur que le seed ne peut pas citer
-- se laisse VIDE et se SIGNALE — elle ne s'invente pas. » Quatre attributs
-- d'`exercices_types` et les deux axes de déclaration sortent donc de ce seed
-- vides : ils sont listés au bloc SIGNALEMENT, en pied de fichier.
--
-- PROTOCOLE : NORMAL — insertion dans des tables neuves, gatées à OFF.
-- Idempotence : `on conflict (code) do nothing`. AUCUNE ligne existante
-- modifiée : rejouer ce fichier ne réécrit rien.
-- ⚠️ Répétition à blanc : copier le CORPS seul (SUIVI_SQL règle 6).
-- Retour arrière : `c4_l1_seed_rollback.sql`.
-- ============================================================================

begin;

-- ── Les treize objets ───────────────────────────────────────────────────────
-- `genres_admis` : NULL partout, sauf sur les TROIS OBJETS TERMINAUX —
-- l'introduction, la conclusion, la partie. Le `02-` §1.3 met l'ÉLECTION du
-- genre sur l'INSTANCE ; le type n'en porte que la plage admise.
insert into exercices_types (code, nature, grain, supports_source, genres_admis, competences)
values
  -- ── Les moments — une unité RHÉTORIQUE, dont l'étendue varie ──
  ('problematisation', 'moment',  'micro', array['extrait'], null,
     array['expression','questionnement','structure']),
  ('transition',       'moment',  'micro', array['extrait'], null,
     array['expression','structure','questionnement']),
  ('argument',         'moment',  'meso',  array['extrait'], null,
     array['expression','argumentation','structure','questionnement','connaissance']),
  ('objection',        'moment',  'meso',  array['extrait'], null,
     array['expression','argumentation','structure','questionnement','connaissance']),
  ('exemple',          'moment',  'meso',  array['extrait'], null,
     array['expression','argumentation','structure']),
  ('reference',        'moment',  'micro', array['extrait'], null,
     array['expression','argumentation','connaissance']),
  ('plan',             'moment',  'meso',  array['extrait'], null,
     array['expression','structure','questionnement']),
  ('introduction',     'moment',  'macro', array['texte'],
     array['dissertation_tc','explication_texte_tc','interpretation_hlp','essai_hlp'],
     array['expression','structure','questionnement']),
  ('conclusion',       'moment',  'macro', array['texte'],
     array['dissertation_tc','explication_texte_tc','interpretation_hlp','essai_hlp'],
     array['expression','structure','questionnement','synthese']),
  -- ── Les éléments — une unité TYPOGRAPHIQUE, dont le co-texte se calcule ──
  ('mot',              'element', 'micro', array['phrase','extrait','texte'], null,
     array['expression','argumentation','structure','questionnement','connaissance']),
  ('phrase',           'element', 'micro', array['extrait','texte'], null,
     array['expression','argumentation','structure','questionnement','synthese']),
  ('paragraphe',       'element', 'meso',  array['extrait'], null,
     array['expression','argumentation','structure','questionnement','synthese','connaissance']),
  ('partie',           'element', 'macro', array['texte'],
     array['generique','partie_synthese_tc','explication_texte_tc'],
     array['expression','argumentation','structure','questionnement','synthese','connaissance'])
on conflict (code) do nothing;

-- ── Les deux types diagnostiques ────────────────────────────────────────────
-- Décision de Louis du 18/08 : un type diagnostique N'A NI OBJET NI CRAN — ce
-- sont des EXERCICES COMPLETS, un ESSAI et une EXPLICATION DE TEXTE, passés EN
-- CLASSE. Il y en a DEUX EN SEPTEMBRE ; décembre et février restent à voir.
-- D'où `nature = 'complet'`, `grain` NULL et `crans_admis` vide — les deux
-- gardes `types_objet_chk` et `types_complet_sans_cran_chk` tiennent cela.
--
-- LES COMPÉTENCES : la colonne est un PLAFOND — « toutes les compétences qu'un
-- exercice sur cet objet permet d'entraîner ou d'évaluer » (`02-` §1), et aucune
-- n'est primaire. Pour un diagnostique, le plafond est LES SIX ; ce qui est
-- réellement mesuré est l'intersection avec ce qui est DÉCLARÉ ÉVALUABLE POUR
-- LA CLASSE — `competences_actives_par_classe` croisée avec
-- `competences_niveaux.statut_recette = 'evaluee'`. C'est cette intersection,
-- et elle seule, qui commande le nombre de valeurs de `confiance_declaree`
-- (une par compétence `evaluee` mesurée, 07- §1.1) et le nombre de squelettes
-- qu'une copie produit. *Exemple donné en séance : le questionnement n'étant pas
-- déclaré évaluable en HLP, l'essai n'y mesure pas le questionnement — c'est une
-- propriété de la CLASSE, jamais du type, et rien ne l'écrit ici.*
--
-- `lieu` (`classe`) N'EST PAS ICI : il se pose sur l'INSTANCE (`exercices.lieu`),
-- comme le veut le §1.1 — le type ne le porte pas.
insert into exercices_types (code, nature, grain, supports_source, genres_admis, competences)
values
  -- L'essai. Aucun support d'auteur n'est exigé par construction.
  ('examen_diagnostique_essai', 'complet', null, '{}', null,
     array['expression','argumentation','structure','connaissance','synthese','questionnement']),
  -- L'explication de texte. `texte` est la plus large étendue admise (`02-`
  -- §1.2) : il n'y a pas d'explication de texte sans texte à expliquer.
  ('examen_diagnostique_explication_texte', 'complet', null, array['texte'], null,
     array['expression','argumentation','structure','connaissance','synthese','questionnement'])
on conflict (code) do nothing;

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION
-- ============================================================================
select
  (select count(*) from exercices_types where nature in ('moment','element')) = 13
                                                                                as les_treize_objets,
  (select count(*) from exercices_types where nature = 'moment')  = 9           as neuf_moments,
  (select count(*) from exercices_types where nature = 'element') = 4           as quatre_elements,
  (select count(*) from exercices_types where nature = 'complet') = 2           as les_deux_diagnostiques,
  (select count(*) from exercices_types where genres_admis is not null) = 3     as trois_objets_terminaux,
  (select count(*) from exercices_types where code in ('introduction','conclusion','partie')
     and genres_admis is not null) = 3                                          as et_ce_sont_les_bons,
  (select count(*) from exercices_types where actif) = 15                       as tous_actifs,
  -- Un objet partagé par deux compétences prend UNE SEULE ligne (07- §1.1).
  (select count(distinct code) from exercices_types) = 15                       as une_ligne_par_code,
  -- Un exercice complet n'a NI OBJET NI CRAN.
  (select count(*) from exercices_types where nature = 'complet'
     and (grain is not null or coalesce(array_length(crans_admis,1),0) <> 0)) = 0
                                                                                as diagnostiques_sans_grain_ni_cran;

-- Le seed est LISIBLE (« fait quand ») :
select code, nature, grain, supports_source, coalesce(genres_admis, '{}') as genres_admis,
       array_length(competences, 1) as nb_competences, competences
  from exercices_types order by nature desc, grain, code;

-- ============================================================================
-- ⚠️ SIGNALEMENT AU PROFESSEUR — CE QUE CE SEED NE PEUT PAS CITER
-- (07- §1.1 : « une valeur que le seed ne peut pas citer se laisse vide et se
-- signale — elle ne s'invente pas » ; les décisions se prennent hors session.)
--
-- A. QUATRE ATTRIBUTS D'`exercices_types` SORTENT VIDES
--    • `crans_admis`        → '{}'  — l'énuméré des neuf crans fait foi au
--                                     `02-` §2.2, hors manifeste de C4-L1.
--    • `mode_saisie`        → NULL  — son énuméré fait foi au `02-`.
--    • `consigne_gabarit`   → NULL  — le gabarit par objet fait foi au `02-`.
--    • `exclusions_parcours`→ '{}'  — le `02-` §4 les porte ; le §1 n'en dit rien.
--
-- B. LES DEUX AXES DE DÉCLARATION SORTENT À ZÉRO LIGNE — « et sans eux rien
--    n'est instanciable » (07- §1.1). La STRUCTURE est posée par
--    `c4_l1_schema.sql` ; le CONTENU vit hors manifeste et arrive plus tard :
--    la couche type dérivée du `04-` s'injecte au lot C4-L5, l'import du
--    professeur au lot C4-L8 (07- §2).
--    • `exercices_types_crans` — 0 ligne : couverture_observables, provenances
--      admises des deux matériaux, et `duree_exercice_min` (OBLIGATOIRE, dérivée
--      du geste et du grain, `02-` §2.4 — jamais saisie à la main).
--    • `exercices_types_modes` — 0 ligne : les modes[] par compétence du type,
--      bornés par la table des modes admis (`02-` §3).
--
-- C. LES TYPES DIAGNOSTIQUES — POSÉS, AVEC DEUX VALEURS LAISSÉES VIDES.
--
--    TRANCHÉ PAR LOUIS LE 18/08, ET APPLIQUÉ CI-DESSUS :
--      • un type diagnostique n'a NI OBJET, NI CRAN : ce sont des EXERCICES
--        COMPLETS — un ESSAI et une EXPLICATION DE TEXTE — passés EN CLASSE.
--        ⇒ troisième nature `complet` sur `exercices_types` ; `grain` NULL et
--        `crans_admis` vide, tenus par deux gardes ;
--      • DEUX EN SEPTEMBRE. Décembre et février : à voir — rien n'est posé
--        pour ces deux fenêtres, et le plan les admet déjà
--        (`fenetre_diagnostique`, plan_evaluation_phase_a.sql §4) ;
--      • LES COMPÉTENCES : toutes celles déclarées ÉVALUABLES POUR LA CLASSE.
--        ⇒ le plafond du type est LES SIX ; l'intersection se fait à
--        l'instanciation, sur `competences_actives_par_classe` croisée avec
--        `competences_niveaux.statut_recette = 'evaluee'`. Le questionnement
--        n'étant pas déclaré évaluable en HLP, l'essai n'y mesure pas le
--        questionnement : c'est une propriété de la CLASSE, jamais du type.
--
--    LE TYPE VIT DANS `exercices_types` plutôt qu'à part, pour que
--    `exercices.type_id` reste NOT NULL — un seul chemin pour lire la
--    consigne-gabarit, le mode de saisie et les compétences d'une instance,
--    qu'elle vienne d'un objet ou d'un diagnostique.
--
--    LA STRUCTURE DE LA PAIRE EXISTE DÉJÀ, et elle est indépendante de ceci :
--    une PAIRE de diagnostic est UNE ligne d'`exercices` portant DEUX cas dans
--    l'ordre — le cas traité sur indication, puis le cas neuf (§1.1) ; un seul
--    dépôt, deux crédences, UNE mesure (§1.2). Voir `exercices.paire_diagnostic`
--    et son CHECK, plus les deux résultats sur `competences_mesures`, où NULL
--    n'est pas un échec.
--
--    ⚠️ DEUX VALEURS RESTENT VIDES SUR CES DEUX LIGNES — ce sont des valeurs de
--    SEED, changeables d'un `update`, sans migration :
--      • `genres_admis` → NULL sur les deux. Le `02-` §1.3 réserve le genre aux
--        trois objets terminaux ; si un diagnostique doit en porter un
--        (`dissertation_tc` / `essai_hlp` pour l'essai, `explication_texte_tc`
--        pour l'explication), il se déclare ici.
--      • `exclusions_parcours` → '{}' sur les deux, donc AUCUNE exclusion : en
--        l'état, les deux diagnostiques sont servables aux deux parcours. Si
--        l'essai est propre à HLP, ou l'explication de texte au tronc commun,
--        c'est ici que cela s'écrit.
--    ⇒ À confirmer hors séance. Aucune des deux n'empêche de jouer ce seed.
-- ============================================================================

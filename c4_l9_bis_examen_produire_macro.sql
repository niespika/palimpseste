-- ============================================================================
-- C4 · L9-bis — UN EXAMEN DIAGNOSTIQUE EST UN `produire` AU `macro`, ET
--                « SE JUGER » S'Y SERT.
-- ----------------------------------------------------------------------------
-- « Si le professeur a levé le premier drapeau, l'élève SE JUGE — deux
--   questions, jamais trois. »            — `02-exercices.md` §6.D, étape 9,
--                                            DANS LE FLUX DE LA PASSATION EN CLASSE
--
-- LE DÉFAUT QUE CECI RÉPARE, ET IL ÉTAIT SILENCIEUX. C4-L9 a livré les deux
-- drapeaux d'opt-in sur l'instance, et la CONFIANCE DE REMISE se servait bien —
-- mais « SE JUGER » NE SE SERVAIT PAS. `offreSeJuger` (C4-L4) exige deux choses
-- que `02-exercices.md` §5 pose : un geste `produire`, et un grain `meso` ou
-- `macro`. Or un examen diagnostique n'avait NI L'UN NI L'AUTRE :
--   · le GESTE se lit au CRAN — et un examen n'a pas de cran ;
--   · le GRAIN se lit au TYPE — et `types_complet_sans_objet_ni_cran_chk`
--     l'interdisait sur une ligne `complet`.
-- Résultat : le drapeau se levait, l'étape ne se servait jamais, et **aucun
-- signal de Monitoring ne sortait des deux examens de la semaine 1** — quand
-- « une année de collecte manquée ne se rattrape pas ».
--
-- ⭐ CE QUI EST TRANCHÉ (Louis, 22/08), ET CE N'EST PAS UN CONTOURNEMENT.
--    On ne relâche PAS la condition du `02-` §5 ; on reconnaît que **l'examen
--    diagnostique la satisfait vraiment** : c'est un `produire` — l'élève
--    produit une copie entière — **au `macro`**, et la source le dit déjà en
--    toutes lettres : *« il porte un genre terminal entier — essai,
--    dissertation, explication de texte. IL EST DONC MACRO PAR CONSTRUCTION, à
--    tous les paliers et à tous les segments »* (`01-routeur.md` §10).
--    **La nature `complet` EST le cas particulier de `produire` au `macro`.**
--
-- ⚠️ LA PEUR QUE LA GARDE D'ORIGINE PORTAIT — « lui laisser un grain
--    fabriquerait une DURÉE FANTÔME », un diagnostique passé en classe n'étant
--    pas décompté au budget de l'élève (décision du 18/08, `c4_l1_schema.sql`).
--    ✓ **ELLE EST SANS OBJET, ET C'EST VÉRIFIÉ PAR LE CODE, PAS SUPPOSÉ** :
--    la durée ne se lit JAMAIS depuis `exercices_types.grain`. Elle vit dans
--    **`exercices_types_crans.duree_exercice_min`**, clé **(type_id, cran)**, et
--    c'est ainsi que `utils/deroule/vue.ts` la lit — `.eq('type_id', …)
--    .eq('cran', …)`. **`crans_admis` reste `'{}'`** : ces deux types n'ont
--    AUCUNE ligne dans `exercices_types_crans`, donc **aucune durée n'existe ni
--    ne peut se dériver**. La dérivation `durée = f(geste, grain)`
--    (`exercices_durees`) est jouée par `derive-doctrine.py` **sur les treize
--    objets seulement**.
--
-- ⚠️ ET ILS NE DEVIENNENT PAS SERVABLES COMME EXERCICES — vérifié au code.
--    L'assemblage de la doctrine écarte sur **`nature === 'complet'`**, jamais
--    sur le grain (`utils/fabrique/doctrine.ts` : `if (t.nature === 'complet')
--    continue`). Ils restent donc hors du format d'import, hors du pipeline du
--    `02-` §6 B, et hors du routeur — *« imposé en classe, HORS ROUTAGE »*
--    (`01-` §10). **Ils n'existent pas hors de la conception du professeur, au
--    moment de l'examen.**
--
-- CE QU'IL FAIT — un seul geste, et il resserre au lieu d'ouvrir :
--
--   `types_complet_sans_objet_ni_cran_chk`  *(grain **interdit**, cran interdit)*
--        ↓
--   `types_complet_macro_sans_cran_chk`     *(grain **= `macro` OBLIGATOIRE**,
--                                             cran toujours interdit)*
--
--   ⭐ La garde neuve est **PLUS STRICTE que l'ancienne**, et c'est voulu : elle
--      ne se contente pas d'autoriser un grain, elle **impose le bon**. Un type
--      `complet` au grain `micro` ou `meso` — ou sans grain — est désormais
--      **impossible**, et « macro par construction » cesse d'être un espoir pour
--      devenir un fait gardé. *Un grain laissé nullable aurait rouvert le défaut
--      en silence : « se juger » ne se serait pas servi, et rien ne l'aurait dit.*
--
-- ⚠️ LE GESTE, LUI, NE SE STOCKE PAS — IL SE DÉRIVE. Aucune colonne `geste`
--    n'existe sur `exercices_types`, et il ne faut pas en créer une : pour les
--    treize objets le geste vient du CRAN (`exercices_crans.geste`), et une
--    seconde colonne serait **un second domicile** pour la même valeur. La
--    lecture le dérive donc là où elle en a besoin, et à un seul endroit :
--    `lirePerimetre` (`utils/passation/metacognition.ts`) — *un type `complet`
--    n'a pas de cran, donc son geste est `produire`, par construction*.
--
-- ⚠️ CE QUI RESTE FERMÉ APRÈS CE FICHIER, et ce n'est pas un défaut :
--    `offreSeJuger` exige AUSSI une compétence au statut **`evaluee`**, et les
--    **34 lignes de `competences_niveaux` sont `mesuree_silencieusement`**.
--    L'étape reste donc non servie tant que le professeur n'a pas posé un
--    statut à la fabrique — **c'est sa décision, pas un blocage de structure**.
--    Le blocage de STRUCTURE, lui, est levé ici, et la recette le prouve en
--    posant un `evaluee` puis en le retirant.
--
-- Additive et gatée → protocole NORMAL. ⚠️ Elle REMPLACE une contrainte sur
-- `exercices_types` : répétition à blanc d'abord (règle 6), retour à l'état
-- d'avant vérifié PAR REQUÊTE. Rollback : `c4_l9_bis_examen_produire_macro_rollback.sql`.
-- ============================================================================

begin;

-- L'ORDRE COMPTE : la garde d'origine INTERDIT le grain, elle doit donc tomber
-- avant l'`update` ; et la garde neuve l'EXIGE, elle ne peut se poser qu'après.
-- ⚠️ LES DEUX NOMS SONT DROPPÉS, et c'est ce qui rend ce fichier REJOUABLE : un
--    `if not exists` sur le nom neuf aurait laissé en place une garde déjà posée
--    — donc laissé vivre une définition périmée sous un nom juste.
alter table public.exercices_types
  drop constraint if exists types_complet_sans_objet_ni_cran_chk;
alter table public.exercices_types
  drop constraint if exists types_complet_macro_sans_cran_chk;

update public.exercices_types
   set grain = 'macro', updated_at = now()
 where nature = 'complet' and grain is distinct from 'macro';

-- ⚠️⚠️ `is not distinct from`, ET SURTOUT PAS `=` — LE PIÈGE DU NULL DANS UN
--    CHECK, éprouvé et attrapé le 22/08 par le bloc d'épreuve ci-dessous.
--    `grain = 'macro'` avec un `grain` NULL rend **NULL**, `NULL and true` rend
--    **NULL**, et **un CHECK qui rend NULL est RÉPUTÉ SATISFAIT** : la garde
--    laissait donc passer exactement le cas qu'elle devait interdire — un type
--    `complet` SANS grain —, c'est-à-dire le défaut d'origine, qui serait
--    revenu en silence. `is not distinct from` compare NULL comme une valeur et
--    rend `false`. *C'est le même piège que `array_length` d'un tableau vide,
--    déjà relevé en tête de `c4_l1_schema.sql` : dans un CHECK, tout ce qui peut
--    rendre NULL laisse passer.*
alter table public.exercices_types
  add constraint types_complet_macro_sans_cran_chk check (
    nature <> 'complet'
    or (grain is not distinct from 'macro'
        and coalesce(array_length(crans_admis, 1), 0) = 0)
  );

comment on constraint types_complet_macro_sans_cran_chk on public.exercices_types is
  'Un exercice COMPLET est un `produire` au `macro`, et il n''a JAMAIS de cran. '
  '« Il porte un genre terminal entier — essai, dissertation, explication de texte. IL EST DONC '
  'MACRO PAR CONSTRUCTION, à tous les paliers et à tous les segments » (01- §10). Le grain est '
  'donc OBLIGATOIRE et vaut `macro` : c''est lui que `02-` §5 exige pour servir « se juger », et '
  'un grain nullable aurait rouvert le défaut en silence. Le CRAN reste interdit — et c''est ce '
  'qui empêche toute durée : elle vit dans exercices_types_crans (type_id, cran), qui n''a aucune '
  'ligne pour ces types. Le GESTE ne se stocke pas : il se dérive de `nature = complet` '
  '(lirePerimetre) — une colonne de plus serait un second domicile. ⚠️ `is not distinct from` et NON `=` : '
  'avec un grain NULL, `grain = ''macro''` rend NULL, et un CHECK qui rend NULL est RÉPUTÉ SATISFAIT. '
  'C4-L9-bis, décision du 22/08.';

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Huit drapeaux, tous attendus `t`.
-- ============================================================================
select
  -- (1) Les deux lignes portent le grain que la source leur donne.
  (select count(*) = 2 from public.exercices_types
    where nature = 'complet' and grain = 'macro')                  as les_deux_au_macro,

  -- (2) Et TOUJOURS aucun cran : c'est ce qui empêche toute durée d'exister.
  (select count(*) = 0 from public.exercices_types
    where nature = 'complet'
      and coalesce(array_length(crans_admis, 1), 0) <> 0)          as toujours_sans_cran,
  -- ⭐ La preuve que la « durée fantôme » ne peut pas naître : AUCUNE ligne
  --    d'`exercices_types_crans` ne porte l'un de ces deux types.
  (select count(*) = 0 from public.exercices_types_crans tc
     join public.exercices_types t on t.id = tc.type_id
    where t.nature = 'complet')                                    as aucune_duree_possible,

  -- (3) L'échange de gardes a bien eu lieu.
  not exists (select 1 from pg_constraint
               where conname = 'types_complet_sans_objet_ni_cran_chk'
                 and conrelid = 'public.exercices_types'::regclass)
  and exists (select 1 from pg_constraint
               where conname = 'types_complet_macro_sans_cran_chk'
                 and conrelid = 'public.exercices_types'::regclass) as garde_echangee,

  -- (4) LES TREIZE OBJETS N'ONT PAS BOUGÉ — l'`update` ne visait que `complet`.
  (select count(*) = 13 from public.exercices_types
    where nature in ('moment', 'element') and grain is not null)   as les_treize_intacts,
  -- Les objets au `macro` sont TROIS (`partie`, `plan`, `problematisation`) —
  -- compté, jamais supposé ; et l'`update` n'a visé que `nature = 'complet'`.
  (select count(*) = 3 from public.exercices_types
    where nature in ('moment', 'element') and grain = 'macro')     as macro_des_objets_inchange,

  -- (5) Et rien de ce que C4-L9 avait posé n'a été perdu.
  (select count(*) = 2 from public.exercices_types
    where nature = 'complet' and genres_admis is not null
      and mode_saisie = 'manuscrit' and libelle is not null)       as c4_l9_intact,

  -- (6) Les six interrupteurs n'ont pas bougé.
  (select not (exercices_actif or routeur_actif or competences_affichage_actif
               or fabrique_actif or chaine_actif or passation_classe_actif)
     from public.scriptorium_params where id = 1)                  as les_six_toujours_a_off;

-- ============================================================================
-- L'ÉPREUVE DE LA GARDE — elle se prouve en écrivant, pas en se lisant.
-- Tout se joue dans une transaction ROLLBACKÉE : rien n'en sort.
-- Trois drapeaux, tous attendus `t`.
-- ============================================================================
begin;

create temp table epreuve_macro(quoi text primary key, verdict boolean) on commit drop;

-- (a) Un type `complet` au grain `meso` est REFUSÉ — « macro par construction ».
do $$
begin
  insert into public.exercices_types (code, nature, grain, supports_source, competences)
       values ('epreuve_macro_meso', 'complet', 'meso', '{}', array['expression']);
  insert into epreuve_macro values ('complet_au_meso_refuse', false);
exception when others then
  insert into epreuve_macro values ('complet_au_meso_refuse', true);
end $$;

-- (b) Un type `complet` SANS grain est REFUSÉ — c'est le défaut d'origine, et il
--     ne peut plus revenir en silence.
do $$
begin
  insert into public.exercices_types (code, nature, grain, supports_source, competences)
       values ('epreuve_macro_sans', 'complet', null, '{}', array['expression']);
  insert into epreuve_macro values ('complet_sans_grain_refuse', false);
exception when others then
  insert into epreuve_macro values ('complet_sans_grain_refuse', true);
end $$;

-- (c) Un type `complet` au `macro` AVEC un cran est REFUSÉ — le cran reste
--     interdit, et c'est lui qui tient la durée à distance.
do $$
begin
  insert into public.exercices_types (code, nature, grain, supports_source, crans_admis, competences)
       values ('epreuve_macro_cran', 'complet', 'macro', '{}', array['8'], array['expression']);
  insert into epreuve_macro values ('complet_avec_cran_refuse', false);
exception when others then
  insert into epreuve_macro values ('complet_avec_cran_refuse', true);
end $$;

select quoi, verdict from epreuve_macro order by quoi;

rollback;  -- ⚠️ RIEN de l'épreuve ne reste.

-- Et on le vérifie PAR REQUÊTE, jamais sur la foi du mot « ROLLBACK » affiché.
select count(*) = 0 as aucune_trace_de_l_epreuve
  from public.exercices_types where code like 'epreuve_macro%';

-- ============================================================================
-- C4 · L1 — LE SCHÉMA ET LES INTERRUPTEURS (additive, gatée, NON-CASSANTE).
-- Fichier : c4_l1_schema.sql
-- ----------------------------------------------------------------------------
-- Lot C4-L1 du chantier. Manifeste : `07-Implementation.md` §1 (VERSION 2.2,
-- VALIDÉ ET GELÉ) · `SUIVI_SQL.md` · `c1_rls_eleve.sql` (patron RLS élève).
-- Le seed des treize objets fait foi au `02-exercices.md` §1, cité par le §1.1.
--
-- CE QUE CE FICHIER POSE
--   • les 17 tables neuves du §1, dans ses cinq blocs (objets/instances, mesure,
--     état, Monitoring, journal et compteurs) ;
--   • `exercices_demonstrations` — LES DÉMONSTRATIONS DU TEMPS 1, par compétence
--     × grain (§1.1, apparues en VERSION 2.2). Le prompt les liste À PART des
--     dix-sept, la forme physique étant laissée à la session ; forme retenue :
--     une table ;
--   • 2 tables filles qui portent les DEUX AXES DE DÉCLARATION du §1.1 (par cran,
--     par compétence) — la forme physique appartient à la session (§1), et
--     « table fille » est l'une des trois formes que le document autorise ;
--   • les clés étrangères vers le plan d'exercices
--     (`scriptorium_exercices_planifies`, `plan_evaluation_phase_a.sql`) ;
--   • les gardes : index unique du squelette, unicité + empreinte immuable des
--     références, référence non validée hors jugement, pas de version finale en
--     classe, retour maison jamais édité par le professeur ;
--   • la RLS et les gardes serveur (patron `c1_rls_eleve.sql`) ;
--   • les TROIS INTERRUPTEURS à OFF sur `scriptorium_params`, au même
--     emplacement que `rag_actif` et `plan_evaluation_actif` (§1.5).
--
-- CE QUE CE FICHIER NE POSE PAS — et c'est écrit pour qu'on ne les cherche pas
--   • aucune colonne `famille` (§1) · aucun champ `note` (§1.1) · aucune lettre
--     ni aucun coût sur les squelettes (§1.2) · aucun champ de dispersion sur
--     les mesures (§1.2) · aucune liste de compétences dans `competences_niveaux`
--     (§1.3) · aucune distribution de montée (§1.3) · aucune agrégation de coûts
--     en colonne (§1.2) ;
--   • six valeurs qui sont des LECTURES, jamais des colonnes (§1) : la série
--     d'une mesure, le `regime_v1vf`, le registre courant du retour,
--     l'historique des cibles, le signal de ciblage, la valeur de ciblage non
--     plafonnée ;
--   • six attributs d'`exercices_types` (§1.1) : `produit_mesure`,
--     `duree_redaction_min`, `complexite`, `etayage[]`, `duree_v1_min`,
--     `duree_vf_min` ;
--   • aucun second canal d'intégrité : le drapeau passe par `signalerEnAttenteIA`
--     (`utils/integrite.ts` → `integrite_signalements`, qui existe) — §1.2 ;
--   • les touches à l'existant (`profiles`, `api_couts`) : fichier SÉPARÉ
--     `c4_l1_existant.sql`, PROTOCOLE RENFORCÉ (SUIVI_SQL règle 5).
--   • le seed : fichier SÉPARÉ `c4_l1_seed.sql`, à jouer APRÈS celui-ci.
--
-- ORDRE : 1) c4_l1_schema.sql  2) c4_l1_seed.sql  3) c4_l1_existant.sql
--         (`api_couts.depot_id` référence `exercices_depots`, créée ici.)
--
-- PROTOCOLE : NORMAL (SUIVI_SQL règle 5) — tables neuves, additives, gatées par
-- trois drapeaux à OFF ; aucune table ni policy d'un flux existant n'est touchée.
-- Seul `scriptorium_params` reçoit trois colonnes de gate, patron déjà suivi par
-- `c2_l9_prompt_tuteur.sql` (additif, protocole normal).
--
-- RÉPÉTITION À BLANC (SUIVI_SQL règle 6) : ne JAMAIS jouer ce fichier entier
-- dans une transaction d'essai — son `commit;` validerait la transaction
-- englobante. Copier le CORPS seul (entre `begin;` et `commit;`), puis après le
-- `rollback`, VÉRIFIER PAR REQUÊTE le retour à l'état d'avant.
--
-- Idempotence : create ... if not exists · add column if not exists ·
-- drop policy if exists + create policy · create or replace function ·
-- blocs DO/EXCEPTION pour les contraintes. Rejouable sans dommage.
-- AUCUNE donnée existante modifiée. Retour arrière : c4_l1_schema_rollback.sql.
--
-- CONVENTION DE LA COMPÉTENCE (§1.2) : identifiant NU, six valeurs, pas de
-- préfixe — expression · argumentation · structure · connaissance · synthese ·
-- questionnement. Les six traversent les deux séries. Le CHECK est répété à
-- chaque table plutôt que factorisé : il doit rester lisible au dump.
--
-- VALEURS NON CITABLES DEPUIS LE MANIFESTE DE CE LOT — laissées ouvertes plutôt
-- qu'inventées (§1.1 : « une valeur que le seed ne peut pas citer se laisse vide
-- et se signale »). Elles sont listées en pied de fichier.
-- ============================================================================

begin;

-- ════════════════════════════════════════════════════════════════════════════
-- DEUX FONCTIONS DE FORME — utilisées par des CHECK, donc IMMUTABLE et posées
-- avant les tables qui les appellent. Elles ne lisent que leur argument.
-- ════════════════════════════════════════════════════════════════════════════

-- `photos[]` porte l'ORDRE, la ROTATION, une SOMME DE CONTRÔLE, et SAIT DIRE
-- QU'UNE PAGE MANQUE (07- §1.1). Les quatre clés sont exigées ; le reste de
-- l'objet (chemin au bucket, dimensions…) est libre.
create or replace function public.photos_bien_formees(p jsonb)
returns boolean language sql immutable as $fn$
  select p is null
      or (jsonb_typeof(p) = 'array'
          and not exists (
            select 1 from jsonb_array_elements(p) e
             where jsonb_typeof(e.value) <> 'object'
                or not (e.value ? 'ordre')
                or not (e.value ? 'rotation')
                or not (e.value ? 'somme_controle')
                or not (e.value ? 'page_manquante')
          ));
$fn$;

-- Les modes s'élisent PAR COMPÉTENCE MESURÉE et sont UNE LISTE, JAMAIS UNE
-- VALEUR (07- §1.1, §1.2). Objet { competence : [modes] } — clés parmi les six
-- identifiants nus, valeurs toujours des tableaux.
create or replace function public.modes_par_competence_bien_forme(m jsonb)
returns boolean language sql immutable as $fn$
  select m is null
      or (jsonb_typeof(m) = 'object'
          and not exists (
            select 1 from jsonb_each(m) e
             where jsonb_typeof(e.value) <> 'array'
                or e.key not in ('expression','argumentation','structure',
                                 'connaissance','synthese','questionnement')
          ));
$fn$;

-- ════════════════════════════════════════════════════════════════════════════
-- BLOC §1.1 — LES OBJETS ET LES INSTANCES
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. exercices_types — la bibliothèque ────────────────────────────────────
-- Une ligne par objet. Les treize objets font foi au `02-exercices.md` §1 ;
-- sa table à six colonnes (Objet, Nature, Grain, support_source, genre,
-- Compétences) est le contenu du seed (`c4_l1_seed.sql`).
-- GARDE : un objet partagé par deux compétences prend UNE SEULE ligne — deux
-- lignes ne se séparent que si ce que l'élève produit diffère (§1.1).
-- `code` unique porte cette garde.
create table if not exists exercices_types (
  id       uuid primary key default gen_random_uuid(),
  code     text not null unique,
  -- Colonne « Nature » du `02-` §1 : un moment nomme une unité rhétorique, un
  -- élément une unité typographique (§1.2 du `02-`).
  -- TROISIÈME VALEUR, `complet` — décision de Louis du 18/08 : un TYPE
  -- DIAGNOSTIQUE n'a NI OBJET NI CRAN. Ce n'est ni un moment ni un élément,
  -- c'est un EXERCICE COMPLET (un essai, une explication de texte), passé en
  -- classe. Il vit ici plutôt qu'ailleurs pour que `exercices.type_id` reste
  -- OBLIGATOIRE : un seul chemin pour lire la consigne-gabarit, le mode de
  -- saisie et les compétences d'une instance, quelle qu'elle soit.
  nature   text not null check (nature in ('moment', 'element', 'complet')),
  -- NULLABLE depuis la troisième nature : un exercice complet n'a pas de grain
  -- d'objet. Un moment et un élément en portent toujours un (garde plus bas).
  grain    text check (grain in ('micro', 'meso', 'macro')),
  -- La PLAGE ADMISE de `support_source` (§1.1) : l'instance élit dedans.
  supports_source text[] not null default '{}' check (
    supports_source <@ array['phrase','extrait','texte']
  ),
  -- Le `genre` du §1.1, NULLABLE — « les objets génériques n'en ont pas ».
  -- Porté ici comme la PLAGE ADMISE, parce que le `02-` §1 en déclare plusieurs
  -- par objet terminal et que son §1.3 met l'ÉLECTION sur l'instance
  -- (`exercices.genre`). NULL partout ailleurs que sur introduction,
  -- conclusion et partie.
  -- ⚠️ `coalesce(array_length(...),0)` et non `array_length(...) >= 1` :
  -- array_length d'un tableau VIDE rend NULL, pas 0 — un `>= 1` nu s'évalue
  -- alors à NULL et le CHECK est réputé satisfait. Le tableau vide passait.
  genres_admis text[] check (genres_admis is null or coalesce(array_length(genres_admis, 1), 0) >= 1),
  -- Toutes les compétences que l'objet permet de travailler. AUCUNE n'est
  -- primaire : c'est le routeur qui rend primaire celle qu'il élit (§1.1).
  competences text[] not null check (
    coalesce(array_length(competences, 1), 0) >= 1
    and competences <@ array['expression','argumentation','structure',
                             'connaissance','synthese','questionnement']
  ),
  exclusions_parcours text[] not null default '{}',
  -- Les crans admis. L'ÉNUMÉRÉ des neuf crans fait foi au `02-` §2.2, hors du
  -- manifeste de ce lot : pas de CHECK fermé ici, il s'inventerait. text[] et
  -- non int[] pour ne pas graver une forme de cran non citée.
  crans_admis text[] not null default '{}',
  -- L'énuméré fait foi au `02-` (hors manifeste de ce lot). Le §1.3 du `07-`
  -- cite `ecran` (via `profiles.mode_saisie_force`) et « les types manuscrits ».
  -- Laissé sans CHECK fermé : C4-L8 valide à l'import.
  mode_saisie      text,
  consigne_gabarit text,
  actif      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),  -- maj applicative (convention repo)
  -- UN OBJET porte toujours son grain et au moins un support : la troisième
  -- nature ne doit pas relâcher la garde des treize.
  constraint types_objet_chk check (
    nature = 'complet'
    or (grain is not null and coalesce(array_length(supports_source, 1), 0) >= 1)
  ),
  -- UN EXERCICE COMPLET N'A NI OBJET NI CRAN (décision du 18/08). Le GRAIN se
  -- ferme avec le cran : c'est une colonne de l'objet (`02-` §1), et c'est lui
  -- qui, avec le geste, dérive `duree_exercice_min` — la seule valeur que le
  -- budget décompte. Un diagnostique passé en classe n'est pas décompté au
  -- budget de l'élève : lui laisser un grain fabriquerait une durée fantôme.
  constraint types_complet_sans_objet_ni_cran_chk check (
    nature <> 'complet'
    or (grain is null and coalesce(array_length(crans_admis, 1), 0) = 0)
  )
);
comment on table exercices_types is
  'La bibliothèque des objets (07- §1.1). Une ligne par objet ; les treize font foi au 02- §1. '
  'NE PAS AJOUTER : produit_mesure, duree_redaction_min, complexite, etayage[], duree_v1_min, '
  'duree_vf_min — le 07- §1.1 les exclut nommément. Ni famille, ni note.';
comment on column exercices_types.crans_admis is
  'Vide au seed : l''énuméré des neuf crans fait foi au 02- §2.2, hors manifeste de C4-L1. '
  'Rempli par C4-L5 (couche type dérivée du 04-) et C4-L8 (import du professeur).';

-- ── 2. exercices_types_crans — PREMIER AXE DE DÉCLARATION (par cran) ─────────
-- § 1.1 : « pour chaque cran admis : la couverture_observables et les
-- provenances admises des DEUX matériaux ». Sans les deux axes, rien n'est
-- instanciable. STRUCTURE POSÉE ICI, CONTENU HORS MANIFESTE (C4-L5 / C4-L8).
create table if not exists exercices_types_crans (
  id      uuid primary key default gen_random_uuid(),
  type_id uuid not null references exercices_types(id) on delete cascade,
  cran    text not null,
  couverture_observables       jsonb,
  provenances_admises_source   text[],
  provenances_admises_cible    text[],
  -- §1.1 : `duree_exercice_min` est OBLIGATOIRE, c'est la SEULE valeur que le
  -- budget décompte, et elle se DÉRIVE du geste et du grain (02- §2.4) — elle
  -- NE SE SAISIT JAMAIS À LA MAIN. « La stocker par cran admis ou la calculer à
  -- la volée est un choix d'implémentation. » Forme retenue : stockée par cran,
  -- DÉRIVÉE. Nullable à ce lot parce que la règle de dérivation vit au 02- §2.4,
  -- hors manifeste : elle se laisse vide et se signale, elle ne s'invente pas.
  duree_exercice_min integer check (duree_exercice_min is null or duree_exercice_min > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uk_types_crans unique (type_id, cran)
);
comment on table exercices_types_crans is
  'Axe de déclaration PAR CRAN (07- §1.1). Structure posée par C4-L1, contenu injecté par '
  'C4-L5 (dérivé du 04-) et C4-L8 (import prof). duree_exercice_min est DÉRIVÉE (02- §2.4), '
  'jamais saisie à la main.';

-- ── 3. exercices_types_modes — SECOND AXE (par compétence) ──────────────────
-- §1.1 : « les modes[] se déclarent PAR COMPÉTENCE du type, jamais par type ».
-- §1.2 : les modes sont une LISTE, jamais une valeur.
create table if not exists exercices_types_modes (
  id         uuid primary key default gen_random_uuid(),
  type_id    uuid not null references exercices_types(id) on delete cascade,
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  -- La table des modes admis borne ce qu'un type peut déclarer (02- §3), hors
  -- manifeste de ce lot : pas de CHECK fermé sur les valeurs.
  modes      text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uk_types_modes unique (type_id, competence)
);
comment on table exercices_types_modes is
  'Axe de déclaration PAR COMPÉTENCE (07- §1.1). Les modes sont une LISTE, jamais une valeur. '
  'Structure posée par C4-L1, contenu injecté par C4-L5 / C4-L8. La compétence doit appartenir '
  'à exercices_types.competences — contrôlé à l''import (C4-L8), pas par contrainte croisée.';

-- ── 4. exercices_demonstrations — les démonstrations du temps 1 ─────────────
-- §1.1 (apparue en VERSION 2.2). PAR COMPÉTENCE × GRAIN : les exemples,
-- modelages et checklists que l'ÉCRAN DE PRÉPARATION sert avant la v1 (06- §2).
-- ⚠️ DÉPOSÉES À LA FABRIQUE (§2, C4-L8) : le professeur les fabrique HORS DE LA
-- PLATEFORME, comme son corpus. **L'écran du déroulé les SERT, il n'en FABRIQUE
-- aucune** — absente, le temps 1 s'en passe et le professeur en est averti,
-- rien ne s'engendre à sa place. C'est pourquoi cette table n'a AUCUN champ
-- d'engendrement : ni `modele`, ni `prompt_version`, ni `instrument_version` —
-- rien ici ne vient d'un appel.
-- « La forme physique t'appartient ; ce qui est requis : que la donnée existe,
-- qu'elle soit nommée, et que le déroulé la lise sans la fabriquer. » Forme
-- retenue : une table, une ligne par démonstration. (compétence × grain) est un
-- axe de LECTURE, pas une clé : plusieurs démonstrations coexistent sur un même
-- couple, de formes et de thèmes différents.
create table if not exists exercices_demonstrations (
  id uuid primary key default gen_random_uuid(),
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  grain text not null check (grain in ('micro', 'meso', 'macro')),
  -- « chacune avec sa forme et son thème » (§1.1).
  forme text not null check (forme in ('exemple', 'modelage', 'checklist')),
  theme text not null,
  -- Le dépôt lui-même. Son format vit à la fabrique (C4-L8) et au `06-` §2,
  -- hors manifeste de ce lot : jsonb, sans validation de forme ici.
  contenu jsonb not null,
  actif boolean not null default true,
  deposee_par uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- L'axe de lecture du temps 1 : « quelles démonstrations pour cette compétence,
-- à ce grain ? » — la question que l'écran de préparation pose, et la seule.
create index if not exists idx_demonstrations_competence_grain
  on exercices_demonstrations(competence, grain) where actif;
comment on table exercices_demonstrations is
  'Les démonstrations du temps 1, par compétence x grain (07- §1.1, apparue en VERSION 2.2). '
  'Déposées à la fabrique (C4-L8), fabriquées hors plateforme par le professeur. LE DÉROULÉ LES '
  'LIT SANS LES FABRIQUER : absente, le temps 1 s''en passe et le professeur en est averti — rien '
  'ne s''engendre à sa place.';

-- ── 4. exercices_references — les références décomposées ────────────────────
-- §1.1. DEUX GARDES, « et elles portent la validité de toute la réception » :
--   (a) unicité et empreinte IMMUABLE — un texte ne se décompose jamais deux
--       fois, une référence validée ne se modifie plus en silence ;
--   (b) une référence non validée n'entre JAMAIS dans une phase de jugement
--       (posée plus bas, en garde serveur sur exercices_squelettes).
-- Le FORMAT du `contenu` ne s'écrit pas ici : il fait foi au 02- §6, et le
-- 05-GENERATEUR dit comment il se remplit. jsonb sans validation de forme.
create table if not exists exercices_references (
  id uuid primary key default gen_random_uuid(),
  -- La source : le CONTENU ou le LIVRE, plus la localisation. Arc exclusif,
  -- patron `plan_evaluation_phase_a.sql` §5 / `c7_quazian_contenus.sql`.
  source_contenu_id uuid references scriptorium_contenus(id)     on delete restrict,
  source_livre_id   uuid references aletheia_livre_reference(id) on delete restrict,
  localisation      text not null,
  constraint references_source_chk check (
       (source_contenu_id is not null and source_livre_id is null)
    or (source_contenu_id is null     and source_livre_id is not null)
  ),
  contenu jsonb not null,
  -- L'EMPREINTE : sha256 hexadécimal du texte source normalisé. Unique → un
  -- texte ne se décompose jamais deux fois. Immuable une fois la référence
  -- validée → garde `garde_reference_immuable` plus bas.
  empreinte text not null unique check (empreinte ~ '^[0-9a-f]{64}$'),
  validee_par uuid references profiles(id) on delete set null,
  validee_at  timestamptz,
  constraint references_validation_chk check (
    (validee_at is null and validee_par is null) or (validee_at is not null and validee_par is not null)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column exercices_references.empreinte is
  'sha256 hex du texte source normalisé. UNIQUE : un texte ne se décompose jamais deux fois (07- §1.1). '
  'Immuable dès validee_at renseigné (trigger garde_reference_immuable).';

-- ── 5. exercices — les instances conçues ────────────────────────────────────
-- §1.1. Porte la CLÉ ÉTRANGÈRE VERS LE PLAN D'EXERCICES
-- (`scriptorium_exercices_planifies`, plan_evaluation_phase_a.sql §4).
create table if not exists exercices (
  id      uuid primary key default gen_random_uuid(),
  type_id uuid not null references exercices_types(id) on delete restrict,
  -- « l'exercice planifié dont elle vient » : le créneau du plan. NULLABLE —
  -- le routeur assigne aussi hors créneau planifié. `restrict` : garde-fou,
  -- une ligne de plan ne se supprime pas sous une instance vivante.
  exercice_planifie_id uuid references scriptorium_exercices_planifies(id) on delete restrict,
  classe_id uuid references classes(id) on delete set null,
  -- Le LIEU DE LA PASSATION, rien d'autre (§1.1).
  lieu   text not null check (lieu in ('maison', 'classe')),
  -- La consigne dit quatre choses : ce qu'il y a à faire, ce qu'il faut
  -- produire, ce sur quoi on travaille, ce qui aide.
  consigne_instanciee jsonb not null,
  -- UNE PAIRE DE DIAGNOSTIC EST UNE LIGNE, ET ELLE PORTE DEUX CAS, DANS L'ORDRE
  -- (§1.1) : le cas traité sur indication, puis le cas neuf. Deux lignes liées
  -- auraient donné deux dépôts, donc une crédence chacun — ce que le §1.2 exclut.
  -- Le marqueur rend la garde possible : sans lui, rien ne sait quelle ligne
  -- doit porter deux cas.
  paire_diagnostic boolean not null default false,
  constraint exercices_paire_chk check (
    not paire_diagnostic
    or (jsonb_typeof(consigne_instanciee) = 'array' and jsonb_array_length(consigne_instanciee) = 2)
  ),
  reference_id uuid references exercices_references(id) on delete restrict,
  fenetre_debut timestamptz,
  fenetre_fin   timestamptz,
  constraint exercices_fenetre_ordre_chk check (
    fenetre_debut is null or fenetre_fin is null or fenetre_fin >= fenetre_debut
  ),
  -- La borne amont retenue par le non-spoiler (01- §4). Forme laissée jsonb :
  -- ce qu'elle repère fait foi hors manifeste de ce lot.
  borne_amont jsonb,
  statut text not null default 'a_concevoir'
    check (statut in ('a_concevoir', 'concu', 'assigne', 'clos')),
  bonus  boolean not null default false,
  -- ── Ce que la CONCEPTION élit (§1.1) ──
  -- Le cran élu parmi les crans[] du type — à ne pas confondre avec le degré
  -- d'escalade (N1/N2/N3), qui vit sur competences_escalade.
  cran text,
  constraint exercices_cran_chk check (statut = 'a_concevoir' or cran is not null),
  -- Le genre ÉLU (02- §1.3) : jamais null sur une instance terminale, null
  -- partout ailleurs. Contrôle à l'import (C4-L8) — il exige la nature du type.
  genre text,
  -- Les modes, élus PAR COMPÉTENCE MESURÉE, parmi ceux que le type admet pour
  -- elle. Ils sont ici, et pas seulement sur la mesure, parce que le routeur a
  -- besoin de la série AVANT d'assigner. Objet { competence: [modes] } — la
  -- valeur est toujours une LISTE, jamais un scalaire (§1.2).
  modes_par_competence jsonb not null default '{}'::jsonb,
  constraint exercices_modes_chk check (public.modes_par_competence_bien_forme(modes_par_competence)),
  -- Les deux matériaux, chacun avec sa provenance et son support, choisis dans
  -- les plages que le type admet. Énumérés hors manifeste de ce lot → pas de
  -- CHECK fermé.
  materiau_source_provenance text,
  materiau_source_support    text,
  materiau_cible_provenance  text,
  materiau_cible_support     text,
  -- LES DEUX DRAPEAUX D'OPT-IN DE CLASSE (§1.1) : portés par l'INSTANCE, jamais
  -- par le type, FAUX PAR DÉFAUT, et SANS EFFET quand `lieu` vaut `maison`, où
  -- les deux gestes sont de droit. « Sans effet » est une règle de lecture, pas
  -- une interdiction d'écriture : aucun CHECK ne les lie au lieu.
  optin_se_juger          boolean not null default false,
  optin_confiance_remise  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_exercices_planifie on exercices(exercice_planifie_id)
  where exercice_planifie_id is not null;
create index if not exists idx_exercices_classe_statut on exercices(classe_id, statut);
comment on column exercices.paire_diagnostic is
  'Marqueur de la paire de diagnostic (07- §1.1) : UNE ligne, DEUX cas dans consigne_instanciee, '
  'un seul dépôt, deux crédences, UNE mesure. Le nouveau cas n''écrit jamais une seconde ligne.';

-- ════════════════════════════════════════════════════════════════════════════
-- BLOC §1.5 (posé ici pour l'ordre des FK) — LE JOURNAL DU ROUTEUR
-- ════════════════════════════════════════════════════════════════════════════

-- ── 6. routeur_decisions — le journal des décisions ─────────────────────────
-- §1.5. Ce qu'il porte est déclaré au 01- §11 point 1. DEUX MARQUES que les
-- règles y déposent et qui n'existent nulle part ailleurs : le tirage aléatoire
-- et `degrade`. « Sans colonne, le compteur n'existe pas. »
-- Ce journal NE REDOUBLE AUCUNE LISTE : l'historique des cibles s'y LIT.
create table if not exists routeur_decisions (
  id       uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  -- Le cycle = la semaine (01- §1). Lundi de la semaine, DATE PURE, patron
  -- `scriptorium_exercices_planifies.semaine_lundi`.
  cycle_lundi date not null,
  constraint routeur_cycle_lundi_chk check (extract(isodow from cycle_lundi) = 1),
  exercice_id uuid references exercices(id) on delete set null,
  cible_retenue     text,
  regle_declenchee  text,
  alternatives_ecartees   jsonb,
  sondes_retenues         jsonb,   -- les sondes retenues ET LE MOTIF de chacune
  propositions_iso_duree  jsonb,   -- les deux ou trois propositions
  choix_eleve             jsonb,
  borne_amont             jsonb,   -- la borne amont du non-spoiler
  override_prof           jsonb,   -- tout override du professeur
  -- Le TIRAGE ALÉATOIRE, chaque fois que deux options sont équivalentes aux yeux
  -- des règles. « Un départage non journalisé rend le comportement du routeur
  -- irreproductible. »
  tirage_aleatoire jsonb,
  -- `degrade` : aucun cran ne porte l'observable visé et l'exercice est servi
  -- quand même, en retour mono-focal (01- §6). Ce compteur dira à quelle
  -- fréquence le cas se présente.
  degrade boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_routeur_decisions_eleve_cycle on routeur_decisions(eleve_id, cycle_lundi);
create index if not exists idx_routeur_decisions_degrade on routeur_decisions(cycle_lundi) where degrade;

-- ════════════════════════════════════════════════════════════════════════════
-- BLOC §1.1 (suite) — LES DÉPÔTS ET L'INFRASTRUCTURE
-- ════════════════════════════════════════════════════════════════════════════

-- ── 7. exercices_depots — élève × exercice ──────────────────────────────────
-- §1.1. CRÉÉE DÈS L'ASSIGNATION, PAS AU DÉPÔT : sans elle, « l'exercice de Léa,
-- sa fenêtre, son déroulé » n'existe nulle part.
-- AUCUN CHAMP `note` — la plateforme n'en porte aucune (06- §5).
create table if not exists exercices_depots (
  id          uuid primary key default gen_random_uuid(),
  eleve_id    uuid not null references profiles(id)  on delete cascade,
  exercice_id uuid not null references exercices(id) on delete cascade,
  assigne_at  timestamptz not null default now(),
  echeance    timestamptz,
  origine     text not null check (origine in ('routeur', 'prof')),
  routeur_decision_id uuid references routeur_decisions(id) on delete set null,
  -- La séquence. `abandonne` est EXCLU DES RÈGLES DE STAGNATION — un exercice
  -- jamais ouvert n'est pas une preuve de sur-place. En classe, la séquence
  -- s'arrête à `retour_publie` : il n'y a pas de version finale (garde serveur
  -- `garde_depot_lieu` plus bas).
  statut text not null default 'assigne' check (statut in
    ('assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis', 'clos', 'abandonne')),
  -- ── Par version : v1 et version finale ──
  texte_v1          text,
  photos_v1         jsonb,
  transcription_v1  text,
  confiance_ocr_v1  numeric,
  texte_vf          text,
  photos_vf         jsonb,
  transcription_vf  text,
  confiance_ocr_vf  numeric,
  -- photos[] porte l'ORDRE, la ROTATION, une SOMME DE CONTRÔLE, et SAIT DIRE
  -- QU'UNE PAGE MANQUE (§1.1). Les photos elles-mêmes vont au bucket existant,
  -- par URL signée, métadonnées EXIF purgées (§1 ; 06- §7).
  constraint depots_photos_v1_chk check (public.photos_bien_formees(photos_v1)),
  constraint depots_photos_vf_chk check (public.photos_bien_formees(photos_vf)),
  -- ── Les gestes de la remise (06- §3) ──
  -- UNE VALEUR PAR COMPÉTENCE `evaluee` MESURÉE, JAMAIS UN SCALAIRE — une
  -- passation en classe en mesure trois ou quatre. Objet { competence: valeur }.
  confiance_declaree jsonb,
  constraint depots_confiance_chk check (
    confiance_declaree is null or jsonb_typeof(confiance_declaree) = 'object'
  ),
  conditions_declarees jsonb,
  restitution_a_chaud  text,
  -- NULL quand la micro-question n'a pas été déclenchée OU pas répondue (§1.1).
  motif_depassement text check (motif_depassement in ('pause', 'difficulte')),
  -- Le message reporté de lisibilité, propre au canal classe.
  message_lisibilite_reporte text,
  -- ── Les horodatages de TOUT le déroulé ──
  ouvert_at       timestamptz,
  v1_remis_at     timestamptz,
  vf_remis_at     timestamptz,
  juger_debut_at  timestamptz,
  juger_fin_at    timestamptz,
  -- L'ouverture manuelle du dépôt par le professeur, en passation de classe.
  ouvert_par_prof_at timestamptz,
  duree_taguee text,
  -- ── Passations en classe ──
  commentaire_general text,
  corrige_par uuid references profiles(id) on delete set null,
  corrige_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uk_depots_eleve_exercice unique (eleve_id, exercice_id)
);
create index if not exists idx_depots_eleve_statut on exercices_depots(eleve_id, statut);
create index if not exists idx_depots_exercice on exercices_depots(exercice_id);
comment on table exercices_depots is
  'élève × exercice (07- §1.1). Créée dès l''ASSIGNATION, pas au dépôt. AUCUN champ note. '
  'La validation de lecture ne vit pas ici mais sur le retour (exercices_retours.lu_at) : '
  'un seul domicile pour un seul geste.';

-- ── 8. exercices_jobs — l'infrastructure de traitement ──────────────────────
-- §1.1. Mode de panne visé : une reprise après expiration écrit une seconde
-- mesure pour la même copie, et la règle de montée fait bouger une lettre sans
-- que l'élève ait rien fait. Porte aussi le traitement EN LOT d'une passation de
-- classe (02- §6.D) et le contrat de latence du retour (01- §12).
create table if not exists exercices_jobs (
  id       uuid primary key default gen_random_uuid(),
  depot_id uuid not null references exercices_depots(id) on delete cascade,
  etape    text not null,
  statut   text not null default 'en_attente',
  tentatives  integer not null default 0 check (tentatives >= 0),
  -- LE PLAFOND DE TENTATIVES DE L'IA avant de déclarer forfait : au-delà,
  -- `echec_definitif` passe à vrai et la machine cesse de réessayer.
  -- 3, confirmé par Louis le 18/08.
  tentatives_max integer not null default 3 check (tentatives_max >= 1),
  -- La CLÉ D'IDEMPOTENCE. Unique : c'est elle qui ferme la seconde mesure.
  cle_idempotence text not null unique,
  -- `echec_definitif` VISIBLE (§1.1) : une colonne, pas un statut noyé.
  echec_definitif boolean not null default false,
  dernier_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_jobs_depot on exercices_jobs(depot_id);
create index if not exists idx_jobs_echec on exercices_jobs(created_at) where echec_definitif;
comment on column exercices_jobs.tentatives_max is
  'Plafond de tentatives de l''IA avant forfait : au-delà, echec_definitif passe à vrai. '
  '3, confirmé par Louis le 18/08.';

-- ════════════════════════════════════════════════════════════════════════════
-- BLOC §1.2 — LA MESURE
-- ════════════════════════════════════════════════════════════════════════════

-- ── 9. exercices_squelettes — dépôt × version × compétence mesurée ──────────
-- §1.2. AUCUNE LETTRE ICI (elle vit sur la mesure, et nulle part ailleurs).
-- AUCUN COÛT ICI (il se journalise par appel, dans api_couts).
-- L'artefact d'extraction porte ce que l'étage a produit, et L'ÉTAGE PEUT AVOIR
-- PLUSIEURS APPELS — la Synthèse en a deux, un seul quand le référent est le
-- cours. Le jsonb les porte tous : le nombre d'appels ne se lit pas au nombre
-- de lignes de cette table, dont l'index unique impose UNE ligne par
-- (dépôt, compétence, version).
create table if not exists exercices_squelettes (
  id       uuid primary key default gen_random_uuid(),
  depot_id uuid not null references exercices_depots(id) on delete cascade,
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  version text not null check (version in ('v1', 'vf')),
  artefact_extraction jsonb,
  artefact_jugement   jsonb,
  modele            text,
  prompt_version    text,
  instrument_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- LE GARDE-FOU D'IDEMPOTENCE, nommé par la mission : une copie ne produit jamais
-- deux squelettes pour la même compétence (§1.2).
create unique index if not exists uk_squelettes_depot_competence_version
  on exercices_squelettes(depot_id, competence, version);
comment on table exercices_squelettes is
  'dépôt × version × compétence mesurée (07- §1.2). AUCUNE lettre, AUCUN coût. '
  'JAMAIS LISIBLE PAR L''ÉLÈVE avant la publication de son retour — avec la métacognition, '
  'c''est la garde la plus facile à casser et la plus coûteuse : elle donne la grille et les réponses.';

-- ── 10. exercices_metacognition — par dépôt ─────────────────────────────────
-- §1.2. La table des gestes que l'élève fait sur lui-même, et LA SOURCE DU
-- MONITORING : elle alimente `monitoring_mesures`, JAMAIS `competences_mesures`.
-- Rien de tout cela n'est noté, et rien n'est lisible par l'élève avant la
-- publication de son retour.
create table if not exists exercices_metacognition (
  id       uuid primary key default gen_random_uuid(),
  depot_id uuid not null unique references exercices_depots(id) on delete cascade,
  questions_servies  jsonb,
  questions_version  text,
  reponses           jsonb,
  -- La comparaison au squelette, OBSERVABLE PAR OBSERVABLE — faite PAR LE CODE,
  -- JAMAIS PAR LE MODÈLE (§1.2).
  comparaison_squelette jsonb,
  -- La calibration avec sa garde `indetermine`. L'échelle fait foi à
  -- `competences/monitoring.md`, hors manifeste de ce lot → pas de CHECK fermé.
  calibration text,
  -- LA CRÉDENCE, saisie de la porte 2 : PLUSIEURS VALEURS PAR DÉPÔT — il y en a
  -- une par diagnostic, donc DEUX SUR UNE PAIRE (02- §5). Tableau, jamais un
  -- scalaire. Sa forme suit le cran, et la fiche du Monitoring fait foi.
  credence jsonb,
  constraint metacog_credence_chk check (credence is null or jsonb_typeof(credence) = 'array'),
  -- La contestation : des points[] à IDENTIFIANTS STABLES, pour qu'elle puisse
  -- désigner ce qu'elle conteste, et le texte de l'élève.
  contestation_points jsonb,
  contestation_texte  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table exercices_metacognition is
  'Par dépôt (07- §1.2). Alimente monitoring_mesures, JAMAIS competences_mesures. '
  'JAMAIS LISIBLE PAR L''ÉLÈVE avant la publication de son retour. Rien n''est noté.';

-- ── 11. exercices_retours — par dépôt × moment ──────────────────────────────
-- §1.2. Le registre effectivement SERVI — la trace, jamais l'état. La date de
-- PUBLICATION (la case que coche le professeur) et la VALIDATION DE LECTURE.
-- `texte_edite_par_prof` reste NULL sur tout retour formatif de la maison :
-- conséquence du contrat de latence (01- §12), tenue par garde serveur.
create table if not exists exercices_retours (
  id       uuid primary key default gen_random_uuid(),
  depot_id uuid not null references exercices_depots(id) on delete cascade,
  -- Les deux moments de la chaîne (07- §2, C4-L5) : le retour chaud, le retour
  -- final engendré depuis la comparaison des deux squelettes.
  moment text not null check (moment in ('chaud', 'final')),
  texte               text,
  texte_edite_par_prof text,
  action_revision     jsonb,
  feed_forward        text,
  registre_servi      text,
  published_at timestamptz,
  lu_at        timestamptz,
  -- Les identifiants stables des points sur lesquels la contestation s'accroche.
  points_ids jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uk_retours_depot_moment unique (depot_id, moment)
);
comment on column exercices_retours.registre_servi is
  'Le registre effectivement SERVI — la TRACE, jamais l''état. Le registre courant se recalcule (07- §1).';

-- ── 12. competences_mesures — LA table de télémétrie ────────────────────────
-- §1.2. Ce qu'elle journalise est déclaré au 01- §11 point 2.
-- TROIS RÈGLES DE TABLE :
--   • les observables d'une mesure viennent de LA V1 SEULE ; la version finale
--     n'alimente que le delta. La table doit permettre la requête « échecs
--     répétés par élève × observable » (index GIN plus bas) ;
--   • AUCUN CHAMP DE DISPERSION, et c'est une décision : la dispersion est une
--     propriété de l'INSTRUMENT, pas de la mesure — elle se lit par
--     `instrument_version` ;
--   • LE MONITORING N'ENTRE PAS ICI : il a ses tables propres (§1.4).
-- AUCUNE colonne de SÉRIE : elle se dérive des modes élus (§1). AUCUNE `famille`.
create table if not exists competences_mesures (
  id       uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  -- La compétence en IDENTIFIANT NU : pas de préfixe, les six traversent les
  -- deux séries.
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  -- Les modes : UNE LISTE, JAMAIS UNE VALEUR. La condensation est « composer ET
  -- restituer », la problématisation nue « composer ET interroger ».
  modes text[] not null default '{}',
  lettre_equivalente text,
  observables jsonb,
  lieu  text not null check (lieu in ('maison', 'classe')),
  forme text not null check (forme in ('formatif', 'sommatif')),
  genre text,
  classe_id uuid references classes(id) on delete set null,
  -- Une mesure issue d'une SONDE DE MONTÉE ne compte NI dans la fenêtre
  -- d'acquisition des observables, NI dans la stagnation. À NE PAS CONFONDRE
  -- avec les sondes secondaires, qui mesurent une compétence non ciblée et qui,
  -- elles, COMPTENT — celles-ci ne se marquent pas ici.
  sonde_montee boolean not null default false,
  -- Les entrées des règles. Leurs contenus sont calés sur le `01-routeur.md`
  -- §11 point 2, ouvert sur autorisation explicite de Louis (18/08) pour ce
  -- seul objet — il est hors du manifeste de ce lot.
  -- `distance_contexte` : trois valeurs fermées, LUE PAR N2 (01- §8.4). ELLE SE
  -- CALCULE, ELLE NE SE JUGE PAS — l'opérande est le partage entre les mesures
  -- qui portent `composer` et celles qui n'en portent pas, et l'objet se lit par
  -- la chaîne du dépôt. ⚠️ NULLABLE, et ce n'est pas un défaut : quand la mesure
  -- ne remonte à AUCUN DÉPÔT — les devoirs ingérés —, l'objet est inconnu et la
  -- valeur est NULL. Le CRAN n'y entre pas : c'est un axe de nouveauté, pas de
  -- difficulté.
  distance_contexte text check (distance_contexte in
    ('meme_type', 'meme_famille', 'transfert')),
  -- Les deux entrées de §8.9 : la plus anciennement mesurée est le maximum de
  -- `delai_mesures`, départagé par `delai_jours`.
  delai_jours       integer check (delai_jours   is null or delai_jours   >= 0),
  delai_mesures     integer check (delai_mesures is null or delai_mesures >= 0),
  -- Dépliages de la fiche et relectures — un compte de gestes.
  -- (Définition provisoire, révisable selon les types — 01- §11.2.)
  aide_consommee    integer check (aide_consommee is null or aide_consommee >= 0),
  -- La comparaison des SQUELETTES v1 et vf, JAMAIS des verdicts.
  -- ⚠️ NULL N'EST PAS 0 — une passation en classe n'a pas de version finale.
  -- Le « delta restreint à l'observable ciblé » que lit N2 (01- §8.4) se
  -- RECALCULE des deux squelettes ; il ne se stocke pas ici.
  delta_v1_vf       numeric,
  -- LES DEUX RÉSULTATS DE LA PAIRE, aux crans de diagnostic. Une paire est UNE
  -- mesure : le diagnostic initial la fait, et les deux résultats s'y attachent.
  -- LE NOUVEAU CAS N'ÉCRIT JAMAIS UNE SECONDE LIGNE, et NULL N'EST PAS UN
  -- ÉCHEC : une paire non terminée est NULL.
  paire_correction_juste     boolean,
  paire_nouveau_cas_detecte  boolean,
  depot_id uuid references exercices_depots(id) on delete set null,
  bonus boolean not null default false,
  instrument_version text,
  mesure_at timestamptz not null default now()
);
create index if not exists idx_mesures_eleve_competence on competences_mesures(eleve_id, competence, mesure_at desc);
-- « Échecs répétés par élève × observable » : le jsonb des observables se sonde.
create index if not exists idx_mesures_observables on competences_mesures using gin (observables);
create index if not exists idx_mesures_depot on competences_mesures(depot_id) where depot_id is not null;
comment on table competences_mesures is
  'LA table de télémétrie (07- §1.2). AUCUN champ de dispersion (propriété de l''instrument, lue par '
  'instrument_version). AUCUNE colonne de série ni de famille (dérivées). Le Monitoring n''entre '
  'JAMAIS ici : monitoring_mesures / monitoring_niveaux (§1.4). L''agrégation des coûts se fait en '
  'requête sur api_couts, jamais en colonne.';

-- ════════════════════════════════════════════════════════════════════════════
-- BLOC §1.3 — L'ÉTAT
-- ════════════════════════════════════════════════════════════════════════════

-- ── 13. competences_niveaux — l'état affiché ────────────────────────────────
-- §1.3. Clé (élève × compétence), et PAS DE CLASSE DANS LA CLÉ : le profil est
-- UNIFIÉ PAR ÉLÈVE, les deux parcours portant les six compétences sur une
-- échelle commune. « Rien d'autre » — ni registre de retour, ni historique de
-- cibles : les deux se LISENT (§1).
-- AUCUNE LISTE DE COMPÉTENCES N'EST TENUE ICI : quelles compétences ont une
-- lettre est une CONSÉQUENCE CALCULABLE.
create table if not exists competences_niveaux (
  eleve_id   uuid not null references profiles(id) on delete cascade,
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  -- LA LETTRE EST NULLABLE, et l'absence de lettre est UNE RÈGLE, pas un cas
  -- limite : une compétence sans lettre n'est ni ciblable, ni sondable, ni
  -- plafonnée, et n'entre dans aucun départage (01- §3).
  lettre text,
  ancre_derniere_date   date,
  ancre_derniere_valeur text,
  -- Une compétence NAÎT `mesuree_silencieusement`, et ne devient `evaluee` que
  -- par un acte explicite du professeur (07- §5 ; 03- §9). L'oubli n'envoie
  -- jamais un verdict faux à un élève.
  statut_recette text not null default 'mesuree_silencieusement'
    check (statut_recette in ('evaluee', 'mesuree_silencieusement', 'differee')),
  profil_provisoire boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (eleve_id, competence)
);

-- ── 14. competences_escalade — l'état anti-stagnation ───────────────────────
-- §1.3. Clé (élève × compétence × observable) : un élève peut être en N2 sur un
-- observable d'Argumentation et en régime normal partout ailleurs.
-- Les RÈGLES qui écrivent cet état vivent au 01- §8 — ici, l'état ; là, la règle.
create table if not exists competences_escalade (
  eleve_id   uuid not null references profiles(id) on delete cascade,
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  observable text not null,
  degre text not null check (degre in ('N1', 'N2', 'N3')),
  -- La date d'entrée en N1, LUE PAR LA DOUBLE CONDITION DE N3.
  entre_n1_at timestamptz,
  -- La date d'ouverture du dossier N3 (NULL avant), la date de son traitement.
  dossier_n3_ouvert_at  timestamptz,
  dossier_n3_traite_at  timestamptz,
  updated_at timestamptz not null default now(),
  primary key (eleve_id, competence, observable)
);
create index if not exists idx_escalade_n3_ouvert on competences_escalade(dossier_n3_ouvert_at)
  where dossier_n3_ouvert_at is not null and dossier_n3_traite_at is null;

-- ── 15. competences_montee — l'état de progression ──────────────────────────
-- §1.3. Clé (élève × compétence × grain), UN `cran_atteint` — « deux ou trois
-- petits entiers par compétence, rien de plus ». PAS trois colonnes
-- `_micro`/`_meso`/`_macro`, qui graveraient l'énuméré des grains dans des noms.
-- TOUT LE RESTE SE DÉRIVE, et LA DISTRIBUTION NE SE STOCKE JAMAIS.
-- C'EST UN ÉTAT, PAS UNE TRACE : recalculé du journal, un changement
-- d'instrument_version ferait redescendre un élève d'un cran sans que personne
-- ne l'ait décidé.
create table if not exists competences_montee (
  eleve_id   uuid not null references profiles(id) on delete cascade,
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  grain text not null check (grain in ('micro', 'meso', 'macro')),
  cran_atteint integer,
  updated_at timestamptz not null default now(),
  primary key (eleve_id, competence, grain)
);

-- ── 16. competences_actives_par_classe ──────────────────────────────────────
-- §1.3. Clé (classe × compétence). AUCUNE COMPOSANTE DE SÉRIE DANS LA CLÉ : ce
-- qu'une compétence peut instancier n'est pas une propriété de son activation.
create table if not exists competences_actives_par_classe (
  classe_id  uuid not null references classes(id) on delete cascade,
  competence text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (classe_id, competence)
);

-- ════════════════════════════════════════════════════════════════════════════
-- BLOC §1.4 — LE MONITORING (DEUX TABLES À LUI, ET C'EST UNE DÉCISION)
-- ════════════════════════════════════════════════════════════════════════════
-- Le Monitoring est de SECOND ORDRE : il ne se note pas, il n'est jamais cible
-- du routeur, et ses deux sous-dimensions n'ont pas la même forme d'état.
-- Son construct, ses champs, son échelle, son calcul et ses conditions de
-- validité font foi à `competences/monitoring.md` ; ce qui suit ne déclare que
-- les tables. IL N'ENTRE JAMAIS DANS competences_mesures NI competences_niveaux.

-- ── 17. monitoring_mesures — une ligne par mesure ───────────────────────────
create table if not exists monitoring_mesures (
  id       uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  sous_dimension text not null check (sous_dimension in
    ('calibration_confiance', 'lucidite_incompris')),
  -- LA SOURCE EST UN CHAMP, PAS UN COMMENTAIRE. Une série NE MÉLANGE JAMAIS le
  -- spontané et le sollicité : solliciter un geste le rend vrai pour tout le
  -- monde, et une série mixte cesse de discriminer.
  source text not null check (source in ('spontane', 'sollicite')),
  observables jsonb,
  lieu text not null check (lieu in ('maison', 'classe')),
  classe_id uuid references classes(id) on delete set null,
  depot_id  uuid references exercices_depots(id) on delete set null,
  -- Sa validité est PLAFONNÉE par celle des compétences couvertes. La
  -- calibration ne compte que sur les compétences `evaluee`, et cette colonne
  -- enregistre LESQUELLES ONT COMPTÉ — faute de quoi on ne saura jamais relire
  -- la mesure.
  competences_couvertes text[] not null default '{}' check (
    competences_couvertes <@ array['expression','argumentation','structure',
                                   'connaissance','synthese','questionnement']
  ),
  delai_jours   integer,
  delai_mesures integer,
  instrument_version text,
  -- L'AMPLITUDE N'EST PAS UN ENTIER NU : `n/a` est une VALEUR DÉCLARÉE dans les
  -- deux échelles tant que la table de conversion n'est pas écrite (fiche §7 et
  -- §9), elle se compare comme les autres, et les deux colonnes doivent donc
  -- l'accepter. D'où `text` et non `integer`.
  amplitude_ecart text,
  direction_ecart text,
  mesure_at timestamptz not null default now()
);
create index if not exists idx_monitoring_mesures_eleve on monitoring_mesures(eleve_id, sous_dimension, mesure_at desc);
create index if not exists idx_monitoring_mesures_depot on monitoring_mesures(depot_id) where depot_id is not null;
comment on table monitoring_mesures is
  'Une ligne par mesure de Monitoring (07- §1.4). LA SAISIE DE CRÉDENCE N''EST PAS ICI : elle vit '
  'avec les autres gestes du dépôt (exercices_metacognition.credence). Cette table ne reçoit que '
  'L''ACCORD entre la crédence et la réussite — le signal, jamais la saisie. La réussite va à la '
  'compétence, l''accord va au Monitoring, et la compétence ignore la crédence.';

-- ── 18. monitoring_niveaux — l'état, une ligne par sous-dimension ───────────
-- Les colonnes propres à chacune NE SE CROISENT PAS : celles de l'une sont NULL
-- sur les lignes de l'autre.
create table if not exists monitoring_niveaux (
  eleve_id uuid not null references profiles(id) on delete cascade,
  sous_dimension text not null check (sous_dimension in
    ('calibration_confiance', 'lucidite_incompris')),
  -- `n` : le NOMBRE DE MESURES — à distinguer du dénominateur de fenêtre.
  n integer not null default 0 check (n >= 0),
  statut_recette text not null default 'mesuree_silencieusement'
    check (statut_recette in ('evaluee', 'mesuree_silencieusement', 'differee')),
  profil_provisoire boolean not null default true,
  -- ── Propres à la CALIBRATION DE LA CONFIANCE ──
  -- `n/a` est une valeur déclarée → text, pas integer.
  amplitude_courante text,
  direction_courante text,
  -- ── Propres à la LUCIDITÉ SUR L'INCOMPRIS ──
  taux numeric,
  denominateur_fenetre integer check (denominateur_fenetre is null or denominateur_fenetre >= 0),
  updated_at timestamptz not null default now(),
  primary key (eleve_id, sous_dimension),
  -- LES COLONNES NE SE CROISENT PAS.
  constraint monitoring_niveaux_cloison_chk check (
       (sous_dimension = 'calibration_confiance'
          and taux is null and denominateur_fenetre is null)
    or (sous_dimension = 'lucidite_incompris'
          and amplitude_courante is null and direction_courante is null)
  ),
  -- DIRECTION NULL QUAND L'AMPLITUDE VAUT 0.
  constraint monitoring_direction_chk check (
    amplitude_courante is distinct from '0' or direction_courante is null
  ),
  -- UN DÉNOMINATEUR À ZÉRO DONNE UN TAUX NULL, JAMAIS ZÉRO — l'élève qui n'a
  -- rien raté n'a pas de dénominateur, ce n'est pas un mauvais score.
  constraint monitoring_taux_chk check (
    denominateur_fenetre is distinct from 0 or taux is null
  )
);

-- ════════════════════════════════════════════════════════════════════════════
-- BLOC §1.5 (suite) — LES COMPTEURS
-- ════════════════════════════════════════════════════════════════════════════

-- ── 19. assiduite_hebdo — par élève et par semaine ──────────────────────────
-- §1.5. La semaine EST le cycle (01- §1). COLLECTÉE DÈS LA RENTRÉE, même si les
-- écrans attendent — un semestre ne se recompte pas après coup.
create table if not exists assiduite_hebdo (
  eleve_id uuid not null references profiles(id) on delete cascade,
  cycle_lundi date not null,
  constraint assiduite_lundi_chk check (extract(isodow from cycle_lundi) = 1),
  exercices_assignes integer not null default 0 check (exercices_assignes >= 0),
  exercices_termines integer not null default 0 check (exercices_termines >= 0),
  -- Le booléen « semaine faite » AU SEUIL CONFIGURÉ. La formule, le seuil et ce
  -- que le professeur en fait vivent au 06- §5 ; le dénominateur vient du
  -- Calendrier.
  semaine_faite boolean not null default false,
  -- LES DEUX COMPTEURS DE MINUTES, par élève et par cycle : les minutes
  -- ASSIGNÉES (somme des durées des exercices posés par le routeur) et les
  -- minutes de BUDGET (plancher et plafond de l'élève).
  minutes_assignees      integer check (minutes_assignees is null or minutes_assignees >= 0),
  minutes_budget_plancher integer check (minutes_budget_plancher is null or minutes_budget_plancher >= 0),
  minutes_budget_plafond  integer check (minutes_budget_plafond is null or minutes_budget_plafond >= 0),
  constraint assiduite_budget_ordre_chk check (
    minutes_budget_plancher is null or minutes_budget_plafond is null
    or minutes_budget_plafond >= minutes_budget_plancher
  ),
  updated_at timestamptz not null default now(),
  primary key (eleve_id, cycle_lundi)
);
comment on table assiduite_hebdo is
  'Par élève et par semaine (07- §1.5). Le TAUX D''INACTIVITÉ PAR CLASSE ne se stocke pas : il '
  'SE CALCULE (07- §2, « fait quand » de C4-L2) — une agrégation stockée serait une seconde copie '
  'du même chiffre. Vue de lecture : assiduite_hebdo_classe.';

-- Le taux d'inactivité par classe et par semaine — UNE LECTURE, pas un état.
create or replace view assiduite_hebdo_classe as
  select i.classe_id,
         a.cycle_lundi,
         count(*)                                          as eleves,
         count(*) filter (where not a.semaine_faite)        as eleves_inactifs,
         case when count(*) = 0 then null
              else round(count(*) filter (where not a.semaine_faite)::numeric / count(*), 4)
         end                                                as taux_inactivite
    from assiduite_hebdo a
    join inscriptions i on i.eleve_id = a.eleve_id and i.statut = 'active'
   group by i.classe_id, a.cycle_lundi;

-- ════════════════════════════════════════════════════════════════════════════
-- LES GARDES SERVEUR (la mission : « la RLS ET LES GARDES SERVEUR »)
-- ════════════════════════════════════════════════════════════════════════════

-- Garde A — une référence VALIDÉE ne se modifie plus en silence (§1.1).
create or replace function public.garde_reference_immuable() returns trigger
language plpgsql as $fn$
begin
  if old.validee_at is not null and (
       new.contenu           is distinct from old.contenu
    or new.empreinte         is distinct from old.empreinte
    or new.source_contenu_id is distinct from old.source_contenu_id
    or new.source_livre_id   is distinct from old.source_livre_id
    or new.localisation      is distinct from old.localisation
  ) then
    raise exception 'Garde 07- §1.1 : une référence validée ne se modifie plus en silence (référence %).', old.id
      using errcode = 'check_violation';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_reference_immuable on exercices_references;
create trigger trg_reference_immuable before update on exercices_references
  for each row execute function public.garde_reference_immuable();

-- Garde B — une référence NON VALIDÉE n'entre JAMAIS dans une phase de jugement
-- (§1.1). Le jugement, c'est `artefact_jugement` sur le squelette.
create or replace function public.garde_reference_validee() returns trigger
language plpgsql as $fn$
declare v_ref uuid; v_validee timestamptz;
begin
  if new.artefact_jugement is null then return new; end if;
  select e.reference_id into v_ref
    from exercices_depots d
    join exercices e on e.id = d.exercice_id
   where d.id = new.depot_id;
  if v_ref is null then return new; end if;
  select r.validee_at into v_validee from exercices_references r where r.id = v_ref;
  if v_validee is null then
    raise exception 'Garde 07- §1.1 : une référence non validée n''entre jamais dans une phase de jugement (référence %).', v_ref
      using errcode = 'check_violation';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_reference_validee on exercices_squelettes;
create trigger trg_reference_validee before insert or update on exercices_squelettes
  for each row execute function public.garde_reference_validee();

-- Garde C — EN CLASSE, IL N'Y A PAS DE VERSION FINALE : la séquence s'arrête à
-- `retour_publie` (§1.1). `clos` et `abandonne` restent atteignables.
create or replace function public.garde_depot_lieu() returns trigger
language plpgsql as $fn$
declare v_lieu text;
begin
  select e.lieu into v_lieu from exercices e where e.id = new.exercice_id;
  if v_lieu = 'classe' then
    if new.statut = 'vf_remis' then
      raise exception 'Garde 07- §1.1 : en classe, la séquence s''arrête à retour_publie — il n''y a pas de version finale.'
        using errcode = 'check_violation';
    end if;
    if new.texte_vf is not null or new.photos_vf is not null
       or new.transcription_vf is not null or new.vf_remis_at is not null then
      raise exception 'Garde 07- §1.1 : aucune version finale sur une passation en classe.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $fn$;
drop trigger if exists trg_depot_lieu on exercices_depots;
create trigger trg_depot_lieu before insert or update on exercices_depots
  for each row execute function public.garde_depot_lieu();

-- Garde D — `texte_edite_par_prof` reste NULL sur tout retour de la MAISON
-- (§1.2) : conséquence du contrat de latence (01- §12) — un retour maison part
-- en moins de trois minutes, aucune relecture humaine ne tient dans ce délai, et
-- aucun écran d'édition ne se construit côté maison.
create or replace function public.garde_retour_maison_non_edite() returns trigger
language plpgsql as $fn$
declare v_lieu text;
begin
  if new.texte_edite_par_prof is null then return new; end if;
  select e.lieu into v_lieu
    from exercices_depots d join exercices e on e.id = d.exercice_id
   where d.id = new.depot_id;
  if v_lieu = 'maison' then
    raise exception 'Garde 07- §1.2 : texte_edite_par_prof reste NULL sur tout retour de la maison — l''édition appartient au flux de classe.'
      using errcode = 'check_violation';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_retour_maison_non_edite on exercices_retours;
create trigger trg_retour_maison_non_edite before insert or update on exercices_retours
  for each row execute function public.garde_retour_maison_non_edite();

-- ════════════════════════════════════════════════════════════════════════════
-- LA RLS — patron `c1_rls_eleve.sql`
-- ════════════════════════════════════════════════════════════════════════════
-- « Lecture élève : ses propres lignes, strictement ; TOUTES LES ÉCRITURES
-- PASSENT PAR LE SERVEUR » (§1).
--
-- POSTURE DE CE LOT : RLS active partout, policy PROF `for all`, et AUCUNE
-- POLICY ÉLÈVE. C'est plus fermé que « ses propres lignes » — et c'est
-- délibéré :
--   • aucun écran élève n'existe encore (C4-L3, C4-L4, C5-L2) : toute policy
--     élève ouverte ici n'aurait aucun usage et un risque ;
--   • le dépôt a déjà convergé vers ce patron — `scriptorium_rag_l1.sql` §D et
--     `c7_quazian_rls_eleve.sql` (décision de Louis, 14/08) : aucune policy
--     élève, lecture admin + garde applicative, la règle vit dans le code et
--     à UN SEUL endroit ;
--   • les lots élève ouvriront un SELECT own par table, au moment où ils en
--     ont l'usage.
-- ⚠️ DEUX TABLES NE REÇOIVENT JAMAIS DE POLICY ÉLÈVE AVANT LA PUBLICATION DU
-- RETOUR : `exercices_squelettes` et `exercices_metacognition`. C'est la garde
-- la plus facile à casser et la plus coûteuse : elle donne la grille ET les
-- réponses (§1, §1.2).
-- ⚠️ Une seule policy par table et par rôle : les policies sont OR'ées, un
-- doublon rouvrirait ce qu'on ferme (piège documenté par `c1_rls_eleve.sql`).

do $rls$
declare t text;
begin
  foreach t in array array[
    'exercices_types','exercices_types_crans','exercices_types_modes',
    'exercices_demonstrations','exercices_references','exercices',
    'routeur_decisions','exercices_depots',
    'exercices_jobs','exercices_squelettes','exercices_metacognition',
    'exercices_retours','competences_mesures','competences_niveaux',
    'competences_escalade','competences_montee','competences_actives_par_classe',
    'monitoring_mesures','monitoring_niveaux','assiduite_hebdo'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_prof_all', t);
    execute format($p$create policy %I on %I for all
        using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
        with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))$p$,
      t || '_prof_all', t);
  end loop;
end $rls$;

-- ════════════════════════════════════════════════════════════════════════════
-- LES TROIS INTERRUPTEURS — TOUS À OFF (§1.5, §5)
-- ════════════════════════════════════════════════════════════════════════════
-- Au MÊME EMPLACEMENT que les interrupteurs existants : `scriptorium_params`,
-- qui porte déjà `rag_actif` et `plan_evaluation_actif`.
-- Trois, et non un seul : un interrupteur unique rendait le diagnostic
-- impossible sans tout allumer.
--   exercices_actif              → les élèves peuvent-ils faire des exercices ?
--   routeur_actif                → le routeur choisit-il, ou le prof planifie-t-il ?
--   competences_affichage_actif  → les lettres sont-elles visibles ?
-- ⚠️ `default false` SANS backfill explicite : la ligne singleton (id = 1)
-- existe déjà et prend le défaut. Aucun `update` — rien ne peut allumer par
-- accident.
alter table scriptorium_params add column if not exists exercices_actif             boolean not null default false;
alter table scriptorium_params add column if not exists routeur_actif               boolean not null default false;
alter table scriptorium_params add column if not exists competences_affichage_actif boolean not null default false;

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — à jouer tel quel, hors transaction.
-- ============================================================================
select
  (select count(*) from pg_tables where schemaname = 'public' and tablename in (
     'exercices_types','exercices_references','exercices','exercices_depots','exercices_jobs',
     'exercices_squelettes','exercices_metacognition','exercices_retours','competences_mesures',
     'competences_niveaux','competences_escalade','competences_montee','competences_actives_par_classe',
     'monitoring_mesures','monitoring_niveaux','routeur_decisions','assiduite_hebdo'
   )) = 17                                                              as les_17_tables_du_paragraphe_1,
  (select count(*) from pg_tables where schemaname = 'public'
     and tablename in ('exercices_types_crans','exercices_types_modes')) = 2
                                                                         as les_2_axes_de_declaration,
  (select count(*) from pg_tables where schemaname = 'public'
     and tablename = 'exercices_demonstrations') = 1                      as les_demonstrations_du_temps_1,
  (select count(*) from pg_indexes where schemaname = 'public'
     and indexname = 'uk_squelettes_depot_competence_version') = 1        as index_unique_du_squelette,
  (select count(*) from pg_constraint
     where conrelid = 'public.exercices_references'::regclass
       and contype = 'u') >= 1                                            as unicite_avec_empreinte,
  (select count(*) from pg_trigger where not tgisinternal and tgname in
     ('trg_reference_immuable','trg_reference_validee','trg_depot_lieu','trg_retour_maison_non_edite')) = 4
                                                                         as les_4_gardes_serveur,
  (select count(*) from pg_policies where schemaname = 'public'
     and tablename like any (array['exercices%','competences%','monitoring%','routeur%','assiduite%'])) = 20
                                                                         as policies_prof_20,
  (select count(*) from pg_policies where schemaname = 'public'
     and tablename in ('exercices_squelettes','exercices_metacognition')
     and policyname not like '%prof%') = 0                                as aucune_policy_eleve_sur_les_2_tables_fermees,
  (select count(*) from information_schema.columns where table_schema = 'public'
     and table_name like any (array['exercices%','competences%','monitoring%','routeur%','assiduite%'])
     and column_name in ('famille','note')) = 0                           as ni_famille_ni_note,
  (select count(*) from information_schema.columns where table_schema = 'public'
     and table_name = 'exercices_types' and column_name in
     ('produit_mesure','duree_redaction_min','complexite','etayage','duree_v1_min','duree_vf_min')) = 0
                                                                         as les_6_attributs_non_crees;

-- LES TROIS INTERRUPTEURS, VÉRIFIÉS À OFF PAR REQUÊTE (« fait quand »).
select exercices_actif, routeur_actif, competences_affichage_actif,
       (exercices_actif or routeur_actif or competences_affichage_actif) = false as les_trois_a_off
  from scriptorium_params where id = 1;

-- ============================================================================
-- CE QUI RESTE INCOMPLET — À TRANCHER HORS SÉANCE (07- §1.1 : « une valeur que
-- le seed ne peut pas citer se laisse vide et se signale, elle ne s'invente pas »)
--   1. `exercices_types.crans_admis` — vide. L'énuméré des neuf crans fait foi
--      au 02- §2.2, hors manifeste de C4-L1.
--   2. `exercices_types_crans` — 0 ligne. couverture_observables, provenances
--      admises et `duree_exercice_min` (dérivée du geste et du grain, 02- §2.4)
--      arrivent en C4-L5 / C4-L8.
--   3. `exercices_types_modes` — 0 ligne. La table des modes admis borne ce
--      qu'un type peut déclarer (02- §3), hors manifeste.
--   4. `exercices_types.mode_saisie` / `consigne_gabarit` — NULL au seed.
--   5. Les TYPES DIAGNOSTIQUES — cf. `c4_l1_seed.sql`, bloc final. Leur nature
--      et leurs compétences sont tranchées ; restent `genres_admis` et
--      `exclusions_parcours`, qui sont des valeurs de seed, pas du schéma.
--
-- TRANCHÉ EN SÉANCE LE 18/08, ET DONC RETIRÉ DE CETTE LISTE
--   • `exercices_jobs.tentatives_max` = 3 — confirmé par Louis.
--   • `competences_mesures` : les cinq entrées des règles sont calées sur le
--     `01-routeur.md` §11 point 2, ouvert sur autorisation explicite pour ce
--     seul objet. UNE ERREUR CORRIGÉE : `distance_contexte` n'est pas un
--     nombre mais une ÉTIQUETTE à trois valeurs fermées (`meme_type`,
--     `meme_famille`, `transfert`), NULLABLE pour les devoirs ingérés — elle
--     était posée en `numeric`, ce qui aurait coûté une migration. En outre
--     `aide_consommee` est resserrée de `numeric` à `integer` (un compte de
--     gestes) ; `delta_v1_vf` reste `numeric` (« NULL n'est pas 0 ») et le
--     delta restreint à l'observable ciblé se RECALCULE des squelettes ;
--     `delai_jours` et `delai_mesures` restent `integer`.
--   • La TROISIÈME NATURE `complet` sur `exercices_types` : un type
--     diagnostique n'a ni objet ni cran, et `exercices.type_id` reste NOT NULL.
-- ============================================================================

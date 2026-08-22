-- ============================================================================
-- C4 · L8 — LA FABRIQUE DU PROFESSEUR (additive, gatée, NON-CASSANTE).
-- Fichier : c4_l8_fabrique.sql
-- ----------------------------------------------------------------------------
-- Lot C4-L8. Manifeste : `07-Implementation.md` §1 et §2 (VERSION 2.7, VALIDÉ
-- ET GELÉ) · `03-competences.md` §9 (2.1) · `08-FORMAT_IMPORT.md` (1.2) ·
-- `02-exercices.md` §6 (5.4) · `05-GENERATEUR_Reference_Decomposee.md` (2.0) ·
-- `04-Instances_Exercices.md` (3.1) · `instances/04-*.md` · `SUIVI_SQL.md` ·
-- `c1_rls_eleve.sql` (patron RLS) · `c4_l1_schema.sql` (les tables du §1).
-- À jouer APRÈS `c4_l8_doctrine.sql`.
--
-- POURQUOI CE FICHIER EXISTE
--   « La base a été créée contre un `07-` antérieur » : ce que le §1 nomme
--   depuis n'y est pas encore, et s'ajoute en MIGRATION ADDITIVE (contrôle
--   d'entrée du prompt de lot). Constaté en base le 20/08 :
--     · la DATE du statut de recette (§1.3)                → absente
--     · la CORRESPONDANCE observable → formulation (§1.1)  → absente
--     · le RATTACHEMENT AU COURS et la SEMAINE du plan de
--       lecture, sur le matériau déposé (§1.1)             → absents
--     · l'APPUI en clair sur l'instance, PAR CAS (§1.1)    → absent
--     · le statut `retire` d'un dépôt (§1.1)               → absent du CHECK
--   S'y ajoutent les données que le §1 ne nomme pas mais que le `08-` déclare —
--   « la donnée doit exister, nommée, avec son identité stable ; sa table
--   t'appartient » (piège 3) : la BANQUE DE SUJETS (`08-` §3 ; `02-` §6 B.2) et
--   la BANQUE DE MATÉRIAUX FABRIQUÉS (`08-` §4 ; `02-` §6, principes).
--
-- ⚠️ LE TEXTE D'AUTEUR N'A QU'UN DOMICILE, ET C'EST LE SCRIPTORIUM.
--   « Un texte importé entre au corpus du Scriptorium » (piège 13 ; `02-` §6 B :
--   « les textes d'auteur vivent dans Scriptorium » ; `07-` §1.1 : la source
--   d'une référence est « le contenu ou le livre »). `exercices_textes` NE PORTE
--   DONC AUCUNE COLONNE `contenu` : le texte vit dans
--   `scriptorium_contenus.texte_extrait`, et cette table-ci porte son EMPREINTE.
--   « Le `contenu` fait foi sur les coordonnées, CARACTÈRE PAR CARACTÈRE […]
--   l'empreinte est celle du contenu exact, OCTET POUR OCTET — aucune
--   normalisation, ni au stockage, ni à l'empreinte » (piège 13). Une seconde
--   copie du texte aurait été un second domicile, et deux domiciles divergent ;
--   l'empreinte rend visible toute retouche faite par un autre flux.
--   ⚠️ Ce fichier NE TOUCHE PAS `scriptorium_contenus` : il la RÉFÉRENCE. Les
--   lignes que l'import y crée sont de la DONNÉE, pas une migration — mais
--   l'écran d'import écrit dans une table que le RAG lit, et c'est écrit au
--   relevé de séance.
--
-- CE QUE CE FICHIER NE POSE PAS — écrit pour qu'on ne le cherche pas
--   • aucune DATE sur `monitoring_niveaux` : le §1.4 déclare ses colonnes et
--     n'en nomme aucune ; la date du §1.3 a « un lecteur, et un seul — le
--     recalcul de la lettre à la bascule », et le Monitoring n'a pas de lettre.
--     « Une donnée que rien ne nomme se signale, elle ne s'invente pas »
--     (piège 3). La question part au relevé.
--   • aucune valeur de `mode_saisie` ni de `consigne_gabarit` : ce fichier pose
--     l'ÉNUMÉRÉ que la citation donne (`ecran` / `manuscrit` — `07-` §1.3 ;
--     `06-` §1) et laisse les colonnes vides, « en le signalant » (piège 39).
--   • aucun canal de signalement neuf : le drapeau d'intégrité reste
--     `signalerEnAttenteIA` → `integrite_signalements` (§1.2 ; pièges 20 et 21).
--   • aucune classe, aucune fenêtre, aucune assignation à l'import (`08-` §6).
--   • aucune ligne à `api_couts` : « aucun appel de modèle à la conception »
--     (`07-` §2 ; piège du prompt : « aucune clé d'API ne sort de ce lot »).
--
-- PROTOCOLE : NORMAL (`SUIVI_SQL.md` règle 5) — tables neuves et colonnes
-- neuves NULLABLES sur des tables de C4-L1 (`exercices`, `exercices_depots`,
-- `competences_niveaux`, `exercices_demonstrations`, `exercices_types`), toutes
-- VIDES au 20/08 et gatées à OFF. Aucune table ni policy d'un flux existant
-- n'est touchée : les FK vers `scriptorium_contenus`, `scriptorium_documents`,
-- `aletheia_livre_reference`, `classes` et `profiles` ne les altèrent pas.
--
-- RÉPÉTITION À BLANC (règle 6) : jamais le fichier entier dans une transaction
-- d'essai — copier le CORPS seul, puis vérifier PAR REQUÊTE le retour à l'état
-- d'avant.
--
-- Idempotence : create ... if not exists · add column if not exists · les CHECK
-- remplacés sont `drop constraint if exists` puis `add constraint`.
-- Rollback : `c4_l8_fabrique_rollback.sql`.
-- ============================================================================

begin;

-- ════════════════════════════════════════════════════════════════════════════
-- A. LE LIEU OÙ VIVENT LES COMPÉTENCES — la fiche, la correspondance, le statut
-- ════════════════════════════════════════════════════════════════════════════

-- ── A.1 `competences_fiches` — la fiche déposée ──────────────────────────────
-- « Une fiche est un fichier markdown, et sa forme est connue » (piège 5) : une
-- ligne VERSION, une ligne Statut, dix sections (`03-` §1), et au §5 la table de
-- correspondance. « Il y lit ce qu'elles portent : sa version, son statut, sa
-- correspondance — ET RIEN QUI NE SOIT DANS LE FICHIER » (piège 8).
-- La compétence se RECONNAÎT — titre et nom du fichier — et s'écrit en
-- identifiant nu ; le parseur ne demande rien (piège 5).
-- ⚠️ `monitoring` est ici, et il n'est pas une des six : sa fiche se dépose
-- comme les autres, mais elle N'A PAS DE CORRESPONDANCE (`competences/
-- monitoring.md` §4) et son statut ne va pas dans `competences_niveaux` (§1.4).
create table if not exists competences_fiches (
  competence   text primary key check (competence in
    ('expression','argumentation','structure','connaissance','synthese',
     'questionnement','monitoring')),
  version      text not null,          -- la ligne VERSION, telle qu'elle est écrite
  statut       text not null,          -- la ligne Statut, telle qu'elle est écrite
  nom_fichier  text not null,
  contenu      text not null,          -- le markdown déposé, tel quel
  deposee_par  uuid references profiles(id) on delete set null,
  deposee_at   timestamptz not null default now()
);
comment on table competences_fiches is
  'La fiche de compétence déposée au premier écran de la fabrique (07- §2, C4-L8). '
  'Redéposer remplace : « redéposer une fiche dont la VERSION a bougé remplace la correspondance '
  'et change la version citée ; rien d''autre ne la change » (07- §1.1).';
comment on column competences_fiches.version is
  'La ligne VERSION de la fiche AU MOMENT DU DÉPÔT — celle que exercices_metacognition.questions_version cite.';

-- ── A.2 `competences_correspondance` — observable → formulation ──────────────
-- §1.1 : « par compétence × observable, la dimension dite à l''élève, la
-- question « se juger », la liste FERMÉE de ses réponses — une réponse libre ne
-- se compare à rien —, et une VERSION ».
-- « C'est la seule donnée que le §1.1 nomme » du dépôt d'une fiche (piège 5).
-- « Rien ici ne s'écrit à la main, et AUCUN LOT N'INVENTE UNE QUESTION » (§1.1).
-- Second plancher mécanique : correspondance absente → compétence NON
-- DÉCLARABLE `evaluee` (`competences/monitoring.md` §4 ; `03-` §9 ; piège 6).
create table if not exists competences_correspondance (
  competence      text not null check (competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  observable_code text not null,
  dimension_eleve text not null,
  question        text not null,
  reponses        text[] not null check (coalesce(array_length(reponses,1),0) >= 2),
  fiche_version   text not null,
  ordre           int  not null,       -- l'ordre de la table dans la fiche
  deposee_at      timestamptz not null default now(),
  primary key (competence, observable_code)
);
comment on table competences_correspondance is
  'La correspondance observable → formulation, versée par le DÉPÔT DE LA FICHE et par lui seul (07- §1.1). '
  '`monitoring` n''y figure pas : « elle n''a pas de correspondance » (competences/monitoring.md §4, piège 4). '
  '`orthographe` n''a pas de bloc à l''Expression, et c''est délibéré (piège 5).';
comment on column competences_correspondance.reponses is
  'La liste FERMÉE. « C''est le CODE qui compare la réponse de l''élève au squelette, et une réponse '
  'libre ne se compare à rien » (competences/expression.md §5).';

-- ── A.3 La DATE du statut de recette, sur `competences_niveaux` ──────────────
-- §1.3 : « la lettre, la dernière ancre, le statut_recette, LA DATE À LAQUELLE
-- CE STATUT A ÉTÉ POSÉ, profil_provisoire, updated_at ».
-- « La date de bascule s'écrit DANS LE MÊME GESTE que le statut, à l'écran de
-- la fabrique — le seul endroit d'où un statut se pose. Elle a un lecteur, et
-- un seul : le passage de `mesuree_silencieusement` à `evaluee` recalcule la
-- lettre depuis les seules mesures POSTÉRIEURES à la recette. » Ce recalcul
-- n'est pas de ce lot (piège 7).
-- ⚠️ « `updated_at` NE PEUT PAS EN TENIR LIEU : n'importe quelle écriture le
-- touche » (§1.3). D'où une colonne propre.
alter table competences_niveaux
  add column if not exists statut_recette_pose_le timestamptz;
comment on column competences_niveaux.statut_recette_pose_le is
  'La date à laquelle statut_recette a été posé (07- §1.3). Écrite DANS LE MÊME GESTE que le statut. '
  'Un lecteur, et un seul : le recalcul de la lettre à la bascule mesuree_silencieusement → evaluee '
  '(01- §3), qui n''est pas de ce lot. updated_at ne peut pas en tenir lieu.';

-- Garde : le statut et sa date bougent ENSEMBLE. Un statut qui change sans que
-- la date suive est exactement le défaut que la colonne existe pour empêcher.
create or replace function public.garde_statut_porte_sa_date() returns trigger
language plpgsql as $fn$
begin
  if tg_op = 'INSERT' then
    if new.statut_recette_pose_le is null then
      new.statut_recette_pose_le := now();
    end if;
    return new;
  end if;
  if new.statut_recette is distinct from old.statut_recette
     and new.statut_recette_pose_le is not distinct from old.statut_recette_pose_le then
    raise exception 'Garde 07- §1.3 : poser un statut en écrit la date DANS LE MÊME GESTE (élève %, compétence %).',
      old.eleve_id, old.competence using errcode = 'check_violation';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_statut_porte_sa_date on competences_niveaux;
create trigger trg_statut_porte_sa_date before insert or update on competences_niveaux
  for each row execute function public.garde_statut_porte_sa_date();

-- ── A.4 Poser un statut — un seul geste, sur la COMPÉTENCE ──────────────────
-- Piège 7 : « le statut se pose sur LA COMPÉTENCE, et son état vit par élève ».
-- Son domicile d'état est `competences_niveaux`, clé (élève × compétence), et
-- « aucune liste de compétences n'est tenue ici » : PAS DE SECONDE SOURCE que
-- les lignes recopieraient. Comment une valeur posée une fois se retrouve sur
-- chaque ligne « t'appartient » — forme retenue : cette fonction, qui écrit la
-- valeur sur toutes les lignes des élèves inscrits, et les crée au besoin.
-- ⚠️ Elle n'ouvre AUCUNE porte : les deux planchers mécaniques (fiche absente →
-- `differee` ; correspondance absente → pas `evaluee`) sont vérifiés ici, et
-- les TROIS CONDITIONS DE BANC ne le sont pas — « elles ne sont gardées par
-- aucun mécanisme : c'est le professeur qui les vérifie » (`03-` §9, piège 6).
create or replace function public.poser_statut_recette(
  p_competence text, p_statut text, p_pose_le timestamptz default now())
returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if p_competence not in ('expression','argumentation','structure','connaissance',
                          'synthese','questionnement') then
    raise exception 'Compétence inconnue : % (07- §1.2 — les six identifiants nus).', p_competence
      using errcode = 'check_violation';
  end if;
  if p_statut not in ('evaluee','mesuree_silencieusement','differee') then
    raise exception 'Statut inconnu : % (01- §3).', p_statut using errcode = 'check_violation';
  end if;

  -- Plancher 1 — fiche non déposée → `differee`, « et ne peut pas être autre
  -- chose » (`01-` §3 ; `03-` §9).
  if p_statut <> 'differee'
     and not exists (select 1 from competences_fiches f where f.competence = p_competence) then
    raise exception 'Plancher 03- §9 : la fiche de % n''est pas déposée — elle est differee et ne peut pas être autre chose.',
      p_competence using errcode = 'check_violation';
  end if;

  -- Plancher 2 — correspondance absente → non déclarable `evaluee`
  -- (`competences/monitoring.md` §4).
  if p_statut = 'evaluee'
     and not exists (select 1 from competences_correspondance c where c.competence = p_competence) then
    raise exception 'Plancher competences/monitoring.md §4 : la correspondance de % n''est pas en base — non déclarable evaluee.',
      p_competence using errcode = 'check_violation';
  end if;

  -- L'état vit par élève : on écrit sur les lignes des inscrits, et on crée
  -- celles qui manquent. La date part dans le même geste.
  insert into competences_niveaux (eleve_id, competence, statut_recette, statut_recette_pose_le)
  select distinct i.eleve_id, p_competence, p_statut, p_pose_le
    from inscriptions i
   where i.statut = 'active'
  on conflict (eleve_id, competence) do update
    set statut_recette = excluded.statut_recette,
        statut_recette_pose_le = excluded.statut_recette_pose_le,
        updated_at = now();
  get diagnostics n = row_count;

  -- L'activation par classe EN DÉCOULE, SANS SECOND GESTE (§1.3 ; piège 7) :
  -- une compétence déclarée `evaluee` l'est POUR TOUTES LES CLASSES ; le seul
  -- choix du professeur est un OPT-OUT, posé au profil de la classe.
  -- Le défaut est ACTIF ; un opt-out déjà posé n'est jamais réécrit ici.
  if p_statut = 'evaluee' then
    insert into competences_actives_par_classe (classe_id, competence, active)
    select c.id, p_competence, true from classes c
    on conflict (classe_id, competence) do nothing;
  end if;

  return n;
end $fn$;
comment on function public.poser_statut_recette(text, text, timestamptz) is
  'Le seul chemin par lequel un statut de recette se pose (07- §1.3, §2 C4-L8). '
  'Vérifie les DEUX planchers mécaniques, jamais les trois conditions de banc (03- §9). '
  'Écrit la date dans le même geste et ouvre l''activation par classe, opt-out préservé.';

-- ── A.5 L'opt-out de classe ─────────────────────────────────────────────────
-- `competences_actives_par_classe` existe (C4-L1), clé (classe × compétence),
-- `active` à `true` par défaut. Ce lot ne la crée pas : il la FAIT EXISTER
-- depuis le statut et l'opt-out. « Aucune liste d'activation à cocher classe
-- par classe, aucune ligne à la main » (piège 7).
comment on table competences_actives_par_classe is
  'Quelle compétence est active dans quel cours (07- §1.3). Ne se remplit pas à la main : '
  'une compétence evaluee l''est pour TOUTES les classes, et cette table enregistre l''OPT-OUT '
  'que le professeur pose au profil de la classe, au tableau de pilotage. Le routeur la LIT (01- §3).';
comment on column competences_actives_par_classe.active is
  'true = le défaut. false = l''opt-out — la compétence que ce cours ne travaille pas.';

-- ── A.6 Le Monitoring — sa ligne, et rien de plus ───────────────────────────
-- Piège 4 : sa fiche se dépose comme les autres, mais il n'a NI correspondance
-- NI banc ; son statut vaut POUR SES DEUX SOUS-DIMENSIONS À LA FOIS et s'écrit
-- dans `monitoring_niveaux.statut_recette`, pas dans `competences_niveaux`.
-- « Le passer à `evaluee` demande une confirmation, PRÉCÉDÉE D'UN
-- AVERTISSEMENT » — l'instrument n'a pas de banc avant l'année qui le sert.
-- L'avertissement et la confirmation sont un geste d'ÉCRAN : rien en base ne
-- peut les porter, et rien d'autre ne pose ce statut.
create or replace function public.poser_statut_recette_monitoring(
  p_statut text, p_pose_le timestamptz default now())
returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if p_statut not in ('evaluee','mesuree_silencieusement','differee') then
    raise exception 'Statut inconnu : % (01- §3).', p_statut using errcode = 'check_violation';
  end if;
  if p_statut <> 'differee'
     and not exists (select 1 from competences_fiches f where f.competence = 'monitoring') then
    raise exception 'Plancher 03- §9 : la fiche du Monitoring n''est pas déposée.'
      using errcode = 'check_violation';
  end if;
  -- Aucun plancher de correspondance : « elle n'a pas de correspondance »
  -- (competences/monitoring.md §4). Le statut vaut pour LES DEUX sous-dimensions.
  insert into monitoring_niveaux (eleve_id, sous_dimension, statut_recette)
  select distinct i.eleve_id, sd, p_statut
    from inscriptions i
   cross join (values ('calibration_confiance'),('lucidite_incompris')) as s(sd)
   where i.statut = 'active'
  on conflict (eleve_id, sous_dimension) do update
    set statut_recette = excluded.statut_recette, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $fn$;
comment on function public.poser_statut_recette_monitoring(text, timestamptz) is
  'Le statut du Monitoring, UNE LIGNE À L''ÉCRAN pour ses deux sous-dimensions (07- §1.4, piège 4). '
  'L''AVERTISSEMENT et la CONFIRMATION avant `evaluee` sont un geste d''écran ; rien d''autre ne le pose. '
  'p_pose_le est accepté pour la symétrie mais n''est écrit nulle part : le §1.4 ne nomme aucune date, '
  'et la date du §1.3 n''a de lecteur que le recalcul de la lettre, que le Monitoring n''a pas.';

-- ════════════════════════════════════════════════════════════════════════════
-- B. LE DÉPÔT DU CORPUS — le fichier, ses cinq banques, la file
-- ════════════════════════════════════════════════════════════════════════════

-- ── B.1 `exercices_imports` — un dépôt de fichier, et son rapport ────────────
-- « Les trois verdicts arrivent au même endroit : LE RAPPORT D'IMPORT, à
-- l'écran du dépôt du corpus. Aucun canal neuf » (`08-` §7 ; piège 21).
-- « L'import rend le compte de ce qu'il a IGNORÉ, banque par banque » (`08-` §1 ;
-- piège 11) — une entrée ignorée ressemble à une entrée importée.
create table if not exists exercices_imports (
  id           uuid primary key default gen_random_uuid(),
  nom_fichier  text not null,
  format       text,                -- ce que le fichier déclarait
  version      text,
  genere_le    text,                -- « ne servent qu'à la trace — aucune table
  genere_par   text,                --   ne les reçoit » : ici, la trace même
  verdict      text not null check (verdict in ('importable','refuse')),
  rapport      jsonb not null,      -- refus · blocages · signalements · ignorés
  depose_par   uuid references profiles(id) on delete set null,
  depose_at    timestamptz not null default now()
);
create index if not exists idx_imports_at on exercices_imports(depose_at desc);
comment on table exercices_imports is
  'Un dépôt de fichier d''import et son rapport (08- §7). verdict `refuse` = refus SEC du fichier entier — '
  'le n° 1 (format ou version majeure inconnus) et le n° 2 à la racine ; partout ailleurs le refus est PAR ENTRÉE.';

-- ── B.2 `exercices_textes` — l'identité d'import d'un texte du Scriptorium ───
-- ⚠️ AUCUNE COLONNE `contenu` : le texte vit dans
-- `scriptorium_contenus.texte_extrait` — « les textes d'auteur vivent dans
-- Scriptorium » (`02-` §6 B) —, et cette table porte son EMPREINTE.
-- « L'empreinte est celle du contenu exact, OCTET POUR OCTET — aucune
-- normalisation, ni au stockage, ni à l'empreinte » (piège 13).
create table if not exists exercices_textes (
  id           uuid primary key default gen_random_uuid(),
  -- « L'`id` d'import n'est pas la clé de la plateforme : conserve-le sur la
  -- ligne, sans quoi ni le second dépôt ni le renvoi d'un fichier ultérieur ne
  -- retrouvent l'entrée » (piège 11). Unique : l'idempotence de l'import.
  id_import    text not null unique,
  import_id    uuid references exercices_imports(id) on delete set null,
  contenu_id   uuid not null references scriptorium_contenus(id) on delete restrict,
  reference_id uuid references exercices_references(id) on delete restrict,
  auteur       text not null,
  titre        text not null,
  -- « la localisation dans l'œuvre — livre, partie, page, édition ; TEXTE LIBRE,
  -- aucune structure imposée » (`08-` §2). « `reference` se LIT,
  -- `plan_de_lecture` se COMPARE : deux champs, deux usages » (piège 16).
  reference    text not null,
  empreinte    text not null unique check (empreinte ~ '^[0-9a-f]{64}$'),
  -- LE RATTACHEMENT AU COURS — trois états (`08-` §2 ; `02-` §6 B ; `01-` §4).
  -- ⚠️ L'ABSENCE A UN SENS FORT : « elle ne dit pas "pas encore rempli", elle
  -- dit "JAMAIS SERVI" ». D'où un état explicite, jamais un NULL muet.
  cours_etat   text not null default 'aucun'
                 check (cours_etat in ('generique','liste','aucun')),
  -- LE PLAN DE LECTURE — le couple { livre, semaine }, JAMAIS la semaine seule
  -- (piège 16). La semaine est l'ORDINAL DE DÉCOUPAGE DU LIVRE,
  -- `scriptorium_documents.semaine`, la même échelle que
  -- `aletheia_travaux.semaine_index`, comparée PAR ÉGALITÉ.
  plan_livre_declare  text,          -- le livre tel que le FICHIER le nomme
  plan_livre_id       uuid references aletheia_livre_reference(id) on delete set null,
  plan_semaine        int check (plan_semaine is null or plan_semaine >= 0),
  statut       text not null default 'a_valider'
                 check (statut in ('a_valider','valide','retire')),
  bloque       boolean not null default false,
  blocages     jsonb  not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Le couple, jamais la semaine seule : les deux ensemble, ou aucun des deux.
  constraint textes_plan_couple_chk check (
    (plan_livre_declare is null and plan_semaine is null)
    or (plan_livre_declare is not null and plan_semaine is not null)),
  -- Tant que l'appariement à un livre de la plateforme n'est pas fait, le texte
  -- se tient pour NON SERVABLE — le même sens fort que l'absence de cours
  -- (`08-` §2 ; piège 16). L'état se LIT, il ne se stocke pas deux fois.
  constraint textes_valide_apparie_chk check (
    statut <> 'valide' or plan_livre_declare is null or plan_livre_id is not null)
);
create index if not exists idx_textes_statut on exercices_textes(statut);
create index if not exists idx_textes_contenu on exercices_textes(contenu_id);
comment on table exercices_textes is
  'L''identité d''import, l''empreinte et le rattachement d''un texte d''auteur. LE TEXTE LUI-MÊME '
  'vit dans scriptorium_contenus.texte_extrait : un texte importé entre au corpus du Scriptorium '
  '(02- §6 B ; 07- §1.1 ; piège 13). Aucune seconde copie — deux domiciles divergent.';
comment on column exercices_textes.empreinte is
  'sha256 hex du CONTENU EXACT, octet pour octet, AUCUNE NORMALISATION (piège 13). '
  'Une espace insécable, un trim, une normalisation de guillemets décalent tous les intervalles '
  'de la décomposition. Deux textes qui ne diffèrent que d''une espace sont DEUX TEXTES ; '
  'une ressemblance peut se signaler, elle ne fait jamais identité.';
comment on column exercices_textes.cours_etat is
  'generique = servable en tout temps · liste = servable dès qu''AU MOINS UN cours a été en partie vu · '
  'aucun = JAMAIS SERVABLE. L''absence a un sens fort : « elle ne dit pas "pas encore rempli", '
  'elle dit "jamais servi" » (08- §2).';

-- Les cours rattachés — « une entrée de `scriptorium_contenus` de `type`
-- `cours` » (§1.1). L'import ne vérifie que la FORME : « il ne peut pas savoir
-- qu'un cours existe — l'appariement se fait à l'écran du dépôt » (piège 15).
-- D'où le couple : ce que le fichier a DÉCLARÉ, et ce à quoi on l'a APPARIÉ.
create table if not exists exercices_textes_cours (
  texte_id        uuid not null references exercices_textes(id) on delete cascade,
  cours_declare   text not null,
  cours_id        uuid references scriptorium_contenus(id) on delete set null,
  primary key (texte_id, cours_declare)
);
comment on table exercices_textes_cours is
  'Le rattachement au cours, déclaré par le fichier puis APPARIÉ à l''écran du dépôt (08- §2, piège 15). '
  'cours_id NULL = déclaré mais pas encore apparié — la ligne agrégée des « sans rattachement » le compte.';

-- ── B.3 `exercices_sujets` — la banque de sujets ─────────────────────────────
-- `08-` §3 ; `02-` §6 B.2 : « `sujet` ouvre une banque de sujets déposés
-- préalablement ; le professeur peut aussi en renseigner un à la création ».
-- Le §1 ne la nomme pas : « la donnée doit exister, nommée, avec son identité
-- stable ; sa table t'appartient » (piège 3).
create table if not exists exercices_sujets (
  id         uuid primary key default gen_random_uuid(),
  id_import  text unique,                 -- NULL quand le sujet est saisi à l'écran
  import_id  uuid references exercices_imports(id) on delete set null,
  enonce     text not null,
  -- « `forme` prend LES VALEURS DU `genre` […] et le parcours se lit dans le
  -- nom. La `forme` N'EST PAS le `genre` de l'instance et n'a pas à lui
  -- correspondre » (piège 17 ; `08-` §3).
  forme      text not null check (forme in
    ('dissertation_tc','explication_texte_tc','interpretation_hlp','essai_hlp')),
  -- « une liste de mots QU'AUCUNE RÈGLE NE LIT — elle sert au professeur qui
  -- cherche » (piège 17). L'un aide à trouver, l'autre autorise à servir.
  notions    text[] not null default '{}',
  texte_id   uuid references exercices_textes(id) on delete restrict,
  cours_etat text not null default 'aucun' check (cours_etat in ('generique','liste','aucun')),
  statut     text not null default 'a_valider' check (statut in ('a_valider','valide','retire')),
  bloque     boolean not null default false,
  blocages   jsonb  not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sujets_statut on exercices_sujets(statut);
comment on table exercices_sujets is
  'La banque de sujets (08- §3 ; 02- §6 B.2). Une donnée que le 07- §1 ne nomme pas : sa table appartient '
  'à la session, son identité stable non (piège 3). id_import NULL = sujet saisi à la conception.';

create table if not exists exercices_sujets_cours (
  sujet_id      uuid not null references exercices_sujets(id) on delete cascade,
  cours_declare text not null,
  cours_id      uuid references scriptorium_contenus(id) on delete set null,
  primary key (sujet_id, cours_declare)
);

-- ── B.4 `exercices_materiaux` — la banque de matériaux fabriqués ─────────────
-- `08-` §4 ; `02-` §6, principes : « le matériau `genere` et les `texte_auteur`
-- vivent dans la banque ».
-- « Le CRAN est sur l'instance, pas sur le matériau : c'est toute la raison de
-- cette banque » — un matériau, six instances possibles (piège 18).
create table if not exists exercices_materiaux (
  id          uuid primary key default gen_random_uuid(),
  id_import   text unique,
  import_id   uuid references exercices_imports(id) on delete set null,
  type_id     uuid not null references exercices_types(id) on delete restrict,
  objet_code  text not null,
  support     text not null check (support in ('mot','phrase','extrait','texte')),
  contenu     text not null,          -- le texte fabriqué, tel que l'élève le lit
  observable_code       text not null,
  observable_competence text not null check (observable_competence in
    ('expression','argumentation','structure','connaissance','synthese','questionnement')),
  -- ⚠️ « Le `defaut` d'un matériau n'est pas toujours un défaut : une réussite
  -- calibrée s'injecte de la même façon » (`02-` §2.3.1 a ; piège 18). Le champ
  -- garde le nom que le `02-` lui donne — LE MATÉRIAU CALIBRÉ.
  defaut      text not null,
  version_corrigee text,              -- « le même matériau SANS le défaut »
  -- « un matériau de `restituer` ne sert pas en `composer` » (piège 18).
  mode        text not null check (mode in
    ('composer','restituer','expliquer','évaluer','interroger')),
  famille     text,                   -- libellé libre : par lui les deux cas d'une paire s'apparient
  statut      text not null default 'a_valider' check (statut in ('a_valider','valide','retire')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_materiaux_recherche
  on exercices_materiaux(objet_code, mode, observable_competence, observable_code);
create index if not exists idx_materiaux_famille on exercices_materiaux(famille) where famille is not null;
comment on table exercices_materiaux is
  'La banque de matériaux fabriqués (08- §4). NI cran, NI provenance (elle vaut `genere`), NI consigne, '
  'NI distracteur : « le cran est sur l''instance, pas sur le matériau ». Une donnée que le 07- §1 ne nomme '
  'pas : sa table appartient à la session (piège 3).';

-- ── B.5 Les démonstrations — l'identité d'import et la file ─────────────────
-- La table existe (C4-L1), « posée sans aucun champ d'engendrement » : « le
-- générateur n'en produit aucune » (piège 20). Elle entre par le fichier
-- d'import, en cinquième banque, et attend en file comme le reste.
alter table exercices_demonstrations add column if not exists id_import text;
alter table exercices_demonstrations add column if not exists import_id uuid
  references exercices_imports(id) on delete set null;
alter table exercices_demonstrations add column if not exists statut text
  not null default 'a_valider';
alter table exercices_demonstrations add column if not exists signalements jsonb
  not null default '[]'::jsonb;
alter table exercices_demonstrations drop constraint if exists demonstrations_statut_chk;
alter table exercices_demonstrations add constraint demonstrations_statut_chk
  check (statut in ('a_valider','valide','retire'));
create unique index if not exists uk_demonstrations_id_import
  on exercices_demonstrations(id_import) where id_import is not null;
comment on column exercices_demonstrations.signalements is
  'Une forme inattendue pour son grain est SIGNALÉE, JAMAIS REFUSÉE : l''appariement du 06- §2 '
  '(exemple au micro, modelage au meso, checklist au macro) « décrit une progression qui déborde '
  'l''appariement, et la règle se discute au 06- » (08- §5 bis ; piège 20).';

-- ════════════════════════════════════════════════════════════════════════════
-- C. L'INSTANCE — l'appui par cas, l'observable isolé, les renvois, la file
-- ════════════════════════════════════════════════════════════════════════════

-- ── C.1 Ce que la conception élit et que C4-L1 n'a pas encore ───────────────
alter table exercices add column if not exists id_import text;
alter table exercices add column if not exists import_id uuid
  references exercices_imports(id) on delete set null;
create unique index if not exists uk_exercices_id_import
  on exercices(id_import) where id_import is not null;

-- L'observable que le cran ISOLE — « aux crans qui isolent, l'exercice nomme le
-- `defaut` qu'il injecte ET L'OBSERVABLE que ce défaut isole. Il ne déclare pas
-- un potentiel : il déclare la valeur » (`02-` §2.3.2). Il vient DE LA ROUTE,
-- jamais de la saisie (`04-` §0 ; `02-` §6 B.1), et c'est lui qui remplit
-- `couverture_observables` « sans une saisie de plus ».
alter table exercices add column if not exists observable_isole_code text;
alter table exercices add column if not exists observable_isole_competence text;
alter table exercices drop constraint if exists exercices_observable_isole_chk;
alter table exercices add constraint exercices_observable_isole_chk check (
  (observable_isole_code is null) = (observable_isole_competence is null));
comment on column exercices.observable_isole_code is
  'L''observable que le cran isole — aux six crans qui isolent (1,3,4,5,7,9), null aux trois de '
  'production (2,6,8). Il vient de la ROUTE, pas de la saisie : « la réécriture porte sur la '
  'formulation, JAMAIS sur l''observable » (02- §6 B.1 ; 04- §0).';

-- Le `guide` — aux crans 2 et 6, `null` aux sept autres (`08-` §5 ; `02-` §2.3.4).
-- « Le guide n'est pas le retour : il est servi AVANT la v1, le retour vient
-- après. » Il n'est pas par cas : les crans de production n'ont qu'un cas.
alter table exercices add column if not exists guide text;
comment on column exercices.guide is
  'Le texte du guide servi AVANT la v1 — complet au cran 2, léger au cran 6, rien au 8 '
  '(02- §2.3.4). « Le guide n''est pas le retour » : deux moments, deux objets.';

-- Les renvois des deux matériaux — `08-` §5.1 : chaque provenance appelle le
-- sien. `localisation` et `englobant` sont deux INTERVALLES DE CARACTÈRES dans
-- le `contenu` du texte, bornes en base 0, fin exclue — le même système de
-- coordonnées que la référence décomposée.
alter table exercices add column if not exists materiau_source_texte_id uuid
  references exercices_textes(id) on delete restrict;
alter table exercices add column if not exists materiau_source_sujet_id uuid
  references exercices_sujets(id) on delete restrict;
alter table exercices add column if not exists materiau_source_localisation int[];
alter table exercices add column if not exists materiau_source_englobant int[];
alter table exercices add column if not exists materiau_cible_texte_id uuid
  references exercices_textes(id) on delete restrict;
alter table exercices add column if not exists materiau_cible_sujet_id uuid
  references exercices_sujets(id) on delete restrict;
alter table exercices add column if not exists materiau_cible_localisation int[];
alter table exercices add column if not exists materiau_cible_englobant int[];
alter table exercices drop constraint if exists exercices_intervalles_chk;
alter table exercices add constraint exercices_intervalles_chk check (
      (materiau_source_localisation is null or array_length(materiau_source_localisation,1) = 2)
  and (materiau_source_englobant    is null or array_length(materiau_source_englobant,1) = 2)
  and (materiau_cible_localisation  is null or array_length(materiau_cible_localisation,1) = 2)
  and (materiau_cible_englobant     is null or array_length(materiau_cible_englobant,1) = 2));
comment on column exercices.materiau_source_englobant is
  'La portion AFFICHÉE autour de la sélection. « C''est l''englobant que la règle de non-emboîtement '
  'lit » (02- §2.3.3), et il est OBLIGATOIRE ET NON VIDE sur l''objet `phrase`, dont la règle '
  'd''instance exige le co-texte (04- §11 ; refus n° 16).';

-- La file de validation — ce qui bloque, ce qui se signale.
-- « Une entrée BLOQUÉE ne se valide pas tant qu'elle l'est » (`08-` §7 ; piège 24).
alter table exercices add column if not exists bloque boolean not null default false;
alter table exercices add column if not exists blocages jsonb not null default '[]'::jsonb;
alter table exercices add column if not exists signalements jsonb not null default '[]'::jsonb;
comment on column exercices.bloque is
  'BLOCAGE (08- §7.2) : l''entrée EST ENTRÉE, mais le professeur ne peut pas la valider tant qu''il '
  'n''a pas tranché. « La validation en masse ne passe JAMAIS une entrée bloquée » (le « fait quand »).';

-- ── C.2 `exercices_cas` — L'APPUI EN CLAIR SUR L'INSTANCE, PAR CAS ──────────
-- §1.1 : « l'appui — le `defaut`, les `distracteurs`, la `reponse_attendue`, le
-- `guide` —, PAR CAS. Le cran dit LESQUELS EXISTENT ; ce qu'ils contiennent est
-- saisi à la conception et VIT EN CLAIR SUR L'INSTANCE, jamais noyé dans la
-- consigne. »
-- « La paire de diagnostic est UNE ligne, et elle porte DEUX CAS » : la
-- `consigne_instanciee` en déclare deux, dans l'ordre (C4-L1, `exercices_paire_chk`).
-- Cette table porte l'appui parallèle, cas par cas.
create table if not exists exercices_cas (
  exercice_id      uuid not null references exercices(id) on delete cascade,
  ordre            int  not null check (ordre in (1,2)),
  -- « le matériau est nommé PAR LE CAS » quand la provenance vaut `genere`
  -- (`08-` §5.1 et §5.2).
  materiau_id      uuid references exercices_materiaux(id) on delete restrict,
  defaut           text,      -- aux six crans qui isolent
  distracteurs     jsonb,     -- LA BANQUE, aux crans 1 et 3 — trois au minimum
  reponse_attendue text,      -- aux crans 1, 3, 4 et 5
  created_at       timestamptz not null default now(),
  primary key (exercice_id, ordre),
  constraint cas_distracteurs_forme_chk check (
    distracteurs is null or jsonb_typeof(distracteurs) = 'array')
);
comment on table exercices_cas is
  'L''appui de l''instance, PAR CAS (07- §1.1). Un cas aux six crans qui n''isolent pas par paires ; '
  'DEUX, dans l''ordre, aux trois crans de diagnostic (1, 4, 9) — « un premier cas traité sur '
  'indication, puis un cas neuf de la même famille » (02- §2.3.1 a). LA PAIRE EST UN SEUL EXERCICE.';
comment on column exercices_cas.distracteurs is
  'LA BANQUE de candidats faux de l''exercice — trois au MINIMUM (refus n° 13), dix à quinze EN CIBLE '
  '(signalement). « L''instance y tire les trois candidats faux que l''élève départage avec la '
  'reponse_attendue » : l''écran sert QUATRE candidats, jamais quinze (02- §5 ; 04- §0).';

-- Garde : autant de cas que la `consigne_instanciee` déclare de consignes, et
-- deux matériaux DISTINCTS sur une paire — « un même matériau servi deux fois
-- ne mesure aucun transfert » (`08-` §5.2, refus n° 14).
create or replace function public.garde_cas_de_la_paire() returns trigger
language plpgsql as $fn$
declare v_paire boolean; v_n int; v_distincts int;
begin
  select e.paire_diagnostic into v_paire from exercices e
   where e.id = coalesce(new.exercice_id, old.exercice_id);
  select count(*), count(distinct materiau_id) into v_n, v_distincts
    from exercices_cas c where c.exercice_id = coalesce(new.exercice_id, old.exercice_id);
  if v_paire and v_n = 2 and v_distincts < 2
     and (select count(*) from exercices_cas c
           where c.exercice_id = coalesce(new.exercice_id, old.exercice_id)
             and c.materiau_id is not null) = 2 then
    raise exception 'Refus n° 14 (08- §5.2) : les deux cas d''une paire visent le même matériau — un même matériau servi deux fois ne mesure aucun transfert.'
      using errcode = 'check_violation';
  end if;
  if not v_paire and v_n > 1 then
    raise exception 'Refus n° 14 (08- §5.2) : plus d''un cas hors des trois crans de diagnostic.'
      using errcode = 'check_violation';
  end if;
  return null;
end $fn$;
drop trigger if exists trg_cas_de_la_paire on exercices_cas;
create constraint trigger trg_cas_de_la_paire
  after insert or update or delete on exercices_cas
  deferrable initially deferred
  for each row execute function public.garde_cas_de_la_paire();

-- ── C.3 Le statut `retire` d'un dépôt ───────────────────────────────────────
-- §1.1 : « plus `abandonne`, EXCLU des règles de stagnation […] et `retire`, LE
-- RETRAIT PAR LE PROFESSEUR. Les deux ne se confondent pas : `abandonne` est un
-- non-geste de l'élève, `retire` une décision du professeur. »
-- « Le retrait reste permis TANT QUE LE DÉPÔT N'EST PAS `clos` » (§1.1 ; `06-` §5).
alter table exercices_depots drop constraint if exists exercices_depots_statut_check;
alter table exercices_depots add constraint exercices_depots_statut_check
  check (statut in ('assigne','ouvert','v1_remis','retour_publie','vf_remis','clos','abandonne','retire'));
comment on column exercices_depots.statut is
  'assigne → ouvert → v1_remis → retour_publie → vf_remis → clos, plus `abandonne` (non-geste de '
  'l''élève, exclu des règles de stagnation) et `retire` (décision du professeur, permis tant que le '
  'dépôt n''est pas clos, journalisé, hors du dénominateur d''assiduité POUR L''AVENIR SEULEMENT) — 07- §1.1.';

-- ════════════════════════════════════════════════════════════════════════════
-- D. DEUX RECTIFICATIONS DE COMMENTAIRE — « c'est le commentaire qui a tort »
-- ════════════════════════════════════════════════════════════════════════════
-- Piège 13, mot pour mot : « Le commentaire du schéma de C4-L1 dit "sha256 hex
-- du texte source normalisé" : C'EST LE COMMENTAIRE QUI A TORT, pas la règle —
-- deux textes qui ne diffèrent que d'une espace sont deux textes, et leurs
-- coordonnées restent justes ; une ressemblance peut se SIGNALER, elle ne fait
-- jamais identité. »
comment on column exercices_references.empreinte is
  'sha256 hex du CONTENU EXACT du texte source, OCTET POUR OCTET — AUCUNE NORMALISATION, ni au '
  'stockage, ni à l''empreinte (07- §1.1 ; 08- §2 ; piège 13 de C4-L8, qui rectifie le commentaire '
  'de c4_l1_schema.sql). UNIQUE : un texte ne se décompose jamais deux fois. Immuable dès validee_at '
  'renseigné (trigger garde_reference_immuable). Deux textes qui ne diffèrent que d''une espace sont '
  'DEUX TEXTES ; une ressemblance se signale, elle ne fait jamais identité.';

-- L'énuméré de `mode_saisie` — ce qu'une citation donne, et rien de plus.
-- Piège 39 : « pose ce qu'une citation te donne — `ecran` et "les types
-- manuscrits" (§1.3 ; `06-` §1) — et LAISSE VIDE ce qu'aucune section ne
-- déclare, en le signalant. Une valeur que le seed ne peut pas citer ne
-- s'invente pas. » Les valeurs restent donc NULL sur les quinze lignes, et la
-- question part au relevé : le `06-` §1 déclare le mode par (module × contexte),
-- pas par objet, et le `lieu` vit sur l'INSTANCE.
alter table exercices_types drop constraint if exists exercices_types_mode_saisie_chk;
alter table exercices_types add constraint exercices_types_mode_saisie_chk
  check (mode_saisie is null or mode_saisie in ('ecran','manuscrit'));
comment on column exercices_types.mode_saisie is
  'VIDE sur les quinze lignes, et c''est un signalement, pas un oubli (piège 39). L''énuméré vient '
  'de ce qu''une citation donne (07- §1.3 : mode_saisie_force = `ecran` ; 06- §1 : « les types '
  'manuscrits ») ; la VALEUR par objet n''est déclarée par aucune section — le 06- §1 la donne par '
  '(module × contexte), et le `lieu` vit sur l''instance.';
comment on column exercices_types.consigne_gabarit is
  'VIDE, et c''est un signalement (piège 39). C5-L1 la NOMME — « les questions engendrées depuis la '
  'consigne-gabarit du type » (07- §2) — sans en donner aucune valeur. Une valeur qu''aucune section '
  'ne peut citer ne s''invente pas.';

-- ════════════════════════════════════════════════════════════════════════════
-- E. LA RLS — patron `c1_rls_eleve.sql`, posture de C4-L1
-- ════════════════════════════════════════════════════════════════════════════
-- « Les banques — textes, sujets, matériaux, démonstrations, correspondance —
-- et la fiche déposée ne sont JAMAIS LISIBLES PAR L'ÉLÈVE EN DIRECT : ce qu'il
-- verra d'un matériau passe par SON DÉPÔT, côté serveur » (piège 40).
-- ⚠️ « La `reponse_attendue`, le `defaut` et la banque de distracteurs sont LA
-- GRILLE d'un exercice non rendu — sers à l'écran ce que l'écran doit montrer
-- (les quatre candidats), JAMAIS LA LIGNE ENTIÈRE. » `exercices_cas` ne reçoit
-- donc aucune policy élève, ni maintenant ni plus tard.
-- ⚠️ Une seule policy par table et par rôle : les policies sont OR'ées.
do $rls$
declare t text;
begin
  foreach t in array array[
    'competences_fiches','competences_correspondance','exercices_imports',
    'exercices_textes','exercices_textes_cours','exercices_sujets',
    'exercices_sujets_cours','exercices_materiaux','exercices_cas'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_prof_all', t);
    execute format($p$create policy %I on %I for all
        using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
        with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))$p$,
      t || '_prof_all', t);
  end loop;
end $rls$;

-- Les deux fonctions sont `security definer` : elles écrivent l'état de TOUS
-- les élèves depuis un geste du professeur. On ferme l'exécution au rôle prof.
revoke all on function public.poser_statut_recette(text, text, timestamptz) from public;
revoke all on function public.poser_statut_recette_monitoring(text, timestamptz) from public;
grant execute on function public.poser_statut_recette(text, text, timestamptz) to service_role;
grant execute on function public.poser_statut_recette_monitoring(text, timestamptz) to service_role;

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION — à jouer telle quelle
-- ============================================================================
-- select
--   (select count(*) from information_schema.tables where table_schema='public' and table_name in
--     ('competences_fiches','competences_correspondance','exercices_imports','exercices_textes',
--      'exercices_textes_cours','exercices_sujets','exercices_sujets_cours','exercices_materiaux',
--      'exercices_cas')) as tables_neuves,                                        -- 9
--   (select count(*) from information_schema.columns where table_schema='public'
--      and table_name='competences_niveaux' and column_name='statut_recette_pose_le') as date_du_statut,  -- 1
--   (select count(*) from information_schema.columns where table_schema='public'
--      and table_name='exercices' and column_name in ('id_import','guide','observable_isole_code',
--      'observable_isole_competence','bloque','blocages','signalements','materiau_source_texte_id',
--      'materiau_source_sujet_id','materiau_source_localisation','materiau_source_englobant',
--      'materiau_cible_texte_id','materiau_cible_sujet_id','materiau_cible_localisation',
--      'materiau_cible_englobant','import_id')) as colonnes_sur_exercices,          -- 16
--   (select pg_get_constraintdef(oid) from pg_constraint
--      where conname='exercices_depots_statut_check') as statut_depot;             -- doit contenir 'retire'
--
-- Les deux planchers mécaniques, éprouvés :
--   select poser_statut_recette('expression','evaluee');   -- doit ÉCHOUER (fiche absente)
-- Les trois interrupteurs du 07- :
--   select exercices_actif, routeur_actif, competences_affichage_actif, fabrique_actif
--     from scriptorium_params;                                                     -- tous false
-- ============================================================================

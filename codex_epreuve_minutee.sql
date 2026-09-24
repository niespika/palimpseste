-- ============================================================================
-- CODEX — L'ÉPREUVE À SUJET LIBRE, PROJETÉE, MINUTÉE. 2026-09-24.
-- Demande de Louis pour l'examen 1HLP du mardi 29/09 : « pouvoir écrire un sujet
-- libre » ; « que ce sujet (et les consignes) puisse être projeté à l'écran » ;
-- « spécifier le temps que dure l'examen » ; « il faut que le dépôt soit possible
-- à partir de la moitié de l'épreuve, de manière automatique » ; « l'épreuve dure
-- X min, mais la relecture dure un temps aussi, qui n'est plus un temps où l'élève
-- écrit. Le prof doit spécifier tout ça dans la préparation de l'épreuve. »
-- Patron : `quazian_antichambre.sql`, `calendrier_agenda_classe.sql`.
-- ----------------------------------------------------------------------------
-- SIX gestes, tous additifs, toutes colonnes nullables ou à défaut :
--   1. la porte `scriptorium_params.epreuve_minutee_actif`, à OFF ;
--   2. `exercices.epreuve_redaction_min` : la durée de RÉDACTION (X), en minutes ;
--   3. `exercices.epreuve_relecture_min` : la durée de RELECTURE (Y), temps où
--      l'élève n'écrit plus — il photographie, puis se relit ;
--   4. `exercices.epreuve_debut_at` : l'instant où le professeur a LANCÉ l'épreuve
--      (un clic : aucune heure de cours n'est stockée en base). Il fait foi pour le
--      minuteur projeté ET pour l'ouverture automatique du dépôt à X/2 ;
--   5. `exercices.consignes_pratiques` : les consignes PRATIQUES, projetées et
--      montrées à l'élève, mais JAMAIS envoyées au juge — le juge reçoit
--      `consigne_instanciee` (sujet + consignes de travail) et elle seule
--      (décision de Louis, 24/09 : « à moi de voir ce qui va où ») ;
--   6. `exercices.epreuve_ouverture_at` : l'instant de l'ouverture AUTOMATIQUE du
--      dépôt, posé AU LANCEMENT (moitié de la rédaction, arrondie à la minute
--      pleine supérieure) et jamais recalculé ensuite — un « +5 min » prolonge la
--      fin, il ne déplace pas une heure déjà annoncée à la classe (revue du 24/09).
--
-- ⛔ NOMS TENUS LOIN de `duree_redaction_min` et de `duree_exercice_min` : le
--    premier est un attribut que le `07-` §1.1 exclut nommément (contrôle du
--    socle, `c4_l1_schema.sql`), le second est la durée du BUDGET, dérivée et
--    jamais saisie. Aucune colonne `note` (contrôle `ni_famille_ni_note`).
-- ⛔ Aucune policy touchée : `exercices` n'a que `exercices_prof_all`, et l'élève
--    lit ses passations par le serveur (client admin, garde dans le code).
--
-- Le code lit la porte par `lireLesReglages` (tolérant : colonne absente ⇒ OFF)
-- et ne lit les colonnes neuves QUE porte ouverte : il peut partir avant ce
-- fichier. Porte fermée, la conception et la passation sont celles d'hier.
-- Rollback : `codex_epreuve_minutee_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from exercices) as exercices_avant,
  (select count(*) from exercices where lieu = 'classe') as passations_classe_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'epreuve_minutee_actif') as porte_deja_posee,
  (select count(*) from information_schema.columns
     where table_name = 'exercices' and column_name in
       ('epreuve_redaction_min', 'epreuve_relecture_min', 'epreuve_debut_at', 'epreuve_ouverture_at',
        'consignes_pratiques'))
     as colonnes_deja_posees;

begin;

alter table scriptorium_params
  add column if not exists epreuve_minutee_actif boolean not null default false;

alter table exercices
  add column if not exists epreuve_redaction_min integer,
  add column if not exists epreuve_relecture_min integer,
  add column if not exists epreuve_debut_at timestamptz,
  add column if not exists epreuve_ouverture_at timestamptz,
  add column if not exists consignes_pratiques text;

alter table exercices drop constraint if exists exercices_epreuve_chk;
alter table exercices add constraint exercices_epreuve_chk check (
  (epreuve_redaction_min is null or epreuve_redaction_min between 5 and 300)
  and (epreuve_relecture_min is null or epreuve_relecture_min between 0 and 120)
  -- Une épreuve lancée a une durée : sans elle, ni minuteur ni ouverture automatique.
  and (epreuve_debut_at is null or epreuve_redaction_min is not null)
  -- Le lancement et l'heure d'ouverture se posent (et s'annulent) ENSEMBLE.
  and ((epreuve_debut_at is null) = (epreuve_ouverture_at is null))
  and (consignes_pratiques is null or char_length(consignes_pratiques) <= 2000)
);

comment on column scriptorium_params.epreuve_minutee_actif is
  'Codex — l''épreuve minutée (24/09) : sujet libre, consignes pratiques, durées, projection, lancement, dépôt automatique à la moitié du temps de rédaction.';
comment on column exercices.epreuve_redaction_min is
  'Durée de RÉDACTION (min) d''une passation en classe. Le dépôt s''ouvre seul à la moitié. Lu seulement porte epreuve_minutee_actif ouverte.';
comment on column exercices.epreuve_relecture_min is
  'Durée de RELECTURE (min), après la rédaction : l''élève photographie puis se relit. Rien ne se ferme à son terme (clôture = geste du professeur).';
comment on column exercices.epreuve_debut_at is
  'Instant où le professeur a lancé l''épreuve (clic sur la page projetée). Fait foi pour le minuteur et pour l''ouverture automatique du dépôt.';
comment on column exercices.epreuve_ouverture_at is
  'Instant de l''ouverture automatique du dépôt, posé au lancement (moitié de la rédaction, à la minute pleine supérieure). Jamais recalculé.';
comment on column exercices.consignes_pratiques is
  'Consignes PRATIQUES : projetées et montrées à l''élève, JAMAIS envoyées au juge (qui reçoit consigne_instanciee seule).';

commit;

-- constat de pied : la porte, les cinq colonnes, la contrainte, et les témoins
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'epreuve_minutee_actif'
              and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false') as porte_posee,
  not exists (select 1 from scriptorium_params where epreuve_minutee_actif) as porte_a_off,
  (select count(*) from information_schema.columns
     where table_name = 'exercices' and is_nullable = 'YES' and column_name in
       ('epreuve_redaction_min', 'epreuve_relecture_min', 'epreuve_debut_at', 'epreuve_ouverture_at',
        'consignes_pratiques'))
     as colonnes_posees,                                                                 -- attendu 5
  exists (select 1 from pg_constraint where conname = 'exercices_epreuve_chk') as contrainte_posee,
  (select count(*) from exercices where epreuve_redaction_min is not null
     or epreuve_debut_at is not null or consignes_pratiques is not null) as epreuves,  -- attendu 0
  (select count(*) from exercices) as exercices_intacts,
  (select count(*) from exercices where lieu = 'classe') as passations_classe_intactes,
  (select count(*) from scriptorium_params) as params_intacts;

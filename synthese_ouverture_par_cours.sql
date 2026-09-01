-- ============================================================================
-- LA SYNTHÈSE DE FIN DE COURS DEVIENT UN GESTE — coupée par défaut, ouverte
-- cours par cours, DANS L'INSTANCE DE CHAQUE CLASSE.
-- ----------------------------------------------------------------------------
-- ⭐ POURQUOI. « J'ai deux synthèses qui arrivent aujourd'hui et demain, mais je
--    veux mettre l'exercice en pause. Il me faudrait un bouton pour déclencher
--    la création des synthèses uniquement quand je veux, et pas de manière
--    automatique à la fin d'un cours » (Louis, 01/09). Précision du même jour :
--    « par instance de parcours par classe — dans l'instance du parcours d'une
--    classe, juste à côté du dernier chapitre d'un cours, je peux couper ou
--    ouvrir la synthèse. »
--
-- ⭐ CE QUI L'EMPÊCHAIT. `utils/plan-synthese-hooks.ts` (§5.4-S3) crée une ligne
--    `type_exercice = 'synthese'` DÈS QU'un cours entre dans le parcours d'une
--    classe qui a un plan vivant — à l'ajout d'un créneau, à l'assignation d'une
--    classe, au back-fill d'un plan. Le seul interrupteur au-dessus était
--    `plan_evaluation_actif`, qui éteint TOUT le plan d'évaluation. Il n'existait
--    aucune maille intermédiaire : c'est cette table qui la pose.
--
-- ⭐ LA FORME, ET POURQUOI ELLE VIT SUR L'INSTANCE. Une ligne par
--    (assignation × cours) — `scriptorium_parcours_classes.id`, pas
--    `scriptorium_parcours.id` : le même modèle de parcours sert plusieurs
--    classes, et couper la synthèse pour 1HLP ne doit rien changer à T5. C'est
--    la maille EXACTE de la synthèse elle-même, dont la semaine-cible est déjà
--    lue sur les créneaux d'INSTANCE (`plan-synthese.ts`, RAG L1).
--
-- ⚠️ LE DÉFAUT EST « COUPÉE », ET C'EST UN CHANGEMENT DE COMPORTEMENT ASSUMÉ.
--    Ligne absente ⇒ coupée ⇒ plus AUCUNE création automatique, nulle part.
--    C'est la demande, mot pour mot. Deux conséquences à connaître avant de
--    jouer le fichier :
--      · les synthèses DÉJÀ créées ne sont pas détruites — elles passent en
--        SOURDINE (retirées du « à préparer », du à-faire, du calendrier prof et
--        de la panoptique). Ouvrir le cours les fait revenir TELLES QUELLES,
--        avec leur statut et leur séance Codex si elles en avaient une ;
--      · une séance Codex déjà LANCÉE reste intouchée et le geste « couper » la
--        refuse (la synthèse a eu lieu ; ce n'est plus une intention).
--
-- ⛔ CE QUE CETTE TABLE N'EST PAS. Ce n'est pas la synthèse (elle vit dans
--    `scriptorium_exercices_planifies`), ni sa date (résolue à la lecture,
--    jamais stockée — `plan-synthese.ts`), ni un statut de conception. C'est une
--    INTENTION du professeur, et rien d'autre : « ce cours, dans cette classe,
--    se termine-t-il par une synthèse ? »
--
-- ⚠️ ORDRE DE DÉPLOIEMENT INDIFFÉRENT, et c'est voulu — mais le SENS du repli
--    n'est pas le même dans les deux ordres, il faut le savoir :
--      · SQL joué AVANT le code → la table existe, personne ne la lit : rien ne
--        change, les hooks créent encore automatiquement ;
--      · CODE poussé AVANT le SQL → la lecture échoue et retombe sur
--        « tout ouvert », c'est-à-dire EXACTEMENT le comportement d'aujourd'hui.
--        Le bouton « ouvrir / couper », lui, répond « migration pas encore jouée ».
--    Dans les deux cas la pause ne prend effet qu'une fois les deux en place.
--
-- ⚠️ MIGRATION ADDITIVE ET GATÉE : une table neuve, aucune table existante
--    touchée, aucune policy existante modifiée. Protocole NORMAL
--    (`SUIVI_SQL.md` R6) — sandbox d'abord, prod ensuite.
--
-- ⚠️ RÉPÉTITION À BLANC : copier le CORPS entre le `begin;` et le `commit;`,
--    JAMAIS le fichier entier — son `commit;` validerait la transaction d'essai
--    (`SUIVI_SQL.md`, point 6, vécu le 14/08).
--
-- Idempotent, rejouable : `create table if not exists`, `drop policy if exists`.
-- Retour arrière : `synthese_ouverture_par_cours_rollback.sql`.
-- Prérequis : `parcours_phase_a.sql` (scriptorium_parcours_classes),
--             `lot6_scriptorium.sql` (scriptorium_contenus).
-- ============================================================================

begin;

create table if not exists scriptorium_syntheses_reglages (
  parcours_classe_id uuid        not null references scriptorium_parcours_classes(id) on delete cascade,
  contenu_id         uuid        not null references scriptorium_contenus(id)         on delete cascade,
  ouverte            boolean     not null default false,
  updated_at         timestamptz not null default now(),
  primary key (parcours_classe_id, contenu_id)
);

comment on table scriptorium_syntheses_reglages is
  'Intention du professeur, par (assignation parcours×classe, cours) : ce cours se termine-t-il '
  'par une synthèse dans CETTE classe ? Ligne absente = coupée (défaut). Lue par '
  'utils/plan-synthese-ouverture.ts ; les hooks de création (plan-synthese-hooks.ts) ne créent '
  'que si ouverte, et les surfaces prof (à préparer, à-faire, calendrier, panoptique) mettent en '
  'sourdine les synthèses des cours coupés SANS les détruire.';

comment on column scriptorium_syntheses_reglages.ouverte is
  'true = la synthèse de fin de cours est voulue ici. false (ou ligne absente) = coupée : '
  'aucune création automatique, et la synthèse existante est mise en sourdine — jamais détruite.';

-- L'index de la clé primaire couvre déjà (parcours_classe_id, contenu_id) et donc
-- le préfixe (parcours_classe_id) : c'est la seule lecture en lot du module
-- (« les réglages de cette instance »). Aucun index supplémentaire.

alter table scriptorium_syntheses_reglages enable row level security;

-- Patron standard des tables du Scriptorium : prof en FOR ALL, personne d'autre.
-- L'élève ne voit jamais une synthèse non lancée (§8bis-3), il n'a donc rien à
-- lire ici. Les hooks écrivent en service role (RLS contournée).
drop policy if exists syntheses_reglages_prof_all on scriptorium_syntheses_reglages;
create policy syntheses_reglages_prof_all on scriptorium_syntheses_reglages
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

-- ── Vérification (à lire APRÈS exécution) ───────────────────────────────────
-- Attendu : table_posee = t, rls_active = t, policy_posee = t, reglages = 0
--           (la table naît vide : TOUS les cours sont donc coupés, et les
--           synthèses déjà en base passent en sourdine dès que le code est là).
-- `synthese_vivantes` compte ce qui va se taire : à relire avant/après pour
-- savoir combien de lignes la sourdine couvre.
select
  (select count(*) = 1 from information_schema.tables
     where table_name = 'scriptorium_syntheses_reglages')                     as table_posee,
  (select relrowsecurity from pg_class
     where oid = 'scriptorium_syntheses_reglages'::regclass)                  as rls_active,
  (select count(*) = 1 from pg_policies
     where tablename = 'scriptorium_syntheses_reglages'
       and policyname = 'syntheses_reglages_prof_all')                        as policy_posee,
  (select count(*) from scriptorium_syntheses_reglages)                       as reglages,
  (select count(*) from scriptorium_exercices_planifies
     where type_exercice = 'synthese' and supprime_at is null
       and statut <> 'annule')                                                as syntheses_vivantes;

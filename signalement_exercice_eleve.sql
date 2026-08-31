-- ============================================================================
-- LE SIGNALEMENT D'UN EXERCICE PAR L'ÉLÈVE — la table, et son interrupteur.
-- ----------------------------------------------------------------------------
-- ⭐ POURQUOI. « Plusieurs exercices peuvent ne pas être clairs pour les élèves
--    ou être un peu mal foutus » (demande de Louis, 31/08). L'élève coche
--    « Signaler que l'exercice a un problème », explique dans ses mots, AVANT ou
--    APRÈS le passage ; le professeur reçoit la file au Pilotage, corrige
--    l'instance ou la sort du pool, et TRANCHE l'effet sur l'assiduité.
--
-- ⛔⛔ CE QUE CETTE TABLE N'EST PAS — et la confusion coûterait cher :
--    · ce n'est PAS `exercices.signalements` (jsonb), qui porte les signalements
--      de LA FABRIQUE — « une forme inattendue pour son grain est SIGNALÉE,
--      jamais refusée » (`08-` §5 bis). Celui-là parle à l'import, à personne
--      d'autre ;
--    · ce n'est PAS `integrite_signalements`, qui parle de l'ÉLÈVE (un strike,
--      un ratissage, un aveu de non-travail). Ici c'est l'EXERCICE qui est mis
--      en cause, jamais l'élève — aucun strike, aucun compteur, aucun blocage ;
--    · ce n'est PAS la métacognition. `EcranDeroule` s'interdit de « demander à
--      l'élève de signaler ce qu'il n'a pas compris » (`02-` §5) : la lucidité
--      est spontanée et se relève ailleurs. « Cet exercice est cassé » vise
--      l'objet, pas la compréhension de celui qui le passe.
--
-- ⭐ UNE LIGNE PAR DÉPÔT, ET C'EST LA CLÉ DE TOUT L'ÉCRAN.
--    `depot_id` est UNIQUE : un élève ne signale qu'une fois le même exercice,
--    et il amende son texte plutôt que d'en empiler un second. `exercice_id` est
--    DUPLIQUÉ à dessein — il se déduirait du dépôt, mais c'est LUI qu'on groupe :
--    mesuré le 31/08 en production, **4 instances portent 86 dépôts (16, 23, 23
--    et 24 élèves sur la même)**. Un exercice cassé, c'est jusqu'à 24 lignes ici
--    et UNE SEULE à l'écran du professeur. La jointure par dépôt à chaque
--    affichage serait le chemin cher pour le cas normal.
--
-- ⚠️ L'ARBITRAGE VIT ICI, SON EFFET VIT AILLEURS. `arbitrage` dit ce que le
--    professeur a décidé ; ce qui compte pour l'assiduité reste
--    `exercices_depots.statut = 'retire'` — « un exercice retiré par le
--    professeur sort du dénominateur, MAIS POUR L'AVENIR SEULEMENT » (`06-` §5).
--    ⛔ Ne JAMAIS dériver l'assiduité de cette table : elle serait un second
--       domicile pour un état qui en a déjà un, et les deux divergeraient.
--
-- ⭐ L'INTERRUPTEUR N'EST PAS UN SEPTIÈME. Le `07-` §5 déclare CLOSE la liste des
--    six (`utils/allumage.ts`), et `signalement_exercice_actif` ne s'y ajoute
--    pas : il vit sur `scriptorium_params` au même titre que `rag_actif` et
--    `plan_evaluation_actif`, qui n'en sont pas non plus. Il se bascule DEPUIS
--    LA PAGE QUI LE CONSOMME, jamais depuis `/prof/allumage`.
--    ⚠️ À OFF par défaut (`AGENTS.md` : « toute fonctionnalité nouvelle naît
--       derrière un flag OFF »). À OFF, l'élève ne voit aucune case, et la page
--       du professeur le dit au lieu d'afficher une file vide.
--
-- ⛔ AUCUNE POLICY ÉLÈVE, ET C'EST LE PATRON DU MOTEUR. Le déroulé « écrit par
--    des routes serveur, jamais en direct depuis le client » (`app/deroule/
--    actions.ts`) : le client admin contourne la RLS et la garde est le CODE,
--    qui filtre sur `eleve_id`. Ouvrir une policy élève ici ajouterait une
--    seconde porte à surveiller pour aucun gain.
--
-- ⚠️ MIGRATION ADDITIVE ET GATÉE : une table neuve, une colonne à `default
--    false`. Elle ne réécrit aucune ligne et n'invalide rien d'existant —
--    protocole normal (`SUIVI_SQL.md` R6, § « additives et gatées »).
--
-- ⚠️ RÉPÉTITION À BLANC : copier le CORPS entre le `begin;` et le `commit;`,
--    JAMAIS le fichier entier — son `commit;` validerait la transaction d'essai
--    (`SUIVI_SQL.md`, point 6, vécu le 14/08).
--
-- Retour arrière : `signalement_exercice_eleve_rollback.sql`.
-- ============================================================================

begin;

-- ── 1. La table ────────────────────────────────────────────────────────────
create table if not exists public.exercices_signalements_eleve (
  id          uuid primary key default gen_random_uuid(),
  -- ⭐ UNIQUE : un dépôt, un signalement. L'élève amende, il n'empile pas.
  depot_id    uuid not null unique references public.exercices_depots(id) on delete cascade,
  -- Dupliqué du dépôt À DESSEIN : c'est la clé de regroupement de l'écran.
  exercice_id uuid not null references public.exercices(id) on delete cascade,
  eleve_id    uuid not null references public.profiles(id) on delete cascade,
  -- « Explique le problème dans tes mots. » Jamais vide : une case cochée sans
  -- un mot ne dit rien au professeur, et il irait chercher pour rien.
  texte       text not null constraint signalement_texte_non_vide_chk check (btrim(texte) <> ''),
  signale_at  timestamptz not null default now(),
  -- NULL tant que l'élève n'a pas repris son texte. Un instant, pas un booléen :
  -- « il a modifié » ne se relit pas, « le 2 septembre à 21 h » se relit.
  maj_at      timestamptz,
  -- ── L'arbitrage du professeur ──
  -- NULL = EN ATTENTE, et c'est l'état qui commande la file. `confirme` =
  -- l'exercice a bien un problème ; `ecarte` = il n'en a pas.
  arbitrage   text constraint signalement_arbitrage_chk
              check (arbitrage in ('confirme', 'ecarte')),
  arbitre_par uuid references public.profiles(id) on delete set null,
  arbitre_at  timestamptz,
  -- ⚠️ Un arbitrage sans date serait indatable, une date sans arbitrage serait
  --    un verdict muet : les deux vont ensemble ou aucun des deux.
  constraint signalement_arbitrage_complet_chk check (
    (arbitrage is null and arbitre_at is null)
    or (arbitrage is not null and arbitre_at is not null)
  )
);

comment on table public.exercices_signalements_eleve is
  'L''élève signale qu''un EXERCICE a un problème (demande de Louis, 31/08). Une ligne par '
  'dépôt ; on groupe par `exercice_id` — 4 instances portaient 86 dépôts en production le '
  '31/08. ⛔ Ne pas confondre avec `exercices.signalements` (la fabrique) ni avec '
  '`integrite_signalements` (l''élève). ⛔ L''effet sur l''assiduité vit sur '
  '`exercices_depots.statut = ''retire''`, jamais ici.';

comment on column public.exercices_signalements_eleve.arbitrage is
  'NULL = en attente du professeur. `confirme` = l''exercice a un problème. `ecarte` = il n''en '
  'a pas. ⚠️ La colonne DIT la décision ; elle ne la FAIT pas : le dénominateur d''assiduité se '
  'lit sur le statut du dépôt.';

create index if not exists idx_signalements_eleve_exercice
  on public.exercices_signalements_eleve(exercice_id);
create index if not exists idx_signalements_eleve_a_trancher
  on public.exercices_signalements_eleve(signale_at) where arbitrage is null;
create index if not exists idx_signalements_eleve_eleve
  on public.exercices_signalements_eleve(eleve_id);

-- ── 2. La RLS — prof seul, et rien pour l'élève ────────────────────────────
alter table public.exercices_signalements_eleve enable row level security;
drop policy if exists exercices_signalements_eleve_prof_all
  on public.exercices_signalements_eleve;
create policy exercices_signalements_eleve_prof_all
  on public.exercices_signalements_eleve
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'prof'));

-- ── 3. L'interrupteur — et ce n'est PAS un septième ────────────────────────
alter table public.scriptorium_params
  add column if not exists signalement_exercice_actif boolean not null default false;

comment on column public.scriptorium_params.signalement_exercice_actif is
  'Ouvre la case « Signaler que l''exercice a un problème » chez l''élève et la file au '
  'Pilotage. ⚠️ Ce N''EST PAS un septième interrupteur du `07-` §5 — cette liste est CLOSE '
  '(`utils/allumage.ts`) : il vit ici comme `rag_actif` et `plan_evaluation_actif`, et il se '
  'bascule depuis /prof/signalements, jamais depuis /prof/allumage.';

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Les six drapeaux doivent être à `t`.
-- ⛔ ELLE NE TOUCHE AUCUNE DONNÉE : elle lit le catalogue, et rien d'autre.
--    Une vérification qui insère une ligne d'essai peut échouer sur une
--    contrainte étrangère et diagnostiquer alors la MAUVAISE cause
--    (leçon de `c6_designation_non_fait.sql`).
-- ============================================================================
-- select
--   (select count(*) from information_schema.tables
--     where table_schema = 'public' and table_name = 'exercices_signalements_eleve') = 1
--       as table_creee,
--   (select relrowsecurity from pg_class where relname = 'exercices_signalements_eleve')
--       as rls_active,
--   (select count(*) from pg_policies where tablename = 'exercices_signalements_eleve') = 1
--       as une_seule_policy,
--   (select count(*) from pg_policies where tablename = 'exercices_signalements_eleve'
--     and policyname like '%eleve_all%') = 0
--       as zero_policy_eleve,
--   (select count(*) from information_schema.columns
--     where table_schema = 'public' and table_name = 'scriptorium_params'
--       and column_name = 'signalement_exercice_actif') = 1
--       as interrupteur_pose,
--   (select signalement_exercice_actif from public.scriptorium_params limit 1) = false
--       as interrupteur_a_off;

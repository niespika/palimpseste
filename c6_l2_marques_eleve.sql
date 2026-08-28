-- ============================================================================
-- C6 · L2 — LES DEUX MARQUES DE L'ÉLÈVE SUR SON PROFIL
--           (le choix d'afficher ses lettres · la fiche déjà servie)
-- ----------------------------------------------------------------------------
-- ⛔⛔ PROTOCOLE RENFORCÉ (règle R6) : `profiles` est une TABLE VIVANTE d'un flux
--    existant (auth). Elle porte les comptes réels — 14 élèves en production au
--    28/08/2026. Code d'abord, SQL ensuite, fenêtre calme, retour arrière prêt
--    (`c6_l2_marques_eleve_rollback.sql`), sandbox avant prod.
--    ⚠️ RÉPÉTITION À BLANC : copier le CORPS de ce fichier (entre `begin;` et
--       `commit;`) dans sa propre transaction d'essai — JAMAIS le fichier
--       entier, dont le `commit;` validerait la transaction d'essai.
--
-- ⭐ POURQUOI DEUX COLONNES ET UNE SEULE MIGRATION. Les deux besoins naissent du
--    même paragraphe du `06-Palimpseste.md` §5, et une seule migration sur une
--    table vivante vaut mieux que deux.
--
--    (1) `competences_lettres_affichees` — LE CHOIX DE L'ÉLÈVE.
--        « C'est l'élève qui choisit d'en voir plus : celui qui veut autre chose
--          que des mots peut afficher lui-même ses courbes de progression et le
--          reste. LE SYSTÈME NE LE DÉCIDE PAS POUR LUI. »
--        ⛔ NULLABLE ET SANS `default` — et c'est le cœur du choix : **NULL vaut
--           MASQUÉ**. « Un défaut à "affiché" n'est pas un choix. » Un
--           `default false` dirait la même chose ; le NULL le dit mieux, en
--           distinguant « jamais répondu » de « a choisi de masquer ».
--        ⚠️ Ce n'est PAS un interrupteur (`07-` §5) : il n'ouvre ni ne ferme un
--           lot, il porte une préférence PAR ÉLÈVE. Les six interrupteurs
--           restent où ils sont, et il n'en naît pas un septième.
--        ⚠️ Elle ne SUFFIT jamais : les lettres demandent TROIS conditions —
--           `competences_affichage_actif` à ON, `profil_provisoire` à faux, ET
--           ce choix (`utils/eleve/profil.ts`, `lettreVisible`).
--
--    (2) `fiches_competences_servies_at` — « SERVIE UNE FOIS, À LA RENTRÉE ».
--        « Chaque compétence a une fiche d'une page […] SERVIE UNE FOIS — À LA
--          RENTRÉE — ET CONSULTABLE TOUTE L'ANNÉE. »
--        ⭐ Deux choses, et la première est un GESTE : *consultable* est une
--           page ; *servie une fois* est une POUSSÉE, au premier passage. Sans
--           cette marque, la moitié de la phrase n'a nulle part où aller — la
--           fiche ne serait que consultable.
--        ⚠️ Un INSTANT, pas un booléen : la date du service se relit (« quand
--           l'a-t-il vue ? »), un `true` ne se relit pas. NULL = jamais servie.
--
-- ⭐ ADDITIVE, ET INERTE POUR L'EXISTANT. Deux colonnes NULLABLES **sans
--    `default`** : aucune réécriture de table, aucun verrou long, aucune ligne
--    existante invalidée. ⛔ AUCUNE POLICY N'EST TOUCHÉE — et surtout **la policy
--    self-service de `profiles` reste morte** (retirée par `c1_rls_eleve.sql` ;
--    `07-` §1.3 : ne pas la réintroduire). Les deux marques se lisent et
--    s'écrivent CÔTÉ SERVEUR, par le client admin, filtrées sur l'identifiant de
--    l'élève dans le code — comme tout le reste du moteur.
--
-- ⚠️ AUCUN `select *` DÉPLOYÉ NE CASSE : les lecteurs de `profiles` nomment
--    leurs champs. Deux colonnes en trop sont ignorées.
--
-- Rollback : `c6_l2_marques_eleve_rollback.sql`
-- ============================================================================

begin;

-- ── (1) Le choix de l'élève d'afficher ses lettres ──────────────────────────
alter table public.profiles
  add column if not exists competences_lettres_affichees boolean;

comment on column public.profiles.competences_lettres_affichees is
  'C6-L2 — le choix de l''élève d''afficher ses lettres (06- §5). NULL vaut MASQUÉ : '
  '« un défaut à "affiché" n''est pas un choix ». Ne suffit jamais seule — il faut aussi '
  'competences_affichage_actif à ON et profil_provisoire à faux. Ce n''est PAS un interrupteur.';

-- ── (2) La fiche de compétence déjà servie ──────────────────────────────────
alter table public.profiles
  add column if not exists fiches_competences_servies_at timestamptz;

comment on column public.profiles.fiches_competences_servies_at is
  'C6-L2 — l''instant où les six fiches de compétence ont été SERVIES à l''élève '
  '(06- §5 : « servie une fois — à la rentrée — et consultable toute l''année »). '
  'NULL = jamais servie, et la tuile de découverte reste allumée.';

commit;

-- ============================================================================
-- VÉRIFICATION — à jouer APRÈS le commit. Les cinq drapeaux doivent être à `t`.
-- ============================================================================
select
  (select count(*) = 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles'
       and column_name = 'competences_lettres_affichees')            as choix_pose,
  (select count(*) = 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles'
       and column_name = 'fiches_competences_servies_at')            as service_pose,
  -- ⭐ NULLABLES ET SANS DÉFAUT : c'est ce qui rend la migration inerte, et c'est
  --    aussi ce qui fait que « NULL vaut masqué » plutôt qu'un défaut caché.
  (select bool_and(is_nullable = 'YES' and column_default is null)
     from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles'
       and column_name in ('competences_lettres_affichees',
                           'fiches_competences_servies_at'))         as nullables_sans_defaut,
  -- ⛔ AUCUN COMPTE N'A ÉTÉ TOUCHÉ, et aucune ligne n'a reçu de valeur.
  (select count(*) = 0 from public.profiles
     where competences_lettres_affichees is not null
        or fiches_competences_servies_at is not null)                as aucune_ligne_ecrite,
  -- ⛔ LA POLICY SELF-SERVICE RESTE MORTE (`07-` §1.3, C1).
  (select count(*) = 0 from pg_policies
     where schemaname = 'public' and tablename = 'profiles'
       and policyname = 'profiles_self_update')                      as self_service_morte,
  (select count(*) from public.profiles)                             as comptes_intacts;

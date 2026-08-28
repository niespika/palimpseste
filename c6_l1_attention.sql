-- ════════════════════════════════════════════════════════════════════════════
-- C6 · L1 — LA PAGE DU PROFESSEUR : ce que les quatre drapeaux demandent à la base
-- ════════════════════════════════════════════════════════════════════════════
-- Ligne créée au `SUIVI_SQL.md` AVANT exécution. Trois gestes, et rien de plus :
--
--   (1) `integrite_signalements.module` — LE MODULE `exercices` ENTRE DANS LA
--       LISTE. « Le module `exercices`, lui, rejoindra la liste — mais avec le
--       FAISCEAU, à C6-L1 » (`07-` §1.2), et l'arbitrage ③ de Louis du 27/08 le
--       confirme : il entre **par migration**, « c'est une contrainte de domaine,
--       et elle se droppe et se recrée ».
--
--       ⚠️⚠️ « UNE LIGNE ADDITIVE » SERAIT FAUX : le `CHECK` est INLINE
--       (`integrite_petits_malins.sql:19`), donc auto-nommé par Postgres —
--       `integrite_signalements_module_check`, **nom vérifié en base des DEUX
--       côtés le 28/08** (insert volontairement refusé, code `23514`). C'est la
--       leçon exacte de `C4-L16`, et le patron du dépôt est le sien :
--       `drop constraint if exists`, puis `add constraint` SOUS LE MÊME NOM.
--       ⭐ Le geste ÉLARGIT et ne rétrécit jamais : aucune ligne existante ne
--       peut violer la nouvelle forme, la validation ne peut pas échouer.
--
--       ⛔⛔ `integrite_signalements` EST UNE TABLE VIVANTE — 13 lignes en bac à
--       sable, 0 en prod au 28/08 —, elle porte les signalements réels d'élèves
--       réels, et elle appartient à un FLUX EXISTANT (Intégrité). **Protocole
--       RENFORCÉ, règle R6 du `SUIVI_SQL.md`** : code d'abord, SQL ensuite,
--       fenêtre calme, rollback prêt (`c6_l1_attention_rollback.sql`), sandbox
--       avant prod, et répétition à blanc sur LE CORPS de ce fichier — jamais
--       sur le fichier entier, dont le `commit;` validerait la transaction
--       d'essai.
--
--       ⛔ LE TYPE, LUI, N'A AUCUN `CHECK` (vérifié : la colonne est un `text`
--       nu, l'insert d'essai l'a traversée sans un mot). Le type de faisceau
--       n'exige donc AUCUNE migration — seule la liste TypeScript le borne.
--
--   (2) `scriptorium_params` — DEUX PARAMÈTRES, ET AUCUN SEPTIÈME INTERRUPTEUR.
--       « Un paramètre n'est pas un interrupteur » (`07-` §5) : ceux-ci
--       n'ouvrent ni ne ferment rien, ils **règlent un seuil que la doctrine
--       refuse d'arrêter d'avance**.
--         · `contestations_repetees_seuil` — « le seuil de répétition se règle ;
--           il n'est pas arrêté… d'ici là, le drapeau se règle en configuration,
--           et son absence de valeur ne bloque pas l'écran » (`07-` §2, C6-L1) ;
--         · `faisceau_convergence_seuil` — « quand les signaux convergent » : le
--           `06-` §6 ne dit pas combien. Même patron, pour le même motif.
--       ⭐ Les deux naissent **NULL**, et NULL vaut **aucun drapeau** — jamais
--       une valeur par défaut cachée. « Un seuil posé d'avance deviendrait la
--       cible que le dispositif apprend à viser » (`00-` §5). L'écran continue
--       de montrer la DISTRIBUTION qui servira à les régler.
--       Additif pur : deux colonnes NULLABLES sans `default` → aucune réécriture
--       de table, aucun verrou long, aucune policy touchée.
--
--   (3) `marquer_contestation_traitee()` — LA MARQUE DE TRAITEMENT D'UNE
--       CONTESTATION, ET ELLE EST ATOMIQUE.
--       « Rien ne marque une contestation comme examinée » : `ActeContestation`
--       porte `point_id`, `texte`, `at`, `citation_absente` — et aucun
--       `traite_at`. Or la file « se traite », comme celle des N3.
--
--       ⭐ LA FORME RETENUE EST LE JSONB, ET LE MOTIF N'EST PAS LE CONFORT.
--       Le `07-` §1 laisse le choix (« colonne, table fille ou JSONB »). Une
--       TABLE FILLE clé `(depot_id, point_id)` serait exempte de course — mais
--       elle porterait une marque qui SURVIT au remplacement de l'acte. Or
--       « un même point recontesté REMPLACE son acte » (`07-` §1.2), et un
--       nouveau texte est un nouveau fait à regarder : une marque périmée
--       ferait SORTIR SILENCIEUSEMENT une contestation de la file d'examen
--       humain — c'est-à-dire de l'exigence de la loi 25 (`06-` §7). Dans le
--       JSONB, `contester()` reconstruit l'acte sans la marque, et la
--       contestation revient d'elle-même en file. **La direction de l'erreur
--       décide, et elle décide contre la table fille.**
--
--       ⚠️ CE QUE LE JSONB COÛTE, ET IL EST DIT : l'écriture de l'élève est un
--       `upsert` lis-modifie-écris (`contestation.ts`). Une contestation qui
--       s'insère pile entre la lecture et l'écriture d'une marque du professeur
--       ferait perdre CETTE MARQUE — jamais une contestation, jamais un acte.
--       Le professeur re-clique. ⛔ Côté professeur, la course est FERMÉE ici :
--       cette fonction fait tout en UNE instruction, la ligne est verrouillée,
--       et la condition `traite_at` vide est réévaluée sous ce verrou.
--       *Patron : `journaliser_collage()` de `c4_l4_collage_journal.sql`.*
--
-- ⛔ AUCUN INTERRUPTEUR N'EST TOUCHÉ. Les six restent comme ils sont trouvés.
-- ⛔ AUCUNE POLICY N'EST TOUCHÉE, ET AUCUNE N'EST OUVERTE. « Le moteur ne porte
--    aucune policy élève sur ses tables ; toutes les écritures passent par le
--    serveur » (`07-` §1) — la page est prof-only et lit par le client admin.
-- ⛔ AUCUNE COLONNE N'EST AJOUTÉE À `competences_escalade` : `dossier_n3_traite_at`
--    existe depuis `c4_l1_schema.sql:752`, et son index partiel taillé pour la
--    file aussi (`idx_escalade_n3_ouvert`). Ce lot lui donne son ÉCRIVAIN, en
--    TypeScript, pas une seconde colonne.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 0. LE CONSTAT D'AVANT — à lire, et à comparer au constat de pied ────────
select
  (select count(*) from public.integrite_signalements)                      as signalements_en_base,
  (select count(*) from public.integrite_signalements
    where module = 'exercices')                                             as deja_exercices,
  (select count(*) from pg_constraint
    where conname = 'integrite_signalements_module_check')                  as contrainte_presente,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name in ('contestations_repetees_seuil',
                          'faisceau_convergence_seuil'))                    as params_deja_poses,
  (select count(*) from public.exercices_metacognition
    where contestation_points is not null)                                  as metacognitions_avec_actes;

-- ── 1. LE MODULE `exercices` ENTRE DANS LA LISTE ────────────────────────────
-- Contrainte INLINE, auto-nommée : elle ne s'étend pas, elle se droppe et se
-- recrée SOUS LE MÊME NOM (patron `c4_l16_notions.sql`, lui-même sur
-- `plan_evaluation_modele.sql`). Les trois valeurs d'origine sont conservées à
-- l'identique — le geste n'en retire aucune.
alter table public.integrite_signalements
  drop constraint if exists integrite_signalements_module_check;
alter table public.integrite_signalements
  add constraint integrite_signalements_module_check
  check (module in ('aletheia', 'codex', 'fragments', 'exercices'));

comment on column public.integrite_signalements.module is
  'Le module d''où vient le signalement. `exercices` est entré à C6-L1 AVEC LE '
  'FAISCEAU (`07-` §1.2, arbitrage ③ de Louis du 27/08) : son type de '
  'signalement NE COMPTE AUCUN STRIKE — « le faisceau dit "quelqu''un d''autre a '
  'fait le travail" quand le strike parle d''EFFORT et bloque les dépôts au '
  'seuil » (`06-` §6). L''idempotence de sa confirmation se ferme sur '
  '`acquitte_at`, jamais sur `compte_strike`.';

-- ── 2. LES DEUX SEUILS, NULLABLES — et NULL vaut « aucun drapeau » ──────────
alter table public.scriptorium_params
  add column if not exists contestations_repetees_seuil integer,
  add column if not exists faisceau_convergence_seuil   integer;

comment on column public.scriptorium_params.contestations_repetees_seuil is
  'C6-L1 — combien d''ACTES DE CONTESTATION DISTINCTS et non traités lèvent le '
  'drapeau des contestations répétées, pour un élève. NULL = AUCUN DRAPEAU, et '
  'l''écran ne se bloque pas : il montre la distribution observée (combien '
  'd''élèves contestent, à quelle fréquence, sur quoi), qui est ce sur quoi le '
  'seuil se lira. « Un seuil posé d''avance deviendrait la cible que le '
  'dispositif apprend à viser » (`00-` §5 ; `07-` §2, C6-L1). Ce n''est PAS un '
  'interrupteur (`07-` §5).';

comment on column public.scriptorium_params.faisceau_convergence_seuil is
  'C6-L1 — combien des SEPT signaux du faisceau (`06-` §6) doivent se lever pour '
  'qu''un drapeau d''intégrité parte au professeur. NULL = AUCUN DRAPEAU : « quand '
  'les signaux convergent » n''est chiffré nulle part, et le patron est celui du '
  'seuil de répétition ci-dessus. L''écran montre quels signaux se lèvent, dépôt '
  'par dépôt, même sans seuil — personne ne peut régler ce qu''il ne voit pas. '
  'Ce n''est PAS un interrupteur (`07-` §5).';

-- ── 3. LA MARQUE DE TRAITEMENT D'UNE CONTESTATION — EN UNE INSTRUCTION ──────
-- Rend `true` si CET APPEL a posé la marque ; `false` si l'acte n'existe pas ou
-- portait déjà la sienne. C'est l'idempotence, et elle est fermée par la
-- condition `traite_at` vide portée par l'`update` lui-même.
--
-- ⚠️ `jsonb_agg` sur un ensemble VIDE rend NULL : le `coalesce` de sortie
--    empêche qu'un acte unique retiré entre-temps ne vide la colonne.
-- ⚠️ L'ordre des actes est PRÉSERVÉ (`with ordinality`) : une liste réordonnée
--    ferait bouger l'écran sans qu'il se soit rien passé.
create or replace function public.marquer_contestation_traitee(
  p_depot_id uuid, p_point_id text, p_at timestamptz default now()
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  v_touche integer;
begin
  update public.exercices_metacognition m
     set contestation_points = coalesce((
           select jsonb_agg(
                    case when e.value->>'point_id' = p_point_id
                         then e.value || jsonb_build_object('traite_at', to_jsonb(p_at))
                         else e.value end
                    order by e.ord)
             from jsonb_array_elements(coalesce(m.contestation_points, '[]'::jsonb))
                  with ordinality as e(value, ord)
         ), '[]'::jsonb),
         updated_at = p_at
   where m.depot_id = p_depot_id
     and jsonb_typeof(coalesce(m.contestation_points, '[]'::jsonb)) = 'array'
     and exists (
           select 1
             from jsonb_array_elements(coalesce(m.contestation_points, '[]'::jsonb)) e
            where e.value->>'point_id' = p_point_id
              and coalesce(e.value->>'traite_at', '') = ''
         );
  get diagnostics v_touche = row_count;
  return v_touche > 0;
end;
$function$;

comment on function public.marquer_contestation_traitee(uuid, text, timestamptz) is
  'C6-L1 — pose `traite_at` sur UN acte de `contestation_points`, ATOMIQUEMENT '
  '(patron `journaliser_collage()`). Idempotente : un acte déjà marqué rend '
  'false. ⚠️ Un même point RECONTESTÉ perd sa marque, et c''est voulu : '
  '`contester()` reconstruit l''acte, un nouveau texte est un nouveau fait à '
  'regarder, et la contestation revient d''elle-même en file d''examen humain '
  '(`06-` §2 et §7).';

-- ── 4. LE CONSTAT DE PIED — les cinq drapeaux doivent être à `t` ────────────
select
  (select count(*) = 1 from pg_constraint
    where conname = 'integrite_signalements_module_check')                   as contrainte_recreee,
  (select pg_get_constraintdef(oid) like '%exercices%'
     from pg_constraint
    where conname = 'integrite_signalements_module_check')                   as porte_exercices,
  -- ⭐ LA PREUVE QUE LE `CHECK` RECRÉÉ PORTE EXACTEMENT LES QUATRE VALEURS.
  (select (pg_get_constraintdef(oid) like '%aletheia%'
       and pg_get_constraintdef(oid) like '%codex%'
       and pg_get_constraintdef(oid) like '%fragments%'
       and pg_get_constraintdef(oid) like '%exercices%')
     from pg_constraint
    where conname = 'integrite_signalements_module_check')                   as les_quatre_valeurs,
  (select count(*) = 2 from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name in ('contestations_repetees_seuil',
                          'faisceau_convergence_seuil'))                     as deux_params_poses,
  (select bool_and(is_nullable = 'YES') from information_schema.columns
    where table_schema = 'public' and table_name = 'scriptorium_params'
      and column_name in ('contestations_repetees_seuil',
                          'faisceau_convergence_seuil'))                     as params_nullables,
  (select count(*) = 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'marquer_contestation_traitee') as fonction_posee,
  (select count(*) from public.integrite_signalements)                       as signalements_intacts;

-- Et la définition en toutes lettres, à lire :
select pg_get_constraintdef(oid) as definition_du_check
  from pg_constraint where conname = 'integrite_signalements_module_check';

commit;

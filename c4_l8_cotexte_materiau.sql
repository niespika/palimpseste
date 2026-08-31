-- ═══════════════════════════════════════════════════════════════════════════
-- c4_l8_cotexte_materiau.sql — 2026-08-31
--
-- LE CO-TEXTE ENTRE DANS LA BANQUE, ET IL Y ENTRE SOUS SON NOM.
--
-- ⭐ CE QU'EST UN CO-TEXTE. Aux trois crans de production (2·6·8), l'élève écrit
--    du neuf : l'exemple qui illustre un argument, la transition entre deux
--    paragraphes, l'objection à une thèse. **L'argument, les deux paragraphes,
--    la thèse — c'est le CO-TEXTE.** Sans lui, la consigne désigne un texte que
--    personne ne montre : « Voici l'argument à illustrer. Sa dernière phrase
--    dit qu'il y a là quelque chose "qu'il faut voir" » — et rien à l'écran
--    n'est cet argument.
--
-- ⛔ CE QU'IL N'EST PAS — et c'est toute la raison de ce fichier.
--    · **Pas un `materiau_cible`.** Le `02-` §2.3.3 : la cible est « le matériau
--      sur lequel l'élève travaille directement — il le MODIFIE, ou il le JUGE
--      sans rien rédiger de neuf », et elle « est `null` dès que l'élève produit
--      du neuf ». La doctrine en base le confirme : `materiau_cible = null` aux
--      crans 2, 6 et 8. L'élève ne retouche pas l'argument, il écrit un exemple.
--    · **Pas un matériau CALIBRÉ.** Le `08-` §4 : un `materiau`, « c'est lui qui
--      porte le défaut calibré ». Un co-texte n'a NI observable NI défaut — et
--      c'est pour ça que les sept co-textes de l'import du 31/08 ont été refusés
--      par `exercices_materiaux_observable_competence_check`.
--      ⭐ **La contrainte avait raison, mais elle ne savait pas pourquoi** : elle
--      disait « pas de compétence » quand le vrai motif était « ce n'est pas un
--      matériau de cible ». Ce fichier lui fait dire la vraie règle.
--
-- ⚠️⚠️ **CETTE MIGRATION EST INERTE À ELLE SEULE.** Elle ouvre la place ; elle ne
--    fait entrer aucun co-texte et n'en sert aucun. Il y faut, dans l'ordre :
--      1. `utils/fabrique/import-ecriture.ts` — écrire `null` au lieu de `''`
--         pour l'observable et le défaut d'un co-texte, et remplir la colonne.
--      2. `utils/chaine/contexte.ts` — LE SERVIR À L'ÉLÈVE. Sans ce point, on
--         aura ajouté une colonne et rien réparé.
--      3. `app/prof/conception/[id]` + `composerApercu` — sinon l'aperçu
--         continue de ne pas montrer ce que l'élève verra.
--      4. `utils/moteur/vivier-serveur.ts` — `ajouter()` ne charge aujourd'hui
--         que les textes et les sujets : un co-texte RETIRÉ ou BLOQUÉ serait
--         servi quand même.
--      5. le contrôle d'import (TS **et** son miroir `verifie-import.py`) — le
--         refus qui manquait : `cas.materiau` renseigné alors que le cran ne
--         déclare aucune cible.
--
-- ✅ MESURÉ AVANT ÉCRITURE (31/08) : les 516 matériaux de production et les 375
--    du bac à sable portent tous un `observable_code`, un `observable_competence`
--    et un `defaut` NON VIDES — aucun ne tombe sous la contrainte de rôle
--    ajoutée en D.
--
-- ⚠️ Additive et inerte : elle n'ôte aucune garantie. Les trois `drop not null`
--    ÉLARGISSENT ce qui est acceptable, et la contrainte D reprend d'une main
--    ce qu'ils lâchent de l'autre — un matériau de rôle `cible` reste tenu
--    d'avoir observable et défaut, exactement comme avant.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── A. Le RÔLE du matériau — ce que la banque ne disait pas ─────────────────
-- `cible` : le matériau calibré, celui que le CAS nomme (`08-` §5.2).
-- `co_texte` : la matière des crans de production, que l'INSTANCE nomme.
alter table exercices_materiaux
  add column if not exists role text not null default 'cible';
alter table exercices_materiaux
  drop constraint if exists exercices_materiaux_role_check;
alter table exercices_materiaux
  add constraint exercices_materiaux_role_check check (role in ('cible', 'co_texte'));

comment on column exercices_materiaux.role is
  'CIBLE ou CO-TEXTE. `cible` = le matériau calibré que le CAS nomme, il porte le défaut (08- §4). '
  '`co_texte` = la matière des crans de production, que l''INSTANCE nomme : ni observable ni défaut, '
  'l''élève ne la modifie pas, il écrit du neuf en s''appuyant dessus (02- §2.3.3).';

-- ── B. Les trois champs du matériau CALIBRÉ deviennent facultatifs ──────────
alter table exercices_materiaux alter column observable_code       drop not null;
alter table exercices_materiaux alter column observable_competence drop not null;
alter table exercices_materiaux alter column defaut                drop not null;

-- ── C. Le domaine des six compétences admet désormais l'absence ─────────────
-- ⚠️ Il n'admet PAS la chaîne vide : c'est `''` que l'écrivain d'import envoyait,
--    et c'est lui qu'il faut corriger, pas la contrainte qui l'a arrêté.
alter table exercices_materiaux
  drop constraint if exists exercices_materiaux_observable_competence_check;
alter table exercices_materiaux
  add constraint exercices_materiaux_observable_competence_check check (
    observable_competence is null or observable_competence in
      ('expression', 'argumentation', 'structure', 'connaissance', 'synthese', 'questionnement'));

-- ── D. ⭐ LA CONTRAINTE QUI DIT LA RÈGLE, au lieu de l'appliquer par accident ─
-- ⚠️ `is not null` ET `<> ''` : une colonne devenue facultative accepterait
--    sinon la chaîne vide, et un `check` dont l'expression vaut NULL PASSE.
alter table exercices_materiaux
  drop constraint if exists exercices_materiaux_role_champs_chk;
alter table exercices_materiaux
  add constraint exercices_materiaux_role_champs_chk check (
    (role = 'cible'
       and observable_code       is not null and observable_code       <> ''
       and observable_competence is not null
       and defaut                is not null and defaut                <> '')
    or
    (role = 'co_texte'
       and observable_code       is null
       and observable_competence is null
       and defaut                is null
       and version_corrigee      is null));

-- ── E. Le domicile du co-texte : SUR L'INSTANCE, jamais sur le cas ──────────
-- ⛔ PAS `exercices_cas.materiau_id` : c'est le slot de la CIBLE, et le `08-`
--    §5.2 le renseigne « quand le `materiau_cible` est `genere` ». Aux crans de
--    production il n'y a pas de cible, donc ce slot doit rester vide — c'est là
--    que la fabrique s'est trompée de case le 31/08.
alter table exercices
  add column if not exists cotexte_materiau_id uuid;

-- ⭐⭐ ET LA BASE REFUSE DE S'EN SERVIR MAL. Sans ceci, rien n'empêcherait de
--    faire pointer le co-texte d'une instance vers un matériau CALIBRÉ : la
--    règle vivrait dans le contrôle d'import, et « un écran n'est pas une
--    garde ». La clé étrangère porte le rôle avec elle.
-- ⚠️ `cotexte_role` est constante et NON NULLE ; `cotexte_materiau_id` est
--    facultatif. En MATCH SIMPLE, une clé dont UNE colonne est NULL est
--    satisfaite — une instance sans co-texte ne référence donc rien.
alter table exercices
  add column if not exists cotexte_role text not null default 'co_texte';
alter table exercices
  drop constraint if exists exercices_cotexte_role_chk;
alter table exercices
  add constraint exercices_cotexte_role_chk check (cotexte_role = 'co_texte');

alter table exercices_materiaux
  drop constraint if exists exercices_materiaux_id_role_key;
alter table exercices_materiaux
  add constraint exercices_materiaux_id_role_key unique (id, role);

alter table exercices
  drop constraint if exists exercices_cotexte_materiau_fk;
alter table exercices
  add constraint exercices_cotexte_materiau_fk
  foreign key (cotexte_materiau_id, cotexte_role)
  references exercices_materiaux (id, role) on delete restrict;

comment on column exercices.cotexte_materiau_id is
  'LE CO-TEXTE des crans de production (2·6·8) — la matière sur laquelle l''élève s''appuie pour '
  'écrire du neuf. Désigné par l''INSTANCE, jamais par le cas : `exercices_cas.materiau_id` est le '
  'slot de la CIBLE, et aux crans de production il n''y a pas de cible (02- §2.3.3). La clé '
  'étrangère porte le rôle : elle ne peut pointer que vers un matériau de rôle `co_texte`.';

-- ── Les contrôles, DANS la transaction ─────────────────────────────────────
select role, count(*) as materiaux from exercices_materiaux group by role order by role;
select count(*) as instances_avec_cotexte from exercices where cotexte_materiau_id is not null;

commit;

-- ============================================================================
-- C6 · L2 — ROLLBACK des deux marques de l'élève sur son profil.
-- ----------------------------------------------------------------------------
-- ⛔ N'EXÉCUTER QU'EN CAS DE PROBLÈME.
--
-- ⚠️ CE QUE CE RETOUR DÉTRUIT, ET IL FAUT LE SAVOIR AVANT DE LE JOUER :
--    · `competences_lettres_affichees` — le choix de chaque élève d'afficher ses
--      lettres. Le perdre remet tout le monde à MASQUÉ, ce qui est le défaut
--      juste (`06-` §5) : la perte est réelle mais SANS DANGER — personne ne se
--      verra imposer une lettre.
--    · `fiches_competences_servies_at` — l'instant où les six fiches ont été
--      servies. Le perdre RE-SERVIRA la fiche à des élèves qui l'ont déjà vue.
--      Gênant, jamais grave.
--    ⭐ Aucune des deux ne porte une MESURE : rien de ce que la chaîne a écrit
--       ne disparaît ici.
--
-- ⚠️ LE CONSTAT D'ABORD. Jouer le bloc ci-dessous AVANT le `begin;` : il dit
--    combien d'élèves perdront quoi. Un retour arrière qu'on joue sans savoir ce
--    qu'il emporte n'est pas un retour arrière.
-- ============================================================================

-- ── CONSTAT DE TÊTE — à lire avant de dérouler la transaction ───────────────
select
  count(*)                                                   as comptes,
  count(*) filter (where competences_lettres_affichees is not null)
                                                             as ont_choisi_pour_les_lettres,
  count(*) filter (where competences_lettres_affichees is true)
                                                             as veulent_voir_leurs_lettres,
  count(*) filter (where fiches_competences_servies_at is not null)
                                                             as ont_deja_recu_la_fiche
from public.profiles;

-- ============================================================================

begin;

alter table public.profiles drop column if exists competences_lettres_affichees;
alter table public.profiles drop column if exists fiches_competences_servies_at;

commit;

-- ── VÉRIFICATION — les deux drapeaux doivent être à `t`, les comptes intacts ──
select
  (select count(*) = 0 from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles'
       and column_name in ('competences_lettres_affichees',
                           'fiches_competences_servies_at'))  as colonnes_retirees,
  (select count(*) = 0 from pg_policies
     where schemaname = 'public' and tablename = 'profiles'
       and policyname = 'profiles_self_update')               as self_service_toujours_morte,
  (select count(*) from public.profiles)                      as comptes_intacts;

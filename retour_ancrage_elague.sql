-- ============================================================================
-- retour_ancrage_elague.sql — 31/08/2026
--
-- ⭐⭐ CE QUE CETTE MIGRATION FAIT, EN UNE PHRASE : elle autorise un point de
--    retour ENGENDRÉ à n'avoir AUCUN ancrage. Elle n'autorise rien d'autre.
--
-- **POURQUOI.** Décision de Louis, 31/08 : *« Le modèle ne doit pas citer le
-- texte de l'élève. On vire cette option. »* Le code vérifie désormais chaque
-- citation contre la copie (`utils/chaine/citation-verifiee.ts`) et **écarte**
-- celle qui ne s'y retrouve pas — le point garde son texte, il perd son bloc de
-- citation. Sans cette migration, cet élagage ferait échouer l'écriture en
-- `23514` : la garde exige aujourd'hui un ancrage non vide sur tout retour
-- engendré. Mesuré le 31/08 : **40 retours sur 67 auraient été refusés en base.**
--
-- La garde encodait la règle 1 du gabarit Calame (« aucun reproche sans
-- citation »). C'est cette règle-là que la décision lève. La base la suit.
--
-- ⚠️ **L'ORDRE EST INVERSÉ PAR RAPPORT À LA RÈGLE R6, ET C'EST VOULU.** Le
--    protocole veut « code d'abord, SQL ensuite » pour qu'une migration ne casse
--    pas du code en vol. Ici le code NOUVEAU exige le SQL, et le SQL ne fait que
--    DESSERRER : il ne peut invalider aucune ligne existante, avec ou sans le
--    code. Donc SQL d'abord, code ensuite.
--
-- ⚠️ **CE QUI NE CHANGE PAS, ET IL FALLAIT Y VEILLER :**
--    · un retour engendré nomme toujours AU MOINS UN point ;
--    · l'identifiant stable reste exigé des deux côtés (la contestation s'y
--      accroche) ; les identifiants restent distincts ;
--    · un texte de point vide reste refusé ;
--    · un ancrage FOURNI reste bien formé — côté engendré il doit toujours
--      porter une citation non vide ET une source valide, côté professeur une
--      citation non vide. **Les deux côtés gardent EXACTEMENT leur règle de
--      forme d'avant** : on ne resserre rien, on ne relâche que l'EXIGENCE
--      d'être là.
--
-- Zone : exercices_retours (contrainte `retours_texte_segmente_chk`).
-- Retour arrière : retour_ancrage_elague_rollback.sql
-- ============================================================================

begin;

create or replace function public.retour_segmente_bien_forme(
  p jsonb,
  ancrage_exige boolean default true
) returns boolean
language sql
immutable
as $function$
  select p is null
      or (jsonb_typeof(p) = 'array'
          -- Le professeur a le droit de tout retirer : `[]` n'est refusé que sur
          -- le texte ENGENDRÉ, qui doit toujours nommer au moins un point.
          and (jsonb_array_length(p) >= 1 or not ancrage_exige)
          and not exists (
            select 1 from jsonb_array_elements(p) e
            where jsonb_typeof(e) <> 'object'
               -- L'identifiant stable est exigé DES DEUX CÔTÉS : la contestation
               -- s'y accroche, et le drapeau des contestations répétées compte dessus.
               or coalesce(btrim(e->>'id'), '') = ''
               or coalesce(btrim(e->>'texte'), '') = ''
               -- ⭐⭐ 31/08/2026 — L'ANCRAGE N'EST PLUS EXIGÉ, MÊME ENGENDRÉ.
               --    Le code écarte la citation qu'il ne retrouve pas dans la
               --    copie ; le point survit sans elle. Un ancrage ABSENT (clé
               --    manquante) ou NUL est donc licite des deux côtés.
               -- ⚠️ Mais un ancrage PRÉSENT reste tenu à sa forme, et chaque
               --    côté garde la sienne, à l'identique d'avant.
               or (e ? 'ancrage' and jsonb_typeof(e->'ancrage') <> 'null' and (
                     jsonb_typeof(e->'ancrage') <> 'object'
                  or coalesce(btrim(e#>>'{ancrage,citation}'), '') = ''
                  or (ancrage_exige
                      and coalesce(e#>>'{ancrage,source}', '') not in ('copie', 'texte_support')))))
          and (select count(distinct e->>'id') from jsonb_array_elements(p) e)
              = jsonb_array_length(p));
$function$;

commit;

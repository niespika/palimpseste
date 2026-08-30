-- ============================================================================
-- corpus_purge_exercices_importes.sql — 2026-08-30
--
-- ⭐ POURQUOI. Les 247 exercices importés en production portent les versions
--    D'AVANT les corrections du 29 et du 30 août. L'import est IDEMPOTENT PAR
--    `id_import` — « une entrée dont l'`id` existe déjà est IGNORÉE, jamais
--    dupliquée, jamais écrasée en silence » (`08-` §1) — et tout y est en
--    `.insert()`, sans un seul `upsert`. Redéposer la banque corrigée par-dessus
--    ne ferait donc RIEN : les buggés resteraient, les corrigés n'entreraient
--    pas, et le rapport dirait « ignorée ». Il faut retirer les anciens.
--
-- ⭐⭐ CE QU'ON SUPPRIME, ET RIEN D'AUTRE : les exercices dont `id_import` n'est
--    pas nul. Leurs `exercices_cas` partent en cascade — c'est là que vivent les
--    consignes, réponses et distracteurs qu'on a corrigés.
--
-- ⛔⛔ CE QU'ON NE TOUCHE PAS, ET POURQUOI CHAQUE FOIS :
--    · les 4 exercices FAITS À LA MAIN (`id_import is null`) — ce sont ceux du
--      diagnostique en classe, et **les 86 dépôts d'élèves y pendent tous** ;
--      `exercices_depots → exercices` est en ON DELETE CASCADE.
--    · les 91 sujets, 212 matériaux, 2 textes — **nos corrections ne les ont
--      jamais touchés**, et l'import sait rattacher un exercice neuf à un
--      matériau DÉJÀ en base : après ses insertions il relit tout
--      `exercices_materiaux` ayant un `id_import` et complète sa table de
--      correspondance (`import-ecriture.ts`, §3).
--    · `txt-epicure-lettre-a-menecee` est visé par un des 4 exercices à la main,
--      et 3 d'entre eux pointent vers un sujet importé : les supprimer casserait
--      le diagnostique — ou échouerait sur le RESTRICT, au choix.
--
-- ⚠️⚠️ IL N'Y A PAS DE FICHIER DE RETOUR ARRIÈRE, ET C'EST DANS LA NATURE DU
--    GESTE : on ne restaure pas des lignes supprimées. **Le retour arrière EST
--    le réimport de la banque** — les mêmes `id_import`, les mêmes matériaux
--    déjà en place. C'est précisément ce que le `08-` appelle le geste normal :
--    « regénérer la banque entière et la redéposer ».
--
-- ⚠️ MESURÉ AVANT ÉCRITURE, en production, le 30/08 :
--      247 exercices importés · 4 faits à la main
--      86 dépôts, tous sur les 4 faits à la main
--      0 dépôt sur un exercice importé   ← les deux critères coïncident
--      187 mesures de compétences (elles pendent au DÉPÔT, pas à l'exercice :
--          `competences_mesures → exercices_depots ON DELETE SET NULL`)
--      0 décision de routeur
-- ============================================================================

-- ── Constat de tête — à lire AVANT la transaction ───────────────────────────
select 'AVANT — exercices importés' as quoi, count(*) filter (where id_import is not null) as n from exercices
union all select 'AVANT — exercices faits à la main', count(*) filter (where id_import is null) from exercices
union all select 'AVANT — cas', count(*) from exercices_cas
union all select 'AVANT — dépôts d''élèves', count(*) from exercices_depots
union all select 'AVANT — dépôts sur un exercice IMPORTÉ (doit valoir 0)',
  (select count(*) from exercices_depots d join exercices e on e.id = d.exercice_id
   where e.id_import is not null);

begin;

-- ⛔ LA GARDE. Si un seul dépôt pendait à un exercice importé, on s'arrête —
--    la suppression détruirait du travail d'élève par cascade.
do $$
declare n integer;
begin
  select count(*) into n
  from exercices_depots d join exercices e on e.id = d.exercice_id
  where e.id_import is not null;
  if n > 0 then
    raise exception 'ARRÊT — % dépôt(s) pendent à un exercice importé ; la cascade les détruirait', n;
  end if;
end $$;

delete from exercices where id_import is not null;

commit;

-- ── Contrôle de pied — trois drapeaux ───────────────────────────────────────
select 'APRÈS — exercices importés restants (doit valoir 0)' as drapeau,
       count(*) filter (where id_import is not null) as n from exercices
union all select 'APRÈS — exercices faits à la main (doit valoir 4)',
       count(*) filter (where id_import is null) from exercices
union all select 'APRÈS — dépôts d''élèves intacts (doit valoir 86)',
       (select count(*) from exercices_depots)
union all select 'APRÈS — mesures de compétences intactes (doit valoir 187)',
       (select count(*) from competences_mesures)
union all select 'APRÈS — matériaux conservés (doit valoir 212)',
       (select count(*) from exercices_materiaux)
union all select 'APRÈS — sujets conservés (doit valoir 91)',
       (select count(*) from exercices_sujets);

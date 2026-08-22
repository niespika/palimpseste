# RELEVÉ — Revue adversariale de C4-L5 (21/08/2026)

> Revue **bornée à quatre relecteurs**, une lentille chacun, périmètre complet du
> lot, plus une passe adverse conduite en propre : chaque trouvaille a été
> **réfutée avant d'être corrigée**. Deux l'ont été. Complément du
> `RELEVE_C4_L5_2026-08-21.md`, qui reste la description du lot.

---

## 0. Le contrôle d'entrée, rejoué — parce que la source a bougé

**Entre la fin de la séance de construction et la revue, le professeur a fait
avancer le dépôt de conception.** La règle du prompt s'applique : *la version
avertit, elle ne bloque pas ; relis l'en-tête avant de continuer.*

| Pièce | À la construction | À la revue | Verdict |
|---|---|---|---|
| `07-Implementation.md` | 2.8 | **2.12** *(quatre mouvements pendant la séance)* | VALIDÉ ET GELÉ — **§4 et §6 sans aucun hunk**, §1 inchangé sur ce que le lot lit |
| `01-` · `03-` · `04-` | 5.3 · 2.1 · 3.1 | identiques | ✓ |
| `competences/monitoring.md` | 2.1 | 2.1 | ✓ statut plafond atteint |
| les six fiches | 3.1 · 4.1 · 3.1 · 2.1 · 3.2 · 2.1 | **+0,1 chacune** | **toutes RELUE ET VALIDÉE — aucune versée et bancée** |

**Ce qui compte pour le lot n'a pas bougé** : le gabarit de Calame est **identique
octet pour octet** (3347 caractères, les trois variables), et **la clause
granulaire tient à l'identique** — aucune compétence n'entre dans la chaîne. Les
dérivés ont été rejoués (`--ecris`), et `--verifie` dit **IDENTIQUE**.

⚠️ **Les sept fiches déposées en base sont désormais périmées d'un cran**
(`competences_fiches` porte les versions de la veille). C'est le geste du
professeur à la fabrique — C4-L8 —, pas celui de ce lot.

---

## 1. Ce que la revue a trouvé, et ce qui a été corrigé

**Trente-quatre trouvailles**, dont **quatorze graves**. Toutes les techniques
sont corrigées ; les arbitrages sont au §3 et n'ont **pas** été tranchés.

### 1.1 Les deux qui ouvraient une compétence qui doit rester fermée

Ce sont les plus graves du lot : elles conduisaient à **envoyer une note non
calibrée à un élève**.

1. **`entete()` se rabattait sur la ligne entière quand le statut n'était pas en
   gras.** Or les six fiches disent, dans cette même ligne, qu'elles ne sont
   « pas encore versées et bancées » — et le degré y lisait le plus haut.
   *Corrigé : plus aucun repli, `SourceMouvante` si le gras manque.*
2. **`degre_du_statut` n'avait aucune garde de négation** : un statut écrit
   « PAS ENCORE VERSÉE ET BANCÉE » valait *versé et bancé*. C'est **la formule
   même que les six fiches emploient**. *Corrigé : la négation se lit d'abord.*

### 1.2 Les deux qui rendaient la chaîne inexécutable

3. **`forme: { type: 'objet', champs: {} }` ne veut pas dire « n'importe quel
   objet » mais « l'objet VIDE, et rien d'autre »** — la garde des clés
   inconnues refusait donc *toute* sortie de P1, P2 et du retour. La chaîne
   n'aurait jamais pu aboutir, pour personne, quel que soit le modèle. Deux
   relecteurs l'ont trouvée indépendamment. *Corrigé : une forme `objet_libre`
   explicite, et la garde des clés inconnues reste entière.*
4. **La convention de prompt était inventée.** Le script cherchait des blocs
   commençant par `SYSTÈME —` ; **aucune des six fiches ne suit cela** — leurs
   prompts vivent entre `<!-- DEBUT-PROMPT-P1 -->` / `<!-- FIN-PROMPT-P1 -->`
   (et `P1A`/`P1B` pour la Synthèse), convention actée et déjà servie par
   `copies-tests/_commun/derive-prompts.py`. J'avais écrit une convention au
   lieu de lire celle du banc. *Corrigé : lecture par marqueurs, la phase pour
   clé.* Et **chaque fiche est désormais isolée** : une fiche illisible ne fait
   plus tomber le gabarit, le Monitoring et les cinq autres avec elle.

### 1.3 La file — six défauts, tous éprouvés

5. **Un échec était terminal dès le premier essai** : `tentatives_max = 3` ne
   servait à rien, et `echec_definitif` restait faux — l'écran de C4-L3 aurait
   affiché « en cours » indéfiniment. *Corrigé : le job retourne en file
   jusqu'au plafond.*
6. **Un job épuisé n'était jamais marqué** : il restait réclamable, occupait la
   tête de file (tri `created_at ASC`) et faisait rendre zéro job à chaque tour.
   *Corrigé : il est clos et rendu visiblement définitif.*
7. **Aucun jeton de bail à la clôture** : un ouvrier zombie clôturait le job
   qu'un autre avait repris. *Corrigé : le numéro de tentative fait jeton.*
8. **Le bail se comparait en CHAÎNES.** Vérifié en base : PostgREST rend
   `2026-07-26T00:48:42.033991+00:00`, JavaScript rend `…Z` — et `'+' < '.'`.
   **Un bail vivant se lisait comme expiré.** *Corrigé : le filtre passe en SQL
   (et l'index `idx_jobs_reclamables` sert enfin à quelque chose).*
9. **`ChaineSuspendue` confondait une panne globale et une panne locale.** Un
   seul dépôt sans version finale gelait **la file entière, à chaque tour, pour
   toujours** : reposé (donc jamais épuisé), toujours en tête, et le `break`
   abandonnait tous les autres. *Corrigé : `DepotInexploitable`, clos
   définitivement, la file continue.*
10. **Quatre jobs réclamés, traités en série sous 60 s** : les trois derniers
    brûlaient une tentative sans être exécutés. *Corrigé : un job à la fois,
    sous budget de temps.*

### 1.4 Le Monitoring

11. **`monitoring_mesures` était la seule table du lot sans garde mécanique**, et
    les flux 2 et 4 n'étaient pas bornés à la v1 : une reprise, ou un second
    passage en version finale, y versait des **doublons** — `n` gonflait et la
    fenêtre de cinq exercices comptait la même copie plusieurs fois. *Corrigé :
    un index unique partiel `(depot_id, sous_dimension)`, les flux bornés à la
    v1, et **une seule ligne de calibration par dépôt** — ses trois sources
    tiennent dans son JSONB, comme la fiche les décrit.*
12. **Deux seuils inventés.** `sensDe` posait `0,7` et `0,4` pour trancher « sûr »
    et « hésitant » ; la fiche §4 écrit la règle **sans aucun chiffre**, et son
    §9 range la conversion dans l'après-collecte. *Corrigé : le label disparaît,
    on conserve les deux côtés (la crédence portée, la justesse) et le score de
    Brier, qui est dénombrable et que la fiche nomme.*
13. **Les deux délais n'étaient jamais écrits**, alors que le §1.4 les nomme.
    *Corrigé.*
14. **L'amplitude `n/a` était écrite jusque sur les lignes de lucidité**, à qui
    elle n'appartient pas. *Corrigé : `n/a` sur la calibration, NULL sur la
    lucidité — « leurs colonnes ne se croisent pas ».*

### 1.5 Le retour

15. **Le modèle ne recevait ni les verdicts ni le levier** — `verdicts: []` et
    `vocabulaire: []` — alors que le gabarit lui dit qu'il les reçoit et lui fait
    puiser « le champ `levier` du verdict ». Il aurait dû **rejuger**. *Corrigé :
    l'artefact de jugement voyage avec l'extraction.*
16. **Le gabarit partait DEUX FOIS** dans le bloc système, dont une non
    substituée : le modèle lisait « REGISTRE : {{REGISTRE}} » à côté du registre
    réel. *Corrigé : un seul exemplaire, substitué, et il reste cachable.*
17. **RR2 n'était nulle part** — RR1, RR3 et RR4 l'étaient. *Corrigé.*
18. **Les sondes n'étaient pas écartées du retour**, alors qu'« une sonde est
    silencieuse : elle ne produit aucun retour ». *Corrigé.*
19. **En version finale, les compétences admises venaient des squelettes de la
    v1** : un squelette v1 manquant vidait la liste et faisait refuser chaque
    point, en accusant le modèle. *Corrigé.*
20. **`sonde_montee` était propagé à TOUTES les mesures du dépôt** au lieu d'être
    recopié par compétence : la mesure de la **cible** sortait alors de la
    fenêtre d'acquisition et de la stagnation, et N1 s'éteignait sur elle —
    l'exact inverse du motif de M-e. *Corrigé : par compétence.*
21. **La couche type était vide au geste PRODUIRE** — `exercices_routes` ne porte
    que les six crans qui isolent, par contrainte, « les trois crans de
    production, les tables ne peuvent pas les porter » (`04-` §0 et §14) — et le
    prompt affirmait au modèle que « rien n'est déclaré ». *Corrigé autrement que
    ce que le relecteur proposait, après vérification en base : le fallback qu'il
    suggérait (`couverture_observables`) est **vide aux crans 2, 6 et 8**. La
    couche type y sert désormais **le patron de consigne** du `04-` §14, et dit
    que le cran est un cran de production — une règle de doctrine, pas un trou.*

### 1.6 La facture, le coût, les écritures muettes

22. **`depenseDuMois` chargeait les lignes pour les sommer côté client** :
    PostgREST plafonne la réponse (1000 lignes) **et ne signale rien**. La
    coupure automatique cessait d'exister au-delà de mille appels dans le mois —
    dès la première classe. *Corrigé : `chaine_depense_du_mois()` en base, avec
    repli paginé.*
23. **Un appel qui lève perdait son coût sans une trace.** *Corrigé : trace
    explicite, et le nombre d'appels réellement dépensés voyage sur l'exception.*
24. **`enregistrerCoutApi` sort sur un coût nul** — donc pas de ligne, donc le
    plafond par dépôt sous-compte. *Non corrigé, et c'est délibéré : ce journal
    est écrit par quatorze autres sites en production ; le modifier relèverait du
    protocole renforcé et déborde ce lot. La chaîne le **trace** désormais. Au §3.*
25. **Sept écritures avalaient leur `{ error }`** — le mode de panne qui a coûté
    deux mois à ce dépôt. *Corrigé aux sept endroits.*
26. **`retourEcrit` et le compte de mesures affirmaient des écritures qui
    pouvaient avoir échoué** — et c'est ce message que l'écran de C4-L3 aurait
    montré. *Corrigé : les deux fonctions rendent la vérité.*

### 1.7 Les gardes SQL

27. **La garde du retour segmenté refusait au professeur d'éditer** : elle
    exigeait de `texte_edite_par_prof` un ancrage verbatim sur chaque point, là
    où `02-` §6.D étape 14 dit « il peut modifier le retour », sans condition.
    Éprouvé : `23514` sur une remarque ordinaire. *Corrigé : l'ancrage n'est
    exigé que du texte engendré ; **l'identifiant stable reste exigé des deux
    côtés**, la contestation s'y accroche.*
28. **Les `do $$` cherchaient `pg_constraint` par nom seul, sans `conrelid`** :
    une homonymie faisait sauter l'ADD **en silence**, et les sept drapeaux
    disaient quand même « t ». Éprouvé sur tables témoins. *Corrigé, et deux
    drapeaux de plus vérifient que les gardes sont posées.*
29. **Le rollback refusait de partir dès que la chaîne avait tourné une fois** —
    donc au moment même où l'on découvrirait le problème qui le motive. Le
    relecteur a prouvé l'aller-retour `jsonb → text → jsonb` sans perte.
    *Corrigé : il convertit.*
30. **La garde acceptait un texte fait d'espaces.** *Corrigé (`btrim`).*
31. **Un rejeu sous un autre instrument** écrasait le squelette mais voyait sa
    mesure refusée : les deux tables se contredisaient sur `instrument_version`.
    *Corrigé : la mesure n'est pas réécrite — un état ne se refait pas — et la
    divergence lève une alerte au lieu de passer inaperçue.*

### 1.8 Le contrôle qui n'était câblé nulle part

32. **`--verifie` n'était exécuté par rien.** La suite passait donc sur des
    dérivés périmés — et c'était déjà le cas : au moment de la revue, les
    dérivés portaient `2.8` quand la source disait `2.11`. *Corrigé : un test
    l'exécute. Éprouvé dans les deux sens — un dérivé édité à la main fait
    tomber `npm test` (399/400), sa restauration le rend vert.*
33. **`--ecris --racine <essai>` écrivait dans les dérivés de PRODUCTION** et
    supprimait ceux que la racine d'essai ne justifiait pas. *Corrigé : refus net,
    ou `--sortie` explicite.*
34. Plus : le lecteur YAML **refusait `competences/expression.md`** (listes en
    ligne repliées) et aurait donc condamné toute la dérivation ; il tronquait
    une valeur citée contenant `#` ; son garde-fou de tabulation était du code
    mort ; `bloc_clos` prenait le premier de deux blocs **en silence** ; le
    balayage « en trop » ignorait la racine de `derive/` ; et les contrôles
    d'`observables_mesure` étaient un sous-ensemble de ceux de
    `verifie-seuils.py` — **sans le rapprochement PROSE ↔ MACHINE**, qui est sa
    raison d'être. *Tous corrigés ; les sept blocs machine se lisent désormais.*

---

## 2. Ce que j'ai réfuté

Deux trouvailles n'ont pas survécu à la passe adverse, et une troisième a été
corrigée **autrement** que proposé :

- **« l'index unique du Monitoring doit porter `(depot_id, sous_dimension,
  source)` »** — non : la porte 2 et la confiance de remise sont **toutes deux**
  `sollicitee` sur le même dépôt ; cet index les aurait fait entrer en collision.
  La fiche §4 dit « la calibration — dérivée, **de trois sources** » : c'est
  **une** mesure, et la colonne `source` ne distingue pas ces trois-là. D'où une
  ligne par dépôt et par sous-dimension, ses sources dans son JSONB.
- **« la couche type doit lire `couverture_observables` aux crans de
  production »** — vérifié en base : cette colonne est **vide** aux crans 2, 6 et
  8. Le `04-` §14 le dit d'ailleurs. Corrigé par le patron de consigne.
- **« `upsertSquelette` appelé deux fois écrase l'extraction »** — le relecteur
  l'avait lui-même écarté après vérification, et il a raison : PostgREST
  n'actualise que les colonnes du payload.

---

## 3. Ce qui reste au professeur, et que je n'ai pas tranché

*S'ajoutent aux treize questions du `RELEVE_C4_L5_2026-08-21.md` §5, toujours
ouvertes.*

1. **Le pont `evaluatif → sommatif` était présenté comme « FORCÉ » : c'est faux,
   il est DÉDUIT.** Aucune des huit sources ne met les deux vocabulaires en
   regard ; seul le point `formatif → formatif` est cité (`01-` §10, la synthèse
   en classe). La branche porteuse — celle qui **fabrique les ancres**, donc la
   descente des lettres et le plafond ancre + 2 — n'est adossée à rien d'écrit.
   *Le commentaire et le relevé sont corrigés pour le dire.* **Une garde citée a
   été posée** : une synthèse en classe reste `formatif` même si le plan la
   porte en `evaluatif` — `01-` §10 le lui refuse nommément. **Le reste du pont
   attend ta décision.**
2. **La cible du retour, sans décision de routeur, était tirée au hasard.**
   `mesurees[0]` lisait un `jsonb`, dont Postgres range les clés par longueur
   puis par octets : « la première compétence » était, en pratique, celle au nom
   le plus court — jamais celle que tu as nommée en premier. *Le repli est
   désormais **l'ordre alphabétique, assumé comme convention**, et une **alerte**
   se lève dès qu'il sert sur plus d'une compétence.* **Où doit vivre le partage
   primaire / secondaire / sonde, hors de `routeur_decisions` ?**
3. **Le vocabulaire de la grille reste vide** dans la couche compétence. Il vit
   dans la fiche et n'est dérivable de nulle part ailleurs : il s'ajoutera au
   branchement le jour où un slot s'ouvre. Rien n'a été inventé.
4. **`api_couts` n'écrit pas de ligne à coût nul.** Le contrat « le nombre
   d'appels se lit au nombre de lignes » est donc faux pour un appel dont le
   fournisseur ne rend pas d'usage exploitable (cas Gemini observé). Changer ce
   comportement touche un journal écrit par quatorze sites en production →
   **protocole renforcé, hors de ce lot**. La chaîne le trace ; **à trancher.**
5. ⚠️ **`maxDuration = 60` contre un contrat de latence de trois minutes** —
   déjà au relevé, et la revue l'aggrave : à un job par tour, un lot de cent
   quarante copies demande cent quarante tours de cron. **À trancher avant C4-L4.**

---

## 3-bis. Ce que le professeur est en train de faire, en parallèle

Constaté pendant la revue, **sans que rien de mien n'y touche** :

- **`07-Implementation.md` a bougé quatre fois** pendant la séance — 2.8 → 2.9 →
  2.10 → 2.11 → **2.12**. Le gabarit de Calame, lui, n'a **jamais** changé : les
  dérivés ont été rejoués à chaque fois, `--verifie` dit IDENTIQUE.
- **`scripts/derive-doctrine.py` est passé en 1.1 à 08:08**, et les six fiches
  portent désormais une ligne **`<!-- PRODUCTION exerce=… -->`** à leur §6 : les
  objets où la compétence est ciblable **aux crans de production**. C'est très
  exactement le trou que la revue a trouvé (§1.5, n° 21).
  **Je n'ai pas rejoué `derive-doctrine.py --sql`** : ses onze tables disent
  toutes IDENTIQUE, seules les **empreintes de source** et la **fixture**
  divergent — c'est-à-dire que le travail est **en vol**. Rejouer aurait estampé
  une dérivation par-dessus. *Quand tu auras fini : `--sql` puis `--fixture`.*
- **En attendant, la chaîne lit LES DEUX ÉTATS** : `couverture_observables` si
  elle est remplie, le patron de consigne du `04-` §14 sinon. Le jour où tu
  rejoues `--sql`, la couche type se remplit toute seule, sans toucher au code.
- `utils/fabrique/divergences.test.ts` est apparu à 01:07 (19 tests) — hors de ce
  lot, non touché.

---

## 4. L'état à la fin de la revue

| | |
|---|---|
| `npm test` | **400 passés, 0 échoué** — dont le contrôle de dérivation, désormais câblé |
| `npx tsc --noEmit` · `eslint` | rien |
| recette en base | **50 passés, 0 échoué** (45 avant la revue, cinq épreuves neuves) |
| `derive-instruments.py --verifie` | **IDENTIQUE** (rejoué à chaque mouvement du `07-`) |
| `derive-doctrine.py --verifie` | **onze tables IDENTIQUE** ; SOURCES et FIXTURE **DIVERGE** — travail du professeur en vol, cf. §3-bis |
| `derive-04.py --verifie` | **IDENTIQUE** |
| SQL | `c4_l5_chaine_complement.sql` **joué en sandbox le 21/08, six drapeaux à `t`** |
| RLS | 35 policies, toutes `prof` · **zéro policy élève** sur les tables du lot |
| interrupteurs | **les cinq à OFF**, vérifiés par requête |
| sandbox | rendue à son état d'avant : 4 exercices, 12 dépôts, 0 job, 0 mesure, 177 lignes de coût, 34 `monitoring_niveaux` à `n = 0` |

**Le dépôt de conception n'a pas été touché** : les relecteurs ont travaillé sur
des racines d'essai en liens symboliques, et les sept fiches sont octet pour
octet celles du début.

**Les cinq épreuves neuves de la recette** portent exactement ce que la revue a
trouvé : un échec sous le plafond remet en file · le job se réclame de nouveau ·
un ouvrier au bail périmé ne clôt pas le job d'autrui · un job épuisé devient
visiblement définitif et libère la tête de file · un dépôt sans version finale
clôt son job au lieu de geler la file.

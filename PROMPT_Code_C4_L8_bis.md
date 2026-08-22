# PROMPT — Session Code : C4-L8-bis — La doctrine lue en entier

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec leurs versions au moment de l'écriture *(21/08/2026)*.
>
> ⚠️ **Ce lot est né le 21/08**, à la recette des trois dernières épreuves de C4-L8, et son entrée au `07-` §2 a été écrite le même jour. **Il n'a donc pas de boîte aux lettres au `PLAN_DE_CHANTIER.md` §5** : rien n'y attend d'être vidé, et ce n'est pas un oubli — ce que la recette de C4-L8 avait à dire à ce lot est **dans son entrée au `07-` §2**, pas dans un relevé.

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1** · `02-exercices.md` §6 B — *« une banque de consignes s'affiche pour le couple objet × mode × cran »* · `04-Instances_Exercices.md` §0 — **relu et validé**, l'observable **vient de la route** · `08-FORMAT_IMPORT.md` §7 — le **refus n° 15** et le **blocage n° 3**, qui lisent tous deux cette table.

« Ce document » est le `07-Implementation.md`. Les quatre pièces :

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | aucun — un lot n'exige pas un statut de la source qui le déclare *(`07-` §2)* | **VERSION 2.21** · VALIDÉ ET GELÉ *(vaut relu et validé)* |
| `02-exercices.md`, **§6 B** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 5.4** · VALIDÉ ET GELÉ |
| `04-Instances_Exercices.md`, **§0** | même dépôt | **relu et validé** *(explicite au manifeste)* | **VERSION 3.2** · VALIDÉ ET GELÉ *(vaut relu et validé)* |
| `08-FORMAT_IMPORT.md`, **§7** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 1.2** · VALIDÉ ET GELÉ |

Ce que chaque pièce fait ici : le **`07-` §1** déclare **les tables de doctrine que ce lot lit** — celles que `scripts/derive-doctrine.py --sql` remplit, et dont la **forme physique appartient à la session** ; le **`02-` §6 B** porte la règle qui est enfreinte à l'écran — *« Une **banque de consignes** s'affiche pour le couple **objet × mode × cran** »*, et *« l'observable […] vient de la route, pas de la saisie »* ; le **`04-` §0** est le domicile de cette dernière phrase — *« Tout couple (objet, mode, cran qui isole) portant une route vaut `isole` sur l'observable qu'elle nomme »* — et il dit aussi que **le domicile d'une route est le fichier de `instances/` et sa section**, jamais le code technique ; le **`08-` §7** porte les deux contrôles qui jugent sur cette table — le **refus n° 15** *(un `observable_isole` « qui n'est routé ni pour cet objet, ni pour ce mode, ni pour ce cran »)* et le **blocage n° 3** *(« la route existe, la consigne manque »)*.

⚠️ **Le `08-` porte DEUX « version », et elles ne parlent pas de la même chose** : la ligne **VERSION du document** *(1.2)* et la **version du format JSON** *(1.1, l'en-tête `version` du fichier d'import)*. Ne les confonds pas, et ne « corrige » ni l'une ni l'autre.

**Rien de plus : ce qui ne figure pas au manifeste ne se lit pas** *(`PLAN_DE_CHANTIER.md` §5 ; la règle de manifeste elle-même est au `07-` §2)*. Cinq précisions pour que la règle ne fasse pas trébucher :

- l'`AGENTS.md` du dépôt n'est pas une source : Claude Code le charge d'office *(le `CLAUDE.md` s'y réduit)*, il porte les conventions du repo — jetons de `globals.css` sans hex en dur, journal SQL, gates, et **toute idée ou découverte hors périmètre → une ligne dans `IDEES_post_rentree.md`, pas dans le code** ;
- **`SPEC_C3_exercices_competences.md` est archivée : elle ne fait foi sur rien et ne se lit pas.** Elle traîne **à la racine du dépôt `palimpseste`** *(et une copie dans `_to_delete/`)*. **Aucun `RELEVE_*` ni `RAPPORT_*` n'est une source non plus** — et ce lot en a un qui te tenterait : `RELEVE_Recette_C4_L8_trois_epreuves_2026-08-21.md`, où le défaut a été trouvé. **Ne l'ouvre pas** : tout ce qu'il porte pour toi est **déjà dans les pièges ci-dessous**, et ce qu'il portait pour la source est **déjà écrit au `07-` §2**. Quand un piège cite un fait du dépôt plutôt qu'un relevé, c'est délibéré : **un fait de code se vérifie à sa source** ;
- **le statut porte sur le fichier, la section dit seulement où lire** *(`07-` §2)*. **Dans le `07-`** — *ce document* — : le **§2** *(la mission même, et les frontières — la fabrique est **C4-L8**, joué ; le déroulé de l'élève est **C4-L3**, qui dépend de toi)*, le **§1.1** *(l'instance, sa `consigne_instanciee` et sa `couverture_observables` — ce que la banque remplit « sans une saisie de plus »)*. **Dans le `02-`** — dont le statut couvre tout le fichier — : le **§6 A** *(la porte de la référence, que la conception traverse aussi)* et le **§1** *(les treize objets)*, pour lire les messages de refus sans les réécrire. **Dans le `04-`** : le **§14** *(les trois crans de production — leur banque **ne vient pas des routes** mais des quinze patrons ; ta pagination ne change rien pour eux, et c'est normal)* ;
- **l'outillage n'est pas une source, c'est la preuve** : `scripts/derive-doctrine.py` *(`--verifie` / `--sql` / `--fixture`)* · `utils/fabrique/doctrine.fixture.json` *(une **sortie** du script, l'entrée des tests)* · `SUIVI_SQL.md` · `SUIVI_tests_manuels.md`. **Un journal atteste un état ou une décision déjà prise ; il ne fonde jamais une règle** — et ce qu'il atteste, tu le revérifies **par requête** ;
- ⚠️ **et une garde de lecture, apprise à la dure** : `SUIVI_SQL.md` et `SUIVI_tests_manuels.md` portent des **guillemets français à l'intérieur des titres**. Un `grep` sur une phrase entière ne trouve rien. **Grepe le fragment le plus court.**

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot.

Concrètement, pour ce lot : vérifie que les quatre pièces **existent**, que le `07-` porte **VERSION 2.21**, le `02-` **VERSION 5.4**, le `04-` **VERSION 3.2** et le `08-` **VERSION 1.2**.

**Aucune fiche de `competences/` n'est à ton manifeste, et la clause granulaire ne te concerne pas** — ni directement, ni par la bande : ce lot ne mesure rien, n'ouvre aucune compétence et n'appelle aucun modèle. Il tourne **entièrement sans qu'une seule fiche soit versée et bancée**.

**Vérifie ensuite la dépendance, par requête, pas par confiance.** Ce lot dépend de **C4-L8** *(`PLAN_DE_CHANTIER.md` §3)*, et de lui seul :

- **C4-L8 est joué en sandbox** — quatre migrations le **20/08** *(`c4_l8_doctrine.sql`, `c4_l8_doctrine_correctif_routes.sql`, `c4_l8_doctrine_complement.sql`, `c4_l8_fabrique.sql`)*. Les tables de doctrine existent, et les quatre chemins que tu répares sont écrits.
- **La doctrine est en base, et à jour de sa SIXIÈME passe** — jouée le **21/08 à 20:51:13 UTC**, outil **1.2**. Vérifie-le **par requête**, en trois gestes qui ne coûtent rien : `select count(*) from doctrine_derivation` → **6** ; le dernier `outil` → **`scripts/derive-doctrine.py 1.2`** ; `select count(*) from exercices_routes` → **3264**. ⚠️ **Ces trois-là sont ta ligne de base** : si `exercices_routes` en porte moins de 3264, ce n'est pas ton défaut que tu regardes — c'est une dérivation qui manque, et **elle se rejoue par `--sql`, jamais à la main**.
- **La sixième passe a réécrit 112 consignes** : *« Parmi ces **trois** … »* est devenu *« Parmi ces **quatre** … »*. Contrôle utile parce qu'il **distingue la base de l'écran** : en base, `like '%ces trois%'` → **0** et `like '%ces quatre%'` → **96**. **À l'écran, tu n'en verras qu'une partie tant que ton lot n'est pas fait** — c'est exactement le défaut.
- **Cinq interrupteurs sont à OFF et doivent le rester** : les trois du `07-` §1.5 *(`exercices_actif`, `routeur_actif`, `competences_affichage_actif`)*, plus `fabrique_actif` *(C4-L8)* et `chaine_actif` *(C4-L5)*. **Ce lot n'en allume aucun, et n'en crée aucun.**
- **Le décor de recette du 21/08 est en sandbox, décrit et volontairement conservé** — un matériau `mat-lien-codex-0001`, une instance `d15ef81f-…` conçue par la porte Codex, ses deux dépôts, son cas à douze distracteurs. **Il est la preuve de C4L8-1 : ne le nettoie pas.**

Si une pièce manque ou bloque, **arrête-toi et signale-le, ne devine pas**.

## La mission — reprise du `07-Implementation.md` §2

> **C4-L8-bis — La doctrine lue en entier.** La fabrique lit ses **douze tables de doctrine** par le client admin, **et elle en lit mille lignes au plus** : une réponse sans pagination est plafonnée, et `exercices_routes` en porte 3264. **Sept objets sur treize n'ont dès lors aucune route visible** — `paragraphe`, `partie`, `phrase`, `plan`, `problematisation`, `reference`, `transition` : leur **banque de consignes s'affiche vide**, et le choix étant obligatoire, **l'objet devient inconcevable**. La même doctrine tronquée sert la **garde serveur de la conception** et le **contrôle d'import de la plateforme** : un observable pourtant routé s'y fait refuser « non routé » — *refus n° 15 et blocage n° 3 du `08-` §7*. *Les lignes sont en base ; c'est la **lecture applicative** qui plafonne, et le contrôle de dérivation ne peut pas le voir, puisqu'il lit les sources.*
>
> **Ce lot ne construit aucun écran et n'écrit rien en base.** Il porte deux gestes, et rien d'autre :
>
> - **la lecture se pagine** — les **douze** tables, par un seul chemin, et non la seule qui déborde aujourd'hui. *Arbitrage que l'implémentation seule fait apparaître : relever le plafond de lignes côté projet corrigerait l'écran du jour, mais un réglage ne vit pas au dépôt et **ne suivrait pas la base prod neuve** que C11b monte — le défaut renaîtrait à la première conception en production.*
> - **l'assemblage refuse une doctrine TRONQUÉE**, comme il refuse déjà une doctrine vide : il confronte ce qu'il a lu au **décompte que la base annonce**, table par table, et **s'arrête** quand les deux diffèrent. *Une doctrine incomplète ne se dénonce pas d'elle-même : elle refuse ce qui est licite, avec le motif de la source. C'est le pire des silences.*

**Et rien d'autre.** Ce lot est **une lecture, et le garde-fou de cette lecture**. Il ne conçoit rien — la conception est **C4-L8**, jouée. Il ne sert rien à l'élève — le déroulé est **C4-L3**, qui **dépend de toi** *(`PLAN_DE_CHANTIER.md` §3 : « la banque de consignes doit être entière avant qu'un élève lise ce qu'elle rend »)*. Il ne mesure rien, ne route rien, n'assigne rien. **Le lot entier tient dans `utils/fabrique/doctrine.ts` et dans ce qu'il faut pour le prouver.** Si tu te retrouves à écrire une migration, un écran ou un appel de modèle, **tu as quitté le lot**.

## Les pièges — les décisions dont l'oubli coûte une migration

*Les renvois nomment leur document ; « §1 », « §1.1 », « §2 » nus pointent au `07-Implementation.md`. **Quand un piège tranche au lieu de citer, il le dit** — et ce qu'il tranche va au relevé. En cas de doute entre ce prompt et la source : **la source a raison**.*

### Ce que ce lot ne construit pas

1. **Aucun écran neuf, aucune route neuve, aucun composant neuf.** Les chemins qui lisent la doctrine **existent déjà** et sont **quatre**, pas trois : `app/prof/conception/nouvelle/page.tsx`, `app/prof/conception/actions.ts`, `app/prof/conception/[id]/page.tsx`, et **`utils/fabrique/import-ecriture.ts`** — celui-là est hors de `app/prof/conception/` et c'est justement le contrôle d'import. **Compte-les avant de commencer** : si ta correction n'en couvre que trois, elle laisse le contrôle d'import juger sur une doctrine tronquée.
2. **Aucune migration, et donc aucune ligne au `SUIVI_SQL.md`.** Ce lot **n'écrit rien en base et ne lit rien de neuf** : il lit mieux ce qui est déjà lu. Les deux conventions de dépôt qui valent « pour tout lot qui touche la base » **ne s'appliquent pas** — elles sont rappelées à la fin pour que tu ne les cherches pas.
3. **Aucune re-dérivation.** La sixième passe est jouée. **Ne joue pas `--sql`** : joue `--verifie`. *Rejouer une passe pour « être sûr » ferait une septième ligne au journal de dérivation sans qu'aucune source ait bougé, et brouillerait la preuve de la sixième.*
4. **Ne touche pas la chaîne.** `utils/chaine/contexte.ts` lit `exercices_routes` lui aussi — mais **filtré** *(`.eq('objet_code', …).eq('cran', …).in('mode', …)`)* : quelques lignes, jamais mille. **Hors périmètre, et sain.** Ne le « harmonise » pas avec ta pagination.
5. **Ne corrige pas le mêlage des candidats.** `composerApercu` pose la `reponse_attendue` en quatrième position à tous les coups ; c'est connu, c'est **tranché**, et c'est le **neuvième item de la boîte de C4-L3** *(`PLAN_DE_CHANTIER.md` §5)*. **L'aperçu du professeur reste délibérément déterministe** — c'est ce qui lui permet de le relire deux fois sans qu'il change. Tu vas beaucoup regarder cet aperçu pour prouver ton lot : **regarde-le, ne le répare pas.**
6. **Ne déplace pas l'opt-out**, ne touche pas à la « zone en construction » du profil de classe, ne repose pas les `search_path` : ce sont des gestes du **lot de correctifs** *(`PLAN_DE_CHANTIER.md` §6)*. Ce lot n'est pas ce lot.

### La pagination — comment on la fait, et ce qui la casse

7. **Le patron existe au dépôt : réemploie-le.** `utils/chaine/couts-serveur.ts`, fonction `depenseParPages` — *« Le repli : on pagine, et on ne s'arrête que quand une page revient courte. »* Boucle par pages de mille, `range(debut, debut + PAGE - 1)`, arrêt quand `lignes.length < PAGE`. **N'invente pas une seconde manière de paginer dans le même dépôt.**
8. ⭐ **Une pagination SANS TRI STABLE saute et répète des lignes.** Sans `order`, l'ordre de retour n'est garanti par rien d'une requête à l'autre : deux pages peuvent se recouvrir **et** une ligne se perdre. C'est le défaut le plus vicieux du geste que tu fais, parce qu'il rend une doctrine du bon **nombre** et du mauvais **contenu**. **Ordonne sur une clé stable, table par table** : `exercices_routes` a un `id uuid primary key` ; `exercices_consignes_isolees` a une clé primaire composite *(`competence`, `source_section`, `cran`)* ; `exercices_crans` a `cran`. **Le patron de `couts-serveur.ts` ordonne, lui aussi** — ce n'est pas décoratif.
9. **Les douze tables, par un seul chemin.** Une seule dépasse mille lignes **aujourd'hui** : `exercices_routes` *(3264)* ; la suivante en porte **336**. Sur les onze autres, la première page revient courte et la boucle s'arrête au premier tour — **le coût est nul**. Un correctif qui ne vise que `exercices_routes` **fait revenir le même défaut, en silence, le jour où une source grossit**. *(Les comptes du jour, tels que la sixième passe les a rendus : `exercices_types` 13 dérivés · `exercices_types_modes` 54 · `exercices_types_modes_source` 46 · `exercices_types_crans` 117 · `exercices_crans` 9 · `exercices_durees` 9 · `competences_modes_admis` 13 · `exercices_routes` 3264 · `exercices_consignes_isolees` 336 · `exercices_consignes_production` 15 · `exercices_guides_production` 24 · `demonstrations_formes` 3.)*
10. **Le type `ClientLecture` est étroit exprès.** `doctrine.ts` déclare *« Le client Supabase, réduit à ce qu'on lui demande ici »* — `select` y rend directement une promesse. `.range()` et `.order()` demandent de l'élargir : **élargis-le au minimum de ce que tu appelles**, ne le remplace pas par `SupabaseClient`. Ce module est lisible parce qu'il déclare exactement ce qu'il exige de son client, et les quatre appelants lui passent déjà `admin as never`.
11. **Ne défais pas les jointures embarquées.** Quatre des douze `select` portent `exercices_types!inner(code)` — la pagination porte sur les **lignes de tête**, elle ne s'y oppose pas. Garde-les : c'est par elles que `objet_code` est reconstruit.
12. **Les douze appels sont en `Promise.all`, et c'est bien.** Douze lectures parallèles, chacune paginée pour son compte. **Ne les mets pas en série** « pour simplifier » : la page de conception les attend toutes.

### Le garde-fou — refuser une doctrine tronquée

13. ⭐ **L'assemblage refuse déjà une doctrine VIDE ; il doit refuser une doctrine TRONQUÉE.** Le commentaire de `assemblerDoctrine` dit pourquoi : *« Un contrôle d'import qui tournerait sur une doctrine vide accepterait tout. »* La tronquée est **pire** — elle ne laisse pas tout passer, elle **refuse ce qui est licite, avec le motif de la source**. La lecture compare donc, **table par table**, ce qu'elle a lu au décompte que la base annonce *(`select(…, { count: 'exact', head: true })`)*, et **s'arrête** quand les deux diffèrent.
14. ⚠️ **Compare au décompte de la BASE, jamais aux comptes de la fixture.** `exercices_types` porte **quinze** lignes en base — les **treize** objets dérivés **plus les deux types diagnostiques** *(`nature = 'complet'`, `diagnostic_essai` et `diagnostic_explication_texte`, posés par le **seed de C4-L1**, et que la dérivation **met à jour** au lieu de les réécrire)* — quand la fixture n'en porte que **treize**. Un garde-fou écrit sur les comptes de la fixture **crierait faux à chaque chargement**, et on l'enlèverait dans la semaine.
15. **Le refus doit être lisible par un humain, pas par toi seul.** Dis **la table**, **le nombre lu**, **le nombre attendu**. `DoctrineAbsente` n'est attrapée **nulle part** dans les quatre chemins — le seul `catch` de `app/prof/corpus/actions.ts` n'entoure que le `JSON.parse` du fichier — donc ton message **remonte tel quel**. Écris-le pour quelqu'un qui découvre le problème un mardi matin.
16. **Ce n'est pas un avertissement en console.** Un `console.warn` sur une doctrine incomplète, c'est le silence du 21/08 avec une ligne de log en plus. **On s'arrête.**
17. ⭐ **Le test ne peut pas passer par la base — et c'est précisément pourquoi le défaut a vécu sous 414 tests verts.** `divergences.test.ts` et `verifie-import.test.ts` assemblent depuis `doctrine.fixture.json`, qui porte les **3264** routes : ils n'ont **jamais** vu PostgREST. **La boucle et le garde-fou se prouvent donc sur une doublure de client** — un faux `admin` qui rend des pages de mille lignes et un décompte, et qui prouve les trois cas : la pagination complète, le décompte qui concorde, le décompte qui diffère et arrête. *Bénéfice second : cette preuve-là passe partout, y compris là où la base est injoignable.*

### Ce que le défaut faisait, et ce que ta correction doit faire voir

18. ⚠️ **La liste des sept objets aveugles n'est PAS stable, et rien ne doit s'y accrocher.** `--sql` fait `delete from …` puis `insert` sur les tables dérivées : **l'ordre physique des lignes se refait à chaque passe**, et c'est lui qui décide quelles mille lignes reviennent. Les sept nommés à la mission — `paragraphe`, `partie`, `phrase`, `plan`, `problematisation`, `reference`, `transition` — sont une **observation datée du 21/08**, pas une propriété du système. **Ne code aucun cas particulier dessus**, et ne t'étonne pas si tu en observes d'autres avant correction.
19. **Les deux chiffres qui font la preuve à l'écran** : `partie` × `composer` au **cran 3** passe de **0 consigne proposée à 40** — c'est celui qui rendait l'objet **inconcevable**, le choix étant obligatoire ; et `argument` × `composer` au cran 3 passe de **16 à 24**. *Les routes par objet, pour te repérer : `partie` 594 · `paragraphe` 540 · `objection` 360 · `argument` 336 · `problematisation` 300 · `phrase` 246 · `plan` 246 · `conclusion` 186 · `introduction` 132 · `transition` 108 · `mot` 90 · `exemple` 66 · `reference` 60.*
20. **Ce que ta correction va faire apparaître pour la première fois** : les **112 consignes réalignées** de la sixième passe, sur les objets qui étaient aveugles. Une consigne d'un de ces objets qui dirait encore *« Parmi ces **trois** … »* ne veut **pas** dire que ta pagination a échoué — elle veut dire que **la base n'a pas la sixième passe**. Reviens au contrôle d'entrée avant de chercher dans ton code.
21. **Les trois crans de PRODUCTION ne changeront pas, et c'est normal.** Aux crans **2, 6 et 8**, `exercices_routes` est **vide par contrainte** *(`routes_cran_isole_chk`)* : leur banque vient des **quinze patrons** du `04-` §14.1 et des guides du §14.2. **Si un cran de production reste identique après ta correction, ce n'est pas un défaut** — c'est la doctrine.
22. **Les deux messages de la garde serveur sont distincts, et tu dois voir les deux disparaître** : *« l'observable `X` n'est pas routé pour `partie` × `composer` au cran 3 »* et *« la route existe, la consigne manque (blocage n° 3) »* — tous deux dans `empechementsDeConception` *(`utils/fabrique/conception.ts`)*. Le premier est ce que le défaut fabriquait à tort ; **le second est légitime et doit rester possible**. Ne les fusionne pas, ne les affaiblis pas.
23. **Le contrôle d'import se prouve par un import, pas par une lecture.** Dépose un fichier portant un `observable_isole` **routé sur l'un des objets aveugles** : avant, **refus n° 15** ; après, il entre. Le geste existe et il est **idempotent** — `scripts/recette/deposer-import.mjs`, documenté au `scripts/recette/LISEZ-MOI.md`.

### Ce que le contrôle de dérivation ne voit pas — et ne verra pas de ton lot

24. ⭐ **`derive-doctrine.py --verifie` a dit IDENTIQUE pendant tout le défaut, et il avait raison.** Il compare **les sources** aux empreintes du journal de dérivation ; il ne passe **jamais** par la lecture applicative. **Ne lui demande pas de prouver ton lot** — il n'en sait rien, et il continuera de dire IDENTIQUE si tu casses ta pagination.
25. **Et il ne contrôle pas tout ce que `--sql` écrit** : `exercices_types_crans` est **écrite par `--sql` et jamais lue par `--verifie`** — **douze tables remplies, onze contrôlées**, et la manquante est celle où la couche type se remplit aux crans de production *(`PLAN_DE_CHANTIER.md` §6)*. **Ce n'est pas à toi de le réparer**, mais sache-le : « onze IDENTIQUE » n'est pas « rien n'a bougé ».
26. **`npm test` ne passe aujourd'hui que sur la machine du professeur** : les deux chaînes de dérivation embarquent **le chemin absolu de la racine** dans ce que leur contrôle compare *(`_derivation.racine` dans la fixture)*. **C'est connu, c'est au lot de correctifs, ce n'est pas ton lot** — mais c'est la raison pour laquelle **ton nouveau test doit tenir sans base ET sans racine** : une doublure de client, rien d'autre. *Ne l'aggrave pas ; dis au relevé si tu l'as frôlé.*
27. **La preuve à l'écran se prend depuis le Mac.** Depuis une séance en nuage, la base Supabase est **injoignable** *(le mandataire refuse le CONNECT, et le shell qui voit les dossiers montés n'a ni `psql` ni DNS)*. Les deux chemins qui marchent sont **le navigateur** et **le terminal** de Louis. La connexion se prend dans `.env.local` : `DB=$(grep -m1 '^SUPABASE_DB_URL=' .env.local | cut -d= -f2- | tr -d '"')`. ⚠️ **N'écris jamais `psql "…"` en exemple** : la chaîne vide fait atterrir la commande sur le **Postgres local du Mac**, qui répond « database does not exist » et fait perdre un quart d'heure.

## Le « fait quand » — recopié du `07-Implementation.md` §2

> *Fait quand* : les **treize objets** offrent leur banque de consignes à la conception — `partie` × `composer` au cran 3 comprise, qui en porte quarante ; une lecture de doctrine **rend autant de lignes que la base en compte**, table par table, et **s'arrête explicitement** sinon ; un observable routé sur l'un des sept objets aveugles **passe la garde serveur et le contrôle d'import** ; `npm test` reste vert.

C'est la condition de recette, et **elle ne se négocie pas en séance**. Quatre précisions qui n'en changent rien :

- **« les treize objets offrent leur banque »** se constate **à l'écran**, objet par objet, `porte=codex` et `porte=aletheia`, **pas par une requête sur la base** — la base n'a jamais été en cause. Les **treize**, pas « les sept qui manquaient » : un objet qui perdrait sa banque en gagnant les autres serait le même défaut à l'envers.
- **« rend autant de lignes que la base en compte, table par table »** se prouve **deux fois** : une fois **hors ligne**, par la doublure de client, sur les trois cas *(complet · concordant · divergent, qui arrête)* ; une fois **contre la sandbox**, en chargeant la doctrine pour de vrai et en vérifiant qu'aucun refus ne se lève. **Le second sans le premier ne prouve rien de durable** — il prouve un jour, sur une machine.
- **« passe la garde serveur et le contrôle d'import »** sont **deux gestes distincts** : concevoir une instance sur `partie` × `composer` au cran 3 avec un observable routé *(la garde)*, et déposer un fichier d'import qui porte le même observable *(le refus n° 15)*. **Fais les deux** : ils lisent la même doctrine par deux chemins que rien ne relie.
- **« `npm test` reste vert »** veut dire **414/414 au moins**, et **plus** si tu ajoutes le test de la doublure — ce qui est attendu. ⚠️ **Un `npm test` vert ne prouve pas ton lot** *(piège 17)* : il prouve que tu n'as rien cassé.

**Vérifié veut dire par requête et sur pièce, pas supposé.**

## Les conventions

**Deux conventions de dépôt — pour tout lot qui touche la base** *(`PLAN_DE_CHANTIER.md` §5)* : une ligne au `SUIVI_SQL.md` **avant** exécution, et des migrations **additives et gatées**. ⚠️ **Elles NE S'APPLIQUENT PAS ici** : ce lot n'écrit rien en base. Elles sont rappelées pour que tu ne les cherches pas — **et pour que tu saches que si tu te découvres en train d'écrire une migration, tu as quitté le lot** *(piège 2)*.

**Une convention de doctrine — pour tout lot qui s'appuie sur la doctrine en base, et c'est ton cas** : **elle est dérivée, jamais tapée, et il n'y a qu'un dériveur.** Avant de lire ces tables, joue `python3 scripts/derive-doctrine.py --verifie` — il doit dire **IDENTIQUE** sur les onze tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejoue `--sql` ; jamais corriger la base à la main.** *(Et rappelle-toi ce qu'il ne contrôle pas — pièges 24 et 25.)*

**Une convention d'ouverture de compétence — elle NE S'APPLIQUE PAS ici.** Ce lot n'ouvre aucune compétence dans la chaîne : il ne dérive aucun instrument, n'importe aucun dérivé et ne branche aucun prompt. *(Les trois gestes vivent au `utils/chaine/LISEZ-MOI.md`, et c'est le lot qui ouvre une compétence qui les joue.)*

**Une convention de clôture — pour tout lot** : **ta section au `SUIVI_tests_manuels.md`** — ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché**. **Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.**

Pour ce lot, ta section portera au moins : **les treize objets et leur banque, objet par objet, avec le compte constaté** ; **`partie` × `composer` cran 3 : 0 → 40** ; **la conception d'une instance sur un objet naguère aveugle**, jusqu'à l'assignation ; **l'import qui portait le refus n° 15 et qui entre** ; **les trois cas de la doublure de client** ; et **le décompte lu contre le décompte annoncé**, table par table, avec les douze chiffres.

⭐ **Et une ligne à écrire ailleurs, qui ne t'appartient qu'à moitié** : la ligne **F1** du `SUIVI_tests_manuels.md` § C4 · L8 dit *« Rien n'a été réparé ici »* et renvoie à ton lot. **Complète-la** quand tu auras fini — sans quoi le seul endroit où le défaut est décrit continuera de dire qu'il est ouvert.

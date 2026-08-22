# PROMPT — Session Code : C4-L1 — Le schéma et les interrupteurs

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec leurs versions au moment de l'écriture.

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1** · le **suivi SQL** · le fichier de **RLS élève**, comme patron *(déposé)*.

« Ce document » est le `07-Implementation.md`. Les trois pièces :

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | aucun — un lot n'exige pas un statut de la source qui le déclare *(`07-` §2)* | **VERSION 2.2** · VALIDÉ ET GELÉ *(vaut relu et validé)* |
| `SUIVI_SQL.md` | racine de ce dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | pas de ligne VERSION — un journal vivant, ouvert le 23/07/2026 |
| `c1_rls_eleve.sql` | racine de ce dépôt | **déposé** *(explicite au manifeste)* | pas de ligne VERSION — en-tête calé sur le dump `pg_policies` du 23/07 |

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`07-` §2)*. Deux précisions pour que la règle ne fasse pas trébucher :

- l'`AGENTS.md` du dépôt n'est pas une source : Claude Code le charge d'office, il porte les conventions du repo ;
- **`SPEC_C3_exercices_competences.md` est archivée : elle ne fait foi sur rien et ne se lit pas.** Elle traîne à la racine de ce dépôt, son nom ressemble au sujet du lot — ne l'ouvre pas.

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot.

Concrètement, pour ce lot : vérifie que les trois pièces **existent**, et que l'en-tête du `07-` porte bien **VERSION 2.2**. Le manifeste ne compte aucune fiche de compétence — la clause granulaire n'a pas d'objet ici. Si une pièce manque ou bloque, **arrête-toi et signale-le, ne devine pas**.

## La mission — reprise du `07-Implementation.md` §2

> **C4-L1 — Le schéma et les interrupteurs.** Toutes les tables du §1, le **seed** des treize objets et des types diagnostiques, les clés étrangères vers le plan d'exercices, la **RLS et les gardes serveur**, les **trois interrupteurs posés à OFF**, l'**index unique du squelette** et l'**unicité avec empreinte** sur les références.

**Et rien d'autre** — ni écran, ni appel de modèle, ni règle de routage. Ce lot bloque tout le reste : *aucun autre lot n'écrit sans ses tables* *(`PLAN_DE_CHANTIER.md` §3)* ; il ne construit que la base.

**Le `07-` §1 fait foi et se lit en entier.** Ses cinq blocs — les objets et les instances *(§1.1)*, la mesure *(§1.2)*, l'état *(§1.3)*, le Monitoring *(§1.4)*, le journal et les compteurs *(§1.5)* — déclarent **dix-sept tables neuves**, **les démonstrations du temps 1** *(§1.1 — la forme physique t'appartient)*, **trois touches à l'existant** *(`api_couts`, `profiles`, `classes`)* et **les clés étrangères vers le plan d'exercices**. **La forme physique t'appartient** — colonne, table fille ou JSONB : le document exige que la donnée existe, qu'elle soit nommée et qu'elle soit gardée ; il ne choisit pas son type *(`07-` §1)*.

## Les pièges — les décisions dont l'oubli coûte une migration

*Sauf mention, les renvois pointent au `07-Implementation.md`. En cas de doute entre ce prompt et la source : la source a raison.*

### Ce qui ne se crée pas

1. **Six valeurs ne sont pas des colonnes** — la série d'une mesure, le `regime_v1vf` d'un exercice, le registre courant du retour, l'historique des cibles, le signal de ciblage, la valeur de ciblage non plafonnée : **un état se stocke, une lecture se recalcule** *(§1, table d'ouverture)*.
2. **Aucune table ne porte de colonne `famille`** — le partage composition / réception se dérive des modes élus *(§1)*.
3. **Six attributs d'`exercices_types` ne seront pas créés** — `produit_mesure`, `duree_redaction_min`, `complexite`, `etayage[]`, `duree_v1_min`, `duree_vf_min`. Le §1.1 est écrit « pour qu'une session ne les cherche pas ».
4. **Aucun champ `note`, nulle part** *(§1.1)* · **aucune lettre et aucun coût sur les squelettes** *(§1.2)* · **aucun champ de dispersion sur les mesures** — la dispersion appartient à l'instrument et se lit par `instrument_version` *(§1.2)* · **aucune liste des compétences dans `competences_niveaux`** — ce qui a une lettre est une conséquence calculable *(§1.3)* · **la distribution de montée ne se stocke jamais** *(§1.3)* · **l'agrégation des coûts se fait en requête, jamais en colonne** *(§1.2)*.

### Les clés — quatre tables d'état, quatre clés différentes

5. `competences_niveaux` : **(élève × compétence)** — **pas de classe dans la clé**, le profil est unifié par élève *(§1.3)*.
6. `competences_escalade` : **(élève × compétence × observable)** — un élève peut être en N2 sur un observable et en régime normal partout ailleurs *(§1.3)*.
7. `competences_montee` : **(élève × compétence × grain)**, un `cran_atteint` — **pas trois colonnes** `_micro`/`_meso`/`_macro`, qui graveraient l'énuméré des grains dans des noms *(§1.3)*. **C'est un ÉTAT, pas une trace** : recalculé du journal, un changement d'`instrument_version` ferait redescendre un élève d'un cran sans que personne ne l'ait décidé *(§1.3)*.
8. `competences_actives_par_classe` : **(classe × compétence)** — **aucune composante de série dans la clé** *(§1.3)*.
9. **L'index unique `(dépôt, compétence, version)` sur `exercices_squelettes`** — le garde-fou d'idempotence, nommé par la mission : une copie ne produit jamais deux squelettes pour la même compétence *(§1.2)*.
10. `exercices_references` : **unicité et empreinte immuable** — un texte ne se décompose jamais deux fois, une référence validée ne se modifie plus en silence — et **une référence non validée n'entre jamais dans une phase de jugement** *(§1.1)*.

### Une ligne, pas deux

11. **Une paire de diagnostic est UNE ligne d'`exercices`** — `consigne_instanciee` déclare **deux cas, dans l'ordre** *(§1.1)* — **un seul dépôt, deux crédences, UNE mesure** : les deux résultats de la paire s'attachent à la mesure, **le nouveau cas n'écrit jamais une seconde ligne**, et **NULL n'est pas un échec** — une paire non terminée est NULL *(§1.2)*.
12. **Un objet partagé par deux compétences prend une seule ligne** d'`exercices_types` — deux lignes ne se séparent que si ce que l'élève produit diffère *(§1.1)*.
13. **`exercices_depots` se crée dès l'ASSIGNATION, pas au dépôt** *(§1.1)*. Statut : `assigne` → `ouvert` → `v1_remis` → `retour_publie` → `vf_remis` → `clos`, plus **`abandonne`, exclu des règles de stagnation** ; **en classe, la séquence s'arrête à `retour_publie`** *(§1.1)*.

### NULL, listes et valeurs qui piègent

14. **La compétence s'écrit en identifiant nu** — `expression` · `argumentation` · `structure` · `connaissance` · `synthese` · `questionnement` : **six, pas de préfixe**, les six traversent les deux séries *(§1.2)*. **Les `modes` sont une liste, jamais une valeur** *(§1.2)* — et sur l'instance, ils s'élisent **par compétence mesurée** *(§1.1)*.
15. **La `lettre` de `competences_niveaux` est NULLABLE, et l'absence de lettre est une règle, pas un cas limite** *(§1.3)*.
16. **`confiance_declaree` : une valeur par compétence `evaluee` mesurée, jamais un scalaire** *(§1.1)* ; la **`credence`** : plusieurs valeurs par dépôt — deux sur une paire *(§1.2)*.
17. **`motif_depassement` : NULL quand la micro-question n'a pas été déclenchée ou pas répondue** *(§1.1)* · **les observables d'une mesure viennent de la v1 seule**, la version finale n'alimente que le delta *(§1.2)* · **`sonde_montee` se marque** — à ne pas confondre avec les sondes secondaires, qui comptent *(§1.2)*.
18. **Monitoring : `n/a` est une valeur déclarée** — l'amplitude n'est **pas un entier nu**, les deux colonnes doivent l'accepter *(§1.4)* · **direction NULL quand l'amplitude vaut 0** *(§1.4)* · **dénominateur à zéro → taux NULL, jamais zéro** *(§1.4)* · les colonnes propres aux deux sous-dimensions **ne se croisent pas** *(§1.4)* · **la `source` est un champ, pas un commentaire** *(§1.4)*.
19. **Le Monitoring a ses deux tables — `monitoring_mesures`, `monitoring_niveaux` — et n'entre jamais dans `competences_mesures` ni `competences_niveaux`** *(§1.2, §1.4)*. `exercices_metacognition` alimente `monitoring_mesures`, **jamais `competences_mesures`** *(§1.2)* ; **la saisie de crédence vit au dépôt, le Monitoring ne reçoit que l'accord** *(§1.2, §1.4)*.
20. **Le parcours** : `type_pedagogique` **à valeurs fermées** sur la classe, **nullable**, distinct du **libellé de filière** libre — le filtre ne lit que le second et ne le dérive jamais du premier ; **le parcours d'un élève ne se stocke pas**, il se dérive de l'**union de ses inscriptions actives** *(§1.3)*.
21. **`profiles` : les trois champs d'aménagement s'ajoutent en migration additive** — `mode_saisie_force`, `exception_expression`, `exception_orthographe` : des **marques pédagogiques, jamais un diagnostic médical**, pas de motif, pas de texte libre ; leurs règles vivent ailleurs, ce lot pose les champs *(§1.3)*. **Et la policy self-service reste morte : aucun élève n'écrit sa propre ligne** — ne la réintroduis pas *(§1.3)*.

### Ce qui existe déjà — se réutilise, ne se recrée pas

22. **`api_couts` existe.** Deux ajouts : la **`phase`** — `p1`, `p2`, `retour`, **NULL hors exercices** ; elle dit **l'étage, pas le nombre d'appels** — et le **rattachement à l'exercice** *(dépôt, compétence, version)* — **tous nullables, au mieux** : un coût non attribuable reste une ligne valide *(§1.2)*.
23. **Le drapeau d'intégrité passe par `signalerEnAttenteIA`** *(`utils/integrite.ts`)*, qui écrit dans `integrite_signalements` — **un lot le réutilise, il n'en crée pas un second** *(§1.2)*.
24. **`inscriptions`, `classes` et `profiles` existent** — tout s'y ajoute en additif *(§1.3)*. **Les photos vont au bucket existant**, par URL signée, **métadonnées EXIF purgées** *(§1)* ; `photos[]` porte l'ordre, la rotation, une somme de contrôle, **et sait dire qu'une page manque** *(§1.1)*.
25. **Les trois interrupteurs — `exercices_actif`, `routeur_actif`, `competences_affichage_actif` — au même emplacement que les interrupteurs existants, tous à OFF** *(§1.5 ; ce que chacun commande : le §5 du même document, que le §1.5 cite)*.
26. **`routeur_decisions` porte le tirage aléatoire et `degrade`** — sans colonne, le compteur n'existe pas *(§1.5)* · **`assiduite_hebdo` se collecte dès la rentrée** et porte les **deux compteurs de minutes** *(§1.5)* · `exercices_jobs` : **clé d'idempotence**, plafond de tentatives, **`echec_definitif` visible** *(§1.1)* · **`duree_exercice_min` ne se saisit jamais à la main** — obligatoire, dérivée du geste et du grain ; la stocker par cran admis ou la calculer à la volée est un choix d'implémentation *(§1.1)* · **les deux drapeaux d'opt-in de classe : sur l'instance, jamais sur le type, faux par défaut, sans effet quand `lieu` vaut `maison`** *(§1.1)*.

### Le seed — d'où vient son contenu

27. **Les treize objets font foi au `02-exercices.md` §1** — c'est une **citation portée par le §1.1**, et une citation se suit pour ce qu'elle désigne, au statut qu'elle présume — *déposé* : « la section dit seulement où lire » *(`07-` §2)*. **Ouvre ce passage-là, rien d'autre du `02-`.** Sa table à six colonnes est le contenu du seed.
28. **Les deux axes de déclaration** — par cran, par compétence *(§1.1)* — **existent en structure dès ce lot ; leur contenu vit hors manifeste** : la couche type dérivée du `04-` s'injecte au lot C4-L5, l'import du professeur arrive au lot C4-L8 *(`07-` §2)*. **Une valeur que le seed ne peut pas citer se laisse vide et se signale — elle ne s'invente pas.**
29. **Les types diagnostiques** : la mission les nomme, le §1 ne les détaille pas. Pose leurs lignes avec ce qu'une citation du §1 te donne ; **ce qui manque reste incomplet et se signale au professeur** — les décisions se prennent hors session.

### La conduite SQL — le manifeste la porte

30. **Une ligne au journal de `SUIVI_SQL.md` AVANT exécution** *(protocole, règle 1)* · **sandbox d'abord** *(règle 2)* · **ne rejoue jamais un fichier de l'Archive** *(règle 4)*.
31. **Les tables neuves, additives et gatées, suivent le protocole normal ; les touches à l'existant — `profiles`, `classes`, `api_couts` — suivent le protocole renforcé** : un élève réel utilise la base *(règle 5)*.
32. **Répétition à blanc : ne joue jamais le fichier entier dans une transaction d'essai** — son `commit;` validerait la transaction englobante. Copie le **corps** seul, et après le `rollback`, **vérifie par requête** le retour à l'état d'avant *(règle 6)*.
33. **RLS — le patron est `c1_rls_eleve.sql`** : lecture élève = **ses propres lignes, strictement** ; **toutes les écritures passent par le serveur** *(§1)* ; gare aux **doublons de policies OR'ées**, que le patron documente. **Deux tables ne sont jamais lisibles par l'élève avant la publication de son retour : les squelettes et la métacognition** — c'est la garde la plus facile à casser et la plus coûteuse : elle donne la grille et les réponses *(§1, §1.2)*.

## Le « fait quand » — recopié du `07-Implementation.md` §2

> *Fait quand* : les migrations passent en bac à sable, le **suivi SQL est à jour ligne par ligne**, un seed est lisible, et **les trois interrupteurs sont vérifiés à OFF**.

C'est la condition de recette, et **elle ne se négocie pas en séance**. « Vérifiés » veut dire **par requête, pas supposés**.

## Les deux conventions de dépôt — pour tout lot qui touche la base

- **Une ligne au `SUIVI_SQL.md` avant exécution**, jamais après.
- **Les migrations sont additives et gatées** — les trois interrupteurs restent à OFF jusqu'à la recette.

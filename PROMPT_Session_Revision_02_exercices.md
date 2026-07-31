# PROMPT — Session de révision de `02-exercices.md` (section par section, sur plusieurs séances)

> **Usage** : session Cowork fraîche, avec les deux dossiers connectés — `GitTest/palimpseste-conception`
> et `GitHub/palimpseste`. Poste **Mètis** (conception). Sur le modèle de
> `PROMPT_Session_Revue_Routeur.md`, dont la méthode a fait ses preuves deux fois : le
> `00-referentiel.md` relu en huit sections le 29/07, le `01-routeur.md` en quatorze passes le 30/07.

---

## Pourquoi cette session maintenant, et ce qu'elle débloque

`02-exercices.md` est **le goulot du chemin critique d'août**, et il l'est deux fois.

**Par la règle de manifeste.** Le tableau du §0 de la SPEC C3 le marque encore « **en relecture** », et
l'ouverture n° 6 du tableau de bord pose que « tout lot dont le manifeste exige un document encore en
relecture » s'arrête de lui-même. Or le lot **C4-L1** crée la table `exercices_types`, dont les
colonnes sortent de ce document. **C4-L1 est donc bloqué tant que ce fichier n'est pas validé.**

**Par le contenu.** Il déclare les **durées indicatives** et porte les **types de lecture**, dont la
séance unique « construction de la semaine + ciblage lecture » a besoin en entrée. Il vient donc
**avant** elle dans la séquence.

**La séquence, pour situer cette séance :**

1. La **branche d'échec du pipeline** (question F4, ci-dessous) — peut se régler ici, elle porte sur les types.
2. **Cette révision.**
3. La **séance unique** « construction de la semaine + ciblage lecture ».
4. La **matrice normative par statut de recette** (peut se faire en parallèle).
5. Le **gel de C3 en un bloc**.
6. La réécriture des prompts **C4-L1** et **C4-L2**, et la création du lot **R1-R6**.

En parallèle et indépendamment : **les bancs**, seule échéance dure au 24 août.

---

## Ta première action, avant toute autre chose

**Affiche `02-exercices.md` dans le panneau latéral.** Charge-le depuis
`palimpseste-conception/02-exercices.md` et **envoie-le à Louis** avec `SendUserFile` — il doit
pouvoir le lire pendant qu'il te commente. **Refais-le à chaque fois que tu modifies le fichier.**

Puis lis, dans cet ordre, et rien de plus :

| Fichier | Ce qu'on y lit |
|---|---|
| `palimpseste-conception/CONTEXTE.md` | conventions du chantier, journal des décisions, **règle de circulation avec C3**. Les entrées des **30 et 31 juillet** sont les plus importantes : elles portent la séance d'arbitrage. |
| `palimpseste-conception/02-exercices.md` | le document à réviser. **Sa note du 30/07, au §1, porte la liste de contrôle de cette séance.** |
| `palimpseste/RELEVE_Arbitrage_Referentiel_Routeur_2026-07-30.md` | **les vingt-sept décisions d'arbitrage, avec leur raison.** Il fait foi. Ne pas les rouvrir. |
| `palimpseste-conception/01-routeur.md` | **relu, validé et amendé** — c'est lui qui consomme ce que ce document déclare. §1.1, §1.4, §4 (couche 3), §5 (R1, R2, R5), §6, §9, §10. |
| `palimpseste/SPEC_C3_exercices_competences.md` | le **tableau de bord du socle**, puis le **§6** — la définition de `exercices_types`, qui est la contrepartie de schéma du gabarit du §1. |

Ne relis `00-referentiel.md`, `03-`, `04-` et les fichiers de `competences/` que si Louis demande un
détail précis.

---

## §0 — Table de progression *(à tenir à jour et à redéposer à chaque fin de séance)*

| § | Section | État |
|---|---|---|
| 1 | Le gabarit de la fiche de type | à passer — **c'est la plus lourde, et elle porte les sept points de la liste de contrôle** |
| 2 | Les gestes — les deux familles | à passer |
| 3 | Bibliothèque ÉCRITURE (types 1-14) | à passer |
| 4 | Bibliothèque LECTURE (L1-L12) — **passe 2 de co-conception en cours ici** | à passer |
| 5 | Progression sur l'année (esquisse) | à passer |
| 6 | État des questions de la co-conception lecture (au 27/07) | à passer |
| 7 | Banque d'instances, réutilisation, injecteur | à passer |
| 8 | Couches 2-3 lecture — **à relire à la lumière de F24** : les deux sessions n'en font plus qu'une | à passer |
| 9 | Renvois | à passer |

---

## Le régime de travail

**Une section à la fois, dans l'ordre du document.** Pour chaque section, dans cet ordre :

1. **Tu la restitues en quelques lignes** — ce qu'elle dit, en clair. Louis n'a pas à relire son
   propre texte pour se souvenir de ce qu'il a écrit il y a quinze jours.
2. **Tu poses ce que la séance d'arbitrage impose de changer dans cette section** (la liste est au
   §1 ci-dessous) — factuellement, sans plaider.
3. **Tu signales ce que tu y vois de fragile** : contradiction interne, attribut qu'une règle du
   routeur consomme et que le gabarit ne déclare pas, chiffre sans justification, silence sur un cas
   fréquent.
4. **Louis commente.** Tu écoutes, tu **reformules sa décision en spécification précise**, tu la
   **fais confirmer**.
5. **Tu écris dans le fichier immédiatement**, section par section — **pas à la fin de la séance**.
   Une séance interrompue ne doit rien perdre.

**Règle cardinale** : tu ne tranches rien à la place de Louis. Tu proposes, tu chiffres, tu vérifies
la cohérence avec le routeur et avec C3 — et tu t'arrêtes. Si un point n'est pas tranché, il se
marque **[à valider]**, jamais « acté ».

**Statuts** : *acté* / *provisoire (réglage empirique)* / *[à valider]*. Un « oui » de Louis acte un
**principe**, jamais un résultat : les seuils chiffrés restent provisoires sauf mention contraire.

**Convention d'écriture anti-écrasement** : relire le fichier sur disque **juste avant** de l'écrire,
modifier par **insertions ciblées** avec une assertion sur la chaîne d'ancrage, jamais de
régénération entière depuis ta mémoire. Pour les fichiers longs, écrire via `device_bash` plutôt que
par le montage — le cache du conteneur peut servir une copie périmée.

**Style** : lisibilité avant densité ; **expliciter chaque sigle à sa première occurrence**, dans la
conversation comme dans le document ; rappeler le contexte d'un point avant d'en discuter. Un item à
la fois, jamais un plateau de dix décisions.

**Une leçon de la séance d'arbitrage, à appliquer** : quand un point ne change rien à ce que Louis
fait concrètement, **le dire et l'écarter**. Le tri des neuf derniers items a ramené neuf discussions
à cinq.

---

## §1 — Ce que la séance d'arbitrage du 30-31 juillet a laissé à ce document

**Une note a été déposée au §1 du fichier le 30/07.** Elle porte la liste ci-dessous. Elle ne révise
rien — elle consigne ce que les décisions exigent du gabarit, pour que cette séance parte d'une liste
et non d'une relecture à froid.

### Les sept points de la liste de contrôle

1. **Couverture d'observables par type**, à trois valeurs : « **exercé** » / « **isolé** » /
   « **seulement observable** ». *[arbitrage F4]* C'est elle que **N1** consomme pour « choisir dans
   la même famille un type qui l'**isole** » (routeur §6). Sans elle, la couche 3 recevait deux
   candidats et n'avait aucun moyen de savoir lequel isole les garants plutôt que les connecteurs.
2. **Rang de richesse de sonde par compétence secondaire.** *[arbitrage F4]* Consommé par la règle
   d'espacement, qui veut retenir l'exercice « dont le type offre le **substrat le plus riche** ».
   `competences_secondaires[]` n'exprime aujourd'hui qu'une éligibilité binaire.
3. **`produit_mesure`** — un exercice commun portant une compétence non `evaluee` ne produit **pas de
   verdict** ; son retour est de registre descriptif. *[arbitrage F6]*
4. **La durée déclarée est INDICATIVE**, pour le **régime nominal** du type. **Pas de découpage
   `duree_v1_min` / `duree_vf_min`** : le surcoût d'une escalade est **constaté** par la mesure du
   temps réel (routeur §9, §10), non prédit. *Ne pas confondre avec `duree_redaction_min`, champ
   nullable déjà au schéma C3, réservé aux types à rédaction suivie — son utilité réelle est
   l'ouverture n° 20.* *[arbitrage F9]*
5. **Éligibilité de parcours (TC / HLP).** *[arbitrage F12, reporté ici par Louis]* Le
   `00-referentiel.md` §6 exclut en HLP les types 1 et 9 ou exige une variante, et le contrat n'a
   aucune case pour le dire ; un type générique a `genre = null`, donc le routeur ne peut pas
   distinguer un type commun d'un type réservé sans identifiants en dur.
6. **Cohérence `geste` ↔ `regime_v1vf`.** *[arbitrage F12]* La table du §9 du routeur fait du régime
   une **fonction** du geste, mais les deux sont déclarés indépendamment : rien n'interdit
   formellement `geste = diagnostic` avec un régime plein. *Au passage : le champ s'appelle désormais
   `regime_v1vf` (amendement A9) — le gabarit dit encore « régime de cycle ».*
7. **Les contraintes préalables.** *[arbitrage F23]* Depuis le 30/07 l'override du professeur est
   **post-hoc** : un exercice inadapté à la situation d'un élève lui est montré avant que Louis le
   sache. Décision de Louis : **les contraintes se posent dans la conception même des exercices**,
   déclarées au type et à l'instance, pas ajoutées en couche d'exécution. *Le cas le plus dur : R1
   impose la moitié des exercices à l'Expression pour tout élève coté D, sans distinguer une
   faiblesse du construct d'une dyslexie, d'un trouble moteur ou d'un français langue seconde.*

### Un huitième point, mécanique

8. **`complexité` doit recevoir un nom technique stable et un domaine de valeurs** — il pilote
   directement la **largeur de mesure** (0, 1 ou 2 sondes) et il est aujourd'hui en prose dans le
   contrat, contrairement aux autres attributs. Même remarque pour « plage d'étayage » et
   « consigne-gabarit ». *[correction mécanique D-10]*

### Deux règles du routeur qui dépendent directement de ce document

- **N1** (routeur §6) a besoin du point 1 pour choisir un type isolant.
- **N2, troisième branche** (routeur §6, tranchée le 31/07) a besoin du point 1 pour trouver **un
  type différent portant le même observable**, quand le transfert n'a jamais été mis à l'épreuve.

### La question ouverte que cette séance peut refermer

**F4 — la branche d'échec du pipeline.** Le §5 du routeur ne dit pas ce qu'il advient quand **aucun
type ne satisfait la contrainte** demandée par N1 ou par la branche 3 de N2. Avec 2 à 4 types par
compétence, le cas se présentera. La proposition de la revue, non tranchée : « si aucun type n'isole
l'observable dominant, N1 dégrade en retour mono-focal sur le type courant, et le journalise comme
dégradé ». **C'est en révisant les bibliothèques qu'on saura à quelle fréquence le cas tombe** — donc
c'est ici que la question se règle le mieux.

### Ce qui a changé ailleurs et qui touche ce document

- **La proportion écriture/lecture est revenue** *(arbitrage F24)* : deux tiers d'exercices
  d'écriture, un tiers de lecture, sur une **rotation de trois cycles**. Le §5 de ce document
  (progression sur l'année) et le §8 (couches 2-3 lecture) sont à relire à cette lumière.
- **Les deux sessions dédiées n'en font plus qu'une** *(F24)*. Le §8 annonce encore « session dédiée
  actée » au singulier pour le ciblage lecture — à mettre à jour.
- **Le banc du Questionnement se fait sur quatre lots** *(F3)*, deux d'écriture et deux de lecture.
- **L'essai de Fragments se passe en classe, et sera probablement réservé aux HLP** *(F27)*.

---

## §2 — Fin de chaque séance (obligatoire, même si la séance est courte)

1. **Le fichier est déjà à jour** (tu l'as écrit section par section) ; **renvoie-le à Louis** avec
   `SendUserFile` pour qu'il voie la version courante.
2. **Mets à jour la table de progression du §0** de ce prompt, et redépose-le au repo.
3. **Journalise au `CONTEXTE.md`** : une entrée datée avec les décisions de la séance — **les
   « non » et les solutions propres de Louis en détail**, les accords simples résumés par plage — les
   sections validées, et les fichiers touchés.
4. **Termine par la ligne obligatoire** : **« impact C3 : néant »** ou **« impact C3 : amendement
   X »**. Sans cette ligne, la séance n'est pas close.
5. Si la séance produit un **amendement à C3** — et elle en produira, puisque `exercices_types` est
   une table du §6 —, inscris-le au **tableau de bord du socle** (date · origine · ce qui change ·
   sections · régime a/b/c). **La passe C3 se fait EN UN BLOC** : n'écris pas dans le corps de la
   spec, inscris l'amendement et laisse-le en attente.
6. **Quand une section devient stable, marque-la dans le fichier.** Le document porte « **EN
   RELECTURE par Louis** » en tête. Il ne passera « **relu et validé** » — et ne débloquera C4-L1 —
   que lorsque **toutes** les sections seront passées. **C'est l'objet de cette séance : le faire
   passer.**

---

## Interdits

- **Ne rien trancher à la place de Louis.** En cas de doute, ou de décision que ce prompt ne règle
  pas : note la question, pose-la, et arrête-toi.
- **Ne pas rouvrir les vingt-sept décisions d'arbitrage** du relevé du 30-31 juillet. Elles sont
  actées, elles sont écrites dans le `01-routeur.md` et le `00-referentiel.md`, et chacune porte sa
  raison. Si l'une d'elles paraît fausse à la lumière de ce document, **dis-le à Louis** — mais ne la
  défais pas de toi-même.
- **Ne pas modifier `01-routeur.md` ni `00-referentiel.md`** dans cette séance, sauf si Louis le
  demande explicitement. Ils sont validés. Une conséquence qui les touche se **signale**, elle ne
  s'écrit pas.
- **Ne pas régénérer le fichier entier** depuis ta mémoire — insertions ciblées uniquement.
- **Ne pas traiter plusieurs sections d'un coup** parce que « elles sont courtes ». Le rythme d'une
  section à la fois est un choix de Louis.
- **Ne pas confondre les deux « diagnostic »** : le **geste** (exercice par paires de copies, sans
  version finale) et les **types diagnostiques** (formats longs par lesquels un devoir surveillé
  devient une ancre). La désambiguïsation a été portée au routeur le 31/07 ; ce document doit la
  respecter.

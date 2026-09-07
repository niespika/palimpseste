# PROMPT — Session Code : C10-L2 — « Le professeur clôt les dépôts d'une passation »

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5, le **7 septembre 2026 (après-midi)**. Il **remplace la version du 05/09** : les sources ont bougé *(le `07-` de 2.78 à **2.81**, le `02-` de 6.5 à **6.8**)*, **`C10-L1` a été joué, poussé et déployé le 07/09 à 15:18 UTC** et a rempli ta boîte aux lettres de **quatre items**, et surtout — **la mesure a falsifié cinq prémisses**, dont trois de la source elle-même et quatre du prompt du 05/09. Elles sont signalées ⟲ là où elles se trouvent.
>
> ⛔⛔ **DÉCISION DE LOUIS, 05/09 AU SOIR : AUCUN INTERRUPTEUR, AUCUNE MIGRATION.** Écrite au `07-` §2, chapitre `C10`. ⚠️ **C'est une exception assumée, pas un oubli** — `AGENTS.md` porte *« toute fonctionnalité nouvelle naît derrière un flag OFF »*. **Et « aucune migration » est ici un fait MESURÉ, pas un vœu** : `abandonne` est dans le CHECK depuis le premier jour *(piège 30)*.
>
> ⭐⭐ **CE QUE TU CONSTRUIS EST UN BOUTON DE QUATRE LIGNES ; CE QUE TU DOIS ÉCRIRE, C'EST LA GARDE QUI LE REND VRAI.** La source écrit *« le chemin de remise refuse déjà "Ce dépôt est clos" »*. **C'est faux, mesuré : un chemin d'écriture sur onze le refuse, et ce n'est pas la remise.** Sans la garde, ton bouton est défait en silence par le premier élève qui valide sa transcription — sans erreur, sans trace, `tsc` et les tests verts. **Lis le piège 1 avant tout le reste.**

---

## ⚠️⚠️ CE QUE LA FABRICATION A MESURÉ POUR TOI — et ce que tu remesures avant tout

*(Prod lue par PostgREST le **07/09 entre 15:25 et 16:05 UTC** ; bac à sable lu au `psql`. **Aucune écriture nulle part.**)*

| | Le fait | Ce que tu en fais |
|---|---|---|
| **①** | ✅ **L'entrée `C10-L2` du `07-` §2 est écrite et commitée** — chapitre `### C10 — la semaine se ferme`, commit `ef56909` du 05/09, `07-` alors en 2.78. **Son texte n'a pas dérivé d'un mot** : identique en 2.81. Le §I en garde la copie. | ⛔ **Ton contrôle d'entrée commence là.** Vérifie que l'entrée porte **mission, « fait quand » et manifeste** tels qu'au §I. Un écart se signale, il ne se corrige pas. |
| **②** | ⚠️ **Le dépôt de conception porte du travail NON COMMITÉ** — `01-`, `03-`, `10-` modifiés dans l'arbre. **Tes trois pièces à toi (`07-`, `02-`, `06-`) sont propres.** | **Lis l'arbre, pas le dernier commit.** *(On n'y commite que sur demande.)* |
| **③** | ⏱️⏱️ **UNE HORLOGE TOURNE PENDANT TA SÉANCE, ET ELLE N'EST PAS LA TIENNE.** Le déclencheur hebdomadaire pose à **18:00 puis 18:20 UTC** les lignes du cycle `2026-08-31`, et **`C10-L1` fermera d'un coup ~195 dépôts du routeur chez 33 élèves**. Mesuré à 15:45 : `assiduite_hebdo` = **61 lignes, un seul cycle, `2026-08-24`**. | ⛔ **Aucun chiffre de dépôt du ROUTEUR ne doit entrer dans ton relevé sans son heure.** Tes 15 dépôts à toi, eux, ne bougent pas : ils sont sans décision de routeur. **Et ta recette se joue en bac à sable, pas contre une prod qui bascule.** |
| **④** | ⭐ **L'allumage mesuré le 07/09** : prod `exercices_actif` **ON**, `passation_classe_actif` **ON** *(donc la chaîne élève est OUVERTE pendant que tu travailles — c'est ce qui rend le piège 1 urgent)*, `routeur_actif` ON, `gabarit_actif` **ON depuis le 07/09 13:51**. | **Remesure-le toi-même** *(l'allumage se mesure, il ne se recopie pas)*. ⛔ Tu ne bascules aucun interrupteur. |
| **⑤** | ✅ **Un seul arbre de code.** `feat/ecrans-passation` est **entièrement fusionnée dans `main`** *(mesuré : `main` 6 devant, la branche 0)*. Le piège 46 de `C10-L1` est éteint. | **Travaille sur `main`**, et vérifie-le d'un `git rev-list --left-right --count main...feat/ecrans-passation` avant d'écrire. |
| **⑥** | ⛔⛔ **`abandonne` N'A JAMAIS ÉTÉ ÉCRIT.** 0 ligne en production *(sur 565 dépôts)*, 0 en bac à sable, et **0 écriture dans tout le code** — les neuf occurrences du dépôt sont des lectures, des exclusions et des libellés. | **Tu es le PREMIER écrivain de cette valeur en cinq mois de production.** Tout ce qui « gère déjà `abandonne` » est du **code jamais exécuté** : ce n'est pas un acquis, c'est une liste à éprouver *(pièges 12 à 16)*. |

---

## Le manifeste — *(recopié verbatim du `07-Implementation.md` §2, chapitre `C10` ; versions de l'arbre au 07/09)*

> *Manifeste* : **ce document, §1.1, §1.5 et §2** *(entrée `C4-L4`)* · `02-exercices.md` **§6.D** · `06-Palimpseste.md` **§5**.

« Ce document » est le `07-Implementation.md`. **Trois pièces**, toutes dans `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/`.

| Pièce | Statut requis | Au moment de l'écriture *(07/09, arbre de travail)* |
|---|---|---|
| `07-Implementation.md`, **§1.1** *(les statuts du dépôt — **ligne 160**, la seule phrase du corpus qui définit `abandonne`)*, **§1.5** *(le journal `routeur_decisions` et `assiduite_hebdo` ; « une semaine déjà arrêtée ne se réécrit jamais », **ligne 362**)*, **§2** *(l'entrée `C4-L4`)* | aucun — un lot n'exige pas un statut de la source qui le déclare | **VERSION 2.81** · **RELU ET VALIDÉ** · ⚠️ **le gel est section par section** : §2 *(la règle de manifeste seule)*, §3, §4 et §6 **GELÉS** ; le §1 et l'inventaire des lots du §2 **ouverts à l'implémentation** — **tu peux donc les amender depuis ton relevé** |
| `06-Palimpseste.md`, **§5** *(l'assiduité — la formule, le seuil des trois quarts, et **la seule phrase du § qui te touche** : « Un exercice retiré par le professeur sort du dénominateur, mais pour l'avenir seulement […] et **il ne se confond pas avec l'abandon de l'élève** »)* | ⛔ **relu et validé** — *ton geste écrit dans ce que ce § compte* | **VERSION 2.6** · **VALIDÉ ET GELÉ** *(vaut relu et validé)* |
| `02-exercices.md`, **§6.D** *(« La passation en classe » — dix-huit étapes, dont l'**étape 4** est le geste dont tu es le miroir, **plus l'étape `11 bis` qui EST ton lot**, écrite le 07/09 sur accord explicite de Louis : piège 29)* | **déposé** | **VERSION 6.8** · **VALIDÉ ET GELÉ** *(⚠️ elle a bougé POUR TOI le 07/09 — si tu lis 6.7, rafraîchis l'arbre)* |

### ⚠️ Ce que le manifeste ne nomme pas, et pourquoi tu le lis quand même

- **`07-` §1.1, ligne 160** — *« Pour une passation en classe, la séquence s'arrête à `retour_publie` : il n'y a pas de version finale »*. **Un trigger le tient déjà en base** *(`garde_depot_lieu`)*. C'est pourquoi ton geste n'a jamais à connaître `vf_remis`.
- **`07-` §1.1, ligne 157** — *« le rattachement d'un dépôt à sa semaine se dérive d'`assigne_at`, et il n'a pas de colonne »*. **Tu en as besoin pour une seule chose, et elle est piégée** : le `cycle_lundi` de ta ligne de journal *(piège 22)*.
- **`07-` §2, entrée `C10-L1`** — *« Un dépôt sans décision de routeur n'est jamais fermé par ce lot (passations en classe, assignations à la main : `C10-L2`) »*. **C'est ta raison d'être, et elle est prouvée en base** : les 85 dépôts de classe ont `routeur_decision_id` **NULL sur 85/85**.

⛔ **`00-`, `01-`, `03-`, `04-`, `05-`, `08-`, `09-`, `10-` et les fiches de `competences/` ne sont PAS à ton manifeste** : tu n'ouvres aucune compétence, tu n'assembles rien depuis la doctrine, tu ne touches ni au routeur, ni au juge, ni au gabarit, ni à la chaîne.

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Ici il ne peut pas : trois pièces, aucune n'est optionnelle.

**Au 07/09, les trois passent.** *(Mesuré : `07-` 2.81 RELU ET VALIDÉ · `06-` 2.6 VALIDÉ ET GELÉ · `02-` **6.8** VALIDÉ ET GELÉ.)*

### Ta dépendance est jouée, et elle est en production depuis le 25 août

**`C4-L4` — la passation en classe** *(la seule dépendance que le `07-` §2 te déclare)*. **Vérifie-la par son chemin, pas par sa ligne au plan** : ouvre `app/prof/codex/passation/[exerciceId]/page.tsx`, et vérifie que `components/passation/EcranProf.tsx` porte bien la fonction `Ouverture()` et son bouton « Ouvrir le dépôt maintenant ». **Si ce bouton n'est pas là, ton lot n'a pas de miroir : arrête-toi.**

⭐ Et **`C10-L1`**, qui n'est pas ta dépendance mais ton jumeau, **est déployé depuis le 07/09 15:18 UTC**. Tu ne t'appuies sur rien de lui — **mais tu ne dois rien lui casser** *(pièges 23 et 24)*.

---

## Ta boîte aux lettres — les quatre items, vidés

*(`PLAN_DE_CHANTIER.md` §5 : « fabriquer un prompt commence par vider la boîte de son lot ». Déposés le 07/09 par `C10-L1`, depuis `RELEVE_C10_L1_2026-09-07.md`.)*

1. ✅ **Les trois v1 tardives sont à toi** → **piège 8**. ⚠️ **Et la mesure a retourné l'item** : elles ne sont ni `assigne` ni `ouvert`, **ton bouton ne les touche pas non plus**.
2. ✅ **Les quinze dépôts `ouvert` sans décision** → **pièges 6 et 7**, avec leurs quatre instances et leurs treize noms.
3. ⟲ **Le trou permanent des vacances** → **RÉFUTÉ PAR LA MESURE, piège 26.** Le routeur n'assigne jamais sur une semaine de vacances. **Ne construis rien pour ce trou.** Le trou réel est ailleurs, et il est plus étroit.
4. ✅ **`estFermee` peut te servir, mais ne la détourne pas** → **pièges 23 et 24**. ⟲ **Et sa seconde moitié est fausse** : `MESSAGE_SEMAINE_FERMEE` n'est **pas** réutilisable tel quel.

---

## La mission — ce que le lot construit, et rien d'autre

**Un bouton « Clore les dépôts » sur l'écran de la passation en classe**, miroir de « Ouvrir le dépôt » *(`C4-L4`, `ouvert_par_prof_at`)*. Il pose **`abandonne`** sur les dépôts `assigne` et `ouvert` **de cette instance**. Les copies remises ne bougent pas. **Confirmation, jamais un refus** — elle nomme les élèves et compte les dépôts. Le geste se journalise et il est idempotent.

**Et — parce que la mesure l'exige, pas parce que la source le demande — la garde qui rend ce bouton vrai** : un dépôt clos n'accepte plus d'écriture de l'élève, sur **aucun** des onze chemins *(piège 1)*.

⛔ **Rien d'autre.** Pas de portier de refonte, pas de nouveau composant de confirmation, pas de second journal, pas de bouton pour la maison.

---

## Les pièges — tirés des sources, du code et des deux bases

### A. La prémisse qui s'effondre — la garde n'existe pas

**1. ⛔⛔⛔ LE PIÈGE CENTRAL : « le chemin de remise refuse déjà "Ce dépôt est clos" » EST FAUX.** *(Source : `07-` §2, entrée `C10-L2`.)* Mesuré : la chaîne « Ce dépôt est clos. » n'apparaît **qu'une fois** dans tout `utils/passation/` — `utils/passation/depots.ts:242-244`, à l'intérieur de **`preparerDepotDesPhotos`**, c'est-à-dire la **préparation des URL d'envoi**, pas la remise. Les autres chemins ne lisent pas `statut` :

| # | fonction | fichier:ligne | ses gardes réelles | écrit `statut` ? |
|---|---|---|---|---|
| 1 | `preparerDepotDesPhotos` | `utils/passation/depots.ts:231` | ✅ **gardé** (242-244) | non |
| 2 | `enregistrerLesPhotos` | `depots.ts:275-292` | `depotOuvert`, `v1_remis_at` | non — écrit `photos_v1` (288) |
| 3 | `enregistrerLaTranscription` | `depots.ts:387-399` | idem | non (395) |
| 4 | **`validerLaTranscription`** | `depots.ts:363-384` | idem | ⛔ **`v1_remis` (376-381)** |
| 5 | **`validerLaSaisieClavier`** | `depots.ts:675-698` | idem | ⛔ **`v1_remis` (690-695)** |
| 6 | `transcrireDepot` | `utils/passation/ouvrier.ts:60-125` | `lieu`, `ouvert_par_prof_at`, `v1_remis_at`, photos | parfois `v1_remis` (120) |
| 7 | `enregistrerSeJuger` | `utils/passation/metacognition.ts:376` | ⛔ ne sélectionne même pas `statut` (381) | non |
| 8 | `enregistrerConfianceRemise` | `metacognition.ts:494` | ⛔ ne lit que `id, eleve_id` | non |
| 9 | `enregistrerCredence` | `metacognition.ts:694` | ⛔ ne lit que `id, eleve_id` | non |
| 10 | RPC `journaliser_collage` | `depots.ts:650-664` | ⛔ **aucune** — `SECURITY INVOKER`, `update … where id = p_depot_id` sans filtre | non |
| 11 | re-dépôt de l'essai Fragments | `utils/essai/branchement-serveur.ts:463-470` | lit `statut` mais ne le teste pas | peut reposer `ouvert` |

⭐ **Et `depotOuvert(d)` — la garde que tous partagent — est `d.ouvert_par_prof_at != null` (`depots.ts:217-219`), une colonne que ta clôture NE TOUCHE PAS.** Elle restera vraie après le clic. **Mesuré en prod : `ouvert_par_prof_at` est non nul sur 15/15 de tes cibles.**

**Le scénario, en une phrase** : le professeur clique « Clore », un élève resté sur l'écran de transcription appuie sur « Valider », `validerLaTranscription` repasse le dépôt à `v1_remis`, **la clôture est défaite en silence**. Et `passation_classe_actif` est **ON en production**.

**2. ⛔ IL N'Y A AUCUN PORTIER CÔTÉ CLASSE — n'en fabrique pas un.** `utils/passation/garde.ts` *(62 lignes)* n'ouvre **jamais** `exercices_depots` : `garderProf` / `garderEleve` ne lisent que le rôle et les deux portes. Face à `app/deroule/actions.ts:80` où `portier(depotId, ecriture)` garde **18 des 20 actions** de la maison en un point. **Côté classe, `app/passation/actions.ts` porte 11 actions élève, chacune avec sa propre `garderEleve(false)`.** ⛔ **Écrire un portier de passation est une REFONTE, pas ton lot.** **Écris un prédicat pur et appelle-le** :

```ts
// utils/passation/depots.ts — à côté de depotOuvert (:217)
export function depotClos(d: { statut: string }): boolean {
  return d.statut === 'retire' || d.statut === 'abandonne' || d.statut === 'clos'
}
```

…puis **remplace la condition inline de `preparerDepotDesPhotos` par cet appel** et **pose-le dans les chemins 2 à 9**, avec le message existant, **mot pour mot** : `'Ce dépôt est clos.'` ⛔ **Jamais recopié neuf fois à la main** : un prédicat, neuf appels.

**3. ⚠️ Les chemins 10 et 11 se tranchent, ils ne s'oublient pas.** Le **RPC de collage** écrit sans aucune garde ni de statut ni d'élève — la garde d'appartenance a déjà été ajoutée côté code après coup *(`app/passation/actions.ts:308-310`)* : **fais pareil, dans l'appelant, pas dans le RPC** *(toucher au RPC serait une migration)*. Le **re-dépôt de l'essai Fragments** *(`branchement-serveur.ts:422-424`, la lecture ne teste jamais `statut`)* : le risque mesuré n'est pas un retour à `ouvert` *(la bascule est conditionnée par `d.v1_remis_at`, l.466)* — **c'est que `photos_v1` soit écrit sur un dépôt clos et qu'une transcription soit PAYÉE derrière** *(`mettreLaTranscriptionEnFile`, l.475)*. **Garde-le ou écarte-le explicitement au relevé — pas en silence.**

**4. ⭐ Ce qui est DÉJÀ gardé, et que tu ne touches pas.** `declencherLeLot` *(`depots.ts:432`)* et `relancerLaMesure` *(`depots.ts:479`)* écartent déjà `retire` et `abandonne` — **l'entrée dans la chaîne est fermée**. `publier` *(`utils/passation/retours.ts:210-213`)* filtre `.in('statut', ['v1_remis','ouvert'])` : après ta clôture, un `abandonne` en sort naturellement. ⭐ **Argument positif à dire au professeur** : clore AVANT de publier empêche `publier` de repeindre en « retour publié » des copies jamais rendues. **Aucun code, seulement l'ordre des gestes.**

**5. ⚠️ La chaîne, elle, ne lit jamais le statut du dépôt** *(`utils/chaine/` : 4 tests de statut, tous sur `job.statut`)*. **Le risque est borné** — une copie non remise n'entre pas au lot — **et c'est hors de ton périmètre.** ⭐ Mesuré au passage : **un seul job existe sur tes 15 dépôts** *(`dc11bafa`, `transcription_v1`, `abouti`)*. **Clore n'orpheline aucun travail en vol.**

### B. Ta population réelle — mesurée, pas recopiée

**6. ⭐⭐ CE QUE TON BOUTON TOUCHE AUJOURD'HUI, ET IL FAUT QUATRE CLICS.** *(Prod, 07/09 ~15:45 UTC.)* `exercices.lieu = 'classe'` : **4 instances, 85 dépôts** *(23 · 23 · 23 · 16)*, sur **3 classes**. Par statut : **`ouvert` 15 · `retour_publie` 69 · `v1_remis` 1 · `assigne` 0.** Les quinze se répartissent ainsi :

| instance | dépôts à clore | module de sa page |
|---|---|---|
| `b5f7a719-d79e-4dcf-aab3-4281a5956e17` | **10** | ⭐ **Aletheia** *(`type_exercice = lecture`)* |
| `d8de575c-87f1-4128-817c-e8015ba5ee79` | 2 | Codex |
| `364359ce-000e-419e-8949-fa2feace8dd0` | 2 | Codex |
| `524f5484-d661-42e4-8f87-a49ed239d6eb` | 1 | Codex |

⟲ **Le prompt du 05/09 écrivait « 70 dépôts […] dont 15 encore ouvert chez 13 élèves ».** Le 15 et le 13 tiennent ; **le 70 est devenu 85**, et surtout **le plus gros cas n'est pas dans Codex** : c'est une passation de LECTURE, donc **`/prof/aletheia/passation/[exerciceId]`**. ⛔ **Ton smoke élève doit passer sur les DEUX modules** — sinon il vérifie 5 bannières sur 15 en croyant les avoir toutes vues.

**7. ⛔ UN DE TES QUINZE PORTE UNE VRAIE COPIE, ET « les copies remises ne bougent pas » NE LE PROTÈGE PAS.** ⟲ *(Le prompt du 05/09 disait « jamais remis, **sans brouillon** ». Faux.)* Dépôt `dc11bafa-c9cb-4336-a9c2-bfab158dc6cb` *(instance `d8de575c`)* : `statut='ouvert'`, `v1_remis_at` **NULL**, mais **2 photos**, **`transcription_v1` de 2 266 caractères**, 20 doutes, `confiance_ocr_v1 = 0.416`, un **commentaire du professeur** *(« Tu aurais pu faire un effort pour te relire »)* et **`corrige_at = 2026-09-07T03:07:48Z`**. Et **5 des 15** portent `corrige_at`.

⛔ **« Remis » (`v1_remis_at`) et « porte du travail » sont deux prédicats différents, et la source n'a retenu que le premier.** Le bon prédicat existe, il est **pur**, et son en-tête dit pourquoi *(« le statut ne dit rien du travail », décision de Louis du 25/08)* : **`depotPorteDuTravail` / `depotsQuiBloquent`, `utils/examens/retrait.ts:71-88`.**

**⭐ TRANCHE, et voici l'arbitrage que la fabrication te propose** *(il ne change pas la structure de l'écran — applique-le et liste-le)* : **la clôture les inclut, mais la confirmation les NOMME À PART** — « 2 de ces dépôts portent une copie non validée ». Poser `abandonne` — *« non-geste de l'élève »* — sur une copie de 2 266 caractères déjà corrigée, **sans le dire au professeur**, serait un mensonge en base. **Si Louis veut qu'on les épargne, c'est à lui.**

**8. ⟲⛔ LES TROIS V1 TARDIVES SONT À TOI, ET TON BOUTON NE LES FERME PAS NON PLUS.** *(Item 1 de ta boîte ; dette `D11` du `INVENTAIRE_Non_Tranches.md`.)* Mesuré : `92e22abd` v1 le **01/09 12:07**, `a4951f8d` le **02/09 02:09**, `1978a5d0` le **02/09 11:42**. **Leurs statuts aujourd'hui : `retour_publie`, `retour_publie`, `v1_remis`** — ni `assigne` ni `ouvert`. ⛔ **Elles tombent ENTRE les deux lots.** Le préjudice est exact et c'est **le seul écart sur 61 élèves** : recalculées elles donnent 1/1, 1/1 et 2/2 ; `assiduite_hebdo` porte 0/1, 0/1 et 1/2.

**⭐ C'est ton argument d'urgence, et il ne demande aucun code de plus** : **la garde du piège 1 est précisément ce qui aurait empêché ces trois remises.** ⛔ **Ne l'écris nulle part que ton bouton les rattrape** — et n'élargis pas ta cible pour les attraper : ce serait une décision de Louis, pas une inférence. **Porte-la-lui au relevé.**

**9. ⚠️ La branche `assigne` de ton geste ne trouvera AUCUN cas en prod — et ce n'est pas parce que l'état est fugace.** Mesuré : `statut='assigne' ∧ routeur_decision_id IS NULL` → **0**. ⛔ **Mais la fenêtre `assigne` dure des HEURES** : sur `524f5484`, assigné le 26/08 à 04:04, ouvert à 14:34 — **10 h 30**. Un professeur qui assigne la veille au soir et ouvre le lendemain midi est un cas de terrain. **Garde `assigne` dans le prédicat, et fabrique-le au décor du bac à sable** — sinon cette moitié part non éprouvée.

⛔⛔ **Et la garde qui compte : les 170 dépôts `assigne` de la prod appartiennent TOUS au routeur.** Une requête qui filtrerait sur le seul statut sans borner à l'instance ferait **170 lignes de dégâts**.

**10. ⟲⛔ « Les assignations à la main de la maison » : ZÉRO cas en production.** Mesuré : `origine='prof' ∧ lieu='maison'` = **0**, tous statuts confondus. Les **85** dépôts `origine='prof'` sont **exactement** les 85 dépôts de classe. Les 195 dépôts de maison encore jouables sont **tous** du routeur, donc **tous du ressort de `C10-L1`**. ⛔ **HORS PÉRIMÈTRE, explicitement** — une ligne à la boîte du plan, pas un bouton fabriqué à l'aveugle sur une page qui n'existe pas. ⚠️ *(Le chemin existe pourtant : `assignerALaClasse`, `app/prof/conception/actions.ts:380-450`, écrit `origine:'prof'` sans regarder le `lieu`. Il n'a simplement jamais servi sur une instance de maison.)*

**11. ⚠️ `exercices.statut` ne bouge pas, et c'est voulu.** Les 4 instances de classe sont toutes `statut='assigne'`, y compris celle dont 21 dépôts sur 23 sont déjà `retour_publie`. Le CHECK porte `('a_concevoir','concu','assigne','clos')`. ⛔ **Ne pose pas `clos` sur l'instance** : c'est une seconde notion, donc un second domicile, et personne ne l'a jamais posée. **Une ligne au relevé si ça te démange.**

### C. Le statut — l'arbitrage le plus lourd du lot

**12. ⭐⭐⭐ LA SOURCE TE FAIT ÉCRIRE, PAR UN BOUTON DU PROFESSEUR, LE STATUT QU'ELLE DÉFINIT COMME LE NON-GESTE DE L'ÉLÈVE.** `07-` §1.1 ligne 160, verbatim : *« Les deux ne se confondent pas : `abandonne` est un non-geste de l'élève, `retire` une décision du professeur, et l'assiduité mesure l'élève. »* Le `06-` §5 le redit. **Et le geste-miroir écrit lui-même l'interdiction dans son propre journal** *(`app/prof/routeur/actions.ts:150-152`)*.

⛔⛔ **Le précédent est daté, et il a tranché dans l'autre sens** : `c6_designation_non_fait.sql:11-14`, le **28/08** — *« POURQUOI PAS `abandonne`. Celui-là dit NON-GESTE DE L'ÉLÈVE — il s'affiche "abandonné" sur les écrans — et il désigne un exercice jamais ouvert. Réemployer `abandonne` ferait mentir trois écrans pour économiser une valeur. »* Ce jour-là, **un statut neuf a été créé** plutôt que de réemployer celui-ci.

**⭐⭐⭐ TRANCHÉ PAR LOUIS LE 07/09 : TU ÉCRIS `abandonne`. La question lui a été posée avec ces trois citations sous les yeux, et il a choisi.** ⛔ **Ne la rouvre pas en séance.** Le motif est chiffré et il tient : **`abandonne` reste au dénominateur ; `retire` en sort et ABSOUDRAIT l'élève ; `clos` le compterait comme RENDU** *(pièges 13, 14, 17)*. ⭐ **Et le prix évité est plus lourd que le prix payé** : un statut neuf coûterait une migration *(la décision du 05/09 l'interdit)* **et une douzaine de tables exhaustives** — `C10-L1` a mesuré qu'un **ton** neuf en coûte **cinq**, dont la seule où Aletheia diverge de Codex *(piège 32)*. **La contradiction est de vocabulaire, pas de mécanique** : en base et en assiduité, `abandonne` est exactement à sa place.

⛔ **Mais l'arbitrage se paie, et Louis a acté ses deux dettes** :
- **la phrase de l'écran** — *« le professeur **CONSTATE** un non-geste, il n'absout pas »*. **C'est désormais le texte de la source** *(`02-` §6.D, étape `11 bis`)*, **et ta confirmation doit le porter en toutes lettres**, sinon le professeur croira absoudre ;
- **le libellé menteur** : `app/prof/routeur/VueAssignation.tsx:22` affiche `abandonne: 'abandonné par l'élève'`. **Il devient faux au premier clic — corrige-le en « abandonné »** *(neutre — c'est déjà ce que fait `EcranProf.tsx:631`)*. ⛔ **Ce n'est plus une option.**

⚠️ **Et le précédent contraire reste consigné, pour que personne ne le redécouvre** : le 28/08, sur la même question, le réemploi d'`abandonne` avait été **refusé** et `non_fait` créé *(`c6_designation_non_fait.sql:11-14`)*. **La différence tenue par Louis** : le geste est du professeur, **mais le fait constaté est bien un non-geste de l'élève** — l'écran ne ment que s'il dit « par l'élève » là où il faut dire « abandonné ».

**13. ⛔ N'UTILISE JAMAIS `retirerLExercice` NI LE STATUT `retire`.** Il **sort du dénominateur** *(`entreAuDenominateur(s) = s !== 'retire'`, `utils/routeur/assiduite.ts:300-302`)* : l'élève absent cesserait de peser. C'est l'inverse exact de l'intention.

**14. ⛔ ET `clos` COMPTERAIT LA COPIE COMME RENDUE** — `STATUTS_RENDUS = ['v1_remis','retour_publie','vf_remis','clos']` *(`assiduite.ts:294`)*. **C'est l'argument mesuré qui justifie `abandonne`, et personne ne l'avait écrit.** Mets-le au relevé.

**15. ⚠️ Un dépôt `abandonne` reste RETIRABLE par deux chemins prof, sans un mot.** `app/prof/routeur/actions.ts:127-131` et `utils/signalements/serveur.ts:394-403` ne refusent que `clos` : un `abandonne` deviendrait `retire`, **et la distinction du §1.1 se perdrait**. ⭐ *(Un troisième, `emportesParLeRetraitDuPool`, `utils/signalements/regles.ts:210-218`, l'emporte **délibérément** et le documente : c'est un précédent, pas un défaut.)* **Dis si tu ajoutes `abandonne` à ces deux refus, ou si tu l'assumes. Ne le découvre pas en séance.**

**16. ⚠️ Et un dépôt abandonné SANS contenu est SUPPRIMABLE — la trace de ta clôture avec.** `app/prof/examens-diagnostiques/actions.ts:189-208` efface l'occupant d'un dépôt cible, jugé « **sur son contenu, pas sur son statut** » *(décision de Louis du 25/08)*. **C'est exactement le profil de 14 de tes 15 dépôts.** ⛔ Ne répare pas ce chemin ; **mais sache que le statut seul disparaît avec la ligne, et que la seule trace durable du geste est celle du journal** *(piège 21)*.

### D. Ce que le professeur voit, et ce que l'élève voit

**17. ✅ « Il ne change aucun chiffre montré au professeur » — VRAI, et par une raison plus forte que celle de la source.** ⟲ *(La source dit « sur une semaine déjà comptée » ; le piège 5 du prompt du 05/09 en tirait un avertissement à afficher sur une semaine en cours. **Les deux sont faux par excès de prudence.**)* Mesuré : `estRendu('ouvert') = false` **et** `estRendu('abandonne') = false` ; `entreAuDenominateur` rend `true` pour les deux *(`assiduite.ts:294-302`)*, et `comptesDeLaSemaine` *(`utils/assiduite/collecte.ts:120-140`)* n'a pas d'autre branche. **`ouvert` et `abandonne` sont indiscernables pour la collecte, sur TOUTE semaine, comptée ou non.**

**Trois raisons indépendantes, à citer toutes les trois** *(pour que l'affirmation survive au changement de l'une)* : ① la règle ci-dessus ; ② le **gel** de la semaine arrêtée *(`utils/assiduite/collecte-serveur.ts:275`)* ; ③ **la matrice de pilotage ne voit même pas tes dépôts** — elle filtre `.eq('exercices.lieu','maison')` *(`utils/matrice-pilotage.ts:352`)*.

⛔ **N'écris donc AUCUN avertissement de semaine dans la confirmation** — il avertirait d'un effet qui n'existe pas. **Et prouve-le par le chiffre, pas par le raisonnement** : compte avant, compte après, égalité stricte.

⚠️ **Un piège de chiffre, dans le même geste** : le recalcul du réel donne **85 assignés / 70 terminés** ; **la ligne figée en base porte 85 / 67**. **L'écart de 3, ce sont exactement les trois v1 tardives du piège 8.** ⛔ **Cite 85/67 — c'est ce que la ligne porte, donc ce que l'écran montre.** Le 70 est ton recalcul, il n'est affiché nulle part.

**18. ⭐ Et la population de ton lot n'est pas marginale : c'est LA population sur laquelle l'assiduité de la plateforme a été calculée jusqu'ici.** Mesuré : `assiduite_hebdo` porte **61 lignes, toutes sur `2026-08-24`**, et les élèves de la classe `16e49014` y portent exactement **deux dépôts de passation en classe et aucun dépôt du routeur** — le premier cycle du routeur *(`2026-08-31`)* n'était pas encore compté. **Dis-le : c'est ce qui rend la garantie du piège 17 essentielle, et non formelle.**

**19. ⛔⛔ CHEZ L'ÉLÈVE, LE DÉPÔT NE DISPARAÎT PAS : IL CHANGE DE SURFACE — et l'écran de dépôt reste ouvert.** Trois faits mesurés, à traiter séparément :

- ✅ **Le signal s'éteint**, sans une ligne à écrire : `signauxDeLancement` filtre `.eq('statut','ouvert')` *(`utils/examens/signal.ts:82-88`)*, et le fichier le revendique déjà *(l. 58-62)*. **Mesuré : 15 bannières vertes réellement allumées aujourd'hui, chez 13 élèves.** ⛔ **N'ajoute aucun prédicat à `signal.ts`** — le fichier prévient qu'un prédicat de plus y serait mort.
- ⚠️ **Mais une ligne NEUVE apparaît** dans « Mes examens passés » : `STATUTS_APRES_REMISE` contient **déjà** `abandonne` *(`utils/codex-onglets/liste.ts:392-394`, revendiqué l. 385-388 : « L'élève a le droit de lire que sa copie est restée sans suite »)*, avec le libellé **« abandonné »**, ton `clos` *(`utils/codex-onglets/regles.ts:303`)*. ⭐ **C'est un COMPORTEMENT ATTENDU, pas un manque à combler** : le « fait quand » dit *« ne montrent plus ces dépôts dans à faire »*, et c'est tenu. ⛔ **N'écris aucun filtre pour « faire disparaître »** — tu casserais une intention écrite ailleurs. **Mais fais-le VOIR au smoke** : c'est ce que le professeur verra sa classe voir.
- ⛔⛔ **ET LA PAGE DE PASSATION RESTE ATTEIGNABLE ET ÉCRIVABLE.** `chargerVueEleve` *(`utils/passation/vues.ts:43-81`)* ne recopie **jamais** `d.statut` ; l'interface `VueEleve` n'a pas ce champ ; `EcranEleve.tsx:103` ne teste que `!vue.ouvert`, et `vue.ouvert = d.ouvert_par_prof_at != null` **reste vrai après la clôture**. **L'élève qui revient par l'URL voit son formulaire de dépôt entier.**

  ⭐ **C'est du travail d'écran, pas seulement de bouton — et le patron est celui de `C10-L1`** : *« ce que l'élève ne doit pas voir ne part pas du serveur »*. **Ajoute le statut (ou un booléen `clos`) à `VueEleve`, et fais dire à l'écran « Ce dépôt est clos. »** ⛔ **Réduis-le là où il se construit** *(`chargerVueEleve`)*, pas à l'écran.

**20. ⚠️ `etatDExamenDeClasse` n'a AUCUN cas pour `assigne` ni `ouvert`** *(`utils/codex-onglets/regles.ts:311`, `default` qui rend `statutDepot` **tel quel**)*. Invisible aujourd'hui parce que `STATUTS_APRES_REMISE` les exclut. ⛔ **Si tu élargis cette liste, donne-leur d'abord un cas explicite** — sinon l'écran affiche le mot « ouvert » brut. *(C'est le défaut que le `case 'non_fait'` documente juste au-dessus.)*

### E. Le journal — le patron existe, il n'a jamais servi, et il a une régression cachée

**21. ⭐⭐ LE JOURNAL EST `routeur_decisions.override_prof`, ET IL N'Y EN A PAS D'AUTRE.** Patron à copier : `app/prof/routeur/actions.ts:143-167`. L'entrée est un objet à six clés poussé dans un tableau JSON : `{ geste, depot_id, motif, par, at, note }`. ⛔ **Ferme les autres portes d'avance** : `integrite_evenements` a un CHECK fermé à `('strike','blocage','deblocage')` — **il demanderait une migration** ; `exercices.blocages` n'a pas le bon grain *(l'exercice, pas l'élève)*. ⛔ **N'ouvre pas un second journal.**

⚠️ **Trois faits que la source ne dit pas, tous mesurés** :
- **Il n'a JAMAIS reçu une ligne** : 480 décisions en prod, **0** avec `override_prof` non nul, **0** en `regle_declenchee='override_prof'`, **0 ligne** en bac à sable — alors que **38 dépôts sont `retire`**. **Tu en seras la première écriture réelle.**
- **Il n'a AUCUN lecteur** : 5 occurrences dans tout le dépôt, **toutes dans l'écrivain**. `chargerAssignation` ne le sélectionne même pas. ⛔ **Ton geste n'apparaîtra à AUCUN écran** — la preuve du « fait quand » ne peut être qu'une **requête en base**, jamais une capture.
- ⛔⛔ **Et son écriture n'est pas vérifiée** : `actions.ts:158` et `:166` n'attrapent aucun `{ error }`, **et supabase-js ne lève pas**. On ne peut donc même pas affirmer que les 38 `retire` ne sont pas passés par là avec un journal échoué en silence. **TOI, tu testes l'erreur de ton journal et tu la remontes.**

**22. ⛔⛔ LE `cycle_lundi` SE DÉRIVE PAR `lundiDuCycle(assigne_at, fuseau)`, JAMAIS PAR `assigne_at.slice(0,10)`.** La table porte `routeur_cycle_lundi_chk CHECK (EXTRACT(isodow FROM cycle_lundi) = 1)` : **un dépôt du dimanche 20 h 30 à Toronto est le lundi 00 h 30 UTC, et l'insert serait REFUSÉ.** Le commentaire de `actions.ts:136-145` porte déjà la leçon. **Copie la ligne 145 telle quelle.**

**23. ⛔⛔ ET VOICI LA RÉGRESSION QUE PERSONNE N'AVAIT VUE : une ligne de journal sur un cycle passé fait bouger un chiffre du ROUTEUR.** `exercicesParCycle` *(`utils/moteur/cycle-serveur.ts:1172-1185`)* **compte les LIGNES de `routeur_decisions` par cycle, sans aucun filtre** — ni sur `exercice_id`, ni sur `regle_declenchee` — et sa source `lireLesDecisions` lit **tous les cycles de l'élève**. Mesuré sur tes 15 : la moyenne tombe de **5→3** *(×6)*, **6→4** *(×5)*, **7→4**, **9→5** *(×2)*, **10→6** ; et `K de R5` *(`utils/routeur/ciblage.ts:355-359`)* **de 15 à 9 pour la plupart, de 27 à 15 au plus haut**. ⚠️ Un second lecteur non filtré existe : `remplirLesMinutes` *(`cycle-serveur.ts:1029-1052`)*.

**⭐ TRANCHE. La fabrication te propose : journalise, et pose `exercice_id` NULL comme le retrait le fait — puis AJOUTE le filtre manquant à `exercicesParCycle` (une ligne : ignorer les lignes sans `exercice_id`).** C'est la réparation la plus étroite, elle est exacte *(une ligne d'override n'est pas un exercice servi)*, et **`decisionsDuCycle` filtre déjà `!!l.exercice_id`** *(`utils/moteur/bonus-serveur.ts:127-145`)* — **tu ne fais qu'aligner le second lecteur sur le premier.** ⛔ **Si tu refuses d'y toucher, alors n'insère pas : dis-le, et propose l'autre voie à Louis.** Ce qui est interdit, c'est de livrer la régression en silence.

⚠️ **Et vérifie les autres lecteurs par EXÉCUTION, pas par lecture** : `routeur_decisions` a **treize** lectures de production dans le dépôt. Cinq ont été vérifiées indemnes par la fabrication ; **les huit autres sont à toi.**

**24. ⛔⛔ N'ÉCRIS JAMAIS `routeur_decision_id` SUR LE DÉPÔT QUE TU CLOS.** Ta ligne de journal reste **ORPHELINE** : le seul lien vers le dépôt est la clé `depot_id` **dans le JSON**, et c'est exactement ce que fait `retirerLExercice` *(il insère sans `.select()` et sans update aval)*. ⛔ **Poser ce lien ferait tomber tes dépôts sous `C10-L1`** *(`utils/deroule/fermeture.ts:124` : `if (!q.routeurDecisionId) return false`)* — **ils seraient fermés deux fois par deux règles différentes.**

**25. ⚠️ Une ligne par dépôt, ou une par geste ? Tranche, et dis le chiffre.** Le retrait fait **une ligne par dépôt** ; ta plus grosse clôture en poserait donc **10** d'un coup, dans une table qui s'appelle « décisions du routeur ». ⚠️ **Rien en base ne t'en empêche** : `pg_constraint` sur `routeur_decisions` ne porte **aucune unicité** sur `(eleve_id, cycle_lundi)`. ⛔ **Ton idempotence tient par le FILTRE DE STATUT** *(`.in('statut', ['assigne','ouvert'])`)*, **jamais par le journal** — un rejeu ne trouve plus de dépôt, donc n'écrit rien. **Mais un échec partiel entre l'update et l'insert laisse un état mixte que le rejeu ne rattrapera pas : dis-le au relevé.**

### F. Ce qui est réfuté, et ce qu'il faut savoir avant de coder

**26. ⟲⛔ LE « TROU PERMANENT DES VACANCES » DE TA BOÎTE EST RÉFUTÉ PAR LA MESURE — NE CONSTRUIS RIEN POUR LUI.** *(Item 3, déposé par `C10-L1`.)* **Le routeur n'assigne jamais sur une semaine de vacances** : `cycle-serveur.ts:216-220` rend un bilan vide quand `segmentDuCycle` donne `segment: null`, ce que `calendrier-serveur.ts:83-86` fait pour tout lundi hors semaine de cours, les segments venant de `calculerGrilleSemaines` qui **saute les vacances** *(`utils/calendrier-grille.ts:52-60`)*. **Mesuré : 0 dépôt sur une semaine de vacances** ; première semaine de vacances en prod **2026-10-26 → 11-01**, dans 49 jours. ⭐ `utils/deroule/fermeture.ts:16-19` l'écrivait déjà. **Et le détecteur existe** : `poserLaSemaineDAssiduite` compte les `depotsOrphelins` d'une semaine hors calendrier.

⭐ **Le trou réel est plus étroit, et il est mesuré** : **un élève inscrit APRÈS le comptage d'une semaine n'a pas de ligne pour elle.** Les **3 élèves actifs sans ligne** au cycle `2026-08-24` *(64 actifs, 61 lignes)* ont tous été inscrits après le passage du cron. **Ce n'est pas ton lot** *(un bouton d'instance ne couvre pas un exercice du routeur)* : **une ligne à la boîte, et tu passes.**

**27. ⛔ `MESSAGE_SEMAINE_FERMEE` N'EST PAS RÉUTILISABLE — l'item 4 de ta boîte se trompe sur ce point.** Il dit *« Il n'est plus possible de travailler sur les exercices de **cette semaine**. De nouveaux exercices t'attendent. »* Sur une passation close à la main, **il ment deux fois** : la raison du refus n'est pas la semaine *(c'est le geste du professeur)*, et **aucun nouvel exercice de classe n'attend l'élève**. ⭐ **Le message juste existe déjà et il est court : « Ce dépôt est clos. »** *(`utils/passation/depots.ts:243`.)*

**28. ⛔ ET UN DÉPÔT DE CLASSE NE PASSE PAS PAR LE PORTIER DE `C10-L1`.** `portier` appelle `lireDepotMaison`, qui **refuse tout dépôt dont l'instance n'est pas à la maison** *(`utils/deroule/depot.ts:195-200`, avec son `console.warn`)* et rend « Exercice introuvable. » ⛔ **Tu ne réutilises RIEN du portier ni de `estFermee`** *(qui refuse en deuxième ligne tout dépôt sans décision — c'est-à-dire exactement les tiens)*. **Un second prédicat serait un second domicile.**

**29. ⭐⭐⭐ TON GESTE A UN SIÈGE DANS LA SOURCE — `02-` §6.D, ÉTAPE `11 bis`, ÉCRITE LE 07/09 SUR ACCORD EXPLICITE DE LOUIS.** ⟲ *(Le §6.D était **muet** : dix-huit étapes où, après l'ouverture (étape 4), rien ne refermait. Il n'était pas faux, il était silencieux — d'où une **étape ajoutée**, et **aucun `[faux]`**.)* **Lis-la, elle te commande trois choses :**

> **11 bis.** Il **clôt les dépôts** — **miroir exact de l'étape 4**, et **action manuelle** comme elle. Les dépôts qui n'ont jamais été rendus passent à **`abandonne`** *(§1.1 : le non-geste de l'élève, **au dénominateur, jamais rendu** — le professeur le **constate**, il n'absout pas ; **`retire` sortirait l'élève du dénominateur**)*, les copies remises ne bougent pas, et **une remise après clôture est refusée**. ⛔ **Le geste se pose AVANT l'étape 12, et l'ordre n'est pas indifférent** […]

- ⭐ **Sa PLACE est un fait, pas un rangement** : **avant l'étape 12** *(le déclenchement du lot)*, parce que `publier` ne bascule que les dépôts `v1_remis` ou `ouvert` — **clore d'abord est ce qui empêche de repeindre en « retour publié » une copie jamais rendue** *(piège 4)*. **Dis-le dans le fil de l'écran prof** : la clôture vient avant le déclenchement.
- ⭐ **Elle est numérotée `bis` à dessein** — insérer et renuméroter aurait cassé les renvois « étape 12 » *(`07-` §1.1)* et « étape 17 » *(dette `D12`)*. ⛔ **Ne renumérote rien.**
- ⭐ **Et elle tranche ton vocabulaire d'écran** : *« le professeur **constate**, il n'absout pas »*. **C'est la phrase que ta confirmation doit porter** *(piège 12)*.

⚠️ **Le `02-` est donc en 6.8, pas en 6.7.** Si ton contrôle d'entrée lit 6.7, l'arbre n'a pas été rafraîchi — **relis l'en-tête avant de continuer**.

**30. ✅ AUCUNE MIGRATION — mesuré, pas espéré.** Bac à sable : `exercices_depots_statut_check CHECK (statut = ANY (ARRAY['assigne','ouvert','v1_remis','retour_publie','vf_remis','clos','abandonne','retire','non_fait']))` — **neuf valeurs**, `abandonne` dedans. ⟲ **Elle y est depuis `c4_l1_schema.sql:454`** *(le prompt du 05/09 disait `c4_l8_fabrique.sql` — celui-là a ajouté `retire`, et `c6_designation_non_fait.sql` a ajouté `non_fait`)*. ⚠️ **Le fichier `c4_l1_schema.sql` est en retard sur la base : il n'en liste que sept. La BASE fait foi.** Côté journal : **aucun CHECK** sur `regle_declenchee` ni sur `override_prof`, **zéro trigger**. ⛔ **N'ouvre pas `SUIVI_SQL.md`.**

**31. ⛔ ET IL N'Y A AUCUN FILET EN BASE.** Une seule policy sur `exercices_depots` : `exercices_depots_prof_all` — **aucune policy élève**, toutes les écritures passent déjà en service-role. Le seul trigger, `garde_depot_lieu`, ne refuse que `vf_remis` et les champs de version finale. **Aucune contrainte de transition entre statuts.** ⭐ **La garde que tu écris en TypeScript sera la SEULE** *(la leçon de `C10-L1` : la garde est le CODE, jamais la policy)*. **Ne te rassure jamais sur « la base refusera ».**

### G. L'écran — un seul domicile, trois pages servies

**32. ⭐⭐⭐ DÉCISION DE LOUIS, 07/09 : ON CLÔT CODEX COMME ALETHEIA — ET LA SYMÉTRIE EST DÉJÀ STRUCTURELLE. UN SEUL FICHIER À TOUCHER : `components/passation/EcranProf.tsx`.** ⟲ *(Le prompt du 05/09 nommait « `app/prof/codex/passation/[exerciceId]/page.tsx` et sa jumelle Aletheia ». Il y en a **trois**, et aucune ne porte le bouton.)*

⭐ **La doctrine est déjà écrite, et elle est de `C4-L4`** : *« c'est le même flux dans deux modules, et **ce qui commande le comportement est le `lieu`, jamais le module** »* *(`utils/passation/chemins.ts`, reprise mot pour mot à `depots.ts:193`)*. **Mesuré, aux deux bouts :**

- **Côté professeur** : `codex/…/page.tsx` **41 lignes**, `aletheia` **62**, `fragments-erudition` **58** — les trois montent le **même** `EcranProf` *(756 l., `'use client'`)*, alimenté par le même `chargerVueProf`. `hrefDeLaPassationProf(module, id)` fabrique les trois adresses depuis une seule règle.
- **Côté élève** : `signauxDeLancement(admin, userId, module)` prend le module **en paramètre** *(appelée `'codex'`, `'aletheia'`, `'fragments'`)*, `MesExamensPasses` est **un composant unique** monté par les deux pages, et `etatDExamenDeClasse` **n'a qu'un seul site d'appel** *(`utils/codex-onglets/liste.ts:465`)*.

⛔ **Le bouton se pose donc UNE fois et sert les trois modules. Le dupliquer par module est interdit** — et tu n'as **aucune** branche `if (module === …)` à écrire, nulle part.

⚠️ **Ce qui pourrait rouvrir l'asymétrie, et que tu ne fais pas** : un **ton** neuf. `TonEtat` *(`utils/codex-onglets/regles.ts:207`)* porte six valeurs, et le sixième — `ferme` — a coûté à `C10-L1` **cinq tables exhaustives**, dont `PASTILLE` *(`app/eleve/modules/aletheia/exercices/page.tsx:45`)*, qui est **le seul endroit où Aletheia diverge de Codex**. ⭐ **`abandonne` réutilise le ton `clos` : tu n'en paies aucune.** ⛔ **Si tu te surprends à ajouter un ton, arrête-toi : tu es sorti du lot.**

**Le miroir se pose dans `Ouverture()` *(`EcranProf.tsx:155-224`)*, sous le `</form>` de la ligne 221.** Le patron exact, à copier :

```tsx
const [etatO, actionO, enCoursO] = useActionState(actionOuvrirLesDepots, null as Reponse | null)   // :157
<form action={actionO} className="mt-4">                                                           // :209
  <input type="hidden" name="exercice_id" value={vue.exerciceId} />                                // :210
  <button type="submit" disabled={enCoursO} …>                                                     // :211
```

⛔ **`useActionState` + `<form action>`, jamais `useTransition`** *(il n'y en a aucun dans le fichier)*. Le rafraîchissement vient du serveur : `rafraichir()` *(`app/passation/actions.ts:44-53`, six `revalidatePath`)*.

**33. ⭐⭐ LA CONFIRMATION NE COÛTE AUCUNE LECTURE SERVEUR : les noms et les statuts sont DÉJÀ dans la vue.** `VueProf.copies[]` porte `eleve` *(le `display_name`, résolu par `lireLesNoms`, `utils/passation/vues.ts:93` et `:109`)* et `statut` *(:110)* pour **chaque** dépôt de l'instance. **La confirmation se dérive de `vue.copies.filter(c => c.statut === 'assigne' || c.statut === 'ouvert')`.** ⛔ **N'écris pas d'action d'aperçu.**

**34. ⛔⛔ `confirm()` EST INTERDIT — cinquième morsure documentée.** `components/pilotage/ConfirmationRetrait.tsx:1-22` : *« confirmation EN PAGE, jamais `confirm()` »* — le dialogue natif **rend `false` dans un aperçu embarqué** et le bouton paraît mort ; le commentaire chiffre la récidive *(24/07, C8·L2, C8·L3, C7·L1)*. **Deux patrons du dépôt, et tu prends le second** :

- `components/passation/ReunirCopies.tsx` — **même module, même écran**, confirmation en page à deux temps *(`useState(confirme)`, l. 35)*, **annonce deux nombres** avec son motif écrit *(l. 70-80 : « Annoncer 25 copies là où deux élèves seulement ont remis quelque chose faisait croire à un geste anodin »)*. ⚠️ **Mais il ne nomme personne AVANT** : les noms n'apparaissent que dans le rapport postérieur *(l. 50-51)*. ⛔ **Et ne copie pas son `reunir()` (l. 39-60), qui appelle l'action serveur une fois par copie.**
- `components/pilotage/ConfirmationRetrait.tsx` — **il nomme AVANT le geste**, ligne par ligne. **C'est la forme que la source exige.**

⭐ **Prends la FORME de `ConfirmationRetrait` dans le TON et le lieu de `ReunirCopies`.** ⛔ **Ne fabrique pas un cinquième composant de confirmation, et n'extrais pas le générique non exporté d'`EcranAnnee.tsx:217-271`** *(il a trois autres appelants : hors périmètre, une ligne dans `IDEES_post_rentree.md`)*.

**35. ⭐ DOUBLE LA CONFIRMATION D'UNE GARDE SERVEUR.** Le patron du 01/09 n'est pas un composant, c'est un **couple** : `actionDesignation(depotId, cas, zone, confirmee = false)` refuse quand `!confirmee` *(`app/deroule/actions.ts:411-440`)*, avec son motif — *« LA CONFIRMATION EST UNE GARDE, PAS UNE POLITESSE : l'écran pose la question, le serveur la tient. »* **Fais pareil** : `actionCloreLesDepots(_prec, form)` lit un champ `confirme` et **refuse sans lui**.

**36. ⭐ LES NOMS TIENNENT — mesuré, comme `AGENTS.md` l'exige.** Les 13 `display_name` concernés : **min 7, médiane 13, max 23 caractères** *(« Arthur Chaillet--Prandi »)*. La plus grande liste réelle : **10 noms, 161 caractères**. Pire cas théorique : **23 noms**, ~370 caractères. ⭐ **Donc : les noms EN CLAIR, tous, sans « et 7 autres », sans troncature.** ⚠️ **Mais éprouve la maquette sur 23 noms, pas sur 10**, et ⛔ **pas de `flex-wrap` sans `min-width`** *(défaut connu : titre écrasé à 12 px, tests verts)*.

**37. ⚠️ REPRENDS LE DRAPEAU `tronque`.** `lireDepotsDeLInstance` *(`depots.ts:135-165`)* pagine par 500 avec un drapeau de troncature explicite, et `EcranProf.tsx:264` **désactive déjà « Déclencher » sur `vue.tronque`**. ⛔ **Ta clôture se désactive de la même façon** — sinon elle agirait sur une liste incomplète. *(Le plafond PostgREST de 1000 lignes est déjà traité ici : ne le réinvente pas.)*

**38. ⭐ LE CORPS DU MIROIR, à écrire à côté de `ouvrirLesDepots` (`utils/passation/depots.ts:185-214`).** Copie ses **gardes**, pas seulement son `update` :

```ts
// 1. la garde de LIEU d'abord, avec son refus nommé (:191-196)
if (ex.lieu !== 'classe') return refus('Cette instance n’est pas une passation en classe…')
// 2. puis le compare-and-set, qui DONNE l'idempotence gratuitement (:201-204)
.update({ statut: 'abandonne', updated_at: maintenant })
.eq('exercice_id', exerciceId).in('statut', ['assigne', 'ouvert']).select('id')
// 3. et la même forme de retour : { clos, deja } comme { ouverts, deja } (:213)
```

⚠️ **`supabase-js` ne lève pas** : capte `{ error }` sur **chaque** écriture, **compte les lignes touchées** et **confronte-les au compte annoncé dans la confirmation**. Un écart se dit à l'écran.

⚠️ **Et tranche l'horodatage** : il n'y a **aucune colonne** miroir d'`ouvert_par_prof_at`, et aucune migration n'est permise. **La seule trace du QUAND sera la clé `at` de la ligne de journal** — ce qui rend le piège 21 *(journal sans lecteur)* plus lourd, pas moins. **Dis-le au relevé.**

---

## La convention de couture — ce que tu éprouves par EXÉCUTION

Ton lot succède à **`C4-L4`** *(la seule dépendance déclarée au `07-` §2)*, et il **croise** `C10-L1`. **Six coutures, nommées sous la seule forme qui les rend vérifiables** — *qui écrit · qui lit · un chemin réel y mène-t-il ?*

| couture | qui écrit | qui lit | l'épreuve, par exécution |
|---|---|---|---|
| **le miroir** `exercices_depots.statut` | ton `clore()` | `signal.ts:85`, `liste.ts:392`, `regles.ts:303`, `EcranProf.tsx:631` | un décor `assigne` + un décor `ouvert` sur la même instance → **les deux passent à `abandonne`, en un clic** ; second clic → **0 dépôt clos**, et le dit |
| **la garde** *(la couture que tu CRÉES)* | ton `depotClos()` | les **neuf** chemins d'écriture élève | ⭐ **le contrôle qui vaut tous les autres** : après clôture, **appelle vraiment** `validerLaTranscription`, `validerLaSaisieClavier`, `enregistrerLesPhotos`, `enregistrerLaTranscription` et les trois de `metacognition.ts` → **les sept sont refusés « Ce dépôt est clos. »**, et le statut en base est **encore `abandonne`** |
| **l'écran élève** `VueEleve` | `chargerVueEleve` | `EcranEleve.tsx` | par l'URL directe, sur un dépôt clos → **l'écran ne propose plus de déposer** |
| **le journal** `routeur_decisions.override_prof` | ton geste | ⛔ **personne** *(couture coupée à l'autre bout, piège 21)* | après le clic, **`select override_prof from routeur_decisions where …`** rend ton entrée, avec le bon `cycle_lundi` *(isodow = 1)* |
| **le compte** `assiduite_hebdo` | le cron du lundi | `comptesDeLaSemaine` | `comptesDeLaSemaine` **avant** et **après** → **égalité stricte**, sur une semaine comptée **et** sur la semaine en cours |
| **le routeur** `exercicesParCycle` | ta ligne de journal | `K de R5` | **compte K avant, insère, compte après → égalité** *(piège 23)*. ⛔ Si tu ne peux pas la tenir, tu n'insères pas |

**Le script se laisse au dépôt** : `scripts/recette/couture-c10l2.mjs`, **sur le patron de `couture-c10l1.mjs`** *(746 l.)* et des cinq autres `couture-*.mjs` — lancement `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-calibration-resolver.mjs …`, modes `--constat | --essai | --retire`, `.env.local` **parsé à la main** *(⛔ jamais `source` : zsh mange `$^#`)*, **refus dur** si l'URL n'est pas celle du bac à sable, **registre écrit à chaque écriture**, **retrait PAR LA MARQUE**.

⛔⛔ **ET LE BAC À SABLE EST PARTAGÉ : il porte 17 dépôts de classe `ouvert` qui appartiennent à d'AUTRES séances.** Ton script ne clôt **que l'instance qu'il a semée**, et son `--retire` ne touche **que ses ids** — jamais un `update` par table, jamais un `delete().neq(…)`. ⚠️ **Le bac à sable ne porte aucun dépôt d'origine `routeur`** : tout décor se fabrique. ⚠️ Décor `lieu='classe'` : le trigger `garde_depot_lieu` interdit tout champ vf, et sur un type `nature='complet'` le `cran` **doit rester nul**.

**Puis le smoke, à l'œil, aux trois largeurs** *(375 · 768 · 1280 — `capture-page.mjs`, qui **émule par CDP** ; ⛔ `chrome --window-size=375` ne fait PAS un écran de 375 px)* :
- **côté professeur** : la confirmation **avec 23 noms**, dont un de 23 caractères, sur les trois largeurs ;
- **côté élève, depuis une VRAIE session** *(lien magique)* **et sur les DEUX modules — c'est une décision de Louis du 07/09, pas une option** *(piège 32 ; et la plus grosse instance est une passation de LECTURE, donc Aletheia, piège 6)* : la bannière verte **éteinte**, la ligne **« abandonné »** dans « Mes examens passés », et l'écran de dépôt **fermé** par son URL directe — **dans Codex ET dans Aletheia**. ⛔ **Un smoke qui ne passe que sur Codex vérifie 5 bannières sur 15 en croyant les avoir toutes vues.** ⚠️ *(Le profil de cookies du smoke CDP est partagé entre séances.)*

**Montre le rendu avec les données réelles du décor** — pas « ça compile », pas « les tests passent ». ⚠️ **Et sache que `tsc` et `npm test` ne diront RIEN de ce lot** : `utils/passation/` n'a **aucun** `depots.test.ts`, et `grep "Ce dépôt est clos" --include='*.test.ts'` rend **0**. ⛔ **Écris au moins un test pur sous `utils/`** *(le glob de `npm test` est `utils/**/*.test.ts` — une règle posée sous `app/` ne serait JAMAIS éprouvée)* : `depotClos` refuse les trois statuts et laisse passer les six autres.

---

## Le « fait quand » — *(recopié du `07-` §2 ; ne se négocie pas en séance)*

> *Fait quand* : sur la page d'une passation en classe, **« Clore les dépôts » annonce les dépôts `assigne`/`ouvert` de l'instance avec les noms, demande confirmation, les passe à `abandonne` en les comptant, se journalise, et se rejoue sans effet** ; **une remise après clôture est refusée** ; les copies remises sont intactes ; les listes élève ne montrent plus ces dépôts dans « à faire » ; **prouvé en bac à sable par un script laissé au dépôt** et à l'œil aux trois largeurs.

**Quatre clauses ont été précisées par la mesure — aucune n'est amendée :**

1. **« une remise après clôture est refusée »** — ⛔ **ce refus est à ÉCRIRE, il n'existe pas** *(piège 1)*, et il s'éprouve **par appel réel des neuf chemins**, pas par lecture.
2. **« les listes élève ne montrent plus ces dépôts dans à faire »** — ✅ **tenu par le code existant, sans une ligne**. ⚠️ Mais le dépôt **ne disparaît pas** : il entre dans « Mes examens passés », marqué « abandonné » *(piège 19)*. **Le critère mesurable est : le signal vert s'éteint ; la ligne apparaît côté examens passés ; l'écran de passation ne propose plus de déposer.**
3. **« se journalise »** — ⛔ **la preuve ne peut être qu'une requête en base** : le journal n'a aucun lecteur *(piège 21)*.
4. **« les copies remises sont intactes »** — ⚠️ **« remis » ne recouvre pas « porte du travail »** : un de tes 15 dépôts porte 2 266 caractères et `v1_remis_at` nul *(piège 7)*. **La confirmation les nomme à part.**

⭐⭐ **Et une clause de plus, ajoutée par décision de Louis le 07/09 — elle est de la même force que les autres** : **le geste vaut pour CODEX COMME POUR ALETHEIA**, par le composant partagé et sans une branche de module *(piège 32)*, **et le smoke élève le prouve sur les deux**.

---

## Les conventions de dépôt et de clôture

- ⛔ **Aucune migration, aucun interrupteur — mesuré, pas supposé** *(piège 30)*. **Rien au `SUIVI_SQL.md`.** Si ton lot croit avoir besoin d'une migration, **il s'arrête et le dit**.
- ⚠️ **Tu ne touches pas à la doctrine en base** — tu n'en lis aucune table. La convention du dériveur *(`derive-doctrine.py --verifie`)* ne t'oblige donc pas. ⚠️ **En revanche, si tu amendes le `07-`, `npm test` passe au ROUGE** sur `instruments.test.ts` tant que `python3 scripts/derive-instruments.py --ecris` n'est pas rejoué. *Ne t'affole pas d'un rouge sans rapport avec ton code : c'est celui-là.*
- **Ta section au `SUIVI_tests_manuels.md`** : `## C10-L2 — Le professeur clôt les dépôts d'une passation (séance du …)` — ce qui est prouvé **coché avec sa preuve**, ce qui reste **décoché avec sa condition de reprise**. **Au moins trois décochés** : ⓐ **la clôture réelle en production, sur les 15 dépôts des 4 instances** *(Louis presse le bouton lui-même, quand il veut)* ; ⓑ **la branche `assigne`, jamais rencontrée en prod** ; ⓒ **le bouton de la maison, population nulle** *(piège 10)*.
- **Une source trouvée fausse se marque, elle ne se corrige pas** : **`[faux]`** au point de l'erreur, **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md` *(dépôt conception)*, qui porte l'avant / après. ⭐ **Tu en as une, et une seule** : *« le chemin de remise refuse déjà "Ce dépôt est clos" »* au `07-` §2, chapitre `C10`, entrée `C10-L2` — **avec la mesure : un chemin d'écriture sur onze, et ce n'est pas la remise.** ⛔ **Le `02-` §6.D, lui, n'était pas faux : il était muet — et son silence est déjà comblé** *(l'étape `11 bis`, écrite le 07/09 ; piège 29)*. **Aucun `[faux]` là-bas, et rien à y ajouter.**
- **Ton relevé** : `RELEVE_C10_L2_<date>.md`. Ce qui est pour un autre lot va **dans sa boîte** au `PLAN_DE_CHANTIER.md` §5, **par destinataire** — *« je ne fais pas X, c'est ton lot » n'est pas un dépôt.*
- ⛔ **`git add -A` est INTERDIT** : l'arbre porte le travail d'autres séances. **Fichier par fichier**, `git status --short` avant chaque commit.
- ⛔⛔ **Pousser, c'est déployer**, et `passation_classe_actif` est **ON en production** : la garde que tu écris atteint des élèves qui travaillent. **Ne pousse pas sans le « go » de Louis.**

---

## §H — Ce qui est hors de toi, et où ça va

- **Le bouton de la maison** *(« leur bouton reste à nommer »)* — **population 0/195 en production** *(piège 10)*. ⛔ **Hors périmètre.** Une ligne à la boîte du plan, avec le chiffre.
- **Les trois v1 tardives** — **ton bouton ne les touche pas** *(piège 8)*. **Tu les nommes à Louis ; tu n'élargis pas ta cible sans lui.**
- **Un portier de la passation en classe** *(11 actions, 8 gardes recopiées)* — **c'est une refonte** *(piège 2)*. Une ligne à `IDEES_post_rentree.md`.
- **Un lecteur du journal `override_prof`** — la couture est coupée à l'autre bout depuis toujours *(piège 21)*. **Ne fabrique pas l'écran** : une ligne à la boîte.
- **`actionContester` refusée sur une semaine fermée** — le commentaire de `C10-L1` *(`app/deroule/actions.ts:98-104`)* affirme le contraire de ce que le code fait *(il appelle `portier` en mode écriture)*. ⛔ **C'est un défaut de `C10-L1`, pas le tien.** Une ligne à `IDEES_post_rentree.md`. ⭐ **Mais la question miroir est à toi, et tu la tranches** : après `abandonne`, l'élève peut-il encore **lire** son retour et le contester ? *(Aujourd'hui, côté classe, rien ne le lui interdit.)*
- **Le trou des semaines de vacances** — **réfuté** *(piège 26)*. **Le trou réel** — l'élève inscrit après le comptage — **est à `C4-L13`** : tu le nommes, tu ne le répares pas.
- **`retirerLExercice` n'attrape pas l'erreur de son journal** *(`actions.ts:158`, `:166`)* — hors périmètre, mais **ne recopie pas ce défaut** *(piège 21)*.

---

## §I — L'entrée `C10-L2` du `07-Implementation.md` §2 — copie de ce qui est écrit dans la source

*(Chapitre `### C10 — la semaine se ferme`, écrit le 05/09 au soir, commité `ef56909`, **inchangé en 2.81**. La source fait foi ; cette copie est là pour que tu n'aies rien à chercher.)*

> *Chapitre ouvert le 05/09/2026 au soir, par décision de Louis, écran et base sous les yeux. Mesuré en production le même jour : rien ne ferme un exercice du routeur — l'échéance portée par le dépôt n'est qu'une pastille, le déroulé ne la lit pas, et un rendu tardif est mesuré par la chaîne alors que la ligne d'assiduité de sa semaine est figée depuis le lundi 14:00 (trois v1 rendues les 1er et 2 septembre sur le cycle du 24/08, comptées nulle part **[faux]** — *mesuré en production le 07/09/2026 par `C10-L1` : ces trois dépôts portent `origine = 'prof'` et **aucune décision de routeur** (assignés les 25 et 26/08). `C10-L1` ne les ferme donc pas : ils relèvent de `C10-L2`. […] Voir `INVENTAIRE_Non_Tranches.md`, DETTES, D11.*) ; quinze dépôts de passation en classe du 24/08 restaient `ouvert` dix jours après. Aucun interrupteur (décision de Louis, 05/09 : la fermeture est une règle de l'assiduité, pas une fonctionnalité qui s'essaie — même motif que `C4-L13`), aucune migration.*
>
> **C10-L2 — Le professeur clôt les dépôts d'une passation.** Miroir du geste « ouvrir les dépôts » *(`C4-L4`, `ouvert_par_prof_at`)* : un bouton sur la page de la passation en classe pose **`abandonne`** *(§1.1 — « non-geste de l'élève », au dénominateur, jamais rendu)* sur les dépôts `assigne` et `ouvert` de l'instance ; les copies remises ne bougent pas ; le chemin de remise refuse déjà « Ce dépôt est clos ». **Confirmation, jamais un refus** — elle nomme les élèves et compte les dépôts —, le geste se journalise comme le retrait *(§1.5)*, et il est idempotent. Sur une semaine déjà comptée, il ne change aucun chiffre montré au professeur *(§1.5 : « une semaine déjà arrêtée ne se réécrit jamais »)*. Les assignations à la main de la maison sont closes de la même main — leur bouton reste à nommer.
>
> *Fait quand* : **[recopié plus haut, verbatim]**.
>
> *Manifeste* : **ce document, §1.1, §1.5 et §2** *(entrée `C4-L4`)* · `02-exercices.md` **§6.D** · `06-Palimpseste.md` **§5**.

⚠️ **Trois phrases de cette entrée sont contredites par la mesure.** *« Le chemin de remise refuse déjà "Ce dépôt est clos" »* — **`[faux]`, et c'est ta dette** *(piège 1)*. *« Les assignations à la main de la maison »* — **population nulle** *(piège 10)* : ce n'est pas une erreur de la source, c'est une clause sans matière ; **une ligne à la boîte, pas de `[faux]`**. *« Le geste se journalise comme le retrait »* — **le retrait n'a jamais journalisé une ligne** *(piège 21)* : la source dit vrai du code, faux de l'usage ; **une ligne au relevé, pas de `[faux]`**. **Le reste tient.**

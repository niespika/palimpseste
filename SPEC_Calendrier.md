# Spécification — Calendrier (colonne vertébrale de la planification)

**Module :** Calendrier
**Statut :** Conception verrouillée, prêt pour implémentation
**Nature :** Couche transverse, sans onglet propre. S'affiche sur le tableau de bord et se déplie en vue détaillée.

---

## 1. Intention et principe directeur

Le calendrier est la **représentation temporelle unique** de tout ce qui est daté dans Palimpseste. Il n'est *pas* une source de vérité concurrente : il **lit** et **affiche** les dates fixées lors de la conception des travaux (option A, validée). Une date naît dans le module qui la produit (Codex, Aletheia, épreuve, quizz…) ; le calendrier la reflète, et permet une **édition légère** qui réécrit dans le module d'origine.

**Règle d'or (source de vérité unique) :** il n'existe jamais deux endroits où une même échéance « vit » indépendamment. Le module est propriétaire de la donnée. Le calendrier est une vue + une surface d'édition qui délègue l'écriture au module.

**Ce que le calendrier *n'est pas* :**
- Pas un onglet.
- Pas un emploi du temps à créneaux horaires (jours seulement).
- Pas un moteur de contraintes (les jours de cours et vacances sont purement informatifs).
- Pas le « à faire ». Le « à faire » et le calendrier sont deux objets distincts qui cohabitent sur le dashboard (cf. §7).

---

## 2. Modèle de données

### 2.1 Semestre (`Semester`)

Le semestre ancre toute la numérotation des semaines.

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `name` | string | ex. « Semestre 1 », « Semestre 2 » |
| `start_date` | date | Lundi de la semaine 1 |
| `end_date` | date | Dimanche de la dernière semaine |
| `is_active` | bool | Le semestre courant |

**Portée :** le semestre est **global au prof**, pas par classe. Toutes les classes partagent le même semestre (validé). Le prof le définit **une seule fois** pour l'ensemble de ses classes.

### 2.2 Période de vacances (`Holiday`)

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `semester_id` | FK → Semester | |
| `label` | string | ex. « Relâche », « Vacances de Noël » |
| `start_date` | date | |
| `end_date` | date | |

Les vacances appartiennent au semestre. Elles sont saisies par le prof, globales à toutes les classes.

### 2.3 Semaine (`Week`) — recalage sur le calendrier réel

La `Week` existe déjà comme entité unifiée transverse aux modules. Elle devient **datée et ancrée sur le calendrier réel** (validé : une semaine Palimpseste = une semaine calendaire, lundi → dimanche).

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `semester_id` | FK → Semester | |
| `pedagogical_number` | int \| null | Numéro **pédagogique** (S1, S2…). `null` si la semaine est une semaine de vacances. |
| `start_date` | date | Toujours un lundi |
| `end_date` | date | Toujours un dimanche |
| `is_vacation` | bool | True si la semaine chevauche une période de `Holiday` (cf. règle §3.2) |

> **Important :** la `Week` reste l'entité que les modules référencent déjà (semaine unifiée). On ne change pas les relations existantes module → semaine ; on **enrichit** la semaine avec son ancrage calendaire. Toute logique existante qui pointe vers une semaine continue de fonctionner.

### 2.4 Jour de cours (`TeachingDay`) — informatif

Saisi par le prof pour visualiser sa charge. **Aucune contrainte** n'en découle (validé).

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `class_id` | FK → Class | Quelle classe est vue ce jour-là |
| `date` | date | Jour précis (pas de créneau horaire) |

Modèle de saisie pragmatique : le prof indique « les jours où j'ai cours avec telle classe ». Voir §6.2 pour l'ergonomie de saisie (récurrence hebdo + exceptions) sans pour autant introduire de créneau.

### 2.5 Ce qui N'est PAS un nouveau modèle

Les **échéances de travaux** (ouverture/fermeture Codex, Aletheia, dates d'épreuve, dates de quizz) **ne sont pas** stockées dans le calendrier. Elles restent dans leurs modules respectifs. Le calendrier les agrège par **lecture** (cf. §4).

---

## 3. Numérotation des semaines

### 3.1 Génération

À la définition du semestre (`start_date`, `end_date`), le système génère automatiquement la liste des `Week` (une par semaine calendaire, lundi → dimanche) couvrant l'intervalle.

### 3.2 Vacances et numérotation (validé : les vacances ne comptent pas)

- Une semaine entièrement ou partiellement couverte par une `Holiday` est marquée `is_vacation = true`.
- Les semaines de vacances reçoivent `pedagogical_number = null` et **sont sautées** dans la numérotation pédagogique.
- Les semaines de travail sont numérotées **en continu** en ignorant les vacances.

**Exemple :**

```
Semaine calendaire   Statut        Numéro pédagogique
1–7 sept             travail       S1
8–14 sept            travail       S2
15–21 sept           travail       S3
22–28 sept           VACANCES      —  (sautée)
29 sept–5 oct        travail       S4   ← reprend à S4, pas S5
6–12 oct             travail       S5
```

- **Affichage :** les semaines de vacances apparaissent sur le calendrier en **grisé**, avec leur `label` (« Relâche »), mais sans numéro pédagogique.

### 3.3 Cas limite — semaine partiellement en vacances

Règle simple pour la v1 : si une semaine chevauche *une seule journée* de vacances, elle est traitée comme semaine de vacances (`is_vacation = true`, sautée). Si ce comportement s'avère trop grossier à l'usage, on raffinera. *(À surveiller à l'usage — Louis a anticipé ce genre d'ajustement empirique.)*

---

## 4. Agrégation des échéances (lecture depuis les modules)

Le calendrier interroge chaque module pour collecter les **événements datés** à afficher. Un événement de calendrier est une **projection en lecture**, jamais une donnée stockée dans le calendrier.

### 4.1 Forme normalisée d'un événement projeté (`CalendarEvent`, lecture seule)

```
CalendarEvent {
  source_module   : enum (codex | aletheia | fragments | scriptorium | epreuve | quizz | ...)
  source_id       : UUID          // l'entité d'origine
  class_id        : UUID          // pour le filtrage par classe
  kind            : enum (ouverture | fermeture | epreuve | quizz | jalon)
  date            : date
  label           : string        // ex. « Ouverture — Aletheia : L'Étranger »
  is_editable     : bool          // true si le calendrier peut réécrire cette date dans le module
}
```

### 4.2 Origine des dates d'ouverture / fermeture

Conformément à l'option A : les dates d'ouverture et de fermeture **découlent de la conception du travail** (unité, cours, livre…) **et du calendrier fixé pour ce travail** :

- **Calendrier fixé par le prof :** au moment de concevoir le travail, le prof choisit la semaine (ou les dates) d'ouverture et de fermeture. Le calendrier les affiche.
- **Travail en autonomie :** pas de date imposée → l'événement peut être affiché comme « fenêtre ouverte » ou sans borne de fermeture stricte, selon ce que le module définit. Le calendrier reflète ce que le module déclare ; il n'invente pas de date.

> Le calendrier n'a **pas** de logique propre pour *décider* d'une date. Il lit ce que le module a déterminé.

### 4.3 Édition légère depuis le calendrier

Quand `is_editable = true`, le prof peut, depuis la vue calendrier, ajuster la date d'un événement (par ex. décaler une fermeture). Cette action **appelle l'API du module propriétaire**, qui met à jour sa propre donnée. Le calendrier ne stocke rien ; il rafraîchit sa projection après écriture.

- Garde-fou : si le module impose des règles (ex. fermeture ≥ ouverture), c'est le module qui valide et renvoie l'erreur. Le calendrier affiche l'erreur sans la traiter lui-même.

---

## 5. Vues

### 5.1 Vue tableau de bord (par défaut)

- Le calendrier apparaît sur le dashboard sous forme compacte (mois courant ou bande de semaines à venir — cf. §6.1).
- **Vue par défaut : générale**, toutes classes superposées (validé : « un calendrier général »).
- Distinction visuelle des classes par **couleur**.
- Cliquable → ouvre la vue détaillée.

### 5.2 Vue détaillée

Accessible au clic depuis le dashboard. Permet de naviguer :
- **Mois** → vue d'ensemble, repérage de cadence (« j'ai collé un essai et deux quizz la même semaine »).
- **Semaine** → détail des échéances de la semaine, avec son numéro pédagogique.
- **Jour** → ce qui se passe ce jour précis (cours avec telle classe, ouvertures/fermetures tombant ce jour).

### 5.3 Filtrage par classe (toggle)

- Toggle permettant de **basculer du calendrier général vers une ou plusieurs classes spécifiques** (validé : « possibilité de toggle pour indiquer juste les classes »).
- État par défaut : toutes les classes affichées.
- *Note de conception :* Louis prévoit d'ajuster ce comportement à l'usage. Garder le composant de filtrage **modulaire** pour pouvoir changer la logique (multi-sélection, isolation d'une classe, etc.) sans refonte.

---

## 6. Ergonomie / maquette

### 6.1 Forme sur le dashboard

Recommandation : une **bande des semaines à venir** (les ~4–6 prochaines semaines) plutôt qu'un mois figé, parce que l'usage principal est « qu'est-ce qui arrive ». Chaque semaine montre :
- son numéro pédagogique (ou « Relâche » en grisé),
- les pastilles d'échéances (couleur = classe, icône = type : ouverture / fermeture / épreuve / quizz),
- l'indication des jours de cours.

Au clic sur une semaine → vue semaine détaillée.

### 6.2 Saisie des jours de cours

Pour éviter une saisie jour par jour fastidieuse **sans introduire de créneau horaire** :
- Le prof déclare un **motif hebdomadaire** par classe : « avec les Terminale, j'ai cours lundi et jeudi ».
- Le système matérialise ces jours sur tout le semestre (hors vacances).
- Le prof peut ajouter/retirer des **exceptions** ponctuelles (un cours déplacé, annulé).

Cela reste au grain « jour », conforme à la décision. *(Si même ce niveau s'avère superflu à l'usage, il pourra être désactivé sans toucher au reste.)*

### 6.3 Saisie du semestre et des vacances

- Écran de configuration (réglages prof, pas un onglet) : définir `start_date` / `end_date` du semestre, puis ajouter les périodes de vacances.
- À la validation → génération automatique des `Week` numérotées (§3).
- Modification ultérieure du semestre ou des vacances → **recalcul** de la numérotation. **Point de vigilance d'implémentation :** les modules référencent les semaines ; un recalcul ne doit pas casser ces liens. Re-numéroter (`pedagogical_number`) est sûr ; **supprimer/recréer** des `Week` ne l'est pas. Préférer une mise à jour en place des semaines existantes et n'ajouter/retirer que les semaines aux bords de l'intervalle.

---

## 7. Articulation avec le « à faire » (validé, important)

Le « à faire » du dashboard contient **deux familles** d'éléments. Le calendrier ne les remplace pas ; il les éclaire.

1. **Choses « à valider »** — tâches d'état sans date (« orateurs pas sélectionnés », « quizz en attente de validation »). → **Restent dans le « à faire ». N'apparaissent PAS sur le calendrier.** Ce sont des tâches, pas des événements.

2. **Choses qui découlent du calendrier mais pas encore faites** — une action devient nécessaire *parce qu'une date approche* : « tirer un orateur parce qu'un cours arrive », « ouvrir un dépôt pour tel travail ». → Ces items sont **générés à partir du calendrier** (une échéance proche déclenche l'apparition d'une tâche dans le « à faire ») mais **s'affichent dans le « à faire »**, pas comme un événement de plus sur le calendrier.

**Modèle mental :**
- Le **calendrier** = ce qui est **daté** (les échéances posées).
- Le **« à faire »** = ce qui demande une **action** (qu'elle dérive d'une date proche ou d'un simple état à valider).
- Un même fait peut produire les deux faces : une fermeture Aletheia est un *événement* (sur le calendrier) **et**, à l'approche, peut générer une *tâche* « préparer X » (dans le « à faire »). Mais on n'affiche jamais la tâche sur le calendrier ni l'événement nu dans le « à faire ».

### 7.1 Dérivation calendrier → « à faire »

Pour les items de la famille 2, définir un **déclencheur temporel** par type d'échéance :
- ex. « tirer un orateur » : apparaît dans le « à faire » N jours avant le cours concerné.
- ex. « ouvrir un dépôt » : apparaît à l'approche de la date d'ouverture si l'ouverture est manuelle.

Ces règles de dérivation appartiennent à la logique du « à faire » (qui *consomme* le calendrier), pas au calendrier lui-même. Le calendrier expose ses événements ; le « à faire » décide lesquels engendrent une tâche et quand.

---

## 8. Frontières du module (récapitulatif des « ne fait pas »)

- ❌ Ne stocke aucune échéance de travail (lecture seule depuis les modules).
- ❌ Pas de créneaux horaires.
- ❌ Pas de contraintes (jours de cours / vacances purement informatifs).
- ❌ Ne gère pas le « à faire » (objet distinct ; le « à faire » consomme le calendrier, pas l'inverse).
- ❌ Pas d'onglet.
- ❌ Côté élève : **rien** (le calendrier est un outil d'organisation du prof ; le « à faire » élève du Lot 9 couvre déjà leur besoin).

---

## 9. Découpage suggéré en lots (cohérent avec ta méthode)

| Lot | Contenu | Dépend de |
|---|---|---|
| **C1** | Modèle `Semester` + `Holiday` + écran de configuration | — |
| **C2** | Ancrage calendaire des `Week` + numérotation (saut des vacances) | C1, entité semaine existante |
| **C3** | Agrégation lecture des `CalendarEvent` depuis les modules | C2, modules existants |
| **C4** | Vue dashboard (bande des semaines) + couleurs par classe | C3 |
| **C5** | Vue détaillée (mois / semaine / jour) + toggle classes | C4 |
| **C6** | Édition légère des dates depuis le calendrier (réécriture module) | C3, C5 |
| **C7** | `TeachingDay` : motif hebdo + exceptions, affichage | C2 |
| **C8** | Dérivation calendrier → « à faire » (famille 2) | C3, « à faire » existant |

> C8 touche au « à faire » : à séquencer après que la couche calendaire (C1–C3) soit stable, pour ne pas mêler deux chantiers.

---

## 10. Questions résiduelles à trancher en cours d'implémentation

Aucune ne bloque le démarrage ; à fixer quand le code les rencontre :
- **Multi-semestre simultané ?** La v1 suppose un semestre actif. Si tu veux préparer le S2 pendant le S1, prévoir la coexistence (le modèle le permet déjà via `semester_id`).
- **Granularité du déclencheur temporel** du § 7.1 (combien de jours avant) : à régler par type, probablement configurable.
- **Semaine partiellement en vacances** (§3.3) : règle grossière en v1, à raffiner si besoin.

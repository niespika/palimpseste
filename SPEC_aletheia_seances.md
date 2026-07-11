# SPEC — Refonte Aletheia : Séances (découplage semaine calendaire)

> **Document de conception — aucun code applicatif n'est écrit ici.** Le DDL et les algorithmes sont spécifiés pour validation par le product owner. L'implémentation devra lire node_modules/next/dist/docs/ (Next à breaking changes) avant tout code.

## Changelog — durcissement adversarial

SPEC produit par workflow : **4 concepteurs** (lentilles données / dates / migration / IA-UX) → **synthèse** → **3 contre-épreuves adversariales** → **durcissement** (finalisation par groupes de sections).

Contre-épreuves : **17 findings** (3 bloquants, 8 majeurs, 6 mineurs ; doublons inter-lentilles convergents). Points durcis repliés dans ce SPEC :

- **[BLOQUANT] Statut snapshot** — le résolveur teste "statut === definie" (le snapshot persisté par publierHoraire stocke "definie", pas "resolue").
- **[BLOQUANT] Convention de date** — snapshot dateReelle = **lundi** ; l'échéance Aletheia = **dimanche** → dateReelle + 6 j (snapshot) / dateFinDimanche (frise repli). Les deux sources standardisées sur le dimanche.
- **[MAJEUR] Calendrier mode (b)** — source des livres du calendrier élargie (un livre gouverné par un parcours peut avoir date_debut null et serait exclu par le filtre calendrier-evenements.ts:118-122).
- **[MAJEUR] Tranches chevauchantes** — tie-break par spécificité corrigé ; drapeau "ambigu" = **désaccord de date** (pas ">1 candidat") ; précédence inter-parcours explicite (fraîcheur snapshot_genere_le).
- **[MAJEUR] Exposition rétroactive** — l'assignation d'un parcours contenant un livre déjà exposé **avertit + journalise** au lieu d'exposer silencieusement.
- **[MINEUR] Terminologie** — exemple TS du contrat corrigé (compile) ; inventaire de renommage "Semaine N" complété au-delà de data.ts.

---

## 1. Contexte & objectif

### 1.1 Problème

Aletheia est le module de lecture guidée d'un livre. La découpe d'un livre est stockée dans `scriptorium_documents`, indexée par une colonne `semaine` (int, 1..N). Ce mot « semaine » télescope DEUX notions distinctes :

- un **ordinal de découpe** (le k-ième morceau du livre) — ce que la colonne représente RÉELLEMENT ;
- une **semaine calendaire** — ce que 5 sites de code DÉRIVENT abusivement via l'équation `date = date_debut + (semaine − 1) × 7`, où `date_debut` est la colonne date pure de `scriptorium_unites`.

Ce couplage impose « 1 morceau de livre = 1 semaine calendaire à cadence fixe depuis `date_debut` ». C'est faux pédagogiquement dès qu'un prof veut lire deux morceaux la même semaine, sauter une semaine, ou piloter la lecture depuis un parcours.

### 1.2 Objectif

1. **Renommer** (UI/libellés uniquement) « semaine » → **« séance »** partout où le sens est « ordinal de découpe » : une séance est un morceau auto-suffisant du livre, un simple ordinal 1..N, DÉCORRÉLÉ de la semaine calendaire.
2. **Découpler** la lecture d'un livre de la semaine calendaire : un livre assigné seul (mode a) n'affiche AUCUNE date (déblocage séquentiel pur) ; un livre gouverné par un parcours (mode b) tire ses dates du parcours (frise + snapshot), qui autorise plusieurs séances par semaine calendaire.

Ce que la refonte n'est PAS : ni une migration de données, ni un changement du contrat IA, ni un nouvel algorithme de distribution temporelle. Le modèle Parcours (déjà en prod) porte toute la machinerie de distribution séance→semaine ; on n'en construit qu'un **résolveur de lecture** (§6).

### 1.3 Faits vérifiés sur le code (ancrage de tout le SPEC)

- Livre = `scriptorium_unites` type='livre' (`id, label, auteur, date_debut date pure nullable, nb_semaines, ordre, supprime_at`).
- Découpe = `scriptorium_documents.semaine` (int ordinal ; porte `titre, chapitres, texte_extrait`). `texte_extrait` = corps IA, JAMAIS exposé élève (`app/eleve/modules/aletheia/data.ts` ne SELECTionne que `unite_id, semaine, titre, chapitres`).
- Travail élève PROD = `aletheia_travaux(eleve_id, scriptorium_livre_id, semaine_index, statut, …)`, contrainte UNIQUE incluant `semaine_index` (cf. `aletheia_lot2.sql`).
- Diagnostic = `aletheia_diagnostic.semaine_index` ; référence = `aletheia_livre_reference` (jsonb, clé `semaine`) ; flashcards = `quazian_flashcards.semaine`.
- Machine à états PAR SÉANCE : DRAFT → V1_SUBMITTED → FEEDBACK1_READY → VF_SUBMITTED → FEEDBACK2_READY → DONE. Déblocage séquentiel = ensemble `doneSet` des `semaine_index` DONE → PUR ORDINAL.
- Anti-spoiler = PUR ORDINAL dans `utils/aletheia-retours.ts` : `assemblerAncrageSemaine`, `assemblerAncrageLivre`, `assemblerAncrageVf` filtrent `.lt('semaine', s)` (amont), `.eq('semaine', s)` (courante), `.gt('semaine', s)` (aval) sur `scriptorium_documents`. AUCUN de ces filtres ne dépend d'une date.
- Exposition lecture = `scriptorium_unite_classes` (livre→classe), source unique actuelle ; dates dérivées de `date_debut` en 5 sites (cf. §6).
- Modèle Parcours DÉJÀ EN PROD (`parcours_phase_a.sql` + `parcours_snapshot_horaire.sql`) : `scriptorium_parcours` (gabarit, nb_semaines 1..52), `scriptorium_parcours_creneaux` (arc exclusif contenu|livre, tranche `livre_semaine_debut/fin` bornes incluses, `(null,null)`=livre entier), `scriptorium_parcours_classes` (assignation + `date_debut` + `statut` active|archivee + `horaire_snapshot jsonb` + `snapshot_version` + `snapshot_genere_le`), frise `utils/frise-enseignement.ts`.
- Contrat de snapshot vérifié : `horaire_snapshot` est un `ApercuSemaine[]` (`app/prof/scriptorium/parcours/frise-serveur.ts:16-21`), dont `statut ∈ {'definie','a_definir','non_planifiable'}` (le `'resolue'` interne de la frise est réécrit en `'definie'` à la sérialisation, `frise-serveur.ts:70-72`) et `dateReelle` = **LUNDI** `YYYY-MM-DD` (`frise-serveur.ts:17`). Ces deux faits gouvernent le résolveur (§6) et sont rappelés partout où il en dépend.

### 1.4 Nature du document

SPEC de conception à valider par le PO AVANT tout code. AUCUN code applicatif ici : seulement DDL exact, algorithmes (pseudo-code), tables d'impact et décisions à trancher. NB implémentation future : le projet est un Next.js à breaking changes ; l'implémenteur DEVRA lire `node_modules/next/dist/docs/` avant d'écrire du code (hors périmètre de ce SPEC).

## 2. Décisions verrouillées

Ces 7 décisions PO sont NON NÉGOCIABLES ; tout le SPEC en dérive.

> **⚠️ SUPERSESSION EN TÊTE DE SECTION.** Le SPEC Parcours verrouillait sa **décision 9** : « référencer un livre dans un créneau ne donne AUCUN accès Aletheia ; exposition Aletheia mono-source via `scriptorium_unite_classes` ». **Cette décision 9 est ici RÉOUVERTE et SUPERSÉDÉE par LD3 + LD5** (détail en encadré ci-dessous). Désormais, référencer un livre dans un créneau d'un parcours ASSIGNÉ ACTIF confère à la fois **les dates** (frise/snapshot) ET **l'exposition Aletheia** (union de lecture) à la classe assignée.

**LD1 — Renommage UI/libellés SEULS, zéro migration de données.** Les colonnes DB gardent leur nom hérité : `aletheia_travaux.semaine_index`, `scriptorium_documents.semaine`, `aletheia_diagnostic.semaine_index`, `quazian_flashcards.semaine`, clé jsonb `semaine` de `aletheia_livre_reference`. Aucun `ALTER … RENAME COLUMN`, aucun backfill, aucun risque sur les données prod. Le renommage est UI/TS/commentaires uniquement. Corollaire : ces colonnes SIGNIFIENT désormais officiellement « ordinal de séance » (index de découpe, JAMAIS une date) — cf. §3.

**LD2 — Mode (a), livre assigné SEUL (hors parcours) : AUCUNE DATE, déblocage séquentiel pur.** Les 5 sites de dérivation deviennent MUETS pour un livre non gouverné par un parcours assigné actif à la classe de l'élève. L'élève voit « Séance N — [titre] » sans date ; aucune échéance calendrier. Les livres prod ayant un `date_debut` : on CESSE d'afficher leur date (`date_debut` CONSERVÉ en base, inutilisé pour l'affichage). Changement de comportement rétro-compatible, réversible, à signaler au PO.

**LD3 — Mode (b), « parcours = livre + ressources » : le PARCOURS pilote dates ET exposition Aletheia du livre** via la frise. Ceci RÉOUVRE ET SUPERSÈDE explicitement la décision 9 verrouillée du SPEC Parcours (voir encadré).

**LD4 — AUCUN nouvel algorithme de distribution.** Le mapping séance→semaine calendaire en mode (b) est AUTHORÉ PAR LE PROF via le builder de créneaux/tranches EXISTANT (tranche 1 séance = 1 séance/semaine ; tranche multi-séances = plusieurs séances/semaine ; ressources = autres créneaux). SEUL nouveau besoin : un **résolveur côté lecture** séance→créneau→semaine parcours→date (snapshot). Séance non couverte par un créneau → pas de date (repli séquentiel). Cas dégénéré « livre entier dans 1 créneau à 1 semaine » (toutes séances même date) → le PO oriente vers le mode (a) (« si rien à ajouter, pas besoin de parcours »).

**LD5 — Conflit d'exposition : PAS de précédence silencieuse.** Coexistence AUTORISÉE pour un parcours PARTIEL (tranche). Le conflit ne se pose QUE pour un livre assigné EN TOTALITÉ à la fois via un parcours ET en direct (`scriptorium_unite_classes`) sur la MÊME classe → AVERTIR le prof + CHOIX GUIDÉ. Modèle : exposition = UNION des chemins (l'élève lit le livre une fois) ; datation = date du snapshot parcours quand un créneau couvre la séance, sinon aucune.

**LD6 — Source des dates (mode b) : SNAPSHOT publié prioritaire, RECALCUL frise en repli.** Dates élève déterministes et stables tant que le prof n'a pas re-publié. Rappel de garde (§6) : la branche snapshot du résolveur teste `statut === 'definie'` (contrat `ApercuSemaine`), JAMAIS `'resolue'` — sans quoi LD6 est un mort-né (repli frise systématique, dates non stables).

**LD7 — Contrat IA INCHANGÉ.** Le mot « semaine » reste la PLOMBERIE INTERNE de l'IA (contenu de prompt `## Semaine ${d.semaine} — …`, invisible élève), la clé JSON `semaine` du contrat de génération de RÉFÉRENCE (parse `aletheia-retours.ts`), et les placeholders (`{texte_semaine}`/`{semaine_courante_texte}`/`{structure_semaines}`/`{total_semaines}`, etc.) référencés par les overrides prof (`aletheia_params.prompt_*`). Le renommage N'ATTEINT JAMAIS le modèle ni le parse. UI-only (preuve §10).

### Supersession explicite de la décision 9 du SPEC Parcours

> SPEC Parcours, décision 9 (verrouillée) : « référencer un livre dans un créneau ne donne AUCUN accès Aletheia ; exposition Aletheia mono-source via `scriptorium_unite_classes` ».

**Cette décision 9 est RÉOUVERTE et SUPERSÉDÉE par LD3 + LD5.** Nouvelle règle : un créneau `ref_type='livre'` dans un parcours ASSIGNÉ à une classe (`scriptorium_parcours_classes` statut `active`, `scriptorium_parcours.supprime_at IS NULL`) OUVRE l'exposition Aletheia du livre (ou de sa tranche) à cette classe ET fournit ses dates via frise/snapshot. Portée de la supersession :

- l'exposition Aletheia n'est PLUS mono-source ; elle devient l'**UNION** de deux chemins : `scriptorium_unite_classes` (direct) ⋃ créneaux-livre de parcours assignés actifs (indirect) ;
- la datation devient multi-source AVEC PRÉCÉDENCE DÉTERMINISTE (snapshot > frise > aucune) ;
- le garde-fou LD5 remplace l'interdiction pure : au lieu d'interdire, on AVERTIT sur le seul cas ambigu (whole-book en double).

Ce qui NE change PAS de la décision 9 : le Scriptorium reste prof-only (RLS) ; la lecture élève passe toujours par le client admin avec garde applicative filtrant `texte_extrait`/`fichier_ref`. Toute autre garantie du SPEC Parcours reste en vigueur.

> **⚠️ Conséquence à auditer AVANT bascule (renvoi §9).** Le builder de parcours (L4) et l'assignation classe (L5) étant DÉJÀ en prod, des créneaux `ref_type='livre'` PRÉEXISTANTS peuvent déjà exister sous le régime de la décision 9 (« référencer n'expose pas »). Le jour où l'union LD3/LD5 est activée, ces créneaux ouvriraient RÉTROACTIVEMENT l'accès Aletheia sans action prof. Un inventaire prod obligatoire précède donc l'activation (traité en §9) — cette exposition rétroactive est un changement de comportement observable au même titre que la perte de dates du mode (a).

## 3. Contrat de terminologie « semaine (calendaire) vs séance (ordinal) »

C'est LE POINT SENSIBLE DU PO. Objectif : quand plus tard « une semaine calendaire pourra contenir plusieurs séances », AUCUN télescopage de vocabulaire ne doit subsister. Le contrat est CONTRAIGNANT pour tout futur code/type/libellé/UI.

### 3.1 Deux notions, deux mots, une frontière stricte

| Terme | Sens | Nature | Où il vit |
|---|---|---|---|
| **séance** | ordinal de découpe : le k-ième morceau auto-suffisant (1..N) | ENTIER pur, sans unité temporelle | `scriptorium_documents.semaine`, `aletheia_travaux.semaine_index`, `aletheia_diagnostic.semaine_index`, `quazian_flashcards.semaine`, clé jsonb `semaine` de `aletheia_livre_reference`, segment de route `[semaine]`, bornes `scriptorium_parcours_creneaux.livre_semaine_debut/fin` |
| **semaine (calendaire / d'enseignement)** | intervalle de 7 jours réel, positionné dans un semestre, sautant les vacances | DATE / index de frise | `frise-enseignement.ts` (`indexContinu`, `pedagogicalNumber`, `dateFinDimanche`…), `scriptorium_parcours.nb_semaines`, `scriptorium_parcours_creneaux.semaine` (semaine RELATIVE du parcours 1..nb), `scriptorium_parcours_classes.date_debut`, `horaire_snapshot[].semaine` / `.dateReelle` |

**Piège majeur à documenter :** deux colonnes s'appellent `semaine` avec DEUX sens OPPOSÉS — `scriptorium_documents.semaine` = SÉANCE (ordinal), `scriptorium_parcours_creneaux.semaine` = SEMAINE (calendaire relative du parcours). Le résolveur (§6) est précisément le pont entre les deux ; c'est le seul endroit où elles se rencontrent, et il doit le signaler en commentaire de tête.

### 3.2 Colonnes héritées : signification RE-CONTRACTÉE (LD1)

On ne renomme AUCUNE colonne (zéro migration). On CHANGE leur signification documentée via des `COMMENT ON COLUMN` additifs (§5, optionnels). La clé jsonb `semaine` de `aletheia_livre_reference` ne peut recevoir de `COMMENT ON COLUMN` (intra-JSON) → documentée côté TS (§3.3) et figée par le contrat IA (§10). Idem pour les bornes `scriptorium_parcours_creneaux.livre_semaine_debut/fin` : elles portent le mot « semaine » mais sont des ordinaux de séance (`SeanceOrdinal`), et un `COMMENT ON COLUMN` additif tue l'ambiguïté à la source.

### 3.3 Alias TS et convention de nommage (nouveau code)

Introduire un alias de type dans un module partagé (ex. `utils/aletheia-seance.ts`). Le **brand** est recommandé pour que le compilateur distingue séance et semaine ; mais un type branded n'accepte PAS un `number` nu sans cast. Pour éviter que l'équipe sème des `as SeanceOrdinal` non vérifiés (qui vident le brand de sa valeur), on impose **un unique constructeur au bord DB→TS** :

```ts
/** Ordinal de séance (1..N) = index de découpe d'un livre. JAMAIS une date,
 *  JAMAIS une semaine calendaire. Persisté sous les noms hérités
 *  scriptorium_documents.semaine / aletheia_travaux.semaine_index (LD1). */
export type SeanceOrdinal = number & { readonly __brand: 'SeanceOrdinal' }

/** SEUL point de cast autorisé : au bord DB → TS. Interdit `as SeanceOrdinal`
 *  ailleurs. Ainsi on ne peut pas brander par erreur une semaine calendaire. */
export function asSeance(n: number): SeanceOrdinal {
  return n as SeanceOrdinal
}

// Utilisation (compile) :
const seance: SeanceOrdinal = asSeance(t.semaine_index) // t.semaine_index: number
```

Repli acceptable si l'équipe juge le brand trop coûteux : alias non-branded documenté `export type SeanceOrdinal = number` (compile trivialement, mais sans garde compilateur — on retombe alors entièrement sur la convention de nommage ci-dessous).

Règles CONTRAIGNANTES pour tout NOUVEAU symbole :

1. **INTERDICTION** d'introduire un nouveau champ/variable/prop nommé `semaine` / `semaine_index` pour un ordinal. Nouveau code → `seance`, `seanceOrdinal`, `seanceIndex`, typé `SeanceOrdinal`.
2. Le mot `semaine` dans du NOUVEAU code est RÉSERVÉ au calendaire (frise, parcours, dates). Nouveaux champs calendaires : `semaineParcours`, `semaineEnseignement`, `dateReelle`.
3. Les accès aux colonnes héritées restent littéraux au niveau SQL/PostgREST (`.eq('semaine', …)`, `t.semaine_index`), mais la variable JS qui porte la valeur est nommée `seance`/`seanceOrdinal` et typée `SeanceOrdinal` via `asSeance(...)` (ex. `const seance = asSeance(t.semaine_index)`).
4. Les libellés UI n'affichent JAMAIS « Semaine N » pour une séance : toujours « Séance N » (§7). « Semaine » à l'écran = uniquement une date/semaine calendaire de parcours.

### 3.4 Frontière IA préservée (LD7)

Le contrat NE FRANCHIT PAS la frontière IA. À l'INTÉRIEUR des prompts (`aletheia-retours.ts`) et du parse de référence, `semaine` reste inchangé (plomberie invisible élève). Documenter cette frontière en tête de `aletheia-retours.ts` : « ici `semaine` = plomberie IA (ordinal + libellé modèle) ; dès qu'une valeur ordinale sort vers l'UI ou une date, elle devient SÉANCE (`asSeance`) ». Un test de garde (§11, Lot 0) vérifie qu'aucun libellé exposé élève ne contient « Semaine \<ordinal\> ».

### 3.5 Pourquoi ce contrat suffit à la scalabilité future

Quand une semaine calendaire contiendra plusieurs séances (déjà possible via une tranche multi-séances, LD4), le vocabulaire ne télescope pas : `semaineParcours = 3` peut couvrir `seance ∈ {5,6}` sans collision de noms. Le résolveur (§6) exprime exactement cette relation N séances → 1 semaine.

Livrable Lot 0 (§11) : alias + constructeur `asSeance` + commentaires d'ancrage + note de convention (ex. dans `AGENTS.md` ou `docs/terminologie-aletheia.md`), sans aucun changement de comportement.

## 4. Périmètre (DANS / HORS)

### DANS le périmètre

- **Renommage UI** « semaine » → « séance » sur toutes les surfaces Aletheia élève et prof (libellés, titres, sous-titres, aria, breadcrumbs, labels calendrier, en-tête livre, rail de découpe Scriptorium), SANS toucher aux colonnes DB (LD1). L'inventaire des surfaces à renommer inclut au moins `app/eleve/modules/aletheia/data.ts`, `app/eleve/modules/aletheia/page.tsx` (chips « Séance courante », compteur « N séances », héros capstone) et le stepper `etapes.ts` ; il n'est PAS réputé exhaustif — le test de garde §3.4/§10 sert de filet ultime contre tout « Semaine N » élève résiduel.
- **Contrat de terminologie** (§3) : alias TS `SeanceOrdinal` + constructeur `asSeance`, commentaires d'ancrage SQL, convention de nommage, interdiction de nouveau champ `semaine` pour l'ordinal.
- **Découplage date/séance** : neutralisation des 5 sites de dérivation `date_debut + (semaine−1)×7` (§6) selon le mode (a) / (b).
- **Mode (a)** : livre assigné seul → aucune date, déblocage séquentiel pur (infra déjà là ; on rend les dates muettes).
- **Mode (b)** : résolveur de lecture séance→créneau→semaine parcours→date (snapshot/frise), NOUVEAU code de lecture pur (aucune écriture).
- **Exposition UNION** (direct ⋃ parcours) + garde-fou d'avertissement whole-book (LD5), côté prof/authoring, + **audit prod des créneaux-livre préexistants** avant activation (§2 encadré, §9).
- **Impact calendrier élève** : suppression des échéances dérivées de `date_debut` en mode (a) ; échéances dérivées du snapshot en mode (b), en re-sourçant depuis les créneaux-livre de parcours actifs (le filtre `.not('date_debut','is',null)` de `calendrier-evenements.ts:118-122` ne pouvant plus être la seule porte d'entrée).
- **Commentaires d'ancrage DDL** (additifs, `COMMENT ON COLUMN`, optionnels) — y compris sur `scriptorium_parcours_creneaux.livre_semaine_debut/fin`.

### HORS périmètre (explicite)

- **Toute migration/renommage de colonnes DB** ou de données sur `aletheia_travaux`, `scriptorium_documents`, `aletheia_diagnostic`, `quazian_flashcards`, `aletheia_livre_reference` (LD1 : interdit).
- **Modification du contrat IA** : prompts, parse de référence, placeholders, overrides `aletheia_params.prompt_*` (LD7 : intacts ; garde-fou = `git diff utils/aletheia-retours.ts` vide).
- **Nouvel algorithme de distribution séance→semaine** : le builder de créneaux existant reste la seule autorité (LD4). Pas de répartition automatique.
- **Toute modification du modèle Parcours** au-delà de la lecture (créneaux, tranches, snapshot, frise : réutilisés tels quels, non dupliqués).
- **Refonte de la machine à états** (déjà purement ordinale, compatible « séance » sans changement) et du déblocage séquentiel.
- **Suppression physique de `date_debut`** sur `scriptorium_unites` (conservé pour réversibilité LD2).
- **Renommage du segment de route `[semaine]`** (recommandation : NON — coût routing Next.js breaking + bookmarks ; posé en question ouverte, cf. §12).
- **Restriction de la visibilité des séances à la seule tranche d'un parcours partiel** : le livre reste exposé en entier (datation par séance uniquement ; restreindre casserait le déblocage séquentiel et le capstone = toutes séances DONE — arbitrage §8/§12).
- **Matérialisation de dates** (table de liaison ou cache de dates séance→date) : refusé — risque de désynchronisation ; le snapshot est déjà le seul cache légitime.
- **Quazian / Codex / Fragments** : consommateurs ordinaux, intacts (seuls libellés élève éventuels traités au lot renommage).
- **Écriture de code applicatif** (ce document est un SPEC).

## 5. Modèle de données (DDL)

### 5.1 Thèse : ZÉRO nouvelle table, ZÉRO nouvelle colonne applicative — preuve par épuisement

La refonte est un changement de **couche de lecture/affichage**, pas de schéma. Chaque besoin fonctionnel est déjà couvert par un objet existant, en prod. Démonstration :

| Besoin de la refonte | Couvert par (existant, en prod) | Nouveau DDL ? |
|---|---|---|
| Ordinal de séance | `scriptorium_documents.semaine` (LD1 : re-sémantisée en ordinal, **non renommée**) | Non |
| Travail / diagnostic / référence / flashcards par séance + UNIQUE | `aletheia_travaux.semaine_index`, `aletheia_diagnostic.semaine_index`, clé jsonb `semaine` de `aletheia_livre_reference`, `quazian_flashcards.semaine` | Non |
| Mode (a) « aucune date » | `scriptorium_unites.date_debut` NULLABLE **conservé mais non lu** ; exposition via `scriptorium_unite_classes` | Non (l'absence de date = défaut par **non-usage** des 5 sites §6) |
| Distribution séance → semaine calendaire (mode b) | `scriptorium_parcours_creneaux` (`livre_id`, `livre_semaine_debut`/`livre_semaine_fin`, `semaine` relative 1..nb, `ordre`) | Non (LD4 : authoré par le prof) |
| Assignation parcours → classe + date de départ | `scriptorium_parcours_classes` (`parcours_id`, `classe_id`, `date_debut`, `statut`) | Non |
| Dates figées déterministes (LD6) | `horaire_snapshot` / `snapshot_version` / `snapshot_genere_le` (chantier ③, déjà en prod) | Non |
| Date réelle d'une semaine de parcours (repli) | `friseEnseignementContinue` + `resoudreAncre` + `mapperParcours` (`utils/frise-enseignement.ts`) | Non |
| Exposition directe (mode a) | `scriptorium_unite_classes` | Non |
| Exposition parcours (mode b, UNION) | jointure `scriptorium_parcours_creneaux (ref_type='livre')` ⋈ `scriptorium_parcours_classes (statut='active')` ⋈ `scriptorium_parcours (supprime_at is null)` | Non (requête de lecture) |
| Mode (a) vs (b) d'un livre pour une classe | **DÉRIVÉ** : « existe-t-il un créneau-livre actif couvrant ≥1 séance ? » | Non (prédicat calculé) |
| Perf jointure résolveur | Index existants `idx_parcours_creneaux_livre (livre_id)`, `idx_parcours_classes_classe (classe_id)` (`parcours_phase_a.sql`) | Non |

**Conclusion : le schéma est SUFFISANT. La refonte n'exige AUCUN `CREATE TABLE`, `ALTER … ADD COLUMN`, ni `RENAME`.** C'est le meilleur profil de sûreté prod possible : aucune écriture destructive, aucun backfill, aucune migration de données.

**Nuance de portée (finding R8) — « zéro nouveau *schéma* » ≠ « zéro nouvelle *lecture runtime* ».** La branche de repli du résolveur (§6.4) reconstruit la frise, ce qui déclenche les lectures `semesters` + `holidays` par année scolaire aujourd'hui encapsulées dans `construireFrise` (`app/prof/scriptorium/parcours/frise-serveur.ts`), historiquement **prof-only**. En mode (b), ce chemin migre dans le **rendu élève** (liste des séances + page de séance), potentiellement par `(livre, classe)` et par parcours candidat. Ce n'est donc pas « zéro nouvelle requête ». Le SPEC exige au **Lot 3** : mémoïsation de la frise par année scolaire et du résolveur par `(livre, classe)`, et priorité au snapshot (une fois la branche snapshot corrigée §6.4) pour éviter la reconstruction. Un budget de requêtes est ajouté au critère de non-régression §9.5. Cette charge reste additive et sans impact schéma.

### 5.2 Pourquoi PAS de table de liaison ni de cache de dates matérialisé

On s'abstient **délibérément** de matérialiser l'exposition indirecte (mode b) ou les dates résolues :

- **L'exposition est intégralement DÉRIVABLE par requête** (jointure §5.1). Une table matérialisée `livre↔classe (via parcours)` introduirait exactement le bug qu'on veut éviter : la **désynchronisation** entre la vérité (créneaux + assignations) et sa copie.
- L'ajout/retrait d'un créneau ou d'une assignation reflète **automatiquement** l'exposition, sans trigger ni backfill.
- Le **snapshot ③ est déjà le seul « cache » légitime** : c'est une copie *optionnelle* et *explicitement republiée* d'un calcul dérivable. Le résolveur pur (§6.4), batché par `(livre, classe)`, suffit en performance ; le snapshot ne fait que le stabiliser (LD6).

Toute autre matérialisation est **hors périmètre** et déconseillée.

### 5.3 SEUL DDL proposé — OPTIONNEL, documentaire, additif, idempotent, réversible

Aucun DDL n'est **obligatoire**. Le seul DDL envisagé pose des **commentaires d'ancrage** du contrat de terminologie (§3) sur les colonnes au nom hérité « semaine ». Ces `COMMENT ON COLUMN` n'altèrent **ni schéma logique, ni type, ni contrainte, ni donnée** ; ils peuvent être joués **ou omis** sans aucun risque (arbitrage PO, cf. §12 / Q5). Ils servent de garde-fou anti-régression pour tout futur développeur lisant la table.

```sql
begin;

-- Ordinal de séance (index de découpe), JAMAIS une date.
comment on column scriptorium_documents.semaine    is
  'ORDINAL DE SÉANCE (1..N) — index de découpe du livre, PAS une date (contrat terminologie, LD1). Nom hérité conservé, zéro migration.';
comment on column aletheia_travaux.semaine_index    is
  'ORDINAL DE SÉANCE — référence logique vers scriptorium_documents.semaine. PAS une semaine calendaire.';
comment on column aletheia_diagnostic.semaine_index is
  'ORDINAL DE SÉANCE — aligné sur aletheia_travaux.semaine_index. PAS une semaine calendaire.';
comment on column quazian_flashcards.semaine        is
  'ORDINAL DE SÉANCE d''origine Aletheia — PAS une semaine calendaire.';

-- Durcissement recommandé : les bornes de tranche Parcours portent « semaine »
-- mais désignent des SÉANCES (SeanceOrdinal), pas des semaines calendaires.
comment on column scriptorium_parcours_creneaux.livre_semaine_debut is
  'ORDINAL DE SÉANCE (borne incluse) du livre référencé — aligné sur scriptorium_documents.semaine. PAS une semaine calendaire.';
comment on column scriptorium_parcours_creneaux.livre_semaine_fin   is
  'ORDINAL DE SÉANCE (borne incluse) ; (null,null) = livre entier. PAS une semaine calendaire.';

commit;
```

**Aucun `CREATE`, `ALTER … ADD/DROP/RENAME`, aucun `UPDATE`.** On **NE touche PAS** `aletheia_livre_reference` : sa clé jsonb `semaine` est gelée par LD7 (parse dans `utils/aletheia-retours.ts`).

> Note terminologique à commenter si souhaité : `nb_semaines` existe sur **deux** tables au sens divergent — `scriptorium_unites.nb_semaines` compte des **SÉANCES** (découpe d'un livre), tandis que `scriptorium_parcours.nb_semaines` compte des **semaines calendaires** de parcours (1..52). Ne pas confondre dans le code de résolution (§6.4).

### 5.4 Intégrité de `aletheia_travaux` (contrainte UNIQUE) — analyse de non-régression

Clé fonctionnelle `(eleve_id, scriptorium_livre_id, semaine_index)` UNIQUE, **données PROD réelles**. La refonte est prouvée sans impact :

1. **Le renommage ne touche pas `semaine_index`** (LD1). La séance 3 reste la séance 3 ; la contrainte reste sémantiquement correcte.
2. **Le mode (b) n'écrit JAMAIS dans `aletheia_travaux`** : le résolveur (§6.4) est en **LECTURE seule** ; il traduit un ordinal en date à l'affichage. La clé du travail reste l'ordinal, indépendante de la date et du parcours.
3. **Coexistence direct + parcours (LD5)** : l'élève lit le livre **une seule fois** (union d'exposition, pas duplication). La clé n'inclut **ni `parcours_id` ni `classe_id`** → deux parcours contenant le même livre pour la même classe ne créent **pas** deux jeux de travaux. Aucune violation possible de l'UNIQUE.
4. **Séances hors tranche** : les travaux sur les séances 1, 2, 5… coexistent sans conflit — la clé est **par séance**, pas par tranche.

### 5.5 Garde applicative « créneau.semaine ≤ parcours.nb_semaines » et créneaux orphelins

Le schéma en prod (`parcours_phase_a.sql`) ne pose sur `scriptorium_parcours_creneaux.semaine` qu'un `CHECK (semaine >= 1)` — **aucune borne supérieure** vis-à-vis de `scriptorium_parcours.nb_semaines`. **On ne durcit PAS cela par un `CHECK` ni un trigger DB** (un `CHECK` ne peut référencer une autre table ; un trigger contredirait le principe zéro-DDL de §5.1). La contrainte est donc **applicative**, à deux niveaux :

| Point de garde | Où | Règle |
|---|---|---|
| **Authoring** (pose/édition de créneau) | builder de créneaux `scriptorium_parcours_creneaux` (prof-only) | Refuser / signaler `semaine > parcours.nb_semaines` (créneau qui ne tombera jamais dans une semaine de parcours) et `livre_semaine_debut/fin` hors `[1 .. nbSeancesLivre]` où `nbSeancesLivre = scriptorium_unites.nb_semaines` (ou `max(scriptorium_documents.semaine)`). |
| **Résolveur** (lecture, §6.4) | résolveur séance→date | Détecter les créneaux **orphelins** — `semaine > nb_semaines` (non produit par `mapperParcours`, `k = 1..nb`) ou bornes de tranche pointant des séances **disparues** après re-découpe (aucune FK ne contraint `livre_semaine_debut/fin` vers `scriptorium_documents.semaine`) — et les **remonter au diagnostic prof** au lieu de renvoyer une date `null` **silencieuse**. |

Justification : après réduction de `nb_semaines` ou re-découpe d'un livre, un créneau peut devenir hors étendue. Le résolveur **reste total** (renvoie `null`, ne plante pas), mais conformément à l'esprit LD5 « pas de précédence silencieuse », la **perte de datation doit être observable**. On recommande un signal d'authoring analogue au diff snapshot ③ lorsqu'un changement de `nb_semaines` ou une re-découpe rend des créneaux orphelins. Cette garde est **100 % applicative** — elle n'ajoute **aucun** objet de schéma.

## 6. Planification & dates — le point de rupture

On BRISE l'équation historique `date = date_debut + (séance − 1) × 7`. Le couplage « 1 séance = 1 semaine calendaire depuis `scriptorium_unites.date_debut` » disparaît. La date d'une séance est désormais déterminée PAR CLASSE (classe active de l'élève, cookie `eleve_classe`, `app/eleve/contexte-classe.ts`) et PAR RÉGIME, jamais dérivée arithmétiquement du livre.

Deux régimes, tranchés par séance :

- **Mode (a)** — livre assigné seul (`scriptorium_unite_classes`), aucun parcours actif ne le couvre : AUCUNE date, déblocage séquentiel pur (ordinal).
- **Mode (b)** — livre couvert par un créneau d'un parcours actif assigné à la classe : la date vient du parcours (snapshot ③ prioritaire, frise en repli), résolue séance → créneau → semaine de parcours → date.

### 6.1 Détermination du MODE (fonction pure, déterministe)

Le mode n'est pas un attribut du livre : c'est le résultat d'une requête `(livreId, classeId)`. Un même livre peut être en mode (a) pour une classe et mode (b) pour une autre.

```ts
modeLivre(livreId, classeId):
  n = COUNT(*) FROM scriptorium_parcours_creneaux c
      JOIN scriptorium_parcours p          ON p.id = c.parcours_id
      JOIN scriptorium_parcours_classes pc ON pc.parcours_id = p.id
      WHERE c.ref_type = 'livre' AND c.livre_id = livreId
        AND pc.classe_id = classeId
        AND pc.statut  = 'active'          -- assignation vivante
        AND p.supprime_at IS NULL          -- parcours non soft-delete
  return (n == 0) ? MODE_A : MODE_B
```

Un parcours **archivé** (`scriptorium_parcours_classes.statut <> 'active'`) ou **supprimé** (`scriptorium_parcours.supprime_at IS NOT NULL`) ne gouverne pas : le livre retombe en mode (a) s'il ne reste aucun parcours actif le couvrant. Aucune précédence silencieuse (LD5) : la coexistence mode (a) direct + mode (b) partiel est légitime ; le seul cas signalé est le double livre-entier (§8).

### 6.2 Devenir de CHACUN des 5 sites de dérivation de date

| # | Site (fichier:ligne) | Comportement actuel | Mode (a) | Mode (b) |
|---|---|---|---|---|
| 1 | `app/eleve/modules/aletheia/data.ts:28-36` `dateIndicative()`, consommé `:71` (liste planning) et `:117` (page séance) | dérive `date_debut+(s−1)×7` → `"JJ/MM/AAAA"` | `dateIndicative` **retirée du chemin élève** ; `SemaineLivre.dateIndicative` devient `date: string \| null` avec `date = null`. Aucune date affichée. Fallback libellé `Semaine ${s}` → `Séance ${s}` | Remplacé par `resoudreDateSeance(livreId, séance, classeId)` (§6.4). `classeId` déjà disponible via le contexte élève / `livresPourClasse`. Batch : résoudre toutes les séances d'un livre en une passe (§6.5) |
| 2 | `app/prof/scriptorium/vue-livre/utils.ts:139-162` `semaineParDefaut()` | choisit la séance « courante » via `date_debut+7j` | **Repli sur `premiere` = `Math.min` des ordinaux de séance** (exactement le comportement actuel quand `date_debut` est null). Prof-only, book-level, **aucun état DONE par élève dans ce contexte** — la logique « première non DONE » n'y est PAS implémentable et n'est pas requise (Q9) | Optionnel : ancrer sur la séance dont la date résolue est la plus proche d'aujourd'hui. Non bloquant ; défaut = même repli `premiere` |
| 3 | `utils/calendrier-evenements.ts:116-171` (racine `:118-122` filtre `.eq('type','livre').not('date_debut','is',null)` ; échéance `:150-154` `new Date(date_debut+'T00:00:00Z') + (s−1)·7 + 6` ; libellé `:166`) | échéances = dimanche, par classe, dérivées de `date_debut` | **Zéro échéance.** La génération Aletheia CESSE de dériver de `date_debut` ; un livre non gouverné ne produit aucun événement quel que soit son `date_debut` résiduel. Garde-fou existant conservé : pas d'événement pour `classe_id` null | Échéances dérivées du **snapshot** (via `resoudreDateSeance`), par classe. **Le filtre `.not('date_debut','is',null)` doit être contourné** : un livre mode (b) a typiquement `date_debut` null → il serait exclu à la source (F : angle mort). Re-sourcer depuis les créneaux-livre de parcours actifs assignés, résoudre chaque séance couverte, **n'appeler `new Date(...)` que sur une date non nulle**. Libellé `:166` « sem. N » → « séance N » |
| 4 | `app/prof/aletheia/eleve/[eleveId]/page.tsx:140` `dateIndicative(livre.date_debut, semaine)` | date au sous-titre de la fiche élève prof | Aucune date ; `[chapitres, date].filter(Boolean)` gère déjà l'absence. « Séance N » | Date résolue pour la **classe de l'élève consulté** (`resoudreDateSeance(livreId, séance, classeIdEleve)`) |
| 5 | `app/prof/scriptorium/vue-livre/EnteteLivre.tsx:35-36` `· début le ${formatDateFr(date_debut)}` | affiche `date_debut` en en-tête livre | Retirer « début le … » (le livre n'a plus de date propre) ; afficher « N séances » | Idem masquer ; la date vit dans le parcours, pas dans le livre. Option non bloquante : badge « planifié via parcours » (Q10) |

### 6.3 Convention de date — FAIT FONDATEUR (à ne pas se tromper)

Le snapshot `scriptorium_parcours_classes.horaire_snapshot` stocke un **LUNDI** : `ApercuSemaine.dateReelle` est commenté `// lundi YYYY-MM-DD` et `frise-serveur.ts:71` pose `dateReelle: c.dateDebutLundi`. La branche frise de repli, elle, dispose de `SemaineEnseignement.dateFinDimanche` (un **DIMANCHE**). Le calendrier existant est en dimanche (`utils/calendrier-evenements.ts:154` applique `+6`).

**Convention retenue = ÉCHÉANCE = DIMANCHE**, par continuité avec le calendrier et avec le sens produit (« pour dimanche soir »). Le résolveur est **seul responsable de la normalisation** et applique le décalage par branche :

- branche **snapshot** : `dateReelle` (lundi) → **`dateReelle + 6 jours`** (dimanche) ;
- branche **frise** : `dateFinDimanche` (déjà dimanche), inchangé.

Ainsi les deux sources d'une même séance renvoient **le même jour**. C'est une correction structurelle, pas « une ligne » : les deux branches sont décalées différemment. La page de séance ET le calendrier consomment la MÊME sortie du résolveur (source unique de vérité, §7). Bascule éventuelle vers « lundi/début » = Q4, mais la donnée snapshot déjà en base (lundi) impose de normaliser dans le résolveur quoi qu'il arrive.

**Deux vocabulaires de statut, à ne jamais confondre** (source de la régression la plus probable) :
- **snapshot persisté** (`ApercuSemaine.statut`, `frise-serveur.ts:18`) : `'definie' | 'a_definir' | 'non_planifiable'`. Une semaine résolue y vaut **`'definie'`**.
- **frise brute interne** (`CreneauMap` de `mapperParcours`, `frise-enseignement.ts`) : `'resolue' | 'a_definir' | 'non_planifiable'`. `frise-serveur.ts:70-72` RÉÉCRIT `'resolue'` → `'definie'` avant de sérialiser dans `horaire_snapshot`.

Le résolveur DOIT tester **`statut === 'definie'`** sur le snapshot et **`statut === 'resolue'`** sur la frise. Tester `'resolue'` sur le snapshot ne matcherait **jamais** → repli frise systématique → LD6 mort-né et dates non stables.

### 6.4 Le RÉSOLVEUR (mode b) — pseudo-code déterministe et total

Signature : `resoudreDateSeance(livreId, seance: SeanceOrdinal, classeId) → { date: string | null, source: 'snapshot' | 'frise' | 'aucune', ambigu: boolean }`.

**Règle de mapping verrouillée (LD4)** : une séance couverte par un créneau prend la **semaine de parcours du créneau** (`c.semaine`), **indépendamment de sa position dans la tranche**. Toutes les séances d'un même créneau partagent donc la même semaine de parcours, donc la même date. **Aucun offset intra-tranche** (`c.semaine + (seance − deb)`) — ce serait l'off-by-one précis que le SPEC élimine, et il serait indéfini pour `(null,null)`.

```ts
resoudreDateSeance(livreId, seance, classeId):

 0. # Étendue réelle du livre (pour la largeur des tranches ouvertes, étape 3).
    nbSeancesLivre = COALESCE(
        (SELECT nb_semaines FROM scriptorium_unites WHERE id = livreId),
        (SELECT MAX(semaine) FROM scriptorium_documents WHERE ... = livreId))

 1. # Créneaux-livre de parcours ACTIFS assignés à la classe, non archivés/supprimés,
    #  dont la TRANCHE couvre la séance (bornes incluses ; (null,null) = livre entier).
    creneaux = SELECT c.semaine AS semParcours, c.ordre, c.id AS creneau_id,
                      c.livre_semaine_debut AS deb, c.livre_semaine_fin AS fin,
                      pc.date_debut, pc.horaire_snapshot, pc.snapshot_genere_le,
                      p.id AS parcours_id, p.nb_semaines
               FROM scriptorium_parcours_creneaux c
               JOIN scriptorium_parcours p          ON p.id = c.parcours_id
                                                    AND p.supprime_at IS NULL
               JOIN scriptorium_parcours_classes pc ON pc.parcours_id = p.id
                                                    AND pc.classe_id = classeId
                                                    AND pc.statut = 'active'
               WHERE c.ref_type = 'livre' AND c.livre_id = livreId
                 AND (c.livre_semaine_debut IS NULL OR c.livre_semaine_debut <= seance)
                 AND (c.livre_semaine_fin   IS NULL OR c.livre_semaine_fin   >= seance)
    si creneaux vide:
       return { date: null, source: 'aucune', ambigu: false }   # séance non couverte → repli sans date

 2. # Résoudre chaque créneau en date réelle NORMALISÉE (dimanche).
    candidats = []
    creneauxOrphelins = []
    pour c dans creneaux:
       # Garde applicative : creneaux.semaine n'a qu'un CHECK >= 1 (parcours_phase_a.sql),
       #  pas de borne haute vs p.nb_semaines. Un créneau hors étendue est ORPHELIN.
       si c.semParcours > c.nb_semaines:
          creneauxOrphelins.push(c); continue      # remonté au diagnostic prof (§8), pas silencieux
       # Bornes de tranche hors [1..nbSeancesLivre] après re-découpe → aussi orphelin.
       si (c.deb != null && c.deb > nbSeancesLivre) || (c.fin != null && c.fin > nbSeancesLivre):
          creneauxOrphelins.push(c)                 # signalé mais on continue si la séance reste couverte

       r = dateSemaineParcours(c.horaire_snapshot, c.date_debut, c.semParcours, c.nb_semaines)
       si r.valeur != null:
          # Largeur = étendue RÉELLE de la tranche. (null,null) = livre entier = étendue MAX
          #  = le MOINS spécifique (perd le tie-break face à une tranche fine). NE PAS faire
          #  COALESCE(fin,seance)-COALESCE(deb,seance) qui donnerait 0 au livre entier (inversion).
          largeur = COALESCE(c.fin, nbSeancesLivre) - COALESCE(c.deb, 1)
          candidats.push({ date: r.valeur, source: r.source, largeur,
                           snapshot_genere_le: c.snapshot_genere_le,
                           parcours_id: c.parcours_id, semParcours: c.semParcours,
                           ordre: c.ordre, creneau_id: c.creneau_id })

    si candidats vide:
       # publié en 'a_definir' / 'non_planifiable', ou date_debut null, ou frise bloquante.
       return { date: null, source: 'aucune', ambigu: false, orphelins: creneauxOrphelins }

 3. # PRÉCÉDENCE si plusieurs créneaux/parcours couvrent la séance. ORDRE TOTAL déterministe.
    #  On NE trie PAS par source='snapshot' d'abord au niveau GLOBAL : cela ferait gagner un
    #  snapshot périmé d'un parcours A contre une frise à jour d'un parcours B (date obsolète
    #  silencieuse). Le choix snapshot-vs-frise est INTRA-parcours (résolu dans
    #  dateSemaineParcours, LD6 stabilité). L'arbitrage INTER-parcours suit :
    candidats.trier par (
       largeur ASC,                 # tranche la PLUS SPÉCIFIQUE gagne (intention prof la plus fine)
       date ASC,                    # échéance la plus précoce (déterministe, source-agnostique)
       snapshot_genere_le DESC NULLS LAST,   # à spécificité égale, publication la plus fraîche
       parcours_id ASC, semParcours ASC, ordre ASC, creneau_id ASC )   # tie-break stable ultime
    retenu = candidats[0]

    # 'ambigu' = DÉSACCORD DE DATE, pas simplement plus d'un candidat.
    #  Deux tranches redondantes résolvant à la MÊME date ne sont pas ambiguës (pas de fausse alerte).
    datesDistinctes = ENSEMBLE( candidats.map(x => x.date) )
    ambigu = datesDistinctes.taille > 1

    return { date: retenu.date, source: retenu.source, ambigu, orphelins: creneauxOrphelins }


dateSemaineParcours(snapshot, dateDebut, k, nbParcours):
  # k = semaine de PARCOURS (1..nbParcours). LD6 : snapshot publié prioritaire (stabilité intra-parcours).
  si snapshot != null:
     e = snapshot.find(x => x.semaine == k)
     si e != null:
        # STATUT SNAPSHOT = {definie|a_definir|non_planifiable}. Une semaine résolue = 'definie'.
        si e.statut == 'definie' && e.dateReelle:
           return { valeur: addDaysUTC(e.dateReelle, +6), source: 'snapshot' }  # LUNDI +6 → DIMANCHE
        sinon:
           return { valeur: null, source: 'snapshot' }   # a_definir/non_planifiable → pas de date
     # k absent du snapshot (nb_semaines changé / snapshot périmé) → repli frise défensif ci-dessous.

  # Repli : recalcul frise (fonctions pures existantes, utils/frise-enseignement.ts).
  si dateDebut == null:
     return { valeur: null, source: 'frise' }
  semestres = semestresActifsPourAY(anneeScolaireDe(dateDebut))  # archived_at null ; AY : août = nouvelle AY
  frise     = friseEnseignementContinue(semestres, holidays)
  { ancreIdx } = resoudreAncre(frise, dateDebut)
  si ancreIdx == null:
     return { valeur: null, source: 'frise' }   # frise bloquante (semestres chevauchants) → dégrade
  map = mapperParcours(frise, ancreIdx, nbParcours)
  m = map.find(x => x.k == k)
  # STATUT FRISE BRUTE = {resolue|a_definir|non_planifiable}. Une cellule résolue = 'resolue'.
  si m != null && m.statut == 'resolue':
     return { valeur: m.dateFinDimanche, source: 'frise' }   # déjà DIMANCHE, pas de +6
  return { valeur: null, source: 'frise' }
```

### 6.5 Propriétés & cas de bord

| Cas | Traitement | Garantie |
|---|---|---|
| **Déterminisme** | Ordre total explicite (étape 3), une branche source par parcours (`dateSemaineParcours`). Convention dimanche normalisée dans le résolveur | Mêmes entrées → même sortie, quel que soit qu'un snapshot existe ou non |
| **Séance non couverte** par aucun créneau | Étape 1 → `{ date:null, source:'aucune' }` | Repli sans date (comportement mode a pour cette séance), jamais de crash |
| **Chevauchement de tranches / multi-parcours** | Ordre total étape 3 : spécificité (largeur réelle) → date précoce → fraîcheur → ids | Côté lecture : date UNIQUE, jamais d'ambiguïté visible. `ambigu=true` si dates **distinctes** → remonté au diagnostic prof (§8) |
| **Livre entier `(null,null)` vs tranche fine `[3,4]`** | `largeur(livre entier) = nbSeancesLivre − 1` (max) > `largeur([3,4]) = 1` | La tranche fine gagne le tie-break, conforme à l'intention prof (pas d'inversion) |
| **Snapshot présent, semaine `'definie'`** | Branche snapshot, `dateReelle + 6` | Date STABLE tant que le prof n'a pas re-publié (LD6 honoré, `statut === 'definie'`) |
| **Snapshot présent, semaine `'a_definir'`/`'non_planifiable'`** | `null` sur la branche snapshot (pas de repli frise) | Le prof a publié une planif incomplète : pas de date fantôme |
| **Snapshot absent** (jamais publié) | Repli frise (`friseEnseignementContinue` + `mapperParcours`) | Dégradation propre |
| **`date_debut` du parcours null / frise bloquante** (semestres chevauchants, `ancreIdx` null) | `null` | Aucun crash, aucune date inventée |
| **Parcours archivé (`statut<>'active'`) / supprimé (`supprime_at`)** | Exclu à l'étape 1 (jointures) | N'entre jamais dans les candidats |
| **Créneau hors étendue** (`semParcours > nb_semaines` après réduction ; bornes hors `[1..nbSeancesLivre]` après re-découpe) | Collecté dans `orphelins`, remonté au diagnostic prof | Perte de datation **observable**, pas silencieuse (esprit « pas de précédence silencieuse ») |
| **Stale-snapshot vs frise-fraîche entre 2 parcours** | `source='snapshot'` n'est PAS un critère global ; arbitrage par spécificité puis date puis fraîcheur | Pas de date périmée imposée en aveugle. Cas pathologique whole-book × 2 : recommandé **interdit à l'authoring** (garde-fou §8, Q2) |
| **Batchabilité** (recommandation d'implémentation, pas de contrat) | Charger créneaux + assignations + snapshots UNE fois par `(livre, classe)`, mémoïser la frise par AY, résoudre toutes les séances en mémoire | Éviter N requêtes dans le chemin élève (liste + page séance). La branche frise ajoute des lectures runtime `semestres`/`holidays` : privilégier le snapshot (une fois `'definie'` testé correctement) |

## 7. Impact vue élève & machine à états

### 7.1 Machine à états : INCHANGÉE (démonstration)

`DRAFT → V1_SUBMITTED → FEEDBACK1_READY → VF_SUBMITTED → FEEDBACK2_READY → DONE` (par séance) ; capstone `PENDING/READY/ERROR` (débloqué quand toutes les séances sont `DONE`) ; référence `PENDING/READY/ERROR`. Tout est clé sur l'ordinal `aletheia_travaux.semaine_index` (renommé « séance » à l'écran, JAMAIS en base — cf. LD1) :

| Fonction (fichier) | Nature | Impact renommage |
|---|---|---|
| `estSemaineDebloquee(semaines, doneSet, semaine, sequentiel)` (`app/eleve/modules/aletheia/data.ts:142`) | tri ordinal + index précédent | Aucun (pur ordinal) |
| `peutAccederSemaine` (`data.ts:151`) | garde d'accès sur `doneSet` | Aucun |
| `toutesSemainesDone` (`data.ts:177`) | condition capstone = tous les ordinaux `DONE` | Aucun |
| `travauxParSemaine` (`data.ts:189`) | `Map` indexée par `semaine_index` | Aucun |
| Anti-spoiler `.lt/.eq/.gt('semaine', s)` (`utils/aletheia-retours.ts`) | filtres ordinaux amont/courant/aval | Aucun |

**Renommer « semaine » → « séance » à l'écran ne modifie AUCUNE transition, AUCUNE garde, AUCUNE re-clé.** C'est un pur habillage : aucune écriture, aucun `ALTER`, aucun backfill (cf. §9.1).

### 7.2 Libellés élève — inventaire de renommage

⚠️ Cet inventaire est INDICATIF, pas exhaustif : le **filet de sécurité normatif** est le test de garde (Lot 2, cf. §11) qui échoue si une occurrence « Semaine N » subsiste sur une surface élève. Ne PAS traiter la liste ci-dessous comme le périmètre fermé.

| Surface (fichier) | Avant | Après |
|---|---|---|
| Fallback titre (`data.ts:69`, `data.ts:115`) | `Semaine ${s}` | `Séance ${s}` (UI-only ; le `## Semaine …` interne IA reste, cf. §10) |
| Liste planning (`data.ts:71`) | « Semaine N — titre » + date | « Séance N — titre » ; date selon mode (§7.3) |
| Page d'une séance (`data.ts:117`, route `[semaine]`) | « Semaine N » + date | « Séance N » ; date selon mode |
| **Page module** (`app/eleve/modules/aletheia/page.tsx`) : chip séance courante (« Semaine N t'attend »), compteur (« {nb} semaines », « semaines terminées »), héros capstone (« les {total} semaines sont terminées ») | « semaine(s) » | « séance(s) » |
| **Stepper** (`etapes.ts` / composants `Steppers.tsx`) | « semaine » | « séance » |
| Sceaux / héros capstone | « semaine » | « séance » |

### 7.3 Affichage des dates par mode

| Situation | Affichage |
|---|---|
| **Mode (a)** (livre assigné en direct, sans parcours) ou séance non couverte par un créneau | « Séance 3 — Le Banquet » — **aucune date, aucune échéance, aucun compte à rebours**. Progression = ordre séquentiel, pas temporel. |
| **Mode (b)**, séance couverte, date résolue (§6) | « Séance 3 — Le Banquet · échéance dim. 21/09 » |
| **Mode (b)**, séance couverte mais date non résolue (snapshot `a_definir`, `date_debut` null) | Sans date, comme mode (a) ; option « à planifier » (point ouvert §12) |

**Interdit absolu** : l'UI ne doit JAMAIS afficher une date dérivée de `scriptorium_unites.date_debut + (s-1)×7` — c'est précisément le couplage que la refonte brise (cf. §6, les 5 sites). Toute date affichée provient du résolveur mode (b) (source unique, §7.5).

### 7.4 Route élève — NON renommée

`/eleve/modules/aletheia/[livreId]/[semaine]` : le segment `[semaine]` reste un ordinal de séance. **On NE renomme PAS le segment** (éviter de casser liens/bookmarks élève et un refactor de routing dans un Next.js à breaking changes — hors périmètre). On documente le segment comme « ordinal de séance » (commentaire) et on lit le param via un helper typé.

Terminologie TS (cf. §3, LD1) : alias `type SeanceOrdinal = number` **avec un unique constructeur au bord DB→TS** (`asSeance(n: number): SeanceOrdinal`) qui est le SEUL point de cast autorisé — pas de `as SeanceOrdinal` disséminé (un cast dispersé viderait la garantie de son sens). Le libellé AFFICHÉ dit « Séance N ». (Renommer en `[seance]` = possible mais coûteux et non requis → recommandation NON, §12.)

### 7.5 Calendrier élève — source unique de vérité

- **Mode (a)** : aucune entrée Aletheia (cf. §6, site 3 ; un livre sans `date_debut` ne génère déjà aucun événement).
- **Mode (b)** : entrées « Aletheia — [livre] (séance N) » à l'échéance résolue de la séance.

**Impératif de cohérence** : la date affichée sur la page de séance (`data.ts`) ET l'échéance au calendrier (`utils/calendrier-evenements.ts`) DOIVENT sortir du MÊME résolveur (`resoudreDateSeance`, §6) — une seule fonction, une seule convention de jour (dimanche/échéance, cf. §6.3). Interdiction de recalculer la date à deux endroits avec deux conventions (le risque avéré snapshot=lundi vs frise=dimanche est neutralisé DANS le résolveur, pas ici). Garde-fou existant préservé : aucun événement avec `classe_id:null`. L'élargissement de la source des livres du calendrier en mode (b) est traité en §9.3.

### 7.6 Vue prof (fiche élève, vue-livre)

| Surface (fichier) | Impact |
|---|---|
| Fiche élève (`app/prof/aletheia/eleve/[eleveId]/page.tsx:140`) | Graphe/steppers inchangés (ordinaux). Sous-titre : date résolue pour la classe de l'élève (résolveur §6), ou rien. Libellé « Séance N ». `dateIndicative(date_debut, semaine)` retiré. |
| `vue-livre` — `semaineParDefaut` (`app/prof/scriptorium/vue-livre/utils.ts:139-162`) | **PROF-only, book-level, SANS état `DONE` par élève.** Le repli mode (a) est **« première séance »** (`Math.min` des ordinaux — comportement déjà en place quand `date_debut` est null), et NON « première non DONE » (cette notion n'existe pas dans ce scope prof et n'est pas implémentable sans y introduire un `doneSet` élève absent). La logique « première non DONE » reste réservée aux surfaces élève (`data.ts`) qui disposent du `doneSet`. |
| En-tête livre (`app/prof/scriptorium/vue-livre/EnteteLivre.tsx:36`) | Retirer « · début le {date_debut} » (cf. §9.3 — changement observable, réversible). |

## 8. Exposition & précédence (mode b)

### 8.1 Exposition = UNION des chemins (LD5, supersession explicite de la décision 9 Parcours)

L'accès Aletheia d'un élève de classe C à un livre L :

```
exposition(C) =
    { L | L ∈ scriptorium_unite_classes(C) }                                # chemin DIRECT (mode a)
  ⋃ { L couvert par un créneau ref_type='livre' d'un parcours ACTIF assigné à C }  # chemin PARCOURS (mode b)
     parcours : scriptorium_parcours_classes.statut='active'
                ET scriptorium_parcours.supprime_at IS NULL
```

L'élève lit le livre **UNE seule fois** : l'union porte sur l'EXPOSITION (droit de lire + datation), PAS sur les données de travail (`aletheia_travaux` reste indexé par séance, une seule ligne par (élève, livre, `semaine_index`), contrainte UNIQUE intacte — cf. §9.1).

**Impact code (à étendre)** :

| Fonction (fichier) | Lecture actuelle | Extension |
|---|---|---|
| `livresPourClasse` (`app/eleve/modules/aletheia/data.ts:41`) | `scriptorium_unite_classes` seul | UNIONNER le chemin parcours, dédupliqué par `livre_id` |
| `livreAccessible` (`data.ts:89`) | `scriptorium_unite_classes` seul | idem, additif — ne retire aucun accès existant |
| Source calendrier (`utils/calendrier-evenements.ts:117-122`) | `scriptorium_unite_classes` + `.not(date_debut,is,null)` | cf. §9.3 (élargissement mode b) |

Additif strict. La garde applicative reste IDENTIQUE sur le nouveau chemin : lecture via client admin, JAMAIS d'exposition de `texte_extrait`/`fichier_ref`, filtre `supprime_at is null`.

> **Point de vigilance rétroactif (renvoi §9.4)** : le chemin parcours existe DÉJÀ en base (créneaux `ref_type='livre'`, assignations `scriptorium_parcours_classes` — builder L4/L5 mergés prod). Sous la décision 9 en vigueur, un prof a pu placer un livre dans un parcours en présumant « aucun accès Aletheia ». Activer l'union SANS audit ouvrirait rétroactivement l'accès à ces livres — voir garde-fou §9.4.

### 8.2 Étendue exposée par le chemin parcours (arbitrage verrouillé)

Le chemin parcours ouvre le livre **EN ENTIER** (toutes les séances lisibles, déblocage séquentiel), même si le créneau ne couvre qu'une tranche `[3,4]`. Seule la DATATION est par séance (§6). Justification : Aletheia est book-level séquentiel (capstone = toutes séances `DONE`, §7.1) ; restreindre la visibilité à la tranche casserait `estSemaineDebloquee`/`toutesSemainesDone` et le capstone. Le chemin direct ouvre lui aussi le livre entier. (Restriction à la tranche = point ouvert §12, probablement HORS périmètre.)

### 8.3 Datation en coexistence (deux dimensions indépendantes)

Exposition (union) et datation (parcours) sont ORTHOGONALES :

- séance couverte par un créneau → date snapshot/frise (résolveur §6) ;
- séance non couverte, ou accessible seulement en direct → pas de date (mode a).

Un parcours PARTIEL (tranche) coexistant avec une assignation directe est un **ENRICHISSEMENT, pas un conflit** : le direct expose le livre entier sans date, le parcours DATE en plus les séances de sa tranche. → **Aucun avertissement** dans ce cas.

### 8.4 Le SEUL conflit signalé : whole-book × 2 (garde-fou LD5, non silencieux)

Conflit ⟺ un livre est exposé **EN TOTALITÉ** à la MÊME classe par les DEUX chemins :

- direct : `scriptorium_unite_classes(L, C)` présent ;
- parcours : couverture INTÉGRALE — un créneau `(null,null)` OU un ensemble de créneaux dont l'union des tranches = `[1..N]` — dans un parcours actif assigné à C.

```
conflitWholeBook(C):
  direct  = { L | scriptorium_unite_classes(C) }
  entiers = { L | couverture parcours totale [1..nbSéances(L)]
                  via un parcours actif assigné à C }
  return direct ∩ entiers        # non vide ⇒ AVERTIR + JOURNALISER + choix guidé
```

**AVERTIR le prof + JOURNALISER (jamais de précédence ni d'exposition silencieuse) + CHOIX GUIDÉ** (écran d'AUTHORING, déclenché à l'assignation OU dans un panneau de contrôle) :

- Message : « Ce livre est assigné en entier des deux façons pour cette classe. »
- **Option 1 — Garder l'assignation DIRECTE** (recommandé si le parcours n'ajoute RIEN d'autre que le livre → LD4 « si rien à ajouter, pas besoin de parcours ») → retirer le créneau-livre entier ou désassigner le parcours.
- **Option 2 — Passer par le PARCOURS** (recommandé s'il ajoute des ressources) → retirer l'assignation directe `scriptorium_unite_classes`.

Tant que le prof n'a pas tranché, l'union reste cohérente (une lecture, dates du snapshot) : l'avertissement empêche le cas confus « double livre entier » de persister à l'insu du prof. La coexistence PARTIELLE (tranche stricte) NE déclenche PAS l'avertissement (§8.3).

**Journalisation (repli du finding « exposition UNION rétroactive non auditée »)** : toute activation d'un chemin d'exposition qui n'existait pas avant (assigner un parcours contenant un livre déjà exposé en direct, OU exposer en direct un livre déjà couvert par un parcours assigné) doit être TRACÉE (événement horodaté : classe, livre, chemin ajouté, prof) et présentée au prof — jamais exposée en silence. L'inventaire de bascule prod correspondant est en §9.4.

### 8.5 Interaction avec le résolveur

Le résolveur (§6) reste correct dans tous ces cas : couverture parcours → il date ; sinon `null`. Le drapeau `ambigu` (§6.4 — défini sur le nombre de dates DISTINCTES résolues, PAS sur le simple nombre de candidats) alimente le diagnostic prof en cas de vraie divergence d'échéance. L'union d'exposition ne change PAS la datation, seulement la VISIBILITÉ. Les parcours archivés/inactifs sont exclus par le MÊME filtre (`statut='active'` + `supprime_at is null`) côté exposition ET côté résolveur — une seule règle, pas de dérive.

## 9. Migration & sûreté prod

### 9.1 Invariant de sûreté — données élève intangibles

`aletheia_travaux` porte le travail élève RÉEL en prod. **Aucune écriture destructive, aucun `RENAME`, aucun backfill, aucun `UPDATE`/`DELETE`/`ALTER COLUMN`** sur `aletheia_travaux`, `aletheia_diagnostic`, `aletheia_livre_reference`, `quazian_flashcards`, `scriptorium_documents`. `semaine_index` conserve nom, type, valeurs, contrainte UNIQUE. La refonte se décompose en : (a) renommage UI/TS (§7) ; (b) NOUVEAU code de lecture (résolveur §6 + union §8) ; (c) `COMMENT ON COLUMN` additifs OPTIONNELS. Le déblocage séquentiel et la machine à états (§7.1) ne sont pas touchés. Zéro risque de corruption.

### 9.2 Non-destructif / additif / réversible

- Seul SQL éventuel = `COMMENT ON COLUMN` (ancrage terminologique sur les colonnes héritées `semaine`/`semaine_index` et sur les bornes de tranche `scriptorium_parcours_creneaux.livre_semaine_debut/fin` — qui portent « semaine » mais sont des `SeanceOrdinal`). Idempotent, réversible (`COMMENT … IS NULL`), OMISSIBLE. **Zéro SQL obligatoire.** Les colonnes snapshot (`horaire_snapshot`, `snapshot_version`, `snapshot_genere_le`) sont déjà en prod (chantier ③).
- **Aucune matérialisation** (table de liaison séance→date, cache de dates) : risque de désynchronisation ; le snapshot est déjà le SEUL cache légitime des dates.
- `scriptorium_unites.date_debut` : CONSERVÉ en base (LD2), simplement plus lu pour l'affichage. Réversibilité totale : rebrancher les 5 sites sur `date_debut` restaure l'ancien comportement par simple revert de code, aucun SQL.
- Tout le nouveau comportement est une COUCHE DE LECTURE → un revert de code annule la refonte sans toucher aux données.

### 9.3 Rétro-compat des livres existants à `date_debut` — CHANGEMENT DE COMPORTEMENT À ACTER

En prod, des livres sont assignés en direct avec un `date_debut` non null. Aujourd'hui ils : (1) affichent une date par séance (`data.ts:28-36/71/117`) ; (2) génèrent des échéances calendrier (`calendrier-evenements.ts:148-171`) ; (3) affichent « début le … » (`EnteteLivre.tsx:36`) ; (4) sélectionnent la séance par défaut par date (`vue-livre/utils.ts:139-162`). Après bascule, en mode (a), **ces 4 comportements DISPARAISSENT** : plus de date par séance, plus d'échéance, plus de « début le … », séance par défaut = première séance (§7.6). Élèves et profs verront ce changement.

**Rétro-compatible mais OBSERVABLE ; aucune donnée perdue** (les `date_debut` restent en base). Chemins de transition offerts au prof (aucune perte de capacité) :

- Restaurer des dates = créer/assigner un parcours (mode b) contenant le livre (entier ou tranche) avec une `date_debut` → dates via snapshot/frise (plus riche que `+7j` : respecte vacances/semestres inter-semestres).
- Ne rien faire = lecture sans date, déblocage séquentiel (comportement voulu « lecture décorrélée du calendrier »).

À COMMUNIQUER au PO (RUNBOOK). Soupape transitoire possible (flag global « afficher les dates héritées », défaut OFF conforme LD2) = point ouvert §12.

**Élargissement de la source des livres du calendrier en mode (b) (repli du finding site 3 / §6.2)** : la requête racine du calendrier (`utils/calendrier-evenements.ts:118-122`) sélectionne aujourd'hui `.eq('type','livre').not('date_debut','is',null)` puis boucle livre→classes→`date_debut`. Or un livre piloté par un parcours peut ne PAS avoir de `date_debut` propre (c'est le but) → il serait EXCLU à la source, et mode (b) générerait ZÉRO échéance. Correctif imposé :

| Point | Traitement mode (b) |
|---|---|
| Sourcing | Partir aussi des créneaux `ref_type='livre'` de parcours actifs assignés (mêmes filtres que le résolveur §6/§8.1), pas uniquement de `scriptorium_unites.date_debut`. |
| Datation | Résoudre chaque séance couverte via `resoudreDateSeance` (source unique §7.5), convention échéance = dimanche. |
| Garde null | N'appeler `new Date(livre.date_debut + 'T00:00:00Z')` (`calendrier-evenements.ts:150`) QUE sur une date non nulle — sinon crash sur `date_debut` null. |
| Filtre direct résiduel | `.not('date_debut','is',null)` ne s'applique qu'au chemin DIRECT (qui, en mode a, ne génère plus rien). |

Test de non-régression : livre SANS `date_debut` propre + parcours assigné → échéances PRÉSENTES au calendrier.

### 9.4 Ordre de bascule (prof-only d'abord, additif, chaque étape testable et réversible)

| Lot | Contenu | Réversibilité |
|---|---|---|
| **0 — terminologie (invisible)** | Alias/constructeur TS `SeanceOrdinal`/`asSeance`, `COMMENT ON COLUMN` (facultatif), commentaires d'ancrage. Aucun effet runtime. | Revert de code ; `COMMENT … IS NULL` |
| **1 — libellés prof** | « Séance N » dans Scriptorium `vue-livre`, fiche élève prof, `EnteteLivre` (retirer « début le … »). Cosmétique. | Revert de code |
| **2 — libellés élève + mode a** | « Séance N » côté élève ; neutraliser les 5 sites (dates muettes, zéro événement calendrier). **Étape au CHANGEMENT DE COMPORTEMENT (§9.3)** — preview AVANT partage élève, après validation PO. | Revert de code (aucun SQL) |
| **3/4 — résolveur mode b** | Module pur `resoudreDateSeance()` (branche snapshot `statut==='definie'` + branche frise, convention dimanche unique) + branchement page/liste + calendrier snapshot (§9.3). Additif : sans parcours, comportement = Lot 2. | Revert de code |
| **5/6 — union d'exposition + garde-fou whole-book** | Additif, ne retire aucun accès. Précédé de l'**AUDIT rétroactif obligatoire** (ci-dessous). | Revert de code |

**AUDIT prod obligatoire AVANT activation du Lot 5/6 (repli du finding « exposition UNION rétroactive non auditée »)** : inventorier tous les créneaux `ref_type='livre'` appartenant à un parcours actif (`supprime_at is null`) assigné à ≥1 classe (`statut='active'`), les présenter au prof pour confirmation explicite (ou activation par flag/par parcours). Ces créneaux, créés sous la décision 9 (« référencer ≠ exposer »), ouvriraient sinon rétroactivement l'accès Aletheia SANS action prof — exposition silencieuse non voulue. Documenter comme changement observable au même titre que la perte de dates (§9.3), dans le RUNBOOK.

**Arbitrage retenu : A avant B** (couper les dates héritées — Lot 2 — avant de brancher les dates parcours — Lot 3/4) pour une sémantique NETTE : jamais deux sources de dates simultanées, réversibilité maximale, au prix d'une fenêtre transitoire « sans date » pour les livres non encore migrés vers un parcours. À confirmer PO (§12).

**Rollback (par lot, du plus récent au plus ancien)** : chaque lot se défait par revert de code isolé, dans l'ordre inverse, sans toucher aux données. Rollback Lot 5/6 → l'exposition redevient `scriptorium_unite_classes` seul (aucun accès élève perdu au-delà des livres nouvellement unionnés). Rollback Lot 3/4 → dates muettes (= état Lot 2). Rollback Lot 2 → rebrancher les 5 sites sur `date_debut` restaure intégralement l'ancien comportement. Rollback Lot 0/1 → cosmétique. Aucune étape de rollback n'exige de SQL ni ne met `aletheia_travaux` en risque.

### 9.5 Non-régression à vérifier (checklist prod-safe)

- Aucune requête d'écriture nouvelle sur les tables élève ; contrainte UNIQUE `aletheia_travaux` non violée (clé `semaine_index` inchangée).
- Un élève au milieu d'un livre garde tous ses `aletheia_travaux` et statuts ; capstone débloqué exactement quand toutes les séances sont `DONE`.
- Anti-spoiler : filtres `.lt/.eq/.gt('semaine', …)` restent ordinaux → aucune fuite introduite.
- Union d'exposition : lectures toujours via client admin + garde `texte_extrait`/`fichier_ref` ; parcours archivés/supprimés exclus (même filtre `statut='active'` + `supprime_at is null` que le résolveur).
- **Résolveur snapshot** : test de garde chargeant un snapshot RÉEL publié et vérifiant que la branche snapshot résout une date (garde contre la régression silencieuse `statut==='resolue'` qui ferait retomber en frise — le contrat `ApercuSemaine` stocke `'definie'`).
- **Convention de date unique** : page de séance et échéance calendrier renvoient le MÊME jour (dimanche) pour une même (classe, séance) — snapshot (lundi +6) et frise (`dateFinDimanche`) réconciliés dans le résolveur.
- Calendrier mode (b) : livre sans `date_debut` propre + parcours assigné → échéances présentes ; `new Date(...)` jamais appelé sur null.
- Lecture snapshot TOLÉRANTE si colonnes absentes/vides → dégrade vers frise, jamais de crash.
- `git diff utils/aletheia-retours.ts` VIDE (ou commentaires seuls) à la fin de la refonte ; aucune régénération IA déclenchée (cf. §10).

## 10. Contrat IA — preuve que le renommage n'atteint jamais le modèle ni le parse (LD7)

Le renommage est **strictement UI-only**. Frontière non négociable : *si une chaîne peut finir dans un prompt, dans un parse jsonb, ou dans un override prof, elle garde « semaine »* ; seul ce que l'élève ou le prof **voit rendu à l'écran** devient « séance ». Garde-fou de recette : `git diff utils/aletheia-retours.ts` doit être **vide** (hors commentaire d'en-tête facultatif). Ce fichier n'est pas modifié par la refonte.

### 10.1 Plomberie de prompt (invisible élève) — GELÉE
Les chaînes littérales `## Semaine ${…}` / `Semaine ${…}` injectées dans le contexte IA ne sont **jamais rendues à l'élève** (`scriptorium_documents.texte_extrait` n'est jamais servi côté élève ; cf. §7). Elles structurent le contexte envoyé au modèle, calibré avec le mot « Semaine ». Les renommer dégraderait la génération sans aucun gain UI. Sites à ne PAS toucher dans `utils/aletheia-retours.ts` :

| Fonction / constante | Rôle | Effet si renommé |
|---|---|---|
| `assemblerAncrageLivre`, `assemblerAmontVf`, `assemblerTitresAval`, `assemblerStructureSemaines` | En-têtes `## Semaine N — titre` du contexte amont/aval/structure | Contexte IA dégradé (calibré « Semaine ») |
| `assemblerSynthesesPrecedentes`, `assemblerArchitecturesPrecedentes` | Rappel des sections précédentes | idem |
| `PROMPT_FEEDBACK_V1_DEFAUT`, `PROMPT_FEEDBACK_VF_DEFAUT`, `PROMPT_CAPSTONE_DEFAUT`, `PROMPT_REFERENCE_DEFAUT`, prompts diag | Prompts par défaut (utilisés quand `aletheia_params.prompt_*` est vide) | Décalibrage vs prompts calibrés (cf. mémoire QA) |

→ **Zéro-touch.**

### 10.2 Clé JSON `semaine` du contrat de RÉFÉRENCE — GELÉE
`PROMPT_REFERENCE_DEFAUT` impose au modèle un schéma `"chapitres":[{"semaine":1,…}]`, et `parseReference` LIT cette clé (`Number(c.semaine)`, rejet si non entier). Renommer la clé casserait à la fois le parse et l'**invalidation des références déjà stockées en prod** (`aletheia_livre_reference`, jsonb). → **Clé conservée à l'identique.** L'UI qui affiche une fiche de référence lit `chapitre.semaine` et l'AFFICHE sous forme « Séance N » : c'est un **mapping de libellé à la présentation**, jamais un renommage de champ.

### 10.3 Placeholders des overrides prof — GELÉS
`injecter()` remplace les `{token}` connus et **laisse tel quel** tout token inconnu (perte SILENCIEUSE de contexte si renommé). Placeholders à figer, tous référençables depuis les overrides prof :

`{texte_semaine}`, `{texte_unite}`, `{semaine_courante_texte}`, `{semaine_courante_N}`, `{total_semaines}`, `{structure_semaines}`, `{amont_structure}`, `{aval_titres}`, `{livre_entier}`, `{these_eleve}`, `{arguments_eleve}`, `{accord_eleve}`, `{questions_eleve}`, `{vocabulaire_eleve}`, `{syntheses_precedentes}`, `{trajectoire_diagnostic}`, `{these_vf}`, `{arguments_vf}`, `{accord_vf}`, `{architectures_precedentes}`, `{these_initiale}`, `{arguments_initiale}`, `{accord_initial}`.

**Cas sensible** : le garde anti-spoiler de format VF teste `!includes('{livre_entier}') && includes('{semaine_courante_texte}')`. Renommer ces deux tokens **casserait le garde** (le VF perdrait sa protection amont/aval). → **Gelés.**

### 10.4 Overrides prof `aletheia_params.prompt_*` — INTACTS
Colonnes `prompt_feedback_1`, `prompt_feedback_2`, `prompt_capstone`, `prompt_reference`, `prompt_diag_inventaire`, `prompt_diag_niveau` : chaînes prof libres, contenant « semaine » et les placeholders ci-dessus. **Aucune migration de ces chaînes.** Un prof ayant personnalisé garde son texte mot pour mot. L'éditeur de prompt peut ajouter une aide contextuelle (« `{semaine_courante_N}` = numéro de la séance courante ») **sans changer le token**.

### 10.5 Fonctions d'ancrage — noms internes conservés
`assemblerAncrageSemaine(livreId, semaine)`, `assemblerAncrageLivre(livreId)`, `assemblerAncrageVf()` gardent le paramètre `semaine` (ordinal). Les filtres anti-spoiler `.lt/.eq/.gt('semaine', s)` sur `scriptorium_documents` restent **purement ordinaux** et ne cassent pas en « séance ». On PEUT ajouter un commentaire `/* semaine = SeanceOrdinal (ordinal de découpe, jamais une date) */` sans renommer.

### 10.6 Garde-fous de non-régression (recette Lot 0 → chaque lot)
- **Test statique** : aucun libellé exposé élève ne contient `Semaine <ordinal>` (grep sur les surfaces UI listées §7.2, cf. §12 inventaire).
- **Test de diff** : `git diff utils/aletheia-retours.ts` vide (hors commentaire).
- **Test de contrat** : un `parseReference` sur une référence prod existante retourne les mêmes objets (clé `semaine` lue).
- **Cache préservé** : préfixe byte-identique et sentinelle de césure (`messagesAvecCache`) inchangés — le renommage UI n'altère pas la clé de cache.

---

## 11. Découpage en lots livrables (ordonnés, testables, prof-only d'abord, additifs)

Chaque lot est autonome, additif, réversible ; **aucun** ne modifie `utils/aletheia-retours.ts` (hors commentaire). Ordre recommandé : **0 → 1 → 2 → 3 → 4 → 5**. Chaque lot est déployable en **preview** avant tout partage élève.

### Lot 0 — Contrat de terminologie (fondation, invisible)
- Créer `utils/aletheia-seance.ts` : alias `type SeanceOrdinal = number` **non branded**, plus un constructeur unique de bord DB→TS `asSeance(n: number): SeanceOrdinal` = **seul point de conversion** (évite le semis de `as SeanceOrdinal` non vérifiés ; un brand nu ne compile pas sans cast et vide sa propre garantie — cf. §12).
- Typer les signatures **ordinales** existantes : `estSemaineDebloquee`, `peutAccederSemaine`, `semaineLivre`, `travauxParSemaine`, et la signature du futur résolveur.
- `COMMENT ON COLUMN` **facultatifs** (Q5) sur les colonnes héritées : `aletheia_travaux.semaine_index`, `scriptorium_documents.semaine`, `aletheia_diagnostic.semaine_index`, `quazian_flashcards.semaine`, **plus** les bornes de tranche Parcours `scriptorium_parcours_creneaux.livre_semaine_debut/livre_semaine_fin` (qui portent « semaine » mais sont des `SeanceOrdinal`). Additif, non destructif, rejouable.
- Documenter la convention + **interdiction** d'introduire un nouveau champ nommé `semaine` pour un ordinal.
- **Testable** : compile TS, DDL rejouable, **zéro** changement de comportement. Risque nul, réversible.

### Lot 1 — Renommage UI PROF-ONLY

| Site | Fichier | Changement |
|---|---|---|
| 5 | `app/prof/scriptorium/vue-livre/EnteteLivre.tsx:36` | Retirer « · début le … » → « N séances » (mode a) / indicateur de mode (Q6) |
| — | `app/prof/scriptorium/vue-livre/*` | Libellés « Séance N » |
| 4 | `app/prof/aletheia/eleve/[eleveId]/page.tsx:140` | Neutraliser `dateIndicative` en mode (a) ; libellé « Séance N » |

- Prof-only, cosmétique, réversible. **Testable** en preview prof.

### Lot 2 — Renommage UI ÉLÈVE + mode (a) sans date

| Site | Fichier | Changement |
|---|---|---|
| 1 | `app/eleve/modules/aletheia/data.ts:28-36,71,117` | Neutraliser `dateIndicative` (retour `null`) ; libellés « Séance N » + fallbacks titre |
| — | `app/eleve/modules/aletheia/page.tsx` | **Inventaire complet** (cf. §12) : chips « Séance courante », compteur « N séances », « séances terminées », héros capstone « les N séances sont terminées » |
| — | `app/eleve/modules/aletheia/etapes.ts` (stepper) | Libellés d'étapes s'ils mentionnent « semaine » |
| 2 | `app/prof/scriptorium/vue-livre/utils.ts:139-162` | `semaineParDefaut` repli `date_debut` null = **première séance** (comportement déjà en place ; PAS « première non DONE », inexistant à ce scope — cf. §12) |
| 3 | `utils/calendrier-evenements.ts:148-171` | Un livre non gouverné = **zéro** événement (cesser de dériver de `date_debut`) |

- **Bascule à effet utilisateur fort** (perte visible de dates prod, R1) : preview d'abord, **validation PO**. Travaux/statuts intacts. Ne PAS fusionner avec Lot 1 : séparer le cosmétique de la coupe des dates permet de valider visuellement avant de casser l'affichage.

### Lot 3 — Résolveur mode (b) (lecture pure, puis branché)
- Module pur `resoudreDateSeance()` / `dateSemaineParcours()` + détection de mode, **réutilisant frise + snapshot** (aucune écriture, aucun nouveau schéma).
- **Tests de garde impératifs** (infra `npm test`) :
  - **Snapshot résout bien** : charger un snapshot réel publié et vérifier que la branche snapshot renvoie une date — sinon la régression `statut === 'definie'` vs `'resolue'` (cf. §12, R-STATUT) repasse silencieusement en repli frise et **annule LD6**.
  - **Convention de date unique** : snapshot (lundi) et frise (dimanche) renvoient le **même jour** après normalisation (cf. §12, R5/Q4).
  - Cas : séance non couverte, chevauchement de tranches, snapshot absent, `date_debut` null, parcours archivé, **multi-parcours**, créneau hors étendue (`semaine > nb_semaines`), tranche pointant une séance disparue après re-découpe.
- Branchement ensuite sur sites 1/3/4 via **source unique** (page de séance + fiche prof + calendrier).
- **Perf** : mémoïser la frise par AY et le résolveur par (livre, classe) (la branche frise ajoute des lectures `semesters`+`holidays` au chemin élève — cf. §12, R8).

### Lot 4 — Exposition UNION (supersède décision 9 Parcours)
- Étendre `livresPourClasse` / `livreAccessible` / `utils/calendrier-evenements.ts` à l'union **direct ⋃ parcours**, dédupliquée, avec **les mêmes gardes** : RLS/client admin, `texte_extrait` jamais servi, filtres `supprime_at is null` et parcours `statut='active'`.
- **Étape d'audit prod OBLIGATOIRE avant activation** (cf. §12, R-EXPO) : lister tous les créneaux `ref_type='livre'` d'un parcours actif assigné à ≥1 classe. Sous la décision 9 en vigueur, ces créneaux préexistants (builder L4/L5 déjà en prod) **ouvriraient rétroactivement l'accès Aletheia sans action prof**. Les présenter pour confirmation explicite, ou activer par flag/parcours. À consigner au RUNBOOK.
- Prof-only à l'authoring ; accès élève **additif** (on n'enlève jamais un accès). **Testable** : élève d'une classe assignée à un parcours contenant un livre y accède sans assignation directe ; garde `texte_extrait` vérifiée.

### Lot 5 — Garde-fou whole-book (authoring prof)
- Détection `conflitWholeBook` (livre assigné EN TOTALITÉ à la fois en direct et via parcours, même classe) + écran d'avertissement + **choix guidé** (garder le direct si rien à ajouter ; passer par le parcours s'il ajoute des ressources).
- Prof-only. **Testable** : direct + parcours entier même classe → avertissement ; tranche partielle → pas d'avertissement (coexistence autorisée, LD5).

**Note d'enchaînement** : le cas courant « direct + parcours » fonctionne dès **Lot 3** (l'exposition directe existe déjà) ; le cas « parcours seul » nécessite **Lot 4**.

---

## 12. Risques & points ouverts (+ questions PO)

### Risques

- **R1 — Perte visible de dates (LD2, ACTÉ).** Les livres prod à `date_debut` cessent d'afficher dates ET échéances calendrier en mode (a). Rétro-compatible mais **observable**. Mitigation : communication PO + transition par parcours + réversibilité (`date_debut` conservé en base).
- **R-STATUT — `definie` vs `resolue` (BLOQUANT à corriger au résolveur, Lot 3).** Le snapshot persisté (`scriptorium_parcours_classes.horaire_snapshot`, type `ApercuSemaine[]`, `frise-serveur.ts:18/71`) utilise `statut ∈ {definie, a_definir, non_planifiable}` ; `'resolue'` n'existe QUE dans le `CreneauMap` interne de `frise-enseignement.ts`. Le résolveur DOIT tester `statut === 'definie'` sur le snapshot (et `'resolue'` uniquement sur la frise brute). À défaut, la branche snapshot ne matche jamais → repli frise systématique → **LD6 mort-né** (dates recalculées à chaque rendu, non stables). Test de garde Lot 3 obligatoire.
- **R5 — Convention de date snapshot vs frise (AVÉRÉ, pas seulement suspecté).** `horaire_snapshot[].dateReelle` = **LUNDI** (`frise-serveur.ts:17` « lundi YYYY-MM-DD », `dateReelle = dateDebutLundi`) ; la branche frise renvoie `dateFinDimanche` (dimanche) ; le calendrier existant est en dimanche (`calendrier-evenements.ts:154`, `+6`). Les deux branches divergent de **6 jours** pour la même séance. Le résolveur DOIT normaliser sur une convention unique (recommandé : dimanche → snapshot `+6`, frise `dateFinDimanche`). La donnée snapshot **déjà en base (lundi)** force la main. Lié à Q4.
- **R-EXPO — Exposition rétroactive à l'activation Lot 4.** Des créneaux `ref_type='livre'` posés sous la décision 9 (« référencer ≠ accès ») ouvriraient l'accès Aletheia **sans action prof** le jour du déploiement. Mitigation : audit prod préalable (Lot 4), consigné au RUNBOOK, au même rang que R1.
- **R2 — Renommage trop zélé atteignant l'IA.** Un find/replace global casserait prompts/parse/placeholders/overrides (§10). Mitigation : frontière nette, Lot 1/2 séparés, `git diff utils/aletheia-retours.ts` vide non négociable.
- **R3 — Union d'exposition (Lot 4) et fuites.** Risque si la garde `texte_extrait`/client admin n'est pas répliquée sur le nouveau chemin, ou si un parcours archivé/inactif n'est pas exclu. Mitigation : mêmes filtres que le résolveur, tests de garde.
- **R4 — Précédence multi-parcours.** L'ordre total (snapshot d'abord → `snapshot_genere_le` DESC → tranche la plus spécifique → date la plus précoce → tie-break `parcours_id`/`ordre`/`creneau_id`) est une heuristique déterministe ; `ambigu` remonté au prof **sur nombre de dates DISTINCTES** (pas nombre de candidats, pour éviter les fausses alertes sur tranches redondantes cohérentes). Attention : « snapshot d'abord » entre DEUX parcours peut faire primer un snapshot périmé sur une frise à jour — à trancher Q2.
- **R6 — Snapshot périmé vs frise.** Si `nb_semaines` change ou si le prof ne re-publie pas, l'élève voit des dates figées « décalées ». Comportement **voulu** (stabilité LD6), à assumer + signal prof ③ (« N échéances décalées »).
- **R7 — Créneaux orphelins silencieux.** `scriptorium_parcours_creneaux.semaine` n'a qu'un CHECK `>= 1` (`parcours_phase_a.sql`), sans borne haute vs `nb_semaines` ; les bornes de tranche n'ont aucune FK vers les séances. Un créneau hors étendue (nb réduit) ou une borne pointant une séance disparue (re-découpe) → date `null` **muette**. Le résolveur reste total (null, pas de crash) mais la perte doit être **observable** : remonter ces orphelins au diagnostic prof + garde-fou d'authoring analogue au diff snapshot ③.
- **R8 — Perf du résolveur.** « Zéro nouveau schéma », mais la branche frise ajoute des lectures runtime (`semesters`+`holidays` par AY) au chemin élève (liste + page). Mitigation : mémoïsation par AY / par (livre, classe), privilégier le snapshot une fois R-STATUT corrigé ; budget de requêtes au critère de non-régression.
- **R9 — Cohérence des deux surfaces de date** (page de séance vs calendrier) : source unique impérative (le résolveur). Risque de divergence si un site oublie de l'appeler.
- **R10 — Dérive de vocabulaire future** si le contrat de terminologie n'est pas tenu (nouveau `semaine` ordinal réintroduit). Mitigation : constructeur `asSeance` unique + revue + test de garde.

### Inventaire de renommage (finding « inventaire incomplet » — à recenser AVANT Lot 2)
Le périmètre « Semaine N » côté élève **ne se limite pas à `data.ts`**. Recenser exhaustivement (l'énumération des 5 sites cible les **dates**, pas tous les **libellés**) :

| Surface | Fichier | Libellés concernés |
|---|---|---|
| Liste / page séance | `app/eleve/modules/aletheia/data.ts` | titres « Séance N », date indicative |
| Dashboard module | `app/eleve/modules/aletheia/page.tsx` | « Semaine {courante} t'attend », « {nb} semaines », « séances terminées », héros capstone « les {total} semaines sont terminées » |
| Stepper | `app/eleve/modules/aletheia/etapes.ts` | libellés d'étapes mentionnant « semaine » |
| Fiche référence | UI lisant `chapitre.semaine` | afficher « Séance N » (mapping libellé, cf. §10.2) |

Le test de garde §10.6 sert de **filet** ; il ne dispense PAS de l'inventaire (sinon Lot 2 laisse des « Semaine N » non renommés).

### Questions résiduelles pour le PO

- **Q1 — Route `[semaine]`.** Renommer le segment en `[seance]` ? *Recommandation : NON* (coût routing Next.js breaking + bookmarks). Afficher « Séance N », garder le param technique.
- **Q2 — Précédence parcours × parcours partiel.** LD5 n'a tranché que le whole-book direct × parcours. Deux parcours actifs couvrant la même séance : ordre total déterministe + drapeau `ambigu` prof (recommandé, non bloquant), ou **interdire** ce chevauchement à l'authoring ? À trancher **avant** d'implémenter le résolveur (impacte l'arbitrage snapshot périmé, R4).
- **Q3 — Séance hors tranche en mode (b).** « Lisible sans date + déblocage séquentiel » (recommandé, préserve capstone = toutes séances DONE) ou masquée ? Confirmer que le livre reste exposé **en entier**.
- **Q4 — Convention de date affichée (b).** Dimanche (échéance, recommandé, cohérent existant) ou lundi (début) ? Lié à R5 — la donnée snapshot existante est en **lundi**, à normaliser.
- **Q5 — `COMMENT ON COLUMN`** (colonnes héritées + bornes de tranche Parcours) : les jouer (recommandé, coût nul) ou s'en tenir aux conventions TS ?
- **Q6 — En-tête livre (site 5).** Retirer « début le … », ou afficher un indicateur de mode (« assigné en direct — sans date » / « planifié via N parcours ») ?
- **Q7 — Ordre de bascule A vs B.** Couper les dates héritées AVANT (recommandé, sémantique nette, jamais deux sources simultanées) ou APRÈS le branchement parcours (réduit la fenêtre « sans date ») ?
- **Q8 — Soupape transitoire.** Flag global « afficher les dates héritées » le temps de migrer ? *Recommandation : NON*, défaut OFF, conforme LD2.
- **Q9 — `semaineParDefaut` prof (site 2) en mode (b).** Repli « première séance » (recommandé, book-level sans état DONE) ou séance à date résolue la plus proche ? *(Corrige la formulation « première non DONE », inexistante à ce scope prof-only.)*
- **Q10 — Snapshot non résolu (`a_definir`/`non_planifiable`) & badge mode (a).** Côté élève : « à planifier » ou masquer silencieusement (recommandé : masquer + mention prof-only) ? Un badge « livre sans dates » (mode a) est-il utile pour lever l'ambiguïté élève, ou le silence suffit-il ?
- **Q11 — Audit Lot 4.** Confirmation explicite par le prof des créneaux-livre préexistants (R-EXPO), ou activation par flag par parcours ?

# PROMPT — Session Code ⚙️ : C4 · Lot L1 — Schéma & gates du moteur d'exercices

> **À coller dans une session Claude Code FRAÎCHE** (règle R4 du plan : une session = un lot).
>
> **Manifeste de fichiers faisant foi — à lire en démarrant, rien de plus** (règle de manifeste,
> SPEC C3 §9) :
>
> | Fichier | Ce qu'on y lit | Statut requis |
> |---|---|---|
> | `SPEC_C3_exercices_competences.md` | **le Tableau de bord du socle** (section B : ce qui n'est PAS décidé), **§6 (le schéma)**, §0 (définitions de télémétrie), §1.7 (statuts de recette), §9 (le lot) | **v4.2 — socle de construction (gel du 29/07, amendements A1 à A8)** ✔ |
> | `SUIVI_SQL.md` | le protocole R6 et le journal | à jour ✔ |
> | `c1_rls_eleve.sql` | le patron RLS élève (SELECT own strict / FERMÉ) | exécuté sandbox ✔ |
> | `AGENTS.md` | conventions repo | ✔ |
>
> Si l'un de ces fichiers n'est pas au statut requis, **arrête-toi et signale-le** — ne devine pas.
> **Contrôle de version, mécanique** : ce prompt est écrit contre la **v4.2**. Si la spec porte une
> version supérieure, **arrête-toi** et lis son **journal des amendements** — un amendement touchant
> le §6 invalide une partie de ce prompt.

---

## Mission

Poser **tout le schéma du moteur d'exercices et de compétences** (SPEC C3 §6), **derrière trois
gates OFF**, avec les RLS et les gardes serveur. Rien d'autre : **aucun écran, aucun appel IA,
aucune logique de routage**. Ta réussite = des migrations additives propres, jouées en sandbox,
journalisées ligne par ligne, et un seed lisible.

Toutes les tables sont **neuves** : les migrations sont **additives et gatées**, donc **protocole
SQL normal** (pas le protocole renforcé — elles ne peuvent rien casser d'existant). Deux exceptions
qui touchent de l'existant et demandent de la prudence : la **FK inverse** sur
`scriptorium_exercices_planifies` et le **champ d'aménagement au profil élève**.

## Livrables

- Un ou plusieurs fichiers `.sql` à la racine, préfixés `c4_l1_` (découpe libre, mais **une zone
  cohérente par fichier** et un ordre d'exécution explicite en tête).
- **Une ligne par fichier dans le journal de `SUIVI_SQL.md`**, créée **AVANT** exécution.
- Un **seed lisible** des types (voir §4 ci-dessous).
- Un bloc de vérification en pied de chaque fichier (comptage des colonnes/tables créées).

---

## 1. Les tables (SPEC C3 §6 fait foi — ce qui suit en rappelle les pièges)

Crée, dans l'ordre des dépendances :

`exercices_types` · `exercices_references` · `exercices` · `exercices_depots` · `exercices_jobs` ·
`exercices_squelettes` · `exercices_metacognition` · `exercices_retours` · `competences_mesures` ·
`competences_niveaux` · **`monitoring_mesures`** · **`monitoring_niveaux`** ·
`competences_actives_par_classe` · `assiduite_hebdo` · `routeur_decisions`.

**Les quatorze pièges à ne pas manquer** — ce sont des décisions d'arbitrage du 29/07 et ses
amendements A1 à A8, pas des détails :

1. **`exercices_depots` se crée à l'ASSIGNATION**, pas au dépôt. Son `statut` est énuméré :
   `assigne` → `ouvert` → `v1_remis` → `retour_publie` → `vf_remis` → `clos`, plus `abandonne`.
   Pour une passation en classe, la séquence s'arrête à `retour_publie` (pas de vf).
2. **Index unique `(depot_id, competence, version)` sur `exercices_squelettes`.** C'est le garde-fou
   d'idempotence : sans lui, un retry après expiration écrit une seconde mesure pour la même copie,
   et la règle de montée « 2 sur 3 » fait monter une lettre sans que l'élève ait rien fait.
3. **`competences_niveaux` n'a PAS de `classe_id` dans sa clé.** Le profil est **unifié par élève ×
   compétence** (décision actée du 17/07, confirmée par A1, règle R6 du routeur).
4. **`competences_mesures.classe_id` est NULLABLE, et NULL est le cas MAJORITAIRE (A3).** Il
   remplace l'ancien `provenance` (`tc`|`hlp`). Le parcours TC/HLP n'est **pas observable sur le
   travail fait à la maison** : un élève bi-classe y reçoit un flux unique, servi par un routeur
   unique sur un profil unique. Le parcours n'est établi que pour les **passations en classe** et
   la **lecture du livre** ; partout ailleurs il vaut `indetermine`. Ne mets donc **pas** de
   contrainte NOT NULL, et ne traite pas le NULL comme une anomalie de collecte.
5. **DIX compétences, pas onze — et la famille est une COLONNE, pas un préfixe (A1).** Les deux
   Problématisations ont fusionné en une seule compétence, le **Questionnement**, qui appartient aux
   **deux** familles. Il n'y a donc **pas** d'identifiants `ecriture.problematisation` /
   `lecture.problematisation` : **un identifiant par compétence, dix en tout**, plus une colonne
   **`famille`** (`ecriture`|`lecture`) sur `competences_mesures`. Écriture : Expression,
   Argumentation, Structure, Connaissance, Synthèse. Lecture : Restitution, Reconstruction,
   Évaluation, Mouvement. Et le Questionnement, des deux.
6. **`competences_actives_par_classe` a une clé à TROIS colonnes (A1)** : **(classe, compétence,
   famille)**. C'est elle qui porte le cas du Questionnement — **inactif en écriture pour HLP,
   actif en lecture**. Une clé à deux colonnes rendrait ce cas inexprimable.
7. **Le Monitoring a ses TABLES PROPRES (A8) : `monitoring_mesures` et `monitoring_niveaux`.** Il
   n'apparaît **ni** dans `competences_mesures` **ni** dans `competences_niveaux` — son état n'est
   pas une lettre. Voir §1bis ci-dessous.
8. **`exercices.mode` = `formatif_maison` | `diagnostique_classe`**, et rien d'autre : c'est un
   **contexte**. La valeur `lecture` n'existe pas — la **famille se lit sur le type**.
9. **`lettre_equivalente` ne vit PAS sur `exercices_squelettes`** (fausse précision) ; elle vit sur
   `competences_mesures`.
10. **`lu_at` vit sur `exercices_retours`, une seule fois** — pas aussi sur le dépôt.
11. **`exercices_references`** : contrainte d'**unicité** + **empreinte immuable** (un hash du
   contenu). Un texte ne se décompose jamais deux fois ; une référence validée ne se modifie plus en
   silence.
12. **`delta_v1_vf` est nullable et NULL n'est pas 0.** Documente-le en commentaire de colonne : une
   passation en classe n'a pas de vf, et lire son NULL comme un zéro fabriquerait un faux signal
   d'intégrité.
13. **Deux champs de durée** sur `exercices_types` : `duree_cycle_min` (**NOT NULL**, la seule
    décomptée du budget) et `duree_redaction_min` (**nullable**, types à rédaction suivie seulement).
    L'ancien `duree_attendue_min` n'existe pas.
14. **Deux champs de délai** sur `competences_mesures` : `delai_jours` et `delai_mesures`.

**Énumérations à figer** : `grain` (`micro`|`meso`|`macro`) · `regime_cycle`
(`plein`|`optionnel`|`paires`) · `mode_saisie` (`manuscrit`|`ecran`|`mixte`) · `contexte`
(`maison`|`classe`|`diagnostic`|`essai_fragments`) · `statut_recette`
(`evaluee`|`mesuree_silencieusement`|`differee`) · `calibration`
(`bien_calibre`|`surconfiant`|`sous_confiant`|`indetermine`) · `conditions_declarees`
(`temps_mis`|`au_plus_vite`|`pas_pu`) · `duree_taguee` (`normale`|`interrompue`|`suspecte`) ·
`origine` (`routeur`|`prof`) · `distance_contexte` (`meme_type`|`meme_famille`|`transfert`) ·
**`sous_dimension`** (`lucidite_incompris`|`calibration_confiance`) · **`direction`**
(`surconfiance`|`sous_confiance`).

**Champs de versionnage de l'instrument** : `prompt_version` et `modele` sur les squelettes (par
phase), `instrument_version` sur les mesures. Sans eux, on ne pourra jamais séparer « l'élève a
progressé » de « le prompt a changé ».

## 1bis. Les deux tables du Monitoring (A8 — lis le §6 de la spec, il fait foi)

Le Monitoring est une compétence de **second ordre** : jamais notée, jamais cible du routeur, deux
sous-dimensions qui **ne se moyennent pas**, et un état qui **n'est pas une lettre**. D'où deux
tables à part — c'est une décision de Louis du 29/07, pas une commodité.

- **`monitoring_mesures`** : `eleve_id` · `sous_dimension` · **`amplitude_ecart`** (0 calibré → 3
  massif) · **`direction`** (**NULL quand l'amplitude vaut 0** — pose la contrainte) · `observables`
  JSONB · `contexte` · `famille` · **`classe_id` nullable** · `depot_id?` ·
  **`competences_couvertes[]`** · `delai_jours` · `delai_mesures` · `prompt_version` · `modele` ·
  `instrument_version` · `created_at`.
- **`monitoring_niveaux`** : `eleve_id` · `sous_dimension` · `amplitude_courante` ·
  `direction_courante` · `n` · `statut_recette` · `profil_provisoire` · `updated_at`.

**Trois choses à ne pas rater :**

1. **`competences_couvertes[]` n'est pas décoratif.** La calibration ne compte que sur les
   compétences dont le banc a passé la recette (§1.7) : sans cette colonne, aucune mesure de
   Monitoring ne sera relisible plus tard.
2. **Les quatre champs de télémétrie vont dans `exercices_metacognition`**, et doivent exister **dès
   la première migration** : confiance déclarée à la remise de la v1, jugement de l'élève item par
   item, réponse du squelette sur ces mêmes items, niveau réellement obtenu. Aucun banc ne peut
   valider le Monitoring avant la rentrée — c'est l'année 2026-27 qui en tient lieu, et **une année
   de collecte manquante ne se rattrape pas**.
3. **Aucune ligne du Monitoring dans `competences_mesures` ni `competences_niveaux`.** Si tu te
   surprends à y ajouter une colonne pour lui, tu es en train de défaire A8.

## 2. Les deux touches à de l'existant

- **FK inverse** `scriptorium_exercices_planifies` → `exercices` (la boucle plan → module).
  Additive, nullable, `on delete set null`.
- **Champ d'aménagement au profil élève** : `mode_saisie_force` (`ecran` | NULL), posé par le prof.
  **JAMAIS de diagnostic médical** — pas de colonne « dysgraphie », pas de motif, pas de texte
  libre. C'est une exigence de conformité (SPEC C3 §11), pas une préférence.

## 3. Gates et RLS

- **Trois gates**, patron `rag_actif`, même emplacement : **`exercices_actif`**,
  **`routeur_actif`**, **`competences_affichage_actif`**. **Tous OFF.** Vérifie-le explicitement dans
  le bloc de contrôle.
- **RLS** — patron `c1_rls_eleve.sql` : élève = **SELECT own strict**, toutes les écritures passent
  par le serveur.
- **Deux tables FERMÉES à l'élève** (patron `aletheia_travaux`) : **`exercices_squelettes`** et
  **`exercices_metacognition`** ne doivent **JAMAIS** être lisibles par l'élève, avant comme après
  publication. Ce qu'il voit, c'est le **retour publié**, jamais le squelette ni le verdict.
- `exercices_retours` : lisible par l'élève **seulement si `published_at` est non nul**.
- `assiduite_hebdo` : l'élève voit sa propre ligne ; le prof voit sa classe.
- **`monitoring_mesures` et `monitoring_niveaux`** : mêmes règles que leurs équivalents compétences —
  écritures serveur, lecture élève strictement `own`, et **rien avant l'allumage**.

## 4. Seed

- **Types d'écriture 1-14** (`02-exercices.md` §3 est la source, mais **tu ne l'ouvres pas** : les
  codes, grains, gestes, compétences et régimes de cycle te sont fournis dans la spec §6 et dans le
  seed que tu écris à partir d'elle ; si une valeur te manque, **laisse la ligne incomplète et
  signale-la**, ne l'invente pas).
- **Types diagnostiques** : trois lignes — essai, dissertation, explication de texte. Codes à ta
  convenance, cohérents avec la convention `t*` / `l*`.
- **`competences_actives_par_classe`** : le seed doit rendre vrai le cas du **Questionnement** —
  **inactif en écriture pour HLP, actif en lecture** ; actif dans les deux familles pour TC. Attention
  au piège : « HLP n'a pas le Questionnement » est **faux**, il l'a par la lecture. Les neuf autres
  compétences sont actives dans leur famille propre, pour les deux parcours.
- Le seed doit se relire en trente secondes : un fichier, une ligne par type, commentaires courts.

## Interdits (périmètre verrouillé)

- **Aucun écran, aucune route, aucun appel IA, aucune logique de routage.** Ce lot est du schéma.
- **Aucune modification** des tables, policies ou flux existants au-delà des deux touches du §2.
- **Ne rejoue jamais** un fichier de la section « Archive » de `SUIVI_SQL.md`.
- N'ouvre pas `01-routeur.md`, `02-exercices.md` ni les fichiers de `palimpseste-conception/` : ils
  ne sont pas au manifeste de ce lot.
- Si une décision te manque — un type de colonne discutable, une énumération incomplète, un choix de
  découpe — **note-la et laisse-la ouverte** (règle R7 : les décisions se prennent hors session).

## Fait quand

- [ ] Les migrations sont **jouées en sandbox**, leurs blocs de vérification passent.
- [ ] **`SUIVI_SQL.md` est à jour, une ligne par fichier**, avec date sandbox cochée.
- [ ] Les **trois gates existent et sont OFF** — vérifié par requête, pas supposé.
- [ ] L'**index unique `(depot_id, competence, version)`** existe — vérifié par requête.
- [ ] `competences_niveaux` **n'a pas** de `classe_id` ; `competences_mesures` **en a un, nullable**.
- [ ] **`competences_actives_par_classe` a bien une clé à trois colonnes** — vérifié par requête.
- [ ] **`monitoring_mesures` et `monitoring_niveaux` existent**, et **aucune colonne de Monitoring
      n'a été ajoutée** à `competences_mesures` ni à `competences_niveaux`.
- [ ] **Les quatre champs de télémétrie du Monitoring existent** sur `exercices_metacognition`.
- [ ] **Aucun identifiant de compétence préfixé `ecriture.` / `lecture.`** — dix identifiants, la
      famille en colonne.
- [ ] Le seed des types est lisible et `competences_actives_par_classe` porte le cas du
      Questionnement (inactif en écriture pour HLP, actif en lecture).
- [ ] Aucune policy existante n'a été modifiée (dump `pg_policies` avant/après en pied de fichier).

## Fin de session

Commit : `feat(codex): C4 L1 — schéma du moteur d'exercices et compétences (tables, tables Monitoring,
RLS, 3 gates OFF, seed des types)`.

Termine par la note de journal habituelle et une **liste sèche pour le PO** : décisions laissées
ouvertes, valeurs de seed manquantes, écarts avec la spec §6 s'il y en a et pourquoi.

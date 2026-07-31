# PROMPT DE SESSION — C2 · L9 : prompt du tuteur de Discussion visible et éditable par sections

> À coller tel quel dans une session Claude Code (modèle standard ⚙️). Un seul lot. Lire d'abord
> `PLAN_CHANTIERS_RENTREE.md` (section C2, ajout L9 du 25-26/07) et `AGENTS.md`. Règle R6 : toute
> migration = un fichier `.sql` à la racine + une ligne dans `SUIVI_SQL.md` AVANT exécution.

## Contexte

Le tuteur de l'onglet « Discussion » de Scriptorium (le chat RAG élève) tourne avec un prompt système
défini dans le code. Le professeur veut pouvoir **le lire et en retravailler certaines parties**
(notamment les relances — les questions systématiques en fin de message — le ton et la longueur des
réponses) **sans toucher au code**, depuis Scriptorium → Paramètres. Patron à suivre : celui des
prompts de Fragments (`fragments_config` + tuiles dans l'onglet Paramètres, cf. `SPEC_Lot5_Fragments.md`
§5.6) — valeur en base éditable, **défaut dans le code**.

**Contrainte de sécurité pédagogique (non négociable)** : le prompt du tuteur contient des règles
anti-spoiler (ne pas révéler l'aval d'un livre, etc.) validées par le banc de calibration L8. Ces
sections ne doivent PAS être éditables.

## À faire

1. **Localiser** le prompt système du tuteur Discussion dans le code (zone RAG Scriptorium — probable
   `utils/` ; attention : au moins un fichier du répertoire contient des octets NUL et échappe à grep
   sans `-a`, cf. `IDEES_post_rentree.md`).
2. **Le découper en sections nommées**, en séparant strictement :
   - Sections **éditables** : `ton` (persona, registre), `relances` (la politique de questions de fin
     de message), `longueur` (format des réponses). Si le prompt actuel mêle tout, réorganiser en
     conservant le comportement à l'identique (diff de comportement = zéro sur les fixtures L8).
   - Sections **verrouillées** (restent dans le code, jamais en base) : anti-spoiler, périmètre des
     contenus accessibles, règles de citation des sources, tout ce que le banc L8 teste.
3. **Migration SQL** (fichier à la racine + ligne `SUIVI_SQL.md`, sandbox d'abord) : une table ou des
   colonnes de config (patron `fragments_config`) portant les sections éditables, `NULL` = défaut du
   code. Migration additive, rien de cassant.
4. **Assemblage à l'exécution** : prompt final = sections verrouillées (code) + sections éditables
   (base si définies, sinon défaut code). Aucun chemin ne permet à une section éditée d'écraser une
   section verrouillée.
5. **UI** : dans Scriptorium → Paramètres, une tuile « Prompt du tuteur » (patron des tuiles Fragments
   5.6) : affichage du prompt complet assemblé (lecture seule pour les sections verrouillées,
   clairement marquées), édition par section pour les trois éditables, bouton « rétablir le défaut »
   par section. Après tout enregistrement : bandeau persistant « Sections modifiées le {date} —
   recommandé : rejouer le banc de calibration L8 ».
6. **Jetons UI** : réutiliser `globals.css` (aucun hex en dur), sobriété — c'est un écran prof.

## Fait quand

- Le prof voit le prompt complet, édite ton/relances/longueur, rétablit un défaut par section.
- Les sections anti-spoiler sont visibles mais non éditables, et l'assemblage runtime les prend
  toujours du code.
- Comportement inchangé tant que rien n'est édité (les fixtures L8 passent à l'identique).
- Migration jouée en sandbox et consignée dans `SUIVI_SQL.md`.

## Coupe (si la session déborde)

Livrer « prompt visible en lecture seule » (affichage complet + sections marquées), édition différée —
consigner le reste dans `IDEES_post_rentree.md`.

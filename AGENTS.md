<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Règles projet — Palimpseste (rentrée 2026)

- **Chantiers** : `PLAN_DE_CHANTIER.md` porte l'**ordre des lots** et leurs dépendances ;
  `07-Implementation.md` §2 *(dépôt `palimpseste-conception`)* porte **ce que chaque lot
  construit**, son manifeste et son « fait quand ». Ne travailler que sur le lot demandé par le
  prompt de session. Toute idée ou
  découverte hors périmètre → une ligne dans `IDEES_post_rentree.md`, pas dans le code.
- **SQL — règle absolue** : avant d'écrire ou modifier une migration, lire `SUIVI_SQL.md`.
  Toute nouvelle migration = un fichier `.sql` à la racine **+ une ligne ajoutée au journal** de
  `SUIVI_SQL.md` (date, fichier, zone, cases Sandbox/Prod). Ne **jamais** rejouer un fichier de la
  section « Archive » (dangers documentés dedans). Exécution : sandbox d'abord, prod ensuite.
- **Gates** : toute fonctionnalité nouvelle naît derrière un flag OFF (patron `rag_actif` /
  `plan_evaluation_actif`).
- **UI** : réutiliser les jetons de `globals.css` (couleurs et polices par module), jamais de hex en
  dur. Un module = 2-3 onglets.
- **Handoff de design — l'éprouver AVANT de le suivre.** Un dossier `design_handoff_*` est une
  proposition, pas un fait : il a été dessiné sans la base sous les yeux, et il peut trancher juste
  sur une prémisse fausse. Donc, dans cet ordre :
  1. **Avant d'écrire une ligne de code, mesurer dans la base la longueur et le nombre réels de
     chaque champ que la maquette affiche, et donner les chiffres.** Un nombre, pas « j'ai vérifié
     que c'était cohérent ».
  2. **Si la maquette suppose une donnée qui n'existe pas, c'est la maquette qui a tort** :
     s'arrêter et le dire, avec les mesures.
  3. Une fois implémenté, **montrer le rendu avec ces données réelles, sur les trois tailles
     d'écran** — pas « ça compile », pas « les tests passent ».

  ⚠️ « En cas de doute, arrête-toi » ne suffit pas : une décision **prise, et fausse** ne déclenche
  aucun doute. Ne s'arrêter que si la réponse **change la structure de l'écran** ; sinon trancher,
  appliquer, et lister ses arbitrages à la fin.

  *Payé le 2026-08-30 sur `design_handoff_ma_semaine_eleve` : la maquette montrait un titre
  d'exercice de 31 caractères, la base en porte **129 en médiane** — le « titre » est la première
  ligne de la consigne. L'implémentation fidèle était juste et l'écran illisible. `tsc` et 1970
  tests étaient verts pendant que la page débordait de l'écran sur téléphone.*

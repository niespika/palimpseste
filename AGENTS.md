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

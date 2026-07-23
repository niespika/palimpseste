# Git worktree — aide-mémoire (Palimpseste)

## Le principe en une phrase
**Un dossier de travail = une seule branche (un seul HEAD).** Toutes les sessions
ouvertes sur le *même* dossier partagent cette branche. Pour travailler en
**parallèle sur des branches différentes**, il faut **un dossier par branche** →
c'est ce que fait `git worktree` (dossiers séparés, **même dépôt/historique/remote**).

- Séquentiel (une chose à la fois) → **1 dossier**, tu switches proprement entre sessions.
- Parallèle (plusieurs branches en même temps) → **1 worktree par branche**.

---

## Commandes

```bash
# Créer un worktree SUR UNE NOUVELLE BRANCHE, basée sur main (le cas normal ici)
git worktree add -b feat/ma-feature /Users/louissagnieres/Documents/GitHub/palimpseste-ma-feature main

# Créer un worktree sur une branche EXISTANTE
git worktree add /Users/louissagnieres/Documents/GitHub/palimpseste-x feat/branche-existante

# Lister les worktrees (dossier → commit [branche])
git worktree list

# Supprimer un worktree quand la feature est mergée
git worktree remove /Users/louissagnieres/Documents/GitHub/palimpseste-ma-feature

# Nettoyer les références de worktrees supprimés à la main
git worktree prune
```

Règle : on **ne peut pas** avoir la *même* branche checkoutée dans deux worktrees.
D'où l'astuce `-b` : on crée une branche dédiée par worktree, et `main` reste libre.

---

## Flux type « session feature en parallèle »
1. `git worktree add -b feat/xyz .../palimpseste-xyz main`
2. Préparer le dossier (voir Gotchas : node_modules + fichiers non suivis).
3. Ouvrir une session Claude avec `palimpseste-xyz` comme racine.
4. Coder → committer dans le worktree (même remote).
5. Merger dans `main` (depuis un worktree où `main` est libre, **ou** via une PR GitHub).
6. `git worktree remove .../palimpseste-xyz`.

---

## ⚠️ Gotchas spécifiques à ce repo

- **`node_modules` n'est PAS dans un worktree frais** (gitignoré). Avant `tsc`/`eslint`/`dev` :
  ```bash
  # rapide (mêmes deps que le dossier principal — cas normal des feature branches) :
  ln -s /Users/louissagnieres/Documents/GitHub/palimpseste/node_modules <worktree>/node_modules
  # OU, si la branche change les dépendances :
  cd <worktree> && npm install
  ```
- **Les fichiers NON SUIVIS ne voyagent pas** (SPEC_*.md, `design_handoff_*`, `.claude/`,
  `PATCH-*`, `RUNBOOK`…). Un worktree frais ne les a pas → **les copier** si besoin :
  ```bash
  cp SPEC_xxx.md <worktree>/
  ```
- **La mémoire Claude est PAR DOSSIER** (`~/.claude/projects/<chemin-encodé>/memory/`).
  Un worktree = un autre chemin = **un autre espace mémoire** : la session dans le
  worktree n'a PAS la mémoire projet accumulée. → écrire un **prompt de handoff
  auto-suffisant**. La mémoire du dossier principal reste intacte.
- **`push` = déploiement Vercel.** `main` = **Production** ; les autres branches =
  Preview (selon config). Ne pousse `main` que pour du testé.
- **Dossier partagé par N sessions :** éviter de `git checkout <autre-branche>` dans
  le dossier principal quand d'autres sessions y tournent (ça change leur HEAD à
  toutes). Préférer un worktree pour la branche parallèle.

---

## Alternative : l'isolation intégrée de l'app
L'app crée déjà des worktrees toute seule pour certaines tâches
(`.claude/worktrees/…`). Regarde si tes sessions/agents ont une option
« isolation / worktree » — ça automatise l'`add`/`remove` sans gérer les chemins à la main.

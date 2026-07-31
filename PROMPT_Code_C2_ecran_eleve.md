# PROMPT — Session Code ⚙️ : C2.2 — Écran élève Scriptorium (implémentation du handoff)

> **À coller dans une session Claude Code FRAÎCHE** (règle R4 : une session = un lot).
> Modèle standard.
>
> **Contexte à lire en démarrant, dans cet ordre, rien de plus :**
> 1. `PLAN_CHANTIERS_RENTREE.md` §C2 ;
> 2. `design_handoff_scriptorium_eleve/README.md` puis `HANDOFF_scriptorium_eleve.md` —
>    **c'est la spec de ce lot**, elle est complète : chantiers 1→4, rappels charte,
>    inventaire maquette→composants, checklist d'acceptation ;
> 3. les fichiers listés dans sa section « Architecture concernée » (`page.tsx`,
>    `ChatScriptorium.tsx`, `SousNavModule.tsx`, `EnTeteSite.tsx`, `configModules.ts`).
>
> La maquette `Scriptorium Élève - Rendu charte.dc.html` **fait foi** (écrans `1a`-`1b`,
> `2a`-`2e`). Le fichier « explorations » cité par le README peut être absent du dossier :
> sans conséquence — il ne fait pas foi. Sur la mécanique (streaming, quota, DTO), la
> référence reste `SPEC_scriptorium_rag.md` — que ce lot **ne modifie pas**.

---

## Mission

Implémenter le handoff : les deux sous-onglets élève « Plan de cours · Discussion » dans la
bande seuil de l'en-tête, l'onglet Plan de cours extrait du volet actuel, et la refonte de
la surface de la Discussion en **espace épistolaire** (parti « correspondance continue »).
**Présentation + navigation uniquement — zéro changement de logique, zéro fonctionnalité
nouvelle, aucun SQL.** Le handoff est prescriptif : en cas de doute ou de trou, **note la
question et arrête-toi** (règle R7) — ne tranche pas toi-même. Si la maquette contredit un
comportement existant non mentionné par le handoff, **le comportement existant gagne**.

## Pré-vol git (avant toute modification)

1. `git status`. Si des **modifications non commitées d'un autre chantier** traînent
   (ex. C1 : `app/auth/confirm/route.ts`, `utils/aletheia-retours.ts`…) : **STOP** —
   demande au PO comment procéder (autre session en vol ou reliquat à committer). Ne les
   committe jamais toi-même, ne travaille pas par-dessus. Alternative prévue par le repo :
   un **worktree dédié** (cf. `WORKTREE_cheatsheet.md`).
2. Premier commit, **le handoff seul** (il n'est pas encore suivi) :
   `git add design_handoff_scriptorium_eleve/` →
   `docs(design): handoff Scriptorium élève — révision 24/07 (épistolaire, onglets, sans mobile)`.
   **Rien d'autre** dans ce commit — en particulier PAS `Aletheia - Parcours élève.dc.html`
   (fichier d'un autre chantier, laisse-le), ni les `PROMPT_*.md`.
3. Branche dédiée : `feat/rag-ecran-eleve` depuis l'état courant de `main`.

## Ordre de travail (= les chantiers du handoff)

1. **Chantier 1 — navigation** : `configModules.ts` (sous-onglets élève),
   `EnTeteSite.tsx` role-aware, `page.tsx` route `?vue=plan|discussion` (défaut
   `discussion`). ⚠️ **C'est l'étape à risque de régression** : `EnTeteSite` est partagé
   par tous les modules et les deux rôles. Après elle, vérifie : sous-onglets **prof**
   Scriptorium intacts ; **aucun** sous-onglet apparu sur les autres modules élève
   (Fragments, Quazian, Codex, Aletheia) ; bande seuil inchangée partout ailleurs.
2. **Chantier 2 — `PlanCours`** : nouveau composant extrait du volet `voletPlan`, vue
   Parcours **non redessinée** dans son contenu (frise, statuts couleur+police, lien
   « En parler avec le tuteur → »), note anti-spoiler. Commutateur Année|Parcours :
   **codé conditionnel, condition `false` en v1** — absent à l'écran, aucun bouton mort.
3. **Chantier 3 — Discussion épistolaire** : `ChatScriptorium` recentré rail + fil +
   écritoire (le volet plan part), puis la refonte de surface — colonne unique, voix par
   typographie/retrait/filet (jamais d'aplat), séparateurs de jour, un ornement par écran,
   billet de transparence et messages de quota **au mot près**, `pre-wrap` conservé,
   **aucune animation ajoutée**. Respecte les interdits fermes du handoff à la lettre.
4. **Chantier 4 — responsive minimal** : à 375 px rien de cassé (empilement, rail
   escamotable, barres mobiles existantes). **Aucune vue mobile dédiée.**

## Périmètre de fichiers (strict)

- **Autorisés** : `app/eleve/modules/scriptorium/{page.tsx, ChatScriptorium.tsx}` +
  nouveau `PlanCours.tsx` (même dossier) ; `components/nav/configModules.ts` ;
  `components/nav/EnTeteSite.tsx` ; `components/SousNavModule.tsx` seulement si le passage
  « liste en prop » l'exige.
- **Interdits** : `actions.ts` et la route `/api/scriptorium/chat` (logique intacte) ;
  le DTO `PlanEleve` (titres + statuts seuls — ne pas l'élargir, même « pour enrichir ») ;
  `utils/*` ; les gates (`rag_actif` reste tel quel en base) ; `globals.css` (les jetons
  nécessaires existent déjà — si un manque réel apparaît, c'est un cas R7 : note et stop) ;
  tout SQL (R6 sans objet).

## Recette (fin de session)

1. `npm run build` propre + suite de tests existante verte (aucun test ne doit changer).
2. **Gate** : la recette visuelle se fait en **sandbox** avec `rag_actif` activé pour la
   classe de test **si ce n'est pas déjà le cas** — et remis dans l'état trouvé ensuite.
   Jamais en prod. Gate OFF → aucune surface élève (comportement inchangé à vérifier).
3. Dérouler la **checklist d'acceptation du handoff** (section finale) point par point,
   plus les états non maquettés : erreur d'envoi (ligne `⚠` en `retard`), confirmation de
   suppression, saisie multi-lignes, `?conv=` qui coexiste avec `?vue=discussion`.
4. Contrôle 375 px au devtools sur les deux onglets.
5. Livre au PO une **liste de recette utilisateur** (10 lignes max) : quoi ouvrir, quoi
   vérifier, dans l'ordre — écrans `1b`, `2a`→`2e`, onglets prof intacts, autres modules
   intacts, 375 px.

## Fin de session

Commits séparés et lisibles (au minimum : handoff docs · chantier 1 · chantiers 2-3 · 
finitions), dernier commit type :
`feat(scriptorium): écran élève — onglets Plan de cours/Discussion + espace épistolaire (C2.2)`.
Merge sur `main` **seulement si** build + tests + checklist verts ; sinon laisse la branche
et la liste des points en suspens. Termine par la note de journal habituelle + la liste
sèche des questions R7 rencontrées (même résolues par « comportement existant gagne »).

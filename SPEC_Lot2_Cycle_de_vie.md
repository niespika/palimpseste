# SPEC — Lot 2 : Cycle de vie d'une classe

> Lot du plan global (`PLAN_Palimpseste_modifications.md`).
> **Prérequis : Lot 1 implémenté** (travail scopé par inscription élève × classe, références classe par **ID**). Ce lot s'appuie dessus — ne pas l'attaquer avant.
>
> **⚠️ Opérations destructives et irréversibles.** Audit-first ciblé :
> - **Phase A — Audit.** Produire le **manifeste d'effacement** (qui est supprimé, qui est détaché), sans rien modifier. Puis **s'arrêter** pour validation.
> - **Phase B — Implémentation.** Seulement après feu vert.
>
> **Placement UI :** l'action d'effacement et l'affichage des rappels vivront sur le **tableau de bord (Lot 3)**. Ce lot construit les **opérations**, le **flux de confirmation** et la **logique des rappels**, exposés pour être branchés sur le dashboard ensuite — ne pas créer de page séparée.

---

## Principe directeur — **supprimer** vs **détacher**

C'est le cœur du lot. Toute donnée liée à une classe tombe dans l'une de deux catégories :

- **SUPPRIMER (définitif, vie privée)** — les **données élève** scopées sur la classe. Effacement complet, pas d'archivage.
- **DÉTACHER (préserver le contenu)** — le **contenu créé par le prof** (ressources Scriptorium, définitions de quizz…). On retire seulement la **référence à la classe** ; le contenu reste, réutilisable pour une future classe.

Deux garde-fous qui découlent de ce principe :
- Effacer une classe **ne supprime jamais un compte élève** ni son travail dans **une autre classe** (un élève bi-classe HLP + Philo garde son compte et ses fragments de Philo si on efface HLP). C'est exactement ce que le scoping par inscription du Lot 1 rend possible.
- Effacer une classe **ne supprime pas ton contenu de cours** : les ressources Scriptorium sont **détachées**, pas détruites.

---

## Ce que le lot doit livrer

1. **Persistance — pas d'expiration automatique.** Aucune logique de bascule d'année n'efface une classe. Une classe persiste tant que le prof ne l'efface pas manuellement (HLP sur 1ère + Terminale = une seule entité qui dure).
2. **Effacement manuel d'une classe** — flux en **2 ou 3 étapes** avec friction délibérée (ex. dernière étape : retaper le nom de la classe pour confirmer). Effacement **complet et définitif** selon le manifeste. Pas d'undo (c'est pour ça que la friction existe).
3. **Rappels au 30 juin et au 30 août** — déclenchés **uniquement si la classe n'a pas encore été effacée**. **Dismissibles par classe** (« cette classe continue ») ; une fois écartés, ils ne reviennent plus pour cette classe. Si le prof a effacé plus tôt (ex. 1er juin), aucun rappel.
4. **Nettoyage Scriptorium par détachement** — effacer une classe vide la référence à cette classe sur ses docs / unités / semaines, **sans supprimer le contenu**. Une classe homonyme créée ensuite (ID différent) **n'hérite de rien**.
5. **Retrait d'un seul élève d'une classe** — supprime l'**inscription** concernée et son travail scopé sur **cette** classe, sans toucher au compte de l'élève ni à ses autres classes.

---

## Phase A — Audit : le manifeste d'effacement (rapporter, sans modifier)

Tracer, à travers le schéma réel (post-Lot 1), **toutes** les localisations de données liées à une classe, et **classer chacune** en SUPPRIMER ou DÉTACHER. L'exhaustivité est critique : une localisation oubliée = donnée élève résiduelle = fuite de vie privée.

**Table de départ à valider et compléter** (la classification dépend du schéma réel) :

| Donnée | Catégorie |
|---|---|
| Inscriptions (élève ↔ cette classe) | SUPPRIMER |
| Fragments (écrits, oraux) scopés sur ces inscriptions | SUPPRIMER |
| Essais scopés | SUPPRIMER |
| Stats / progression des élèves de la classe | SUPPRIMER |
| Résultats de quizz des élèves de la classe | SUPPRIMER |
| État de révision des flashcards (par élève) pour la classe | SUPPRIMER |
| Séances Codex + retours IA (V1 / VF) des élèves de la classe | SUPPRIMER |
| **Comptes élèves** | **NE PAS toucher** (cf. principe directeur) |
| Définitions de quizz (contenu prof) | DÉTACHER (retirer l'assignation ; garder si d'autres classes l'utilisent) |
| Cartes / flashcards générées | À classer : contenu réutilisable (DÉTACHER / régénérable) vs jetable — selon le schéma |
| Ressources Scriptorium (docs / unités / semaines) | DÉTACHER (vider la réf. classe, garder le contenu) |
| Liens d'accès module ↔ classe | SUPPRIMER (l'accès disparaît avec la classe) |

**Aussi en Phase A :** concevoir le **flux de confirmation** (les 2-3 étapes) et la **logique des rappels** (voir note d'implémentation ci-dessous).

**Puis STOP.** Présenter : le manifeste classé et **confirmé exhaustif**, le flux de confirmation proposé, la logique des rappels, et les décisions ci-dessous. Attendre le feu vert.

> **Note d'implémentation rappels :** privilégier un calcul **à l'ouverture du dashboard** (si date ≥ 30/06 ou ≥ 30/08, classe active et non écartée → afficher le rappel) plutôt qu'un job planifié — aucune infra de cron nécessaire. Des rappels par e-mail / push sortiraient du périmètre et demanderaient un planificateur.

---

## Décisions à faire remonter

- **Retrait d'un élève — dur ou souple ?** Supprimer définitivement l'inscription + son travail scopé (parité vie privée avec l'effacement de classe), **ou** marquer l'inscription « retirée » (statut du Lot 1) en conservant les données ? *Recommandation : suppression dure, par cohérence avec la posture vie privée — mais le modèle supporte les deux.*
- **Portée de l'écartement d'un rappel** — « cette classe continue » se tait **jusqu'à l'effacement** (lean, recommandé : une HLP de 2 ans n'est écartée qu'une fois), **ou** se réarme chaque année ?
- **Friction de confirmation** — 2 étapes (avertissement + confirmation) ou 3 (avec retape du nom de la classe) ? *Recommandation : 3, vu l'irréversibilité.*

---

## Phase B — Implémentation (après feu vert)

- Effacement de classe selon le manifeste validé : **SUPPRIMER** en cascade tout ce qui est marqué, **DÉTACHER** (vider la réf. classe par ID) le reste, **ne jamais toucher** comptes élèves ni travail d'autres classes.
- Flux de confirmation à 2-3 étapes, sans undo.
- Logique des rappels (calcul à l'ouverture, condition « non effacée », écartement persistant par classe), exposée pour le dashboard.
- Retrait d'un élève selon la décision retenue.
- Vérifier qu'aucune logique n'efface une classe automatiquement.

---

## Fait quand

- **Aucune** classe ne disparaît toute seule ; une classe dont le rappel a été écarté (« continue ») n'est plus relancée.
- Effacer une classe demande **2-3 confirmations délibérées**, puis supprime **définitivement** tout le travail élève scopé sur cette classe (fragments, essais, stats, résultats quizz, révisions flashcards, séances Codex) **et** les inscriptions — **sans** toucher aux comptes élèves ni à leur travail dans d'autres classes.
- Le contenu Scriptorium de la classe effacée est **préservé mais détaché**.
- Les rappels n'apparaissent qu'**au 30/06 et 30/08**, **uniquement** pour les classes non effacées, et se taisent une fois écartés.
- Retirer un seul élève d'une classe ne supprime que **son** inscription et son travail sur **cette** classe.
- **Vérification clé (vie privée + homonymie) :** après effacement, créer une classe **de même nom** → **zéro** donnée élève résiduelle **et zéro** ressource Scriptorium héritée.

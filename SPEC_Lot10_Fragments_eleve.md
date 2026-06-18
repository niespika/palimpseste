# SPEC — Lot 10 : Fragments élève (page surchargée → restructurée)

> Lot du plan global (`PLAN_Palimpseste_modifications.md`).
> **Prérequis : Lot 1, Lot 5.** Spec standard. **Dans le contexte de classe courant** (commutateur du Lot 9).
> Notation : le parcours et les sections s'affichent en **lettres** (E-A) ; **pas de /20** pour l'écrit (le /20 n'existe que pour **oral / essai / synthèse**, Lot 5).

---

## Haut de page

- **Évolution graphique des évaluations** semaine après semaine (= « ton parcours » actuel) — sur les **sections en lettres**.
- Tuiles : **taux de dépôt**, **meilleures sections**, **à travailler**.
- **Rappel des pistes** (≈ 3, issues du **dernier retour**).

## Trois tuiles côte à côte (cliquables)

- **Fragments écrits** / **Fragment oral** / **Essai**.
- **Code couleur :** **verte** = tout à jour ; **rouge** = travail à faire ; **neutre** = rien de neuf.

## Sous les tuiles

- **Retour complet du dernier fragment.** L'élève doit **valider qu'il l'a lu**. **Il ne peut pas déposer un nouveau fragment tant qu'il n'a pas validé** cette lecture. *(Gate.)*

## Détail des tuiles

- **« Fragments écrits »** → liste des fragments + leurs retours ; **section de dépôt d'un nouveau fragment en haut** (soumise au gate ci-dessus).
- **« Fragment oral »** → **retour de l'oral** (lecture ; l'oral se fait en classe, pas de dépôt).
- **« Essai »** → **dépôt de l'essai** (tant qu'aucun essai n'est soumis) **et** retour de l'essai. **Un seul essai** : une fois soumis, **plus de soumission**, la tuile n'affiche que le retour.

## Anti-triche photo (au dépôt)

- **2 couches :** (1) attribut `capture` → orienter vers la caméra (hint, non bloquant) ; (2) à l'upload, lire l'**horodatage EXIF** (DateTimeOriginal) et le comparer à l'**horloge de l'appareil** → écart important = photo ancienne (galerie) → **à signaler**.
- *Limites : `capture` ne bloque pas la galerie / ignoré sur desktop ; EXIF parfois absent (capture d'écran, image « nettoyée » par un partage) ou contournable ; attrape la photo **recyclée**, pas une photo d'antisèche prise à l'instant.*

---

## Fait quand

- Page hiérarchisée : **parcours (lettres) + pistes** en haut, **3 tuiles d'état** (vert / rouge / neutre), **retour à valider**.
- **Dépôt bloqué** tant que le dernier retour n'est pas lu.
- Tuile **essai** = **dépôt (si pas encore soumis) + retour** ; **un seul essai**.
- Tuiles **oral** et **écrit** mènent à leurs retours / dépôt comme spécifié.
- Dépôt photo : **hint caméra + contrôle EXIF**.
- Tout est scopé au **contexte de classe courant**.

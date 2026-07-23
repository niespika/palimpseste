# Handoff — Intégrité (« petits malins ») · rendu charte

> Pour Claude Code. Objectif : transformer la page `/prof/integrite` d'une **liste muette**
> (on ne peut que faire « Vu ») en un atelier **file + preuve** : on clique un signalement,
> sa **preuve** s'ouvre (photo déposée — y compris vide — et retranscription avec le passage
> problématique surligné), puis on agit. **Pas de refonte de la logique métier** : on garde
> strikes / seuil / blocage / dédup (`utils/integrite.ts`, `integrite_petits_malins.sql`).
> On change l'**agencement**, on **affiche la preuve** (nouveau), on **adapte les actions à la
> source**, et on ajoute le **blocage manuel** (validé par le porteur).

## Références visuelles
Deux fichiers HTML accompagnent ce document (ouvrir dans un navigateur) :
- **`Intégrité Wireframes.dc.html`** — wireframes low-fi : diagnostic, 3 pistes de structure (liste / matrice / master-detail), preuve détaillée, formats d'ouverture, mobile. Annoté (le « pourquoi »).
- **`Intégrité Rendu Charte.dc.html`** — rendu hi-fi fidèle à la charte (le « quoi », à reproduire) : la page file+preuve (ordi), les deux jeux d'actions selon la source, volet/modale, mobile.

Reproduire le **langage visuel** avec les composants/jetons du codebase (React, Tailwind de `globals.css`, `next/font`). **Aucune couleur ni police en dur** — réutiliser les jetons (`bg-surface`, `text-encre`, `font-marque`…) et les pastilles de sceau existantes (`Pastille`).

---

## Décisions validées par le porteur du projet
1. **Structure = master-detail** : sur ordi, **file des signalements à gauche** (À traiter / Bloqués) + **panneau de preuve à droite**. La matrice élèves × modules a été écartée (trop clairsemée). Sur mobile : **liste → preuve plein écran**.
2. **La preuve d'abord** : à l'ouverture, **photo déposée** (y compris « page quasi blanche ») + **retranscription** avec le **passage problématique surligné**, puis **motif + type**. L'historique des strikes, la source/date et le lien « analyse complète » restent présents mais **discrets** (une ligne).
3. **Actions selon la source** :
   - signal **« détecté au rendu »** (`source='algo'`, strike déjà compté) → **Vu** (retire l'alerte) ;
   - signal **« détecté par l'IA »** (`source='ia'`, `statut='en_attente'`) → **Confirmer (+1 strike)** / **Écarter** ;
   - dans les deux cas : **Bloquer l'élève** ; et **Débloquer (−1 strike)** sur les bloqués.
4. **Blocage / déblocage manuel** conservé et explicite (le mot **« strike »** est gardé tel quel).
5. **Logo Palimpseste** (médaillon sans le mot) en pastille sur l'en-tête mobile, cohérent avec les autres écrans prof.

---

## Existant (à garder, ne pas réécrire la logique)
- `app/prof/integrite/page.tsx` — server : charge `integrite_params`, `integrite_signalements` (non acquittés), profils bloqués ; mappe en `SignalementVue` / `BloqueVue`.
- `app/prof/integrite/GestionIntegrite.tsx` — client : 3 sections empilées (Élèves bloqués / Signalements à traiter / Paramètres) + boutons.
- `app/prof/integrite/actions.ts` — `actionConfirmerSignalement`, `actionEcarterSignalement`, `actionAcquitterSignalement` (= « Vu »), `actionDebloquerEleve`, `sauvegarderParamsIntegrite`.
- `utils/integrite.ts` — `LABEL_MODULE`, `LABEL_TYPE_STRIKE`, `confirmerSignalement`, `acquitterSignalement`, `debloquerEleve`, `signalerStrikeAuto`, `signalerEnAttenteIA`, seuil/blocage.
- `utils/detecteur-integrite.ts` — `LABEL_SIGNAL`, heuristiques (le **motif** contient déjà la sous-chaîne fautive, ex. « Le commentaire contient « pas eu le temps ». »).
- Table `integrite_signalements` (`integrite_petits_malins.sql`) : `id, eleve_id, module, rendu_ref, type, motif, source('algo'|'ia'), statut('en_attente'|'confirme'|'rejete'), compte_strike, created_at, acquitte_at`. Clé d'unicité `(eleve_id, module, rendu_ref)`.
- **Page d'analyse Fragments** (modèle de la « preuve ») : `app/prof/fragments-erudition/analyse/[depotId]/page.tsx` — lit `fragments_depots` (+ `commentaire_eleve`, `photos:fragments_photos.storage_path`) ; c'est la cible du lien « analyse complète » côté Fragments.

---

## Chantier 1 — Charger la preuve depuis `rendu_ref` (NOUVEAU, le cœur du lot)

Le signalement connaît `(module, rendu_ref)` mais l'UI ne l'affiche pas. Créer un résolveur serveur **par module** :

**`utils/integrite-preuve.ts`** (server-only) :
```ts
export interface Preuve {
  photos: string[]          // URLs signées (storage), [] si pas de photo
  texte: string | null      // retranscription / texte saisi par l'élève
  surligner: string[]       // sous-chaînes à surligner dans `texte` (ex. extraites du motif)
  lienAnalyse: string | null// deep-link vers la page d'analyse du module
  meta?: { priseAt?: string | null; nbCaracteres?: number }
}
export async function chargerPreuve(
  admin: Admin, module: ModuleIntegrite, renduRef: string,
): Promise<Preuve>
```
Résolution par module (le `rendu_ref` est l'id stable du rendu) :
- **`fragments`** : `rendu_ref` = id du dépôt → `fragments_depots` (`commentaire_eleve`, `fragments_photos.storage_path` → URLs signées) ; `lienAnalyse = /prof/fragments-erudition/analyse/{renduRef}`.
- **`aletheia`** : `rendu_ref` = `travailId` ou `${travailId}:vf` (séparer le suffixe `:vf`) → travail Aletheia correspondant (texte V1/VF) ; lien vers la vue d'analyse Aletheia du travail.
- **`codex`** : `rendu_ref` = id du travail Codex → texte du carnet/écrit ; lien vers l'analyse Codex.

`surligner` : par défaut, extraire la sous-chaîne entre « … » du `motif` (heuristique) si présente ; sinon `[]`. **Best-effort** : si un rendu est introuvable (supprimé), renvoyer une `Preuve` vide — l'UI affiche « rendu indisponible » sans planter. Tout passe par le **service_role** (admin), garde de rôle prof déjà assurée par le layout `/prof` (+ défense en profondeur comme dans la page d'analyse Fragments).

---

## Chantier 2 — Page `/prof/integrite` en master-detail

**`app/prof/integrite/page.tsx`** (server) :
- Garder le chargement existant (params, signalements, bloqués).
- Déterminer le **signalement sélectionné** via `?sel=<id>` (défaut : le premier « à traiter », sinon le premier bloqué). Pour celui-là, appeler `chargerPreuve(module, rendu_ref)` et passer la `Preuve` au client.
- Conserver le bandeau « Détection désactivée » si `actif === false`, et l'accès **Paramètres** (déplacé dans un volet/section, cf. Chantier 5).

**`GestionIntegrite.tsx`** (client) → layout **deux colonnes** (`lg:grid-cols-[340px_1fr]`, 1 colonne en mobile) :
- **Colonne gauche — la file** (`bg-surface border rounded-xl`, scroll interne) :
  - sous-titres **À TRAITER (n)** et **BLOQUÉS (n)** (`text-muet uppercase tracking-wide`, compteur `text-retard`).
  - une **ligne-carte cliquable** par signalement : nom (`font-corps`), **pastille + libellé module** en `font-marque` (`LABEL_MODULE`), **badge type** (`LABEL_TYPE_STRIKE`, `bg-retard-teinte text-retard` ; un signal IA en `bg-attention-teinte text-attention`), date, et sous-texte source (« détecté au rendu · strike déjà compté » / « détecté par l'IA · à confirmer »). Sélection = `border-l-4` au **pigment du module** + `aria-current`.
  - lignes bloqués : nom + « n strikes · bloqué·e » + bouton **Débloquer**.
  - mettre à jour `?sel=` au clic (lien `next/link` `scroll={false}` ou état + `router.replace`), sans recharger toute la page.
- **Colonne droite — le panneau de preuve** : `<PanneauPreuve …/>` (Chantier 3).

---

## Chantier 3 — `PanneauPreuve` (composant réutilisable)

**`components/integrite/PanneauPreuve.tsx`** — reçoit le signalement sélectionné + sa `Preuve`. Réutilisé tel quel en **panneau** (page), **volet** (fiche élève) et **modale** (alerte dashboard). Structure (voir rendu charte) :
1. **Têtière** `h-1.5` au **pigment du module** (`data-module=…` → `bg-pigment`).
2. **En-tête** : `Pastille` du sceau + nom (`font-titre`) + ligne « `MODULE` · dépôt/semaine » ; à droite, **badge type** + « source · date ».
3. **LA PREUVE** — grille deux colonnes (empilée en mobile) :
   - **Photo déposée** : `Preuve.photos[0]` (galerie si plusieurs). **Si aucune / vide** → cadre `bg` hachuré + libellé **« page quasi blanche »** (`font-mono`, `text-muet`). « Agrandir » ouvre la photo.
   - **Retranscription** : `Preuve.texte` ; surligner chaque `Preuve.surligner` en `bg-retard-teinte text-retard` (IA → `bg-attention-teinte text-attention`). Pied : « n caractères utiles » si dispo.
4. **Motif** : carte `border-l-4 border-l-retard`, label « ⚑ MOTIF DÉTECTÉ », `motif` + type.
5. **Secondaire (une ligne, `text-muet`)** : historique strikes (n / seuil, pastilles ●●○), « Ouvrir l'analyse complète ↗ » (`Preuve.lienAnalyse`).
6. **Barre d'actions** (Chantier 4).

> Si `Preuve` est vide (rendu supprimé) : masquer photo/transcription, afficher « Rendu indisponible — voir le motif » ; garder motif + actions.

---

## Chantier 4 — Actions adaptées à la source

Réutiliser `app/prof/integrite/actions.ts`. Dans la barre d'actions de `PanneauPreuve`, **conditionner au signalement** :
- `source==='ia' && statut==='en_attente'` → **Confirmer (+1 strike)** (`actionConfirmerSignalement`, `bg-attention-teinte text-attention`) + **Écarter** (`actionEcarterSignalement`, ghost).
- sinon (algo, strike déjà compté) → **Vu** (`actionAcquitterSignalement`, bouton primaire `bg-bouton`).
- toujours, à droite : **Bloquer l'élève** si non bloqué (action neuve, ci-dessous) ; sur une carte bloqué : **Débloquer (−1 strike)** (`actionDebloquerEleve`).

**Blocage manuel (neuf)** :
- `utils/integrite.ts` → `export async function bloquerEleve(admin, eleveId)` : `update profiles set integrite_bloque=true, integrite_bloque_at=now()` (n'incrémente pas les strikes ; le déblocage existant fait déjà `−1 strike` et lève le blocage).
- `actions.ts` → `actionBloquerEleve(eleveId)` (garde prof + `revalider()`), symétrique de `actionDebloquerEleve`.
- Garder le garde-fou : afficher « Bloquer » même si `params.actif===false`, mais rappeler dans le bandeau que les blocages ne prennent pas effet tant que la détection est inactive (texte existant).

Conserver le paragraphe explicatif existant (« un strike détecté au rendu est déjà comptabilisé… »), reformulé en bas du panneau.

---

## Chantier 5 — Paramètres + points d'entrée externes

- **Paramètres** : conserver le formulaire `Parametres` (actif, seuil, messages) ; le sortir de la pile principale → bouton **« ⚙ Paramètres »** (en-tête) ouvrant un **volet** réutilisant le même composant. Aucune logique changée (`sauvegarderParamsIntegrite`).
- **Depuis ailleurs (phase 2, même `PanneauPreuve`)** :
  - **Fiche élève** (`/prof/eleves/[eleveId]`) : un signalement ouvre la preuve en **volet** latéral.
  - **Tableau de bord** : le héros/alerte « Intégrité — petits malins » peut ouvrir un cas en **modale** (sinon, lien vers `/prof/integrite?sel=…`). `app/prof/page.tsx` calcule déjà `nbSignalements` / `nbBloques`.

---

## Rappels charte (réutiliser, ne pas redéfinir)
- **Polices** : `font-marque` Cinzel (CAPS espacées : marque, **noms de module**) · `font-titre` Cormorant (titres, nom d'élève, grands chiffres) · `font-corps` EB Garamond (`<body>`, texte transcrit) · `font-ui` Alegreya Sans (nav, badges, boutons, dates, libellés).
- **Couleurs (jetons)** : `bg-parchemin`/`bg-surface`, `text-encre`/`text-encre-douce`/`text-muet`, `border-bordure`. États : `text-ok`/`bg-ok-teinte`, `text-attention`/`bg-attention-teinte` (IA / en attente), `text-retard`/`bg-retard-teinte` (rendu vide / aveu, surlignage rouge). Pigments par monde via `data-module="aletheia|codex|fragments"` → `bg-pigment`, `text-pigment`.
- **Sceaux** : `Pastille` (disque teinté + PNG N&B `mix-blend-multiply`, `brightness(1.09) contrast(1.04)`). Logo = `palimpseste_medaillon.png`. Assets fournis dans `./sceaux/` (palimpseste_medaillon, fragments, aletheia, codex) — copier dans `public/sceaux/` s'ils n'y sont pas déjà.
- **Cartes** : `bg-surface border border-bordure rounded-xl` ; têtière colorée = `<div className="h-1.5 bg-pigment" />` ; carte à bord gauche = `border-l-4` (état ou pigment). Le **placeholder photo vide** = fond haché discret + libellé `font-mono text-muet` (ne pas dessiner d'icône).

## Responsive
- Mobile (< 640) : **1 colonne** = la file ; taper une ligne ouvre la **preuve plein écran** (en-tête « ← Intégrité » + pastille logo à droite), barre d'actions **collée en bas** (cibles ≥ 44px). `print:hidden` sur barres de nav.
- `lg` (≥ 1024) : `grid-cols-[340px_1fr]`, preuve dans la colonne droite (pas d'overlay sur la page Intégrité).
- Volet / modale : réservés aux ouvertures **hors** page Intégrité.

## Checklist d'acceptation
- [ ] `/prof/integrite` : file (À traiter / Bloqués) à gauche, **panneau de preuve** à droite ; `?sel=` pilote la sélection.
- [ ] La preuve montre **photo** (placeholder « page quasi blanche » si vide) **+ retranscription** avec **passage surligné**, puis **motif + type**.
- [ ] Historique strikes, source/date et **lien « analyse complète »** présents mais discrets.
- [ ] Actions correctes selon la source : **Vu** (algo) vs **Confirmer / Écarter** (IA en attente) ; **Bloquer** (neuf) / **Débloquer (−1)**.
- [ ] `chargerPreuve` résout les 3 modules (fragments / aletheia / codex) et dégrade proprement si rendu absent.
- [ ] Mobile : liste → preuve plein écran, actions en bas (≥ 44px) ; logo médaillon en en-tête.
- [ ] Paramètres accessibles (volet), inchangés.
- [ ] Aucune couleur/police en dur ; **aucune régression** (strikes, seuil, blocage, dédup, messages élève).

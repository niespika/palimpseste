# Patch couleurs — finir la migration de la charte sur Palimpseste

> **Pour Claude Code.** La fondation de la charte est déjà en place et correcte :
> `app/globals.css` (avec `@theme inline` ✓), `components/Pastille.tsx`, `components/Tuile.tsx`,
> `data-module="…"` sur **tous** les layouts de module (élève + prof) et `app/login`,
> `app/eleve/layout.tsx` et `components/nav/BarreNavigation.tsx` migrés sur les jetons.
>
> **Ce qui reste = repeindre les écrans.** Les pages individuelles utilisent encore les
> couleurs Tailwind brutes d'origine (`bg-stone-800`, `border-green-200`, `text-amber-700`…).
> C'est la cause des deux bugs signalés :
> 1. **Boutons noirs dans les modules** → boutons encore en `bg-stone-800`.
> 2. **Liseré de tuile vert au lieu du pigment** → tableau de bord élève jamais migré.
>
> Ce document liste les **règles de remplacement** (canoniques + exceptions) et un
> **inventaire par zone**. Applique zone par zone, en suivant les règles. Toutes les
> classes cibles (`bg-pigment`, `border-l-pigment`, `bg-ok-teinte`…) existent déjà OU
> sont ajoutées à l'étape A.
>
> **Principe directeur de la charte :**
> - **Action principale** (bouton plein, onglet/segment actif) → **pigment du module**
>   (`--pigment`, disponible partout via `data-module`).
> - **Signal fonctionnel** (réussi / à faire / erreur / info) → **jetons d'état**
>   (`--ok`, `--attention`, `--retard`, `--info`). On garde la distinction sémantique,
>   on l'harmonise juste aux teintes de la charte.
> - **Surfaces & texte neutres** → `--surface`, `--bordure`, `--encre/encre-douce/muet`.
> - **Voiles/scrims d'image, fond du canvas manuscrit** → on ne touche pas.

---

## A. Pré-requis — ajouter 5 jetons d'état à `app/globals.css`

Ajoute le jeton **info** (bleu ardoise) dans `:root`, à côté des autres états :

```css
  /* états (indépendants du module) */
  --ok:               #5B6E4A;   --ok-teinte:        #E4E8D8;
  --attention:        #9A6A2E;   --attention-teinte: #EFE4CF;
  --retard:           #A23E2E;   --retard-teinte:    #EFD9D2;
  --info:             #3E5C7E;   --info-teinte:      #DCE3EC;   /* ← AJOUTER */
```

Puis expose les **teintes** + info dans le bloc `@theme inline` (les pigments d'état pleins
`--color-ok/attention/retard` existent déjà ; on ajoute les versions « teinte » de fond et info) :

```css
  --color-ok-teinte:        var(--ok-teinte);          /* ← AJOUTER */
  --color-attention-teinte: var(--attention-teinte);   /* ← AJOUTER */
  --color-retard-teinte:    var(--retard-teinte);      /* ← AJOUTER */
  --color-info:             var(--info);               /* ← AJOUTER */
  --color-info-teinte:      var(--info-teinte);        /* ← AJOUTER */
```

Tu disposes alors de : `text-ok bg-ok-teinte`, `text-attention bg-attention-teinte`,
`text-retard bg-retard-teinte`, `text-info bg-info-teinte`, plus `bg-pigment`, `text-pigment`,
`border-l-pigment`, `bg-pigment-teinte` (déjà en place).

---

## B. Boutons primaires — LE correctif « boutons noirs »

**Locator :** `bg-stone-800` et `bg-stone-900` (boutons d'action pleins).
**~90 occurrences**, dans presque tous les modules élève + prof.

### Transform canonique
```
bg-stone-800 text-white … hover:bg-stone-700   →   bg-pigment text-surface … hover:opacity-90
bg-stone-800 text-white … hover:bg-stone-900   →   bg-pigment text-surface … hover:opacity-90
```
Comme chaque bouton est **dans** un sous-arbre `data-module`, `bg-pigment` prend
automatiquement la couleur du module (outremer pour Aletheia, vert bouteille pour Codex…).
Sur les pages prof **générales** (hors module : `prof/classes`, `prof/eleves`, `prof/calendrier`,
`prof/a-risque`, `prof/modules`) il n'y a pas de `data-module` → `bg-pigment` retombe sur le
sépia général `#5A4632`, ce qui est exactement voulu.

### Variante — toggles / segments « actif »
Même logique pour les états sélectionnés :
```
on ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300 …'
→  on ? 'bg-pigment text-surface border-pigment'  : 'bg-surface text-encre-douce border-bordure …'
```
Concerné notamment : `prof/scriptorium/FormulaireContenu.tsx`, `EditeurClassesLivre.tsx`,
`FormulaireLivre.tsx`, `LigneContenu.tsx` ; `prof/a-risque/page.tsx` ;
`prof/calendrier/FiltreClasses.tsx`, `config/GestionJoursCours.tsx` ;
`prof/quazian/semestre/page.tsx` ; `eleve/calendrier/page.tsx`, `prof/calendrier/page.tsx`
(sélecteur de vue) ; `quazian/quizz/[quizId]/PassationJetons.tsx` (jeton sélectionné) ;
`fragments…/EditorAnalyse.tsx`, `EditorAnalyseOrale.tsx`, `EnregistreurAudio.tsx` (onglets de mode).

### Inventaire des fichiers à boutons (`bg-stone-800/900`)
*Élève*
- `eleve/calendrier/page.tsx`
- `eleve/modules/aletheia/` : `page.tsx`, `FormulaireV1.tsx`, `FormulaireVf.tsx`, `BoutonLectureRetourVf.tsx`
- `eleve/modules/fragments-erudition/` : `BoutonLectureRetour.tsx`, `EssaiDepot.tsx`, `FormulaireDepot.tsx`
- `eleve/modules/codex/synthese/[sessionId]/` : `CaptureManuscrit.tsx`, `BoutonLu.tsx`
- `eleve/modules/quazian/` : `QuazianDashboard.tsx`, `SessionRevision.tsx`, `quizz/[quizId]/PassationJetons.tsx`

*Prof*
- `prof/eleves/` : `FormulaireAjoutEleve.tsx`, `LigneEleve.tsx`
- `prof/classes/` : `GestionClasse.tsx`, `CreerClasse.tsx`, `ConfirmationEffacement.tsx`
- `prof/calendrier/` : `EditeurDate.tsx`, `page.tsx`, `config/GestionHolidays.tsx`, `config/GestionSemestres.tsx`, `config/CouleursClasses.tsx`, `config/GestionJoursCours.tsx`, `FiltreClasses.tsx`
- `prof/codex/` : `FormulaireSynthese.tsx`, `parametres/FormulaireParametresCodex.tsx`
- `prof/fragments-erudition/` : `semaine/[id]/TirageAuSort.tsx`, `semaine/[id]/VueSemaine.tsx`, `analyse/[depotId]/EditorAnalyse.tsx`, `depots/[depotId]/EditorAnalyseDepot.tsx`, `semestres/[semestreId]/GestionSyntheses.tsx`, `essais/[essaiId]/TableauEssai.tsx`, `essais/FormulaireNouvelEssai.tsx`, `essais/GestionEssaisClasse.tsx`, `themes/LigneThemeEleve.tsx`, `presentation/[presentationId]/EnregistreurAudio.tsx`, `presentation/[presentationId]/EditorAnalyseOrale.tsx`, `parametres/FormulaireParametres.tsx`
- `prof/quazian/` : `quizz/[quizId]/QuestionCard.tsx`, `quizz/CreerQuizz.tsx`, `quizz/page.tsx`, `semestre/page.tsx`, `[uniteId]/CarteFlashcard.tsx`, `[uniteId]/page.tsx`, `parametres/page.tsx`, `page.tsx`
- `prof/scriptorium/` : `FormulaireContenu.tsx`, `EditeurClassesLivre.tsx`, `CarteArchitectureLivre.tsx`, `FormulaireLivre.tsx`, `LigneContenu.tsx`
- `prof/aletheia/FormulaireParametresAletheia.tsx`
- `prof/modules/DetailModule.tsx`

> Astuce : `grep -rn "bg-stone-800\|bg-stone-900" app/` pour cocher chaque occurrence.

---

## C. Tableau de bord élève — LE correctif « liseré vert »

Fichier : **`app/eleve/page.tsx`**. Les cartes « À faire » sont des `<div>`/`<Link>` codés en
couleurs brutes. Chaque carte référence **un module précis** → son bord gauche doit porter le
**pigment de ce module** ; l'urgence passe par le **badge**, pas par le bord.

Pattern général pour chaque carte « À faire » :
```
bg-white border border-amber-200 rounded-xl p-4 hover:border-amber-300
→  data-module="<module>"  +  bg-surface border border-bordure border-l-4 border-l-pigment rounded-xl p-4 hover:shadow-sm
```
- Carte **Fragments** (l.197) → `data-module="fragments"` ; badge d'urgence
  `text-amber-700` → `text-attention` ; le texte « à déposer » garde l'attention.
- Carte **Flashcards/Quazian** (l.217) → `data-module="quazian"` ; badge
  `bg-amber-100 text-amber-700` → `bg-attention-teinte text-attention`.
- Carte **Codex** (l.226) → `data-module="codex"` ; `text-green-600 · en direct`
  → `text-ok` (le « en direct » reste un signal d'état « vivant »).
- Carte **Quazian quizz** (l.232) → `data-module="quazian"`.
- Carte **Aletheia** (l.238) → `data-module="aletheia"`.

Section « Ta progression » (l.255-272), les 3 en-têtes de colonne :
```
text-green-700 (points forts)  → text-ok
text-blue-700  (où tu progresses) → text-info
text-amber-700 (à travailler)  → text-attention
```
Et les cartes `bg-white border-stone-200` → `bg-surface border-bordure` (cf. règle F).

> **Recommandé** : ces cartes « À faire » pourraient utiliser le composant `<Tuile module="…">`
> déjà prévu (il gère bord-pigment + sceau). Optionnel ; le remplacement de classes ci-dessus
> suffit pour corriger le bug.

---

## D. Pages de module — en-têtes & accents → pigment

Sur chaque page de module (élève **et** prof), les éléments d'**identité/accent** passent au pigment :
- Titre du module, filets/têtières de carte, points de puce d'accent, barres de progression
  « neutres » → `text-pigment` / `bg-pigment` / `border-l-pigment` / `bg-pigment-teinte`.
- Fond de page : envelopper le contenu avec `style={{ background: 'var(--fond-module)' }}`
  (cf. `code/module-layout.example.tsx` du handoff) si ce n'est pas déjà fait.

Cas concrets repérés :
- `eleve/modules/codex/page.tsx` : carte « Synthèse en cours » `bg-green-50 border-green-300`
  → c'est un **état live**, garder en `bg-ok-teinte border-ok` (signal), MAIS le point pulsé
  et le CTA principal de la page peuvent être en pigment.
- `eleve/modules/aletheia/page.tsx` & `[livreId]/[semaine]/page.tsx` : `text-violet-600`
  (n° de chapitres) → `text-pigment`.
- `eleve/modules/quazian/page.tsx` : carte « Quizz en cours » → garder le live en `ok`,
  bordure d'accent en `border-l-pigment`.
- `prof/aletheia/page.tsx` (l.18) & `prof/quazian/quizz/.../TableauLive.tsx`,
  `prof/codex/.../TableauSynthese.tsx` : barres de progression `bg-green-400/500`
  → `bg-pigment` si c'est une jauge **neutre** de remplissage ; garder `bg-ok` seulement si
  ça signifie explicitement « réussite ».

---

## E. Badges & cartes d'état → jetons (maps centralisées)

La plupart des badges passent par **quelques maps partagées** : migrer la map = repeindre des
dizaines d'écrans d'un coup. Mapping charte :
**réussi/validé/publié/actif → ok · à valider/à faire/en attente → attention · erreur/manquant/danger → retard · en cours/info/phase → info.**

### E.1 `utils/notation.ts` — `COULEUR_LETTRE`
```ts
export const COULEUR_LETTRE: Record<LettreSection, string> = {
  A: 'bg-ok-teinte text-ok',
  B: 'bg-info-teinte text-info',
  C: 'bg-attention-teinte text-attention',
  D: 'bg-attention-teinte text-attention',
  E: 'bg-retard-teinte text-retard',
}
```

### E.2 Maps de statut « analyse/synthèse » (mêmes clés répétées dans ~8 fichiers)
`en_cours → bg-info-teinte text-info` · `generee/à valider → bg-attention-teinte text-attention`
· `erreur → bg-retard-teinte text-retard` · `publiee/publie → bg-ok-teinte text-ok`.
Fichiers : `prof/fragments-erudition/analyse/[depotId]/EditorAnalyse.tsx`,
`depots/[depotId]/EditorAnalyseDepot.tsx`, `semestres/[semestreId]/GestionSyntheses.tsx`,
`essais/[essaiId]/TableauEssai.tsx`, `presentation/[presentationId]/EditorAnalyseOrale.tsx`,
`prof/codex/page.tsx`, `prof/codex/validation/[travailId]/EditeurRetour.tsx`,
`prof/quazian/quizz/page.tsx`, `prof/fragments-erudition/semaine/[id]/VueSemaine.tsx`.

### E.3 Badges/encarts inline (règle de remplacement de classes)
```
bg-green-50/100  + text-green-700/800   → bg-ok-teinte text-ok
bg-amber-50/100  + text-amber-700/800   → bg-attention-teinte text-attention
bg-red-50/100    + text-red-700/800     → bg-retard-teinte text-retard
bg-blue-50/100   + text-blue-700/800    → bg-info-teinte text-info
border-green-200/300 → border-ok    · border-amber-200/300 → border-attention
border-red-200/300   → border-retard · border-blue-200/300  → border-info
text-green-600/700 (seul) → text-ok · text-amber-600/700 → text-attention
text-red-500/600 (seul)   → text-retard · text-blue-600/700 → text-info
```
Points pulsés « live » (`bg-green-400/500 animate-pulse`) → `bg-ok`.
Encarts d'erreur de formulaire (`text-red-600`) → `text-retard`.

> `violet`/`emerald`/`orange`/`yellow` résiduels : rares accents secondaires. Les ramener au
> jeton le plus proche (violet→info ou pigment selon le module ; emerald→ok ; orange→attention ;
> yellow→attention). Pas critique visuellement, à faire au passage.

---

## F. Neutres résiduels (surfaces, bordures, texte)

Règle de balayage (s'applique partout, élève + prof + `components/`) :
```
bg-white (carte/encart)            → bg-surface
border-stone-200 / border-stone-100 → border-bordure
border-stone-300 (inputs, toggles)  → border-bordure
text-stone-900 / text-stone-800     → text-encre
text-stone-700 / text-stone-600     → text-encre-douce
text-stone-500 / text-stone-400     → text-muet
text-stone-300 (très clair)         → text-bordure   (ou laisser)
hover:bg-stone-100 / bg-stone-50    → hover:bg-parchemin-fonce / bg-parchemin-fonce
bg-stone-100 text-stone-600 (badge inactif) → bg-parchemin-fonce text-muet
```
Concerne notamment `components/aletheia/VueRetours.tsx`, `components/aletheia/Diagnostic.tsx`,
`components/classes/DetailClasse.tsx`, `components/fragments/GraphiqueProgression.tsx`,
`components/CourbeEvolution.tsx`, et toutes les pages.

**Polices** : `font-serif` et `font-sans` sont déjà **pontées** vers la charte (Cormorant /
Alegreya) dans `globals.css` — elles fonctionnent telles quelles. Migration fine optionnelle
vers `font-titre` / `font-ui` / `font-marque` (titres de page en `font-titre`, marque/nom de
module en `font-marque`).

---

## G. Boutons sémantiques (à NE PAS confondre avec les boutons primaires)

Ces boutons portent une **couleur de sens** — garde le sens, harmonise la teinte :
- **Valider / confirmer** `bg-green-600 text-white` → `bg-ok text-surface hover:opacity-90`.
- **Supprimer / danger** `bg-red-600 text-white` → `bg-retard text-surface hover:opacity-90`.
- **Générer par IA** `bg-violet-600 text-white` (Quazian) → `bg-pigment text-surface`
  (le « bleu Giotto » du module) **ou** garder un accent dédié ; au choix.
- **Enregistrement audio en cours** `bg-red-600 … animate` → garder `bg-retard` (signal d'arrêt).

---

## H. NE PAS toucher

- Voiles/scrims d'image et modales plein écran : `bg-black/40`, `bg-black/50`, `bg-black/60`,
  `bg-black/80` (visionneuses `prof/fragments-erudition/semaine/[id]/VisionneusModal.tsx`,
  `depots/[depotId]/EditorAnalyseDepot.tsx`). Le noir translucide est correct.
- Fond du canvas d'annotation manuscrite `bg-stone-900` dans
  `prof/fragments-erudition/analyse/[depotId]/EditorAnalyse.tsx` (l.264) — c'est une surface de
  travail, pas un bouton.
- `text-white` lorsqu'il accompagne désormais un fond pigment/ok/retard : remplace plutôt par
  `text-surface` (crème) pour la chaleur, mais `text-white` reste acceptable.

---

## I. Ordre d'exécution conseillé

1. **A** (jetons globals.css) — débloque toutes les classes.
2. **B** (boutons `bg-stone-800/900` → `bg-pigment`) — corrige « boutons noirs », fort impact visuel.
3. **C** (`eleve/page.tsx`) — corrige « liseré vert ».
4. **E.1 + E.2** (maps centralisées) — repeint la majorité des badges d'un coup.
5. **F** (neutres) — balayage `bg-white`/`border-stone`/`text-stone`.
6. **D, E.3, G** (accents de module, badges inline restants, boutons sémantiques) — finition.
7. **H** — vérifier qu'on n'a rien cassé des voiles/canvas.

### Vérification finale
```
grep -rn "bg-stone-800\|bg-stone-900" app/        # ne doit rester que le canvas manuscrit
grep -rn "border-green-200\|border-amber-200\|border-violet-200" app/eleve/page.tsx  # → vide
grep -rn "bg-stone-800" components/               # → vide
```
Puis ouvrir : un module élève (boutons = pigment), le tableau de bord élève (liserés = pigment),
un module prof, et une page prof générale (boutons = sépia). Comparer aux maquettes du handoff
(`references/Maquettes Palimpseste.dc.html`).

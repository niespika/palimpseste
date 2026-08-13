# Note pour une session Mètis — deux correctifs techniques laissés par C8

*(Écrit à la clôture de C8·L3, le 13/08/2026. Ce sont les deux réserves **techniques** que le
chantier C8 laisse derrière lui : aucune des deux n'appelle d'arbitrage pédagogique — celui-là part
chez Fable, voir `ARBITRAGE_Fable_C8_item4_Expression.md`. Les deux sont constatées, pas supposées.)*

## 1. Le parcours de l'élève n'est pas scopé au semestre

**Le fait.** `app/eleve/modules/fragments-erudition/page.tsx:295` charge les semaines du graphique
« Ton parcours » par `admin.from('fragments_semaines').select('id, numero').order('numero')` —
**sans filtre de semestre ni de vacances**. Toutes les semaines de tous les semestres entrent donc
dans l'axe, et dans le dénominateur des statistiques.

**Ce que l'élève voit.** Constaté en sandbox le 13/08, sur un compte élève réel : l'axe affiche
« S1 S1 S2 S2 S3 S3 S4 S4 S5 S5 S6 S7 S8… » (les deux semestres superposés) et la tuile « Taux de
dépôt » annonce **5 %** là où la valeur juste est **20 %** (1 dépôt sur les 5 semaines du semestre
courant, mais divisé par les 20 semaines stockées). Le calcul fautif est en l. 362-363 puis
l. 441.

**Le correctif.** Filtrer sur le semestre actif **et** sur `is_vacation = false`, comme le font déjà
la vue prof (`suivi/page.tsx`), `panoptique-serveur.ts` et `utils/synthese-semestre.ts:131` — cette
dernière ayant reçu exactement ce correctif en C8·L2 (test C8L3/C8L2-8, preuve directe : le taux
d'un élève passait de 20 % à 25 % selon qu'une semaine était en vacances ou non). Le semestre actif
se lit déjà quelques lignes plus haut dans la même page (`semCourant`).

**Pourquoi ça presse un peu.** C'est invisible tant qu'il n'existe qu'un semestre dans la base.
Ça devient faux pour **tous les élèves** au deuxième semestre de l'année — et le taux de dépôt est
précisément le chiffre qu'un élève regarde.

**À faire dans la même passe (même fichier, coût nul).** Deux requêtes sont exécutées puis jamais
lues : `pistesEnAttente` (l. 326) et `mesPresen` (l. 389) — deux allers-retours base par affichage,
pour rien. Ce sont les deux avertissements eslint du dépôt. Soit on les retire, soit on rebranche
les pistes en attente, qui avaient probablement un usage prévu.

## 2. Fragments n'alimente pas `api_couts` — la tuile « Coût API » ne le verra jamais

**Le fait.** Aucun appel à `enregistrerCoutApi()` n'existe dans **toute** la chaîne Fragments :
`utils/analyse.ts`, `utils/analyse-orale.ts`, `utils/analyse-essai.ts`,
`utils/synthese-semestre.ts`, `utils/transcription.ts` — **0 occurrence**, revérifié le 13/08 à la
clôture de L3. Les seuls contributeurs de `api_couts` sont Scriptorium/RAG, Quazian et Aletheia.

**Ce qui existe déjà, et qui rend le correctif court.** Fragments écrit bien son coût, mais dans sa
propre colonne : `utils/analyse.ts:264` pose `cout_api` sur `fragments_analyses` (mesuré à 0,028 $
sur un vrai dépôt le 13/08). Il manque uniquement la ligne de journal partagée. L'attribution
demandée par C11a (élève **et** classe) est disponible sur place au moment de l'écriture.

**Deux voies, à choisir en session.**
- un `enregistrerCoutApi('fragments', …)` **à côté** de chaque écriture de `cout_api` (convention
  des autres modules — c'est la voie recommandée par la note d'origine) ;
- ou faire lire à la tuile les colonnes de coût propres à Fragments (moins de code, mais la tuile
  cesse d'avoir une source unique).

**Deux angles morts à traiter en même temps.** (a) l'analyse **orale** ne suit son coût nulle part —
ni colonne `cout_api` sur `fragments_analyses_orales` (la table ne l'a pas), ni ligne `api_couts` ;
la transcription Groq Whisper non plus. (b) **Codex est probablement dans le même cas** : à vérifier
dans la même passe.

**Ce qui se referme avec ce correctif.** Le test **C11a-8 (part Fragments)** de
`SUIVI_tests_manuels.md`, ouvert depuis juillet, décoché à trois reprises (C11a, C8·L1, C8·L3) pour
cette seule raison. Recette : un dépôt élève analysé → une ligne `fragments` dans `api_couts`, avec
`eleve_id` et `classe_id` renseignés → la tuile « Coût API » de `/prof` montre Fragments. Le critère
« fait » de C11a (« chaque module apparaît dans la tuile ») en dépend.

---

*Les autres découvertes de C8 hors périmètre sont dans `IDEES_post_rentree.md` (elles ne sont pas
des correctifs mais des choix à instruire : rubrique et barème redondants, `{{echelle_lettres}}` mort,
`modifie_par_prof` jamais lue, `titre` de semaine jamais écrit, date limite non éditable…).*

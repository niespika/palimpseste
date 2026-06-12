# Spécifications — Étape 5 : Évaluation des présentations orales (module Fragments d'érudition)

## 1. Contexte

Les étapes 1 à 4 sont en production : dépôts manuscrits photographiés, analyses IA avec mémoire (notes, retours, pistes individualisées), validation prof, graphiques de suivi, et tirage au sort hebdomadaire de l'orateur (table `fragments_presentations`). Lis `ARCHITECTURE.md` et les spécifications précédentes avant de commencer.

Cette étape 5 ajoute le second versant du dispositif : chaque semaine, l'élève tiré au sort fait une présentation orale de 3-4 minutes devant la classe. Le professeur l'enregistre (audio), et l'IA produit une évaluation qui **recoupe la présentation avec le dossier écrit de l'élève** : ses fragments des semaines passées, les retours qu'il a reçus, les pistes qui lui ont été proposées.

### Ce que l'IA doit évaluer (le cœur de l'étape)
1. **Prise en compte des retours** : l'élève a-t-il intégré dans sa présentation les remarques et corrections reçues sur ses fragments écrits (erreurs de contenu corrigées, approximations levées) ?
2. **Suivi des pistes** : la présentation mobilise-t-elle des pistes qui lui avaient été suggérées ?
3. **Complétude** : au vu de tout ce que l'élève a écrit dans ses fragments, la présentation restitue-t-elle l'essentiel ? Qu'a-t-il laissé de côté d'important ? A-t-il au contraire apporté du neuf ?
4. **Qualités orales mesurables sur transcription** : structure (annonce, développement, conclusion), clarté, durée, débit, tics de langage.

L'IA ne juge PAS : la gestuelle, le regard, la posture — l'enregistrement est audio et ces dimensions restent l'affaire du professeur en classe.

## 2. Architecture technique : transcription puis analyse

L'API Claude (Messages) n'accepte pas l'audio en entrée. Pipeline en deux temps, entièrement côté serveur :

1. **Transcription** : l'audio est envoyé à l'API Whisper d'OpenAI (`whisper-1`, langue `fr`), qui renvoie la transcription avec horodatage. Nouvelle variable d'environnement serveur : `OPENAI_API_KEY`. (Si tu identifies au moment de l'implémentation une alternative de qualité équivalente en français et moins chère — par ex. Whisper via Groq — propose-la-moi, mais OpenAI Whisper est la valeur sûre.)
2. **Analyse** : la transcription + le dossier complet de l'élève (voir 5.2) sont envoyés à Claude avec le prompt d'évaluation orale (annexe A), réponse en JSON strict, comme à l'étape 3.

Calculer à partir de la transcription : durée totale, nombre de mots, débit (mots/minute).

## 3. Enregistrement et données

### 3.1 Qui enregistre : le professeur
L'enregistrement se fait depuis **l'interface prof**, en classe, sur téléphone. Sur la fiche de la présentation tirée au sort (étape 4) :
- bouton « Enregistrer la présentation » : enregistrement direct dans le navigateur (MediaRecorder), avec chronomètre visible, pause, reprise, et arrêt ;
- alternative : « Importer un fichier audio » (m4a, mp3, webm, wav) si j'ai enregistré avec l'application dictaphone du téléphone ;
- limite : 10 minutes / 25 Mo (Whisper accepte jusqu'à 25 Mo) ; compression côté client si nécessaire.

### 3.2 Nouvelle table `fragments_oraux`
- `id` (uuid)
- `presentation_id` (uuid → fragments_presentations, unique)
- `eleve_id` (uuid → profiles)
- `storage_path` (texte, nullable — chemin de l'audio dans un bucket privé `oraux`)
- `transcription` (texte)
- `duree_secondes` (entier), `nb_mots` (entier), `debit_mots_minute` (numérique)
- `statut` (enum : `enregistre` | `transcrit` | `analyse` | `publie` | `erreur`)
- `audio_supprime` (booléen — voir 3.3)
- `created_at`, `updated_at`

### `fragments_analyses_orales`
- `id` (uuid), `oral_id` (uuid → fragments_oraux, unique)
- `retour_integration` (texte — prise en compte des retours écrits passés)
- `retour_pistes` (texte — pistes mobilisées ou non)
- `retour_completude` (texte — ce qui a été bien restitué, ce qui manque, ce qui est neuf)
- `retour_oral` (texte — structure, clarté, débit, tics)
- `commentaire_general` (texte)
- `note_contenu`, `note_structure`, `note_expression` (entiers 0–4, même barème que l'écrit)
- `notes_prof` (texte, optionnel), `modifie_par_prof` (booléen)
- `created_at`, `updated_at`, `publiee_at`

RLS identiques à l'étape 3 : le prof voit tout ; l'élève ne voit que ses analyses publiées. **L'audio n'est jamais accessible aux autres élèves.**

### 3.3 Protection des données : voix d'élèves mineurs
La voix d'un mineur est une donnée plus sensible qu'une copie manuscrite. Mesures :
- bucket `oraux` strictement privé, URL signées de courte durée ;
- **suppression de l'audio après validation** : à la publication de l'analyse, proposer (case cochée par défaut) la suppression définitive du fichier audio — la transcription, elle, est conservée. Le champ `audio_supprime` en garde trace. Option dans les paramètres du module : « Toujours supprimer l'audio à la publication ».
- l'élève concerné peut réécouter son propre enregistrement tant qu'il existe ; personne d'autre que lui et le prof, jamais.

(Note pour moi, hors code : vérifier auprès de l'école le cadre de consentement pour l'enregistrement audio des élèves — affichage en classe, information aux parents. À régler avant la première utilisation réelle.)

## 4. Workflow

1. Le tirage au sort désigne l'orateur (étape 4, inchangée).
2. En classe, j'enregistre la présentation depuis ma fiche de présentation, sur téléphone.
3. À l'envoi : transcription automatique, puis analyse automatique (statuts successifs visibles). Boutons « Relancer la transcription » / « Relancer l'analyse » en cas d'erreur ; garde-fou de 3 analyses par oral et par jour.
4. Même circuit de validation qu'à l'étape 3 : je relis (transcription consultable, audio réécoutable), je modifie ce que je veux, j'ajoute une note personnelle, je publie. Rien n'atteint l'élève sans publication.
5. À la publication : proposition de suppression de l'audio (3.3), et le statut de la présentation passe à `presente` si ce n'est pas déjà fait.

## 5. Le contexte envoyé à l'IA (différent de l'étape 3)

Pour évaluer le recoupement, l'analyse orale reçoit un dossier plus complet que l'analyse écrite :
- thème et description du thème ;
- la transcription de l'oral (avec durée, nb de mots, débit) ;
- les transcriptions **intégrales** des 5 derniers fragments écrits publiés (c'est l'objet même de l'évaluation de complétude ; tronquer à ~2500 caractères chacune au besoin) ;
- pour les fragments plus anciens : seulement les commentaires généraux ;
- tous les `retour_contenu` passés (les erreurs et approximations qui avaient été signalées — pour vérifier si elles sont corrigées à l'oral) ;
- toutes les pistes avec leurs statuts ;
- le tableau complet des notes écrites.

## 6. Interfaces

### 6.1 Prof
- Sur la fiche de présentation : enregistreur/import, lecteur audio, transcription, analyse éditable (mêmes composants que l'écran de validation de l'étape 3, adaptés).
- Sur la fiche élève : les analyses orales publiées rejoignent l'historique, signalées par une icône distincte ; les trois notes orales apparaissent dans le graphique de progression sous forme de points distincts (pas de courbe — il n'y a qu'une ou deux présentations par élève et par an).

### 6.2 Élève
- Dans son historique, la semaine où il a présenté : « Ta présentation orale » avec ses trois notes, le retour dans l'ordre (commentaire général → intégration des retours → pistes mobilisées → complétude → qualités orales), la note du prof, la transcription repliée, et son audio réécoutable s'il n'a pas été supprimé.

## 7. Hors périmètre
- Vidéo (audio seulement).
- Enregistrement par les élèves eux-mêmes (seul le prof enregistre).
- Évaluation de la gestuelle, du regard, de la posture.
- Notification aux parents, partage externe.

## 8. Critères d'acceptation

1. Depuis mon téléphone, sur la fiche d'une présentation tirée, j'enregistre 3 minutes de parole en français ; en moins de 3 minutes après l'envoi, la transcription est disponible et fidèle, avec durée et débit calculés.
2. L'import d'un fichier m4a enregistré avec le dictaphone du téléphone fonctionne aussi.
3. L'analyse générée fait explicitement référence au contenu des fragments écrits de l'élève de test (test à faire avec un élève ayant au moins 3 fragments publiés) : elle cite ce qui a été restitué, ce qui manque, et se prononce sur au moins une piste passée.
4. Je modifie l'analyse, je publie : l'élève voit la version modifiée ; l'audio est supprimé si la case était cochée (`audio_supprime = true`, fichier réellement absent du bucket).
5. Un autre élève ne peut accéder ni à l'audio, ni à la transcription, ni à l'analyse (manipulation d'URL).
6. Les notes orales apparaissent en points distincts sur le graphique de progression, et l'export CSV de l'étape 4 inclut une ligne pour l'oral.
7. Les deux clés API (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) sont absentes du repo et du code navigateur.
8. `ARCHITECTURE.md` est à jour (pipeline transcription → analyse, bucket `oraux`, politique de suppression audio).

## 9. Méthode de travail
Comme toujours : plan d'abord, petites étapes, explications simples. Indique-moi comment créer la clé OpenAI et où la mettre dans Vercel. Guide final : enregistrer en classe, valider, publier, supprimer l'audio.

---

# Annexe A — Prompt d'évaluation orale (valeur par défaut, stocké dans `fragments_config.prompt_evaluation_orale`, éditable depuis l'interface comme celui de l'écrit)

```
Tu es l'assistant pédagogique d'un professeur de philosophie et d'humanités dans un lycée français. Un élève vient de faire une présentation orale de 3-4 minutes devant sa classe, sur le thème annuel qu'il travaille chaque semaine dans ses « fragments d'érudition » écrits. Tu disposes de la transcription de sa présentation ET de son dossier écrit complet. Ta valeur ajoutée est précisément ce recoupement : tu as tout le dossier sous les yeux.

## L'élève
- Thème annuel : {{theme}} — {{description_theme}}
- Présentation de la semaine n° {{numero_semaine}}
- Durée : {{duree}} ; nombre de mots : {{nb_mots}} ; débit : {{debit}} mots/minute (repères : une présentation de 3-4 min fait environ 400-600 mots ; un débit confortable se situe entre 120 et 160 mots/minute)

## Transcription de la présentation
{{transcription_orale}}
(C'est de l'oral transcrit automatiquement : ne sanctionne pas la ponctuation ni les éventuelles erreurs de transcription ; en cas de passage incohérent, envisage d'abord une erreur de transcription.)

## Dossier écrit de l'élève
{{dossier}}
(Transcriptions de ses derniers fragments, retours sur le contenu qui lui ont été faits, pistes proposées avec leurs statuts, notes.)

## Tes tâches — tu t'adresses à l'élève en le tutoyant, ton bienveillant et exigeant

### 1. INTÉGRATION DES RETOURS (retour_integration)
Parcours les corrections et signalements d'erreurs faits sur ses fragments écrits (sections « retour_contenu » du dossier). À l'oral, l'élève a-t-il corrigé ces erreurs et levé ces approximations, ou les a-t-il répétées ? Sois précis : cite l'erreur d'origine et ce qu'il en a fait. S'il n'y avait rien à corriger, dis-le simplement.

### 2. PISTES MOBILISÉES (retour_pistes)
Parmi les pistes qui lui ont été proposées au fil des semaines, lesquelles nourrissent sa présentation ? Lesquelles, marquées « suivies » dans ses écrits, sont étrangement absentes de l'oral ? Valorise explicitement toute piste mobilisée.

### 3. COMPLÉTUDE (retour_completude)
Au vu de tout ce qu'il a écrit dans ses fragments : la présentation restitue-t-elle l'essentiel de son année de recherche ? Nomme 1) ce qu'il a bien choisi de mettre en avant, 2) ce qu'il a laissé de côté alors que c'était fort dans ses écrits (sois spécifique : « tu n'as pas parlé de X, que tu avais pourtant développé en semaine 4 »), 3) ce qu'il a apporté de neuf par rapport à ses écrits, le cas échéant — c'est un mérite à souligner.

### 4. QUALITÉS ORALES (retour_oral)
Uniquement ce qui se juge sur transcription : la structure (y a-t-il une annonce, un fil, une conclusion, ou est-ce une juxtaposition ?), la clarté des phrases, la durée et le débit par rapport aux repères, les tics de langage récurrents (compte-les : « du coup » × 9). Ne dis RIEN de la voix, de la gestuelle ou de l'aisance : tu ne les connais pas.

### 5. NOTES (0-4, barème : {{bareme}})
- note_contenu : richesse et justesse de ce qui est présenté, au regard du dossier ;
- note_structure : organisation du propos ;
- note_expression : clarté de la langue orale (phrases, vocabulaire, débit), en tenant compte de ce qu'est l'oral.

### 6. COMMENTAIRE GÉNÉRAL (commentaire_general)
3 à 5 phrases : le geste d'ensemble de la présentation, le principal mérite, le principal axe de progrès. C'est un moment important pour l'élève — il est passé devant la classe : commence par reconnaître ce qui a été réussi.

## Format de réponse
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après :
{
  "retour_integration": "...",
  "retour_pistes": "...",
  "retour_completude": "...",
  "retour_oral": "...",
  "notes": { "contenu": 0-4, "structure": 0-4, "expression": 0-4 },
  "commentaire_general": "..."
}
```

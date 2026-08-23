# -*- coding: utf-8 -*-
"""derive-instruments.py — ce que la chaîne froide EXÉCUTE, dérivé de ses sources.

    « Les prompts vivent dans la fiche, qui fait foi pour leur texte ; ce que la
      chaîne exécute en est DÉRIVÉ — comme les fichiers du banc. Jamais une copie
      tapée à la main, et un contrôle qui sait dire quand ton dérivé a divergé. »
                                   — PROMPT_Code_C4_L5.md, piège 52 ; `03-` §1

    « Le fichier que la chaîne exécute est DÉRIVÉ du gabarit du §4 et ne s'édite
      jamais de son côté. »                            — piège 31 ; `07-` §4

RIEN N'EST ÉCRIT EN DUR ICI. Le gabarit de la couche contrat vit au
`07-Implementation.md` §4, entre ses deux marqueurs ; le prompt d'extraction du
Monitoring et son bloc machine vivent à `competences/monitoring.md` §7, entre ses
marqueurs à elle ; les instruments des six compétences vivent à leurs fiches ;
le PROMPT DE TRANSCRIPTION vit à `copies-tests/PROMPT_transcription_copies_tests.md`.
Ce script les LIT et les verse dans `utils/chaine/derive/`.

⭐ AJOUT C4-L4 — LE PROMPT DE TRANSCRIPTION. « Le prompt se conserve TEL QUEL, et
le fichier que l'application exécute en est une COPIE — il ne s'édite jamais de
son côté » (`06-` §4). Il n'est PAS un document du corpus : il ne porte ni ligne
VERSION ni ligne Statut, et `entete()` ne s'y applique donc pas — il fait foi
tel quel, et son EMPREINTE tient lieu de version. Il est découpé en trois parts,
parce que le manifeste de C4-L4 les distingue : « le corps de ses règles se
conserve tel quel, son ÉNONCÉ D'USAGE et sa RÈGLE D'ANONYMISATION se règlent
avant la première passation ». Le découpage ne DÉCIDE de rien — il NOMME les
deux parts ouvertes pour que la décision, le jour où elle tombe, se fasse dans
la source et se re-dérive d'un geste.

LA CLAUSE GRANULAIRE EST APPLIQUÉE ICI, ET NULLE PART AILLEURS.
Une fiche dont l'en-tête ne porte pas *relu et validé* NE SE LIT PAS : aucun
instrument n'est dérivé pour elle, et sa compétence reste hors de la chaîne
(`07-` §2). `competences/monitoring.md` est au statut PLAFOND qu'elle déclare —
*relue et validée*, pas de banc : son étage se dérive au même seuil.

⭐ C4-L10 — LE SEUIL EST *RELU ET VALIDÉ*, ET IL L'EST PAR ALIGNEMENT SUR LES
SOURCES. Il valait *versé et bancé* depuis C4-L5, et ce durcissement n'avait
AUCUNE source : le `03-` §9 écrit que les trois conditions de banc « ne sont
gardées par aucun mécanisme […] c'est le professeur qui les vérifie avant de
poser `evaluee` », et le `01-` §3 que « c'est le professeur qui choisit, sans
automatisme — sauf le plancher : une compétence dont la fiche n'est pas déposée
est `differee` ». Le seuil de banc n'existait que comme EXIGENCE D'UN LOT — la
ligne de manifeste de C4-L5 au `07-` §2 —, que ce script avait durcie en code.
Un contrôle plus strict que sa source refuse du licite, et il le refuse EN
SILENCE : les six fiches, toutes *relues et validées*, restaient illisibles.

⚠️ CE QUI NE BOUGE PAS, ET C'EST LE CONTRÔLE DE NON-RÉGRESSION DU GESTE : les
DEUX PLANCHERS MÉCANIQUES du `03-` §9. Une fiche ABSENTE ou seulement DÉPOSÉE
reste hors de la chaîne (ci-dessous, et `01-` §3 : `differee` et rien d'autre) ;
et la correspondance observable → formulation non uploadée tient sa compétence
non déclarable `evaluee` (C4-L8, `competences/monitoring.md` §4). Ni l'un ni
l'autre n'est à ce script de les lever.

⛔ ET LES EN-TÊTES DES SIX FICHES NE SONT PAS TOUCHÉES. Écrire « VERSÉE ET
BANCÉE » dans six sources qui font foi affirmerait qu'un banc a eu lieu, quand
chaque fiche porte en plus une phrase de prose qui dit le contraire. Le seuil
descend ici, une fois ; les sources ne mentent pas.

CITE OU REFUSE. Un marqueur absent, un bloc sans clôture, un YAML hors du
sous-ensemble lu : le script S'ARRÊTE au lieu de deviner. Une source qui bouge
fait tomber le contrôle, jamais mentir le dérivé.

USAGE
    python3 scripts/derive-instruments.py --resume    # ce qui a été lu, sans écrire
    python3 scripts/derive-instruments.py --ecris     # écrit les dérivés
    python3 scripts/derive-instruments.py --verifie   # n'écrit rien, dit IDENTIQUE/DIVERGE

    --racine  le dépôt de conception (défaut : le chemin absolu du manifeste)

CODES DE SORTIE : 0 = lu (et, en --verifie, identique) · 1 = source mouvante,
absente, ou dérivé divergent · 2 = erreur d'usage.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import sys

# ⚠️ Le chemin du dépôt de conception est ABSOLU, et c'est délibéré (le dépôt
# n'est pas un sous-dossier de celui-ci). Mais il ne peut pas être le SEUL :
# ailleurs que sur la machine du professeur, aucune commande ne trouvait la
# source, et le contrôle SAUTAIT au lieu de tourner (C4-L11). La variable
# d'environnement `PALIMPSESTE_RACINE_CONCEPTION` déclare la racine CANONIQUE ;
# à défaut, le chemin du professeur tient lieu de défaut, comme avant.
# ⭐ C'est bien la racine CANONIQUE, pas un simple défaut : c'est elle que le
#    refus d'`--ecris` (plus bas) compare. Un `--racine <essai>` reste refusé —
#    « une seule commande d'essai réécrivait les dérivés DE PRODUCTION ». Ce que
#    la variable permet, c'est de déclarer où vit la source sur CETTE machine,
#    en un geste explicite ; elle ne relâche pas le refus.
RACINE_CONCEPTION = (os.environ.get("PALIMPSESTE_RACINE_CONCEPTION")
                     or "/Users/louissagnieres/Documents/GitTest/palimpseste-conception")
RACINE_CODE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE_CODE, "utils", "chaine", "derive")
OUTIL = "scripts/derive-instruments.py 1.0"

# Les six du `07-` §1.2 — identifiants NUS, sans préfixe, dans l'ordre du §1.2.
LES_SIX = ("expression", "argumentation", "structure",
           "connaissance", "synthese", "questionnement")

# `07-` §4 — le gabarit de la couche contrat, entre ses deux marqueurs.
MARQ_CALAME = ("<!-- DEBUT-PROMPT-CALAME-RETOUR -->", "<!-- FIN-PROMPT-CALAME-RETOUR -->")
# `03-` §1 — le bloc machine, entre ses deux marqueurs, sur TOUTES les fiches.
MARQ_CONFIG = ("<!-- DEBUT-CONFIG -->", "<!-- FIN-CONFIG -->")

# `07-` §4 — « `{{...}}` ne désigne que ce que l'assembleur substitue :
# {{COMPETENCE}}, {{MOMENT}} et {{REGISTRE}}. Il n'y en a pas d'autres. »
VARIABLES_CALAME = ("COMPETENCE", "MOMENT", "REGISTRE")
# `07-` §4 — « Deux sont éditables : le `ton` et la `longueur`. »
SECTIONS_EDITABLES_CALAME = ("ton", "longueur")

# `03-` §1 — le vocabulaire de `observables_mesure`, mot pour mot.
FAMILLES = ("proportion", "densité", "comptage rapporté", "comptage", "binaire", "ordinal")
COMPARATEURS = ("au_moins", "au_plus", "plus_de", "moins_de", "vaut", "sans_objet")


class SourceMouvante(Exception):
    """Une source a bougé, ou n'est pas là : on s'arrête, on ne devine pas."""


# ---------------------------------------------------------------------------
# Le statut d'un fichier — `07-` §2, les trois degrés cumulatifs
# ---------------------------------------------------------------------------

# `07-` §2 : « déposé » → « relu et validé » → « versé et bancé », cumulatifs ;
# « VALIDÉ ET GELÉ » vaut *relu et validé*.
DEPOSE, RELU, BANCE = 1, 2, 3


def _sans_accents(s):
    remplace = {"é": "e", "è": "e", "ê": "e", "ë": "e", "à": "a", "â": "a",
                "î": "i", "ï": "i", "ô": "o", "ö": "o", "û": "u", "ù": "u",
                "ü": "u", "ç": "c", "É": "e", "È": "e"}
    return "".join(remplace.get(c, c) for c in s)


def degre_du_statut(statut):
    """Le degré d'un statut d'en-tête. 0 = inconnu, on ne présume rien."""
    s = _sans_accents((statut or "").lower())
    # ⚠️ LA NÉGATION SE LIT EN PREMIER. « PAS ENCORE VERSÉE ET BANCÉE » contient
    #    « versée et bancée » : sans cette garde, la formule même que les six
    #    fiches emploient pour dire qu'elles NE le sont pas les ouvrait toutes.
    if re.search(r"\b(pas|non|jamais|sans|avant|attente|encore)\b", s):
        return 0
    if re.search(r"vers\w* et banc\w*", s):
        return BANCE
    if re.search(r"relu\w* et valid\w*", s) or re.search(r"valid\w* et gel\w*", s):
        return RELU
    if re.search(r"depos\w*", s):
        return DEPOSE
    return 0


def entete(texte, chemin):
    """(version, statut) lus À L'EN-TÊTE. Le statut est le premier gras de sa ligne.

    Même lecture que `utils/fabrique/fiche-competence.ts` — « le statut est le
    premier segment en gras de la ligne ; ce qui suit est le commentaire ». Une
    fiche dit d'elle-même, en prose, qu'elle « n'est pas encore versée et bancée » :
    chercher ces mots dans la ligne entière rendrait le contraire de ce qu'elle dit.
    """
    mv = re.search(r"^\s*\*\*VERSION\s+([0-9]+(?:\.[0-9]+)*)\.?\*\*", texte, re.M)
    if not mv:
        raise SourceMouvante("%s : pas de ligne VERSION en tête (`03-` §2)." % chemin)
    ms = re.search(r"^\s*\*\*Statut\*\*\s*:\s*(.+)$", texte, re.M)
    if not ms:
        raise SourceMouvante("%s : pas de ligne Statut en tête (`07-` §2)." % chemin)
    gras = re.search(r"\*\*(.+?)\*\*", ms.group(1))
    if not gras:
        # ⚠️ AUCUN REPLI ICI. Prendre la ligne entière faute de gras était une
        #    PORTE OUVERTE : les six fiches disent dans cette même ligne qu'elles
        #    « ne sont pas encore versées et bancées », et `degre_du_statut` y
        #    lisait alors le degré le plus haut. On ne devine pas un statut.
        raise SourceMouvante(
            "%s : la ligne Statut ne porte pas son statut EN GRAS — on ne le devine pas "
            "(le statut est le premier segment en gras de sa ligne)." % chemin)
    statut = re.sub(r"\s+", " ", gras.group(1).replace("*", "").replace("`", "")).strip()
    return mv.group(1), statut


# ---------------------------------------------------------------------------
# Les blocs — marqueurs, clôtures, empreintes
# ---------------------------------------------------------------------------

def lire(chemin):
    if not os.path.exists(chemin):
        raise SourceMouvante("%s : introuvable." % chemin)
    return io.open(chemin, encoding="utf-8").read()


def empreinte(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def entre_marqueurs(texte, marqueurs, chemin):
    debut, fin = marqueurs
    if debut not in texte or fin not in texte:
        raise SourceMouvante("%s : marqueurs %s / %s absents." % (chemin, debut, fin))
    i = texte.index(debut) + len(debut)
    j = texte.index(fin, i)
    return texte[i:j]


def bloc_clos(brut, chemin, langue=None):
    """Le contenu d'UN bloc ``` … ``` — refusé s'il n'est pas clos, ou s'il y en
    a deux. Compter les clôtures d'abord : sans ce compte, un second bloc était
    ignoré SANS UN MOT, et un bloc non clos suivi d'un autre empruntait la
    clôture du voisin — le script disait avoir lu ce qu'il n'avait pas lu."""
    fences = brut.count("```")
    if fences == 0:
        raise SourceMouvante("%s : aucun bloc ``` entre les marqueurs." % chemin)
    if fences % 2:
        raise SourceMouvante("%s : bloc sans clôture ```%s." % (chemin, langue or ""))
    if fences > 2:
        raise SourceMouvante(
            "%s : %d blocs entre les marqueurs — on n'en choisit pas un en silence."
            % (chemin, fences // 2))
    motif = r"```%s[ \t]*\n(.*?)\n```" % (langue or r"[a-z]*")
    m = re.search(motif, brut, re.S)
    if not m:
        raise SourceMouvante("%s : bloc sans clôture ```%s." % (chemin, langue or ""))
    return m.group(1)


# ---------------------------------------------------------------------------
# Un YAML de sous-ensemble, STRICT — il refuse ce qu'il ne sait pas lire
# ---------------------------------------------------------------------------
# Le bloc machine des fiches est un YAML simple : des mappings de blocs, des
# listes de blocs, des listes en ligne, des scalaires. Ce lecteur-ci ne connaît
# QUE cela ; tout le reste (ancres, alias, tags, documents multiples, scalaires
# repliés) lève. Un lecteur qui devine vaudrait moins qu'un lecteur qui s'arrête.

class YamlRefuse(SourceMouvante):
    pass


def _scalaire(brut):
    t = brut.strip()
    if t == "" or t == "~" or t == "null":
        return None
    if len(t) >= 2 and t[0] == t[-1] and t[0] in "'\"":
        return t[1:-1]
    if t == "{}":
        return {}
    if t == "[]":
        return []
    if t.startswith("[") and t.endswith("]"):
        return [_scalaire(x) for x in _decoupe_flow(t[1:-1])]
    if t.startswith("{") and t.endswith("}"):
        d = {}
        for morceau in _decoupe_flow(t[1:-1]):
            if ":" not in morceau:
                raise YamlRefuse("map en ligne illisible : %r" % t)
            k, v = morceau.split(":", 1)
            d[_scalaire(k)] = _scalaire(v)
        return d
    if t in ("true", "True", "yes"):
        return True
    if t in ("false", "False", "no"):
        return False
    if re.fullmatch(r"-?\d+", t):
        return int(t)
    if re.fullmatch(r"-?\d+\.\d+", t):
        return float(t)
    if t.startswith(("&", "*", "!", "|", ">")):
        raise YamlRefuse("syntaxe YAML non lue : %r" % t)
    return t


def _decoupe_flow(corps):
    """Découpe « a, b, [c, d] » en respectant crochets, accolades et guillemets."""
    morceaux, prof, cour, quote = [], 0, "", None
    for c in corps:
        if quote:
            cour += c
            if c == quote:
                quote = None
            continue
        if c in "'\"":
            quote = c
            cour += c
        elif c in "[{":
            prof += 1
            cour += c
        elif c in "]}":
            prof -= 1
            cour += c
        elif c == "," and prof == 0:
            morceaux.append(cour)
            cour = ""
        else:
            cour += c
    if cour.strip():
        morceaux.append(cour)
    return [m for m in (x.strip() for x in morceaux) if m != ""]


def _sans_commentaire(ligne):
    """Retire le commentaire `#` — HORS GUILLEMETS. Une valeur citée qui porte un
    « # » était tronquée en silence, et `verifie-seuils.py` (pyyaml) lisait alors
    une autre phrase que nous sur la même fiche."""
    quote = None
    for i, c in enumerate(ligne):
        if quote:
            if c == quote:
                quote = None
            continue
        if c in "'\"":
            quote = c
        elif c == "#" and (i == 0 or ligne[i - 1] in " \t"):
            return ligne[:i]
    return ligne


def _lignes_utiles(texte):
    brutes = []
    for brut in texte.split("\n"):
        sans_commentaire = _sans_commentaire(brut)
        if not sans_commentaire.strip():
            continue
        if sans_commentaire.strip() in ("---", "..."):
            raise YamlRefuse("document YAML multiple — non lu.")
        # Le préfixe blanc RÉEL — `lstrip(" ")` s'arrêtait au premier non-espace,
        # si bien que la tranche examinée ne contenait jamais la tabulation
        # cherchée : le garde-fou était du code mort, et une ligne tabulée voyait
        # ses champs hissés à la racine du document.
        blanc = re.match(r"[ \t]*", sans_commentaire).group(0)
        if "\t" in blanc:
            raise YamlRefuse("tabulation en indentation — non lue.")
        brutes.append((len(blanc), sans_commentaire.strip()))
    return _recoller(brutes)


def _ouvert(fragment):
    """Une liste ou une map EN LIGNE reste-t-elle ouverte à la fin du fragment ?"""
    prof, quote = 0, None
    for c in fragment:
        if quote:
            if c == quote:
                quote = None
            continue
        if c in "'\"":
            quote = c
        elif c in "[{":
            prof += 1
        elif c in "]}":
            prof -= 1
    return prof > 0


def _recoller(brutes):
    """Recolle les CONTINUATIONS — une liste en ligne repliée sur plusieurs
    lignes, ou un scalaire replié. `competences/expression.md` en porte cinq, et
    le lecteur les refusait : il condamnait l'Expression, et avec elle toute la
    dérivation (une seule fiche malade faisait tomber `assemble()` en entier)."""
    out = []
    for indent, corps in brutes:
        if out:
            indent_prec, corps_prec = out[-1]
            suite_de_flow = _ouvert(corps_prec)
            suite_de_scalaire = (
                indent > indent_prec
                and not re.match(r"^(\"[^\"]*\"|'[^']*'|[^:]+?)\s*:", corps)
                and not corps.startswith("- "))
            if suite_de_flow or suite_de_scalaire:
                out[-1] = (indent_prec, corps_prec + " " + corps)
                continue
        out.append((indent, corps))
    return out


def yaml_strict(texte):
    lignes = _lignes_utiles(texte)
    valeur, reste = _bloc(lignes, 0)
    if reste:
        raise YamlRefuse("reste illisible à partir de %r" % (reste[0][1],))
    return valeur if valeur is not None else {}


def _bloc(lignes, indent_mini):
    if not lignes:
        return None, []
    if lignes[0][1].startswith("- "):
        return _liste(lignes, lignes[0][0])
    return _map(lignes, lignes[0][0])


def _map(lignes, indent):
    d, i = {}, 0
    while i < len(lignes):
        ind, corps = lignes[i]
        if ind < indent:
            break
        if ind > indent:
            raise YamlRefuse("indentation inattendue : %r" % corps)
        if corps.startswith("- "):
            break
        m = re.match(r"^(\"[^\"]*\"|'[^']*'|[^:]+?)\s*:\s*(.*)$", corps)
        if not m:
            raise YamlRefuse("ligne non lue : %r" % corps)
        cle, apres = _scalaire(m.group(1)), m.group(2).strip()
        i += 1
        if apres:
            d[cle] = _scalaire(apres)
            continue
        enfants = []
        while i < len(lignes) and lignes[i][0] > indent:
            enfants.append(lignes[i])
            i += 1
        d[cle] = _bloc(enfants, indent + 1)[0] if enfants else None
    return d, lignes[i:]


def _liste(lignes, indent):
    out, i = [], 0
    while i < len(lignes):
        ind, corps = lignes[i]
        if ind < indent or not corps.startswith("- "):
            break
        if ind > indent:
            raise YamlRefuse("indentation inattendue dans une liste : %r" % corps)
        tete = corps[2:].strip()
        i += 1
        enfants = []
        while i < len(lignes) and lignes[i][0] > indent:
            enfants.append(lignes[i])
            i += 1
        if enfants:
            if ":" in tete:
                # « - clef: valeur » suivi de frères indentés : on les recolle.
                fusion = [(indent + 2, tete)] + enfants
                v, _ = _map(fusion, indent + 2)
                out.append(v)
            else:
                v, _ = _bloc(enfants, indent + 1)
                out.append(v)
        else:
            out.append(_scalaire(tete))
    return out, lignes[i:]


# ---------------------------------------------------------------------------
# Le prompt de transcription — `copies-tests/`, `06-` §4  (C4-L4)
# ---------------------------------------------------------------------------

# `06-` §4 : « Un seul prompt transcrit les copies manuscrites, et il fait foi. »
CHEMIN_TRANSCRIPTION = os.path.join("copies-tests", "PROMPT_transcription_copies_tests.md")


def charge_transcription(racine):
    """Le prompt de transcription, tel quel, et ses TROIS parts.

    ⚠️ AUCUN `entete()` ici, et c'est délibéré : ce fichier n'est pas un document
       du corpus — il ne porte ni VERSION ni Statut, il « fait foi tel quel »
       (manifeste de C4-L4). Son EMPREINTE tient lieu de version : elle bouge si
       et seulement si le texte bouge, ce qui est exactement ce que le contrôle
       doit voir.

    Les trois parts, telles que le manifeste les distingue :
      · `enonce_usage`    — la phrase qui dit à quoi la transcription sert. OUVERTE.
      · `corps`           — le titre, la règle d'or, les règles 1 à 8, le format
                            de réponse, la vérification finale. VERROUILLÉ :
                            « le corps de ses règles se conserve tel quel ».
      · `regle_anonymisation` — la règle 9, marquée « supprimer cette règle si
                            inutile » dans la source elle-même. OUVERTE.

    CITE OU REFUSE : chaque part est cherchée par une ancre du texte. Une ancre
    absente est une source qui a bougé — on s'arrête, on ne devine pas.
    """
    texte = lire(os.path.join(racine, CHEMIN_TRANSCRIPTION))

    # L'énoncé d'usage : la phrase qui contient « servira de copie test », dans
    # le paragraphe d'ouverture. La source la déclare ouverte (`06-` §4 : « le
    # prompt a été rédigé pour le corpus des copies-tests — sa première phrase
    # le dit »).
    m = re.search(r"^(Tu transcris [^\n]*?)$", texte, re.M)
    if not m:
        raise SourceMouvante(
            "%s : le paragraphe d'ouverture (« Tu transcris… ») est introuvable — "
            "c'est lui qui porte l'ÉNONCÉ D'USAGE, l'un des deux réglages ouverts "
            "(`06-` §4)." % CHEMIN_TRANSCRIPTION)
    ouverture = m.group(1)
    if "corpus d'évaluation" not in ouverture:
        raise SourceMouvante(
            "%s : le paragraphe d'ouverture ne porte plus « corpus d'évaluation ». "
            "Si l'énoncé d'usage a été RÉGLÉ, c'est une bonne nouvelle — mais ce "
            "contrôle doit être relu avec lui, pas contourné." % CHEMIN_TRANSCRIPTION)

    # La règle d'anonymisation : la règle 9, que la source marque elle-même
    # « supprimer cette règle si inutile ».
    ma = re.search(r"^9\.\s+\*\*Anonymisation\*\*[^\n]*$", texte, re.M)
    regle_anonymisation = ma.group(0) if ma else None
    if ma and "supprimer cette règle si inutile" not in ma.group(0):
        raise SourceMouvante(
            "%s : la règle 9 ne porte plus sa marque « supprimer cette règle si "
            "inutile » — la source a bougé sur l'un des deux réglages ouverts."
            % CHEMIN_TRANSCRIPTION)

    # Le corps : tout le reste, dans l'ordre du fichier. On ne le recompose pas
    # à la main — on retire les deux parts ouvertes du texte intégral, et ce qui
    # reste EST le corps. Un corps recopié serait une seconde source.
    corps = texte.replace(ouverture, "").replace(
        regle_anonymisation + "\n" if regle_anonymisation else "", "")
    corps = re.sub(r"\n{3,}", "\n\n", corps).strip() + "\n"

    for ancre in ("## Règle d'or", "## Règles de transcription", "## Format de réponse",
                  "## Vérification finale avant de répondre"):
        if ancre not in corps:
            raise SourceMouvante(
                "%s : la section « %s » a disparu du corps — « le corps de ses "
                "règles se conserve tel quel »." % (CHEMIN_TRANSCRIPTION, ancre))

    return {
        "source": CHEMIN_TRANSCRIPTION,
        # Pas de version : ce fichier n'en porte pas. L'empreinte tient lieu.
        "empreinte_source": empreinte(texte),
        "octets": len(texte.encode("utf-8")),
        "texte_integral": texte,
        # ⚠️ OUVERT — se règle avant la première passation (`06-` §4). Servi TEL
        #    QUEL tant que la décision n'est pas prise : une session Code ne
        #    décide pas d'un texte de source.
        "enonce_usage": ouverture,
        "enonce_usage_regle": False,
        # VERROUILLÉ — « le corps de ses règles se conserve tel quel ».
        "corps": corps,
        # ⚠️ OUVERT — la source la marque « supprimer cette règle si inutile ».
        "regle_anonymisation": regle_anonymisation,
        "regle_anonymisation_reglee": False,
    }


# ---------------------------------------------------------------------------
# Le gabarit de la couche contrat — `07-` §4
# ---------------------------------------------------------------------------

# Les règles VERROUILLÉES du gabarit — `07-` §4, mot pour mot : « les règles 1 à
# 6 et la règle 8 sont verrouillées, la règle 7 est la seule ouverte ».
REGLES_VERROUILLEES_CALAME = (1, 2, 3, 4, 5, 6, 8)

# Une règle du gabarit commence en début de ligne par « N. », N de 1 à 9.
_DEBUT_REGLE = re.compile(r"^([1-9])\. ", re.M)
# Son TITRE est la course de capitales qui l'ouvre — « CITE SES MOTS »,
# « LONGUEUR », « REGISTRE ». Dérivé du texte, jamais inventé : « ici les défauts
# ne se recopient pas dans le code, ils viennent de la source » (`07-` §4).
_TITRE_REGLE = re.compile(r"^([A-ZÀ-ÖØ-Þ'’ ]{3,}?)(?=[\s]*[:.,]|\s+[a-zà-öø-ÿ])")


def sections_calame(gabarit):
    """Le gabarit DÉCOUPÉ EN SECTIONS NOMMÉES — `07-` §4.

    « Pour qu'un remplacement ait quelque chose d'identifié à remplacer, la
      dérivation émet le gabarit découpé en sections nommées. […] Le découpage
      est donné par ce document : les règles 1 à 6 et la règle 8 sont
      verrouillées, la règle 7 est la seule ouverte. »

    Le découpage ne s'invente pas : l'en-tête (le rôle, ce que le modèle reçoit,
    et le titre « RÈGLES ABSOLUES »), puis une section par règle numérotée.
    ⚠️ Le RECOLLAGE doit rendre le gabarit à l'octet : si la source change de
    forme, on s'arrête plutôt que d'émettre un découpage qui ment.
    """
    debuts = list(_DEBUT_REGLE.finditer(gabarit))
    if not debuts:
        raise SourceMouvante(
            "07- §4 : aucune règle numérotée dans le gabarit — le découpage en "
            "sections nommées que le §4 exige n'a rien à découper.")
    numeros = [int(m.group(1)) for m in debuts]
    if numeros != list(range(1, len(numeros) + 1)):
        raise SourceMouvante(
            "07- §4 : les règles du gabarit sont numérotées %s — le découpage "
            "attend une suite de 1 à N." % numeros)

    sections = [{
        "cle": "entete",
        "numero": None,
        "titre": "En-tête — le rôle, ce que le modèle reçoit",
        "verrouillee": True,
        "corps": gabarit[:debuts[0].start()].rstrip("\n"),
    }]
    for i, m in enumerate(debuts):
        fin = debuts[i + 1].start() if i + 1 < len(debuts) else len(gabarit)
        corps = gabarit[m.end():fin].rstrip("\n")
        t = _TITRE_REGLE.match(corps)
        sections.append({
            "cle": "regle_%d" % numeros[i],
            "numero": numeros[i],
            "titre": (t.group(1).strip() if t else "règle %d" % numeros[i]),
            "verrouillee": numeros[i] in REGLES_VERROUILLEES_CALAME,
            "corps": corps,
        })

    recolle = recolle_calame(sections)
    if recolle != gabarit:
        raise SourceMouvante(
            "07- §4 : le découpage en sections ne recolle pas le gabarit à "
            "l'octet — la forme de la source a bougé.")
    return sections


def recolle_calame(sections):
    """Les sections, remises bout à bout — le SEUL assemblage du gabarit."""
    morceaux = []
    for s in sections:
        morceaux.append(s["corps"] if s["numero"] is None
                        else "%d. %s" % (s["numero"], s["corps"]))
    return "\n\n".join(morceaux)


def charge_calame(racine):
    chemin = os.path.join(racine, "07-Implementation.md")
    texte = lire(chemin)
    version, statut = entete(texte, "07-Implementation.md")
    brut = entre_marqueurs(texte, MARQ_CALAME, "07-Implementation.md")
    gabarit = bloc_clos(brut, "07-Implementation.md §4")

    # « Trois variables, et pas d'autres. » Un {{X}} de plus dans la source est
    # une source qui a bougé : on s'arrête.
    trouvees = sorted(set(re.findall(r"\{\{\s*([A-Z_]+)", gabarit)))
    attendues = sorted(VARIABLES_CALAME)
    if trouvees != attendues:
        raise SourceMouvante(
            "07- §4 : les variables du gabarit sont %s, la source en déclare %s "
            "(« il n'y en a pas d'autres »)." % (trouvees, attendues))

    return {
        "source": "07-Implementation.md §4",
        "version_source": version,
        "statut_source": statut,
        "degre_statut": degre_du_statut(statut),
        "gabarit": gabarit,
        # Le gabarit DÉCOUPÉ — « pour qu'un remplacement ait quelque chose
        # d'identifié à remplacer » (`07-` §4). `gabarit` reste, à l'octet : le
        # découpage s'ajoute, il ne remplace pas.
        "sections": sections_calame(gabarit),
        "variables": list(VARIABLES_CALAME),
        # `07-` §4 — « Les règles 1 à 6 et la règle 8 sont verrouillées. »
        "regles_verrouillees": list(REGLES_VERROUILLEES_CALAME),
        "sections_editables": list(SECTIONS_EDITABLES_CALAME),
        "empreinte_source": empreinte(texte),
    }


# ---------------------------------------------------------------------------
# Le Monitoring — `competences/monitoring.md`, son statut PLAFOND
# ---------------------------------------------------------------------------

def charge_monitoring(racine):
    rel = os.path.join("competences", "monitoring.md")
    texte = lire(os.path.join(racine, rel))
    version, statut = entete(texte, rel)
    degre = degre_du_statut(statut)
    # Son plafond DÉCLARÉ est *relue et validée* : pas de banc, « versé et bancé »
    # ne s'applique pas à elle — on n'exige jamais davantage (PROMPT, contrôle
    # d'entrée), mais on exige bien cela.
    if degre < RELU:
        raise SourceMouvante(
            "%s : statut « %s » — le Monitoring exige *relu et validé*, son plafond." % (rel, statut))

    prompt = None
    for bloc in re.findall(r"```[a-z]*[ \t]*\n(.*?)\n```", texte, re.S):
        if bloc.lstrip().startswith("SYSTÈME — EXTRACTION · MONITORING"):
            prompt = bloc
            break
    if prompt is None:
        raise SourceMouvante(
            "%s §7 : le bloc « SYSTÈME — EXTRACTION · MONITORING » est introuvable." % rel)

    variables = sorted(set(re.findall(r"\{\{\s*([A-Z_]+)", prompt)))
    if variables != ["CONSIGNE", "REPONSE_ELEVE"]:
        raise SourceMouvante(
            "%s §7 : le prompt d'extraction déclare %s ; attendu ['CONSIGNE', 'REPONSE_ELEVE']."
            % (rel, variables))

    # Le schéma de sortie, tel que le prompt le déclare : « Sortie. Uniquement ce JSON ».
    m = re.search(r"Sortie\.\s*Uniquement ce JSON\s*:\s*(\{.*?\})\s*$", prompt, re.S)
    if not m:
        raise SourceMouvante("%s §7 : le JSON de sortie n'est pas déclaré au prompt." % rel)
    champs_sortie = sorted(re.findall(r'"([a-z_]+)"\s*:', m.group(1)))

    machine = yaml_strict(bloc_clos(entre_marqueurs(texte, MARQ_CONFIG, rel), rel, "yaml"))
    if machine.get("competence") != "monitoring":
        raise SourceMouvante("%s : le bloc machine ne se déclare pas `monitoring`." % rel)

    catalogue = ((machine.get("squelette") or {}).get("catalogue") or {})
    for attendu in ("aveux", "suppositions", "confiances", "sources"):
        if not isinstance(catalogue.get(attendu), list) or not catalogue[attendu]:
            raise SourceMouvante(
                "%s : le catalogue du bloc machine n'a pas de liste fermée `%s`." % (rel, attendu))

    return {
        "source": rel,
        "version": version,
        "statut": statut,
        "degre_statut": degre,
        "prompt_extraction": prompt,
        "variables": variables,
        "champs_sortie": champs_sortie,
        "bloc_machine": machine,
        "empreinte_source": empreinte(texte),
    }


# ---------------------------------------------------------------------------
# Les six fiches — la CLAUSE GRANULAIRE s'applique ici
# ---------------------------------------------------------------------------

# Bornes de la table de télémétrie du §5, telles que `verifie-seuils.py` les lit.
TITRE_S5 = "## 5. Observables"
FIN_TABLES = "### La correspondance observable"
RE_LIGNE_OBS = re.compile(r"^\|\s*`([a-z_0-9]+)`\s*\|")


def observables_de_la_prose(texte):
    """Les noms de la ou des tables de télémétrie du §5, dans l'ordre. `None` si
    la fiche n'a pas ce §5 — on ne rapproche alors rien, on ne devine pas."""
    if TITRE_S5 not in texte:
        return None
    debut = texte.index(TITRE_S5)
    fin = texte.index(FIN_TABLES) if FIN_TABLES in texte else len(texte)
    noms, vus = [], set()
    for ligne in texte[debut:fin].split("\n"):
        m = RE_LIGNE_OBS.match(ligne)
        if m and m.group(1) not in vus:
            vus.add(m.group(1))
            noms.append(m.group(1))
    return noms


def charge_competence(racine, nom):
    """(instrument | None, motif). `None` = la compétence reste hors de la chaîne."""
    rel = os.path.join("competences", "%s.md" % nom)
    chemin = os.path.join(racine, rel)
    if not os.path.exists(chemin):
        return None, "fiche absente — la compétence reste hors de la chaîne (`07-` §2)."
    texte = lire(chemin)
    version, statut = entete(texte, rel)
    degre = degre_du_statut(statut)
    if degre < RELU:
        # ⭐ C4-L10 — LE SEUIL EST *RELU ET VALIDÉ* (voir le docstring d'en-tête).
        # Une fiche seulement DÉPOSÉE ne se lit pas : rien de son corps n'est
        # ouvert. C'est le PREMIER des deux planchers mécaniques du `03-` §9, et
        # il n'est pas à ce script de le lever — le `01-` §3 le pose en toutes
        # lettres : « une compétence dont la fiche n'est pas déposée est
        # `differee` et ne peut pas être autre chose ».
        return None, ("statut « %s » — pas *relu et validé* : sa compétence reste hors de "
                      "la chaîne (clause granulaire, `07-` §2)." % statut)

    machine = yaml_strict(bloc_clos(entre_marqueurs(texte, MARQ_CONFIG, rel), rel, "yaml"))
    if machine.get("competence") != nom:
        raise SourceMouvante("%s : le bloc machine ne se déclare pas `%s`." % (rel, nom))

    notation = machine.get("notation") or {}
    volet = notation.get("observables_mesure")
    if not isinstance(volet, dict) or not volet:
        raise SourceMouvante(
            "%s : pas de volet `notation.observables_mesure` — sans lui, aucun observable de "
            "télémétrie n'a de seuil de réussite (`03-` §1 ; `01-` §8.2)." % rel)
    parametres = notation.get("parametres") or {}

    # Le vocabulaire du `03-` §1, contrôlé à la dérivation : un seuil illisible
    # ne doit pas attendre la production pour se voir.
    for cle, e in volet.items():
        ou = "%s : `%s`" % (rel, cle)
        if not isinstance(e, dict):
            raise SourceMouvante("%s : l'entrée n'est pas un bloc de champs." % ou)
        if e.get("famille") not in FAMILLES:
            raise SourceMouvante("%s : famille « %s » hors %s." % (ou, e.get("famille"), list(FAMILLES)))
        if e["famille"] == "comptage rapporté" and not e.get("rapporte_a"):
            raise SourceMouvante("%s : un comptage rapporté doit nommer son `rapporte_a`." % ou)
        if e["famille"] == "ordinal" and not e.get("echelle"):
            raise SourceMouvante("%s : un ordinal doit porter son `echelle`." % ou)
        comp = e.get("reussie")
        if comp not in COMPARATEURS:
            raise SourceMouvante("%s : `reussie` vaut « %s », hors %s." % (ou, comp, list(COMPARATEURS)))
        if comp == "vaut" and "valeur_reussie" not in e:
            raise SourceMouvante("%s : `vaut` exige `valeur_reussie`." % ou)
        if comp not in ("vaut", "sans_objet"):
            if ("seuil" in e) == ("seuil_parametre" in e):
                raise SourceMouvante("%s : il faut `seuil` OU `seuil_parametre`, exactement un." % ou)
            if "seuil_parametre" in e and e["seuil_parametre"] not in parametres:
                raise SourceMouvante(
                    "%s : `seuil_parametre` nomme « %s », absent de `notation.parametres`."
                    % (ou, e["seuil_parametre"]))
        if not str(e.get("sens", "")).strip():
            raise SourceMouvante("%s : pas de `sens` — un seuil sans sa phrase n'est pas opposable." % ou)
        # Les quatre contrôles que `verifie-seuils.py` fait et qui manquaient ici.
        # Un dérivé plus permissif que l'outil qui fait foi laisse une compétence
        # ouverte S'OUVRIR MAL — un seuil ordinal hors de son échelle donne une
        # comparaison jamais satisfaite, donc une note fausse, en silence.
        if comp == "sans_objet" and ("seuil" in e or "seuil_parametre" in e or "valeur_reussie" in e):
            raise SourceMouvante("%s : `sans_objet` ne prend ni seuil ni valeur." % ou)
        if comp == "vaut" and ("seuil" in e or "seuil_parametre" in e):
            raise SourceMouvante("%s : `vaut` ne prend pas de seuil chiffré." % ou)
        if e["famille"] == "ordinal" and "seuil" in e and e.get("echelle"):
            if e["seuil"] not in e["echelle"]:
                raise SourceMouvante(
                    "%s : le seuil « %s » n'est pas sur son échelle." % (ou, e["seuil"]))
        statut_obs = str(e.get("statut", "")).lower()
        if not any(x in statut_obs for x in ("acté", "acte", "provisoire", "à valider", "a valider")):
            raise SourceMouvante(
                "%s : statut « %s » hors convention (acté / provisoire / à valider)."
                % (ou, e.get("statut")))

    # LE RAPPROCHEMENT PROSE ↔ MACHINE — la raison d'être de `verifie-seuils.py`,
    # et le seul contrôle qui voie le trou le plus coûteux : un observable du §5
    # SANS entrée au bloc machine n'a pas de seuil de réussite, sa mesure ne peut
    # être ni réussie ni ratée, et tout le §8 du routeur s'arrête sur lui.
    prose = observables_de_la_prose(texte)
    if prose is not None:
        manquants = [o for o in prose if o not in volet]
        orphelins = [o for o in volet if o not in prose]
        if manquants:
            raise SourceMouvante(
                "%s : observables du §5 SANS seuil de réussite : %s (`01-` §8.2)." % (rel, manquants))
        if orphelins:
            raise SourceMouvante(
                "%s : seuils ORPHELINS, sans observable au §5 : %s." % (rel, sorted(orphelins)))

    # Les prompts d'une fiche vivent ENTRE MARQUEURS, et la convention est celle
    # du banc — `copies-tests/_commun/derive-prompts.py` : « entre les marqueurs
    # `<!-- DEBUT-PROMPT-P1 -->` / `<!-- FIN-PROMPT-P1 -->` (et P1A/P1B pour la
    # Synthèse) », actée par Louis le 12/08/2026. LA PHASE EST LA CLÉ.
    #
    # ⚠️ Ce lot avait inventé sa propre convention (« un bloc dont la première
    #    ligne commence par SYSTÈME ») : AUCUNE des six fiches ne la suit — leurs
    #    prompts s'ouvrent sur `# RÔLE`. La branche que ce script existe pour
    #    servir n'aurait donc jamais pu s'exécuter. Un dérivé se lit comme le banc
    #    le lit, ou les deux divergent au premier jour.
    prompts = {}
    for m in re.finditer(r"<!-- DEBUT-PROMPT-([A-Z0-9]+) -->", texte):
        phase = m.group(1)
        if phase in prompts:
            raise SourceMouvante("%s : marqueurs %s multiples." % (rel, phase))
        marqueurs = (m.group(0), "<!-- FIN-PROMPT-%s -->" % phase)
        prompts[phase] = bloc_clos(entre_marqueurs(texte, marqueurs, rel), rel)
    if not prompts:
        raise SourceMouvante(
            "%s : aucun marqueur `<!-- DEBUT-PROMPT-… -->` — rien à exécuter. "
            "(La convention fait foi à `copies-tests/_commun/derive-prompts.py`.)" % rel)

    return {
        "source": rel,
        "competence": nom,
        "version": version,
        "statut": statut,
        "degre_statut": degre,
        "prompts": prompts,
        "bloc_machine": machine,
        "observables_mesure": volet,
        "parametres": parametres,
        "empreinte_source": empreinte(texte),
    }, None


# ---------------------------------------------------------------------------
# L'écriture des dérivés — des modules TypeScript, jamais édités à la main
# ---------------------------------------------------------------------------

BANDEAU = (
    "// ⚠️ FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN.\n"
    "// Sortie de `python3 scripts/derive-instruments.py --ecris`.\n"
    "// La source fait foi ; `--verifie` dit si ce fichier en a divergé\n"
    "// (piège 52 ; `03-` §1 ; `07-` §4).\n")

# ── La provenance : une TRACE, jamais une comparaison ───────────────────────
# C4-L11. Le chemin absolu de la racine de conception vivait DANS la donnée
# dérivée (`manifeste.racine_conception`), donc dans ce que `--verifie` compare
# octet pour octet : ailleurs que sur la machine du professeur, le contrôle
# disait DIVERGE alors que tout le reste était identique — et `npm test` ne
# pouvait donc passer ni en intégration continue, ni sur un second poste.
# La racine descend ici, en commentaire d'en-tête, et le contrôle la NORMALISE
# des deux côtés avant de comparer. ⚠️ Ce n'est pas un retrait : la trace reste
# lisible dans le fichier, et le REFUS d'écrire depuis une racine d'essai
# (plus bas, dans `main`) reste entier — c'est lui qui protège les dérivés de
# production, pas cette ligne.
MARQUE_PROVENANCE = "// Racine de conception lue : "


def _sans_provenance(texte):
    """Le contenu, débarrassé de la seule ligne qui porte un chemin absolu."""
    return "\n".join(l for l in texte.split("\n")
                     if not l.startswith(MARQUE_PROVENANCE))


def module_ts(nom_export, valeur, provenance=None):
    bandeau = BANDEAU
    if provenance is not None:
        bandeau += MARQUE_PROVENANCE + provenance + "\n"
    return "%s\nexport const %s = %s as const\n" % (
        bandeau, nom_export, json.dumps(valeur, ensure_ascii=False, indent=2, sort_keys=True))


def fichiers_attendus(paquet):
    """chemin relatif → contenu, pour les deux sens (écriture et contrôle)."""
    out = {}
    out["calame-retour.ts"] = module_ts("GABARIT_CALAME", paquet["calame"])
    out["monitoring.ts"] = module_ts("INSTRUMENT_MONITORING", paquet["monitoring"])
    out["transcription.ts"] = module_ts("PROMPT_TRANSCRIPTION", paquet["transcription"])
    for nom in LES_SIX:
        inst = paquet["competences"].get(nom)
        if inst is not None:
            out[os.path.join("competences", "%s.ts" % nom)] = module_ts(
                "INSTRUMENT_%s" % nom.upper(), inst)
    out["MANIFESTE.ts"] = module_ts("MANIFESTE_INSTRUMENTS", paquet["manifeste"],
                                    provenance=paquet["racine_conception"])
    return out


def assemble(racine):
    calame = charge_calame(racine)
    monitoring = charge_monitoring(racine)
    transcription = charge_transcription(racine)
    competences, motifs = {}, {}
    for nom in LES_SIX:
        # Chaque fiche est ISOLÉE : une fiche qui lève tenait tout le reste en
        # otage — ni le gabarit Calame, ni le Monitoring, ni les cinq autres ne se
        # dérivaient. La clause granulaire veut l'inverse : « une compétence qui
        # s'arrête, c'est une compétence de moins », jamais un lot perdu.
        try:
            inst, motif = charge_competence(racine, nom)
        except SourceMouvante as e:
            inst, motif = None, "fiche ILLISIBLE — %s" % e
        competences[nom] = inst
        motifs[nom] = motif
    manifeste = {
        "outil": OUTIL,
        # `racine_conception` N'EST PLUS ICI, et c'est délibéré (C4-L11) : un
        # chemin absolu dans la donnée dérivée fait DIVERGER le contrôle sur
        # toute machine autre que celle du professeur. Elle vit au bandeau du
        # `MANIFESTE.ts`, en trace, normalisée par `_sans_provenance`.
        "sources": {
            "07-Implementation.md": {
                "version": calame["version_source"], "statut": calame["statut_source"],
                "empreinte": calame["empreinte_source"]},
            "competences/monitoring.md": {
                "version": monitoring["version"], "statut": monitoring["statut"],
                "empreinte": monitoring["empreinte_source"]},
            # Ni version ni statut : ce n'est pas un document du corpus, c'est un
            # prompt — « il fait foi tel quel » (manifeste C4-L4). L'empreinte
            # tient lieu de version, et c'est elle que `--verifie` compare.
            CHEMIN_TRANSCRIPTION: {
                "version": None, "statut": "déposé — fait foi tel quel",
                "empreinte": transcription["empreinte_source"]},
        },
        "competences": {},
    }
    for nom in LES_SIX:
        inst = competences[nom]
        if inst is None:
            manifeste["competences"][nom] = {"ouverte": False, "motif": motifs[nom]}
        else:
            manifeste["sources"]["competences/%s.md" % nom] = {
                "version": inst["version"], "statut": inst["statut"],
                "empreinte": inst["empreinte_source"]}
            manifeste["competences"][nom] = {
                "ouverte": True, "version": inst["version"], "statut": inst["statut"],
                "observables_mesure": sorted(inst["observables_mesure"].keys())}
    # Le Monitoring a son étage à part : son statut plafond EST son statut atteint.
    manifeste["monitoring"] = {"ouvert": True, "version": monitoring["version"],
                               "statut": monitoring["statut"],
                               "note": "statut PLAFOND déclaré — pas de banc, « versé et bancé » "
                                       "ne s'applique pas (`competences/monitoring.md`)."}
    # C4-L4 — les deux réglages ouverts du prompt de transcription, portés au
    # manifeste pour qu'une session suivante n'ait pas à les redécouvrir.
    manifeste["transcription"] = {
        "source": CHEMIN_TRANSCRIPTION,
        "empreinte": transcription["empreinte_source"],
        "octets": transcription["octets"],
        "reglages_ouverts": {
            "enonce_usage": transcription["enonce_usage_regle"],
            "regle_anonymisation": transcription["regle_anonymisation_reglee"],
        },
        "note": "« le corps de ses règles se conserve tel quel ; son énoncé d'usage et sa "
                "règle d'anonymisation se règlent AVANT LA PREMIÈRE PASSATION » "
                "(`07-` §2, entrée C4-L4 ; `06-` §4). Les deux sont servis TELS QUELS "
                "tant qu'ils ne sont pas réglés : une session Code ne décide pas d'un "
                "texte de source.",
    }
    return {"calame": calame, "monitoring": monitoring, "transcription": transcription,
            "competences": competences, "manifeste": manifeste,
            # Hors du manifeste : la provenance descend au bandeau, elle
            # n'entre plus dans la donnée comparée (C4-L11).
            "racine_conception": racine}


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def resume(paquet):
    m = paquet["manifeste"]
    print("✓ gabarit Calame — `07-` %s (%s), %d caractères, variables %s"
          % (paquet["calame"]["version_source"], paquet["calame"]["statut_source"],
             len(paquet["calame"]["gabarit"]), ", ".join(paquet["calame"]["variables"])))
    print("✓ Monitoring — fiche %s (%s), prompt d'extraction %d caractères, sortie %s"
          % (paquet["monitoring"]["version"], paquet["monitoring"]["statut"],
             len(paquet["monitoring"]["prompt_extraction"]),
             ", ".join(paquet["monitoring"]["champs_sortie"])))
    tr = paquet["transcription"]
    print("✓ transcription — %s, %d octets, empreinte %s…"
          % (tr["source"], tr["octets"], tr["empreinte_source"][:12]))
    print("  ⚠️ réglages OUVERTS, à arrêter AVANT la première passation (`06-` §4) : "
          "énoncé d'usage %s · règle d'anonymisation %s"
          % ("RÉGLÉ" if tr["enonce_usage_regle"] else "NON RÉGLÉ (servi tel quel)",
             "RÉGLÉE" if tr["regle_anonymisation_reglee"]
             else ("NON RÉGLÉE (servie telle quelle)" if tr["regle_anonymisation"]
                   else "ABSENTE de la source")))
    ouvertes = [n for n in LES_SIX if m["competences"][n]["ouverte"]]
    print("— compétences OUVERTES à la chaîne : %s"
          % (", ".join(ouvertes) if ouvertes else "AUCUNE"))
    for nom in LES_SIX:
        e = m["competences"][nom]
        if not e["ouverte"]:
            print("  ✗ %-15s %s" % (nom, e["motif"]))
        else:
            print("  ✓ %-15s v%s — %d observable(s) de télémétrie"
                  % (nom, e["version"], len(e["observables_mesure"])))


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0],
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--racine", default=RACINE_CONCEPTION,
                   help="le dépôt de conception (défaut : %(default)s)")
    p.add_argument("--sortie", default=None,
                   help="où écrire les dérivés (défaut : utils/chaine/derive du dépôt de code)")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--resume", action="store_true", help="ce qui a été lu, sans rien écrire")
    g.add_argument("--ecris", action="store_true", help="écrit les dérivés")
    g.add_argument("--verifie", action="store_true", help="n'écrit rien ; dit IDENTIQUE ou DIVERGE")
    a = p.parse_args(argv)

    if not os.path.isdir(a.racine):
        print("✗ racine introuvable : %s" % a.racine, file=sys.stderr)
        return 2

    global SORTIE
    if a.sortie:
        SORTIE = os.path.abspath(a.sortie)
    elif a.ecris and os.path.abspath(a.racine) != os.path.abspath(RACINE_CONCEPTION):
        # ⚠️ `SORTIE` se calcule depuis l'emplacement DU SCRIPT, jamais depuis
        #    `--racine` : une seule commande d'essai réécrivait les dérivés DE
        #    PRODUCTION, et supprimait ceux que la racine d'essai ne justifiait
        #    pas. On refuse plutôt que d'écrire au mauvais endroit.
        print("✗ `--ecris` sur une racine d'essai (%s) écrirait dans les dérivés de PRODUCTION.\n"
              "  Donne `--sortie <dossier>` si c'est ce que tu veux." % a.racine, file=sys.stderr)
        return 2

    try:
        paquet = assemble(a.racine)
    except SourceMouvante as e:
        print("✗ SOURCE MOUVANTE — %s" % e, file=sys.stderr)
        return 1

    attendus = fichiers_attendus(paquet)

    if a.resume:
        resume(paquet)
        return 0

    if a.ecris:
        os.makedirs(os.path.join(SORTIE, "competences"), exist_ok=True)
        # Un dérivé qui reste après que sa fiche s'est refermée mentirait.
        for existant in os.listdir(os.path.join(SORTIE, "competences")):
            chemin = os.path.join(SORTIE, "competences", existant)
            if existant.endswith(".ts") and os.path.join("competences", existant) not in attendus:
                if not os.path.isfile(chemin):
                    print("  ! ignoré : competences/%s n'est pas un fichier" % existant)
                    continue
                os.remove(chemin)
                print("  – retiré : competences/%s (sa fiche n'est plus ouverte)" % existant)
        for rel, contenu in sorted(attendus.items()):
            chemin = os.path.join(SORTIE, rel)
            os.makedirs(os.path.dirname(chemin), exist_ok=True)
            io.open(chemin, "w", encoding="utf-8").write(contenu)
            print("  → utils/chaine/derive/%s (%d octets)" % (rel, len(contenu.encode("utf-8"))))
        resume(paquet)
        return 0

    # --verifie : les deux sens, comme `derive-doctrine.py --verifie`.
    ecarts = []
    for rel, contenu in sorted(attendus.items()):
        chemin = os.path.join(SORTIE, rel)
        if not os.path.exists(chemin):
            ecarts.append("MANQUANT : %s" % rel)
        elif _sans_provenance(io.open(chemin, encoding="utf-8").read()) \
                != _sans_provenance(contenu):
            # La comparaison ignore la seule ligne qui porte un chemin absolu :
            # sans quoi le contrôle dirait DIVERGE depuis toute autre racine,
            # alors que tout le reste est identique à l'octet (C4-L11).
            ecarts.append("DIVERGE : %s" % rel)
    # Le balayage porte sur LES DEUX dossiers : un `expression.ts` égaré à la
    # racine de `derive/` restait importable et le contrôle jurait que tout allait
    # bien — il ne regardait que `competences/`.
    for sous in ("", "competences"):
        dossier = os.path.join(SORTIE, sous) if sous else SORTIE
        if not os.path.isdir(dossier):
            continue
        for existant in sorted(os.listdir(dossier)):
            if not existant.endswith(".ts"):
                continue
            rel = os.path.join(sous, existant) if sous else existant
            if rel not in attendus:
                ecarts.append("EN TROP : %s — rien ne le justifie" % rel)
    resume(paquet)
    if ecarts:
        print("\nINSTRUMENTS : DIVERGE")
        for e in ecarts:
            print("  · %s" % e)
        print("  → rejouer `python3 scripts/derive-instruments.py --ecris`")
        return 1
    print("\nINSTRUMENTS : IDENTIQUE (%d fichier(s) dérivé(s))" % len(attendus))
    return 0


if __name__ == "__main__":
    sys.exit(main())

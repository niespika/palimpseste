# -*- coding: utf-8 -*-
"""derive-doctrine.py — la doctrine, dérivée des sources et versée en base.

    « Ne recopie aucune de ces tables à la main, ni dans le code ni dans un seed
      tapé […] Dérive-les des sources par un script, avec un contrôle qui sait
      dire quand elles ont divergé. »
                       — PROMPT_Code_C4_L8.md, piège 38 ; `07-` §2 ; `08-` §7.4

RIEN N'EST ÉCRIT EN DUR ICI. Les treize objets, les neuf crans, les durées, les
modes admis, le `materiau_source` par objet × mode, les routes, les consignes et
les guides vivent dans les sources du dépôt `palimpseste-conception` ; ce script
les LIT, par `generateur/noyau/doctrine.py` et son crible « cite ou refuse » —
qui REFUSE DE SE CHARGER si une déclaration a bougé mot pour mot. La source
bouge, le script s'arrête au lieu de mentir.

Ce qu'il remplit :
  · `exercices_types.crans_admis` · `.exclusions_parcours`  (laissés vides par C4-L1)
  · `exercices_types_crans`        — couverture, provenances de la CIBLE, durée
  · `exercices_types_modes`        — les `modes[]` par compétence
  · `exercices_types_modes_source` — le `materiau_source` par objet × mode
  · `exercices_crans` · `exercices_durees` · `competences_modes_admis`
      ⭐ C4-L15 — `exercices_crans` porte aussi `marquage` (`02-` §5, ce que
      l'écran met en évidence dans le matériau) et `longueur` (`02-` §2.3.3,
      la fraction de l'étendue du support). Les deux sont NULL aux crans 2, 6
      et 8, qui n'ont pas de `materiau_cible`.
  · `exercices_routes`             — observable × objet × mode × cran
  · `exercices_consignes_isolees`  — les six crans qui isolent
  · `exercices_consignes_production` · `exercices_guides_production` — le §14
  · `doctrine_derivation`          — le journal, et les empreintes des sources

USAGE
    python3 scripts/derive-doctrine.py --sql      > /tmp/derive.sql
    python3 scripts/derive-doctrine.py --verifie  > /tmp/verifie.sql
    # puis, dans les deux cas : psql … -f /tmp/….sql

    --sql       le remplissage, en UNE transaction (delete + insert).
    --verifie   NE MODIFIE RIEN : reconstruit les lignes attendues dans des
                tables temporaires et les diffe SYMÉTRIQUEMENT contre la base.
                Rend une ligne par table : IDENTIQUE, ou le compte des écarts
                dans les deux sens. Vérifie AUSSI les empreintes des sources
                contre celles du dernier `doctrine_derivation`.
    --resume    ce qui a été lu, sans SQL — pour l'œil.

    --racine    le dépôt de conception (défaut : le chemin absolu du manifeste).

CODES DE SORTIE : 0 = lu · 1 = source mouvante ou absente · 2 = erreur d'usage.
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
# d'environnement `PALIMPSESTE_RACINE_CONCEPTION` déclare la racine ;
# à défaut, le chemin du professeur tient lieu de défaut, comme avant.
RACINE_DEFAUT = (os.environ.get("PALIMPSESTE_RACINE_CONCEPTION")
                 or "/Users/louissagnieres/Documents/GitTest/palimpseste-conception")
# ⭐ C4-L15 — 1.2 → 1.3 : le dériveur verse DEUX COLONNES DE PLUS sur
# `exercices_crans` (`marquage` et `longueur`, `02-` §5 et §2.3.3). Le numéro
# se relit sur le fichier VIVANT juste avant écriture — c'est un compteur
# PARTAGÉ entre séances, et il part au journal `doctrine_derivation.outil` :
# c'est lui qui dit, plus tard, quelle version du dériveur a écrit la base.
OUTIL = "scripts/derive-doctrine.py 1.4"

# Les six crans qui isolent, dans l'ordre où le `04-` §0 les nomme.
CRANS_QUI_ISOLENT = (1, 3, 4, 5, 7, 9)
CRANS_DE_PRODUCTION = (2, 6, 8)

# Les sources dont l'empreinte se conserve — celles que la doctrine lit.
SOURCES = ("02-exercices.md", "04-Instances_Exercices.md", "06-Palimpseste.md")
# ⭐ C7-L2 (03/09/2026) — LE GABARIT. Le `09-` porte la grille des problèmes, les
#    tests du cran 6 et la pièce du cran 2 ; le `10-` §5 porte le marquage par
#    cran × variante. Lus ici, strictement, jamais recopiés (`10-` §8 ; `07-` C7-L2).
SOURCES_GABARIT = ("09-Objets.md", "10-Gabarit.md")
SOURCES_INSTANCES = tuple("instances/04-%s.md" % c for c in (
    "expression", "argumentation", "structure",
    "connaissance", "synthese", "questionnement"))

# Les six fiches de compétence. Le §6 de chacune porte une ligne
# `<!-- PRODUCTION exerce=… -->` : les objets où elle est ciblable AUX CRANS DE
# PRODUCTION (`04-` §0, deuxieme operande de `couverture_observables`).
# `competences/monitoring.md` n'en porte pas, et ne doit pas en porter : le
# Monitoring n'est jamais cible du routeur (`07-` §1.4).
SOURCES_FICHES = tuple("competences/%s.md" % c for c in (
    "expression", "argumentation", "structure",
    "connaissance", "synthese", "questionnement"))

# Les comptes que la prose des fiches annonce en toutes lettres.
NOMBRES = {"un": 1, "deux": 2, "trois": 3, "quatre": 4, "cinq": 5, "six": 6,
           "sept": 7, "huit": 8, "neuf": 9, "dix": 10, "onze": 11, "douze": 12,
           "treize": 13}


# ---------------------------------------------------------------------------
# Le chargement — la doctrine, plus les trois lectures qu'elle ne fait pas
# ---------------------------------------------------------------------------

def charge(racine):
    """La doctrine du générateur, plus ce que ce lot lit en plus d'elle."""
    sys.path.insert(0, os.path.join(racine, "generateur"))
    from noyau.doctrine import (Doctrine, SourceMouvante,  # noqa: E402
                                _lignes_table, _nu, _section, _valeurs, MODES)
    from noyau.grille import lire_le_09, lire_le_10, lire_les_fiches  # noqa: E402

    d = Doctrine.charge(racine)
    t02 = io.open(os.path.join(racine, "02-exercices.md"), encoding="utf-8").read()
    t04 = io.open(os.path.join(racine, "04-Instances_Exercices.md"), encoding="utf-8").read()

    # (a) Les deux colonnes de la table des crans que la doctrine ne garde pas :
    #     « ce que l'élève fait » et le « palier visé » (`02-` §2.2).
    d.crans_fait = {}
    d.crans_palier = {}
    bloc = _section(t02, r"^### 2\.2 L'échelle des crans.*$")
    for c in _lignes_table(bloc):
        if len(c) != 13 or not re.fullmatch(r"\d", _nu(c[0])):
            continue
        n = int(_nu(c[0]))
        d.crans_fait[n] = _nu(c[2])
        d.crans_palier[n] = _nu(c[4])
    if len(d.crans_fait) != 9:
        raise SourceMouvante("9 crans attendus au `02-` §2.2 pour « ce que l'élève fait », %d lus"
                             % len(d.crans_fait))

    # (b) La FOURCHETTE des durées, dont la doctrine ne garde que la borne haute
    #     (`02-` §2.4). La fourchette reste l'information ; l'entier est la valeur.
    d.durees_fourchette = {}
    bloc = _section(t02, r"^### 2\.4 La dérivation de la durée.*$")
    for c in _lignes_table(bloc):
        if len(c) != 4 or "Geste" in c[0]:
            continue
        geste = _nu(c[0]).lower()
        for grain, cellule in zip(("micro", "meso", "macro"), c[1:]):
            mo = re.search(r"(\d+)\s*-\s*(\d+)", _nu(cellule))
            if mo:
                d.durees_fourchette[(geste, grain)] = (int(mo.group(1)), int(mo.group(2)))
    if len(d.durees_fourchette) != 9:
        raise SourceMouvante("9 fourchettes attendues au `02-` §2.4, %d lues"
                             % len(d.durees_fourchette))

    # (c) Le `materiau_source` du couple objet × mode — « ce que chaque
    #     sous-section porte EN TÊTE, avant sa table » (`04-` §0).
    #     Sa valeur est la même sur les neuf crans : ce qui le borne est le MODE.
    d.source_par_mode = {}
    for m in re.finditer(r"^## \d+\. « [^»]+ » — `([a-z_]+)`(.*?)(?=^## |\Z)", t04, re.M | re.S):
        code, corps = m.group(1), m.group(2)
        for s in re.finditer(
                r"^### \d+\.\d+ Mode `([^`]+)`\s*\n+"
                r"\*\*`materiau_source`\*\* — `provenance` : (.*?) — `support` : (.*?)\s*$",
                corps, re.M):
            mode, prov, supp = s.group(1), s.group(2), s.group(3)
            if mode not in MODES:
                raise SourceMouvante("mode inconnu en tête de sous-section : `%s` (objet `%s`)"
                                     % (mode, code))
            # `null` est une VALEUR de provenance ici, pas une absence : _valeurs
            # la retire, on la relit à part.
            provenances = _valeurs(prov)
            if re.search(r"`null`", prov):
                provenances = ["null"] + provenances
            # « `phrase` → `texte` » est une PLAGE : un plancher et un plafond
            # (`04-` §0). On la déplie dans l'ordre du `02-` §0.
            echelle = ["phrase", "extrait", "texte"]
            bornes = _valeurs(supp)
            if len(bornes) == 2 and "→" in supp:
                a, b = echelle.index(bornes[0]), echelle.index(bornes[1])
                supports = echelle[a:b + 1]
            else:
                supports = bornes
            d.source_par_mode[(code, mode)] = (provenances, supports)

    manquants = [(c, m) for c, o in d.objets.items() for m in o.modes
                 if (c, m) not in d.source_par_mode]
    if manquants:
        raise SourceMouvante(
            "`materiau_source` absent de l'en-tête de ces sous-sections du `04-` : %s"
            % ", ".join("%s × %s" % x for x in manquants))

    # (d) Les provenances et supports admis de la CIBLE — `02-` §2.3.3, table
    #     « Chacun porte une `provenance` et un `support` ». La cible prend les
    #     mêmes, PLUS `mot` sur le support. La lecture est SCOPÉE au §2.3.3 :
    #     le §2.3 porte une autre table qui nomme les deux mêmes champs.
    bloc233 = _section(t02, r"^#### 2\.3\.3 Le matériau.*$")
    # Le §2.3.3 porte DEUX tables qui nomment les deux matériaux ; celle qu'on
    # lit est celle dont l'en-tête déclare `provenance` et `support`.
    mt = re.search(r"^\|\s*\|\s*`provenance`\s*\|\s*`support`\s*\|\s*$\n"
                   r"\|[-|: ]+\|\s*\n((?:\|.*\n)+)", bloc233, re.M)
    if not mt:
        raise SourceMouvante("`02-` §2.3.3 : la table « `provenance` | `support` » "
                             "est introuvable")
    table_ps = mt.group(1)

    def _ligne_materiau(nom):
        m = re.search(r"\|\s*\*\*`%s`\*\*\s*\|(.*?)\|(.*?)\|" % nom, table_ps)
        if not m:
            raise SourceMouvante("`02-` §2.3.3 : la ligne `%s` de la table "
                                 "provenance/support est introuvable" % nom)
        return m.group(1), m.group(2)

    def _avec_null(cellule):
        vals = [x for x in _valeurs(cellule) if x != "null"]
        return (["null"] + vals) if re.search(r"`null`", cellule) else vals

    prov_src, supp_src = _ligne_materiau("materiau_source")
    prov_cib, supp_cib = _ligne_materiau("materiau_cible")
    d.source_provenances = _avec_null(prov_src)
    d.source_supports = _avec_null(supp_src)
    # « les mêmes » renvoie à la ligne du dessus — la source a UN domicile.
    d.cible_provenances = (list(d.source_provenances) if "les mêmes" in prov_cib
                           else _avec_null(prov_cib))
    d.cible_supports = (list(d.source_supports) if "les mêmes" in supp_cib
                        else _avec_null(supp_cib))
    for ajout in _valeurs(supp_cib):          # « les mêmes, plus `mot` »
        if ajout not in d.cible_supports:
            d.cible_supports.append(ajout)
    if len(d.source_provenances) != 5 or len(d.cible_provenances) != 5:
        raise SourceMouvante(
            "5 provenances attendues de part et d'autre au `02-` §2.3.3 — lues : "
            "source %s · cible %s" % (d.source_provenances, d.cible_provenances))
    if "mot" not in d.cible_supports:
        raise SourceMouvante(
            "`02-` §2.3.3 : le support `mot`, propre à la cible, ne se lit plus — %s"
            % d.cible_supports)

    # (e) `couverture_observables` AUX CRANS DE PRODUCTION — la ligne
    #     `<!-- PRODUCTION exerce=… -->` du §6 de chaque fiche. Le `04-` §0 :
    #     « `exerce` <- le §6 de la FICHE de la compétence, qui dit sur quels
    #     objets elle est ciblable aux crans de production » ; `observable_seul`
    #     est le RÉSIDU. Rien n'est recopié : la ligne est citée, ou l'on refuse.
    d.production = {}
    for nom in SOURCES_FICHES:
        comp = os.path.basename(nom)[:-3]
        if comp not in d.modes_admis:
            raise SourceMouvante("`%s` : compétence inconnue du `02-` §3" % nom)
        texte = io.open(os.path.join(racine, nom), encoding="utf-8").read()

        lig = [l for l in texte.split("\n") if l.startswith("<!-- PRODUCTION ")]
        if len(lig) != 1:
            raise SourceMouvante(
                "`%s` §6 : %d ligne(s) `<!-- PRODUCTION … -->`, une attendue"
                % (nom, len(lig)))
        mo = re.fullmatch(r"<!-- PRODUCTION exerce=([a-z_]+(?:,[a-z_]+)*) -->",
                          lig[0].strip())
        if not mo:
            raise SourceMouvante("`%s` §6 : la ligne PRODUCTION ne se lit plus — %r"
                                 % (nom, lig[0][:120]))
        objets = mo.group(1).split(",")
        if len(set(objets)) != len(objets):
            raise SourceMouvante("`%s` §6 : un objet y est nommé deux fois" % nom)

        # Chaque objet existe, et DÉCLARE la compétence : une fiche ne se rend
        # pas ciblable là où le `02-` §1 ne la porte pas.
        for code in objets:
            if code not in d.objets:
                raise SourceMouvante("`%s` §6 : objet inconnu `%s`" % (nom, code))
            if comp not in d.objets[code].competences:
                raise SourceMouvante(
                    "`%s` §6 : `%s` ne déclare pas `%s` dans ses `competences[]` "
                    "(`02-` §1) — une fiche ne peut pas s'y rendre ciblable"
                    % (nom, code, comp))

        # Le COMPTE que la prose annonce en toutes lettres. C'est lui, et lui
        # seul, qui empêche la ligne et le paragraphe de diverger en silence :
        # sans compte, on ne saurait jamais dire non.
        para = [l for l in texte.split("\n")
                if l.startswith("**Aux crans de production**")]
        if len(para) != 1:
            raise SourceMouvante(
                "`%s` §6 : %d paragraphe(s) « Aux crans de production », un attendu"
                % (nom, len(para)))
        mc = re.search(r"(?:ciblable|en jeu) sur (?:les |ses )?([a-zà-ÿ]+)"
                       r"(?: de ses ([a-zà-ÿ]+))? objets", para[0].replace("*", ""))
        if not mc or mc.group(1) not in NOMBRES:
            raise SourceMouvante(
                "`%s` §6 : le paragraphe de production n'annonce plus son COMPTE "
                "d'objets ciblables en toutes lettres — sans lui, la ligne "
                "PRODUCTION et la prose divergeraient sans que rien ne le voie"
                % nom)
        if NOMBRES[mc.group(1)] != len(objets):
            raise SourceMouvante(
                "`%s` §6 : la prose annonce « %s » objets ciblables, la ligne "
                "PRODUCTION en nomme %d" % (nom, mc.group(1), len(objets)))
        porteurs = [c for c, o in d.objets.items() if comp in o.competences]
        if mc.group(2) is not None:
            if mc.group(2) not in NOMBRES:
                raise SourceMouvante("`%s` §6 : « de ses %s objets » ne se lit pas"
                                     % (nom, mc.group(2)))
            if NOMBRES[mc.group(2)] != len(porteurs):
                raise SourceMouvante(
                    "`%s` §6 : la prose dit « de ses %s objets », le `02-` §1 lui "
                    "en déclare %d" % (nom, mc.group(2), len(porteurs)))
        d.production[comp] = objets

    # Le Monitoring ne déclare rien ici, et son silence se contrôle.
    if "<!-- PRODUCTION" in io.open(
            os.path.join(racine, "competences", "monitoring.md"),
            encoding="utf-8").read():
        raise SourceMouvante(
            "`competences/monitoring.md` porte une ligne PRODUCTION — le "
            "Monitoring n'est jamais cible du routeur (`07-` §1.4)")

    # (f) ⭐ C7-L2 — LA GRILLE DU `09-` ET LE MARQUAGE DU `10-` §5.
    d.problemes, d.tests, d.pieces = lire_le_09(racine, d, SourceMouvante)
    d.marquage_gabarit = lire_le_10(racine, d, SourceMouvante, _section, _lignes_table, _nu)
    # ⭐ C7-L5 — les fiches des objets (la tête de chaque fiche du `09-`), pour la semaine de méthode.
    d.fiches = lire_les_fiches(racine, d, SourceMouvante)

    d.empreintes = empreintes(racine)
    return d


# ---------------------------------------------------------------------------
# ⭐ C7-L2 — le `09-Objets.md` et le `10-` §5 se lisent dans `generateur/noyau/grille.py`
# (dépôt de conception) : UN SEUL domicile, que la fabrique du gabarit lit aussi.
# ---------------------------------------------------------------------------
def empreintes(racine):
    """sha256 de chaque source lue — c'est ce qui rend la divergence visible."""
    out = {}
    for nom in SOURCES + SOURCES_INSTANCES + SOURCES_FICHES + SOURCES_GABARIT:
        p = os.path.join(racine, nom)
        with io.open(p, "rb") as f:
            out[nom] = hashlib.sha256(f.read()).hexdigest()
    return out


# ---------------------------------------------------------------------------
# La mise en lignes — ce que chaque table reçoit
# ---------------------------------------------------------------------------

def lignes(d):
    """Toutes les lignes dérivées, table par table. Aucune valeur en dur."""
    L = {}

    # ⭐ C4-L15 — DEUX COLONNES DE PLUS, DÉRIVÉES DU MÊME `02-`, ET RIEN
    #    N'EST TAPÉ ICI. `d.marquage` vient du `02-` §5 (« ce que l'écran met
    #    en évidence dans le matériau ») et `d.longueurs` du `02-` §2.3.3 (la
    #    fraction de l'étendue du support). Le générateur les lisait déjà —
    #    `noyau/doctrine.py`, qui refuse de se charger si la source a bougé —
    #    et la plateforme ne les connaissait pas : « la doctrine est dérivée,
    #    JAMAIS TAPÉE, et il n'y a qu'un dériveur ». Les écrire dans un `switch`
    #    TypeScript, ce serait les redire, et deux domiciles finissent toujours
    #    par diverger.
    # ⚠️ LES DEUX SONT NULL AUX TROIS CRANS DE PRODUCTION (2, 6, 8), et
    #    l'absence est une DONNÉE, pas un oubli : ces crans n'ont pas de
    #    `materiau_cible` (`02-` §2.2), donc rien à marquer ET rien à mesurer.
    #    Les deux tables des sources ne portent que SIX crans, chacune, et
    #    `noyau/doctrine.py` s'arrête si elle en lit un autre nombre.
    L["exercices_crans"] = [
        (n, c.code, c.geste, c.appui, d.crans_fait[n], d.crans_palier[n],
         c.materiau_cible, c.defaut, c.distracteurs, c.reponse_attendue,
         c.guide, c.jugement, c.couverture, c.regime_v1vf,
         d.marquage.get(n), d.longueurs.get(n))
        for n, c in sorted(d.crans.items())]

    L["exercices_durees"] = [
        (geste, grain, d.durees_fourchette[(geste, grain)][0],
         d.durees_fourchette[(geste, grain)][1], d.durees[(geste, grain)])
        for (geste, grain) in sorted(d.durees)]

    L["competences_modes_admis"] = sorted(
        (c, m) for c, ms in d.modes_admis.items() for m in ms)

    L["types_objet"] = [
        (code, sorted(o.crans), o.exclusions_parcours, o.libelle)
        for code, o in sorted(d.objets.items())]

    # L'appariement forme × grain du `06-` §2 — LU à la source par
    # `noyau/doctrine.py`, jamais recopié (`08-` §5 bis).
    L["demonstrations_formes"] = sorted(d.formes_demonstration.items())

    L["exercices_types_modes"] = sorted(
        (code, comp, [m for m in o.modes if m in d.modes_admis.get(comp, [])])
        for code, o in d.objets.items() for comp in o.competences
        if [m for m in o.modes if m in d.modes_admis.get(comp, [])])

    L["exercices_types_modes_source"] = sorted(
        (code, mode) + d.source_par_mode[(code, mode)]
        for code, o in d.objets.items() for mode in o.modes)

    # Les routes : une ligne par (objet, mode, cran, compétence, observable).
    rtes = []
    for (objet, mode), routes in d.routes.items():
        for r in routes:
            for cran in r.crans:
                rtes.append((objet, mode, cran, r.competence, r.code, r.observable,
                             r.fichier, r.section))
    L["exercices_routes"] = sorted(rtes)

    # Les consignes des six crans qui isolent — clé (compétence, section, cran).
    cons = []
    for (comp, section), inst in sorted(d.instances.items()):
        for cran, v in sorted(inst.consignes.items()):
            cons.append((comp, section, cran, inst.nom,
                         inst.code_composition, inst.code_reception,
                         inst.defaut_injecte, v["appui"], v["consigne"]))
    L["exercices_consignes_isolees"] = cons

    L["exercices_consignes_production"] = sorted(
        (mode, cran, patron) for (mode, cran), patron in d.consignes_production.items())

    guides = [(code, None, g["figure"], g[2], g[6])
              for code, g in sorted(d.guides_production.items())]
    guides += [(code, genre, None, None, texte)
               for (code, genre), texte in sorted(d.guides_genre.items())]
    L["exercices_guides_production"] = guides

    # `exercices_types_crans` — deux des trois colonnes se dérivent ; la
    # troisième, `couverture_observables`, ne se dérive du manifeste QU'AUX SIX
    # CRANS QUI ISOLENT (voir la note du bas de fichier).
    tc = []
    for code, o in sorted(d.objets.items()):
        for cran in sorted(o.crans):
            c = d.crans[cran]
            # ⭐ LES DEUX CORRECTIONS DU `02-` §2.4, dans l'ordre que la source
            #    écrit — le quart d'abord, le doublement ensuite.
            #    (1) un `élément` de grain `micro` — le mot, la phrase — vaut le
            #        QUART de sa cellule, plancher 2 : au `micro`, un moment est
            #        une problématisation entière quand un élément est UN MOT.
            #    (2) un cran à paire fait DEUX cas (`02-` §2.3.1 a) : sa durée
            #        DOUBLE. C'est le budget du cycle qui payait l'écart —
            #        `duree_exercice_min` est « la seule valeur que le budget
            #        décompte » (`01-` §5).
            # ⛔ La table `exercices_durees` reste la table BRUTE, à neuf
            #    cellules : les corrections portent sur la valeur SERVIE par
            #    type × cran, pas sur la dérivation du geste et du grain.
            duree = d.durees[(c.geste, o.grain)]
            if o.nature.startswith("élément") and o.grain == "micro":
                duree = max(2, duree // 4)
            if c.geste == "diagnostiquer":
                duree *= 2
            cible = [] if c.materiau_cible == "null" else list(d.cible_provenances)
            if cran in CRANS_QUI_ISOLENT:
                obs = sorted({(r.competence, r.code, r.observable, mode)
                              for (ob, mode), rs in d.routes.items() if ob == code
                              for r in rs if cran in r.crans})
                couv = {"valeur": "isole",
                        "source": "instances/04-*.md — lignes <!-- ROUTAGE -->",
                        "observables": [{"competence": a, "code": b, "nom": n, "mode": m}
                                        for (a, b, n, m) in obs]}
            else:
                # Aux trois crans de production, la couverture ne vaut pas la
                # même chose pour toutes les compétences de l'objet : celles que
                # le §6 de leur fiche déclare ciblable ICI sont `exerce`, les
                # autres `observable_seul` — le RÉSIDU du `04-` §0.
                ex = sorted(c for c in o.competences
                            if code in d.production.get(c, ()))
                couv = {"valeur": "exerce",
                        "source": "competences/*.md §6 — lignes <!-- PRODUCTION -->",
                        "exerce": ex,
                        "observable_seul": sorted(set(o.competences) - set(ex))}
            tc.append((code, cran, couv, cible, duree))
    L["exercices_types_crans"] = tc

    # ⭐ C7-L2 — LA GRILLE DU `09-`, LES TESTS, LES PIÈCES, LE MARQUAGE DU GABARIT.
    L["exercices_problemes"] = [
        (p.objet, p.genre, p.cle, p.constituant, p.variante, p.mode, p.observable_texte,
         p.observable_code, p.competence, p.mode_receptif, p.route, p.forme, p.grains,
         p.enonce, p.exemple, p.correction, p.banque, p.note, p.section)
        for p in d.problemes]
    L["exercices_tests"] = [(t.objet, t.genre, t.cle, t.variante, t.enonce) for t in d.tests]
    L["exercices_pieces"] = [(pc.objet, pc.genre, pc.cle, pc.constituant, pc.enonce)
                             for pc in d.pieces]
    L["exercices_marquage_gabarit"] = list(d.marquage_gabarit)
    # ⭐ C7-L5 — une ligne par objet ou (objet, genre) ; les constituants en JSON.
    L["exercices_fiches_objets"] = [
        (f.objet, f.genre, f.objet + ("." + f.genre if f.genre else ""), f.libelle, f.definition,
         json.dumps(f.constituants, ensure_ascii=False), f.joint, f.test, f.dit_a_leleve,
         f.exemplaire, "true" if f.exemplaire_brouillon else "false", f.contre_exemple)
        for f in d.fiches]

    return L


# ---------------------------------------------------------------------------
# Le SQL
# ---------------------------------------------------------------------------

def q(v):
    """Un littéral SQL — le texte des sources passe tel quel, apostrophes comprises."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, (list, tuple)):
        return "array[" + ",".join(q(x) for x in v) + "]::text[]"
    if isinstance(v, dict):
        return "%s::jsonb" % q(json.dumps(v, ensure_ascii=False, sort_keys=True))
    return "'" + str(v).replace("'", "''") + "'"


def _bloc_values(rows):
    """Les lignes d'un VALUES, une par ligne de fichier — lisible et diffable."""
    return ",\n       ".join("(" + ",".join(q(x) for x in r) + ")" for r in rows)


def sql_remplissage(d, racine):
    L = lignes(d)
    o = []
    w = o.append
    w("-- ============================================================================")
    w("-- LA DOCTRINE DÉRIVÉE — engendré par %s" % OUTIL)
    w("-- Racine lue : %s" % racine)
    w("-- %s" % d.resume())
    w("-- ⚠️ NE PAS ÉDITER À LA MAIN. Ce fichier est une SORTIE : le corriger le")
    w("--    ferait diverger de la source au premier passage suivant.")
    w("-- ============================================================================")
    w("begin;")
    w("")
    w("-- Le remplacement est intégral et transactionnel : une passe rend l'état")
    w("-- des sources à cet instant, jamais un état mêlé.")
    for t in ("exercices_routes", "exercices_consignes_isolees",
              "exercices_consignes_production", "exercices_guides_production",
              "exercices_types_modes_source", "exercices_types_modes",
              "exercices_types_crans", "competences_modes_admis",
              "exercices_durees", "exercices_crans", "demonstrations_formes",
              "exercices_problemes", "exercices_tests", "exercices_pieces",
              "exercices_marquage_gabarit", "exercices_fiches_objets"):
        w("delete from %s;" % t)
    w("")

    w("-- ── Les neuf crans — `02-` §2.1 et §2.2 ──────────────────────────────────")
    w("insert into exercices_crans (cran,code,geste,appui,fait,palier_vise,"
      "materiau_cible,defaut,distracteurs,reponse_attendue,guide,jugement,"
      "couverture_observables,regime_v1vf,marquage,longueur) values\n       %s;"
      % _bloc_values(L["exercices_crans"]))
    w("")

    w("-- ── Les durées — `02-` §2.4, borne HAUTE de la cellule geste × grain ─────")
    w("insert into exercices_durees (geste,grain,borne_min,borne_max,duree_min) values\n       %s;"
      % _bloc_values(L["exercices_durees"]))
    w("")

    w("-- ── Les modes admis par compétence — `02-` §3 ────────────────────────────")
    w("insert into competences_modes_admis (competence,mode) values\n       %s;"
      % _bloc_values(L["competences_modes_admis"]))
    w("")

    w("-- ── Les `crans[]`, `exclusions_parcours[]` et le libellé — `04-` ; `02-` §4 ─")
    w("update exercices_types t set crans_admis = v.crans, exclusions_parcours = v.excl,"
      " libelle = v.libelle, updated_at = now()")
    w("  from (values\n       %s) as v(code, crans, excl, libelle)"
      % _bloc_values([(c, [str(x) for x in crans], excl, lib)
                      for c, crans, excl, lib in L["types_objet"]]))
    w(" where t.code = v.code;")
    w("")

    w("-- ── L'appariement forme × grain des démonstrations — `06-` §2 ────────────")
    w("insert into demonstrations_formes (forme, grain) values\n       %s;"
      % _bloc_values(L["demonstrations_formes"]))
    w("")

    w("-- ── Les `modes[]` par compétence — `04-` en-têtes ∩ `02-` §3 ─────────────")
    w("insert into exercices_types_modes (type_id,competence,modes)")
    w("select t.id, v.competence, v.modes from (values\n       %s) as v(code, competence, modes)"
      % _bloc_values(L["exercices_types_modes"]))
    w("  join exercices_types t on t.code = v.code;")
    w("")

    w("-- ── Le `materiau_source` par objet × mode — `04-` §0 ─────────────────────")
    w("insert into exercices_types_modes_source (type_id,mode,provenances_admises,supports_admis)")
    w("select t.id, v.mode, v.prov, v.supp from (values\n       %s) as v(code, mode, prov, supp)"
      % _bloc_values(L["exercices_types_modes_source"]))
    w("  join exercices_types t on t.code = v.code;")
    w("")

    w("-- ── L'axe par cran — couverture, cible, durée ────────────────────────────")
    w("-- `couverture_observables` : `isole` aux six crans qui isolent (lignes")
    w("-- ROUTAGE d'`instances/`), `exerce` aux trois crans de production (lignes")
    w("-- PRODUCTION du §6 des fiches) — `04-` §0, ses trois opérandes.")
    w("-- `provenances_admises_source` reste NULL : son domicile est")
    w("-- `exercices_types_modes_source` (`02-` §2.3 : « aucun cran ne le borne »).")
    # ⭐ C4-L11 — `cran` EST UN ENTIER, comme dans les trois autres tables de
    #    doctrine (`exercices_crans`, `exercices_routes`,
    #    `exercices_consignes_production`). Cette table était la SEULE à le
    #    porter en texte, et le code payait l'aller-retour (`String(cran)` d'un
    #    côté, `Number(cran)` de l'autre). L'arbitrage de la forme du `cran` —
    #    LE NUMÉRO FAIT FOI (`utils/cran.ts`) — se joue ici pour la doctrine :
    #    « corriger la base à la main la ferait diverger au prochain passage ».
    w("insert into exercices_types_crans (type_id,cran,couverture_observables,"
      "provenances_admises_cible,duree_exercice_min)")
    w("select t.id, v.cran, v.couv, v.cible, v.duree")
    w("  from (values\n       %s) as v(code, cran, couv, cible, duree)"
      % _bloc_values([(c, cr, couv, cible, duree)
                      for c, cr, couv, cible, duree in L["exercices_types_crans"]]))
    w("  join exercices_types t on t.code = v.code;")
    w("")

    w("-- ── Les routes — observable × objet × mode × cran ────────────────────────")
    w("insert into exercices_routes (type_id,objet_code,mode,cran,competence,"
      "observable_code,observable_nom,source_fichier,source_section)")
    w("select t.id, v.* from (values\n       %s)"
      % _bloc_values(L["exercices_routes"]))
    w("  as v(objet_code, mode, cran, competence, observable_code, observable_nom,"
      " source_fichier, source_section)")
    w("  join exercices_types t on t.code = v.objet_code;")
    w("")

    w("-- ── Les consignes des six crans qui isolent — `instances/04-*.md` ────────")
    w("insert into exercices_consignes_isolees (competence,source_section,cran,"
      "observable_nom,observable_code_composition,observable_code_reception,"
      "defaut_injecte,appui,consigne) values\n       %s;"
      % _bloc_values(L["exercices_consignes_isolees"]))
    w("")

    w("-- ── Les quinze patrons de production — `04-` §14.1 ───────────────────────")
    w("insert into exercices_consignes_production (mode,cran,patron) values\n       %s;"
      % _bloc_values(L["exercices_consignes_production"]))
    w("")

    w("-- ── Les guides de production — `04-` §14.2, genre compris ────────────────")
    w("insert into exercices_guides_production (type_id,objet_code,genre,figure,"
      "guide_cran2,guide_cran6)")
    w("select t.id, v.* from (values\n       %s)"
      % _bloc_values(L["exercices_guides_production"]))
    w("  as v(objet_code, genre, figure, guide_cran2, guide_cran6)")
    w("  join exercices_types t on t.code = v.objet_code;")
    w("")

    w("-- ── ⭐ C7-L2 — la grille des problèmes du `09-` ────────────────────────────")
    w("insert into exercices_problemes (type_id,objet_code,genre,cle,constituant,"
      "variante_probleme,mode_probleme,observable_texte,observable_code,"
      "observable_competence,mode_receptif,observable_route,forme,grains,enonce,"
      "exemple,correction,banque,note,source_section)")
    w("select t.id, v.* from (values\n       %s)" % _bloc_values(L["exercices_problemes"]))
    w("  as v(objet_code, genre, cle, constituant, variante_probleme, mode_probleme,"
      " observable_texte, observable_code, observable_competence, mode_receptif,"
      " observable_route, forme, grains, enonce, exemple, correction, banque, note,"
      " source_section)")
    w("  join exercices_types t on t.code = v.objet_code;")
    w("")
    w("-- ── Les tests du cran 6 — `09-`, une clé par question ────────────────────")
    w("insert into exercices_tests (type_id,objet_code,genre,cle,n,question)")
    w("select t.id, v.* from (values\n       %s)" % _bloc_values(L["exercices_tests"]))
    w("  as v(objet_code, genre, cle, n, question)")
    w("  join exercices_types t on t.code = v.objet_code;")
    w("")
    w("-- ── La pièce du cran 2 et son geste — `09-` ──────────────────────────────")
    w("insert into exercices_pieces (type_id,objet_code,genre,cle,piece,geste)")
    w("select t.id, v.* from (values\n       %s)" % _bloc_values(L["exercices_pieces"]))
    w("  as v(objet_code, genre, cle, piece, geste)")
    w("  join exercices_types t on t.code = v.objet_code;")
    w("")
    w("-- ── Le marquage du gabarit — `10-` §5, cran × variante ──────────────────")
    w("insert into exercices_marquage_gabarit (cran,variante,marquage) values\n       %s;"
      % _bloc_values(L["exercices_marquage_gabarit"]))
    w("")
    w("-- ── Les fiches des objets — `09-`, la tête de chaque fiche (C7-L5) ────────")
    w("insert into exercices_fiches_objets (type_id,objet_code,genre,cle,libelle,definition,"
      "constituants,joint,test,dit_a_leleve,exemplaire,exemplaire_brouillon,contre_exemple)")
    w("select t.id, v.objet_code, v.genre, v.cle, v.libelle, v.definition, v.constituants::jsonb,"
      " v.joint, v.test, v.dit_a_leleve, v.exemplaire, v.exemplaire_brouillon::boolean, v.contre_exemple")
    w("  from (values\n       %s)" % _bloc_values(L["exercices_fiches_objets"]))
    w("  as v(objet_code, genre, cle, libelle, definition, constituants, joint, test, dit_a_leleve,"
      " exemplaire, exemplaire_brouillon, contre_exemple)")
    w("  join exercices_types t on t.code = v.objet_code;")
    w("")

    comptes = {k: len(v) for k, v in sorted(L.items())}
    w("-- ── Le journal de dérivation ─────────────────────────────────────────────")
    w("insert into doctrine_derivation (racine,outil,resume,empreintes,comptes) "
      "values (%s,%s,%s,%s,%s);"
      % (q(racine), q(OUTIL), q(d.resume()), q(d.empreintes), q(comptes)))
    w("")
    w("commit;")
    w("")
    w("-- Le constat, à lire après exécution.")
    w("select 'crans='||(select count(*) from exercices_crans)")
    w("    ||' durees='||(select count(*) from exercices_durees)")
    w("    ||' modes_admis='||(select count(*) from competences_modes_admis)")
    w("    ||' types_crans='||(select count(*) from exercices_types_crans)")
    w("    ||' types_modes='||(select count(*) from exercices_types_modes)")
    w("    ||' source_par_mode='||(select count(*) from exercices_types_modes_source)")
    w("    ||' routes='||(select count(*) from exercices_routes)")
    w("    ||' consignes_isolees='||(select count(*) from exercices_consignes_isolees)")
    w("    ||' patrons='||(select count(*) from exercices_consignes_production)")
    w("    ||' guides='||(select count(*) from exercices_guides_production)")
    w("    ||' problemes='||(select count(*) from exercices_problemes)")
    w("    ||' tests='||(select count(*) from exercices_tests)")
    w("    ||' pieces='||(select count(*) from exercices_pieces)")
    w("    ||' marquage_gabarit='||(select count(*) from exercices_marquage_gabarit)")
    w("    ||' fiches_objets='||(select count(*) from exercices_fiches_objets)")
    w("    ||' objets_avec_crans='||(select count(*) from exercices_types "
      "where coalesce(array_length(crans_admis,1),0) > 0) as constat;")
    return "\n".join(o) + "\n"


def fixture(d, racine):
    """Les LIGNES, telles que la base les porte — pas un second modèle.

    C'est la fixture des tests du port TypeScript. Elle a la forme exacte de ce
    que le chargeur lit en base : un seul chemin d'assemblage, donc rien qui
    puisse diverger entre le test et la production. Elle est une SORTIE de ce
    script, jamais un fichier qu'on édite ; `--verifie` dit si elle a divergé.
    """
    L = lignes(d)
    cols = {
        "exercices_crans": ("cran", "code", "geste", "appui", "fait", "palier_vise",
                            "materiau_cible", "defaut", "distracteurs",
                            "reponse_attendue", "guide", "jugement",
                            "couverture_observables", "regime_v1vf",
                            "marquage", "longueur"),
        "exercices_durees": ("geste", "grain", "borne_min", "borne_max", "duree_min"),
        "competences_modes_admis": ("competence", "mode"),
        "exercices_consignes_production": ("mode", "cran", "patron"),
        "demonstrations_formes": ("forme", "grain"),
        "exercices_types_modes": ("objet_code", "competence", "modes"),
        "exercices_types_modes_source": ("objet_code", "mode",
                                         "provenances_admises", "supports_admis"),
        "exercices_routes": ("objet_code", "mode", "cran", "competence",
                             "observable_code", "observable_nom",
                             "source_fichier", "source_section"),
        "exercices_consignes_isolees": ("competence", "source_section", "cran",
                                        "observable_nom",
                                        "observable_code_composition",
                                        "observable_code_reception",
                                        "defaut_injecte", "appui", "consigne"),
        "exercices_guides_production": ("objet_code", "genre", "figure",
                                        "guide_cran2", "guide_cran6"),
        # ⭐ C7-L2
        "exercices_problemes": ("objet_code", "genre", "cle", "constituant",
                                "variante_probleme", "mode_probleme", "observable_texte",
                                "observable_code", "observable_competence", "mode_receptif",
                                "observable_route", "forme", "grains", "enonce", "exemple",
                                "correction", "banque", "note", "source_section"),
        "exercices_tests": ("objet_code", "genre", "cle", "n", "question"),
        "exercices_pieces": ("objet_code", "genre", "cle", "piece", "geste"),
        "exercices_marquage_gabarit": ("cran", "variante", "marquage"),
        # ⭐ C7-L5
        "exercices_fiches_objets": ("objet_code", "genre", "cle", "libelle", "definition",
                                    "constituants", "joint", "test", "dit_a_leleve", "exemplaire",
                                    "exemplaire_brouillon", "contre_exemple"),
    }
    out = {t: [dict(zip(c, r)) for r in L[t]] for t, c in cols.items()}
    # la fixture porte le booléen et le JSON en clair, comme la base les rend
    for r in out["exercices_fiches_objets"]:
        r["exemplaire_brouillon"] = r["exemplaire_brouillon"] == "true"
        r["constituants"] = json.loads(r["constituants"])
    out["exercices_types"] = [
        {"code": code, "nature": o.nature, "grain": o.grain, "libelle": o.libelle,
         "supports_source": o.support_source, "genres_admis": o.genres,
         "competences": o.competences, "crans_admis": sorted(o.crans),
         "exclusions_parcours": o.exclusions_parcours,
         "modes_objet": o.modes}
        for code, o in sorted(d.objets.items())]
    out["exercices_types_crans"] = [
        {"objet_code": c, "cran": cr, "couverture_observables": couv,
         "provenances_admises_cible": cible, "duree_exercice_min": duree}
        for c, cr, couv, cible, duree in L["exercices_types_crans"]]
    out["_derivation"] = {"racine": racine, "outil": OUTIL,
                          "resume": d.resume(), "empreintes": d.empreintes}
    return out


def _sans_racine(f):
    """La fixture, débarrassée du seul champ qui porte un chemin absolu.

    C4-L11. `_derivation.racine` est une TRACE DE PROVENANCE — elle reste dans
    le fichier committé, et elle reste utile : elle dit d'où la fixture vient.
    Mais elle vivait DANS ce que l'empreinte compare : sur une machine où le
    dépôt de conception n'est pas au même chemin absolu, `--verifie` disait
    FIXTURE : DIVERGE alors que les treize tables étaient identiques à l'octet
    — et `npm test` ne pouvait donc passer ni en intégration continue, ni sur
    un second poste. Elle sort de la COMPARAISON, jamais du fichier.
    """
    f = dict(f)
    d = dict(f.get("_derivation", {}))
    d.pop("racine", None)
    f["_derivation"] = d
    return f


def empreinte_fixture(d, racine):
    """L'empreinte du contenu de la fixture — ce que `--verifie` compare."""
    plat = json.dumps(_sans_racine(fixture(d, racine)), ensure_ascii=False,
                      sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(plat.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Le contrôle de divergence
# ---------------------------------------------------------------------------

# (table, colonnes comparées, colonnes de la clé lisible)
COMPARAISONS = [
    # ⭐ C4-L15 — `marquage` et `longueur` entrent à la COMPARAISON, pas
    #    seulement à l'insert : une colonne dérivée qu'aucun contrôle ne relit
    #    est une colonne qui peut prendre du retard sans que rien ne le dise.
    #    ⚠️ Elles sont NULL aux crans 2, 6 et 8, et l'`except` les compare bien :
    #    il départage par DISTINCTION, pas par égalité — `null` y vaut `null`.
    #    (Les grandes tables ci-dessous, elles, comparent une CONCATÉNATION, où
    #    un `null` annulerait la ligne entière : c'est pourquoi elles portent des
    #    `coalesce` et pas celle-ci. Deux mécanismes, deux précautions.)
    ("exercices_crans",
     "cran,code,geste,appui,fait,palier_vise,materiau_cible,defaut,distracteurs,"
     "reponse_attendue,guide,jugement,couverture_observables,regime_v1vf,"
     "marquage,longueur",
     "int,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text"),
    ("exercices_durees", "geste,grain,borne_min,borne_max,duree_min",
     "text,text,int,int,int"),
    ("competences_modes_admis", "competence,mode", "text,text"),
    ("exercices_consignes_production", "mode,cran,patron", "text,int,text"),
    ("demonstrations_formes", "forme,grain", "text,text"),
    # ⭐ C7-L2 — le marquage du gabarit, onze lignes, comparées telles quelles.
    ("exercices_marquage_gabarit", "cran,variante,marquage", "int,text,text"),
]


def sql_verification(d, racine):
    """NE MODIFIE RIEN. Reconstruit l'attendu et le diffe symétriquement."""
    L = lignes(d)
    o = []
    w = o.append
    w("-- ============================================================================")
    w("-- CONTRÔLE DE DÉRIVATION — engendré par %s" % OUTIL)
    w("-- Racine lue : %s" % racine)
    w("-- Ce script NE MODIFIE RIEN : il lit, il compare, il rend un verdict.")
    w("-- ============================================================================")
    w("\\set ON_ERROR_STOP on")
    w("begin;  -- lecture seule, terminée par un rollback")
    w("")

    # (a) Les empreintes des sources contre celles de la dernière dérivation.
    w("-- ── (a) Les SOURCES ont-elles bougé depuis la dernière dérivation ? ──────")
    w("create temp table attendu_empreintes(fichier text primary key, sha text) on commit drop;")
    w("insert into attendu_empreintes values\n       %s;"
      % _bloc_values(sorted(d.empreintes.items())))
    w("""
select case
  when (select count(*) from doctrine_derivation) = 0
    then 'SOURCES : AUCUNE DÉRIVATION EN BASE — jouer --sql d''abord'
  when not exists (
    select 1 from attendu_empreintes a
    full join (select key as fichier, value #>> '{}' as sha
                 from doctrine_derivation d, jsonb_each(d.empreintes)
                where d.derive_at = (select max(derive_at) from doctrine_derivation)) b
      on b.fichier = a.fichier
   where a.sha is distinct from b.sha)
    then 'SOURCES : IDENTIQUE'
  else 'SOURCES : DIVERGE — ' || (
    select string_agg(coalesce(a.fichier, b.fichier), ', ')
      from attendu_empreintes a
      full join (select key as fichier, value #>> '{}' as sha
                   from doctrine_derivation d, jsonb_each(d.empreintes)
                  where d.derive_at = (select max(derive_at) from doctrine_derivation)) b
        on b.fichier = a.fichier
     where a.sha is distinct from b.sha)
end as verdict_sources;""")
    w("")

    # (b) Les lignes en base contre les lignes attendues, dans les deux sens.
    w("-- ── (b) La BASE a-t-elle bougé depuis la dérivation ? ────────────────────")
    w("-- Diff SYMÉTRIQUE : ce qui manque en base ET ce qui y est en trop.")
    for table, cols, types in COMPARAISONS:
        colonnes = cols.split(",")
        w("create temp table attendu_%s (%s) on commit drop;"
          % (table, ",".join("%s %s" % (c, t) for c, t in zip(colonnes, types.split(",")))))
        if L[table]:
            w("insert into attendu_%s values\n       %s;" % (table, _bloc_values(L[table])))
        w("""select '%(t)s : ' || case
  when (select count(*) from ((select %(c)s from attendu_%(t)s) except (select %(c)s from %(t)s)) x) = 0
   and (select count(*) from ((select %(c)s from %(t)s) except (select %(c)s from attendu_%(t)s)) y) = 0
    then 'IDENTIQUE (' || (select count(*) from %(t)s) || ' lignes)'
  else 'DIVERGE — ' ||
    (select count(*) from ((select %(c)s from attendu_%(t)s) except (select %(c)s from %(t)s)) x)
    || ' manquantes en base, ' ||
    (select count(*) from ((select %(c)s from %(t)s) except (select %(c)s from attendu_%(t)s)) y)
    || ' en trop'
end as verdict;""" % {"t": table, "c": cols})
        w("")

    # Les grosses tables se comparent par compte et par empreinte de contenu :
    # la ligne à ligne y coûterait un fichier de plusieurs mégaoctets.
    w("-- ── Les grandes tables : compte et empreinte de contenu ──────────────────")
    gros = {
        "exercices_routes":
            ("objet_code||'|'||mode||'|'||cran||'|'||competence||'|'||observable_code"
             "||'|'||observable_nom||'|'||source_fichier||'|'||source_section",
             [ "%s|%s|%s|%s|%s|%s|%s|%s" % r for r in L["exercices_routes"] ]),
        "exercices_consignes_isolees":
            ("competence||'|'||source_section||'|'||cran||'|'||observable_nom||'|'||"
             "observable_code_composition||'|'||observable_code_reception||'|'||"
             "defaut_injecte||'|'||appui||'|'||consigne",
             [ "%s|%s|%s|%s|%s|%s|%s|%s|%s" % r for r in L["exercices_consignes_isolees"] ]),
        "exercices_guides_production":
            ("objet_code||'|'||coalesce(genre,'')||'|'||coalesce(figure,'')||'|'||"
             "coalesce(guide_cran2,'')||'|'||coalesce(guide_cran6,'')",
             [ "%s|%s|%s|%s|%s" % tuple(x if x is not None else "" for x in r)
               for r in L["exercices_guides_production"] ]),
        "exercices_types_modes_source":
            ("t.code||'|'||s.mode||'|'||array_to_string(s.provenances_admises,',')||'|'||"
             "array_to_string(s.supports_admis,',')",
             [ "%s|%s|%s|%s" % (c, m, ",".join(p), ",".join(su))
               for (c, m, p, su) in L["exercices_types_modes_source"] ]),
        "exercices_types_modes":
            ("t.code||'|'||m.competence||'|'||array_to_string(m.modes,',')",
             [ "%s|%s|%s" % (c, comp, ",".join(ms))
               for (c, comp, ms) in L["exercices_types_modes"] ]),
        # ⭐ C7-L2 — la grille, les tests et les pièces : concaténation avec `coalesce`.
        "exercices_problemes":
            ("cle||'|'||coalesce(genre,'')||'|'||constituant||'|'||mode_probleme||'|'||"
             "coalesce(observable_code,'')||'|'||coalesce(observable_competence,'')||'|'||"
             "observable_route::text||'|'||forme||'|'||array_to_string(grains,',')||'|'||enonce"
             "||'|'||coalesce(exemple,'')||'|'||coalesce(correction,'')",
             [ "%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s" % (
                 p.cle, p.genre or "", p.constituant, p.mode, p.observable_code or "",
                 p.competence or "", "true" if p.route else "false", p.forme,
                 ",".join(p.grains), p.enonce, p.exemple or "", p.correction or "")
               for p in d.problemes ]),
        "exercices_tests":
            ("cle||'|'||question", [ "%s|%s" % (t.cle, t.enonce) for t in d.tests ]),
        "exercices_pieces":
            ("cle||'|'||piece||'|'||geste",
             [ "%s|%s|%s" % (pc.cle, pc.constituant, pc.enonce) for pc in d.pieces ]),
        # ⭐ C7-L5 — la fiche entière, champ par champ, dans l'ordre de la table.
        "exercices_fiches_objets":
            ("cle||'|'||coalesce(definition,'')||'|'||coalesce(exemplaire,'')||'|'||coalesce(contre_exemple,'')||'|'||jsonb_array_length(constituants)",
             [ "%s|%s|%s|%s|%d" % (f.objet + ("." + f.genre if f.genre else ""), f.definition or "",
                                     f.exemplaire or "", f.contre_exemple or "", len(f.constituants))
               for f in d.fiches ]),
    }
    for table, (expr, valeurs) in gros.items():
        source = table
        if table in ("exercices_types_modes_source", "exercices_types_modes"):
            alias = "s" if table.endswith("source") else "m"
            source = "%s %s join exercices_types t on t.id = %s.type_id" % (table, alias, alias)
        w("create temp table attendu_%s_txt(v text) on commit drop;" % table)
        if valeurs:
            w("insert into attendu_%s_txt values\n       %s;"
              % (table, _bloc_values([(v,) for v in valeurs])))
        w("""select '%(t)s : ' || case
  when (select count(*) from ((select v from attendu_%(t)s_txt) except (select %(e)s from %(s)s)) x) = 0
   and (select count(*) from ((select %(e)s from %(s)s) except (select v from attendu_%(t)s_txt)) y) = 0
    then 'IDENTIQUE (' || (select count(*) from attendu_%(t)s_txt) || ' lignes)'
  else 'DIVERGE — ' ||
    (select count(*) from ((select v from attendu_%(t)s_txt) except (select %(e)s from %(s)s)) x)
    || ' manquantes en base, ' ||
    (select count(*) from ((select %(e)s from %(s)s) except (select v from attendu_%(t)s_txt)) y)
    || ' en trop'
end as verdict;""" % {"t": table, "e": expr, "s": source})
        w("")

    # ── La DOUZIÈME table — `exercices_types_crans` ──────────────────────────
    # C4-L11 : `--sql` la remplissait, `--verifie` ne la lisait pas — douze
    # tables écrites, onze contrôlées, et la manquante était justement celle où
    # « la couche type se remplit aux crans de production » (`04-` §14 : « aux
    # crans 2, 6 et 8, `couverture_observables` vaut `exerce` »).
    # Elle ne tient pas dans `COMPARAISONS` (le `type_id` est un uuid : il faut
    # joindre `exercices_types` pour retrouver le `code`), ni dans les grandes
    # tables (son `couverture_observables` est du JSONB, qu'une concaténation de
    # texte comparerait sur la sérialisation et non sur le contenu). Elle a donc
    # son bloc, avec le MÊME diff symétrique que les autres.
    # ⚠️ `cran` se compare en `text` des deux côtés : la colonne peut changer de
    #    type sans que ce contrôle mente (`02-` §2.1 donne le # et le code).
    w("-- ── La couche type par cran — `exercices_types_crans` ────────────────────")
    w("create temp table attendu_exercices_types_crans"
      "(code text, cran text, couv jsonb, cible text[], duree int) on commit drop;")
    w("insert into attendu_exercices_types_crans values\n       %s;"
      % _bloc_values([(c, str(cr), couv, cible, duree)
                      for c, cr, couv, cible, duree in L["exercices_types_crans"]]))
    # ⚠️ `cran` se compare en `text` DES DEUX CÔTÉS (la vue ci-dessous le caste) :
    #    le contrôle ne ment donc ni avant ni après le changement de type.
    w("""create temp view base_exercices_types_crans as
  select t.code, tc.cran::text as cran, tc.couverture_observables as couv,
         tc.provenances_admises_cible as cible, tc.duree_exercice_min as duree
    from exercices_types_crans tc join exercices_types t on t.id = tc.type_id;""")
    w("""select 'exercices_types_crans : ' || case
  when (select count(*) from ((select code,cran,couv,cible,duree from attendu_exercices_types_crans)
                       except (select code,cran,couv,cible,duree from base_exercices_types_crans)) x) = 0
   and (select count(*) from ((select code,cran,couv,cible,duree from base_exercices_types_crans)
                       except (select code,cran,couv,cible,duree from attendu_exercices_types_crans)) y) = 0
    then 'IDENTIQUE (' || (select count(*) from base_exercices_types_crans) || ' lignes)'
  else 'DIVERGE — ' ||
    (select count(*) from ((select code,cran,couv,cible,duree from attendu_exercices_types_crans)
                    except (select code,cran,couv,cible,duree from base_exercices_types_crans)) x)
    || ' manquantes en base, ' ||
    (select count(*) from ((select code,cran,couv,cible,duree from base_exercices_types_crans)
                    except (select code,cran,couv,cible,duree from attendu_exercices_types_crans)) y)
    || ' en trop'
end as verdict;""")
    w("")

    w("-- ── Les `crans[]` et `exclusions_parcours[]` sur les objets ──────────────")
    w("create temp table attendu_types_objet(code text primary key, crans text[], excl text[], libelle text) on commit drop;")
    w("insert into attendu_types_objet values\n       %s;"
      % _bloc_values([(c, [str(x) for x in crans], excl, lib)
                      for c, crans, excl, lib in L["types_objet"]]))
    w("""select 'exercices_types (crans_admis, exclusions_parcours, libelle) : ' || case
  when (select count(*) from attendu_types_objet a join exercices_types t on t.code = a.code
         where t.crans_admis is distinct from a.crans
            or t.exclusions_parcours is distinct from a.excl
            or t.libelle is distinct from a.libelle) = 0
   and (select count(*) from attendu_types_objet) =
       (select count(*) from exercices_types where nature <> 'complet')
    then 'IDENTIQUE (' || (select count(*) from attendu_types_objet) || ' objets)'
  else 'DIVERGE — ' || (select count(*) from attendu_types_objet a
         join exercices_types t on t.code = a.code
        where t.crans_admis is distinct from a.crans
           or t.exclusions_parcours is distinct from a.excl
           or t.libelle is distinct from a.libelle) || ' objets en écart'
end as verdict;""")
    w("")
    w("rollback;  -- ce contrôle ne modifie rien")
    w("")
    w("-- ── (c) La FIXTURE des tests du port a-t-elle divergé ? ─────────────────")
    w("-- (vérifié hors SQL — voir le verdict imprimé sur la sortie d'erreur)")
    return "\n".join(o) + "\n"


# ---------------------------------------------------------------------------

def main(argv=None):
    p = argparse.ArgumentParser(
        description="La doctrine, dérivée des sources et versée en base.")
    p.add_argument("--racine", default=RACINE_DEFAUT,
                   help="le dépôt palimpseste-conception (défaut : le chemin du manifeste)")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--sql", action="store_true", help="le SQL de remplissage")
    g.add_argument("--verifie", action="store_true", help="le SQL du contrôle de divergence")
    g.add_argument("--resume", action="store_true", help="ce qui a été lu, sans SQL")
    g.add_argument("--fixture", action="store_true",
                   help="les lignes en JSON — la fixture des tests du port TS")
    a = p.parse_args(argv)

    racine = os.path.abspath(a.racine)
    if not os.path.isdir(racine):
        sys.stderr.write("✗ racine introuvable : %s\n" % racine)
        return 2
    try:
        d = charge(racine)
    except Exception as e:                       # SourceMouvante et lectures ratées
        sys.stderr.write("✗ %s\n" % e)
        return 1

    if a.resume:
        L = lignes(d)
        sys.stderr.write("✓ %s\n" % d.resume())
        for t, v in sorted(L.items()):
            sys.stderr.write("    %-32s %5d lignes\n" % (t, len(v)))
        sys.stderr.write("    empreintes : %d sources\n" % len(d.empreintes))
        return 0

    if a.fixture:
        # COMPACTE : c'est une SORTIE que les tests chargent, jamais un fichier
        # qu'on lit. L'indentation la ferait tripler pour rien.
        sys.stdout.write(json.dumps(fixture(d, racine), ensure_ascii=False,
                                    sort_keys=True, separators=(",", ":")) + "\n")
        sys.stderr.write("✓ %s\n" % d.resume())
        sys.stderr.write("  empreinte de fixture : %s\n" % empreinte_fixture(d, racine))
        return 0
    sys.stdout.write(sql_remplissage(d, racine) if a.sql else sql_verification(d, racine))
    sys.stderr.write("✓ %s\n" % d.resume())
    if a.verifie:
        chemin = os.path.join(os.path.dirname(os.path.dirname(
            os.path.abspath(__file__))), "utils", "fabrique", "doctrine.fixture.json")
        if not os.path.isfile(chemin):
            sys.stderr.write("FIXTURE : ABSENTE — jouer --fixture > %s\n" % chemin)
        else:
            actuel = json.dumps(_sans_racine(json.load(io.open(chemin, encoding="utf-8"))),
                                ensure_ascii=False, sort_keys=True,
                                separators=(",", ":"))
            sha = hashlib.sha256(actuel.encode("utf-8")).hexdigest()
            attendu = empreinte_fixture(d, racine)
            sys.stderr.write("FIXTURE : %s\n" % (
                "IDENTIQUE" if sha == attendu else
                "DIVERGE — la fixture committée ne vient plus de ces sources ; "
                "rejouer --fixture"))
    return 0


if __name__ == "__main__":
    sys.exit(main())


# ============================================================================
# NOTE — `couverture_observables` a TROIS opérandes, et deux domiciles lus ici.
# ----------------------------------------------------------------------------
# Le `04-` §0 :
#   · `isole`           <- la ligne `<!-- ROUTAGE -->` d'`instances/`, aux six
#                          crans qui isolent ;
#   · `exerce`          <- la ligne `<!-- PRODUCTION -->` du §6 de la fiche de
#                          la compétence, aux trois crans de production ;
#   · `observable_seul` <- le RÉSIDU des deux précédentes.
# Les deux lignes sont CITÉES, jamais recopiées : si l'une bouge, le chargement
# refuse. Et la prose du §6 annonce son compte en toutes lettres — c'est ce
# compte qui empêche la ligne et le paragraphe de diverger sans témoin.
# ============================================================================

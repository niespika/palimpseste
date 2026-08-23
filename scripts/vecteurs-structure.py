# -*- coding: utf-8 -*-
"""vecteurs-structure.py — ce que le module de calibration produit, en JSON.

    « Le branchement reproduit, sur les vecteurs embarqués du module —
      `TESTS_CODE1_PARFAIT` et `TESTS_P2_PARFAIT` —, EXACTEMENT ce que
      `python3 code.py --autotest` produit, et sans aucun appel de modèle. »
                                          — le « fait quand » de C4-L10

CE SCRIPT NE TOUCHE À RIEN. Il IMPORTE `copies-tests/structure/code.py` du dépôt
de conception, joue ses vecteurs, et écrit sur la sortie standard, en JSON : LES
ENTRÉES et LES SORTIES de chaque cas. Le test TypeScript rejoue les MÊMES
ENTRÉES sur le branchement et compare LES TROIS CLÉS — pas seulement
`verdicts` : « une trace qui diverge dit qu'un chemin de calcul a changé, même
quand le verdict tombe juste ».

⚠️ L'ÉTAT DE CE MODULE, ET CE QU'IL IMPOSE. `TESTS_P2_PARFAIT` est **VIDE** et
`VERSION_GOLDS_TESTEE` vaut **None** : la Structure repart au Run 1, « les golds
de juillet portaient sur les copies VARIANTES » (constat du 31/07). Les vecteurs
embarqués sont donc **UN** vecteur `code1` et les 52 assertions des arbitrages
A1-A10, et rien d'autre.

⭐⭐ D'OÙ LA CONTRE-ÉPREUVE, ET ELLE EST GRATUITE. La Structure est LA SEULE des
six à porter des ARTEFACTS DE RUN RÉELS : de vrais P1 et de vrais P2, produits
par le banc, dans `copies-tests/structure/resultats/`. On les passe aux DEUX
côtés, sans un appel de modèle et sans un centime. Ils portent ce qu'aucun
vecteur synthétique ne porte : des accents, des apostrophes typographiques, des
`niveau` hors catalogue, des `parties[].blocs` en dictionnaires, des
justifications qui écrivent « 3ème ».

⭐ ET LE BALAYAGE, pour ce que même le réel ne couvre pas :

  · `balayage_cohesion`   — les distributions de 0 à 3 charnières sur les trois
    statuts composables × les cinq états de tissu : les majorités du §4 point 4,
    l'égalité tranchée par la borne basse, et la modulation SATURANTE (A6-A7) ;
  · `balayage_nature`     — la cascade A10, ses quatre branches et leurs
    frontières : intro à gauche, conclusion à droite, parties, étapes ;
  · `balayage_statut`     — les statuts déclarables, les « limite » et leurs
    notes, les valeurs hors catalogue : « le doute ne fabrique pas un statut » ;
  · `balayage_coherence`  — le socle du §4 point 5 : blocs distincts × doublon ×
    retour × ordre nécessaire × clause d'ordre des étapes ;
  · `balayage_paliers`    — les 16 croisements des deux dimensions, atteints PAR
    DES SQUELETTES et non par un appel direct, avec et sans garde-fou Absent ;
  · `balayage_recette`    — CE QUE PYTHON NE VOIT PAS : `\\w` et `\\b` y sont
    UNICODE, et « la 3ème partie » ne contient AUCUN nombre pour lui ;
  · `balayage_blancs`     — `prepare_copie` découpe sur `\\n\\s*\\n+`, et les
    blancs de Python ne sont pas ceux de JavaScript ;
  · `balayage_champs_blancs` — `_n()` fait un `strip()` DE PYTHON sur toutes les
    valeurs d'énumération du squelette : un `\\x85` au bord d'un statut le fait
    reconnaître d'un côté et pas de l'autre ;
  · `balayage_formes`     — les formes que P1 et P2 peuvent prendre et sur
    lesquelles le module LÈVE, quand le contrat §3 l'interdit.

USAGE
    python3 scripts/vecteurs-structure.py [--racine <dépôt de conception>]

SORTIE : un objet JSON sur stdout. Code 0 si le module est chargé et son autotest
vert ; 1 sinon — un portage vérifié contre un module en échec ne prouve rien.
"""

from __future__ import annotations

import argparse
import copy
import glob
import importlib.util
import itertools
import json
import os
import sys

# ⚠️ Le chemin du dépôt de conception est ABSOLU, et c'est délibéré (le dépôt
# n'est pas un sous-dossier de celui-ci). Mais il ne peut pas être le SEUL :
# ailleurs que sur la machine du professeur, aucune commande ne trouvait la
# source, et le contrôle SAUTAIT au lieu de tourner (C4-L11).
RACINE_DEFAUT = (os.environ.get("PALIMPSESTE_RACINE_CONCEPTION")
                 or "/Users/louissagnieres/Documents/GitTest/palimpseste-conception")

# Les trois statuts que le code COMPOSE (fiche §4, point 1). `limite` n'en est
# pas : il se déclare, et la borne basse le résout.
STATUTS = ["absente", "plaquée", "motivée"]


def charge_module(racine):
    chemin = os.path.join(racine, "copies-tests", "structure", "code.py")
    if not os.path.exists(chemin):
        sys.exit("Module introuvable : %s" % chemin)
    spec = importlib.util.spec_from_file_location("code_structure", chemin)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, chemin


# ── Les fabriques de squelettes ────────────────────────────────────────────

def bloc(num, role="developpement", idee="une idée", corr="sans objet"):
    return {"num": num, "role": role, "objet": "objet " + str(num),
            "idee_directrice_citee": idee, "position_idee": "première phrase",
            "correspondance_annonce": corr}


def jointure(entre, texte="Ensuite,", gestes=None, rel="non — rien",
             statut=None, note=None):
    j = {"entre": entre, "fin_bloc_precedent": "fin.", "debut_bloc_suivant": "début.",
         "texte_cite": texte, "gestes": gestes if gestes is not None else [],
         "relation_nommee": rel}
    if statut is not None:
        j["statut"] = statut
    if note is not None:
        j["note"] = note
    return j


def promesse(pb="[absent]", forme="[absent]", annonce="[absente]", etapes=None):
    return {"probleme_pose": pb, "probleme_forme": forme,
            "annonce_de_plan": annonce, "etapes_annoncees": etapes or []}


def squelette(jointures, blocs=None, parties=None, prom=None):
    return {"promesse": prom or promesse(), "blocs": blocs or [],
            "parties": parties or [], "jointures": jointures}


JUG = {"crible": {"retrogradations": []}, "gabarit_repete": True,
       "blocs_objets_distincts": [], "doublon": False, "retour_en_arriere": False,
       "ordre_necessaire": False, "etapes_realisees_dans_lordre": None,
       "justification_ancree": "", "ce_qui_plafonne": "", "levier": "",
       "confiance": "moyenne"}


def passage(m, nom, releve, p2, params=None):
    """Un passage entier : code1 → code2 → conformite, sur les mêmes entrées."""
    params = params or {}
    c1 = m.code1(copy.deepcopy(releve), "", params)
    c2 = m.code2(p2, c1, params)
    conf = m.conformite(copy.deepcopy(releve), p2, c1, c2, params)
    return {
        "nom": nom, "releve": releve, "entree_p2": p2, "params": params,
        "attendu": {
            # `injection_p2` n'est PAS comparé : le module le rend vide, et la
            # chaîne ne construit pas ce canal — « on ne bâtit pas un canal sans
            # client ». Le reste l'est, clé pour clé.
            "code1": {"mesures": c1["mesures"], "document_p2": c1["document_p2"],
                      "alertes": c1["alertes"]},
            "code2": {"verdicts": c2["verdicts"], "trace": c2["trace"],
                      "alertes": c2["alertes"]},
            "conformite": conf,
        },
    }


def cas_code1(m):
    """`TESTS_CODE1_PARFAIT` — UN vecteur, et c'est bien une VRAIE LISTE.

    ⚠️ « Ne compte jamais une constante sans vérifier son TYPE » : chez
    l'Expression, `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu
    « 52 vecteurs » qui étaient 52 caractères. Le type part avec le paquet."""
    cas = []
    for t in m.TESTS_CODE1_PARFAIT:
        r = m.code1(copy.deepcopy(t["sortie_p1"]), "", {})
        cas.append({"nom": t["nom"], "sortie_p1": t["sortie_p1"],
                    "attendu_autotest": t["attendu_mesures"],
                    "attendu": {"mesures": r["mesures"],
                                "document_p2": r["document_p2"],
                                "alertes": r["alertes"]}})
    return cas


# ── ⭐⭐ LA CONTRE-ÉPREUVE — LES ARTEFACTS DE RUN RÉELS ──────────────────────

def artefacts_reels(m, racine):
    """Tous les couples (P1, P2) réellement produits par le banc.

    ⭐ « Donne les mêmes `-p2.json` au module et à ton `code2` TypeScript, et
    compare les trois clés. Aucun appel de modèle, aucune dépense, et c'est une
    preuve que les vecteurs embarqués ne donnent pas. »

    Trois familles, et elles ne portent PAS le même schéma — c'est un avantage,
    pas un défaut : le portage doit tenir sur les deux générations de squelette.

      · `resultats/CopieN-passM-*.json`  — 15 couples du 17/07, squelettes
        d'AVANT la v1.4 : ils déclarent `statut`, un `niveau` hors catalogue
        (« entre-parties »), et rangent les blocs DANS `parties[]`, en
        dictionnaires — ce que `_n()` transforme en `repr()` de dictionnaire ;
      · `resultats/run-.../CopieN-passM-*.json` — 27 couples du 30/07, schéma
        v1.4 : plus de `statut`, plus de `niveau`, le code compose les deux ;
      · `resultats/nested-.../p1-NN.json` × `p2-NN-MM.json` — les bancs nichés
        5×5 : 70 couples de plus, et c'est là que la variance de P2 se voit.

    ⚠️⚠️ ET LES `-p2.json` DU 30/07 NE PORTENT PAS LA SORTIE DE P2 : ils portent
    une ENVELOPPE DE RUN, `{"jugements_modele": …, "calcul_code": …}`. Passée
    telle quelle, elle n'a ni `doublon` ni `retour_en_arriere` — les 97 couples
    tombaient TOUS en `PASSAGE MANQUÉ`, la contre-épreuve était verte, et elle ne
    prouvait qu'une chose : que les deux côtés savent refuser une sortie
    tronquée. On désenveloppe donc, et le fait est dit.
    *Les 15 couples du 17/07, eux, sont bien des sorties de P2 — d'un prompt
    d'AVANT la v1.4, qui rendait `niveau` et `profil_moyen` et ne rendait pas les
    deux booléens obligatoires. Leur `PASSAGE MANQUÉ` est le bon verdict, et il
    est gardé : c'est « le silence du juge ne vaut jamais acquiescement » sur
    pièce.*

    ⛔ `calcul_code` N'EST PAS COMPARÉ. C'est la sortie qu'`agregation-structure.py`
    rendait LE 30 JUILLET — un ancêtre du module courant, qui a bougé depuis
    (`VERSION = "1.1"`, et `profil_moyen` rend « n/a » là où il rendait `null`).
    Le comparer validerait le calcul contre une référence morte, ce que le
    contrat §5 nomme précisément.

    ⚠️ Un couple dont le module LÈVE est CONSERVÉ, avec son motif : c'est
    exactement ce que le portage doit reproduire sans lever (contrat §3), et le
    taire ferait un contrôle qui passe parce qu'il ne regarde pas.
    """
    base = os.path.join(racine, "copies-tests", "structure", "resultats")
    couples = []

    def lit(chemin):
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)

    def sortie_p2(brut):
        """L'enveloppe de run se retire ; une sortie de P2 se garde telle quelle."""
        if isinstance(brut, dict) and "jugements_modele" in brut:
            return brut["jugements_modele"], brut.get("calcul_code")
        return brut, None

    # 1 et 2 — les runs à plat : `X-p1.json` ↔ `X-p2.json`.
    for motif in ("*-p1.json", os.path.join("run-*", "*-p1.json")):
        for p1c in sorted(glob.glob(os.path.join(base, motif))):
            p2c = p1c[: -len("-p1.json")] + "-p2.json"
            if os.path.exists(p2c):
                p2, histo = sortie_p2(lit(p2c))
                couples.append((os.path.relpath(p1c, base), lit(p1c), p2, histo))

    # 3 — les bancs nichés : `p1-NN.json` × `p2-NN-MM.json`.
    for dossier in sorted(glob.glob(os.path.join(base, "nested-*"))):
        for p1c in sorted(glob.glob(os.path.join(dossier, "p1-*.json"))):
            idx = os.path.basename(p1c)[len("p1-"):-len(".json")]
            p1 = lit(p1c)
            for p2c in sorted(glob.glob(os.path.join(dossier, "p2-%s-*.json" % idx))):
                p2, histo = sortie_p2(lit(p2c))
                couples.append((os.path.relpath(p2c, base), p1, p2, histo))

    cas = []
    for nom, p1, p2, histo in couples:
        try:
            c = passage(m, nom, p1, p2)
        except Exception as e:                      # noqa: BLE001 — c'est le sujet
            c = {"nom": nom, "releve": p1, "entree_p2": p2, "params": {},
                 "leve": "%s: %s" % (type(e).__name__, e)}
        # Pour information seulement — jamais comparé (voir la docstring).
        c["enveloppe_de_run"] = histo is not None
        cas.append(c)
    return cas


# ── LE BALAYAGE — la même fonction du même module, sur plus d'entrées ───────

def _sq_charnieres(statuts, tissu):
    """Un squelette dont les charnières portent EXACTEMENT `statuts`.

    Les charnières naissent de deux parties marquées différentes (A10, branche
    2) : c'est la seule façon d'en fabriquer sans dépendre d'une annonce."""
    blocs, parties, jointures = [], [], []
    for i, st in enumerate(statuts):
        g, d = 2 * i + 1, 2 * i + 2
        blocs += [bloc("¶%d" % g), bloc("¶%d" % d)]
        parties += [{"marquee_par": "I.", "blocs": ["¶%d" % g]},
                    {"marquee_par": "II.", "blocs": ["¶%d" % d]}]
        if st == "absente":
            jointures.append(jointure("¶%d → ¶%d" % (g, d), texte="[aucune]"))
        elif st == "motivée":
            jointures.append(jointure("¶%d → ¶%d" % (g, d), texte="Mais cela ne suffit pas.",
                                      gestes=["manque — 'cela ne suffit pas'"]))
        else:
            jointures.append(jointure("¶%d → ¶%d" % (g, d), texte="Ensuite,",
                                      gestes=["relance"]))
    # Le tissu : des coutures entre blocs d'une MÊME partie, donc jamais des
    # charnières. `tissu` est une paire (oui, non).
    n_oui, n_non = tissu
    base = 2 * len(statuts)
    for k in range(n_oui + n_non):
        g, d = base + 2 * k + 1, base + 2 * k + 2
        blocs += [bloc("¶%d" % g), bloc("¶%d" % d)]
        parties.append({"marquee_par": "III.", "blocs": ["¶%d" % g, "¶%d" % d]})
        jointures.append(jointure(
            "¶%d → ¶%d" % (g, d), texte="Ensuite,", gestes=["relance"],
            rel="oui — confirme" if k < n_oui else "non — connecteur nu"))
    return squelette(jointures, blocs, parties)


def balayage_cohesion(m):
    """Les distributions de 0 à 3 charnières × cinq états de tissu.

    Ce que ça éprouve, et qu'aucun vecteur ne couvre en entier : « toutes absente
    → défaillance forte » l'emporte sur la majorité, l'égalité tombe sur la BORNE
    BASSE (A6), la modulation est d'UN CRAN AU MAXIMUM et SATURANTE (A6), le
    tissu ne fait pas tomber une cohésion `satisfaite` mais fait redescendre un
    `haut` (A7, RF13), et sans charnière le § 2c plafonne à `satisfaite`."""
    cas = []
    tissus = [(0, 0), (2, 0), (0, 2), (1, 1), (3, 1)]
    for n in (0, 1, 2, 3):
        for combo in itertools.product(STATUTS, repeat=n):
            for t in tissus:
                for gabarit in (True, False):
                    sq = _sq_charnieres(list(combo), t)
                    p2 = dict(JUG, gabarit_repete=gabarit,
                              blocs_objets_distincts=[b["num"] for b in sq["blocs"][:2]])
                    cas.append(passage(
                        m, "cohesion_%s_t%d-%d_g%s" % ("-".join(combo) or "aucune",
                                                       t[0], t[1], gabarit),
                        sq, p2))
    return cas


def balayage_nature(m):
    """LA CASCADE A10, ses quatre branches et leurs frontières.

    « Sans annonce de plan ni partie marquée, AUCUNE couture n'est une
    charnière » — et le seuil l'emporte sur tout le reste, puisqu'il est premier
    dans la cascade."""
    cas = []
    roles = ["intro", "developpement", "bilan", "conclusion"]
    for rg in roles:
        for rd in roles:
            for parties_marquees in (False, True):
                for etapes in (None, ("étape 1", "étape 1"), ("étape 1", "étape 2")):
                    corr_g = etapes[0] if etapes else "sans objet"
                    corr_d = etapes[1] if etapes else "sans objet"
                    blocs = [bloc("¶1", rg, corr=corr_g), bloc("¶2", rd, corr=corr_d)]
                    parties = ([{"marquee_par": "I.", "blocs": ["¶1"]},
                                {"marquee_par": "II.", "blocs": ["¶2"]}]
                               if parties_marquees else [])
                    sq = squelette([jointure("¶1 → ¶2", texte="Ensuite,",
                                             gestes=["relance"])], blocs, parties)
                    cas.append(passage(
                        m, "nature_%s-%s_p%s_e%s" % (
                            rg, rd, int(parties_marquees),
                            "aucune" if not etapes else "-".join(
                                x.replace(" ", "") for x in etapes)),
                        sq, dict(JUG, blocs_objets_distincts=["¶1", "¶2"])))
    return cas


def balayage_statut(m):
    """LE STATUT DÉCLARÉ, LES « LIMITE » ET LEURS NOTES.

    « Une couture où quelque chose EST écrit ne peut pas être "absente" » ; une
    « limite » sans deux bornes lisibles retombe sur LA COMPOSITION, jamais sur
    la lecture la plus dure. ⚠️ Les bornes se cherchent en SOUS-CHAÎNE, pas en
    mot isolé : « inabsentement » en porte une, et c'est ce que Python fait."""
    cas = []
    declares = [None, "absente", "plaquée", "motivée", "plaquee", "MOTIVÉE",
                "limite", "limit", "n'importe quoi", "  Plaquée  "]
    notes = [None, "hésitation entre plaquée et motivée",
             "entre motivée et absente", "plutôt plaquée",
             "entre inabsentement et motivée", "je ne sais pas",
             "entre absente, plaquée et motivée"]
    textes = ["Ensuite,", "[aucune]", "Or cela reste ouvert."]
    for st in declares:
        for note in notes:
            for txt in textes:
                gestes = (["manque — 'cela reste ouvert'"]
                          if txt.startswith("Or") else ["relance"])
                sq = squelette(
                    [jointure("¶1 → ¶2", texte=txt, gestes=gestes,
                              statut=st, note=note)],
                    [bloc("¶1"), bloc("¶2")],
                    [{"marquee_par": "I.", "blocs": ["¶1"]},
                     {"marquee_par": "II.", "blocs": ["¶2"]}])
                # ⚠️ Les indices voyagent EN CHAMPS, jamais dans le nom : un
                #    statut déclaré « n'importe quoi » porte lui-même un « _n »,
                #    et le lecteur qui découpe le nom lit l'index de travers.
                c = passage(m, "statut_%d_n%d_t%d" % (declares.index(st),
                                                      notes.index(note),
                                                      textes.index(txt)),
                            sq, dict(JUG, blocs_objets_distincts=["¶1", "¶2"]))
                c["declare"] = st
                c["note"] = note
                c["texte"] = txt
                cas.append(c)
    return cas


def balayage_coherence(m):
    """LE SOCLE DU §4 POINT 5, et sa clause conditionnelle.

    « Au moins deux blocs de développement à idée directrice, d'objets
    mutuellement distincts, sans doublon ni retour en arrière » ; et « si une
    annonce à étapes existe, les étapes réalisées dans l'ordre — P2 muet sur
    cette clause vaut non ».

    ⭐ ET C'EST ICI QUE SE VOIT CE QUE LE MODÈLE RÉPARAIT : la route de la
    promesse s'ouvre sur `problème OU plan annoncé`, et sans annonce la clause
    d'ordre devient VIDE. Sur une copie faible, cela donne `satisfaite` au lieu
    de `défaillance` — la coupure D/C du routeur."""
    cas = []
    for pb, forme in (("[absent]", "[absent]"),
                      ("Une question ?", "question"),
                      ("Une tension.", "tension affirmée"),
                      ("Une phrase citée", "[absent]")):
        for annonce, etapes in (("[absente]", []),
                                ("D'abord…, ensuite…", ["étape 1", "étape 2"]),
                                ("D'abord…", [])):
            for distincts in ([], ["¶2"], ["¶2", "¶3"], ["¶2", "¶3", "¶9"]):
                for doublon, retour, ordre_nec, ordre_et in (
                        (False, False, False, None),
                        (False, False, True, None),
                        (True, False, False, None),
                        (False, True, False, None),
                        (False, False, False, True),
                        (False, False, False, False),
                        (False, False, True, True)):
                    blocs = [bloc("¶1", "intro", "[absente]"), bloc("¶2"), bloc("¶3"),
                             bloc("¶4", "conclusion", "[absente]"),
                             bloc("¶5", "developpement", "[absente]")]
                    sq = squelette(
                        [jointure("¶2 → ¶3", texte="Mais cela ne suffit pas.",
                                  gestes=["manque — 'cela ne suffit pas'"])],
                        blocs, [{"marquee_par": "I.", "blocs": ["¶2"]},
                                {"marquee_par": "II.", "blocs": ["¶3"]}],
                        promesse(pb, forme, annonce, etapes))
                    p2 = dict(JUG, blocs_objets_distincts=distincts,
                              doublon=doublon, retour_en_arriere=retour,
                              ordre_necessaire=ordre_nec,
                              etapes_realisees_dans_lordre=ordre_et)
                    cas.append(passage(
                        m, "coherence_%s_%s_d%d_%s%s%s%s" % (
                            forme.replace(" ", "-"), len(etapes), len(distincts),
                            int(doublon), int(retour), int(ordre_nec), ordre_et),
                        sq, p2))
    return cas


def balayage_paliers(m):
    """LES SEIZE CROISEMENTS, ATTEINTS PAR DES SQUELETTES — jamais par un appel
    direct à `croisement()`.

    « Ce qui se compare au module se compare PAR LES CROCHETS, comme le banc le
    fait » : un balayage qui appellerait la fonction interne prouverait l'accord
    de deux fonctions, pas celui de deux chaînes. Chaque cellule est donc
    fabriquée — la cohésion par ses charnières et son tissu, la cohérence par son
    socle et sa promesse — et le test vérifie que LES SEIZE sont réellement
    atteintes : sans cela, le contrôle ne contrôlerait rien.

    S'y ajoute le garde-fou Absent, avec ses deux déclencheurs séparés : « une
    question posée (le champ `probleme_forme`, EN LECTURE STRICTE) ou une seule
    idée directrice énoncée exclut Absent ».
    """
    # Comment obtenir chaque grade de COHÉSION (§4, point 4).
    cohesions = {
        "df": (["absente", "absente"], (0, 0)),        # toutes absente
        "d": (["plaquée", "plaquée"], (0, 0)),         # majorité basse
        "s": (["motivée", "motivée"], (0, 0)),         # majorité motivée, gabarit répété
        "h": (["motivée", "motivée"], (2, 0)),         # + gabarit non répété
    }
    # Comment obtenir chaque grade de COHÉRENCE (§4, point 5).
    coherences = {
        # aucune promesse ET majorité de blocs de développement sans idée
        "df": {"prom": promesse(), "idees": False, "distincts": 0, "ordre_nec": False},
        "d": {"prom": promesse(), "idees": True, "distincts": 1, "ordre_nec": False},
        "s": {"prom": promesse(), "idees": True, "distincts": 2, "ordre_nec": False},
        "h": {"prom": promesse("Une question ?", "question"), "idees": True,
              "distincts": 2, "ordre_nec": True},
    }
    cas = []
    for nom_cl, (statuts, tissu) in cohesions.items():
        for nom_cg, cg in coherences.items():
            # ⚠️ LES DEUX DERNIÈRES NE SONT PAS AU CATALOGUE, et c'est le point :
            #    `a_probleme` est FAUX pour elles — donc la cohérence peut tomber
            #    en défaillance forte, donc Absent est atteignable, donc le
            #    garde-fou est INTERROGÉ. « question posée » l'ouvre (le module
            #    lit `startswith("question")`), « tension » ne l'ouvre PAS. Sans
            #    ces deux-là, la LECTURE STRICTE n'est jamais éprouvée : toute
            #    forme du catalogue empêche Absent par un autre chemin.
            for forme_gf, idee_gf in (("[absent]", False), ("question", False),
                                      ("[absent]", True), ("tension affirmée", False),
                                      ("question posée", False), ("tension", False)):
                sq = _sq_charnieres(statuts, tissu)
                # Les blocs de développement qui portent — ou non — leur idée.
                idee = "une idée" if cg["idees"] else "[absente]"
                sq["blocs"] = [bloc(b["num"], "developpement", idee) for b in sq["blocs"]]
                # Le garde-fou : un bloc de plus, avec ou sans idée directrice.
                sq["blocs"].append(bloc("¶99", "developpement",
                                        "une idée" if idee_gf else "[absente]"))
                prom = dict(cg["prom"])
                # ⚠️ LECTURE STRICTE : c'est le champ `probleme_forme` qui décide,
                #    « pas un point d'interrogation trouvé n'importe où ».
                if prom["probleme_forme"] == "[absent]" and forme_gf != "[absent]":
                    prom = promesse("Un problème est-il posé ?", forme_gf)
                sq["promesse"] = prom
                distincts = [b["num"] for b in sq["blocs"][: cg["distincts"]]]
                p2 = dict(JUG, gabarit_repete=(nom_cl != "h"),
                          blocs_objets_distincts=distincts,
                          ordre_necessaire=cg["ordre_nec"])
                cas.append(passage(
                    m, "palier_%s-%s_gf-%s-%d" % (nom_cl, nom_cg,
                                                  forme_gf.replace(" ", "-"),
                                                  int(idee_gf)),
                    sq, p2))
    return cas


def balayage_recette(m):
    """⚠️⚠️ CE QUE PYTHON NE VOIT PAS, ET QUE JAVASCRIPT VERRAIT.

    `recette()` cherche un décompte par `(?<![\\w/.,-])\\d{1,3}(?![\\w/,-])` et un
    niveau par `\\b{niveau}\\b`. LES DEUX CLASSES SONT UNICODE EN PYTHON : `é`
    est un caractère de mot, `\\d` couvre les chiffres arabes-indiens. Le `\\w` et
    le `\\b` de JavaScript, hors drapeau `u`, ne connaissent que l'ASCII.

    Vérifié en Python : « la 3ème partie » ne contient AUCUN nombre, et « café3 »
    non plus. Portés naïvement, les deux auraient levé une alerte RECETTE — et
    « 3ème » est la chose la plus ordinaire qu'un juge puisse écrire.

    Ce balayage appelle `recette()` DIRECTEMENT : c'est la même fonction du même
    module, sur soixante textes au lieu de trois."""
    textes = [
        ("vide", ""),
        ("nombre-nu", "7 jointures sur 8"),
        ("nombre-un-chiffre", "il y a 3 blocs"),
        ("renvoi-simple", "la couture ¶2 → ¶3"),
        ("renvoi-liste", "les coutures ¶2 → ¶3, ¶4 → ¶5"),
        ("renvoi-tiret", "¶2-¶3 et ¶4 à ¶5"),
        ("renvoi-puis", "¶2 puis ¶3"),
        ("bloc-seul", "le bloc ¶6 n'énonce rien"),
        # ⭐ LES QUATRE QUI SÉPARENT LES DEUX LANGAGES.
        ("accent-avant", "un café3 traîne dans le texte"),
        ("accent-apres", "la 3ème partie ne tient pas"),
        ("accent-apres-2", "la 2nde partie, puis la 1ère"),
        ("chiffre-arabe-indien", "il y a \u0663 blocs"),
        # Les niveaux, avec et sans frontière de mot unicode.
        ("niveau-nu", "le devoir est Bon"),
        ("niveau-colle", "un devoir Bonté ne dit rien"),
        ("niveau-accent-avant", "un devoir éBon"),
        ("niveau-minuscule", "le devoir est bon"),
        ("niveau-absent", "rien n'est Absent ici"),
        ("niveau-acquis", "c'est Acquis"),
        ("apostrophe-typo", "l’élève écrit ¶2 → ¶3"),
        ("nombre-decimal", "un taux de 0,5"),
        ("nombre-quatre-chiffres", "l'année 2026"),
        ("pourcentage", "80% des coutures"),
        ("date-slash", "le 30/07"),
    ]
    # ⚠️ Un squelette COMPLET, et non un appel direct : les alertes RECETTE
    #    remontent par `code2`, et `conformite` les RE-SIGNALE au passage. Les
    #    comparer par les crochets éprouve les deux chemins d'un coup.
    sq = squelette([jointure("¶1 → ¶2", texte="Mais cela ne suffit pas.",
                             gestes=["manque — 'cela ne suffit pas'"])],
                   [bloc("¶1"), bloc("¶2")],
                   [{"marquee_par": "I.", "blocs": ["¶1"]},
                    {"marquee_par": "II.", "blocs": ["¶2"]}])
    cas = []
    for nom, txt in textes:
        for champ in ("justification_ancree", "ce_qui_plafonne", "levier"):
            jug = dict(JUG, blocs_objets_distincts=["¶1", "¶2"])
            jug[champ] = txt
            cas.append(passage(m, "recette_%s_%s" % (nom, champ), sq, jug))
    # Et les cinq champs INTERDITS, plus une clé à `None` et une clé ABSENTE —
    # « une clé absente rend "" ; une clé à None rend "None" », et Python les
    # distingue.
    for interdit in m.INTERDITS:
        jug = dict(JUG, blocs_objets_distincts=["¶1", "¶2"])
        jug[interdit] = "Moyen"
        cas.append(passage(m, "recette_interdit_%s" % interdit, sq, jug))
    jug = dict(JUG, blocs_objets_distincts=["¶1", "¶2"])
    jug["justification_ancree"] = None
    cas.append(passage(m, "recette_champ_nul", sq, jug))
    jug = dict(JUG, blocs_objets_distincts=["¶1", "¶2"])
    del jug["justification_ancree"]
    cas.append(passage(m, "recette_champ_absent", sq, jug))
    return cas


def balayage_blancs(m):
    """`prepare_copie` — ET LES BLANCS DE PYTHON NE SONT PAS CEUX DE JAVASCRIPT.

    Le découpage se fait sur `\\n\\s*\\n+`, et chaque paragraphe est réduit par
    `re.sub(r"\\s+", " ", …).strip()`. Or `\\s` de Python couvre `\\x1c`-`\\x1f`
    et `\\x85`, que JavaScript ignore ; JavaScript couvre la BOM, que Python
    ignore. Une ligne « vide » faite de l'un de ces caractères est UNE FRONTIÈRE
    DE BLOC d'un côté et pas de l'autre — donc une couture de plus ou de moins.

    ⭐ Et le vecteur du RETOUR DUR est celui de l'autotest, gardé tel quel : « un
    retour dur à l'intérieur d'un paragraphe crée un bloc de plus, donc une
    couture qui n'existe pas sur la page » (RM4)."""
    textes = [
        ("simple", "Premier bloc.\n\nSecond bloc."),
        ("retour-dur", "Premi\u00e8re ligne du m\u00eame paragraphe\n"
                       "seconde ligne du m\u00eame paragraphe.\n\nDeuxi\u00e8me paragraphe."),
        ("trois-sauts", "A.\n\n\n\nB."),
        ("espaces-entre", "A.\n   \nB."),
        ("tabulation-entre", "A.\n\t\nB."),
        # ⭐ LES CINQ QUI SÉPARENT LES DEUX LANGAGES. Ils s'écrivent en
        #    ÉCHAPPEMENT, jamais en littéral : un caractère de contrôle recopié
        #    dans un fichier source se perd au premier outil qui le normalise,
        #    et le vecteur qui devait séparer les deux langages ne sépare plus
        #    rien — sans qu'aucun contrôle rougisse.
        ("insecable-entre", "A.\n\u00a0\nB."),           # blanc des deux côtés
        ("nel-entre", "A.\n\u0085\nB."),                 # PYTHON SEUL
        ("separateur-unite-entre", "A.\n\u001f\nB."),    # PYTHON SEUL
        ("separateur-groupe-entre", "A.\n\u001d\nB."),   # PYTHON SEUL
        ("bom-entre", "A.\n\ufeff\nB."),                 # JAVASCRIPT SEUL
        ("cadratin-entre", "A.\n\u2003\nB."),            # blanc des deux côtés
        ("bords", "\n\n  A.\n\nB.  \n\n"),
        ("bom-aux-bords", "\ufeffA.\n\nB.\ufeff"),
        ("nel-aux-bords", "\u0085A.\n\nB.\u0085"),
        ("separateur-aux-bords", "\u001cA.\n\nB.\u001e"),
        ("un-seul-bloc", "Une copie d'un seul tenant, sans aucun retour."),
        ("vide", ""),
        ("blancs-seuls", "   \n\n   "),
        ("espaces-multiples", "A     B.\n\nC\t\tD."),
        ("insecable-interne", "A\u00a0B.\n\nC."),
        ("nel-interne", "A\u0085B.\n\nC."),
        ("bom-interne", "A\ufeffB.\n\nC."),
        ("separateurs-internes", "A\u001cB.\n\nC."),
    ]
    return [{"nom": "blancs_%s" % nom, "texte": t,
             "attendu": m.prepare_copie(t, {})} for nom, t in textes]


def balayage_champs_blancs(m):
    """⚠️⚠️ `_n()` FAIT UN `strip()` DE PYTHON, ET IL NE STRIPE PAS COMME `trim()`.

    Python tient `\x1c`-`\x1f` et `\x85` pour des blancs, JavaScript non ;
    JavaScript tient la BOM pour un blanc, Python non. Or `_n()` normalise TOUTES
    les valeurs d'énumération du squelette — le statut, la relation nommée, le
    rôle, la forme du problème, la correspondance à l'annonce. Un seul de ces
    caractères au bord d'une valeur, et elle est reconnue d'un côté, pas de
    l'autre : un statut qui retombe sur la composition, une couture qui change de
    NATURE, un problème qui cesse d'être posé.

    ⭐ Et `_n()` réduit aussi les suites de blancs à UNE espace : « étape 1 » et
    « étape\x1f1 » sont LA MÊME étape pour Python — donc du TISSU — et deux
    étapes différentes pour JavaScript — donc une CHARNIÈRE. Une couture change
    de population, et avec elle deux observables du §5.

    Aucun vecteur du module ne porte ces caractères ; une transcription d'OCR ou
    un copier-coller depuis un traitement de texte, si.
    """
    NEL = "\u0085"          # PYTHON SEUL
    SEP = "\u001f"          # PYTHON SEUL
    BOM = "\ufeff"          # JAVASCRIPT SEUL
    NBSP = "\u00a0"         # les deux
    cas = []

    def deux_blocs(prom=None, **champs_j):
        b1 = bloc("¶1")
        b2 = bloc("¶2")
        for cle, val in champs_j.get("blocs", {}).items():
            (b1 if cle.startswith("1") else b2)[cle[2:]] = val
        j = jointure("¶1 → ¶2", **{k: v for k, v in champs_j.items() if k != "blocs"})
        return squelette([j], [b1, b2],
                         [{"marquee_par": "I.", "blocs": ["¶1"]},
                          {"marquee_par": "II.", "blocs": ["¶2"]}], prom)

    # Le statut déclaré, aux bords.
    for nom, st in (("statut-nel", NEL + "plaquée" + NEL),
                    ("statut-sep", SEP + "motivée" + SEP),
                    ("statut-bom", BOM + "plaquée" + BOM),
                    ("statut-nbsp", NBSP + "plaquée" + NBSP)):
        cas.append(passage(m, "champ_%s" % nom,
                           deux_blocs(statut=st, texte="Ensuite,", gestes=["relance"]),
                           dict(JUG, blocs_objets_distincts=["¶1", "¶2"])))
    # La relation nommée — elle décide de `bloc_relie` et de la modulation.
    for nom, rel in (("relation-nel", NEL + "oui — donc" + NEL),
                     ("relation-bom", BOM + "oui — donc" + BOM),
                     ("relation-sep", SEP + "non — rien" + SEP)):
        cas.append(passage(m, "champ_%s" % nom,
                           deux_blocs(rel=rel, texte="Ensuite,", gestes=["relance"]),
                           dict(JUG, blocs_objets_distincts=["¶1", "¶2"])))
    # Le texte cité — il décide de « vide », donc du statut composé.
    for nom, txt in (("texte-nel", NEL + "[aucune]" + NEL),
                     ("texte-bom", BOM + "[aucune]" + BOM)):
        cas.append(passage(m, "champ_%s" % nom,
                           deux_blocs(texte=txt, gestes=[]),
                           dict(JUG, blocs_objets_distincts=["¶1", "¶2"])))
    # La forme du problème — elle décide de la route (A5).
    for nom, forme in (("forme-nel", NEL + "question" + NEL),
                       ("forme-bom", BOM + "question" + BOM),
                       ("forme-interne", "tension" + SEP + "affirmée")):
        cas.append(passage(
            m, "champ_%s" % nom,
            deux_blocs(promesse("Un problème.", forme), texte="Ensuite,", gestes=["relance"]),
            dict(JUG, blocs_objets_distincts=["¶1", "¶2"])))
    # ⭐ LA CORRESPONDANCE À L'ANNONCE — elle décide de la NATURE de la couture.
    #    « étape 1 » et « étape<SEP>1 » sont la MÊME étape pour Python.
    for nom, ca, cb in (("annonce-meme-etape", "étape 1", "étape" + SEP + "1"),
                        ("annonce-deux-etapes", "étape 1", "étape" + SEP + "2"),
                        ("annonce-bom", "étape 1", BOM + "étape 1" + BOM)):
        blocs = [bloc("¶1", corr=ca), bloc("¶2", corr=cb)]
        sq = squelette([jointure("¶1 → ¶2", texte="Ensuite,", gestes=["relance"])],
                       blocs, [],
                       promesse("Un problème.", "question", "D'abord…, ensuite…",
                                ["étape 1", "étape 2"]))
        cas.append(passage(m, "champ_%s" % nom, sq,
                           dict(JUG, blocs_objets_distincts=["¶1", "¶2"],
                                etapes_realisees_dans_lordre=True)))
    # Le rôle — il décide du seuil, et du partage service / développement.
    for nom, role in (("role-nel", NEL + "intro" + NEL),
                      ("role-bom", BOM + "conclusion" + BOM)):
        blocs = [bloc("¶1", role if nom.startswith("role-nel") else "developpement"),
                 bloc("¶2", role if nom.startswith("role-bom") else "developpement")]
        sq = squelette([jointure("¶1 → ¶2", texte="Ensuite,", gestes=["relance"])], blocs,
                       [{"marquee_par": "I.", "blocs": ["¶1"]},
                        {"marquee_par": "II.", "blocs": ["¶2"]}])
        cas.append(passage(m, "champ_%s" % nom, sq,
                           dict(JUG, blocs_objets_distincts=["¶1", "¶2"])))
    return cas


def balayage_formes(m):
    """LES FORMES SUR LESQUELLES LE MODULE LÈVE, QUAND LE CONTRAT L'INTERDIT.

    « Le module ne lève jamais d'exception : elle traverserait le banc et
    emporterait la trace avec elle » (`CONTRAT-MODULES.md` §3). Le portage durcit
    CES POINTS-LÀ, et ce balayage les nomme : ce que le module rend quand il ne
    lève pas fait foi ; ce qu'il lève est CONSERVÉ AVEC SON MOTIF, et le portage
    doit rendre une alerte nommée à la place.

    ⭐ La forme qui n'est PAS un durcissement, et qu'il faut reproduire : une
    CHAÎNE est itérable en Python et rend ses caractères — `gestes: "manque"` ne
    porte donc AUCUN geste « manque ». Un portage qui la traiterait comme un
    geste unique inventerait une motivation."""
    formes = [
        ("gestes-chaine", squelette([jointure("¶1 → ¶2", gestes="manque")],
                                    [bloc("¶1"), bloc("¶2")]), dict(JUG)),
        ("gestes-nombre", squelette([jointure("¶1 → ¶2", gestes=3)],
                                    [bloc("¶1"), bloc("¶2")]), dict(JUG)),
        ("gestes-dict", squelette([jointure("¶1 → ¶2", gestes={"manque": "x"})],
                                  [bloc("¶1"), bloc("¶2")]), dict(JUG)),
        ("jointures-chaine", {"promesse": promesse(), "blocs": [], "parties": [],
                              "jointures": "aucune"}, dict(JUG)),
        ("jointures-nombre", {"promesse": promesse(), "blocs": [], "parties": [],
                              "jointures": 3}, dict(JUG)),
        ("jointure-chaine", squelette(["¶1 → ¶2"], [bloc("¶1")]), dict(JUG)),
        ("blocs-chaine", {"promesse": promesse(), "blocs": "aucun", "parties": [],
                          "jointures": []}, dict(JUG)),
        ("bloc-chaine", squelette([], ["¶1"]), dict(JUG)),
        ("promesse-chaine", {"promesse": "rien", "blocs": [], "parties": [],
                             "jointures": []}, dict(JUG)),
        ("parties-nombre", {"promesse": promesse(), "blocs": [], "parties": 2,
                            "jointures": []}, dict(JUG)),
        ("partie-chaine", squelette([], [bloc("¶1")], ["I."]), dict(JUG)),
        ("etapes-chaine", squelette([], [bloc("¶1")], [],
                                    promesse(annonce="D'abord…",
                                             etapes="étape 1, étape 2")), dict(JUG)),
        ("etapes-nombre", squelette([], [bloc("¶1")], [],
                                    promesse(annonce="D'abord…", etapes=2)), dict(JUG)),
        ("crible-chaine", squelette([jointure("¶1 → ¶2")], [bloc("¶1"), bloc("¶2")]),
         dict(JUG, crible="aucun")),
        ("retrogradations-chaine",
         squelette([jointure("¶1 → ¶2")], [bloc("¶1"), bloc("¶2")]),
         dict(JUG, crible={"retrogradations": "aucune"})),
        ("retrogradations-nombre",
         squelette([jointure("¶1 → ¶2")], [bloc("¶1"), bloc("¶2")]),
         dict(JUG, crible={"retrogradations": 2})),
        ("retrogradation-chaine",
         squelette([jointure("¶1 → ¶2")], [bloc("¶1"), bloc("¶2")]),
         dict(JUG, crible={"retrogradations": ["¶1 → ¶2"]})),
        ("distincts-chaine", squelette([], [bloc("¶1")]),
         dict(JUG, blocs_objets_distincts="¶1")),
        ("distincts-nombre", squelette([], [bloc("¶1")]),
         dict(JUG, blocs_objets_distincts=2)),
        ("doublon-absent", squelette([], [bloc("¶1")]),
         {k: v for k, v in JUG.items() if k != "doublon"}),
        ("doublon-chaine", squelette([], [bloc("¶1")]), dict(JUG, doublon="false")),
        ("retour-nul", squelette([], [bloc("¶1")]), dict(JUG, retour_en_arriere=None)),
        ("entre-nul", squelette([jointure(None)], [bloc("¶1")]), dict(JUG)),
        ("entre-nombre", squelette([jointure(12)], [bloc("¶1")]), dict(JUG)),
        ("num-nul", squelette([jointure("¶1 → ¶2")],
                              [{"role": "developpement"}, bloc("¶2")]), dict(JUG)),
        ("p2-non-objet", squelette([jointure("¶1 → ¶2")], [bloc("¶1")]), "rien"),
        ("p1-non-objet", "rien", dict(JUG)),
    ]
    cas = []
    for nom, sq, p2 in formes:
        try:
            cas.append(passage(m, "forme_%s" % nom, sq, p2))
        except Exception as e:                      # noqa: BLE001 — c'est le sujet
            cas.append({"nom": "forme_%s" % nom, "releve": sq, "entree_p2": p2,
                        "params": {}, "leve": "%s: %s" % (type(e).__name__, e)})
    return cas


def cas_conformite(m):
    """« L'ERREUR STABLE, que ni réplicats ni 5×5 ne voient » — les jugements de
    P2 visent-ils des coutures qui EXISTENT dans le squelette ?"""
    sq = squelette([jointure("¶1 → ¶2"), jointure("¶2 → ¶3")],
                   [bloc("¶1"), bloc("¶2"), bloc("¶3")])
    jeux = [
        ("conforme", dict(JUG)),
        ("dict-couture-connue", dict(JUG, charnieres={"¶1 → ¶2": "ok"})),
        ("dict-couture-inventee", dict(JUG, tissu={"¶4 → ¶5": "ok"})),
        ("liste-couture-inventee",
         dict(JUG, coutures=[{"entre": "¶9 → ¶10", "avis": "x"}])),
        ("liste-couture-connue",
         dict(JUG, jugements_par_couture=[{"entre": "¶2 → ¶3", "avis": "x"}])),
        ("liste-sans-entre", dict(JUG, coutures=[{"avis": "x"}])),
        ("recette-remontee", dict(JUG, niveau="Bon")),
        ("recette-decompte", dict(JUG, levier="reprends les 3 coutures")),
    ]
    return [passage(m, "conformite_%s" % nom, sq, p2) for nom, p2 in jeux]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--racine", default=RACINE_DEFAUT)
    args = ap.parse_args()

    m, chemin = charge_module(args.racine)

    # « Le banc refuse de lancer un run si l'autotest du module échoue » — et un
    # portage vérifié contre un module en échec ne prouve rien.
    echecs, annonces = m.autotest()

    paquet = {
        "module": {
            "chemin": chemin,
            "competence": m.COMPETENCE,
            "version_calcul": m.VERSION,
            "version_golds_testee": m.VERSION_GOLDS_TESTEE,
            "observables": list(m.OBSERVABLES),
            "params": sorted(m.PARAMS),
            "catalogue": m.CATALOGUE,
            "interdits": list(m.INTERDITS),
            "cohesion": list(m.COHESION),
            "niveaux": list(m.NIVEAUX),
            "statuts": list(m.STATUTS),
            "regle_agregation_citee": m.REGLE_AGREGATION_CITEE,
            "regle_agregation_source": m.REGLE_AGREGATION_SOURCE,
            # Le TYPE des deux constantes de vecteurs, pas seulement leur taille.
            "types": {
                "TESTS_P2_PARFAIT": type(m.TESTS_P2_PARFAIT).__name__,
                "TESTS_CODE1_PARFAIT": type(m.TESTS_CODE1_PARFAIT).__name__,
            },
            "tailles": {
                "TESTS_P2_PARFAIT": len(m.TESTS_P2_PARFAIT),
                "TESTS_CODE1_PARFAIT": len(m.TESTS_CODE1_PARFAIT),
            },
        },
        "autotest": {"echecs": echecs, "annonces": annonces},
        "p2_parfait": list(m.TESTS_P2_PARFAIT),
        "code1": cas_code1(m),
        "reels": artefacts_reels(m, args.racine),
        "balayage_cohesion": balayage_cohesion(m),
        "balayage_nature": balayage_nature(m),
        "balayage_statut": balayage_statut(m),
        "balayage_coherence": balayage_coherence(m),
        "balayage_paliers": balayage_paliers(m),
        "balayage_recette": balayage_recette(m),
        "balayage_blancs": balayage_blancs(m),
        "balayage_champs_blancs": balayage_champs_blancs(m),
        "balayage_formes": balayage_formes(m),
        "conformite_cas": cas_conformite(m),
    }
    json.dump(paquet, sys.stdout, ensure_ascii=False, indent=None)
    sys.stdout.write("\n")
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())

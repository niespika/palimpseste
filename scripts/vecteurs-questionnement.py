# -*- coding: utf-8 -*-
"""vecteurs-questionnement.py — ce que le module de calibration produit, en JSON.

    « Le branchement reproduit, sur les vecteurs embarqués du module —
      `TESTS_CODE1_PARFAIT` et `TESTS_P2_PARFAIT` —, EXACTEMENT ce que
      `python3 code.py --autotest` produit, et sans aucun appel de modèle. »
                                          — le « fait quand » de C4-L10

CE SCRIPT NE TOUCHE À RIEN. Il IMPORTE `copies-tests/questionnement/code.py` du
dépôt de conception, joue ses crochets, et écrit sur la sortie standard, en
JSON : LES ENTRÉES et LES SORTIES de chaque cas. Le test TypeScript rejoue les
MÊMES ENTRÉES sur le branchement et compare LES TROIS CLÉS — pas seulement
`verdicts` : « une trace qui diverge dit qu'un chemin de calcul a changé, même
quand le verdict tombe juste ».

⚠️⚠️ LES CONSTANTES DE CE MODULE NE PORTENT PAS LES NOMS DU CONTRAT. Ni
`TESTS_P2_PARFAIT` ni `TESTS_CODE1_PARFAIT` n'existent : le module porte
`VECTEURS` (30), `ALERTES_ATTENDUES` (7) et `VECTEURS_REFERENT` (7). ⛔ Un
`getattr(m, "TESTS_P2_PARFAIT", [])` rendrait ici un ZÉRO QUI RESSEMBLE À UNE
MESURE — d'où le contrôle explicite de `meta.absentes` ci-dessous, qui l'ÉCRIT.
⚠️ Et le type se vérifie, il ne se suppose pas : chez l'Expression,
`TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu « 52 vecteurs »
qui étaient 52 caractères.

⚠️ L'ÉTAT DE CE MODULE. `VERSION_GOLDS_TESTEE` vaut **None** et
`copies-tests/questionnement/` ne porte **ni gold, ni copie, ni critère, ni run
stocké** — « le Questionnement part au Run 1 ». Ses 30 vecteurs sont des cas
CONSTRUITS.

⭐ D'OÙ LE BALAYAGE. Il appelle LA MÊME FONCTION DU MÊME MODULE sur plus
d'entrées : il n'invente aucune règle, il cesse de ne la lui demander que 30
fois.

  · `balayage_cascade`     — LA CASCADE ENTIÈRE : 4 formes × 4 tensions ×
                             4 enjeux × 4 débats × 4 `question_propre` ×
                             3 `question_specifique`, à `conjonction_bon`
                             stricte ;
  · `balayage_conjonction` — les mêmes trois termes du palier Bon, sous LES DEUX
                             valeurs du paramètre : c'est lui qui DISCRIMINE ;
  · `balayage_crible`      — le crible ENTIER : déplacement × reprise × verdict
                             du juge × test, et l'ORDRE des deux tests ;
  · `balayage_limite`      — la borne haute, la borne basse à deux `limite`, et
                             les notes illisibles, sur les trois champs ;
  · `balayage_normalisation` — ⭐ LES ÉCARTS DE LANGAGE, éprouvés là où ils
                             mordent : `_nn` décide si un champ est `limite`, et
                             l'alerte hors catalogue porte un `str()`. Les blancs
                             de Python (`\\x85`, `\\x1c`-`\\x1f`), la BOM que
                             `trim()` mange et que `strip()` garde, `str()` d'une
                             liste et d'un dict, la vérité de `[]` et `{}` ;
  · `balayage_appariement` — `cite` avec blancs, doublons, non apparié, et LA
                             TRANCHE À 40 CARACTÈRES sur des points de code hors
                             du plan de base ;
  · `balayage_formes`      — ce que P1 et P2 peuvent rendre et que le module
                             n'attend pas : `recadrages` non-liste, entrée
                             non-objet, ⭐ `crible` EN CHAÎNE — Python itère ses
                             CARACTÈRES — et `crible` en dict ;
  · `referent_cas`         — `pre_p2`, les 7 vecteurs embarqués et 12 de plus ;
  · `conformite_cas`       — les quatre choses que `conformite` a à dire.

⛔ CE QUI NE PEUT PAS SE PORTER PAR CE CANAL : `str()` d'un FLOTTANT Python.
`json.dumps(5.0)` écrit `5.0`, mais `JSON.parse` rend `5` — le type se perd, et
`python.ts` le dit : « il ne se retrouve QU'À LA DÉCLARATION ». Aucun paramètre
de cette fiche n'étant un nombre, l'écart ne peut pas mordre ici ; on ne
fabrique donc pas un vecteur qui échouerait pour une raison qui n'en est pas une.

USAGE
    python3 scripts/vecteurs-questionnement.py [--racine <dépôt de conception>]

SORTIE : un objet JSON sur stdout. Code 0 si le module est chargé et son autotest
vert ; 1 sinon — un portage vérifié contre un module en échec ne prouve rien.
"""

from __future__ import annotations

import argparse
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


def charge_module(racine):
    chemin = os.path.join(racine, "copies-tests", "questionnement", "code.py")
    if not os.path.exists(chemin):
        sys.exit("Module introuvable : %s" % chemin)
    spec = importlib.util.spec_from_file_location("code_questionnement", chemin)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


# ── Les fabriques d'entrées, calquées sur celles du module ──────────────────

def p1(forme="question_explicite", tension="articulees", enjeu="enonce",
       debat="enoncees", question="Q", recadrages=None, **kw):
    d = {"question_posee": question, "forme_question": forme,
         "notions_en_tension": tension, "enjeu": enjeu,
         "reponses_concurrentes": debat, "recadrages": recadrages or []}
    d.update(kw)
    return d


def rec(cite="R", dep="ce qu'il faut prouver change", rep="la suite y répond",
        typ="question_deplacee"):
    return {"cite": cite, "type": typ, "deplacement": dep, "reprise": rep}


def p2(propre="propre", spec="specifique", crible=None, **kw):
    d = {"question_propre": propre, "question_specifique": spec,
         "crible": crible if crible is not None else [], "confiance": "elevee"}
    d.update(kw)
    return d


def joue(m, nom, sortie_p1, sortie_p2, params=None):
    """UN cas : les entrées, la sortie de `code1`, et LES TROIS CLÉS de `code2`."""
    c1 = m.code1(sortie_p1)
    c2 = m.code2(sortie_p2, c1, params or {})
    return {
        "nom": nom,
        "p1": sortie_p1,
        "p2": sortie_p2,
        "params": params or {},
        "code1": {"mesures": c1["mesures"], "document_p2": c1["document_p2"],
                  "alertes": c1["alertes"]},
        "code2": {"verdicts": c2["verdicts"], "trace": c2["trace"],
                  "alertes": c2["alertes"]},
    }


# ── LES VECTEURS EMBARQUÉS, joués comme l'autotest les joue ─────────────────

def vecteurs_embarques(m):
    cas = []
    for vec in m.VECTEURS:
        nom, sp1, sp2, par = vec[0], vec[1], vec[2], vec[3]
        attendus = vec[4] if len(vec) > 4 else {}
        c = joue(m, nom, sp1, sp2, par)
        # L'autotest compare la TRACE réduite aux verdicts : on la porte aussi,
        # pour rejouer son assertion à l'identique côté TypeScript.
        c["trace_verdicts"] = [t["verdict"] for t in c["code2"]["trace"]]
        c["attendu_autotest"] = attendus
        cas.append(c)
    return cas


def alertes_attendues(m):
    cas = []
    for motif, sp1, sp2, par in m.ALERTES_ATTENDUES:
        c = joue(m, "alerte attendue : %s" % motif, sp1, sp2, par)
        c["motif_attendu"] = motif
        c["toutes_alertes"] = " | ".join(c["code1"]["alertes"] + c["code2"]["alertes"])
        cas.append(c)
    return cas


# ── LE BALAYAGE DE LA CASCADE ──────────────────────────────────────────────

def balayage_cascade(m):
    """La cascade ENTIÈRE, à `conjonction_bon` stricte — 3 072 cas.

    « La cascade. Première ligne qui répond décide. Elle est la mise en machine
    de REGLE_AGREGATION_CITEE, mot pour mot. »
    """
    cas = []
    formes = m.CATALOGUE["formes_question"]
    tensions = [v for v in m.CATALOGUE["tensions"] if v != "limite"] + ["limite"]
    enjeux = [v for v in m.CATALOGUE["enjeux"] if v != "limite"] + ["limite"]
    debats = [v for v in m.CATALOGUE["reponses_concurrentes"] if v != "limite"] + ["limite"]
    propres = m.CATALOGUE["questions_propres"]
    specs = m.CATALOGUE["specificites"]
    i = 0
    for f, t, e, d, pr, sp in itertools.product(formes, tensions, enjeux, debats, propres, specs):
        i += 1
        # Les `limite` ont besoin de leur note ; on la sert lisible, pour que ce
        # balayage éprouve LA CASCADE et non la résolution des `limite` (qui a
        # son propre balayage).
        extra = {}
        if t == "limite":
            extra["note_notions_en_tension"] = "entre articulees et nommees"
        if e == "limite":
            extra["note_enjeu"] = "entre enonce et evoque"
        if d == "limite":
            extra["note_reponses_concurrentes"] = "entre enoncees et evoquees"
        cas.append(joue(m, "cascade %04d — %s/%s/%s/%s/%s/%s" % (i, f, t, e, d, pr, sp),
                        p1(forme=f, tension=t, enjeu=e, debat=d, **extra),
                        p2(propre=pr, spec=sp), {}))
    return cas


def balayage_conjonction(m):
    """Les trois termes du palier Bon, sous LES DEUX valeurs du paramètre.

    ⭐ C'est le paramètre qui DISCRIMINE : à `stricte` il en faut trois, à
    `deux_sur_trois` il en faut deux — et la ligne « Moyen si la question est
    générique » porte SEULE dans le second cas.
    """
    cas = []
    for sp, e, d, par in itertools.product(
            m.CATALOGUE["specificites"],
            ["enonce", "evoque", "absent"],
            ["enoncees", "evoquees", "absentes"],
            ["stricte", "deux_sur_trois", "un_reglage_inconnu"]):
        cas.append(joue(m, "conjonction %s/%s/%s/%s" % (par, sp, e, d),
                        p1(enjeu=e, debat=d), p2(spec=sp),
                        {"conjonction_bon": par}))
    return cas


# ── LE BALAYAGE DU CRIBLE ──────────────────────────────────────────────────

DEPS = {"écrit": "ce qu'il faut prouver change", "vide": "", "marqueur": "[aucun]"}
REPS = {"écrite": "la suite y répond", "vide": "", "marqueur": "[aucune]"}
VERDICTS_JUGE = ["valide", "verbal", "non_tenu", "hors_catalogue", None]
TESTS_JUGE = ["deplacement", "tenue", "déplacement", None]


def balayage_crible(m):
    """Le crible ENTIER, sur un recadrage : 3 × 3 × 5 × 4 = 180 cas.

    ⭐ L'ORDRE DES DEUX TESTS EST PORTEUR — « un recadrage sans déplacement écrit
    est `verbal` quoi qu'il arrive, sa reprise ne se regarde même pas », et « si
    le juge dit que le déplacement n'est pas réel, son verdict `verbal` l'emporte
    sur le pré-verdict `non_tenu` du code ».
    """
    cas = []
    for (nd, dep), (nr, rep), vj, tj in itertools.product(
            DEPS.items(), REPS.items(), VERDICTS_JUGE, TESTS_JUGE):
        entree = {"cite": "R"}
        if vj is not None:
            entree["verdict"] = vj
        if tj is not None:
            entree["test"] = tj
        crible = [] if (vj is None and tj is None) else [entree]
        cas.append(joue(m, "crible dep=%s rep=%s vj=%s test=%s" % (nd, nr, vj, tj),
                        p1(recadrages=[rec(dep=dep, rep=rep)]),
                        p2(crible=crible), {}))
    return cas


def balayage_crible_multiple(m):
    """Plusieurs recadrages — les comptes ASYMÉTRIQUES dont la télémétrie dépend.

    ⭐ « Des comptes asymétriques (deux requalifications d'un test, une de
    l'autre, zéro du troisième), et au moins une unité ÉCARTÉE DU DÉCOMPTE qui
    porte quand même la propriété mesurée. » Ici l'élément écarté des deux
    numérateurs est le recadrage que le juge N'A PAS JUGÉ : il reste une
    TENTATIVE, donc il est au dénominateur, et dans aucun numérateur.
    """
    cas = []
    lots = [
        ("un valide, deux verbaux, zéro non_tenu",
         [rec(cite="A"), rec(cite="B", dep="[aucun]"), rec(cite="C", dep="[aucun]")],
         [{"cite": "A", "verdict": "valide", "test": "tenue"}]),
        ("deux non_tenus, un verbal, zéro valide",
         [rec(cite="A", rep="[aucune]"), rec(cite="B", rep="[aucune]"), rec(cite="C", dep="[aucun]")],
         []),
        ("⭐ UN RECADRAGE NON JUGÉ — au dénominateur, dans aucun numérateur",
         [rec(cite="A"), rec(cite="B")],
         [{"cite": "A", "verdict": "valide", "test": "tenue"}]),
        ("trois recadrages, un seul jugé valide",
         [rec(cite="A"), rec(cite="B"), rec(cite="C")],
         [{"cite": "B", "verdict": "valide", "test": "tenue"},
          {"cite": "A", "verdict": "non_tenu", "test": "tenue"},
          {"cite": "C", "verdict": "verbal", "test": "deplacement"}]),
        ("aucun recadrage tenté — le dénominateur est NUL",
         [], []),
        ("un recadrage valide sur une base Moyen — `recadrage` OUI, seuil NON",
         [rec(cite="A")],
         [{"cite": "A", "verdict": "valide", "test": "tenue"}]),
        ("cinq recadrages tous verbaux",
         [rec(cite=c, dep="[aucun]") for c in "ABCDE"], []),
        ("deux requalifications visent le MÊME recadrage — la dernière gagne",
         [rec(cite="A")],
         [{"cite": "A", "verdict": "verbal", "test": "deplacement"},
          {"cite": "A", "verdict": "valide", "test": "tenue"}]),
    ]
    for nom, recs, crible in lots:
        # Une base Bon pour les uns, Moyen pour l'autre : `recadrage` ne dépend
        # pas du palier, `seuil_franchi` si.
        enjeu = "absent" if nom.startswith("un recadrage valide sur une base Moyen") else "enonce"
        cas.append(joue(m, "crible multiple — " + nom,
                        p1(enjeu=enjeu, recadrages=recs), p2(crible=crible), {}))
    return cas


# ── LE BALAYAGE DE LA BORNE HAUTE DES `limite` ─────────────────────────────

NOTES = {
    "lisible haut-bas": {"notions_en_tension": "entre articulees et nommees",
                         "enjeu": "entre enonce et evoque",
                         "reponses_concurrentes": "entre enoncees et evoquees"},
    "lisible bas": {"notions_en_tension": "entre nommees et absentes",
                    "enjeu": "entre evoque et absent",
                    "reponses_concurrentes": "entre evoquees et absentes"},
    "les trois nommées": {"notions_en_tension": "articulees, nommees ou absentes",
                          "enjeu": "enonce, evoque ou absent",
                          "reponses_concurrentes": "enoncees, evoquees ou absentes"},
    # ⭐ UNE SEULE valeur nommee : la note ne dit pas ENTRE QUOI l'hesitation
    #    porte, et le module la tient pour ILLISIBLE — « la note ne nomme pas
    #    deux valeurs ». Sans ce cas, `len(lus) < 2` et `len(lus) < 1` rendent la
    #    meme chose partout, et la mutation survit.
    "une seule valeur nommee": {"notions_en_tension": "plutot articulees",
                                "enjeu": "plutot enonce",
                                "reponses_concurrentes": "plutot enoncees"},
    "une seule valeur, la plus basse": {"notions_en_tension": "plutot absentes",
                                        "enjeu": "plutot absent",
                                        "reponses_concurrentes": "plutot absentes"},
    # ⚠️ LA NOTE CROISEE : `v in note` est une recherche de SOUS-CHAINE, et
    #    « enonce » est contenu dans « enoncees », « absent » dans « absentes ».
    #    Une note qui nomme les valeurs d'un AUTRE champ en fait donc lire deux.
    "croisee — les valeurs d'un autre champ": {
        "notions_en_tension": "entre enoncees et absentes",
        "enjeu": "entre enoncees et absentes",
        "reponses_concurrentes": "entre articulees et absentes"},
    "illisible": {"notions_en_tension": "je ne sais pas",
                  "enjeu": "je ne sais pas",
                  "reponses_concurrentes": "je ne sais pas"},
    "absente": None,
}
CHAMPS_LIMITE = ["notions_en_tension", "enjeu", "reponses_concurrentes"]


def balayage_limite(m):
    """La borne haute sur UN champ, la borne basse dès DEUX — et les notes.

    « Une hésitation est une hésitation ; deux sont un relevé qui n'a rien
    établi. » ⭐ On balaye toutes les PARTIES de l'ensemble des trois champs :
    l'ensemble vide, les trois singletons, les trois paires, le triplet.
    """
    cas = []
    for k in range(4):
        for combi in itertools.combinations(CHAMPS_LIMITE, k):
            for nom_note, notes in NOTES.items():
                base = {"tension": "articulees", "enjeu": "enonce", "debat": "enoncees"}
                extra = {}
                for c in combi:
                    if c == "notions_en_tension":
                        base["tension"] = "limite"
                    elif c == "enjeu":
                        base["enjeu"] = "limite"
                    else:
                        base["debat"] = "limite"
                    if notes is not None:
                        extra["note_" + c] = notes[c]
                cas.append(joue(m, "limite {%s} note=%s" % (",".join(combi) or "∅", nom_note),
                                p1(tension=base["tension"], enjeu=base["enjeu"],
                                   debat=base["debat"], **extra),
                                p2(), {}))
    return cas


# ── LE BALAYAGE DE LA NORMALISATION — LES ÉCARTS DE LANGAGE ────────────────

VALEURS_TORDUES = [
    ("limite nu", "limite"),
    ("limite entoure d'espaces", "  limite  "),
    ("MAJUSCULES", "LIMITE"),
    ("Capitale", "Limite"),
    # ⭐ LES BLANCS — le cinquieme ecart de langage, et le plus frequent.
    ("⭐ NEL U+0085 — blanc de PYTHON, pas de JavaScript", "limite"),
    ("⭐ separateurs U+001C-U+001F — blancs de PYTHON seuls", "limite"),
    ("⭐⭐ BOM U+FEFF en tete — blanc de JAVASCRIPT, PAS de Python", "﻿limite"),
    ("⭐⭐ BOM U+FEFF en fin — le meme ecart, a l'autre bord", "limite﻿"),
    ("espace insecable U+00A0 — blanc des deux", " limite "),
    ("espace cadratin U+2003 — blanc des deux", " limite"),
    ("espace ideographique U+3000 — blanc des deux", "　limite"),
    ("separateur de ligne U+2028 — blanc des deux", " limite"),
    ("tabulation et saut de ligne", "\t\nlimite\r\n"),
    # ⭐⭐ str() DE PYTHON — les deuxieme et troisieme ecarts.
    ("⭐⭐ str() D'UNE LISTE — Python rend « ['limite'] », JS rend « limite »", ["limite"]),
    ("str() d'une liste a deux", ["limite", "autre"]),
    ("⭐ str() D'UN DICT — Python « {'a': 1} », JS « [object Object] »", {"a": 1}),
    # ⭐ LA VERITE D'UNE VALEUR — le quatrieme ecart.
    ("⭐ LISTE VIDE — fausse en Python, VRAIE en JavaScript", []),
    ("⭐ DICT VIDE — faux en Python, VRAI en JavaScript", {}),
    ("zero", 0),
    ("faux", False),
    ("vrai — « True » en Python, « true » en JS, minuscules ensuite", True),
    ("entier", 5),
    ("chaine vide", ""),
    ("None", None),
    ("valeur hors catalogue", "peut-etre"),
    ("apostrophe typographique", "limite’"),
    ("accent", "limité"),
]


def balayage_normalisation(m):
    """⭐ LES ÉCARTS DE LANGAGE, ÉPROUVÉS LÀ OÙ ILS MORDENT.

    `_nn` n'est pas exportable — c'est un lambda local. On l'éprouve donc par ses
    DEUX effets observables : est-ce que le champ est vu comme `limite` (donc
    résolu, donc `nb_limites` bouge), et que porte l'alerte hors catalogue, qui
    écrit un `str()` de la valeur.
    """
    cas = []
    for champ in CHAMPS_LIMITE:
        for nom, valeur in VALEURS_TORDUES:
            kw = {"tension": "articulees", "enjeu": "enonce", "debat": "enoncees"}
            cle = {"notions_en_tension": "tension", "enjeu": "enjeu",
                   "reponses_concurrentes": "debat"}[champ]
            kw[cle] = valeur
            kw["note_" + champ] = NOTES["lisible haut-bas"][champ]
            cas.append(joue(m, "normalisation %s ← %s" % (champ, nom),
                            p1(**kw), p2(), {}))
    # La forme de la question — le quatrième champ à catalogue, sans `limite`.
    for nom, valeur in VALEURS_TORDUES:
        cas.append(joue(m, "normalisation forme_question ← %s" % nom,
                        p1(forme=valeur), p2(), {}))
    return cas


# ── LE BALAYAGE DE L'APPARIEMENT ───────────────────────────────────────────

def balayage_appariement(m):
    """`cite` : les blancs, les doublons, le non-apparié, et LA TRANCHE À 40.

    ⭐ `cite[:40]` tranche par POINTS DE CODE en Python, par unités UTF-16 en
    JavaScript : une citation qui commence par un caractère hors du plan de base
    fait diverger le texte de l'alerte `requalification_inappariable`.
    """
    long_ascii = "x" * 60
    long_hors_bmp = "𝔔" * 60          # U+1D511 — deux unités UTF-16, un point de code
    long_emoji = "👉citation qui déborde largement des quarante caractères comptés"
    cas = []
    lots = [
        ("cite identique", [rec(cite="R")], [{"cite": "R", "verdict": "valide", "test": "tenue"}]),
        ("cite avec blancs autour", [rec(cite="  R  ")],
         [{"cite": "R", "verdict": "valide", "test": "tenue"}]),
        ("cite du juge avec blancs", [rec(cite="R")],
         [{"cite": " R ", "verdict": "valide", "test": "tenue"}]),
        ("⭐ blanc de PYTHON dans le cite", [rec(cite="R")],
         [{"cite": "\u0085R\u0085", "verdict": "valide", "test": "tenue"}]),
        ("⭐⭐ BOM dans le cite du releve — strip() la garde, trim() la mange", [rec(cite="\ufeffR")],
         [{"cite": "R", "verdict": "valide", "test": "tenue"}]),
        ("⭐⭐ BOM dans le cite du juge", [rec(cite="R")],
         [{"cite": "\ufeffR", "verdict": "valide", "test": "tenue"}]),
        ("deux recadrages au MÊME cite — inappariable", [rec(cite="R"), rec(cite="R")],
         [{"cite": "R", "verdict": "valide", "test": "tenue"}]),
        ("cite du juge introuvable", [rec(cite="R")],
         [{"cite": "AUTRE", "verdict": "valide", "test": "tenue"}]),
        ("⭐ TRANCHE 40 — ascii long", [rec(cite="R")],
         [{"cite": long_ascii, "verdict": "valide", "test": "tenue"}]),
        ("⭐⭐ TRANCHE 40 — hors du plan de base", [rec(cite="R")],
         [{"cite": long_hors_bmp, "verdict": "valide", "test": "tenue"}]),
        ("⭐⭐ TRANCHE 40 — émoji en tête", [rec(cite="R")],
         [{"cite": long_emoji, "verdict": "valide", "test": "tenue"}]),
        ("cite vide des deux côtés", [rec(cite="")],
         [{"cite": "", "verdict": "valide", "test": "tenue"}]),
        ("cite absent du recadrage", [{"type": "question_deplacee",
                                       "deplacement": "d", "reprise": "r"}],
         [{"cite": "", "verdict": "valide", "test": "tenue"}]),
        ("cite à None dans le recadrage", [{"cite": None, "type": "question_deplacee",
                                            "deplacement": "d", "reprise": "r"}],
         [{"cite": "", "verdict": "valide", "test": "tenue"}]),
        ("cite absent chez le juge", [rec(cite="R")],
         [{"verdict": "valide", "test": "tenue"}]),
    ]
    for nom, recs, crible in lots:
        cas.append(joue(m, "appariement — " + nom, p1(recadrages=recs), p2(crible=crible), {}))
    return cas


# ── LE BALAYAGE DES FORMES QUE LE MODULE N'ATTEND PAS ──────────────────────

def balayage_formes(m):
    """Ce que P1 et P2 peuvent rendre, et que le module n'attend pas.

    ⛔ `crible` EN CHAÎNE : Python itère ses CARACTÈRES. Ce n'est PAS à durcir,
    c'est à porter — « un portage qui la lirait comme une entrée unique
    fabriquerait une requalification ».
    """
    cas = []
    lots = [
        ("recadrages à None", p1(recadrages=None), p2()),
        ("recadrages en CHAÎNE", dict(p1(), recadrages="deux recadrages"), p2()),
        ("recadrages en DICT", dict(p1(), recadrages={"a": 1}), p2()),
        ("recadrages en NOMBRE", dict(p1(), recadrages=3), p2()),
        ("une entrée de recadrages qui n'est pas un objet",
         p1(recadrages=["un texte", rec(cite="R")]), p2()),
        ("une entrée de recadrages à None", p1(recadrages=[None, rec(cite="R")]), p2()),
        ("type de recadrage hors catalogue",
         p1(recadrages=[rec(typ="autre_chose")]), p2()),
        ("type de recadrage à None", p1(recadrages=[rec(typ=None)]), p2()),
        ("type de recadrage en LISTE", p1(recadrages=[rec(typ=["a"])]), p2()),
        ("⭐ crible EN CHAÎNE — Python itère ses caractères",
         p1(recadrages=[rec(cite="R")]), p2(crible="valide")),
        ("crible en DICT — Python itère ses clés",
         p1(recadrages=[rec(cite="R")]), p2(crible={"R": "valide"})),
        ("crible à None", p1(recadrages=[rec(cite="R")]), p2(crible=None)),
        ("une entrée de crible qui n'est pas un objet",
         p1(recadrages=[rec(cite="R")]), p2(crible=["valide", {"cite": "R", "verdict": "valide"}])),
        ("question_propre absent", p1(), {k: v for k, v in p2().items() if k != "question_propre"}),
        ("question_specifique absent", p1(),
         {k: v for k, v in p2().items() if k != "question_specifique"}),
        ("question_propre à None", p1(), p2(propre=None)),
        ("question_propre hors catalogue", p1(), p2(propre="peut-être")),
        ("question_specifique hors catalogue", p1(), p2(spec="assez_precise")),
        ("question_specifique en LISTE", p1(), p2(spec=["specifique"])),
        ("question_posee absente", {k: v for k, v in p1().items() if k != "question_posee"}, p2()),
        ("question_posee à None", p1(question=None), p2()),
        ("question_posee vide et forme absente", p1(forme="absent", question=""),
         p2(propre="n/a", spec="n/a")),
        ("forme absente mais question posée", p1(forme="absent"), p2()),
        ("relevé VIDE", {}, p2()),
        ("relevé sans aucun champ connu", {"autre": 1}, p2()),
    ]
    for nom, sp1, sp2 in lots:
        cas.append(joue(m, "formes — " + nom, sp1, sp2, {}))
    return cas


# ── `pre_p2` — LE RÉFÉRENT ─────────────────────────────────────────────────

ARMATURE = {"armature": {"question_directrice": "ce que le doute laisse intact",
                         "these": "il reste le sujet pensant",
                         "these_phrases": [4]},
            "phrases": [], "moments": []}


def referent_cas(m):
    """Les 7 vecteurs embarqués, et 12 de plus. ⭐ « Ils tiennent le nom du champ
    ET son niveau d'imbrication : le module a longtemps lu `reference["probleme"]`,
    qui n'a jamais existé, et rien ne le voyait. »"""
    cas = []
    for nom, ctx, attendu in m.VECTEURS_REFERENT:
        cas.append({"nom": "embarqué — " + nom, "contexte": ctx,
                    "rendu": m.pre_p2(ctx), "attendu_autotest": attendu})
    autres = [
        ("composer explicite", {"mode": "composer", "sujet": "S", "reference": ARMATURE}),
        ("mode absent — composer par défaut", {"sujet": "S"}),
        ("mode vide — composer par défaut", {"mode": "", "sujet": "S"}),
        ("mode inconnu — composer par défaut", {"mode": "disserter", "sujet": "S"}),
        ("mode en MAJUSCULES", {"mode": "INTERROGER", "reference": ARMATURE}),
        ("mode avec blancs", {"mode": "  restituer  ", "reference": ARMATURE}),
        ("⭐ évaluer ACCENTUÉ — la forme de la source", {"mode": "évaluer", "reference": ARMATURE}),
        ("evaluer sans accent — accepté aussi", {"mode": "evaluer", "reference": ARMATURE}),
        ("composer sans sujet — refus", {"mode": "composer"}),
        ("composer, sujet vide — refus", {"mode": "composer", "sujet": ""}),
        ("réceptif, question directrice absente",
         {"mode": "interroger", "reference": {"armature": {"these": "t"}}}),
        ("réceptif, armature qui n'est pas un objet",
         {"mode": "interroger", "reference": {"armature": "ce que le doute laisse intact"}}),
        ("réceptif, reference qui n'est pas un objet",
         {"mode": "interroger", "reference": "ce que le doute laisse intact"}),
        ("réceptif, question directrice avec blancs",
         {"mode": "interroger", "reference": {"armature": {"question_directrice": "  q  "}}}),
        ("⭐ réceptif, question directrice faite de blancs de PYTHON — vide pour strip()",
         {"mode": "interroger",
          "reference": {"armature": {"question_directrice": "\u0085\u001f"}}}),
        ("⭐⭐ réceptif, question directrice faite d'une BOM — trim() la vide, strip() la garde",
         {"mode": "interroger",
          "reference": {"armature": {"question_directrice": "\ufeff"}}}),
        ("⭐ réceptif, question directrice entourée de blancs de PYTHON",
         {"mode": "interroger",
          "reference": {"armature": {"question_directrice": "\u0085q\u001c"}}}),
        ("réceptif, question directrice à None",
         {"mode": "interroger", "reference": {"armature": {"question_directrice": None}}}),
        ("réceptif, question directrice en LISTE",
         {"mode": "interroger", "reference": {"armature": {"question_directrice": ["q"]}}}),
    ]
    for nom, ctx in autres:
        cas.append({"nom": nom, "contexte": ctx, "rendu": m.pre_p2(ctx), "attendu_autotest": None})
    return cas


# ── `conformite` ───────────────────────────────────────────────────────────

def conformite_cas(m):
    cas = []
    lots = [
        ("le juge rend `niveau`",
         {"niveau": "Bon", "levier": "travaille ta problématique", "confiance": "elevee"}),
        ("un palier nommé dans la prose",
         {"levier": "ta copie est Bon en questionnement", "confiance": "elevee"}),
        ("le juge rend `palier_base`", {"palier_base": "Bon", "confiance": "elevee"}),
        ("le juge rend `seuil_franchi`", {"seuil_franchi": "oui", "confiance": "elevee"}),
        ("le juge rend `LETTRE` en majuscules", {"LETTRE": "B", "confiance": "elevee"}),
        ("le juge rend `note`", {"note": 12, "confiance": "elevee"}),
        ("un palier dans justification_ancree",
         {"justification_ancree": "la question est Moyen", "confiance": "moyenne"}),
        ("un palier dans ce_qui_plafonne",
         {"ce_qui_plafonne": "il manque Acquis", "confiance": "faible"}),
        ("prose propre", {"levier": "reprends ta problématique", "confiance": "elevee"}),
        ("prose à None", {"levier": None, "confiance": "elevee"}),
        ("⭐ prose en LISTE — `in` teste l'APPARTENANCE, pas la sous-chaîne",
         {"levier": ["Bon"], "confiance": "elevee"}),
        ("prose en liste sans palier", {"levier": ["reprends"], "confiance": "elevee"}),
        ("⭐ prose en DICT — `in` teste les CLÉS", {"levier": {"Bon": 1}, "confiance": "elevee"}),
        ("confiance hors des trois", {"confiance": "totale"}),
        ("confiance absente", {"levier": "reprends"}),
        ("confiance à None", {"confiance": None}),
        ("confiance en NOMBRE", {"confiance": 3}),
        ("sortie du juge VIDE", {}),
        ("sortie du juge complète et propre", p2()),
    ]
    for nom, sp2 in lots:
        cas.append({"nom": nom, "p2": sp2, "alertes": m.conformite(sortie_p2=sp2)})
    return cas


# ── main ───────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--racine", default=RACINE_DEFAUT)
    args = ap.parse_args()
    m = charge_module(args.racine)

    echecs, annonces = m.autotest()

    # ⚠️ LE TYPE SE VÉRIFIE, IL NE SE SUPPOSE PAS — et les deux noms du contrat
    #    sont ABSENTS chez cette compétence. On l'ÉCRIT, pour qu'un zéro ne
    #    puisse jamais ressembler à une mesure.
    noms_du_contrat = ["TESTS_P2_PARFAIT", "TESTS_CODE1_PARFAIT"]
    noms_reels = ["VECTEURS", "ALERTES_ATTENDUES", "VECTEURS_REFERENT", "OBSERVABLES", "PALIERS"]
    paquet = {
        "meta": {
            "competence": m.COMPETENCE,
            "version_calcul": m.VERSION,
            "version_golds_testee": m.VERSION_GOLDS_TESTEE,
            "slot_document_p2": m.SLOT_DOCUMENT_P2,
            "observables": list(m.OBSERVABLES),
            "catalogue": {k: list(v) for k, v in m.CATALOGUE.items()},
            "params": {k: dict(v) for k, v in m.PARAMS.items()},
            "regle_agregation_citee": m.REGLE_AGREGATION_CITEE,
            "modes_receptifs": list(m.MODES_RECEPTIFS),
            "vide_deplacement": m.VIDE_DEPLACEMENT,
            "vide_reprise": m.VIDE_REPRISE,
            "absentes": {n: hasattr(m, n) for n in noms_du_contrat},
            "types": {n: type(getattr(m, n)).__name__ for n in noms_reels},
            "tailles": {n: len(getattr(m, n)) for n in noms_reels},
        },
        "autotest": {"echecs": echecs, "annonces": annonces},
    }

    paquet["vecteurs"] = vecteurs_embarques(m)
    paquet["alertes_attendues"] = alertes_attendues(m)
    paquet["balayage_cascade"] = balayage_cascade(m)
    paquet["balayage_conjonction"] = balayage_conjonction(m)
    paquet["balayage_crible"] = balayage_crible(m)
    paquet["balayage_crible_multiple"] = balayage_crible_multiple(m)
    paquet["balayage_limite"] = balayage_limite(m)
    paquet["balayage_normalisation"] = balayage_normalisation(m)
    paquet["balayage_appariement"] = balayage_appariement(m)
    paquet["balayage_formes"] = balayage_formes(m)
    paquet["referent_cas"] = referent_cas(m)
    paquet["conformite_cas"] = conformite_cas(m)

    paquet["comptes"] = {k: len(v) for k, v in paquet.items() if isinstance(v, list)}

    json.dump(paquet, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    # Un portage vérifié contre un module EN ÉCHEC ne prouve rien.
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())

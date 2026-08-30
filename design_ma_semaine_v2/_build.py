import io, sys

FONTS = io.open('_fonts.txt', encoding='utf-8').read()
STYLE = io.open('_style.txt', encoding='utf-8').read()

def page(corps, largeur):
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}  <style>
{STYLE}  </style>
</helmet>

<div style="width: {largeur}px; box-sizing: border-box; background: #F4EFE6;">
{corps}
</div>
</x-dc>
</body>
</html>
"""

def ecrire(nom, corps, largeur):
    io.open(nom, 'w', encoding='utf-8').write(page(corps, largeur))
    print('écrit', nom)

# ── Les morceaux communs ────────────────────────────────────────────────────

def bandeau(large=True):
    if large:
        return """
  <div style="background: #F6F1E5; border-bottom: 1px solid #E4DBC9; padding: 14px 30px; display: flex; align-items: flex-end; justify-content: space-between; gap: 22px;">
    <div>
      <div style="font: 400 12px 'Alegreya Sans', sans-serif; color: #8A7355;">‹ Tableau de bord</div>
      <div style="font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 29px; color: #221C16;">Ma semaine</div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; flex: none;">
      <span style="font: 500 13px 'Alegreya Sans', sans-serif; color: #5A4632; background: #FBF8F1; border: 1px solid #E4DBC9; border-radius: 9px; padding: 11px 14px;">◀ précédente</span>
      <span style="font: 600 15px 'EB Garamond', serif; color: #5A4632; min-width: 128px; text-align: center;">24 → 30 août</span>
      <span style="font: 500 13px 'Alegreya Sans', sans-serif; color: #5A4632; background: #FBF8F1; border: 1px solid #E4DBC9; border-radius: 9px; padding: 11px 14px;">suivante ▶</span>
    </div>
  </div>"""
    return """
  <div style="background: #F6F1E5; border-bottom: 1px solid #E4DBC9; padding: 12px 16px;">
    <div style="font: 400 12px 'Alegreya Sans', sans-serif; color: #8A7355;">‹ Tableau de bord</div>
    <div style="font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 24px; color: #221C16;">Ma semaine</div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px;">
      <span style="width: 46px; height: 46px; border: 1px solid #E4DBC9; background: #FBF8F1; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font: 500 15px 'Alegreya Sans', sans-serif; color: #5A4632;">◀</span>
      <span style="font: 600 16px 'EB Garamond', serif; color: #5A4632;">24 → 30 août</span>
      <span style="width: 46px; height: 46px; border: 1px solid #E4DBC9; background: #FBF8F1; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font: 500 15px 'Alegreya Sans', sans-serif; color: #5A4632;">▶</span>
    </div>
  </div>"""

def legende(pastille, texte):
    return f"""
  <div style="padding: 18px 30px; border-bottom: 1px solid #E4DBC9; display: flex; align-items: flex-start; gap: 12px;">
    <span style="font: 600 12px 'Alegreya Sans', sans-serif; letter-spacing: .06em; background: #E8DFCB; color: #5A4632; padding: 5px 12px; border-radius: 20px; flex: none;">{pastille}</span>
    <p class="capt">{texte}</p>
  </div>"""

def legende_etroite(pastille, texte):
    return f"""
  <div style="padding: 14px 16px; border-bottom: 1px solid #E4DBC9;">
    <span style="font: 600 11px 'Alegreya Sans', sans-serif; letter-spacing: .06em; background: #E8DFCB; color: #5A4632; padding: 4px 10px; border-radius: 20px; display: inline-block; margin-bottom: 7px;">{pastille}</span>
    <p class="capt" style="font-size: 14px;">{texte}</p>
  </div>"""

CONSIGNES = [
    ("retour à lire", "à rendre dim. 30", "Ouvrir", "btn",
     "Ici, l'énoncé du sujet est pris tel quel&nbsp;: la partie y répond sans jamais l'interroger. Surligne le mot de l'énoncé qu'il fallait retravailler, et dis ce qu'il pouvait vouloir dire."),
    ("commencé", "à rendre dim. 30", "Reprendre", "btn2",
     "Ce début de devoir annonce un débat sans dire quelle autre solution on pourrait apporter à sa question. Surligne la phrase où cela se passe, et dis quelles sont les deux solutions qu'il fallait nommer."),
    ("commencé", "à rendre dim. 30", "Reprendre", "btn2",
     "La question de cette introduction n'est que le sujet retourné. Écris à sa place, en une phrase, une question qui dise autre chose."),
]

def carte(etat, ech, libelle, cls, texte, boutonPleineLargeur=False):
    b = f'<span class="{cls}" style="{"width: 100%;" if boutonPleineLargeur else "align-self: flex-start;"}">{libelle}</span>'
    return f"""
        <div class="carte">
          <div style="display: flex; align-items: center; gap: 11px;">
            <span class="pas"><img src="codex.png" alt=""></span>
            <span class="etat" style="flex: 1;">{etat}</span>
            <span class="ech">{ech}</span>
          </div>
          <p class="clamp" style="font: 400 17px/1.5 'EB Garamond', serif; color: #221C16; margin: 0; flex: 1;">{texte}</p>
          {b}
        </div>"""

COMPETENCES = [
    ("Expression", 8, ["la construction de tes phrases", "la façon dont tes phrases se tiennent entre elles", "le choix de tes mots", "les mots dont tu n'es pas sûr"]),
    ("Questionnement", 9, ["les deux notions qui s'opposent", "ce que la solution changerait", "l'autre solution possible"]),
    ("Structure", 8, ["les transitions toutes faites", "la façon dont chaque paragraphe s'accroche au précédent", "l'idée de chaque paragraphe"]),
    ("Argumentation", 8, ["les liens entre justification et conclusion, écrits noir sur blanc", "tes raisons qui tournent en rond", "les mots qui changent de sens en route", "les mots centraux que tu laisses sans contour"]),
    ("Connaissance", 7, ["à qui tu attribues ce que tu cites"]),
]

def colonne_competence(nom, pts, forces):
    puces = ''.join(f'\n          <div class="puce"><b>·</b><span>{f}</span></div>' for f in forces)
    return f"""
        <div>
          <div style="font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 18px; color: #221C16;">{nom}</div>
          <p style="font: 400 13px 'EB Garamond', serif; color: #5B6E4A; margin: 4px 0 4px;">Tu es au point sur&nbsp;:</p>{puces}
          <p style="font: italic 13px 'EB Garamond', serif; color: #8A6F4E; margin: 6px 0 0;">{pts} points regardés — <span style="text-decoration: underline;">voir le détail</span></p>
        </div>"""

def bandeau_meta(colonnes):
    corps = ''.join(colonne_competence(*c) for c in COMPETENCES)
    return f"""
    <div style="background: #FBF8F1; border: 1px solid #E4DBC9; border-top: 3px solid #5A4632; border-radius: 12px; padding: 18px 20px;">
      <div class="sur" style="margin-bottom: 13px;">Ce que la semaine travaille · 5 compétences</div>
      <div style="display: grid; grid-template-columns: repeat({colonnes}, minmax(0, 1fr)); gap: 22px 26px;">{corps}
      </div>
    </div>"""

def offre(bouton=False, large=True):
    b = '\n        <span class="btnOcre">Demander un exercice de plus</span>' if bouton else ''
    phrase = ("Tu as fini ta semaine. Si tu veux, tu peux demander un exercice de plus."
              if bouton else "Quand tu auras fini les exercices de ta semaine, tu pourras en demander un de plus.")
    disposition = ("display: flex; align-items: center; gap: 20px; justify-content: space-between;"
                   if large else "display: flex; flex-direction: column; gap: 12px; align-items: flex-start;")
    return f"""
    <div style="background: #FBF8F1; border: 1px solid #E4DBC9; border-top: 3px solid #AC8552; border-radius: 12px; padding: 16px 20px;">
      <div class="sur" style="margin-bottom: 8px;">En faire plus</div>
      <div style="{disposition}">
        <p style="font: 400 16px/1.45 'EB Garamond', serif; color: #5A4632; margin: 0; max-width: 62ch;">{phrase}</p>{b}
      </div>
    </div>"""

print('helpers prêts')


# ════════════════════════════════════════════════════════════════════════════
# C — L'INDEX REPLIÉ. Une ligne par exercice, une ligne par compétence.
# ════════════════════════════════════════════════════════════════════════════
# ⚠️ La ligne FERMÉE porte la consigne écrêtée à UNE ligne — sans elle, trois
#    lignes disant « commencé · dim. 30 » sont indiscernables. C'est exactement
#    ce que l'écran fait déjà aujourd'hui (`truncate`).

def rang_ferme(etat, ech, libelle, cls, texte, avecBouton=True):
    b = f'<span class="{cls}" style="padding: 8px 16px; min-height: 40px;">{libelle}</span>' if avecBouton else ''
    return f"""
          <div class="ferme">
            <div class="rang">
              <span style="color: #A8906A; font-size: 12px;">▸</span>
              <span class="pas s"><img src="codex.png" alt=""></span>
              <span class="amorce d">{texte}</span>
              <span class="etat">{etat}</span>
              <span class="ech">{ech}</span>{b}
            </div>
          </div>"""

def rang_ouvert(etat, ech, libelle, cls, texte, avecBouton=True):
    b = f'<span class="{cls}" style="padding: 8px 16px; min-height: 40px;">{libelle}</span>' if avecBouton else ''
    return f"""
          <div class="ouvert">
            <div class="rang" style="background: #ECE4D6; border-bottom: 1px solid #E4DBC9;">
              <span style="color: #8A6F4E; font-size: 12px;">▾</span>
              <span class="pas s"><img src="codex.png" alt=""></span>
              <span style="flex: 1;"></span>
              <span class="etat">{etat}</span>
              <span class="ech">{ech}</span>{b}
            </div>
            <p style="font: 400 18px/1.55 'EB Garamond', serif; color: #221C16; margin: 0; padding: 15px 18px; max-width: 66ch;">{texte}</p>
          </div>"""

def rail_competences():
    lignes = ''.join(
        f"""
          <div class="ligneComp"><span style="color: #A8906A; font-size: 11px;">▸</span><span class="n">{nom}</span><span style="font: 500 12px 'Alegreya Sans', sans-serif; color: #8A6F4E;">{pts} points</span></div>"""
        for nom, pts, _ in COMPETENCES)
    return f"""
        <div>
          <div class="sur" style="margin: 0 0 9px 2px;">Ce que la semaine travaille</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">{lignes}
          </div>
        </div>"""

def segment_travail(etroit=False):
    l = 'max-width: 320px;' if etroit else ''
    return f"""
      <div>
        <div class="seg" style="{l}"><span class="segOn">Travail · 3</span><span class="segOff">Bilan</span></div>
        <p style="font: italic 13px/1.4 'EB Garamond', serif; color: #8A6F4E; margin: 7px 2px 0;">Ton bilan s'ouvrira quand tu auras fini ta semaine.</p>
      </div>"""

VOLUME = """
      <div>
        <span style="font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 23px; color: #221C16;">1 exercice fait sur 4</span>
        <div class="frise" style="margin-top: 9px;"><i class="on"></i><i></i><i></i><i></i></div>
      </div>"""

DEJA_FAIT = """
      <div class="repli"><span style="color: #8A6F4E; font-size: 12px;">▸</span><b>Déjà fait</b><span class="n">1</span></div>"""

rangs = (rang_ouvert(*CONSIGNES[0]) + rang_ferme(*CONSIGNES[1]) + rang_ferme(*CONSIGNES[2]))

# ── C · ordinateur — vue Travail ────────────────────────────────────────────

corps = legende('C · retenu · ordinateur',
  "<strong style=\"font-style: normal; font-weight: 600;\">L'ossature de <code style=\"font-style: normal; font-family: 'Alegreya Sans', sans-serif; font-size: 13px;\">3a</code> tenue, mais tout est replié.</strong> Une ligne par exercice, une ligne par compétence&nbsp;: la semaine entière tient dans un écran, et le rail cesse d'être un mur. La ligne fermée porte la consigne écrêtée à une ligne — sans elle, trois lignes disant «&nbsp;commencé · dim. 30&nbsp;» seraient indiscernables.") \
  + bandeau() + f"""

  <div style="padding: 22px 30px 34px; display: grid; grid-template-columns: minmax(0, 1fr) 276px; gap: 24px; align-items: start;">

    <div style="display: flex; flex-direction: column; gap: 18px;">
{VOLUME}
      <div>
        <div class="sur" style="margin: 0 0 10px 2px;">À faire</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">{rangs}
        </div>
      </div>
{DEJA_FAIT}
    </div>

    <div style="display: flex; flex-direction: column; gap: 16px;">
{segment_travail()}
{rail_competences()}
""" + offre(large=False) + """
    </div>
  </div>"""

ecrire('Main.dc.html', corps, 1100)

# ── C · téléphone — vue Travail ─────────────────────────────────────────────
# ⚠️ Sur téléphone la ligne fermée tient DEUX rangs visuels (l'amorce, puis
#    l'état et l'échéance) et LE BOUTON PASSE DANS LE PANNEAU OUVERT : à 390 px,
#    amorce + état + échéance + bouton sur un rang est illisible, et l'élève qui
#    n'a pas lu la consigne n'a de toute façon rien à reprendre.

def rang_ferme_tel(etat, ech, texte):
    return f"""
          <div class="ferme" style="padding: 10px 13px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: #A8906A; font-size: 12px;">▸</span>
              <span class="pas s"><img src="codex.png" alt=""></span>
              <span class="amorce d" style="font-size: 15px;">{texte}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 9px; margin: 7px 0 0 38px;">
              <span class="etat" style="font-size: 12px;">{etat}</span>
              <span class="ech">{ech}</span>
            </div>
          </div>"""

def rang_ouvert_tel(etat, ech, libelle, cls, texte):
    return f"""
          <div class="ouvert">
            <div style="background: #ECE4D6; border-bottom: 1px solid #E4DBC9; padding: 11px 13px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #8A6F4E; font-size: 12px;">▾</span>
                <span class="pas s"><img src="codex.png" alt=""></span>
                <span style="flex: 1;"></span>
              </div>
              <div style="display: flex; align-items: center; gap: 9px; margin: 7px 0 0 38px;">
                <span class="etat" style="font-size: 12px;">{etat}</span>
                <span class="ech">{ech}</span>
              </div>
            </div>
            <div style="padding: 14px 15px;">
              <p style="font: 400 17px/1.55 'EB Garamond', serif; color: #221C16; margin: 0 0 14px;">{texte}</p>
              <span class="{cls}" style="width: 100%;">{libelle}</span>
            </div>
          </div>"""

rangs_tel = (rang_ouvert_tel(*CONSIGNES[0])
             + rang_ferme_tel(CONSIGNES[1][0], CONSIGNES[1][1], CONSIGNES[1][4])
             + rang_ferme_tel(CONSIGNES[2][0], CONSIGNES[2][1], CONSIGNES[2][4]))

corps = legende_etroite('C · téléphone · Travail',
  "Tout replié&nbsp;: la semaine entière tient dans un écran. La ligne fermée garde son amorce&nbsp;; le bouton descend DANS le panneau ouvert — à 390&nbsp;px, amorce + état + échéance + bouton sur un rang ne tient pas.") \
  + bandeau(large=False) + f"""

  <div style="padding: 14px 16px 24px; display: flex; flex-direction: column; gap: 15px;">
{segment_travail()}
{VOLUME}
      <div>
        <div class="sur" style="margin: 0 0 9px 2px;">À faire</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">{rangs_tel}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
{DEJA_FAIT}
      <div class="repli"><span style="color: #8A6F4E; font-size: 12px;">▸</span><b>Ce que la semaine travaille</b><span class="n">5</span></div>
      </div>
""" + offre(large=False) + """
  </div>"""

ecrire('Telephone.dc.html', corps, 390)

# ── C · tablette portrait — vue Travail ─────────────────────────────────────

corps = legende('C · tablette portrait',
  "Une colonne&nbsp;: le rail retombe sous le travail, dans le même ordre — segment en tête, puis les exercices, puis les compétences repliées, puis l'offre. Les lignes gardent leur hauteur.") \
  + bandeau() + f"""

  <div style="padding: 18px 24px 30px; display: flex; flex-direction: column; gap: 18px;">
{segment_travail(etroit=True)}
{VOLUME}
      <div>
        <div class="sur" style="margin: 0 0 10px 2px;">À faire</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">{rangs}
        </div>
      </div>
{DEJA_FAIT}
{rail_competences()}
""" + offre(large=False) + """
  </div>"""

ecrire('Tablette.dc.html', corps, 768)

# ── C · vue BILAN — le rail garde le rappel du volume et l'offre ────────────

def ecarts(deuxColonnes):
    sep = ('border-left: 1px solid #E4DBC9; padding-left: 24px;' if deuxColonnes
           else 'border-top: 1px solid #E4DBC9; padding-top: 18px;')
    grille = ('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px;'
              if deuxColonnes else 'display: flex; flex-direction: column; gap: 18px;')
    return f"""
        <div style="padding: 18px; {grille}">
          <div>
            <span class="chipOk">Tu y arrives</span>
            <p style="font: 400 17px/1.55 'EB Garamond', serif; color: #221C16; margin: 9px 0 0;">sur la reprise de thèse et tes raisons qui tournent en rond — <em style="color: #5A4632;">là où tu avais du mal jusqu'ici</em>.</p>
          </div>
          <div style="{sep}">
            <span class="chipAtt">À reprendre</span>
            <p style="font: 400 17px/1.55 'EB Garamond', serif; color: #221C16; margin: 9px 0 0;">l'ancrage des exemples — <em style="color: #5A4632;">c'était pourtant un de tes points forts</em>.</p>
          </div>
        </div>"""

def bilan_ouvert(nom, nb, deuxColonnes):
    n = f'<span style="font: 500 13px \'Alegreya Sans\', sans-serif; color: #8A6F4E;">{nb} exercices</span>' if deuxColonnes else ''
    return f"""
      <div class="ouvert">
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #ECE4D6; border-bottom: 1px solid #E4DBC9; min-height: 48px; box-sizing: border-box;">
          <span style="color: #8A6F4E; font-size: 12px;">▾</span>
          <span style="flex: 1; font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 21px; color: #221C16;">{nom}</span>{n}
          <span class="chipAtt">à reprendre</span>
        </div>{ecarts(deuxColonnes)}
      </div>"""

def bilan_ferme(nom, nb, marque, avecNb):
    if marque == 'reussi':
        m = '<span class="chipOk">réussi</span>'
    else:
        m = '<span style="font: italic 14px \'EB Garamond\', serif; color: #8A6F4E;">comme d\'habitude</span>'
    n = (f'<span style="font: 500 13px \'Alegreya Sans\', sans-serif; color: #8A6F4E;">{nb} exercice{"s" if nb > 1 else ""}</span>'
         if avecNb else '')
    return f"""
      <div class="comp"><span style="color: #A8906A; font-size: 12px;">▸</span><span class="nom">{nom}</span>{n}{m}</div>"""

def bilan_grise(nom, court=False):
    t = 'non mesurée' if court else 'pas mesurée cette semaine'
    return f"""
      <div class="grise"><span style="flex: 1; font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: 20px; color: #8A6F4E;">{nom}</span><span style="font: italic 14px 'EB Garamond', serif; color: #A8906A;">{t}</span></div>"""

def corps_bilan(deux):
    return (bilan_ouvert('Argumentation', 3, deux)
            + bilan_ferme('Synthèse', 2, 'reussi', deux)
            + bilan_ferme('Expression', 3, 'habitude', deux)
            + bilan_ferme('Structure', 1, 'habitude', deux)
            + bilan_grise('Connaissance', not deux) + bilan_grise('Questionnement', not deux))

MANQUE = """
      <p style="background: #EFE4CF; border: 1px solid rgba(154,106,46,.4); border-radius: 12px; padding: 14px 16px; font: 400 16px/1.45 'EB Garamond', serif; color: #221C16; margin: 0;">Une de tes copies n'a pas encore été corrigée&nbsp;: ce bilan ne la compte pas encore.</p>"""

TA_SEMAINE = """
        <div style="background: #FBF8F1; border: 1px solid #E4DBC9; border-top: 3px solid #737F5E; border-radius: 12px; padding: 14px 15px;">
          <div class="sur" style="margin-bottom: 9px;">Ta semaine</div>
          <div style="font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 22px; color: #221C16;">5 faits sur 5</div>
          <div class="frise" style="margin-top: 9px;"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></div>
          <p style="font: italic 14px/1.4 'EB Garamond', serif; color: #8A6F4E; margin: 9px 0 0;">et 1 exercice que tu as demandé en plus, fait.</p>
        </div>"""

SEG_BILAN = """
        <div class="seg"><span class="segOff" style="color: #5A4632; background: #FBF8F1;">Travail</span><span class="segOn">Bilan</span></div>"""

corps = legende('C · retenu · ordinateur — vue Bilan',
  "Le bilan prend la grande colonne, le rail garde le segment, le rappel du volume et l'offre. Une compétence dépliée à la fois, ses deux écarts côte à côte.") \
  + bandeau() + f"""

  <div style="padding: 22px 30px 34px; display: grid; grid-template-columns: minmax(0, 1fr) 276px; gap: 24px; align-items: start;">

    <div style="display: flex; flex-direction: column; gap: 16px;">
{MANQUE}
      <p style="font: 400 17px 'EB Garamond', serif; color: #5A4632; margin: 0 0 -4px 2px;">4 compétences mesurées sur 6.</p>
      <div>
        <div class="sur" style="margin: 0 0 10px 2px;">Choisis une compétence</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">{corps_bilan(True)}
        </div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 16px;">
{SEG_BILAN}
{TA_SEMAINE}
""" + offre(bouton=True, large=False) + """
    </div>
  </div>"""

ecrire('Bilan.dc.html', corps, 1100)

corps = legende_etroite('C · téléphone · Bilan',
  "Une colonne&nbsp;: le mot des copies non mesurées, puis les six compétences enroulées. La dépliée empile ses deux écarts.") \
  + bandeau(large=False) + f"""

  <div style="padding: 14px 16px 24px; display: flex; flex-direction: column; gap: 14px;">
{SEG_BILAN}
{MANQUE}
    <p style="font: 400 16px 'EB Garamond', serif; color: #5A4632; margin: 0 0 -4px 2px;">4 compétences mesurées sur 6.</p>
    <div class="sur" style="margin: 0 0 -4px 2px;">Choisis une compétence</div>
    <div style="display: flex; flex-direction: column; gap: 8px;">{corps_bilan(False)}
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div class="repli"><span style="color: #8A6F4E; font-size: 12px;">▸</span><b>Ta semaine</b><span class="n">5 sur 5</span></div>
    </div>
""" + offre(bouton=True, large=False) + """
  </div>"""

ecrire('BilanTelephone.dc.html', corps, 390)

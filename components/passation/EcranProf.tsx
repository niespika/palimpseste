'use client'

// ============================================================================
// C4 · L4 — L'ÉCRAN DU PROFESSEUR : ouvrir, déclencher, corriger, publier.
// ----------------------------------------------------------------------------
// Étapes 4, 12 à 17 du `02-exercices.md` §6.D. UN SEUL composant pour les DEUX
// modules — « c'est le même flux dans deux modules ».
//
// ⚠️ LES RETOURS SONT MASQUÉS PAR DÉFAUT, PAR COPIE, ET AUCUN INTERRUPTEUR
//    GLOBAL NE DÉSHABILLE LA CLASSE (piège 27). Le cran vit dans l'état de
//    l'écran, copie par copie, et ne se persiste nulle part : rouvrir l'écran
//    remasque tout. « Il juge avant de voir la machine — le même esprit que le
//    protocole de ses bancs. »
//
// ⚠️ AUCUNE NOTE, NULLE PART (piège 30). Il n'y a pas de champ de note, et il
//    n'y en aura pas : « elle reste sur la copie papier et va dans l'outil de
//    bulletin » (`02-` §6.D, étape 15).
//
// ⚠️ LES DEUX DRAPEAUX SONT VISIBLES AU MOMENT DE L'OUVERTURE (piège 21) — pas
//    seulement dans un écran de conception quitté trois jours plus tôt : « une
//    année de collecte manquée ne se rattrape pas ».
// ============================================================================

import { useState, useActionState } from 'react'
import {
  actionLeverLesDrapeaux, actionOuvrirLesDepots, actionDeclencherLeLot,
  actionEditerLeRetour, actionCommentaireGeneral, actionMessageReporte,
  actionValiderLesCorrections, actionPublier, actionDepublier, type Reponse,
} from '@/app/passation/actions'
import {
  CRANS_DE_REVELATION, CRAN_INITIAL, auCran, sommaireDuRetour, accompagnementVisible,
  type CranRevelation,
} from '@/utils/passation/revelation'
import type { PointRetour } from '@/utils/chaine/types'
import { resumerCollages, phraseDesCollages, type CollageBloque } from '@/utils/passation/collage'

export interface LigneCopie {
  depotId: string
  eleve: string
  statut: string
  aDeposé: boolean
  /**
   * La copie telle que la mesure la lira : la transcription des photos, OU le
   * texte tapé par l'élève EXEMPTÉ — « la chaîne lit l'un ou l'autre ».
   * ⚠️ Elle ne lisait QUE la transcription jusqu'au 22/08 : la copie d'un élève
   *    exempté était invisible au professeur, qui corrigeait à l'aveugle.
   */
  copie: string | null
  /** La copie vient-elle du CLAVIER ? Alors il n'y a ni photo ni doute de lecture. */
  auClavier: boolean
  nbBlocs: number
  /** Ce que la machine a peiné à lire — jamais un score (piège 56). */
  doutes: number
  /**
   * Les tentatives de collage BLOQUÉES — rapportées au professeur (décision de
   * Louis, 22/08). Jamais un verdict, et jamais un signalement d'intégrité.
   */
  collages: CollageBloque[]
  commentaire: string | null
  /** Quand l'ÉLÈVE a remis sa copie — `v1_remis_at`. */
  remiseLe: string | null
  /** Quand le PROFESSEUR a arrêté sa correction — `corrige_at`. Ce n'est PAS la remise. */
  valideeLe: string | null
  messageReporte: string | null
  retour: {
    id: string
    points: PointRetour[]
    edite: boolean
    feedForward: string | null
    actionRevision: unknown
    publieLe: string | null
    luLe: string | null
  } | null
  /** L'état de file, pour que l'écran ne dise pas « en cours » sur un job mort. */
  attente: Array<{ etape: string; statut: string; echec_definitif: boolean; message: string | null }>
}

export interface VueProf {
  exerciceId: string
  titre: string
  lieu: string
  ouvertLe: string | null
  drapeaux: { seJuger: boolean; confianceRemise: boolean }
  copies: LigneCopie[]
  /** Les réglages du prompt de transcription encore ouverts (`06-` §4). */
  avertissements: string[]
  /** La lecture des dépôts a-t-elle rendu tout ce que la base annonce ? */
  tronque: boolean
  actif: boolean
}

export function EcranProf({ vue }: { vue: VueProf }) {
  const [selection, setSelection] = useState<Set<string>>(new Set())

  function basculer(id: string) {
    setSelection((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function toutPrendre(prendre: boolean) {
    setSelection(prendre ? new Set(vue.copies.map((c) => c.depotId)) : new Set())
  }

  return (
    <div className="space-y-6">
      {!vue.actif && (
        <Bandeau ton="attention">
          <strong>La passation en classe est à OFF.</strong> Cet écran fonctionne, mais les élèves
          ne voient rien. L’interrupteur s’ouvre à la recette.
        </Bandeau>
      )}
      {vue.tronque && (
        <Bandeau ton="retard">
          <strong>La liste des copies n’a pas pu être lue en entier.</strong> Ne déclenchez rien :
          un lot posé sur une liste tronquée oublierait des copies en silence.
        </Bandeau>
      )}
      {vue.avertissements.map((a, i) => (
        <Bandeau key={i} ton="attention">{a}</Bandeau>
      ))}

      <Ouverture vue={vue} />
      <Lot vue={vue} />
      <Correction
        vue={vue} selection={selection} basculer={basculer} toutPrendre={toutPrendre}
      />
    </div>
  )
}

function Bandeau({ children, ton }: { children: React.ReactNode; ton: 'attention' | 'retard' }) {
  const cls = ton === 'retard'
    ? 'border-retard bg-retard-teinte' : 'border-attention bg-attention-teinte'
  return <div className={`rounded-lg border p-3 text-sm text-encre ${cls}`}>{children}</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 4 — L'OUVERTURE, ET LES DEUX DRAPEAUX QUI SE LÈVENT JUSQUE-LÀ
// ─────────────────────────────────────────────────────────────────────────────

function Ouverture({ vue }: { vue: VueProf }) {
  const [etatD, actionD, enCoursD] = useActionState(actionLeverLesDrapeaux, null as Reponse | null)
  const [etatO, actionO, enCoursO] = useActionState(actionOuvrirLesDepots, null as Reponse | null)
  const ouvert = vue.ouvertLe != null

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        1 · Ouvrir le dépôt
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        C’est <strong>votre geste</strong>, jamais une fenêtre calendaire : rien ne se ferme tout
        seul, et la durée affichée aux élèves reste indicative. L’ouverture commande deux choses —
        le dépôt des photos, et la relecture de la transcription.
      </p>

      {/* Les deux drapeaux, ICI, au moment où le professeur ouvre : « le geste
          doit être visible au moment où le professeur ouvre le dépôt » (piège 21). */}
      <form action={actionD} className="mt-4 rounded border border-bordure-bouton p-3">
        <input type="hidden" name="exercice_id" value={vue.exerciceId} />
        <p className="text-sm font-semibold text-encre">
          Avant d’ouvrir — les deux gestes de Monitoring
        </p>
        <p className="mt-1 text-xs text-encre-douce">
          Une passation en classe n’en produit aucun par défaut. Ils se lèvent
          <strong> jusqu’à l’ouverture du dépôt</strong>, pas après — et une année de collecte
          manquée ne se rattrape pas.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-encre">
            <input type="checkbox" name="se_juger" defaultChecked={vue.drapeaux.seJuger}
              disabled={ouvert} />
            « Se juger » — deux questions à l’élève après sa remise
          </label>
          <label className="flex items-center gap-2 text-sm text-encre">
            <input type="checkbox" name="confiance_remise"
              defaultChecked={vue.drapeaux.confianceRemise} disabled={ouvert} />
            Confiance de remise — une valeur par compétence évaluée
          </label>
        </div>
        {!ouvert && (
          <button type="submit" disabled={enCoursD}
            className="mt-3 rounded border border-bordure-bouton px-3 py-1 text-sm text-encre-douce">
            {enCoursD ? '…' : 'Enregistrer les drapeaux'}
          </button>
        )}
        {ouvert && (
          <p className="mt-2 text-xs italic text-muet">
            Le dépôt est ouvert : les drapeaux ne se lèvent plus.
          </p>
        )}
        {etatD && <p className={`mt-2 text-sm ${etatD.ok ? 'text-ok' : 'text-retard'}`}>{etatD.message}</p>}
      </form>

      <form action={actionO} className="mt-4">
        <input type="hidden" name="exercice_id" value={vue.exerciceId} />
        <button type="submit" disabled={enCoursO}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {enCoursO ? '…' : ouvert ? 'Ouvrir pour les retardataires' : 'Ouvrir le dépôt maintenant'}
        </button>
        {ouvert && (
          <span className="ml-3 text-sm text-ok">
            Ouvert le {new Date(vue.ouvertLe!).toLocaleString('fr-CA')}
          </span>
        )}
        {etatO && <p className={`mt-2 text-sm ${etatO.ok ? 'text-ok' : 'text-retard'}`}>{etatO.message}</p>}
      </form>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 12 — LE TRAITEMENT EN LOT
// ─────────────────────────────────────────────────────────────────────────────

function Lot({ vue }: { vue: VueProf }) {
  const [etat, action, enCours] = useActionState(actionDeclencherLeLot, null as Reponse | null)
  // ⚠️ ON COMPTE LA REMISE DE L'ÉLÈVE, pas la validation du professeur. La
  //    première version lisait `corrige_at` et affichait « 0 copie validée sur 7 »
  //    alors qu'une copie était bel et bien remise — pendant que le serveur, lui,
  //    en mettait une en file. Un écran qui compte autre chose que ce qu'il dit
  //    est un écran qui ment (smoke test du 22/08).
  const remises = vue.copies.filter((c) => c.remiseLe != null).length
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        2 · Déclencher l’analyse en lot
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Le soir même ou un autre jour. {remises} copie{remises > 1 ? 's' : ''} remise
        {remises > 1 ? 's' : ''} sur {vue.copies.length}. Le traitement est différé : il tourne au
        fil de la file, sans exigence de délai.
      </p>
      <form action={action} className="mt-3">
        <input type="hidden" name="exercice_id" value={vue.exerciceId} />
        <button type="submit" disabled={enCours || vue.tronque}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {enCours ? '…' : 'Déclencher'}
        </button>
        {etat && <p className={`mt-2 text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPES 13 À 17 — CORRIGER, ÉDITER, COMMENTER, VALIDER, PUBLIER
// ─────────────────────────────────────────────────────────────────────────────

function Correction({
  vue, selection, basculer, toutPrendre,
}: {
  vue: VueProf
  selection: Set<string>
  basculer: (id: string) => void
  toutPrendre: (p: boolean) => void
}) {
  const [etatV, actionV, enCoursV] = useActionState(actionValiderLesCorrections, null as Reponse | null)
  const [etatP, actionP, enCoursP] = useActionState(actionPublier, null as Reponse | null)
  const [etatD, actionD, enCoursD] = useActionState(actionDepublier, null as Reponse | null)
  const ids = [...selection]

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        3 · Corriger, valider, publier
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-bordure pb-3">
        <label className="flex items-center gap-2 text-sm text-encre-douce">
          <input type="checkbox"
            checked={selection.size > 0 && selection.size === vue.copies.length}
            onChange={(e) => toutPrendre(e.target.checked)} />
          Tout sélectionner
        </label>
        <span className="text-sm text-muet">{selection.size} sélectionnée(s)</span>

        {/* ÉTAPE 16 — en masse OU individuellement : le même bouton, une ou N cases. */}
        <form action={actionV}>
          {ids.map((id) => <input key={id} type="hidden" name="depot_id" value={id} />)}
          <button type="submit" disabled={enCoursV || ids.length === 0}
            className="rounded border border-bordure-bouton px-3 py-1 text-sm text-encre-douce
                       disabled:opacity-40">
            Valider la correction
          </button>
        </form>

        {/* ÉTAPE 17 — LA CASE DE PUBLICATION. */}
        <form action={actionP}>
          {ids.map((id) => <input key={id} type="hidden" name="depot_id" value={id} />)}
          <button type="submit" disabled={enCoursP || ids.length === 0}
            className="rounded bg-bouton px-3 py-1 text-sm text-parchemin disabled:opacity-40">
            Publier les retours
          </button>
        </form>
        <form action={actionD}>
          {ids.map((id) => <input key={id} type="hidden" name="depot_id" value={id} />)}
          <button type="submit" disabled={enCoursD || ids.length === 0}
            className="text-sm text-encre-douce underline disabled:opacity-40">
            Dépublier
          </button>
        </form>
      </div>
      {[etatV, etatP, etatD].filter(Boolean).map((e, i) => (
        <p key={i} className={`mt-2 text-sm ${e!.ok ? 'text-ok' : 'text-retard'}`}>{e!.message}</p>
      ))}

      <ul className="mt-4 space-y-4">
        {vue.copies.map((c) => (
          <Copie key={c.depotId} copie={c}
            prise={selection.has(c.depotId)} basculer={() => basculer(c.depotId)} />
        ))}
      </ul>
      {vue.copies.length === 0 && (
        <p className="mt-4 text-sm italic text-muet">
          Aucun dépôt sur cette instance. Les lignes de dépôt naissent à l’assignation, pas au
          dépôt : assignez l’exercice à une classe pour qu’elles existent.
        </p>
      )}
    </section>
  )
}

function Copie({
  copie, prise, basculer,
}: { copie: LigneCopie; prise: boolean; basculer: () => void }) {
  // ⚠️ LE CRAN EST PAR COPIE, et il repart de zéro à chaque ouverture d'écran.
  const [cran, setCran] = useState<CranRevelation>(CRAN_INITIAL)
  const [edition, setEdition] = useState(false)

  const points = copie.retour?.points ?? []
  const vus = auCran(points, cran)
  const sommaire = sommaireDuRetour(points)

  return (
    <li className="rounded-lg border border-bordure-bouton p-3">
      <div className="flex flex-wrap items-center gap-3">
        <input type="checkbox" checked={prise} onChange={basculer} />
        <span className="font-cinzel text-encre">{copie.eleve}</span>
        <Etat copie={copie} />
      </div>

      {copie.copie && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-encre-douce">
            La copie ({copie.nbBlocs} paragraphe{copie.nbBlocs > 1 ? 's' : ''}
            {copie.auClavier ? ' · tapée au clavier (aménagement)' : ''}
            {copie.doutes > 0 ? ` · ${copie.doutes} passage(s) difficile(s) à lire` : ''})
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-parchemin p-3
                          font-mono text-sm leading-relaxed text-encre">{copie.copie}</pre>
        </details>
      )}

      <Collages copie={copie} />

      {copie.retour ? (
        <div className="mt-3 rounded border border-bordure p-3">
          {/* ÉTAPE 13 — LA RÉVÉLATION GRADUÉE, par copie. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muet-clair">
              Retour de la machine
            </span>
            {CRANS_DE_REVELATION.map((c) => (
              <button key={c.cran} type="button" onClick={() => setCran(c.cran as CranRevelation)}
                title={c.quoi}
                className={`rounded px-2 py-0.5 text-xs ${
                  cran === c.cran
                    ? 'bg-bouton text-parchemin'
                    : 'border border-bordure-bouton text-encre-douce'}`}>
                {c.nom}
              </button>
            ))}
          </div>

          {cran === 0 && (
            <p className="mt-2 text-sm italic text-muet">
              Masqué. Jugez d’abord ; révélez ensuite, si vous le souhaitez.
            </p>
          )}
          {cran === 1 && (
            <ul className="mt-2 space-y-1 text-sm text-encre">
              {sommaire.parCompetence.map((s) => (
                // ⚠️ `capitalize` sur la LIGNE mettait une majuscule à chaque mot
                //    — « 1 Réussite(S), 0 Point(S) De Travail ». Il ne porte que
                //    sur le nom de la compétence (smoke test du 22/08).
                <li key={s.competence}>
                  <span className="capitalize">{s.competence}</span> — {s.reussites} réussite(s),
                  {' '}{s.pointsDeTravail} point(s) de travail
                </li>
              ))}
              {sommaire.total === 0 && <li className="italic text-muet">Aucun point.</li>}
            </ul>
          )}
          {cran >= 2 && !edition && (
            <ul className="mt-2 space-y-2 text-sm text-encre">
              {vus.map((p) => (
                <li key={p.id} className="border-l-2 border-liseret pl-2">
                  <span className="text-xs uppercase text-muet-clair">
                    {p.competence} · {p.nature === 'reussite' ? 'réussite' : 'à travailler'}
                  </span>
                  <p>{p.texte}</p>
                  {p.ancrage?.citation && (
                    <p className="text-xs italic text-encre-douce">« {p.ancrage.citation} »</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {cran >= 3 && accompagnementVisible(cran) && copie.retour.feedForward && (
            <p className="mt-2 text-sm text-encre-douce">
              <strong>Pour la suite :</strong> {copie.retour.feedForward}
            </p>
          )}

          {/* ÉTAPE 14 — il peut modifier le retour. */}
          {cran >= 2 && (
            <button type="button" onClick={() => setEdition((e) => !e)}
              className="mt-2 text-sm text-encre-douce underline">
              {edition ? 'Fermer l’édition' : 'Modifier le retour'}
            </button>
          )}
          {edition && <EditionDuRetour retourId={copie.retour.id} points={points} />}

          <p className="mt-2 text-xs text-muet">
            {copie.retour.publieLe
              ? `Publié le ${new Date(copie.retour.publieLe).toLocaleString('fr-CA')}`
              : 'Non publié'}
            {copie.retour.luLe
              ? ` · lu par l’élève le ${new Date(copie.retour.luLe).toLocaleString('fr-CA')}`
              : copie.retour.publieLe ? ' · lecture non validée' : ''}
            {copie.retour.edite ? ' · retour modifié' : ''}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm italic text-muet">
          {copie.attente.some((a) => a.echec_definitif)
            ? `Traitement en échec définitif — ${copie.attente.find((a) => a.echec_definitif)?.message ?? ''}`
            : copie.attente.length
              ? 'En file.'
              : 'Aucun retour engendré.'}
        </p>
      )}

      <CommentaireEtMessage copie={copie} />
    </li>
  )
}

function Etat({ copie }: { copie: LigneCopie }) {
  const t: Record<string, string> = {
    assigne: 'assigné', ouvert: 'dépôt ouvert', v1_remis: 'copie remise',
    retour_publie: 'retour publié', retire: 'retiré', abandonne: 'abandonné', clos: 'clos',
  }
  return <span className="text-xs uppercase tracking-wide text-muet">{t[copie.statut] ?? copie.statut}</span>
}

/**
 * LES TENTATIVES DE COLLAGE BLOQUÉES — rapportées au professeur.
 *
 * ⭐ « Chaque tentative de collage bloquée est journalisée » (`06-` §1) ; et,
 *    décision de Louis du 22/08, LES TROIS VECTEURS SE RAPPORTENT AU PROFESSEUR.
 *    C'est ici que le journal arrive à ses yeux — sur la copie, au moment où il
 *    la corrige, et nulle part ailleurs.
 *
 * ⚠️ INFORMER N'EST PAS ACCUSER, et l'écran le montre par sa forme autant que
 *    par ses mots : ton d'attention, aucune couleur de faute, aucun mot de
 *    triche, aucune action offerte — le professeur n'a rien à valider ni à
 *    signaler ici. Le §7 de la SPEC ne fait jamais d'un signal isolé un
 *    drapeau : c'est la CONVERGENCE qui part au prof, ailleurs, avec
 *    confirmation humaine.
 *
 * ⚠️ LA RÉSERVE DE LA SOURCE EST ÉCRITE À L'ÉCRAN, pas seulement dans le code :
 *    « ce blocage est côté navigateur seulement ». Sans elle, un professeur
 *    lirait « 0 » comme une garantie — et zéro tentative ne prouve rien.
 *    On n'affiche donc RIEN quand il n'y en a aucune (`phraseDesCollages` rend
 *    `null`) : « un écran n'affiche un nombre que si ce nombre compte quelque
 *    chose » (`06-` §5).
 */
function Collages({ copie }: { copie: LigneCopie }) {
  const phrase = phraseDesCollages(resumerCollages(copie.collages))
  if (!phrase) return null
  return (
    <p className="mt-2 rounded border border-attention bg-attention-teinte px-3 py-2 text-xs
                  text-encre-douce">
      <strong className="font-cinzel">{phrase}.</strong>{' '}
      Le collage est refusé dans le champ de rédaction ; ces tentatives n’ont rien inséré.
      C’est une information, pas un verdict : rien n’a été signalé, et le blocage est
      côté navigateur seulement — il arrête le geste paresseux, pas l’élève déterminé.
    </p>
  )
}

function EditionDuRetour({ retourId, points }: { retourId: string; points: PointRetour[] }) {
  const [etat, action, enCours] = useActionState(actionEditerLeRetour, null as Reponse | null)
  const [locaux, setLocaux] = useState<PointRetour[]>(points)

  function changer(id: string, texte: string) {
    setLocaux((l) => l.map((p) => (p.id === id ? { ...p, texte } : p)))
  }
  function retirer(id: string) {
    setLocaux((l) => l.filter((p) => p.id !== id))
  }

  return (
    <form action={action} className="mt-3 space-y-2 rounded border border-bordure-bouton p-3">
      <input type="hidden" name="retour_id" value={retourId} />
      {/* ⚠️ Les identifiants stables voyagent AVEC les points : l'édition les
          conserve, elle n'en refabrique pas (piège 31). */}
      <input type="hidden" name="points" value={JSON.stringify(locaux)} />
      {locaux.map((p) => (
        <div key={p.id} className="flex items-start gap-2">
          <textarea value={p.texte} onChange={(e) => changer(p.id, e.target.value)} rows={2}
            className="flex-1 rounded border border-bordure-bouton bg-parchemin p-2 text-sm text-encre" />
          <button type="button" onClick={() => retirer(p.id)}
            className="text-sm text-retard underline">Retirer</button>
        </div>
      ))}
      {locaux.length === 0 && (
        <p className="text-sm italic text-muet">
          Tous les points ont été retirés. C’est permis : l’élève ne verra plus rien de la machine.
        </p>
      )}
      <button type="submit" disabled={enCours}
        className="rounded bg-bouton px-3 py-1 text-sm text-parchemin disabled:opacity-40">
        {enCours ? '…' : 'Enregistrer le retour'}
      </button>
      {etat && <p className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
    </form>
  )
}

function CommentaireEtMessage({ copie }: { copie: LigneCopie }) {
  const [etatC, actionC, enCoursC] = useActionState(actionCommentaireGeneral, null as Reponse | null)
  const [etatM, actionM, enCoursM] = useActionState(actionMessageReporte, null as Reponse | null)
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      {/* ÉTAPE 15 — le commentaire général, APRÈS lecture. AUCUNE NOTE. */}
      <form action={actionC}>
        <input type="hidden" name="depot_id" value={copie.depotId} />
        <label className="block text-xs uppercase tracking-wide text-muet-clair">
          Commentaire général
        </label>
        <textarea name="commentaire" defaultValue={copie.commentaire ?? ''} rows={3}
          className="mt-1 w-full rounded border border-bordure-bouton bg-parchemin p-2 text-sm text-encre" />
        <button type="submit" disabled={enCoursC}
          className="mt-1 rounded border border-bordure-bouton px-3 py-1 text-xs text-encre-douce">
          {enCoursC ? '…' : 'Enregistrer'}
        </button>
        {etatC && <p className={`text-xs ${etatC.ok ? 'text-ok' : 'text-retard'}`}>{etatC.message}</p>}
      </form>

      {/* `06-` §1, règle 3 — « exercice à refaire lisiblement » n'existe pas :
          c'est un message REPORTÉ, affiché à la passation suivante. */}
      <form action={actionM}>
        <input type="hidden" name="depot_id" value={copie.depotId} />
        <label className="block text-xs uppercase tracking-wide text-muet-clair">
          Message de lisibilité, reporté à la prochaine passation
        </label>
        <textarea name="message" defaultValue={copie.messageReporte ?? ''} rows={3}
          placeholder="La prochaine fois, il faudra faire mieux."
          className="mt-1 w-full rounded border border-bordure-bouton bg-parchemin p-2 text-sm text-encre" />
        <button type="submit" disabled={enCoursM}
          className="mt-1 rounded border border-bordure-bouton px-3 py-1 text-xs text-encre-douce">
          {enCoursM ? '…' : 'Reporter'}
        </button>
        {etatM && <p className={`text-xs ${etatM.ok ? 'text-ok' : 'text-retard'}`}>{etatM.message}</p>}
      </form>
    </div>
  )
}

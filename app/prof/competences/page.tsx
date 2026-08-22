// ============================================================================
// C4 · L8 — LE LIEU OÙ VIVENT LES COMPÉTENCES, dans le module PILOTAGE.
// ----------------------------------------------------------------------------
// « Le professeur y DÉPOSE SES FICHES, il y LIT CE QU'ELLES PORTENT, et il y
//   DÉCLARE LE STATUT DE RECETTE de chacune, parmi les trois (`03-` §9) — et
//   celui du MONITORING, sur sa propre ligne, avec un avertissement avant de le
//   valider `evaluee` (§1.4). Une compétence déclarée `evaluee` l'est POUR
//   TOUTES LES CLASSES ; le profil de chaque classe, au tableau de pilotage,
//   porte l'OPT-OUT (§1.3). » — `07-Implementation.md` §2, C4-L8
//
// « L'écran vit dans le module Pilotage » (piège 7).
//
// ⚠️ CE QUE CET ÉCRAN NE FAIT PAS, et c'est écrit pour qu'on ne le cherche pas :
//   · il n'affiche AUCUNE des trois conditions de banc — quinze copies, 80 % à
//     ±1 palier, golds écrits avant. « Elles ne sont gardées par aucun
//     mécanisme : c'est le professeur qui les vérifie avant de poser `evaluee` »
//     (`03-` §9). L'écran ne les contrôle pas, ne les devine pas, et NE LES
//     AFFICHE PAS DEPUIS UNE VALEUR INVENTÉE (piège 6) ;
//   · il ne montre de la fiche QUE CE QU'ELLE PORTE — sa version, son statut, sa
//     correspondance (piège 8). La FICHE DITE À L'ÉLÈVE (`06-` §5) n'est pas cet
//     écran ;
//   · il ne met rien derrière les trois interrupteurs du `07-` §1.5 : ils
//     commandent les élèves, le routeur et l'affichage, et « aucun ne nomme le
//     professeur qui prépare » (piège 41).
// ============================================================================

import { lire, incidentsDe } from '@/utils/fabrique/lecture'
import { garderProf, lireLesTroisInterrupteurs } from '@/utils/fabrique/acces'
import { COMPETENCES_FICHE } from '@/utils/fabrique/fiche-competence'
import { formatJour } from '@/utils/fuseau'
import DepotFiche from './DepotFiche'
import LigneCompetence from './LigneCompetence'
import OptOutClasses from './OptOutClasses'

export const dynamic = 'force-dynamic'

/** Une ligne rendue par Supabase — le client ne connaît pas le schéma. */
type Ligne = Record<string, unknown>

/** Les six du `07-` §1.2, dans l'ordre du référentiel, puis le Monitoring. */
const LES_SIX = COMPETENCES_FICHE.filter((c) => c !== 'monitoring')

const NOM: Record<string, string> = {
  expression: 'Expression', argumentation: 'Argumentation', structure: 'Structure',
  connaissance: 'Connaissance', synthese: 'Synthèse', questionnement: 'Questionnement',
  monitoring: 'Monitoring',
}

export default async function LieuDesCompetences() {
  const { admin, actif } = await garderProf()
  const troisOff = await lireLesTroisInterrupteurs(admin)

  // ⚠️ UNE LECTURE RATÉE N'EST PAS UNE BASE VIDE : chaque requête rend son
  //   incident, et l'écran le montre plutôt que d'afficher « aucune fiche ».
  const [lFiches, lCorr, lNiveaux, lMonitoring, lClasses, lActives] = await Promise.all([
    lire<Ligne>('les fiches déposées', admin.from('competences_fiches').select('*')),
    lire<Ligne>('la correspondance',
      admin.from('competences_correspondance').select('competence, observable_code, fiche_version')),
    lire<Ligne>('les statuts de recette',
      admin.from('competences_niveaux').select('competence, statut_recette, statut_recette_pose_le')),
    lire<Ligne>('le Monitoring',
      admin.from('monitoring_niveaux').select('sous_dimension, statut_recette')),
    lire<Ligne>('les classes', admin.from('classes').select('id, nom, niveau, filiere').order('nom')),
    lire<Ligne>('l’activation par classe',
      admin.from('competences_actives_par_classe').select('classe_id, competence, active')),
  ])
  const incidents = incidentsDe(lFiches, lCorr, lNiveaux, lMonitoring, lClasses, lActives)
  const fiches = lFiches.lignes
  const corr = lCorr.lignes
  const niveaux = lNiveaux.lignes
  const monitoring = lMonitoring.lignes
  const classes = lClasses.lignes
  const actives = lActives.lignes

  const parFiche = new Map((fiches ?? []).map((f) => [f.competence as string, f]))
  const nbCorr = new Map<string, number>()
  const versionCorr = new Map<string, string>()
  for (const c of corr ?? []) {
    nbCorr.set(c.competence as string, (nbCorr.get(c.competence as string) ?? 0) + 1)
    versionCorr.set(c.competence as string, c.fiche_version as string)
  }

  // Le statut vit PAR ÉLÈVE (§1.3) et « aucune liste de compétences n'est tenue
  // ici » : on le LIT sur les lignes, on ne le stocke pas une seconde fois.
  // Un désaccord entre lignes se voit plutôt qu'il ne se masque.
  const etat = new Map<string, { statuts: Set<string>; date: string | null; lignes: number }>()
  for (const n of niveaux ?? []) {
    const e = etat.get(n.competence as string)
      ?? { statuts: new Set<string>(), date: null as string | null, lignes: 0 }
    e.statuts.add(n.statut_recette as string)
    e.lignes += 1
    const d = n.statut_recette_pose_le as string | null
    if (d && (!e.date || d > e.date)) e.date = d
    etat.set(n.competence as string, e)
  }
  const etatMonitoring = {
    statuts: new Set((monitoring ?? []).map((m) => m.statut_recette as string)),
    lignes: (monitoring ?? []).length,
  }

  const optOut = new Map<string, boolean>()
  for (const a of actives ?? []) {
    optOut.set(`${a.classe_id}|${a.competence}`, a.active as boolean)
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
          Pilotage · La fabrique
        </p>
        <h1 className="font-titre text-2xl text-encre">Le lieu où vivent les compétences</h1>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          Le professeur y dépose ses fiches, il y lit ce qu&apos;elles portent, et il y déclare
          le statut de recette de chacune. <strong>C&apos;est le seul endroit d&apos;où un statut
          se pose</strong> — sans lui il se poserait en base, à la main, sans que rien ne le relise.
        </p>
      </header>

      {incidents.length > 0 && (
        <div className="rounded-lg border border-retard bg-retard-teinte px-3 py-2 space-y-1">
          <p className="font-ui text-sm text-encre">
            <strong>Des lectures ont échoué.</strong> Ce que cet écran ne montre pas n’est
            peut-être pas absent : il n’a pas pu être lu.
          </p>
          {incidents.map((x, i) => (
            <p key={i} className="font-ui text-xs text-encre-douce">· {x}</p>
          ))}
        </div>
      )}

      {!actif && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          L&apos;interrupteur <code>fabrique_actif</code>{' '}est à OFF : cet écran est visible pour la
          recette, et rien de ce qu&apos;il pose n&apos;est encore servi à un élève.
          {' '}Les trois interrupteurs du moteur restent à OFF eux aussi
          {' '}(exercices&nbsp;: {troisOff.exercices ? 'ON' : 'OFF'} ·
          {' '}routeur&nbsp;: {troisOff.routeur ? 'ON' : 'OFF'} ·
          {' '}affichage&nbsp;: {troisOff.affichage ? 'ON' : 'OFF'}).
        </p>
      )}

      {/* ── 1. Le dépôt d'une fiche ────────────────────────────────────────── */}
      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">Déposer une fiche</h2>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          Un fichier markdown. La compétence se reconnaît au titre et au nom du fichier ;
          la version et le statut se lisent en tête ; et la section
          {' '}« <em>La correspondance observable → formulation</em> » est versée dans le même
          geste — <strong>rien de cette table ne s&apos;écrit à la main, et aucun écran
          n&apos;invente une question</strong>.
        </p>
        <DepotFiche />
      </section>

      {/* ── 2. Ce que les fiches portent, et le statut ─────────────────────── */}
      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">Les six compétences</h2>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          Une compétence naît <code>mesuree_silencieusement</code> ; <strong><code>evaluee</code>
          {' '}est un acte explicite</strong>. Deux planchers sont mécaniques — fiche non déposée
          {' '}→ <code>differee</code>, correspondance absente → pas déclarable <code>evaluee</code>.
          {' '}<strong>Les trois conditions de banc</strong> — quinze copies, 80&nbsp;% à ±1 palier,
          golds écrits avant — <strong>ne sont gardées par aucun mécanisme : c&apos;est vous qui
          les vérifiez avant de poser <code>evaluee</code>.</strong>
        </p>
        <ul className="divide-y divide-bordure">
          {LES_SIX.map((c) => {
            const f = parFiche.get(c)
            const e = etat.get(c)
            return (
              <LigneCompetence
                key={c}
                competence={c}
                nom={NOM[c]}
                fiche={f ? {
                  version: f.version as string,
                  statut: f.statut as string,
                  nomFichier: f.nom_fichier as string,
                  deposeeLe: formatJour(f.deposee_at as string, { day: 'numeric', month: 'short' }),
                } : null}
                blocsCorrespondance={nbCorr.get(c) ?? 0}
                versionCorrespondance={versionCorr.get(c) ?? null}
                statutCourant={e ? [...e.statuts] : []}
                lignesEleves={e?.lignes ?? 0}
                statutPoseLe={e?.date
                  ? formatJour(e.date, { day: 'numeric', month: 'short', year: 'numeric' })
                  : null}
              />
            )
          })}
        </ul>
      </section>

      {/* ── 3. Le Monitoring, sur sa propre ligne ──────────────────────────── */}
      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">Le Monitoring</h2>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          Sa fiche se dépose comme les autres, mais il n&apos;a <strong>ni correspondance ni
          banc</strong> : son statut vaut <strong>pour ses deux sous-dimensions à la fois</strong>.
        </p>
        <ul className="divide-y divide-bordure">
          <LigneCompetence
            competence="monitoring"
            nom="Monitoring"
            fiche={parFiche.get('monitoring') ? {
              version: parFiche.get('monitoring')!.version as string,
              statut: parFiche.get('monitoring')!.statut as string,
              nomFichier: parFiche.get('monitoring')!.nom_fichier as string,
              deposeeLe: formatJour(parFiche.get('monitoring')!.deposee_at as string,
                { day: 'numeric', month: 'short' }),
            } : null}
            blocsCorrespondance={0}
            versionCorrespondance={null}
            statutCourant={[...etatMonitoring.statuts]}
            lignesEleves={etatMonitoring.lignes}
            statutPoseLe={null}
            avertissement={
              "L'instrument n'a pas de banc avant l'année qui le sert : aucun banc ne peut le "
              + "valider avant la rentrée, et l'année 2026-27 en tient lieu d'épreuve. "
              + 'Le passer à `evaluee` engage la mesure sans recette.'}
          />
        </ul>
      </section>

      {/* ── 4. L'opt-out, au profil de la classe ───────────────────────────── */}
      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">
          L&apos;activation par classe — l&apos;opt-out
        </h2>
        <p className="font-ui text-sm text-encre-douce max-w-3xl">
          Une compétence déclarée <code>evaluee</code> <strong>l&apos;est pour toutes les
          classes</strong>, sans second geste. Ce qui se pose ici est un <strong>opt-out</strong> :
          {' '}la compétence que ce cours ne travaille pas. Le routeur lit cette table, il ne
          l&apos;écrit pas.
        </p>
        <OptOutClasses
          classes={(classes ?? []).map((c) => ({
            id: c.id as string,
            nom: [c.nom, c.niveau, c.filiere].filter(Boolean).join(' · '),
          }))}
          competences={LES_SIX.map((c) => ({ code: c, nom: NOM[c] }))}
          etat={Object.fromEntries(optOut)}
        />
      </section>
    </div>
  )
}

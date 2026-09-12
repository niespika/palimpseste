// ============================================================================
// PILOTAGE · SIGNALEMENTS · L'ÉCRAN DE L'ÉLÈVE — « voir ce que l'élève a vu, tel
// qu'il l'a vu, et modifier ce qu'il y a à modifier » (Louis, 11/09/2026).
// ----------------------------------------------------------------------------
// ⭐⭐ CE N'EST PAS UN APERÇU : c'est LE DÉROULÉ, le même composant et le même
//    chargeur que l'élève, sur SON dépôt — sa réponse, son étape, son retour.
//    L'aperçu de la fabrique « ment » (il montre l'énoncé du sujet, que l'élève
//    ne voit jamais) parce qu'il est un SECOND rendu ; ici il n'y en a qu'un.
//
// ⚠️ LECTURE SEULE : l'écran est rendu `inert`, rien ne s'ouvre ni ne se sonde
//    (`EcranDeroule`, `lectureSeule`). Et de toute façon, chaque action passe
//    par le portier ÉLÈVE, qui refuse un professeur.
//
// ⚠️ LE DÉPÔT `retire` NE SE REND PAS : `lireDepotMaison` le filtre (piège 41),
//    et on ne l'affaiblit pas. L'écran le dit, et laisse corriger quand même.
//
// ⭐ LE FORMULAIRE EST CELUI DE LA FABRIQUE (`conception/[id]/Edition`), nourri
//    par le même chargeur : un seul formulaire, deux écrans.
// ============================================================================

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/routeur/acces'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { lireLaPorte } from '@/utils/deroule/acces'
import { chargerLeDeroule } from '@/utils/deroule/vue'
import { chargerLaFileDesSignalements } from '@/utils/signalements/serveur'
import { EcranDeroule } from '@/components/deroule/EcranDeroule'
import Edition from '@/app/prof/conception/[id]/Edition'
import { chargerLEditionDeLInstance } from '@/app/prof/conception/[id]/charger-edition'
import { Commentaire } from '../PanneauExercice'

export const dynamic = 'force-dynamic'

export default async function EcranDeLEleve(
  { params }: { params: Promise<{ depotId: string }> },
) {
  const { depotId } = await params
  const { admin } = await garderProf()
  const fuseau = await lireFuseau()

  // ⭐ La file est courte par construction : on la recharge plutôt que d'écrire
  //    un second lecteur du signalement, de son élève et de sa fenêtre.
  const file = await chargerLaFileDesSignalements(admin, fuseau, new Date().toISOString())
  const ligne = file.lignes.find((l) => l.signalements.some((s) => s.depotId === depotId))
  const sig = ligne?.signalements.find((s) => s.depotId === depotId)
  if (!ligne || !sig) notFound()

  const nom = ligne.noms[sig.eleveId] ?? '—'
  const porte = await lireLaPorte(admin)
  // ⚠️ `ouvert: true` À DESSEIN : la porte `exercices_actif` commande les ÉLÈVES ;
  //    le professeur doit voir l'écran même quand le module est éteint.
  const vue = await chargerLeDeroule(admin, depotId, sig.eleveId,
    { ouvert: true, delaiVfJours: porte.delaiVfJours })
  const edition = await chargerLEditionDeLInstance(admin, ligne.identite.exerciceId)

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-2">
        <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-muet">
          <Link href="/prof/signalements" className="underline">Pilotage · Signalements</Link>
          {' '}· l’écran de l’élève
        </p>
        <h1 className="font-titre text-3xl text-encre">Ce que {nom} voit</h1>
        <p className="font-corps text-encre-douce max-w-3xl">
          Le déroulé de cet élève, tel qu’il le voit aujourd’hui — sa réponse, son étape, son
          retour. En lecture seule : rien de ce que vous touchez ici ne s’enregistre chez lui.
          {ligne.signalements.length > 1 && (
            <> {ligne.signalements.length - 1} autre(s) élève(s) ont signalé le même exercice :{' '}
              <Link href={`/prof/signalements?sel=${ligne.identite.exerciceId}`} className="underline">
                tous les commentaires
              </Link>.
            </>
          )}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-titre text-lg text-encre">Son signalement</h2>
        <Commentaire
          s={sig} nom={nom} lienEcran={false}
          fenetreDepassee={ligne.fenetres[sig.id]?.depassee ?? false}
          heuresRestantes={ligne.fenetres[sig.id]?.heuresRestantes ?? null}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-titre text-lg text-encre">Son écran <span className="font-ui text-sm font-normal text-muet">— lecture seule</span></h2>
        {vue ? (
          // ⚠️ Le déroulé porte des marges négatives pensées pour la colonne
          //    élève (`-mx-4`) ; on l'enferme dans un cadre qui les absorbe.
          <div className="rounded-2xl border-2 border-dashed border-bordure-bouton bg-parchemin p-4 sm:p-5">
            <EcranDeroule vue={vue} atelier="codex" lectureSeule />
          </div>
        ) : (
          <p className="rounded-xl border border-bordure bg-parchemin px-4 py-6 font-corps text-encre-douce">
            Ce dépôt ne se rend plus : il est <strong>retiré</strong> (par votre arbitrage, ou par
            le retrait du pool). L’élève ne le voit plus non plus. Vous pouvez tout de même
            corriger l’instance ci-dessous.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-titre text-lg text-encre">Corriger ce que l’élève lit</h2>
        {edition ? <Edition {...edition} /> : (
          <p className="font-ui text-sm text-retard">Instance introuvable.</p>
        )}
        <p className="font-ui text-xs text-muet">
          Une correction se voit chez <strong>tous</strong> les élèves de cette instance à leur
          prochaine visite. Ce qui est déjà rendu et jugé ne se rejuge pas.
        </p>
      </section>
    </div>
  )
}

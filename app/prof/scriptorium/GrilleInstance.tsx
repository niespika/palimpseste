'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ChampDate from '@/app/prof/calendrier/config/ChampDate'
import {
  marquerVu, marquerVuJusquA, deplacerElement, reordonnerElements,
  ajouterCreneauInstance, retirerCreneauInstance, reinitialiserInstance,
  planifierInstance, decalerSemaineInstance, publierHoraire, ajusterNbSemainesParcours,
  basculerSyntheseCours,
  type RefCreneau,
} from './actions'
import PickerContenu from './parcours/PickerContenu'
import ApercuBloc, { fmtJour } from './parcours/ApercuBloc'
import type { CiblesPicker } from './parcours/donnees'
import type { InstanceDeClasse, ElementInstance, SemaineInstance, SyntheseInstance } from './instance-serveur'

// GRILLE D'INSTANCE (RAG L3, SPEC §5.3) — le parcours D'UNE CLASSE. Trois choses y
// vivent, et rien de tout cela ne touche le modèle ni les autres classes :
//   · le PILOTAGE « vu » (le clic prof, à grain fin) ;
//   · la PLANIFICATION — date de début et publication de l'horaire, arrivées ici
//     depuis le panneau d'assignation du modèle : la grille datée est sous les yeux ;
//   · les DÉCALAGES — insérer une semaine d'enseignement vide avant une semaine et
//     toutes les suivantes, ce qui laisse la place à un AUTRE parcours de la classe.
//     C'est ainsi que deux parcours s'ALTERNENT au lieu de se superposer ;
//   · la SYNTHÈSE DE FIN DE COURS (01/09) — sous le dernier chapitre de chaque cours,
//     un interrupteur « ouvrir / couper ». Il a remplacé la création automatique :
//     « je veux déclencher la création des synthèses uniquement quand je veux, et pas
//     de manière automatique à la fin d'un cours » (Louis). COUPER NE DÉTRUIT RIEN —
//     la synthèse préparée passe en sourdine et revient telle quelle si on rouvre.
// Esthétique provisoire (refonte Design).

export default function GrilleInstance({ instance, cibles }: {
  instance: InstanceDeClasse
  cibles: CiblesPicker
}) {
  const router = useRouter()
  const [chargement, setChargement] = useState<string | null>(null) // id du geste en cours
  const [erreur, setErreur] = useState<string | null>(null)
  const [avis, setAvis] = useState<string | null>(null)
  const [pickerSemaine, setPickerSemaine] = useState<number | null>(null)

  const retourClasse = `/prof/scriptorium?vue=classes&classe=${instance.classeId}`
  const { planification: plan } = instance

  async function lancer(cle: string, fn: () => Promise<{ error?: string; avis?: string }>) {
    setErreur(null)
    setAvis(null)
    setChargement(cle)
    const res = await fn()
    setChargement(null)
    if (res.error) { setErreur(res.error); return }
    if (res.avis) setAvis(res.avis)
    router.refresh()
  }

  function basculerVu(el: ElementInstance) {
    void lancer(`vu-${el.id}`, () => marquerVu(el.id, el.vuAt == null))
  }

  function vuJusquA(semaine: number) {
    if (!confirm(`Marquer « vus » tous les éléments non vus jusqu'à la semaine ${semaine} incluse ?`)) return
    void lancer(`jusqua-${semaine}`, async () => {
      const res = await marquerVuJusquA(instance.pcId, semaine)
      return { error: res.error }
    })
  }

  function deplacer(el: ElementInstance, nouvelleSemaine: number) {
    void lancer(`depl-${el.id}`, () => deplacerElement(el.id, nouvelleSemaine))
  }

  // Réordonne au sein de la FRATRIE (même créneau, même semaine réelle) — l'ordre
  // est unique par (créneau, semaine), on ne permute donc qu'entre frères.
  function monterDescendre(el: ElementInstance, freres: ElementInstance[], dir: -1 | 1) {
    const idx = freres.findIndex(f => f.id === el.id)
    const cible = idx + dir
    if (idx < 0 || cible < 0 || cible >= freres.length) return
    const ids = freres.map(f => f.id)
    ;[ids[idx], ids[cible]] = [ids[cible], ids[idx]]
    void lancer(`ord-${el.id}`, () => reordonnerElements(el.creneauId, el.semaineReelle, ids))
  }

  // Ouvrir/couper la synthèse d'un cours. Couper une synthèse PRÉPARÉE se confirme :
  // le mot « couper » ne dit pas de lui-même que la préparation survit, et la question
  // est le seul endroit où on peut le promettre avant le clic.
  function basculerSynthese(sy: SyntheseInstance) {
    if (sy.ouverte && (sy.etat === 'preparee' || sy.etat === 'a_preparer')) {
      const quoi = sy.etat === 'preparee' ? 'Sa séance Codex déjà préparée' : 'Sa ligne au plan'
      if (!confirm(
        `Couper la synthèse de « ${sy.contenuTitre} » pour ${instance.classeNom} ?\n\n` +
        `${quoi} n'est PAS détruite : elle est mise en sourdine et revient telle quelle si tu rouvres le cours.`,
      )) return
    }
    void lancer(`synth-${sy.contenuId}`, async () => {
      const res = await basculerSyntheseCours(instance.pcId, sy.contenuId, !sy.ouverte || sy.etat === 'annulee')
      return { error: res.error }
    })
  }

  function retirerCreneau(el: ElementInstance) {
    const ok = confirm(
      `Retirer « ${el.creneauTitre} » de l'instance de ${instance.classeNom} ? ` +
      `Tous ses éléments (et leurs « vus ») disparaissent pour cette classe — le modèle et les autres classes ne changent pas.`,
    )
    if (!ok) return
    void lancer(`ret-${el.creneauId}`, () => retirerCreneauInstance(el.creneauId))
  }

  function reinitialiser() {
    if (!confirm(
      `Ré-initialiser l'instance depuis le modèle ? Les ajustements de cette classe ` +
      `(créneaux ajoutés ou retirés, éléments déplacés) ET tous les « vus » seront PERDUS.`,
    )) return
    if (!confirm(
      `Dernière confirmation — re-matérialiser « ${instance.parcoursTitre} » pour ${instance.classeNom} depuis le modèle. Irréversible.`,
    )) return
    void lancer('reinit', async () => {
      const res = await reinitialiserInstance(instance.pcId)
      return { error: res.error }
    })
  }

  // ── Planification ────────────────────────────────────────────────────────
  function onSubmitDate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const date = (fd.get('dateDebut') as string) || null
    void lancer('date', () => planifierInstance(instance.pcId, date))
  }

  function publier() {
    void lancer('publier', () => publierHoraire(instance.pcId))
  }

  function decaler(semaine: number, delta: 1 | -1) {
    void lancer(`dec-${semaine}`, () => decalerSemaineInstance(instance.pcId, semaine, delta))
  }

  function ajouterSemaine() {
    if (instance.nbClassesDuParcours > 1 && !confirm(
      `« ${instance.parcoursTitre} » passera à ${instance.nbSemaines + 1} semaines pour ` +
      `${instance.nbClassesDuParcours} classes (la durée vit sur le modèle, pas sur la classe). Continuer ?`,
    )) return
    void lancer('plus-semaine', async () => {
      const res = await ajusterNbSemainesParcours(instance.parcoursId, 1)
      return { error: res.error }
    })
  }

  const ajouterRef = (semaine: number) => async (ref: RefCreneau): Promise<{ error?: string }> => {
    const res = await ajouterCreneauInstance(instance.pcId, semaine, ref)
    return { error: res.error }
  }

  const badgeClasse = (b: ElementInstance['badge']) =>
    b === 'Texte' ? 'bg-ok-teinte text-ok'
      : b === 'Livre' ? 'bg-info-teinte text-info'
        : 'bg-parchemin-fonce text-encre-douce'
  const badgeLabel = (b: ElementInstance['badge']) =>
    b === 'Section' ? '§' : b === 'Livre' ? '📖' : b

  // LA LIGNE DE SYNTHÈSE, sous le dernier chapitre de son cours. Elle porte DEUX
  // informations qu'il ne faut pas confondre : l'INTENTION (ouverte/coupée, le liseré et
  // le bouton) et le FAIT (à préparer / préparée / faite / retirée, le jeton). C'est leur
  // écart qui rend la sourdine lisible — « coupée » + « en sourdine » dit à la fois que
  // rien ne s'affichera ailleurs et que rien n'a été détruit.
  function rendreSynthese(sy: SyntheseInstance) {
    const fige = sy.etat === 'lancee'
    const enSourdine = !sy.ouverte && (sy.etat === 'a_preparer' || sy.etat === 'preparee' || sy.etat === 'annulee')
    const empeche = !instance.syntheseReglable
      ? 'Migration « synthese_ouverture_par_cours.sql » pas encore jouée sur cette base.'
      : !instance.aPlanEvaluation
        ? `${instance.classeNom} n'a pas de plan d'évaluation : la synthèse n'aurait nulle part où vivre.`
        : null
    const jeton = fige ? { t: 'faite en classe', c: 'bg-parchemin-fonce text-muet' }
      : enSourdine ? { t: sy.etat === 'annulee' ? 'retirée, en sourdine' : 'en sourdine', c: 'bg-parchemin-fonce text-muet' }
        : !sy.ouverte ? null
          : sy.etat === 'preparee' ? { t: 'préparée', c: 'bg-ok-teinte text-ok' }
            : sy.etat === 'annulee' ? { t: 'retirée du plan', c: 'bg-retard-teinte text-retard' }
              : { t: 'à préparer', c: 'bg-attention-teinte text-attention' }
    // ⚠️ LA LARGEUR PLANCHER DU TITRE EST CE QUI FAIT LE REPLI, et elle est MESURÉE.
    // Mesuré en prod le 01/09 : un titre de cours fait 31 et 34 caractères, et la ligne
    // « fin de « Nommer: Esprit, langage et réalité » » demande 237 px. À 375 px, les
    // parties fixes (jeton d'état + date + bouton) en laissent 297 en tout.
    // ⛔ Première version, `flex-1 min-w-0` : le titre se laissait écraser à **12 px** —
    //    rien ne débordait, `tsc` et 2075 tests étaient verts, et la ligne était
    //    ILLISIBLE au téléphone. `flex-wrap` ne replie rien tant qu'un enfant accepte de
    //    rétrécir : c'est le `min-w-[12rem]` qui force le jeton et la date à la ligne
    //    suivante, et rend au titre ses 237 px entiers.
    // ⭐ Et le RETRAIT lui-même est conditionnel (`ml-2 sm:ml-6`) : les 24 px d'indentation
    //    qui rendent la ligne « fille » du cours sur un écran large valaient, au
    //    téléphone, trois caractères du titre. Le retrait de 8 px suffit à la même
    //    lecture là où la place manque.
    // (Mesuré à nouveau après correction : 375 → 2 lignes et titre ENTIER ; 768 et 1280 →
    //  une seule ligne, aucun rognage.)
    return (
      <li
        key={`synth-${sy.contenuId}`}
        className={`ml-2 sm:ml-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded border-l-2 pl-2 pr-1.5 py-1 ${
          sy.ouverte ? 'border-famille-eval' : 'border-bordure'}`}
      >
        <span
          className={`font-ui text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
            sy.ouverte ? 'bg-famille-eval/15 text-famille-eval' : 'bg-parchemin-fonce text-muet'}`}
        >
          Synthèse
        </span>
        <span className={`font-corps text-sm flex-1 min-w-[12rem] truncate ${sy.ouverte ? 'text-encre-douce' : 'text-muet'}`}>
          fin de « {sy.contenuTitre} »
        </span>
        {jeton && (
          <span className={`font-ui text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${jeton.c}`}>{jeton.t}</span>
        )}
        {sy.date && (
          <span
            className="font-ui text-xs text-muet flex-shrink-0"
            title={sy.ouverte ? undefined : 'Date qu’aurait cette synthèse si tu ouvrais le cours'}
          >
            {sy.ouverte ? 'pour le ' : ''}{fmtJour(sy.date)}
          </span>
        )}
        {fige ? (
          <span className="font-ui text-xs text-muet-clair flex-shrink-0">lancée — ne se coupe plus</span>
        ) : (
          <button
            onClick={() => basculerSynthese(sy)}
            disabled={occupe || empeche != null}
            title={empeche ?? (sy.ouverte
              ? 'Couper : la synthèse ne s\'affichera plus nulle part, mais rien n\'est détruit'
              : 'Ouvrir : crée la synthèse de fin de ce cours pour cette classe')}
            className={`font-ui text-xs flex-shrink-0 disabled:opacity-40 ${
              sy.ouverte && sy.etat !== 'annulee'
                ? 'text-muet hover:text-retard'
                : 'text-encre-douce hover:text-encre'}`}
          >
            {chargement === `synth-${sy.contenuId}` ? '…'
              : sy.ouverte ? (sy.etat === 'annulee' ? 'Recréer' : 'Couper') : 'Ouvrir'}
          </button>
        )}
      </li>
    )
  }

  // Semaines d'enseignement laissées libres AVANT une semaine donnée (différence de
  // décalage avec la semaine précédente) — c'est la place qu'un autre parcours occupe.
  const libresAvant = (sem: SemaineInstance, i: number) =>
    i === 0 ? 0 : sem.decalage - instance.semaines[i - 1].decalage

  const occupe = chargement != null

  return (
    <div className="space-y-4" data-module="scriptorium">
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link href={retourClasse} className="text-sm text-muet hover:text-encre">← {instance.classeNom}</Link>
          <h2 className="font-titre text-lg text-encre leading-tight">
            Parcours de la classe — {instance.parcoursTitre}
          </h2>
          <p className="font-ui text-xs text-muet">
            La date, les décalages et le « vu » ne valent que pour {instance.classeNom}.
          </p>
        </div>
        {/* `flex-wrap`, pas `flex-shrink-0` : à 375 px cette rangée débordait la page
            de 22 px (mesuré). Elle se replie plutôt que de pousser un ascenseur
            horizontal sur tout l'écran. */}
        <div className="flex items-center gap-3 flex-wrap font-ui text-xs">
          {instance.semaineCourante != null && instance.semaineCourante > 0 && (
            <span className="text-muet">semaine courante : <b className="text-encre-douce">{instance.semaineCourante}</b>/{instance.nbSemaines}</span>
          )}
          {instance.nonVusPasses > 0 && (
            <span className="bg-attention-teinte text-attention px-2 py-0.5 rounded">
              {instance.nonVusPasses} élément{instance.nonVusPasses > 1 ? 's' : ''} passé{instance.nonVusPasses > 1 ? 's' : ''} non vu{instance.nonVusPasses > 1 ? 's' : ''}
            </span>
          )}
          <Link href={`/prof/scriptorium?vue=parcours&parcours=${instance.parcoursId}`} className="text-muet hover:text-encre">
            Modèle (tous groupes) →
          </Link>
          <button
            onClick={reinitialiser}
            disabled={occupe}
            className="text-muet hover:text-retard disabled:opacity-50"
            title="Re-matérialiser l'instance depuis le modèle (destructif, double confirmation)"
          >
            Réinitialiser depuis le modèle
          </button>
        </div>
      </div>

      {/* ── Planification : la date vit ICI (elle a quitté le modèle) ────── */}
      <div className={`rounded-lg border p-3 space-y-2 ${plan.dateDebut ? 'border-bordure bg-surface' : 'border-attention/40 bg-attention-teinte/30'}`}>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Calendrier de la classe</span>
          {!plan.dateDebut && (
            <span className="font-corps text-xs text-attention">
              Sans date : la semaine courante est indéterminée et l’instance est <b>exclue du RAG</b>.
            </span>
          )}
        </div>

        <form onSubmit={onSubmitDate} className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[190px]">
            <label className="block font-ui text-[12px] text-muet mb-1">Début pour {instance.classeNom}</label>
            <ChampDate name="dateDebut" defaultValue={plan.dateDebut ?? ''} ariaLabel={`Date de début du parcours pour ${instance.classeNom}`} />
          </div>
          <button
            type="submit"
            disabled={occupe}
            className="font-ui text-[12px] font-semibold bg-bouton-parcours text-bouton-parcours-texte px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {chargement === 'date' ? '…' : plan.dateDebut ? 'Re-planifier' : 'Planifier'}
          </button>
          {plan.apercu && (
            <button
              type="button"
              onClick={publier}
              disabled={occupe}
              className="font-ui text-[12px] font-semibold bg-bouton-parcours text-bouton-parcours-texte px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {chargement === 'publier' ? '…' : plan.snapshot ? 'Re-publier l’horaire' : 'Publier l’horaire'}
            </button>
          )}
        </form>

        {plan.apercu && plan.snapshot && (
          <div className="space-y-1">
            <p className="text-xs text-muet">
              Horaire publié{plan.snapshot.genereLe ? ` le ${fmtJour(plan.snapshot.genereLe.slice(0, 10))}` : ''} (v{plan.snapshot.version}).
            </p>
            {plan.diff && plan.diff.nbChanges > 0 ? (
              <p className="text-xs bg-attention-teinte text-attention px-2 py-1 rounded">
                ⚠ {plan.diff.nbChanges} échéance(s) ont changé depuis la publication (calendrier modifié, ou décalage posé). Re-publie pour figer le nouvel horaire.
              </p>
            ) : (
              <p className="text-xs text-ok">✓ Horaire à jour.</p>
            )}
          </div>
        )}

        {plan.apercu && <ApercuBloc apercu={plan.apercu} />}
      </div>

      {erreur && <p className="text-retard text-sm">⚠ {erreur}</p>}
      {avis && <p className="text-attention text-sm">{avis}</p>}

      {/* ── Semaines ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {instance.semaines.map((sem, i) => {
          const enCoursSem = instance.semaineCourante != null && sem.semaine <= instance.semaineCourante
          const libres = libresAvant(sem, i)
          const synthParCreneau = new Map(sem.syntheses.map(sy => [sy.creneauId, sy]))
          const dernierIdxParCreneau = new Map<string, number>()
          sem.elements.forEach((e, idx) => dernierIdxParCreneau.set(e.creneauId, idx))
          const orphelines = sem.syntheses.filter(sy => !dernierIdxParCreneau.has(sy.creneauId))
          return (
            <div key={sem.semaine}>
              {/* Semaines d'enseignement laissées à un AUTRE parcours. */}
              {libres > 0 && (
                <p className="font-ui text-[11px] text-muet px-3 py-1">
                  ⤶ {libres} semaine{libres > 1 ? 's' : ''} d’enseignement laissée{libres > 1 ? 's' : ''} à un autre parcours
                </p>
              )}
              <div
                className={`rounded-lg border ${sem.courante ? 'border-pigment/60 bg-pigment-teinte/20' : 'border-bordure bg-surface'}`}
              >
                <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
                  <span className="font-ui text-sm font-medium text-encre">Semaine {sem.semaine}</span>
                  {sem.libelle && <span className="font-ui text-xs text-muet">— {sem.libelle}</span>}
                  {sem.lundiApresPublication && (
                    <span
                      className="font-ui text-[10px] bg-attention-teinte text-attention px-1.5 py-0.5 rounded"
                      title="La date ci-contre est celle de l'horaire PUBLIÉ, qui fait toujours foi. Re-publie pour figer la nouvelle."
                    >
                      → {fmtJour(sem.lundiApresPublication)} après re-publication
                    </span>
                  )}
                  {sem.courante && (
                    <span className="font-ui text-[10px] uppercase tracking-wide bg-pigment text-surface px-1.5 py-0.5 rounded">courante</span>
                  )}
                  {sem.occupee.map(o => (
                    <span
                      key={o.pcId}
                      className="font-ui text-[10px] bg-attention-teinte text-attention px-1.5 py-0.5 rounded"
                      title={`« ${o.parcoursTitre} » occupe aussi cette semaine d'enseignement (sa semaine ${o.semaine})`}
                    >
                      ⚠ aussi « {o.parcoursTitre} » sem. {o.semaine}
                    </span>
                  ))}
                  <span className="flex-1" />

                  {/* Décalage : le geste d'ALTERNANCE. La semaine 1 se déplace par la date. */}
                  {sem.semaine > 1 && (
                    <span className="flex items-center rounded border border-bordure overflow-hidden flex-shrink-0">
                      <button
                        onClick={() => decaler(sem.semaine, -1)}
                        disabled={occupe || !sem.peutRapprocher}
                        aria-label={`Rapprocher la semaine ${sem.semaine} d'une semaine d'enseignement`}
                        className="font-ui text-xs text-muet hover:text-encre hover:bg-parchemin-fonce disabled:opacity-30 px-1.5 py-0.5"
                        title={`Rapprocher la semaine ${sem.semaine} et les suivantes d'une semaine d'enseignement`}
                      >
                        −
                      </button>
                      <span className="font-ui text-[10px] text-muet-clair px-1 border-x border-bordure select-none">décaler</span>
                      <button
                        onClick={() => decaler(sem.semaine, 1)}
                        disabled={occupe}
                        aria-label={`Décaler la semaine ${sem.semaine} d'une semaine d'enseignement`}
                        className="font-ui text-xs text-muet hover:text-encre hover:bg-parchemin-fonce disabled:opacity-30 px-1.5 py-0.5"
                        title={`Décaler la semaine ${sem.semaine} et les suivantes d'une semaine d'enseignement (laisse la place à un autre parcours)`}
                      >
                        +
                      </button>
                    </span>
                  )}

                  {sem.elements.some(e => e.vuAt == null) && enCoursSem && (
                    <button
                      onClick={() => vuJusquA(sem.semaine)}
                      disabled={occupe}
                      className="font-ui text-xs text-encre-douce hover:text-encre disabled:opacity-50"
                      title={`Marquer vus tous les éléments jusqu'à la semaine ${sem.semaine} incluse`}
                    >
                      ✓ vu jusqu’ici
                    </button>
                  )}
                  <button
                    onClick={() => setPickerSemaine(pickerSemaine === sem.semaine ? null : sem.semaine)}
                    className="font-ui text-xs text-encre-douce hover:text-encre"
                  >
                    {pickerSemaine === sem.semaine ? 'Fermer' : '+ Ajouter'}
                  </button>
                </div>

                {pickerSemaine === sem.semaine && (
                  <div className="px-3 pb-3">
                    <PickerContenu
                      parcoursId={instance.parcoursId}
                      semaine={sem.semaine}
                      cibles={cibles}
                      onClose={() => setPickerSemaine(null)}
                      onAjouter={ajouterRef(sem.semaine)}
                    />
                  </div>
                )}

                {(sem.elements.length > 0 || sem.syntheses.length > 0) && (
                  <ul className="px-3 pb-2 space-y-1">
                    {sem.elements.map((el, idxEl) => {
                      const freres = sem.elements.filter(f => f.creneauId === el.creneauId && f.semaineReelle === el.semaineReelle)
                      const idxFrere = freres.findIndex(f => f.id === el.id)
                      const enCours = enCoursSem && el.vuAt == null
                      // « Juste à côté du dernier chapitre d'un cours » : la synthèse se
                      // pose sous le DERNIER élément affiché de son créneau porteur dans
                      // cette semaine — pas en bas du bloc, où elle perdrait son cours.
                      const suit = idxEl === dernierIdxParCreneau.get(el.creneauId)
                        ? synthParCreneau.get(el.creneauId)
                        : undefined
                      return (
                        <Fragment key={el.id}>
                        <li className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-parchemin-fonce/60">
                          <input
                            type="checkbox"
                            checked={el.vuAt != null}
                            onChange={() => basculerVu(el)}
                            disabled={occupe}
                            aria-label={`Marquer « ${el.titre} » comme vu`}
                            className="w-4 h-4 accent-pigment flex-shrink-0 cursor-pointer disabled:opacity-50"
                          />
                          <span className={`font-ui text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${badgeClasse(el.badge)}`}>
                            {badgeLabel(el.badge)}
                          </span>
                          <span className={`font-corps text-sm min-w-0 truncate ${el.vuAt != null ? 'text-encre' : 'text-encre-douce'}`}>
                            {el.titre}
                          </span>
                          {enCours && (
                            <span className="font-ui text-[10px] bg-attention-teinte text-attention px-1.5 py-0.5 rounded flex-shrink-0">en cours</span>
                          )}
                          {el.aRevoir && (
                            <span className="font-ui text-[10px] bg-retard-teinte text-retard px-1.5 py-0.5 rounded flex-shrink-0">à revoir</span>
                          )}
                          <span className="flex-1" />
                          {freres.length > 1 && (
                            <span className="flex gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => monterDescendre(el, freres, -1)}
                                disabled={occupe || idxFrere <= 0}
                                className="font-ui text-xs text-muet hover:text-encre disabled:opacity-30 px-0.5"
                                aria-label="Monter"
                              >↑</button>
                              <button
                                onClick={() => monterDescendre(el, freres, 1)}
                                disabled={occupe || idxFrere >= freres.length - 1}
                                className="font-ui text-xs text-muet hover:text-encre disabled:opacity-30 px-0.5"
                                aria-label="Descendre"
                              >↓</button>
                            </span>
                          )}
                          <select
                            value={el.semaineReelle}
                            onChange={e => deplacer(el, Number(e.target.value))}
                            disabled={occupe}
                            aria-label="Déplacer vers la semaine"
                            className="font-ui text-xs border border-bordure rounded px-1 py-0.5 bg-surface text-encre-douce flex-shrink-0 disabled:opacity-50"
                          >
                            {Array.from({ length: instance.nbSemaines }, (_, i2) => i2 + 1).map(k => (
                              <option key={k} value={k}>sem. {k}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => retirerCreneau(el)}
                            disabled={occupe}
                            className="font-ui text-xs text-muet hover:text-retard disabled:opacity-50 flex-shrink-0"
                            title={`Retirer « ${el.creneauTitre} » (le créneau entier) de l'instance`}
                          >
                            ✕
                          </button>
                        </li>
                        {suit && rendreSynthese(suit)}
                        </Fragment>
                      )
                    })}
                    {/* Un cours dont le créneau porteur n'a aucun élément affiché cette
                        semaine (chapitres tous déplacés ailleurs) : sa synthèse se range
                        en fin de bloc plutôt que de disparaître. */}
                    {orphelines.map(rendreSynthese)}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Allonger le parcours ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap border-t border-bordure pt-3">
        <button
          onClick={ajouterSemaine}
          disabled={occupe || instance.nbSemaines >= 52}
          className="font-ui text-[12px] font-semibold bg-bouton-parcours text-bouton-parcours-texte px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {chargement === 'plus-semaine' ? '…' : '＋ Ajouter une semaine'}
        </button>
        <span className="font-ui text-xs text-muet">
          {instance.nbClassesDuParcours > 1
            ? <>La durée vit sur le modèle : le parcours passera à {instance.nbSemaines + 1} semaines pour ses {instance.nbClassesDuParcours} classes.</>
            : <>Le parcours passera à {instance.nbSemaines + 1} semaines. Pour seulement <i>prendre son temps</i> sur une semaine, décale la suivante d’un cran (+) plutôt que d’en ajouter une.</>}
        </span>
      </div>
    </div>
  )
}

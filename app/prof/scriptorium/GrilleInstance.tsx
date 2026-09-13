'use client'

import { Fragment, useMemo, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ChampDate from '@/app/prof/calendrier/config/ChampDate'
import {
  marquerVu, marquerVuJusquA, deplacerElement, reordonnerElements,
  ajouterCreneauInstance, retirerCreneauInstance, reinitialiserInstance,
  planifierInstance, decalerSemaineInstance, publierHoraire, ajusterNbSemainesParcours,
  basculerSyntheseCours, recupererCreneauxModele, reordonnerCreneauxInstance, reglerSuiviModele,
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
//     la synthèse préparée passe en sourdine et revient telle quelle si on rouvre ;
//   · la REPRISE DU MODÈLE (02/09) — depuis que le modèle suit ses classes, ce que le
//     prof y ajoute arrive ici de lui-même ; le panneau « le modèle a N contenus que
//     cette classe n'a pas » ne liste plus que les ajouts d'AVANT (et ce que la classe a
//     retiré elle-même), à reprendre d'un clic. « Je sais combien de temps vont durer
//     mes cours, mais le contenu exact, je ne sais pas » (Louis, 01/09) ;
//   · les trois compléments du 02/09 soir — l'ORDRE PROPRE des créneaux d'une semaine
//     (⇈ ⇊ sur le premier élément de chaque créneau ; le modèle respecte ensuite cet
//     ordre), le jeton « plus au modèle » sur une copie conservée après un retrait du
//     modèle, et l'INTERRUPTEUR « ne plus suivre le modèle » (rien n'arrive ni ne part
//     de lui-même ; la reprise reste le chemin manuel).
// Esthétique provisoire (refonte Design).

// Le stockage des plis, par navigateur. Un mini-magasin : lecture, écriture, abonnés
// (useSyncExternalStore veut une source externe qui prévient quand elle change).
// ⭐ La MÉMOIRE fait foi, le stockage n'est que la persistance : si `setItem` échoue
// (quota, navigation privée stricte), les plis marchent quand même — sans cela le
// triangle devenait inerte sans message (revue adversariale du 13/09).
const abonnesPlis = new Set<() => void>()
const memoirePlis = new Map<string, string>()
function abonnerPlis(f: () => void) {
  abonnesPlis.add(f)
  const surStorage = (e: StorageEvent) => { if (e.key && e.key.startsWith('palimpseste.scriptorium.plis.')) { memoirePlis.delete(e.key); f() } }
  window.addEventListener('storage', surStorage)
  return () => { abonnesPlis.delete(f); window.removeEventListener('storage', surStorage) }
}
function lirePlis(cle: string): string | null {
  const m = memoirePlis.get(cle)
  if (m !== undefined) return m
  try { return window.localStorage.getItem(cle) } catch { return null }
}
function ecrirePlis(cle: string, val: string) {
  memoirePlis.set(cle, val)
  try { window.localStorage.setItem(cle, val) } catch { /* pas de persistance : la mémoire suffit pour la page */ }
  abonnesPlis.forEach(f => f())
}

// Le petit triangle des plis (hors composant : sinon il se remonte à chaque rendu).
function Tri({ ouvert }: { ouvert: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block w-0 h-0 border-y-4 border-y-transparent border-l-[5px] border-l-muet flex-shrink-0 transition-transform ${ouvert ? 'rotate-90' : ''}`}
    />
  )
}

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

  // Suivre / ne plus suivre le modèle : rien n'est détruit, et ça se défait d'un clic.
  function basculerSuivi() {
    void lancer('suivi', async () => {
      const res = await reglerSuiviModele(instance.pcId, !instance.suitModele)
      return { error: res.error }
    })
  }

  // L'ORDRE PROPRE d'une classe : permute deux créneaux qui vivent dans la même semaine
  // (tous ses éléments suivent, visibles ou déplacés ailleurs). Le modèle respectera cet
  // ordre : sa propagation ne redescend que là où la classe suivait encore.
  function monterDescendreCreneau(sem: SemaineInstance, creneauId: string, dir: -1 | 1) {
    const ids = sem.creneaux.map(c => c.id)
    const i = ids.indexOf(creneauId)
    const j = i + dir
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    void lancer(`ordc-${creneauId}`, () => reordonnerCreneauxInstance(instance.pcId, sem.semaine, ids))
  }

  // Reprendre du modèle ce que cette classe n'a pas (un créneau, ou tous).
  function reprendre(ids: string[]) {
    void lancer(ids.length === 1 ? `rep-${ids[0]}` : 'rep-tout', async () => {
      const res = await recupererCreneauxModele(instance.pcId, ids)
      return { error: res.error }
    })
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

  // ── LES PLIS (13/09) — semaine › cours › chapitre ─────────────────────────
  // Mesuré en prod le 13/09 : un cours pose jusqu'à 25 chapitres dans UNE semaine (T5,
  // S1), chacun sur sa ligne avec six commandes → la page ne tenait plus dans un écran.
  // Désormais une semaine repliée tient sur une ligne (son bilan), un cours replié sur
  // une ligne (titre, N chapitres, barre), et le chapitre ne garde que sa case « vu ».
  // Ouvert par défaut : la semaine courante, et dans elle le cours qui porte le prochain
  // chapitre non vu. L'état des plis se mémorise par NAVIGATEUR (aucune colonne SQL) ;
  // la semaine courante se rouvre toujours à l'arrivée, même si on l'avait repliée un
  // autre jour. ⚠️ Pas de <details> natif : Chrome en restaure l'état `open` au
  // rechargement et fait crier l'hydratation (cf. mémoire du 30/08) — des div + état.
  const semaineDefaut = instance.semaineCourante != null && instance.semaineCourante >= 1
    && instance.semaineCourante <= instance.nbSemaines
    ? instance.semaineCourante : 1
  const coursDefaut = (() => {
    const sem = instance.semaines.find(s => s.semaine === semaineDefaut)
    if (!sem || sem.elements.length === 0) return null
    // Un élément SEUL (texte, séance de livre) ne se plie pas : on vise le premier cours
    // à plusieurs chapitres qui a encore du non-vu, sinon le premier non-vu, sinon le premier.
    const taille = new Map<string, number>()
    for (const e of sem.elements) taille.set(e.creneauId, (taille.get(e.creneauId) ?? 0) + 1)
    const prochain = sem.elements.find(e => e.vuAt == null && (taille.get(e.creneauId) ?? 0) > 1)
      ?? sem.elements.find(e => e.vuAt == null) ?? sem.elements[0]
    return `${sem.semaine}:${prochain.creneauId}`
  })()
  const clePlis = `palimpseste.scriptorium.plis.${instance.pcId}`
  // Le stockage se LIT comme une source externe (useSyncExternalStore) : aucun setState
  // dans un effet, et le serveur rend les défauts sans divergence d'hydratation. Le jour
  // mémorisé sert de repère d'« arrivée » : un autre jour, la semaine courante se rouvre
  // avec son cours à faire ; le même jour, les plis choisis sont respectés tels quels.
  const brutPlis = useSyncExternalStore(abonnerPlis, () => lirePlis(clePlis), () => null)
  // Jour LOCAL du navigateur (fr-CA rend AAAA-MM-JJ) — pas `toISOString`, qui est UTC et
  // ferait « changer de jour » à 20 h à Montréal.
  const aujourdHui = new Date().toLocaleDateString('fr-CA')
  const plis = useMemo((): { semaines: number[]; cours: string[] } => {
    let stock: { semaines?: unknown; cours?: unknown; jour?: unknown } | null = null
    try { stock = brutPlis ? JSON.parse(brutPlis) : null } catch { stock = null }
    const semaines = new Set<number>(Array.isArray(stock?.semaines) ? (stock!.semaines as number[]).filter(n => typeof n === 'number') : [])
    const cours = new Set<string>(Array.isArray(stock?.cours) ? (stock!.cours as string[]).filter(c => typeof c === 'string') : [])
    if (!stock || stock.jour !== aujourdHui) {
      semaines.add(semaineDefaut)
      if (coursDefaut && ![...cours].some(c => c.startsWith(`${semaineDefaut}:`))) cours.add(coursDefaut)
    }
    return { semaines: [...semaines], cours: [...cours] }
  }, [brutPlis, aujourdHui, semaineDefaut, coursDefaut])
  const semainesOuvertes = plis.semaines
  const coursOuverts = plis.cours
  function ecrire(semaines: number[], cours: string[]) {
    ecrirePlis(clePlis, JSON.stringify({ semaines, cours, jour: aujourdHui }))
  }
  const setSemainesOuvertes = (f: (prev: number[]) => number[]) => ecrire(f(semainesOuvertes), coursOuverts)
  const setCoursOuverts = (f: (prev: string[]) => string[]) => ecrire(semainesOuvertes, f(coursOuverts))
  const [tiroirCalendrier, setTiroirCalendrier] = useState(!plan.dateDebut)
  const [tiroirModele, setTiroirModele] = useState(false)

  const semaineOuverte = (n: number) => semainesOuvertes.includes(n)
  const coursOuvert = (sem: number, creneauId: string) => coursOuverts.includes(`${sem}:${creneauId}`)
  function basculerSemaine(n: number) {
    setSemainesOuvertes(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }
  function basculerCours(sem: number, creneauId: string) {
    const k = `${sem}:${creneauId}`
    setCoursOuverts(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }
  // Depuis le rail : ouvrir la semaine et y aller.
  function allerSemaine(n: number) {
    setSemainesOuvertes(prev => prev.includes(n) ? prev : [...prev, n])
    requestAnimationFrame(() => document.getElementById(`semaine-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // « ✓ tout vu » sur un cours : marque un à un les chapitres non vus du bloc.
  function toutVu(creneauId: string, els: ElementInstance[]) {
    const aFaire = els.filter(e => e.vuAt == null)
    if (aFaire.length === 0) return
    void lancer(`tout-${creneauId}`, async () => {
      // Séquentiel (pas d'action groupée côté serveur). Si le k-ième échoue, les k−1
      // premiers SONT vus en base : on rafraîchit quand même pour que l'écran le montre.
      for (const e of aFaire) {
        const r = await marquerVu(e.id, true)
        if (r.error) { router.refresh(); return { error: `${r.error} (les chapitres déjà marqués le restent).` } }
      }
      return {}
    })
  }

  // Ligne d'état du tiroir Calendrier — ce que la maquette appelle « repli sur une ligne ».
  const etatCalendrier = !plan.dateDebut
    ? 'sans date'
    : `début ${fmtJour(plan.dateDebut)} · ${plan.snapshot ? `publié v${plan.snapshot.version}` : 'horaire non publié'}${
      plan.snapshot ? (plan.diff && plan.diff.nbChanges > 0 ? ` · ${plan.diff.nbChanges} changement${plan.diff.nbChanges > 1 ? 's' : ''}` : ' · à jour') : ''}`
  const nbAbsents = instance.absentsDuModele.length
  const etatModele = `${instance.suitModele ? 'suivi' : 'détaché'} · ${nbAbsents === 0 ? 'rien à reprendre' : `${nbAbsents} à reprendre`}`

  // ── Les deux tiroirs (rendus UNE fois ; à gauche sur grand écran, en pied au téléphone)
  const tiroirs = (
    <div className="space-y-2">
      <div className="rounded-lg border border-bordure bg-surface">
        <button
          type="button"
          onClick={() => setTiroirCalendrier(o => !o)}
          aria-expanded={tiroirCalendrier}
          className="w-full flex items-center gap-2 px-3 py-2 text-left"
        >
          <Tri ouvert={tiroirCalendrier} />
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Calendrier</span>
          <span className={`font-ui text-xs min-w-0 truncate ${plan.dateDebut ? 'text-muet' : 'text-attention font-semibold'}`}>· {etatCalendrier}</span>
        </button>
        {tiroirCalendrier && (
          <div className={`px-3 pb-3 space-y-2 ${plan.dateDebut ? '' : 'bg-attention-teinte/30'}`}>
            {!plan.dateDebut && (
              <p className="font-corps text-xs text-attention">
                Sans date : la semaine courante est indéterminée et l’instance est <b>exclue du RAG</b>.
              </p>
            )}
            <form onSubmit={onSubmitDate} className="flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-[150px]">
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
        )}
      </div>

      <div className="rounded-lg border border-bordure bg-surface">
        <button
          type="button"
          onClick={() => setTiroirModele(o => !o)}
          aria-expanded={tiroirModele}
          className="w-full flex items-center gap-2 px-3 py-2 text-left"
        >
          <Tri ouvert={tiroirModele} />
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Modèle</span>
          <span className={`font-ui text-xs min-w-0 truncate ${nbAbsents > 0 ? 'text-attention font-semibold' : 'text-muet'}`}>· {etatModele}</span>
        </button>
        {tiroirModele && (
          <div className="px-3 pb-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="font-ui text-xs text-muet">
                {instance.suitModele ? 'Cette classe suit le modèle.' : `${instance.classeNom} ne suit plus le modèle.`}
              </span>
              <button
                onClick={basculerSuivi}
                disabled={occupe || !instance.suiviReglable}
                className="font-ui text-[12px] font-semibold text-pigment hover:opacity-80 disabled:opacity-50"
                title={!instance.suiviReglable
                  ? 'Migration « parcours_suivi_du_modele.sql » pas encore jouée sur cette base.'
                  : instance.suitModele
                    ? 'Détacher cette classe du modèle : rien n\'y arrivera ni n\'en partira de lui-même. Ne détruit rien, se défait d\'un clic.'
                    : 'Rattacher cette classe au modèle : ses prochains ajouts, retraits et déplacements redescendront ici. Ce qui manque déjà se reprend ci-dessous.'}
              >
                {chargement === 'suivi' ? '…' : instance.suitModele ? 'Ne plus suivre le modèle' : 'Suivre le modèle à nouveau'}
              </button>
            </div>
            <p className="font-ui text-xs text-muet">
              {instance.suitModele
                ? <>Ce que tu ajoutes, retires, déplaces ou réordonnes dans le modèle arrive ici de lui-même — sauf ce que {instance.classeNom} a déjà vu, et sauf l’ordre qu’elle a choisi elle-même (⇈ ⇊).</>
                : <>Rien n’arrive ici ni n’en part de lui-même. Ce que le modèle a et que {instance.classeNom} n’a pas se reprend à la main, ci-dessous.</>}
            </p>
            {nbAbsents > 0 && (
              <div className="flex items-baseline justify-between gap-2 flex-wrap pt-1">
                <span className="font-ui text-[12px] font-semibold text-encre-douce">
                  Il a {nbAbsents} contenu{nbAbsents > 1 ? 's' : ''} que {instance.classeNom} n’a pas
                  {instance.suitModele ? <span className="font-normal text-muet"> — ajoutés avant qu’il suive ses classes, ou retirés de cette classe</span> : null}
                </span>
                {nbAbsents > 1 && (
                  <button
                    onClick={() => reprendre(instance.absentsDuModele.map(a => a.id))}
                    disabled={occupe}
                    className="font-ui text-[12px] font-semibold text-pigment hover:opacity-80 disabled:opacity-50"
                  >
                    {chargement === 'rep-tout' ? '…' : `Tout reprendre (${nbAbsents})`}
                  </button>
                )}
              </div>
            )}
            {nbAbsents > 0 && (
              <ul className="space-y-1">
                {instance.absentsDuModele.map(a => (
                  <li key={a.id} className="flex items-center gap-2 flex-wrap rounded px-1.5 py-1 hover:bg-parchemin-fonce/60">
                    <span className="font-ui text-[12px] font-semibold text-muet-clair w-6 flex-none">S{a.semaine}</span>
                    <span className={`font-ui text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${badgeClasse(a.badge)}`}>
                      {badgeLabel(a.badge)}
                    </span>
                    <span className="font-corps text-sm text-encre-douce flex-1 min-w-[10rem] truncate">
                      {a.titre}{a.trancheLabel ? <span className="text-muet-clair"> · {a.trancheLabel}</span> : null}
                    </span>
                    <button
                      onClick={() => reprendre([a.id])}
                      disabled={occupe}
                      className="font-ui text-xs font-semibold text-pigment hover:opacity-80 disabled:opacity-50 flex-shrink-0"
                      title={`Copier « ${a.titre} » dans le parcours de ${instance.classeNom}, en fin de semaine ${a.semaine}`}
                    >
                      {chargement === `rep-${a.id}` ? '…' : 'Reprendre ici'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="px-3 pb-2">
          <Link href={`/prof/scriptorium?vue=parcours&parcours=${instance.parcoursId}`} className="font-ui text-xs text-muet hover:text-encre">
            Modèle (tous groupes) →
          </Link>
        </div>
      </div>
    </div>
  )

  // Une ligne de chapitre : la case « vu », le titre, ses jetons — et, discrets à droite,
  // l'ordre entre frères et la semaine où il vit (déplacer un chapitre reste un geste de
  // CHAPITRE : c'est ainsi que « ch. 4–16 » sont passés en semaine 2).
  function rendreChapitre(sem: SemaineInstance, el: ElementInstance, enCoursSem: boolean) {
    const freres = sem.elements.filter(f => f.creneauId === el.creneauId && f.semaineReelle === el.semaineReelle)
    const idxFrere = freres.findIndex(f => f.id === el.id)
    const enCours = enCoursSem && el.vuAt == null
    return (
      <li key={el.id} className="flex items-center gap-2 rounded px-1.5 py-1 min-h-[44px] sm:min-h-0 hover:bg-parchemin-fonce/60">
        <input
          type="checkbox"
          checked={el.vuAt != null}
          onChange={() => basculerVu(el)}
          disabled={occupe}
          aria-label={`Marquer « ${el.titre} » comme vu`}
          className="w-5 h-5 sm:w-4 sm:h-4 accent-pigment flex-shrink-0 cursor-pointer disabled:opacity-50"
        />
        <span className={`font-corps text-sm min-w-0 truncate ${el.vuAt != null ? 'text-encre' : 'text-encre-douce'}`} title={el.titre}>
          {el.titre}
        </span>
        {enCours && (
          <span className="font-ui text-[10px] bg-attention-teinte text-attention px-1.5 py-0.5 rounded flex-shrink-0">en cours</span>
        )}
        {el.aRevoir && (
          <span className="font-ui text-[10px] bg-retard-teinte text-retard px-1.5 py-0.5 rounded flex-shrink-0">à revoir</span>
        )}
        {el.modeleRetireLe && (
          <span
            className="font-ui text-[10px] bg-parchemin-fonce text-muet px-1.5 py-0.5 rounded flex-shrink-0"
            title={`Le modèle ne porte plus « ${el.creneauTitre} » depuis le ${fmtJour(el.modeleRetireLe.slice(0, 10))} ; ${instance.classeNom} l'a gardé parce qu'elle l'avait déjà vu. Retire-le d'ici (✕) si tu ne veux plus le servir.`}
          >
            plus au modèle
          </span>
        )}
        <span className="flex-1" />
        {freres.length > 1 && (
          <span className="flex gap-0.5 flex-shrink-0">
            <button onClick={() => monterDescendre(el, freres, -1)} disabled={occupe || idxFrere <= 0}
              className="font-ui text-xs text-muet hover:text-encre disabled:opacity-30 px-2 py-2 sm:px-0.5 sm:py-0" aria-label="Monter">↑</button>
            <button onClick={() => monterDescendre(el, freres, 1)} disabled={occupe || idxFrere >= freres.length - 1}
              className="font-ui text-xs text-muet hover:text-encre disabled:opacity-30 px-2 py-2 sm:px-0.5 sm:py-0" aria-label="Descendre">↓</button>
          </span>
        )}
        <select
          value={el.semaineReelle}
          onChange={e => deplacer(el, Number(e.target.value))}
          disabled={occupe}
          aria-label="Déplacer vers la semaine"
          className="font-ui text-[11px] border border-bordure rounded px-1 py-0.5 bg-surface text-muet flex-shrink-0 disabled:opacity-50"
        >
          {Array.from({ length: instance.nbSemaines }, (_, i2) => i2 + 1).map(k => (
            <option key={k} value={k}>sem. {k}</option>
          ))}
        </select>
      </li>
    )
  }

  // Les gestes du CRÉNEAU (ordre dans la semaine, retrait) : ils vivaient sur la première
  // ligne de chapitre, ils vivent sur la ligne du cours.
  function gestesCreneau(sem: SemaineInstance, creneauId: string, creneauTitre: string, premier: ElementInstance) {
    const rangCreneau = new Map(sem.creneaux.map((c, i) => [c.id, i]))
    return (
      <>
        {sem.creneaux.length > 1 && rangCreneau.has(creneauId) && (
          <span className="flex gap-0.5 flex-shrink-0" title={`Ordre de « ${creneauTitre} » dans la semaine, pour ${instance.classeNom} seulement`}>
            <button onClick={() => monterDescendreCreneau(sem, creneauId, -1)}
              disabled={occupe || rangCreneau.get(creneauId) === 0}
              className="font-ui text-xs text-muet hover:text-encre disabled:opacity-30 px-2 py-2 sm:px-0.5 sm:py-0"
              aria-label={`Monter « ${creneauTitre} » (le créneau entier) dans la semaine`}>⇈</button>
            <button onClick={() => monterDescendreCreneau(sem, creneauId, 1)}
              disabled={occupe || rangCreneau.get(creneauId) === sem.creneaux.length - 1}
              className="font-ui text-xs text-muet hover:text-encre disabled:opacity-30 px-2 py-2 sm:px-0.5 sm:py-0"
              aria-label={`Descendre « ${creneauTitre} » (le créneau entier) dans la semaine`}>⇊</button>
          </span>
        )}
        <button
          onClick={() => retirerCreneau(premier)}
          disabled={occupe}
          className="font-ui text-xs text-muet hover:text-retard disabled:opacity-50 flex-shrink-0 px-2 py-2 sm:px-0 sm:py-0"
          title={`Retirer « ${creneauTitre} » (le créneau entier) de l'instance`}
        >
          ✕
        </button>
      </>
    )
  }

  return (
    <div className="space-y-4" data-module="scriptorium">
      {/* ── En-tête compact ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-bordure bg-surface px-3 py-2 flex items-center gap-x-3 gap-y-1 flex-wrap">
        <Link href={retourClasse} className="font-ui text-sm text-muet hover:text-encre flex-shrink-0">{instance.classeNom} ›</Link>
        <h2 className="font-titre text-lg text-encre leading-tight min-w-0" title={`La date, les décalages et le « vu » ne valent que pour ${instance.classeNom}.`}>{instance.parcoursTitre}</h2>
        <span className="font-ui text-[10px] px-1.5 py-0.5 rounded bg-parchemin-fonce text-encre-douce flex-shrink-0">{instance.nbSemaines} semaine{instance.nbSemaines > 1 ? 's' : ''}</span>
        {plan.dateDebut
          ? <span className="font-ui text-[10px] px-1.5 py-0.5 rounded bg-parchemin-fonce text-encre-douce flex-shrink-0">début {fmtJour(plan.dateDebut)}</span>
          : <span className="font-ui text-[10px] px-1.5 py-0.5 rounded bg-attention-teinte text-attention flex-shrink-0">sans date</span>}
        {plan.snapshot && (
          plan.diff && plan.diff.nbChanges > 0
            ? <span className="font-ui text-[10px] px-1.5 py-0.5 rounded bg-attention-teinte text-attention flex-shrink-0">horaire à re-publier</span>
            : <span className="font-ui text-[10px] px-1.5 py-0.5 rounded bg-ok-teinte text-ok flex-shrink-0">horaire publié</span>
        )}
        {!instance.suitModele && (
          <span className="font-ui text-[10px] px-1.5 py-0.5 rounded bg-parchemin-fonce text-muet flex-shrink-0">détaché du modèle</span>
        )}
        <span className="flex-1" />
        {instance.semaineCourante != null && instance.semaineCourante > 0 && (
          <span className="font-ui text-xs text-muet flex-shrink-0">semaine courante <b className="text-encre-douce">{instance.semaineCourante}</b>/{instance.nbSemaines}</span>
        )}
        {instance.nonVusPasses > 0 && (
          <span className="font-ui text-[10px] bg-attention-teinte text-attention px-1.5 py-0.5 rounded flex-shrink-0">
            {instance.nonVusPasses} passé{instance.nonVusPasses > 1 ? 's' : ''} non vu{instance.nonVusPasses > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {erreur && <p className="text-retard text-sm">⚠ {erreur}</p>}
      {avis && <p className="text-attention text-sm">{avis}</p>}

      {/* ── Corps : rail à gauche (grand écran), pastilles en haut (téléphone) ── */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start">

        {/* Pastilles des semaines — téléphone et tablette seulement */}
        <div className="lg:hidden -mx-1 px-1 flex gap-1.5 overflow-x-auto pb-1">
          {instance.semaines.map((sem, i) => {
            const libres = libresAvant(sem, i)
            const total = sem.elements.length
            const vus = sem.elements.filter(e => e.vuAt != null).length
            return (
              <Fragment key={sem.semaine}>
                {libres > 0 && (
                  <span className="font-ui text-[11px] text-muet-clair border border-dashed border-bordure rounded-full px-2 py-1 flex-shrink-0" title={`${libres} semaine(s) d'enseignement laissée(s) à un autre parcours`}>⤶ {libres}</span>
                )}
                <button
                  type="button"
                  onClick={() => allerSemaine(sem.semaine)}
                  className={`font-ui text-xs rounded-full px-2.5 py-1 border flex-shrink-0 ${
                    sem.courante ? 'bg-pigment text-surface border-pigment font-bold'
                      : total > 0 && vus === total ? 'border-bordure text-muet'
                        : 'border-bordure text-encre-douce'}`}
                >
                  S{sem.semaine}{total > 0 && vus === total ? ' ✓' : ''}
                </button>
              </Fragment>
            )
          })}
        </div>

        {/* Rail — grand écran ; tiroirs en pied du rail. Au téléphone, les tiroirs passent en pied de page (order). */}
        <div className="order-last lg:order-none lg:col-start-1 lg:row-start-1 space-y-3">
          <nav aria-label="Semaines" className="hidden lg:flex flex-col gap-0.5">
            {instance.semaines.map((sem, i) => {
              const libres = libresAvant(sem, i)
              const total = sem.elements.length
              const vus = sem.elements.filter(e => e.vuAt != null).length
              const passee = instance.semaineCourante != null && sem.semaine < instance.semaineCourante
              return (
                <Fragment key={sem.semaine}>
                  {libres > 0 && (
                    <span className="font-ui text-[11px] italic text-muet-clair px-2 py-1">⤶ {libres} sem. à un autre parcours</span>
                  )}
                  <button
                    type="button"
                    onClick={() => allerSemaine(sem.semaine)}
                    className={`flex items-center gap-2 rounded px-2 py-1.5 text-left font-ui text-sm ${
                      sem.courante ? 'bg-pigment-teinte font-bold text-encre' : passee ? 'text-encre-douce hover:bg-parchemin-fonce/60' : 'text-muet hover:bg-parchemin-fonce/60'}`}
                  >
                    <span className={`inline-block w-3 h-3 rounded-sm border flex-shrink-0 ${
                      total > 0 && vus === total ? 'bg-pigment border-pigment' : sem.courante ? 'border-pigment' : 'border-bordure-bouton'}`} />
                    <span className="min-w-0 truncate">S{sem.semaine}{sem.lundi ? <span className="font-normal text-muet"> · {fmtJour(sem.lundi)}</span> : null}</span>
                    <span className="flex-1" />
                    <span className="text-[11px] text-muet-clair">{total > 0 ? `${vus}/${total}` : '—'}</span>
                  </button>
                </Fragment>
              )
            })}
          </nav>
          {tiroirs}
        </div>

        {/* ── Les semaines ──────────────────────────────────────────────── */}
        <div className="lg:col-start-2 lg:row-start-1 space-y-2 min-w-0">
          {instance.semaines.map((sem, i) => {
            const enCoursSem = instance.semaineCourante != null && sem.semaine <= instance.semaineCourante
            const libres = libresAvant(sem, i)
            const ouverte = semaineOuverte(sem.semaine)
            const total = sem.elements.length
            const vus = sem.elements.filter(e => e.vuAt != null).length
            const synthParCreneau = new Map(sem.syntheses.map(sy => [sy.creneauId, sy]))
            // Les chapitres, groupés par créneau porteur dans l'ordre d'apparition.
            const groupes: { creneauId: string; titre: string; els: ElementInstance[] }[] = []
            for (const el of sem.elements) {
              const g = groupes.find(x => x.creneauId === el.creneauId)
              if (g) g.els.push(el)
              else groupes.push({ creneauId: el.creneauId, titre: el.creneauTitre, els: [el] })
            }
            const orphelines = sem.syntheses.filter(sy => !groupes.some(g => g.creneauId === sy.creneauId))
            const resume = groupes.map(g => g.titre).join(' · ')
            return (
              <div key={sem.semaine} id={`semaine-${sem.semaine}`} className="scroll-mt-24">
                {libres > 0 && (
                  <p className="font-ui text-[11px] text-muet px-3 py-1">
                    ⤶ {libres} semaine{libres > 1 ? 's' : ''} d’enseignement laissée{libres > 1 ? 's' : ''} à un autre parcours
                  </p>
                )}
                <div className={`rounded-lg border ${sem.courante ? 'border-pigment/60 bg-pigment-teinte/20' : 'border-bordure bg-surface'}`}>
                  {/* Ligne de semaine : cliquable pour plier/déplier ; les gestes restent des boutons à part. */}
                  <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => basculerSemaine(sem.semaine)}
                      aria-expanded={ouverte}
                      aria-controls={ouverte ? `semaine-${sem.semaine}-corps` : undefined}
                      className="flex items-center gap-2 min-w-0 text-left"
                    >
                      <Tri ouvert={ouverte} />
                      <span className="font-ui text-sm font-medium text-encre whitespace-nowrap">Semaine {sem.semaine}</span>
                      {sem.libelle && <span className="font-ui text-xs text-muet whitespace-nowrap">— {sem.libelle}</span>}
                    </button>
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
                    {total === 0
                      ? <span className="font-ui text-[10px] bg-parchemin-fonce text-muet px-1.5 py-0.5 rounded">vide</span>
                      : <span className={`font-ui text-[10px] px-1.5 py-0.5 rounded ${vus === total ? 'bg-ok-teinte text-ok' : enCoursSem ? 'bg-attention-teinte text-attention' : 'bg-parchemin-fonce text-muet'}`}>{vus}/{total} vu{vus > 1 ? 's' : ''}</span>}
                    {sem.occupee.map(o => (
                      <span
                        key={o.pcId}
                        className="font-ui text-[10px] bg-attention-teinte text-attention px-1.5 py-0.5 rounded"
                        title={`« ${o.parcoursTitre} » occupe aussi cette semaine d'enseignement (sa semaine ${o.semaine})`}
                      >
                        ⚠ aussi « {o.parcoursTitre} » sem. {o.semaine}
                      </span>
                    ))}
                    {!ouverte && resume && (
                      <span className="font-corps text-sm text-muet min-w-0 truncate hidden sm:inline" title={resume}>{resume}</span>
                    )}
                    <span className="flex-1" />

                    {ouverte && (
                      <>
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
                          className="font-ui text-xs font-semibold text-pigment hover:opacity-80"
                          title={`Ajouter un texte, un cours ou un livre à la semaine ${sem.semaine}, pour ${instance.classeNom} seulement`}
                        >
                          {pickerSemaine === sem.semaine ? 'Fermer' : '＋ Ajouter un contenu'}
                        </button>
                      </>
                    )}
                  </div>

                  {ouverte && (
                    <div id={`semaine-${sem.semaine}-corps`}>
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

                      {(groupes.length > 0 || orphelines.length > 0) && (
                        <div className="px-3 pb-3 space-y-2">
                          {groupes.map(g => {
                            const premier = g.els[0]
                            const nbVus = g.els.filter(e => e.vuAt != null).length
                            const synth = synthParCreneau.get(g.creneauId)
                            // UN seul élément (un texte, une séance de livre) : pas de bloc, une ligne.
                            if (g.els.length === 1) {
                              return (
                                <Fragment key={g.creneauId}>
                                  <ul className="rounded-md border border-bordure bg-surface px-1.5 py-0.5">
                                    <li className="flex items-center gap-2 rounded px-1.5 py-1 min-h-[44px] sm:min-h-0">
                                      <input
                                        type="checkbox"
                                        checked={premier.vuAt != null}
                                        onChange={() => basculerVu(premier)}
                                        disabled={occupe}
                                        aria-label={`Marquer « ${premier.titre} » comme vu`}
                                        className="w-5 h-5 sm:w-4 sm:h-4 accent-pigment flex-shrink-0 cursor-pointer disabled:opacity-50"
                                      />
                                      <span className={`font-ui text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${badgeClasse(premier.badge)}`}>{badgeLabel(premier.badge)}</span>
                                      <span className={`font-corps text-sm min-w-0 truncate ${premier.vuAt != null ? 'text-encre' : 'text-encre-douce'}`} title={premier.titre}>{premier.titre}</span>
                                      {enCoursSem && premier.vuAt == null && (
                                        <span className="font-ui text-[10px] bg-attention-teinte text-attention px-1.5 py-0.5 rounded flex-shrink-0">en cours</span>
                                      )}
                                      {premier.aRevoir && (
                                        <span className="font-ui text-[10px] bg-retard-teinte text-retard px-1.5 py-0.5 rounded flex-shrink-0">à revoir</span>
                                      )}
                                      {premier.modeleRetireLe && (
                                        <span
                                          className="font-ui text-[10px] bg-parchemin-fonce text-muet px-1.5 py-0.5 rounded flex-shrink-0"
                                          title={`Le modèle ne porte plus « ${premier.creneauTitre} » depuis le ${fmtJour(premier.modeleRetireLe.slice(0, 10))} ; ${instance.classeNom} l'a gardé parce qu'elle l'avait déjà vu. Retire-le d'ici (✕) si tu ne veux plus le servir.`}
                                        >
                                          plus au modèle
                                        </span>
                                      )}
                                      <span className="flex-1" />
                                      {gestesCreneau(sem, g.creneauId, g.titre, premier)}
                                      <select
                                        value={premier.semaineReelle}
                                        onChange={e => deplacer(premier, Number(e.target.value))}
                                        disabled={occupe}
                                        aria-label="Déplacer vers la semaine"
                                        className="font-ui text-[11px] border border-bordure rounded px-1 py-0.5 bg-surface text-muet flex-shrink-0 disabled:opacity-50"
                                      >
                                        {Array.from({ length: instance.nbSemaines }, (_, i2) => i2 + 1).map(k => (
                                          <option key={k} value={k}>sem. {k}</option>
                                        ))}
                                      </select>
                                    </li>
                                    {synth && rendreSynthese(synth)}
                                  </ul>
                                </Fragment>
                              )
                            }
                            const ouvertC = coursOuvert(sem.semaine, g.creneauId)
                            const pct = Math.round((nbVus / g.els.length) * 100)
                            return (
                              <div key={g.creneauId} className="rounded-md border border-bordure bg-surface">
                                <div className="flex items-center gap-2 px-2 py-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => basculerCours(sem.semaine, g.creneauId)}
                                    aria-expanded={ouvertC}
                                    className="flex items-center gap-x-2 gap-y-0.5 flex-wrap min-w-0 flex-1 text-left"
                                  >
                                    <Tri ouvert={ouvertC} />
                                    <span className={`font-ui text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${badgeClasse(premier.badge)}`}>{badgeLabel(premier.badge)}</span>
                                    {/* min-w : sans plancher le titre s'écrase au lieu de replier (cf. la ligne de
                                        synthèse) ; et `flex-wrap` sur le bouton : à 390 px le compteur passait
                                        SOUS « ✓ tout vu » au lieu d'aller à la ligne (mesuré 13/09). */}
                                    <span className="font-corps text-[15px] font-semibold text-encre min-w-[10rem] flex-1 truncate" title={g.titre}>{g.titre}</span>
                                    <span className="font-ui text-xs text-muet whitespace-nowrap">{g.els.length} chapitres · {nbVus} vu{nbVus > 1 ? 's' : ''}</span>
                                    <span className="hidden sm:block w-24 h-1.5 rounded-full bg-parchemin-fonce overflow-hidden flex-shrink-0" aria-hidden>
                                      <span className="block h-full bg-pigment" style={{ width: `${pct}%` }} />
                                    </span>
                                  </button>
                                  {nbVus < g.els.length && (
                                    <button
                                      onClick={() => toutVu(g.creneauId, g.els)}
                                      disabled={occupe}
                                      className="font-ui text-xs text-encre-douce hover:text-encre disabled:opacity-50 flex-shrink-0"
                                      title={`Marquer vus les ${g.els.length - nbVus} chapitres restants de « ${g.titre} »`}
                                    >
                                      {chargement === `tout-${g.creneauId}` ? '…' : '✓ tout vu'}
                                    </button>
                                  )}
                                  {gestesCreneau(sem, g.creneauId, g.titre, premier)}
                                </div>
                                {ouvertC && (
                                  <ul className="px-2 pb-1.5 grid grid-cols-1 xl:grid-cols-2 gap-x-4">
                                    {g.els.map(el => rendreChapitre(sem, el, enCoursSem))}
                                  </ul>
                                )}
                                {synth && <ul className="px-2 pb-1.5">{rendreSynthese(synth)}</ul>}
                              </div>
                            )
                          })}
                          {/* Un cours dont le créneau porteur n'a aucun élément affiché cette
                              semaine (chapitres tous déplacés ailleurs) : sa synthèse se range
                              en fin de bloc plutôt que de disparaître. */}
                          {orphelines.length > 0 && <ul className="space-y-1">{orphelines.map(rendreSynthese)}</ul>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* ── Allonger le parcours / réinitialiser ───────────────────── */}
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
            <span className="flex-1" />
            <button
              onClick={reinitialiser}
              disabled={occupe}
              className="font-ui text-xs text-muet hover:text-retard disabled:opacity-50"
              title="Re-matérialiser l'instance depuis le modèle (destructif, double confirmation)"
            >
              Réinitialiser depuis le modèle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

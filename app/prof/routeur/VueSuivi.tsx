'use client'

// ============================================================================
// L'ONGLET « ASSIGNATION », REFAIT — classes → élèves → exercices → les écrans
// de l'élève. Sans interrupteur : décision de Louis, 14/09 (« ce travail
// remplace cette page, elle fait la même chose et plus ; le retrait reste »).
// ----------------------------------------------------------------------------
// ⭐ Louis, 14/09 : « des tuiles classes ; sur chaque ligne d'élève, le nombre
//    d'exercices, le temps prévu, le temps passé, les compétences travaillées,
//    la possibilité de retirer un exercice ; la liste à gauche ; à droite deux
//    fenêtres : les exercices de l'élève cliqué, puis l'exercice tel qu'il l'a
//    vu ». Wireframe et rendu charte validés le 14/09.
//
// ⚠️ LA VITESSE EST DANS LE DÉCOUPAGE : la classe entière arrive en une charge ;
//    cliquer un élève est un état d'écran (aucun aller-retour) ; cliquer un
//    exercice charge son déroulé, et lui seul (`ecrans`, servi en Suspense).
//
// ⭐ Les mesures de prod du 14/09 commandent trois choix : le temps passé se
//    plafonne (« laissé ouvert »), la clé courte est l'OBJET (l'`id_import`
//    fait 39 caractères en médiane, il va en survol), et la liste défile.
// ============================================================================

import Link from 'next/link'
import { useActionState, useState, type ReactNode } from 'react'
import type { ChargeSuivi, EleveSuivi, ExerciceSuivi } from './suivi-serveur'
import { retirerLExercice, type Retour } from './actions'

const PASTILLE: Record<string, { fond: string; texte: string; court: string; long: string }> = {
  expression:     { fond: 'bg-comp-expression-teinte',     texte: 'text-comp-expression',     court: 'Ex', long: 'Expression' },
  argumentation:  { fond: 'bg-comp-argumentation-teinte',  texte: 'text-comp-argumentation',  court: 'Ar', long: 'Argumentation' },
  structure:      { fond: 'bg-comp-structure-teinte',      texte: 'text-comp-structure',      court: 'St', long: 'Structure' },
  connaissance:   { fond: 'bg-comp-connaissance-teinte',   texte: 'text-comp-connaissance',   court: 'Co', long: 'Connaissance' },
  synthese:       { fond: 'bg-comp-synthese-teinte',       texte: 'text-comp-synthese',       court: 'Sy', long: 'Synthèse' },
  questionnement: { fond: 'bg-comp-questionnement-teinte', texte: 'text-comp-questionnement', court: 'Qu', long: 'Questionnement' },
}
const pastille = (c: string | null) => (c && PASTILLE[c]) || { fond: 'bg-parchemin-fonce', texte: 'text-encre-douce', court: '—', long: c ?? 'sans cible' }

const LIBELLE_STATUT: Record<string, string> = {
  assigne: 'assigné', ouvert: 'ouvert', v1_remis: 'v1 remise', retour_publie: 'retour publié',
  vf_remis: 'vf remise', clos: 'clos', abandonne: 'abandonné', non_fait: 'non fait', retire: 'retiré par vous',
}

export default function VueSuivi({ charge, eleveInitial, depotId, ecrans }: {
  charge: ChargeSuivi
  eleveInitial: string | null
  depotId: string | null
  /** Les écrans de l'élève pour `depotId`, rendus par le serveur (Suspense). */
  ecrans: ReactNode
}) {
  const lien = (p: Record<string, string | null | undefined>) => {
    const q = new URLSearchParams({ vue: 'assignation', semaine: charge.cycleLundi })
    for (const [k, v] of Object.entries(p)) if (v) q.set(k, v)
    return `/prof/routeur?${q.toString()}`
  }

  return (
    // ⭐ Louis, 15/09 : « des colonnes assez larges de chaque côté, complètement
    //    perdues » — l'onglet sort du `max-w-6xl` du layout et prend la largeur de
    //    la fenêtre, à 24 px des bords, pour que les écrans de l'élève tiennent à
    //    DROITE, comme sur la maquette.
    <div className="space-y-5 xl:mx-[calc(50%-50vw+24px)] xl:w-[calc(100vw-48px)]">
      {charge.incidents.length > 0 && (
        <ul className="rounded border border-retard/40 bg-retard-teinte/40 px-4 py-3 font-ui text-sm text-encre-douce space-y-1">
          {charge.incidents.map((i) => <li key={i}>⚠ {i}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-titre text-xl text-encre">
          Semaine du {charge.cycleLundi}
          <span className="ml-3 inline-flex gap-2 font-ui text-xs">
            <Link href={lien({ classe: charge.classe?.id, semaine: decale(charge.cycleLundi, -1) })}
              className="rounded border border-bordure-bouton bg-parchemin px-2 py-1 text-encre-douce hover:bg-parchemin-fonce">← précédente</Link>
            <Link href={lien({ classe: charge.classe?.id, semaine: decale(charge.cycleLundi, 1) })}
              className="rounded border border-bordure-bouton bg-parchemin px-2 py-1 text-encre-douce hover:bg-parchemin-fonce">suivante →</Link>
          </span>
        </h2>
        {charge.classe && (
          <nav className="flex flex-wrap gap-2" aria-label="Classes">
            {charge.classes.map((c) => (
              <Link key={c.id} href={lien({ classe: c.id })} aria-current={c.id === charge.classe?.id ? 'page' : undefined}
                className={`rounded-lg px-3.5 py-1.5 font-ui text-sm ${c.id === charge.classe?.id
                  ? 'bg-bouton text-bouton-texte' : 'border border-bordure-bouton bg-surface text-encre-douce hover:bg-parchemin-fonce'}`}>
                {c.nom} <span className={c.id === charge.classe?.id ? 'opacity-75' : 'text-muet'}>{c.eleves}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>

      {!charge.classe ? (
        <Tuiles charge={charge} lien={lien} />
      ) : (
        // ⚠️ `key` : Next garde l'état entre deux URLs du même segment ; sans
        //    remontage, l'élève de la classe précédente restait choisi (audit du 14/09).
        <Classe key={charge.classe.id} classe={charge.classe} eleveInitial={eleveInitial} depotId={depotId} ecrans={ecrans} lien={lien} />
      )}
    </div>
  )
}

function Tuiles({ charge, lien }: { charge: ChargeSuivi; lien: (p: Record<string, string | null | undefined>) => string }) {
  if (!charge.classes.length) {
    return <p className="rounded border border-bordure bg-parchemin px-4 py-6 text-center font-corps text-encre-douce">Aucune classe active.</p>
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {charge.classes.map((c) => {
        // ⚠️ Le taux se prend sur les rendus JUGÉS : « sans verdict » (crans 6·8,
        //    juge absent, examens) n'est ni réussi ni raté (audit du 14/09).
        const rates = c.rendus - c.reussis - c.sansVerdict
        const juges = c.reussis + rates
        const taux = juges ? Math.round((100 * c.reussis) / juges) : null
        const pReussi = c.assignes ? (100 * c.reussis) / c.assignes : 0
        const pRate = c.assignes ? (100 * rates) / c.assignes : 0
        const pSans = c.assignes ? (100 * c.sansVerdict) / c.assignes : 0
        return (
          <Link key={c.id} href={lien({ classe: c.id })}
            className="block rounded border border-bordure bg-surface p-5 space-y-3.5 hover:border-liseret transition-colors">
            <div className="flex items-baseline justify-between">
              <h3 className="font-titre text-2xl text-encre">{c.nom}</h3>
              <span className="font-ui text-[13px] text-muet">{c.eleves} élève{c.eleves > 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 font-ui">
              <Chiffre n={c.assignes} l="assignés" />
              <Chiffre n={c.rendus} l="rendus" />
              <div>
                <div className={`text-[26px] font-bold leading-tight ${taux === null ? 'text-muet' : taux >= 60 ? 'text-ok' : 'text-attention'}`}>
                  {taux === null ? '—' : `${taux} %`}
                </div>
                <div className="text-[11px] uppercase tracking-[.06em] text-muet-clair">{taux === null ? 'trop tôt' : 'réussis / jugés'}</div>
              </div>
            </div>
            <div className="flex h-2 overflow-hidden rounded bg-parchemin-fonce">
              <div className="bg-ok" style={{ width: `${pReussi}%` }} />
              <div className="bg-retard" style={{ width: `${pRate}%` }} />
              <div className="bg-puce" style={{ width: `${pSans}%` }} />
            </div>
            <div className="flex justify-between font-ui text-xs text-muet">
              <span>réussi · raté · <span title="rendu, sans verdict dérivable : crans 6·8, juge absent, examens">sans verdict</span> · pas rendu</span>
              {c.sansExercice > 0 && <span className="text-attention">{c.sansExercice} sans exercice</span>}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function Chiffre({ n, l }: { n: number; l: string }) {
  return (
    <div>
      <div className="text-[26px] font-bold leading-tight text-encre">{n}</div>
      <div className="text-[11px] uppercase tracking-[.06em] text-muet-clair">{l}</div>
    </div>
  )
}

function Classe({ classe, eleveInitial, depotId, ecrans, lien }: {
  classe: NonNullable<ChargeSuivi['classe']>
  eleveInitial: string | null; depotId: string | null; ecrans: ReactNode
  lien: (p: Record<string, string | null | undefined>) => string
}) {
  // « Lorsque je clique sur le nom d'un élève » : rien n'est pré-choisi.
  const [eleveId, setEleveId] = useState<string | null>(eleveInitial)
  const eleve = classe.eleves.find((e) => e.id === eleveId) ?? null
  const exercice = eleve?.exercices.find((x) => x.depotId === depotId) ?? null

  return (
    <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start">
      {/* GAUCHE — la liste des élèves. ⚠️ Les noms composés ne se tronquent pas :
          ils se replient (« Arthur Chaillet--Pr… » vu en prod le 15/09). */}
      <section className="rounded border border-bordure bg-surface xl:sticky xl:top-[132px] xl:max-h-[calc(100vh-150px)] xl:overflow-y-auto">
        {/* ⛔ Une grille sans `minmax(0, …)` ni repli écrase la première colonne à
            12 px sur téléphone (mémoire `flex-wrap`/min-width) : ici les
            compétences passent SOUS la ligne au-dessous de `md`. */}
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_28px_64px_78px] md:grid-cols-[minmax(0,1fr)_28px_64px_78px_80px] items-center gap-2 border-b border-bordure bg-surface px-3 py-2.5
                        font-ui text-[11px] uppercase tracking-[.06em] text-muet-clair">
          <span>Élève</span><span className="text-right">Ex.</span><span className="text-right">Réussis / rendus</span>
          <span className="text-right">Prévu · passé</span><span className="hidden md:block">Compétences</span>
        </div>
        {classe.eleves.length === 0 && (
          <p className="px-4 py-6 text-center font-corps text-encre-douce">Aucun élève inscrit.</p>
        )}
        {classe.eleves.map((e) => <LigneEleve key={e.id} e={e} choisi={e.id === eleveId} choisir={() => setEleveId(e.id)} />)}
      </section>

      {/* DROITE — deux fenêtres : les exercices de l'élève, puis ses écrans */}
      <div className="space-y-5 min-w-0">
        <section className="rounded border border-bordure bg-surface">
          {eleve ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-bordure px-4 py-3">
                <h3 className="font-titre text-[22px] text-encre">
                  {eleve.nom}
                  <span className="ml-2 font-ui text-[13px] text-muet">
                    {eleve.assignes} exercice{eleve.assignes > 1 ? 's' : ''} · {eleve.rendus} rendu{eleve.rendus > 1 ? 's' : ''} · {eleve.reussis} réussi{eleve.reussis > 1 ? 's' : ''}
                  </span>
                </h3>
                <span className="font-ui text-xs text-muet-clair">ouvert → v1 remise = temps passé</span>
              </div>
              {eleve.exercices.length === 0 ? (
                <p className="px-4 py-6 text-center font-corps text-encre-douce">Aucun exercice cette semaine.</p>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-[104px_minmax(0,1fr)_44px_120px_90px_64px] items-center gap-2.5 border-b border-bordure px-4 py-2
                                  font-ui text-[11px] uppercase tracking-[.06em] text-muet-clair">
                    <span>Compétence</span><span>Clé</span><span>Cran</span><span>Réussite</span><span className="text-right">Prévu · réel</span><span />
                  </div>
                  <ul>
                    {eleve.exercices.map((x) => (
                      <LigneExercice key={x.depotId} x={x} choisi={x.depotId === depotId}
                        href={lien({ classe: classe.id, eleve: eleve.id, depot: x.depotId })} />
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="px-4 py-6 text-center font-corps text-encre-douce">Cliquez un élève pour voir ses exercices.</p>
          )}
        </section>


        {/* ⭐ 15/09 — les écrans reviennent SOUS les exercices, à droite (maquette),
            maintenant que l'onglet a la largeur de la fenêtre : à 1450 px la
            colonne fait ~1000 px, assez pour les deux colonnes du déroulé. Sous
            `xl`, tout s'empile. */}
        <section className="rounded border border-bordure bg-surface">
          {exercice && eleve ? (
            ecrans
          ) : (
            <p className="px-4 py-6 text-center font-corps text-encre-douce">
              Cliquez un exercice pour revoir ses écrans, tels que l’élève les a vus.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function LigneEleve({ e, choisi, choisir }: { e: EleveSuivi; choisi: boolean; choisir: () => void }) {
  return (
    <button type="button" onClick={choisir} aria-pressed={choisi}
      className={`grid w-full grid-cols-[minmax(0,1fr)_28px_64px_78px] md:grid-cols-[minmax(0,1fr)_28px_64px_78px_80px] items-center gap-x-2 gap-y-1.5 border-t border-bordure/60 px-3 py-2 text-left font-ui text-sm
                  ${choisi ? 'bg-pigment-teinte border-l-[3px] border-l-liseret' : 'hover:bg-parchemin'}`}>
      <span className={`min-w-0 break-words leading-tight ${choisi ? 'font-bold text-encre' : 'text-encre'}`}>{e.nom}</span>
      <span className={`text-right ${e.assignes === 0 ? 'font-bold text-retard' : ''}`}>{e.assignes}</span>
      <span className="text-right" title={e.sansVerdict ? `${e.sansVerdict} rendu${e.sansVerdict > 1 ? 's' : ''} sans verdict` : undefined}>
        {e.rendus === 0 ? <span className="text-muet">— / 0</span>
          : <><strong className={e.reussis > 0 ? 'text-ok' : e.rendus - e.sansVerdict > 0 ? 'text-retard' : 'text-muet'}>{e.reussis}</strong> / {e.rendus}{e.sansVerdict > 0 && <span className="text-muet">*</span>}</>}
      </span>
      <span className="text-right text-encre-douce">
        {e.prevuMin || '—'} · {e.passeMin ? <strong className={e.prevuMin > 0 && e.passeMin > e.prevuMin ? 'text-retard' : 'text-encre'}>{e.passeMin}</strong> : '—'}
        {e.laisseOuvert && <span title="au moins un exercice laissé ouvert plus de 3 h" className="ml-0.5 text-attention">*</span>}
      </span>
      {e.assignes === 0 ? (
        <span className="col-span-4 md:col-span-1 text-xs text-attention">sans exercice</span>
      ) : (
        <span className="col-span-4 md:col-span-1 flex gap-1">
          {e.competences.map((c) => {
            const p = pastille(c)
            return <span key={c} title={p.long} className={`flex h-5 w-5 items-center justify-center rounded-[3px] text-[10px] font-bold ${p.fond} ${p.texte}`}>{p.court}</span>
          })}
        </span>
      )}
    </button>
  )
}

function LigneExercice({ x, choisi, href }: { x: ExerciceSuivi; choisi: boolean; href: string }) {
  const p = pastille(x.competence)
  const [etat, action, enCours] = useActionState<Retour | null, FormData>(retirerLExercice, null)
  const [confirme, setConfirme] = useState(false)
  const retire = x.statut === 'retire'
  // Un dépôt retiré ou de CLASSE n'a pas d'écrans de maison à rejouer : pas de lien.
  const ouvrable = !retire && x.lieu !== 'classe'
  const Cle = ouvrable ? Link : 'span'
  return (
    <li className={`border-t border-bordure/60 ${choisi ? 'bg-pigment-teinte border-l-[3px] border-l-liseret' : ''} ${retire ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[104px_minmax(0,1fr)_44px_120px_90px_64px] items-center gap-x-2.5 gap-y-1 px-4 py-2.5 font-ui text-sm">
        <Cle href={href} className={`font-bold ${p.texte}`}>{p.long}</Cle>
        <Cle href={href} className="order-3 col-span-2 md:order-none md:col-span-1 min-w-0 truncate font-mono text-[13px] text-encre-douce" title={[x.idImport, x.titre].filter(Boolean).join(' — ')}>
          {x.objet ?? x.observable ?? x.idImport ?? '—'}
          {x.observable && x.objet && <span className="ml-1.5 font-ui text-xs text-muet">{x.observable}</span>}
          {x.lieu === 'classe' && <span className="ml-1.5 rounded bg-parchemin-fonce px-1.5 py-0.5 font-ui text-[10px] uppercase tracking-wide text-encre-douce" title="passation en classe : son flux est celui de la passation, pas du déroulé de maison">en classe</span>}
          <span className="ml-1.5 font-ui text-xs text-muet md:hidden">{x.cran != null ? `cran ${x.cran}` : ''}</span>
        </Cle>
        <span className="hidden md:inline">{x.cran ?? '—'}</span>
        <span className="order-2 md:order-none flex items-center justify-end md:justify-start gap-1.5 whitespace-nowrap">
          {retire && <><span className="inline-block h-2.5 w-2.5 rounded-full border border-puce" /><span className="text-muet">retiré par vous</span></>}
          {!retire && x.issue === 'reussi' && <><span className="inline-block h-2.5 w-2.5 rounded-full bg-ok" /><span className="text-ok">réussi</span></>}
          {x.issue === 'rate' && <><span className="inline-block h-2.5 w-2.5 rounded-full bg-retard" /><span className="text-retard">raté</span></>}
          {!retire && x.rendu && x.issue === null && <><span className="inline-block h-2.5 w-2.5 rounded-full border border-puce" /><span className="text-muet" title="issue non dérivable : crans 6·8, juge absent, ou examen">rendu, sans verdict</span></>}
          {!retire && !x.rendu && <><span className="inline-block h-2.5 w-2.5 rounded-full border border-puce" /><span className="text-muet">{LIBELLE_STATUT[x.statut] ?? x.statut}</span></>}
        </span>
        <span className="order-4 md:order-none text-left md:text-right text-encre-douce whitespace-nowrap">
          {x.prevuMin ?? '—'} · {x.laisseOuvert
            ? <span className="text-attention" title={`ouvert le ${x.ouvertAt?.slice(0, 16).replace('T', ' ') ?? '?'}, remis le ${x.v1RemisAt?.slice(0, 16).replace('T', ' ') ?? '?'}`}>laissé ouvert</span>
            : x.passeMin != null
              ? <strong className={x.prevuMin != null && x.passeMin > x.prevuMin ? 'text-retard' : 'text-encre'}>{x.passeMin}</strong>
              : '—'}
        </span>
        <span className="order-5 md:order-none text-right">
          {x.retirable ? (
            confirme ? (
              <form action={action} className="inline-flex items-center gap-1">
                <input type="hidden" name="depot_id" value={x.depotId} />
                <input type="text" name="motif" placeholder="motif" className="w-[90px] rounded border border-bordure-bouton bg-parchemin px-1.5 py-1 text-xs placeholder:text-puce" />
                <button type="submit" disabled={enCours} className="rounded border border-retard/50 bg-retard-teinte px-2 py-1 text-xs text-retard disabled:opacity-50">{enCours ? '…' : 'ok'}</button>
                <button type="button" onClick={() => setConfirme(false)} className="text-xs text-muet hover:text-encre">×</button>
              </form>
            ) : (
              <button type="button" onClick={() => setConfirme(true)}
                className="rounded border border-retard/30 px-2 py-1 text-xs text-retard hover:bg-retard-teinte">retirer</button>
            )
          ) : <span className="text-xs text-puce">{x.statut === 'clos' ? 'clos' : 'retiré'}</span>}
        </span>
      </div>
      {/* Ce que l'ancien écran montrait — la décision du routeur, sur la ligne de
          l'exercice (Louis, 14/09 : « dans le panneau de droite, pas dans celui de gauche »). */}
      <p className="px-4 pb-2 -mt-1 font-ui text-xs text-muet flex flex-wrap gap-x-2">
        {x.regle && <span className="rounded bg-parchemin-fonce px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-encre-douce">{x.regle}</span>}
        {x.degrade && <span className="rounded bg-attention-teinte px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-attention"
          title="Aucun cran ne portait l’observable visé : l’exercice a été servi quand même, en retour mono-focal.">dégradé</span>}
        {x.sondes.some((s) => s.sonde_montee !== true) && (
          <span title="mesurées en silence, sans retour">sondes : {x.sondes.filter((s) => s.sonde_montee !== true).map((s) => `${s.competence ?? '?'}${s.motif ? ` (${s.motif.replace(/_/g, ' ')})` : ''}`).join(' · ')}</span>
        )}
        {x.sondes.some((s) => s.sonde_montee === true) && (
          <span title="la cible servie au-dessus de sa bande ; elle reçoit un retour, elle ne compte pas">sonde de montée : {x.sondes.filter((s) => s.sonde_montee === true).map((s) => s.competence ?? '?').join(' · ')}</span>
        )}
        {!x.competence && <span>sans cible de routeur</span>}
        <span>origine {x.origine}</span>
        {x.echeance && <span>échéance {x.echeance.slice(0, 10)}</span>}
      </p>
      {etat && (
        <p className={`px-4 pb-2 font-ui text-xs ${etat.ok ? 'text-ok' : 'text-retard'}`}>
          {etat.message}
          {etat.details?.map((d) => <span key={d} className="mt-1 block text-muet">{d}</span>)}
        </p>
      )}
    </li>
  )
}

function decale(lundi: string, n: number): string {
  const d = new Date(`${lundi}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n * 7)
  return d.toISOString().slice(0, 10)
}

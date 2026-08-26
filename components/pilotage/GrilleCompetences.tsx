'use client'

// ============================================================================
// LA GRILLE DES LETTRES — et ce qu'on trouve en cliquant dessus.
// ----------------------------------------------------------------------------
// « Un écran n'affiche un nombre que si ce nombre compte quelque chose. […] un
//   chiffre qui ne mesure rien attire pourtant des décisions. »   — `06-` §5
//
// D'où quatre refus, tenus partout dans ce fichier :
//   · une cellule SANS LETTRE n'affiche pas une pastille pâle — elle affiche un
//     tiret. Une cellule QUI PORTE UNE LETTRE l'affiche toujours, mais elle ne
//     se clique que s'il existe des mesures à montrer dessous ;
//   · un observable dont AUCUNE mesure n'a d'objet n'affiche pas « 0 % » — il
//     affiche « sans objet », parce que 0 % serait une difficulté inventée ;
//   · une série d'UN SEUL POINT ne se dessine pas en courbe — elle dit qu'elle
//     n'a qu'un point. Une tendance à une mesure est une tendance fausse ;
//   · rien ne se distingue PAR LA SEULE COULEUR : chaque état porte un mot, et
//     les points de série portent aussi une forme.
//
// ⚠️ « ACQUIS » EST LE MOT DU ROUTEUR, ET IL A SON SEUIL : la fenêtre d'évidence
//    (quatre dernières mesures qui comptent) à plus de 2/3. Une MESURE, elle,
//    est « réussie » ou « ratée ». Les deux ne se confondent jamais — sans quoi
//    le professeur lit un nombre et le routeur en applique un autre.
//    *Écrit après la revue du 26/08, qui a trouvé les deux mots interchangés.*
//
// ⚠️ `mesure_at` EST UN INSTANT, pas une date pure : il se formate dans le fuseau
//    de l'école, que le serveur lit une fois et passe en prop (`utils/fuseau`).
//    Sans `tz`, le rendu serveur et le rendu navigateur peuvent tomber un jour
//    différent — et l'hydratation le dénonce.
// ============================================================================

import { useId, useState } from 'react'
import Link from 'next/link'
import { formatInstant } from '@/utils/fuseau'
import { COULEUR_LETTRE, type LettreSection } from '@/utils/notation'
import type {
  ColonneCompetence, CelluleCompetence, ObservableEleve, PointObservable,
} from '@/utils/competences-classe'

type StatutObs = PointObservable['statut']

const TEINTE_STATUT: Record<StatutObs, string> = {
  reussie: 'bg-ok-teinte text-ok',
  ratee: 'bg-retard-teinte text-retard',
  sans_objet: 'bg-parchemin-fonce text-muet',
}

/** Le mot d'UNE MESURE. Ce n'est pas le mot de l'acquisition — voir l'en-tête. */
const MOT_MESURE: Record<StatutObs, string> = {
  reussie: 'réussie',
  ratee: 'ratée',
  sans_objet: 'sans objet',
}

const MOT_STATUT_RECETTE: Record<string, string> = {
  evaluee: 'évaluée',
  mesuree_silencieusement: 'mesurée en silence',
  differee: 'différée',
}

/** Les familles dont la valeur EST une part — les seules qui s'affichent en %. */
const FAMILLES_PART = new Set(['proportion', 'comptage rapporté'])

function formatValeur(v: unknown, famille: string): string {
  if (v === null || v === undefined || v === 'n/a') return 'sans objet'
  if (typeof v === 'boolean') return v ? 'oui' : 'non'
  if (typeof v === 'number') {
    if (FAMILLES_PART.has(famille)) return `${Math.round(v * 100)} %`
    return Number.isInteger(v) ? String(v) : v.toFixed(2)
  }
  return String(v)
}

function jourCourt(iso: string | null, tz: string): string {
  if (!iso) return '—'
  return formatInstant(iso, tz, { day: 'numeric', month: 'short' })
}

function Pastille({ lettre }: { lettre: LettreSection | null }) {
  if (!lettre) {
    // ⚠️ L'étiquette dit l'absence de LETTRE, jamais l'absence de mesure : la
    //    cellule cliquable en porte, et son compte est juste en dessous.
    //    *La revue du 26/08 a trouvé un `aria-label="aucune mesure"` en dur, lu
    //    par le lecteur d'écran dans le cas dominant où il y en a.*
    return <span className="font-corps text-base text-muet" aria-label="aucune lettre posée">—</span>
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-titre font-semibold text-base ${COULEUR_LETTRE[lettre]}`}
      aria-label={`niveau ${lettre}`}
    >
      {lettre}
    </span>
  )
}

/**
 * La série d'un observable — des points, jamais une courbe lissée.
 *
 * ⚠️ Les points sont DÉCORATIFS pour un lecteur d'écran (`aria-hidden`) et la
 *    série porte son résumé en toutes lettres : douze pastilles distinguées par
 *    la seule couleur ne se lisent ni au clavier, ni en daltonisme. La forme
 *    double la couleur — disque plein, carré, anneau.
 */
function Serie({ o, tz }: { o: ObservableEleve; tz: string }) {
  if (o.serie.length === 0) return <span className="font-ui text-xs text-muet">—</span>
  if (o.serie.length === 1) {
    return (
      <span className="font-ui text-xs text-muet">
        1 mesure<span className="sr-only"> — la série démarre au deuxième exercice</span>
      </span>
    )
  }
  const resume = o.serie.map((p) => `${jourCourt(p.date, tz)} ${MOT_MESURE[p.statut]}`).join(', ')
  return (
    <span className="inline-flex items-center gap-1">
      <span className="sr-only">
        {o.serieTronquee ? `${o.serie.length} dernières mesures : ` : `${o.serie.length} mesures : `}
        {resume}
      </span>
      {o.serie.map((p, i) => (
        <span
          key={`${p.date}-${i}`}
          aria-hidden
          title={`${jourCourt(p.date, tz)} · ${MOT_MESURE[p.statut]}${p.ailleurs ? ' · autre cours' : ''}`}
          className={`w-2.5 h-2.5 ${
            p.statut === 'reussie' ? 'bg-ok rounded-full'
              : p.statut === 'ratee' ? 'bg-retard rounded-[2px]'
                : 'border border-bordure rounded-full'
          } ${p.ailleurs ? 'ring-1 ring-offset-1 ring-attention' : ''}`}
        />
      ))}
      {o.serieTronquee && (
        <span className="font-ui text-[10px] text-muet" title="Série bornée à l’affichage.">
          +
        </span>
      )}
    </span>
  )
}

/**
 * L'ACQUISITION AU SENS DU ROUTEUR — fenêtre d'évidence, seuil 2/3.
 * C'est ce verdict-là qui décide de l'escalade ; c'est donc lui qu'on montre.
 */
function Acquisition({ o }: { o: ObservableEleve }) {
  if (o.acquis === null) {
    return (
      <span
        className="font-ui text-xs text-muet"
        title="Aucune mesure de cet observable n’avait d’objet dans la fenêtre — un taux de 0 % serait faux."
      >
        sans objet
      </span>
    )
  }
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={`inline-block rounded-md px-2 py-0.5 font-ui text-[11px] ${
          o.acquis ? TEINTE_STATUT.reussie : TEINTE_STATUT.ratee}`}
      >
        {o.acquis ? 'acquis' : 'non acquis'}
      </span>
      <span
        className="font-ui text-[11px] text-muet tabular-nums"
        title="Réussies sur mesures ayant un objet, dans la fenêtre d’évidence (4 dernières)."
      >
        {o.reussiesFenetre}/{o.denominateurFenetre}
      </span>
    </span>
  )
}

function LigneObservable({ o, tz }: { o: ObservableEleve; tz: string }) {
  return (
    <tr className="border-b border-bordure last:border-0 align-top">
      <th scope="row" className="py-2.5 pr-3 text-left font-normal">
        <span className="font-corps text-sm text-encre">{o.nom}</span>
        {o.telemetriePure && (
          <span
            className="ml-1.5 font-ui text-[10px] text-muet"
            title="La fiche déclare cet observable sans objet pour le verdict — il mesure l’instrument, pas l’élève."
          >
            télémétrie
          </span>
        )}
        {o.sens && (
          <span className="block font-ui text-[11px] text-muet leading-snug mt-0.5 max-w-md">
            {o.sens}
          </span>
        )}
      </th>
      <td className="py-2.5 px-3 whitespace-nowrap">
        <span
          className={`inline-block rounded-md px-2 py-0.5 font-ui text-[11px] ${TEINTE_STATUT[o.statutDernier]}`}
          title={`Dernière mesure : ${MOT_MESURE[o.statutDernier]}`}
        >
          {formatValeur(o.derniere, o.famille)}
        </span>
      </td>
      <td className="py-2.5 px-3 whitespace-nowrap"><Acquisition o={o} /></td>
      <td className="py-2.5 pl-3 whitespace-nowrap"><Serie o={o} tz={tz} /></td>
    </tr>
  )
}

interface Eleve { eleveId: string; nom: string }

export default function GrilleCompetences({
  eleves, colonnes, cellules, tz,
}: {
  eleves: Eleve[]
  colonnes: ColonneCompetence[]
  cellules: Record<string, Record<string, CelluleCompetence>>
  /** Le fuseau de l'école, lu une fois côté serveur (`lireFuseau`). */
  tz: string
}) {
  const [choix, setChoix] = useState<{ eleveId: string; competence: string } | null>(null)
  const idPanneau = useId()

  const eleveChoisi = choix ? eleves.find((e) => e.eleveId === choix.eleveId) ?? null : null
  const colonneChoisie = choix ? colonnes.find((c) => c.code === choix.competence) ?? null : null
  const celluleChoisie = choix ? cellules[choix.eleveId]?.[choix.competence] ?? null : null

  return (
    <section className="rounded-xl border border-bordure bg-surface overflow-hidden">
      <div className="px-4 pt-3.5 pb-2">
        <h2 className="font-titre text-lg text-encre">Les niveaux de la classe</h2>
        <p className="font-ui text-xs text-muet mt-0.5">
          Clique une cellule pour ouvrir les observables de la compétence, leur acquisition
          et leur évolution.
        </p>
      </div>

      <div className="overflow-x-auto border-t border-bordure">
        <table className="w-full border-collapse text-center">
          <caption className="sr-only">
            Niveau de chaque élève par compétence. Les cellules qui portent des mesures
            s’ouvrent sur le détail des observables.
          </caption>
          <thead>
            <tr className="bg-parchemin-fonce border-b border-bordure">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-parchemin-fonce text-left px-4 py-2.5 w-[150px] sm:w-[190px] border-r border-bordure"
              >
                <span className="font-ui text-[10px] tracking-[0.06em] text-muet">ÉLÈVE</span>
              </th>
              {colonnes.map((c) => (
                <th
                  key={c.code}
                  scope="col"
                  className={`px-2 py-2 min-w-[104px] border-l border-bordure ${c.active ? '' : 'bg-parchemin/60'}`}
                >
                  <span className={`block font-marque text-[10.5px] font-semibold tracking-[0.06em] ${
                    c.active && c.ouverte ? 'text-pigment' : 'text-muet'
                  }`}
                  >
                    {c.nom.toUpperCase()}
                  </span>
                  {/* Une colonne qui ne peut rien porter DIT POURQUOI — jamais un
                      en-tête muet au-dessus d'une colonne de tirets. */}
                  {!c.active ? (
                    <span className="font-ui text-[9px] text-muet">retirée de ce cours</span>
                  ) : !c.ouverte ? (
                    <span className="font-ui text-[9px] text-muet" title={c.motif ?? undefined}>
                      hors chaîne
                    </span>
                  ) : c.statutRecette !== 'evaluee' ? (
                    <span className="font-ui text-[9px] text-muet">
                      {MOT_STATUT_RECETTE[c.statutRecette] ?? c.statutRecette}
                    </span>
                  ) : (
                    <span
                      className="font-ui text-[9px] text-muet tabular-nums"
                      title="Mesures qui comptent, pour les élèves de cette classe, tous cours confondus."
                    >
                      {c.nbMesures} mesure{c.nbMesures > 1 ? 's' : ''}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eleves.map((e) => (
              <tr key={e.eleveId} className="border-b border-bordure last:border-0">
                <th scope="row" className="sticky left-0 z-10 bg-surface text-left p-0 border-r border-bordure">
                  <Link
                    href={`/prof/eleves/${e.eleveId}`}
                    className="block px-4 py-3 hover:bg-parchemin-fonce/50 transition-colors"
                  >
                    {/* `truncate` exige une boîte de bloc : sur un span inline il
                        est inopérant, et un nom long élargit la colonne figée. */}
                    <span className="block truncate font-corps text-[15px] font-normal text-encre">
                      {e.nom}
                    </span>
                  </Link>
                </th>
                {colonnes.map((c) => {
                  const cel = cellules[e.eleveId]?.[c.code]
                  const ouvrable = !!cel && cel.nbMesures > 0
                  const actif = choix?.eleveId === e.eleveId && choix.competence === c.code
                  return (
                    <td
                      key={c.code}
                      className={`border-l border-bordure p-0 ${c.active ? '' : 'bg-parchemin/40'}`}
                    >
                      {ouvrable ? (
                        <button
                          type="button"
                          onClick={() => setChoix(actif ? null : { eleveId: e.eleveId, competence: c.code })}
                          aria-expanded={actif}
                          aria-controls={idPanneau}
                          title={`${cel.nbMesures} mesure${cel.nbMesures > 1 ? 's' : ''} · dernière le ${jourCourt(cel.derniereMesure, tz)}`}
                          className={`w-full h-full px-2 py-2.5 flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                            actif ? 'bg-pigment-teinte' : 'hover:bg-parchemin-fonce/60'
                          }`}
                        >
                          <span className="sr-only">
                            {e.nom} · {c.nom} · {cel.lettre ? `niveau ${cel.lettre}` : 'aucune lettre posée'}
                            {' · '}{cel.nbMesures} mesure{cel.nbMesures > 1 ? 's' : ''} — ouvrir le détail
                          </span>
                          <Pastille lettre={cel.lettre} />
                          {/* ⭐ L'AFFORDANCE, trouvée au smoke du 26/08 : sans elle,
                              une cellule qui S'OUVRE et une cellule MORTE
                              s'affichent toutes deux « — » et rien ne les sépare.
                              Le cas n'est pas marginal — le bac à sable porte 102
                              niveaux à lettre nulle sous des mesures réelles. */}
                          {cel.lettre ? (
                            cel.provisoire && (
                              <span aria-hidden className="font-ui text-[9px] text-muet">provisoire</span>
                            )
                          ) : (
                            <span aria-hidden className="font-ui text-[9px] text-pigment tabular-nums">
                              {cel.nbMesures} mesure{cel.nbMesures > 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                      ) : (
                        // Une lettre sans mesure lisible reste une lettre : on
                        // l'affiche, et le titre dit pourquoi elle ne s'ouvre pas.
                        <span
                          className="block px-2 py-2.5"
                          title={cel?.lettre
                            ? 'Lettre posée, mais aucune mesure à détailler pour cet élève.'
                            : 'Aucune mesure, aucune lettre.'}
                        >
                          <Pastille lettre={cel?.lettre ?? null} />
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Le détail : il n'existe que si une cellule est choisie ──────────── */}
      <div id={idPanneau}>
        {choix && eleveChoisi && colonneChoisie && celluleChoisie && (
          <div className="border-t border-bordure bg-parchemin/40 px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-titre text-base text-encre">
                  {eleveChoisi.nom} · {colonneChoisie.nom}
                </h3>
                <p className="font-ui text-xs text-muet mt-0.5 tabular-nums">
                  {celluleChoisie.nbMesures} mesure{celluleChoisie.nbMesures > 1 ? 's' : ''}
                  {' · dernière le '}{jourCourt(celluleChoisie.derniereMesure, tz)}
                  {celluleChoisie.lettreInitiale && celluleChoisie.lettre
                    && celluleChoisie.lettreInitiale !== celluleChoisie.lettre
                    && ` · première lettre ${celluleChoisie.lettreInitiale}`}
                  {celluleChoisie.provisoire && ' · profil provisoire'}
                  {celluleChoisie.lettreEquivalenteDerniere
                    && ` · dernière mesure équivalente à ${celluleChoisie.lettreEquivalenteDerniere}`}
                </p>
                {celluleChoisie.nbAilleurs > 0 && (
                  <p className="font-ui text-[11px] text-attention mt-1">
                    Dont {celluleChoisie.nbAilleurs} mesure{celluleChoisie.nbAilleurs > 1 ? 's' : ''}{' '}
                    venue{celluleChoisie.nbAilleurs > 1 ? 's' : ''} d’un autre cours — la lettre est
                    celle de l’élève, pas celle de la classe.
                  </p>
                )}
                {/* Ce qui est ÉCARTÉ est dit : une mesure qui disparaît sans un
                    mot est un fait perdu, et le professeur la chercherait. */}
                {celluleChoisie.nbEcartees > 0 && (
                  <p className="font-ui text-[11px] text-muet mt-1">
                    {celluleChoisie.nbEcartees} mesure{celluleChoisie.nbEcartees > 1 ? 's' : ''}{' '}
                    écartée{celluleChoisie.nbEcartees > 1 ? 's' : ''} du calcul — sonde de montée,
                    ou antérieure à la mise en recette de la compétence. Le routeur les écarte aussi.
                  </p>
                )}
              </div>
              <div className="flex items-start gap-2 shrink-0">
                {/* La lettre POSÉE. Quand rien ne l'a posée, on ne replie pas sur
                    la lettre-équivalente de la dernière mesure : elle dit ce que
                    CETTE mesure valait, pas ce que la compétence vaut. */}
                <div className="text-right">
                  <Pastille lettre={celluleChoisie.lettre} />
                  {!celluleChoisie.lettre && (
                    <span className="block font-ui text-[10px] text-muet mt-0.5 whitespace-nowrap">
                      aucune lettre posée
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setChoix(null)}
                  className="font-ui text-xs text-muet hover:text-encre cursor-pointer"
                >
                  fermer
                </button>
              </div>
            </div>

            {celluleChoisie.observables.length === 0 ? (
              <p className="font-corps text-sm text-encre-douce">
                La fiche de cette compétence ne déclare aucun observable de mesure.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-bordure">
                      {['CE QUE LA FICHE MESURE', 'DERNIÈRE', 'ACQUISITION', 'ÉVOLUTION'].map((t) => (
                        <th key={t} scope="col" className="py-1.5 pr-3 font-ui text-[10px] tracking-[0.06em] text-muet font-normal">
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {celluleChoisie.observables.map((o) => (
                      <LigneObservable key={o.code} o={o} tz={tz} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="font-ui text-[11px] text-muet">
              <strong>Acquis</strong> est le verdict du routeur : plus de deux tiers de réussite
              sur la <strong>fenêtre d’évidence</strong> — les quatre dernières mesures qui
              comptent. La colonne <strong>Dernière</strong>, elle, ne montre qu’une mesure.
              {celluleChoisie.nbMesures === 1
                && ' Ici il n’y en a qu’une : l’évolution commencera au deuxième exercice mesuré.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

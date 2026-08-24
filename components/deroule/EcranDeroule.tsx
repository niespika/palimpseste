'use client'
// ============================================================================
// C4 · L3 — LES SIX TEMPS À L'ÉCRAN.
// ----------------------------------------------------------------------------
// « À la maison, les six temps sont ceux du régime PLEIN — les trois crans de
//   production : les temps 5 et 6 suivent le `regime_v1vf` du cran, et ne sont
//   pas servis là où il n'y a pas de version finale » (`06-` §2).
//
// ⚠️ CE QUE CET ÉCRAN NE FAIT JAMAIS :
//   · **il n'appelle aucun modèle** — la génération des retours est à C4-L5 ;
//     ici on met en file, on attend visiblement, on affiche ;
//   · **il ne découpe pas le retour** : il arrive SEGMENTÉ, et c'est un contrat
//     sur celui qui l'engendre (`07-` §1.2) — on boucle sur les points ;
//   · **il ne demande JAMAIS à l'élève de signaler ce qu'il n'a pas compris** —
//     aucune consigne, aucun champ, aucun bouton (`02-` §5) : la lucidité est de
//     la métacognition SPONTANÉE, relevée ailleurs. *C'est la CALIBRATION que le
//     retour nomme, jamais la lucidité* ;
//   · **il n'affiche aucune note, aucune lettre, aucune moyenne** (`07-` §1.1,
//     §4 règle 6) — et rien qui y ressemble.
// ============================================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TexteBalise, TexteBrut } from './TexteBalise'
import { ChampDeRedaction } from './ChampDeRedaction'
import { CredenceSaisie } from './CredenceSaisie'
import { GestesDeLaRemise } from './GestesDeLaRemise'
import { SeJuger } from './SeJuger'
import { RetourSegmente } from './RetourSegmente'
import type { VueDuDeroule } from '@/utils/deroule/vue'
import type { TelemetrieSaisie } from '@/utils/deroule/types'
import {
  actionOuvrir, actionEnregistrerBrouillon, actionRemettre, actionMicroQuestion,
  actionCompterUneAide, actionEtatDeLAttente,
} from '@/app/deroule/actions'

/** Le sondage de l'attente — « jamais un écran muet » (`01-` §12). */
const SONDAGE_MS = 5_000

export function EcranDeroule({ vue }: { vue: VueDuDeroule }) {
  const router = useRouter()

  // L'ouverture est idempotente côté serveur : `ouvert_at` ne se réécrit jamais.
  useEffect(() => { void actionOuvrir(vue.depotId) }, [vue.depotId])

  const enregistrer = useCallback(
    async (texte: string, t: TelemetrieSaisie) => {
      await actionEnregistrerBrouillon(vue.depotId, versionEnCours(vue), texte, t)
    }, [vue])

  const remettre = useCallback(
    async (texte: string, t: TelemetrieSaisie) => {
      const r = await actionRemettre(vue.depotId, versionEnCours(vue), texte, t)
      if (!r.ok) throw new Error(r.message)
      router.refresh()
    }, [vue, router])

  if (!vue.ouvert) {
    return (
      <Encart ton="attention">
        <p className="text-sm text-encre">
          Les exercices ne sont pas encore ouverts. Ton travail t’attend ici dès qu’ils le seront.
        </p>
      </Encart>
    )
  }

  const enRedactionV1 = vue.tempsCourant === 'ecrire' || vue.tempsCourant === 'preparer'
  const enRevision = vue.tempsCourant === 'reviser'

  return (
    <div className="space-y-5">
      <Fil vue={vue} />

      {/* ── TEMPS 1 — PRÉPARER ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-bordure bg-surface p-4">
        <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
          La consigne
        </h2>
        {/* ⭐ Le balisage SE REND : « le gras est du SENS » (piège 36). */}
        <p className="mt-2 font-corps text-base leading-relaxed text-encre">
          <TexteBalise jetons={vue.consigne} />
        </p>
        {vue.dureeIndicativeMin !== null && (
          <p className="mt-2 text-xs text-muet">
            Durée indicative : {vue.dureeIndicativeMin} minutes.
          </p>
        )}
      </section>

      {/* Le rappel des observables les plus faibles — EN LANGUE ÉLÈVE, jamais
          par leur code, et dosé par le palier (`06-` §2). Absent, l'écran ne
          montre que la consigne : il n'y a rien à rappeler. */}
      {vue.rappel.observables.length > 0 && (
        <Encart>
          <h3 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
            Ce sur quoi tu butais la dernière fois
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-encre">
            {vue.rappel.observables.map((o) => <li key={o.code}>{o.dimension_eleve}</li>)}
          </ul>
        </Encart>
      )}

      {/* ⚠️ LA DÉMONSTRATION N'EST PAS LE GUIDE (`02-` §2.3.4) : deux objets,
          deux mécanismes. Le guide porte sur la matière MÊME de l'exercice ;
          la démonstration porte sur un AUTRE cours et d'autres notions. */}
      {vue.demonstration.demonstration && vue.demonstrationAvantLaTentative && (
        <Depliable
          titre="Un exemple, sur un autre sujet"
          depotId={vue.depotId} aide="demonstration"
        >
          <ContenuDemonstration contenu={vue.contenuDemonstration} />
        </Depliable>
      )}
      {vue.guide && (
        <Depliable titre="De quoi t’aider" depotId={vue.depotId} aide="guide">
          <TexteBrut texte={vue.guide} className="text-sm text-encre" />
        </Depliable>
      )}

      {/* ── TEMPS 2 — ÉCRIRE ───────────────────────────────────────────── */}
      {vue.cas.map((c, i) => (
        <div key={c.ordre} className="space-y-3">
          {(vue.estUnePaire || c.materiau) && (
            <section className="rounded-lg border border-bordure bg-surface p-4">
              {vue.estUnePaire && (
                <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
                  {c.ordre === 1 ? 'Premier cas' : 'Un cas neuf, de la même famille'}
                </h2>
              )}
              <p className="mt-2 font-corps text-base leading-relaxed text-encre">
                <TexteBalise jetons={c.consigne} />
              </p>
              {c.materiau && (
                <TexteBrut
                  texte={c.materiau}
                  className="mt-3 rounded border border-bordure bg-parchemin-fonce p-3
                             font-corps text-sm text-encre"
                />
              )}
            </section>
          )}

          {/* ⭐⭐ LA CORRECTION — servie APRÈS la crédence DE CE CAS, et pour
              LES DEUX cas de la paire : le second est celui du transfert, et
              aux crans au jugement algorithmique rien ne vient derrière lui.
              ⚠️ La garde `c.ordre === 1` qui vivait ici est TOMBÉE (C4-L14) :
              c'était l'un des deux endroits qui rendaient le second cas muet. */}
          {vue.corrections[i] && (
            <Encart ton="ok">
              <h3 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
                Ce qu’il fallait voir
              </h3>
              <TexteBrut texte={vue.corrections[i]!.reponse} className="mt-2 text-sm text-encre" />

              {/* ⭐ LE POURQUOI. Aux crans à candidats la réponse ci-dessus est
                  un CANDIDAT NU : elle ne peut rien dire d'elle-même. */}
              {vue.corrections[i]!.pourquoiJuste && (
                <>
                  <h4 className="mt-3 font-marque text-xs uppercase tracking-wide text-muet-clair">
                    Pourquoi c’est celle-là
                  </h4>
                  <TexteBrut texte={vue.corrections[i]!.pourquoiJuste!}
                    className="mt-1 text-sm text-encre" />
                </>
              )}

              {/* ⚠️ LA RÉFUTATION DU SEUL CANDIDAT LE PLUS CHARGÉ — jamais des
                  trois : la rétroaction élaborée surcharge l'élève à faible
                  bagage et devient redondante pour l'avancé. */}
              {vue.corrections[i]!.refutation && (
                <>
                  <h4 className="mt-3 font-marque text-xs uppercase tracking-wide text-muet-clair">
                    Ce que tu avais retenu — « {vue.corrections[i]!.refutation!.candidat} »
                  </h4>
                  <TexteBrut texte={vue.corrections[i]!.refutation!.pourquoiFaux}
                    className="mt-1 text-sm text-encre" />
                </>
              )}

              {/* ⭐ L'ÉGALITÉ SE DIT, elle ne se tait pas : « servir la
                  réfutation d'un candidat que l'élève n'a pas choisi est pire
                  que n'en servir aucune ». L'absence est honnête. */}
              {vue.corrections[i]!.silence === 'egalite' && (
                <p className="mt-3 font-ui text-xs text-encre-douce">
                  Tu avais réparti tes jetons à égalité : aucun candidat n’était celui que tu
                  tenais le plus pour vrai. Rien n’est donc repris ici en particulier.
                </p>
              )}
            </Encart>
          )}

          {c.credence && !c.credence.empechement && !c.credenceDonnee && (
            <CredenceSaisie depotId={vue.depotId} cas={c.ordre} offre={c.credence} />
          )}
        </div>
      ))}

      {(enRedactionV1 || enRevision) && (
        <>
          {/* ── TEMPS 5 — RÉVISER : L'ACTION DE RÉVISION, UNE SEULE ─────── */}
          {enRevision && vue.retourChaud?.actionRevision && (
            <Encart>
              <h3 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
                Ce que tu as à reprendre
              </h3>
              <p className="mt-2 text-sm text-encre">{vue.retourChaud.actionRevision}</p>
              {vue.echeanceVf.quand && (
                <p className="mt-2 text-xs text-muet">
                  À rendre avant le {quand(vue.echeanceVf.quand)}.
                </p>
              )}
            </Encart>
          )}

          <ChampDeRedaction
            depotId={vue.depotId}
            valeurInitiale={(enRevision ? vue.texteVf ?? vue.texteV1 : vue.texteV1) ?? ''}
            lectureSeule={false}
            onEnregistrer={enregistrer}
            onRemettre={remettre}
            libelleRemise={enRevision ? 'Rendre ma version finale' : 'Rendre ma v1'}
          />

          {/* La micro-question de dépassement. ⚠️ JAMAIS notée, jamais renvoyée
              comme jugement, et `motif_depassement` reste NULL si on n'y répond
              pas (`02-` §2.4 ; `07-` §1.1). */}
          {vue.microQuestionDue && !vue.motifDepassement && (
            <MicroQuestion depotId={vue.depotId} />
          )}

          {/* ⭐ LES TROIS GESTES DE LA REMISE, DANS CET ORDRE (`06-` §3), et
              AVANT tout envoi à l'IA. */}
          {!enRevision && <GestesDeLaRemise vue={vue} />}
        </>
      )}

      {/* ── TEMPS 3 — SE JUGER ─────────────────────────────────────────── */}
      {vue.tempsCourant === 'se_juger' && vue.seJuger.servie && vue.seJuger.offre && (
        <SeJuger depotId={vue.depotId} offre={vue.seJuger.offre} />
      )}

      {/* ── TEMPS 4 et 6 — LE RETOUR, ET LE RETOUR FINAL ───────────────── */}
      <Attente vue={vue} />
      {vue.retourChaud && (
        <RetourSegmente
          depotId={vue.depotId} retour={vue.retourChaud} vue={vue} titre="Ton retour"
        />
      )}
      {vue.retourFinal && (
        <RetourSegmente
          depotId={vue.depotId} retour={vue.retourFinal} vue={vue} titre="Ce qui a bougé"
        />
      )}
    </div>
  )
}

function versionEnCours(vue: VueDuDeroule): 'v1' | 'vf' {
  return vue.tempsCourant === 'reviser' ? 'vf' : 'v1'
}

const quand = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })

// ── Le fil des six temps ────────────────────────────────────────────────────

const LIBELLE: Record<string, string> = {
  preparer: 'Préparer', ecrire: 'Écrire', se_juger: 'Se juger',
  retour: 'Retour', reviser: 'Réviser', retour_final: 'Retour final',
}

function Fil({ vue }: { vue: VueDuDeroule }) {
  return (
    <nav aria-label="Les temps de l’exercice" className="flex flex-wrap gap-2 text-xs">
      {vue.temps.map((t) => (
        <span
          key={t}
          className={`rounded px-2 py-1 ${t === vue.tempsCourant
            ? 'bg-pigment-teinte font-semibold text-pigment'
            : 'text-muet'}`}
        >
          {LIBELLE[t] ?? t}
        </span>
      ))}
    </nav>
  )
}

// ── L'attente : un ÉTAT EXPLICITE, jamais un écran muet ─────────────────────

function Attente({ vue }: { vue: VueDuDeroule }) {
  const router = useRouter()
  const [etat, setEtat] = useState(vue.attente)

  useEffect(() => {
    if (!etat.enCours) return
    const id = setInterval(async () => {
      const frais = await actionEtatDeLAttente(vue.depotId)
      if (!frais) return
      setEtat((v) => ({ ...v, enCours: frais.enCours, echecDefinitif: frais.echecDefinitif,
        message: frais.message }))
      if (frais.retourPret || frais.echecDefinitif) router.refresh()
    }, SONDAGE_MS)
    return () => clearInterval(id)
  }, [etat.enCours, vue.depotId, router])

  if (etat.echecDefinitif) {
    return (
      <Encart ton="attention">
        <p className="text-sm text-encre">
          <strong>Ton retour n’a pas pu être préparé.</strong> Préviens ton professeur — ton
          travail est enregistré, rien n’est perdu.
        </p>
        {etat.message && <p className="mt-1 text-xs text-muet">{etat.message}</p>}
      </Encart>
    )
  }
  if (!etat.enCours) return null
  return (
    <Encart>
      <p className="text-sm text-encre">
        <strong>Ton retour est en préparation.</strong> Cet écran se met à jour tout seul — tu
        n’as rien à recharger.
      </p>
    </Encart>
  )
}

// ── La micro-question ───────────────────────────────────────────────────────

function MicroQuestion({ depotId }: { depotId: string }) {
  const [fait, setFait] = useState(false)
  if (fait) return null
  return (
    <Encart>
      <p className="text-sm text-encre">Tu y es depuis un moment — pause, ou difficulté ?</p>
      <div className="mt-2 flex gap-2">
        {([['pause', 'J’ai fait une pause'], ['difficulte', 'Je bute']] as const).map(
          ([v, libelle]) => (
            <button
              key={v} type="button"
              onClick={() => { void actionMicroQuestion(depotId, v); setFait(true) }}
              className="rounded border border-bordure-bouton px-3 py-1 text-sm text-encre-douce"
            >
              {libelle}
            </button>
          ))}
      </div>
      {/* ⚠️ « Jamais notée, jamais renvoyée comme jugement » (`02-` §2.4). */}
      <p className="mt-2 text-xs text-muet">Ça ne compte pas dans ton travail.</p>
    </Encart>
  )
}

// ── Le dépliable, qui compte une aide ───────────────────────────────────────

/**
 * ⭐ Chaque dépliage compte pour `aide_consommee` (décision du PO, 22/08) —
 * mais **une seule fois** : rouvrir un panneau qu'on vient de fermer n'est pas
 * une seconde consultation.
 */
function Depliable({
  titre, depotId, aide, children,
}: { titre: string; depotId: string; aide: string; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false)
  const [compte, setCompte] = useState(false)
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <button
        type="button"
        onClick={() => {
          setOuvert((v) => !v)
          if (!compte) { void actionCompterUneAide(depotId, aide); setCompte(true) }
        }}
        className="font-marque text-sm uppercase tracking-wide text-muet-clair"
      >
        {ouvert ? '▾' : '▸'} {titre}
      </button>
      {ouvert && <div className="mt-3">{children}</div>}
    </section>
  )
}

function ContenuDemonstration(
  { contenu }: { contenu: VueDuDeroule['contenuDemonstration'] },
) {
  if (!contenu) {
    return <p className="text-sm text-muet">L’exemple n’est pas lisible.</p>
  }
  if (contenu.forme === 'exemple') {
    return <TexteBrut texte={contenu.texte} className="font-corps text-sm text-encre" />
  }
  if (contenu.forme === 'checklist') {
    return (
      <ul className="list-disc space-y-1 pl-5 text-sm text-encre">
        {contenu.points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    )
  }
  // Le modelage : « un brouillon commenté qui montre la genèse, ou deux plans
  // annotés à comparer » (`06-` §2). ⚠️ Ses volets sont des objets LIBRES — le
  // contrôle d'import n'en garantit que la forme (`{ volets: object[] }`), pas
  // les clés. On rend les deux qu'on sait nommer, et on ne devine pas les autres.
  return (
    <ol className="space-y-3 text-sm text-encre">
      {contenu.volets.map((v, i) => {
        const titre = typeof v.titre === 'string' ? v.titre : null
        const texte = typeof v.texte === 'string' ? v.texte : null
        return (
          <li key={i} className="rounded border border-bordure p-3">
            {titre && <p className="font-marque text-xs uppercase text-muet-clair">{titre}</p>}
            {texte && <p className="mt-1 whitespace-pre-wrap">{texte}</p>}
          </li>
        )
      })}
    </ol>
  )
}

export function Encart(
  { children, ton = 'info' }: { children: React.ReactNode; ton?: 'info' | 'attention' | 'ok' },
) {
  const cls = ton === 'attention' ? 'border-attention bg-attention-teinte'
    : ton === 'ok' ? 'border-ok bg-ok-teinte'
      : 'border-bordure bg-surface'
  return <div className={`rounded-lg border p-4 ${cls}`}>{children}</div>
}

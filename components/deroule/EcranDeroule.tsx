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
import { TexteBalise, TexteBrut, MateriauMarque } from './TexteBalise'
import { ChampDeRedaction } from './ChampDeRedaction'
import { CredenceSaisie } from './CredenceSaisie'
import { DesignationDansLeMateriau } from './DesignationDansLeMateriau'
import { GestesDeLaRemise } from './GestesDeLaRemise'
import { SeJuger } from './SeJuger'
import { RetourSegmente } from './RetourSegmente'
import type { VueDuDeroule } from '@/utils/deroule/vue'
import type { TelemetrieSaisie } from '@/utils/deroule/types'
import {
  actionOuvrir, actionEnregistrerBrouillon, actionRemettre, actionMicroQuestion,
  actionCompterUneAide, actionEtatDeLAttente, actionDesignation,
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
      {/* ⚠️ SUR UNE PAIRE, PAS DE CONSIGNE EN EN-TÊTE — trouvé au smoke élève du
          24/08. « Pour une paire il y a DEUX consignes, une pour chaque
          exercice » (Louis) : chaque cas porte déjà la sienne, plus bas. Les
          empiler ici les servait toutes les deux hors de leur cas — et avant le
          correctif d'`enTexte`, sous forme de JSON brut. On garde la section
          pour la durée, qui vaut pour la paire entière. */}
      <section className="rounded-lg border border-bordure bg-surface p-4">
        <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
          {vue.estUnePaire ? 'Deux cas, l’un après l’autre' : 'La consigne'}
        </h2>
        {vue.estUnePaire ? (
          <p className="mt-2 font-corps text-base leading-relaxed text-encre">
            Tu traites le premier cas, tu reçois sa correction, puis tu passes au second.
            {' '}<strong>Chacun porte sa propre consigne.</strong>
          </p>
        ) : (
          /* ⭐ Le balisage SE REND : « le gras est du SENS » (piège 36). */
          <p className="mt-2 font-corps text-base leading-relaxed text-encre">
            <TexteBalise jetons={vue.consigne} />
          </p>
        )}
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

      {/* ── ⭐⭐ C5-L2 — LE TEXTE D'AUTEUR, QUAND L'EXERCICE EN PORTE UN ────
          « Lecture formative, à la maison — Aletheia — ÉCRAN, y compris les
          analyses longues » (`06-` §1). Avant ce lot, l'élève lisait « explique
          cette phrase de Descartes » et ne voyait AUCUNE phrase de Descartes :
          l'écran servait le matériau de la BANQUE, jamais celui de l'instance.

          ⭐ Ce qui s'affiche est l'ENGLOBANT — « l'étendue réellement lue »
          (`02-` §6 B.1) — et la SÉLECTION du professeur est marquée dedans, du
          même geste que les candidats du cran 1 : ⛔ le texte n'est pas retouché
          d'un octet, la concaténation des segments EST la tranche.

          ⚠️ IL SE PLACE AVANT LES CAS, ET C'EST L'ORDRE DE LA LECTURE : on lit
          le texte, puis on répond à ce qu'on en demande. */}
      {vue.texteSupport && (
        <section className="rounded-lg border border-bordure bg-surface p-4">
          <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
            Le texte
          </h2>
          {(vue.texteSupport.auteur || vue.texteSupport.titre || vue.texteSupport.reference) && (
            <p className="mt-1 font-corps text-sm italic text-muet">
              {[vue.texteSupport.auteur, vue.texteSupport.titre, vue.texteSupport.reference]
                .filter(Boolean).join(' · ')}
            </p>
          )}
          <MateriauMarque
            segments={vue.texteSupport.segments}
            className="mt-3 rounded border border-bordure bg-parchemin-fonce p-3
                       font-corps text-base leading-relaxed text-encre"
          />
        </section>
      )}

      {/* ── TEMPS 2 — ÉCRIRE ───────────────────────────────────────────── */}
      {vue.cas.map((c, i) => (
        <div key={c.ordre} className="space-y-3">
          {/* ⚠️ C4-L15 — `c.materiau` est une LISTE DE SEGMENTS depuis ce lot, et
              une liste vide est VRAIE en JavaScript : sans `?.length`, un cas
              sans matériau ouvrirait une section vide. */}
          {(vue.estUnePaire || c.materiau?.length) && (
            <section className="rounded-lg border border-bordure bg-surface p-4">
              {vue.estUnePaire && (
                <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
                  {c.ordre === 1 ? 'Premier cas' : 'Un cas neuf, de la même famille'}
                </h2>
              )}
              <p className="mt-2 font-corps text-base leading-relaxed text-encre">
                <TexteBalise jetons={c.consigne} />
              </p>
              {/* ⭐⭐ C4-L15 — LE MATÉRIAU, ET CE QUE L'ÉCRAN Y MET EN ÉVIDENCE.
                  Au cran 1 les QUATRE candidats servis, la bonne réponse
                  comprise ; aux crans 3 et 5 le passage fautif, et lui seul ;
                  aux crans 4, 7 et 9 RIEN — « l'y trouver EST le travail »
                  (`02-` §5). ⚠️ Le découpage vient du serveur : le composant
                  n'a AUCUNE règle, et n'a jamais vu la version corrigée. */}
              {c.materiau && c.materiau.length > 0 && (
                c.designationDemandee ? (
                  /* ⭐ ITEM 77 — AUX CRANS 4, 7 ET 9, LE MATÉRIAU SE DÉSIGNE.
                     Il remplace l'affichage nu : le même texte, octet pour
                     octet, mais sélectionnable. ⛔ Le composant ne reçoit
                     AUCUNE cible — « l'écran ne bascule pas, le jugement
                     bascule » (`02-` §5) : il est le même sur les 320 cas, y
                     compris les 30 où il n'y a rien à trouver.
                     ⚠️ La `key` porte la zone stockée : c'est elle qui
                     réinitialise l'état quand le serveur change sous nous, et
                     c'est pourquoi le composant n'a pas d'effet de synchro.
                     ⭐ Il reste APRÈS la remise, gelé : l'élève relit sa
                     correction en voyant ce QU'IL avait désigné. Ce n'est pas
                     une fuite — c'est sa propre réponse. */
                  <div className="mt-3 rounded border border-bordure bg-parchemin-fonce p-3">
                    <DesignationDansLeMateriau
                      key={`${c.ordre}-${c.zoneDonnee?.join(':') ?? (c.designationDonnee ? 'rien' : 'vide')}`}
                      contenu={c.materiau.map((sg) => sg.texte).join('')}
                      zoneDonnee={c.zoneDonnee}
                      repondu={c.designationDonnee}
                      enregistrer={(zone) => actionDesignation(vue.depotId, c.ordre, zone)}
                      gele={!enRedactionV1}
                    />
                  </div>
                ) : (
                  <MateriauMarque
                    segments={c.materiau}
                    className="mt-3 rounded border border-bordure bg-parchemin-fonce p-3
                               font-corps text-sm text-encre"
                  />
                )
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

      {/* ── ⭐⭐ L'ÉTALON DES CRANS DE PRODUCTION — item 86 ──────────────────
          `02-` 6.0 §2.3.4 : « une production modèle : à quoi peut ressembler
          une bonne réponse ». ⛔ **La vue ne le rend qu'après la version
          finale** — servi plus tôt, il donnerait une réponse à recopier et le
          `delta_v1_vf` ne mesurerait plus rien. La garde est côté serveur
          (`etalonServi`, module pur, éprouvé) : ici on affiche, on ne décide pas.

          ⭐ Deux formes, une seule pièce. Au cran 2 `deplie` vaut `true` et le
          bloc est OUVERT — l'élève ne l'a pas demandé, il n'y a rien à compter.
          Au cran 6 il est REPLIÉ, et `aide="etalon"` fait compter le déroulé
          (`AIDES_COMPTEES`, `utils/deroule/depot`). Au cran 8 la vue rend
          `null` et rien ne s'affiche.

          ⚠️ Le titre ne dit pas « la bonne réponse » — « une production a
          plusieurs bonnes formes, et l'étalon en donne UNE, jamais la seule ».
          La phrase sous le texte le redit à l'élève, parce qu'un modèle posé nu
          se lit comme un corrigé. */}
      {vue.etalon && (
        <Depliable
          titre="Un exemple de ce qui était attendu"
          depotId={vue.depotId} aide="etalon" ouvertParDefaut={vue.etalon.deplie}
        >
          <TexteBrut texte={vue.etalon.texte} className="text-sm text-encre" />
          <p className="mt-2 text-xs text-encre/60">
            Ce n’est pas la seule bonne réponse : un devoir peut être réussi
            autrement. Sers-t’en pour voir ce qui était attendu, pas pour
            comparer mot à mot.
          </p>
        </Depliable>
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
/**
 * ⚠️ `ouvertParDefaut` OUVRE **ET** DÉSARME LE COMPTEUR, et les deux vont
 *    ensemble. Un bloc servi ouvert n'a pas été demandé : le compter ferait
 *    passer pour « aide consommée » ce que le dispositif a donné de lui-même,
 *    et `aide_consommee` (`01-` §11) cesserait de dire ce qu'il dit.
 * ⭐ C'est le cas de l'étalon au cran 2 — toujours montré — contre le cran 6,
 *    où l'élève le déroule et où ce geste, lui, compte (`02-` 6.0 §2.3.4).
 */
function Depliable({
  titre, depotId, aide, children, ouvertParDefaut = false,
}: { titre: string; depotId: string; aide: string; children: React.ReactNode
  ouvertParDefaut?: boolean }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  const [compte, setCompte] = useState(ouvertParDefaut)
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

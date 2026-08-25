'use client'

// LE RATTACHEMENT AU COURS — **QUATRE** états depuis C4-L16 (format 1.3), et
// l'absence a un sens FORT : « elle ne dit pas "pas encore rempli", elle dit
// "JAMAIS SERVI" » (08- §2).
//
// « L'import ne vérifie que la FORME : il ne peut pas savoir qu'un cours
//   existe — L'APPARIEMENT SE FAIT ICI » (piège 15). Et le LIVRE du plan de
//   lecture suit le même régime : tant qu'il n'est pas apparié, le texte se
//   tient pour non servable (piège 16).
//
// ⭐⭐ C4-L16 — LE QUATRIÈME ÉTAT RETOURNE LE SENS DU TRI, ET L'ÉCRAN DOIT LE
//   DIRE. Aux trois premiers, c'est le MATÉRIAU qui désigne ses cours ; au
//   quatrième, c'est le COURS qui déclare ce qu'il traite (à
//   `/prof/scriptorium`), et le matériau s'y rattache seul.
//   ⛔ **UN SUJET EN « notions » QU'AUCUN COURS NE RÉCLAME EST EXACTEMENT AUSSI
//   MUET QU'UN SUJET SANS RATTACHEMENT — et bien plus trompeur, parce qu'il
//   PARAÎT rattaché.** D'où le compte À PART, et les notions ORPHELINES nommées.
//   ⚠️ « Orpheline » se dit sur TOUS LES COURS, jamais sur les cours VUS :
//   « aucun cours ne déclare cette notion » est un fait de CONCEPTION ; « le
//   cours n'a pas encore été vu » est un fait de ROUTAGE, et c'est le filtre,
//   qui n'est pas à ce lot. Les confondre ferait crier une alerte CHAQUE DÉBUT
//   DE SEMESTRE, quand rien n'a été vu et que tout est pourtant déclaré.

import { useActionState, useMemo } from 'react'
import { rattacherAuCours, apparierLivre, type RetourCorpus } from './actions'
import { notionsOrphelines } from '@/utils/fabrique/notions'

interface Declare { nom: string; coursId: string | null }
export interface LigneTexte {
  id: string; idImport: string | null; libelle: string
  coursEtat: string; declares: Declare[]
  /** ⭐ C4-L16 — ce que l'entrée met en jeu ; lu par le routeur quand
   *  `coursEtat` vaut `notions`. */
  notions: string[]
  planLivre: string | null; planLivreId: string | null; planSemaine: number | null
}
export interface LigneSujet {
  id: string; idImport: string | null; libelle: string
  coursEtat: string; declares: Declare[]
  notions: string[]
}
/** Un cours de la bibliothèque, et CE QU'IL DÉCLARE TRAITER. */
interface CoursDuScriptorium { id: string; titre: string; notions: string[] }

function FormeCours({ banque, ligne, cours }: {
  banque: 'textes' | 'sujets'
  ligne: { id: string; coursEtat: string; declares: Declare[]; notions: string[] }
  cours: CoursDuScriptorium[]
}) {
  const [retour, action, enCours] = useActionState<RetourCorpus | null, FormData>(rattacherAuCours, null)
  // ⭐ C4-L16 — en `notions`, l'entrée ne désigne AUCUN cours : ce sont les
  //   cours qui la réclament. Les `<select>` d'appariement n'ont donc rien à
  //   apparier, et les afficher ferait croire à un geste qui reste à faire.
  const parNotions = ligne.coursEtat === 'notions'
  const orphelines = useMemo(
    () => notionsOrphelines(ligne.notions, cours.flatMap((c) => c.notions)),
    [ligne.notions, cours])
  return (
    <form action={action} className="space-y-1.5">
      <input type="hidden" name="banque" value={banque} />
      <input type="hidden" name="id" value={ligne.id} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          key={ligne.coursEtat}
          name="cours_etat" defaultValue={ligne.coursEtat}
          className="rounded-md border border-bordure-bouton bg-parchemin px-2 py-1 font-ui text-sm text-encre"
        >
          <option value="aucun">rien de déclaré — jamais servable</option>
          <option value="generique">generique — servable en tout temps</option>
          <option value="liste">un ou plusieurs cours</option>
          {/* ⭐ C4-L16 — LE QUATRIÈME ÉTAT. Le libellé dit ce qu'il VEUT DIRE,
              comme les trois autres : c'est là que le professeur comprend que
              le tri s'est retourné. */}
          <option value="notions">notions — servable dès qu&apos;un cours déclare l&apos;une d&apos;elles</option>
        </select>
        {parNotions ? null : ligne.declares.length > 0
          ? ligne.declares.map((d) => (
            <label key={d.nom} className="flex items-center gap-1 font-ui text-xs text-encre-douce">
              <code>{d.nom}</code> →
              {/* ⚠️ LE NOM DÉCLARÉ ET LE COURS CHOISI VOYAGENT ENSEMBLE, dans une
                  seule valeur. Deux listes appariées par index se décalaient dès
                  que Postgres réordonnait les lignes.
                  ⚠️ Et le couple s'encode en JSON, pas avec un séparateur
                  invisible : un caractère NUL ne SURVIT PAS au transport du
                  formulaire — il arrive remplacé, et le découpage part de
                  travers sans que rien ne le dise. */}
              <select
                key={d.coursId ?? 'nul'}
                name="couple" defaultValue={JSON.stringify([d.nom, d.coursId ?? ''])}
                className="rounded-md border border-bordure-bouton bg-parchemin px-1.5 py-0.5 text-xs"
              >
                <option value={JSON.stringify([d.nom, ''])}>— pas encore apparié —</option>
                {cours.map((c) => (
                  <option key={c.id} value={JSON.stringify([d.nom, c.id])}>{c.titre}</option>
                ))}
              </select>
            </label>
          ))
          : (
            <select
              name="cours_id" defaultValue=""
              className="rounded-md border border-bordure-bouton bg-parchemin px-1.5 py-0.5 font-ui text-xs"
            >
              <option value="">— choisir un cours —</option>
              {cours.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
            </select>
          )}
        <button
          type="submit" disabled={enCours}
          className="rounded-md bg-bouton px-2.5 py-1 font-ui text-xs text-surface disabled:opacity-50"
        >
          Rattacher
        </button>
      </div>

      {/* ⭐⭐ C4-L16 — CE QUE L'ENTRÉE RÉCLAME, ET CE QUE PERSONNE NE LUI DONNE.
          « Un sujet en "notions" qu'aucun cours ne réclame est exactement aussi
          muet qu'un sujet sans rattachement — et bien plus trompeur, parce
          qu'il PARAÎT rattaché. » L'écran affichait les sujets par leur
          `enonce` et ne montrait pas leurs `notions` : il le fallait. */}
      {parNotions && (
        <div className="flex flex-wrap items-center gap-1 font-ui text-xs">
          {ligne.notions.length === 0 ? (
            <span className="text-attention">
              ⚠️ aucune notion déclarée — cette entrée ne sera JAMAIS servable, et rien d&apos;autre ne le dirait.
            </span>
          ) : (
            <>
              <span className="text-muet">réclame :</span>
              {ligne.notions.map((n) => {
                const seule = orphelines.includes(n)
                return (
                  <span
                    key={n}
                    title={seule
                      ? 'Aucun cours de la bibliothèque ne déclare cette notion — à déclarer sur un cours, dans le Scriptorium.'
                      : 'Au moins un cours déclare cette notion.'}
                    className={`rounded-full px-1.5 py-0.5 ${seule
                      ? 'bg-attention-teinte text-attention'
                      : 'bg-ok-teinte text-ok'}`}
                  >
                    {n}{seule ? ' — orpheline' : ''}
                  </span>
                )
              })}
            </>
          )}
        </div>
      )}

      {retour && (
        <div className="space-y-0.5">
          <p className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</p>
          {/* Le détail que l'action renvoie : sans lui, « l'appariement a échoué »
              n'apprend rien à personne. */}
          {(retour.blocages ?? []).map((b, i) => (
            <p key={i} className="font-ui text-xs text-attention">· {b}</p>
          ))}
        </div>
      )}
    </form>
  )
}

function FormeLivre({ ligne, livres }: {
  ligne: LigneTexte; livres: Array<{ id: string; titre: string }>
}) {
  const [retour, action, enCours] = useActionState<RetourCorpus | null, FormData>(apparierLivre, null)
  if (!ligne.planLivre) {
    return (
      <p className="font-ui text-xs text-muet">
        Hors livre — le texte ne porte aucune semaine, et le non-spoiler n&apos;a rien à comparer sur lui.
      </p>
    )
  }
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={ligne.id} />
      <div className="flex flex-wrap items-center gap-2 font-ui text-xs text-encre-douce">
        <span>
          plan de lecture : <code>{ligne.planLivre}</code> · semaine <strong>{ligne.planSemaine}</strong>
          {' '}(l&apos;ordinal de découpage du livre, jamais le numéro affiché à l&apos;élève)
        </span>
        <select
          key={ligne.planLivreId ?? 'nul'}
          name="livre_id" defaultValue={ligne.planLivreId ?? ''}
          className="rounded-md border border-bordure-bouton bg-parchemin px-1.5 py-0.5"
        >
          <option value="">— pas encore apparié : non servable —</option>
          {livres.map((l) => <option key={l.id} value={l.id}>{l.titre}</option>)}
        </select>
        <button
          type="submit" disabled={enCours}
          className="rounded-md bg-bouton px-2.5 py-1 text-surface disabled:opacity-50"
        >
          Apparier
        </button>
      </div>
      {retour && (
        <p className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</p>
      )}
    </form>
  )
}

export default function Rattachement({ textes, sujets, cours, livres }: {
  textes: LigneTexte[]; sujets: LigneSujet[]
  cours: CoursDuScriptorium[]
  livres: Array<{ id: string; titre: string }>
}) {
  const sans = textes.filter((t) => t.coursEtat === 'aucun').length
    + sujets.filter((s) => s.coursEtat === 'aucun').length

  // ── ⭐⭐ C4-L16 — LE COMPTE À PART, ET LES NOTIONS ORPHELINES NOMMÉES ──────
  // « L'écran de la banque doit compter ces sujets-là À PART, et NOMMER les
  //   notions orphelines : "quatre sujets attendent une notion qu'aucun cours ne
  //   déclare : la connaissance, le langage" » (`07-` §2, C4-L16).
  // ⚠️ CE COMPTE NE SE MÊLE PAS À L'AGRÉGÉ AU-DESSUS, et c'est le fond du geste :
  //   une entrée en `notions` A un rattachement — elle n'entre pas dans le
  //   « sans rattachement ». Elle est muette pour une AUTRE raison, qui se
  //   répare à un AUTRE écran (la bibliothèque des cours du Scriptorium).
  const { enAttente, orphelines, sansNotion } = useMemo(() => {
    const declareesParLesCours = cours.flatMap((c) => c.notions)
    const parNotions = [
      ...textes.filter((t) => t.coursEtat === 'notions'),
      ...sujets.filter((s) => s.coursEtat === 'notions'),
    ]
    // ⛔ « Sans notion du tout » est un TROISIÈME cas, et il ne se confond pas
    //   avec « orpheline » : là, il n'y a rien à déclarer sur un cours, il faut
    //   corriger l'entrée elle-même (ou la redéposer). Le contrôle d'import le
    //   signale déjà ; l'écran le redit, parce que le signalement disparaît.
    const sansNotion = parNotions.filter((e) => e.notions.length === 0).length
    // Une entrée est EN ATTENTE si AUCUNE de ses notions n'est déclarée par un
    // cours : il suffit d'une seule pour qu'elle devienne servable.
    let enAttente = 0
    const toutes: string[] = []
    for (const e of parNotions) {
      if (e.notions.length === 0) continue
      const orph = notionsOrphelines(e.notions, declareesParLesCours)
      if (orph.length === e.notions.length) enAttente += 1
      toutes.push(...orph)
    }
    return { enAttente, sansNotion, orphelines: notionsOrphelines(toutes, declareesParLesCours) }
  }, [textes, sujets, cours])

  return (
    <div className="space-y-4">
      {/* LE NEUVIÈME SIGNALEMENT — « en UNE SEULE LIGNE AGRÉGÉE, qui DISPARAÎT
          dès que le professeur a trié » (08- §7.3). */}
      {sans > 0 && (
        <p className="rounded-lg border border-info bg-info-teinte px-3 py-2 font-ui text-sm text-encre">
          <strong>{sans} entrée(s) sans rattachement au cours</strong> — aucune ne sera servie tant
          qu&apos;il n&apos;est pas déclaré. L&apos;absence ne dit pas « pas encore rempli », elle dit
          {' '}« jamais servi ».
        </p>
      )}

      {/* ⭐ C4-L16 — LE COMPTE À PART. Il disparaît dès qu'un cours déclare la
          notion attendue — comme l'agrégé disparaît dès que le professeur a
          trié. ⚠️ « Orpheline » se dit sur TOUS les cours, jamais sur les cours
          VUS : le second est un fait de routage, et le filtre n'est pas de ce
          lot. Les confondre ferait crier une alerte chaque début de semestre. */}
      {enAttente > 0 && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 font-ui text-sm text-encre">
          <strong>
            {`${enAttente} entrée(s) attendent une notion qu’aucun cours ne déclare`}
          </strong>
          {orphelines.length > 0 && (
            <>
              {' : '}
              {/* ⚠️ Les orphelines se LISENT — d'où le séparateur explicite :
                  « la connaissance, le langage », comme la source l'écrit. Sans
                  lui, deux notions se collent en une seule chaîne illisible. */}
              {orphelines.map((n, i) => (
                <span key={n}>{i > 0 ? ', ' : ''}<code>{n}</code></span>
              ))}
            </>
          )}
          {'. Elles '}<strong>paraissent rattachées</strong>{' et sont pourtant aussi muettes '}
          qu&apos;une entrée sans rattachement. Déclare ces notions sur un cours —{' '}
          <a href="/prof/scriptorium?vue=cours" className="underline">bibliothèque des cours</a>{' '}
          — et elles deviendront servables sans re-import.
        </p>
      )}

      {sansNotion > 0 && (
        <p className="rounded-lg border border-retard bg-retard-teinte px-3 py-2 font-ui text-sm text-encre">
          <strong>
            {`${sansNotion} entrée(s) en « notions » n’en déclarent aucune`}
          </strong>
          {' — aucun cours ne pourra jamais en réclamer une, et rien d’autre ne le dirait. '}
          Corrige l&apos;entrée, ou change son état de rattachement.
        </p>
      )}

      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">Textes</h2>
        {textes.length === 0 && <p className="font-ui text-sm text-muet">Aucun texte.</p>}
        <ul className="divide-y divide-bordure">
          {textes.map((t) => (
            <li key={t.id} className="space-y-1.5 py-3">
              <p className="font-ui text-sm text-encre">
                {t.libelle} <span className="text-muet">· <code>{t.idImport}</code></span>
              </p>
              <FormeCours banque="textes" ligne={t} cours={cours} />
              <FormeLivre ligne={t} livres={livres} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">Sujets</h2>
        {sujets.length === 0 && <p className="font-ui text-sm text-muet">Aucun sujet.</p>}
        <ul className="divide-y divide-bordure">
          {sujets.map((s) => (
            <li key={s.id} className="space-y-1.5 py-3">
              <p className="font-ui text-sm text-encre">
                {s.libelle} <span className="text-muet">· <code>{s.idImport}</code></span>
              </p>
              <FormeCours banque="sujets" ligne={s} cours={cours} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

'use client'

// LA FILE DE VALIDATION — « la file est un ÉCRAN, le fichier d'import est de la
// DONNÉE » (08- §0). Elle montre pour chaque entrée ce qu'elle est, et, si elle
// est BLOQUÉE, son motif et ce qui la débloque. « Une entrée bloquée ne se
// valide pas tant qu'elle l'est » — et la validation en masse ne la passe JAMAIS.

import { useActionState, useState } from 'react'
import { validerEnFile, retirerEntree, type RetourCorpus } from './actions'

export interface EntreeFile {
  id: string
  idImport: string | null
  libelle: string
  statut: string
  bloque: boolean
  blocages: string[]
  signalements?: string[]
  /** Ce que l'entrée EST, en clair — pour ne pas valider un identifiant. */
  detail?: string
  /** Où aller voir le détail, quand l'entrée a un écran à elle. */
  lien?: string
  /**
   * Le FICHIER d'où l'entrée vient — pas son `id_import`, qui étiquette la
   * ligne, mais le dépôt qui l'a portée. C'est lui qui dit la NATURE : une
   * entrée bloquée venue de `import_bloque.json` est un décor de recette, et
   * elle restera bloquée à dessein ; sans lui, elle ressemble à un geste qui
   * attend le professeur — et il ira le chercher pour rien.
   */
  fichier?: string | null
}

const ATTENTE: Record<string, string> = {
  textes: 'a_valider', sujets: 'a_valider', materiaux: 'a_valider',
  demonstrations: 'a_valider', exercices: 'a_concevoir',
}
const ARRIVEE: Record<string, string> = {
  textes: 'valide', sujets: 'valide', materiaux: 'valide',
  demonstrations: 'valide', exercices: 'concu',
}

/**
 * POURQUOI CETTE PUCE NE SE COCHE PAS — et il y a TROIS causes, pas une.
 *
 * ⚠️ L'écran n'en disait qu'une. `disabled` valait `bloque || statut !== ATTENTE`,
 *    et seul le premier terme se voyait : une entrée DÉJÀ VALIDÉE et une entrée
 *    SORTIE DE LA FILE (un exercice `assigne`, un `clos`) rendaient toutes deux
 *    une puce morte, sans un mot. Sur onze entrées dont une seule était cochable,
 *    l'écran ressemblait à une panne. « Un écran qui refuse dit pourquoi. »
 */
function motifInerte(e: EntreeFile, banque: string): string | null {
  if (e.bloque) return null // le motif est dit en toutes lettres plus bas
  if (e.statut === ARRIVEE[banque]) return 'déjà validée — rien à faire ici'
  if (e.statut !== ATTENTE[banque]) {
    return `statut « ${e.statut} » : cette entrée est sortie de la file, elle ne s'y valide plus`
  }
  return null
}

function Banque({ banque, titre, entrees, retirable }: {
  banque: string; titre: string; entrees: EntreeFile[]; retirable: boolean
}) {
  const [retour, action, enCours] = useActionState<RetourCorpus | null, FormData>(validerEnFile, null)
  const [retourRetrait, actionRetrait] = useActionState<RetourCorpus | null, FormData>(retirerEntree, null)
  const [coches, setCoches] = useState<Set<string>>(new Set())
  // ⭐ LA FILE MONTRE CE QUI ATTEND UN GESTE. Le reste — validé, ou sorti de la
  //    file — se replie plus bas : il ne disparaît pas, il cesse d'encombrer.
  const enAttente = entrees.filter((e) => e.statut === ATTENTE[banque])
  const reglees = entrees.filter((e) => e.statut !== ATTENTE[banque])
  const passables = enAttente.filter((e) => !e.bloque)

  const bascule = (id: string) => setCoches((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  return (
    <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-titre text-lg text-encre">{titre}</h2>
        <p className="font-ui text-xs text-muet">
          {enAttente.length} en attente · {entrees.length - enAttente.length} validée(s)
          {enAttente.length - passables.length > 0
            && <> · <span className="text-attention">{enAttente.length - passables.length} bloquée(s)</span></>}
        </p>
      </div>

      {entrees.length === 0 && <p className="font-ui text-sm text-muet">Aucune entrée.</p>}

      {entrees.length > 0 && (
        <>
          {/* La liste vit HORS du formulaire de validation : chaque « retirer »
              est son propre formulaire, et deux actions serveur ne se disputent
              pas l'attribut `name` d'un même bouton. */}
          <ul className="divide-y divide-bordure">
            {enAttente.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start gap-2 py-2">
                <input
                  type="checkbox"
                  checked={coches.has(e.id)} onChange={() => bascule(e.id)}
                  // « Une entrée bloquée NE SE VALIDE PAS tant qu'elle l'est. »
                  disabled={e.bloque || e.statut !== ATTENTE[banque]}
                  className="mt-1"
                  aria-label={`Valider ${e.libelle}`}
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-ui text-sm text-encre">
                    {e.lien
                      ? <a href={e.lien} className="underline">{e.libelle}</a>
                      : e.libelle}
                    {e.idImport && <span className="text-muet"> · <code>{e.idImport}</code></span>}
                    {e.fichier && <span className="text-muet"> · déposée par <code>{e.fichier}</code></span>}
                  </p>
                  {/* ⭐ CE QUE L'ENTRÉE EST. « argument · cran 2 · maison » nomme un
                      gabarit, pas un exercice : sans sa consigne, le professeur
                      valide un identifiant. */}
                  {e.detail && (
                    <p className="font-ui text-sm text-encre-douce">{e.detail}</p>
                  )}
                  <p className="font-ui text-xs">
                    <span className={e.statut === ARRIVEE[banque] ? 'text-ok' : 'text-muet'}>
                      {e.statut}
                    </span>
                    {e.bloque && <span className="text-attention"> · bloquée</span>}
                    {motifInerte(e, banque) && (
                      <span className="text-muet"> · {motifInerte(e, banque)}</span>
                    )}
                  </p>
                  {e.blocages.map((b, i) => (
                    <p key={i} className="font-ui text-xs text-attention">
                      {b} — <em>ce qui la débloque : valider la référence du texte visé, ou trancher.</em>
                    </p>
                  ))}
                  {(e.signalements ?? []).map((s, i) => (
                    <p key={i} className="font-ui text-xs text-info">{s}</p>
                  ))}
                </div>
                {retirable && e.statut !== ARRIVEE[banque] && (
                  <form action={actionRetrait}>
                    <input type="hidden" name="banque" value={banque} />
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-bordure-bouton px-2 py-0.5 font-ui text-xs text-muet"
                    >
                      retirer
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          {enAttente.length === 0 && (
            <p className="font-ui text-sm text-muet">
              Rien en attente dans cette banque.
            </p>
          )}

          {/* ⭐ CE QUI NE DEMANDE PLUS RIEN SE REPLIE. La file listait LA BANQUE
              ENTIÈRE, validées comprises : sur onze entrées, UNE SEULE était
              cochable, et l'écran ressemblait à une panne. Ce qui attend un
              geste reste au-dessus ; le reste est là, consultable, et ne se
              met plus en travers. */}
          {reglees.length > 0 && (
            <details className="rounded-md border border-bordure bg-parchemin/40 px-3 py-2">
              <summary className="cursor-pointer font-ui text-sm text-encre-douce">
                {reglees.length} entrée(s) qui ne demandent plus rien
                <span className="text-muet"> — validées, ou sorties de la file</span>
              </summary>
              <ul className="mt-2 divide-y divide-bordure">
                {reglees.map((e) => (
                  <li key={e.id} className="py-1.5 font-ui text-sm">
                    <span className="text-encre-douce">
                      {e.lien ? <a href={e.lien} className="underline">{e.libelle}</a> : e.libelle}
                    </span>
                    {e.idImport && <span className="text-muet"> · <code>{e.idImport}</code></span>}
                    {e.fichier && <span className="text-muet"> · <code>{e.fichier}</code></span>}
                    <span className="text-muet"> · {motifInerte(e, banque) ?? e.statut}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <form action={action} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="banque" value={banque} />
            {[...coches].map((id) => <input key={id} type="hidden" name="id" value={id} />)}
            <button
              type="submit" disabled={enCours || coches.size === 0}
              className="rounded-md bg-bouton px-3 py-1 font-ui text-sm text-surface disabled:opacity-50"
            >
              Valider la sélection ({coches.size})
            </button>
            <button
              type="button"
              onClick={() => setCoches(new Set(passables.map((e) => e.id)))}
              className="rounded-md border border-bordure-bouton px-3 py-1 font-ui text-sm text-encre-douce"
            >
              Tout prendre ({passables.length}) — les bloquées restent dehors
            </button>
          </form>

          {(retour ?? retourRetrait) && (
            <div className="space-y-1">
              <p className={`font-ui text-sm ${(retour ?? retourRetrait)!.ok ? 'text-ok' : 'text-retard'}`}>
                {(retour ?? retourRetrait)!.message}
              </p>
              {((retour ?? retourRetrait)!.blocages ?? []).map((b, i) => (
                <p key={i} className="font-ui text-xs text-attention">{b}</p>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default function FileDeValidation({
  textes, sujets, materiaux, exercices, demonstrations,
}: Record<'textes' | 'sujets' | 'materiaux' | 'exercices' | 'demonstrations', EntreeFile[]>) {
  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-bordure bg-parchemin px-3 py-2 font-ui text-sm text-encre-douce">
        Chaque entrée importée attend <strong>inactive</strong> — ni assignée ni servie. Elle se
        valide <strong>en masse ou une à une</strong>. Une entrée <strong>bloquée</strong> y attend
        en plus la levée de son blocage, et <strong>la validation en masse ne la passe jamais</strong>.
        Pour un exercice, <em>la validation est le geste de conception</em> : il naît
        {' '}<code>a_concevoir</code> et passe <code>concu</code>.
      </p>
      <Banque banque="textes" titre="Textes" entrees={textes} retirable />
      <Banque banque="sujets" titre="Sujets" entrees={sujets} retirable />
      <Banque banque="materiaux" titre="Matériaux fabriqués" entrees={materiaux} retirable />
      <Banque banque="exercices" titre="Exercices" entrees={exercices} retirable={false} />
      <Banque banque="demonstrations" titre="Démonstrations" entrees={demonstrations} retirable />
    </div>
  )
}

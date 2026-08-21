'use client'

// LE RATTACHEMENT AU COURS — trois états, et l'absence a un sens FORT :
// « elle ne dit pas "pas encore rempli", elle dit "JAMAIS SERVI" » (08- §2).
//
// « L'import ne vérifie que la FORME : il ne peut pas savoir qu'un cours
//   existe — L'APPARIEMENT SE FAIT ICI » (piège 15). Et le LIVRE du plan de
//   lecture suit le même régime : tant qu'il n'est pas apparié, le texte se
//   tient pour non servable (piège 16).

import { useActionState } from 'react'
import { rattacherAuCours, apparierLivre, type RetourCorpus } from './actions'

interface Declare { nom: string; coursId: string | null }
export interface LigneTexte {
  id: string; idImport: string | null; libelle: string
  coursEtat: string; declares: Declare[]
  planLivre: string | null; planLivreId: string | null; planSemaine: number | null
}
export interface LigneSujet {
  id: string; idImport: string | null; libelle: string
  coursEtat: string; declares: Declare[]
}

function FormeCours({ banque, ligne, cours }: {
  banque: 'textes' | 'sujets'
  ligne: { id: string; coursEtat: string; declares: Declare[] }
  cours: Array<{ id: string; titre: string }>
}) {
  const [retour, action, enCours] = useActionState<RetourCorpus | null, FormData>(rattacherAuCours, null)
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
        </select>
        {ligne.declares.length > 0
          ? ligne.declares.map((d) => (
            <label key={d.nom} className="flex items-center gap-1 font-ui text-xs text-encre-douce">
              <code>{d.nom}</code> →
              <select
                key={d.coursId ?? 'nul'}
                name="cours_id" defaultValue={d.coursId ?? ''}
                className="rounded-md border border-bordure-bouton bg-parchemin px-1.5 py-0.5 text-xs"
              >
                <option value="">— pas encore apparié —</option>
                {cours.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
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
      {retour && (
        <p className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</p>
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
  cours: Array<{ id: string; titre: string }>
  livres: Array<{ id: string; titre: string }>
}) {
  const sans = textes.filter((t) => t.coursEtat === 'aucun').length
    + sujets.filter((s) => s.coursEtat === 'aucun').length
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

'use client'

// ============================================================================
// C5 · L1 — LE DÉPÔT D'UN TEXTE, HORS FICHIER D'IMPORT.
// ----------------------------------------------------------------------------
// DEUX VOIES, ET UN SEUL DOMICILE :
//   · LE PONT — un texte DÉJÀ à la bibliothèque du Scriptorium reçoit son
//     identité de fabrique. Aucune copie n'est faite : c'est la même ligne de
//     `scriptorium_contenus` qui sert.
//   · LA SAISIE — un texte neuf entre au corpus du Scriptorium, comme un texte
//     importé, puis reçoit la même identité.
//
// ⛔ « Jamais une seconde table de textes » : les deux voies écrivent là où
//    l'import écrit, ou n'écrivent pas.
//
// ⚠️ LE PLAN DE LECTURE EST UN COUPLE — le livre ET la séance, jamais l'un sans
//    l'autre (`CHECK` `textes_plan_couple_chk`). Et la séance est L'ORDINAL DE
//    DÉCOUPAGE DU LIVRE, la même échelle que la position de l'élève, comparée par
//    égalité : ce n'est ni la semaine du parcours de la classe, ni le numéro
//    affiché à l'élève (`07-` §1.1).
// ============================================================================

import { useActionState, useState } from 'react'
import { deposerTexte, adopterContenu } from './actions'
import type { ContenuAAdopter, RetourTexte } from './types'

const CHAMP = 'rounded-md border border-bordure-bouton bg-parchemin px-2 py-1 font-ui text-sm text-encre'
const ETAGE = 'rounded-xl border border-bordure bg-surface p-4 space-y-3'

function Plan({ livres }: { livres: Array<{ id: string; titre: string }> }) {
  const [livre, setLivre] = useState('')
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-0.5">
          <span className="block font-ui text-xs text-muet">
            plan de lecture — le livre <em>(facultatif)</em>
          </span>
          <select name="plan_livre_id" value={livre} onChange={(e) => setLivre(e.target.value)}
            className={CHAMP}>
            <option value="">— hors livre —</option>
            {livres.map((l) => <option key={l.id} value={l.id}>{l.titre}</option>)}
          </select>
        </label>
        <label className="space-y-0.5">
          <span className="block font-ui text-xs text-muet">
            la séance <em>(l&apos;ordinal de découpage)</em>
          </span>
          <input type="number" min={0} step={1} name="plan_seance" className={`${CHAMP} w-28`}
            disabled={!livre} required={!!livre} />
        </label>
        <label className="space-y-0.5">
          <span className="block font-ui text-xs text-muet">rattachement au cours</span>
          <select name="cours_etat" defaultValue="aucun" className={CHAMP}>
            <option value="aucun">aucun — jamais servable tant que rien n&apos;est déclaré</option>
            <option value="generique">generique — servable en tout temps</option>
          </select>
        </label>
      </div>
      <p className="font-ui text-xs text-muet">
        Le couple <strong>{'{ livre, séance }'}</strong> ne se sépare jamais. La séance est
        {' '}<strong>l&apos;ordinal de découpage du livre</strong> — la même échelle que la position
        de lecture de l&apos;élève, comparée par égalité —, ni la semaine du parcours de la classe,
        ni le numéro affiché à l&apos;élève. Un texte hors livre n&apos;en porte aucun, et le
        non-spoiler n&apos;a alors rien à comparer.
      </p>
    </div>
  )
}

function Retour({ retour }: { retour: RetourTexte | null }) {
  if (!retour) return null
  return (
    <div role="status" className={`rounded-lg border px-3 py-2 space-y-1 ${
      retour.ok ? 'border-ok bg-ok-teinte' : 'border-retard bg-retard-teinte'}`}>
      <p className="font-ui text-sm text-encre">{retour.message}</p>
      {(retour.empechements ?? []).map((x, i) => (
        <p key={i} className="font-ui text-xs text-encre">⊘ {x}</p>
      ))}
      {(retour.notes ?? []).map((x, i) => (
        <p key={i} className="font-ui text-xs text-encre-douce">· {x}</p>
      ))}
    </div>
  )
}

export default function Depot({ aAdopter, livres }: {
  aAdopter: ContenuAAdopter[]
  livres: Array<{ id: string; titre: string }>
}) {
  const [rAdoption, actionAdoption, adoptionEnCours] =
    useActionState<RetourTexte | null, FormData>(adopterContenu, null)
  const [rDepot, actionDepot, depotEnCours] =
    useActionState<RetourTexte | null, FormData>(deposerTexte, null)
  const [contenuId, setContenuId] = useState('')

  return (
    <div className="space-y-4">
      {/* ── LE PONT ─────────────────────────────────────────────────────── */}
      <section className={ETAGE}>
        <h2 className="font-titre text-lg text-encre">
          Adopter un texte du Scriptorium ({aAdopter.length})
        </h2>
        <p className="font-ui text-xs text-encre-douce">
          Les textes d&apos;auteur <strong>vivent dans Scriptorium</strong>. Ceux-ci y sont déjà
          déposés mais n&apos;ont pas encore d&apos;identité de fabrique : les adopter ne fait
          {' '}<strong>aucune copie</strong> — c&apos;est la même ligne qui sert.
        </p>
        {aAdopter.length === 0 ? (
          <p className="font-ui text-sm text-muet">
            Tous les textes du Scriptorium ont déjà leur identité de fabrique.
          </p>
        ) : (
          <form action={actionAdoption} className="space-y-3">
            <select name="contenu_id" value={contenuId} required
              onChange={(e) => setContenuId(e.target.value)} className={`${CHAMP} w-full`}>
              <option value="">— choisir un texte du Scriptorium —</option>
              {aAdopter.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.auteur} — {c.titre} ({c.motsDuTexte} mots)
                </option>
              ))}
            </select>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-0.5">
                <span className="block font-ui text-xs text-muet">
                  auteur <em>(vide = celui du Scriptorium)</em>
                </span>
                <input name="auteur" className={CHAMP} />
              </label>
              <label className="space-y-0.5">
                <span className="block font-ui text-xs text-muet">
                  titre <em>(vide = celui du Scriptorium)</em>
                </span>
                <input name="titre" className={CHAMP} />
              </label>
              <label className="min-w-64 flex-1 space-y-0.5">
                <span className="block font-ui text-xs text-muet">
                  la localisation dans l&apos;œuvre — <em>livre, partie, page, édition</em>
                </span>
                <input name="reference" required className={`${CHAMP} w-full`} />
              </label>
            </div>
            <Plan livres={livres} />
            <button type="submit" disabled={adoptionEnCours}
              className="rounded-md bg-bouton px-4 py-2 font-ui text-sm text-surface disabled:opacity-50">
              {adoptionEnCours ? 'Écriture…' : 'Adopter ce texte'}
            </button>
          </form>
        )}
        <Retour retour={rAdoption} />
      </section>

      {/* ── LA SAISIE ───────────────────────────────────────────────────── */}
      <section className={ETAGE}>
        <h2 className="font-titre text-lg text-encre">Déposer un texte neuf</h2>
        <p className="font-ui text-xs text-encre-douce">
          Il entre au corpus du Scriptorium, comme un texte importé, et reçoit son identité de
          fabrique. <strong>Le dépôt dépose le texte, pas son appareil</strong> : un avertissement
          d&apos;édition ou une notice laissés dedans devront être couverts par un moment, et vous
          les verrez aussitôt à la lecture.
        </p>
        <form action={actionDepot} className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-0.5">
              <span className="block font-ui text-xs text-muet">auteur</span>
              <input name="auteur" required className={CHAMP} />
            </label>
            <label className="space-y-0.5">
              <span className="block font-ui text-xs text-muet">titre</span>
              <input name="titre" required className={CHAMP} />
            </label>
            <label className="min-w-64 flex-1 space-y-0.5">
              <span className="block font-ui text-xs text-muet">
                la localisation dans l&apos;œuvre — <em>livre, partie, page, édition</em>
              </span>
              <input name="reference" required className={`${CHAMP} w-full`} />
            </label>
          </div>
          <label className="block space-y-0.5">
            <span className="block font-ui text-xs text-muet">
              le texte — <em>tel qu&apos;il se lit ; l&apos;empreinte est celle du contenu exact</em>
            </span>
            <textarea name="contenu" required rows={10} className={`${CHAMP} w-full font-serif`} />
          </label>
          <Plan livres={livres} />
          <button type="submit" disabled={depotEnCours}
            className="rounded-md bg-bouton px-4 py-2 font-ui text-sm text-surface disabled:opacity-50">
            {depotEnCours ? 'Écriture…' : 'Déposer ce texte'}
          </button>
        </form>
        <Retour retour={rDepot} />
      </section>
    </div>
  )
}

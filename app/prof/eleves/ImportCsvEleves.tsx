'use client'

import { useMemo, useState } from 'react'
import { importerEleves, type LigneImport, type ResultatImport } from './actions'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sansAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Découpe une ligne CSV en cellules (gère les guillemets et "" échappés).
function decouper(ligne: string, delim: string): string[] {
  const cells: string[] = []
  let cur = ''
  let dansGuillemets = false
  for (let i = 0; i < ligne.length; i++) {
    const ch = ligne[i]
    if (dansGuillemets) {
      if (ch === '"') {
        if (ligne[i + 1] === '"') { cur += '"'; i++ } else { dansGuillemets = false }
      } else { cur += ch }
    } else if (ch === '"') {
      dansGuillemets = true
    } else if (ch === delim) {
      cells.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur)
  return cells.map((c) => c.trim())
}

type Analyse = { valides: LigneImport[]; nbInvalides: number; total: number }

function analyser(texte: string): Analyse {
  const sansBom = texte.replace(/^﻿/, '')
  const lignes = sansBom.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lignes.length === 0) return { valides: [], nbInvalides: 0, total: 0 }

  // Délimiteur : ';' s'il domine la 1re ligne, sinon ','.
  const premiere = lignes[0]
  const delim = (premiere.split(';').length > premiere.split(',').length) ? ';' : ','

  // En-tête ? (présence d'un libellé connu en 1re ligne)
  const tete = decouper(premiere, delim).map(sansAccents)
  const aEntete = tete.some((c) => c.includes('mail') || c.includes('courriel') || c.includes('prenom') || c === 'nom' || c.includes('nom'))

  let idxNom = 0, idxPrenom = 1, idxEmail = 2
  if (aEntete) {
    tete.forEach((c, i) => {
      if (c.includes('mail') || c.includes('courriel')) idxEmail = i
      else if (c.includes('prenom')) idxPrenom = i
      else if (c.includes('nom')) idxNom = i
    })
  }

  const corps = aEntete ? lignes.slice(1) : lignes
  const valides: LigneImport[] = []
  let nbInvalides = 0
  for (const l of corps) {
    const cells = decouper(l, delim)
    const nom = (cells[idxNom] ?? '').trim()
    const prenom = (cells[idxPrenom] ?? '').trim()
    const email = (cells[idxEmail] ?? '').trim()
    if (!EMAIL_REGEX.test(email) || !(nom || prenom)) { nbInvalides++; continue }
    valides.push({ nom, prenom, email })
  }
  return { valides, nbInvalides, total: corps.length }
}

export default function ImportCsvEleves() {
  const [ouvert, setOuvert] = useState(false)
  const [texte, setTexte] = useState('')
  const [chargement, setChargement] = useState(false)
  const [recap, setRecap] = useState<ResultatImport | null>(null)

  const analyse = useMemo(() => analyser(texte), [texte])

  async function lireFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setRecap(null)
    setTexte(await f.text())
  }

  function telechargerModele() {
    const contenu = 'nom;prénom;email\nDupont;Camille;camille.dupont@exemple.fr\nMartin;Alex;alex.martin@exemple.fr\n'
    const blob = new Blob(['﻿' + contenu], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modele-eleves.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importer() {
    if (analyse.valides.length === 0) return
    setChargement(true)
    setRecap(null)
    const r = await importerEleves(analyse.valides)
    setRecap(r)
    if (r.echecs.length === 0) setTexte('')
    setChargement(false)
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="font-ui text-sm text-encre border border-bordure rounded-lg px-4 py-2 bg-surface hover:bg-parchemin-fonce transition-colors"
      >
        Importer un CSV
      </button>
    )
  }

  return (
    <div className="w-full bg-surface border border-bordure rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-encre">Importer des élèves (CSV)</h3>
        <button
          type="button"
          onClick={telechargerModele}
          className="font-ui text-xs text-pigment hover:underline"
        >
          ↓ Télécharger un modèle
        </button>
      </div>

      <p className="text-xs text-muet">
        Colonnes attendues : <span className="text-encre">nom</span>, <span className="text-encre">prénom</span>, <span className="text-encre">email</span>
        {' '}(séparateur <code>;</code> ou <code>,</code> ; en-tête optionnel). Les comptes sont créés sans mot de passe communiqué :
        active-les ensuite par une invitation ou un mot de passe défini à la main.
      </p>

      <div>
        <label className="block text-sm font-medium text-encre-douce mb-1">Fichier CSV</label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={lireFichier}
          className="block w-full text-sm text-encre-douce file:mr-3 file:rounded-lg file:border file:border-bordure file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-encre hover:file:bg-parchemin-fonce"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-encre-douce mb-1">… ou coller le contenu</label>
        <textarea
          value={texte}
          onChange={(e) => { setTexte(e.target.value); setRecap(null) }}
          rows={5}
          placeholder={'nom;prénom;email\nDupont;Camille;camille@exemple.fr'}
          className="w-full px-3 py-2 border border-bordure rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
        />
      </div>

      {analyse.total > 0 && (
        <div className="border border-bordure rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-parchemin-fonce border-b border-bordure text-xs text-muet">
            {analyse.valides.length} élève{analyse.valides.length > 1 ? 's' : ''} prêt{analyse.valides.length > 1 ? 's' : ''} à importer
            {analyse.nbInvalides > 0 && <span className="text-retard"> · {analyse.nbInvalides} ligne{analyse.nbInvalides > 1 ? 's' : ''} ignorée{analyse.nbInvalides > 1 ? 's' : ''} (email invalide)</span>}
          </div>
          <ul className="max-h-40 overflow-y-auto divide-y divide-bordure">
            {analyse.valides.slice(0, 50).map((l, i) => (
              <li key={i} className="px-3 py-1.5 text-sm flex justify-between gap-3">
                <span className="text-encre truncate">{[l.prenom, l.nom].filter(Boolean).join(' ')}</span>
                <span className="text-muet truncate">{l.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recap && (
        <div className={`rounded-lg px-3 py-2 text-sm space-y-1 ${recap.echecs.length === 0 ? 'bg-ok-teinte border border-ok text-ok' : 'bg-attention-teinte border border-attention text-attention'}`}>
          <p>{recap.crees} compte{recap.crees > 1 ? 's' : ''} créé{recap.crees > 1 ? 's' : ''}.</p>
          {recap.echecs.length > 0 && (
            <ul className="list-disc pl-5 text-encre-douce">
              {recap.echecs.map((e, i) => (
                <li key={i}>Ligne {e.ligne} ({e.email}) : {e.raison}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={importer}
          disabled={chargement || analyse.valides.length === 0}
          className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {chargement ? 'Import…' : `Importer ${analyse.valides.length || ''}`.trim()}
        </button>
        <button
          type="button"
          onClick={() => { setOuvert(false); setTexte(''); setRecap(null) }}
          className="px-4 py-2 rounded-lg text-sm text-encre-douce hover:bg-parchemin-fonce transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

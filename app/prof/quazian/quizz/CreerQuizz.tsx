'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerQuizz } from './actions'

// Forme minimale d'une cible côté client (le module `utils/quazian-cibles` est
// `server-only` — on n'en importe rien, pas même son type).
interface CibleOption {
  id: string
  label: string
  genre: 'texte' | 'cours' | null
}

interface ClasseOption {
  id: string
  nom: string
}

// Q1 — conception depuis le plan d'évaluation : classe figée + exercice_id transmis.
interface ExerciceContexte {
  exerciceId: string
  classeId: string
  classeNom: string
  libelle: string
}
interface SemaineOption { lundi: string; label: string }

export function CreerQuizz({
  cibles, classes, contexte, semainesParClasse,
}: {
  cibles: CibleOption[]
  classes: ClasseOption[]
  contexte?: ExerciceContexte | null
  semainesParClasse?: Record<string, SemaineOption[]> // Q3 : semaines du plan validé par classe
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avis, setAvis] = useState<{ texte: string; quizId: string } | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [manualOpen, setManualOpen] = useState(false)
  const [classeSel, setClasseSel] = useState<string>('') // classe choisie (chemin direct, pour les semaines)
  // Ouvert si un contexte de plan est présent (deep-link ?exercice) OU si le prof l'a
  // ouvert manuellement. Dérivé (pas d'état) → réagit à un contexte qui ARRIVE en nav
  // CLIENT depuis l'encart « À concevoir » (le composant reste monté, un état initialisé
  // une fois resterait bloqué). Depuis Scriptorium = full load, contexte présent au montage.
  const open = !!contexte || manualOpen
  // Semaines à proposer (Q3) : uniquement hors deep-link, si la classe choisie a un plan validé.
  const semaines = !contexte ? (semainesParClasse?.[classeSel] ?? []) : []

  function toggleCible(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selected.length === 0) { setErreur('Sélectionne au moins un contenu.'); return }
    setLoading(true)
    setErreur(null)

    const fd = new FormData(e.currentTarget)
    selected.forEach((id) => fd.append('scope_cibles', id))

    const res = await creerQuizz(fd)
    if ('error' in res) {
      setErreur(res.error)
      setLoading(false)
      return
    }
    if (res.avis) {
      // Quiz créé mais avec un signal (Q3 : pas de plan / rattachement échoué) : on
      // affiche le message au lieu de naviguer, avec un lien pour ouvrir le quiz.
      setAvis({ texte: res.avis, quizId: res.quizId })
      setLoading(false)
      return
    }
    router.push(`/prof/quazian/quizz/${res.quizId}`)
  }

  if (!open) {
    return (
      <button
        onClick={() => setManualOpen(true)}
        className="w-full py-3 bg-bouton text-surface text-sm rounded-xl hover:opacity-90 transition-colors"
      >
        + Créer un nouveau quizz
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5 mb-6">
      {contexte && <input type="hidden" name="exercice_id" value={contexte.exerciceId} />}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-encre-douce">
          {contexte ? 'Concevoir le quiz planifié' : 'Nouveau quizz'}
        </h3>
        {!contexte && (
          <button type="button" onClick={() => setManualOpen(false)} className="text-muet hover:text-encre-douce text-xs">
            Annuler
          </button>
        )}
      </div>

      {contexte && (
        <div className="mb-4 rounded-lg bg-pigment/10 border border-pigment/30 px-3 py-2">
          <p className="text-xs text-encre-douce">
            {contexte.libelle} pour <span className="font-medium text-encre">{contexte.classeNom}</span> — la classe est figée par le plan d’évaluation.
          </p>
        </div>
      )}

      {/* Périmètre : les contenus du Scriptorium (Textes, Cours) */}
      <div className="mb-4">
        <p className="text-xs text-muet mb-2">Contenus couverts (périmètre des questions)</p>
        {cibles.length === 0 ? (
          <p className="text-xs text-attention bg-attention-teinte rounded-lg px-3 py-2">
            Aucun texte ni cours dans le Scriptorium : l’IA compose les questions à partir de cartes Quazian validées, rattachées à un contenu. Prépare le contenu avant de générer un quiz.
          </p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {cibles.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggleCible(c.id)}
                  className="accent-pigment"
                />
                <span className="text-encre">{c.label}</span>
                <span className="text-muet text-xs">
                  {c.genre === 'cours' ? 'Cours' : c.genre === 'texte' ? 'Texte' : 'Unité héritée'}
                </span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <p className="text-xs text-muet mt-1">{selected.length} contenu{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-muet mb-1 block">Classe</label>
          {contexte ? (
            <>
              <input type="hidden" name="classe_id" value={contexte.classeId} />
              <div className="w-full px-3 py-2 text-sm border border-bordure rounded-lg bg-parchemin-fonce text-encre">
                {contexte.classeNom}
              </div>
            </>
          ) : (
            <select
              name="classe_id"
              value={classeSel}
              onChange={(e) => setClasseSel(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-bordure rounded-lg bg-surface"
            >
              <option value="" disabled>Choisir une classe…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="text-xs text-muet mb-1 block">Nombre de questions</label>
          <input
            type="number"
            name="nb_questions"
            defaultValue={20}
            min={3}
            max={60}
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg"
          />
        </div>
        <div>
          <label className="text-xs text-muet mb-1 block">Durée (min)</label>
          <input
            type="number"
            name="duree_min"
            defaultValue={25}
            min={5}
            max={90}
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg"
          />
        </div>
      </div>

      {/* Q3 — semaine prévue (chemin direct, classe à plan validé) : auto-crée
          l'exercice au plan. Absent si la classe n'a pas de plan (quiz legacy). */}
      {semaines.length > 0 && (
        <div className="mb-4">
          <label className="text-xs text-muet mb-1 block">Semaine prévue (plan d’évaluation)</label>
          <select
            name="semaine_prevue"
            defaultValue=""
            required
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg bg-surface"
          >
            <option value="" disabled>Choisir la semaine…</option>
            {semaines.map((s) => (
              <option key={s.lundi} value={s.lundi}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {erreur && <p className="text-xs text-retard mb-3">{erreur}</p>}

      {avis ? (
        <div className="rounded-lg bg-attention-teinte border border-attention/30 px-3 py-2.5">
          <p className="text-xs text-encre-douce">{avis.texte}</p>
          <button
            type="button"
            onClick={() => router.push(`/prof/quazian/quizz/${avis.quizId}`)}
            className="mt-2 text-xs text-pigment hover:underline"
          >
            Ouvrir le quiz →
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Génération des questions en cours…' : '✦ Générer les questions avec l’IA'}
        </button>
      )}
    </form>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { SessionRevision } from './SessionRevision'
import { ConsultationCartes } from './ConsultationCartes'
import Tuile from '@/components/Tuile'
import type { CarteRevision, CarteConsultation } from './actions'

interface Stats {
  totalCartes: number
  connues: number
  dues: number
  nouvelles: number
  /** Tout ce qui est prêt à être revu (jamais vu, ou échéance atteinte). */
  mures: number
  /** Ce que la session servira vraiment — `mures` plafonné. */
  aFaire: number
}

interface Props {
  stats: Stats
  file: CarteRevision[]
  toutesCartes: CarteConsultation[]
  /** Cours ouvert en consultation (`?cours=`), null = accueil de l'onglet. */
  coursOuvert: string | null
}

const SUR_TITRE = 'font-ui text-xs tracking-[0.1em] text-muet uppercase'

interface TuileCours {
  id: string
  label: string
  total: number
  aReviser: number
  nouvelles: number
}

// C7·L2 — le quizz a quitté cet écran : il a son propre onglet. Ce composant ne
// porte plus que la zone Réviser (stats, session, consultation).
//
// C7·L3 — les cartes n'arrivent plus en un seul pot : une TUILE PAR COURS, comme
// l'écran prof, et la consultation s'ouvre par cours. La FILE de révision, elle,
// reste GLOBALE (décision R7 du prompt de lot) : la répétition espacée est
// transverse — c'est elle qui décide quoi montrer aujourd'hui, pas le cours —
// et chaque carte continue d'afficher le sien pendant la session.
export function QuazianDashboard({ stats, file, toutesCartes, coursOuvert }: Props) {
  const [mode, setMode] = useState<'accueil' | 'revision'>('accueil')
  const [nbRevues, setNbRevues] = useState<number | null>(null)

  // Un cours = une cible (contenu, unité héritée, ou le pot « Cartes personnelles »).
  // L'ordre suit le nom du cours : l'élève cherche un titre, pas une date.
  const cours = useMemo<TuileCours[]>(() => {
    const m = new Map<string, TuileCours>()
    for (const c of toutesCartes) {
      const t = m.get(c.cible_id) ?? { id: c.cible_id, label: c.label_unite, total: 0, aReviser: 0, nouvelles: 0 }
      t.total++
      if (c.a_reviser) t.aReviser++
      if (c.nouvelle) t.nouvelles++
      m.set(c.cible_id, t)
    }
    return [...m.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [toutesCartes])

  function handleTermine(nb: number) {
    setNbRevues(nb)
    setMode('accueil')
  }

  if (coursOuvert) {
    const choisi = cours.find((c) => c.id === coursOuvert)
    return (
      <ConsultationCartes
        cartes={toutesCartes.filter((c) => c.cible_id === coursOuvert)}
        titre={choisi?.label ?? 'Cartes'}
        retourHref="/eleve/modules/quazian"
      />
    )
  }

  if (mode === 'revision') {
    if (file.length === 0) {
      return (
        <div className="text-center py-16 text-muet">
          <p>Aucune carte à réviser pour l'instant.</p>
          <button onClick={() => setMode('accueil')} className="mt-4 text-sm underline">
            Retour
          </button>
        </div>
      )
    }
    return <SessionRevision cartes={file} onTermine={handleTermine} />
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Confirmation post-session */}
      {nbRevues !== null && (
        <div className="bg-ok-teinte border border-ok rounded-xl p-4 text-sm text-ok">
          ✓ {nbRevues} carte{nbRevues > 1 ? 's' : ''} révisée{nbRevues > 1 ? 's' : ''} — bien joué !
        </div>
      )}

      {/* ── Zone RÉVISER ──────────────────────────────────────────────────── */}
      <section>
        <h3 className={`${SUR_TITRE} mb-3`}>Réviser</h3>

        {/* 2 stats : à réviser / au total */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`border rounded-xl p-4 text-center ${stats.aFaire > 0 ? 'bg-attention-teinte border-attention' : 'bg-surface border-bordure'}`}>
            <p className={`font-titre text-3xl ${stats.aFaire > 0 ? 'text-attention' : 'text-encre'}`}>{stats.aFaire}</p>
            <p className="text-xs text-muet mt-1">à réviser aujourd'hui</p>
          </div>
          <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
            <p className="font-titre text-3xl text-encre">{stats.totalCartes}</p>
            <p className="text-xs text-muet mt-1">cartes au total</p>
          </div>
        </div>

        {/* C7·L3 — l'écart entre ce qui est MÛR et ce que la session sert est dit
            en clair. Il annonçait auparavant un troisième nombre, qui ne
            correspondait ni à l'un ni à l'autre : « 50 à réviser » pour 30 cartes
            servies. Deux notions, deux mots, et le bouton ne promet que ce qu'il tient. */}
        {stats.mures > stats.aFaire && (
          <p className="text-xs text-muet mb-4 text-center">
            Tu as {stats.mures} cartes mûres — aujourd&apos;hui tu en révises {stats.aFaire}.
            Le reste attendra demain, c&apos;est le principe.
          </p>
        )}

        {/* La file mélange tous les cours — c'est le principe de la répétition espacée. */}
        {stats.aFaire > 0 ? (
          <button
            onClick={() => { setNbRevues(null); setMode('revision') }}
            className="w-full py-4 bg-bouton text-surface rounded-xl hover:opacity-90 transition-colors font-medium"
          >
            Réviser mes {stats.aFaire} carte{stats.aFaire > 1 ? 's' : ''}
          </button>
        ) : (
          <div className="w-full py-4 bg-ok-teinte border border-ok text-ok rounded-xl text-center text-sm">
            ✓ Toutes les cartes sont à jour — reviens demain !
          </div>
        )}
      </section>

      {/* ── Zone MES COURS — une tuile par cours (C7·L3) ───────────────────── */}
      {cours.length > 0 ? (
        <section>
          <h3 className={`${SUR_TITRE} mb-3`}>Mes cours</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cours.map((c) => (
              <Tuile
                key={c.id}
                nom={c.label}
                sousTitre={`${c.total} carte${c.total > 1 ? 's' : ''}`}
                href={`/eleve/modules/quazian?cours=${encodeURIComponent(c.id)}`}
                couleur="neutre"
                resume={
                  <span className="flex items-center gap-2 text-xs">
                    {c.aReviser > 0 && (
                      <span className="bg-attention-teinte text-attention px-2 py-0.5 rounded-full">
                        {c.aReviser} mûre{c.aReviser > 1 ? 's' : ''}
                      </span>
                    )}
                    {c.nouvelles > 0 && (
                      <span className="text-muet">{c.nouvelles} nouvelle{c.nouvelles > 1 ? 's' : ''}</span>
                    )}
                  </span>
                }
              />
            ))}
          </div>
        </section>
      ) : (
        // Reformulé à C7·L3 : le prof ne « publie » plus rien — les cartes
        // arrivent au fil des cours vus en classe.
        <p className="text-center text-muet text-sm">
          Aucune carte pour l&apos;instant. Elles apparaîtront au fil des cours vus en classe.
        </p>
      )}
    </div>
  )
}

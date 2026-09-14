import Link from 'next/link'
import { estSemaineComptee } from '@/utils/fragments-semaines'
import { formatJour } from '@/utils/fuseau'
import type { FragmentSemaine } from '@/types/fragments'

// ----------------------------------------------------------------------------
// Vestigia · onglet Semaine — LA FRISE DU SEMESTRE.
// Dix-sept semaines sur une ligne : on choisit une semaine sans quitter l'écran,
// la semaine choisie se charge dessous. Les vacances sont un simple trait, les
// semaines que Vestigia ne réclame pas sont hachurées (mais restent ouvrables),
// une semaine passée porte son compte de dépôts, une semaine à venir ses dates.
// Composant serveur : chaque case est un lien `?semaine=`, prérendu et préchargé.
// ----------------------------------------------------------------------------

interface Props {
  semaines: FragmentSemaine[]
  premiere: number
  choisieId: string | null
  /** La classe consultée suit le changement de semaine (`?classe=`). */
  classeId: string | null
  aujourdHui: string
  /** Dépôts / inscrits, par id de semaine. */
  comptes: Record<string, { deposes: number; inscrits: number }>
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export default function FriseSemaines({ semaines, premiere, choisieId, classeId, aujourdHui, comptes }: Props) {
  // Le mois ne s'écrit qu'au premier changement : calculé AVANT le rendu, pas pendant.
  const premieresDuMois = new Set<string>()
  let moisPrecedent = -1
  for (const s of semaines) {
    if (s.is_vacation) continue
    const mois = Number(s.date_debut.slice(5, 7)) - 1
    if (mois !== moisPrecedent) premieresDuMois.add(s.id)
    moisPrecedent = mois
  }
  return (
    <nav aria-label="Semaines du semestre" className="bg-surface border border-bordure rounded-xl px-3 py-2 sm:px-4 overflow-x-auto">
      <ol className="flex items-end gap-1.5 min-w-max">
        {semaines.map((s) => {
          if (s.is_vacation) {
            return <li key={s.id} aria-hidden className="w-2 self-stretch mt-5 mb-1 border-l border-dashed border-puce" />
          }
          const mois = Number(s.date_debut.slice(5, 7)) - 1
          const nouveauMois = premieresDuMois.has(s.id)
          const comptee = estSemaineComptee(s, premiere)
          const choisie = s.id === choisieId
          const passee = s.date_debut <= aujourdHui
          const k = comptes[s.id]
          const sous = comptee && passee && k
            ? `${k.deposes}/${k.inscrits}`
            : comptee
              ? `${formatJour(s.date_debut, { day: 'numeric' })} → ${formatJour(s.date_limite, { day: 'numeric' })}`
              : '—'
          return (
            <li key={s.id} className="flex flex-col items-stretch flex-1 min-w-[52px]">
              <span className="font-ui text-[10px] uppercase tracking-wider text-muet-clair h-4 leading-4 pl-0.5 whitespace-nowrap">
                {nouveauMois ? MOIS[mois] : ''}
              </span>
              <Link
                href={`/prof/fragments-erudition?semaine=${s.id}${classeId ? `&classe=${classeId}` : ''}`}
                aria-current={choisie ? 'page' : undefined}
                aria-label={`Semaine ${s.numero}${comptee && passee && k ? `, ${k.deposes} dépôts sur ${k.inscrits}` : ''}${s.ouverte ? ', ouverte aux élèves' : ''}${comptee ? '' : ', pas de dépôt réclamé'}`}
                title={`Semaine ${s.numero}${s.ouverte ? ' · ouverte aux élèves' : ''}`}
                className={`flex flex-col items-center justify-center h-11 rounded-lg border font-ui leading-none transition-colors ${
                  choisie
                    ? 'bg-pigment border-pigment text-surface shadow-sm'
                    : comptee
                      ? passee
                        ? 'bg-pigment-teinte border-pigment/30 text-encre-douce hover:border-pigment'
                        : 'bg-surface border-bordure text-muet hover:border-pigment hover:text-encre-douce'
                      : 'border-dashed border-puce text-muet-clair hover:border-pigment'
                }`}
                style={comptee || choisie ? undefined : { backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 4px, var(--parchemin-fonce) 4px 6px)' }}
              >
                <span className="text-[13px] font-medium">
                  {s.numero}
                  {s.ouverte && !choisie && <span aria-hidden className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-ok align-middle" />}
                </span>
                <span className={`text-[10px] mt-1 tabular-nums whitespace-nowrap ${choisie ? 'text-surface/80' : 'text-muet-clair'}`}>{sous}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

import Pastille from '@/components/Pastille'
import BanniereIntegrite from '@/components/BanniereIntegrite'
import type { AvisEleve, EvenementVue } from '@/components/integrite/types'

// ════════════════════════════════════════════════════════════════════════════
// Page élève /eleve/integrite (lecture seule) : état actuel, SES avis RETENUS
// (avec l'explication) et la chronologie de ses mises en pause / déblocages.
// L'élève ne voit QUE ses avis confirmés — jamais les signaux IA en attente ni
// les faux positifs écartés. Pas de photos : la valeur est l'explication.
// ════════════════════════════════════════════════════════════════════════════

// Phrase d'un événement, formulée pour l'élève.
function phraseEvenement(e: EvenementVue): string {
  if (e.type === 'blocage') {
    return e.source === 'manuel' ? 'Mise en pause par ton prof' : 'Mise en pause (seuil de strikes atteint)'
  }
  if (e.type === 'deblocage') return 'Débloqué·e par ton prof'
  const mod = e.moduleLabel ? ` (${e.moduleLabel})` : ''
  return `Strike retenu${mod}`
}

function pastilleEvenement(type: EvenementVue['type']): string {
  if (type === 'blocage') return 'bg-retard'
  if (type === 'deblocage') return 'bg-ok'
  return 'bg-attention'
}

export default function HistoriqueEleve({
  bloque, strikes, seuil, message, avis, evenements,
}: {
  bloque: boolean
  strikes: number
  seuil: number
  message: string
  avis: AvisEleve[]
  evenements: EvenementVue[]
}) {
  const restant = Math.max(0, seuil - strikes)

  return (
    <div className="space-y-6">
      {/* État actuel */}
      {bloque ? (
        <div className="space-y-2">
          <BanniereIntegrite message={message} />
          <p className="font-ui text-xs text-muet">Ton prof doit te débloquer pour que tes rendus reprennent.</p>
        </div>
      ) : strikes > 0 ? (
        <div className="bg-attention-teinte border border-attention rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-attention">Sois vigilant·e</p>
          <p className="text-sm text-attention mt-1">
            Tu as {strikes} strike{strikes > 1 ? 's' : ''}. Encore {restant} rendu{restant > 1 ? 's' : ''} trop léger{restant > 1 ? 's' : ''} et tes dépôts seront mis en pause.
          </p>
        </div>
      ) : (
        <div className="bg-ok-teinte border border-ok/30 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-ok">Rien à signaler 🎉</p>
          <p className="text-sm text-ok mt-1">Continue comme ça : tes rendus sont pris au sérieux.</p>
        </div>
      )}

      {/* Mes avis (confirmés) */}
      <section>
        <h3 className="font-ui text-[11px] font-medium text-muet uppercase tracking-[0.12em] mb-3">
          Mes avis {avis.length > 0 && <span className="text-encre-douce">({avis.length})</span>}
        </h3>
        {avis.length > 0 ? (
          <ul className="space-y-2.5">
            {avis.map(({ signalement: s, contexte }) => (
              <li key={s.id} data-module={s.moduleSlug} className="bg-surface border border-bordure border-l-4 border-l-pigment rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Pastille module={s.moduleSlug} size={32} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="font-marque text-[11px] font-semibold tracking-[0.06em] text-pigment">
                      {s.moduleLabel.toUpperCase()}
                      {contexte && <span className="font-ui font-normal text-muet"> · {contexte}</span>}
                    </p>
                    <p className="font-ui text-[11px] text-muet mt-0.5">{s.typeLabel} · {s.date}</p>
                  </div>
                </div>
                {s.motif && (
                  <p className="font-corps text-[15px] text-encre-douce mt-2.5 leading-relaxed">{s.motif}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-ui text-sm text-muet">Aucun avis retenu contre toi.</p>
        )}
      </section>

      {/* Chronologie */}
      {evenements.length > 0 && (
        <section>
          <h3 className="font-ui text-[11px] font-medium text-muet uppercase tracking-[0.12em] mb-3">Chronologie</h3>
          <ul className="space-y-1.5">
            {evenements.map((e) => (
              <li key={e.id} className="flex items-center gap-2 font-ui text-[13px] text-encre-douce">
                <span className={`w-2 h-2 rounded-full shrink-0 ${pastilleEvenement(e.type)}`} aria-hidden />
                <span className="min-w-0">{phraseEvenement(e)}</span>
                <span className="text-muet ml-auto shrink-0">{e.date}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

'use client'

// ============================================================================
// LA PAGE DU LIVRE — un extrait rendu comme une page : papier, serif, mention
// « dans notre version ». Les phrases sont des <span> en ligne (un <button> serait
// inline-block et mettrait chaque phrase sur sa ligne) ; `cliquable` en fait des
// boutons de surlignage. `enEvidence` = la pivot servie par le serveur (bleu) ;
// `selection` = ce que l'élève a surligné (orangé).
// ============================================================================

export interface PhraseAffichee { id: string; texte: string }

export function PageDuLivre({ phrases, enEvidence = [], selection = [], cliquable = false, onBascule, legende = 'dans notre version — ton livre peut le dire autrement' }: {
  phrases: PhraseAffichee[]
  enEvidence?: readonly string[]
  selection?: readonly string[]
  cliquable?: boolean
  onBascule?: (id: string) => void
  legende?: string
}) {
  const evid = new Set(enEvidence), sel = new Set(selection)
  return (
    <div className="bg-parchemin-fonce border border-bordure rounded-md px-4 py-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,.35)]">
      <p className="font-ui text-[10.5px] tracking-[0.1em] uppercase text-muet-clair border-b border-bordure pb-1.5 mb-2.5">{legende}</p>
      <p className="font-corps text-[16px] leading-[1.55] text-encre">
        {phrases.map(ph => {
          const e = evid.has(ph.id), s = sel.has(ph.id)
          const cls = e ? 'bg-pigment-teinte rounded-sm px-0.5 shadow-[inset_0_-2px_0_var(--pigment)]' : s ? 'bg-attention-teinte rounded-sm px-0.5' : ''
          if (!cliquable) return <span key={ph.id} data-phrase={ph.id} {...(e && enEvidence[0] === ph.id ? { 'data-pivot': true } : {})} className={cls}>{ph.texte} </span>
          const basculer = () => onBascule?.(ph.id)
          return (
            <span key={ph.id} data-phrase={ph.id} role="button" tabIndex={0} aria-pressed={s} onClick={basculer}
              onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); basculer() } }}
              className={`cursor-pointer rounded-sm ${cls} hover:bg-attention-teinte/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-pigment`}>{ph.texte} </span>
          )
        })}
      </p>
    </div>
  )
}

// Bulle « à risque » — pastille ronde rouge + « ! », posée en tête de la colonne
// élève (les deux vues). Présentationnelle : la cellule élève entière est déjà un
// lien vers la fiche (pas de lien imbriqué ici). Le tooltip porte les raisons.

export default function BulleRisque({ raisons }: { raisons?: string[] }) {
  const titre = raisons && raisons.length > 0
    ? `À risque — ${raisons.join(' · ')}`
    : 'élève à risque'
  return (
    <span
      title={titre}
      aria-label={titre}
      className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-retard text-surface font-ui text-[11px] font-bold leading-none shrink-0"
    >
      !
    </span>
  )
}

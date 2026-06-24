'use client'

// Impression / export PDF de la carte d'architecture via la boîte d'impression
// du navigateur (« Enregistrer en PDF »). `print:hidden` masque le bouton à l'impression.
export default function BoutonImprimerCapstone() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden text-sm text-encre-douce hover:text-encre border border-bordure rounded-lg px-3 py-1.5 hover:bg-parchemin-fonce transition-colors"
    >
      Imprimer / Télécharger en PDF
    </button>
  )
}

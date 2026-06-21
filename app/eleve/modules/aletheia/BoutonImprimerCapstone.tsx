'use client'

// Impression / export PDF de la carte d'architecture via la boîte d'impression
// du navigateur (« Enregistrer en PDF »). `print:hidden` masque le bouton à l'impression.
export default function BoutonImprimerCapstone() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden text-sm text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg px-3 py-1.5 hover:bg-stone-50 transition-colors"
    >
      Imprimer / Télécharger en PDF
    </button>
  )
}

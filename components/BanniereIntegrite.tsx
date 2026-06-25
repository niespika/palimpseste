// Bannière de blocage « petit malin » montrée à l'élève bloqué (cf. utils/integrite).
// Rendu serveur, sans interactivité : le message vient des paramètres prof.
export default function BanniereIntegrite({ message }: { message: string }) {
  return (
    <div className="bg-retard-teinte border border-retard rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-xl leading-none shrink-0" aria-hidden>⏸️</span>
      <div>
        <p className="text-sm font-medium text-retard">Rendus en pause</p>
        <p className="text-sm text-retard mt-1">{message}</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Fuseau horaire d'affichage — helpers PURS (utilisables côté serveur ET client).
// ════════════════════════════════════════════════════════════════════════════
// Le fuseau choisi par le prof (cf. calendrier_params + utils/fuseau-serveur.ts)
// pilote l'affichage des INSTANTS (timestamptz) et le calcul du « jour courant /
// sur quel jour tombe un événement » (jourDansFuseau). Les DATES PURES (colonnes
// `date`, « 2026-06-27 », sans heure) sont agnostiques au fuseau → formatJour (UTC),
// sinon décalage d'un jour selon le fuseau du serveur.
//
// Ces helpers sont PURS (le fuseau est passé en argument) pour rester importables
// depuis un composant client. La LECTURE du fuseau configuré se fait via
// `lireFuseau()` (server-only) → le serveur lit une fois et passe `tz` en prop.

export const FUSEAU_DEFAUT = 'America/Toronto'

// Liste curée pour le sélecteur prof (IANA → libellé). Étoffer au besoin.
export const FUSEAUX: { id: string; label: string }[] = [
  { id: 'America/Toronto', label: 'Montréal · Toronto (heure de l’Est)' },
  { id: 'America/Halifax', label: 'Halifax (Atlantique)' },
  { id: 'America/Vancouver', label: 'Vancouver (Pacifique)' },
  { id: 'Europe/Paris', label: 'Paris (Europe centrale)' },
  { id: 'Europe/London', label: 'Londres' },
  { id: 'UTC', label: 'UTC' },
]

// Valide un identifiant IANA (rejette une saisie inconnue côté serveur).
export function estFuseauValide(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// « Quel jour » (YYYY-MM-DD) dans le fuseau donné — remplace l'ancien jourParis.
// Sert au « today » et au bucket d'un événement (un instant proche de minuit peut
// tomber un jour différent selon le fuseau). en-CA → format ISO 8601.
export function jourDansFuseau(d: Date | string, tz: string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

// Formatte un INSTANT (timestamptz) dans le fuseau choisi. `toLocaleString` (et non
// `toLocaleDateString`) → respecte fidèlement les options, y compris heure seule.
export function formatInstant(d: Date | string, tz: string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('fr-FR', { ...opts, timeZone: tz })
}

// Formatte une DATE PURE (« 2026-06-27 », colonne `date`) — agnostique au fuseau (UTC).
// Ancrage à minuit UTC pour les chaînes AAAA-MM-JJ (évite tout glissement de jour).
export function formatJour(dateStr: string, opts: Intl.DateTimeFormatOptions = {}): string {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00Z` : dateStr
  return new Date(iso).toLocaleDateString('fr-FR', { ...opts, timeZone: 'UTC' })
}

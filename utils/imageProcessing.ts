import imageCompression from 'browser-image-compression'

export interface ImageTraitee {
  file: File
  previewUrl: string
  nom: string
  // Anti-triche (couche 2) : l'EXIF DateTimeOriginal de l'original est très
  // ancien par rapport à l'horloge → photo probablement recyclée (galerie).
  // EXIF absent (capture d'écran, image « nettoyée ») → non suspect (cf. spec).
  priseSuspecte: boolean
  // Timestamp EXIF (DateTimeOriginal) en ms, ou null si illisible/absent.
  priseAtMs: number | null
}

// Seuil par défaut : une photo de fragment est prise dans la semaine ; au-delà
// de ~2 jours d'écart on signale (sans bloquer). Désormais éditable par le prof
// (fragments_config.seuil_photo_heures) et passé en paramètre.
export const ECART_SUSPECT_MS = 2 * 24 * 60 * 60 * 1000

async function lireDateExif(file: File): Promise<Date | null> {
  try {
    const exifr = (await import('exifr')).default
    const data = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate'])
    const d = (data?.DateTimeOriginal ?? data?.CreateDate) as Date | undefined
    return d instanceof Date && !isNaN(d.getTime()) ? d : null
  } catch {
    return null
  }
}

async function convertirHEIC(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  }) as Blob
  const nomSansExtension = file.name.replace(/\.(heic|HEIC)$/, '')
  return new File([blob], `${nomSansExtension}.jpg`, { type: 'image/jpeg' })
}

export async function traiterImage(file: File, seuilMs: number = ECART_SUSPECT_MS): Promise<ImageTraitee> {
  let fileATraiter = file

  // Lire l'EXIF sur l'ORIGINAL (la compression le supprime ensuite).
  const dateExif = await lireDateExif(file)
  const priseAtMs = dateExif?.getTime() ?? null
  const priseSuspecte = priseAtMs != null && Date.now() - priseAtMs > seuilMs

  // Convertir HEIC → JPEG si nécessaire
  const estHEIC =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')

  if (estHEIC) {
    fileATraiter = await convertirHEIC(file)
  }

  // Compresser et redimensionner (gère aussi la rotation EXIF)
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 2000,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.8,
  }

  const compresse = await imageCompression(fileATraiter, options)
  const fichierFinal = new File(
    [compresse],
    fileATraiter.name.replace(/\.[^.]+$/, '.jpg'),
    { type: 'image/jpeg' }
  )

  const previewUrl = URL.createObjectURL(fichierFinal)

  return {
    file: fichierFinal,
    previewUrl,
    nom: fichierFinal.name,
    priseSuspecte,
    priseAtMs,
  }
}

export function libererPreview(previewUrl: string) {
  URL.revokeObjectURL(previewUrl)
}

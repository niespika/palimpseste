import imageCompression from 'browser-image-compression'

export interface ImageTraitee {
  file: File
  previewUrl: string
  nom: string
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

export async function traiterImage(file: File): Promise<ImageTraitee> {
  let fileATraiter = file

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
  }
}

export function libererPreview(previewUrl: string) {
  URL.revokeObjectURL(previewUrl)
}

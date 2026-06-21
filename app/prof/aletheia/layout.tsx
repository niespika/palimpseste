import Link from 'next/link'

export default function AletheiaProfLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <Link href="/prof" className="text-sm text-stone-500 hover:text-stone-700">
          ← Tableau de bord
        </Link>
        <h2 className="text-xl font-serif text-stone-900 mt-2">Aletheia</h2>
        <p className="text-sm text-stone-500 mt-1">Lecture autonome d&apos;un livre — paramètres des retours IA</p>
      </div>
      {children}
    </div>
  )
}

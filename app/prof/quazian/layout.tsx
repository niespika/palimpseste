import Link from 'next/link'

export default function QuazianLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <Link href="/prof" className="text-sm text-stone-500 hover:text-stone-700">
          ← Tableau de bord
        </Link>
        <h2 className="text-xl font-serif text-stone-900 mt-2">Quazian</h2>
        <p className="text-sm text-stone-500 mt-1">Flashcards et quizz bayésien</p>
      </div>
      {children}
    </div>
  )
}

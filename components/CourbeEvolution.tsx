'use client'

import { useRouter } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  type MouseHandlerDataParam,
} from 'recharts'
import { noteVersLettre } from '@/utils/notation'

// Courbe d'évolution réutilisable (T1). Props entièrement sérialisables → utilisable
// directement depuis un composant serveur. La navigation au clic passe par un champ
// `href` porté par chaque point (pas de prop fonction qui ne franchirait pas la
// frontière serveur/client). Fragments garde son propre GraphiqueProgression
// (points oraux spécifiques) ; ce composant sert les nouvelles courbes
// (moyenne de classe/élève, diagnostic Aletheia/Quazian).

export interface SerieCourbe {
  cle: string
  label: string
  couleur: string
  tiret?: boolean
}

export type PointCourbe = Record<string, number | string | null | undefined> & { href?: string }

interface Props {
  data: PointCourbe[]
  series: SerieCourbe[]
  cleX: string
  /** 'lettres' = axe/valeurs E→A (échelle 0-4) ; 'numerique' (défaut) = chiffres. */
  axeY?: 'numerique' | 'lettres'
  domaine?: [number, number]
  ticksY?: number[]
  /** Préfixe de l'axe X (ex. 'S' → S1, S2…). */
  prefixeX?: string
  hauteur?: number
}

export default function CourbeEvolution({
  data, series, cleX, axeY = 'numerique', domaine, ticksY, prefixeX = '', hauteur = 240,
}: Props) {
  const router = useRouter()
  const lettres = axeY === 'lettres'
  const dom: [number, number] = domaine ?? (lettres ? [0, 4] : [0, 'auto' as unknown as number])
  const ticks = ticksY ?? (lettres ? [0, 1, 2, 3, 4] : undefined)
  const aLiens = data.some((d) => typeof d.href === 'string')

  const fmtVal = (v: number | null | undefined) =>
    v == null ? '—' : lettres ? (noteVersLettre(v) ?? '—') : String(Math.round(v * 100) / 100)

  function handleClick(state: MouseHandlerDataParam) {
    if (!aLiens) return
    const idx = state.activeIndex ?? state.activeTooltipIndex
    if (typeof idx !== 'number') return
    const href = data[idx]?.href
    if (typeof href === 'string') router.push(href)
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={hauteur}>
        <LineChart
          data={data}
          onClick={aLiens ? handleClick : undefined}
          style={aLiens ? { cursor: 'pointer' } : undefined}
          margin={{ top: 8, right: 16, bottom: 0, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey={cleX}
            tickFormatter={(v) => `${prefixeX}${v}`}
            tick={{ fontSize: 11, fill: '#a8a29e' }}
          />
          <YAxis
            domain={dom}
            ticks={ticks}
            tickFormatter={lettres ? (v: number) => noteVersLettre(v) ?? '' : undefined}
            tick={{ fontSize: 11, fill: '#a8a29e' }}
            allowDecimals={!lettres}
          />
          <Tooltip
            formatter={(value, name) => [fmtVal(typeof value === 'number' ? value : null), name]}
            labelFormatter={(l) => `${prefixeX}${l}`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
          />
          {series.length > 1 && <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Line
              key={s.cle}
              dataKey={s.cle}
              name={s.label}
              stroke={s.couleur}
              strokeWidth={s.tiret ? 2.5 : 1.5}
              strokeDasharray={s.tiret ? '6 2' : undefined}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {aLiens && <p className="text-xs text-center text-stone-400 mt-1">Cliquer sur un point pour le détail</p>}
    </div>
  )
}

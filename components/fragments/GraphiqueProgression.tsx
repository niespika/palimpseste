'use client'

import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type MouseHandlerDataParam,
} from 'recharts'

export interface PointSemaine {
  semaine: number
  decouvertes: number | null
  sources: number | null
  reflexions: number | null
  moyenne: number | null
  depotId: string | null
}

function TooltipCustom({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ payload: PointSemaine }>
  label?: number
}) {
  if (!active || !payload?.length) return null
  const pt = payload[0].payload
  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-3 text-sm">
      <p className="font-medium text-stone-900 mb-1.5">Semaine {label}</p>
      {pt.decouvertes !== null ? (
        <>
          <p style={{ color: '#3b82f6' }}>Découvertes : {pt.decouvertes}/4</p>
          <p style={{ color: '#10b981' }}>Sources : {pt.sources}/4</p>
          <p style={{ color: '#8b5cf6' }}>Réflexions : {pt.reflexions}/4</p>
          {pt.moyenne !== null && (
            <p className="text-stone-700 font-medium mt-1">Moy. : {pt.moyenne.toFixed(2)}/4</p>
          )}
        </>
      ) : (
        <p className="text-stone-400 italic text-xs">Semaine non déposée</p>
      )}
    </div>
  )
}

const LABELS: Record<string, string> = {
  decouvertes: 'Découvertes',
  sources: 'Sources',
  reflexions: 'Réflexions',
  moyenne: 'Moyenne',
}

interface Props {
  data: PointSemaine[]
  lienBase?: string // e.g. '/prof/fragments-erudition/analyse/'
}

export default function GraphiqueProgression({ data, lienBase }: Props) {
  const router = useRouter()

  function handleChartClick(nextState: MouseHandlerDataParam) {
    if (!lienBase) return
    const idx = nextState.activeIndex ?? nextState.activeTooltipIndex
    if (typeof idx !== 'number') return
    const pt = data[idx]
    if (pt?.depotId) router.push(`${lienBase}${pt.depotId}`)
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          onClick={lienBase ? handleChartClick : undefined}
          style={lienBase ? { cursor: 'pointer' } : undefined}
          margin={{ top: 8, right: 16, bottom: 0, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="semaine"
            tickFormatter={(v: number) => `S${v}`}
            tick={{ fontSize: 11, fill: '#a8a29e' }}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fontSize: 11, fill: '#a8a29e' }}
          />
          <Tooltip content={<TooltipCustom />} />
          <Legend
            iconSize={10}
            formatter={(val: string) => LABELS[val] ?? val}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            dataKey="decouvertes"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            dataKey="sources"
            stroke="#10b981"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            dataKey="reflexions"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            dataKey="moyenne"
            stroke="#78716c"
            strokeWidth={2.5}
            strokeDasharray="6 2"
            dot={false}
            activeDot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {lienBase && (
        <p className="text-xs text-center text-stone-400 mt-1">
          Cliquer sur un point pour voir l'analyse
        </p>
      )}
    </div>
  )
}

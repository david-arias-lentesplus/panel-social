/**
 * BarChartComponent — Recharts wrapper con estilo LIVO
 * v2: leyenda explícita, soporte de color único, ticks controlados
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import Card from '../ui/Card'
import Spinner from '../ui/Spinner'
import { formatNumber } from '../../utils/dateUtils'

const PALETTE = ['#0000E1','#D92D8E','#FC4F00','#BDD900','#6666ED','#AB8F68']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111] text-white text-xs rounded-[6px] px-[10px] py-2 shadow-tooltip">
      <p className="font-bold mb-1 text-[#AAA]">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill ?? p.color }} />
          {p.name}: <strong>{formatNumber(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function BarChartComponent({
  data = [],
  bars = [],
  xKey = 'label',
  title,
  subtitle,
  loading = false,
  layout = 'horizontal',   // 'horizontal' = columnas | 'vertical' = barras horizontales
  colorPerBar = false,     // true → cada barra diferente color (evitar para series de una sola variable)
  singleColor,             // si se provee, usa este color para todas las barras (sin leyenda)
  height = 280,
}) {
  const resolvedBars = bars.length
    ? bars
    : Object.keys(data[0] ?? {})
        .filter((k) => k !== xKey && k !== '_source')
        .map((k, i) => ({ key: k, color: PALETTE[i % PALETTE.length], label: k }))

  const isHorizontal = layout === 'horizontal'
  const showLegend   = resolvedBars.length > 1 && !singleColor

  // Interval for X ticks when there's lots of data
  const tickInterval = isHorizontal && data.length > 20
    ? Math.floor(data.length / 8) : 0

  return (
    <Card>
      {(title || subtitle) && (
        <div className="mb-4">
          {title    && <h3 className="text-base font-bold text-[#111]">{title}</h3>}
          {subtitle && <p className="text-xs text-[#666] mt-0.5">{subtitle}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <Spinner />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-[#AAA]" style={{ height }}>
          <p className="text-sm">Sin datos en el rango seleccionado</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={isHorizontal ? 'horizontal' : 'vertical'}
            margin={{ top: 4, right: 16, left: isHorizontal ? 0 : 90, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            {isHorizontal ? (
              <>
                <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#AAA' }} tickLine={false} axisLine={{ stroke: '#E0E0E0' }} interval={tickInterval} />
                <YAxis tick={{ fontSize: 11, fill: '#AAA' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} width={50} />
              </>
            ) : (
              <>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#AAA' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                <YAxis dataKey={xKey} type="category" tick={{ fontSize: 11, fill: '#AAA' }} tickLine={false} axisLine={{ stroke: '#E0E0E0' }} width={88} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'Poppins, sans-serif', paddingTop: 12 }}
                iconType="circle"
                iconSize={8}
              />
            )}
            {resolvedBars.map(({ key, color, label }) => (
              <Bar
                key={key}
                dataKey={key}
                name={label ?? key}
                fill={singleColor ?? color ?? '#0000E1'}
                radius={isHorizontal ? [4, 4, 0, 0] : [0, 4, 4, 0]}
                maxBarSize={40}
              >
                {colorPerBar && !singleColor && data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

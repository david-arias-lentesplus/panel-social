/**
 * LineChartComponent — Recharts wrapper con estilo LIVO
 * v2: ticks controlados en eje X (evita solapamiento con muchos días)
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import Card from '../ui/Card'
import Spinner from '../ui/Spinner'
import { formatNumber } from '../../utils/dateUtils'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111] text-white text-xs rounded-[6px] px-[10px] py-2 shadow-tooltip min-w-[120px]">
      <p className="font-bold mb-1 text-[#AAA]">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          {p.name}: <strong>{formatNumber(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function LineChartComponent({
  data = [],
  lines = [],
  xKey = 'fecha',
  title,
  subtitle,
  loading = false,
  height = 240,
}) {
  // Limit X-axis ticks to avoid overlap (max ~8 ticks)
  const tickInterval = data.length > 60 ? Math.floor(data.length / 8)
                     : data.length > 30 ? Math.floor(data.length / 6)
                     : data.length > 14 ? Math.floor(data.length / 4)
                     : 0 // show all

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
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 10, fill: '#AAA' }}
              tickLine={false}
              axisLine={{ stroke: '#E0E0E0' }}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#AAA' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            {lines.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'Poppins, sans-serif', paddingTop: 10 }}
                iconType="circle"
                iconSize={8}
              />
            )}
            {lines.map(({ key, color, label }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label ?? key}
                stroke={color ?? '#0000E1'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

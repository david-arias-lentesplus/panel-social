/**
 * PieChartComponent — Recharts wrapper con estilo LIVO
 * v2: leyenda externa explícita (obligatoria por principio de claridad en dataviz)
 */

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import Card from '../ui/Card'
import Spinner from '../ui/Spinner'
import { formatNumber } from '../../utils/dateUtils'

const PALETTE = ['#0000E1','#D92D8E','#FC4F00','#BDD900','#6666ED','#AB8F68','#00C2A8','#FF7C43','#7B61FF','#1DB954']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-[#111] text-white text-xs rounded-[6px] px-[10px] py-2 shadow-tooltip">
      <p className="font-bold">{name}</p>
      <p className="text-[#CCC]">{typeof value === 'number' && value < 100 ? `${value.toFixed(1)}%` : formatNumber(value)}</p>
    </div>
  )
}

export default function PieChartComponent({
  data = [],
  nameKey = 'name',
  valueKey = 'value',
  title,
  subtitle,
  loading = false,
  innerRadius = 60,
  colors = PALETTE,
}) {
  return (
    <Card className="h-full">
      {(title || subtitle) && (
        <div className="mb-3">
          {title    && <h3 className="text-base font-bold text-[#111]">{title}</h3>}
          {subtitle && <p className="text-xs text-[#666] mt-0.5">{subtitle}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-[#AAA]">
          <p className="text-sm">Sin datos disponibles</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Chart */}
          <div className="shrink-0" style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey={valueKey}
                  nameKey={nameKey}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={76}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* External legend — OBLIGATORIA para identificar segmentos */}
          <div className="flex-1 min-w-0 space-y-1.5 overflow-y-auto max-h-48">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: colors[i % colors.length] }}
                />
                <span className="truncate text-[#444] flex-1" title={item[nameKey]}>
                  {item[nameKey]}
                </span>
                <span className="font-bold text-[#111] shrink-0">
                  {typeof item[valueKey] === 'number' && item[valueKey] <= 100
                    ? `${item[valueKey].toFixed(1)}%`
                    : formatNumber(item[valueKey])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

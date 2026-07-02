/**
 * HeatmapChart — Mapa de calor Día×Hora con ER promedio
 * Implementado con CSS grid nativo (sin librería adicional).
 * Color: escala de azul LIVO (claro → oscuro según ER)
 */

import Card from '../ui/Card'

const DIAS  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const HORAS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}h`)

/** Interpola entre blanco y #0000E1 según intensidad 0-1 */
function heatColor(intensity) {
  if (intensity <= 0) return 'rgba(240,240,240,0.5)'
  const alpha = 0.08 + intensity * 0.82
  return `rgba(0, 0, 225, ${alpha.toFixed(2)})`
}

/** Texto legible sobre fondo coloreado */
function textColor(intensity) {
  return intensity > 0.55 ? '#fff' : '#111'
}

export default function HeatmapChart({ grid, title = 'Mapa de calor — Mejor momento para publicar' }) {
  if (!grid) return null

  // Calcular máximo ER en todo el grid (para normalizar colores)
  const allERs = grid.flatMap(row => row.map(cell => cell.avgER))
  const maxER  = Math.max(...allERs, 0.01)

  // Agrupar horas en bloques de 3 para no saturar el eje X
  // Mostrar: 00, 03, 06, 09, 12, 15, 18, 21 (8 bloques)
  const BLOCK = 3
  const BLOCKS = Math.ceil(24 / BLOCK) // 8

  // Para cada celda mostrada: promedio de las horas del bloque
  function blockCell(dayIdx, blockIdx) {
    const startH = blockIdx * BLOCK
    const endH   = Math.min(startH + BLOCK, 24)
    let count = 0, totalER = 0
    for (let h = startH; h < endH; h++) {
      const c = grid[dayIdx]?.[h] ?? { count: 0, avgER: 0 }
      count   += c.count
      totalER += c.avgER * c.count
    }
    return {
      count,
      avgER: count > 0 ? totalER / count : 0,
    }
  }

  const BLOCK_LABELS = Array.from({ length: BLOCKS }, (_, i) => `${String(i * BLOCK).padStart(2,'0')}h`)

  return (
    <Card>
      <h3 className="text-base font-bold text-[#111] mb-1">{title}</h3>
      <p className="text-xs text-[#666] mb-4">Engagement Rate promedio (Interacciones ÷ Alcance × 100) por franja horaria</p>

      <div className="overflow-x-auto">
        {/* Grid: labels de horas en la fila superior */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(${BLOCKS}, minmax(44px, 1fr))`,
            gap: '2px',
          }}
        >
          {/* Header row */}
          <div className="text-[10px] font-bold text-[#AAA] flex items-end pb-1">Día / Hora</div>
          {BLOCK_LABELS.map(label => (
            <div key={label} className="text-[10px] text-[#AAA] text-center pb-1">{label}</div>
          ))}

          {/* Data rows */}
          {DIAS.map((dia, dayIdx) => (
            <>
              {/* Etiqueta del día */}
              <div
                key={`label-${dayIdx}`}
                className="text-[11px] font-bold text-[#555] flex items-center pr-2"
              >
                {dia.slice(0, 3)}
              </div>
              {/* Celdas de bloques horarios */}
              {Array.from({ length: BLOCKS }, (_, blockIdx) => {
                const cell = blockCell(dayIdx, blockIdx)
                const intensity = maxER > 0 ? cell.avgER / maxER : 0
                const bg   = heatColor(intensity)
                const tc   = textColor(intensity)

                return (
                  <div
                    key={`${dayIdx}-${blockIdx}`}
                    title={cell.count > 0
                      ? `${dia} ${BLOCK_LABELS[blockIdx]}: ER ${cell.avgER.toFixed(1)}% (${cell.count} posts)`
                      : 'Sin datos'}
                    style={{ background: bg, color: tc }}
                    className="rounded text-[10px] font-bold text-center py-2 cursor-default transition-opacity hover:opacity-80"
                  >
                    {cell.count > 0 ? `${cell.avgER.toFixed(1)}%` : ''}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Leyenda de escala */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[10px] text-[#AAA]">Bajo ER</span>
        <div className="flex gap-0.5">
          {[0.05, 0.2, 0.4, 0.6, 0.8, 1.0].map(v => (
            <div
              key={v}
              style={{ background: heatColor(v), width: 20, height: 12, borderRadius: 2 }}
            />
          ))}
        </div>
        <span className="text-[10px] text-[#AAA]">Alto ER</span>
        <span className="ml-auto text-[10px] text-[#AAA]">ER máximo en periodo: {maxER.toFixed(1)}%</span>
      </div>
    </Card>
  )
}

/**
 * Vista: Visión General (Resultados diarios)
 * v3: KPIs = totales del periodo, ER promedio, Seguidores totales
 */

import { useMemo } from 'react'
import Header from '../components/layout/Header'
import LineChartComponent from '../components/charts/LineChartComponent'
import BarChartComponent from '../components/charts/BarChartComponent'
import Card from '../components/ui/Card'
import { parseMetaNumber } from '../utils/audienceParser'
import { formatNumber, calcER, monthKey, monthLabel } from '../utils/dateUtils'
import { useLocalData } from '../hooks/useLocalData'

function normalizeRow(row) {
  const h = Object.keys(row)
  const get = (...terms) => {
    const key = h.find(k => terms.some(t => k.toLowerCase().includes(t.toLowerCase())))
    return key ? row[key] : null
  }

  const rawFecha = get('fecha', 'date')
  let fecha = rawFecha ?? '—'
  let dateObj = null
  if (rawFecha) {
    const d = new Date(rawFecha)
    if (!isNaN(d)) {
      dateObj = d
      fecha = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
    }
  }

  const alcance       = parseMetaNumber(get('alcance'))
  const clics         = parseMetaNumber(get('clics', 'enlace'))
  const interacciones = parseMetaNumber(get('interacciones'))

  return {
    fecha, dateObj,
    alcance,
    clics,
    interacciones,
    seguidores:      parseMetaNumber(get('seguidores')),
    visitas:         parseMetaNumber(get('visitas')),
    visualizaciones: parseMetaNumber(get('visualizaciones', 'impresiones')),
  }
}

function KpiCard({ label, value, sub, color = '#0000E1', suffix = '' }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <p className="text-[11px] font-bold text-[#666] uppercase tracking-[0.5px]">{label}</p>
      <p className="text-2xl font-bold" style={{ color, fontFamily: 'Poppins, sans-serif' }}>
        {value != null ? formatNumber(value) + suffix : '—'}
      </p>
      {sub && <p className="text-[11px] text-[#AAA]">{sub}</p>}
    </Card>
  )
}

function MonthComparisonChart({ data, metric, label, color }) {
  const byMonth = useMemo(() => {
    const map = {}
    for (const r of data) {
      if (!r.dateObj) continue
      const k = monthKey(r.dateObj)
      if (!map[k]) map[k] = { month: monthLabel(r.dateObj), total: 0 }
      map[k].total += r[metric]
    }
    return Object.values(map).map(m => ({
      month: m.month,
      [label]: Math.round(m.total),
    }))
  }, [data, metric, label])

  return (
    <BarChartComponent
      data={byMonth}
      bars={[{ key: label, color, label }]}
      xKey="month"
      title={`${label} por mes`}
      subtitle="Comparativa mensual — suma acumulada"
      singleColor={color}
      height={200}
    />
  )
}

export default function Overview({ dateProps }) {
  const { dateRange, monthSpan } = dateProps ?? {}
  const { rows, loading, source } = useLocalData('resultados')

  const allData = useMemo(
    () => rows.map(normalizeRow).filter(r => r.fecha !== '—'),
    [rows]
  )

  // Filtrar por rango de fecha
  const data = useMemo(() => {
    const { start, end } = dateRange ?? {}
    if (!start || !end) return allData
    return allData.filter(r => r.dateObj && r.dateObj >= start && r.dateObj <= end)
  }, [allData, dateRange])

  // KPIs = TOTALES del periodo seleccionado
  const totals = useMemo(() => {
    const sum = (key) => data.reduce((acc, r) => acc + (r[key] ?? 0), 0)
    const alcance       = sum('alcance')
    const interacciones = sum('interacciones')
    return {
      alcance,
      visualizaciones: sum('visualizaciones'),
      interacciones,
      visitas:         sum('visitas'),
      seguidores:      sum('seguidores'),
      clics:           sum('clics'),
      er:              calcER(interacciones, alcance),
    }
  }, [data])

  const periodoLabel = `Total del periodo (${formatNumber(data.length)} días)`
  const showComparison = (monthSpan ?? 1) >= 2

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Visión General"
        subtitle={`${formatNumber(data.length)} días de datos${source === "indexeddb" ? " — datos locales" : ""}`}
        loading={loading}
        onRefresh={null}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* KPIs — totales del periodo */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Alcance total"        value={totals.alcance}         sub={periodoLabel} color="#0000E1" />
          <KpiCard label="Visualizaciones"      value={totals.visualizaciones} sub={periodoLabel} color="#D92D8E" />
          <KpiCard label="Interacciones"        value={totals.interacciones}   sub={periodoLabel} color="#FC4F00" />
          <KpiCard label="Visitas al perfil"    value={totals.visitas}         sub={periodoLabel} color="#BDD900" />
          <KpiCard label="Nuevos seguidores"    value={totals.seguidores}      sub={periodoLabel} color="#AB8F68" />
          <KpiCard label="Engagement Rate"      value={totals.er}              sub="Interacciones / Alcance" color="#6666ED" suffix="%" />
        </div>

        {/* Comparativa mensual (solo si ≥2 meses) */}
        {showComparison && data.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E0E0E0]" />
              <p className="text-xs font-bold text-[#0000E1] uppercase tracking-widest">Comparativa mensual</p>
              <div className="h-px flex-1 bg-[#E0E0E0]" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MonthComparisonChart data={data} metric="alcance"         label="Alcance"        color="#0000E1" />
              <MonthComparisonChart data={data} metric="visualizaciones" label="Visualizaciones" color="#D92D8E" />
              <MonthComparisonChart data={data} metric="interacciones"   label="Interacciones"  color="#FC4F00" />
              <MonthComparisonChart data={data} metric="seguidores"      label="Seguidores"     color="#BDD900" />
            </div>
          </>
        )}

        {/* Serie temporal */}
        <LineChartComponent
          data={data}
          xKey="fecha"
          title="Alcance y Visualizaciones diarias"
          subtitle="Serie histórica del rango seleccionado"
          loading={loading}
          lines={[
            { key: 'alcance',         color: '#0000E1', label: 'Alcance' },
            { key: 'visualizaciones', color: '#D92D8E', label: 'Visualizaciones' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LineChartComponent
            data={data} xKey="fecha"
            title="Interacciones con el contenido"
            loading={loading}
            lines={[{ key: 'interacciones', color: '#FC4F00', label: 'Interacciones' }]}
          />
          <LineChartComponent
            data={data} xKey="fecha"
            title="Visitas al perfil"
            loading={loading}
            lines={[{ key: 'visitas', color: '#BDD900', label: 'Visitas al perfil' }]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LineChartComponent
            data={data} xKey="fecha"
            title="Nuevos seguidores diarios"
            loading={loading}
            lines={[{ key: 'seguidores', color: '#AB8F68', label: 'Nuevos seguidores' }]}
          />
          <LineChartComponent
            data={data} xKey="fecha"
            title="Clics en el enlace de bio"
            loading={loading}
            lines={[{ key: 'clics', color: '#6666ED', label: 'Clics al enlace' }]}
          />
        </div>
      </div>
    </div>
  )
}

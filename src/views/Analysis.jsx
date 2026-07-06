/**
 * Vista: Análisis Estadístico
 * Módulos: Heatmap Día×Hora, Rendimiento por Formato, Outliers P90, Pareto 80/20
 * Todo reacciona al DateRangePicker global.
 */

import { useMemo } from 'react'
import Header from '../components/layout/Header'
import Card from '../components/ui/Card'
import BarChartComponent from '../components/charts/BarChartComponent'
import HeatmapChart from '../components/charts/HeatmapChart'
import Badge from '../components/ui/Badge'
import { useLocalData } from '../hooks/useLocalData'
import { parseMetaNumber } from '../utils/audienceParser'
import { formatNumber, calcER } from '../utils/dateUtils'
import { detectOwnAccount, filterByAccount } from '../utils/accountFilter'
import {
  paretoAnalysis,
  detectOutliers,
  formatPerformance,
  buildHeatmapGrid,
  analyzeContentRow,
} from '../utils/statsUtils'

const MBS_URL = (id) =>
  `https://business.facebook.com/latest/insights/object_insights/?asset_id=627596310710449&business_id=385549068306940&ir_qe_exposed=1&content_id=${id}&nav_ref=bizweb_insights_uta_table`

const TIPO_BADGE = { Reel:'info', Carrusel:'success', Historia:'promo', Post:'warning', Video:'warning' }

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline shrink-0 ml-1 opacity-60">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#E0E0E0]" />
      <p className="text-xs font-bold text-[#0000E1] uppercase tracking-widest whitespace-nowrap">{children}</p>
      <div className="h-px flex-1 bg-[#E0E0E0]" />
    </div>
  )
}

export default function Analysis({ dateProps }) {
  const { dateRange, accountFilter = 'todas' } = dateProps ?? {}
  const { rows: rawRows, loading, source } = useLocalData('contenido')

  // Normalizar (todo el dataset, sin filtrar aún) — se usa para detectar la cuenta propia
  const allNormalized = useMemo(
    () => rawRows.map(analyzeContentRow).filter(r => r.alcance > 0 || r.interacciones > 0),
    [rawRows]
  )
  const ownAccount = useMemo(() => detectOwnAccount(allNormalized), [allNormalized])

  // Normalizar, filtrar por cuenta y por fecha
  const rows = useMemo(() => {
    const accountFiltered = filterByAccount(allNormalized, accountFilter, ownAccount)
    const { start, end } = dateRange ?? {}
    if (!start || !end) return accountFiltered
    return accountFiltered.filter(r => r.fechaObj && r.fechaObj >= start && r.fechaObj <= end)
  }, [allNormalized, accountFilter, ownAccount, dateRange])

  // ── Módulo 1: Heatmap ───────────────────────────────────────────────────────
  const heatmapGrid = useMemo(() => buildHeatmapGrid(rows), [rows])

  // ── Módulo 2: Rendimiento por formato ───────────────────────────────────────
  const byFormato = useMemo(() => formatPerformance(rows), [rows])

  const chartAlcance = byFormato.map(r => ({ tipo: r.tipo, 'Alcance Prom.': r.alcancePromedio, count: r.count }))
  const chartInter   = byFormato.map(r => ({ tipo: r.tipo, 'Interacc. Prom.': r.interaccionesPromedio, count: r.count }))
  const chartER      = byFormato.map(r => ({ tipo: r.tipo, 'ER Prom. (%)': r.erPromedio, count: r.count }))

  // ── Módulo 3: Outliers P90 ─────────────────────────────────────────────────
  const outliers = useMemo(() => detectOutliers(rows, 90).slice(0, 10), [rows])


  // ── Módulo 4: Pauta pagada vs orgánico ─────────────────────────────────────
  const { rows: paidRaw } = useLocalData('anuncios')

  const paidMap = useMemo(() => {
    const map = {}
    for (const r of paidRaw) {
      const id = r['Identificador_Publicacion'] || r['Identificador de la publicación'] || ''
      if (!id) continue
      map[id] = {
        alcancePagado:     parseMetaNumber(r['Alcance_Pagado'] || r['Alcance pagado'] || 0),
        vistasPagadas:     parseMetaNumber(r['Visualizaciones_Pagadas'] || r['Visualizaciones pagadas'] || 0),
        seguidoresPagados: parseMetaNumber(r['Seguidores_Pagados'] || r['Seguidores pagados'] || 0),
      }
    }
    return map
  }, [paidRaw])

  const paidStats = useMemo(() => {
    if (!paidRaw.length) return null
    const paidRows = rows.filter(r => paidMap[r.id])
    if (!paidRows.length) return null

    // Per tipo: aggregate paid vs organic
    const byTipo = {}
    for (const r of paidRows) {
      const paid = paidMap[r.id]
      if (!byTipo[r.tipo]) byTipo[r.tipo] = { tipo: r.tipo, count: 0, alcancePagado: 0, alcanceOrganico: 0 }
      byTipo[r.tipo].count++
      byTipo[r.tipo].alcancePagado   += paid.alcancePagado
      byTipo[r.tipo].alcanceOrganico += Math.max(0, r.alcance - paid.alcancePagado)
    }

    const totalPagado    = paidRows.reduce((s, r) => s + (paidMap[r.id]?.alcancePagado ?? 0), 0)
    const totalOrganico  = paidRows.reduce((s, r) => s + Math.max(0, r.alcance - (paidMap[r.id]?.alcancePagado ?? 0)), 0)
    const totalAlcance   = totalPagado + totalOrganico
    const totalSegPagados = paidRows.reduce((s, r) => s + (paidMap[r.id]?.seguidoresPagados ?? 0), 0)

    const chartData = Object.values(byTipo).sort((a,b) => (b.alcancePagado + b.alcanceOrganico) - (a.alcancePagado + a.alcanceOrganico))
    const topPaidPosts = [...paidRows]
      .sort((a,b) => (paidMap[b.id]?.alcancePagado ?? 0) - (paidMap[a.id]?.alcancePagado ?? 0))
      .slice(0, 6)

    return { totalPagado, totalOrganico, totalAlcance, totalSegPagados, chartData, topPaidPosts, countPaid: paidRows.length }
  }, [rows, paidRaw, paidMap])

  // ── Módulo 5: Pareto ───────────────────────────────────────────────────────
  const pareto = useMemo(() => paretoAnalysis(rows, 'interacciones'), [rows])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Análisis Estadístico" subtitle="Cargando datos..." loading={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#0000E1] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Análisis Estadístico" subtitle="Sin datos en el rango" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#AAA]">
          <span className="text-5xl">📊</span>
          <p className="font-bold text-[#111]">Sin publicaciones en el rango seleccionado</p>
          <p className="text-sm">Ajusta el DateRangePicker o sube datos en la sección <strong>Datos</strong>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Análisis Estadístico"
        subtitle={`${formatNumber(rows.length)} publicaciones analizadas${source === 'indexeddb' ? ' — datos locales' : ''}`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* ── Pareto Banner (KPI global) ─────────────────────────────────── */}
        {pareto && (
          <Card className="bg-gradient-to-r from-[#0000E1] to-[#3333FF] text-white">
            <div className="flex items-start gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-70 mb-1">Principio de Pareto (80/20)</p>
                <p className="text-2xl font-bold leading-tight">
                  El <span className="text-[#DEFF00]">{pareto.pctPosts}%</span> de tus publicaciones
                </p>
                <p className="text-2xl font-bold leading-tight">
                  generaron el <span className="text-[#DEFF00]">{pareto.pctValue}%</span> de las interacciones totales.
                </p>
                <p className="text-sm opacity-70 mt-2">
                  {pareto.count} posts de {pareto.total} concentraron {formatNumber(pareto.topRows.reduce((s,r)=>s+r.interacciones,0))} de {formatNumber(pareto.valueTotal)} interacciones.
                </p>
              </div>
              <div className="shrink-0 text-6xl opacity-20 ml-auto">⚖️</div>
            </div>
          </Card>
        )}

        {/* ── Módulo 1: Heatmap ─────────────────────────────────────────── */}
        <SectionTitle>Módulo 1 — Mejor momento para publicar</SectionTitle>
        <HeatmapChart grid={heatmapGrid} />

        {/* ── Módulo 2: Rendimiento por formato ─────────────────────────── */}
        <SectionTitle>Módulo 2 — Rendimiento por tipo de publicación</SectionTitle>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <BarChartComponent
            data={chartAlcance}
            bars={[{ key: 'Alcance Prom.', color: '#0000E1', label: 'Alcance Prom.' }]}
            xKey="tipo"
            title="Alcance promedio"
            subtitle="Por tipo de publicación"
            singleColor="#0000E1"
            colorPerBar={false}
            height={200}
          />
          <BarChartComponent
            data={chartInter}
            bars={[{ key: 'Interacc. Prom.', color: '#FC4F00', label: 'Interacciones Prom.' }]}
            xKey="tipo"
            title="Interacciones promedio"
            subtitle="Por tipo de publicación"
            singleColor="#FC4F00"
            height={200}
          />
          <BarChartComponent
            data={chartER}
            bars={[{ key: 'ER Prom. (%)', color: '#6666ED', label: 'ER Promedio (%)' }]}
            xKey="tipo"
            title="Engagement Rate promedio"
            subtitle="Por tipo de publicación"
            singleColor="#6666ED"
            height={200}
          />
        </div>

        {/* Tabla resumen por formato */}
        <Card padding="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0F0F0]">
                {['Tipo','Publicaciones','Alcance Prom.','Interacc. Prom.','ER Prom.'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-[#AAA] uppercase tracking-[0.5px] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byFormato.map((r, i) => (
                <tr key={i} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#F8F8FF]">
                  <td className="px-4 py-2.5">
                    <Badge semantic={TIPO_BADGE[r.tipo] ?? 'info'} style="outline">{r.tipo}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono">{formatNumber(r.count)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-bold text-[#0000E1]">{formatNumber(r.alcancePromedio)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-bold text-[#FC4F00]">{formatNumber(r.interaccionesPromedio)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono">
                    <span className={`font-bold ${r.erPromedio >= 5 ? 'text-[#16A34A]' : r.erPromedio >= 2 ? 'text-[#FC4F00]' : 'text-[#DC2626]'}`}>
                      {r.erPromedio.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* ── Módulo 3: Outliers / Salón de la Fama ─────────────────────── */}
        <SectionTitle>Módulo 3 — Salón de la Fama (Percentil 90)</SectionTitle>

        {outliers.length > 0 ? (
          <>
            <p className="text-xs text-[#666]">
              Publicaciones cuyo Alcance o Interacciones superan el P90 del periodo
              (umbral Alcance: <strong>{formatNumber(Math.round(outliers[0]?.p90Alcance ?? 0))}</strong> · 
              umbral Interacciones: <strong>{formatNumber(Math.round(outliers[0]?.p90Inter ?? 0))}</strong>).
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {outliers.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-card p-4 border-2 ${r.tag === 'Viral' ? 'border-[#0000E1] bg-[#F0F0FF]' : 'border-[#FC4F00] bg-[#FFF8F5]'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge semantic={TIPO_BADGE[r.tipo] ?? 'info'} style="filled">{r.tipo}</Badge>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        r.tag === 'Viral' ? 'bg-[#0000E1] text-white' : 'bg-[#FC4F00] text-white'
                      }`}>
                        {r.tag === 'Viral' ? '🔥 Viral' : '⭐ Alto Rendimiento'}
                      </span>
                    </div>
                    {r.id && (
                      <a href={MBS_URL(r.id)} target="_blank" rel="noreferrer"
                        className="text-[#0000E1] hover:text-[#0000BF] shrink-0 text-xs flex items-center gap-1">
                        Ver en MBS <ExternalLinkIcon />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[#555] line-clamp-2 mb-3">{r.descripcion}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-[#AAA] uppercase">Alcance</p>
                      <p className="text-sm font-bold text-[#0000E1]">{formatNumber(r.alcance)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#AAA] uppercase">Interacciones</p>
                      <p className="text-sm font-bold text-[#FC4F00]">{formatNumber(r.interacciones)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#AAA] uppercase">ER</p>
                      <p className="text-sm font-bold text-[#6666ED]">{r.er.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Card className="text-center py-8 text-[#AAA]">
            <p className="text-sm">No hay outliers detectados en el rango seleccionado.</p>
          </Card>
        )}


        {/* ── Módulo 4: Pauta Pagada vs Orgánico ─────────────────────────── */}
        {paidStats ? (
          <>
            <SectionTitle>Módulo 4 — Pauta pagada vs orgánico</SectionTitle>

            {/* KPIs pauta */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <p className="text-[11px] font-bold text-[#AAA] uppercase tracking-[0.5px]">Posts con pauta</p>
                <p className="text-2xl font-bold text-[#0000E1] mt-1">{paidStats.countPaid}</p>
                <p className="text-[11px] text-[#AAA] mt-0.5">del periodo</p>
              </Card>
              <Card>
                <p className="text-[11px] font-bold text-[#AAA] uppercase tracking-[0.5px]">Alcance pagado</p>
                <p className="text-2xl font-bold text-[#BDD900] mt-1" style={{color:'#5B7700'}}>{formatNumber(paidStats.totalPagado)}</p>
                <p className="text-[11px] text-[#AAA] mt-0.5">{paidStats.totalAlcance > 0 ? ((paidStats.totalPagado / paidStats.totalAlcance)*100).toFixed(1) : 0}% del total en posts con pauta</p>
              </Card>
              <Card>
                <p className="text-[11px] font-bold text-[#AAA] uppercase tracking-[0.5px]">Alcance orgánico</p>
                <p className="text-2xl font-bold text-[#0000E1] mt-1">{formatNumber(paidStats.totalOrganico)}</p>
                <p className="text-[11px] text-[#AAA] mt-0.5">{paidStats.totalAlcance > 0 ? ((paidStats.totalOrganico / paidStats.totalAlcance)*100).toFixed(1) : 0}% del total en posts con pauta</p>
              </Card>
              <Card>
                <p className="text-[11px] font-bold text-[#AAA] uppercase tracking-[0.5px]">Seguidores por pauta</p>
                <p className="text-2xl font-bold text-[#D92D8E] mt-1">{formatNumber(paidStats.totalSegPagados)}</p>
                <p className="text-[11px] text-[#AAA] mt-0.5">Total del periodo</p>
              </Card>
            </div>

            {/* Bar chart alcance orgánico vs pagado por tipo */}
            <BarChartComponent
              data={paidStats.chartData}
              bars={[
                { key: 'alcanceOrganico', color: '#0000E1', label: 'Alcance Orgánico' },
                { key: 'alcancePagado',   color: '#BDD900', label: 'Alcance Pagado'   },
              ]}
              xKey="tipo"
              title="Alcance Orgánico vs Pagado por tipo"
              subtitle="Solo publicaciones con datos de pauta"
              height={220}
            />

            {/* Top posts con pauta */}
            <Card padding="p-0">
              <div className="px-4 pt-4 pb-2">
                <p className="text-sm font-bold text-[#111]">Top posts por alcance pagado</p>
                <p className="text-[11px] text-[#AAA]">Publicaciones con mayor inversión en pauta del periodo</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    {['Tipo','Descripción','Alcance Total','Alcance Org.','Alcance Pag.','Seg. Pagados'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-[#AAA] uppercase tracking-[0.5px] px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paidStats.topPaidPosts.map((r, i) => {
                    const paid = paidMap[r.id]
                    const pctPagado = r.alcance > 0 ? ((paid.alcancePagado / r.alcance) * 100).toFixed(0) : 0
                    return (
                      <tr key={i} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFFF0]">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge semantic="info" style="outline">{r.tipo}</Badge>
                        </td>
                        <td className="px-4 py-2.5 max-w-[180px]">
                          <span className="text-xs text-[#111] line-clamp-1" title={r.descripcion}>{r.descripcion}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono font-bold text-[#111]">{formatNumber(r.alcance)}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-[#0000E1]">{formatNumber(Math.max(0, r.alcance - paid.alcancePagado))}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">
                          <span className="font-bold text-[#5B7700]">{formatNumber(paid.alcancePagado)}</span>
                          <span className="text-[#AAA] ml-1">({pctPagado}%)</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono font-bold text-[#D92D8E]">{formatNumber(paid.seguidoresPagados)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </>
        ) : (
          <>
            <SectionTitle>Módulo 4 — Pauta pagada vs orgánico</SectionTitle>
            <Card className="border-2 border-dashed border-[#E0E0E0] text-center py-10">
              <p className="text-3xl mb-3">💰</p>
              <p className="font-bold text-[#111]">Sin datos de pauta cargados</p>
              <p className="text-sm text-[#AAA] mt-1">
                Descarga el template desde <strong>Contenido → Template pauta</strong>, rellénalo con tus datos de anuncios y súbelo en <strong>Datos → Pauta Pagada</strong>.
              </p>
            </Card>
          </>
        )}

      </div>
    </div>
  )
}

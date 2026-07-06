/**
 * Vista: Contenido
 * v4: pauta pagada vs orgánico, export template, badge 💰, columnas split
 */

import { useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { useLocalData } from '../hooks/useLocalData'
import { parseMetaNumber } from '../utils/audienceParser'
import { formatNumber, calcER } from '../utils/dateUtils'
import { detectOwnAccount, filterByAccount } from '../utils/accountFilter'

// ── Constantes ────────────────────────────────────────────────────────────────

const MBS_URL = (id) =>
  `https://business.facebook.com/latest/insights/object_insights/?asset_id=627596310710449&business_id=385549068306940&ir_qe_exposed=1&content_id=${id}&nav_ref=bizweb_insights_uta_table`

const TIPO_MAP = {
  'reel de instagram':     'Reel',
  'secuencia de instagram':'Carrusel',
  'historia de instagram': 'Historia',
  'foto de instagram':     'Post',
  'video de instagram':    'Video',
}
const TIPO_BADGE = {
  Reel:'info', Carrusel:'success', Historia:'promo', Post:'warning', Video:'warning',
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline shrink-0 ml-0.5 opacity-60">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

function SortIcon({ active, dir }) {
  if (!active) return <span className="ml-0.5 text-[#CCC]">↕</span>
  return <span className="ml-0.5 text-[#0000E1]">{dir === 'asc' ? '▲' : '▼'}</span>
}

// ── Normalización ─────────────────────────────────────────────────────────────

function normalizeRow(row) {
  const g = (term) => {
    const key = Object.keys(row).find(k => k.toLowerCase().includes(term.toLowerCase()))
    return key ? row[key] : ''
  }
  const tipoRaw = String(g('tipo de publicación') || g('tipo') || '').toLowerCase()
  const tipo    = TIPO_MAP[tipoRaw] ?? 'Post'

  const rawFecha = g('hora de publicación') || g('fecha')
  let fecha = rawFecha, dateObj = null
  try {
    const d = new Date(rawFecha)
    if (!isNaN(d)) {
      dateObj = d
      fecha = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
    }
  } catch { /* ignore */ }

  const me_gusta     = parseMetaNumber(g('me gusta'))
  const comentarios  = parseMetaNumber(g('comentarios'))
  const compartidos  = parseMetaNumber(g('compartió') || g('compartidos'))
  const guardados    = parseMetaNumber(g('guardó') || g('guardados'))
  const seguimientos = parseMetaNumber(g('seguimientos'))
  const alcance      = parseMetaNumber(g('alcance'))
  const vistas       = parseMetaNumber(g('visualizaciones') || g('vistas'))
  const interacciones = me_gusta + comentarios + compartidos + guardados + seguimientos
  const id           = g('identificador de la publicación') || g('identificador') || ''

  return {
    id, tipo, fecha, dateObj,
    descripcion: String(g('descripción') || g('descripcion') || '').slice(0, 200) || '—',
    usuario:     g('nombre de usuario') || g('usuario') || '',
    me_gusta, comentarios, compartidos, guardados, seguimientos, alcance, vistas, interacciones,
    er: calcER(interacciones, alcance),
  }
}

// ── Export template helper ────────────────────────────────────────────────────

function exportPaidTemplate(rows) {
  const headers = [
    'Identificador_Publicacion',
    'Fecha',
    'Tipo',
    'Descripcion_referencia',
    'Alcance_Total',
    'Alcance_Pagado',
    'Visualizaciones_Total',
    'Visualizaciones_Pagadas',
    'Seguidores_Pagados',
  ]
  const dataRows = rows.map(r => [
    r.id,
    r.fecha,
    r.tipo,
    r.descripcion.slice(0, 60).replace(/"/g, "'"),
    r.alcance,
    '',  // usuario llena
    r.vistas,
    '',  // usuario llena
    '',  // usuario llena
  ])
  const csvLines = [headers, ...dataRows]
    .map(row => row.map(v => `"${v}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csvLines], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `template_pauta_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Columnas sorteables ───────────────────────────────────────────────────────

const METRICS = [
  { key: 'alcance',      label: 'Alcance',       dataBar: true },
  { key: 'vistas',       label: 'Vistas'         },
  { key: 'me_gusta',     label: 'Me gusta'       },
  { key: 'comentarios',  label: 'Comentarios'    },
  { key: 'compartidos',  label: 'Compartidos'    },
  { key: 'guardados',    label: 'Guardados'      },
  { key: 'seguimientos', label: 'Seguimientos'   },
  { key: 'interacciones',label: 'Interacciones'  },
  { key: 'er',           label: 'ER (%)', isER: true },
]

const PAGE_SIZE = 10

// ── Vista ─────────────────────────────────────────────────────────────────────

export default function Content({ dateProps }) {
  const { dateRange, accountFilter = 'todas' } = dateProps ?? {}
  const { rows }         = useLocalData('contenido')
  const { rows: paidRaw } = useLocalData('anuncios')

  // Mapa de pauta: { [id]: { alcancePagado, vistasPagadas, seguidoresPagados } }
  const paidMap = useMemo(() => {
    const map = {}
    for (const r of paidRaw) {
      const id = r['Identificador_Publicacion'] || r['Identificador de la publicación'] || ''
      if (!id) continue
      map[id] = {
        alcancePagado:      parseMetaNumber(r['Alcance_Pagado'] || r['Alcance pagado'] || 0),
        vistasPagadas:      parseMetaNumber(r['Visualizaciones_Pagadas'] || r['Visualizaciones pagadas'] || 0),
        seguidoresPagados:  parseMetaNumber(r['Seguidores_Pagados'] || r['Seguidores pagados'] || 0),
      }
    }
    return map
  }, [paidRaw])

  const [filter,  setFilter]  = useState('Todos')
  const [sortBy,  setSortBy]  = useState('interacciones')
  const [sortDir, setSortDir] = useState('desc')
  const [page,    setPage]    = useState(1)
  const [showPaid, setShowPaid] = useState(false)

  const normalized = useMemo(() => rows.map(normalizeRow), [rows])

  // Filtrar por fecha
  const dateFiltered = useMemo(() => {
    const { start, end } = dateRange ?? {}
    if (!start || !end) return normalized
    return normalized.filter(r => r.dateObj && r.dateObj >= start && r.dateObj <= end)
  }, [normalized, dateRange])

  // Cuenta propia detectada automáticamente (moda de `usuario` sobre todo el dataset,
  // no solo el rango de fechas, para que la detección sea estable)
  const ownAccount = useMemo(() => detectOwnAccount(normalized), [normalized])

  // Filtro de cuenta: todas las publicaciones vs. solo cuenta propia (sin collabs/externas)
  const accountFiltered = useMemo(
    () => filterByAccount(dateFiltered, accountFilter, ownAccount),
    [dateFiltered, accountFilter, ownAccount]
  )
  const hiddenByAccountFilter = dateFiltered.length - accountFiltered.length

  // Enriquecer con datos de pauta
  const enriched = useMemo(() => accountFiltered.map(r => {
    const paid = paidMap[r.id] ?? null
    return {
      ...r,
      hasPauta:           !!paid,
      alcancePagado:      paid?.alcancePagado ?? 0,
      alcanceOrganico:    r.alcance - (paid?.alcancePagado ?? 0),
      vistasPagadas:      paid?.vistasPagadas ?? 0,
      vistasOrganicas:    r.vistas - (paid?.vistasPagadas ?? 0),
      seguidoresPagados:  paid?.seguidoresPagados ?? 0,
    }
  }), [accountFiltered, paidMap])

  const tipos = useMemo(() => ['Todos', ...new Set(enriched.map(r => r.tipo))], [enriched])
  const hasPaidData = enriched.some(r => r.hasPauta)

  // KPIs del periodo
  const kpis = useMemo(() => {
    const totalInteracciones = enriched.reduce((s, r) => s + r.interacciones, 0)
    const totalAlcance       = enriched.reduce((s, r) => s + r.alcance, 0)
    const totalAlcancePagado = enriched.reduce((s, r) => s + r.alcancePagado, 0)
    const totalAlcanceOrg    = totalAlcance - totalAlcancePagado
    return {
      totalInteracciones,
      totalAlcance,
      totalAlcancePagado,
      totalAlcanceOrg,
      er: calcER(totalInteracciones, totalAlcance),
      pctPagado: totalAlcance > 0 ? (totalAlcancePagado / totalAlcance) * 100 : 0,
    }
  }, [enriched])

  // Filtro + orden
  const sorted = useMemo(() => {
    const filtered = filter === 'Todos' ? enriched
      : filter === 'Con pauta' ? enriched.filter(r => r.hasPauta)
      : enriched.filter(r => r.tipo === filter)
    return [...filtered].sort((a, b) => {
      const va = a[sortBy] ?? 0, vb = b[sortBy] ?? 0
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [enriched, filter, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const maxAlcancePagina = Math.max(...paginated.map(r => r.alcance), 1)

  function onFilter(t) { setFilter(t); setPage(1) }
  function onSort(key) {
    if (key === sortBy) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(key); setSortDir('desc') }
    setPage(1)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Contenido"
        subtitle={`${formatNumber(enriched.length)} publicaciones · ${enriched.filter(r=>r.hasPauta).length} con pauta${
          accountFilter === 'propia' && hiddenByAccountFilter > 0
            ? ` · ${hiddenByAccountFilter} collab/externas ocultas`
            : ''
        }`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-[11px] font-bold text-[#666] uppercase tracking-[0.5px]">Publicaciones</p>
            <p className="text-2xl font-bold text-[#0000E1] mt-1">{formatNumber(enriched.length)}</p>
            <p className="text-[11px] text-[#AAA] mt-0.5">Total del periodo</p>
          </Card>
          <Card>
            <p className="text-[11px] font-bold text-[#666] uppercase tracking-[0.5px]">Interacciones totales</p>
            <p className="text-2xl font-bold text-[#D92D8E] mt-1">{formatNumber(kpis.totalInteracciones)}</p>
            <p className="text-[11px] text-[#AAA] mt-0.5">Total del periodo</p>
          </Card>
          <Card>
            <p className="text-[11px] font-bold text-[#666] uppercase tracking-[0.5px]">Engagement Rate</p>
            <p className="text-2xl font-bold text-[#6666ED] mt-1">{kpis.er.toFixed(2)}%</p>
            <p className="text-[11px] text-[#AAA] mt-0.5">Interacciones / Alcance</p>
          </Card>
          {/* KPI dinámico: alcance orgánico vs pagado */}
          {hasPaidData ? (
            <Card>
              <p className="text-[11px] font-bold text-[#666] uppercase tracking-[0.5px]">Alcance pagado vs orgánico</p>
              <div className="flex items-end gap-2 mt-1">
                <div>
                  <p className="text-xs font-bold text-[#BDD900]">💰 {formatNumber(kpis.totalAlcancePagado)}</p>
                  <p className="text-xs text-[#0000E1]">🌱 {formatNumber(kpis.totalAlcanceOrg)}</p>
                </div>
                <p className="text-[11px] text-[#AAA] mb-0.5">{kpis.pctPagado.toFixed(1)}% pagado</p>
              </div>
              {/* Barra visual */}
              <div className="mt-2 h-2 rounded-full bg-[#E0E0E0] overflow-hidden">
                <div className="h-full bg-[#BDD900] rounded-full" style={{ width: `${Math.min(kpis.pctPagado, 100)}%` }} />
              </div>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-[#E0E0E0]">
              <p className="text-[11px] font-bold text-[#AAA] uppercase tracking-[0.5px]">Alcance pagado</p>
              <p className="text-sm text-[#AAA] mt-2">Sin datos de pauta</p>
              <button
                onClick={() => exportPaidTemplate(enriched)}
                className="mt-2 text-[10px] text-[#0000E1] hover:underline font-bold"
              >
                ↓ Exportar template
              </button>
            </Card>
          )}
        </div>

        {/* Controles: filtros + export template */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            {['Todos', ...(hasPaidData ? ['Con pauta'] : []), ...tipos.filter(t => t !== 'Todos')].map(t => (
              <button key={t} onClick={() => onFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-[0.5px] transition-all ${
                  filter === t
                    ? t === 'Con pauta' ? 'bg-[#BDD900] text-black' : 'bg-[#0000E1] text-white'
                    : 'bg-white text-[#666] border border-[#E0E0E0] hover:border-[#0000E1] hover:text-[#0000E1]'
                }`}>{t === 'Con pauta' ? '💰 Con pauta' : t}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {hasPaidData && (
              <button
                onClick={() => setShowPaid(v => !v)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${showPaid ? 'bg-[#BDD900] text-black border-[#BDD900]' : 'bg-white text-[#666] border-[#E0E0E0] hover:border-[#BDD900]'}`}
              >
                {showPaid ? '✓ Mostrando orgánico/pagado' : 'Ver orgánico / pagado'}
              </button>
            )}
            <button
              onClick={() => exportPaidTemplate(enriched)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#0000E1] border border-[#0000E1] hover:bg-[#F0F0FF] transition-all"
            >
              ↓ Template pauta
            </button>
          </div>
        </div>

        {/* Tabla */}
        {sorted.length > 0 ? (
          <Card padding="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    <th className="text-left text-[10px] font-bold text-[#AAA] uppercase tracking-[0.5px] px-3 py-3">#</th>
                    <th className="text-left text-[10px] font-bold text-[#AAA] uppercase tracking-[0.5px] px-3 py-3">Tipo</th>
                    <th className="text-left text-[10px] font-bold text-[#AAA] uppercase tracking-[0.5px] px-3 py-3 whitespace-nowrap">Fecha</th>
                    <th className="text-left text-[10px] font-bold text-[#AAA] uppercase tracking-[0.5px] px-3 py-3">Descripción</th>
                    {/* Columna Alcance: split si showPaid */}
                    {showPaid && hasPaidData ? (
                      <>
                        <th onClick={() => onSort('alcanceOrganico')} className="text-right text-[10px] font-bold text-[#0000E1] uppercase tracking-[0.5px] px-3 py-3 whitespace-nowrap cursor-pointer select-none">
                          Alcance Org.<SortIcon active={sortBy==='alcanceOrganico'} dir={sortDir}/>
                        </th>
                        <th onClick={() => onSort('alcancePagado')} className="text-right text-[10px] font-bold text-[#BDD900] uppercase tracking-[0.5px] px-3 py-3 whitespace-nowrap cursor-pointer select-none">
                          Alcance Pag.<SortIcon active={sortBy==='alcancePagado'} dir={sortDir}/>
                        </th>
                        <th onClick={() => onSort('vistasOrganicas')} className="text-right text-[10px] font-bold text-[#0000E1] uppercase tracking-[0.5px] px-3 py-3 whitespace-nowrap cursor-pointer select-none">
                          Vistas Org.<SortIcon active={sortBy==='vistasOrganicas'} dir={sortDir}/>
                        </th>
                        <th onClick={() => onSort('vistasPagadas')} className="text-right text-[10px] font-bold text-[#BDD900] uppercase tracking-[0.5px] px-3 py-3 whitespace-nowrap cursor-pointer select-none">
                          Vistas Pag.<SortIcon active={sortBy==='vistasPagadas'} dir={sortDir}/>
                        </th>
                        <th onClick={() => onSort('seguidoresPagados')} className="text-right text-[10px] font-bold text-[#BDD900] uppercase tracking-[0.5px] px-3 py-3 whitespace-nowrap cursor-pointer select-none">
                          Seg. Pag.<SortIcon active={sortBy==='seguidoresPagados'} dir={sortDir}/>
                        </th>
                      </>
                    ) : (
                      METRICS.slice(0, 2).map(m => (
                        <th key={m.key} onClick={() => onSort(m.key)}
                          className="text-right text-[10px] font-bold text-[#AAA] uppercase tracking-[0.5px] px-3 py-3 whitespace-nowrap cursor-pointer select-none hover:text-[#0000E1]">
                          {m.label}<SortIcon active={sortBy===m.key} dir={sortDir}/>
                        </th>
                      ))
                    )}
                    {/* Resto de columnas */}
                    {METRICS.slice(2).map(m => (
                      <th key={m.key} onClick={() => onSort(m.key)}
                        className="text-right text-[10px] font-bold text-[#AAA] uppercase tracking-[0.5px] px-3 py-3 whitespace-nowrap cursor-pointer select-none hover:text-[#0000E1]">
                        {m.label}<SortIcon active={sortBy===m.key} dir={sortDir}/>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, i) => (
                    <tr key={i} className={`border-b border-[#F0F0F0] last:border-0 transition-colors ${r.hasPauta ? 'hover:bg-[#FAFFF0]' : 'hover:bg-[#F8F8FF]'}`}>
                      <td className="px-3 py-2.5 font-bold text-[#0000E1] text-xs">
                        #{(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Badge semantic={TIPO_BADGE[r.tipo] ?? 'info'} style="outline">{r.tipo}</Badge>
                          {r.hasPauta && <span title="Con pauta pagada" className="text-xs">💰</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[#666] whitespace-nowrap">{r.fecha}</td>
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <span className="flex items-start gap-1">
                          <span className="text-xs text-[#111] line-clamp-1 flex-1" title={r.descripcion}>{r.descripcion}</span>
                          {r.id && (
                            <a href={MBS_URL(r.id)} target="_blank" rel="noreferrer"
                              title="Ver en Meta Business Suite"
                              className="text-[#0000E1] hover:text-[#0000BF] mt-0.5 shrink-0">
                              <ExternalLinkIcon />
                            </a>
                          )}
                        </span>
                      </td>

                      {/* Columnas de Alcance/Vistas — normal o split */}
                      {showPaid && hasPaidData ? (
                        <>
                          <td className="px-3 py-2.5 text-right text-xs font-mono text-[#0000E1]">{formatNumber(r.alcanceOrganico)}</td>
                          <td className={`px-3 py-2.5 text-right text-xs font-mono ${r.hasPauta ? 'font-bold text-[#5B7700]' : 'text-[#CCC]'}`}>
                            {r.hasPauta ? formatNumber(r.alcancePagado) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs font-mono text-[#0000E1]">{formatNumber(r.vistasOrganicas)}</td>
                          <td className={`px-3 py-2.5 text-right text-xs font-mono ${r.hasPauta ? 'font-bold text-[#5B7700]' : 'text-[#CCC]'}`}>
                            {r.hasPauta ? formatNumber(r.vistasPagadas) : '—'}
                          </td>
                          <td className={`px-3 py-2.5 text-right text-xs font-mono ${r.hasPauta ? 'font-bold text-[#5B7700]' : 'text-[#CCC]'}`}>
                            {r.hasPauta ? formatNumber(r.seguidoresPagados) : '—'}
                          </td>
                        </>
                      ) : (
                        METRICS.slice(0, 2).map(m => {
                          if (m.dataBar) {
                            const pct = maxAlcancePagina > 0 ? Math.round((r[m.key] / maxAlcancePagina) * 100) : 0
                            return (
                              <td key={m.key} className={`px-3 py-2.5 text-right text-xs font-mono text-[#111] relative ${sortBy===m.key?'bg-[#F0F0FF]':''}`}>
                                <div className="absolute inset-y-0 left-0 bg-[#0000E1] opacity-10 rounded-r pointer-events-none" style={{ width: `${pct}%` }}/>
                                <span className="relative z-10 font-bold">{formatNumber(r[m.key])}</span>
                              </td>
                            )
                          }
                          return (
                            <td key={m.key} className={`px-3 py-2.5 text-right text-xs font-mono text-[#111] ${sortBy===m.key?'bg-[#F0F0FF]':''}`}>
                              {formatNumber(r[m.key])}
                            </td>
                          )
                        })
                      )}

                      {/* Resto métricas */}
                      {METRICS.slice(2).map(m => {
                        if (m.isER) return (
                          <td key={m.key} className={`px-3 py-2.5 text-right text-xs font-mono ${sortBy===m.key?'bg-[#F0F0FF]':''}`}>
                            <span className={`font-bold ${r.er>=5?'text-[#16A34A]':r.er>=2?'text-[#FC4F00]':'text-[#DC2626]'}`}>
                              {r.er.toFixed(1)}%
                            </span>
                          </td>
                        )
                        return (
                          <td key={m.key} className={`px-3 py-2.5 text-right text-xs font-mono text-[#111] ${sortBy===m.key?'bg-[#F0F0FF]':''}`}>
                            {formatNumber(r[m.key])}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#F0F0F0] px-4 flex items-center justify-between">
              <p className="text-xs text-[#AAA]">{formatNumber(sorted.length)} resultados · página {page} de {totalPages}</p>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </Card>
        ) : (
          <Card className="text-center py-16">
            <p className="text-4xl mb-4">📝</p>
            <p className="font-bold text-[#111]">Sin datos en el rango seleccionado</p>
          </Card>
        )}
      </div>
    </div>
  )
}

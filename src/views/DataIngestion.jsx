/**
 * Vista: Ingesta de Datos — /datos
 *
 * Permite subir CSV exportados de Meta Business Suite.
 * Los datos se parsean en cliente con PapaParse y se almacenan
 * en IndexedDB (via localforage) con merge inteligente.
 * Las otras vistas recargan automáticamente via evento 'livo:data-updated'.
 */

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { mergeRows, getMeta, clearRows } from '../utils/storageEngine'
import { formatNumber } from '../utils/dateUtils'
import Card from '../components/ui/Card'
import Header from '../components/layout/Header'

// ── Configuración de zonas ──────────────────────────────────────────────────

const ZONES = [
  {
    type: 'resultados',
    label: 'Rendimiento Diario',
    icon: '📈',
    color: '#0000E1',
    desc: 'Archivos de métricas: Alcance, Visitas, Visualizaciones, Interacciones, Seguidores, Clics.',
    hint: 'También acepta el CSV consolidado generado por scripts/consolidate.py',
    validate: (headers) => {
      const h = headers.map(x => x.toLowerCase())
      const hasFecha  = h.some(x => x.includes('fecha') || x.includes('date'))
      const hasMetric = h.some(x => x.includes('alcance') || x.includes('visualiz') || x.includes('primary'))
      if (!hasFecha)  return 'El CSV no contiene columna de fecha (Fecha / Date).'
      if (!hasMetric) return 'El CSV no contiene métricas reconocibles (Alcance, Visualizaciones o Primary).'
      return null
    },
    keyHint: 'Deduplicación: por fecha (YYYY-MM-DD)',
  },
  {
    type: 'contenido',
    label: 'Contenido',
    icon: '📝',
    color: '#D92D8E',
    desc: 'Exportaciones de publicaciones: Posts, Reels, Historias.',
    hint: 'Acepta ambos formatos de Meta (Posts/Reels y Historias)',
    validate: (headers) => {
      const h = headers.map(x => x.toLowerCase())
      const hasLink   = h.some(x => x.includes('enlace permanente') || x.includes('permalink'))
      const hasAlcance = h.some(x => x.includes('alcance') || x.includes('reach'))
      if (!hasLink && !hasAlcance) return 'El CSV debe contener "Enlace permanente" o "Alcance" para ser válido.'
      return null
    },
    keyHint: 'Deduplicación: por ID de publicación',
  },
  {
    type: 'publico',
    label: 'Público',
    icon: '👥',
    color: '#FC4F00',
    desc: 'Datos de audiencia: edad, género, ciudades y países.',
    hint: 'Snapshot del público — reemplaza datos anteriores de público',
    validate: (headers) => {
      const h = headers.map(x => x.toLowerCase())
      const hasAge     = h.some(x => x.includes('edad') || x.includes('rango'))
      const hasGender  = h.some(x => x.includes('mujeres') || x.includes('hombres'))
      const hasPais    = h.some(x => x.includes('pa') || x.includes('ciudad'))
      if (!hasAge && !hasGender && !hasPais) {
        return 'El CSV no parece ser un archivo de Público de Meta (no tiene columnas de edad, género ni geografía).'
      }
      return null
    },
    keyHint: 'Reemplaza el snapshot anterior',
  },
  {
    type: 'anuncios',
    label: 'Pauta Pagada',
    icon: '💰',
    color: '#BDD900',
    desc: 'Métricas pagadas por publicación: Alcance, Visualizaciones y Seguidores generados desde anuncios.',
    hint: 'Descarga el template desde la vista Contenido → "Exportar template de pauta"',
    validate: (headers) => {
      const h = headers.map(x => x.toLowerCase())
      const hasId = h.some(x => x.includes('identificador'))
      if (!hasId) return 'El CSV debe tener columna "Identificador_Publicacion". Descarga el template desde la vista Contenido.'
      return null
    },
    keyHint: 'Deduplicación: por Identificador_Publicacion',
  },
]

// ── Componente de zona individual ─────────────────────────────────────────

function DropZone({ zone, onFileAccepted }) {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    getMeta(zone.type).then(m => { if (m) setMeta(m) })
    const handler = () => getMeta(zone.type).then(m => { if (m) setMeta(m) })
    window.addEventListener('livo:data-updated', handler)
    return () => window.removeEventListener('livo:data-updated', handler)
  }, [zone.type])

  const onDrop = useCallback(async (accepted, rejected) => {
    if (rejected.length) {
      setStatus('error')
      setMessage('Solo se aceptan archivos .csv')
      return
    }
    if (!accepted.length) return

    const file = accepted[0]
    setStatus('loading')
    setMessage(`Procesando ${file.name}…`)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (result) => {
        const { data, meta: parseMeta } = result
        if (!data.length) {
          setStatus('error')
          setMessage('El archivo está vacío o no se pudo parsear.')
          return
        }

        // Validar columnas
        const error = zone.validate(parseMeta.fields ?? Object.keys(data[0]))
        if (error) {
          setStatus('error')
          setMessage(error)
          return
        }

        try {
          const { added, total } = await mergeRows(zone.type, data)
          setStatus('success')
          setMessage(`✓ ${added > 0 ? `+${added} filas nuevas` : 'Sin filas nuevas (ya existían)'} · ${total} total`)
          onFileAccepted?.(zone.type)
        } catch (err) {
          setStatus('error')
          setMessage(`Error al guardar: ${err.message}`)
        }
      },
      error: (err) => {
        setStatus('error')
        setMessage(`Error de parseo: ${err.message}`)
      },
    })
  }, [zone, onFileAccepted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv', '.txt'] },
    multiple: false,
  })

  const handleClear = async (e) => {
    e.stopPropagation()
    await clearRows(zone.type)
    setStatus('idle')
    setMessage('')
    setMeta(null)
  }

  const borderColor = isDragActive ? zone.color
    : status === 'success' ? '#16A34A'
    : status === 'error'   ? '#DC2626'
    : '#E0E0E0'

  return (
    <Card padding="p-0" className="overflow-hidden">
      {/* Header de zona */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F0F0F0]">
        <span className="text-2xl">{zone.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#111] text-sm">{zone.label}</p>
          <p className="text-[11px] text-[#666]">{zone.desc}</p>
        </div>
        <div className="shrink-0 text-right">
          {meta ? (
            <div>
              <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wide">
                {formatNumber(meta.total)} filas
              </p>
              {meta.dateRange && (
                <p className="text-[10px] text-[#AAA]">{meta.dateRange.from} → {meta.dateRange.to}</p>
              )}
              <p className="text-[10px] text-[#AAA]">
                Actualizado {new Date(meta.lastUpdated).toLocaleDateString('es-CO')}
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-[#AAA]">Sin datos en IndexedDB<br />usando CSV estático</p>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className="m-4 rounded-lg border-2 border-dashed cursor-pointer transition-all"
        style={{ borderColor }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
          {status === 'loading' ? (
            <div className="w-7 h-7 border-3 border-[#0000E1] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDragActive ? zone.color : '#CCC'} strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
          <p className="text-sm font-bold text-[#555]">
            {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un CSV aquí'}
          </p>
          <p className="text-xs text-[#AAA]">o <span className="underline text-[#0000E1]">haz clic para seleccionar</span></p>
          <p className="text-[10px] text-[#CCC]">{zone.hint}</p>
        </div>
      </div>

      {/* Feedback */}
      {message && (
        <div className={`mx-4 mb-3 px-3 py-2 rounded-lg text-xs font-medium ${
          status === 'success' ? 'bg-[#DCFCE7] text-[#16A34A]'
          : status === 'error'   ? 'bg-[#FEE2E2] text-[#DC2626]'
          : 'bg-[#F0F0F0] text-[#666]'
        }`}>
          {message}
        </div>
      )}

      {/* Footer con deduplication hint + clear */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#F0F0F0] bg-[#FAFAFA]">
        <p className="text-[10px] text-[#AAA]">{zone.keyHint}</p>
        {meta && (
          <button
            onClick={handleClear}
            className="text-[10px] text-[#DC2626] hover:underline font-bold"
          >
            Limpiar datos
          </button>
        )}
      </div>
    </Card>
  )
}

// ── Vista principal ──────────────────────────────────────────────────────────

export default function DataIngestion() {
  const [lastUpdated, setLastUpdated] = useState(null)

  const onFileAccepted = (type) => {
    setLastUpdated({ type, at: new Date() })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Ingesta de Datos"
        subtitle="Sube CSVs exportados de Meta Business Suite — se guardan localmente en el navegador"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Banner informativo */}
        <Card className="bg-[#F0F0FF] border border-[#CCCCFF]">
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0">🔒</span>
            <div>
              <p className="font-bold text-[#0000E1] text-sm mb-1">Datos 100% locales — sin servidor</p>
              <p className="text-xs text-[#555] leading-relaxed">
                Los archivos se procesan en tu navegador y se almacenan en <strong>IndexedDB</strong>.
                No se envían a ningún servidor. Persisten entre recargas en este navegador/dispositivo.
              </p>
              <p className="text-xs text-[#555] mt-1 leading-relaxed">
                <strong>Flujo de actualización:</strong> Descarga nuevos CSVs de Meta Business Suite cada mes →
                arrástralos aquí → los datos se fusionan con los existentes automáticamente (sin duplicados) →
                todas las vistas se actualizan al instante.
              </p>
            </div>
          </div>
        </Card>

        {lastUpdated && (
          <div className="bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] text-xs font-bold px-4 py-2 rounded-lg">
            ✓ Datos de <strong>{lastUpdated.type}</strong> actualizados a las {lastUpdated.at.toLocaleTimeString('es-CO')} — todas las vistas se han recargado.
          </div>
        )}

        {/* Zonas de drop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ZONES.map(zone => (
            <DropZone key={zone.type} zone={zone} onFileAccepted={onFileAccepted} />
          ))}
        </div>

        {/* Info técnica */}
        <Card className="bg-[#F5F5F5]">
          <p className="text-[11px] font-bold text-[#555] uppercase tracking-wider mb-3">Formatos CSV aceptados por zona</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs text-[#666]">
            <div>
              <p className="font-bold text-[#0000E1] mb-1">📈 Rendimiento Diario</p>
              <p>• Archivos de métricas MBS (UTF-16 LE): Alcance.csv, Visitas.csv, etc.</p>
              <p>• CSV consolidado de <code className="bg-[#E0E0E0] px-1 rounded">scripts/consolidate.py</code></p>
            </div>
            <div>
              <p className="font-bold text-[#D92D8E] mb-1">📝 Contenido</p>
              <p>• Exports de posts/reels (archivo con ID numérico largo)</p>
              <p>• Exports de historias (misma estructura)</p>
              <p>• Se aceptan ambos formatos: fusionados en un único dataset</p>
            </div>
            <div>
              <p className="font-bold text-[#FC4F00] mb-1">👥 Público</p>
              <p>• Público.csv de la sección Audience de MBS</p>
              <p>• Formato multi-sección (edad/sexo, países, ciudades)</p>
              <p>• El CSV consolidado de <code className="bg-[#E0E0E0] px-1 rounded">consolidate.py</code> ya está en formato correcto</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}

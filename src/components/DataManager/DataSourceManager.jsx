/**
 * DataSourceManager — v4
 * Todas las fuentes son iguales: editables y eliminables.
 * Tipos: resultados | contenido | publico
 * Soporta múltiples fuentes del mismo tipo (compendio por período).
 */

import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { previewUrl } from '../../utils/csvParser'
import Spinner from '../ui/Spinner'

const TYPE_OPTIONS = [
  { value: 'resultados', label: 'Resultados', desc: 'Serie diaria de métricas' },
  { value: 'contenido',  label: 'Contenido',  desc: 'Rendimiento de publicaciones' },
  { value: 'publico',    label: 'Público',    desc: 'Demografía de audiencia' },
]
const TYPE_BADGE = { resultados: 'info', contenido: 'success', publico: 'promo' }

function SourceRow({ source, onToggle, onRemove, onEdit }) {
  const typeMeta = TYPE_OPTIONS.find(t => t.value === source.type) ?? TYPE_OPTIONS[0]
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F0F0F0] last:border-0">
      <button
        onClick={() => onToggle(source.id)}
        className={`relative w-11 h-6 shrink-0 rounded-full transition-colors focus:outline-none ${
          source.enabled ? 'bg-[#0000E1]' : 'bg-[#CCC]'
        }`}
        aria-label={source.enabled ? 'Desactivar' : 'Activar'}
      >
        <span className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-thumb transition-all ${
          source.enabled ? 'right-[2px]' : 'left-[2px]'
        }`} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-[#111] truncate">{source.label}</span>
          <Badge semantic={TYPE_BADGE[source.type] ?? 'info'} style="outline">{typeMeta.label}</Badge>
        </div>
        <p className="text-[11px] text-[#AAA] truncate mt-0.5">{source.url}</p>
      </div>

      <div className="flex gap-2 shrink-0">
        <button onClick={() => onEdit(source)} className="text-[#0000E1] hover:text-[#0000BF] text-xs font-bold transition-colors">
          Editar
        </button>
        <button onClick={() => onRemove(source.id)} className="text-[#DC2626] hover:text-[#B91C1C] text-xs font-bold transition-colors">
          Eliminar
        </button>
      </div>
    </div>
  )
}

function AddEditForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? { label: '', url: '', type: 'resultados' })
  const [errors, setErrors] = useState({})
  const [previewing, setPreviewing] = useState(false)
  const [previewResult, setPreviewResult] = useState(null)

  function validate() {
    const e = {}
    if (!form.label.trim()) e.label = 'El nombre es requerido'
    if (!form.url.trim()) e.url = 'La URL es requerida'
    else if (!form.url.startsWith('http')) e.url = 'Ingresa una URL válida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePreview() {
    if (!form.url.trim()) return
    setPreviewing(true)
    setPreviewResult(null)
    try {
      const res = await previewUrl(form.url, 3)
      setPreviewResult(res)
    } catch {
      setPreviewResult({ ok: false, errors: [{ message: 'No se pudo acceder a la URL' }] })
    } finally {
      setPreviewing(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSave(form) }} className="space-y-4 mt-4">
      <Input
        label="Nombre de la fuente"
        placeholder="Ej: Resultados Q1-2026"
        value={form.label}
        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        error={errors.label}
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-[#111] tracking-[0.5px] uppercase">Vista de destino</label>
        <select
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          className="w-full h-[44px] px-3 bg-white border-[1.5px] border-[#DDD] rounded-input text-sm text-[#111] focus:outline-none focus:border-[#0000E1] focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.2)] transition-shadow"
        >
          {TYPE_OPTIONS.map(t => (
            <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Input
          label="URL del CSV de Google Sheets"
          placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
          value={form.url}
          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
          error={errors.url}
        />
        <button type="button" onClick={handlePreview} disabled={previewing || !form.url.trim()}
          className="text-xs text-[#0000E1] font-bold hover:underline disabled:opacity-40 flex items-center gap-1">
          {previewing ? <Spinner size={12} /> : null}
          {previewing ? 'Verificando…' : 'Verificar URL'}
        </button>
        {previewResult && (
          <div className={`rounded-input p-3 text-xs ${previewResult.ok ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>
            {previewResult.ok
              ? `✅ OK — ${previewResult.data?.length ?? 0} filas. Columnas: ${previewResult.columns?.slice(0, 4).join(', ')}${(previewResult.columns?.length ?? 0) > 4 ? '…' : ''}`
              : `❌ ${previewResult.errors?.[0]?.message ?? 'URL no accesible'}`}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary">{initial ? 'Guardar cambios' : 'Agregar fuente'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function DataSourceManager({ open, onClose, dataSources }) {
  const { sources, addSource, updateSource, removeSource, toggleSource } = dataSources
  const [editing, setEditing] = useState(null)
  const [adding, setAdding]   = useState(false)

  if (!open) return null

  function handleSave(form) {
    if (editing) { updateSource(editing.id, form); setEditing(null) }
    else { addSource(form); setAdding(false) }
  }

  const byType = TYPE_OPTIONS.map(t => ({
    ...t,
    items: sources.filter(s => s.type === t.value),
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="w-full max-w-md h-full bg-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0F0]">
          <div>
            <h2 className="text-lg font-bold text-[#111]">Fuentes de datos</h2>
            <p className="text-xs text-[#666] mt-0.5">
              {sources.filter(s => s.enabled).length} activa{sources.filter(s => s.enabled).length !== 1 ? 's' : ''} · Agrega múltiples CSV para ampliar el rango histórico
            </p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-[#111] transition-colors" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {(adding || editing) ? (
            <div>
              <h3 className="text-sm font-bold text-[#111]">{editing ? 'Editar fuente' : 'Nueva fuente'}</h3>
              <AddEditForm initial={editing} onSave={handleSave} onCancel={() => { setAdding(false); setEditing(null) }} />
            </div>
          ) : (
            <div className="space-y-5">
              <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Agregar fuente
              </Button>

              {byType.map(({ value, label, items }) => (
                <section key={value}>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[11px] font-bold text-[#AAA] uppercase tracking-[0.5px]">{label}</p>
                    <Badge semantic={TYPE_BADGE[value]} style="outline">{items.length} fuente{items.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-[#CCC] py-2">Sin fuentes configuradas</p>
                  ) : (
                    items.map(s => (
                      <SourceRow key={s.id} source={s} onToggle={toggleSource} onRemove={removeSource} onEdit={setEditing} />
                    ))
                  )}
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#F2F2FD] border-t border-[#E5E5FC]">
          <p className="text-[11px] text-[#0000C0] leading-relaxed">
            <strong>Tip:</strong> Puedes agregar múltiples CSVs del mismo tipo para cubrir períodos distintos (ej: Q1 + Q2). Los datos se fusionan automáticamente.
          </p>
        </div>
      </aside>
    </div>
  )
}

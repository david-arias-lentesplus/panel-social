/**
 * Vista: Público
 * v2: leyendas explícitas en todos los charts, color único en países
 * El sheet de Público no tiene serie temporal → no aplica filtro de fecha
 */

import { useMemo } from 'react'
import Header from '../components/layout/Header'
import PieChartComponent from '../components/charts/PieChartComponent'
import BarChartComponent from '../components/charts/BarChartComponent'
import Card from '../components/ui/Card'
import { useLocalData } from '../hooks/useLocalData'
import { parseAudienceSheet } from '../utils/audienceParser'
import { formatNumber } from '../utils/dateUtils'

export default function Audience() {
  const { rows, loading } = useLocalData('publico')

  const { ages, cities, countries } = useMemo(() => parseAudienceSheet(rows), [rows])

  const totalMujeres = ages.reduce((s, r) => s + r.Mujeres, 0)
  const totalHombres = ages.reduce((s, r) => s + r.Hombres, 0)

  // Género: datos para el donut
  const generoData = [
    { name: 'Mujeres', value: parseFloat(totalMujeres.toFixed(1)) },
    { name: 'Hombres', value: parseFloat(totalHombres.toFixed(1)) },
  ].filter(d => d.value > 0)

  const GENDER_COLORS = ['#D92D8E', '#0000E1']

  // Países: color único azul primario (no arcoíris — principio de coherencia)
  const topCountries = [...countries].sort((a,b) => b.value - a.value).slice(0, 15)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Público"
        subtitle="Demografía de la audiencia de Instagram"
        loading={loading}
        onRefresh={null}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* KPIs */}
        {!loading && ages.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <p className="text-[11px] font-bold text-[#666] uppercase tracking-[0.5px]">Audiencia femenina</p>
              <p className="text-2xl font-bold text-[#D92D8E] mt-1">{totalMujeres.toFixed(1)}%</p>
            </Card>
            <Card>
              <p className="text-[11px] font-bold text-[#666] uppercase tracking-[0.5px]">Audiencia masculina</p>
              <p className="text-2xl font-bold text-[#0000E1] mt-1">{totalHombres.toFixed(1)}%</p>
            </Card>
            <Card>
              <p className="text-[11px] font-bold text-[#666] uppercase tracking-[0.5px]">Ciudades registradas</p>
              <p className="text-2xl font-bold text-[#FC4F00] mt-1">{formatNumber(cities.length)}</p>
            </Card>
          </div>
        )}

        {/* Fila 1: Género (donut con leyenda) + Top ciudades (donut con leyenda) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Género: colores específicos Femenino=rosa, Masculino=azul */}
          <PieChartComponent
            data={generoData}
            nameKey="name"
            valueKey="value"
            title="Distribución por género"
            subtitle="% de audiencia total · Leyenda: color por género"
            loading={loading}
            innerRadius={65}
            colors={GENDER_COLORS}
          />

          {/* Top ciudades: leyenda externa muestra nombre + % */}
          <PieChartComponent
            data={[...cities].sort((a,b) => b.value - a.value).slice(0, 8)}
            nameKey="name"
            valueKey="value"
            title="Top ciudades"
            subtitle="% de audiencia por ciudad"
            loading={loading}
            innerRadius={65}
          />
        </div>

        {/* Edad y Género — BarChart agrupado con leyenda explícita */}
        <BarChartComponent
          data={ages}
          bars={[
            { key: 'Mujeres', color: '#D92D8E', label: 'Mujeres (%)' },
            { key: 'Hombres', color: '#0000E1', label: 'Hombres (%)' },
          ]}
          xKey="label"
          title="Distribución por edad y género"
          subtitle="% de audiencia por rango de edad · Rosa = Mujeres · Azul = Hombres"
          loading={loading}
          layout="horizontal"
          height={240}
        />

        {/* Países — color único azul (no multicolor: misma variable, mismo color) */}
        <BarChartComponent
          data={topCountries}
          bars={[{ key: 'value', color: '#0000E1', label: 'Porcentaje (%)' }]}
          xKey="name"
          title="Audiencia por país"
          subtitle="% de audiencia · Top 15 países"
          loading={loading}
          layout="vertical"
          singleColor="#0000E1"
          height={Math.max(200, topCountries.length * 32)}
        />

        {/* Empty state */}
        {!loading && rows.length === 0 && (
          <Card className="text-center py-16">
            <p className="text-4xl mb-4">👥</p>
            <p className="font-bold text-[#111]">Sin datos de público</p>
            <p className="text-sm text-[#666] mt-1">Sube el archivo de Público en la sección <strong>Datos</strong>.</p>
          </Card>
        )}
      </div>
    </div>
  )
}

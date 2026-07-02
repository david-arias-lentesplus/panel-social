/**
 * App.jsx — Root component v3
 * Nuevas rutas: /analisis (Analysis) + /datos (DataIngestion)
 * Vistas ya no reciben dataSources (usan useLocalData internamente)
 */

import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'

import Sidebar from './components/layout/Sidebar'
import GlobalBar from './components/layout/GlobalBar'
import DataSourceManager from './components/DataManager/DataSourceManager'
import ErrorBoundary from './components/ErrorBoundary'
import { useDataSources } from './hooks/useDataSources'
import { useDateRange } from './hooks/useDateRange'

import Overview      from './views/Overview'
import Content       from './views/Content'
import Audience      from './views/Audience'
import Analysis      from './views/Analysis'
import DataIngestion from './views/DataIngestion'

export default function App() {
  const dataSources = useDataSources()
  const { dateRange, setPreset, setCustomRange, toggleCompare, monthSpan, filterByDate } = useDateRange()
  const [dmOpen, setDmOpen] = useState(false)

  const dateProps = { dateRange, monthSpan, filterByDate }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F0F0]">
      <Sidebar onOpenDataManager={() => setDmOpen(true)} />

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <GlobalBar
          dateRange={dateRange}
          setPreset={setPreset}
          setCustomRange={setCustomRange}
          toggleCompare={toggleCompare}
        />

        <div className="flex-1 overflow-hidden">
          <ErrorBoundary>
            <Routes>
              <Route path="/"         element={<Overview  dateProps={dateProps} />} />
              <Route path="/contenido"element={<Content   dateProps={dateProps} />} />
              <Route path="/publico"  element={<Audience />} />
              <Route path="/analisis" element={<Analysis  dateProps={dateProps} />} />
              <Route path="/datos"    element={<DataIngestion />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>

      <DataSourceManager
        open={dmOpen}
        onClose={() => setDmOpen(false)}
        dataSources={dataSources}
      />
    </div>
  )
}

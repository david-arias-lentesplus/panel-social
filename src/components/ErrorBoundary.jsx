/**
 * ErrorBoundary — captura errores de render en cualquier vista hija
 * y muestra un fallback en lugar de una pantalla en blanco.
 */

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? 'Error desconocido' }
  }

  componentDidCatch(error, info) {
    console.error('[Panel Social] Error capturado:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="bg-white rounded-card shadow-card p-10 max-w-md w-full">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#111] mb-2">Algo salió mal</h2>
            <p className="text-sm text-[#666] mb-2">{this.state.message}</p>
            <p className="text-xs text-[#AAA] mb-6">
              Revisa que la URL del Google Sheet sea válida y esté publicada como CSV.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="bg-[#0000E1] text-white font-bold text-sm tracking-[0.5px] px-[18px] py-3 rounded-full hover:bg-[#0000C0] transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

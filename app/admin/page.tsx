'use client'
import { useState } from 'react'

export default function Admin() {
  const [poema, setPoema] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cantidad, setCantidad] = useState<number|null>(null)

  async function cargarCantidad() {
    const res = await fetch('/api/cantidad')
    const data = await res.json()
    setCantidad(data.cantidad)
  }

  async function generar() {
    setCargando(true)
    const res = await fetch('/api/generar', { method: 'POST' })
    const data = await res.json()
    setPoema(data.poema)
    setCargando(false)
  }

  async function nuevaSesion() {
    await fetch('/api/nueva-sesion', { method: 'POST' })
    setPoema('')
    setCantidad(null)
    alert('nueva sesión iniciada')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8 gap-8">
      <button
        onClick={cargarCantidad}
        className="px-6 py-2 border border-white/30 rounded-full text-sm"
      >
        ver cuántas respuestas hay
      </button>
      {cantidad !== null && (
        <p className="text-white/60">{cantidad} respuestas recibidas</p>
      )}
      <button
        onClick={generar}
        disabled={cargando}
        className="px-10 py-4 border border-white rounded-full text-xl hover:bg-white hover:text-black transition-all disabled:opacity-30"
      >
        {cargando ? 'generando...' : 'generar poema colectivo'}
      </button>
      {poema && (
        <div className="max-w-2xl text-center text-xl font-light leading-relaxed whitespace-pre-wrap mt-8">
          {poema}
        </div>
      )}
      <button
        onClick={nuevaSesion}
        className="px-6 py-2 border border-white/20 rounded-full text-sm text-white/40 hover:text-white/60 mt-8"
      >
        nueva sesión
      </button>
    </main>
  )
}
'use client'
import { useState } from 'react'

export default function Home() {
  const [texto, setTexto] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function enviar() {
    if (!texto.trim()) return
    setCargando(true)
    await fetch('/api/respuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: texto }),
    })
    setEnviado(true)
    setCargando(false)
  }

  if (enviado) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8">
      <p className="text-2xl text-center font-light">tu ofrenda fue recibida</p>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8 gap-8">
      <h1 className="text-4xl text-center font-light max-w-md leading-relaxed">
        Tu dios
      </h1>
      <p className="text-white/40 text-center text-lg font-light">completá la oración</p>
      <textarea
        className="w-full max-w-md bg-transparent border border-white/30 rounded-lg p-4 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/60"
        rows={3}
        placeholder="Tu dios..."
        value={texto}
        onChange={e => setTexto(e.target.value)}
      />
      <button
        onClick={enviar}
        disabled={cargando || !texto.trim()}
        className="px-8 py-3 border border-white/50 rounded-full text-white/80 hover:text-white hover:border-white transition-all disabled:opacity-30"
      >
        {cargando ? 'ofrendando...' : 'ofrecer'}
      </button>
    </main>
  )
}
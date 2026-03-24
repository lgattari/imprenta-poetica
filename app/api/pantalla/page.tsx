'use client'
import { useState, useEffect } from 'react'

export default function Pantalla() {
  const [respuestas, setRespuestas] = useState<string[]>([])
  const [poema, setPoema] = useState('')
  const [modo, setModo] = useState<'preguntas' | 'poema'>('preguntas')

  async function cargar() {
    const res = await fetch('/api/pantalla')
    const data = await res.json()
    if (data.poema) {
      setPoema(data.poema)
      setModo('poema')
    } else {
      setRespuestas(data.respuestas)
      setModo('preguntas')
    }
  }

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 3000)
    return () => clearInterval(interval)
  }, [])

  if (modo === 'poema') return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-16">
      <p className="text-2xl font-light leading-relaxed whitespace-pre-wrap max-w-3xl text-center">
        {poema}
      </p>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white p-16 flex flex-col gap-6">
      <p className="text-white/30 text-sm tracking-widest uppercase mb-4">
        preguntas del público
      </p>
      <div className="flex flex-col gap-4">
        {respuestas.map((r, i) => (
          <p
            key={i}
            className="text-2xl font-light text-white/80 border-l border-white/20 pl-6"
          >
            {r}
          </p>
        ))}
      </div>
      {respuestas.length === 0 && (
        <p className="text-white/20 text-xl">esperando preguntas...</p>
      )}
    </main>
  )
}
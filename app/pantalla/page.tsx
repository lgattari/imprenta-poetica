'use client'
import { useState, useEffect } from 'react'

export default function Pantalla() {
  const [respuestas, setRespuestas] = useState<string[]>([])
  const [poema, setPoema] = useState('')
  const [modo, setModo] = useState<'preguntas' | 'poema'>('preguntas')
  const [actual, setActual] = useState(0)
  const [visible, setVisible] = useState(true)

  async function cargar() {
    const res = await fetch('/api/estado')
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
    const fetchInterval = setInterval(cargar, 3000)
    return () => clearInterval(fetchInterval)
  }, [])

  useEffect(() => {
    if (respuestas.length === 0) return
    const rotacion = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActual(i => (i + 1) % respuestas.length)
        setVisible(true)
      }, 600)
    }, 3500)
    return () => clearInterval(rotacion)
  }, [respuestas])

  if (modo === 'poema') return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-16">
      <p className="text-2xl font-light leading-relaxed whitespace-pre-wrap max-w-3xl text-center"
        style={{ animation: 'aparecer 2s ease-in-out' }}>
        {poema}
      </p>
      <style>{`
        @keyframes aparecer {
          from { opacity: 0; letter-spacing: 0.5em; }
          to { opacity: 1; letter-spacing: normal; }
        }
      `}</style>
    </main>
  )

  const transiciones = [
    'glitch 0.6s ease-out',
    'caer 0.6s cubic-bezier(.68,-0.55,.27,1.55)',
    'rotar 0.6s ease-out',
    'explotar 0.6s ease-out',
  ]

  const transicion = transiciones[actual % transiciones.length]

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-16 overflow-hidden">
      <p className="text-white/20 text-xs tracking-widest uppercase mb-16">
        {respuestas.length} {respuestas.length === 1 ? 'pregunta' : 'preguntas'} en el sistema
      </p>

      {respuestas.length === 0 ? (
        <p className="text-white/20 text-2xl">esperando preguntas...</p>
      ) : (
        <p
          className="text-4xl font-light text-center max-w-2xl leading-relaxed"
          style={{
            opacity: visible ? 1 : 0,
            animation: visible ? transicion : 'none',
            transition: visible ? 'none' : 'opacity 0.4s ease',
          }}
        >
          {respuestas[actual]}
        </p>
      )}

      <style>{`
        @keyframes glitch {
          0% { opacity:0; transform: skewX(20deg) translateX(-30px); filter: blur(8px); }
          40% { opacity:1; transform: skewX(-5deg) translateX(5px); filter: blur(0); }
          70% { transform: skewX(2deg); }
          100% { transform: skewX(0); }
        }
        @keyframes caer {
          0% { opacity:0; transform: translateY(-80px) rotate(-3deg); }
          60% { opacity:1; transform: translateY(10px) rotate(1deg); }
          100% { transform: translateY(0) rotate(0); }
        }
        @keyframes rotar {
          0% { opacity:0; transform: rotate(-180deg) scale(0.3); }
          70% { opacity:1; transform: rotate(10deg) scale(1.05); }
          100% { transform: rotate(0) scale(1); }
        }
        @keyframes explotar {
          0% { opacity:0; transform: scale(3); filter: blur(12px); }
          60% { opacity:1; transform: scale(0.95); filter: blur(0); }
          100% { transform: scale(1); }
        }
      `}</style>
    </main>
  )
}
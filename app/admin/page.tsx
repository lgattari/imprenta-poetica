'use client'
import { useState, useEffect } from 'react'

interface Pregunta {
  id: string
  contenido: string
  respondida: boolean
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
  interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    start(): void
    stop(): void
    onstart: (() => void) | null
    onend: (() => void) | null
    onerror: (() => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
  }
}

export default function Admin() {
  const [caracteristicas, setCaracteristicas] = useState<number>(0)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [estado, setEstado] = useState<string>('activa')
  const [preguntaCustom, setPreguntaCustom] = useState('')
  const [cargando, setCargando] = useState(false)
  const [respuesta, setRespuesta] = useState('')
  const [escuchando, setEscuchando] = useState(false)

  function escucharPregunta() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-AR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setEscuchando(true)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const texto = event.results[0][0].transcript
      setPreguntaCustom(texto)
      setEscuchando(false)
      preguntar(texto)
    }

    recognition.onerror = () => setEscuchando(false)
    recognition.onend = () => setEscuchando(false)

    recognition.start()
  }
  async function cargarEstado() {
    const res = await fetch('/api/estado')
    const data = await res.json()
    setEstado(data.estado ?? 'activa')
    setCaracteristicas(data.respuestas?.length ?? 0)
    if (data.preguntas) setPreguntas(data.preguntas)
  }

  useEffect(() => {
    cargarEstado()
    const interval = setInterval(cargarEstado, 3000)
    return () => clearInterval(interval)
  }, [])

  async function iniciarDisolucion() {
    await fetch('/api/disolucion', { method: 'POST' })
  }

  async function invocar() {
    setCargando(true)
    await fetch('/api/invocar', { method: 'POST' })
    setCargando(false)
  }

  async function preguntar(texto: string) {
    if (!texto.trim()) return
    setCargando(true)
    const res = await fetch('/api/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: texto }),
    })
    const data = await res.json()
    setRespuesta(data.respuesta)
    setPreguntaCustom('')
    setCargando(false)
  }

  async function nuevaSesion() {
    await fetch('/api/nueva-sesion', { method: 'POST' })
    setRespuesta('')
    setPreguntas([])
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col gap-6 max-w-lg mx-auto">
      <p className="text-white/40 text-xs tracking-widest uppercase">panel de control</p>

      <div className="border border-white/10 rounded-lg p-4 flex flex-col gap-2">
        <p className="text-white/60 text-sm">estado: <span className="text-white">{estado}</span></p>
        <p className="text-white/60 text-sm">características recibidas: <span className="text-white">{caracteristicas}</span></p>
      </div>

      {estado === 'activa' && (
        <button onClick={iniciarDisolucion}
          className="px-8 py-4 border border-orange-500 rounded-full text-orange-400 hover:bg-orange-500 hover:text-black transition-all">
          iniciar disolución
        </button>
      )}

      {estado === 'disolucion' && (
        <button onClick={invocar} disabled={cargando}
          className="px-8 py-4 border border-purple-500 rounded-full text-purple-400 hover:bg-purple-500 hover:text-black transition-all disabled:opacity-30">
          {cargando ? 'invocando...' : 'invocar al dios'}
        </button>
      )}

      {estado === 'dios' && (
        <div className="flex flex-col gap-4">
          <p className="text-white/40 text-sm">el dios está despierto</p>

          <div className="flex flex-col gap-2">
            <textarea
              className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/50"
              rows={2}
              placeholder="hacele una pregunta al dios..."
              value={preguntaCustom}
              onChange={e => setPreguntaCustom(e.target.value)}
            />
            <button
              onClick={escucharPregunta}
              disabled={cargando || escuchando}
              className="px-6 py-2 border border-white/30 rounded-full text-sm disabled:opacity-30 hover:border-white transition-all"
            >
              {escuchando ? 'escuchando...' : 'hablar'}
            </button>
            <button onClick={() => preguntar(preguntaCustom)} disabled={cargando || !preguntaCustom.trim()}
              className="px-6 py-2 border border-white/50 rounded-full text-sm disabled:opacity-30 hover:border-white transition-all">
              {cargando ? 'el dios piensa...' : 'preguntar'}
            </button>
          </div>

          {respuesta && (
            <div className="border border-white/10 rounded-lg p-4">
              <p className="text-white/40 text-xs mb-2">última respuesta</p>
              <p className="text-white font-light leading-relaxed">{respuesta}</p>
            </div>
          )}
        </div>
      )}

      <button onClick={nuevaSesion}
        className="px-6 py-2 border border-white/10 rounded-full text-xs text-white/30 hover:text-white/50 mt-8">
        nueva sesión
      </button>
    </main>
  )
}
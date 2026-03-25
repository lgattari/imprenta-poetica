'use client'
import { useState, useEffect, useRef } from 'react'

function golpeIndustrial() {
  const ctx = new AudioContext()
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.8
      + Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 10) * 0.6
      + Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t * 20) * 0.3
  }
  const source = ctx.createBufferSource()
  source.buffer = buf
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

type Modo = 'preguntas' | 'contador' | 'disolucion' | 'poema'

interface PreguntaFlotante {
  texto: string
  x: number
  y: number
  rot: number
  vx: number
  vy: number
  size: number
  op: number
}

export default function Pantalla() {
  const [respuestas, setRespuestas] = useState<string[]>([])
  const [poema, setPoema] = useState('')
  const [modo, setModo] = useState<Modo>('preguntas')
  const [actual, setActual] = useState(0)
  const [visible, setVisible] = useState(true)
  const [cuenta, setCuenta] = useState(5)
  const [fase, setFase] = useState(0)
  const [flotantes, setFlotantes] = useState<PreguntaFlotante[]>([])
  const disuelto = useRef(false)
  const audioDesbloqueado = useRef(false)

  function desbloquearAudio() {
    if (audioDesbloqueado.current) return
    const ctx = new AudioContext()
    ctx.resume()
    audioDesbloqueado.current = true
  }

  async function cargar() {
    const res = await fetch('/api/estado')
    const data = await res.json()
    if (data.poema) {
      setPoema(data.poema)
      setModo('poema')
    } else if (data.estado === 'disolucion' && !disuelto.current) {
      disuelto.current = true
      setRespuestas(data.respuestas)
      setModo('contador')
      setCuenta(5)
    } else if (data.estado === 'activa') {
      setRespuestas(data.respuestas)
    }
  }

  useEffect(() => {
    cargar()
    const fetchInterval = setInterval(cargar, 3000)
    return () => clearInterval(fetchInterval)
  }, [])

  useEffect(() => {
    if (respuestas.length === 0) return
    setActual(0)
    setVisible(true)
    const rotacion = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActual(prev => (prev + 1) % respuestas.length)
        setVisible(true)
      }, 600)
    }, 3500)
    return () => clearInterval(rotacion)
  }, [respuestas.length])

  useEffect(() => {
    if (modo !== 'contador') return
    golpeIndustrial()
    const interval = setInterval(() => {
      setCuenta(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          const items: PreguntaFlotante[] = respuestas.map((texto, i) => ({
            texto,
            x: Math.random() * 80 + 5,
            y: Math.random() * 80 + 5,
            rot: (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 12 + 14,
            op: Math.random() * 0.5 + 0.5,
          }))
          setFlotantes(items)
          setModo('disolucion')
          setFase(0)
          return 0
        }
        golpeIndustrial()
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [modo])

  useEffect(() => {
    if (modo !== 'disolucion') return
    const fases = [1000, 3000, 5000, 7000]
    const timers = fases.map((t, i) =>
      setTimeout(() => setFase(i + 1), t)
    )
    return () => timers.forEach(clearTimeout)
  }, [modo])

  useEffect(() => {
    if (flotantes.length === 0) return
    const anim = setInterval(() => {
      setFlotantes(prev => prev.map(p => ({
        ...p,
        x: Math.max(0, Math.min(90, p.x + p.vx)),
        y: Math.max(0, Math.min(90, p.y + p.vy)),
        vx: p.x <= 0 || p.x >= 90 ? -p.vx : p.vx,
        vy: p.y <= 0 || p.y >= 90 ? -p.vy : p.vy,
      })))
    }, 50)
    return () => clearInterval(anim)
  }, [flotantes.length])

  const transiciones = [
    'glitch 0.6s ease-out',
    'caer 0.6s cubic-bezier(.68,-0.55,.27,1.55)',
    'rotar 0.6s ease-out',
    'explotar 0.6s ease-out',
  ]

  const estilosBase = `
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
    @keyframes pulso {
      0% { transform: scale(1); }
      50% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
    @keyframes aparecer {
      from { opacity: 0; letter-spacing: 0.5em; filter: blur(8px); }
      to { opacity: 1; letter-spacing: normal; filter: blur(0); }
    }
  `

  if (modo === 'poema') return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-16">
      <p className="text-2xl font-light leading-relaxed whitespace-pre-wrap max-w-3xl text-center"
        style={{ animation: 'aparecer 3s ease-in-out' }}>
        {poema}
      </p>
      <style>{estilosBase}</style>
    </main>
  )

  if (modo === 'contador') return (
    <main
      className="min-h-screen bg-black flex items-center justify-center"
      onClick={desbloquearAudio}
    >
      <p
        className="text-white font-light"
        style={{
          fontSize: '40vw',
          opacity: 0.15,
          animation: 'pulso 0.3s ease-out',
          lineHeight: 1,
        }}
      >
        {cuenta}
      </p>
      <style>{estilosBase}</style>
    </main>
  )

  if (modo === 'disolucion') {
    const bgNaranja = `rgba(160, 50, 0, ${Math.min(fase * 0.28, 1)})`
    return (
      <main
        className="min-h-screen overflow-hidden transition-all duration-1000"
        style={{ background: bgNaranja, position: 'relative' }}
      >
        {flotantes.map((p, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size}px`,
              transform: `rotate(${p.rot + fase * 5}deg)`,
              opacity: fase >= 3 ? p.op * (1 - (fase - 3) * 0.5) : p.op,
              color: fase >= 2 ? '#ffaa44' : 'white',
              filter: fase >= 2 ? `blur(${(fase - 1) * 2}px)` : 'none',
              transition: 'color 1s, filter 1.5s, opacity 1.5s',
              fontWeight: 300,
              whiteSpace: 'nowrap',
              maxWidth: '30vw',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {p.texto}
          </span>
        ))}
        {fase >= 4 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'black',
            animation: 'aparecer 2s ease-in forwards',
          }} />
        )}
        <style>{estilosBase}</style>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-16 overflow-hidden"
      onClick={desbloquearAudio}
    >
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
            animation: visible ? transiciones[actual % transiciones.length] : 'none',
            transition: visible ? 'none' : 'opacity 0.4s ease',
          }}
        >
          {respuestas[actual]}
        </p>
      )}
      <style>{estilosBase}</style>
    </main>
  )
}
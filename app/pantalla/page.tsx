'use client'
import { useState, useEffect, useRef } from 'react'

function golpeIndustrial(ctx: AudioContext) {
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

type Modo = 'caracteristicas' | 'contador' | 'disolucion' | 'dios'

interface Flotante {
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
  const [audioActivo, setAudioActivo] = useState(false)
  const [caracteristicas, setCaracteristicas] = useState<string[]>([])
  const [modo, setModo] = useState<Modo>('caracteristicas')
  const [actual, setActual] = useState(0)
  const [visible, setVisible] = useState(true)
  const [cuenta, setCuenta] = useState(5)
  const [fase, setFase] = useState(0)
  const [flotantes, setFlotantes] = useState<Flotante[]>([])
  const [hablando, setHablando] = useState(false)
  const [ultimaPregunta, setUltimaPregunta] = useState('')
  const [ultimaRespuesta, setUltimaRespuesta] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const prevEstado = useRef<string>('')
  const prevRespuesta = useRef<string>('')
  const audioCtxRef = useRef<AudioContext | null>(null)
  const hablandoRef = useRef(false)

  useEffect(() => {
    const check = setInterval(() => {
      const speaking = window.speechSynthesis.speaking
      if (speaking !== hablandoRef.current) {
        hablandoRef.current = speaking
        setHablando(speaking)
      }
    }, 100)
    return () => clearInterval(check)
  }, [])

  async function activarAudio() {
    const ctx = new AudioContext()
    await ctx.resume()
    audioCtxRef.current = ctx
    setAudioActivo(true)
  }

  async function cargar() {
  const res = await fetch('/api/estado')
  const data = await res.json()

  if (data.estado === 'dios' && prevEstado.current !== 'dios') {
      prevEstado.current = 'dios'
      setModo('dios')
      
      if (data.monologo_despertar) {
        setTimeout(() => {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(data.monologo_despertar)
          utterance.lang = 'es-AR'
          utterance.rate = 0.8
          utterance.pitch = 0.5
          utterance.volume = 1
          const keepAlive = setInterval(() => {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.pause()
              window.speechSynthesis.resume()
            } else {
              clearInterval(keepAlive)
            }
          }, 5000)
          window.speechSynthesis.speak(utterance)
        }, 2000)
      }
    } else if (data.estado === 'disolucion' && prevEstado.current !== 'disolucion' && prevEstado.current !== 'dios') {
      prevEstado.current = 'disolucion'
      setCaracteristicas(data.respuestas)
      setModo('contador')
      setCuenta(5)
    } else if (data.estado === 'activa') {
      prevEstado.current = 'activa'
      setCaracteristicas(data.respuestas)
    }

    if (data.ultimaRespuesta && data.ultimaRespuesta.respuesta !== prevRespuesta.current) {
      if (window.speechSynthesis.speaking) return  // esperá que termine el monólogo
      
      prevRespuesta.current = data.ultimaRespuesta.respuesta
      setUltimaPregunta(data.ultimaRespuesta.pregunta)
      setUltimaRespuesta(data.ultimaRespuesta.respuesta)

      try {
        const texto = data.ultimaRespuesta.respuesta

        if (process.env.USE_ELEVENLABS === 'true') {
          const res = await fetch(`/api/audio?t=${Date.now()}`)
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.addEventListener('ended', () => URL.revokeObjectURL(url))
          await audio.play()
        } else {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(texto)
          utterance.lang = 'es-AR'
          utterance.rate = 0.85
          utterance.pitch = 0.6
          utterance.volume = 1
          const keepAlive = setInterval(() => {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.pause()
              window.speechSynthesis.resume()
            } else {
              clearInterval(keepAlive)
            }
          }, 5000)
          window.speechSynthesis.speak(utterance)
        }
      } catch(e) {
        console.error('audio error', e)
      }
  }

  useEffect(() => {
    if (!audioActivo) return
    cargar()
    const interval = setInterval(cargar, 3000)
    return () => clearInterval(interval)
  }, [audioActivo])

  useEffect(() => {
    if (caracteristicas.length === 0) return
    setActual(0)
    setVisible(true)
    const rot = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActual(p => (p + 1) % caracteristicas.length)
        setVisible(true)
      }, 600)
    }, 3500)
    return () => clearInterval(rot)
  }, [caracteristicas.length])

  useEffect(() => {
    if (modo !== 'contador') return
    if (audioCtxRef.current) golpeIndustrial(audioCtxRef.current)
    const interval = setInterval(() => {
      setCuenta(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          const items: Flotante[] = caracteristicas.map((texto) => ({
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
        if (audioCtxRef.current) golpeIndustrial(audioCtxRef.current)
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [modo])

  useEffect(() => {
    if (modo !== 'disolucion') return
    const timers = [1000, 3000, 5000, 7000].map((t, i) =>
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

  useEffect(() => {
  if (modo !== 'dios') return
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width = window.innerWidth
  const H = canvas.height = window.innerHeight
  let t = 0
  let frame: number

  function draw() {
    if (!ctx) return

    // estática de TV
    const imageData = ctx.createImageData(W, H)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255
      data[i] = v
      data[i+1] = v
      data[i+2] = v
      data[i+3] = 255
    }
    ctx.putImageData(imageData, 0, 0)

    // overlay negro semitransparente para que no sea tan agresiva
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, 0, W, H)

    // scan lines
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, y, W, 1)
    }

    // glitch horizontal ocasional
    if (Math.random() < 0.06) {
      const gy = Math.random() * H
      const gh = Math.random() * 12 + 2
      const imageSlice = ctx.getImageData(0, gy, W, gh)
      ctx.putImageData(imageSlice, (Math.random() - 0.5) * 60, gy)
    }

    // ecualizador cuando habla
    if (hablandoRef.current) {
      const bars = 64
      const barW = W / bars
      const centerY = H / 2

      for (let i = 0; i < bars; i++) {
        const freq = Math.sin(t * 0.15 + i * 0.4) * 0.5
          + Math.sin(t * 0.23 + i * 0.7) * 0.3
          + Math.sin(t * 0.31 + i * 0.2) * 0.2
          + (Math.random() - 0.5) * 0.3

        const barH = Math.abs(freq) * 180 + 10
        const x = i * barW
        const alpha = 0.7 + Math.abs(freq) * 0.3

        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fillRect(x, centerY - barH / 2, barW - 1, barH)
      }

      // pulso de luz cuando habla
      const pulse = Math.abs(Math.sin(t * 0.18)) * 0.08
      ctx.fillStyle = `rgba(255,255,255,${pulse})`
      ctx.fillRect(0, 0, W, H)
    } else {
      // línea plana cuando no habla
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, H / 2 - 1, W, 2)
    }

    t++
    frame = requestAnimationFrame(draw)
  }

  draw()
  return () => cancelAnimationFrame(frame)
}, [modo])

  const transiciones = ['glitch 0.6s ease-out', 'caer 0.6s cubic-bezier(.68,-0.55,.27,1.55)', 'rotar 0.6s ease-out', 'explotar 0.6s ease-out']

  const estilos = `
    @keyframes glitch { 0%{opacity:0;transform:skewX(20deg) translateX(-30px);filter:blur(8px)} 40%{opacity:1;transform:skewX(-5deg) translateX(5px);filter:blur(0)} 100%{transform:skewX(0)} }
    @keyframes caer { 0%{opacity:0;transform:translateY(-80px) rotate(-3deg)} 60%{opacity:1;transform:translateY(10px) rotate(1deg)} 100%{transform:translateY(0) rotate(0)} }
    @keyframes rotar { 0%{opacity:0;transform:rotate(-180deg) scale(0.3)} 70%{opacity:1;transform:rotate(10deg) scale(1.05)} 100%{transform:rotate(0) scale(1)} }
    @keyframes explotar { 0%{opacity:0;transform:scale(3);filter:blur(12px)} 60%{opacity:1;transform:scale(0.95);filter:blur(0)} 100%{transform:scale(1)} }
    @keyframes pulso { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
    @keyframes aparecer { from{opacity:0;letter-spacing:0.5em;filter:blur(8px)} to{opacity:1;letter-spacing:normal;filter:blur(0)} }
    @keyframes fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  `

  if (!audioActivo) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <button onClick={activarAudio}
        className="px-8 py-4 border border-white/20 rounded-full text-white/40 hover:text-white hover:border-white transition-all">
        iniciar
      </button>
    </main>
  )

  if (modo === 'dios') return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8 gap-6">
     <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      />
      <style>{estilos}</style>
    </main>
  )

  if (modo === 'contador') return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white font-light" style={{ fontSize: '40vw', opacity: 0.15, animation: 'pulso 0.3s ease-out', lineHeight: 1 }}>
        {cuenta}
      </p>
      <style>{estilos}</style>
    </main>
  )

  if (modo === 'disolucion') {
    const bg = `rgba(160,50,0,${Math.min(fase * 0.28, 1)})`
    return (
      <main className="min-h-screen overflow-hidden transition-all duration-1000" style={{ background: bg, position: 'relative' }}>
        {flotantes.map((p, i) => (
          <span key={i} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            fontSize: `${p.size}px`,
            transform: `rotate(${p.rot + fase * 5}deg)`,
            opacity: fase >= 3 ? p.op * (1 - (fase - 3) * 0.5) : p.op,
            color: fase >= 2 ? '#ffaa44' : 'white',
            filter: fase >= 2 ? `blur(${(fase - 1) * 2}px)` : 'none',
            transition: 'color 1s, filter 1.5s, opacity 1.5s',
            fontWeight: 300, whiteSpace: 'nowrap', maxWidth: '30vw',
          }}>
            {p.texto}
          </span>
        ))}
        {fase >= 4 && <div style={{ position: 'absolute', inset: 0, background: 'black', animation: 'aparecer 2s ease-in forwards' }} />}
        <style>{estilos}</style>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-16 overflow-hidden">
      <p className="text-white/20 text-xs tracking-widest uppercase mb-16">
        {caracteristicas.length} {caracteristicas.length === 1 ? 'característica' : 'características'} recibidas
      </p>
      {caracteristicas.length === 0 ? (
        <p className="text-white/20 text-2xl">esperando ofrendas...</p>
      ) : (
        <p className="text-4xl font-light text-center max-w-2xl leading-relaxed" style={{
          opacity: visible ? 1 : 0,
          animation: visible ? transiciones[actual % transiciones.length] : 'none',
          transition: visible ? 'none' : 'opacity 0.4s ease',
        }}>
          {caracteristicas[actual]}
        </p>
      )}
      <style>{estilos}</style>
    </main>
  )
}
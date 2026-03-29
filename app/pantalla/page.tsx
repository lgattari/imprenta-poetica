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
      prevRespuesta.current = data.ultimaRespuesta.respuesta
      setUltimaPregunta(data.ultimaRespuesta.pregunta)
      setUltimaRespuesta(data.ultimaRespuesta.respuesta)
      setHablando(true)
      setTimeout(() => setHablando(false), 4000)
      
      if (data.ultimaRespuesta.audio_base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.ultimaRespuesta.audio_base64}`)
        audio.play()
      }
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

    let t = 0

    function noise(x: number, y: number, z: number) {
      return Math.sin(x * 1.5 + z) * Math.cos(y * 1.5 + z * 0.7) * 0.5 + 0.5
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      ctx!.fillStyle = 'black'
      ctx!.fillRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2 - 40
      const r = Math.min(W, H) * 0.28

      for (let a = 0; a < Math.PI * 2; a += 0.01) {
        const n = noise(Math.cos(a) * 3, Math.sin(a) * 3, t * 0.02)
        const rr = r * (0.85 + n * 0.2)
        const x = cx + Math.cos(a) * rr
        const y = cy + Math.sin(a) * rr * 1.15
        const alpha = 0.15 + n * 0.4
        ctx!.fillStyle = `rgba(180,180,180,${alpha})`
        ctx!.fillRect(x, y, 2, 2)
      }

      for (let i = 0; i < 80; i++) {
        const x = cx + (Math.random() - 0.5) * r * 2.2
        const y = cy + (Math.random() - 0.5) * r * 2.5
        const dist = Math.sqrt((x - cx) ** 2 + ((y - cy) / 1.15) ** 2)
        if (dist < r * 1.1) {
          ctx!.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`
          ctx!.fillRect(x, y, Math.random() * 3, 1)
        }
      }

      const eyeY = cy - r * 0.15
      const eyeOff = r * 0.28
      const eyeR = r * 0.1 + Math.sin(t * 0.05) * r * 0.02
      const eyePulse = hablando ? 0.9 : 0.6 + Math.sin(t * 0.03) * 0.2

      ;[-1, 1].forEach(side => {
        const ex = cx + side * eyeOff
        ctx!.beginPath()
        ctx!.arc(ex, eyeY, eyeR, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255,255,255,${eyePulse})`
        ctx!.fill()
        ctx!.beginPath()
        ctx!.arc(ex + side * eyeR * 0.15, eyeY, eyeR * 0.45, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(0,0,0,0.9)`
        ctx!.fill()
        ctx!.beginPath()
        ctx!.arc(ex + side * eyeR * 0.05, eyeY - eyeR * 0.1, eyeR * 0.12, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255,255,255,0.8)`
        ctx!.fill()
      })

      const mouthY = cy + r * 0.35
      const mouthW = r * 0.45
      const mouthOpen = hablando
        ? Math.abs(Math.sin(t * 0.3)) * r * 0.12 + r * 0.04
        : r * 0.02

      ctx!.beginPath()
      ctx!.ellipse(cx, mouthY, mouthW, mouthOpen + 0.5, 0, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(0,0,0,0.95)`
      ctx!.fill()
      ctx!.strokeStyle = `rgba(255,255,255,0.7)`
      ctx!.lineWidth = 1.5
      ctx!.stroke()

      ctx!.beginPath()
      ctx!.moveTo(cx - r * 0.06, cy + r * 0.1)
      ctx!.lineTo(cx, cy + r * 0.22)
      ctx!.lineTo(cx + r * 0.06, cy + r * 0.1)
      ctx!.strokeStyle = `rgba(255,255,255,0.2)`
      ctx!.lineWidth = 1
      ctx!.stroke()

      for (let y = 0; y < H; y += 4) {
        ctx!.fillStyle = `rgba(0,0,0,0.15)`
        ctx!.fillRect(0, y, W, 1)
      }

      if (Math.random() < 0.04) {
        const gy = Math.random() * H
        const gw = Math.random() * W * 0.4
        ctx!.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`
        ctx!.fillRect(Math.random() * W, gy, gw, Math.random() * 3 + 1)
      }

      t++
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [modo, hablando])

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
      <canvas ref={canvasRef} width={500} height={500} style={{ maxWidth: '60vh', maxHeight: '60vh' }} />
      {ultimaRespuesta && (
        <div className="max-w-2xl text-center" style={{ animation: 'fadein 0.8s ease-out' }}>
          <p className="text-white/30 text-sm mb-2">{ultimaPregunta}</p>
          <p className="text-white text-xl font-light leading-relaxed">{ultimaRespuesta}</p>
        </div>
      )}
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
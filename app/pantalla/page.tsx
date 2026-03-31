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
    hablandoRef.current = true
    setTimeout(() => {
      setHablando(false)
      hablandoRef.current = false
    }, 4000)

    // try {
    //   const res = await fetch(`/api/audio?t=${Date.now()}`)
    //   const blob = await res.blob()
    //   const url = URL.createObjectURL(blob)
    //   const audio = new Audio(url)
    //   audio.addEventListener('ended', () => URL.revokeObjectURL(url))
    //   await audio.play()
    // } catch(e) {
    //   console.error('audio error', e)
    // }
    try {
  const utterance = new SpeechSynthesisUtterance(data.ultimaRespuesta.respuesta)
  utterance.lang = 'es-AR'
  utterance.rate = 0.85
  utterance.pitch = 0.6
  utterance.volume = 1
  utterance.onstart = () => { hablandoRef.current = true; setHablando(true) }
  utterance.onend = () => { hablandoRef.current = false; setHablando(false) }
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
} catch(e) {
  console.error('audio error', e)
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

  const W = 500, H = 500
  const cx = W / 2, cy = H / 2 - 20
  const NUM = 1800

  interface Particle {
    x: number; y: number
    tx: number; ty: number
    vx: number; vy: number
    size: number; alpha: number
    chaos: number
  }

  function faceTarget(i: number): { x: number; y: number; alpha: number } {
    const part = i % 6

    // contorno alargado, más oval que redondo
    if (part === 0) {
      const a = (i / NUM) * Math.PI * 24
      const r = 140 + Math.sin(a * 5) * 20 + Math.sin(a * 11) * 8
      return { 
        x: cx + Math.cos(a) * r * 0.72, 
        y: cy + Math.sin(a) * r * 1.25,
        alpha: 0.3 
      }
    }
    // ojos hundidos, más pequeños y separados
    if (part === 1) {
      const side = i % 2 === 0 ? -1 : 1
      const a = (i / NUM) * Math.PI * 12
      const er = 14 + Math.sin(a * 6) * 3
      return { 
        x: cx + side * 52 + Math.cos(a) * er, 
        y: cy - 55 + Math.sin(a) * er * 0.5,
        alpha: 1.0 
      }
    }
    // boca rasgada, horizontal y larga
    if (part === 2) {
      const a = (i / NUM) * Math.PI * 4
      const mw = 75 + (hablandoRef.current ? Math.abs(Math.sin(t * 0.3)) * 25 : 3)
      const mh = hablandoRef.current ? 8 + Math.abs(Math.sin(t * 0.4)) * 28 : 2
      return { 
        x: cx + Math.cos(a) * mw, 
        y: cy + 85 + Math.sin(a) * mh,
        alpha: 0.95 
      }
    }
    // grietas y deformaciones en la cara
    if (part === 3) {
      const a = (i / NUM) * Math.PI * 16
      const cr = 60 + Math.sin(a * 7) * 40
      return {
        x: cx + Math.cos(a * 2.3) * cr * 0.6,
        y: cy + Math.sin(a * 1.7) * cr,
        alpha: 0.12
      }
    }
    // partículas de ruido exterior
    if (part === 4) {
      const angle = (i / NUM) * Math.PI * 2
      const r = 160 + Math.random() * 80
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r * 1.3,
        alpha: 0.06
      }
    }
    // filamentos que salen de la cara hacia afuera
    const a = (i / NUM) * Math.PI * 8
    const r = 100 + Math.abs(Math.sin(a * 3)) * 120
    return {
      x: cx + Math.cos(a * 1.4) * r * 0.8,
      y: cy + Math.sin(a * 0.9) * r * 1.1,
      alpha: 0.08
    }
  }

  const particles: Particle[] = Array.from({ length: NUM }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * 300
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      tx: cx, ty: cy,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      size: Math.random() * 1.8 + 0.4,
      alpha: Math.random(),
      chaos: Math.random(),
    }
  })

  let t = 0
  let frame: number

  function draw() {
    ctx!.fillStyle = 'rgba(0,0,0,0.18)'
    ctx!.fillRect(0, 0, W, H)

    const order = hablandoRef.current ? 0.88 : 0.72

    particles.forEach((p, i) => {
      const target = faceTarget(i)
      p.tx = target.x
      p.ty = target.y

      const noiseX = Math.sin(t * 0.015 + p.chaos * 8) * (hablandoRef.current ? 6 : 18)
      const noiseY = Math.cos(t * 0.012 + p.chaos * 6) * (hablandoRef.current ? 6 : 18)

      p.vx += ((p.tx + noiseX - p.x) * 0.04 - p.vx) * order
      p.vy += ((p.ty + noiseY - p.y) * 0.04 - p.vy) * order
      p.x += p.vx
      p.y += p.vy

      const distFromCenter = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
      const glow = hablandoRef.current && distFromCenter < 180 ? 0.3 : 0

      const r2 = hablandoRef.current ? 255 : 140
      const g2 = hablandoRef.current ? 80 : 140
      const b2 = hablandoRef.current ? 60 : 160
      const a = (target.alpha + glow) * (0.5 + Math.sin(t * 0.04 + p.chaos * 5) * 0.5)

      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(${r2},${g2},${b2},${Math.min(a, 1)})`
      ctx!.fill()
    })

    if (Math.random() < 0.06) {
      const gy = Math.random() * H
      ctx!.fillStyle = `rgba(180,180,255,${Math.random() * 0.08})`
      ctx!.fillRect(0, gy, W, Math.random() * 2 + 1)
    }

    for (let y = 0; y < H; y += 3) {
      ctx!.fillStyle = 'rgba(0,0,0,0.08)'
      ctx!.fillRect(0, y, W, 1)
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
      <canvas ref={canvasRef} width={500} height={500} style={{ maxWidth: '60vh', maxHeight: '60vh' }} />
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
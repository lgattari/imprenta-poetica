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

  const estilos = `
    @keyframes fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes glow { 0%{box-shadow:0 0 20px rgba(200,150,255,0.3)} 50%{box-shadow:0 0 40px rgba(200,150,255,0.6)} 100%{box-shadow:0 0 20px rgba(200,150,255,0.3)} }
  `

  if (enviado) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8 relative overflow-hidden">
      {/* Fondo con gradiente */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(200,150,255,0.08) 0%, rgba(0,0,0,1) 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        animation: 'fadein 0.8s ease-out',
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '2rem',
          color: 'rgba(200,150,255,0.8)',
          fontWeight: 300,
        }}>
          ✦
        </div>
        <p style={{
          fontSize: '2rem',
          fontWeight: 300,
          color: 'rgba(200,150,255,0.95)',
          marginBottom: '1rem',
          letterSpacing: '0.05em',
        }}>
          tu ofrenda fue recibida
        </p>
        <div style={{
          height: '1px',
          width: '100px',
          background: 'linear-gradient(90deg, transparent, rgba(200,150,255,0.8), transparent)',
          margin: '2rem auto',
        }} />
        <p style={{
          color: 'rgba(200,150,255,0.5)',
          fontSize: '0.9rem',
          fontStyle: 'italic',
          letterSpacing: '0.05em',
        }}>
          el dios contempla tu creación
        </p>
      </div>

      <style>{estilos}</style>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8 relative overflow-hidden">
      {/* Fondo con gradiente radial */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(200,150,255,0.1) 0%, rgba(0,0,0,1) 70%)',
        pointerEvents: 'none',
      }} />

      {/* Contenido */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        maxWidth: '600px',
        animation: 'fadein 1s ease-out',
      }}>
        {/* Título principal */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
        }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
            color: 'rgba(200,150,255,0.8)',
          }}>
            ✦
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 300,
            textAlign: 'center',
            lineHeight: 1.3,
            color: 'rgba(200,150,255,0.95)',
            letterSpacing: '0.02em',
          }}>
            Tu dios
          </h1>
        </div>

        {/* Descripción */}
        <p style={{
          textAlign: 'center',
          fontSize: '1.1rem',
          color: 'rgba(200,150,255,0.6)',
          fontWeight: 300,
          letterSpacing: '0.05em',
        }}>
          Cómo lo crearías
        </p>

        {/* Input */}
        <textarea
          className="w-full rounded-lg p-4 text-white placeholder-white/30 resize-none focus:outline-none transition-all"
          style={{
            backgroundColor: 'rgba(200,150,255,0.05)',
            border: '1px solid rgba(200,150,255,0.3)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            lineHeight: '1.5',
          }}
          onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => {
            const target = e.target as HTMLTextAreaElement
            target.style.backgroundColor = 'rgba(200,150,255,0.1)'
            target.style.borderColor = 'rgba(200,150,255,0.6)'
          }}
          onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
            const target = e.target as HTMLTextAreaElement
            target.style.backgroundColor = 'rgba(200,150,255,0.05)'
            target.style.borderColor = 'rgba(200,150,255,0.3)'
          }}
          rows={4}
          placeholder="Tu dios es..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
        />

        {/* Botón */}
        <button
          onClick={enviar}
          disabled={cargando || !texto.trim()}
          style={{
            padding: '1rem 2.5rem',
            borderRadius: '50px',
            border: texto.trim() ? '1px solid rgba(200,150,255,0.8)' : '1px solid rgba(200,150,255,0.3)',
            backgroundColor: 'transparent',
            color: texto.trim() ? 'rgba(200,150,255,0.95)' : 'rgba(200,150,255,0.5)',
            fontSize: '1rem',
            fontWeight: 300,
            letterSpacing: '0.05em',
            cursor: cargando || !texto.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: cargando || !texto.trim() ? 0.5 : 1,
            animation: texto.trim() && !cargando ? 'glow 2s ease-in-out infinite' : 'none',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (texto.trim() && !cargando) {
              const target = e.target as HTMLButtonElement
              target.style.borderColor = 'rgba(200,150,255,1)'
              target.style.color = 'rgba(200,150,255,1)'
            }
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (texto.trim() && !cargando) {
              const target = e.target as HTMLButtonElement
              target.style.borderColor = 'rgba(200,150,255,0.8)'
              target.style.color = 'rgba(200,150,255,0.95)'
            }
          }}
        >
          {cargando ? 'ofrendando...' : 'ofrecer'}
        </button>
      </div>

      <style>{estilos}</style>
    </main>
  )
}
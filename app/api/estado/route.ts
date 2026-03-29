import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data: sesion } = await supabase
    .from('sesiones')
    .select('id, estado')
    .eq('activa', true)
    .single()

  if (!sesion) return NextResponse.json({ respuestas: [] })

  const { data: respuestas } = await supabase
    .from('respuestas')
    .select('contenido')
    .eq('sesion_id', sesion.id)
    .order('created_at', { ascending: true })

  if (sesion.estado === 'dios') {
    const { data: ultimaRespuesta } = await supabase
      .from('respuestas_dios')
      .select('pregunta, respuesta, audio_base64')
      .eq('sesion_id', sesion.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      estado: 'dios',
      respuestas: respuestas?.map(r => r.contenido) ?? [],
      ultimaRespuesta: ultimaRespuesta ?? null
    })
  }

  if (sesion.estado === 'disolucion') {
    return NextResponse.json({
      estado: 'disolucion',
      respuestas: respuestas?.map(r => r.contenido) ?? []
    })
  }

  return NextResponse.json({
    estado: 'activa',
    respuestas: respuestas?.map(r => r.contenido) ?? []
  })
}
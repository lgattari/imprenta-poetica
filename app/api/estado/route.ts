import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data: sesion } = await supabase
    .from('sesiones')
    .select('id, estado')
    .eq('activa', true)
    .single()

  if (!sesion) return NextResponse.json({ respuestas: [] })

  if (sesion.estado === 'disolucion') {
    const { data: respuestas } = await supabase
      .from('respuestas')
      .select('texto')
      .eq('sesion_id', sesion.id)
      .order('created_at', { ascending: true })
    return NextResponse.json({
      estado: 'disolucion',
      respuestas: respuestas?.map(r => r.texto) ?? []
    })
  }

  const { data: poemas } = await supabase
    .from('poemas')
    .select('texto')
    .eq('sesion_id', sesion.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (poemas && poemas.length > 0) {
    return NextResponse.json({ poema: poemas[0].texto })
  }

  const { data: respuestas } = await supabase
    .from('respuestas')
    .select('texto')
    .eq('sesion_id', sesion.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    estado: 'activa',
    respuestas: respuestas?.map(r => r.texto) ?? []
  })
}
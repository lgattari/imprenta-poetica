import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data: sesion } = await supabase
    .from('sesiones')
    .select('id')
    .eq('activa', true)
    .single()

  if (!sesion) return new NextResponse(null, { status: 404 })

  const { data } = await supabase
    .from('respuestas_dios')
    .select('audio_base64')
    .eq('sesion_id', sesion.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data?.audio_base64) return new NextResponse(null, { status: 404 })

  const buffer = Buffer.from(data.audio_base64, 'base64')
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
    }
  })
}
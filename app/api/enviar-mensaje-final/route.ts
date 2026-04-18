import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const { data: sesion } = await supabase
    .from('sesiones')
    .select('id')
    .eq('activa', true)
    .single()

  if (!sesion) {
    return NextResponse.json({ error: 'no hay sesion activa' }, { status: 400 })
  }

  // Actualizar mensaje_push para disparar notificaciones en todos los clientes
  await supabase
    .from('sesiones')
    .update({ mensaje_push: 'APOCALIPSIS' })
    .eq('id', sesion.id)

  return NextResponse.json({ ok: true })
}

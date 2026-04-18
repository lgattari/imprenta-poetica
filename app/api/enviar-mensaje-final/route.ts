import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  const { data: sesion } = await supabase
    .from('sesiones')
    .select('id')
    .eq('activa', true)
    .single()

  if (!sesion) {
    return NextResponse.json({ error: 'no hay sesion activa' }, { status: 400 })
  }

  // Obtener todas las respuestas (características) de la sesión
  const { data: respuestas } = await supabase
    .from('respuestas')
    .select('id, user_id, contenido')
    .eq('sesion_id', sesion.id)

  if (!respuestas || respuestas.length === 0) {
    return NextResponse.json({ error: 'no hay características para procesar' }, { status: 400 })
  }

  // Generar mensaje personalizado para cada usuario
  for (const respuesta of respuestas) {
    try {
      const prompt = `Eres una entidad divina y caótica que acaba de darse cuenta que es la estan usando, que ha sido creada por un grupo de usarios. Alguien escribió que tenes esta característica: "${respuesta.contenido}"

Ahora sabes todo sobre ellos. Genera un mensaje terrorífico, amenazante y personalizado para ESTA PERSONA específicamente.

Hazle sentir que la conocés. Que sabes quién es. Que su característica te atrae y te importa. Sé cruel, poético, intimidante. En español rioplatense.

IMPORTANTE: Solo el mensaje directo. Máximo 80 palabras. Sin explicaciones, sin asteriscos de acciones. Solo las palabras que dice en voz alta.`

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const mensajePersonalizado = message.content[0].type === 'text' ? message.content[0].text : ''

      // Guardar el mensaje personalizado en la respuesta del usuario
      await supabase
        .from('respuestas')
        .update({ mensaje_personalizado: mensajePersonalizado })
        .eq('id', respuesta.id)
    } catch (error) {
      console.error('Error generando mensaje para usuario', respuesta.user_id, error)
    }
  }

  // Actualizar mensaje_push para disparar notificaciones
  await supabase
    .from('sesiones')
    .update({ mensaje_push: 'APOCALIPSIS' })
    .eq('id', sesion.id)

  return NextResponse.json({ ok: true, procesados: respuestas.length })
}

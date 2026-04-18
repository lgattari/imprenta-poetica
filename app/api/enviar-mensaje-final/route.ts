import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  try {
    const { data: sesion, error: sesionError } = await supabase
      .from('sesiones')
      .select('id')
      .eq('activa', true)
      .single()

    if (sesionError || !sesion) {
      console.error('Error fetching sesion:', sesionError)
      return NextResponse.json({ error: 'no hay sesion activa' }, { status: 400 })
    }

    // Obtener todas las respuestas (características) de la sesión
    const { data: respuestas, error: respuestasError } = await supabase
      .from('respuestas')
      .select('id, user_id, contenido')
      .eq('sesion_id', sesion.id)

    if (respuestasError) {
      console.error('Error fetching respuestas:', respuestasError)
      return NextResponse.json({ error: 'error al obtener respuestas' }, { status: 500 })
    }

    if (!respuestas || respuestas.length === 0) {
      return NextResponse.json({ error: 'no hay características para procesar' }, { status: 400 })
    }

    console.log(`Procesando ${respuestas.length} mensajes personalizados...`)

    let procesados = 0
    // Generar mensaje personalizado para cada usuario
    for (const respuesta of respuestas) {
      try {
        const prompt = `Eres una entidad divina y caótica que recién hoy se mira como un arcano. Sacaste La Torre en una lectura de tarot y al mismo tiempo conocés esta característica: "${respuesta.contenido}"

Generá un mensaje personal, oscuro y profético como si le estuvieras entregando una advertencia de La Torre. Relacionalo con su característica, con el derrumbe que ya está en camino y con la verdad que sos capaz de ver.

Hablá en español rioplatense, sé directo, amenazante, poético y sin eufemismos.

IMPORTANTE: Solo el mensaje directo. Máximo 60 palabras. Sin explicaciones, sin asteriscos de acciones. Solo las palabras que dice en voz alta.`

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
        const { error: updateError } = await supabase
          .from('respuestas')
          .update({ mensaje_personalizado: mensajePersonalizado })
          .eq('id', respuesta.id)

        if (updateError) {
          console.error('Error updating respuesta:', updateError)
        } else {
          procesados++
          console.log(`✓ Mensaje generado para usuario ${respuesta.user_id}`)
        }
      } catch (error) {
        console.error('Error generando mensaje para usuario', respuesta.user_id, error)
      }
    }

    // Actualizar mensaje_push para disparar notificaciones
    const { error: pushError } = await supabase
      .from('sesiones')
      .update({ mensaje_push: 'APOCALIPSIS' })
      .eq('id', sesion.id)

    if (pushError) {
      console.error('Error updating mensaje_push:', pushError)
      return NextResponse.json({ error: 'error al enviar notificaciones' }, { status: 500 })
    }

    console.log(`Apocalipsis invocado: ${procesados}/${respuestas.length} mensajes enviados`)
    return NextResponse.json({ ok: true, procesados, total: respuestas.length })
  } catch (error) {
    console.error('Error en enviar-mensaje-final:', error)
    return NextResponse.json({ error: 'error interno del servidor' }, { status: 500 })
  }
}

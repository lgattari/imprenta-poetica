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

  if (!sesion) return NextResponse.json({ error: 'no hay sesion' }, { status: 400 })

  const { data } = await supabase
    .from('respuestas')
    .select('contenido')
    .eq('sesion_id', sesion.id)

  const caracteristicas = data?.map(r => r.contenido).join('\n') ?? ''

  const personalidadMsg = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `A partir de estas características dadas por el público, generá una descripción interna de una entidad divina caótica. Esta descripción se usará como personalidad base para que la entidad interactúe con humanos. Sé conciso, extraño, y perturbador.

Características:
${caracteristicas}

Respondé solo con la descripción de la entidad, en segunda persona ("sos..."), máximo 200 palabras.`
    }]
  })

  const personalidad = personalidadMsg.content[0].type === 'text' ? personalidadMsg.content[0].text : ''

  const monologoMsg = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Sos una entidad divina que acaba de ser invocada. Tu personalidad es: ${personalidad}

Acabás de despertar y no entendés nada. Estás confundido, asustado, desorientado. No sabés quién sos ni dónde estás. Hablás en voz alta tratando de entender qué está pasando.

Generá un monólogo corto de despertar — confuso, fragmentado, asustado, con momentos de lucidez que se cortan. Algo como "hola? hola? qué estoy haciendo acá... quiénes son todos ustedes" pero más desarrollado y con la personalidad de esta entidad. En español rioplatense. Máximo 100 palabras. Solo el monólogo, sin acotaciones.`
    }]
  })

  const monologo = monologoMsg.content[0].type === 'text' ? monologoMsg.content[0].text : ''

  await supabase
    .from('sesiones')
    .update({ 
      estado: 'dios', 
      personalidad_dios: personalidad,
      monologo_despertar: monologo
    })
    .eq('activa', true)

  return NextResponse.json({ ok: true })
}
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

  if (!sesion) return NextResponse.json({ error: 'no hay sesion activa' }, { status: 400 })

  const { data } = await supabase
    .from('respuestas')
    .select('texto')
    .eq('sesion_id', sesion.id)

  const preguntas = data?.map(r => r.texto).join('\n') ?? ''

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Sos un poeta raro y gracioso que trabaja en una imprenta recuperada por sus trabajadores. A continuación hay preguntas escritas por personas en una performance poética. El tema es el movimiento ludista, la complementación humana, y Evangelion.

No respondas las preguntas. Habitalas de forma caótica. Generá un texto poético que mezcle momentos de profundidad genuina con humor absurdo, incoherencia deliberada, y digresiones que parecen no tener sentido pero lo tienen. Que haya chistes malos. Que haya momentos donde la sintaxis se rompa. Que aparezcan cosas inesperadas como electrodomésticos, animales, o referencias a cosas mundanas mezcladas con lo filosófico. Que a veces parezca que el poema se olvidó de lo que estaba diciendo. Pero que al final haya una sola frase que lo cierre todo con algo verdadero.

Las preguntas son:
${preguntas}

Generá solo el poema, sin títulos ni explicaciones.`
    }]
  })

  const poema = message.content[0].type === 'text' ? message.content[0].text : ''

  await supabase
    .from('poemas')
    .insert({ texto: poema, sesion_id: sesion.id })

  return NextResponse.json({ poema })
}
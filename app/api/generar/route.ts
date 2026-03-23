import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  const { data } = await supabase.from('respuestas').select('texto')
  const preguntas = data?.map(r => r.texto).join('\n') ?? ''

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Sos un poeta. A continuación hay preguntas escritas por personas en una performance poética en una imprenta recuperada por sus trabajadores. El tema es el movimiento ludista, la complementación humana, y la idea de que todos somos parte de algo mayor — como en Evangelion.

No respondas las preguntas. Habitalas. Generá un texto poético continuo que las absorba, las disuelva, y emerja como una sola voz colectiva. Que tenga tensión, ritmo, y una reflexión final sobre qué significa ser parte de todo sin dejar de ser uno mismo.

Las preguntas son:
${preguntas}

Generá solo el poema, sin títulos ni explicaciones.`
    }]
  })

  const poema = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ poema })
}
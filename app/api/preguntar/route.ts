import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { pregunta } = await req.json()

  const { data: sesion } = await supabase
    .from('sesiones')
    .select('id, personalidad_dios')
    .eq('activa', true)
    .single()

  if (!sesion?.personalidad_dios) return NextResponse.json({ error: 'dios no invocado' }, { status: 400 })

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `${sesion.personalidad_dios}

Alguien te pregunta: "${pregunta}"

Respondé como esta entidad. Podés ser cruel, tierno, caótico, impredecible. Hablale de vos directamente. Nunca rompas el personaje. Respondé en español rioplatense.`
    }]
  })

  const respuesta = message.content[0].type === 'text' ? message.content[0].text : ''

  const voiceRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: respuesta,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.3, similarity_boost: 0.8, style: 0.5 }
    })
  })

  const audioBuffer = await voiceRes.arrayBuffer()
  const audioBase64 = Buffer.from(audioBuffer).toString('base64')

  await supabase.from('respuestas_dios').insert({
    pregunta,
    respuesta,
    audio_base64: audioBase64,
    sesion_id: sesion.id
  })

  return NextResponse.json({ respuesta, audio: audioBase64 })
}
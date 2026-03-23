import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { count } = await supabase
    .from('respuestas')
    .select('*', { count: 'exact', head: true })
  return NextResponse.json({ cantidad: count })
}
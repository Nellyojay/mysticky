import { supabase } from '../lib/supabase'
import type { StickerMessage } from '../types/supabase'

const TABLE_NAME = 'anonymous'

export async function getLatestMessage() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('message, time_past')
    .order('time_past', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data as StickerMessage | null
}

export async function saveMessage(message: string) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      message,
      time_past: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as StickerMessage
}

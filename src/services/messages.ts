import { supabase } from '../lib/supabase'
import type { StickerMessage } from '../types/supabase'
import { getPhoneToken } from './getToken'

const TABLE_NAME = 'anonymous'

export async function getLatestMessage() {
  const chatRoom = getPhoneToken()

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('message, time_past, phone_token')
    .eq('chat_room', chatRoom)
    .order('time_past', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.log(error)
    throw error
  }

  return data as StickerMessage | null
}

export async function saveMessage(message: string) {
  const chatRoom = getPhoneToken()

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      message,
      chat_room: chatRoom,
      time_past: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as StickerMessage
}

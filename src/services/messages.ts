import { supabase } from '../lib/supabase'
import type { StickerMessage } from '../types/supabase'
import { getPhoneToken } from './getToken'

export const TABLE_NAME = 'anonymous'

export async function chatRoomExists(chatRoom: string): Promise<boolean> {
  const trimmedRoom = chatRoom.trim()

  if (!trimmedRoom) {
    return false
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('chat_room')
    .eq('chat_room', trimmedRoom)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return Boolean(data)
}

export async function getLatestMessage(chat_room: string) {
  const chatRoom = (chat_room || getPhoneToken()).trim()

  if (!chatRoom) {
    return null
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('message, time_past, chat_room')
    .eq('chat_room', chatRoom)
    .order('time_past', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to load latest:', error)
    throw error
  }

  return data as StickerMessage | null
}

export async function saveMessage(message: string) {
  const chatRoom = getPhoneToken().trim()

  if (!chatRoom) {
    throw new Error('No active chat room found.')
  }

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

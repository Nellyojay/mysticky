import { supabase } from '../lib/supabase'
import type { StickerMessage } from '../types/supabase'
import { getChatRoom } from './getToken'

export const CHATROOM_TABLE_NAME = 'chatroom'
export const CHATROOM_MESSAGE_TABLE = 'anonymous'
export const LOGGED_IN = 'logged_in_chat_room'

export async function chatRoomExists(chat_room: string): Promise<boolean> {
  const chatRoom = chat_room || getChatRoom()

  if (!chatRoom) {
    return false
  }

  const { data, error } = await supabase
    .from(CHATROOM_TABLE_NAME)
    .select('chat_room')
    .eq('chat_room', chatRoom)

  if (error && error.code !== 'PGRST116') {
    console.log('Failed to check room existence', error)
    throw error
  }
  console.log('Room existence check result:', data)

  return Boolean(!data)
}

export async function getLatestMessage(chatRoomId: string) {
  const chatRoom = chatRoomId

  if (!chatRoom) {
    return null
  }

  const { data, error } = await supabase
    .from(CHATROOM_MESSAGE_TABLE)
    .select('message, time_past, chat_roomId')
    .eq('chat_roomId', chatRoom)
    .order('time_past', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to load latest:', error)
    throw error
  }

  return data as StickerMessage | null
}

export async function saveMessage(message: string, chatRoomId: string | null) {
  const chatRoom = chatRoomId

  if (!chatRoom) {
    throw new Error('No active chat room found.')
  }

  const { data, error } = await supabase
    .from(CHATROOM_MESSAGE_TABLE)
    .insert({
      message,
      chat_roomId: chatRoom,
      time_past: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as StickerMessage
}

export async function createChatRoom(chat_room: string) {
  const { data, error } = await supabase
    .from(CHATROOM_TABLE_NAME)
    .insert({ chat_room })
    .select('id')
    .single()

  if (error) {
    console.log("Failed to create room", error)
    return false;
  }

  localStorage.setItem(LOGGED_IN, `${chat_room}_${data.id}`);

  return Boolean(data);
}

export function loggedIn() {
  const token = localStorage.getItem(LOGGED_IN)

  return Boolean(token)
}
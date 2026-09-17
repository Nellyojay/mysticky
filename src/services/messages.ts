import { supabase } from '../lib/supabase'
import type { StickerMessage } from '../types/supabase'
import { getChatRoom } from './getToken'

export const CHATROOM_TABLE_NAME = 'chatroom'
export const CHATROOM_MESSAGE_TABLE = 'anonymous'
export const LOGGED_IN = 'logged_in_chat_room'

export async function chatRoomExists(chat_room: string): Promise<boolean> {
  const chatRoom = (chat_room || getChatRoom()).trim()

  if (!chatRoom) {
    return false
  }

  const { data, error } = await supabase
    .from(CHATROOM_TABLE_NAME)
    .select('id')
    .eq('chat_room', chatRoom)
    .limit(1)

  if (error && error.code !== 'PGRST116') {
    console.log('Failed to check room existence', error)
    throw error
  }
  console.log('Room existence check result:', data)

  return Array.isArray(data) && data.length > 0
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

export async function saveMessage(message: string, chatRoomId: string) {

  if (!message || !chatRoomId) {
    throw new Error('No active chat room found.')
  }

  const { data, error } = await supabase
    .from(CHATROOM_MESSAGE_TABLE)
    .insert({
      message,
      chat_roomId: chatRoomId,
    })
    .select('*')
    .single()

  if (error) {
    console.log('Failed to save message:', error)
    throw error
  }

  return data as StickerMessage
}

export async function resolveChatRoomId(chatRoom: string): Promise<string | null> {
  if (!chatRoom) {
    return null
  }

  const { data, error } = await supabase
    .from(CHATROOM_TABLE_NAME)
    .select('id')
    .eq('chat_room', chatRoom)
    .single()

  if (error) {
    console.error('Failed to resolve chat room ID:', error)
    return null
  }

  return data?.id || null
}

export async function createChatRoom(chat_room: string) {
  const { data, error } = await supabase
    .from(CHATROOM_TABLE_NAME)
    .insert({ chat_room })
    .select('id')
    .single()

  if (error) {
    console.log('Failed to create chat room:', error)
    return false;
  }

  localStorage.setItem(LOGGED_IN, `${data.id}_${chat_room}`);

  return Boolean(data);
}

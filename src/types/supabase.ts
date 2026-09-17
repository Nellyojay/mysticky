export type StickerMessage = {
  id?: number
  message: string
  created_at?: string
  time_past?: string
  chat_room?: string
  response?: 'yes' | 'no' | null
}

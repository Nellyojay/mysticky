export type StickerMessage = {
  id?: number
  message: string
  created_at?: string
  time_past?: string
  phone_token?: string
  response?: 'yes' | 'no' | null
}

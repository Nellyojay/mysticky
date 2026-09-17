export const PHONE_TOKEN_KEY = 'sticker_phone_token'

const FRUIT_NAMES = [
  'apple',
  'mango',
  'banana',
  'orange',
  'grape',
  'peach',
  'berry',
  'kiwi',
  'lemon',
  'papaya',
  'plum',
  'pineapple',
]

function generateFruitToken(): string {
  const fruit = FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)]
  const number = Math.floor(100 + Math.random() * 900)
  return `${fruit}${number}`
}

export function getPhoneToken(): string {
  if (typeof window === 'undefined') {
    return 'unknown-phone'
  }

  const params = new URLSearchParams(window.location.search)
  const tokenFromQuery =

    params.get('receiver') ??

    params.get('receiverToken') ??
    localStorage.getItem(PHONE_TOKEN_KEY)

  const token = tokenFromQuery ?? generateFruitToken()

  if (!localStorage.getItem(PHONE_TOKEN_KEY) || tokenFromQuery) {
    localStorage.setItem(PHONE_TOKEN_KEY, token)
  }

  return token
}

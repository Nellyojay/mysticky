export const PHONE_TOKEN_KEY = 'sticker_phone_token'

export function generateCityToken(): string {
  const CITY_CODES = [
    { city: 'Tokyo', code: 'JP' },
    { city: 'Paris', code: 'FR' },
    { city: 'London', code: 'UK' },
    { city: 'NewYork', code: 'US' },
    { city: 'Berlin', code: 'DE' },
    { city: 'Cairo', code: 'EG' },
    { city: 'Rome', code: 'IT' },
    { city: 'Sydney', code: 'AU' },
    { city: 'Dubai', code: 'AE' },
    { city: 'Nairobi', code: 'KE' },
    { city: 'Rio', code: 'BR' },
    { city: 'CapeTown', code: 'ZA' },
    { city: 'Seoul', code: 'KR' },
    { city: 'Moscow', code: 'RU' },
    { city: 'MexicoCity', code: 'MX' },
    { city: 'Lagos', code: 'NG' },
    { city: 'Barcelona', code: 'ES' },
    { city: 'Bangkok', code: 'TH' },
    { city: 'Toronto', code: 'CA' },
    { city: 'Istanbul', code: 'TR' },
  ]

  const cityEntry = CITY_CODES[Math.floor(Math.random() * CITY_CODES.length)]
  const number = Math.floor(100 + Math.random() * 900)
  return `${cityEntry.city}${cityEntry.code}${number}`
}

export function getPhoneToken(): string {
  if (typeof window === 'undefined') {
    return 'unknown-phone'
  }

  const params = new URLSearchParams(window.location.search)
  const tokenFromQuery =
    params.get('chatroom') ??
    params.get('receiverToken') ??
    localStorage.getItem(PHONE_TOKEN_KEY)

  const token = tokenFromQuery ?? ''

  if (tokenFromQuery) {
    localStorage.setItem(PHONE_TOKEN_KEY, token)
  }

  return token
}

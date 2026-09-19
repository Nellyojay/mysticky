
export const STICKY_CODE_KEY = 'sticky_code'

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

export function getStickyCode(): string {
  if (typeof window === 'undefined') {
    return 'unknown-phone'
  }

  const params = new URLSearchParams(window.location.search)
  const tokenFromQuery =
    params.get('stickyCode') ??
    params.get('sticky_code') ??
    localStorage.getItem(STICKY_CODE_KEY)

  const token = tokenFromQuery ?? ''

  if (tokenFromQuery) {
    localStorage.setItem(STICKY_CODE_KEY, token)
  }

  return token
}

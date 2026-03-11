
export const formatNumberPhoneWithoutCountryCode = (phoneNumber: string) => {
  const digitsOfNumber = phoneNumber.split('')

  if (digitsOfNumber.slice(0, 2).join('') === '+1') {
    return digitsOfNumber
      .slice(2)
      .filter((itm) => itm !== ' ')
      .join('')
  }

  return removeSpaceOnPhone(phoneNumber)
}

export function removeSpaceOnPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

const normalizeCanadianPhoneDigits = (value: string) => {
  let digits = value.trim().replace(/\D/g, '')

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }

  return digits.length === 10 ? digits : null
}

export const formatCanadianPhone = (value?: string | null) => {
  if (!value) return ''

  const digits = normalizeCanadianPhoneDigits(value)
  if (!digits) return value

  const area = digits.slice(0, 3)
  const prefix = digits.slice(3, 6)
  const line = digits.slice(6)
  
  return `(${area})-${prefix} ${line}`
}

export const formatCanadianPhoneHref = (value?: string | null) => {
  if (!value) return ''

  const digits = normalizeCanadianPhoneDigits(value)
  return digits ? `+1${digits}` : value
}

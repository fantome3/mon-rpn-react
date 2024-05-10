import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const refresh = () => {
  return window.location.reload()
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const functionReverse = (str: string) => {
  if (!str) {
    return
  }
  return str.split('-').reverse().join('-')
}

export const functionSponsorship = (str: string) => {
  if (!str) return
  return str.substring(17, 24)
}

export const checkTel = (tel: string) => {
  const telTable = tel.split('')
  if (telTable.slice(0, 2).join('') === '+1') {
    return telTable.slice(2).join('')
  }
  return telTable.join('')
}

export const checkPostalCode = (code: string) => {
  return code
    .split('')
    .filter((elt) => elt !== ' ')
    .join('')
}

export const functionTranslate = (str: string) => {
  if (!str) {
    return
  }
  if (str === 'firstName') {
    return 'Prénom'
  }
  if (str === 'lastName') {
    return 'Nom'
  }
  if (str === 'relationship') {
    return 'Relation'
  }
  if (str === 'status') {
    return 'Status'
  }
  if (str === 'residenceCountry') {
    return 'Pays de résidence'
  }
  if (str === 'nativeCountry') {
    return `Pays d'origine`
  }
}

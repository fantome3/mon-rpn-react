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

export const checkTel = (tel: string) => {
  const telTable = tel.split('')
  if (telTable.slice(0, 2).join('') === '+1') {
    return telTable
      .slice(2)
      .filter((itm) => itm !== ' ')
      .join('')
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

  if (str === 'createdAt') {
    return 'Date'
  }

  if (str === 'userTel') {
    return 'Téléphone'
  }
  if (str === 'userResidenceCountry') {
    return 'Pays de résidence'
  }

  if (str === 'userNativeCountry') {
    return `Pays d'origine`
  }
  if (str === 'solde') {
    return 'Solde'
  }

  if (str === 'paymentMethod') {
    return 'Mode de paiement'
  }

  if (str === 'deathDate') {
    return 'Date du décès'
  }

  if (str === 'deathPlace') {
    return 'Lieu du décès'
  }
  if (str === 'type') {
    return 'Type'
  }

  if (str === 'amount') {
    return 'Montant'
  }
  if (str === 'reason') {
    return 'Raison'
  }

  if (str === 'fullName') {
    return 'Utilisateur'
  }
}

export const formatCreditCardNumber = (value: string): string => {
  // Remove all spaces
  const formattedValue = value.replace(/\s+/g, '')

  // Add spaces after every 4 characters
  return formattedValue.match(/.{1,4}/g)?.join(' ') || formattedValue
}

export function isDateInFuture(dateStr: string): boolean {
  // La regex pour valider le format MMYY
  const regex = /^(0[1-9]|1[0-2])[0-9]{2}$/

  if (!regex.test(dateStr)) {
    return false
  }

  const month = parseInt(dateStr.slice(0, 2), 10)
  const year = parseInt(dateStr.slice(2, 4), 10)

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear() % 100

  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return true
  } else {
    return false
  }
}

export const ToLocaleStringFunc = (num: number) => {
  if (Number.isNaN(num)) {
    return 0
  }

  return Number(num).toLocaleString('fr-FR')
}

// Formater les montants en dollar canadien
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Formater les mois pour l'affichage
export const formatMonth = (month: number, year: number) => {
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

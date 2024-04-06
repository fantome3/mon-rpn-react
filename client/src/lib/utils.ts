import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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

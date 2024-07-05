import { PasswordSettings } from '@/types/PasswordSettings'

const PasswordGenerator = () => {
  const passwordSettings: PasswordSettings = {
    passwordLength: 6,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  }

  const random = (min = 0, max = 1) => {
    return Math.floor(Math.random() * (max + 1 - min) + min)
  }

  const randomLower = () => {
    return String.fromCharCode(random(97, 122))
  }

  const randomUpper = () => {
    return String.fromCharCode(random(65, 90))
  }

  const randomSymbol = () => {
    const symbols = "~*$%@#^&!?*'-=/,.{}()[]<>"
    return symbols[random(0, symbols.length - 1)]
  }

  let password = ''

  for (let i = 0; i < passwordSettings.passwordLength; i++) {
    let choice = random(0, 3)
    if (passwordSettings.lowercase && choice === 0) {
      password += randomLower()
    } else if (passwordSettings.uppercase && choice === 1) {
      password += randomUpper()
    } else if (passwordSettings.symbols && choice === 2) {
      password += randomSymbol()
    } else if (passwordSettings.numbers && choice === 3) {
      password += random(0, 9)
    } else {
      i--
    }
  }

  return password
}

export default PasswordGenerator

export type Register = {
  email: string
  conditions: boolean
}

export type GenerateTokenType = {
  _id: string
  register: Register
  rememberMe: boolean
  isAdmin: boolean
  cpdLng?: string
}

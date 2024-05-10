declare namespace Express {
  export interface Request {
    user: {
      _id: string
      register: {
        email: string
        conditions: boolean
      }
      rememberMe: boolean
      isAdmin: boolean
      cpdLng: string
    }
  }
}

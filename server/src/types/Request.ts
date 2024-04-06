declare namespace Express {
  export interface Request {
    user: {
      _id: string
      register: {
        email: string
        password: string
        confirmPassword: string
        conditions: boolean
      }
      origines: {
        firstName: string
        lastName: string
        birthDate: Date
        nativeCountry: string
        sex: string
      }
      infos: {
        residenceCountry: string
        postalCode: string
        address: string
        tel: string
        hasInsurance: boolean
      }
      rememberMe: boolean
      isAdmin: boolean
    }
  }
}

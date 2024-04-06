import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from './models/userModel'

export const generateToken = (user: User) => {
  const expiresIn = user.rememberMe ? '30d' : '30m'
  return jwt.sign(
    {
      _id: user._id,
      register: {
        email: user.register.email,
        password: user.register.password,
        confirmPassword: user.register.confirmPassword,
        conditions: user.register.conditions,
      },
      origines: {
        firstName: user.origines.firstName,
        lastName: user.origines.lastName,
        birthDate: user.origines.birthDate,
        nativeCountry: user.origines.nativeCountry,
        sex: user.origines.sex,
      },
      infos: {
        residenceCountry: user.infos.residenceCountry,
        postalCode: user.infos.postalCode,
        address: user.infos.address,
        tel: user.infos.tel,
        hasInsurance: user.infos.hasInsurance,
      },
      rememberMe: user.rememberMe,
      isAdmin: user.isAdmin,
      cpdLng: user.cpdLng,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: expiresIn,
    }
  )
}

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers
  if (authorization) {
    const token = authorization.slice(7, authorization.length)
    const decode = jwt.verify(token, process.env.JWT_SECRET!)

    req.user = decode as {
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
      cpdLng: string
      token: string
    }
    next()
  } else {
    res.status(401).json({
      message: 'No Token',
    })
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.isAdmin) {
      next()
    } else {
      res.status(401).send({
        message: 'Invalid Admin Token',
      })
    }
  } catch (error) {
    res.status(500).send({
      message: 'Unexpected error',
    })
  }
}

import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { User, UserModel } from './models/userModel'
import { ActiveState, stateFromName } from '../../src/domain/familyMember/states'
import { caching } from 'cache-manager'
import { GenerateTokenType } from './types/GenerateTokenType'
import labels from './common/libelles.json'

interface DecodedUser extends JwtPayload {
  _id: string
  register: {
    email: string
    conditions: boolean
  }
  rememberMe: boolean
  isAdmin: boolean
  cpdLng: string
  token: string
}

export const generatePasswordToken = (email: string, _id: string) => {
  if (!email || !_id) {
    throw new Error('Invalid input data')
  }
  const expiresIn = '1h'
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT secret not found')
  }
  return jwt.sign({ email, _id }, secret, { expiresIn })
}

export const generateToken = (user: GenerateTokenType) => {
  const expiresIn = user.rememberMe ? '30d' : '30m'
  const secret = process.env.JWT_SECRET || ''

  const payload = {
    _id: user._id,
    register: {
      email: user.register.email,
      conditions: user.register.conditions,
    },
    rememberMe: user.rememberMe,
    isAdmin: user.isAdmin,
    cpdLng: user.cpdLng,
  }
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  })
}

export const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cache = await caching('memory', {
    max: 100,
    ttl: 2592000,
  })

  const { authorization } = req.headers
  console.log('AUTH HEADERS:', authorization) // 👈 ici
  if (!authorization) {
    return res.status(401).json({ message: labels.general.pasDeToken })
  }

  const token = authorization?.slice(7, authorization.length)

  try {
    const cachedToken: any = await cache.get(token!)
    if (cachedToken) {
      const expiresIn = cachedToken.rememberMe ? '30d' : '30m'
      if (expiresIn === '30d') {
        const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
        if (Date.now() < exp * 1000) {
          req.user = cachedToken
          return next()
        }
      } else if (expiresIn === '30m') {
        const exp = Math.floor(Date.now() / 1000) + 30 * 60
        if (Date.now() < exp * 1000) {
          req.user = cachedToken
          return next()
        }
      }
    }

    const secret = process.env.JWT_SECRET || ''

    const decode = jwt.verify(token!, secret) as DecodedUser

    const user = await UserModel.findById(decode._id)
    if (!user) {
      return res.status(401).json({ message: labels.utilisateur.introuvable })
    }

    if (user.subscription?.status === 'inactive') {
      return res.status(403).send({
        message: labels.compte.compteInactif,
      })
    }

    req.user = decode
    const ttl = 2592000
    await cache.set(token!, decode, ttl)
    return next()
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: labels.general.tokenExpire })
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: labels.general.tokenInvalide })
    } else {
      return res.status(500).json({ message: labels.general.erreurInattendue })
    }
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.isAdmin) {
      next()
    } else {
      res.status(401).send({
        message: labels.general.tokenAdminInvalide,
      })
    }
  } catch (error) {
    res.status(500).send({
      message: labels.general.erreurInattendueMin,
    })
  }
}

const generateReferralCode = (lastName: string, firstName: string): string => {
  const codeBase = `${lastName.slice(0, 2).toUpperCase()}${firstName
    .slice(0, 1)
    .toUpperCase()}`
  const randomNumbers = Math.floor(1000 + Math.random() * 9000)
  return `${codeBase}${randomNumbers}`
}

export const generateUniqueReferralCode = async (
  lastName: string,
  firstName: string
): Promise<string> => {
  let code: string
  let exists = true
  let attempt = 0

  do {
    code = generateReferralCode(lastName, firstName)
    const existingUser = await UserModel.findOne({ referralCode: code })
    exists = !!existingUser
    attempt++
    if (attempt > 10) {
      throw new Error(labels.parrainage.echecGenerationCode)
    }
  } while (exists)

  return code
}

/**
 * Calcule le nombre total de personnes à prendre en compte pour la cotisation :
 * - Le membre principal s'il a 18 ans ou plus
 * - Les membres de la famille actifs et âgés de 18 ans ou plus
 */
export const calculateTotalPersons = (user: User): number => {
  const currentYear = new Date().getFullYear()
  const userAge = currentYear - new Date(user.origines.birthDate).getFullYear()
  const includeUser = userAge >= 18 ? 1 : 0

  const dependents =
    user.familyMembers?.filter((member) => {
      const age = currentYear - new Date(member.birthDate).getFullYear()
      const state = stateFromName((member as any).state?.name)
      return age >= 18 && state instanceof ActiveState
    }) || []

  return includeUser + dependents.length
}

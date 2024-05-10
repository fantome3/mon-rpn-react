import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { User, UserModel } from './models/userModel'
import { caching } from 'cache-manager'
import { GenerateTokenType } from './types/GenerateTokenType'

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
  return jwt.sign(payload, process.env.JWT_SECRET!, {
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
  if (!authorization) {
    res.status(401).json({ message: 'No Token' })
  }

  const token = authorization?.slice(7, authorization.length)

  try {
    const cachedToken: any = await cache.get(token!)
    if (cachedToken) {
      const expiresIn = cachedToken.rememberMe ? '30d' : '30m'
      const exp =
        Math.floor(Date.now() / 1000) +
        (expiresIn === '30d' ? 30 * 24 * 60 * 60 : 30 * 60)
      if (Date.now() < exp * 1000) {
        req.user = cachedToken
        next()
      }
    }

    const decode = jwt.verify(token!, process.env.JWT_SECRET!) as DecodedUser

    const user = await UserModel.findById(decode._id)
    if (!user) {
      res.status(401).json({ message: 'User not found' })
    }

    req.user = decode
    const ttl = 2592000
    await cache.set(token!, decode, ttl)
    next()
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token Expired' })
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Invalid Token' })
    } else {
      res.status(500).json({ message: 'Unexpected Error' })
    }
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

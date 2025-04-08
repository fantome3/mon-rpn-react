import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { UserModel } from '../models/userModel'
import bcrypt from 'bcryptjs'
import { isAdmin, isAuth, generateToken, generatePasswordToken } from '../utils'
import jwt from 'jsonwebtoken'
import { AccountModel } from '../models/accountModel'
import {
  sendForgotPasswordEmail,
  sendNewUserNotification,
  sendPassword,
} from '../../mailer'

export const userRouter = express.Router()

function updateUserPassword(id: string, newPassword: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt
      .hash(newPassword, 10)
      .then((hash) => {
        UserModel.findByIdAndUpdate(id, { 'register.password': hash })
          .then(() => resolve('Success'))
          .catch((err) => reject(err))
      })
      .catch((err) => reject(err))
  })
}

userRouter.post(
  '/generate-token',
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'ddlfjssdmsmdkskm',
      { expiresIn: '1h' }
    )
    res.json({ token })
    return
  })
)

userRouter.post(
  '/verify-token',
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'ddlfjssdmsmdkskm'
      )
      res.json({ valid: true, decoded })
      return
    } catch (error) {
      res.status(401).json({ valid: false, message: 'Invalid token' })
      return
    }
  })
)

userRouter.post(
  '/reset-password/:id/:token',
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { id, token } = req.params
    const { password, confirmPassword } = req.body
    jwt.verify(
      token,
      process.env.JWT_SECRET || 'ddlfjssdmsmdkskm',
      (error, decoded) => {
        if (error) {
          return res.send({
            message: 'Error with token',
          })
        } else {
          if (password !== confirmPassword) {
            return res.send({
              message: 'Password Do Not Match',
            })
          }
          updateUserPassword(id, password)
            .then((status) => res.send({ Status: status }))
            .catch((error) => res.send({ Status: error }))
        }
      }
    )
  })
)

userRouter.post(
  '/send-password',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body
      if (!email) {
        res.status(400).send('Email Require')
        return
      }
      if (!password) {
        res.status(400).send('Password Require')
        return
      }
      sendPassword({ email, password })
    } catch (error) {
      console.log(error)
      res.status(500).send('Erreur du serveur')
      return
    }
  })
)

userRouter.post(
  '/new-user-notification',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      if (!email) {
        res.status(400).send('Email Require')
        return
      }

      const user = await UserModel.findOne({ 'register.email': email })
      if (!user) {
        res.status(404).send('Email Not Found')
        return
      }

      const accountByUserId = await AccountModel.findOne({
        userId: user?._id,
      })
      if (!accountByUserId) {
        res.status(404).send('Account Not Found')
        return
      }

      sendNewUserNotification({
        lastName: user?.origines.lastName,
        firstName: user?.origines.firstName,
        nativeCountry: user?.origines.nativeCountry,
        email: user?.register.email,
        residenceCountry: user?.infos.residenceCountry,
        tel: user?.infos.tel,
        paymentMethod: accountByUserId?.paymentMethod,
        solde: accountByUserId?.solde,
      })
    } catch (error) {
      console.log(error)
      res.status(500).send('Erreur du serveur')
      return
    }
  })
)

userRouter.post(
  '/forgot-password',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      const user = await UserModel.findOne({ 'register.email': email })
      if (user) {
        const token = generatePasswordToken(email, user._id)

        sendForgotPasswordEmail({
          token,
          userId: user._id,
          email,
        })

        res.send({
          email,
          token: token,
        })
        return
      } else {
        res.status(404).send('Email Introuvable')
        return
      }
    } catch (error) {
      console.log(error)
    }
  })
)

userRouter.post(
  '/login',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password, rememberMe } = req.body
      const user = await UserModel.findOne({ 'register.email': email })
      if (user && bcrypt.compareSync(password, user.register.password)) {
        res.send({
          ...user.toObject(),
          rememberMe: rememberMe,
          register: {
            email: user.register.email,
            conditions: user.register.conditions,
          },
          token: generateToken(user),
        })
        return
      } else {
        res.status(401).json({ message: 'Invalid email or password' })
        return
      }
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.post(
  '/register',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const {
        register,
        origines,
        infos,
        rememberMe,
        isAdmin,
        cpdLng,
        referredBy,
      } = req.body

      if (!register || !register.email || !register.password) {
        res.status(400).json({ message: 'Email and password are required' })
        return
      }

      const existingUser = await UserModel.findOne({
        'register.email': register.email,
      })
      if (existingUser) {
        res.status(409).json({ message: `L'email existe déjà` })
        return
      }

      const newUser = new UserModel({
        register: {
          ...register,
          password: bcrypt.hashSync(register.password, 10),
        },
        origines,
        infos,
        rememberMe,
        isAdmin,
        cpdLng,
        referredBy,
      })
      const user = await newUser.save()
      res.send({
        ...user.toObject(),
        register: {
          email: user.register.email,
          conditions: user.register.conditions,
        },
        token: generateToken(user),
      })
      return
    } catch (error: any) {
      res.status(400).json({ message: 'Bad Request', error: error.message })
      return
    }
  })
)

userRouter.put(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findById(req.params.id)
      if (user) {
        Object.assign(user, req.body)
        const updatedUser = await user.save()
        res.send({
          message: 'User Updated',
          user: {
            ...updatedUser.toObject(),
            register: {
              email: updatedUser.register.email,
              conditions: updatedUser.register.conditions,
            },
            token: generateToken(updatedUser),
          },
        })
        return
      } else {
        res.status(404).send({
          message: 'User Not Found',
        })
        return
      }
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.get(
  '/:referredBy/referral',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const users = await UserModel.find({
        referredBy: req.params.referredBy,
      })
        .populate('referredBy', '_id origines.firstName origines.lastName')
        .sort({ createdAt: -1 })
      res.send(users)
      return
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.get(
  '/all',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const users = await UserModel.find()
      const countUsers = await UserModel.countDocuments()
      res.send({
        users,
        countUsers,
      })
      return
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findById(req.params.id)
      if (user) {
        res.send(user)
        return
      } else {
        res.status(404).send({ message: 'User Not Found' })
        return
      }
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.delete(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findById(req.params.id)
      if (user) {
        if (user.isAdmin) {
          res.status(400).send({
            message: 'Can Not Delete Admin User',
          })
          return
        }
        const deletedUser = await user?.deleteOne()
        res.send({
          message: 'User Deleted',
          user: deletedUser,
        })
        return
      } else {
        res.status(404).send({
          message: 'User Not Found',
        })
        return
      }
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

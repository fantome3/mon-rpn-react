import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { UserModel } from '../models/userModel'
import bcrypt from 'bcryptjs'
import {
  isAdmin,
  isAuth,
  generateToken,
  generatePasswordToken,
  generateUniqueReferralCode,
} from '../utils'
import jwt from 'jsonwebtoken'
import { AccountModel } from '../models/accountModel'
import {
  sendForgotPasswordEmail,
  sendNewUserNotification,
  sendPassword,
} from '../mailer'
import labels from '../common/libelles.json'
import {
  desactivateUserAccount,
  reactivateUserAccount,
} from '../services/membershipService'
import { registerUserOnExternalApp } from '../services/externalRegistrationService'
import { softDeleteUser } from '../services/userService'

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
      res.status(401).json({ valid: false, message: labels.general.tokenInvalide })
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
      async (error, decoded) => {
        if (error) {
          res.send({
            message: labels.general.erreurJeton,
          })
          return
        } else {
          if (password !== confirmPassword) {
            res.send({
              message: labels.general.motsDePasseDifferents,
            })
            return
          }
          const status = await updateUserPassword(id, password)
          res.send({ Status: status })
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
      if (!email || !password) {
        res.status(400).send({ message: labels.general.emailMotPasseRequisFr })
        return
      }
      await sendPassword({ emailAddress: email, password })
      res.status(200).send({ message: labels.utilisateur.motDePasseEnvoye })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: labels.general.erreurEnvoiEmail })
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
        res.status(404).send(labels.compte.introuvable)
        return
      }

      sendNewUserNotification({
        lastName: user?.origines.lastName,
        firstName: user?.origines.firstName,
        nativeCountry: user?.origines.nativeCountry,
        email: user?.register.email,
        residenceCountry: user?.infos.residenceCountry,
        contactNumber: user?.infos.tel,
        paymentMethod: accountByUserId?.paymentMethod,
        balanceAmount: accountByUserId?.solde,
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
        res.status(401).json({ message: labels.general.emailOuMotPasseInvalide })
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
        res.status(400).json({ message: labels.general.emailOuMotPasseRequis })
        return
      }

      const existingUser = await UserModel.findOne({
        'register.email': register.email,
      })
      if (existingUser) {
        res.status(409).json({ message: labels.general.emailExiste })
        return
      }

      const referralCode = await generateUniqueReferralCode(
        origines.lastName,
        origines.firstName
      )

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
        referralCode,
      })
      const user = await newUser.save()

      // Enregistrement simultané sur la plateforme externe
      // débrancher puppeter pour le moment
      // registerUserOnExternalApp({ register, origines, infos }).catch((err) => {
      //   console.error('External registration failed:', err)
      // })

      const isStudent = user?.register?.occupation === 'student' && user?.register?.studentStatus === 'full-time'

      res.send({
        ...user.toObject(),
        register: {
          email: user.register.email,
          conditions: user.register.conditions,
          occupation: isStudent ? user.register.occupation : 'worker',
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

userRouter.get(
  '/all',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const users = await UserModel.find({ deletedAt: { $exists: false } })
      const countUsers = await UserModel.countDocuments({
        deletedAt: { $exists: false },
      })
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

userRouter.put(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findById(req.params.id)
      if (user) {
        Object.assign(user, req.body)
        if (req.body?.familyMembers) {
          user.familyMembers = req.body.familyMembers
          user.markModified('familyMembers')
        }
        const updatedUser = await user.save()
        res.send({
          message: labels.utilisateur.misAJour,
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
          message: labels.utilisateur.introuvable,
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
        deletedAt: { $exists: false },
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
  '/:id',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findById(req.params.id)
      if (user) {
        res.send(user)
        return
      } else {
        res.status(404).send({ message: labels.utilisateur.introuvable })
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
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await softDeleteUser(req.params.id, (req.user as any)._id)
      res.send({
        message: labels.utilisateur.supprime,
        user,
      })
      return
    } catch (error: any) {
      if (error.message === 'Cannot delete admin') {
        res.status(400).send({
          message: labels.utilisateur.impossibleSupprimerAdmin,
        })
        return
      }
      if (error.message === 'User not found') {
        res.status(404).send({
          message: labels.utilisateur.introuvable,
        })
        return
      }
      res.status(400).json(error)
      return
    }
  })
)

userRouter.put(
  '/deactivate/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const result = await desactivateUserAccount(id)

      if (result.status === 'NOT_FOUND') {
        res.status(404).json({ message: result.message })
        return
      }
      if (result.status === 'SUCCESS') {
        res.status(200).json({ message: result.message })
        return
      }
    } catch (error) {
      console.log(error)
      res
        .status(500)
        .json({ message: labels.compte.erreurDesactivation })
    }
  })
)

userRouter.put(
  '/reactivate/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const result = await reactivateUserAccount(id)
      if (result.status === 'NOT_FOUND') {
        res.status(404).json({ message: result.message })
        return
      }
      if (result.status === 'SUCCESS') {
        res.status(200).json({ message: result.message })
        return
      }
    } catch (error) {
      console.log(error)
      res
        .status(500)
        .json({ message: labels.compte.erreurReactivation })
    }
  })
)

userRouter.put(
  '/admin/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.params.id)
    if (!user) {
      res.status(404).send({ message: labels.utilisateur.introuvableFr })
      return
    }
    user.isAdmin = !user.isAdmin
    await user.save()
    res.send({
      isAdmin: user.isAdmin,
      message: user.isAdmin
        ? labels.utilisateur.ajouterAdmin
        : labels.utilisateur.supprimerAdmin,
    })
  })
)

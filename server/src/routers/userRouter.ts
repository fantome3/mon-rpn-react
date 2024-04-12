import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { UserModel } from '../models/userModel'
import bcrypt from 'bcryptjs'
import { isAdmin, isAuth, generateToken, generatePasswordToken } from '../utils'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'

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
  '/reset-password/:id/:token',
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { id, token } = req.params
    const { password, confirmPassword } = req.body
    jwt.verify(token, process.env.JWT_SECRET!, (error, decoded) => {
      if (error) {
        res.send({
          message: 'Error with token',
        })
      } else {
        if (password !== confirmPassword) {
          res.send({
            message: 'Password Do Not Match',
          })
        }
        updateUserPassword(id, password)
          .then((status) => res.send({ Status: status }))
          .catch((error) => res.send({ Status: error }))
      }
    })
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
        const transporter = nodemailer.createTransport({
          service: process.env.NODEMAILER_SERVICE,
          host: process.env.NODEMAILER_HOST,
          port: 587,
          secure: false,
          auth: {
            user: process.env.NODEMAILER_AUTH_USER,
            pass: process.env.NODEMAILER_AUTH_PASS,
          },
        })

        const mailOptions = {
          from: process.env.NODEMAILER_AUTH_USER,
          to: email,
          subject: 'Réinitialisation de mot de passe',
          text: `Cliquez sur le lien suivant pour réinitialiser votre mot de passe: http://localhost:5173/reset-password/${user._id}/${token}`,
        }

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error)
            res.status(500).send(`Erreur lors de l'envoi du mail`)
          } else {
            console.log(`Email envoyé: ${info.response}`)
            res
              .status(200)
              .send(
                'Consultez votre email pour obtenir des informations sur la réinitialisation de votre mot de passe.'
              )
          }
        })

        res.send({
          email,
          token: token,
        })
      } else {
        res.status(404).send('Email Introuvable')
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
          token: generateToken(user),
        })
      } else {
        res.status(401).json({ message: 'Invalid email or password' })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

userRouter.post(
  '/register',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { register, origines, infos, rememberMe, isAdmin, cpdLng } =
        req.body
      const newUser = new UserModel({
        register: {
          ...register,
          password: bcrypt.hashSync(register.password),
          confirmPassword: bcrypt.hashSync(register.confirmPassword),
        },
        origines,
        infos,
        rememberMe,
        isAdmin,
        cpdLng,
      })
      const user = await newUser.save()
      res.send({ ...user.toObject(), token: generateToken(user) })
    } catch (error) {
      res.status(400).json(error)
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
          user: updatedUser.toObject(),
        })
      } else {
        res.status(404).send({
          message: 'User Not Found',
        })
      }
    } catch (error) {
      res.status(400).json(error)
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
    } catch (error) {
      res.status(400).json(error)
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
      } else {
        res.status(404).send({ message: 'User Not Found' })
      }
    } catch (error) {
      res.status(400).json(error)
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
      } else {
        res.status(404).send({
          message: 'User Not Found',
        })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

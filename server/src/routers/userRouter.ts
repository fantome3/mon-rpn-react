import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { UserModel } from '../models/userModel'
import bcrypt from 'bcryptjs'
import { isAdmin, isAuth, generateToken } from '../utils'

export const userRouter = express.Router()

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

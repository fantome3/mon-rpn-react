import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { AccountModel } from '../models/accountModel'
import { isAdmin, isAuth } from '../utils'

export const accountRouter = express.Router()

accountRouter.post(
  '/new',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const newAccount = new AccountModel(req.body)
      await newAccount.save()
      res.send(newAccount.toObject())
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

accountRouter.get(
  '/all',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const accounts = await AccountModel.find()
      res.send(accounts)
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

accountRouter.get(
  '/:userId/all',
  isAuth,
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const accountsByUserId = await AccountModel.find({
        userId: req.params.userId,
      })
        .populate('userId', '_id infos origines')
        .exec()
      res.send(accountsByUserId)
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

accountRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const account = await AccountModel.findById(req.params.id)
      if (account) {
        Object.assign(account, req.body)
        const updatedAccount = await account.save()

        res.send({
          message: 'Accound Updated',
          account: updatedAccount,
        })
      } else {
        res.status(404).send({
          message: 'Account Not Found',
        })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

accountRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const account = await AccountModel.findById(req.params.id)
      if (account) {
        res.send(account)
      } else {
        res.status(404).send({
          message: 'Account Not Found',
        })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

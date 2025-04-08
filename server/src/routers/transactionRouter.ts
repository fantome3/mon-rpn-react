import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { isAuth, isAdmin } from '../utils'
import { TransactionModel } from '../models/transactionModel'

export const transactionRouter = express.Router()

transactionRouter.get(
  '/all',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const transactions = await TransactionModel.find()
        .populate('userId', '_id infos origines')
        .exec()
      res.send(transactions)
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

transactionRouter.get(
  '/:userId/all',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const transactionsByUserId = await TransactionModel.find({
        userId: req.params.userId,
      })
        .populate('userId', '_id infos origines')
        .exec()
      res.send(transactionsByUserId)
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

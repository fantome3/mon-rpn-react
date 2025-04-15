import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { isAuth, isAdmin } from '../utils'
import { TransactionModel } from '../models/transactionModel'
import {
  processAnnualMembershipPayment,
  processMembershipForUser,
} from '../services/membershipService'
import { sendBalanceReminderIfNeeded } from '../services/checkMinimumBalanceAndSendReminder'

export const transactionRouter = express.Router()

transactionRouter.post(
  '/manual-reminders',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      await processAnnualMembershipPayment()
      res.send({ message: 'Rappels envoyés avec succès' })
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de l’envoi des rappels' })
    }
  })
)

transactionRouter.get(
  '/all',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const transactions = await TransactionModel.find()
        .populate('userId', ' origines.firstName origines.lastName')
        .sort({ createdAt: -1 })
        .exec()
      res.send(transactions)
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

transactionRouter.get(
  '/summary',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const summary = await TransactionModel.aggregate([
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalCredit: {
              $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] },
            },
            totalDebit: {
              $sum: {
                $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0],
              },
            },
          },
        },
      ])

      const statusSummary = await TransactionModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])

      const monthlySummary = await TransactionModel.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
      ])

      res.send({
        summary,
        statusSummary,
        monthlySummary,
      })
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

transactionRouter.delete(
  '/delete-zero-amount',
  //isAuth,
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await TransactionModel.deleteMany({ status: undefined })

      res.send({
        message: 'Transactions supprimées avec succès',
        deletedCount: result.deletedCount,
      })
    } catch (error) {
      console.error('Erreur suppression transactions amount = 0', error)
      res.status(500).json({ message: 'Erreur lors de la suppression' })
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
        .populate('userId', ' origines.firstName origines.lastName')
        .sort({ createdAt: -1 })
        .exec()
      res.send(transactionsByUserId)
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

transactionRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const id = req.params.id
      const transaction = await TransactionModel.findById(id)
      if (transaction) {
        Object.assign(transaction, req.body)
        const transactionUpdated = transaction.save()

        res.send({
          message: 'Transaction updated',
          transaction: transactionUpdated,
        })
      } else {
        res.status(404).send({
          message: 'Transaction Not Found',
        })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

transactionRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const id = req.params.id
      const transaction = await TransactionModel.findById(id)
      if (transaction) {
        await transaction.deleteOne()
        res.send({
          message: 'Transaction Deleted',
        })
      } else {
        res.status(404).send({ message: 'Transaction Not Found' })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

transactionRouter.post(
  '/manual-payment/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    try {
      const result = await processMembershipForUser(id)
      res.status(200).json(result)
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Erreur lors du prélèvement manuel', error })
    }
  })
)

transactionRouter.post(
  '/manual-balance-reminder/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const id = req.params.id
      const result = await sendBalanceReminderIfNeeded(id)
      res.status(200).json(result)
    } catch (error) {
      res.status(500).json({
        message: 'Erreur du rappel manuel du solde',
        error,
      })
    }
  })
)

import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { isAuth, isAdmin } from '../utils'
import { TransactionModel } from '../models/transactionModel'
import {
  processAnnualMembershipPayment,
  processMembershipForUser,
} from '../services/membershipService'
import { sendBalanceReminderIfNeeded } from '../services/checkMinimumBalanceAndSendReminder'
import labels from '../common/libelles.json'
import {
  transactionDomainService,
  TransactionDomainError,
} from '../services/transactionService'

export const transactionRouter = express.Router()

const sendTransactionDomainError = (res: Response, error: unknown) => {
  if (error instanceof TransactionDomainError) {
    res.status(error.statusCode).json({ message: error.message })
    return
  }

  res.status(500).json({ message: labels.general.erreurInattendueMin })
}

transactionRouter.post(
  '/new',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const transaction = await transactionDomainService.initiateDeposit({
        ...req.body,
      })

      res.send(transaction)
    } catch (error) {
      sendTransactionDomainError(res, error)
    }
  })
)

transactionRouter.post(
  '/manual-reminders',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      await processAnnualMembershipPayment()
      res.send({ message: labels.rappel.envoyeSucces })
    } catch (error) {
      res.status(500).json({ message: labels.rappel.erreurEnvoi })
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
        message: labels.transaction.supprimeSucces,
        deletedCount: result.deletedCount,
      })
    } catch (error) {
      console.error('Erreur suppression transactions amount = 0', error)
      res.status(500).json({ message: labels.transaction.erreurSuppression })
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
        if (req.body?.status && req.body.status !== transaction.status) {
          res.status(409).json({
            message:
              "Utilisez les actions metier (confirm/reject/fail/refund/process) pour changer le statut.",
          })
          return
        }

        if (typeof req.body?.reason === 'string') {
          transaction.reason = req.body.reason.trim()
        }

        if (typeof req.body?.refInterac === 'string') {
          transaction.refInterac = req.body.refInterac.trim().toUpperCase()
        }

        const transactionUpdated = await transaction.save()

        res.send({
          message: labels.transaction.misAJour,
          transaction: transactionUpdated,
        })
      } else {
        res.status(404).send({
          message: labels.transaction.introuvable,
        })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

transactionRouter.post(
  '/:id/confirm',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const transaction = await transactionDomainService.confirm(
        req.params.id,
        req.user?._id
      )

      res.send({
        message: 'Transaction confirmee.',
        transaction,
      })
    } catch (error) {
      sendTransactionDomainError(res, error)
    }
  })
)

transactionRouter.post(
  '/:id/reject',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const transaction = await transactionDomainService.reject(
        req.params.id,
        req.user?._id
      )

      res.send({
        message: 'Transaction rejetee.',
        transaction,
      })
    } catch (error) {
      sendTransactionDomainError(res, error)
    }
  })
)

transactionRouter.post(
  '/:id/fail',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const transaction = await transactionDomainService.fail(
        req.params.id,
        req.user?._id
      )

      res.send({
        message: 'Transaction en echec.',
        transaction,
      })
    } catch (error) {
      sendTransactionDomainError(res, error)
    }
  })
)

transactionRouter.post(
  '/:id/process',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const outcome = req.body?.outcome
      if (outcome !== 'completed' && outcome !== 'failed') {
        res.status(400).json({
          message: "Le champ 'outcome' doit etre 'completed' ou 'failed'.",
        })
        return
      }

      const transaction = await transactionDomainService.process(
        req.params.id,
        outcome,
        req.user?._id
      )

      res.send({
        message: `Transaction traitee en ${outcome}.`,
        transaction,
      })
    } catch (error) {
      sendTransactionDomainError(res, error)
    }
  })
)

transactionRouter.post(
  '/:id/refund',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const amountRaw = req.body?.amount
      const amount =
        amountRaw === undefined || amountRaw === null
          ? undefined
          : Number(amountRaw)

      if (
        amountRaw !== undefined &&
        amountRaw !== null &&
        !Number.isFinite(amount)
      ) {
        res.status(400).json({
          message: 'Le montant de remboursement est invalide.',
        })
        return
      }

      const transaction = await transactionDomainService.refund(
        req.params.id,
        amount,
        req.user?._id
      )

      res.send({
        message: 'Remboursement effectue.',
        transaction,
      })
    } catch (error) {
      sendTransactionDomainError(res, error)
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
          message: labels.transaction.supprime,
        })
      } else {
        res.status(404).send({ message: labels.transaction.introuvable })
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
        .json({ message: labels.prelevement.erreurManuel, error })
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
        message: labels.rappel.erreurManuel,
        error,
      })
    }
  })
)

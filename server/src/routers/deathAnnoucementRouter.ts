import { Types } from 'mongoose'
import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { isAdmin, isAuth } from '../utils'
import { DeathAnnouncementModel } from '../models/deathAnnouncement'
import { SettingsModel } from '../models/settingsModel'
import { UserModel } from '../models/userModel'
import { AccountModel } from '../models/accountModel'
import { TransactionModel } from '../models/transactionModel'
import { notifyAllUsers } from '../mailer'
import { handleFailedPrelevement } from '../services/subscriptionService'
import labels from '../common/libelles.json'

export const deathAnnouncementRouter = express.Router()

deathAnnouncementRouter.post(
  '/new',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const newDeathAnnouncement = new DeathAnnouncementModel(req.body)
      await newDeathAnnouncement.save()

      const settings = await SettingsModel.findOne()

      if (!settings || !settings.amountPerDependent) {
        res.status(400).json({
          message: labels.prelevement.montantNonDefini,
        })
        return
      }
      const amountPerPerson = settings.amountPerDependent
      const users = await UserModel.find({
        primaryMember: true,
        deletedAt: { $exists: false },
      }).lean()
      const errors: any[] = []

      for (const user of users) {
        try {
          const userId =
            typeof user._id === 'string'
              ? new Types.ObjectId(user._id)
              : user._id
          const nbActive =
            user.familyMembers?.filter((member) => member.status === 'active')
              .length || 0
          const totalPersons = nbActive + 1
          const totalToDeduct = totalPersons * amountPerPerson

          const account = await AccountModel.findOne({ userId }).lean()
          if (!account) {
            errors.push({
              user: user.register.email,
              error: 'Aucun compte trouve',
            })
            continue
          }

          const currentRpnBalance =
            typeof account.rpn_balance === 'number'
              ? account.rpn_balance
              : account.solde || 0

          if (currentRpnBalance < totalToDeduct) {
            const userDoc = await UserModel.findById(userId)
            if (userDoc) {
              await handleFailedPrelevement({
                user: userDoc,
                type: 'balance',
                totalToDeduct,
                solde: currentRpnBalance,
                maxMissed: settings?.maxMissedReminders,
                totalPersons,
              })
            }
            errors.push({
              userId,
              email: user.register.email,
              reason: 'Solde insuffisant',
              solde: currentRpnBalance,
              required: totalToDeduct,
            })
            continue
          }

          await AccountModel.updateOne(
            { userId },
            { $inc: { rpn_balance: -totalToDeduct, solde: -totalToDeduct } }
          )

          await TransactionModel.create({
            userId,
            amount: totalToDeduct,
            type: 'debit',
            reason: `Prelevement deces pour ${totalPersons} personnes`,
          })
        } catch (error: any) {
          errors.push({
            userId: user._id,
            email: user.register?.email,
            reason: 'Erreur systeme',
            error: error.message,
          })
        }
      }

      await notifyAllUsers({
        firstName: newDeathAnnouncement.firstName,
        deathPlace: newDeathAnnouncement.deathPlace,
        deathDate: newDeathAnnouncement.deathDate,
      })
      res.send({
        message: labels.annonce.cree,
        announcement: newDeathAnnouncement.toObject(),
        errors,
      })
      return
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

deathAnnouncementRouter.get(
  '/all',
  expressAsyncHandler(async (_req: Request, res: Response) => {
    try {
      const deathAnnouncements = await DeathAnnouncementModel.find()
      res.send(deathAnnouncements.reverse())
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

deathAnnouncementRouter.put(
  '/:id',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const deathAnnouncement = await DeathAnnouncementModel.findById(
        req.params.id
      )
      if (deathAnnouncement) {
        Object.assign(deathAnnouncement, req.body)
        const updatedDeathAnnouncement = deathAnnouncement.save()
        res.send({
          message: labels.annonce.misAJour,
          deathAnnouncement: updatedDeathAnnouncement,
        })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

deathAnnouncementRouter.get(
  '/summary',
  expressAsyncHandler(async (_req: Request, res: Response) => {
    const deaths = await DeathAnnouncementModel.aggregate([
      {
        $group: {
          _id: null,
          numDeaths: { $sum: 1 },
        },
      },
    ])

    const date = new Date()
    const y = date.getFullYear()
    const m = date.getMonth()
    const firstDay = new Date(y, m, 1)
    const lastDate = new Date(y, m + 1, 0)

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const tomorrow = new Date()
    tomorrow.setUTCHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const yesterday = new Date()
    yesterday.setUTCHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)

    const currentMonthPrevieww = await DeathAnnouncementModel.aggregate([
      {
        $facet: {
          month: [
            {
              $match: {
                deathDate: {
                  $gte: firstDay,
                  $lt: lastDate,
                },
              },
            },
            {
              $group: {
                _id: 'currentMonth',
                totalDeaths: {
                  $sum: 1,
                },
              },
            },
          ],
          today: [
            {
              $match: {
                deathDate: {
                  $gte: today,
                  $lt: tomorrow,
                },
              },
            },
            {
              $group: {
                _id: 'today',
                totalDeaths: {
                  $sum: 1,
                },
              },
            },
          ],
          yesterday: [
            {
              $match: {
                deathDate: {
                  $gte: yesterday,
                  $lt: today,
                },
              },
            },
            {
              $group: {
                _id: 'yesterday',
                totalDeaths: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
    ])

    const year = new Date().getFullYear()
    const yearfirstDay = new Date(year, 0, 1)
    const yearlastDay = new Date(year, 12, 0)

    const totalMonthly = await DeathAnnouncementModel.aggregate([
      {
        $match: {
          deathDate: {
            $gte: yearfirstDay,
            $lt: yearlastDay,
          },
        },
      },
      {
        $group: {
          _id: {
            $month: '$deathDate',
          },
          totalDeaths: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          x: '$_id',
          y: '$totalDeaths',
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]).exec()

    res.send({
      totalMonthly,
      currentMonthPrevieww,
      deaths,
    })
  })
)

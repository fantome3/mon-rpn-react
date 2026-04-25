import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { isAdmin, isAuth } from '../utils'
import { DeathAnnouncementModel } from '../models/deathAnnouncement'
import {
  createDeathAnnouncement,
  DeathAnnouncementServiceError,
  queueDeathAnnouncementProcessing,
} from '../services/deathAnnouncementService'
import labels from '../common/libelles.json'

export const deathAnnouncementRouter = express.Router()

deathAnnouncementRouter.post(
  '/new',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { announcement, shouldProcess } = await createDeathAnnouncement(
        req.body
      )

      if (shouldProcess) {
        queueDeathAnnouncementProcessing(announcement._id)
      }

      res.status(202).send({
        message: shouldProcess
          ? labels.annonce.cree
          : labels.annonce.creeSansPrelevement,
        announcement: announcement.toObject(),
      })
      return
    } catch (error: any) {
      if (error instanceof DeathAnnouncementServiceError) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      if (error?.name === 'ValidationError') {
        res.status(400).json({ message: error.message })
        return
      }
      res.status(500).json({
        message: labels.general.erreurInattendueMin,
      })
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
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const yearFirstDay = new Date(currentYear, 0, 1)
    const yearLastDay = new Date(currentYear, 12, 0)
    const monthFirstDay = new Date(currentYear, currentMonth, 1)
    const monthLastDay = new Date(currentYear, currentMonth + 1, 0)

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date()
    tomorrow.setUTCHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date()
    yesterday.setUTCHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)

    const deaths = await DeathAnnouncementModel.aggregate([
      {
        $match: {
          deathDate: { $gte: yearFirstDay, $lt: yearLastDay },
        },
      },
      {
        $group: {
          _id: null,
          numDeaths: { $sum: 1 },
        },
      },
    ])

    const currentMonthPrevieww = await DeathAnnouncementModel.aggregate([
      {
        $facet: {
          month: [
            {
              $match: {
                deathDate: {
                  $gte: monthFirstDay,
                  $lt: monthLastDay,
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

    const totalMonthly = await DeathAnnouncementModel.aggregate([
      {
        $match: {
          deathDate: {
            $gte: yearFirstDay,
            $lt: yearLastDay,
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

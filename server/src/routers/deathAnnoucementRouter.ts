import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { isAdmin, isAuth } from '../utils'
import { DeathAnnouncementModel } from '../models/deathAnnouncement'

export const deathAnnouncementRouter = express.Router()

deathAnnouncementRouter.post(
  '/new',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const newDeathAnnouncement = new DeathAnnouncementModel(req.body)
      await newDeathAnnouncement.save()
      res.send(newDeathAnnouncement.toObject())
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

deathAnnouncementRouter.get(
  '/all',
  //isAuth,
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
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
  //isAuth,
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const deathAnnouncement = await DeathAnnouncementModel.findById(
        req.params.id
      )
      if (deathAnnouncement) {
        Object.assign(deathAnnouncement, req.body)
        const updatedDeathAnnouncement = deathAnnouncement.save()
        res.send({
          message: 'Announcement Updated',
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
  expressAsyncHandler(async (req: Request, res: Response) => {
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
                createdAt: {
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
                createdAt: {
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
                createdAt: {
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
          createdAt: {
            $gte: yearfirstDay,
            $lt: yearlastDay,
          },
        },
      },
      {
        $group: {
          _id: {
            $month: '$createdAt',
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

import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { isAuth, isAdmin } from '../utils'
import { SettingsModel } from '../models/settingsModel'
import labels from '../common/libelles.json'

export const settingRouter = express.Router()

settingRouter.put(
  '/:id',
  //isAuth,
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const settings = await SettingsModel.findById(req.params.id)
      if (settings) {
        Object.assign(settings, req.body)
        const updatedSettings = await settings.save()
        res.send({
          message: labels.SETTINGS_UPDATED,
          settings: updatedSettings,
        })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

settingRouter.get(
  '/current',
  //isAuth,
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const settings = await SettingsModel.findOne()
      if (!settings) {
        res.status(404).json({ message: labels.AUCUN_PARAMETRE })
      } else {
        res.send(settings.toObject())
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

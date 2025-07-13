import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { AccountModel } from '../models/accountModel'
import { isAuth } from '../utils'
import { UserModel } from '../models/userModel'
import labels from '../common/libelles.json'

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
  //isAuth,
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const accounts = await AccountModel.find().populate(
        'userId',
        '_id subscription.status'
      )
      res.send(accounts)
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

accountRouter.get(
  '/:userId/all',
  //isAuth,
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const accountsByUserId = await AccountModel.find({
        userId: req.params.userId,
      })
        .populate('userId', '_id infos origines subscription.status')
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
  //isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const account = await AccountModel.findById(req.params.id)
      if (account) {
        const previousFirstName = account.firstName
        const previousLastName = account.lastName
        const previousTel = account.userTel
        const previousResidenceCountry = account.userResidenceCountry

        Object.assign(account, req.body)
        const updatedAccount = await account.save()
        if (updatedAccount.userId) {
          const updateFields: any = {}
          if (previousFirstName !== updatedAccount.firstName) {
            updateFields['origines.firstName'] = updatedAccount.firstName
          }

          if (previousLastName !== updatedAccount.lastName) {
            updateFields['origines.lastName'] = updatedAccount.lastName
          }

          if (previousTel !== updatedAccount.userTel) {
            updateFields['infos.tel'] = updatedAccount.userTel
          }

          if (
            previousResidenceCountry !== updatedAccount.userResidenceCountry
          ) {
            updateFields['infos.residenceCountry'] =
              updatedAccount.userResidenceCountry
          }

          if (Object.keys(updateFields).length > 0) {
            await UserModel.findByIdAndUpdate(
              updatedAccount.userId,
              updateFields,
              { new: true }
            )
          }
        }
        res.send({
          message: labels.compte.misAJour,
          account: updatedAccount,
        })
      } else {
        res.status(404).send({
          message: labels.compte.introuvable,
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
          message: labels.compte.introuvable,
        })
      }
    } catch (error) {
      res.status(400).json(error)
    }
  })
)

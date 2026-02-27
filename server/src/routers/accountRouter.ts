import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { AccountModel } from '../models/accountModel'
import { isAuth } from '../utils'
import { UserModel } from '../models/userModel'
import labels from '../common/libelles.json'
import {
  interacRefExists,
  normalizeInteracRef,
} from '../services/interacReferenceService'
import { canIncreaseRpnBalance } from '../services/rpnPaymentEligibilityService'

export const accountRouter = express.Router()

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const resolveBalancesFromBody = (body: any) => {
  const hasMembership = body.membership_balance !== undefined
  const hasRpn = body.rpn_balance !== undefined

  const membershipBalance = hasMembership
    ? toNumber(body.membership_balance, 0)
    : toNumber(body.solde, 0)

  const rpnBalance = hasRpn ? toNumber(body.rpn_balance, 0) : 0

  return {
    membership_balance: membershipBalance,
    rpn_balance: rpnBalance,
    solde: membershipBalance + rpnBalance,
  }
}

accountRouter.post(
  '/new',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      if (req.body?.interac) {
        const interacInput = req.body.interac
        const interacArray = Array.isArray(interacInput)
          ? interacInput
          : [interacInput]

        req.body.interac = interacArray.map((item: any) => ({
          ...item,
          refInterac: normalizeInteracRef(item?.refInterac),
        }))

        const refs = req.body.interac
          .map((item: any) => item?.refInterac)
          .filter(Boolean)

        if (await interacRefExists(refs)) {
          res.status(400).json({ message: labels.general.codeInvalide })
          return
        }
      }

      const balances = resolveBalancesFromBody(req.body)
      const newAccount = new AccountModel(req.body)
      Object.assign(newAccount, balances)
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
        '_id isAdmin subscription.status subscription.membershipPaidThisYear subscription.lastMembershipPaymentYear subscription.endDate deletedAt'
      )
      const activeAccounts = accounts.filter(
        (account) => !(account as any).userId?.deletedAt
      )
      res.send(activeAccounts)
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
        .populate(
          'userId',
          '_id infos origines subscription.status subscription.membershipPaidThisYear subscription.lastMembershipPaymentYear subscription.endDate'
        )
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
        if (req.body?.interac) {
          const interacInput = req.body.interac
          const interacArray = Array.isArray(interacInput)
            ? interacInput
            : [interacInput]
          const normalizedInterac = interacArray.map((item: any) => ({
            ...item,
            refInterac: normalizeInteracRef(item?.refInterac),
          }))

          const existingRefs = (account.interac ?? [])
            .map((item) => normalizeInteracRef(item.refInterac))
            .filter(Boolean)
          const incomingRefs = normalizedInterac
            .map((item: any) => item?.refInterac)
            .filter(Boolean)
          const newRefs = incomingRefs.filter(
            (ref: string) => !existingRefs.includes(ref)
          )

          if (
            newRefs.length > 0 &&
            (await interacRefExists(newRefs, {
              excludeAccountId: account._id?.toString(),
            }))
          ) {
            res.status(400).json({ message: labels.general.codeInvalide })
            return
          }

          req.body.interac = normalizedInterac
        }

        const previousFirstName = account.firstName
        const previousLastName = account.lastName
        const previousTel = account.userTel
        const previousResidenceCountry = account.userResidenceCountry
        const balances = resolveBalancesFromBody({
          ...account.toObject(),
          ...req.body,
        })
        const previousMembershipBalance = toNumber(account.membership_balance, 0)
        const previousRpnBalance = toNumber(account.rpn_balance, 0)
        const nextMembershipBalance = balances.membership_balance
        const nextRpnBalance = balances.rpn_balance

        if (nextRpnBalance > previousRpnBalance) {
          const accountOwner = account.userId
            ? await UserModel.findById(account.userId)
                .select(
                  'primaryMember subscription.membershipPaidThisYear subscription.lastMembershipPaymentYear'
                )
                .lean()
            : null

          const canProceed = canIncreaseRpnBalance({
            user: accountOwner,
            previousMembershipBalance,
            previousRpnBalance,
            nextMembershipBalance,
            nextRpnBalance,
            isActorAdmin: req.user?.isAdmin,
          })

          if (!canProceed) {
            res.status(400).json({
              message: labels.compte.rpnBloqueMembership,
            })
            return
          }
        }

        Object.assign(account, req.body)
        Object.assign(account, balances)
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

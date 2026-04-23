import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { AccountModel } from '../models/accountModel'
import { isAuth, toNumber } from '../utils'
import { UserModel } from '../models/userModel'
import labels from '../common/libelles.json'
import {
  interacRefExists,
  normalizeInteracRef,
} from '../services/interacReferenceService'
import { canIncreaseRpnBalance } from '../services/rpnPaymentEligibilityService'
import { TransactionModel } from '../models/transactionModel'

export const accountRouter = express.Router()

const resolveBalancesFromBody = (body: any) => {
  const membershipBalance = toNumber(body.membership_balance, 0)

  const rpnBalance = toNumber(body.rpn_balance, 0);

  return {
    membership_balance: membershipBalance,
    rpn_balance: rpnBalance,
  }
}

accountRouter.post(
  '/new',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      if (req.body?.interac) {
        const interacInput = req.body.interac

        req.body.interac = {
          ...interacInput,
          refInterac: interacInput?.refInterac.trim() ?? '',
        }

        if (await interacRefExists(interacInput.refInterac)) {
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
          const normalizedInterac = {
            ...req.body.interac,
            refInterac: req.body.interac?.refInterac.trim(),
          }

          const existingRefs = (account.interac ?? [])
            .map((item) => normalizeInteracRef(item.refInterac))
            .filter(Boolean)

          const incomingRef = normalizeInteracRef(normalizedInterac.refInterac)

          // Vérifier si c’est une nouvelle référence
          const isNewRef = incomingRef && !existingRefs.includes(incomingRef)

          // Vérifier si elle existe ailleurs
          if ( isNewRef 
            && (await interacRefExists(incomingRef, { excludeAccountId: account._id?.toString(), }))
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

accountRouter.post(
  '/:id/balance-correction',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { membershipBalance, rpnBalance } = req.body

      const hasMembership = membershipBalance !== undefined && membershipBalance !== null && membershipBalance !== ''
      const hasRpn = rpnBalance !== undefined && rpnBalance !== null && rpnBalance !== ''

      if (!hasMembership && !hasRpn) {
        res.status(400).json({ message: labels.migration.aucunMontant })
        return
      }

      const nextMembership = hasMembership ? toNumber(membershipBalance, 0) : undefined
      const nextRpn = hasRpn ? toNumber(rpnBalance, 0) : undefined

      if ((nextMembership !== undefined && nextMembership < 0) || (nextRpn !== undefined && nextRpn < 0)) {
        res.status(400).json({ message: labels.migration.montantInvalide })
        return
      }

      const account = await AccountModel.findById(req.params.id)
      if (!account) {
        res.status(404).json({ message: labels.compte.introuvable })
        return
      }

      const previousMembership = toNumber(account.membership_balance, 0)
      const previousRpn = toNumber(account.rpn_balance, 0)

      if (nextMembership !== undefined) account.membership_balance = nextMembership
      if (nextRpn !== undefined) account.rpn_balance = nextRpn
      await account.save()

      const membershipDiff = nextMembership !== undefined ? nextMembership - previousMembership : 0
      const rpnDiff = nextRpn !== undefined ? nextRpn - previousRpn : 0

      if (membershipDiff !== 0 || rpnDiff !== 0) {
        const fundType =
          membershipDiff !== 0 && rpnDiff !== 0 ? 'both'
            : membershipDiff !== 0 ? 'membership'
              : 'rpn'

        await TransactionModel.create({
          userId: account.userId,
          amount: Math.abs(membershipDiff) + Math.abs(rpnDiff),
          type: 'credit',
          fundType,
          membershipAmount: Math.abs(membershipDiff),
          rpnAmount: Math.abs(rpnDiff),
          reason: labels.migration.reason,
          status: 'completed',
          balanceApplied: true,
          appliedAt: new Date(),
        })
      }

      res.send({ message: labels.migration.correctionSucces, account })
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

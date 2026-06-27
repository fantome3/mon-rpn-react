import express, { Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { UserModel } from '../models/userModel'
import bcrypt from 'bcryptjs'
import {
  isAdmin,
  isAuth,
  generateToken,
  generatePasswordToken,
  generateUniqueReferralCode,
} from '../utils'
import jwt from 'jsonwebtoken'
import { AccountModel } from '../models/accountModel'
import {
  sendForgotPasswordEmail,
  sendNewUserNotification,
  sendPassword,
} from '../mailer'
import labels from '../common/libelles.json'
import {
  desactivateUserAccount,
  reactivateUserAccount,
} from '../services/membershipService'
import { softDeleteUser } from '../services/userService'
import {
  onFamilyMembersUpdated,
  onFamilyMemberStatusChanged,
  onFamilyMemberRpnStatusChanged,
} from '../services/rpnLifecycleService'
import {
  enrollFamilyMemberOnExternalPlatform,
  deactivateOnExternalPlatform,
  reactivateOnExternalPlatform,
} from '../services/rpnExternalPlatformService'
import {
  findRegistrationConflict,
  mapRegistrationPersistenceErrorToConflict,
} from '../services/registrationConflictService'

export const userRouter = express.Router()

const PARENT_RELATIONS = ['Père', 'Mère', 'Beau-père', 'Belle-mère']

/**
 * Determine si un membre de famille est facturé pour le membership.
 * Miroir de la logique calculateMembershipAmount dans membershipService.ts.
 * - Mineur (< 18 ans) : non facturé
 * - Parent (Père / Mère / Beau-père / Belle-mère) non résident au Canada : non facturé
 * - Tous les autres adultes actifs : facturés
 */
const isMemberBillable = (member: {
  birthDate?: Date | string
  relationship?: string
  livesInCanada?: boolean
  residenceCountryStatus?: string
}): boolean => {
  const currentYear = new Date().getFullYear()
  const age = currentYear - new Date(member.birthDate ?? 0).getFullYear()
  if (age < 18) return false

  const rel = member.relationship ?? ''
  if (PARENT_RELATIONS.includes(rel)) {
    const isResident =
      member.livesInCanada !== undefined
        ? member.livesInCanada
        : member.residenceCountryStatus !== 'visitor'
    return isResident
  }

  return true
}

const trimStringsDeep = <T>(value: T, excludeKeys = new Set<string>()): T => {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    return value.trim() as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => trimStringsDeep(item, excludeKeys)) as T
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, val]) => {
        if (excludeKeys.has(key)) return [key, val]
        return [key, trimStringsDeep(val, excludeKeys)]
      }
    )
    return Object.fromEntries(entries) as T
  }
  return value
}

function updateUserPassword(id: string, newPassword: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt
      .hash(newPassword, 10)
      .then((hash) => {
        UserModel.findByIdAndUpdate(id, { 'register.password': hash })
          .then(() => resolve('Success'))
          .catch((err) => reject(err))
      })
      .catch((err) => reject(err))
  })
}

userRouter.post(
  '/generate-token',
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'ddlfjssdmsmdkskm',
      { expiresIn: '1h' }
    )
    res.json({ token })
    return
  })
)

userRouter.post(
  '/verify-token',
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'ddlfjssdmsmdkskm'
      )
      res.json({ valid: true, decoded })
      return
    } catch (error) {
      res.status(401).json({ valid: false, message: labels.general.tokenInvalide })
      return
    }
  })
)

userRouter.post(
  '/reset-password/:id/:token',
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { id, token } = req.params
    const { password, confirmPassword } = req.body
    jwt.verify(
      token,
      process.env.JWT_SECRET || 'ddlfjssdmsmdkskm',
      async (error, decoded) => {
        if (error) {
          res.send({
            message: labels.general.erreurJeton,
          })
          return
        } else {
          if (password !== confirmPassword) {
            res.send({
              message: labels.general.motsDePasseDifferents,
            })
            return
          }
          const status = await updateUserPassword(id, password)
          res.send({ Status: status })
        }
      }
    )
  })
)

userRouter.post(
  '/send-password',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        res.status(400).send({ message: labels.general.emailMotPasseRequisFr })
        return
      }
      await sendPassword({ emailAddress: email, password })
      res.status(200).send({ message: labels.utilisateur.motDePasseEnvoye })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: labels.general.erreurEnvoiEmail })
    }
  })
)

userRouter.post(
  '/new-user-notification',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      if (!email) {
        res.status(400).send('Email Require')
        return
      }

      const user = await UserModel.findOne({ 'register.email': email })
      if (!user) {
        res.status(404).send('Email Not Found')
        return
      }

      const accountByUserId = await AccountModel.findOne({
        userId: user?._id,
      })
      if (!accountByUserId) {
        res.status(404).send(labels.compte.introuvable)
        return
      }

      sendNewUserNotification({
        lastName: user?.origines.lastName,
        firstName: user?.origines.firstName,
        nativeCountry: user?.origines.nativeCountry,
        email: user?.register.email,
        residenceCountry: user?.infos.residenceCountry,
        contactNumber: user?.infos.tel,
        paymentMethod: accountByUserId?.paymentMethod,
        balanceAmount:
          (accountByUserId?.membership_balance || 0) +
          (accountByUserId?.rpn_balance || 0),
      })
    } catch (error) {
      console.log(error)
      res.status(500).send('Erreur du serveur')
      return
    }
  })
)

userRouter.post(
  '/forgot-password',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      const user = await UserModel.findOne({ 'register.email': email })
      if (user) {
        const token = generatePasswordToken(email, user._id)

        sendForgotPasswordEmail({
          token,
          userId: user._id,
          email,
        })

        res.send({
          email,
          token: token,
        })
        return
      } else {
        res.status(404).send('Email Introuvable')
        return
      }
    } catch (error) {
      console.log(error)
    }
  })
)

userRouter.post(
  '/login',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password, rememberMe } = req.body
      const user = await UserModel.findOne({ 'register.email': email.toLowerCase() })
      if (user && bcrypt.compareSync(password, user.register.password)) {
        res.send({
          ...user.toObject(),
          rememberMe: rememberMe,
          register: {
            email: user.register.email,
            conditions: user.register.conditions,
          },
          token: generateToken(user),
        })
        return
      } else {
        res.status(401).json({ message: labels.general.emailOuMotPasseInvalide })
        return
      }
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.post(
  '/register',
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const {
        register,
        origines,
        infos,
        rememberMe,
        isAdmin,
        cpdLng,
        referredBy,
      } = req.body

      if (!register || !register.email || !register.password) {
        res.status(400).json({ message: labels.general.emailOuMotPasseRequis })
        return
      }

      const sanitizedRegister = trimStringsDeep(register, new Set(['password', 'newPassword']))
      const sanitizedOrigines = trimStringsDeep(origines)
      const sanitizedInfos = trimStringsDeep(infos)

      const registrationConflict = await findRegistrationConflict({
        email: sanitizedRegister.email,
        lastName: sanitizedOrigines?.lastName,
        phone: sanitizedInfos?.tel,
      })
      if (registrationConflict) {
        res.status(409).json(registrationConflict)
        return
      }

      const referralCode = await generateUniqueReferralCode(
        sanitizedOrigines.lastName,
        sanitizedOrigines.firstName
      )

      const newUser = new UserModel({
        register: {
          ...sanitizedRegister,
          password: bcrypt.hashSync(register.password, 10),
        },
        origines: sanitizedOrigines,
        infos: sanitizedInfos,
        rememberMe,
        isAdmin,
        cpdLng,
        referredBy,
        referralCode,
      })
      const user = await newUser.save()

      // Enregistrement simultané sur la plateforme externe
      // débrancher puppeter pour le moment
      // registerUserOnExternalApp({ register, origines, infos }).catch((err) => {
      //   console.error('External registration failed:', err)
      // })

      const isStudent = user?.register?.occupation === 'student' && user?.register?.studentStatus === 'full-time'

      res.send({
        ...user.toObject(),
        register: {
          email: user.register.email,
          conditions: user.register.conditions,
          occupation: isStudent ? user.register.occupation : 'worker',
        },
        token: generateToken(user),
      })
      return
    } catch (error: unknown) {
      const registrationConflict = mapRegistrationPersistenceErrorToConflict(error)
      if (registrationConflict) {
        res.status(409).json(registrationConflict)
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ message: 'Bad Request', error: errorMessage })
      return
    }
  })
)

userRouter.get(
  '/all',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const users = await UserModel.find({ deletedAt: { $exists: false } })
      const countUsers = await UserModel.countDocuments({
        deletedAt: { $exists: false },
      })
      res.send({
        users,
        countUsers,
      })
      return
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.put(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findById(req.params.id)
      if (user) {
        const previousFamilyMembers = req.body?.familyMembers
          ? user.familyMembers.map((m) => ({
              _id: (m as any)._id?.toString() ?? '',
              status: m.status,
              rpnStatus: m.rpnStatus,
              rpnExternalReference: m.rpnExternalReference,
            }))
          : null
        Object.assign(user, req.body)
        if (req.body?.familyMembers) {
          // Préserver les champs RPN (référence externe, matricule) gérés côté serveur
          const rpnFieldsById = new Map(
            user.familyMembers
              .filter((m) => m.rpnExternalReference)
              .map((m) => [(m as any)._id?.toString(), {
                rpnExternalReference: m.rpnExternalReference,
                rpnMatricule:         m.rpnMatricule,
              }])
          )

          const membershipPaid = user.subscription?.membershipPaidThisYear === true

          user.familyMembers = req.body.familyMembers.map((incoming: any) => {
            const rpn = rpnFieldsById.get(incoming._id?.toString())
            const merged = rpn ? { ...incoming, ...rpn } : incoming

            // Marquer comme "non couvert" uniquement si membershipCoveredThisYear est absent (undefined = jamais
            // traité), et seulement si le paiement annuel est déjà effectué. On ne touche PAS aux membres
            // déjà couverts (valeur = année) ni à ceux déjà marqués "en attente de couverture" (null).
            if (membershipPaid && merged.status === 'active' && isMemberBillable(merged) && merged.membershipCoveredThisYear === undefined) {
              merged.membershipCoveredThisYear = null
            }

            // Guard legacy : rpnExternalReference est la preuve d'une inscription existante.
            // Si rpnStatus est absent ou 'not_enrolled' alors que la référence externe existe,
            // dériver le statut correct depuis le statut membership du membre.
            if (merged.rpnExternalReference && (!merged.rpnStatus || merged.rpnStatus === 'not_enrolled')) {
              merged.rpnStatus = merged.status === 'active' ? 'enrolled' : 'unsubscribed'
            }

            return merged
          })
          user.markModified('familyMembers')
        }
        const updatedUser = await user.save()

        if (previousFamilyMembers) {
          onFamilyMemberStatusChanged(previousFamilyMembers, updatedUser).catch((err) =>
            console.error('[userRouter] onFamilyMemberStatusChanged:', err)
          )
          onFamilyMemberRpnStatusChanged(previousFamilyMembers, updatedUser).catch((err) =>
            console.error('[userRouter] onFamilyMemberRpnStatusChanged:', err)
          )
          onFamilyMembersUpdated(updatedUser).catch((err) =>
            console.error('[userRouter] onFamilyMembersUpdated:', err)
          )
        }
        res.send({
          message: labels.utilisateur.misAJour,
          user: {
            ...updatedUser.toObject(),
            register: {
              email: updatedUser.register.email,
              conditions: updatedUser.register.conditions,
            },
            token: generateToken(updatedUser),
          },
        })
        return
      } else {
        res.status(404).send({
          message: labels.utilisateur.introuvable,
        })
        return
      }
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.get(
  '/:referredBy/referral',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const users = await UserModel.find({
        referredBy: req.params.referredBy,
        deletedAt: { $exists: false },
      })
        .populate('referredBy', '_id origines.firstName origines.lastName')
        .sort({ createdAt: -1 })
      res.send(users)
      return
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findById(req.params.id)
      if (user) {
        res.send(user)
        return
      } else {
        res.status(404).send({ message: labels.utilisateur.introuvable })
        return
      }
    } catch (error) {
      res.status(400).json(error)
      return
    }
  })
)

userRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await softDeleteUser(req.params.id, (req.user as any)._id)
      res.send({
        message: labels.utilisateur.supprime,
        user,
      })
      return
    } catch (error: any) {
      if (error.message === 'Cannot delete admin') {
        res.status(400).send({
          message: labels.utilisateur.impossibleSupprimerAdmin,
        })
        return
      }
      if (error.message === 'User not found') {
        res.status(404).send({
          message: labels.utilisateur.introuvable,
        })
        return
      }
      res.status(400).json(error)
      return
    }
  })
)

userRouter.put(
  '/deactivate/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const result = await desactivateUserAccount(id)

      if (result.status === 'NOT_FOUND') {
        res.status(404).json({ message: result.message })
        return
      }
      if (result.status === 'SUCCESS') {
        res.status(200).json({ message: result.message })
        return
      }
    } catch (error) {
      console.log(error)
      res
        .status(500)
        .json({ message: labels.compte.erreurDesactivation })
    }
  })
)

userRouter.put(
  '/reactivate/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const result = await reactivateUserAccount(id)
      if (result.status === 'NOT_FOUND') {
        res.status(404).json({ message: result.message })
        return
      }
      if (result.status === 'SUCCESS') {
        res.status(200).json({ message: result.message })
        return
      }
    } catch (error) {
      console.log(error)
      res
        .status(500)
        .json({ message: labels.compte.erreurReactivation })
    }
  })
)

userRouter.put(
  '/admin/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.params.id)
    if (!user) {
      res.status(404).send({ message: labels.utilisateur.introuvableFr })
      return
    }
    user.isAdmin = !user.isAdmin
    await user.save()
    res.send({
      isAdmin: user.isAdmin,
      message: user.isAdmin
        ? labels.utilisateur.ajouterAdmin
        : labels.utilisateur.supprimerAdmin,
    })
  })
)

userRouter.post(
  '/admin/backfill-rpn-status',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    const users = await UserModel.find({
      'familyMembers.rpnExternalReference': { $exists: true, $ne: null },
    })

    const report: Array<{ userId: string; name: string; members: Array<{ name: string; oldStatus: string; newStatus: string }> }> = []

    for (const user of users) {
      const fixedMembers: Array<{ name: string; oldStatus: string; newStatus: string }> = []

      for (let i = 0; i < user.familyMembers.length; i++) {
        const m = user.familyMembers[i]
        if (m.rpnExternalReference && (!m.rpnStatus || m.rpnStatus === 'not_enrolled')) {
          const newStatus = m.status === 'active' ? 'enrolled' : 'unsubscribed'
          fixedMembers.push({
            name: `${m.firstName} ${m.lastName}`,
            oldStatus: m.rpnStatus ?? 'undefined',
            newStatus,
          })
          user.familyMembers[i].rpnStatus = newStatus as any
        }
      }

      if (fixedMembers.length > 0) {
        user.markModified('familyMembers')
        await user.save()
        report.push({
          userId: user._id.toString(),
          name: `${user.origines.firstName} ${user.origines.lastName}`,
          members: fixedMembers,
        })
      }
    }

    const totalFixed = report.reduce((sum, u) => sum + u.members.length, 0)
    res.status(200).json({ fixed: totalFixed, users: report })
  })
)

userRouter.post(
  '/:userId/retry-rpn-family/:memberId',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { userId, memberId } = req.params

    const user = await UserModel.findById(userId)
    if (!user) {
      res.status(404).json({ message: labels.utilisateur.introuvableFr })
      return
    }

    const primaryRef = user.subscription?.rpnExternalReference
    if (!primaryRef) {
      res.status(400).json({ message: 'Le membre principal n\'est pas encore inscrit sur notrerpn.org.' })
      return
    }

    const memberIndex = user.familyMembers.findIndex(
      (m) => (m as any)._id?.toString() === memberId
    )
    if (memberIndex === -1) {
      res.status(404).json({ message: 'Membre de famille introuvable.' })
      return
    }

    const member = user.familyMembers[memberIndex]
    const result = await enrollFamilyMemberOnExternalPlatform(user, member, primaryRef)

    if (!result) {
      res.status(502).json({ message: 'Échec de l\'inscription sur notrerpn.org. Vérifiez les logs.' })
      return
    }

    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          [`familyMembers.${memberIndex}.rpnExternalReference`]: result.reference,
          [`familyMembers.${memberIndex}.rpnMatricule`]: result.matricule,
          [`familyMembers.${memberIndex}.rpnStatus`]: 'enrolled',
        },
      }
    )

    res.status(200).json({ message: 'Inscription RPN réussie.', reference: result.reference, matricule: result.matricule })
  })
)

userRouter.patch(
  '/:userId/rpn-primary',
  isAuth,
  expressAsyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { action } = req.body as { action: 'unsubscribe' | 'resubscribe' }

    const user = await UserModel.findById(userId)
    if (!user) {
      res.status(404).json({ message: labels.utilisateur.introuvable })
      return
    }

    const { rpnStatus, rpnExternalReference } = user.subscription

    if (action === 'unsubscribe' && rpnStatus === 'enrolled') {
      user.subscription.rpnStatus = 'unsubscribed'
      await user.save()
      if (rpnExternalReference) {
        deactivateOnExternalPlatform(
          rpnExternalReference,
          'Désinscription RPN volontaire — le membre principal retire sa propre couverture du fonds décès'
        ).catch((err) =>
          console.error('[userRouter] deactivateOnExternalPlatform (primary rpn opt-out):', err)
        )
      }
      res.status(200).json({ message: 'Désinscrit du RPN.', rpnStatus: 'unsubscribed' })
      return
    }

    if (action === 'resubscribe' && rpnStatus === 'unsubscribed') {
      if (!rpnExternalReference) {
        res.status(400).json({ message: 'Aucune référence externe trouvée pour ce compte.' })
        return
      }
      user.subscription.rpnStatus = 'enrolled'
      await user.save()
      reactivateOnExternalPlatform(
        rpnExternalReference,
        'Réinscription RPN volontaire — le membre principal réintègre sa propre couverture au fonds décès'
      ).catch((err) =>
        console.error('[userRouter] reactivateOnExternalPlatform (primary rpn re-enroll):', err)
      )
      res.status(200).json({ message: 'Réinscrit au RPN.', rpnStatus: 'enrolled' })
      return
    }

    res.status(400).json({ message: 'Action invalide ou statut incompatible.' })
  })
)

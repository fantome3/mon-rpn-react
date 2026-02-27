import { useContext, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { Store } from '@/lib/Store'
import { buildBillingPaymentUrl } from '@/lib/billing'
import { checkPostalCode, checkTel, toastAxiosError } from '@/lib/utils'
import { createAwaitingInteracAccount } from '@/lib/interacAccount'
import { toast } from '@/components/ui/use-toast'
import { useNewAccountMutation } from '@/hooks/accountHooks'
import { useNewTransactionMutation } from '@/hooks/transactionHooks'
import {
  useNewUserNotificationMutation,
  useRegisterMutation,
  useSendPasswordMutation,
  useVerifyTokenMutation,
} from '@/hooks/userHooks'
import type { Account, Transaction, User } from '@/types'

type EmergencyContactInput = {
  name?: string
  phone?: string
}

const normalizeEmergencyContacts = (contacts?: EmergencyContactInput[]) => {
  const fallback = [
    { name: '', phone: '' },
    { name: '', phone: '' },
  ]

  if (!contacts?.length) return fallback

  return [0, 1].map((index) => ({
    name: contacts[index]?.name ?? '',
    phone: contacts[index]?.phone ?? '',
  }))
}

const normalizeFilledEmergencyContacts = (contacts: EmergencyContactInput[]) =>
  contacts
    .map((contact) => ({
      name: contact.name?.trim() ?? '',
      phone: contact.phone?.trim() ?? '',
    }))
    .filter((contact) => contact.name && contact.phone)

const getTempTokenFromStorage = () => {
  const rawValue = localStorage.getItem('tempToken')
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

export const urgenceFormSchema = z.object({
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
      }),
    )
    .length(2)
    .superRefine((contacts, ctx) => {
      contacts.forEach((contact, index) => {
        const hasName = Boolean(contact.name?.trim())
        const hasPhone = Boolean(contact.phone?.trim())

        if (hasName !== hasPhone) {
          const message =
            'Veuillez renseigner le nom et le numéro pour ce contact.'

          if (!hasName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, 'name'],
              message,
            })
          }

          if (!hasPhone) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, 'phone'],
              message,
            })
          }
        }
      })
    }),
})

export type UrgenceFormValues = z.infer<typeof urgenceFormSchema>

type UrgenceLogic = {
  form: UseFormReturn<UrgenceFormValues>
  isSubmitting: boolean
  showSuccessDialog: boolean
  setShowSuccessDialog: (open: boolean) => void
  handleSubmit: (values: UrgenceFormValues) => Promise<void>
  handlePreviousClick: () => void
  handleGoToDependents: () => void
  handleGoToPayment: () => void
}

export const useUrgenceLogic = (): UrgenceLogic => {
  const [showSuccessDialog, setShowSuccessDialogState] = useState(false)
  const { mutateAsync: registerUser, isPending: isRegisteringUser } =
    useRegisterMutation()
  const { mutateAsync: sendPasswordToUser } = useSendPasswordMutation()
  const { mutateAsync: verifyToken } = useVerifyTokenMutation()
  const { mutateAsync: createAccount } = useNewAccountMutation()
  const { mutateAsync: createTransaction } = useNewTransactionMutation()
  const { mutateAsync: notifyNewUser } = useNewUserNotificationMutation()
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const dependentsRedirect = redirectInUrl || '/dependents?onboarding=1'
  const paymentRedirect = buildBillingPaymentUrl('both')

  const form = useForm<UrgenceFormValues>({
    resolver: zodResolver(urgenceFormSchema),
    defaultValues: {
      emergencyContacts: normalizeEmergencyContacts(
        userInfo?.infos?.emergencyContacts,
      ),
    },
  })

  const urgenceResetSignatureRef = useRef('')

  useEffect(() => {
    if (userInfo?.infos) {
      const nextSignature = JSON.stringify(userInfo.infos.emergencyContacts ?? [])

      if (urgenceResetSignatureRef.current !== nextSignature) {
        form.reset({
          emergencyContacts: normalizeEmergencyContacts(
            userInfo.infos.emergencyContacts,
          ),
        })
        urgenceResetSignatureRef.current = nextSignature
      }
    }
  }, [userInfo, form])

  const handleSubmit = async (values: UrgenceFormValues) => {
    try {
      if (!userInfo?.register || !userInfo?.origines || !userInfo?.infos) {
        toast({
          variant: 'destructive',
          title: 'Inscription incomplète',
          description:
            'Certaines informations manquent. Veuillez reprendre les étapes précédentes.',
        })
        return
      }

      const tempToken = getTempTokenFromStorage()

      if (!tempToken) {
        toast({
          variant: 'destructive',
          title: 'Jeton introuvable',
          description:
            "Nous n'avons pas pu valider votre session d'inscription. Veuillez recommencer.",
        })
        return
      }

      const verifyTokenResponse = await verifyToken(tempToken)
      if (!verifyTokenResponse.valid) {
        toast({
          variant: 'destructive',
          title: 'Jeton invalide',
          description:
            "Votre session d'inscription a expiré. Veuillez recommencer.",
        })
        return
      }

      const cleanedEmergencyContacts = normalizeFilledEmergencyContacts(
        values.emergencyContacts,
      )

      const browserLanguage = navigator.language
      const userData: User = {
        register: userInfo.register,
        origines: userInfo.origines,
        infos: {
          ...userInfo.infos,
          tel: checkTel(userInfo.infos.tel ?? ''),
          postalCode: checkPostalCode(userInfo.infos.postalCode ?? ''),
          emergencyContacts: cleanedEmergencyContacts,
        },
        isAdmin: false,
        rememberMe: false,
        primaryMember: true,
        familyMembers: [],
        cpdLng: localStorage.getItem('i18nextLng') || browserLanguage,
        referredBy: localStorage.getItem('referralId') || undefined,
      }

      const registerData = await registerUser(userData)

      const accountData = (await createAwaitingInteracAccount({
        createAccount,
        createTransaction: async (payload) => {
          if (!payload.userId) {
            throw new Error('userId is required')
          }

          return createTransaction(payload as Transaction)
        },
        userInfo: registerData,
        transactionReason:
          'Compte créé en attente du premier paiement Interac (inscription)',
      })) as Account

      ctxDispatch({
        type: 'USER_SIGNUP',
        payload: registerData,
      })
      ctxDispatch({
        type: 'ACCOUNT_INFOS',
        payload: accountData,
      })

      localStorage.setItem('userInfo', JSON.stringify(registerData))
      localStorage.setItem('accountInfo', JSON.stringify(accountData))

      setShowSuccessDialogState(true)

      if (userInfo.register.email && userInfo.register.password) {
        await sendPasswordToUser({
          email: userInfo.register.email,
          password: userInfo.register.password,
        })
        await notifyNewUser(userInfo.register.email)
      }
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        toast({
          variant: 'destructive',
          title: "Changer l'adresse courriel",
          description: "L'adresse courriel que vous avez entré existe déjà.",
        })
      } else {
        toastAxiosError(error, 'Ooops!')
      }
    }
  }

  const handlePreviousClick = () => {
    if (!userInfo?.infos) {
      navigate('/infos')
      return
    }

    const currentValues = form.getValues()
    const cleanedEmergencyContacts = normalizeFilledEmergencyContacts(
      currentValues.emergencyContacts,
    )

    const nextInfos = {
      ...userInfo.infos,
      emergencyContacts: cleanedEmergencyContacts,
    }

    ctxDispatch({ type: 'USER_INFOS', payload: nextInfos })

    localStorage.setItem(
      'userInfo',
      JSON.stringify({
        ...userInfo,
        infos: nextInfos,
      }),
    )

    navigate('/infos')
  }

  const handleGoToDependents = () => {
    setShowSuccessDialogState(false)
    navigate(dependentsRedirect)
  }

  const handleGoToPayment = () => {
    setShowSuccessDialogState(false)
    navigate(paymentRedirect)
  }

  return {
    form,
    isSubmitting: isRegisteringUser,
    showSuccessDialog,
    setShowSuccessDialog: (open) => setShowSuccessDialogState(open),
    handleSubmit,
    handlePreviousClick,
    handleGoToDependents,
    handleGoToPayment,
  }
}

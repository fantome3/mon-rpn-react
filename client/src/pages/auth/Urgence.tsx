/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import CheckoutSteps from '@/components/CheckoutSteps'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useContext, useEffect, useRef, useState } from 'react'
import { Store } from '@/lib/Store'
import {
  useNewUserNotificationMutation,
  useRegisterMutation,
  useSendPasswordMutation,
  useVerifyTokenMutation,
} from '@/hooks/userHooks'
import { useNewAccountMutation } from '@/hooks/accountHooks'
import { useNewTransactionMutation } from '@/hooks/transactionHooks'
import { Transaction, Account } from '@/types'
import Loading from '@/components/Loading'
import { checkPostalCode, checkTel, toastAxiosError } from '@/lib/utils'
import { User } from '@/types'
import { createAwaitingInteracAccount } from '@/lib/interacAccount'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'

const normalizeEmergencyContacts = (
  contacts?: Array<{ name?: string; phone?: string }>
) => {
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

const formSchema = z.object({
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .length(2)
    .superRefine((contacts, ctx) => {
      contacts.forEach((contact, index) => {
        const hasName = Boolean(contact.name?.trim())
        const hasPhone = Boolean(contact.phone?.trim())
        if (hasName !== hasPhone) {
          const message = 'Veuillez renseigner le nom et le numéro pour ce contact.'
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

const Urgence = () => {
  const [showModal, setShowModal] = useState(false)
  const { mutateAsync: registerfunc, isPending } = useRegisterMutation()
  const { mutateAsync: sendPasswordToUser } = useSendPasswordMutation()
  const { mutateAsync: verifyToken } = useVerifyTokenMutation()
  const { mutateAsync: createAccount } = useNewAccountMutation()
  const { mutateAsync: createTransaction } = useNewTransactionMutation()
  const { mutateAsync: newUserNotification } = useNewUserNotificationMutation()
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const redirect = redirectInUrl ? redirectInUrl : '/payment-method'
  const { t } = useTranslation(['common'])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emergencyContacts: normalizeEmergencyContacts(
        userInfo?.infos?.emergencyContacts
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
            userInfo.infos.emergencyContacts
          ),
        })
        urgenceResetSignatureRef.current = nextSignature
      }
    }
  }, [userInfo, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const tempToken = JSON.parse(localStorage.getItem('tempToken') || '')
      if (!tempToken) {
        toastAxiosError({
          title: 'Token not found',
          description: 'Please try again later.',
        })
        return
      }

      const VerifyToken = await verifyToken(tempToken)
      if (!VerifyToken.valid) {
        toastAxiosError({
          title: 'Invalid Token',
          description: 'Please try again later.',
        })
        return
      }

      const cleanedEmergencyContacts = values.emergencyContacts
        .map((contact) => ({
          name: contact.name?.trim() ?? '',
          phone: contact.phone?.trim() ?? '',
        }))
        .filter((contact) => contact.name && contact.phone)

      const browserLanguage = navigator.language
      const userData: User = {
        register: userInfo?.register!,
        origines: userInfo?.origines!,
        infos: {
          ...userInfo?.infos!,
          tel: checkTel(userInfo?.infos?.tel ?? ''),
          postalCode: checkPostalCode(userInfo?.infos?.postalCode ?? ''),
          emergencyContacts: cleanedEmergencyContacts,
        },
        isAdmin: false,
        rememberMe: false,
        primaryMember: true,
        familyMembers: [],
        cpdLng: localStorage.getItem('i18nextLng')! || browserLanguage,
        referredBy: localStorage.getItem('referralId')!,
      }

      const registerData = await registerfunc(userData)

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

      setShowModal(true)

      await sendPasswordToUser({
        email: userInfo?.register?.email!,
        password: userInfo?.register?.password!,
      })
      await newUserNotification(userInfo?.register?.email!)
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        const title = "Changer l'adresse courriel"
        const description = "L'adresse courriel que vous avez entré existe déjà"
        toastAxiosError(description, title)
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
    const cleanedEmergencyContacts = currentValues.emergencyContacts
      .map((contact) => ({
        name: contact.name?.trim() ?? '',
        phone: contact.phone?.trim() ?? '',
      }))
      .filter((contact) => contact.name && contact.phone)

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
      })
    )

    navigate('/infos')
  }

  return (
    <>
      <SearchEngineOptimization title='Contacts d urgence' />
      <Header />
      <div className='auth form'>
        <Card className='auth-card'>
          <CardHeader className='text-center mb-5'>
            <CheckoutSteps step4 />
            <CardTitle className='font-bold text-2xl text-primary'>
              {t('enregistrement.emergencyContactsTitle')}
            </CardTitle>
            <CardDescription className='text-sm'>
              {t('enregistrement.emergencyContactsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                {[0, 1].map((index) => (
                  <div key={index} className='grid gap-4 md:grid-cols-1 rounded-md border p-4'>
                    <p className='font-semibold text-primary'>
                      {t('enregistrement.emergencyContactLabel', {index: index + 1,})}
                    </p>

                    <FormField
                      control={form.control}
                      name={`emergencyContacts.${index}.name` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            {t('enregistrement.emergencyContactNameLabel', {
                              index: index + 1,
                            })}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'enregistrement.emergencyContactNamePlaceholder'
                              )}
                              autoComplete='name'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`emergencyContacts.${index}.phone` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            {t('enregistrement.emergencyContactPhoneLabel', {
                              index: index + 1,
                            })}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'enregistrement.emergencyContactPhonePlaceholder'
                              )}
                              autoComplete='tel'
                              inputMode='tel'
                              type='tel'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                {isPending ? (
                  <Loading />
                ) : (
                  <div>
                    <Button className='mr-4' type='submit'>
                      {t('enregistrement.enregistrer')}
                    </Button>
                    <Button
                      onClick={handlePreviousClick}
                      className='bg-white text-primary border-2 hover:bg-slate-100 hover:text-primary/80 border-primary'
                      type='button'
                    >
                      {t('enregistrement.prev')}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Footer />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='font-bold text-xl p-4'>
              Inscription reussie
            </DialogTitle>
            <DialogDescription className='p-4 text-justify'>
              Un e-mail contenant votre mot de passe vous a été envoyé. Veuillez
              vérifier votre boîte de réception.
            </DialogDescription>
          </DialogHeader>
          <div className='p-4'>
            <Button
              onClick={() => {
                setShowModal(false)
                navigate(redirect)
              }}
            >
              Compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Urgence

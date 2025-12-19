/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import CheckoutSteps from '@/components/CheckoutSteps'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  countries,
  postalCodeRegex,
  canadianResidenceStatus,
  telRegex,
} from '@/lib/constant'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { useContext, useEffect, useState } from 'react'
import { Store } from '@/lib/Store'
import clsx from 'clsx'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  useNewUserNotificationMutation,
  useRegisterMutation,
  useSendPasswordMutation,
  useVerifyTokenMutation,
} from '@/hooks/userHooks'
import { useNewAccountMutation } from '@/hooks/accountHooks'
import { useNewTransactionMutation } from '@/hooks/transactionHooks'
import { Transaction } from '@/types/Transaction'
import { Account } from '@/types/Account'
import Loading from '@/components/Loading'
import { checkPostalCode, checkTel, toastAxiosError } from '@/lib/utils'
import { User } from '@/types/User'
import { createAwaitingInteracAccount } from '@/lib/interacAccount'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'

const formSchema = z.object({
  residenceCountry: z.string().min(4, { message: 'Champ Obligatoire' }),
  residenceCountryStatus: z.enum(
    ['student', 'worker', 'canadian_citizen', 'permanent_resident', 'visitor'],
    {
      required_error: 'Sélectionnez un status',
    }
  ),
  postalCode: z
    .string()
    .regex(postalCodeRegex, { message: 'Champ Obligatoire' }),
  address: z.string().min(3, { message: 'Champ Obligatoire' }),
  tel: z.string().regex(telRegex, { message: `Entrer numéro correct` }),
  hasInsurance: z.boolean(),
})

const Infos = () => {
  const [showModal, setShowModal] = useState(false)
  const { mutateAsync: registerfunc, isPending } = useRegisterMutation()
  const { mutateAsync: sendPasswordToUser } = useSendPasswordMutation()
  const { mutateAsync: verifyToken } = useVerifyTokenMutation()
  const { mutateAsync: createAccount } = useNewAccountMutation()
  const { mutateAsync: createTransaction } = useNewTransactionMutation()
  const { mutateAsync: newUserNotification } = useNewUserNotificationMutation()
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const { infos } = userInfo!
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const redirect = redirectInUrl ? redirectInUrl : '/payment-method'
  const { t } = useTranslation(['common'])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      residenceCountry: infos ? infos.residenceCountry : 'Canada',
      residenceCountryStatus: infos ? infos.residenceCountryStatus : 'worker',
      postalCode: infos ? infos.postalCode : '',
      address: infos ? infos.address : '',
      tel: infos ? infos.tel : '',
      hasInsurance: infos ? infos.hasInsurance : false,
    },
  })

  useEffect(() => {
    if (userInfo && userInfo.infos) {
      form.reset(userInfo.infos)
    }
  }, [userInfo, form])

  const browserLanguage = navigator.language

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

      const VerifyToken = await verifyToken(tempToken!)
      if (!VerifyToken.valid) {
        toastAxiosError({
          title: 'Invalid Token',
          description: 'Please try again later.',
        })
        return
      }

      const userData: User = {
        register: userInfo?.register!,
        origines: userInfo?.origines!,
        infos: {
          ...values,
          tel: checkTel(values.tel),
          postalCode: checkPostalCode(values.postalCode),
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
            throw new Error('userId is required');
          }

          return createTransaction(payload as Transaction);
        },

        userInfo: registerData,
        transactionReason: "Compte créé en attente du premier paiement Interac (inscription)",
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
        const title = "Changer l'adresse courriel";
        const description = "L'adresse courriel que vous avez entré existe déjà";
        toastAxiosError(description, title)
      } else {
        toastAxiosError(error, 'Ooops!')
      }
    }
  }

  const handlePreviousClick = () => {
    const currentValues = form.getValues()
    ctxDispatch({ type: 'USER_INFOS', payload: currentValues })
    localStorage.setItem(
      'userInfo',
      JSON.stringify({
        ...userInfo,
        infos: currentValues,
        infosTime: new Date(),
      })
    )
    navigate(-1)
  }

  return (
    <>
      <SearchEngineOptimization title="en savoir plus sur l'utilisateur" />
      <Header />
      <div className='auth form'>
        <Card className='auth-card '>
          <CardHeader className='text-center mb-5'>
            <CheckoutSteps step3 />
            <CardTitle className='font-bold text-4xl text-primary'>
              Vos informations
            </CardTitle>
            <CardDescription className=' text-sm'>
              {t('connexion.slogan')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-8'
              >
                <FormField
                  control={form.control}
                  name='tel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={clsx('text-sm')}>
                        {t('infoPerso.telephone')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('infoPerso.telephoneInput')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='address'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={clsx('text-sm')}>
                        {t('infoPerso.adresse')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('infoPerso.adresseInput')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='postalCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={clsx('text-sm')}>
                        {t('infoPerso.postalCode')}
                      </FormLabel>
                      <FormControl className='w-[50%]'>
                        <Input
                          placeholder={t('infoPerso.postalCodeInput')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='residenceCountry'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={clsx('text-sm')}>
                        {t('infoPerso.paysResidence')}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='w-[50%]'>
                            <SelectValue placeholder='Select residence country' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem
                              key={country.value}
                              value={country.value}
                            >
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/*  Statut du pays de résidence */}
                <FormField
                  control={form.control}
                  name='residenceCountryStatus'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm'>Statut de résidence</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='w-fit min-w-[200px] max-w-full'>
                            <SelectValue placeholder='Sélectionnez votre statut' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {canadianResidenceStatus.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='hasInsurance'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 py-4'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className='text-sm'>
                        {t('infoPerso.hasInsurance')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
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
                      type='reset'
                    >
                      Précédent
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Footer />

      {/* Modal de confirmation */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='font-bold text-xl p-4'>
              Inscription réussie
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
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Infos

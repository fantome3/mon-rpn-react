/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from './ui/card'
import Loading from './Loading'
import { ArrowRightLeft } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { Store } from '@/lib/Store'
import { useNewAccountMutation } from '@/hooks/accountHooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from './ui/use-toast'
import {
  refresh,
  ToLocaleStringFunc,
  toastAxiosError,
} from '@/lib/utils'
import { z } from 'zod'
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import CustomModal from './CustomModal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
import { useNewUserNotificationMutation } from '@/hooks/userHooks'
import { Interac } from '@/types/Account'
import { useNewTransactionMutation } from '@/hooks/transactionHooks'

const createSchema = (minAmount: number) =>
  createInteracFormSchema(minAmount)

type InteracPaymentProps = {
  total: number
}

const InteracPayment = ({ total }: InteracPaymentProps) => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const { mutateAsync: account, isPending } = useNewAccountMutation()
  const { mutateAsync: newUserNotification, isPending: notificationPending } =
    useNewUserNotificationMutation()
  const { mutateAsync: newTransaction } = useNewTransactionMutation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const redirect = redirectInUrl ? redirectInUrl : '/summary'

  const formSchema = createSchema(total)

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountInterac: total,
      refInterac: '',
    },
  })

  useEffect(() => {
    const ac = new AbortController()
    if (form.formState.isSubmitSuccessful) navigate(redirect)
    return () => ac.abort()
  }, [redirect, form.formState.isSubmitSuccessful, navigate])

  const payLaterHandler = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault()
    try {
      navigate(redirect)
      refresh()
      await newUserNotification(userInfo?.register?.email!)
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const existingInteracTransactions: Interac[] = []
      const newInteracTransaction = { ...values }
      const updatedInteracTransactions = [
        ...existingInteracTransactions,
        newInteracTransaction,
      ]
      const data = await account({
        firstName: userInfo?.origines.firstName!,
        lastName: userInfo?.origines.lastName!,
        userTel: userInfo?.infos.tel!,
        userResidenceCountry: userInfo?.infos.residenceCountry!,
        solde: values.amountInterac,
        paymentMethod: 'interac',
        userId: userInfo?._id!,
        interac: updatedInteracTransactions,
      })

      await newTransaction({
        userId: userInfo?._id,
        amount: values.amountInterac,
        type: 'credit',
        reason: 'Renfouement via Interac',
        status: 'pending',
      })

      ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data })
      localStorage.setItem('accountInfo', JSON.stringify(data))
      toast({
        variant: 'default',
        title: 'Moyen de paiement',
        description: `Félicitations vous avez terminé votre inscription.`,
      })
      navigate(redirect)
      refresh()
      await newUserNotification(userInfo?.register?.email!)
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.2 }}>
        <Card
          onClick={() => setModalVisibility(true)}
          className='w-[250px] cursor-pointer bg-sky-400 text-white'
        >
          <CardContent className='flex justify-center items-center aspect-square p-6'>
            {isPending ? <Loading /> : <ArrowRightLeft size={50} />}
          </CardContent>
          <CardFooter className='flex justify-center font-semibold'>
            Paiement via Interac
          </CardFooter>
        </Card>
      </motion.div>

      {modalVisibility ? (
        <CustomModal
          setOpen={() => {
            setModalVisibility(false)
          }}
          open={modalVisibility}
          title='Paiement Interac'
          description={
            <span className='block text-justify'>
              Faire le virement Interac à l'adresse courriel suivante{' '}
              <strong>paiement.rpn@gmail.com</strong> et utiliser le mot de
              passe suivant <strong>monrpn</strong> si demandé. Par la suite
              entrez les informations du virement que vous avez effectuer pour
              renflouer votre compte RPN. Le montant minimal est de {total}$.
            </span>
          }
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
                name='amountInterac'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant Envoyé</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder={total.toString()}
                        value={ToLocaleStringFunc(field.value)}
                        onChange={(event) => {
                          const rawValue = event.target.value.replace(/\s/g, '')
                          if (/^\d*$/.test(rawValue)) {
                            field.onChange(Number(rawValue))
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='refInterac'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>
                      Numéro de référence du transfert Interac
                      <HoverCard>
                        <HoverCardTrigger className='cursor-pointer italic text-xs hover:underline'>
                          (où le trouver)
                        </HoverCardTrigger>
                        <HoverCardContent className='font-light text-justify'>
                          Interac vous envoie automatiquement un courriel de
                          confirmation pour chaque virement réussi. Ce courriel
                          contient votre &nbsp;
                          <span className='text-destructive'>
                            numéro de référence Interac
                          </span>
                          , qui commence généralement par CA. <br />
                          Vous pouvez également trouver votre &nbsp;
                          <span className='text-destructive'>
                            numéro de référence Interac
                          </span>
                          &nbsp; sur votre confirmation de virement Interac ou
                          sur la description de la transaction selon votre
                          institution financière.
                        </HoverCardContent>
                      </HoverCard>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='CAcM8D7L' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-between'>
                <Button
                  disabled={isPending || notificationPending}
                  type='submit'
                >
                  Confirmer
                </Button>

                <Button
                  variant='outline'
                  className='text-destructive hover:bg-destructive hover:text-white border-destructive'
                  onClick={payLaterHandler}
                  disabled={notificationPending}
                >
                  Payer plus tard
                </Button>
              </div>
            </form>
          </Form>
        </CustomModal>
      ) : (
        ''
      )}
    </>
  )
}

export default InteracPayment

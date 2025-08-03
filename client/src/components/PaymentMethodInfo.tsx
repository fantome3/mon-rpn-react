import {
  useGetAccountsByUserIdQuery,
  useUpdateAccountMutation,
} from '@/hooks/accountHooks'
import { Card, CardContent, CardHeader } from './ui/card'
import { useContext, useEffect, useState } from 'react'
import { Store } from '@/lib/Store'
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
import { Link } from 'react-router-dom'
import { Input } from './ui/input'
import Loading from './Loading'
import { z } from 'zod'
import { expiryDateRegex } from '@/lib/constant'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  formatCreditCardNumber,
  isDateInFuture,
  toastAxiosError,
} from '@/lib/utils'
import { toast } from './ui/use-toast'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './ui/input-otp'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'

const interacFormSchema = z.object({
  amountInterac: z
    .number({
      required_error: 'Le montant ne peut-être inférieur à 25$',
      invalid_type_error: 'Le montant doit être un nombre.',
    })
    .gte(25),
  refInterac: z
    .string()
    .min(8, { message: 'Doit avoir au moins 8 charactères.' }),
})

const creditCardFormSchema = z.object({
  network: z.string(),
  cvv: z.string(),
  expiry_date: z.string().regex(expiryDateRegex, { message: 'Date invalide' }),
  card_holder_name: z.string().optional(),
  credit_card_number: z
    .string()
    .length(19, { message: 'Doit obligatoirement avoir 16 chiffres.' }),
})

const PaymentMethodInfo = () => {
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const { data: account, refetch } = useGetAccountsByUserIdQuery(
    userInfo?._id ?? ''
  )
  const { mutateAsync: updateAccount, isPending: updateLoading } =
    useUpdateAccountMutation()

  const [isDisabled] = useState(true)

  const [addEditModalVisibility, setAddEditModalVisibility] = useState(false)

  const lastAccountInterac =
    account && account.length > 0 && account[0].interac?.length
      ? account[0].interac[account[0].interac.length - 1].amountInterac
      : 0

  const lastTransactionRef =
    account && account.length > 0 && account[0].interac?.length
      ? account[0].interac[account[0].interac.length - 1].refInterac
      : ''

  const interacForm = useForm<z.infer<typeof interacFormSchema>>({
    mode: 'onChange',
    resolver: zodResolver(interacFormSchema),
    defaultValues: {
      amountInterac:
        account && account[0]?.interac ? account[0]?.interac.amountInterac : '',
      refInterac:
        account && account[0]?.interac ? account[0]?.interac.refInterac : '',
    },
  })

  const creditCardForm = useForm<z.infer<typeof creditCardFormSchema>>({
    mode: 'onChange',
    resolver: zodResolver(creditCardFormSchema),
    defaultValues: {
      network: account && account[0]?.card ? account[0]?.card.network : '',
      cvv: account && account[0]?.card ? account[0]?.card.cvv : '',
      expiry_date:
        account && account[0]?.card ? account[0]?.card.expiry_date : '',
      card_holder_name:
        account && account[0]?.card ? account[0]?.card.card_holder_name : '',
      credit_card_number:
        account && account[0]?.card ? account[0]?.card.credit_card_number : '',
    },
  })

  useEffect(() => {
    if (account && account.length && account[0]?.interac) {
      interacForm.reset({
        amountInterac: lastAccountInterac,
        refInterac: lastTransactionRef,
      })
    }
  }, [account, interacForm, lastAccountInterac, lastTransactionRef])

  useEffect(() => {
    if (account && account.length && account[0]?.card) {
      creditCardForm.reset({
        network: account[0]?.card.network,
        cvv: account[0]?.card.cvv,
        expiry_date: account[0]?.card.expiry_date,
        card_holder_name: account[0]?.card.card_holder_name,
        credit_card_number: account[0]?.card.credit_card_number,
      })
    }
  }, [account, creditCardForm])

  const interacOnSubmit = async (values: z.infer<typeof interacFormSchema>) => {
    try {
      const data = await updateAccount({
        ...account[0],
        _id: account[0]._id,
        interac: { ...values },
      })
      ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data.account })
      localStorage.setItem('accountInfo', JSON.stringify(data.account))
      toast({
        variant: 'default',
        title: 'Moyen de paiement',
        description: `N'oubliez pas de faire le transfert Interac.`,
      })
      refetch()
      setAddEditModalVisibility(false)
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const creditCardOnSubmit = async (
    values: z.infer<typeof creditCardFormSchema>
  ) => {
    try {
      if (isDateInFuture(values.expiry_date) === true) {
        const data = await updateAccount({
          ...account[0],
          _id: account[0]._id,
          card: {
            ...values,
          },
        })
        ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data.account })
        localStorage.setItem('accountInfo', JSON.stringify(data.account))
        toast({
          variant: 'default',
          title: 'Moyen de paiement',
          description: 'Votre carte de crédit ajoutée avec succès.',
        })
        refetch()
        setAddEditModalVisibility(false)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur carte de crédit',
          description: `Il semble que votre carte n'est pas valide.`,
        })
      }
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const { register } = interacForm

  if (!account || account.length === 0) {
    return <Loading />
  }

  return (
    <>
      <Card className='border-primary'>
        <CardHeader className='text-xl font-medium'>
          Méthode de paiement
        </CardHeader>
        <CardContent>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Paiement par</p>
              <p className='text-sm text-muted-foreground'>
                {account && account[0]?.paymentMethod === 'interac'
                  ? 'Interac'
                  : 'Carte de crédit'}
              </p>
            </div>
          </div>
          {account && account[0]?.paymentMethod === 'interac' ? (
            <>
              <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    Montant Envoyé
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    $ {lastAccountInterac}
                  </p>
                </div>
              </div>
              <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    Numéro de référence du transfert Interac
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {lastTransactionRef}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    N° de carte
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {account ? account[0]?.card?.credit_card_number : ''}
                  </p>
                </div>
              </div>
              <div className='flex gap-16'>
                <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium leading-none'>CVV</p>
                    <p className='text-sm text-muted-foreground'>
                      {account ? account[0]?.card?.cvv : ''}
                    </p>
                  </div>
                </div>
                <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium leading-none'>
                      Expire le
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {account
                        ? `${
                            account && account[0]?.card?.expiry_date.slice(0, 2)
                          } /
                      ${account && account[0]?.card?.expiry_date.slice(2, 4)}`
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className='flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-y-8'>
            <div className='space-y-1'>
              <Link
                className={`text-sm font-medium leading-none ${
                  isDisabled
                    ? 'pointer-events-none opacity-50 text-gray-400'
                    : 'text-primary hover:text-primary/80'
                }`}
                to={isDisabled ? '#' : '/change-method'}
              >
                Changer méthode de paiement
              </Link>
            </div>
            <div className='flex justify-end'>
              <Button
                onClick={() => {
                  setAddEditModalVisibility(true)
                }}
                variant='outline'
                className='border-primary text-primary hover:text-primary/80'
              >
                Modifier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {addEditModalVisibility ? (
        <CustomModal
          setOpen={() => {
            setAddEditModalVisibility(false)
          }}
          open={addEditModalVisibility}
          title='Modifications'
          description='Modifier vos données de paiement'
        >
          {account[0].paymentMethod === 'interac' ? (
            <>
              <Form {...interacForm}>
                <form
                  onSubmit={interacForm.handleSubmit(interacOnSubmit)}
                  className='space-y-8'
                >
                  <FormField
                    control={interacForm.control}
                    name='amountInterac'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant Envoyé</FormLabel>
                        <FormControl>
                          <Input
                            disabled
                            type='number'
                            placeholder='25'
                            {...field}
                            {...register('amountInterac', {
                              valueAsNumber: true,
                            })}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={interacForm.control}
                    name='refInterac'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm'>
                          Numéro de référence du transfert Interac
                          <HoverCard>
                            <HoverCardTrigger className='cursor-pointer'>
                              (i)
                            </HoverCardTrigger>
                            <HoverCardContent className='font-light text-justify'>
                              Interac vous envoie automatiquement un courriel de
                              confirmation pour chaque virement réussi. Ce
                              courriel contient votre &nbsp;
                              <span className='text-destructive'>
                                numéro de référence Interac
                              </span>
                              , qui commence généralement par CA. <br />
                              Vous pouvez également trouver votre &nbsp;
                              <span className='text-destructive'>
                                numéro de référence Interac
                              </span>
                              &nbsp; sur votre confirmation de virement Interac
                              ou sur la description de la transaction selon
                              votre institution financière.
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

                  {updateLoading ? (
                    <Loading />
                  ) : (
                    <Button type='submit'>Confirmer</Button>
                  )}
                </form>
              </Form>
            </>
          ) : (
            <>
              <Form {...creditCardForm}>
                <form
                  onSubmit={creditCardForm.handleSubmit(creditCardOnSubmit)}
                  className='space-y-8'
                >
                  <FormField
                    control={creditCardForm.control}
                    name='network'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network</FormLabel>
                        <FormControl>
                          <Input placeholder='Network' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={creditCardForm.control}
                    name='card_holder_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom </FormLabel>
                        <FormControl>
                          <Input placeholder='Nom' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={creditCardForm.control}
                    name='credit_card_number'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro</FormLabel>
                        <div>
                          <FormControl>
                            <Input
                              placeholder='Credit card number'
                              {...field}
                              onChange={(e) => {
                                const formattedValue = formatCreditCardNumber(
                                  e.target.value
                                )
                                field.onChange(formattedValue)
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={creditCardForm.control}
                    name='cvv'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={3} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={creditCardForm.control}
                    name='expiry_date'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'expiration</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={4} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {updateLoading ? (
                    <Loading />
                  ) : (
                    <Button type='submit'>Valider</Button>
                  )}
                </form>
              </Form>
            </>
          )}
        </CustomModal>
      ) : (
        ''
      )}
    </>
  )
}

export default PaymentMethodInfo

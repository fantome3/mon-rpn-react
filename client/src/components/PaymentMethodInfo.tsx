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
import { formatCreditCardNumber, isDateInFuture } from '@/lib/utils'
import { toast } from './ui/use-toast'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './ui/input-otp'
import { PasswordInput } from './PasswordInput'

const interacFormSchema = z.object({
  emailInterac: z.string().email({ message: `Email invalid` }),
  passwordInterac: z.string(),
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
  const { data: account, refetch } = useGetAccountsByUserIdQuery(userInfo?._id!)
  const { mutateAsync: updateAccount, isPending: updateLoading } =
    useUpdateAccountMutation()

  const [addEditModalVisibility, setAddEditModalVisibility] = useState(false)

  const interacForm = useForm<z.infer<typeof interacFormSchema>>({
    mode: 'onChange',
    resolver: zodResolver(interacFormSchema),
    defaultValues: {
      emailInterac:
        account && account[0]?.interac ? account[0]?.interac.emailInterac : '',
      passwordInterac:
        account && account[0]?.interac
          ? account[0]?.interac.passwordInterac
          : '',
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
    if (account && account[0]?.interac) {
      interacForm.reset({
        emailInterac: account[0]?.interac.emailInterac,
        passwordInterac: account[0]?.interac.passwordInterac,
      })
    }
  }, [account && account[0]?.interac])

  useEffect(() => {
    if (account && account[0]?.card) {
      creditCardForm.reset({
        network: account[0]?.card.network,
        cvv: account[0]?.card.cvv,
        expiry_date: account[0]?.card.expiry_date,
        card_holder_name: account[0]?.card.card_holder_name,
        credit_card_number: account[0]?.card.credit_card_number,
      })
    }
  }, [account && account[0]?.card])

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
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Quelque chose ne va pas.',
      })
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
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Quelque chose ne va pas.',
      })
    }
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
                    Email interact
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {account ? account[0]?.interac.emailInterac : ''}
                  </p>
                </div>
              </div>
              <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    Mot de passe interact
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {account ? account[0]?.interac.passwordInterac : ''}
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
                      {account && account[0]?.card.expiry_date.slice(0, 2)} /
                      {account && account[0]?.card.expiry_date.slice(2, 4)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className='flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-y-8'>
            <div className='space-y-1'>
              <Link
                className='text-sm text-primary hover:text-primary/80 font-medium leading-none'
                to='/change-method'
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
                    name='emailInterac'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Interac</FormLabel>
                        <FormControl>
                          <Input placeholder='Email Interac' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={interacForm.control}
                    name='passwordInterac'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm'>
                          Mot de passe Interac
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder='Mot de passe'
                            {...field}
                          />
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

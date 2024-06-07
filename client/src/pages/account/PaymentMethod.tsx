import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CreditCard, ArrowRightLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNewAccountMutation } from '@/hooks/accountHooks'
import { useContext, useEffect, useState } from 'react'
import { Store } from '@/lib/Store'
import { toast } from '@/components/ui/use-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import Loading from '@/components/Loading'
import CustomModal from '@/components/CustomModal'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { formatCreditCardNumber, isDateInFuture, refresh } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { expiryDateRegex } from '@/lib/constant'

const formSchema = z.object({
  network: z.string(),
  cvv: z.string(),
  expiry_date: z.string().regex(expiryDateRegex, { message: 'Date invalide' }),
  card_holder_name: z.string().optional(),
  credit_card_number: z
    .string()
    .length(19, { message: 'Doit obligatoirement avoir 16 chiffres.' }),
})

const PaymentMethod = () => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const { mutateAsync: account, isPending } = useNewAccountMutation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const redirect = redirectInUrl ? redirectInUrl : '/profil'

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      network: '',
      cvv: '',
      expiry_date: '',
      card_holder_name: '',
      credit_card_number: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isDateInFuture(values.expiry_date) === true) {
        const data = await account({
          firstName: `${userInfo?.origines.firstName!} ${userInfo?.origines
            .lastName!}`,
          userTel: userInfo?.infos.tel!,
          userResidenceCountry: userInfo?.infos.residenceCountry!,
          solde: 0,
          paymentMethod: 'credit_card',
          userId: userInfo?._id!,
          card: {
            ...values,
          },
        })
        ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data })
        localStorage.setItem('accountInfo', JSON.stringify(data))
        console.log(data)
        toast({
          variant: 'default',
          title: 'Moyen de paiement',
          description: 'Votre carte de crédit ajoutée avec succès.',
        })
        navigate(redirect)
        refresh()
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
  const monenyTransfert = async (paymentMethod: string) => {
    try {
      if (paymentMethod === 'money_transfert') {
        const data = await account({
          firstName: `${userInfo?.origines.firstName!} ${userInfo?.origines
            .lastName!}`,
          userTel: userInfo?.infos.tel!,
          userResidenceCountry: userInfo?.infos.residenceCountry!,
          solde: 0,
          paymentMethod: 'money_transfert',
          userId: userInfo?._id!,
        })
        console.log(data)
        ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data })
        localStorage.setItem('accountInfo', JSON.stringify(data))
        toast({
          variant: 'default',
          title: 'Moyen de paiement',
          description:
            'Noubliez pas de créditer votre compte. Votre compte est actuellement vide.',
        })
        navigate(redirect)
        refresh()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Quelque chose ne va pas.',
      })
    }
  }

  useEffect(() => {
    const ac = new AbortController()
    if (form.formState.isSubmitSuccessful) navigate(redirect)
    return () => ac.abort()
  }, [redirect, form.formState.isSubmitSuccessful, navigate])

  return (
    <>
      <div className='form flex-col sm:m-0 m-20'>
        <div className='flex md:flex-row flex-col gap-8 text-center'>
          <motion.div whileHover={{ scale: 1.2 }}>
            <Card className='w-[250px] cursor-pointer text-white bg-fuchsia-500'>
              <CardContent
                onClick={() => {
                  setModalVisibility(true)
                }}
                className='flex justify-center items-center aspect-square p-6'
              >
                <CreditCard size={50} />
              </CardContent>
              <CardFooter className='flex justify-center font-semibold'>
                Carte de crédit
              </CardFooter>
            </Card>
          </motion.div>
          <motion.div whileHover={{ scale: 1.2 }}>
            <Card
              onClick={() => monenyTransfert('money_transfert')}
              className='w-[250px] cursor-pointer bg-sky-400 text-white'
            >
              <CardContent className='flex justify-center items-center aspect-square p-6'>
                {isPending ? <Loading /> : <ArrowRightLeft size={50} />}
              </CardContent>
              <CardFooter className='flex justify-center font-semibold'>
                Transfert d'argent
              </CardFooter>
            </Card>
          </motion.div>
        </div>
        <div className='text-center mt-8'>
          <h1 className=' text-3xl font-bold'>Mode de paiement</h1>
          <p>Choisissez par quel moyen vous souhaitez payer votre cotisation</p>
        </div>
      </div>
      {modalVisibility ? (
        <CustomModal
          setOpen={() => {
            setModalVisibility(false)
          }}
          open={modalVisibility}
          title='Credit Card'
          description='Entrez les informations de votre carte'
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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

              {isPending ? <Loading /> : <Button type='submit'>Valider</Button>}
            </form>
          </Form>
        </CustomModal>
      ) : (
        ''
      )}
    </>
  )
}

export default PaymentMethod

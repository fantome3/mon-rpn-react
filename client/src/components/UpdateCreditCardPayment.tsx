import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from './ui/card'
import { CreditCard } from 'lucide-react'
import { z } from 'zod'
import { expiryDateRegex } from '@/lib/constant'
import { useContext, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  formatCreditCardNumber,
  isDateInFuture,
  refresh,
  toastAxiosError,
} from '@/lib/utils'
import {
  useGetAccountsByUserIdQuery,
  useUpdateAccountMutation,
} from '@/hooks/accountHooks'
import { Store } from '@/lib/Store'
import { toast } from './ui/use-toast'
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './ui/input-otp'
import Loading from './Loading'
import { Button } from './ui/button'

const formSchema = z.object({
  network: z.string(),
  cvv: z.string(),
  expiry_date: z.string().regex(expiryDateRegex, { message: 'Date invalide' }),
  card_holder_name: z.string().optional(),
  credit_card_number: z
    .string()
    .length(19, { message: 'Doit obligatoirement avoir 16 chiffres.' }),
})

const UpdateCreditCardPayment = () => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const { mutateAsync: updateAccount, isPending } = useUpdateAccountMutation()
  const { data: accountByUserId } = useGetAccountsByUserIdQuery(userInfo?._id)

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
        const existingCardTransactions = accountByUserId[0]?.card ?? []
        const newCardTransaction = { ...values }
        const updatedCardTransactions = [
          ...existingCardTransactions,
          newCardTransaction,
        ]

        const data = await updateAccount({
          firstName: accountByUserId[0]?.firstName ?? '',
          lastName: accountByUserId[0]?.lastName ?? '',
          userTel: accountByUserId[0]?.userTel ?? '',
          userResidenceCountry: accountByUserId[0]?.userResidenceCountry ?? '',
          solde: accountByUserId[0]?.solde ?? 0,
          paymentMethod: 'credit_card',
          userId: accountByUserId[0]?.userId ?? '',
          _id: accountByUserId[0]?._id ?? '',
          card: updatedCardTransactions,
        })
        ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data.account })
        localStorage.setItem('accountInfo', JSON.stringify(data.account))
        toast({
          variant: 'default',
          title: 'Moyen de paiement',
          description: 'Votre carte de crédit ajoutée avec succès.',
        })
        refresh()
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
  return (
    <>
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

export default UpdateCreditCardPayment

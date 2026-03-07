/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from './ui/card'
import Loading from './Loading'
import { ArrowRightLeft } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { Store } from '@/lib/Store'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from './ui/use-toast'
import { ToLocaleStringFunc, toastAxiosError } from '@/lib/utils'
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
import { useNewTransactionMutation } from '@/hooks/transactionHooks'
import { useQueryClient } from '@tanstack/react-query'

const createSchema = (minAmount: number) => createInteracFormSchema(minAmount)

type InteracPaymentProps = {
  total: number
  membershipAmount: number
  rpnAmount: number
}

const InteracPayment = ({
  total,
  membershipAmount,
  rpnAmount,
}: InteracPaymentProps) => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const { state } = useContext(Store)
  const { userInfo } = state
  const { mutateAsync: newTransaction, isPending } = useNewTransactionMutation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
    if (form.formState.isSubmitSuccessful) {
      navigate(redirect)
    }
  }, [redirect, form.formState.isSubmitSuccessful, navigate])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const extra = Math.max(0, values.amountInterac - total)
      const computedMembershipAmount = membershipAmount
      const computedRpnAmount = rpnAmount + extra

      await newTransaction({
        userId: userInfo?._id,
        amount: values.amountInterac,
        type: 'credit',
        fundType: 'both',
        membershipAmount: computedMembershipAmount,
        rpnAmount: computedRpnAmount,
        reason:
          'Premier paiement via Interac (membership + frais + contribution RPN)',
        refInterac: values.refInterac,
        status: 'pending',
      })

      await queryClient.invalidateQueries({
        queryKey: ['accountsByUserId', userInfo?._id],
      })
      await queryClient.invalidateQueries({
        queryKey: ['transactions', userInfo?._id],
      })

      toast({
        variant: 'default',
        title: 'Moyen de paiement',
        description: 'Paiement enregistre. Validation admin en attente.',
      })
      navigate(redirect)
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
              Faire le virement Interac a l'adresse courriel suivante{' '}
              <strong>acq.quebec@gmail.com</strong> et utiliser le mot de passe
              <strong> monrpn</strong> si demandé. Puis entrez ici les infos du
              virement pour soumettre votre paiement. Montant minimal: {total}$.
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
                    <FormLabel>Montant envoyé</FormLabel>
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
                        <HoverCardTrigger className='cursor-pointer italic text-xs hover:underline ml-1 animate-pulse'>
                          (où le trouver)
                        </HoverCardTrigger>
                        <HoverCardContent className='font-light text-justify'>
                          Interac envoie un courriel de confirmation pour chaque
                          virement. Ce courriel contient le numéro de référence
                          Interac (souvent CA ou C).
                        </HoverCardContent>
                      </HoverCard>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='CzM8L' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-between'>
                <Button disabled={isPending} type='submit'>
                  Confirmer
                </Button>

                <Button
                  variant='outline'
                  className='text-destructive hover:bg-destructive hover:text-white border-destructive'
                  onClick={() => navigate(redirect)}
                  type='button'
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


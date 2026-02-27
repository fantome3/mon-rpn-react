import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from './ui/card'
import Loading from './Loading'
import { ArrowRightLeft } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { Store } from '@/lib/Store'
import {
  useGetAccountsByUserIdQuery,
  useUpdateAccountMutation,
} from '@/hooks/accountHooks'
import { z } from 'zod'
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
import { ToLocaleStringFunc, toastAxiosError } from '@/lib/utils'
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import {
  buildTopUpReason,
  canPrimaryMemberTopUpRpn,
  computeTopUpAllocation,
  isRpnTopUpTarget,
  RPN_PAYMENT_BLOCK_MESSAGE,
  type TopUpTargetWithBoth,
} from '@/lib/billing'
import { useGetTransactionsByUserIdQuery } from '@/hooks/transactionHooks'
import { toast } from './ui/use-toast'

type UpdateInteracPaymentProps = {
  onSuccess: (amount: number) => void
  minAmount?: number
  topUpTarget?: TopUpTargetWithBoth
  membershipAmount?: number
  rpnAmount?: number
}

const UpdateInteracPayment = ({
  onSuccess,
  minAmount = 25,
  topUpTarget = 'rpn',
  membershipAmount = 0,
  rpnAmount = 0,
}: UpdateInteracPaymentProps) => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const { state, dispatch: ctxDispatch } = useContext(Store)

  const { userInfo } = state
  const { data: accountByUserId } = useGetAccountsByUserIdQuery(userInfo?._id ?? '')
  const { data: transactions = [] } = useGetTransactionsByUserIdQuery(
    userInfo?._id ?? ''
  )
  const { mutateAsync: updateAccount, isPending } = useUpdateAccountMutation()
  const { mutateAsync: newTransaction } = useNewTransactionMutation()
  const canPayRpn = useMemo(
    () =>
      canPrimaryMemberTopUpRpn({
        isPrimaryMember: userInfo?.primaryMember,
        transactions,
        subscription: userInfo?.subscription,
      }),
    [transactions, userInfo?.primaryMember, userInfo?.subscription]
  )

  const formSchema = createInteracFormSchema(minAmount)
  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountInterac: minAmount,
      refInterac: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isRpnTopUpTarget(topUpTarget) && !canPayRpn) {
      toast({
        variant: 'destructive',
        title: 'Paiement RPN bloque',
        description: RPN_PAYMENT_BLOCK_MESSAGE,
      })
      return
    }

    try {
      const currentMembership = accountByUserId?.[0]?.membership_balance ?? 0
      const currentRpn = accountByUserId?.[0]?.rpn_balance ?? 0
      const existingInteracTransactions = accountByUserId?.[0]?.interac ?? []
      const updatedInteracTransactions = [...existingInteracTransactions, { ...values }]
      const amountToAdd = values.amountInterac

      const allocation = computeTopUpAllocation({
        target: topUpTarget,
        amountInterac: amountToAdd,
        membershipDueAmount: membershipAmount,
        rpnDueAmount: rpnAmount,
      })

      const nextMembershipBalance = currentMembership + allocation.membershipAmount
      const nextRpnBalance = currentRpn + allocation.rpnAmount

      const newSolde = nextMembershipBalance + nextRpnBalance

      const data = await updateAccount({
        ...accountByUserId?.[0],
        solde: newSolde,
        membership_balance: nextMembershipBalance,
        rpn_balance: nextRpnBalance,
        interac: updatedInteracTransactions,
        isAwaitingFirstPayment: false,
      })

      await newTransaction({
        userId: userInfo?._id!,
        amount: values.amountInterac,
        type: 'credit',
        reason: buildTopUpReason(topUpTarget),
        refInterac: values.refInterac,
        status: 'pending',
      })

      ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data.account })
      localStorage.setItem('accountInfo', JSON.stringify(data.account))

      onSuccess(values.amountInterac)
      setModalVisibility(false)
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.2 }}>
        <Card
          onClick={() => {
            if (isRpnTopUpTarget(topUpTarget) && !canPayRpn) {
              toast({
                variant: 'destructive',
                title: 'Paiement RPN bloque',
                description: RPN_PAYMENT_BLOCK_MESSAGE,
              })
              return
            }
            setModalVisibility(true)
          }}
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
          setOpen={() => setModalVisibility(false)}
          open={modalVisibility}
          title='Faire un paiement Interac'
          description={
            <span className='block text-justify'>
              Faire le virement Interac a l'adresse courriel suivante{' '}
              <strong>acq.quebec@gmail.com</strong> et utiliser le mot de
              passe <strong>monrpn</strong> si demande. Ensuite, entrez ici les
              informations du virement effectue pour{' '}
              {topUpTarget === 'membership'
                ? 'renouveller votre membership.'
                : topUpTarget === 'rpn'
                ? 'alimenter votre fonds RPN.'
                : 'effectuer votre premier paiement (membership + RPN).'}
              Le montant minimal est de <strong>{minAmount}$</strong>.
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
                    <FormLabel>Montant envoye</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder={minAmount.toString()}
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
                      Numero de reference du transfert Interac
                      <HoverCard>
                        <HoverCardTrigger className='cursor-pointer italic text-xs hover:underline ml-1 animate-pulse'>
                          (ou le trouver)
                        </HoverCardTrigger>
                        <HoverCardContent className='font-light text-justify'>
                          Interac vous envoie un courriel de confirmation pour chaque virement.
                          Ce courriel contient votre <span className='text-destructive'>numero de reference Interac</span>,
                          qui commence generalement par CA ou C. Vous pouvez aussi le retrouver sur la confirmation de virement
                          ou dans la description de la transaction selon votre institution financiere.
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

              {isPending ? <Loading /> : <Button type='submit'>Valider</Button>}
            </form>
          </Form>
        </CustomModal>
      ) : null}
    </>
  )
}

export default UpdateInteracPayment

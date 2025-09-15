import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from './ui/card'
import Loading from './Loading'
import { ArrowRightLeft } from 'lucide-react'
import { useContext, useState } from 'react'
import { Store } from '@/lib/Store'
import {
  useGetAccountsByUserIdQuery,
  useUpdateAccountMutation,
} from '@/hooks/accountHooks'
import { toast } from './ui/use-toast'
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

// 👇 utilise le même générateur de schéma que InteracPayment pour un rendu/validation identiques
import { createInteracFormSchema } from '@/lib/createInteracFormSchema'
import { useNavigate } from 'react-router-dom'

type UpdateInteracPaymentProps = {
  onSuccess: (amount: number) => void
  minAmount?: number
}

const UpdateInteracPayment = ({ onSuccess, minAmount = 25 }: UpdateInteracPaymentProps) => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const { state, dispatch: ctxDispatch } = useContext(Store)
    const navigate = useNavigate()
  const { userInfo } = state
  const { data: accountByUserId } = useGetAccountsByUserIdQuery(userInfo?._id ?? '')
  const { mutateAsync: updateAccount, isPending } = useUpdateAccountMutation()
  const { mutateAsync: newTransaction } = useNewTransactionMutation()

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
    try {
      const existingInteracTransactions = accountByUserId?.[0]?.interac ?? []
      const updatedInteracTransactions = [...existingInteracTransactions, { ...values }]
      const newSolde = (accountByUserId?.[0]?.solde ?? 0) + values.amountInterac

      const data = await updateAccount({
        ...accountByUserId?.[0],
        solde: newSolde,
        interac: updatedInteracTransactions,
        isAwaitingFirstPayment: false,
      })

      await newTransaction({
        userId: userInfo?._id!,
        amount: values.amountInterac,
        type: 'credit',
        reason: 'Renflouement via Interac',
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
          onClick={() => setModalVisibility(true)}
          className="w-[250px] cursor-pointer bg-sky-400 text-white"
        >
          <CardContent className="flex justify-center items-center aspect-square p-6">
            {isPending ? <Loading /> : <ArrowRightLeft size={50} />}
          </CardContent>
          <CardFooter className="flex justify-center font-semibold">
            Paiement via Interac
          </CardFooter>
        </Card>
      </motion.div>

      {modalVisibility ? (
        <CustomModal
          setOpen={() => setModalVisibility(false)}
          open={modalVisibility}
          title="Faire un paiement Interac"
          description={
            <span className="block text-justify">
              Faire le virement Interac à l'adresse courriel suivante{' '}
              <strong>acq.quebec@gmail.com</strong> et utiliser le mot de
              passe <strong>monrpn</strong> si demandé. Ensuite, entrez ici les
              informations du virement effectué pour renflouer votre compte RPN.
              Le montant minimal est de <strong>{minAmount}$</strong>.
            </span>
          }
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="amountInterac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant envoyé</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
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
                name="refInterac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Numéro de référence du transfert Interac
                      <HoverCard>
                        <HoverCardTrigger className="cursor-pointer italic text-xs hover:underline ml-1 animate-pulse">
                          (où le trouver)
                        </HoverCardTrigger>
                        <HoverCardContent className="font-light text-justify">
                          Interac vous envoie un courriel de confirmation pour chaque virement.
                          Ce courriel contient votre <span className="text-destructive">numéro de référence Interac</span>,
                          qui commence généralement par CA. Vous pouvez aussi le retrouver sur la confirmation de virement
                          ou dans la description de la transaction selon votre institution financière.
                        </HoverCardContent>
                      </HoverCard>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="CAcM8D7L" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isPending ? <Loading /> : <Button type="submit">Valider</Button>}
            </form>
          </Form>
        </CustomModal>
      ) : null}
    </>
  )
}

export default UpdateInteracPayment

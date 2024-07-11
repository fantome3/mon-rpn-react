import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from './ui/card'
import Loading from './Loading'
import { ArrowRightLeft } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { Store } from '@/lib/Store'
import {
  useGetAccountsByUserIdQuery,
  useUpdateAccountMutation,
} from '@/hooks/accountHooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from './ui/use-toast'
import { refresh } from '@/lib/utils'
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

const formSchema = z.object({
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

const UpdateInteracPayment = () => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const { data: accountByUserId } = useGetAccountsByUserIdQuery(userInfo?._id!)
  const { mutateAsync: updateAccount, isPending } = useUpdateAccountMutation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const redirect = redirectInUrl ? redirectInUrl : '/profil'

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountInterac: 0,
      refInterac: '',
    },
  })

  useEffect(() => {
    const ac = new AbortController()
    if (form.formState.isSubmitSuccessful) navigate(redirect)
    return () => ac.abort()
  }, [redirect, form.formState.isSubmitSuccessful, navigate])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data = await updateAccount({
        firstName: accountByUserId[0]?.firstName!,
        userTel: accountByUserId[0]?.userTel!,
        userResidenceCountry: accountByUserId[0]?.userResidenceCountry!,
        solde: accountByUserId[0]?.solde!,
        paymentMethod: 'interac',
        userId: accountByUserId[0]?.userId!,
        _id: accountByUserId[0]?._id!,
        interac: { ...values },
      })
      ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data.account })
      localStorage.setItem('accountInfo', JSON.stringify(data.account))
      toast({
        variant: 'default',
        title: 'Moyen de paiement',
        description: `N'oubliez pas de faire le transfert Interac.`,
      })
      navigate(redirect)
      refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Quelque chose ne va pas.',
      })
    }
  }

  const { register } = form

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
          description={`Faire le virement Interac à l'adresse courriel suivante "paiement.rpn@gmail.com" et utiliser le mot de passe suivant "monrpn" si demandé.
Par la suite entrez les informations du virement que vous avez effectuer pour renflouer votre compte RPN.(le montant ne peut-être inférieur à 25$)`}
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
                        type='number'
                        placeholder='25'
                        {...field}
                        {...register('amountInterac', { valueAsNumber: true })}
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
                        <HoverCardTrigger className='cursor-pointer'>
                          (i)
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

export default UpdateInteracPayment

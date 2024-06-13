import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from './ui/card'
import Loading from './Loading'
import { ArrowRightLeft } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { Store } from '@/lib/Store'
import { useNewAccountMutation } from '@/hooks/accountHooks'
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
import { PasswordInput } from './PasswordInput'

const formSchema = z.object({
  emailInterac: z.string().email({ message: `Email invalid` }),
  passwordInterac: z.string(),
})

const InteracPayment = () => {
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
      emailInterac: '',
      passwordInterac: '',
    },
  })

  useEffect(() => {
    const ac = new AbortController()
    if (form.formState.isSubmitSuccessful) navigate(redirect)
    return () => ac.abort()
  }, [redirect, form.formState.isSubmitSuccessful, navigate])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values)
    try {
      const data = await account({
        firstName: `${userInfo?.origines.firstName!} ${userInfo?.origines
          .lastName!}`,
        userTel: userInfo?.infos.tel!,
        userResidenceCountry: userInfo?.infos.residenceCountry!,
        solde: 0,
        paymentMethod: 'interac',
        userId: userInfo?._id!,
        interac: { ...values },
      })
      ctxDispatch({ type: 'ACCOUNT_INFOS', payload: data })
      localStorage.setItem('accountInfo', JSON.stringify(data))
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
          title='Credit Card'
          description='Entrez les informations de votre carte'
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
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
                control={form.control}
                name='passwordInterac'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>
                      Mot de passe Interac
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='Mot de passe' {...field} />
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

export default InteracPayment

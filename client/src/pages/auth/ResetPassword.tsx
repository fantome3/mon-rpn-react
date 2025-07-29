import { PasswordInput } from '@/components/PasswordInput'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SearchEngineOptimization } from '@/components/SearchEngineOptimization'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useResetPasswordMutation } from '@/hooks/userHooks'
import { toast } from '@/components/ui/use-toast'
import { useContext, useState } from 'react'
import clsx from 'clsx'
import { Store } from '@/lib/Store'
import Loading from '@/components/Loading'

const formSchema = z.object({
  password: z.string().min(6, { message: `Au moins 6 mots` }),
  confirmPassword: z.string().min(6, { message: `Au moins 6 mots` }),
  userId: z.string(),
  token: z.string(),
})

const ResetPassword = () => {
  const { dispatch: ctxDispatch } = useContext(Store)
  const { mutateAsync: resetPassword, isPending } = useResetPasswordMutation()
  const [conditionsError, setConditionsError] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation(['common'])
  const params = useParams()
  const { id, token } = params

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      userId: id,
      token: token,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (values.password !== values.confirmPassword) {
        setConditionsError(true)
        toast({
          variant: 'destructive',
          title: 'Erreur Mot de passe!',
          description: 'Mots de passe différents',
        })
        return
      }
      await resetPassword(values)

      ctxDispatch({ type: 'USER_SIGNOUT' })
      localStorage.removeItem('userInfo')
      navigate('/login')
      toast({
        variant: 'default',
        title: 'Modification Mot de passe',
        description: 'Modification réussie',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur Mot de passe!',
        description: 'Mots de passe différents',
      })
    }
  }

  return (
    <>
      <SearchEngineOptimization title='Réinitialiser mot de passe' />
      <Header />
      <div className='auth'>
        <div className='flex items-center justify-center h-screen'>
          <Card className='auth-card'>
            <CardHeader className='text-center mb-5'>
              <CardTitle className='font-bold text-4xl text-primary'>
                Changer Mot de passe
              </CardTitle>
              <CardDescription className=' text-sm'>
                Modifier votre mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-8'
                >
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          {t('connexion.passwordLabel')}
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder={t('connexion.passwordInput')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='confirmPassword'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          {t('enregistrement.confirmPasswordLabel')}
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder={t('enregistrement.confirmPassword')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isPending ? (
                    <Loading />
                  ) : (
                    <Button type='submit'>Valider</Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default ResetPassword

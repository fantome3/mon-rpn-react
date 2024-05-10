import CheckoutSteps from '@/components/CheckoutSteps'
import { PasswordInput } from '@/components/PasswordInput'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Store } from '@/lib/Store'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { toast } from '@/components/ui/use-toast'

const formSchema = z.object({
  email: z.string().email({ message: `Email invalid` }),
  password: z.string().min(6, { message: `Au moins 6 mots` }),
  confirmPassword: z.string().min(6, { message: `Au moins 6 mots` }),
  conditions: z.boolean(),
})

const Register = () => {
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const [conditionsError, setConditionsError] = useState(false)
  const navigate = useNavigate()
  const params = useParams()
  const { t } = useTranslation(['common'])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: userInfo?.register.email || '',
      password: userInfo?.register.password || '',
      confirmPassword: userInfo?.register.confirmPassword || '',
      conditions: userInfo?.register.conditions || false,
    },
  })

  useEffect(() => {
    if (userInfo) {
      form.reset({
        email: userInfo?.register.email,
        password: userInfo?.register.password,
        confirmPassword: userInfo?.register.confirmPassword,
        conditions: userInfo?.register.conditions,
      })
    }
  }, [userInfo])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.password !== values.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Mots de passe incorrects!',
        description: 'Vos mots de passe sont différents.',
      })
      setConditionsError(true)
      return
    }
    if (values.conditions === false) {
      setConditionsError(true)
    } else {
      ctxDispatch({ type: 'USER_REGISTER', payload: values })
      localStorage.setItem(
        'userInfo',
        JSON.stringify({ ...userInfo, register: values })
      )
      if (params && Object.keys(params).length > 0) {
        localStorage.setItem('referralId', params.id!)
        localStorage.setItem('referralCode', params.ref!)
      }
      setConditionsError(false)
      navigate('/origines')
    }
  }

  return (
    <>
      <Header />
      <div className='auth'>
        <CheckoutSteps step1 />
        <div className='flex  items-center justify-center h-screen'>
          <Card className='auth-card'>
            <CardHeader className='text-center mb-5'>
              <CardTitle className='font-bold text-4xl text-primary'>
                {t('enregistrement.titre')}
              </CardTitle>
              <CardDescription className=' text-sm'>
                {t('connexion.slogan')}
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
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm'>
                          {t('connexion.emailLabel')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('connexion.emailInput')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                  <FormField
                    control={form.control}
                    name='conditions'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-start space-x-3 space-y-0 py-4'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive':
                              conditionsError === true && field.value === false,
                          })}
                        >
                          {t('enregistrement.conditions')}
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button type='submit'>{t('enregistrement.suivant')}</Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className='text-muted-forground flex flex-col gap-y-8 items-center text-sm'>
              <p>
                Déjà un compte?{' '}
                <span className='text-primary hover:text-primary/60'>
                  <Link to='/login'>Connectez-vous!</Link>
                </span>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Register

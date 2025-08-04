import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/PasswordInput'
import { Button } from '@/components/ui/button'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useLoginMutation } from '@/hooks/userHooks'
import { useContext, useEffect } from 'react'
import { Store } from '@/lib/Store'
import { toast } from '@/components/ui/use-toast'
import Loading from '@/components/Loading'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'

const Login = () => {
  const { mutateAsync: login, isPending } = useLoginMutation()
  const { t } = useTranslation(['common'])
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const redirect = redirectInUrl ? redirectInUrl : '/summary'
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state

  const formSchema = z.object({
    email: z.string().email({ message: `${t('connexion.emailError')}` }),
    password: z.string().min(6, { message: `${t('connexion.passwordError')}` }),
    rememberMe: z.boolean(),
    cpdLng: z.string(),
  })

  const Lng =
    navigator.language ||
    navigator.languages[0] ||
    localStorage.getItem('i18nextLng')!

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      cpdLng: Lng,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data = await login(values)
      ctxDispatch({ type: 'USER_LOGIN', payload: data })
      toast({
        variant: 'default',
        title: 'Connexion',
        description: 'Connexion réussie',
      })
      localStorage.setItem('userInfo', JSON.stringify(data))
      navigate(redirect)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Opps!',
        description: 'Email ou Mot de passe incorrect.',
      })
    }
  }

  useEffect(() => {
    const ac = new AbortController()
    if (userInfo) navigate(redirect)
    return () => ac.abort()
  }, [redirect, userInfo, navigate])

  return (
    <>
      <SearchEngineOptimization title='Connexion' />
      <Header />
      <div className='auth form'>
        <Card className='auth-card '>
          <CardHeader className='text-center mb-5'>
            <CardTitle className='font-bold text-3xl text-primary'>
              {t('connexion.titre')}
            </CardTitle>
            <CardDescription className='text-sm'>
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
                      <FormLabel className='text-sm'>
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
                  name='rememberMe'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 py-4'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className='text-sm'>
                        {t('connexion.rememberMe')}
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {isPending ? (
                  <Loading />
                ) : (
                  <Button className='w-full ' type='submit'>
                    {t('connexion.submit')}
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
          <CardFooter className='text-muted-forground flex flex-col gap-y-8 items-start text-sm'>
            <Link
              to='/forgot-password'
              className='text-primary hover:text-primary/80'
            >
              {t('connexion.oublier')}
            </Link>
            <Button
              onClick={() => navigate('/register')}
              variant='outline'
              className='w-full  text-primary border-primary hover:text-primary hover:bg-secondary'
            >
              {t('connexion.createAccount')}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </>
  )
}

export default Login

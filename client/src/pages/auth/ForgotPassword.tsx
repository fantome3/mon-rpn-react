import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SearchEngineOptimization } from '@/components/SearchEngineOptimization'
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
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Loading from '@/components/Loading'
import { useForgotPasswordMutation } from '@/hooks/userHooks'
import { toast } from '@/components/ui/use-toast'

const ForgotPassword = () => {
  const { mutateAsync: forgotPassword, isPending } = useForgotPasswordMutation()
  const { t } = useTranslation(['common'])
  const formSchema = z.object({
    email: z.string().email({ message: `${t('connexion.emailError')}` }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await forgotPassword(values)
      toast({
        variant: 'default',
        title: 'Changer Mot de passe',
        description: 'Consultez vos emails',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Opps!',
        description: 'Email ou Mot de passe incorrect.',
      })
    }
  }

  return (
    <>
      <SearchEngineOptimization title='Mot de passe oublié' />
      <Header />
      <div className='auth form'>
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
      <Footer />
    </>
  )
}

export default ForgotPassword

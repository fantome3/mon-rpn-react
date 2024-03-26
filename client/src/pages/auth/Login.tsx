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
import { useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'

const formSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z.string(),
  rememberUser: z.boolean(),
})

const Login = () => {
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberUser: false,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values)
  }

  return (
    <div className='auth'>
      <Card className='auth-card'>
        <CardHeader className='text-center mb-5'>
          <CardTitle className='font-bold text-4xl text-primary'>
            Se Connecter
          </CardTitle>
          <CardDescription className=' text-sm'>
            Ensemble nous sommes plus fort
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Adresse courriel</FormLabel>
                    <FormControl>
                      <Input placeholder='john@doe.com' {...field} />
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
                    <FormLabel className='text-sm'>Mot de passe</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='Mot de passe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='rememberUser'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 py-4'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className='text-sm'>
                      Memoriser le nom d'utilisateur
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button className='w-full ' type='submit'>
                Me Connecter
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='text-muted-forground flex flex-col gap-y-8 items-start text-sm'>
          <div className='text-primary cursor-pointer'>
            Mot de passe oublié?
          </div>
          <Button
            onClick={() => navigate('/register')}
            variant='outline'
            className='w-full  text-primary border-primary hover:text-primary hover:bg-secondary'
          >
            Créer un compte
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login

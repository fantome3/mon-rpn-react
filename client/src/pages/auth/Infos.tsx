import CheckoutSteps from '@/components/CheckoutSteps'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { countries, postalCodeRegex, telRegex } from '@/lib/constant'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { useContext, useEffect } from 'react'
import { Store } from '@/lib/Store'
import clsx from 'clsx'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useRegisterMutation } from '@/hooks/userHooks'
import Loading from '@/components/Loading'
import { checkPostalCode, checkTel } from '@/lib/utils'
import { User } from '@/types/User'
import { toast } from '@/components/ui/use-toast'

const formSchema = z.object({
  residenceCountry: z.string().min(4, { message: 'Champ Obligatoire' }),
  postalCode: z
    .string()
    .regex(postalCodeRegex, { message: 'Champ Obligatoire' }),
  address: z.string().min(3, { message: 'Champ Obligatoire' }),
  tel: z.string().regex(telRegex, { message: `Entrer numéro correct` }),
  hasInsurance: z.boolean(),
})

const Infos = () => {
  const { mutateAsync: registerfunc, isPending } = useRegisterMutation()
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const { infos } = userInfo!
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const redirect = redirectInUrl ? redirectInUrl : '/profil'
  const { t } = useTranslation(['common'])
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      residenceCountry: infos ? infos.residenceCountry : '',
      postalCode: infos ? infos.postalCode : '',
      address: infos ? infos.address : '',
      tel: infos ? infos.tel : '',
      hasInsurance: infos ? infos.hasInsurance : false,
    },
  })

  useEffect(() => {
    if (infos) {
      form.reset({
        residenceCountry: infos?.residenceCountry,
        postalCode: infos?.postalCode,
        address: infos?.address,
        tel: infos?.tel,
        hasInsurance: infos?.hasInsurance,
      })
    }
  }, [infos])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userData: User = {
        ...userInfo!,
        infos: {
          ...values,
          tel: checkTel(values.tel),
          postalCode: checkPostalCode(values.postalCode),
        },
        isAdmin: false,
        rememberMe: false,
        primaryMember: true,
        familyMembers: [],
        cpdLng: localStorage.getItem('i18nextLng')!,
        referredBy: localStorage.getItem('referralId')!,
      }
      const registerData = await registerfunc(userData)
      ctxDispatch({
        type: 'USER_SIGNUP',
        payload: registerData,
      })
      toast({
        variant: 'default',
        title: 'Inscription',
        description: 'Inscription réussie',
      })
      localStorage.setItem('userInfo', JSON.stringify(registerData))
      navigate(redirect)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <Header />
      <div className='auth'>
        <CheckoutSteps step3 />
        <div className='flex  items-center justify-center h-[100vh] '>
          <Card className='auth-card '>
            <CardHeader className='text-center mb-5'>
              <CardTitle className='font-bold text-4xl text-primary'>
                Vos informations
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
                    name='tel'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={clsx('text-sm')}>Tél</FormLabel>
                        <FormControl>
                          <Input placeholder='Votre numéro' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='address'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={clsx('text-sm')}>
                          Adresse
                        </FormLabel>
                        <FormControl>
                          <Input placeholder='Votre adresse' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='residenceCountry'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={clsx('text-sm')}>
                          Pays de résidence
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-[50%]'>
                              <SelectValue placeholder='Select residence country' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem
                                key={country.value}
                                value={country.value}
                              >
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='postalCode'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={clsx('text-sm')}>
                          Code postal
                        </FormLabel>
                        <FormControl className='w-[50%]'>
                          <Input placeholder='Votre code postal' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='hasInsurance'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-start space-x-3 space-y-0 py-4'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className='text-sm'>
                          Êtes-vous assurés?
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {isPending ? (
                    <Loading />
                  ) : (
                    <div>
                      <Button className='mr-4' type='submit'>
                        {t('enregistrement.suivant')}
                      </Button>
                      <Button
                        onClick={() => navigate(-1)}
                        className='bg-white text-primary border-2 hover:bg-slate-100 hover:text-primary/80 border-primary'
                        type='reset'
                      >
                        Annuler
                      </Button>
                    </div>
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

export default Infos

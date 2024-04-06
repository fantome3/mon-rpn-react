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
import { countries } from '@/lib/constant'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { useContext, useState } from 'react'
import { Store } from '@/lib/Store'
import clsx from 'clsx'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useRegisterMutation } from '@/hooks/userHooks'
import Loading from '@/components/Loading'

const formSchema = z.object({
  residenceCountry: z.string(),
  postalCode: z.string(),
  address: z.string(),
  tel: z.string(),
  hasInsurance: z.boolean(),
})

const Infos = () => {
  const { mutateAsync: registerfunc, isPending } = useRegisterMutation()
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state

  const [conditionsError, setConditionsError] = useState(false)
  const navigate = useNavigate()
  const { search } = useLocation()
  const redirectInUrl = new URLSearchParams(search).get('redirect')
  const redirect = redirectInUrl ? redirectInUrl : '/profil'
  const { t } = useTranslation(['common'])
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      residenceCountry: '',
      postalCode: '',
      address: '',
      tel: '',
      hasInsurance: false,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { postalCode, tel, address, residenceCountry } = values
    try {
      if (
        postalCode === '' ||
        tel === '' ||
        address === '' ||
        residenceCountry === ''
      ) {
        setConditionsError(true)
      } else {
        ctxDispatch({
          type: 'USER_INFOS',
          payload: values,
        })
        localStorage.setItem(
          'userInfo',
          JSON.stringify({ ...userInfo, infos: values })
        )
        registerfunc({
          ...userInfo!,
          infos: values,
          isAdmin: false,
          rememberMe: false,
        })
        navigate(redirect)
        setConditionsError(false)
      }
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
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          Tél
                        </FormLabel>
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
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
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
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          Pays de résidence
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          Code postal
                        </FormLabel>
                        <FormControl>
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
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          Êtes-vous assurés?
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {isPending ? (
                    <Loading />
                  ) : (
                    <Button className='w-full ' type='submit'>
                      {t('enregistrement.suivant')}
                    </Button>
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

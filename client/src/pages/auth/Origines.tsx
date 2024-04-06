import CheckoutSteps from '@/components/CheckoutSteps'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/CustomCalendar'
import { format } from 'date-fns'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
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
import { useContext, useState } from 'react'
import { Store } from '@/lib/Store'
import clsx from 'clsx'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  birthDate: z.date({
    required_error: 'A date of birth is required.',
  }),
  nativeCountry: z.string(),
  sex: z.string(),
})

const Origines = () => {
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const [conditionsError, setConditionsError] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation(['common'])
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: new Date('1990-01-01'),
      nativeCountry: '',
      sex: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { firstName, lastName, nativeCountry, sex } = values
    try {
      if (
        firstName === '' ||
        lastName === '' ||
        nativeCountry === '' ||
        sex === ''
      ) {
        setConditionsError(true)
      } else {
        ctxDispatch({ type: 'USER_ORIGINES', payload: values })
        localStorage.setItem(
          'userInfo',
          JSON.stringify({ ...userInfo, origines: values })
        )
        navigate('/infos')
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
        <CheckoutSteps step2 />
        <div className='flex  items-center justify-center h-[100vh] '>
          <Card className='auth-card '>
            <CardHeader className='text-center mb-5'>
              <CardTitle className='font-bold text-4xl text-primary'>
                Vos Origines
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
                    name='firstName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          {t('infoPerso.prenom')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('infoPerso.prenomInput')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='lastName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={clsx('text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          {t('infoPerso.nom')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('infoPerso.nomInput')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='birthDate'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel
                          className={clsx('mb-0.5 text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          {t('infoPerso.dateNaissance')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  ' pl-3 text-left text-sm',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              captionLayout='dropdown-buttons'
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date('1960-01-01')
                              }
                              initialFocus
                              fromYear={1960}
                              toYear={2030}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='sex'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={clsx('mb-0.5 text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          {t('infoPerso.sexe')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t('infoPerso.sexeInput')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='M'>
                              {t('infoPerso.homme')}
                            </SelectItem>
                            <SelectItem value='F'>
                              {t('infoPerso.femme')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='nativeCountry'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={clsx('mb-0.5 text-sm', {
                            'text-destructive': conditionsError === true,
                          })}
                        >
                          {t('infoPerso.paysOrigine')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select native country' />
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

                  <Button className='w-full ' type='submit'>
                    {t('enregistrement.suivant')}
                  </Button>
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

export default Origines

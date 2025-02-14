import CheckoutSteps from '@/components/CheckoutSteps'
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
import PasswordGenerator from '@/components/PasswordGenerator'
import { useGenerateTokenMutation } from '@/hooks/userHooks'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const formSchema = z.object({
  email: z.string().email({ message: `Email invalide` }),
  password: z.string().optional(),
  conditions: z.boolean(),
  occupation: z.enum(['student', 'worker'], {
    required_error: 'Sélectionnez un occupation',
  }),
  institution: z.string().optional(),
  otherInstitution: z.string().optional(),
  studentNumber: z.string().optional(),
  studentStatus: z.enum(['part-time', 'full-time']).optional(),
  workField: z.string().optional(),
})

const Register = () => {
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const [conditionsError, setConditionsError] = useState(false)
  const [isOtherInstitution, setIsOtherInstitution] = useState(false)
  const navigate = useNavigate()
  const params = useParams()
  const { t } = useTranslation(['common'])
  const { mutateAsync: generateToken } = useGenerateTokenMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: userInfo?.register.email || '',
      password: userInfo?.register.password || '',
      conditions: userInfo?.register.conditions || false,
      occupation: userInfo?.register.occupation || undefined,
      institution: userInfo?.register.institution || undefined,
      otherInstitution: userInfo?.register.otherInstitution || '',
      studentNumber: userInfo?.register.studentNumber || '',
      studentStatus: userInfo?.register.studentStatus || undefined,
      workField: userInfo?.register.workField || '',
    },
  })

  useEffect(() => {
    if (userInfo?.register) {
      form.reset(userInfo.register)
    }
  }, [userInfo, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.conditions) {
      setConditionsError(true)
    } else {
      const newPassword = PasswordGenerator()
      ctxDispatch({
        type: 'USER_REGISTER',
        payload: {
          ...values,
          password: newPassword,
        },
      })

      const GenerateToken = await generateToken(values.email)
      localStorage.setItem('tempToken', JSON.stringify(GenerateToken.token))

      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          ...userInfo,
          register: {
            ...values,
            password: PasswordGenerator(),
          },
          token: JSON.stringify(GenerateToken.token),
        })
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
      <div className='auth form'>
        <Card className='auth-card'>
          <CardHeader className='text-center mb-5'>
            <CheckoutSteps step1 />
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
                {/* Champ Email */}
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

                {/*<FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={clsx('text-sm')}>
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
                />*/}

                {/* Champ Occupation */}
                <FormField
                  control={form.control}
                  name='occupation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm'>Occupation</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder='Sélectionnez votre occupation' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='student'>Étudiant</SelectItem>
                            <SelectItem value='worker'>Travailleur</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Si Étudiant */}
                {form.watch('occupation') === 'student' && (
                  <>
                    {/* Sélection Établissement */}
                    <FormField
                      control={form.control}
                      name='institution'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            Établissement
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                setIsOtherInstitution(value === 'other')
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Sélectionnez votre établissement' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='Université Laval'>
                                  Université Laval
                                </SelectItem>
                                <SelectItem value='Université du Québec à Rimouski'>
                                  Université du Québec à Rimouski
                                </SelectItem>
                                <SelectItem value='other'>Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Input Autre établissement */}
                    {isOtherInstitution && (
                      <FormField
                        control={form.control}
                        name='otherInstitution'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-sm'>
                              Autre établissement
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Numéro étudiant */}
                    <FormField
                      control={form.control}
                      name='studentNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            Numéro étudiant (facultatif)
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Statut étudiant */}
                    <FormField
                      control={form.control}
                      name='studentStatus'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            Statut étudiant
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormItem className='flex items-center space-x-3 space-y-0'>
                                <FormControl>
                                  <RadioGroupItem value='part-time' />
                                </FormControl>
                                <FormLabel className='font-normal'>
                                  Temps Partiel
                                </FormLabel>
                              </FormItem>
                              <FormItem className='flex items-center space-x-3 space-y-0'>
                                <FormControl>
                                  <RadioGroupItem value='full-time' />
                                </FormControl>
                                <FormLabel className='font-normal'>
                                  Temps Plein
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Si travailleur */}

                {form.watch('occupation') === 'worker' && (
                  <>
                    <FormField
                      control={form.control}
                      name='workField'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            Domaine d'activité
                          </FormLabel>
                          <FormControl>
                            <Input placeholder='Charpentier' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

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
                        className={clsx('text-xs text-justify', {
                          'text-destructive':
                            conditionsError === true && field.value === false,
                        })}
                      >
                        {t('enregistrement.conditions')}&nbsp;
                        <span className='font-bold'>
                          <Link to='/conditions'>
                            {t('enregistrement.status')}
                          </Link>
                        </span>
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

      <Footer />
    </>
  )
}

export default Register

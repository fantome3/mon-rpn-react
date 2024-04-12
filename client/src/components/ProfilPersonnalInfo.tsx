import { useContext, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Store } from '@/lib/Store'
import { cn, functionReverse, functionSponsorship } from '@/lib/utils'
import CustomModal from '@/components/CustomModal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import clsx from 'clsx'
import { t } from 'i18next'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from './CustomCalendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { countries } from '@/lib/constant'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUpdateUserMutation } from '@/hooks/userHooks'
import { toast } from './ui/use-toast'
import Loading from './Loading'

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  birthDate: z.date({
    required_error: 'A date of birth is required.',
  }),
  nativeCountry: z.string(),
  sex: z.string(),
})

const UserOriginInfo = () => {
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const {
    origines,
    infos,
    register: userRegister,
    rememberMe,
    isAdmin,
    _id,
    cpdLng,
  } = userInfo!

  const [addEditModalVisibility, setAddEditModalVisibility] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const { mutateAsync: editRegister, isPending } = useUpdateUserMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: origines ? origines.firstName : '',
      lastName: origines ? origines.lastName : '',
      birthDate: origines ? origines.birthDate : new Date('1990-01-01'),
      nativeCountry: origines ? origines.nativeCountry : '',
      sex: origines ? origines.sex : '',
    },
  })

  useEffect(() => {
    if (userInfo) {
      form.reset({
        firstName: origines.firstName,
        lastName: origines.lastName,
        birthDate: origines.birthDate,
        nativeCountry: origines.nativeCountry,
        sex: origines.sex,
      })
    }
  }, [userInfo])

  const { register } = form

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const updatedData = {
        _id: _id,
        origines: values,
        register: userRegister,
        infos: infos,
        rememberMe: rememberMe,
        isAdmin: isAdmin,
        cpdLng: cpdLng,
      }
      await editRegister(updatedData)
      setEditing(null)
      setAddEditModalVisibility(false)
      ctxDispatch({ type: 'USER_LOGIN', payload: updatedData })
      localStorage.setItem('userInfo', JSON.stringify(updatedData))
      toast({
        variant: 'default',
        title: 'Modification',
        description: 'Modification réussie',
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
    <div className='flex flex-col w-full gap-y-3'>
      <Card className='border-primary max-h-[60vh]'>
        <CardHeader className='text-xl font-medium'>Vos Origines</CardHeader>
        <CardContent>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Prénoms</p>
              <p className='text-sm text-muted-foreground'>
                {origines.firstName}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Nom</p>
              <p className='text-sm text-muted-foreground'>
                {origines.lastName}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Date de naissance
              </p>
              <p className='text-sm text-muted-foreground'>
                {functionReverse(
                  origines.birthDate.toString().substring(0, 10)
                )}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Genre</p>
              <p className='text-sm text-muted-foreground'>{origines.sex}</p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>Pays d'origine</p>
              <p className='text-sm text-muted-foreground'>
                {origines.nativeCountry}
              </p>
            </div>
          </div>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Langue de correspondance
              </p>
              <p className='text-sm text-muted-foreground'>
                {cpdLng === 'fr' ? 'Français' : 'English'}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end'>
          <Button
            onClick={() => {
              setAddEditModalVisibility(true)
            }}
            variant='outline'
            className='border-primary text-primary hover:text-primary/80'
          >
            Modifier
          </Button>
        </CardFooter>
      </Card>
      <Card className='border-primary min-h-[21.5vh]'>
        <CardHeader className='text-xl font-medium'>
          Code de Parrainage
        </CardHeader>
        <CardContent>
          <div className='mb-4 grid items-start pb-4 last:mb-0 last:pb-0'>
            <div className='space-y-1'>
              <p className='text-sm font-medium leading-none'>
                Code de parrainge
              </p>
              <p className='text-sm text-muted-foreground'>
                {functionSponsorship(userInfo?._id!)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {addEditModalVisibility ? (
        <CustomModal
          setOpen={() => {
            setAddEditModalVisibility(false)
            setEditing(null)
          }}
          open={addEditModalVisibility}
          title='Modifications'
          description='Modifier vos origines'
        >
          <Form {...form}>
            <form
              id='origines'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-8'
            >
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={clsx('text-sm')}>
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
                    <FormLabel className={clsx('text-sm')}>
                      {t('infoPerso.nom')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('infoPerso.nomInput')} {...field} />
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
                    <FormLabel className={clsx('mb-0.5 text-sm')}>
                      {t('infoPerso.dateNaissance')}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl
                          {...register('birthDate', { valueAsDate: true })}
                        >
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
                            date > new Date() || date < new Date('1960-01-01')
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
                    <FormLabel className={clsx('mb-0.5 text-sm')}>
                      {t('infoPerso.sexe')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('infoPerso.sexeInput')} />
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
                    <FormLabel className={clsx('mb-0.5 text-sm')}>
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
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isPending ? (
                <Loading />
              ) : (
                <Button className='w-full ' type='submit'>
                  Valider
                </Button>
              )}
            </form>
          </Form>
        </CustomModal>
      ) : (
        ''
      )}
    </div>
  )
}

export default UserOriginInfo

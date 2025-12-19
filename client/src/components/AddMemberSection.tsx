import { useContext, useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import CustomModal from './CustomModal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { relations, status, canadianResidenceStatus, telRegex, age_maximal_personne } from '@/lib/constant'
import { Store } from '@/lib/Store'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import { toast } from './ui/use-toast'
import Loading from './Loading'
import { cn, refresh, toastAxiosError } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import copy from 'copy-to-clipboard'
import clsx from 'clsx'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from './CustomCalendar'

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  relationship: z.string(),
  residenceCountryStatus: z.enum(
    ['student', 'worker', 'canadian_citizen', 'permanent_resident', 'visitor'],
    {
      required_error: 'Veuillez sélectionner le status au Canada.',
    }
  ),
  status: z.string(),
  birthDate: z.date({
    required_error: 'La date de naissance est exigée.',
  }),
  tel: z
    .string()
    .regex(telRegex, { message: `Entrer numéro correct` })
    .optional(),
})

const AddMemberSection = () => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const [referralModalVisibility, setReferralModalVisibility] = useState(false)

  const { state } = useContext(Store)
  const { userInfo } = state
  const { data: user } = useGetUserDetailsQuery(userInfo?._id ?? '')
  const navigate = useNavigate()
  const pathname = location.pathname

  const { mutateAsync: updateUser, isPending } = useUpdateUserMutation()
  const textRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      relationship: '',
      status: 'active',
      residenceCountryStatus: 'permanent_resident',
      birthDate: new Date('1990-01-01'),
      tel: '',
    },
  })

  useEffect(() => {
    form.reset({
      firstName: '',
      lastName: '',
      relationship: '',
      status: 'active',
      residenceCountryStatus: 'permanent_resident',
      birthDate: new Date('1990-01-01'),
      tel: '',
    })
  }, [form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateUser({
        ...user!,
        familyMembers: [...(user?.familyMembers ?? []), values],
        _id: user?._id,
      })
      if (pathname === '/dependents') {
        refresh()
      } else {
        navigate('/dependents')
      }
      toast({
        variant: 'default',
        title: 'Membre ajouté avec succès',
        description: 'Votre membre de famille a été ajouté avec succès.',
      })
      form.reset()
      setModalVisibility(false)
    } catch (error) {
      toastAxiosError(error)
    }
  }

  const copyToClipboard = () => {
    if (textRef.current) {
      const copyText = textRef.current.value
      const isCopy = copy(copyText)
      if (isCopy) {
        toast({
          variant: 'default',
          title: 'Copié',
          description: '',
        })
      }
    }
  }

  return (
    <>
      <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
        <div>
            <Button
            onClick={() => setReferralModalVisibility(true)}
            className='px-8 py-4'
            disabled={true}
            >
            Parrainer
            </Button>
        </div>
        <div>
          <Button
            onClick={() => setModalVisibility(true)}
            variant='outline'
            className=' text-primary border-primary'
          >
            Ajouter une personne
          </Button>
        </div>
      </div>
      {referralModalVisibility ? (
        <CustomModal
          setOpen={() => {
            setReferralModalVisibility(false)
          }}
          open={referralModalVisibility}
          title='Inviter un ami et gagner sans limite'
          description='Invitez vos amis à profiter de 30% de réduction sur leur premier cours, et gagnez 20% de notre commission sur chacun de leurs cours !'
        >
          <div className='flex flex-col  items-center space-y-2'>
            <Input
              readOnly
              ref={textRef}
              type='text'
              value={`http://localhost:5173/register/${user?._id}/${user?.referralCode}
              `}
            />
            <Button onClick={copyToClipboard} type='submit'>
              Copier
            </Button>
          </div>
        </CustomModal>
      ) : (
        ''
      )}
      {modalVisibility ? (
        <CustomModal
          setOpen={() => {
            setModalVisibility(false)
          }}
          open={modalVisibility}
          title='Ajouter Personne'
          description='Ajouter un membre de votre famille'
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Prénoms</FormLabel>
                    <FormControl>
                      <Input placeholder='Son prénom' {...field} />
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
                    <FormLabel className='text-sm'>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder='Son nom' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='relationship'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>Relation</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Votre lien familial' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relations.map((relation) => (
                          <SelectItem key={relation.name} value={relation.name}>
                            {relation.name}
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
                name='residenceCountryStatus'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>
                      Status au Canada
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      {...field}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Status au Canada' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {canadianResidenceStatus.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {status.map((stat) => (
                          <SelectItem key={stat.name} value={stat.name}>
                            {stat.name}
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
                name='birthDate'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel className={clsx('mb-0.5 text-sm')}>
                      Date de naissance
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[50%] pl-3 text-left text-sm',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
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
                          date > new Date() || date < new Date(new Date().getFullYear() - age_maximal_personne, 0, 1)
                          }
                          initialFocus
                          fromYear={new Date().getFullYear() - age_maximal_personne}
                          toYear={new Date().getFullYear()}
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={clsx('text-sm')}>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder='Numéro de téléphone' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isPending ? <Loading /> : <Button type='submit'>Valider</Button>}
            </form>
          </Form>
        </CustomModal>
      ) : (
        ''
      )}
    </>
  )
}

export default AddMemberSection

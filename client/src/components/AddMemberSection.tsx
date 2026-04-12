import { useContext, useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import CustomModal from './CustomModal'
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from './ui/switch'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'
import {
  relations,
  canadianResidenceStatus,
  telRegex,
  age_maximal_personne,
  academicInstitutionsList,
} from '@/lib/constant'
import { Store } from '@/lib/Store'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import { toast } from './ui/use-toast'
import Loading from './Loading'
import { cn, toastAxiosError } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import copy from 'copy-to-clipboard'
import clsx from 'clsx'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from './CustomCalendar'
import {
  FAMILY_MEMBER_STATUSES,
  OCCUPATIONS,
  RESIDENCE_COUNTRY_STATUSES,
  STUDENT_STATUSES,
  User,
} from '@/types'
import { useQueryClient } from '@tanstack/react-query'

const RELATION_CONJOINT = 'Conjoint(e)'
const RELATION_PERE = 'Père'
const RELATION_MERE = 'Mère'

const formSchema = z
  .object({
    firstName: z.string().min(1, 'Champ obligatoire'),
    lastName: z.string().min(1, 'Champ obligatoire'),
    relationship: z.string().min(1, 'Champ obligatoire'),
    residenceCountryStatus: z.enum(RESIDENCE_COUNTRY_STATUSES, {
      required_error: 'Veuillez selectionner le statut au Canada.',
    }),
    status: z.enum(FAMILY_MEMBER_STATUSES),
    birthDate: z.date({
      required_error: 'La date de naissance est exigée.',
    }),
    occupation: z.enum(OCCUPATIONS).optional(),
    studentStatus: z.enum(STUDENT_STATUSES).optional(),
    institution: z.string().optional(),
    studentNumber: z.string().optional(),
    livesInCanada: z.boolean().optional(),
    tel: z
      .string()
      .regex(telRegex, { message: 'Entrer numero correct' })
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.relationship === RELATION_CONJOINT) {
      if (!data.occupation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['occupation'],
          message: "Veuillez indiquer l'occupation du/de la conjoint(e).",
        })
      }
      if (data.occupation === 'student' && !data.studentStatus) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['studentStatus'],
          message: "Veuillez indiquer le type d'etudes.",
        })
      }
    }
    if (
      data.relationship === RELATION_PERE ||
      data.relationship === RELATION_MERE
    ) {
      if (data.livesInCanada === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['livesInCanada'],
          message: 'Veuillez indiquer si ce parent vit au Canada.',
        })
      }
    }
  })

type FormValues = z.infer<typeof formSchema>

const defaultValues: FormValues = {
  firstName: '',
  lastName: '',
  relationship: '',
  status: 'active',
  residenceCountryStatus: 'permanent_resident',
  birthDate: new Date(1990, 0, 1),
  tel: '',
  occupation: undefined,
  studentStatus: undefined,
  institution: undefined,
  studentNumber: undefined,
  livesInCanada: true,
}

const AddMemberSection = () => {
  const [modalVisibility, setModalVisibility] = useState(false)
  const [referralModalVisibility, setReferralModalVisibility] = useState(false)

  const { state, dispatch } = useContext(Store)
  const { userInfo } = state
  const { data: user } = useGetUserDetailsQuery(userInfo?._id ?? '')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = location.pathname

  const { mutateAsync: updateUser, isPending } = useUpdateUserMutation()
  const textRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormValues>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const relationship = form.watch('relationship')
  const occupation = form.watch('occupation')

  const isConjoint = relationship === RELATION_CONJOINT
  const isParent = relationship === RELATION_PERE || relationship === RELATION_MERE
  const showTel = isConjoint
  const showOccupation = isConjoint
  const showStudentFields = isConjoint && occupation === 'student'

  // Reinitialise les champs conditionnels quand la relation change
  useEffect(() => {
    form.setValue('occupation', undefined)
    form.setValue('studentStatus', undefined)
    form.setValue('institution', undefined)
    form.setValue('studentNumber', undefined)
    form.setValue('livesInCanada', true)
    form.setValue('tel', '')
    form.clearErrors()
  }, [relationship, form])

  // Reinitialise les champs étudiants quand l'occupation change
  useEffect(() => {
    if (occupation !== 'student') {
      form.setValue('studentStatus', undefined)
      form.setValue('institution', undefined)
      form.setValue('studentNumber', undefined)
    }
  }, [occupation, form])

  useEffect(() => {
    form.reset(defaultValues)
  }, [form])

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await updateUser({
        ...user!,
        familyMembers: [...(user?.familyMembers ?? []), values],
        _id: user?._id,
      })
      const nextUserInfo: User = {
        ...(userInfo as User),
        ...response.user,
      }

      dispatch({ type: 'USER_LOGIN', payload: nextUserInfo })
      localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
      await queryClient.invalidateQueries({
        queryKey: ['user', userInfo?._id ?? ''],
      })

      if (pathname !== '/dependents') navigate('/dependents')
      toast({
        variant: 'default',
        title: 'Membre ajouté avec succès',
        description: 'Votre membre de famille a été ajouté avec succès.',
      })
      form.reset(defaultValues)
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
        toast({ variant: 'default', title: 'Copié', description: '' })
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
            className='text-primary border-primary'
          >
            Ajouter une personne à charge
          </Button>
        </div>
      </div>

      {referralModalVisibility && (
        <CustomModal
          setOpen={() => setReferralModalVisibility(false)}
          open={referralModalVisibility}
          title='Inviter un ami et gagner sans limite'
          description='Invitez vos amis à profiter de 30% de réduction sur leur premier cours, et gagnez 20% de notre commission sur chacun de leurs cours !'
        >
          <div className='flex flex-col items-center space-y-2'>
            <Input
              readOnly
              ref={textRef}
              type='text'
              value={`http://localhost:5173/register/${user?._id}/${user?.referralCode}`}
            />
            <Button onClick={copyToClipboard} type='submit'>
              Copier
            </Button>
          </div>
        </CustomModal>
      )}

      {modalVisibility && (
        <CustomModal
          setOpen={() => setModalVisibility(false)}
          open={modalVisibility}
          title='Ajouter une personne à charge'
          description='Renseignez les informations du membre de votre famille.'
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>

              {/* ── Relation ── */}
              <FormField
                control={form.control}
                name='relationship'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Relation</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
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

              {/* ── Identité ── */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
              </div>

              {/* ── Date de naissance ── */}
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
                            variant='outline'
                            className={cn(
                              'w-full pl-3 text-left text-sm',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Choisir une date</span>
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
                            date <
                              new Date(
                                new Date().getFullYear() - age_maximal_personne,
                                0,
                                1,
                              )
                          }
                          initialFocus
                          fromYear={
                            new Date().getFullYear() - age_maximal_personne
                          }
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Statut au Canada ── */}
              <FormField
                control={form.control}
                name='residenceCountryStatus'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>
                      Statut immigration au Canada
                    </FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Statut au Canada' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {canadianResidenceStatus.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Vit au Canada (parents seulement) ── */}
              {isParent && (
                <FormField
                  control={form.control}
                  name='livesInCanada'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-base'>
                          réside maintenant au Canada ?
                        </FormLabel>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* ── Occupation (conjoint seulement) ── */}
              {showOccupation && (
                <FormField
                  control={form.control}
                  name='occupation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm'>Occupation</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type='single'
                          value={field.value ?? ''}
                          onValueChange={(val) =>
                            field.onChange(val || undefined)
                          }
                          className='justify-start gap-2'
                        >
                          <ToggleGroupItem
                            value='student'
                            className='flex-1 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                          >
                            Etudiant(e)
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value='worker'
                            className='flex-1 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                          >
                            Travailleur(se)
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* ── Type d'études (conjoint étudiant) ── */}
              {showStudentFields && (
                <>
                  <FormField
                    control={form.control}
                    name='studentStatus'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm'>
                          Type d'etudes
                        </FormLabel>
                        <FormControl>
                          <ToggleGroup
                            type='single'
                            value={field.value ?? ''}
                            onValueChange={(val) =>
                              field.onChange(val || undefined)
                            }
                            className='justify-start gap-2'
                          >
                            <ToggleGroupItem
                              value='full-time'
                              className='flex-1 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                            >
                              A temps plein
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value='part-time'
                              className='flex-1 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                            >
                              A temps partiel
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </FormControl>
                        <FormDescription className='text-xs text-amber-600'>
                          Temps partiel = cotisation travailleur (50 $)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='institution'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='mb-0.5 text-sm'>
                          Etablissement
                        </FormLabel>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Choisir un etablissement' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicInstitutionsList.map((inst) => (
                              <SelectItem key={inst.value} value={inst.value}>
                                {inst.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('institution') === 'other' && (
                    <FormField
                      control={form.control}
                      name='institution'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>
                            Autre etablissement
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nom de l'etablissement"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name='studentNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm'>
                          Numero étudiant{' '}
                          <span className='text-muted-foreground font-normal'>
                            (optionnel)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Ex. 111 234 567'
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* ── Téléphone (conjoint seulement) ── */}
              {showTel && (
                <FormField
                  control={form.control}
                  name='tel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={clsx('text-sm')}>
                        Téléphone{' '}
                        <span className='text-muted-foreground font-normal'>
                          (optionnel)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Numéro de téléphone'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* ── Inscrit au RPN ── */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>
                        Inscrit(e) au RPN
                      </FormLabel>
                      <FormDescription>
                        Desinscrit(e) = non inclus dans les cotisations.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'active'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'active' : 'inactive')
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isPending ? <Loading /> : <Button type='submit'>Valider</Button>}
            </form>
          </Form>
        </CustomModal>
      )}
    </>
  )
}

export default AddMemberSection

import AddMemberSection from '@/components/AddMemberSection'
import { DataTable } from '@/components/CustomTable'
import FirstPaymentOnboardingCard from '@/components/FirstPaymentOnboardingCard'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import { Store } from '@/lib/Store'
import {
  FamilyMember,
  FAMILY_MEMBER_STATUSES,
  OCCUPATIONS,
  RESIDENCE_COUNTRY_STATUSES,
  STUDENT_STATUSES,
} from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import clsx from 'clsx'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpDown, Pencil, Trash2, Tally1, CalendarIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import CustomModal from '@/components/CustomModal'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  relations,
  canadianResidenceStatus,
  telRegex,
  academicInstitutionsList,
} from '@/lib/constant'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn, toastAxiosError } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar } from '@/components/CustomCalendar'
import IconButtonWithTooltip from '@/components/IconButtonWithTooltip'
import { formatCanadianPhone } from '@/lib/phone.validation'

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

const toLocalNoon = (value: Date | string) => {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setHours(12, 0, 0, 0)
  return date
}

const Dependents = () => {
  const { state, dispatch } = useContext(Store)
  const { userInfo, accountInfo } = state
  const queryClient = useQueryClient()
  const {
    data: user,
    isPending,
    refetch,
  } = useGetUserDetailsQuery(userInfo?._id ?? '')
  const [editingItem, setEditingItem] = useState<FamilyMember | null>(null)
  const [modalVisibility, setModalVisibility] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [getIndex, setGetIndex] = useState(0)

  const { mutateAsync: updateUser, isPending: updateLoading } =
    useUpdateUserMutation()

  const pathname = location.pathname
  const [searchParams] = useSearchParams()
  const isOnboardingQueryActive = searchParams.get('onboarding') === '1'
  const activeDependentsCount = useMemo(
    () =>
      (user?.familyMembers ?? []).filter((member) => member?.status === 'active')
        .length,
    [user?.familyMembers],
  )
  const shouldShowFirstPaymentOnboarding =
    isOnboardingQueryActive || Boolean(accountInfo?.isAwaitingFirstPayment)

  const form = useForm<FormValues>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      relationship: '',
      residenceCountryStatus: 'permanent_resident',
      status: 'active',
      birthDate: new Date(1990, 0, 1),
      tel: '',
      occupation: undefined,
      studentStatus: undefined,
      institution: undefined,
      studentNumber: undefined,
      livesInCanada: undefined,
    },
  })

  const editResetSignatureRef = useRef('')
  const relationship = form.watch('relationship')
  const occupation = form.watch('occupation')

  const isConjoint = relationship === RELATION_CONJOINT
  const isParent =
    relationship === RELATION_PERE || relationship === RELATION_MERE
  const showTel = isConjoint
  const showOccupation = isConjoint
  const showStudentFields = isConjoint && occupation === 'student'

  useEffect(() => {
    if (editingItem) {
      const nextSignature = JSON.stringify(editingItem)
      if (editResetSignatureRef.current !== nextSignature) {
        form.reset({
          firstName: editingItem.firstName || '',
          lastName: editingItem.lastName || '',
          relationship: editingItem.relationship || '',
          status: editingItem.status || 'active',
          residenceCountryStatus:
            editingItem.residenceCountryStatus || 'permanent_resident',
          birthDate: toLocalNoon(editingItem.birthDate),
          tel: editingItem.tel ?? '',
          occupation: editingItem.occupation,
          studentStatus: editingItem.studentStatus,
          institution: editingItem.institution,
          studentNumber: editingItem.studentNumber ?? '',
          livesInCanada: editingItem.livesInCanada,
        })
        editResetSignatureRef.current = nextSignature
      }
    }
  }, [editingItem, form])

  const columns: ColumnDef<FamilyMember>[] = [
    {
      accessorKey: 'firstName',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Prénom
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
    },
    {
      accessorKey: 'lastName',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nom
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        )
      },
    },
    {
      accessorKey: 'relationship',
      header: 'Relation',
    },
    {
      accessorKey: 'residenceCountryStatus',
      header: 'Statut au Canada',
      cell: ({ row }) => {
        const status = row.original.residenceCountryStatus
        return (
          <Badge
            className={clsx({
              'badge-student': status === 'student',
              'badge-worker': status === 'worker',
              'badge-canadian-citizen': status === 'canadian_citizen',
              'badge-permanent-resident': status === 'permanent_resident',
              'badge-visitor': status === 'visitor',
              'font-normal': true,
            })}
          >
            {canadianResidenceStatus.find((option) => option.value === status)?.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'birthDate',
      header: 'Né(e) le',
      cell: ({ row }) => {
        const birthDate = row.original.birthDate
        return birthDate ? format(birthDate, 'dd/MM/yyyy') : ''
      },
    },
    {
      accessorKey: 'tel',
      header: 'Téléphone',
      cell: ({ row }) => formatCanadianPhone(row.original.tel),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const status = row.original.status
        if (status === 'active') {
          return <Badge className='font-normal'>Actif</Badge>
        }
        if (status === 'inactive') {
          return (
            <Badge className='font-normal' variant='outline'>
              Inactif
            </Badge>
          )
        }
        if (status === 'deleted') {
          return (
            <Badge className='font-normal' variant='destructive'>
              Supprimé
            </Badge>
          )
        }
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => (
        <div className='flex '>
          <IconButtonWithTooltip
            icon={<Pencil size={20} className='text-green-800 ' />}
            tooltip='Modifier'
            onClick={() => {
              setEditingItem(row.original)
              setModalVisibility(true)
              setGetIndex(row.index)
            }}
            disabled={row.original.status === 'deleted' ? true : false}
          />

          <div className='font-semibold text-[#b9bdbc] mx-4'>
            <Tally1 size={30} />
          </div>

          <IconButtonWithTooltip
            icon={<Trash2 size={20} className='text-red-600' />}
            tooltip='Supprimer'
            onClick={() => {
              setEditingItem(row.original)
              setDeleteModal(true)
              setGetIndex(row.index)
            }}
            disabled={row.original.status === 'deleted' ? true : false}
          />
        </div>
      ),
    },
  ]

  const deleteHandler = async () => {
    if (editingItem) {
      try {
        const deletedMember: FamilyMember = {
          ...editingItem,
          status: 'deleted',
        }
        const updatedFamilyMembers = [...(user?.familyMembers ?? [])]
        updatedFamilyMembers[getIndex] = deletedMember
        const response = await updateUser({
          ...user!,
          familyMembers: updatedFamilyMembers,
          _id: user?._id,
        })
        const nextUserInfo: typeof userInfo = {
          ...userInfo!,
          ...response.user,
        }
        dispatch({ type: 'USER_LOGIN', payload: nextUserInfo! })
        localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
        await queryClient.invalidateQueries({
          queryKey: ['user', userInfo?._id ?? ''],
        })
        toast({
          variant: 'default',
          title: 'Membre supprimé avec succès',
          description: 'Votre membre de famille a été supprimé avec succès.',
        })
        form.reset()
        setDeleteModal(false)
        refetch()
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Opps!',
          description: 'Il semble que quelque chose cloche.',
        })
      }
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingItem) {
        const updatedMember: FamilyMember = {
          ...editingItem,
          firstName: values.firstName,
          lastName: values.lastName,
          relationship: values.relationship,
          residenceCountryStatus: values.residenceCountryStatus,
          status: values.status,
          birthDate: values.birthDate,
          tel: values.tel,
          occupation: values.occupation,
          studentStatus: values.studentStatus,
          institution: values.institution,
          studentNumber: values.studentNumber,
          livesInCanada: values.livesInCanada,
        }
        const updatedFamilyMembers = [...(user?.familyMembers ?? [])]
        updatedFamilyMembers[getIndex] = updatedMember
        const response = await updateUser({
          ...user!,
          familyMembers: updatedFamilyMembers,
          _id: user?._id,
        })
        const nextUserInfo: typeof userInfo = {
          ...userInfo!,
          ...response.user,
        }
        dispatch({ type: 'USER_LOGIN', payload: nextUserInfo! })
        localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
        await queryClient.invalidateQueries({
          queryKey: ['user', userInfo?._id ?? ''],
        })
        toast({
          variant: 'default',
          title: 'Membre modifié avec succès',
          description: 'Votre membre de famille a été modifié avec succès.',
        })
        form.reset()
        setModalVisibility(false)
        refetch()
      }
    } catch (error) {
      toastAxiosError(error)
    }
  }

  return (
    <>
      <div className='container mb-10'>
        <h1 className='text-center pt-10 mb-2 text-3xl font-semibold'>
          Bienvenue {userInfo?.origines?.firstName}
        </h1>
        <p className='text-center text-xl font-light mb-10'>
          Ensemble, nous sommes plus forts.
        </p>

        {shouldShowFirstPaymentOnboarding ? (
          <FirstPaymentOnboardingCard
            activeDependentsCount={activeDependentsCount}
          />
        ) : null}

        <AddMemberSection />
        <div className='mt-10'>
          <div className='flex justify-between'>
            <Link
              className={clsx('lg:text-sm text-[.80rem]', {
                'text-primary font-semibold': pathname === '/profil',
              })}
              to='/profil'
            >
              Mon profile
            </Link>
            <Link
              className={clsx('lg:text-sm text-[.80rem]', {
                'text-primary font-semibold': pathname === '/dependents',
              })}
              to='/dependents'
            >
              Personnes à charge
            </Link>
            <Link
              className={clsx('lg:text-sm text-[.80rem]', {
                'text-primary font-semibold': pathname === '/sponsorship',
              })}
              to='/sponsorship'
            >
              Parrainage
            </Link>
          </div>
          <Separator className=' mt-3 mb-1 bg-primary' />
          <Card className='bg-[#e9f5eb] min-h-[70vh]'>
            <CardContent className='p-8'>
              <div className='flex items-center justify-between mb-8'>
                <h2 className='text-xl font-medium '>
                  Liste des personnes à charge
                </h2>
              </div>

              {isPending ? (
                <Loading />
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    data={user ? user?.familyMembers : []}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {deleteModal ? (
        <CustomModal
          setOpen={() => setDeleteModal(false)}
          open={deleteModal}
          title='Supprimer Membre'
          description='Voulez-vous vraiment supprimer ce membre?'
        >
          <Button
            variant='outline'
            onClick={() => setDeleteModal(false)}
            className='mx-6'
          >
            Annuler
          </Button>
          <Button disabled={updateLoading} onClick={() => deleteHandler()}>
            Ok
          </Button>
        </CustomModal>
      ) : (
        ''
      )}

      {modalVisibility && (
        <CustomModal
          setOpen={() => setModalVisibility(false)}
          open={modalVisibility}
          title='Modifier membre'
          description="Modifier les informations d'un membre de votre famille"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>

              {/* ── Relation ── */}
              <FormField
                control={form.control}
                name='relationship'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>Relation</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Votre relation' />
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
                            date > new Date() || date < new Date('1930-01-01')
                          }
                          initialFocus
                          fromYear={1930}
                          toYear={2030}
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
                          <SelectValue placeholder='Statut immigration au Canada' />
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
                          Vit au Canada ?
                        </FormLabel>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
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

              {isPending || updateLoading ? (
                <Loading />
              ) : (
                <Button type='submit'>Valider</Button>
              )}
            </form>
          </Form>
        </CustomModal>
      )}
    </>
  )
}

export default Dependents

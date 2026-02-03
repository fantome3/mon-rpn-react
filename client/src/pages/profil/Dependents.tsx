import AddMemberSection from '@/components/AddMemberSection'
import { DataTable } from '@/components/CustomTable'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import { Store } from '@/lib/Store'
import { FamilyMember } from '@/types/User'
import { ColumnDef } from '@tanstack/react-table'
import clsx from 'clsx'
import { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, Pencil, Trash2, Tally1, CalendarIcon } from 'lucide-react'
import CustomModal from '@/components/CustomModal'
import {
  Form,
  FormControl,
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
  status,
  canadianResidenceStatus,
  telRegex,
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

const toLocalNoon = (value: Date | string) => {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setHours(12, 0, 0, 0)
  return date
}

const Dependents = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
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

  const form = useForm<z.infer<typeof formSchema>>({
    mode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: editingItem ? editingItem.firstName : '',
      lastName: editingItem ? editingItem.lastName : '',
      relationship: editingItem ? editingItem.relationship : '',
      residenceCountryStatus: editingItem
        ? editingItem.residenceCountryStatus
        : 'worker',
      status: editingItem ? editingItem.status : '',
      birthDate: editingItem ? toLocalNoon(editingItem.birthDate) : new Date(1990, 0, 1),
      tel: editingItem ? editingItem.tel : '',
    },
  })

  const editResetSignatureRef = useRef('')

  useEffect(() => {
    if (editingItem) {
      const nextSignature = JSON.stringify(editingItem)
      if (editResetSignatureRef.current !== nextSignature) {
        form.reset({
          firstName: editingItem.firstName || '',
          lastName: editingItem.lastName || '',
          relationship: editingItem.relationship || '',
          status: editingItem.status || '',
          residenceCountryStatus: editingItem.residenceCountryStatus || 'worker',
          birthDate: toLocalNoon(editingItem.birthDate),
          tel: editingItem.tel,
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
        await updateUser({
          ...user!,
          familyMembers: updatedFamilyMembers,
          _id: user?._id,
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
        }
        const updatedFamilyMembers = [...(user?.familyMembers ?? [])]
        updatedFamilyMembers[getIndex] = updatedMember
        await updateUser({
          ...user!,
          familyMembers: updatedFamilyMembers,
          _id: user?._id,
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

      {modalVisibility ? (
        <CustomModal
          setOpen={() => {
            setModalVisibility(false)
          }}
          open={modalVisibility}
          title='Modifier membre'
          description={`Modifier les informations d'un membre de votre famille `}
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
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
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

              <FormField
                control={form.control}
                name='residenceCountryStatus'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='mb-0.5 text-sm'>
                      Status au Canada
                    </FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
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
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {status.map((status) => (
                          <SelectItem key={status.name} value={status.name}>
                            {status.name}
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

              {isPending || updateLoading ? (
                <Loading />
              ) : (
                <Button type='submit'>Valider</Button>
              )}
            </form>
          </Form>
        </CustomModal>
      ) : (
        ''
      )}
    </>
  )
}

export default Dependents

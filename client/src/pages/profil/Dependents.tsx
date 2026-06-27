import { DataTable } from '@/components/CustomTable'
import FirstPaymentOnboardingCard from '@/components/FirstPaymentOnboardingCard'
import Loading from '@/components/Loading'
import ProfilLayout from '@/components/ProfilLayout'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from '@/hooks/userHooks'
import { Store } from '@/lib/Store'
import { FamilyMember } from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import clsx from 'clsx'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpDown, Pencil, Trash2, Tally1 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import CustomModal from '@/components/CustomModal'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { canadianResidenceStatus } from '@/lib/constant'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { toastAxiosError } from '@/lib/utils'
import { format } from 'date-fns'
import IconButtonWithTooltip from '@/components/IconButtonWithTooltip'
import { formatCanadianPhone } from '@/lib/phone.validation'
import { UncoveredMembersAlert } from '@/components/UncoveredMembersAlert'
import { FamilyMemberFormFields } from '@/components/family/FamilyMemberFormFields'
import {
  familyMemberFormSchema,
  familyMemberFormDefaultValues,
  type FamilyMemberFormValues,
} from '@/lib/familyMemberFormSchema'

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

  const form = useForm<FamilyMemberFormValues>({
    mode: 'onChange',
    resolver: zodResolver(familyMemberFormSchema),
    defaultValues: {
      ...familyMemberFormDefaultValues,
      livesInCanada: undefined,
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
          sex: editingItem.sex ?? '',
        })
        editResetSignatureRef.current = nextSignature
      }
    }
  }, [editingItem, form])

  const columns: ColumnDef<FamilyMember>[] = [
    {
      accessorKey: 'firstName',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Prenom
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
    },
    {
      accessorKey: 'lastName',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nom
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
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
      header: 'Ne(e) le',
      cell: ({ row }) => {
        const birthDate = row.original.birthDate
        return birthDate ? format(birthDate, 'dd/MM/yyyy') : ''
      },
    },
    {
      accessorKey: 'tel',
      header: 'Telephone',
      cell: ({ row }) => formatCanadianPhone(row.original.tel),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => (
        <div className='flex'>
          <IconButtonWithTooltip
            icon={<Pencil size={20} className='text-green-800' />}
            tooltip='Modifier'
            onClick={() => {
              setEditingItem(row.original)
              setModalVisibility(true)
              setGetIndex(row.index)
            }}
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
          />
        </div>
      ),
    },
  ]

  const deleteHandler = async () => {
    if (editingItem) {
      try {
        const updatedFamilyMembers = (user?.familyMembers ?? []).filter(
          (_, i) => i !== getIndex,
        )
        const response = await updateUser({
          ...user!,
          familyMembers: updatedFamilyMembers,
          _id: user?._id,
        })
        const nextUserInfo: typeof userInfo = { ...userInfo!, ...response.user }
        dispatch({ type: 'USER_LOGIN', payload: nextUserInfo! })
        localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
        await queryClient.invalidateQueries({
          queryKey: ['user', userInfo?._id ?? ''],
        })
        toast({
          variant: 'default',
          title: 'Membre supprime avec succes',
          description: 'Votre membre de famille a ete supprime avec succes.',
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

  const onSubmit = async (values: FamilyMemberFormValues) => {
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
          sex: values.sex,
        }
        const updatedFamilyMembers = [...(user?.familyMembers ?? [])]
        updatedFamilyMembers[getIndex] = updatedMember
        const response = await updateUser({
          ...user!,
          familyMembers: updatedFamilyMembers,
          _id: user?._id,
        })
        const nextUserInfo: typeof userInfo = { ...userInfo!, ...response.user }
        dispatch({ type: 'USER_LOGIN', payload: nextUserInfo! })
        localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
        await queryClient.invalidateQueries({
          queryKey: ['user', userInfo?._id ?? ''],
        })
        toast({
          variant: 'default',
          title: 'Membre modifie avec succes',
          description: 'Votre membre de famille a ete modifie avec succes.',
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
      <ProfilLayout
        beforeAddMember={
          shouldShowFirstPaymentOnboarding ? (
            <FirstPaymentOnboardingCard activeDependentsCount={activeDependentsCount} />
          ) : undefined
        }
      >
        <UncoveredMembersAlert />
        <h2 className='text-base sm:text-xl font-medium mb-4'>
          Liste des personnes a charge
        </h2>
        {isPending ? (
          <Loading />
        ) : (
          <DataTable
            columns={columns}
            data={user ? user.familyMembers.filter((m) => m.status !== 'deleted') : []}
          />
        )}
      </ProfilLayout>

      {deleteModal && (
        <CustomModal
          setOpen={() => setDeleteModal(false)}
          open={deleteModal}
          title='Supprimer le membre'
          description={`Etes-vous sur(e) de vouloir supprimer ${editingItem?.firstName} ${editingItem?.lastName} ? Cette action est irreversible.`}
        >
          <Button
            variant='outline'
            onClick={() => setDeleteModal(false)}
            className='mx-6'
          >
            Annuler
          </Button>
          <Button
            variant='destructive'
            disabled={updateLoading}
            onClick={() => deleteHandler()}
          >
            Supprimer definitivement
          </Button>
        </CustomModal>
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
              <FamilyMemberFormFields control={form.control} />

              {/* Toggle statut — pertinent uniquement en edition */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>
                        Inclure dans le membership
                      </FormLabel>
                      <FormDescription>
                        Si desactive, ce membre ne sera pas couvert par votre membership
                        et ne sera pas inclus dans vos cotisations.
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
                <Button type='submit' className='w-full'>
                  Valider
                </Button>
              )}
            </form>
          </Form>
        </CustomModal>
      )}
    </>
  )
}

export default Dependents
